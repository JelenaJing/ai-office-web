import fs from 'fs'
import path from 'path'
import {
  getArtifactJob,
  updateArtifactJob,
  type ArtifactJobQualityMode,
  type ArtifactJobRecord,
} from './artifactJobStore'

export type ArtifactJobStage =
  | 'queued'
  | 'preparing'
  | 'loading_skills'
  | 'analyzing'
  | 'planning_slides'
  | 'planning_visuals'
  | 'running_opencode'
  | 'opencode_heartbeat'
  | 'postprocessing'
  | 'fulfilling_images'
  | 'packaging'
  | 'completed'
  | 'fallback'
  | 'failed'
  | 'canceled'

export type ArtifactJobProgress = {
  stage: ArtifactJobStage
  label: string
  detail?: string
  percent?: number
  startedAt?: string
  updatedAt?: string
  elapsedSeconds?: number
  heartbeatAt?: string
  heartbeatMessage?: string
}

const HIGH_STAGE_PERCENT: Record<ArtifactJobStage, number> = {
  queued: 0,
  preparing: 5,
  loading_skills: 10,
  analyzing: 18,
  planning_slides: 28,
  planning_visuals: 38,
  running_opencode: 55,
  opencode_heartbeat: 55,
  postprocessing: 70,
  fulfilling_images: 82,
  packaging: 92,
  completed: 100,
  fallback: 100,
  failed: 100,
  canceled: 100,
}

const FAST_STAGE_PERCENT: Record<ArtifactJobStage, number> = {
  queued: 0,
  preparing: 10,
  loading_skills: 10,
  analyzing: 10,
  planning_slides: 10,
  planning_visuals: 10,
  running_opencode: 50,
  opencode_heartbeat: 50,
  postprocessing: 75,
  fulfilling_images: 75,
  packaging: 90,
  completed: 100,
  fallback: 100,
  failed: 100,
  canceled: 100,
}

const HTML_PPT_FAST_TIMEOUT_MS = 300_000
const HTML_PPT_HIGH_TIMEOUT_MS = 900_000

export const OPENCODE_HEARTBEAT_INTERVAL_MS = 15_000

export function resolveHtmlPptOpenCodeTimeoutMs(params: {
  qualityMode?: ArtifactJobQualityMode
}): { timeoutMs: number; timeoutSeconds: number; timeoutSource: string } {
  if (params.qualityMode === 'high') {
    return {
      timeoutMs: HTML_PPT_HIGH_TIMEOUT_MS,
      timeoutSeconds: HTML_PPT_HIGH_TIMEOUT_MS / 1000,
      timeoutSource: 'high-quality-default',
    }
  }
  return {
    timeoutMs: HTML_PPT_FAST_TIMEOUT_MS,
    timeoutSeconds: HTML_PPT_FAST_TIMEOUT_MS / 1000,
    timeoutSource: 'fast-default',
  }
}

export function logHtmlPptTimeoutConfig(qualityMode: ArtifactJobQualityMode | undefined): void {
  const config = resolveHtmlPptOpenCodeTimeoutMs({ qualityMode })
  console.info(
    `htmlPptTimeout qualityMode=${qualityMode ?? 'fast'} timeoutMs=${config.timeoutMs} timeoutSeconds=${config.timeoutSeconds} timeoutSource=${config.timeoutSource}`,
  )
}

function stagePercent(stage: ArtifactJobStage, qualityMode?: ArtifactJobQualityMode): number {
  const map = qualityMode === 'high' ? HIGH_STAGE_PERCENT : FAST_STAGE_PERCENT
  return map[stage] ?? 0
}

function resolveProgressStartedAt(job: ArtifactJobRecord, explicit?: string): string {
  if (explicit) return explicit
  const existing = job.progress?.startedAt
  if (existing) return existing
  return new Date(job.createdAt).toISOString()
}

export function cleanAnsi(input: string): string {
  return input.replace(/\u001b\[[0-9;]*m/g, '')
}

export function truncate(input: string, max = 500): string {
  if (input.length <= max) return input
  return `${input.slice(0, max)}…`
}

export function redactSensitive(input: string): string {
  return input
    .replace(/(api[_-]?key\s*[:=]\s*)[^\s]+/gi, '$1[REDACTED]')
    .replace(/(token\s*[:=]\s*)[^\s]+/gi, '$1[REDACTED]')
    .replace(/(secret\s*[:=]\s*)[^\s]+/gi, '$1[REDACTED]')
    .replace(/(authorization\s*[:=]\s*)[^\n]+/gi, '$1[REDACTED]')
    .replace(/(bearer\s+)[a-z0-9._-]+/gi, '$1[REDACTED]')
    .replace(/(IMAGE_API_KEY\s*[:=]\s*)[^\s]+/gi, '$1[REDACTED]')
    .replace(/(IMAGE_ENDPOINT\s*[:=]\s*)[^\s]+/gi, '$1[REDACTED]')
}

export function sanitizeOpenCodeOutputLine(input: string, max = 500): string {
  const cleaned = redactSensitive(cleanAnsi(input)).replace(/\s+/g, ' ').trim()
  return truncate(cleaned, max)
}

export function buildProgressPatch(
  job: ArtifactJobRecord,
  stage: ArtifactJobStage,
  label: string,
  options?: {
    detail?: string
    percent?: number
    heartbeatAt?: string
    heartbeatMessage?: string
    startedAt?: string
  },
): ArtifactJobProgress {
  const qualityMode = job.htmlPresentationOptions?.qualityMode
  const nowIso = new Date().toISOString()
  const startedAt = resolveProgressStartedAt(job, options?.startedAt)
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - Date.parse(startedAt)) / 1000))
  return {
    stage,
    label,
    detail: options?.detail,
    percent: options?.percent ?? stagePercent(stage, qualityMode),
    startedAt,
    updatedAt: nowIso,
    elapsedSeconds,
    heartbeatAt: options?.heartbeatAt,
    heartbeatMessage: options?.heartbeatMessage,
  }
}

export function patchArtifactJobProgress(
  jobId: string,
  stage: ArtifactJobStage,
  label: string,
  options?: {
    detail?: string
    percent?: number
    heartbeatAt?: string
    heartbeatMessage?: string
    currentPhase?: string
    message?: string
    logLine?: string
  },
): void {
  try {
    const job = getArtifactJob(jobId)
    if (!job) return
    const progress = buildProgressPatch(job, stage, label, options)
    updateArtifactJob(jobId, {
      progress,
      currentPhase: options?.currentPhase ?? stage,
      message: options?.message ?? label,
    })
    if (options?.logLine) {
      appendArtifactJobLogLine(job, options.logLine)
    }
  } catch {
    // progress updates must not fail the job
  }
}

export function appendArtifactJobLogLine(job: ArtifactJobRecord, message: string): void {
  try {
    fs.mkdirSync(path.dirname(job.logPath), { recursive: true })
    const safe = sanitizeOpenCodeOutputLine(message, 500)
    fs.appendFileSync(job.logPath, `[${new Date().toISOString()}] ${safe}\n`, 'utf-8')
  } catch {
    // ignore
  }
}

export function readArtifactJobLogTail(logPath: string, limit = 20): string[] {
  try {
    if (!fs.existsSync(logPath)) return []
    const lines = fs.readFileSync(logPath, 'utf-8').split(/\r?\n/).filter(Boolean)
    return lines.slice(-limit)
  } catch {
    return []
  }
}

export function buildHighQualityTimeoutFallbackWarning(timeoutSeconds: number): string {
  return `高质量生成在 ${timeoutSeconds} 秒内未完成，已生成一个可预览草稿。你可以重新生成，或减少内容后再次尝试高质量生成。`
}

export function buildFastTimeoutFallbackWarning(timeoutSeconds: number): string {
  return `PPT 已生成，但 OpenCode 在 ${timeoutSeconds} 秒内未完成，已生成一个可预览初稿。`
}
