import fsSync from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'

import type {
  ArticleCandidate,
  ScienceRelayArticle,
  ScienceRelayManifestRow,
} from '../types'

type SourceMode = 'local' | 'http'

export interface ScienceRelayDataSourceConfig {
  mode: SourceMode
  /**
   * local: directory which contains `articles-manifest.json` and `articles/` folder
   * http : base URL which contains `/articles-manifest.json` and `/articles/<id>.json`
   */
  base: string
  cacheTtlMs: number
}

export interface ScienceRelayDataset {
  manifestRows: ScienceRelayManifestRow[]
  byId: Map<string, ScienceRelayManifestRow>
}

/** Remote static site keeps JSON under `data/`; accept either layout. */
function resolveLocalDataBase(dir: string): string {
  const trimmed = dir.trim()
  if (!trimmed) return trimmed
  const manifestAtRoot = path.join(trimmed, 'articles-manifest.json')
  if (fsSync.existsSync(manifestAtRoot)) return trimmed
  const nested = path.join(trimmed, 'data', 'articles-manifest.json')
  if (fsSync.existsSync(nested)) return path.join(trimmed, 'data')
  return trimmed
}

function resolveConfig(): ScienceRelayDataSourceConfig {
  const modeRaw = String(process.env.SCIENCERELAY_DATA_SOURCE_MODE ?? '').trim().toLowerCase()
  const mode: SourceMode = modeRaw === 'http' ? 'http' : 'local'

  const baseRaw =
    mode === 'http'
      ? String(process.env.SCIENCERELAY_DATA_HTTP_BASE ?? '').trim().replace(/\/$/, '')
      : String(process.env.SCIENCERELAY_DATA_DIR ?? '').trim()
  const base = mode === 'local' ? resolveLocalDataBase(baseRaw) : baseRaw

  const cacheTtlMs = Number(process.env.SCIENCERELAY_CACHE_TTL_MS ?? 30_000)

  if (!base) {
    throw new Error(
      mode === 'http'
        ? 'SCIENCERELAY_DATA_HTTP_BASE is required when SCIENCERELAY_DATA_SOURCE_MODE=http'
        : 'SCIENCERELAY_DATA_DIR is required when SCIENCERELAY_DATA_SOURCE_MODE=local',
    )
  }

  return { mode, base, cacheTtlMs }
}

let cachedAt = 0
let cachedManifestMtimeMs = 0
let cachedDataset: ScienceRelayDataset | null = null

function manifestPath(config: ScienceRelayDataSourceConfig): string {
  if (config.mode !== 'local') {
    throw new Error('manifest mtime only supported in local mode')
  }
  return path.join(config.base, 'articles-manifest.json')
}

async function getManifestMtimeMs(config: ScienceRelayDataSourceConfig): Promise<number> {
  const st = await fs.stat(manifestPath(config))
  return st.mtimeMs
}

/** Drop in-memory manifest cache (e.g. after rsync from remote). */
export function invalidateScienceRelayCache(): void {
  cachedAt = 0
  cachedManifestMtimeMs = 0
  cachedDataset = null
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, 'utf-8')
  return JSON.parse(raw) as T
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`fetch failed: ${res.status} ${res.statusText} ${text}`.trim())
  }
  return (await res.json()) as T
}

async function loadManifest(config: ScienceRelayDataSourceConfig): Promise<ScienceRelayManifestRow[]> {
  if (config.mode === 'http') {
    const payload = await fetchJson<{ articles?: ScienceRelayManifestRow[] }>(
      `${config.base}/articles-manifest.json`,
    )
    return Array.isArray(payload.articles) ? payload.articles : []
  }

  const payload = await readJsonFile<{ articles?: ScienceRelayManifestRow[] }>(
    path.join(config.base, 'articles-manifest.json'),
  )
  return Array.isArray(payload.articles) ? payload.articles : []
}

export async function getScienceRelayDataset(): Promise<ScienceRelayDataset> {
  const config = resolveConfig()
  const now = Date.now()

  if (cachedDataset && now - cachedAt < config.cacheTtlMs) {
    if (config.mode === 'local') {
      try {
        const mtime = await getManifestMtimeMs(config)
        if (mtime <= cachedManifestMtimeMs) return cachedDataset
      } catch {
        // manifest missing or unreadable — reload below
      }
    } else {
      return cachedDataset
    }
  }

  const rows = await loadManifest(config)
  const byId = new Map(rows.map((r) => [String(r.id), r]))
  cachedDataset = { manifestRows: rows, byId }
  cachedAt = now
  if (config.mode === 'local') {
    try {
      cachedManifestMtimeMs = await getManifestMtimeMs(config)
    } catch {
      cachedManifestMtimeMs = 0
    }
  }
  return cachedDataset
}

function normalizeAuthors(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((x) => String(x)).filter(Boolean)
  if (typeof value === 'string') {
    return value
      .split(/[,;，；]/)
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return []
}

function toCandidate(manifest: ScienceRelayManifestRow, article?: ScienceRelayArticle): ArticleCandidate {
  const title = String(article?.title ?? manifest.title ?? manifest.id).trim()
  const topic = String(article?.topic ?? manifest.topic ?? '').trim()
  const publishedDate = String(article?.publishedDate ?? manifest.publishedDate ?? '').trim() || undefined
  const oneLineSummary = String(article?.oneLineSummary ?? manifest.oneLineSummary ?? '').trim() || undefined
  const thumb = String(article?.thumbnail ?? manifest.thumb ?? '').trim() || undefined
  const authors = normalizeAuthors(article?.authors ?? manifest.authors)
  const subjects = Array.isArray(article?.subjects) ? article?.subjects?.map(String).filter(Boolean) : undefined

  return {
    id: String(manifest.id),
    title,
    topic,
    publishedDate,
    oneLineSummary,
    thumb,
    authors,
    doi: article?.doi ? String(article.doi) : undefined,
    citation: article?.citation ? String(article.citation) : undefined,
    journal: article?.journal ? String(article.journal) : undefined,
    subjects,
  }
}

export async function loadScienceRelayArticleById(id: string): Promise<ScienceRelayArticle | null> {
  const config = resolveConfig()
  const safeId = String(id).trim()
  if (!safeId) return null

  if (config.mode === 'http') {
    return await fetchJson<ScienceRelayArticle>(`${config.base}/articles/${encodeURIComponent(safeId)}.json`)
  }

  const file = path.join(config.base, 'articles', `${safeId}.json`)
  return await readJsonFile<ScienceRelayArticle>(file)
}

export async function listScienceRelayCandidates(params: {
  topic?: string
  limit: number
  includeDetails: boolean
}): Promise<{ total: number; rows: ArticleCandidate[] }> {
  const dataset = await getScienceRelayDataset()
  const topic = String(params.topic ?? '').trim()
  const limit = Math.max(1, Math.min(params.limit, 200))
  const includeDetails = Boolean(params.includeDetails)

  const filtered = dataset.manifestRows.filter((r) => {
    if (!r || !r.id) return false
    if (r.scientist) return false
    if (!topic || topic === 'all') return true
    return String(r.topic ?? '').trim() === topic
  })

  filtered.sort((a, b) => String(b.publishedDate ?? '').localeCompare(String(a.publishedDate ?? '')))

  const sliced = filtered.slice(0, limit)
  if (!includeDetails) {
    return { total: filtered.length, rows: sliced.map((m) => toCandidate(m)) }
  }

  const articles = await Promise.all(
    sliced.map(async (m) => {
      try {
        const art = await loadScienceRelayArticleById(m.id)
        return toCandidate(m, art ?? undefined)
      } catch {
        return toCandidate(m)
      }
    }),
  )

  return { total: filtered.length, rows: articles }
}

export async function listScienceRelayTopics(): Promise<Array<{ topic: string; count: number }>> {
  const dataset = await getScienceRelayDataset()
  const counts = new Map<string, number>()
  for (const row of dataset.manifestRows) {
    if (!row || !row.id) continue
    if (row.scientist) continue
    const topic = String(row.topic ?? '').trim()
    if (!topic) continue
    counts.set(topic, (counts.get(topic) ?? 0) + 1)
  }
  const out = [...counts.entries()].map(([topic, count]) => ({ topic, count }))
  out.sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic, 'zh'))
  return out
}

