import fs from 'fs'
import { randomUUID } from 'crypto'
import { Router, type Response } from 'express'
import { requireAccountUser } from '../../lib/authUser'
import { enqueueArtifactJob } from './services/artifactJobQueue'
import {
  getArtifactJob,
  registerArtifactJob,
  requestArtifactJobCancel,
} from './services/artifactJobStore'
import { prepareArtifactJobWorkspace } from './services/opencodeHtmlArtifactRunner'
import { getSkill } from '../skills/skillRegistry'
import {
  listAvailableHtmlPresentationTemplates,
  normalizeHtmlPresentationJobOptions,
} from './services/htmlPresentationTemplates'
import { resolveTaskTimeoutMs } from '../../lib/taskTimeouts'

const router = Router()

const ALLOWED_TYPES = ['html', 'html_presentation'] as const
type AllowedType = (typeof ALLOWED_TYPES)[number]

function sendNotFound(res: Response): void {
  res.status(404).json({ success: false, error: '任务不存在或已过期' })
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
  res.json({
    success: true,
    templates: listAvailableHtmlPresentationTemplates(),
  })
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
    const timeoutMs = htmlPresentationOptions.enableImages
      ? resolveTaskTimeoutMs('image')
      : resolveTaskTimeoutMs(type === 'html_presentation' ? 'html_ppt' : 'default')
    console.info(`[artifact-job] jobId=${job.id} type=${job.type} skillId=${job.skillId || ''} status=${job.status} timeoutMs=${timeoutMs} startedAt=${new Date(job.createdAt).toISOString()}`)
    enqueueArtifactJob(job.id)
    res.status(202).json({
      success: true,
      jobId: job.id,
      status: job.status,
      type: job.type,
      skillId: job.skillId,
      htmlPresentationOptions: job.htmlPresentationOptions,
      message: job.message,
      currentPhase: job.currentPhase,
      cancellable: job.cancellable,
      warning: job.warning,
      fallbackUsed: job.fallbackUsed,
      fallbackRenderer: job.fallbackRenderer,
      opencodeTimedOut: job.opencodeTimedOut,
      timeoutMs: job.timeoutMs,
      requestedTemplateSlug: job.requestedTemplateSlug,
      selectedTemplateSlug: job.selectedTemplateSlug,
      selectedStyleId: job.selectedStyleId,
      rendererMode: job.rendererMode,
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
    timeoutMs: job.timeoutMs,
    artifactId: job.artifactId,
    artifactFileUrl: job.artifactFileUrl,
    requestedTemplateSlug: job.requestedTemplateSlug,
    selectedTemplateSlug: job.selectedTemplateSlug,
    selectedStyleId: job.selectedStyleId,
    rendererMode: job.rendererMode,
    cancelRequestedAt: job.cancelRequestedAt,
    canceledAt: job.canceledAt,
    cancelReason: job.cancelReason,
    runnerPid: job.runnerPid,
    runnerProcessGroupId: job.runnerProcessGroupId,
    partialOutput: job.partialOutput,
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
    jobId: result.job.id,
    status: result.job.status,
    cancelRequestedAt: result.job.cancelRequestedAt,
    canceledAt: result.job.canceledAt,
    alreadyFinished: result.alreadyFinished,
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
  res.setHeader('Cache-Control', 'no-store')
  res.json({
    success: true,
    jobId: job.id,
    logs: fs.existsSync(job.logPath) ? fs.readFileSync(job.logPath, 'utf-8') : '',
    error: job.error,
    updatedAt: job.updatedAt,
  })
})

export default router
