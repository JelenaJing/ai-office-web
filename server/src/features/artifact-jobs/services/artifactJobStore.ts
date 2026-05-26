import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

export type ArtifactJobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled'
export type ArtifactJobType = 'html' | 'html_presentation'
export type ArtifactJobQualityMode = 'fast' | 'high'

export interface ArtifactJobHtmlPresentationOptions {
  templateSlug?: string
  enableImages: boolean
  maxImages: number
  qualityMode: ArtifactJobQualityMode
}

export interface ArtifactJobRecord {
  id: string
  userId: string
  type: ArtifactJobType
  skillId?: string
  prompt: string
  htmlPresentationOptions?: ArtifactJobHtmlPresentationOptions
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
  cancelRequestedAt?: string
  canceledAt?: string
  cancelReason?: string
  runnerPid?: number
  runnerProcessGroupId?: number
  currentPhase?: string
  cancellable?: boolean
  partialOutput?: boolean
  warning?: string
  fallbackUsed?: boolean
  fallbackRenderer?: string
  opencodeTimedOut?: boolean
  timeoutMs?: number
  requestedTemplateSlug?: string
  selectedTemplateSlug?: string
  selectedStyleId?: string
  rendererMode?: string
}

export interface RegisterArtifactJobInput {
  id?: string
  userId: string
  type: ArtifactJobType
  skillId?: string
  prompt: string
  htmlPresentationOptions?: ArtifactJobHtmlPresentationOptions
  jobDir: string
  inputPath: string
  skillPath: string
  outputPath: string
  logPath: string
  errorPath: string
}

interface ArtifactJobRuntimeControl {
  abortController: AbortController
  terminate?: (reason: string) => void | Promise<void>
}

export class ArtifactJobCanceledError extends Error {
  readonly code = 'ARTIFACT_JOB_CANCELED'

  constructor(message = 'Artifact job canceled') {
    super(message)
    this.name = 'ArtifactJobCanceledError'
  }
}

const jobs = new Map<string, ArtifactJobRecord>()
const runtimes = new Map<string, ArtifactJobRuntimeControl>()

const JOB_TTL_MS = 60 * 60 * 1000
setInterval(() => {
  const cutoff = Date.now() - JOB_TTL_MS
  for (const [jobId, job] of jobs.entries()) {
    if (job.createdAt < cutoff) {
      jobs.delete(jobId)
      runtimes.delete(jobId)
    }
  }
}, 5 * 60 * 1000).unref()

function appendJobLog(job: ArtifactJobRecord, message: string): void {
  fs.mkdirSync(path.dirname(job.logPath), { recursive: true })
  fs.appendFileSync(job.logPath, `[${new Date().toISOString()}] ${message}\n`, 'utf-8')
}

export function isArtifactJobTerminalStatus(status: ArtifactJobStatus): boolean {
  return status === 'succeeded' || status === 'failed' || status === 'canceled'
}

export function isArtifactJobCanceledError(error: unknown): error is ArtifactJobCanceledError {
  return error instanceof ArtifactJobCanceledError
}

export function registerArtifactJob(input: RegisterArtifactJobInput): ArtifactJobRecord {
  const now = Date.now()
  const job: ArtifactJobRecord = {
    id: input.id ?? randomUUID(),
    userId: input.userId,
    type: input.type,
    skillId: input.skillId,
    prompt: input.prompt,
    htmlPresentationOptions: input.htmlPresentationOptions,
    jobDir: input.jobDir,
    inputPath: input.inputPath,
    skillPath: input.skillPath,
    outputPath: input.outputPath,
    logPath: input.logPath,
    errorPath: input.errorPath,
    status: 'queued',
    message: '任务已排队',
    currentPhase: 'queued',
    cancellable: true,
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
  if (isArtifactJobTerminalStatus(job.status)) {
    job.cancellable = false
  } else if (patch.cancellable === undefined && typeof job.cancellable !== 'boolean') {
    job.cancellable = true
  }
  return job
}

export function registerArtifactJobRuntime(jobId: string, runtime: ArtifactJobRuntimeControl): void {
  runtimes.set(jobId, runtime)
}

export function clearArtifactJobRuntime(jobId: string): void {
  runtimes.delete(jobId)
}

export function isArtifactJobCancellationRequested(jobId: string): boolean {
  const job = jobs.get(jobId)
  return Boolean(job && (job.status === 'canceled' || job.cancelRequestedAt))
}

export function assertArtifactJobNotCanceled(jobId: string, phase?: string): void {
  const job = jobs.get(jobId)
  if (!job || (!job.cancelRequestedAt && job.status !== 'canceled')) return
  if (phase) appendJobLog(job, `cancellation acknowledged during ${phase}`)
  throw new ArtifactJobCanceledError(job.cancelReason || 'Artifact job canceled')
}

export function requestArtifactJobCancel(jobId: string, reason = 'user_cancelled'): {
  job: ArtifactJobRecord
  alreadyFinished: boolean
} | undefined {
  const job = jobs.get(jobId)
  if (!job) return undefined

  if (isArtifactJobTerminalStatus(job.status)) {
    return { job, alreadyFinished: true }
  }

  const canceledAt = new Date().toISOString()
  Object.assign(job, {
    status: 'canceled',
    message: '已停止生成',
    currentPhase: 'canceled',
    cancelRequestedAt: job.cancelRequestedAt ?? canceledAt,
    canceledAt: job.canceledAt ?? canceledAt,
    cancelReason: reason,
    cancellable: false,
    updatedAt: Date.now(),
  } satisfies Partial<ArtifactJobRecord>)

  appendJobLog(job, `cancel requested: ${reason}`)

  const runtime = runtimes.get(jobId)
  if (!runtime) {
    appendJobLog(job, 'runner terminated')
    appendJobLog(job, 'cleanup completed')
    return { job, alreadyFinished: false }
  }

  try {
    runtime.abortController.abort(new ArtifactJobCanceledError(reason))
  } catch {
    // no-op
  }

  void Promise.resolve(runtime.terminate?.(reason))
    .then(() => {
      appendJobLog(job, 'runner terminated')
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : String(error)
      appendJobLog(job, `runner terminate warning: ${message}`)
    })
    .finally(() => {
      appendJobLog(job, 'cleanup completed')
    })

  return { job, alreadyFinished: false }
}
