import { randomUUID } from 'crypto'
import type { AnalyzeXlsxResult } from '../skills/analyzeXlsxSkill'

export interface AnalysisJobRecord {
  jobId: string
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: number
  message: string
  result?: AnalyzeXlsxResult
  error?: string
  cancelRequested: boolean
  createdAt: number
  updatedAt: number
}

const jobs = new Map<string, AnalysisJobRecord>()

const JOB_TTL_MS = 60 * 60 * 1000
setInterval(() => {
  const cutoff = Date.now() - JOB_TTL_MS
  for (const [jobId, job] of jobs.entries()) {
    if (job.createdAt < cutoff) jobs.delete(jobId)
  }
}, 5 * 60 * 1000).unref()

export function createAnalysisJob(): AnalysisJobRecord {
  const now = Date.now()
  const job: AnalysisJobRecord = {
    jobId: randomUUID(),
    status: 'queued',
    progress: 0,
    message: '任务已排队',
    cancelRequested: false,
    createdAt: now,
    updatedAt: now,
  }
  jobs.set(job.jobId, job)
  return job
}

export function getAnalysisJob(jobId: string): AnalysisJobRecord | undefined {
  return jobs.get(jobId)
}

export function updateAnalysisJob(jobId: string, patch: Partial<AnalysisJobRecord>): void {
  const job = jobs.get(jobId)
  if (!job) return
  Object.assign(job, patch, { updatedAt: Date.now() })
}

export function requestAnalysisJobCancel(jobId: string): AnalysisJobRecord | undefined {
  const job = jobs.get(jobId)
  if (!job) return undefined
  job.cancelRequested = true
  job.status = 'cancelled'
  job.progress = 100
  job.message = '任务已取消'
  job.updatedAt = Date.now()
  return job
}
