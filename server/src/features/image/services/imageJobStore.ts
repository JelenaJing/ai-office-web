import { randomUUID } from 'crypto'
import type { CreateImageResult } from '../skills/createImageSkill'

export interface ImageJobRecord {
  jobId: string
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: number
  message: string
  result?: CreateImageResult
  error?: string
  cancelRequested: boolean
  createdAt: number
  updatedAt: number
}

const jobs = new Map<string, ImageJobRecord>()

const JOB_TTL_MS = 60 * 60 * 1000
setInterval(() => {
  const cutoff = Date.now() - JOB_TTL_MS
  for (const [jobId, job] of jobs.entries()) {
    if (job.createdAt < cutoff) jobs.delete(jobId)
  }
}, 5 * 60 * 1000).unref()

export function createImageJob(): ImageJobRecord {
  const now = Date.now()
  const job: ImageJobRecord = {
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

export function getImageJob(jobId: string): ImageJobRecord | undefined {
  return jobs.get(jobId)
}

export function updateImageJob(jobId: string, patch: Partial<ImageJobRecord>): void {
  const job = jobs.get(jobId)
  if (!job) return
  Object.assign(job, patch, { updatedAt: Date.now() })
}

export function requestImageJobCancel(jobId: string): ImageJobRecord | undefined {
  const job = jobs.get(jobId)
  if (!job) return undefined
  job.cancelRequested = true
  job.status = 'cancelled'
  job.message = '任务已取消'
  job.updatedAt = Date.now()
  return job
}
