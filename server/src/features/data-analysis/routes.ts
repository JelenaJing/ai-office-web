import { Router } from 'express'
import { requireAccountUser } from '../../lib/authUser'
import { runAnalyzeXlsxSkill } from './skills/analyzeXlsxSkill'
import {
  createAnalysisJob,
  getAnalysisJob,
  requestAnalysisJobCancel,
  updateAnalysisJob,
} from './services/analysisJobStore'

const router = Router()

const DATA_ANALYSIS_PARTIAL_MISSING = [
  'Python execution environment probing is not fully ported to Web',
  'chart image generation is not yet emitted as a separate Artifact',
  'stdout/result JSON parser parity with Electron analysis runner is partial',
]

router.post('/jobs/start', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const fileId = String(req.body?.fileId || '').trim()
  const workspacePath = String(req.body?.workspacePath || '').trim()
  if (!fileId) {
    res.status(400).json({ success: false, error: 'fileId 不能为空' })
    return
  }
  if (!workspacePath) {
    res.status(400).json({ success: false, error: 'workspacePath 不能为空' })
    return
  }

  const job = createAnalysisJob()
  updateAnalysisJob(job.jobId, { status: 'running', progress: 10, message: '正在启动表格分析任务…' })

  void runAnalyzeXlsxSkill({
    userId,
    fileId,
    workspacePath,
    prompt: typeof req.body?.prompt === 'string' ? req.body.prompt : undefined,
    options: req.body?.options && typeof req.body.options === 'object' ? req.body.options : undefined,
  })
    .then((result) => {
      if (getAnalysisJob(job.jobId)?.cancelRequested) return
      if (!result.success) {
        updateAnalysisJob(job.jobId, {
          status: 'failed',
          progress: 100,
          message: result.error,
          error: result.error,
          result,
        })
        return
      }
      updateAnalysisJob(job.jobId, {
        status: 'completed',
        progress: 100,
        message: '表格分析完成',
        result,
      })
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : String(error)
      updateAnalysisJob(job.jobId, { status: 'failed', progress: 100, message, error: message })
    })

  res.json({ success: true, jobId: job.jobId, status: 'running' })
})

router.get('/jobs/:jobId', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const job = getAnalysisJob(req.params.jobId)
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
    partialMissing: DATA_ANALYSIS_PARTIAL_MISSING,
  })
})

router.post('/jobs/:jobId/cancel', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const job = requestAnalysisJobCancel(req.params.jobId)
  if (!job) {
    res.status(404).json({ success: false, error: '任务不存在或已过期' })
    return
  }
  res.json({ success: true, jobId: job.jobId, status: 'cancelled' })
})

router.get('/jobs/:jobId/artifacts', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const job = getAnalysisJob(req.params.jobId)
  if (!job) {
    res.status(404).json({ success: false, error: '任务不存在或已过期' })
    return
  }
  const artifact = job.result?.success ? job.result.artifact : undefined
  res.json({ success: true, artifacts: artifact ? [artifact] : [] })
})

export default router
