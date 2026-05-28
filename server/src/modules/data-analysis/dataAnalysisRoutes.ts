import { Router } from 'express'
import XLSX from 'xlsx'
import { requireAccountUser } from '../../lib/authUser'
import { assertWorkspaceAccess, WorkspaceAccessError } from '../../lib/workspaceAccess'
import { runAnalyzeXlsxSkill } from '../../features/data-analysis/skills/analyzeXlsxSkill'
import {
  createAnalysisJob,
  getAnalysisJob,
  requestAnalysisJobCancel,
  updateAnalysisJob,
} from '../../features/data-analysis/services/analysisJobStore'
import {
  createDataAnalysisJob,
  getDataAnalysisJob,
  publicJobStatus,
  requestDataAnalysisJobCancel,
  updateDataAnalysisJob,
} from './dataAnalysisJobStore'
import { runBatteryLifeAnalysisJob } from './runners/batteryLifeModelRunner'
import {
  getAnalysisModel,
  isBatteryLifeModel,
  BATTERY_LIFE_MODEL_ID,
} from './models/analysisModelRegistry'
import { getArtifact } from '../../artifacts/ArtifactStore'

const router = Router()

const DATA_ANALYSIS_PARTIAL_MISSING = [
  'Python execution environment probing is not fully ported to Web',
  'chart image generation is not yet emitted as a separate Artifact',
  'stdout/result JSON parser parity with Electron analysis runner is partial',
]

function readString(v: unknown): string {
  return String(v || '').trim()
}

router.get('/templates/:modelId', async (req, res) => {
  const modelId = readString(req.params.modelId)
  if (modelId !== BATTERY_LIFE_MODEL_ID) {
    res.status(404).json({ success: false, error: '模板不存在' })
    return
  }

  // Generate a small xlsx template on the fly.
  const header = ['Cycle', 'E0039', 'E0040', 'E0041', 'E0042']
  const rows25: Array<Array<string | number>> = [
    header,
    [0, 3500, 3490, 3480, 3470],
    [50, 3460, 3450, 3440, 3435],
    [100, 3390, 3380, 3370, 3360],
  ]
  const rows45: Array<Array<string | number>> = [
    header,
    [0, 3490, 3480, 3470, 3460],
    [50, 3420, 3410, 3400, 3395],
    [100, 3340, 3330, 3320, 3310],
  ]

  const wb = XLSX.utils.book_new()
  const ws25 = XLSX.utils.aoa_to_sheet(rows25)
  const ws45 = XLSX.utils.aoa_to_sheet(rows45)
  XLSX.utils.book_append_sheet(wb, ws25, '25℃')
  XLSX.utils.book_append_sheet(wb, ws45, '45℃')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', `attachment; filename="battery_life_prediction_a_template.xlsx"`)
  res.send(buf)
})

router.post('/jobs/start', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return

  const fileId = readString(req.body?.fileId)
  if (!fileId) {
    res.status(400).json({ success: false, error: 'fileId 不能为空' })
    return
  }

  let access
  try {
    access = assertWorkspaceAccess(
      userId,
      typeof req.body?.workspacePath === 'string' ? req.body.workspacePath : undefined,
      'editor',
    )
  } catch (error) {
    const workspaceError = error instanceof WorkspaceAccessError ? error : null
    res.status(workspaceError?.status ?? 500).json({
      success: false,
      code: workspaceError?.code,
      error: workspaceError?.message || (error instanceof Error ? error.message : String(error)),
      bootstrap: workspaceError?.bootstrap,
    })
    return
  }

  const options = req.body?.options && typeof req.body.options === 'object'
    ? (req.body.options as Record<string, unknown>)
    : {}
  const modelId = readString(options.modelId || options.dataModelId)
  const analysisModel = getAnalysisModel(modelId)

  // ── Specialized battery life model ──────────────────────────────────────────
  if (analysisModel && isBatteryLifeModel(analysisModel.id)) {
    const job = createDataAnalysisJob(analysisModel.id)
    updateDataAnalysisJob(job.jobId, {
      status: 'running',
      progress: 5,
      message: '正在启动电池寿命预测任务…',
      stage: '读取数据',
    })

    void runBatteryLifeAnalysisJob({
      jobId: job.jobId,
      userId,
      fileId,
      workspacePath: access.workspacePath,
    })
      .then((result) => {
        const current = getDataAnalysisJob(job.jobId)
        if (current?.cancelRequested) return
        if (!result.success) {
          updateDataAnalysisJob(job.jobId, {
            status: 'failed',
            progress: 100,
            message: result.error,
            error: result.error,
          })
          return
        }
        updateDataAnalysisJob(job.jobId, {
          status: 'succeeded',
          progress: 100,
          message: '电池寿命预测完成',
          result,
        })
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : String(error)
        updateDataAnalysisJob(job.jobId, {
          status: 'failed',
          progress: 100,
          message,
          error: message,
        })
      })

    res.json({ success: true, jobId: job.jobId, status: 'running', analysisModelId: analysisModel.id })
    return
  }

  // ── Legacy generic Excel + LLM analysis ─────────────────────────────────────
  const job = createAnalysisJob()
  updateAnalysisJob(job.jobId, { status: 'running', progress: 10, message: '正在启动表格分析任务…' })

  void runAnalyzeXlsxSkill({
    userId,
    fileId,
    workspacePath: access.workspacePath,
    prompt: typeof req.body?.prompt === 'string' ? req.body.prompt : undefined,
    options,
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

  const legacyJob = getAnalysisJob(req.params.jobId)
  const modelJob = getDataAnalysisJob(req.params.jobId)
  const job = modelJob ?? legacyJob
  if (!job) {
    res.status(404).json({ success: false, error: '任务不存在或已过期' })
    return
  }

  const status = modelJob ? publicJobStatus(modelJob) : (job.status === 'completed' ? 'succeeded' : job.status)
  res.json({
    success: true,
    jobId: job.jobId,
    status,
    progress: job.progress,
    message: job.message,
    stage: modelJob?.stage,
    result: (job as any).result,
    error: job.error,
    partialMissing: DATA_ANALYSIS_PARTIAL_MISSING,
  })
})

router.post('/jobs/:jobId/cancel', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return

  const legacy = requestAnalysisJobCancel(req.params.jobId)
  const modelJob = requestDataAnalysisJobCancel(req.params.jobId)
  const job = modelJob ?? legacy
  if (!job) {
    res.status(404).json({ success: false, error: '任务不存在或已过期' })
    return
  }
  res.json({ success: true, jobId: job.jobId, status: 'cancelled' })
})

router.get('/jobs/:jobId/artifacts', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return

  const legacyJob = getAnalysisJob(req.params.jobId)
  const modelJob = getDataAnalysisJob(req.params.jobId)
  const job = modelJob ?? legacyJob
  if (!job) {
    res.status(404).json({ success: false, error: '任务不存在或已过期' })
    return
  }

  if (modelJob?.result?.success && typeof (modelJob.result as any).artifactId === 'string') {
    const artifactId = (modelJob.result as any).artifactId as string
    const artifact = getArtifact(artifactId)
    res.json({ success: true, artifacts: artifact ? [artifact] : [] })
    return
  }

  const artifact = legacyJob?.result?.success ? legacyJob.result.artifact : undefined
  res.json({ success: true, artifacts: artifact ? [artifact] : [] })
})

export default router

