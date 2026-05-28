import { patchArtifactJobProgress } from './artifactJobProgress'
import {
  getArtifactJob,
  isArtifactJobCanceledError,
  isArtifactJobCancellationRequested,
  updateArtifactJob,
} from './artifactJobStore'
import { recordArtifactJobFailure, runHtmlArtifactJob } from './opencodeHtmlArtifactRunner'

const MAX_RUNNING_JOBS = 3

const pendingJobIds: string[] = []
const enqueuedJobIds = new Set<string>()
let runningJobs = 0

function scheduleNext(): void {
  while (runningJobs < MAX_RUNNING_JOBS && pendingJobIds.length > 0) {
    const nextJobId = pendingJobIds.shift()
    if (!nextJobId) continue
    enqueuedJobIds.delete(nextJobId)
    const job = getArtifactJob(nextJobId)
    if (!job || job.status !== 'queued') continue
    if (isArtifactJobCancellationRequested(job.id)) {
      updateArtifactJob(job.id, {
        status: 'canceled',
        message: '已停止生成',
        currentPhase: 'canceled',
        cancellable: false,
      })
      continue
    }

    runningJobs += 1
      updateArtifactJob(job.id, {
        status: 'running',
        message: '正在调用 OpenCode 生成 HTML Artifact…',
        currentPhase: 'starting',
        cancellable: true,
      })
      patchArtifactJobProgress(job.id, 'preparing', '正在准备生成工作区', {
        currentPhase: 'starting',
      })

      void runHtmlArtifactJob(job)
        .then((result) => {
          const latest = getArtifactJob(job.id)
          if (!latest || latest.status === 'canceled') return
          const completedStage = result.fallbackUsed ? 'fallback' as const : 'completed' as const
          const completedLabel = result.fallbackUsed
            ? '高质量生成超时，已生成快速草稿'
            : '生成完成'
          patchArtifactJobProgress(job.id, completedStage, completedLabel)
          updateArtifactJob(job.id, {
            status: 'succeeded',
            message: result.message || 'HTML Artifact 生成完成',
            currentPhase: 'completed',
            artifactId: result.artifactId,
            artifactFileUrl: result.artifactFileUrl,
            cancellable: false,
            warning: result.warning,
            fallbackUsed: result.fallbackUsed,
            fallbackRenderer: result.fallbackRenderer,
            opencodeTimedOut: result.opencodeTimedOut,
            timeoutMs: result.timeoutMs,
            requestedTemplateSlug: result.requestedTemplateSlug,
            selectedTemplateSlug: result.selectedTemplateSlug,
            appliedTemplateSlug: result.appliedTemplateSlug,
            selectedStyleId: result.selectedStyleId,
            rendererMode: result.rendererMode,
            fallbackReason: result.fallbackReason,
            templateStyleApplied: result.templateStyleApplied,
            repairAttempted: result.repairAttempted,
            repairSucceeded: result.repairSucceeded,
            imageStats: latest?.imageStats,
            skillStats: latest?.skillStats,
          })
        })
        .catch((error) => {
          const latest = getArtifactJob(job.id)
          if (latest?.status === 'canceled' || isArtifactJobCanceledError(error)) {
            updateArtifactJob(job.id, {
              status: 'canceled',
              message: '已停止生成',
              currentPhase: 'canceled',
              cancellable: false,
              error: undefined,
            })
            return
          }
          const message = error instanceof Error ? error.message : String(error)
          recordArtifactJobFailure(job, message)
          patchArtifactJobProgress(job.id, 'failed', '生成失败', {
            detail: message.slice(0, 200),
          })
          updateArtifactJob(job.id, {
            status: 'failed',
            message,
            error: message,
            currentPhase: 'failed',
            cancellable: false,
          })
        })
      .finally(() => {
        runningJobs = Math.max(0, runningJobs - 1)
        scheduleNext()
      })
  }
}

export function enqueueArtifactJob(jobId: string): void {
  if (enqueuedJobIds.has(jobId)) return
  pendingJobIds.push(jobId)
  enqueuedJobIds.add(jobId)
  scheduleNext()
}
