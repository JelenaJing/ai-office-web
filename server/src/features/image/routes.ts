import { Router } from 'express'
import { requireAccountUser } from '../../lib/authUser'
import { runCreateImageSkill } from './skills/createImageSkill'
import {
  createImageJob,
  getImageJob,
  requestImageJobCancel,
  updateImageJob,
} from './services/imageJobStore'

const router = Router()

router.post('/jobs/start', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const workspacePath = String(req.body?.workspacePath || '').trim()
  const prompt = String(req.body?.prompt || '').trim()
  if (!workspacePath) {
    res.status(400).json({ success: false, error: 'workspacePath 不能为空' })
    return
  }
  if (!prompt) {
    res.status(400).json({ success: false, error: 'prompt 不能为空' })
    return
  }

  const job = createImageJob()
  updateImageJob(job.jobId, { status: 'running', progress: 5, message: '正在启动图片生成任务…' })

  void runCreateImageSkill({ userId, workspacePath, prompt })
    .then((result) => {
      if (getImageJob(job.jobId)?.cancelRequested) return
      if (!result.success) {
        updateImageJob(job.jobId, {
          status: 'failed',
          progress: 100,
          message: result.error,
          error: result.error,
          result,
        })
        return
      }
      updateImageJob(job.jobId, {
        status: 'completed',
        progress: 100,
        message: '图片生成完成',
        result,
      })
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : String(error)
      updateImageJob(job.jobId, { status: 'failed', progress: 100, message, error: message })
    })

  res.json({ success: true, jobId: job.jobId, status: 'running' })
})

router.get('/jobs/:jobId', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const job = getImageJob(req.params.jobId)
  if (!job) {
    res.status(404).json({ success: false, error: '任务不存在或已过期' })
    return
  }
  res.json({
    success: true,
    jobId: job.jobId,
    status: job.status,
    progress: job.progress,
    message: job.message,
    result: job.result,
    error: job.error,
    partialMissing: [
      'reference image generation is not yet ported to Web job API',
      'poster workflow and style controls are partial',
      'image insertion into document/PPT is not fully wired',
    ],
  })
})

router.post('/jobs/:jobId/cancel', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const job = requestImageJobCancel(req.params.jobId)
  if (!job) {
    res.status(404).json({ success: false, error: '任务不存在或已过期' })
    return
  }
  res.json({ success: true, jobId: job.jobId, status: 'cancelled' })
})

export default router
