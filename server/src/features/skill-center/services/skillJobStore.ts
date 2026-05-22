import { randomUUID } from 'crypto'

export interface SkillJobRecord {
  jobId: string
  skillId: string
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: number
  message: string
  result?: unknown
  error?: string
  cancelRequested: boolean
  createdAt: number
  updatedAt: number
}

const jobs = new Map<string, SkillJobRecord>()

export function createSkillJob(skillId: string): SkillJobRecord {
  const now = Date.now()
  const job: SkillJobRecord = {
    jobId: randomUUID(),
    skillId,
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

export function getSkillJob(jobId: string): SkillJobRecord | undefined {
  return jobs.get(jobId)
}

export function updateSkillJob(jobId: string, patch: Partial<SkillJobRecord>): void {
  const job = jobs.get(jobId)
  if (!job) return
  Object.assign(job, patch, { updatedAt: Date.now() })
}

export function cancelSkillJob(jobId: string): SkillJobRecord | undefined {
  const job = jobs.get(jobId)
  if (!job) return undefined
  job.cancelRequested = true
  job.status = 'cancelled'
  job.progress = 100
  job.message = '任务已取消'
  job.updatedAt = Date.now()
  return job
}
