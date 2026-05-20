/**
 * routes/artifacts.ts — Artifacts download API
 *
 * GET /api/artifacts/:artifactId/download — 下载 artifact 文件（校验所有权）
 * GET /api/artifacts/:artifactId          — 获取 artifact 元数据
 *
 * Ownership check: the requesting user must match artifact.userId.
 * userId is resolved from Bearer token via AccountCenter /api/auth/me.
 * Falls back to 'web-demo-user' when no token is present (dev only).
 */

import { Router } from 'express'
import type { Request } from 'express'
import path from 'path'
import fs from 'fs'
import { getArtifact, getArtifactFilePath } from '../artifacts/ArtifactStore'

const router = Router()

const AC_URL = process.env.ACCOUNT_CENTER_URL ?? 'http://10.20.5.61:13100'
const DEV_FALLBACK_USER = 'web-demo-user'

// ── userId resolution (mirrors workspaces.ts) ─────────────────────────────────

async function resolveUserId(req: Request): Promise<string> {
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

// ── Content-Type map ──────────────────────────────────────────────────────────

const CONTENT_TYPES: Record<string, string> = {
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  pdf: 'application/pdf',
}

// ── GET /api/artifacts/:artifactId ────────────────────────────────────────────

router.get('/:artifactId', async (req, res) => {
  const artifact = getArtifact(req.params.artifactId)
  if (!artifact) {
    return res.status(404).json({ message: 'Artifact not found', artifactId: req.params.artifactId })
  }
  // Ownership check
  const userId = await resolveUserId(req)
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
  const userId = await resolveUserId(req)
  if (artifact.userId && artifact.userId !== userId) {
    return res.status(403).json({ message: 'Access denied: artifact belongs to another user' })
  }

  const docxExport = artifact.exports.find((e) => e.format === 'docx')
    ?? artifact.exports[0]

  if (!docxExport) {
    return res.status(404).json({ message: 'No downloadable export found', artifactId })
  }

  const filePath = getArtifactFilePath(artifactId, docxExport.filename)
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'Artifact file missing on disk', artifactId })
  }

  const ext = path.extname(docxExport.filename).slice(1).toLowerCase()
  const contentType = CONTENT_TYPES[ext] ?? 'application/octet-stream'
  const encodedName = encodeURIComponent(artifact.title + '.' + ext)

  res.setHeader('Content-Type', contentType)
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedName}`)
  res.sendFile(filePath)
})

export default router
