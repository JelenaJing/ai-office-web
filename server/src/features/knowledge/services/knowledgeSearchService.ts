import fs from 'fs'
import path from 'path'
import {
  getKnowledgeBase,
  listFiles,
  resolveRemoteKnowledgePartitionId,
  type RemoteDocumentMeta,
} from './index'
import { extractDocxContent } from '../../document/services/docxExtractService'
import { listUserFilesInWorkspace, resolveUserFileInWorkspace, type ResolvedUserFile } from '../../../lib/userFiles'
import { workspaceDir } from '../../../lib/workspaceStore'
import type {
  KnowledgeChunk,
  KnowledgeCitationChunk,
  KnowledgeSearchInput,
  KnowledgeSearchResult,
  KnowledgeSource,
  KnowledgeSourceType,
  KnowledgeTrustLevel,
} from '../types'

const MAX_CHUNK_CHARS = 420
const EXCERPT_CHARS = 220

interface CachedWorkspaceChunks {
  fingerprint: string
  source: KnowledgeSource
  chunks: KnowledgeChunk[]
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

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function compactSearchText(value: string): string {
  return normalizeSearchText(value).replace(/\s+/g, '')
}

function buildSearchTerms(query: string): string[] {
  const normalized = normalizeSearchText(query)
  if (!normalized) return []
  const terms = new Set<string>()
  const compact = compactSearchText(query)
  if (compact.length >= 2) terms.add(compact)
  for (const part of normalized.split(/[\s,.;:!?()（）【】、，。；：]/u)) {
    const token = part.trim()
    if (token.length >= 2) terms.add(token)
  }
  return Array.from(terms)
}

function scoreChunkText(text: string, query: string, terms: string[]): number {
  const normalizedText = normalizeSearchText(text)
  const compactText = compactSearchText(text)
  const normalizedQuery = normalizeSearchText(query)
  const compactQuery = compactSearchText(query)
  let score = 0
  if (!normalizedText) return 0
  if (normalizedQuery && normalizedText.includes(normalizedQuery)) score += 120
  if (compactQuery && compactText.includes(compactQuery)) score += 90
  for (const term of terms) {
    if (normalizedText.includes(term) || compactText.includes(term)) {
      score += Math.min(24, term.length * 4)
    }
  }
  return score
}

function inferSourceType(title: string, text: string, fallback: KnowledgeSourceType): KnowledgeSourceType {
  const haystack = `${title} ${text.slice(0, 600)}`.toLowerCase()
  if (/政策|法规|条例|办法|policy|regulation/u.test(haystack)) return 'policy'
  if (/论文|文献|研究|paper|literature|journal|academic/u.test(haystack)) return 'literature'
  return fallback
}

function chunkText(text: string): string[] {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
  if (!normalized) return []
  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((part) => part.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
  const chunks: string[] = []
  for (const paragraph of paragraphs.length > 0 ? paragraphs : [normalized]) {
    if (paragraph.length <= MAX_CHUNK_CHARS) {
      chunks.push(paragraph)
      continue
    }
    for (let start = 0; start < paragraph.length; start += MAX_CHUNK_CHARS - 80) {
      const slice = paragraph.slice(start, start + MAX_CHUNK_CHARS).trim()
      if (slice) chunks.push(slice)
    }
  }
  return chunks
}

function excerptForChunk(text: string): string {
  return text.length > EXCERPT_CHARS ? `${text.slice(0, EXCERPT_CHARS).trim()}...` : text
}

function cachePathForFile(userId: string, file: ResolvedUserFile): string {
  const dir = path.join(workspaceDir(userId, file.workspaceId), 'knowledge-search')
  fs.mkdirSync(dir, { recursive: true })
  return path.join(dir, `${file.entry.id}.json`)
}

async function extractWorkspaceFileText(file: ResolvedUserFile): Promise<{ title: string; text: string; sourceType: KnowledgeSourceType; trustLevel: KnowledgeTrustLevel } | null> {
  const ext = String(file.entry.ext || '').toLowerCase()
  if (ext === 'docx') {
    const buffer = fs.readFileSync(file.absolutePath)
    const extracted = await extractDocxContent(buffer)
    return {
      title: extracted.title || file.entry.name,
      text: extracted.text,
      sourceType: inferSourceType(file.entry.name, extracted.text, 'file'),
      trustLevel: 'verified',
    }
  }
  if (['txt', 'md', 'csv', 'json'].includes(ext)) {
    const text = fs.readFileSync(file.absolutePath, 'utf-8')
    return {
      title: file.entry.name,
      text,
      sourceType: inferSourceType(file.entry.name, text, 'file'),
      trustLevel: 'verified',
    }
  }
  return null
}

async function loadWorkspaceFileChunks(userId: string, file: ResolvedUserFile): Promise<KnowledgeChunk[]> {
  const cachePath = cachePathForFile(userId, file)
  const fingerprint = `${file.entry.uploadedAt}:${file.entry.size}`
  if (fs.existsSync(cachePath)) {
    try {
      const cached = JSON.parse(fs.readFileSync(cachePath, 'utf-8')) as CachedWorkspaceChunks
      if (cached.fingerprint === fingerprint) {
        return cached.chunks
      }
    } catch {
      // ignore corrupted cache; rebuild below
    }
  }

  const extracted = await extractWorkspaceFileText(file)
  if (!extracted) return []
  const source: KnowledgeSource = {
    sourceId: file.entry.id,
    title: extracted.title,
    sourceType: extracted.sourceType,
    trustLevel: extracted.trustLevel,
    workspacePath: file.workspacePath,
    fileId: file.entry.id,
    absolutePath: file.absolutePath,
    updatedAt: file.entry.uploadedAt,
  }
  const chunks = chunkText(extracted.text).map((text, index) => ({
    sourceId: file.entry.id,
    chunkId: `${file.entry.id}:chunk-${index + 1}`,
    title: source.title,
    excerpt: excerptForChunk(text),
    text,
    sourceType: source.sourceType,
    trustLevel: source.trustLevel,
  }))

  fs.writeFileSync(
    cachePath,
    JSON.stringify({ fingerprint, source, chunks }, null, 2),
    'utf-8',
  )
  return chunks
}

async function loadSelectedWorkspaceChunks(input: KnowledgeSearchInput): Promise<KnowledgeChunk[]> {
  const userId = String(input.userId || '').trim()
  if (!userId) return []
  const selectedSourceIds = input.selectedSourceIds.map((id) => String(id || '').trim()).filter(Boolean)
  const files = selectedSourceIds.length > 0
    ? selectedSourceIds
      .map((sourceId) => resolveUserFileInWorkspace(userId, sourceId, input.workspaceId))
      .filter((file): file is ResolvedUserFile => Boolean(file))
    : listUserFilesInWorkspace(userId, input.workspaceId)
  const chunks = await Promise.all(files.map((file) => loadWorkspaceFileChunks(userId, file)))
  return chunks.flat()
}

async function loadRemoteKnowledgeChunks(selectedSourceIds: string[]): Promise<KnowledgeChunk[]> {
  const chunks: KnowledgeChunk[] = []
  for (const sourceId of selectedSourceIds) {
    try {
      const partition = await resolvePartition(sourceId)
      const docs = await listFiles(partition)
      for (const doc of docs) {
        const previewText = doc.previewText?.trim() || `${doc.title || doc.originalName || sourceId}`
        chunks.push({
          sourceId,
          chunkId: `${sourceId}:${doc.id}:chunk-1`,
          title: doc.title || doc.originalName || sourceId,
          excerpt: excerptForChunk(previewText),
          text: previewText,
          sourceType: sourceTypeForDocument(doc),
          trustLevel: trustLevelForDocument(doc),
        })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn(`[knowledge] search remote source=${sourceId} failed:`, msg)
    }
  }
  return chunks
}

function rankChunks(chunks: KnowledgeChunk[], query: string, topK: number): KnowledgeCitationChunk[] {
  const terms = buildSearchTerms(query)
  const normalizedQuery = normalizeSearchText(query)
  const ranked = chunks
    .map((chunk) => ({
      ...chunk,
      score: scoreChunkText(`${chunk.title}\n${chunk.text}`, query, terms),
    }))
    .filter((chunk) => (normalizedQuery ? (chunk.score || 0) > 0 : true))
    .sort((left, right) => {
      const scoreDiff = (right.score || 0) - (left.score || 0)
      if (scoreDiff !== 0) return scoreDiff
      return left.chunkId.localeCompare(right.chunkId)
    })
    .slice(0, topK)

  return ranked.map(({ sourceId, chunkId, title, excerpt, sourceType, trustLevel }) => ({
    sourceId,
    chunkId,
    title,
    excerpt,
    sourceType,
    trustLevel,
  }))
}

export async function searchKnowledgeCitation(input: KnowledgeSearchInput): Promise<KnowledgeSearchResult> {
  const query = String(input.query || '').trim()
  const selectedSourceIds = input.selectedSourceIds.map((id) => String(id || '').trim()).filter(Boolean)
  const topK = Math.max(1, Math.min(Number(input.topK) || 5, 10))

  if (selectedSourceIds.length === 0) {
    return { chunks: [], mockable: false }
  }

  const userId = String(input.userId || '').trim()
  const resolvedWorkspaceSourceIds = userId
    ? new Set(
      selectedSourceIds.filter((sourceId) => Boolean(resolveUserFileInWorkspace(userId, sourceId, input.workspaceId))),
    )
    : new Set<string>()
  const workspaceChunks = await loadSelectedWorkspaceChunks({
    ...input,
    selectedSourceIds,
  })
  const remoteSourceIds = selectedSourceIds.filter((sourceId) => !resolvedWorkspaceSourceIds.has(sourceId))
  const remoteChunks = await loadRemoteKnowledgeChunks(remoteSourceIds)
  const ranked = rankChunks([...workspaceChunks, ...remoteChunks], query, topK)

  return {
    chunks: ranked,
    mockable: false,
  }
}

export async function searchKnowledgeCitationChunks(input: KnowledgeSearchInput): Promise<KnowledgeCitationChunk[]> {
  return (await searchKnowledgeCitation(input)).chunks
}
