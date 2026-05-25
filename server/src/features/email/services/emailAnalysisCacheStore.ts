import fs from 'fs'
import path from 'path'
import { toJsonSafe, stringifyJsonSafe } from '../../../lib/jsonSafe'

export interface CachedEmailAnalysisRecord {
  cacheKey: string
  accountId: string
  folder: string
  messageUid: string
  bodyHash: string
  promptVersion: string
  result: Record<string, unknown>
  bodyLength: number
  truncated: boolean
  createdAt: string
  updatedAt: string
}

type CacheStore = Record<string, CachedEmailAnalysisRecord>

const CACHE_ROOT = path.resolve(__dirname, '../../../data/email-analysis-cache')
const MAX_CACHE_ENTRIES = 2000

function cachePath(userId: string): string {
  const safe = userId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64)
  return path.join(CACHE_ROOT, `${safe}.json`)
}

function loadStore(userId: string): CacheStore {
  const target = cachePath(userId)
  if (!fs.existsSync(target)) return {}
  try {
    return JSON.parse(fs.readFileSync(target, 'utf-8')) as CacheStore
  } catch {
    return {}
  }
}

function saveStore(userId: string, store: CacheStore): void {
  fs.mkdirSync(CACHE_ROOT, { recursive: true })
  const entries = Object.entries(store)
    .sort((a, b) => a[1].updatedAt.localeCompare(b[1].updatedAt))
  const pruned = Object.fromEntries(entries.slice(-MAX_CACHE_ENTRIES))
  const target = cachePath(userId)
  const temp = `${target}.${process.pid}.tmp`
  fs.writeFileSync(temp, stringifyJsonSafe(pruned, 2), 'utf-8')
  fs.renameSync(temp, target)
}

export function getCachedEmailAnalysis(userId: string, cacheKey: string): CachedEmailAnalysisRecord | null {
  const store = loadStore(userId)
  return store[cacheKey] ?? null
}

export function setCachedEmailAnalysis(userId: string, record: CachedEmailAnalysisRecord): void {
  const store = loadStore(userId)
  store[record.cacheKey] = toJsonSafe(record) as CachedEmailAnalysisRecord
  saveStore(userId, store)
}
