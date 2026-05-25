/**
 * Remote Knowledge Base HTTP client (server-side).
 * Ported from electron/main/services/remoteKnowledgeClient.ts — same API shapes.
 */

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const DEFAULT_BASE_URL = 'http://127.0.0.1:8010'
const DEFAULT_TIMEOUT_MS = 15_000

function getBaseUrl(): string {
  return (
    process.env.REMOTE_KNOWLEDGE_BASE_URL ??
    process.env.KNOWLEDGE_SERVICE_URL ??
    process.env.KNOWLEDGE_API_BASE_URL ??
    DEFAULT_BASE_URL
  )
}

function getServiceToken(): string | undefined {
  const t = (
    process.env.REMOTE_KNOWLEDGE_API_TOKEN ??
    process.env.KNOWLEDGE_SERVICE_TOKEN
  )?.trim()
  return t || undefined
}

function makeSignal(): AbortSignal {
  const parsedTimeout = Number(process.env.REMOTE_KNOWLEDGE_TIMEOUT_MS)
  const timeoutMs = Number.isFinite(parsedTimeout) && parsedTimeout > 0
    ? parsedTimeout
    : DEFAULT_TIMEOUT_MS
  return AbortSignal.timeout(timeoutMs)
}

function buildHeaders(partition?: string): Record<string, string> {
  const headers: Record<string, string> = {}
  const token = getServiceToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (partition) headers['X-KB-Partition'] = partition
  return headers
}

async function apiGet<T = unknown>(path: string, partition?: string): Promise<T> {
  const res = await fetch(`${getBaseUrl()}${path}`, {
    headers: buildHeaders(partition),
    signal: makeSignal(),
  })
  if (!res.ok) throw new Error(`KB API GET ${path} → ${res.status}`)
  return res.json() as Promise<T>
}

async function apiPost<T = unknown>(
  path: string,
  body?: unknown,
  partition?: string,
): Promise<T> {
  const res = await fetch(`${getBaseUrl()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...buildHeaders(partition) },
    body: body != null ? JSON.stringify(body) : undefined,
    signal: makeSignal(),
  })
  if (!res.ok) throw new Error(`KB API POST ${path} → ${res.status}`)
  return res.json() as Promise<T>
}

async function apiDelete(path: string, partition?: string): Promise<void> {
  const res = await fetch(`${getBaseUrl()}${path}`, {
    method: 'DELETE',
    headers: buildHeaders(partition),
    signal: makeSignal(),
  })
  if (!res.ok) throw new Error(`KB API DELETE ${path} → ${res.status}`)
}

// ---------------------------------------------------------------------------
// Raw API shapes
// ---------------------------------------------------------------------------

interface RawKnowledgeBase {
  kb_id: string
  display_name: string
  description?: string
  parent_kb_id?: string | null
  file_count: number
  created_at?: string
  updated_at?: string
}

interface RawFile {
  file_id: string
  partition: string
  display_name: string
  rel_path?: string
  path_category?: string
  status: string
  page_count?: number
  created_at?: string
  parser_used?: string
}

interface RawQaSource {
  id?: string
  file_id?: string
  fileId?: string
  document_id?: string
  documentId?: string
  source_id?: string
  sourceId?: string
  chunk_id?: string
  chunkId?: string
  page_no?: number
  pageNo?: number
  text?: string
  content?: string
  excerpt?: string
  quote?: string
  page_context?: string
  pageContext?: string
  display_name?: string
  displayName?: string
  title?: string
  document_title?: string
  documentTitle?: string
  score?: number
  similarity?: number
  relevance?: number
  trust_level?: string
  trustLevel?: string
  source_type?: string
  sourceType?: string
  metadata?: Record<string, unknown>
  [key: string]: unknown
}

interface RawQaResponse {
  ok?: boolean
  results?: RawQaSource[]
  sources?: RawQaSource[]
  matches?: RawQaSource[]
  chunks?: RawQaSource[]
  documents?: RawQaSource[]
  data?: RawQaSource[] | { results?: RawQaSource[]; sources?: RawQaSource[]; matches?: RawQaSource[]; chunks?: RawQaSource[]; documents?: RawQaSource[] }
  source_files?: Array<Record<string, unknown>>
}

// ---------------------------------------------------------------------------
// Mapped types (renderer / platformApi expectations)
// ---------------------------------------------------------------------------

export interface RemoteDepartment {
  id: string
  name: string
  nameEn: string
  preset: boolean
  createdAt: string
  parentId?: string
  fileCount: number
}

export interface RemoteDocumentMeta {
  id: string
  title: string
  sourceType: 'pdf' | 'docx' | 'doc' | 'txt' | 'md' | 'image' | 'pptx'
  originalName: string
  mimeType: string
  hash: string
  importedAt: string
  updatedAt: string
  size: number
  storedRelativePath: string
  extractedRelativePath: string
  extractionStatus: 'ready' | 'failed' | 'pending'
  extractedTextLength: number
  previewText: string
  versionCount: number
  templateUsageCount: number
  documentCategory?: 'academic' | 'other'
}

export interface RemoteLibraryInfo {
  rootPath: string
  documentCount: number
  createdAt: string
  updatedAt: string
}

export interface RemoteRetrievalHit {
  documentId: string
  documentTitle: string
  chunkId: string
  text: string
  score?: number
  pageNo?: number
  trustLevel?: string
  sourceType?: string
  metadata?: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

function mapKbToDepartment(kb: RawKnowledgeBase): RemoteDepartment {
  return {
    id: kb.kb_id,
    name: kb.display_name || kb.kb_id,
    nameEn: kb.kb_id,
    preset: true,
    createdAt: kb.created_at || new Date().toISOString(),
    parentId: kb.parent_kb_id || undefined,
    fileCount: kb.file_count ?? 0,
  }
}

function inferSourceType(name: string): RemoteDocumentMeta['sourceType'] {
  const ext = (name.split('.').pop() || '').toLowerCase()
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return 'image'
  if (ext === 'pdf') return 'pdf'
  if (ext === 'docx') return 'docx'
  if (ext === 'doc') return 'doc'
  if (ext === 'md' || ext === 'markdown') return 'md'
  if (ext === 'pptx') return 'pptx'
  return 'txt'
}

function inferMimeType(name: string): string {
  const ext = (name.split('.').pop() || '').toLowerCase()
  if (ext === 'pdf') return 'application/pdf'
  if (ext === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  if (ext === 'doc') return 'application/msword'
  if (ext === 'pptx') return 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  if (ext === 'md' || ext === 'markdown') return 'text/markdown'
  if (ext === 'txt') return 'text/plain'
  if (ext === 'png') return 'image/png'
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  return 'application/octet-stream'
}

function inferDocumentCategory(name: string): 'academic' | 'other' {
  const normalized = name.toLowerCase()
  return /论文|paper|study|research|实验|analysis/.test(normalized) ? 'academic' : 'other'
}

function mapFileToDocument(f: RawFile): RemoteDocumentMeta {
  const displayName = f.display_name || f.rel_path || f.file_id
  return {
    id: f.file_id,
    title: displayName,
    sourceType: inferSourceType(displayName),
    originalName: displayName,
    mimeType: inferMimeType(displayName),
    hash: '',
    importedAt: f.created_at || new Date().toISOString(),
    updatedAt: f.created_at || new Date().toISOString(),
    size: 0,
    storedRelativePath: '',
    extractedRelativePath: '',
    extractionStatus: f.status === 'ready' ? 'ready' : f.status === 'failed' ? 'failed' : 'pending',
    extractedTextLength: 0,
    previewText: '',
    versionCount: 1,
    templateUsageCount: 0,
    documentCategory: inferDocumentCategory(displayName),
  }
}

function firstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

function firstNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    const parsed = typeof value === 'number' ? value : Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

function extractQaItems(payload: RawQaResponse | null | undefined): RawQaSource[] {
  if (!payload || typeof payload !== 'object') return []
  const directCandidates = [
    payload.results,
    payload.sources,
    payload.matches,
    payload.chunks,
    payload.documents,
  ]
  for (const candidate of directCandidates) {
    if (Array.isArray(candidate)) return candidate
  }
  if (Array.isArray(payload.data)) return payload.data
  if (payload.data && typeof payload.data === 'object') {
    const dataRecord = payload.data as Record<string, unknown>
    const nestedCandidates = [
      dataRecord.results,
      dataRecord.sources,
      dataRecord.matches,
      dataRecord.chunks,
      dataRecord.documents,
    ]
    for (const candidate of nestedCandidates) {
      if (Array.isArray(candidate)) return candidate as RawQaSource[]
    }
  }
  return []
}

function mapSourceToHit(source: RawQaSource): RemoteRetrievalHit {
  const documentId = firstString(
    source.file_id,
    source.fileId,
    source.document_id,
    source.documentId,
    source.source_id,
    source.sourceId,
    source.id,
  )
  const text = firstString(
    source.page_context,
    source.pageContext,
    source.text,
    source.content,
    source.excerpt,
    source.quote,
  )
  return {
    documentId,
    documentTitle: firstString(
      source.display_name,
      source.displayName,
      source.document_title,
      source.documentTitle,
      source.title,
      documentId,
    ),
    chunkId: firstString(source.chunk_id, source.chunkId, source.id) || `${documentId}:chunk-1`,
    text,
    score: firstNumber(source.score, source.similarity, source.relevance),
    pageNo: firstNumber(source.page_no, source.pageNo),
    trustLevel: firstString(source.trust_level, source.trustLevel) || undefined,
    sourceType: firstString(source.source_type, source.sourceType) || undefined,
    metadata: source.metadata ?? undefined,
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function listKnowledgeBases(): Promise<RemoteDepartment[]> {
  const data = await apiGet<{ ok: boolean; knowledge_bases: RawKnowledgeBase[] }>(
    '/knowledge-bases',
  )
  return (data.knowledge_bases || []).map(mapKbToDepartment)
}

export async function getKnowledgeBase(kbId: string): Promise<RemoteDepartment | null> {
  try {
    const data = await apiGet<{ ok: boolean; knowledge_base: RawKnowledgeBase }>(
      `/knowledge-bases/${encodeURIComponent(kbId)}`,
    )
    return data.knowledge_base ? mapKbToDepartment(data.knowledge_base) : null
  } catch {
    return null
  }
}

export async function listFiles(kbId: string): Promise<RemoteDocumentMeta[]> {
  const data = await apiGet<{ ok: boolean; files: RawFile[] }>(
    `/knowledge-bases/${encodeURIComponent(kbId)}/files`,
    kbId,
  )
  return (data.files || []).map(mapFileToDocument)
}

export async function qaSearch(
  kbId: string,
  query: string,
  fileIds: string[] | null = null,
  topK = 8,
): Promise<RemoteRetrievalHit[]> {
  const data = await apiPost<RawQaResponse>(
    '/qa',
    {
      query,
      file_ids: fileIds,
      top_k: topK,
      partition: kbId,
      llm: false,
    },
    kbId,
  )
  return extractQaItems(data)
    .map(mapSourceToHit)
    .filter((item) => Boolean(item.documentId) && Boolean(item.text))
}

export async function getBaseInfo(kbId: string): Promise<RemoteLibraryInfo> {
  const kb = await getKnowledgeBase(kbId)
  const now = new Date().toISOString()
  return {
    rootPath: '',
    documentCount: kb?.fileCount ?? 0,
    createdAt: kb?.createdAt ?? now,
    updatedAt: now,
  }
}

/** Try remote delete; no-op if upstream does not support it (matches Electron stub). */
export async function deleteFile(kbId: string, fileId: string): Promise<void> {
  try {
    await apiDelete(
      `/knowledge-bases/${encodeURIComponent(kbId)}/files/${encodeURIComponent(fileId)}`,
      kbId,
    )
  } catch {
    // Remote service may not expose delete — align with Electron IPC stub
  }
}

export async function ingestFilesFromBuffers(
  kbId: string,
  files: Array<{ name: string; buffer: Buffer }>,
): Promise<{ imported: RemoteDocumentMeta[]; failed: string[] }> {
  const form = new FormData()
  form.append('partition', kbId)
  for (const f of files) {
    form.append('files', new Blob([f.buffer]), f.name)
  }

  const res = await fetch(`${getBaseUrl()}/ingest`, {
    method: 'POST',
    headers: buildHeaders(kbId),
    body: form,
    signal: makeSignal(),
  })
  if (!res.ok) throw new Error(`KB API POST /ingest → ${res.status}`)

  interface RawIngestResult {
    file_id: string
    partition: string
    status: string
  }

  const data = (await res.json()) as {
    ok: boolean
    results: RawIngestResult[]
    errors: unknown[]
  }

  const imported: RemoteDocumentMeta[] = (data.results || []).map((r) => {
    const originalName = String(r.file_id || '')
    return {
      id: r.file_id,
      title: originalName,
      sourceType: inferSourceType(originalName),
      originalName,
      mimeType: inferMimeType(originalName),
      hash: '',
      importedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      size: 0,
      storedRelativePath: '',
      extractedRelativePath: '',
      extractionStatus: r.status === 'ready' ? 'ready' : r.status === 'failed' ? 'failed' : 'pending',
      extractedTextLength: 0,
      previewText: '',
      versionCount: 1,
      templateUsageCount: 0,
      documentCategory: inferDocumentCategory(originalName),
    }
  })

  const failed = (data.errors || []).map((e: unknown) => String(e))
  return { imported, failed }
}
