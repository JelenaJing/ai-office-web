import {
  getKnowledgeBase,
  listFiles,
  resolveRemoteKnowledgePartitionId,
  type RemoteDocumentMeta,
} from './index'

export interface KnowledgeSearchInput {
  query: string
  workspaceId?: string
  selectedSourceIds: string[]
  topK?: number
}

export interface KnowledgeCitationChunk {
  sourceId: string
  chunkId: string
  title: string
  excerpt: string
  sourceType: 'knowledge_base' | 'file' | 'policy' | 'literature' | 'manual_note'
  trustLevel: 'verified' | 'partial' | 'unverified' | 'unknown'
}

async function resolvePartition(departmentId: string): Promise<string> {
  const deptId = String(departmentId || '').trim()
  const remote = await getKnowledgeBase(deptId)
  const nameEn = remote?.nameEn ?? deptId
  return resolveRemoteKnowledgePartitionId(deptId, nameEn)
}

function sourceTypeForDocument(doc: RemoteDocumentMeta): KnowledgeCitationChunk['sourceType'] {
  const haystack = `${doc.title} ${doc.originalName} ${doc.documentCategory || ''}`.toLowerCase()
  if (/政策|法规|条例|办法|policy|regulation/u.test(haystack)) return 'policy'
  if (/论文|文献|研究|paper|literature|journal|academic/u.test(haystack)) return 'literature'
  return 'knowledge_base'
}

function trustLevelForDocument(doc: RemoteDocumentMeta): KnowledgeCitationChunk['trustLevel'] {
  if (doc.extractionStatus === 'ready') return 'partial'
  if (doc.extractionStatus === 'failed') return 'unverified'
  return 'unknown'
}

function matchesQuery(doc: RemoteDocumentMeta, query: string): boolean {
  if (!query) return true
  const normalized = query.toLowerCase()
  return [doc.title, doc.originalName, doc.previewText]
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(normalized))
}

export async function searchKnowledgeCitationChunks(input: KnowledgeSearchInput): Promise<KnowledgeCitationChunk[]> {
  const query = String(input.query || '').trim()
  const selectedSourceIds = input.selectedSourceIds.map((id) => String(id || '').trim()).filter(Boolean)
  const topK = Math.max(1, Math.min(Number(input.topK) || 5, 10))
  const chunks: KnowledgeCitationChunk[] = []

  for (const sourceId of selectedSourceIds) {
    try {
      const partition = await resolvePartition(sourceId)
      const docs = await listFiles(partition)
      const selectedDocs = docs.filter((doc) => matchesQuery(doc, query))
      const candidates = selectedDocs.length > 0 ? selectedDocs : docs
      for (const doc of candidates.slice(0, topK)) {
        chunks.push({
          sourceId,
          chunkId: `${sourceId}:${doc.id}:chunk-1`,
          title: doc.title || doc.originalName || sourceId,
          excerpt: doc.previewText?.trim()
            || `${doc.title || doc.originalName || sourceId}（${doc.extractionStatus}）`,
          sourceType: sourceTypeForDocument(doc),
          trustLevel: trustLevelForDocument(doc),
        })
        if (chunks.length >= topK) break
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn(`[knowledge] search fallback source=${sourceId}:`, msg)
      chunks.push({
        sourceId,
        chunkId: `${sourceId}:fallback-chunk-1`,
        title: sourceId,
        excerpt: query || '知识库检索服务暂不可用，保留可升级的引用结构。',
        sourceType: 'knowledge_base',
        trustLevel: 'unknown',
      })
    }
    if (chunks.length >= topK) break
  }

  return chunks.slice(0, topK)
}
