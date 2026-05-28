import fs from 'fs'
import { randomUUID } from 'crypto'
import { Router, type Response } from 'express'
import { requireAccountUser } from '../../lib/authUser'
import { enqueueArtifactJob } from './services/artifactJobQueue'
import {
  getArtifactJob,
  registerArtifactJob,
  requestArtifactJobCancel,
  updateArtifactJob,
} from './services/artifactJobStore'
import { prepareArtifactJobWorkspace } from './services/opencodeHtmlArtifactRunner'
import { getSkill } from '../skills/skillRegistry'
import {
  getTemplateThumbnailFile,
  hasTemplateThumbnail,
  isKnownHtmlPresentationTemplateSlug,
  listAvailableHtmlPresentationTemplates,
  normalizeHtmlPresentationJobOptions,
} from './services/htmlPresentationTemplates'
import {
  assertFastTemplateSkillsPreflight,
  assertHtmlPptHighQualitySkillsPreflight,
} from './services/htmlPresentationHighQualitySkills'
import {
  logHtmlPptTimeoutConfig,
  readArtifactJobLogTail,
  resolveHtmlPptOpenCodeTimeoutMs,
} from './services/artifactJobProgress'

const router = Router()

const ALLOWED_TYPES = ['html', 'html_presentation'] as const
type AllowedType = (typeof ALLOWED_TYPES)[number]

function sendNotFound(res: Response): void {
  res.status(404).json({ success: false, ok: false, reason: 'not_found', error: '任务不存在或已过期' })
}

function sendForbidden(res: Response): void {
  res.status(403).json({ success: false, error: '无权访问该任务。' })
}

function normalizePrompt(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeInputMarkdown(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

router.get('/html-presentation/templates', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const templates = listAvailableHtmlPresentationTemplates().map((template) => ({
    ...template,
    id: template.slug,
    description: template.tagline,
    thumbnailUrl: hasTemplateThumbnail(template.slug)
      ? `/api/artifact-jobs/html-presentation/templates/${encodeURIComponent(template.slug)}/thumbnail`
      : undefined,
  }))
  res.json({
    success: true,
    templates,
  })
})

router.get('/html-presentation/templates/:templateSlug/thumbnail', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const templateSlug = decodeURIComponent(String(req.params.templateSlug || '')).trim()
  if (!/^[a-z0-9_-]+$/i.test(templateSlug)) {
    return res.status(400).json({ success: false, error: 'invalid template slug' })
  }
  const templates = listAvailableHtmlPresentationTemplates()
  const exists = templates.some((t) => t.slug === templateSlug)
  if (!exists) {
    return res.status(404).json({ success: false, error: 'template not found' })
  }
  const file = getTemplateThumbnailFile(templateSlug)
  if (!file) {
    return res.status(404).json({ success: false, error: 'thumbnail not found' })
  }
  const contentType = file.ext === 'png'
    ? 'image/png'
    : file.ext === 'webp'
      ? 'image/webp'
      : 'image/jpeg'
  res.setHeader('Content-Type', contentType)
  res.setHeader('Cache-Control', 'public, max-age=86400')
  return res.sendFile(file.path)
})

router.post('/', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return

  const rawType = typeof req.body?.type === 'string' ? req.body.type.trim().toLowerCase() : ''
  const type = ALLOWED_TYPES.includes(rawType as AllowedType) ? (rawType as AllowedType) : null
  const prompt = normalizePrompt(req.body?.prompt)
  const rawInputMarkdown = req.body?.inputMarkdown
  const inputMarkdown = normalizeInputMarkdown(rawInputMarkdown)
  const skillId = typeof req.body?.skillId === 'string' ? req.body.skillId.trim() : undefined
  const htmlPresentationOptions = normalizeHtmlPresentationJobOptions({
    ...(req.body?.htmlPresentationOptions && typeof req.body.htmlPresentationOptions === 'object' ? req.body.htmlPresentationOptions : {}),
    templateSlug: req.body?.templateSlug,
    templateId: req.body?.templateId,
    template: req.body?.template,
    enableImages: req.body?.enableImages,
    maxImages: req.body?.maxImages,
    qualityMode: req.body?.qualityMode,
  })

  if (!type) {
    res.status(400).json({ success: false, error: '当前仅支持 type=html 或 type=html_presentation' })
    return
  }
  if (type === 'html_presentation' && !skillId) {
    res.status(400).json({ success: false, error: 'type=html_presentation 需要提供 skillId' })
    return
  }
  if (type === 'html_presentation' && htmlPresentationOptions.templateSlug && !isKnownHtmlPresentationTemplateSlug(htmlPresentationOptions.templateSlug)) {
    res.status(400).json({ success: false, error: `Unknown HTML Slides template: ${htmlPresentationOptions.templateSlug}` })
    return
  }
  if (type === 'html_presentation') {
    console.info(
      `htmlPptTemplateRequest templateSlug=${htmlPresentationOptions.templateSlug || ''} qualityMode=${htmlPresentationOptions.qualityMode}`,
    )
  }
  if (!prompt) {
    res.status(400).json({ success: false, error: 'prompt 不能为空' })
    return
  }
  if (typeof rawInputMarkdown !== 'string') {
    res.status(400).json({ success: false, error: 'inputMarkdown 必须是字符串' })
    return
  }

  // Validate skillId against registry before touching the filesystem
  if (skillId) {
    const skill = getSkill(skillId)
    if (!skill) {
      res.status(400).json({ success: false, error: `Skill ${skillId} not found` })
      return
    }
  }

  try {
    if (type === 'html_presentation') {
      if (htmlPresentationOptions.qualityMode === 'high') {
        assertHtmlPptHighQualitySkillsPreflight()
      } else {
        assertFastTemplateSkillsPreflight()
      }
    }

    const jobId = randomUUID()
    const workspace = prepareArtifactJobWorkspace({
      jobId,
      inputMarkdown,
      prompt,
      skillId,
      htmlPresentationOptions,
    })
    const job = registerArtifactJob({
      id: jobId,
      userId,
      type,
      skillId,
      prompt,
      htmlPresentationOptions,
      jobDir: workspace.jobDir,
      inputPath: workspace.inputPath,
      skillPath: workspace.skillPath,
      outputPath: workspace.outputPath,
      logPath: workspace.logPath,
      errorPath: workspace.errorPath,
    })
    if (type === 'html_presentation') {
      const timeoutConfig = resolveHtmlPptOpenCodeTimeoutMs({ qualityMode: htmlPresentationOptions.qualityMode })
      logHtmlPptTimeoutConfig(htmlPresentationOptions.qualityMode)
      updateArtifactJob(job.id, { timeoutMs: timeoutConfig.timeoutMs })
    }
    const responseJob = getArtifactJob(job.id) ?? job
    console.info(`[artifact-job] jobId=${responseJob.id} type=${responseJob.type} skillId=${responseJob.skillId || ''} status=${responseJob.status} qualityMode=${htmlPresentationOptions.qualityMode} timeoutMs=${responseJob.timeoutMs ?? 'n/a'} startedAt=${new Date(responseJob.createdAt).toISOString()}`)
    enqueueArtifactJob(job.id)
    res.status(202).json({
      success: true,
      jobId: responseJob.id,
      status: responseJob.status,
      type: responseJob.type,
      skillId: responseJob.skillId,
      htmlPresentationOptions: responseJob.htmlPresentationOptions,
      message: responseJob.message,
      currentPhase: responseJob.currentPhase,
      cancellable: responseJob.cancellable,
      warning: responseJob.warning,
      fallbackUsed: responseJob.fallbackUsed,
      fallbackRenderer: responseJob.fallbackRenderer,
      opencodeTimedOut: responseJob.opencodeTimedOut,
      noOutputSoftTimeoutTriggered: responseJob.noOutputSoftTimeoutTriggered,
      timeoutMs: responseJob.timeoutMs,
      requestedTemplateSlug: responseJob.requestedTemplateSlug,
      selectedTemplateSlug: responseJob.selectedTemplateSlug,
      appliedTemplateSlug: responseJob.appliedTemplateSlug,
      selectedStyleId: responseJob.selectedStyleId,
      rendererMode: responseJob.rendererMode,
      fallbackReason: responseJob.fallbackReason,
      templateStyleApplied: responseJob.templateStyleApplied,
      repairAttempted: responseJob.repairAttempted,
      repairSucceeded: responseJob.repairSucceeded,
      imageStats: responseJob.imageStats,
      skillStats: responseJob.skillStats,
      progress: responseJob.progress,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    res.status(500).json({ success: false, error: message })
  }
})

router.get('/:jobId', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const job = getArtifactJob(req.params.jobId)
  if (!job) {
    sendNotFound(res)
    return
  }
  if (job.userId !== userId) {
    sendForbidden(res)
    return
  }
  res.setHeader('Cache-Control', 'no-store')
  res.json({
    success: true,
    jobId: job.id,
    status: job.status,
    type: job.type,
    skillId: job.skillId,
    htmlPresentationOptions: job.htmlPresentationOptions,
    message: job.message,
    currentPhase: job.currentPhase,
    cancellable: job.cancellable,
    error: job.error,
    warning: job.warning,
    fallbackUsed: job.fallbackUsed,
    fallbackRenderer: job.fallbackRenderer,
    opencodeTimedOut: job.opencodeTimedOut,
    noOutputSoftTimeoutTriggered: job.noOutputSoftTimeoutTriggered,
    timeoutMs: job.timeoutMs,
    artifactId: job.artifactId,
    artifactFileUrl: job.artifactFileUrl,
    requestedTemplateSlug: job.requestedTemplateSlug,
    selectedTemplateSlug: job.selectedTemplateSlug,
    appliedTemplateSlug: job.appliedTemplateSlug,
    selectedStyleId: job.selectedStyleId,
    rendererMode: job.rendererMode,
    fallbackReason: job.fallbackReason,
    templateStyleApplied: job.templateStyleApplied,
    repairAttempted: job.repairAttempted,
    repairSucceeded: job.repairSucceeded,
    cancelRequestedAt: job.cancelRequestedAt,
    canceledAt: job.canceledAt,
    cancelReason: job.cancelReason,
    runnerPid: job.runnerPid,
    runnerProcessGroupId: job.runnerProcessGroupId,
    partialOutput: job.partialOutput,
    imageStats: job.imageStats,
    skillStats: job.skillStats,
    progress: job.progress,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  })
})

router.post('/:jobId/cancel', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const job = getArtifactJob(req.params.jobId)
  if (!job) {
    sendNotFound(res)
    return
  }
  if (job.userId !== userId) {
    sendForbidden(res)
    return
  }

  const reason = typeof req.body?.reason === 'string' && req.body.reason.trim()
    ? req.body.reason.trim()
    : 'user_cancelled'
  const result = requestArtifactJobCancel(job.id, reason)
  if (!result) {
    sendNotFound(res)
    return
  }

  res.setHeader('Cache-Control', 'no-store')
  res.json({
    success: true,
    ok: true,
    jobId: result.job.id,
    status: result.job.status,
    message: result.message,
    cancelRequestedAt: result.job.cancelRequestedAt,
    canceledAt: result.job.canceledAt,
    alreadyFinished: result.alreadyFinished,
    progress: result.job.progress,
  })
})

router.get('/:jobId/logs', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const job = getArtifactJob(req.params.jobId)
  if (!job) {
    sendNotFound(res)
    return
  }
  if (job.userId !== userId) {
    sendForbidden(res)
    return
  }
  const limitRaw = typeof req.query.limit === 'string' ? Number.parseInt(req.query.limit, 10) : 10
  const limit = Number.isFinite(limitRaw) ? Math.min(50, Math.max(1, limitRaw)) : 10
  const entries = readArtifactJobLogTail(job.logPath, limit)
  let logs = ''
  if (fs.existsSync(job.logPath)) {
    const full = fs.readFileSync(job.logPath, 'utf-8')
    logs = full.length > 80_000 ? full.slice(-80_000) : full
  }

  res.setHeader('Cache-Control', 'no-store')
  res.json({
    success: true,
    jobId: job.id,
    logs,
    entries,
    error: job.error,
    updatedAt: job.updatedAt,
  })
})

export default router
