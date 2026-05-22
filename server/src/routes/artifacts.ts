/**
 * routes/artifacts.ts — Artifacts download API
 *
 * GET /api/artifacts/:artifactId/download — 下载 artifact 文件（校验所有权）
 * GET /api/artifacts/:artifactId          — 获取 artifact 元数据
 *
 * Ownership check: the requesting user must match artifact.userId.
 * userId is resolved from Bearer token via AccountCenter /api/auth/me.
 * In production: missing/invalid token → 401. In dev: falls back to web-demo-user.
 */

import { Router } from 'express'
import path from 'path'
import fs from 'fs'
import { deleteArtifact, getArtifact, getArtifactFilePath, listArtifactsByUser, updateArtifact } from '../artifacts/ArtifactStore'
import { requireAccountUser } from '../lib/authUser'

const router = Router()

// ── Content-Type map ──────────────────────────────────────────────────────────

const CONTENT_TYPES: Record<string, string> = {
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  pdf: 'application/pdf',
  md: 'text/markdown; charset=utf-8',
  csv: 'text/csv; charset=utf-8',
  txt: 'text/plain; charset=utf-8',
  json: 'application/json; charset=utf-8',
  html: 'text/html; charset=utf-8',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
}

// ── GET /api/artifacts ────────────────────────────────────────────────────────
// Returns the current user's artifacts, sorted newest-first.

router.get('/', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const artifacts = listArtifactsByUser(userId)
  return res.json({ artifacts })
})

// ── GET /api/artifacts/:artifactId ────────────────────────────────────────────

router.get('/:artifactId', async (req, res) => {
  const artifact = getArtifact(req.params.artifactId)
  if (!artifact) {
    return res.status(404).json({ message: 'Artifact not found', artifactId: req.params.artifactId })
  }
  // Ownership check
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  if (artifact.userId && artifact.userId !== userId) {
    return res.status(403).json({ message: 'Access denied' })
  }
  return res.json({ artifact })
})

// ── GET /api/artifacts/:artifactId/download ───────────────────────────────────

router.get('/:artifactId/download', async (req, res) => {
  const { artifactId } = req.params
  const artifact = getArtifact(artifactId)

  if (!artifact) {
    return res.status(404).json({ message: 'Artifact not found', artifactId })
  }

  // Ownership check — reject cross-user downloads
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  if (artifact.userId && artifact.userId !== userId) {
    return res.status(403).json({ message: 'Access denied: artifact belongs to another user' })
  }

  const exportEntry =
    artifact.exports.find((e) => e.format === 'docx')
    ?? artifact.exports.find((e) => e.format === 'md')
    ?? artifact.exports[0]

  if (!exportEntry) {
    return res.status(404).json({ message: 'No downloadable export found', artifactId })
  }

  const filePath = getArtifactFilePath(artifactId, exportEntry.filename)
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'Artifact file missing on disk', artifactId })
  }

  const ext = path.extname(exportEntry.filename).slice(1).toLowerCase()
  const contentType = CONTENT_TYPES[ext] ?? 'application/octet-stream'
  const encodedName = encodeURIComponent(exportEntry.filename)

  res.setHeader('Content-Type', contentType)
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedName}`)
  res.sendFile(filePath)
})

router.get('/:artifactId/preview', async (req, res) => {
  const { artifactId } = req.params
  const artifact = getArtifact(artifactId)
  if (!artifact) {
    return res.status(404).json({ message: 'Artifact not found', artifactId })
  }
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  if (artifact.userId && artifact.userId !== userId) {
    return res.status(403).json({ message: 'Access denied' })
  }

  const exportEntry = artifact.exports[0]
  if (!exportEntry) {
    return res.status(404).json({ message: 'No previewable export found', artifactId })
  }
  const filePath = getArtifactFilePath(artifactId, exportEntry.filename)
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'Artifact file missing on disk', artifactId })
  }

  const ext = path.extname(exportEntry.filename).slice(1).toLowerCase()
  const previewable = ['md', 'txt', 'json', 'html', 'png', 'jpg', 'jpeg'].includes(ext)
  if (!previewable) {
    return res.json({
      artifact,
      preview: null,
      previewStatus: 'download-only',
      downloadUrl: `/api/artifacts/${artifactId}/download`,
    })
  }

  const contentType = CONTENT_TYPES[ext] ?? 'application/octet-stream'
  res.setHeader('Content-Type', contentType)
  return res.sendFile(filePath)
})

router.patch('/:artifactId', async (req, res) => {
  const { artifactId } = req.params
  const artifact = getArtifact(artifactId)
  if (!artifact) {
    return res.status(404).json({ message: 'Artifact not found', artifactId })
  }
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  if (artifact.userId && artifact.userId !== userId) {
    return res.status(403).json({ message: 'Access denied' })
  }
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : undefined
  if (!title) {
    return res.status(400).json({ message: 'title 不能为空' })
  }
  const updated = updateArtifact(artifactId, { title })
  return res.json({ artifact: updated })
})

router.delete('/:artifactId', async (req, res) => {
  const { artifactId } = req.params
  const artifact = getArtifact(artifactId)
  if (!artifact) {
    return res.status(404).json({ message: 'Artifact not found', artifactId })
  }
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  if (artifact.userId && artifact.userId !== userId) {
    return res.status(403).json({ message: 'Access denied' })
  }
  deleteArtifact(artifactId)
  return res.json({ success: true, artifactId })
})

export default router
