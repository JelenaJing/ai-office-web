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
import {
  resolveUserId,
  getOrCreateDefaultWorkspace,
  workspaceDir,
} from '../lib/workspaceStore'

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

interface FileEntry {
  id: string
  name: string
  ext: string
  mimeType: string
  size: number
  uploadedAt: string
}

interface FilesIndex {
  files: FileEntry[]
}

// ── Multer config — store in memory, we write manually ────────────────────────

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
})

// ── Filesystem helpers ────────────────────────────────────────────────────────

function filesDir(userId: string, wsId: string): string {
  return path.join(workspaceDir(userId, wsId), 'files')
}

function readFilesIndex(userId: string, wsId: string): FilesIndex {
  const dir = filesDir(userId, wsId)
  fs.mkdirSync(dir, { recursive: true })
  const p = path.join(dir, 'files.json')
  if (!fs.existsSync(p)) return { files: [] }
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8')) as FilesIndex
  } catch {
    return { files: [] }
  }
}

function writeFilesIndex(userId: string, wsId: string, index: FilesIndex): void {
  const dir = filesDir(userId, wsId)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'files.json'), JSON.stringify(index, null, 2), 'utf-8')
}

// ── GET /api/files ────────────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  const userId = await resolveUserId(req)
  const ws = getOrCreateDefaultWorkspace(userId)
  const index = readFilesIndex(userId, ws.id)
  return res.json({ files: index.files })
})

// ── POST /api/files/upload ────────────────────────────────────────────────────

router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: '未收到文件（字段名应为 "file"）' })
  }

  const orig = req.file.originalname
  const ext = path.extname(orig).slice(1).toLowerCase()
  if (!ALLOWED_EXTS[ext]) {
    return res.status(400).json({
      success: false,
      error: `不支持的文件类型 .${ext}。支持：${Object.keys(ALLOWED_EXTS).join(', ')}`,
    })
  }

  const userId = await resolveUserId(req)
  const ws = getOrCreateDefaultWorkspace(userId)

  const fileId = randomUUID()
  const fileDir = path.join(filesDir(userId, ws.id), fileId)
  fs.mkdirSync(fileDir, { recursive: true })
  fs.writeFileSync(path.join(fileDir, 'original'), req.file.buffer)

  const entry: FileEntry = {
    id: fileId,
    name: orig,
    ext,
    mimeType: ALLOWED_EXTS[ext],
    size: req.file.size,
    uploadedAt: new Date().toISOString(),
  }

  const index = readFilesIndex(userId, ws.id)
  index.files.unshift(entry)
  writeFilesIndex(userId, ws.id, index)

  return res.json({ success: true, file: entry })
})

// ── GET /api/files/:fileId/download ──────────────────────────────────────────

router.get('/:fileId/download', async (req, res) => {
  const userId = await resolveUserId(req)
  const ws = getOrCreateDefaultWorkspace(userId)

  const index = readFilesIndex(userId, ws.id)
  const entry = index.files.find((f) => f.id === req.params.fileId)
  if (!entry) {
    return res.status(404).json({ message: 'File not found' })
  }

  const filePath = path.join(filesDir(userId, ws.id), entry.id, 'original')
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File missing on disk' })
  }

  const encodedName = encodeURIComponent(entry.name)
  res.setHeader('Content-Type', entry.mimeType)
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedName}`)
  res.sendFile(filePath)
})

// ── DELETE /api/files/:fileId ─────────────────────────────────────────────────

router.delete('/:fileId', async (req, res) => {
  const userId = await resolveUserId(req)
  const ws = getOrCreateDefaultWorkspace(userId)

  const index = readFilesIndex(userId, ws.id)
  const idx = index.files.findIndex((f) => f.id === req.params.fileId)
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'File not found' })
  }

  const entry = index.files[idx]
  const fileDir = path.join(filesDir(userId, ws.id), entry.id)
  if (fs.existsSync(fileDir)) {
    fs.rmSync(fileDir, { recursive: true, force: true })
  }

  index.files.splice(idx, 1)
  writeFilesIndex(userId, ws.id, index)

  return res.json({ success: true })
})

export default router
