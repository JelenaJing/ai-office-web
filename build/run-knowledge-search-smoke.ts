import fs from 'fs'
import path from 'path'
import { runAcademicWritingWorkflow } from '../server/src/features/document/services/academicWritingService'
import { searchKnowledgeCitation, searchKnowledgeCitationChunks } from '../server/src/features/knowledge/services/knowledgeSearchService'
import { getOrCreateDefaultWorkspace, workspaceDir } from '../server/src/lib/workspaceStore'
import { installMockRemoteKnowledgeFetch } from './remoteKnowledgeMock'

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

async function main() {
  process.env.REMOTE_KNOWLEDGE_BASE_URL = 'http://mock-knowledge-search.local'
  process.env.REMOTE_KNOWLEDGE_API_TOKEN = 'knowledge-search-token'
  const userId = `knowledge-search-smoke-${Date.now()}`
  const workspace = getOrCreateDefaultWorkspace(userId)
  const filesRoot = path.join(workspaceDir(userId, workspace.id), 'files')
  const fileId = 'kb-workspace-source'
  const fileDir = path.join(filesRoot, fileId)
  fs.mkdirSync(fileDir, { recursive: true })
  const fileContent = [
    '# 政策研究资料',
    '',
    '人工智能治理政策要求建立来源可追溯、引用可审计、保存恢复不丢失的知识引用链路。',
    '',
    '在文稿编辑器中插入引用时，系统需要同时记录 sourceId、chunkId、trustLevel 和 blockId。',
  ].join('\n')
  fs.writeFileSync(path.join(fileDir, 'original'), fileContent, 'utf-8')
  fs.writeFileSync(
    path.join(filesRoot, 'files.json'),
    JSON.stringify({
      files: [
        {
          id: fileId,
          name: '政策研究资料.md',
          ext: 'md',
          mimeType: 'text/markdown',
          size: Buffer.byteLength(fileContent, 'utf-8'),
          uploadedAt: new Date().toISOString(),
        },
      ],
    }, null, 2),
    'utf-8',
  )

  const chunks = await searchKnowledgeCitationChunks({
    userId,
    query: '引用可审计 保存恢复 sourceId chunkId trustLevel',
    workspaceId: workspace.path,
    selectedSourceIds: [fileId],
    topK: 2,
  })

  assert(chunks.length >= 1, 'knowledge search should return at least one real chunk')
  assert(chunks[0].sourceId === fileId, 'knowledge search should resolve the workspace-backed source')
  assert(
    chunks.some((chunk) => chunk.excerpt.includes('引用可审计') || chunk.excerpt.includes('sourceId')),
    'knowledge search excerpt should come from the real file text',
  )
  assert(chunks.every((chunk) => chunk.provider === 'workspace'), 'workspace-backed search should still return workspace provider')

  const remoteSourceId = 'doc-knowledge-policy'
  const remoteChunkId = 'doc-knowledge-policy:chunk-2'
  const remoteMock = installMockRemoteKnowledgeFetch({
    baseUrl: process.env.REMOTE_KNOWLEDGE_BASE_URL!,
    departments: [{ id: 'kb-governance', name: '治理政策库' }],
    filesByDepartment: {
      'kb-governance': [
        {
          id: remoteSourceId,
          title: '知识引用治理办法.pdf',
          originalName: '知识引用治理办法.pdf',
        },
      ],
    },
    qaByDepartment: {
      'kb-governance': {
        ok: true,
        results: [
          {
            documentId: remoteSourceId,
            documentTitle: '知识引用治理办法',
            chunkId: remoteChunkId,
            text: '远端知识库要求统一 provider 字段，并与 workspace 结果一起排序、去重、截断。',
            score: 0.99,
            trustLevel: 'verified',
            sourceType: 'policy',
            metadata: { channel: 'remote' },
          },
          {
            documentId: remoteSourceId,
            documentTitle: '知识引用治理办法',
            chunkId: remoteChunkId,
            text: '重复 chunk 用于验证去重。',
            score: 0.4,
            trustLevel: 'verified',
            sourceType: 'policy',
          },
        ],
      },
    },
  })

  try {
    const merged = await searchKnowledgeCitation({
      userId,
      query: 'provider 排序 去重 截断 sourceId chunkId',
      workspaceId: workspace.path,
      selectedSourceIds: [fileId, remoteSourceId],
      topK: 3,
    })

    assert(merged.chunks.length >= 2, 'merged search should include remote and workspace chunks')
    assert(merged.chunks.some((chunk) => chunk.provider === 'remote'), 'merged search should include remote provider')
    assert(merged.chunks.some((chunk) => chunk.provider === 'workspace'), 'merged search should include workspace provider')
    const dedupeKeys = new Set(merged.chunks.map((chunk) => `${chunk.provider}:${chunk.sourceId}:${chunk.chunkId}`))
    assert(dedupeKeys.size === merged.chunks.length, 'merged search should dedupe duplicate chunks')
    for (let index = 1; index < merged.chunks.length; index += 1) {
      assert((merged.chunks[index - 1]!.score || 0) >= (merged.chunks[index]!.score || 0), 'merged search should sort by score desc')
    }
    assert(merged.chunks.length <= 3, 'merged search should respect topK')
  } finally {
    remoteMock.restore()
  }

  const result = await runAcademicWritingWorkflow({
    userId,
    workspacePath: workspace.path,
    topic: '知识库引用链路验收',
    paperType: 'research_report',
    researchGoal: '验证真实知识库检索结果可以写入文稿 Artifact。',
    language: 'zh-CN',
    style: 'formal',
    outline: ['摘要', '引用链路', '结论'],
    knowledgeRefs: [
      {
        kind: 'file',
        id: fileId,
        label: chunks[0].title,
        excerpt: chunks[0].excerpt,
        sourceType: chunks[0].sourceType,
        sourceId: chunks[0].sourceId,
        chunkId: chunks[0].chunkId,
        trustLevel: chunks[0].trustLevel,
        citationStatus: chunks[0].trustLevel === 'verified' ? 'verified' : 'partial',
      },
    ],
  })

  const artifact = result.result.documentArtifact
  assert(artifact.references[0].sourceId === fileId, 'artifact reference should keep sourceId')
  assert(Boolean(artifact.references[0].chunkId), 'artifact reference should keep chunkId')
  assert(Boolean(artifact.references[0].trustLevel), 'artifact reference should keep trustLevel')
  assert(artifact.citations.every((citation) => Boolean(citation.blockId)), 'citations should be block-bound')
  assert(artifact.sourceRefs.some((ref) => ref.id === fileId), 'sourceRefs should include the workspace source')

  const restored = JSON.parse(JSON.stringify(artifact)) as typeof artifact
  assert(restored.references[0].sourceId === fileId, 'save/restore should retain sourceId')
  assert(restored.references[0].chunkId === artifact.references[0].chunkId, 'save/restore should retain chunkId')

  console.log('knowledge search smoke passed')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
