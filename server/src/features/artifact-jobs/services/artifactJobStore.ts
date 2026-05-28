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

export interface ArtifactJobImageStats {
  planned: number
  required?: number
  optional?: number
  resolvedMaxImages?: number
  generated: number
  placeholder: number
  unfilled?: number
  budgetSource?: string
  providerConfigured?: boolean
}

export interface ArtifactJobSkillStats {
  mode: 'fast-lite' | 'fast-template-driven' | 'high-original-five-skills'
  requiredSkills?: string[]
  loadedSkills?: string[]
  missingSkills?: string[]
  usesLiteSkill?: boolean
  usesOriginalFiveSkills?: boolean
}

import { patchArtifactJobProgress, type ArtifactJobProgress } from './artifactJobProgress'

export type { ArtifactJobProgress, ArtifactJobStage } from './artifactJobProgress'

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
  noOutputSoftTimeoutTriggered?: boolean
  timeoutMs?: number
  requestedTemplateSlug?: string
  selectedTemplateSlug?: string
  appliedTemplateSlug?: string | null
  selectedStyleId?: string
  rendererMode?: string
  fallbackReason?: string
  templateStyleApplied?: 'full' | 'basic' | 'not-applied'
  repairAttempted?: boolean
  repairSucceeded?: boolean
  imageStats?: ArtifactJobImageStats
  skillStats?: ArtifactJobSkillStats
  progress?: ArtifactJobProgress
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
    progress: {
      stage: 'queued',
      label: '已加入生成队列',
      percent: 0,
      startedAt: new Date(now).toISOString(),
      updatedAt: new Date(now).toISOString(),
      elapsedSeconds: 0,
    },
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
  message: string
} | undefined {
  const job = jobs.get(jobId)
  if (!job) return undefined

  if (job.status === 'succeeded') {
    return { job, alreadyFinished: true, message: 'already completed' }
  }
  if (job.status === 'failed') {
    return { job, alreadyFinished: true, message: 'already failed' }
  }
  if (job.status === 'canceled') {
    return { job, alreadyFinished: true, message: 'already cancelled' }
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
    progress: {
      stage: 'canceled',
      label: '已停止生成',
      detail: '任务已被用户取消。',
      percent: 100,
      startedAt: job.progress?.startedAt ?? canceledAt,
      updatedAt: canceledAt,
      elapsedSeconds: job.progress?.elapsedSeconds,
    } satisfies ArtifactJobProgress,
  } satisfies Partial<ArtifactJobRecord>)

  appendJobLog(job, `cancel requested: ${reason}`)
  console.info(`htmlPptJobCancelled jobId=${jobId} reason=${reason}`)

  const runtime = runtimes.get(jobId)
  if (!runtime) {
    appendJobLog(job, 'runner terminated')
    appendJobLog(job, 'cleanup completed')
    return { job, alreadyFinished: false, message: 'cancelled' }
  }

  try {
    runtime.abortController.abort(new ArtifactJobCanceledError(reason))
  } catch {
    // no-op
  }

  void Promise.resolve(runtime.terminate?.(reason))
    .then(() => {
      appendJobLog(job, 'runner terminated')
      console.info(`opencodeProcessKilled jobId=${jobId}`)
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : String(error)
      appendJobLog(job, `runner terminate warning: ${message}`)
    })
    .finally(() => {
      clearArtifactJobRuntime(jobId)
      patchArtifactJobProgress(jobId, 'canceled', '已停止生成', {
        detail: '任务已被用户取消。',
        currentPhase: 'canceled',
      })
      appendJobLog(job, 'cleanup completed')
    })

  return { job, alreadyFinished: false, message: 'cancelled' }
}
