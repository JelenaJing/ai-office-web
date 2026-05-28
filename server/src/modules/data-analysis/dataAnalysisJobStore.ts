import { randomUUID } from 'crypto'
import type { AnalyzeXlsxResult } from '../../features/data-analysis/skills/analyzeXlsxSkill'

export type DataAnalysisJobStatus =
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'completed'

export type DataAnalysisProgressStage =
  | '读取数据'
  | '清洗异常点'
  | '拟合衰减模型'
  | '生成预测曲线'
  | '生成报告'
  | string

export interface BatteryLifeJobResult {
  success: true
  artifactId: string
  summary: string
  markdown?: string
  imageUrls: string[]
  htmlUrl?: string
  downloadUrls: Array<{ label: string; url: string; filename: string }>
  resultJson?: Record<string, unknown>
  n80?: Record<string, unknown>
}

export interface DataAnalysisJobRecord {
  jobId: string
  status: DataAnalysisJobStatus
  progress: number
  message: string
  stage?: DataAnalysisProgressStage
  analysisModelId?: string
  result?: AnalyzeXlsxResult | BatteryLifeJobResult
  error?: string
  cancelRequested: boolean
  createdAt: number
  updatedAt: number
}

const jobs = new Map<string, DataAnalysisJobRecord>()

const JOB_TTL_MS = 60 * 60 * 1000
setInterval(() => {
  const cutoff = Date.now() - JOB_TTL_MS
  for (const [jobId, job] of jobs.entries()) {
    if (job.createdAt < cutoff) jobs.delete(jobId)
  }
}, 5 * 60 * 1000).unref()

export function createDataAnalysisJob(analysisModelId?: string): DataAnalysisJobRecord {
  const now = Date.now()
  const job: DataAnalysisJobRecord = {
    jobId: randomUUID(),
    status: 'queued',
    progress: 0,
    message: '任务已排队',
    stage: undefined,
    analysisModelId: analysisModelId || undefined,
    cancelRequested: false,
    createdAt: now,
    updatedAt: now,
  }
  jobs.set(job.jobId, job)
  return job
}

export function getDataAnalysisJob(jobId: string): DataAnalysisJobRecord | undefined {
  return jobs.get(jobId)
}

export function updateDataAnalysisJob(
  jobId: string,
  patch: Partial<DataAnalysisJobRecord>,
): void {
  const job = jobs.get(jobId)
  if (!job) return
  Object.assign(job, patch, { updatedAt: Date.now() })
}

export function requestDataAnalysisJobCancel(jobId: string): DataAnalysisJobRecord | undefined {
  const job = jobs.get(jobId)
  if (!job) return undefined
  job.cancelRequested = true
  job.status = 'cancelled'
  job.progress = 100
  job.message = '任务已取消'
  job.updatedAt = Date.now()
  return job
}

/** Normalize legacy `completed` to API `succeeded` for dedicated models. */
export function publicJobStatus(job: DataAnalysisJobRecord): DataAnalysisJobStatus {
  if (job.status === 'completed' && job.analysisModelId) return 'succeeded'
  if (job.status === 'completed') return 'completed'
  return job.status
}
