/**
 * routes/workspaces.ts — User-scoped web workspace API
 *
 * All workspace data is isolated by userId.
 * Storage layout: server/data/workspaces/{userId}/{workspaceId}/
 * Path token: "web-workspace:{userId}:{workspaceId}"
 *
 * Routes:
 *   GET    /api/workspaces/default            — get or create default workspace
 *   GET    /api/workspaces                    — list user's workspaces
 *   POST   /api/workspaces                    — create workspace
 *   DELETE /api/workspaces                    — delete workspace (body: { path })
 *   GET    /api/workspaces/tree?path=...      — get file tree
 *   POST   /api/workspaces/rename             — rename workspace
 *   POST   /api/workspaces/register           — no-op (web compat)
 */

import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { requireAccountUser } from '../lib/authUser'
import {
  getOrCreateDefaultWorkspace,
  hasDocument,
  readIndex,
  writeIndex,
  workspaceDir,
  clientPath,
  parseClientPath,
  toSafeName,
} from '../lib/workspaceStore'

const router = Router()

// ── GET /api/workspaces/default ───────────────────────────────────────────────
// Must be registered before dynamic routes.

router.get('/default', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const entry = getOrCreateDefaultWorkspace(userId)
  return res.json({
    success: true,
    workspace: {
      name: entry.name,
      path: entry.path,
      hasDocument: hasDocument(userId, entry.id),
      modifiedAt: entry.modifiedAt,
      isDefault: true,
    },
  })
})

// ── GET /api/workspaces ───────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const store = readIndex(userId)
  const valid = store.workspaces.filter((ws) =>
    fs.existsSync(workspaceDir(userId, ws.id)),
  )
  res.json({
    workspaces: valid.map((ws) => ({
      name: ws.name,
      path: ws.path,
      hasDocument: hasDocument(userId, ws.id),
      modifiedAt: ws.modifiedAt,
      isDefault: ws.isDefault ?? false,
    })),
  })
})

// ── POST /api/workspaces ──────────────────────────────────────────────────────

router.post('/', async (req, res) => {
  const { name } = req.body as { name?: string }
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ success: false, error: '工作区名称不能为空' })
  }

  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const safeName = toSafeName(name)
  if (!safeName) {
    return res.status(400).json({ success: false, error: '工作区名称包含非法字符' })
  }

  const store = readIndex(userId)
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
  const entry = { id: wsId, name: name.trim(), path: wsPath, createdAt: now, modifiedAt: now }
  store.workspaces.push(entry)
  writeIndex(userId, store)

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

  const userId = await requireAccountUser(req, res)
  if (!userId) return
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

  const userId = await requireAccountUser(req, res)
  if (!userId) return
  if (parsed.userId !== userId) return res.status(403).json({ success: false, error: 'Forbidden' })

  const filesDir = path.join(workspaceDir(userId, parsed.wsId), 'files')
  if (!fs.existsSync(filesDir)) return res.json([])

  try {
    const entries = fs.readdirSync(filesDir, { withFileTypes: true })
    return res.json(
      entries
        .filter((e) => !e.name.startsWith('.') && e.name !== 'files.json')
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

  const userId = await requireAccountUser(req, res)
  if (!userId) return
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

  const userId = await requireAccountUser(req, res)
  if (!userId) return
  if (parsed.userId !== userId) return res.status(403).json({ success: false, error: 'Forbidden' })

  const store = readIndex(userId)
  const entry = store.workspaces.find((ws) => ws.id === parsed.wsId)
  if (!entry) return res.status(404).json({ success: false, error: 'Workspace not found' })

  return res.json({ success: true, name: entry.name, path: entry.path })
})

export default router
