/**
 * Mail Triage Cache — persistent localStorage storage for AI triage results.
 *
 * Cache key: `${accountId}:${messageId}`
 * Hit condition: entry exists AND bodyHash matches AND status === 'success'
 *
 * Completely client-side. No server calls.
 *
 * ⚠️  MVP CACHE LAYER: uses localStorage for simplicity.
 *     Migrate to electron-store or SQLite (better-sqlite3) in production
 *     to support larger datasets, cross-window sync, and atomic writes.
 */
import type { AiMailTriageResult } from '../../../types/mailTriage'
import { extractLegacyMailId } from '../utils/mailIdentity'

const CACHE_KEY = 'ai:mail-triage:v1'
/** Prune to this many entries when storage grows large */
const MAX_CACHE_ENTRIES = 600
export const MAIL_ANALYSIS_PROMPT_VERSION = 'email-analysis-v2'

type CacheStore = Record<string, AiMailTriageResult>

/** djb2 variant hash — fast, deterministic, no async */
export function computeBodyHash(body: string): string {
  let h = 5381
  for (let i = 0; i < body.length; i++) {
    // eslint-disable-next-line no-bitwise
    h = (((h << 5) + h) ^ body.charCodeAt(i)) >>> 0
  }
  return h.toString(16).padStart(8, '0')
}

function loadStore(): CacheStore {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as CacheStore
  } catch {
    return {}
  }
}

function saveStore(store: CacheStore): void {
  try {
    const entries = Object.entries(store)
    if (entries.length > MAX_CACHE_ENTRIES) {
      // Evict oldest entries
      entries.sort((a, b) => a[1].updatedAt.localeCompare(b[1].updatedAt))
      const pruned = Object.fromEntries(entries.slice(entries.length - MAX_CACHE_ENTRIES))
      localStorage.setItem(CACHE_KEY, JSON.stringify(pruned))
    } else {
      localStorage.setItem(CACHE_KEY, JSON.stringify(store))
    }
  } catch {
    // Storage full — attempt to clear the oldest half
    try {
      const entries = Object.entries(loadStore())
      entries.sort((a, b) => a[1].updatedAt.localeCompare(b[1].updatedAt))
      const pruned = Object.fromEntries(entries.slice(Math.floor(entries.length / 2)))
      localStorage.setItem(CACHE_KEY, JSON.stringify(pruned))
    } catch { /* give up */ }
  }
}

function makeCacheKey(
  accountId: string,
  folder: string,
  mailKey: string,
  bodyHash: string,
  promptVersion: string,
): string {
  return `${accountId}:${folder}:${mailKey}:${bodyHash}:${promptVersion}`
}

function candidateKeys(primaryKey: string, aliases: string[] = []): string[] {
  return [...new Set([
    primaryKey,
    ...aliases,
    extractLegacyMailId(primaryKey),
    ...aliases.map((key) => extractLegacyMailId(key)),
  ].filter(Boolean))]
}

/**
 * Return the cached triage result only if it is a successful hit
 * (status === 'success' AND bodyHash matches).
 */
export function getCachedTriage(
  accountId: string,
  mailKey: string,
  bodyHash: string,
  folder = 'INBOX',
  promptVersion = MAIL_ANALYSIS_PROMPT_VERSION,
  aliases: string[] = [],
): AiMailTriageResult | null {
  const store = loadStore()
  const entry = candidateKeys(mailKey, aliases)
    .map((key) => store[makeCacheKey(accountId, folder, key, bodyHash, promptVersion)])
    .find(Boolean)
  if (!entry) return null
  if (entry.status !== 'success') return null
  if (entry.bodyHash !== bodyHash) return null
  return entry
}

/** Persist a triage result to cache. */
export function setCachedTriage(result: AiMailTriageResult): void {
  const store = loadStore()
  const folder = result.folder || 'INBOX'
  const promptVersion = result.promptVersion || MAIL_ANALYSIS_PROMPT_VERSION
  const mailKey = result.sourceMailKey || result.mailKey || result.mailId || result.messageId || ''
  if (!mailKey) return
  store[makeCacheKey(result.accountId, folder, mailKey, result.bodyHash, promptVersion)] = result
  saveStore(store)
}

/**
 * Load all cached triage results for a given account.
 * Returns a map keyed by messageId.
 */
export function getAllCachedTriagesForAccount(
  accountId: string,
): Record<string, AiMailTriageResult> {
  const store = loadStore()
  const prefix = `${accountId}:`
  const result: Record<string, AiMailTriageResult> = {}
  for (const [key, value] of Object.entries(store)) {
    if (key.startsWith(prefix)) {
      const mailKey = value.sourceMailKey || value.mailKey || value.mailId || value.messageId
      if (!mailKey) continue
      const existing = result[mailKey]
      if (!existing || existing.updatedAt.localeCompare(value.updatedAt) < 0) {
        result[mailKey] = value
      }
    }
  }
  return result
}

/** Remove a single entry from cache. */
export function evictCachedTriage(accountId: string, mailKey: string): void {
  const store = loadStore()
  for (const key of Object.keys(store)) {
    if (
      key.startsWith(`${accountId}:`)
      && (
        key.includes(`:${mailKey}:`)
        || key.includes(`:${extractLegacyMailId(mailKey)}:`)
      )
    ) {
      delete store[key]
    }
  }
  saveStore(store)
}
