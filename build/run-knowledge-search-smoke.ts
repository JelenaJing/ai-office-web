import fs from 'fs'
import path from 'path'
import { runAcademicWritingWorkflow } from '../server/src/features/document/services/academicWritingService'
import { searchKnowledgeCitationChunks } from '../server/src/features/knowledge/services/knowledgeSearchService'
import { getOrCreateDefaultWorkspace, workspaceDir } from '../server/src/lib/workspaceStore'

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

async function main() {
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
