import fs from 'fs'
import { randomUUID } from 'crypto'
import { Router, type Response } from 'express'
import { requireAccountUser } from '../../lib/authUser'
import { enqueueArtifactJob } from './services/artifactJobQueue'
import { getArtifactJob, registerArtifactJob } from './services/artifactJobStore'
import { prepareArtifactJobWorkspace } from './services/opencodeHtmlArtifactRunner'
import { getSkill } from '../skills/skillRegistry'
import {
  listAvailableHtmlPresentationTemplates,
  normalizeHtmlPresentationJobOptions,
} from './services/htmlPresentationTemplates'

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
    enqueueArtifactJob(job.id)
    res.status(202).json({
      success: true,
      jobId: job.id,
      status: job.status,
      type: job.type,
      skillId: job.skillId,
      htmlPresentationOptions: job.htmlPresentationOptions,
      message: job.message,
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
    error: job.error,
    artifactId: job.artifactId,
    artifactFileUrl: job.artifactFileUrl,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
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
