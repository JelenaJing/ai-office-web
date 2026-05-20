/**
 * routes/workspaces.ts — Web workspace management API
 *
 * GET    /api/workspaces            — list all workspaces
 * POST   /api/workspaces            — create workspace
 * DELETE /api/workspaces            — delete workspace (body: { path })
 * GET    /api/workspaces/tree       — get file tree (?path=...)
 * POST   /api/workspaces/rename     — rename workspace
 * POST   /api/workspaces/register   — register existing workspace
 *
 * Workspaces are stored under server/data/workspaces/.
 * Metadata is persisted in server/data/workspaces/workspaces.json.
 * The `path` exposed to clients is "web-workspace:<safeName>" — never a server absolute path.
 */

import { Router } from 'express'
import fs from 'fs'
import path from 'path'

const router = Router()

// ── Storage paths ──────────────────────────────────────────────────────────────

const WORKSPACES_ROOT = path.resolve(__dirname, '../../../data/workspaces')
const METADATA_FILE = path.join(WORKSPACES_ROOT, 'workspaces.json')

// ── Types ─────────────────────────────────────────────────────────────────────

interface WorkspaceMeta {
  name: string
  safeName: string
  /** Stable opaque path token returned to the client */
  path: string
  createdAt: string
  modifiedAt: string
}

interface MetadataStore {
  workspaces: WorkspaceMeta[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Only allow safe chars to prevent path traversal / FS issues */
function toSafeName(name: string): string {
  return name
    .trim()
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9 _\-]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 80)
}

function ensureRoot(): void {
  fs.mkdirSync(WORKSPACES_ROOT, { recursive: true })
}

function readMetadata(): MetadataStore {
  ensureRoot()
  if (!fs.existsSync(METADATA_FILE)) {
    return { workspaces: [] }
  }
  try {
    return JSON.parse(fs.readFileSync(METADATA_FILE, 'utf-8')) as MetadataStore
  } catch {
    return { workspaces: [] }
  }
}

function writeMetadata(store: MetadataStore): void {
  ensureRoot()
  fs.writeFileSync(METADATA_FILE, JSON.stringify(store, null, 2), 'utf-8')
}

function workspaceDir(safeName: string): string {
  return path.join(WORKSPACES_ROOT, safeName)
}

function hasDocument(safeName: string): boolean {
  return fs.existsSync(path.join(workspaceDir(safeName), 'document.json'))
}

/** Convert metadata to the shape WorkspaceContext / electronAPI shim expect */
function toClientWorkspace(meta: WorkspaceMeta) {
  return {
    name: meta.name,
    path: meta.path,
    hasDocument: hasDocument(meta.safeName),
    modifiedAt: meta.modifiedAt,
  }
}

// ── GET /api/workspaces ────────────────────────────────────────────────────────

router.get('/', (_req, res) => {
  const store = readMetadata()
  // Filter out entries whose directories no longer exist
  const valid = store.workspaces.filter((m) => fs.existsSync(workspaceDir(m.safeName)))
  res.json({ workspaces: valid.map(toClientWorkspace) })
})

// ── POST /api/workspaces ───────────────────────────────────────────────────────

router.post('/', (req, res) => {
  const { name } = req.body as { name?: string; parentDir?: string }
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ success: false, error: '工作区名称不能为空' })
  }

  const safeName = toSafeName(name)
  if (!safeName) {
    return res.status(400).json({ success: false, error: '工作区名称包含非法字符' })
  }

  const store = readMetadata()
  const existing = store.workspaces.find((m) => m.safeName === safeName)
  if (existing) {
    // Idempotent: return existing workspace
    return res.json({ success: true, name: existing.name, path: existing.path })
  }

  const dir = workspaceDir(safeName)
  fs.mkdirSync(dir, { recursive: true })

  const now = new Date().toISOString()
  const clientPath = `web-workspace:${safeName}`
  const meta: WorkspaceMeta = {
    name: name.trim(),
    safeName,
    path: clientPath,
    createdAt: now,
    modifiedAt: now,
  }

  store.workspaces.push(meta)
  writeMetadata(store)

  return res.json({ success: true, name: meta.name, path: clientPath })
})

// ── DELETE /api/workspaces ────────────────────────────────────────────────────

router.delete('/', (req, res) => {
  const { path: clientPath } = req.body as { path?: string }
  if (!clientPath) {
    return res.status(400).json({ success: false, error: 'path is required' })
  }

  const store = readMetadata()
  const idx = store.workspaces.findIndex((m) => m.path === clientPath)
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Workspace not found' })
  }

  const meta = store.workspaces[idx]
  const dir = workspaceDir(meta.safeName)
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true })
  }

  store.workspaces.splice(idx, 1)
  writeMetadata(store)

  return res.json({ success: true })
})

// ── GET /api/workspaces/tree ──────────────────────────────────────────────────

router.get('/tree', (req, res) => {
  const clientPath = req.query['path'] as string | undefined
  if (!clientPath) {
    return res.status(400).json({ success: false, error: 'path query param required' })
  }

  // Resolve safeName from opaque token
  const store = readMetadata()
  const meta = store.workspaces.find((m) => m.path === clientPath)
  if (!meta) {
    return res.json([])
  }

  const dir = workspaceDir(meta.safeName)
  if (!fs.existsSync(dir)) {
    return res.json([])
  }

  // Build a shallow file tree (one level deep for Phase 1)
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    const tree = entries
      .filter((e) => !e.name.startsWith('.'))
      .map((e) => ({
        name: e.name,
        path: `${clientPath}/${e.name}`,
        isDirectory: e.isDirectory(),
        children: e.isDirectory() ? [] : undefined,
      }))
    return res.json(tree)
  } catch {
    return res.json([])
  }
})

// ── POST /api/workspaces/rename ───────────────────────────────────────────────

router.post('/rename', (req, res) => {
  const { path: clientPath, name: newName } = req.body as { path?: string; name?: string }
  if (!clientPath || !newName) {
    return res.status(400).json({ success: false, error: 'path and name required' })
  }

  const store = readMetadata()
  const meta = store.workspaces.find((m) => m.path === clientPath)
  if (!meta) {
    return res.status(404).json({ success: false, error: 'Workspace not found' })
  }

  const newSafeName = toSafeName(newName)
  const oldDir = workspaceDir(meta.safeName)
  const newDir = workspaceDir(newSafeName)

  if (oldDir !== newDir && fs.existsSync(oldDir)) {
    fs.renameSync(oldDir, newDir)
  }

  const newClientPath = `web-workspace:${newSafeName}`
  meta.name = newName.trim()
  meta.safeName = newSafeName
  meta.path = newClientPath
  meta.modifiedAt = new Date().toISOString()
  writeMetadata(store)

  return res.json({ success: true, name: meta.name, path: newClientPath })
})

// ── POST /api/workspaces/register ─────────────────────────────────────────────

router.post('/register', (req, res) => {
  const { path: clientPath } = req.body as { path?: string }
  // For web mode, "register" means ensure the workspace entry exists
  if (!clientPath) {
    return res.status(400).json({ success: false, error: 'path required' })
  }
  const store = readMetadata()
  const meta = store.workspaces.find((m) => m.path === clientPath)
  if (!meta) {
    return res.status(404).json({ success: false, error: 'Workspace not found' })
  }
  return res.json({ success: true, name: meta.name, path: meta.path })
})

export default router
