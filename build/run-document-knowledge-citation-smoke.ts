import fs from 'fs'
import path from 'path'
import { runAcademicWritingWorkflow } from '../server/src/features/document/services/academicWritingService'
import { searchKnowledgeCitationChunks } from '../server/src/features/knowledge/services/knowledgeSearchService'
import { searchRemoteKnowledgeChunks } from '../server/src/features/knowledge/services/remoteKnowledgeSearchClient'
import { getOrCreateDefaultWorkspace, workspaceDir } from '../server/src/lib/workspaceStore'
import { installMockRemoteKnowledgeFetch } from './remoteKnowledgeMock'

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

async function main() {
  process.env.REMOTE_KNOWLEDGE_BASE_URL = 'http://mock-document-citation.local'
  process.env.REMOTE_KNOWLEDGE_API_TOKEN = 'document-citation-token'
  const userId = `knowledge-citation-smoke-${Date.now()}`
  const defaultWorkspace = getOrCreateDefaultWorkspace(userId)
  const filesRoot = path.join(workspaceDir(userId, defaultWorkspace.id), 'files')
  const fileId = 'workspace-policy-source'
  const fileDir = path.join(filesRoot, fileId)
  fs.mkdirSync(fileDir, { recursive: true })
  fs.writeFileSync(
    path.join(fileDir, 'original'),
    [
      '# 城市更新政策要点',
      '',
      '政策依据要求明确引用来源、适用范围和执行主体，并保留政策条款的来源编号。',
      '',
      '执行层面需要同步记录 sourceId、chunkId 和 trustLevel，便于审计与保存恢复。',
    ].join('\n'),
    'utf-8',
  )
  fs.writeFileSync(
    path.join(filesRoot, 'files.json'),
    JSON.stringify({
      files: [
        {
          id: fileId,
          name: '城市更新政策要点.md',
          ext: 'md',
          mimeType: 'text/markdown',
          size: fs.statSync(path.join(fileDir, 'original')).size,
          uploadedAt: new Date().toISOString(),
        },
      ],
    }, null, 2),
    'utf-8',
  )

  const chunks = await searchKnowledgeCitationChunks({
    userId,
    query: '政策依据 执行主体 sourceId chunkId trustLevel',
    workspaceId: defaultWorkspace.path,
    selectedSourceIds: [fileId],
    topK: 2,
  })
  assert(chunks.length >= 1, 'knowledge search should return a real citation chunk')
  assert(chunks[0].sourceId === fileId, 'knowledge chunk should expose workspace file sourceId')
  assert(Boolean(chunks[0].chunkId), 'knowledge chunk should expose chunkId')
  assert(Boolean(chunks[0].trustLevel), 'knowledge chunk should expose trustLevel')
  assert(
    chunks.some((chunk) => chunk.excerpt.includes('sourceId') || chunk.excerpt.includes('执行主体')),
    'knowledge chunk should come from the real workspace file',
  )

  const workspacePath = defaultWorkspace.path
  const result = await runAcademicWritingWorkflow({
    userId,
    workspacePath,
    topic: '城市更新中的政策依据引用',
    paperType: 'policy_research_report',
    researchGoal: '验证政策依据章节能绑定知识库来源并写入文稿 Artifact。',
    language: 'zh-CN',
    style: 'formal',
    outline: ['摘要', '问题背景', '政策依据', '政策建议'],
    knowledgeRefs: [
      {
        kind: 'file',
        id: chunks[0].sourceId,
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
  assert(/<span class="doc-citation"/.test(artifact.html), 'inline span.doc-citation should exist')
  assert(artifact.html.includes(`data-chunk-id="${chunks[0].chunkId}"`), 'inline citation should carry chunkId')
  assert(artifact.html.includes('data-trust-level="verified"'), 'inline citation should carry trustLevel')
  assert(artifact.citations.length >= 2, 'structured citations should be generated')
  assert(artifact.references.length >= 1, 'structured references should be generated')
  assert(artifact.knowledgeRefs.length === 1, 'knowledgeRefs should be generated')
  assert(artifact.sourceRefs.some((ref) => ref.id === fileId), 'sourceRefs should include knowledge source')
  assert(artifact.references[0].sourceId === fileId, 'reference should expose sourceId')
  assert(artifact.references[0].chunkId === chunks[0].chunkId, 'reference should expose chunkId')
  assert(artifact.references[0].trustLevel === 'verified', 'reference should expose trustLevel')
  assert(artifact.citations.every((citation) => Boolean(citation.blockId)), 'each citation should bind a blockId')

  const restored = JSON.parse(JSON.stringify({ editorState: { documentArtifact: artifact } }))
  assert(restored.editorState.documentArtifact.references[0].chunkId === chunks[0].chunkId, 'persisted editor state should retain chunkId')
  assert(restored.editorState.documentArtifact.html.includes('doc-citation'), 'persisted editor state should retain citation span')

  const remoteSourceId = 'doc-policy-remote-citation'
  const remoteChunkId = 'doc-policy-remote-citation:chunk-3'
  const remoteMock = installMockRemoteKnowledgeFetch({
    baseUrl: process.env.REMOTE_KNOWLEDGE_BASE_URL!,
    departments: [{ id: 'kb-remote-citation', name: '远端政策库' }],
    filesByDepartment: {
      'kb-remote-citation': [
        {
          id: remoteSourceId,
          title: '远端政策依据指引.pdf',
          originalName: '远端政策依据指引.pdf',
        },
      ],
    },
    qaByDepartment: {
      'kb-remote-citation': {
        ok: true,
        chunks: [
          {
            document_id: remoteSourceId,
            document_title: '远端政策依据指引',
            chunk_id: remoteChunkId,
            excerpt: '远端知识库插入引用时，必须把 provider/sourceId/chunkId/trustLevel 持久化到 citation / reference / knowledgeRefs / sourceRefs。',
            similarity: 0.96,
            trust_level: 'verified',
            source_type: 'policy',
            metadata: { scope: 'remote-citation' },
          },
        ],
      },
    },
  })

  try {
    const remoteSearch = await searchRemoteKnowledgeChunks({
      userId,
      workspaceId: workspacePath,
      query: '远端知识库 provider sourceId chunkId trustLevel',
      selectedSourceIds: [remoteSourceId],
      topK: 2,
    })
    assert(remoteSearch.chunks.length === 1, 'remote citation smoke should return one remote chunk')
    assert(remoteSearch.chunks[0]?.provider === 'remote', 'remote citation chunk should be marked remote')

    const remoteResult = await runAcademicWritingWorkflow({
      userId,
      workspacePath,
      topic: '远端知识库引用写入验证',
      paperType: 'policy_research_report',
      researchGoal: '验证远端 chunk 能写入 citations / references / knowledgeRefs / sourceRefs 并可保存恢复。',
      language: 'zh-CN',
      style: 'formal',
      outline: ['摘要', '远端政策依据', '结论'],
      knowledgeRefs: [
        {
          kind: 'knowledge_base',
          id: remoteSearch.chunks[0]!.sourceId,
          label: remoteSearch.chunks[0]!.title,
          excerpt: remoteSearch.chunks[0]!.excerpt,
          provider: remoteSearch.chunks[0]!.provider,
          sourceType: remoteSearch.chunks[0]!.sourceType,
          sourceId: remoteSearch.chunks[0]!.sourceId,
          chunkId: remoteSearch.chunks[0]!.chunkId,
          trustLevel: remoteSearch.chunks[0]!.trustLevel,
          metadata: remoteSearch.chunks[0]!.metadata,
          citationStatus: remoteSearch.chunks[0]!.trustLevel === 'verified' ? 'verified' : 'partial',
        },
      ],
    })

    const remoteArtifact = remoteResult.result.documentArtifact
    assert(remoteArtifact.html.includes('data-provider="remote"'), 'remote inline citation should carry provider')
    assert(remoteArtifact.html.includes(`data-source-id="${remoteSourceId}"`), 'remote inline citation should carry sourceId')
    assert(remoteArtifact.html.includes(`data-chunk-id="${remoteChunkId}"`), 'remote inline citation should carry chunkId')
    assert(remoteArtifact.references.some((ref) => ref.provider === 'remote' && ref.sourceId === remoteSourceId), 'references should retain remote provider/sourceId')
    assert(remoteArtifact.citations.some((citation) => citation.provider === 'remote' && citation.chunkId === remoteChunkId), 'citations should retain remote provider/chunkId')
    assert(remoteArtifact.knowledgeRefs.some((ref) => ref.provider === 'remote' && ref.chunkId === remoteChunkId), 'knowledgeRefs should retain remote provider/chunkId')
    assert(remoteArtifact.sourceRefs.some((ref) => ref.provider === 'remote' && ref.sourceId === remoteSourceId), 'sourceRefs should retain remote provider/sourceId')

    const remoteRestored = JSON.parse(JSON.stringify(remoteArtifact)) as typeof remoteArtifact
    assert(remoteRestored.references.some((ref) => ref.provider === 'remote'), 'save/restore should retain remote provider on references')
    assert(remoteRestored.knowledgeRefs.some((ref) => ref.chunkId === remoteChunkId), 'save/restore should retain remote chunkId on knowledgeRefs')
  } finally {
    remoteMock.restore()
  }

  console.log('document knowledge citation smoke passed')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
