import { getArtifactJob, updateArtifactJob } from './artifactJobStore'
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
    })

    void runHtmlArtifactJob(job)
      .then((result) => {
        updateArtifactJob(job.id, {
          status: 'succeeded',
          message: 'HTML Artifact 生成完成',
          artifactId: result.artifactId,
          artifactFileUrl: result.artifactFileUrl,
        })
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : String(error)
        recordArtifactJobFailure(job, message)
        updateArtifactJob(job.id, {
          status: 'failed',
          message,
          error: message,
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
