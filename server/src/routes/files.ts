/**
 * routes/files.ts — User file management API
 *
 * Files are stored in the user's default workspace:
 *   server/data/workspaces/{userId}/{workspaceId}/files/{fileId}/original
 *   server/data/workspaces/{userId}/{workspaceId}/files/files.json
 *
 * Routes:
 *   GET    /api/files                  — list files in default workspace
 *   POST   /api/files/upload           — upload a file (multipart/form-data)
 *   GET    /api/files/:fileId/download — download a file (ownership check)
 *   DELETE /api/files/:fileId          — delete a file
 */

import { Router } from 'express'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { requireAccountUser } from '../lib/authUser'
import { workspaceDir } from '../lib/workspaceStore'
import { uploadRateLimit } from '../middleware/rateLimit'
import { assertWorkspaceAccess, WorkspaceAccessError } from '../lib/workspaceAccess'
import { listUserFilesInWorkspace, readFilesIndex, resolveUserFile, type UserFileEntry } from '../lib/userFiles'

const router = Router()

// ── Allowed file types ────────────────────────────────────────────────────────

const ALLOWED_EXTS: Record<string, string> = {
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pdf: 'application/pdf',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv',
  txt: 'text/plain',
  md: 'text/markdown',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
}

// ── File metadata types ───────────────────────────────────────────────────────

// ── Multer config — store in memory, we write manually ────────────────────────

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
})

// ── Filesystem helpers ────────────────────────────────────────────────────────

function filesDir(userId: string, wsId: string): string {
  return path.join(workspaceDir(userId, wsId), 'files')
}

function writeFilesIndex(
  userId: string,
  wsId: string,
  index: ReturnType<typeof readFilesIndex>,
): void {
  const dir = filesDir(userId, wsId)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'files.json'), JSON.stringify(index, null, 2), 'utf-8')
}

function sendWorkspaceError(res: import('express').Response, error: unknown): void {
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

// ── GET /api/files ────────────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  try {
    const requestedWorkspacePath = typeof req.query.workspacePath === 'string' ? req.query.workspacePath : undefined
    const access = assertWorkspaceAccess(userId, requestedWorkspacePath, 'member')
    const files = listUserFilesInWorkspace(userId, access.workspacePath).map((item) => item.entry)
    return res.json({
      files,
      currentWorkspaceId: access.workspaceId,
      currentWorkspacePath: access.workspacePath,
    })
  } catch (error) {
    sendWorkspaceError(res, error)
  }
})

// ── Filename normalization ────────────────────────────────────────────────────
// multer/busboy often decodes UTF-8 filename bytes as latin1.
// Try latin1→utf8 repair, but only accept the repaired value when it looks better.

function normalizeUploadedFilename(name: string): string {
  if (!name) return 'unnamed'

  const repaired = Buffer.from(name, 'latin1').toString('utf8')
  const hasMojibake = /[ÃÂ\ufffd]|[\u00c0-\u00ff]/.test(name)
  const repairedHasReplacement = repaired.includes('\ufffd')

  const candidate = hasMojibake && !repairedHasReplacement ? repaired : name

  const base = candidate
    .replace(/[\\/]/g, '_')
    .replace(/[\x00-\x1f\x7f]/g, '')
    .trim()

  return base || 'unnamed'
}

// ── POST /api/files/upload ────────────────────────────────────────────────────

router.post('/upload', uploadRateLimit, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: '未收到文件（字段名应为 "file"）' })
  }

  const orig = normalizeUploadedFilename(req.file.originalname)
  const ext = path.extname(orig).slice(1).toLowerCase()
  if (!ALLOWED_EXTS[ext]) {
    return res.status(400).json({
      success: false,
      error: `不支持的文件类型 .${ext}。支持：${Object.keys(ALLOWED_EXTS).join(', ')}`,
    })
  }

  const userId = await requireAccountUser(req, res)
  if (!userId) return
  let access
  try {
    access = assertWorkspaceAccess(userId, typeof req.body?.workspacePath === 'string' ? req.body.workspacePath : undefined, 'editor')
  } catch (error) {
    sendWorkspaceError(res, error)
    return
  }

  const fileId = randomUUID()
  const fileDir = path.join(filesDir(userId, access.workspaceId), fileId)
  fs.mkdirSync(fileDir, { recursive: true })
  fs.writeFileSync(path.join(fileDir, 'original'), req.file.buffer)

  const entry: UserFileEntry = {
    id: fileId,
    name: orig,
    ext,
    mimeType: ALLOWED_EXTS[ext],
    size: req.file.size,
    uploadedAt: new Date().toISOString(),
  }

  const index = readFilesIndex(userId, access.workspaceId)
  index.files.unshift(entry)
  writeFilesIndex(userId, access.workspaceId, index)

  return res.json({
    success: true,
    file: entry,
    currentWorkspaceId: access.workspaceId,
    currentWorkspacePath: access.workspacePath,
  })
})

// ── GET /api/files/:fileId/download ──────────────────────────────────────────

router.get('/:fileId/download', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const resolved = resolveUserFile(
    userId,
    req.params.fileId,
    typeof req.query.workspacePath === 'string' ? req.query.workspacePath : undefined,
  )
  if (!resolved) {
    return res.status(404).json({ message: 'File not found' })
  }
  try {
    assertWorkspaceAccess(userId, resolved.workspacePath, 'member')
  } catch (error) {
    sendWorkspaceError(res, error)
    return
  }
  const filePath = resolved.absolutePath
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File missing on disk' })
  }

  const encodedName = encodeURIComponent(resolved.entry.name)
  res.setHeader('Content-Type', resolved.entry.mimeType)
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedName}`)
  res.sendFile(filePath)
})

// ── DELETE /api/files/:fileId ─────────────────────────────────────────────────

router.delete('/:fileId', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const resolved = resolveUserFile(
    userId,
    req.params.fileId,
    typeof req.query.workspacePath === 'string' ? req.query.workspacePath : undefined,
  )
  if (!resolved) {
    return res.status(404).json({ success: false, message: 'File not found' })
  }
  try {
    assertWorkspaceAccess(userId, resolved.workspacePath, 'editor')
  } catch (error) {
    sendWorkspaceError(res, error)
    return
  }

  const index = readFilesIndex(userId, resolved.workspaceId)
  const idx = index.files.findIndex((file) => file.id === req.params.fileId)
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'File not found' })
  }
  const entry = index.files[idx]
  const fileDir = path.join(filesDir(userId, resolved.workspaceId), entry.id)
  if (fs.existsSync(fileDir)) {
    fs.rmSync(fileDir, { recursive: true, force: true })
  }

  index.files.splice(idx, 1)
  writeFilesIndex(userId, resolved.workspaceId, index)

  return res.json({ success: true })
})

export default router
