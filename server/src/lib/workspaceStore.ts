/**
 * workspaceStore.ts — Shared workspace storage helpers
 *
 * Imported by both routes/workspaces.ts and routes/files.ts.
 * Storage root: server/data/workspaces/{userId}/{workspaceId}/
 */

import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { DEV_FALLBACK_USER, resolveUserId } from './authUser'

export { DEV_FALLBACK_USER, resolveUserId }

// ── Constants ─────────────────────────────────────────────────────────────────

export const WORKSPACES_ROOT = path.resolve(__dirname, '../../../data/workspaces')

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

export interface WorkspaceWriteResolution {
  workspacePath: string
  requestedWorkspacePath: string | null
  requestedWorkspaceOwner: string | null
  resolvedWorkspaceOwner: string
  canWrite: boolean
  reason: string
  switchedFrom: string | null
  switchedTo: string | null
  createdDefault: boolean
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

export function resolveWorkspaceOwner(p: string | null | undefined): string | null {
  if (!p) return null
  return parseClientPath(p)?.userId ?? null
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
  return getOrCreateDefaultWorkspaceWithMeta(userId).entry
}

export function getOrCreateDefaultWorkspaceWithMeta(userId: string): { entry: WorkspaceEntry; created: boolean } {
  const store = readIndex(userId)
  const existing = store.workspaces.find(
    (ws) => ws.isDefault && fs.existsSync(workspaceDir(userId, ws.id)),
  )
  if (existing) return { entry: existing, created: false }

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

  return { entry, created: true }
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

export function resolveWritableWorkspaceForUser(userId: string, requestedWorkspacePath?: string | null): WorkspaceWriteResolution {
  const normalizedRequested = String(requestedWorkspacePath || '').trim()
  const defaultWorkspace = () => getOrCreateDefaultWorkspaceWithMeta(userId)

  if (!normalizedRequested) {
    const { entry, created } = defaultWorkspace()
    return {
      workspacePath: entry.path,
      requestedWorkspacePath: null,
      requestedWorkspaceOwner: null,
      resolvedWorkspaceOwner: userId,
      canWrite: true,
      reason: 'workspacePath 为空，已切换到当前用户默认工作区',
      switchedFrom: null,
      switchedTo: entry.path,
      createdDefault: created,
    }
  }

  const parsed = parseClientPath(normalizedRequested)
  if (parsed && parsed.userId === userId && fs.existsSync(workspaceDir(userId, parsed.wsId))) {
    return {
      workspacePath: normalizedRequested,
      requestedWorkspacePath: normalizedRequested,
      requestedWorkspaceOwner: parsed.userId,
      resolvedWorkspaceOwner: parsed.userId,
      canWrite: true,
      reason: 'workspacePath 属于当前用户，可直接写入',
      switchedFrom: null,
      switchedTo: null,
      createdDefault: false,
    }
  }

  const { entry, created } = defaultWorkspace()
  const requestedOwner = parsed?.userId ?? null
  const reason = !parsed
    ? 'workspacePath 格式无效，已切换到当前用户默认工作区'
    : parsed.userId !== userId
      ? `workspacePath 属于 ${parsed.userId}，已切换到当前用户默认工作区`
      : 'workspacePath 不存在或不可写，已切换到当前用户默认工作区'

  return {
    workspacePath: entry.path,
    requestedWorkspacePath: normalizedRequested,
    requestedWorkspaceOwner: requestedOwner,
    resolvedWorkspaceOwner: userId,
    canWrite: true,
    reason,
    switchedFrom: normalizedRequested,
    switchedTo: entry.path,
    createdDefault: created,
  }
}
