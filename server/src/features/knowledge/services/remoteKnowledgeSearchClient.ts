import {
  listFiles,
  listKnowledgeBases,
  qaSearch,
  type RemoteDocumentMeta,
  type RemoteDepartment,
  type RemoteRetrievalHit,
} from './remoteKnowledgeClient'
import type {
  KnowledgeCitationChunk,
  KnowledgeSearchInput,
  KnowledgeSourceSummary,
  KnowledgeSourceType,
  KnowledgeTrustLevel,
} from '../types'

const REMOTE_SOURCE_CACHE_TTL_MS = 30_000

interface RemoteKnowledgeSourceRecord extends KnowledgeSourceSummary {
  provider: 'remote'
  metadata: {
    departmentId: string
    departmentName: string
    departmentNameEn?: string
    originalName?: string
    previewText?: string
    extractionStatus?: RemoteDocumentMeta['extractionStatus']
    documentCategory?: RemoteDocumentMeta['documentCategory']
  }
}

interface RemoteSourceIndex {
  bySourceId: Map<string, RemoteKnowledgeSourceRecord>
  departments: Map<string, RemoteDepartment>
  sources: RemoteKnowledgeSourceRecord[]
  expiresAt: number
}

interface RemoteSearchResult {
  chunks: KnowledgeCitationChunk[]
  warnings: string[]
}

let remoteSourceIndexCache: RemoteSourceIndex | null = null

function sourceTypeForDocument(doc: RemoteDocumentMeta): KnowledgeSourceType {
  const haystack = `${doc.title} ${doc.originalName} ${doc.documentCategory || ''}`.toLowerCase()
  if (/政策|法规|条例|办法|policy|regulation/u.test(haystack)) return 'policy'
  if (/论文|文献|研究|paper|literature|journal|academic/u.test(haystack)) return 'literature'
  return 'knowledge_base'
}

function trustLevelForDocument(doc: RemoteDocumentMeta): KnowledgeTrustLevel {
  if (doc.extractionStatus === 'ready') return 'partial'
  if (doc.extractionStatus === 'failed') return 'unverified'
  return 'unknown'
}

function inferTrustLevel(value: unknown, fallback: KnowledgeTrustLevel): KnowledgeTrustLevel {
  if (value === 'verified' || value === 'partial' || value === 'unverified' || value === 'unknown') {
    return value
  }
  return fallback
}

function firstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

function firstNumber(...values: unknown[]): number {
  for (const value of values) {
    const parsed = typeof value === 'number' ? value : Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return 0
}

function excerptForChunk(text: string): string {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim()
  return normalized.length > 220 ? `${normalized.slice(0, 220).trim()}...` : normalized
}

async function buildRemoteSourceIndex(): Promise<RemoteSourceIndex> {
  const departments = await listKnowledgeBases()
  const fileResults = await Promise.allSettled(
    departments.map(async (department) => ({
      department,
      files: await listFiles(department.id),
    })),
  )

  const bySourceId = new Map<string, RemoteKnowledgeSourceRecord>()
  const departmentMap = new Map(departments.map((department) => [department.id, department]))
  const sources: RemoteKnowledgeSourceRecord[] = []

  fileResults.forEach((result) => {
    if (result.status !== 'fulfilled') return
    const { department, files } = result.value
    files.forEach((doc) => {
      const record: RemoteKnowledgeSourceRecord = {
        id: doc.id,
        title: doc.title || doc.originalName || doc.id,
        sourceType: sourceTypeForDocument(doc),
        provider: 'remote',
        trustLevel: trustLevelForDocument(doc),
        updatedAt: doc.updatedAt || doc.importedAt,
        metadata: {
          departmentId: department.id,
          departmentName: department.name,
          departmentNameEn: department.nameEn,
          originalName: doc.originalName,
          previewText: doc.previewText,
          extractionStatus: doc.extractionStatus,
          documentCategory: doc.documentCategory,
        },
      }
      bySourceId.set(record.id, record)
      sources.push(record)
    })
  })

  return {
    bySourceId,
    departments: departmentMap,
    sources,
    expiresAt: Date.now() + REMOTE_SOURCE_CACHE_TTL_MS,
  }
}

async function getRemoteSourceIndex(options?: { forceRefresh?: boolean }): Promise<RemoteSourceIndex> {
  if (!options?.forceRefresh && remoteSourceIndexCache && remoteSourceIndexCache.expiresAt > Date.now()) {
    return remoteSourceIndexCache
  }
  const next = await buildRemoteSourceIndex()
  remoteSourceIndexCache = next
  return next
}

export async function listRemoteKnowledgeSources(options?: { forceRefresh?: boolean }): Promise<RemoteKnowledgeSourceRecord[]> {
  return (await getRemoteSourceIndex(options)).sources
}

export async function resolveRemoteKnowledgeSource(sourceId: string): Promise<RemoteKnowledgeSourceRecord | null> {
  const normalized = String(sourceId || '').trim()
  if (!normalized) return null
  return (await getRemoteSourceIndex()).bySourceId.get(normalized) ?? null
}

function normalizeRemoteHit(input: {
  hit: RemoteRetrievalHit
  source: RemoteKnowledgeSourceRecord | null
  fallbackDepartmentId: string
  fallbackDepartmentName: string
}): KnowledgeCitationChunk | null {
  const sourceId = firstString(input.hit.documentId, input.source?.id)
  const excerpt = excerptForChunk(input.hit.text)
  if (!sourceId || !excerpt) return null
  const title = firstString(input.hit.documentTitle, input.source?.title, sourceId)
  const fallbackSourceType = input.source?.sourceType || 'knowledge_base'
  return {
    sourceId,
    chunkId: firstString(input.hit.chunkId) || `${sourceId}:chunk-1`,
    title,
    excerpt,
    sourceType: (firstString(input.hit.sourceType) as KnowledgeSourceType) || fallbackSourceType,
    trustLevel: inferTrustLevel(input.hit.trustLevel, input.source?.trustLevel || 'partial'),
    score: firstNumber(input.hit.score),
    provider: 'remote',
    metadata: {
      ...(input.hit.metadata || {}),
      departmentId: input.source?.metadata.departmentId || input.fallbackDepartmentId,
      departmentName: input.source?.metadata.departmentName || input.fallbackDepartmentName,
      pageNo: input.hit.pageNo,
      originalName: input.source?.metadata.originalName,
      previewText: input.source?.metadata.previewText,
      extractionStatus: input.source?.metadata.extractionStatus,
      documentCategory: input.source?.metadata.documentCategory,
    },
  }
}

export async function searchRemoteKnowledgeChunks(input: KnowledgeSearchInput): Promise<RemoteSearchResult> {
  const query = String(input.query || '').trim()
  const topK = Math.max(1, Math.min(Number(input.topK) || 5, 20))
  const warnings: string[] = []

  try {
    const index = await getRemoteSourceIndex()
    const selectedIds = input.selectedSourceIds
      .map((id) => String(id || '').trim())
      .filter(Boolean)
    const groupedFileIds = new Map<string, string[] | null>()
    const unknownSourceIds: string[] = []

    if (selectedIds.length === 0) {
      index.departments.forEach((_, departmentId) => {
        groupedFileIds.set(departmentId, null)
      })
    } else {
      selectedIds.forEach((sourceId) => {
        const source = index.bySourceId.get(sourceId)
        if (source) {
          const departmentId = String(source.metadata.departmentId || '').trim()
          const current = groupedFileIds.get(departmentId)
          if (current === null) return
          groupedFileIds.set(departmentId, [...(current || []), sourceId])
          return
        }
        if (index.departments.has(sourceId)) {
          groupedFileIds.set(sourceId, null)
          return
        }
        unknownSourceIds.push(sourceId)
      })

      if (unknownSourceIds.length > 0) {
        index.departments.forEach((_, departmentId) => {
          const current = groupedFileIds.get(departmentId)
          if (current === null) return
          groupedFileIds.set(departmentId, [...(current || []), ...unknownSourceIds])
        })
      }
    }

    if (groupedFileIds.size === 0) {
      console.info('[knowledge] remote search skipped: no remote sources resolved')
      return { chunks: [], warnings }
    }

    console.info(
      `[knowledge] remote search start query="${query.slice(0, 80)}" groups=${groupedFileIds.size} selected=${selectedIds.length || 'all'}`,
    )

    const searchResults = await Promise.allSettled(
      Array.from(groupedFileIds.entries()).map(async ([departmentId, fileIds]) => {
        const department = index.departments.get(departmentId)
        const hits = await qaSearch(
          departmentId,
          query,
          fileIds && fileIds.length > 0 ? Array.from(new Set(fileIds)) : null,
          Math.max(topK * 2, 8),
        )
        const normalized = hits
          .map((hit) => normalizeRemoteHit({
            hit,
            source: index.bySourceId.get(hit.documentId) ?? null,
            fallbackDepartmentId: departmentId,
            fallbackDepartmentName: department?.name || departmentId,
          }))
          .filter((item): item is KnowledgeCitationChunk => Boolean(item))
        console.info(
          `[knowledge] remote search ok dept=${departmentId} fileIds=${fileIds?.length ?? 0} hits=${normalized.length}`,
        )
        return normalized
      }),
    )

    const chunks: KnowledgeCitationChunk[] = []
    searchResults.forEach((result, indexOfGroup) => {
      if (result.status === 'fulfilled') {
        chunks.push(...result.value)
        return
      }
      const departmentId = Array.from(groupedFileIds.keys())[indexOfGroup]
      const message = result.reason instanceof Error ? result.reason.message : String(result.reason)
      warnings.push(`远端知识库检索失败（${departmentId}）：${message}`)
      console.warn(`[knowledge] remote search failed dept=${departmentId}:`, message)
    })

    console.info(`[knowledge] remote search done chunks=${chunks.length} warnings=${warnings.length}`)
    return { chunks, warnings }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn('[knowledge] remote search unavailable:', message)
    return {
      chunks: [],
      warnings: [`远端知识库不可用，已回退本地检索：${message}`],
    }
  }
}
