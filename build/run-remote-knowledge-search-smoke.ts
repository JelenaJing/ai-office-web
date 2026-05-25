import fs from 'fs'
import path from 'path'
import { searchKnowledgeCitation } from '../server/src/features/knowledge/services/knowledgeSearchService'
import { searchRemoteKnowledgeChunks } from '../server/src/features/knowledge/services/remoteKnowledgeSearchClient'
import { getOrCreateDefaultWorkspace, parseClientPath, workspaceDir } from '../server/src/lib/workspaceStore'
import { installMockRemoteKnowledgeFetch } from './remoteKnowledgeMock'

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

function seedWorkspaceFile(userId: string, workspacePath: string) {
  const parsed = parseClientPath(workspacePath)
  if (!parsed) throw new Error(`invalid workspace path: ${workspacePath}`)
  const workspaceId = parsed.wsId
  const filesRoot = path.join(workspaceDir(userId, workspaceId), 'files')
  const fileId = 'file-remote-fallback-workspace'
  const fileDir = path.join(filesRoot, fileId)
  fs.mkdirSync(fileDir, { recursive: true })
  const content = [
    '# 本地工作区材料',
    '',
    '工作区附件检索仍然必须保持可用，即使远端知识库暂时失败。',
    '引用链路需要保留 sourceId、chunkId、trustLevel 和 provider。',
  ].join('\n')
  fs.writeFileSync(path.join(fileDir, 'original'), content, 'utf-8')
  fs.writeFileSync(
    path.join(filesRoot, 'files.json'),
    JSON.stringify({
      files: [
        {
          id: fileId,
          name: '本地工作区材料.md',
          ext: 'md',
          mimeType: 'text/markdown',
          size: Buffer.byteLength(content, 'utf-8'),
          uploadedAt: new Date().toISOString(),
        },
      ],
    }, null, 2),
    'utf-8',
  )
  return fileId
}

async function main() {
  const baseUrl = 'http://mock-remote-knowledge.local'
  const token = 'remote-smoke-token'
  process.env.REMOTE_KNOWLEDGE_BASE_URL = baseUrl
  process.env.REMOTE_KNOWLEDGE_API_TOKEN = token
  process.env.REMOTE_KNOWLEDGE_TIMEOUT_MS = '15000'

  const remoteSourceId = 'doc-remote-policy'
  const remoteChunkId = 'doc-remote-policy:chunk-7'

  let activeMock = installMockRemoteKnowledgeFetch({
    baseUrl,
    departments: [{ id: 'kb-policy', name: '政策法规库' }],
    filesByDepartment: {
      'kb-policy': [
        {
          id: remoteSourceId,
          title: '人工智能治理办法.pdf',
          originalName: '人工智能治理办法.pdf',
        },
      ],
    },
    qaByDepartment: {
      'kb-policy': {
        ok: true,
        data: {
          matches: [
            {
              document_id: remoteSourceId,
              document_title: '人工智能治理办法',
              chunk_id: remoteChunkId,
              content: '远端知识库返回的深度 chunk 说明：需要保留 provider、sourceId、chunkId 与 trustLevel。',
              relevance: 0.97,
              trust_level: 'verified',
              source_type: 'policy',
              metadata: { section: '第二章' },
            },
          ],
        },
      },
    },
  })

  try {
    const remoteChunks = await searchRemoteKnowledgeChunks({
      userId: 'remote-knowledge-smoke',
      workspaceId: '',
      query: 'provider sourceId chunkId trustLevel',
      selectedSourceIds: [remoteSourceId],
      topK: 3,
    })

    assert(remoteChunks.chunks.length === 1, 'remote search should return one normalized chunk')
    assert(remoteChunks.chunks[0]?.provider === 'remote', 'remote chunk provider should be remote')
    assert(remoteChunks.chunks[0]?.sourceId === remoteSourceId, 'remote chunk should preserve sourceId')
    assert(remoteChunks.chunks[0]?.chunkId === remoteChunkId, 'remote chunk should preserve chunkId')
    assert(remoteChunks.chunks[0]?.title.includes('人工智能治理办法'), 'remote chunk should preserve title')
    assert(remoteChunks.chunks[0]?.excerpt.includes('provider'), 'remote chunk should preserve excerpt text')
    assert(remoteChunks.chunks[0]?.trustLevel === 'verified', 'remote chunk should preserve trustLevel')
    assert(activeMock.calls.some((call) => call.headers.authorization === `Bearer ${token}`), 'server should send remote auth token upstream')
    assert(!JSON.stringify(remoteChunks).includes(token), 'remote token must not be exposed in search results')

    const workspaceUserId = `remote-fallback-${Date.now()}`
    const workspace = getOrCreateDefaultWorkspace(workspaceUserId)
    const workspaceFileId = seedWorkspaceFile(workspaceUserId, workspace.path)

    activeMock.restore()

    activeMock = installMockRemoteKnowledgeFetch({
      baseUrl,
      departments: [{ id: 'kb-policy', name: '政策法规库' }],
      filesByDepartment: {
        'kb-policy': [
          {
            id: remoteSourceId,
            title: '人工智能治理办法.pdf',
            originalName: '人工智能治理办法.pdf',
          },
        ],
      },
      qaResponder: () => ({
        status: 503,
        body: { ok: false, message: 'mock qa unavailable' },
      }),
    })

    const merged = await searchKnowledgeCitation({
      userId: workspaceUserId,
      workspaceId: workspace.path,
      query: 'provider sourceId chunkId trustLevel',
      selectedSourceIds: [remoteSourceId, workspaceFileId],
      topK: 4,
    })

    assert(merged.chunks.some((chunk) => chunk.provider === 'workspace'), 'workspace fallback should still return workspace chunks')
    assert(merged.warnings?.some((warning) => warning.includes('远端知识库检索失败') || warning.includes('远端知识库不可用')), 'remote failure should surface a warning')
    assert(!JSON.stringify(merged).includes(token), 'unified search must not expose remote token')

    activeMock.restore()
    console.log('remote knowledge search smoke passed')
  } finally {
    activeMock.restore()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
