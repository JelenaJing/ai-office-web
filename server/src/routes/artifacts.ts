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
import {
  getHtmlArtifact,
  getHtmlArtifactFilePath,
  getHtmlArtifactSidecarPath,
  getHtmlArtifactDir,
} from '../features/artifact-jobs/services/htmlArtifactStore'
import { retemplateHtmlPresentationFromContentModel } from '../features/artifact-jobs/services/htmlPresentationRetemplateService'
import {
  applyHtmlPresentationPatch,
  generateHtmlPresentationImage,
} from '../features/artifact-jobs/services/htmlPresentationPatchService'
import { requireAccountUser } from '../lib/authUser'
import { saveSkillArtifact } from '../lib/skillArtifact'
import { assertWorkspaceAccess, WorkspaceAccessError } from '../lib/workspaceAccess'

const router = Router()
const HTML_PPT_SIDECAR_FILES = new Set(['content-model.json', 'template-profile.json', 'candidate-templates.json'])

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

function assertArtifactOwnership(
  userId: string,
  artifact: { userId: string },
  res: import('express').Response,
): boolean {
  if (artifact.userId === userId) return true
  res.status(403).json({ success: false, error: '无权访问该 artifact。' })
  return false
}

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
  svg: 'image/svg+xml; charset=utf-8',
}

// ── GET /api/artifacts ────────────────────────────────────────────────────────
// Returns the current user's artifacts, sorted newest-first.

router.get('/', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  try {
    const requestedWorkspacePath = typeof req.query.workspacePath === 'string' ? req.query.workspacePath : undefined
    const access = assertWorkspaceAccess(userId, requestedWorkspacePath, 'member')
    const artifacts = listArtifactsByUser(userId).filter((artifact) => artifact.workspaceId === access.workspaceId)
    return res.json({
      artifacts,
      currentWorkspaceId: access.workspaceId,
      currentWorkspacePath: access.workspacePath,
    })
  } catch (error) {
    sendWorkspaceError(res, error)
  }
})

router.post('/', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  let access
  try {
    access = assertWorkspaceAccess(userId, typeof req.body?.workspacePath === 'string' ? req.body.workspacePath : undefined, 'editor')
  } catch (error) {
    sendWorkspaceError(res, error)
    return
  }
  const title = String(req.body?.title || 'Artifact').trim()
  const format = String(req.body?.format || 'txt').trim().replace(/^\./, '') || 'txt'
  const filename = String(req.body?.filename || `${title}.${format}`).trim()
  const content = typeof req.body?.contentBase64 === 'string'
    ? Buffer.from(req.body.contentBase64, 'base64')
    : String(req.body?.content || '')
  try {
    const artifact = saveSkillArtifact({
      userId,
      workspacePath: access.workspacePath,
      skillId: typeof req.body?.skillId === 'string' ? req.body.skillId : 'web.artifact.create',
      type: typeof req.body?.type === 'string' ? req.body.type : 'document',
      title,
      filename,
      format,
      content,
      sourceRefs: Array.isArray(req.body?.sourceRefs) ? req.body.sourceRefs : undefined,
      knowledgeRefs: Array.isArray(req.body?.knowledgeRefs) ? req.body.knowledgeRefs : undefined,
      matterId: typeof req.body?.matterId === 'string' ? req.body.matterId : undefined,
      emailId: typeof req.body?.emailId === 'string' ? req.body.emailId : undefined,
      deckId: typeof req.body?.deckId === 'string' ? req.body.deckId : undefined,
      documentId: typeof req.body?.documentId === 'string' ? req.body.documentId : undefined,
    })
    return res.status(201).json({ success: true, artifact })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return res.status(400).json({ success: false, error: message })
  }
})

router.get('/:artifactId/file', async (req, res) => {
  const { artifactId } = req.params
  const artifact = getHtmlArtifact(artifactId)
  if (!artifact) {
    return res.status(404).json({ message: 'Artifact file not found', artifactId })
  }
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  if (!assertArtifactOwnership(userId, artifact, res)) return

  const filePath = getHtmlArtifactFilePath(artifactId)
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'Artifact file missing on disk', artifactId })
  }

  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Content-Disposition', 'inline; filename="index.html"')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  return res.sendFile(filePath)
})

router.get('/:artifactId/sidecars/:filename', async (req, res) => {
  const { artifactId, filename } = req.params
  if (!HTML_PPT_SIDECAR_FILES.has(filename)) {
    return res.status(404).json({ success: false, error: 'Sidecar not found' })
  }
  const artifact = getHtmlArtifact(artifactId)
  if (!artifact) {
    return res.status(404).json({ success: false, error: 'Artifact not found', artifactId })
  }
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  if (!assertArtifactOwnership(userId, artifact, res)) return
  const filePath = getHtmlArtifactSidecarPath(artifactId, filename)
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, error: 'Sidecar missing on disk', artifactId, filename })
  }
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  return res.sendFile(filePath)
})

// TODO(phase-2): add POST /api/html-ppt/:artifactId/patch to persist local edit patches.
// Phase 1 only stores patch history in localStorage inside the generated HTML runtime.

// ── POST /api/artifacts/:artifactId/html-presentation/retemplate ────────────

router.post('/:artifactId/html-presentation/retemplate', async (req, res) => {
  const { artifactId } = req.params
  const { templateSlug } = req.body as { templateSlug?: string }
  if (!templateSlug) return res.status(400).json({ success: false, error: 'templateSlug is required' })

  const artifact = getHtmlArtifact(artifactId)
  if (!artifact) return res.status(404).json({ success: false, error: 'Artifact not found', artifactId })

  const userId = await requireAccountUser(req, res)
  if (!userId) return
  if (!assertArtifactOwnership(userId, artifact, res)) return

  const artifactDirPath = getHtmlArtifactDir(artifactId)
  const contentModelPath = path.join(artifactDirPath, 'content-model.json')
  if (!fs.existsSync(contentModelPath)) {
    return res.status(404).json({ success: false, error: 'content-model.json not found for this artifact', artifactId })
  }
  const outputHtmlPath = path.join(artifactDirPath, 'index.html')

  try {
    const result = retemplateHtmlPresentationFromContentModel({
      contentModelPath,
      outputHtmlPath,
      nextTemplateSlug: templateSlug,
      artifactDir: artifactDirPath,
    })
    return res.json({
      success: true,
      artifactId,
      templateSlug: result.templateSlug,
      tokenUsed: false,
      previewUrl: `/api/artifacts/${artifactId}/file`,
      sidecars: result.sidecars,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return res.status(500).json({ success: false, error: message })
  }
})

// ── POST /api/artifacts/:artifactId/html-presentation/patch ─────────────────

router.post('/:artifactId/html-presentation/patch', async (req, res) => {
  const { artifactId } = req.params
  const { op, slideId, blockId, text } = req.body as { op?: string; slideId?: string; blockId?: string; text?: string }

  if (op !== 'replace_text') return res.status(400).json({ success: false, error: 'op must be replace_text' })
  if (!slideId || !blockId || text === undefined) {
    return res.status(400).json({ success: false, error: 'slideId, blockId, text are required' })
  }

  const artifact = getHtmlArtifact(artifactId)
  if (!artifact) return res.status(404).json({ success: false, error: 'Artifact not found', artifactId })

  const userId = await requireAccountUser(req, res)
  if (!userId) return
  if (!assertArtifactOwnership(userId, artifact, res)) return

  const artifactDirPath = getHtmlArtifactDir(artifactId)
  try {
    const result = await applyHtmlPresentationPatch(artifactDirPath, { op: 'replace_text', slideId, blockId, text })
    return res.json({ ...result, artifactId })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return res.status(500).json({ success: false, error: message })
  }
})

// ── POST /api/artifacts/:artifactId/html-presentation/image ─────────────────

router.post('/:artifactId/html-presentation/image', async (req, res) => {
  const { artifactId } = req.params
  const { slideId, blockId, imagePrompt } = req.body as { slideId?: string; blockId?: string; imagePrompt?: string }

  if (!slideId || !blockId || !imagePrompt) {
    return res.status(400).json({ success: false, error: 'slideId, blockId, imagePrompt are required' })
  }

  const artifact = getHtmlArtifact(artifactId)
  if (!artifact) return res.status(404).json({ success: false, error: 'Artifact not found', artifactId })

  const userId = await requireAccountUser(req, res)
  if (!userId) return
  if (!assertArtifactOwnership(userId, artifact, res)) return

  const artifactDirPath = getHtmlArtifactDir(artifactId)
  try {
    const result = await generateHtmlPresentationImage(artifactDirPath, { slideId, blockId, imagePrompt })
    return res.json({ ...result, artifactId })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return res.status(500).json({ success: false, error: message })
  }
})

// ── GET /api/artifacts/:artifactId/assets/:filename ──────────────────────────

router.get('/:artifactId/assets/:filename', async (req, res) => {
  const { artifactId, filename } = req.params
  // Block path traversal
  if (filename.includes('/') || filename.includes('..')) {
    return res.status(400).json({ success: false, error: 'Invalid filename' })
  }
  const artifact = getHtmlArtifact(artifactId)
  if (!artifact) return res.status(404).json({ success: false, error: 'Artifact not found', artifactId })

  const userId = await requireAccountUser(req, res)
  if (!userId) return
  if (!assertArtifactOwnership(userId, artifact, res)) return

  const filePath = path.join(getHtmlArtifactDir(artifactId), 'assets', filename)
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, error: 'Asset not found', filename })
  }
  res.setHeader('Cache-Control', 'public, max-age=86400')
  return res.sendFile(filePath)
})



router.get('/:artifactId', async (req, res) => {
  const artifact = getArtifact(req.params.artifactId)
  if (!artifact) {
    return res.status(404).json({ message: 'Artifact not found', artifactId: req.params.artifactId })
  }
  // Ownership check
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  if (!assertArtifactOwnership(userId, artifact, res)) return
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
  if (!assertArtifactOwnership(userId, artifact, res)) return

  const requestedFilename = typeof req.query.filename === 'string' ? req.query.filename : ''
  const requestedFormat = typeof req.query.format === 'string' ? req.query.format : ''
  const exportEntry =
    (requestedFilename ? artifact.exports.find((e) => e.filename === requestedFilename) : undefined)
    ?? (requestedFormat ? artifact.exports.find((e) => e.format === requestedFormat) : undefined)
    ?? artifact.exports.find((e) => e.format === 'docx')
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
  if (!assertArtifactOwnership(userId, artifact, res)) return

  const exportEntry = artifact.exports[0]
  if (!exportEntry) {
    return res.status(404).json({ message: 'No previewable export found', artifactId })
  }
  const filePath = getArtifactFilePath(artifactId, exportEntry.filename)
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'Artifact file missing on disk', artifactId })
  }

  const ext = path.extname(exportEntry.filename).slice(1).toLowerCase()
  const previewable = ['md', 'txt', 'json', 'html', 'png', 'jpg', 'jpeg', 'svg'].includes(ext)
  if (!previewable) {
    return res.json({
      artifact,
      preview: null,
      previewStatus: 'download-only',
      previewCapabilities: {
        inline: false,
        download: true,
        reason: `.${ext || 'unknown'} preview is not supported inline`,
      },
      downloadUrl: `/api/artifacts/${artifactId}/download`,
    })
  }

  const contentType = CONTENT_TYPES[ext] ?? 'application/octet-stream'
  res.setHeader('Content-Type', contentType)
  return res.sendFile(filePath)
})

router.get('/:artifactId/relationships', async (req, res) => {
  const { artifactId } = req.params
  const artifact = getArtifact(artifactId)
  if (!artifact) {
    return res.status(404).json({ message: 'Artifact not found', artifactId })
  }
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  if (!assertArtifactOwnership(userId, artifact, res)) return
  return res.json({
    artifactId,
    sourceRefs: artifact.sourceRefs ?? [],
    knowledgeRefs: artifact.knowledgeRefs ?? [],
    matterId: artifact.matterId,
    emailId: artifact.emailId,
    deckId: artifact.deckId,
    documentId: artifact.documentId,
    graph: {
      nodes: [
        { id: artifact.id, type: 'artifact', label: artifact.title },
        ...(artifact.sourceRefs ?? []).map((ref) => ({ id: ref.id, type: ref.type, label: ref.label ?? ref.id })),
        ...(artifact.knowledgeRefs ?? []).map((ref) => ({ id: ref.documentId, type: 'knowledge', label: ref.title ?? ref.documentId })),
      ],
      edges: [
        ...(artifact.sourceRefs ?? []).map((ref) => ({ from: ref.id, to: artifact.id, relation: 'source' })),
        ...(artifact.knowledgeRefs ?? []).map((ref) => ({ from: ref.documentId, to: artifact.id, relation: 'knowledge' })),
      ],
    },
  })
})

router.patch('/:artifactId', async (req, res) => {
  const { artifactId } = req.params
  const artifact = getArtifact(artifactId)
  if (!artifact) {
    return res.status(404).json({ message: 'Artifact not found', artifactId })
  }
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  if (!assertArtifactOwnership(userId, artifact, res)) return
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
  if (!assertArtifactOwnership(userId, artifact, res)) return
  deleteArtifact(artifactId)
  return res.json({ success: true, artifactId })
})

export default router
