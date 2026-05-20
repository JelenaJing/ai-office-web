/**
 * routes/workspaces.ts — User-scoped web workspace API
 *
 * All workspace data is isolated by userId.
 * userId is resolved from the Bearer token via AccountCenter /api/auth/me.
 * Falls back to 'web-demo-user' in development when no token is present.
 *
 * Storage layout:
 *   server/data/workspaces/{userId}/workspaces.json     — user's workspace index
 *   server/data/workspaces/{userId}/{workspaceId}/workspace.json
 *   server/data/workspaces/{userId}/{workspaceId}/files/
 *   server/data/workspaces/{userId}/{workspaceId}/artifacts/
 *
 * Path token returned to client: "web-workspace:{userId}:{workspaceId}"
 * This token is opaque and never exposes server filesystem paths.
 *
 * Routes:
 *   GET    /api/workspaces                  — list user's workspaces
 *   POST   /api/workspaces                  — create workspace
 *   DELETE /api/workspaces                  — delete workspace (body: { path })
 *   GET    /api/workspaces/tree?path=...    — get file tree for workspace
 *   POST   /api/workspaces/rename           — rename workspace
 *   POST   /api/workspaces/register         — no-op register (web compatibility)
 */

import { Router } from 'express'
import type { Request } from 'express'
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

const router = Router()

// ── Constants ─────────────────────────────────────────────────────────────────

const WORKSPACES_ROOT = path.resolve(__dirname, '../../data/workspaces')
const AC_URL = process.env.ACCOUNT_CENTER_URL ?? 'http://10.20.5.61:13100'
/** Fallback used only in dev when no token is present. */
const DEV_FALLBACK_USER = 'web-demo-user'

// ── Types ─────────────────────────────────────────────────────────────────────

interface WorkspaceEntry {
  id: string
  name: string
  /** Opaque token: "web-workspace:{userId}:{id}" */
  path: string
  createdAt: string
  modifiedAt: string
}

interface WorkspaceIndex {
  workspaces: WorkspaceEntry[]
}

// ── userId resolution ─────────────────────────────────────────────────────────

async function resolveUserId(req: Request): Promise<string> {
  const auth = req.headers['authorization']
  if (!auth || !auth.startsWith('Bearer ')) {
    // DEV FALLBACK: no token → use demo user (acceptable for local dev only)
    return DEV_FALLBACK_USER
  }
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

// ── Filesystem helpers ────────────────────────────────────────────────────────

function userRoot(userId: string): string {
  // Sanitise userId so it cannot escape the storage directory
  const safe = userId.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 64)
  return path.join(WORKSPACES_ROOT, safe)
}

function indexPath(userId: string): string {
  return path.join(userRoot(userId), 'workspaces.json')
}

function workspaceDir(userId: string, wsId: string): string {
  const safe = wsId.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 64)
  return path.join(userRoot(userId), safe)
}

function readIndex(userId: string): WorkspaceIndex {
  fs.mkdirSync(userRoot(userId), { recursive: true })
  const p = indexPath(userId)
  if (!fs.existsSync(p)) return { workspaces: [] }
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8')) as WorkspaceIndex
  } catch {
    return { workspaces: [] }
  }
}

function writeIndex(userId: string, store: WorkspaceIndex): void {
  fs.mkdirSync(userRoot(userId), { recursive: true })
  fs.writeFileSync(indexPath(userId), JSON.stringify(store, null, 2), 'utf-8')
}

function toSafeName(name: string): string {
  // Allow CJK, alphanumeric, space, underscore, hyphen — strip everything else
  return name
    .trim()
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9 _\-]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 80)
}

function hasDocument(userId: string, wsId: string): boolean {
  return fs.existsSync(path.join(workspaceDir(userId, wsId), 'workspace.json'))
}

function clientPath(userId: string, wsId: string): string {
  return `web-workspace:${userId}:${wsId}`
}

function parseClientPath(p: string): { userId: string; wsId: string } | null {
  const m = p.match(/^web-workspace:([^:]+):(.+)$/)
  if (!m) return null
  return { userId: m[1], wsId: m[2] }
}

// ── GET /api/workspaces ────────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  const userId = await resolveUserId(req)
  const store = readIndex(userId)
  // Filter entries whose directories still exist on disk
  const valid = store.workspaces.filter((ws) =>
    fs.existsSync(workspaceDir(userId, ws.id)),
  )
  res.json({
    workspaces: valid.map((ws) => ({
      name: ws.name,
      path: ws.path,
      hasDocument: hasDocument(userId, ws.id),
      modifiedAt: ws.modifiedAt,
    })),
  })
})

// ── POST /api/workspaces ───────────────────────────────────────────────────────

router.post('/', async (req, res) => {
  const { name } = req.body as { name?: string }
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ success: false, error: '工作区名称不能为空' })
  }

  const userId = await resolveUserId(req)
  const safeName = toSafeName(name)
  if (!safeName) {
    return res.status(400).json({ success: false, error: '工作区名称包含非法字符' })
  }

  const store = readIndex(userId)

  // Idempotent: if a workspace with same name exists, return it
  const existing = store.workspaces.find((ws) => ws.name === name.trim())
  if (existing) {
    return res.json({ success: true, name: existing.name, path: existing.path })
  }

  const wsId = randomUUID()
  const wsPath = clientPath(userId, wsId)
  const dir = workspaceDir(userId, wsId)
  fs.mkdirSync(path.join(dir, 'files'), { recursive: true })
  fs.mkdirSync(path.join(dir, 'artifacts'), { recursive: true })

  const now = new Date().toISOString()
  const entry: WorkspaceEntry = {
    id: wsId,
    name: name.trim(),
    path: wsPath,
    createdAt: now,
    modifiedAt: now,
  }
  store.workspaces.push(entry)
  writeIndex(userId, store)

  // Write workspace.json so hasDocument check can detect it
  fs.writeFileSync(
    path.join(dir, 'workspace.json'),
    JSON.stringify({ id: wsId, name: name.trim(), userId, createdAt: now }, null, 2),
    'utf-8',
  )

  return res.json({ success: true, name: entry.name, path: wsPath })
})

// ── DELETE /api/workspaces ────────────────────────────────────────────────────

router.delete('/', async (req, res) => {
  const { path: p } = req.body as { path?: string }
  if (!p) return res.status(400).json({ success: false, error: 'path is required' })

  const parsed = parseClientPath(p)
  if (!parsed) return res.status(400).json({ success: false, error: 'Invalid workspace path' })

  const userId = await resolveUserId(req)
  // Security: user can only delete their own workspaces
  if (parsed.userId !== userId) {
    return res.status(403).json({ success: false, error: 'Forbidden' })
  }

  const store = readIndex(userId)
  const idx = store.workspaces.findIndex((ws) => ws.id === parsed.wsId)
  if (idx === -1) return res.status(404).json({ success: false, error: 'Workspace not found' })

  const dir = workspaceDir(userId, parsed.wsId)
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true })

  store.workspaces.splice(idx, 1)
  writeIndex(userId, store)

  return res.json({ success: true })
})

// ── GET /api/workspaces/tree ──────────────────────────────────────────────────

router.get('/tree', async (req, res) => {
  const p = req.query['path'] as string | undefined
  if (!p) return res.status(400).json({ success: false, error: 'path query param required' })

  const parsed = parseClientPath(p)
  if (!parsed) return res.json([])

  const userId = await resolveUserId(req)
  if (parsed.userId !== userId) return res.status(403).json({ success: false, error: 'Forbidden' })

  const filesDir = path.join(workspaceDir(userId, parsed.wsId), 'files')
  if (!fs.existsSync(filesDir)) return res.json([])

  try {
    const entries = fs.readdirSync(filesDir, { withFileTypes: true })
    return res.json(
      entries
        .filter((e) => !e.name.startsWith('.'))
        .map((e) => ({
          name: e.name,
          path: `${p}/files/${e.name}`,
          isDirectory: e.isDirectory(),
          children: e.isDirectory() ? [] : undefined,
        })),
    )
  } catch {
    return res.json([])
  }
})

// ── POST /api/workspaces/rename ───────────────────────────────────────────────

router.post('/rename', async (req, res) => {
  const { path: p, name: newName } = req.body as { path?: string; name?: string }
  if (!p || !newName) return res.status(400).json({ success: false, error: 'path and name required' })

  const parsed = parseClientPath(p)
  if (!parsed) return res.status(400).json({ success: false, error: 'Invalid workspace path' })

  const userId = await resolveUserId(req)
  if (parsed.userId !== userId) return res.status(403).json({ success: false, error: 'Forbidden' })

  const store = readIndex(userId)
  const entry = store.workspaces.find((ws) => ws.id === parsed.wsId)
  if (!entry) return res.status(404).json({ success: false, error: 'Workspace not found' })

  entry.name = newName.trim()
  entry.modifiedAt = new Date().toISOString()
  writeIndex(userId, store)

  return res.json({ success: true, name: entry.name, path: entry.path })
})

// ── POST /api/workspaces/register ─────────────────────────────────────────────

router.post('/register', async (req, res) => {
  const { path: p } = req.body as { path?: string }
  if (!p) return res.status(400).json({ success: false, error: 'path required' })

  const parsed = parseClientPath(p)
  if (!parsed) return res.status(400).json({ success: false, error: 'Invalid workspace path' })

  const userId = await resolveUserId(req)
  if (parsed.userId !== userId) return res.status(403).json({ success: false, error: 'Forbidden' })

  const store = readIndex(userId)
  const entry = store.workspaces.find((ws) => ws.id === parsed.wsId)
  if (!entry) return res.status(404).json({ success: false, error: 'Workspace not found' })

  return res.json({ success: true, name: entry.name, path: entry.path })
})

export default router
