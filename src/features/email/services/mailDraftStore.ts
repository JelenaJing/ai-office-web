/**
 * mailDraftStore — localStorage store for AI pre-reply drafts.
 *
 * Drafts are keyed by `${accountId}:${messageId}:${bodyHash}` so they are
 * automatically invalidated if the email body changes.
 *
 * Security: drafts are local-only. Nothing is sent automatically.
 * Users must explicitly click "Send" to dispatch any message.
 */
import type { AiMailReplyDraft } from '../../../types/mailTriage'
import type { EmailReplyRequirementsHistoryItem } from '../../../types/email'
import { extractLegacyMailId } from '../utils/mailIdentity'

const STORE_KEY = 'ai:mail-draft:v2'
const REQUIREMENTS_HISTORY_KEY = 'ai:mail-reply-requirements:v1'
const MAX_DRAFTS = 200
const MAX_REQUIREMENT_HISTORY = 5

type DraftStore = Record<string, AiMailReplyDraft>

function candidateKeys(primaryKey: string, aliases: string[] = []): string[] {
  return [...new Set([
    primaryKey,
    ...aliases,
    extractLegacyMailId(primaryKey),
    ...aliases.map((key) => extractLegacyMailId(key)),
  ].filter(Boolean))]
}

function load(): DraftStore {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function save(store: DraftStore): void {
  try {
    const keys = Object.keys(store)
    if (keys.length > MAX_DRAFTS) {
      // Evict oldest entries by createdAt
      const sorted = keys.sort((a, b) => {
        const da = store[a]?.createdAt ?? ''
        const db = store[b]?.createdAt ?? ''
        return da < db ? -1 : da > db ? 1 : 0
      })
      const trimmed: DraftStore = {}
      for (const k of sorted.slice(-MAX_DRAFTS)) trimmed[k] = store[k]
      localStorage.setItem(STORE_KEY, JSON.stringify(trimmed))
    } else {
      localStorage.setItem(STORE_KEY, JSON.stringify(store))
    }
  } catch {}
}

function loadRequirementsHistory(): EmailReplyRequirementsHistoryItem[] {
  try {
    const raw = JSON.parse(localStorage.getItem(REQUIREMENTS_HISTORY_KEY) ?? '[]') as unknown
    return Array.isArray(raw) ? raw.filter((item): item is EmailReplyRequirementsHistoryItem => Boolean(item && typeof item === 'object')) : []
  } catch {
    return []
  }
}

function saveRequirementsHistory(items: EmailReplyRequirementsHistoryItem[]): void {
  try {
    localStorage.setItem(REQUIREMENTS_HISTORY_KEY, JSON.stringify(items.slice(0, MAX_REQUIREMENT_HISTORY)))
  } catch {}
}

/** Get the AI draft for a specific mail. Returns null if not present or discarded. */
export function getAiDraft(accountId: string, mailKey: string, bodyHash: string, aliases: string[] = []): AiMailReplyDraft | null {
  const store = load()
  const draft = candidateKeys(mailKey, aliases)
    .map((key) => store[`${accountId}:${key}:${bodyHash}`])
    .find(Boolean)
    ?? null
  if (!draft) return null
  // Don't return discarded drafts
  if (draft.status === 'discarded') return null
  return draft
}

/** Check if a non-discarded AI draft exists for a specific mail + bodyHash. */
export function hasAiDraft(accountId: string, mailKey: string, bodyHash: string, aliases: string[] = []): boolean {
  return getAiDraft(accountId, mailKey, bodyHash, aliases) !== null
}

/** Store an AI draft. */
export function setAiDraft(draft: AiMailReplyDraft): void {
  const store = load()
  const mailKey = draft.mailKey || draft.messageId
  store[`${draft.accountId}:${mailKey}:${draft.bodyHash}`] = draft
  save(store)
}

/** Update the status of an existing draft. */
export function updateAiDraftStatus(
  accountId: string,
  mailKey: string,
  bodyHash: string,
  status: AiMailReplyDraft['status'],
): void {
  const store = load()
  const keys = [
    `${accountId}:${mailKey}:${bodyHash}`,
    `${accountId}:${extractLegacyMailId(mailKey)}:${bodyHash}`,
  ]
  for (const key of keys) {
    if (!store[key]) continue
    store[key] = { ...store[key], status, updatedAt: new Date().toISOString() }
    save(store)
    return
  }
}

/** Remove all AI drafts for a specific mail (across all bodyHash variants). */
export function evictAiDraft(accountId: string, mailKey: string): void {
  const store = load()
  const prefixes = [
    `${accountId}:${mailKey}:`,
    `${accountId}:${extractLegacyMailId(mailKey)}:`,
  ]
  let changed = false
  for (const key of Object.keys(store)) {
    if (prefixes.some((prefix) => key.startsWith(prefix))) {
      delete store[key]
      changed = true
    }
  }
  if (changed) save(store)
}

/** Remove all AI drafts for an account (used when clearing seed data). */
export function evictAllAiDraftsForAccount(accountId: string): void {
  const store = load()
  const prefix = `${accountId}:`
  let changed = false
  for (const key of Object.keys(store)) {
    if (key.startsWith(prefix)) {
      delete store[key]
      changed = true
    }
  }
  if (changed) save(store)
}

export function getReplyRequirementsHistory(): EmailReplyRequirementsHistoryItem[] {
  return loadRequirementsHistory()
}

export function pushReplyRequirementsHistory(item: EmailReplyRequirementsHistoryItem): void {
  const next = [
    item,
    ...loadRequirementsHistory().filter((entry) => entry.userInstruction.trim() !== item.userInstruction.trim()),
  ].slice(0, MAX_REQUIREMENT_HISTORY)
  saveRequirementsHistory(next)
}
