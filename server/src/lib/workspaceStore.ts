/**
 * workspaceStore.ts — Shared workspace storage helpers
 *
 * Imported by both routes/workspaces.ts and routes/files.ts.
 * Storage root: server/data/workspaces/{userId}/{workspaceId}/
 */

import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import type { Request } from 'express'

// ── Constants ─────────────────────────────────────────────────────────────────

export const WORKSPACES_ROOT = path.resolve(__dirname, '../../../data/workspaces')
const AC_URL = process.env.ACCOUNT_CENTER_URL ?? 'http://10.20.5.61:13100'
/** Fallback used only in dev when no token is present. */
export const DEV_FALLBACK_USER = 'web-demo-user'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WorkspaceEntry {
  id: string
  name: string
  /** Opaque token: "web-workspace:{userId}:{id}" */
  path: string
  createdAt: string
  modifiedAt: string
  isDefault?: boolean
}

export interface WorkspaceIndex {
  workspaces: WorkspaceEntry[]
}

// ── userId resolution ─────────────────────────────────────────────────────────

export async function resolveUserId(req: Request): Promise<string> {
  const auth = req.headers['authorization']
  if (!auth || !auth.startsWith('Bearer ')) return DEV_FALLBACK_USER
  try {
    const resp = await fetch(`${AC_URL}/api/auth/me`, {
      headers: { Authorization: auth },
      signal: AbortSignal.timeout(5000),
    })
    if (!resp.ok) return DEV_FALLBACK_USER
    const data = await resp.json() as { id?: string; userId?: string; user?: { id?: string } }
    const uid = data.id ?? data.userId ?? data.user?.id
    return uid ? String(uid) : DEV_FALLBACK_USER
  } catch {
    return DEV_FALLBACK_USER
  }
}

// ── Path helpers ──────────────────────────────────────────────────────────────

export function sanitize(s: string, maxLen = 64): string {
  return s.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, maxLen)
}

export function userRoot(userId: string): string {
  return path.join(WORKSPACES_ROOT, sanitize(userId))
}

export function workspaceDir(userId: string, wsId: string): string {
  return path.join(userRoot(userId), sanitize(wsId))
}

export function indexPath(userId: string): string {
  return path.join(userRoot(userId), 'workspaces.json')
}

export function clientPath(userId: string, wsId: string): string {
  return `web-workspace:${userId}:${wsId}`
}

export function parseClientPath(p: string): { userId: string; wsId: string } | null {
  const m = p.match(/^web-workspace:([^:]+):(.+)$/)
  if (!m) return null
  return { userId: m[1], wsId: m[2] }
}

// ── Index read/write ──────────────────────────────────────────────────────────

export function readIndex(userId: string): WorkspaceIndex {
  fs.mkdirSync(userRoot(userId), { recursive: true })
  const p = indexPath(userId)
  if (!fs.existsSync(p)) return { workspaces: [] }
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8')) as WorkspaceIndex
  } catch {
    return { workspaces: [] }
  }
}

export function writeIndex(userId: string, store: WorkspaceIndex): void {
  fs.mkdirSync(userRoot(userId), { recursive: true })
  fs.writeFileSync(indexPath(userId), JSON.stringify(store, null, 2), 'utf-8')
}

// ── Default workspace ─────────────────────────────────────────────────────────

/** Returns existing default workspace or creates one automatically. */
export function getOrCreateDefaultWorkspace(userId: string): WorkspaceEntry {
  const store = readIndex(userId)
  const existing = store.workspaces.find(
    (ws) => ws.isDefault && fs.existsSync(workspaceDir(userId, ws.id)),
  )
  if (existing) return existing

  const wsId = randomUUID()
  const wsPath = clientPath(userId, wsId)
  const dir = workspaceDir(userId, wsId)
  fs.mkdirSync(path.join(dir, 'files'), { recursive: true })
  fs.mkdirSync(path.join(dir, 'artifacts'), { recursive: true })

  const now = new Date().toISOString()
  const entry: WorkspaceEntry = {
    id: wsId,
    name: '默认工作区',
    path: wsPath,
    createdAt: now,
    modifiedAt: now,
    isDefault: true,
  }
  store.workspaces.unshift(entry)
  writeIndex(userId, store)

  fs.writeFileSync(
    path.join(dir, 'workspace.json'),
    JSON.stringify({ id: wsId, name: '默认工作区', userId, createdAt: now, isDefault: true }, null, 2),
    'utf-8',
  )

  return entry
}

export function hasDocument(userId: string, wsId: string): boolean {
  return fs.existsSync(path.join(workspaceDir(userId, wsId), 'workspace.json'))
}

export function toSafeName(name: string): string {
  return name
    .trim()
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9 _\-]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 80)
}
