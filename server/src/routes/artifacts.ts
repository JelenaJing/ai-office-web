/**
 * routes/artifacts.ts — Artifacts download API
 *
 * GET /api/artifacts/:artifactId/download — 下载 artifact 文件
 * GET /api/artifacts/:artifactId          — 获取 artifact 元数据
 */

import { Router } from 'express'
import path from 'path'
import fs from 'fs'
import { getArtifact, getArtifactFilePath } from '../artifacts/ArtifactStore'

const router = Router()

const CONTENT_TYPES: Record<string, string> = {
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  pdf: 'application/pdf',
}

// GET /api/artifacts/:artifactId
router.get('/:artifactId', (req, res) => {
  const artifact = getArtifact(req.params.artifactId)
  if (!artifact) {
    return res.status(404).json({ message: 'Artifact not found', artifactId: req.params.artifactId })
  }
  return res.json({ artifact })
})

// GET /api/artifacts/:artifactId/download
router.get('/:artifactId/download', (req, res) => {
  const { artifactId } = req.params
  const artifact = getArtifact(artifactId)

  if (!artifact) {
    return res.status(404).json({ message: 'Artifact not found', artifactId })
  }

  const docxExport = artifact.exports.find((e) => e.format === 'docx')
    ?? artifact.exports[0]

  if (!docxExport) {
    return res.status(404).json({ message: 'No downloadable export found', artifactId })
  }

  const filePath = getArtifactFilePath(artifactId, docxExport.filename)
  if (!fs.existsSync(filePath)) {
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
