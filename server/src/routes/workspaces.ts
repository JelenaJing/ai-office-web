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
import { requireAccountIdentity, requireAccountUser } from '../lib/authUser'
import {
  hasDocument,
  readIndex,
  writeIndex,
  workspaceDir,
  parseClientPath,
  toSafeName,
} from '../lib/workspaceStore'
import {
  assertWorkspaceAccess,
  bootstrapWorkspaceForUser,
  createWorkspaceForUser,
  ensureWorkspaceMetadata,
  WorkspaceAccessError,
} from '../lib/workspaceAccess'

const router = Router()

function sendWorkspaceError(
  res: { status: (status: number) => { json: (body: unknown) => void } },
  error: unknown,
): void {
  const workspaceError = error instanceof WorkspaceAccessError ? error : null
  if (workspaceError) {
    res.status(workspaceError.status).json({
      success: false,
      code: workspaceError.code,
      error: workspaceError.message,
      bootstrap: workspaceError.bootstrap,
    })
    return
  }
  const message = error instanceof Error ? error.message : String(error)
  res.status(500).json({ success: false, error: message })
}

// ── GET /api/workspaces/default ───────────────────────────────────────────────
// Must be registered before dynamic routes.

router.get('/default', async (req, res) => {
  const user = await requireAccountIdentity(req, res)
  if (!user) return
  const bootstrapped = bootstrapWorkspaceForUser(user.id)
  console.info(`[workspace-default] userId=${user.id}`)
  console.info(`[workspace-default] username=${user.username}`)
  console.info(`[workspace-default] workspacePath=${bootstrapped.currentWorkspacePath}`)
  console.info(`[workspace-default] created=${bootstrapped.created}`)
  return res.json({
    success: true,
    ...bootstrapped,
    workspace: {
      ...bootstrapped.workspace,
      hasDocument: hasDocument(user.id, bootstrapped.currentWorkspaceId),
      modifiedAt: new Date().toISOString(),
    },
  })
})

router.post('/bootstrap', async (req, res) => {
  const user = await requireAccountIdentity(req, res)
  if (!user) return
  const expectedUserId = typeof req.body?.userId === 'string' ? req.body.userId.trim() : ''
  if (expectedUserId && expectedUserId !== user.id) {
    return res.status(403).json({ success: false, error: '当前登录用户与请求 bootstrap 的 userId 不一致' })
  }
  const bootstrapped = bootstrapWorkspaceForUser(user.id)
  return res.json({
    success: true,
    ...bootstrapped,
    workspace: {
      ...bootstrapped.workspace,
      hasDocument: hasDocument(user.id, bootstrapped.currentWorkspaceId),
      modifiedAt: new Date().toISOString(),
    },
  })
})

// ── GET /api/workspaces ───────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const bootstrapped = bootstrapWorkspaceForUser(userId)
  const store = readIndex(userId)
  const valid = store.workspaces.filter((ws) =>
    fs.existsSync(workspaceDir(userId, ws.id)),
  )
  res.json({
    currentTenantId: bootstrapped.currentTenantId,
    currentWorkspaceId: bootstrapped.currentWorkspaceId,
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

  const created = createWorkspaceForUser(userId, safeName)
  return res.json({
    success: true,
    currentTenantId: created.currentTenantId,
    currentWorkspaceId: created.currentWorkspaceId,
    name: created.workspace.name,
    path: created.workspace.path,
  })
})

// ── DELETE /api/workspaces ────────────────────────────────────────────────────

router.delete('/', async (req, res) => {
  const { path: p } = req.body as { path?: string }
  if (!p) return res.status(400).json({ success: false, error: 'path is required' })

  const parsed = parseClientPath(p)
  if (!parsed) return res.status(400).json({ success: false, error: 'Invalid workspace path' })

  const userId = await requireAccountUser(req, res)
  if (!userId) return
  try {
    assertWorkspaceAccess(userId, p, 'owner')
  } catch (error) {
    sendWorkspaceError(res, error)
    return
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
  try {
    assertWorkspaceAccess(userId, p, 'member')
  } catch (error) {
    sendWorkspaceError(res, error)
    return
  }

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
  try {
    assertWorkspaceAccess(userId, p, 'owner')
  } catch (error) {
    sendWorkspaceError(res, error)
    return
  }

  const store = readIndex(userId)
  const entry = store.workspaces.find((ws) => ws.id === parsed.wsId)
  if (!entry) return res.status(404).json({ success: false, error: 'Workspace not found' })

  entry.name = newName.trim()
  entry.modifiedAt = new Date().toISOString()
  writeIndex(userId, store)
  ensureWorkspaceMetadata(userId, entry, bootstrapWorkspaceForUser(userId).currentTenantId)

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
  try {
    assertWorkspaceAccess(userId, p, 'member')
  } catch (error) {
    sendWorkspaceError(res, error)
    return
  }

  const store = readIndex(userId)
  const entry = store.workspaces.find((ws) => ws.id === parsed.wsId)
  if (!entry) return res.status(404).json({ success: false, error: 'Workspace not found' })

  return res.json({ success: true, name: entry.name, path: entry.path })
})

export default router
