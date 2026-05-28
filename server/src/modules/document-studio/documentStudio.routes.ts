import { Router, type Response } from 'express'
import fs from 'fs'
import path from 'path'
import multer from 'multer'
import { requireAccountUser } from '../../lib/authUser'
import { DOCUMENT_STUDIO_TYPES } from './documentTypes'
import { DOCUMENT_STUDIO_CAPABILITIES } from './documentCapabilities'
import { createDocumentGenerationJob, getDocumentJob } from './documentJob.service'
import { DOCUMENT_STUDIO_ROOT, loadStudioDocument, resolveExportFilePath } from './documentArtifact.service'
import { runCapability } from '../capabilities/capability.runtime'
import { applyPatchToDocument, validatePatch } from './documentPatch.service'
import { isStudioDocumentId } from './editorJsonUtils'
import type { DocumentPatchResult } from '../capabilities/capability.types'
import { getOpenCodeStatusReport } from '../opencode/opencodeStatus.service'
import {
  createHumanizeJob,
  getHumanizeJob,
  humanizeJobToApiResponse,
  type HumanizeInputMode,
  type HumanizeJobOptions,
  type HumanizeLanguage,
} from './humanizeJob.service'
import { extractHumanizeFileToText } from './humanizeFileExtractor'
import { buildDocxBufferFromPlainText } from './studioDocxExport'
import { prepareOpenCodeJobDir } from '../opencode/opencodeJobRunner'

const router = Router()
const humanizeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
})

function parseHumanizeOptions(raw: unknown): HumanizeJobOptions {
  const body = (raw && typeof raw === 'object' ? raw : {}) as Partial<HumanizeJobOptions>
  return {
    strength: body.strength === 'quick' ? 'quick' : 'deep',
    tone: 'natural',
    preserveMeaning: body.preserveMeaning !== false,
    preserveTerms: Array.isArray(body.preserveTerms) ? body.preserveTerms.map(String).filter(Boolean) : [],
    language: (['zh-CN', 'en-US', 'auto'].includes(String(body.language))
      ? body.language
      : 'auto') as HumanizeLanguage,
  }
}

router.get('/document-studio/opencode-status', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const report = await getOpenCodeStatusReport()
  res.json({
    success: true,
    opencodeAvailable: report.opencodeAvailable,
    opencodeVersion: report.opencodeVersion,
    opencodeBin: report.opencodeBin,
    aiosSkillsRoot: report.aiosSkillsRoot,
    humanizer: {
      installed: report.skills.humanizer.installed,
      status: report.skills.humanizer.status,
      source: report.skills.humanizer.source,
      label: report.skills.humanizer.label,
    },
    newsWriter: {
      installed: report.skills.newsWriter.installed,
      status: report.skills.newsWriter.status,
      source: report.skills.newsWriter.source,
      label: report.skills.newsWriter.label,
    },
    academicResearchSkills: {
      installed: report.skills.academicResearchSkills.installed,
      status: 'pending',
      label: report.skills.academicResearchSkills.label,
    },
    report,
  })
})

router.get('/document-types', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  res.json({
    success: true,
    documentTypes: DOCUMENT_STUDIO_TYPES,
    capabilities: DOCUMENT_STUDIO_CAPABILITIES.filter(c => c.status !== 'legacy-hidden'),
  })
})

router.post('/document-studio/humanize/extract-file', humanizeUpload.single('file'), async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  try {
    const file = req.file
    if (!file?.buffer?.length) {
      res.status(400).json({ success: false, error: '请上传文件' })
      return
    }
    const scratchId = `extract_${Date.now()}`
    const jobDir = prepareOpenCodeJobDir(scratchId)
    const extracted = await extractHumanizeFileToText({
      jobDir,
      buffer: file.buffer,
      originalName: file.originalname || 'upload.txt',
    })
    const originalName = file.originalname || 'upload.txt'
    res.json({
      success: true,
      filename: originalName,
      fileType: extracted.format,
      text: extracted.text,
      markdown: extracted.markdown,
      warnings: extracted.warnings,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const isDocx = String(req.file?.originalname || '')
      .toLowerCase()
      .endsWith('.docx')
    const userError =
      isDocx && !message.includes('MarkItDown') && !message.includes('解析能力未安装')
        ? 'Word 解析失败，请检查文件格式或稍后重试。'
        : message
    res.status(400).json({ success: false, error: userError })
  }
})

router.post('/document-studio/humanize/export-docx', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  try {
    const text = String(req.body?.text || '').trim()
    if (!text) {
      res.status(400).json({ success: false, error: '正文不能为空' })
      return
    }
    const title = String(req.body?.title || '改写文稿').trim() || '改写文稿'
    const buffer = await buildDocxBufferFromPlainText(title, text)
    const filename = `${title.replace(/[\\/:*?"<>|]/g, '_').slice(0, 60)}.docx`
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    )
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`)
    res.send(buffer)
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : String(error) })
  }
})

router.post('/document-studio/humanize/jobs', humanizeUpload.single('file'), async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  try {
    let inputMode = String(req.body?.inputMode || 'text').trim() as HumanizeInputMode
    if (req.file?.buffer?.length && inputMode === 'text') {
      inputMode = 'file'
    }
    if (!['text', 'document', 'file'].includes(inputMode)) {
      res.status(400).json({ success: false, error: 'inputMode 必须为 text | document | file' })
      return
    }
    let options: HumanizeJobOptions
    if (typeof req.body?.options === 'string') {
      try {
        options = parseHumanizeOptions(JSON.parse(req.body.options))
      } catch {
        res.status(400).json({ success: false, error: 'options 不是合法 JSON' })
        return
      }
    } else {
      options = parseHumanizeOptions(req.body?.options)
    }
    const record = await createHumanizeJob({
      userId,
      inputMode,
      text: typeof req.body?.text === 'string' ? req.body.text : undefined,
      documentId: typeof req.body?.documentId === 'string' ? req.body.documentId : undefined,
      fileBuffer: inputMode === 'file' ? req.file?.buffer : undefined,
      fileName: inputMode === 'file' ? req.file?.originalname : undefined,
      options,
    })
    res.json({ success: true, ...humanizeJobToApiResponse(record) })
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : String(error) })
  }
})

router.get('/document-studio/humanize/jobs/:jobId', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const record = getHumanizeJob(req.params.jobId, userId)
  if (!record) {
    res.status(404).json({ success: false, error: '改写任务不存在或已过期' })
    return
  }
  res.json({ success: true, ...humanizeJobToApiResponse(record) })
})

router.get('/document-studio/capabilities', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const documentType = typeof req.query.documentType === 'string' ? req.query.documentType : ''
  const list = documentType
    ? DOCUMENT_STUDIO_CAPABILITIES.filter(c => c.documentTypes.includes(documentType))
    : DOCUMENT_STUDIO_CAPABILITIES
  res.json({ success: true, capabilities: list })
})

router.get('/jobs/:jobId', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const job = getDocumentJob(req.params.jobId, userId)
  if (!job) {
    res.status(404).json({ success: false, error: '任务不存在或已过期' })
    return
  }
  res.json({
    success: true,
    status: job.status,
    artifactId: job.artifactId,
    documentId: job.documentId,
    error: job.error,
    progressStage: job.progressStage,
    pending: job.pending,
    fallback: job.fallback,
    fallbackReason: job.fallbackReason,
    source: job.source,
  })
})

router.get('/document-studio/artifacts/:artifactId/exports/:filename', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const filePath = resolveExportFilePath(req.params.artifactId, req.params.filename)
  if (!filePath) {
    res.status(404).json({ success: false, error: '导出文件不存在' })
    return
  }
  res.sendFile(filePath)
})

const documentsRouter = Router()

documentsRouter.post('/jobs', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  try {
    const documentType = String(req.body?.documentType || '').trim()
    const capabilityId = String(req.body?.capabilityId || '').trim()
    const fields = (req.body?.fields && typeof req.body.fields === 'object' ? req.body.fields : {}) as Record<
      string,
      unknown
    >
    if (!documentType || !capabilityId) {
      res.status(400).json({ success: false, error: 'documentType 与 capabilityId 不能为空' })
      return
    }
    const job = createDocumentGenerationJob({
      userId,
      documentType,
      capabilityId,
      fields,
      materials: Array.isArray(req.body?.materials) ? req.body.materials : [],
      language: typeof req.body?.language === 'string' ? req.body.language : 'zh-CN',
      tone: typeof req.body?.tone === 'string' ? req.body.tone : 'formal',
    })
    res.json({ success: true, jobId: job.jobId, status: job.status, progressStage: job.progressStage })
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : String(error) })
  }
})

documentsRouter.get('/:documentId', async (req, res, next) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  if (!isStudioDocumentId(req.params.documentId)) {
    next()
    return
  }
  const record = loadStudioDocument(req.params.documentId, userId)
  if (!record) {
    res.status(404).json({ success: false, error: '文稿不存在或无权限访问' })
    return
  }
  const mdPath = path.join(DOCUMENT_STUDIO_ROOT, 'artifacts', record.artifactId, 'document.md')
  const documentMarkdown = fs.existsSync(mdPath) ? fs.readFileSync(mdPath, 'utf-8') : undefined
  res.json({
    success: true,
    documentId: record.documentId,
    artifactId: record.artifactId,
    documentType: record.documentType,
    title: record.title,
    editorJson: record.editorJson,
    contentModel: record.contentModel,
    documentMarkdown,
  })
})

documentsRouter.post('/:documentId/capabilities/:capabilityId/run', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  if (!isStudioDocumentId(req.params.documentId)) {
    res.status(404).json({ success: false, error: '非 Document Studio 文稿' })
    return
  }
  const record = loadStudioDocument(req.params.documentId, userId)
  if (!record) {
    res.status(404).json({ success: false, error: '文稿不存在或无权限访问' })
    return
  }
  const result = await runCapability({
    capabilityId: req.params.capabilityId,
    documentId: record.documentId,
    documentType: record.documentType,
    userId,
    scope: req.body?.scope,
    selection: req.body?.selection,
    instruction: typeof req.body?.instruction === 'string' ? req.body.instruction : undefined,
    editorJson: record.editorJson,
    documentTitle: record.title,
  })
  if (!result.success) {
    res.status(result.pending ? 503 : 400).json({
      success: false,
      error: result.error,
      pending: result.pending,
      fallback: result.fallback,
    })
    return
  }
  res.json({
    success: true,
    resultType: result.resultType,
    patch: result.patch,
    comments: result.comments,
    exportUrl: result.exportUrl,
    filename: result.filename,
    mimeType: result.mimeType,
    source: result.source,
    fallback: result.fallback,
  })
})

documentsRouter.post('/:documentId/patch', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  if (!isStudioDocumentId(req.params.documentId)) {
    res.status(404).json({ success: false, error: '非 Document Studio 文稿' })
    return
  }
  try {
    const patch = req.body?.patch as DocumentPatchResult
    validatePatch(patch)
    const applied = applyPatchToDocument(req.params.documentId, userId, patch, req.body?.editorJson)
    res.json({ success: true, editorJson: applied.editorJson })
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : String(error) })
  }
})

documentsRouter.post('/:documentId/export', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  if (!isStudioDocumentId(req.params.documentId)) {
    return passToNext(res)
  }
  const format = String(req.body?.format || 'markdown').trim().toLowerCase()
  const capabilityId =
    format === 'html' ? 'export-html' : format === 'docx' ? 'export-docx' : 'export-markdown'
  const result = await runCapability({
    capabilityId,
    documentId: req.params.documentId,
    documentType: 'general',
    userId,
  })
  if (!result.success) {
    res.status(400).json({ success: false, error: result.error })
    return
  }
  res.json({
    success: true,
    exportUrl: result.exportUrl,
    filename: result.filename,
    mimeType: result.mimeType,
  })
})

function passToNext(res: Response): void {
  res.status(404).json({ success: false, error: '非 Document Studio 文稿，请使用工作台导出。' })
}

export { documentsRouter }
export default router
