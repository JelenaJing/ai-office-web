import {
  getArtifactJob,
  isArtifactJobCanceledError,
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

    runningJobs += 1
      updateArtifactJob(job.id, {
        status: 'running',
        message: '正在调用 OpenCode 生成 HTML Artifact…',
        currentPhase: 'starting',
        cancellable: true,
      })

      void runHtmlArtifactJob(job)
        .then((result) => {
          const latest = getArtifactJob(job.id)
          if (!latest || latest.status === 'canceled') return
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
            selectedStyleId: result.selectedStyleId,
            rendererMode: result.rendererMode,
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
