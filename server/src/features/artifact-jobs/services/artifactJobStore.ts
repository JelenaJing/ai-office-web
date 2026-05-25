import { randomUUID } from 'crypto'

export type ArtifactJobStatus = 'queued' | 'running' | 'succeeded' | 'failed'
export type ArtifactJobType = 'html' | 'html_presentation'

export interface ArtifactJobRecord {
  id: string
  userId: string
  type: ArtifactJobType
  skillId?: string
  prompt: string
  jobDir: string
  inputPath: string
  skillPath: string
  outputPath: string
  logPath: string
  errorPath: string
  artifactId?: string
  artifactFileUrl?: string
  status: ArtifactJobStatus
  message: string
  error?: string
  createdAt: number
  updatedAt: number
}

export interface RegisterArtifactJobInput {
  id?: string
  userId: string
  type: ArtifactJobType
  skillId?: string
  prompt: string
  jobDir: string
  inputPath: string
  skillPath: string
  outputPath: string
  logPath: string
  errorPath: string
}

const jobs = new Map<string, ArtifactJobRecord>()

const JOB_TTL_MS = 60 * 60 * 1000
setInterval(() => {
  const cutoff = Date.now() - JOB_TTL_MS
  for (const [jobId, job] of jobs.entries()) {
    if (job.createdAt < cutoff) jobs.delete(jobId)
  }
}, 5 * 60 * 1000).unref()

export function registerArtifactJob(input: RegisterArtifactJobInput): ArtifactJobRecord {
  const now = Date.now()
  const job: ArtifactJobRecord = {
    id: input.id ?? randomUUID(),
    userId: input.userId,
    type: input.type,
    skillId: input.skillId,
    prompt: input.prompt,
    jobDir: input.jobDir,
    inputPath: input.inputPath,
    skillPath: input.skillPath,
    outputPath: input.outputPath,
    logPath: input.logPath,
    errorPath: input.errorPath,
    status: 'queued',
    message: '任务已排队',
    createdAt: now,
    updatedAt: now,
  }
  jobs.set(job.id, job)
  return job
}

export function getArtifactJob(jobId: string): ArtifactJobRecord | undefined {
  return jobs.get(jobId)
}

export function updateArtifactJob(jobId: string, patch: Partial<ArtifactJobRecord>): ArtifactJobRecord | undefined {
  const job = jobs.get(jobId)
  if (!job) return undefined
  Object.assign(job, patch, { updatedAt: Date.now() })
  return job
}
