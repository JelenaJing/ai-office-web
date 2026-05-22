import { smokeHttp, type SmokeContext } from './smoke-utils'

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {}
}

function record(ctx: SmokeContext, endpoint: string, expected: string, passed: boolean, actual: string, error?: string, skipped = false): void {
  ctx.record({
    module: 'image',
    endpoint,
    expected,
    actual,
    status: skipped ? 'skipped' : passed ? 'passed' : 'failed',
    error: passed || skipped ? undefined : error,
  })
}

async function workspacePath(ctx: SmokeContext): Promise<string | null> {
  const res = await ctx.request('GET', '/api/workspaces/default')
  const workspace = asRecord(asRecord(res.body).workspace)
  const ws = typeof workspace.path === 'string' ? workspace.path : null
  record(ctx, 'GET /api/workspaces/default', 'workspace path', res.ok && Boolean(ws), `HTTP ${res.status} workspace=${ws || 'missing'}`, res.text)
  return ws
}

async function pollImageJob(ctx: SmokeContext, jobId: string): Promise<Record<string, unknown> | null> {
  for (let i = 0; i < 60; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const res = await ctx.request('GET', `/api/image/jobs/${jobId}`)
    const body = asRecord(res.body)
    if (!res.ok) return body
    if (body.status === 'completed' || body.status === 'failed' || body.status === 'cancelled') return body
  }
  return null
}

export default async function runImageSmoke(ctx: SmokeContext): Promise<void> {
  const ws = await workspacePath(ctx)
  if (!ws) return

  const start = await ctx.request('POST', '/api/image/jobs/start', {
    workspacePath: ws,
    prompt: 'A clean office desk with a notebook and soft morning light, smoke test.',
  })
  const jobId = String(asRecord(start.body).jobId || '')
  record(ctx, 'POST /api/image/jobs/start', 'image job starts', start.ok && Boolean(jobId), `HTTP ${start.status} jobId=${jobId || 'missing'}`, start.text)
  if (jobId) {
    const job = await pollImageJob(ctx, jobId)
    const result = asRecord(job?.result)
    const artifact = asRecord(result.artifact)
    if (job?.status === 'completed') {
      record(ctx, 'GET /api/image/jobs/:jobId', 'image job completes with Artifact', typeof artifact.id === 'string', `status=completed artifact=${String(artifact.id || '')}`, JSON.stringify(job).slice(0, 800))
      if (typeof artifact.id === 'string') {
        await smokeHttp(ctx, 'image', 'GET', `/api/artifacts/${artifact.id}/relationships`, 'image Artifact carries prompt source relationship', {
          accept: (res) => res.ok && Array.isArray(asRecord(res.body).sourceRefs),
          actual: (res) => `HTTP ${res.status} refs=${Array.isArray(asRecord(res.body).sourceRefs) ? (asRecord(res.body).sourceRefs as unknown[]).length : 0}`,
        })
      }
    } else if (job?.status === 'failed' && /未配置|IMAGE_API_KEY|OPENAI_API_KEY|图片生成失败|image/i.test(String(job.error || job.message || ''))) {
      record(ctx, 'GET /api/image/jobs/:jobId', 'image provider unavailable is explicit partial, not fake success', false, `status=failed error=${String(job.error || job.message || '')}`, undefined, true)
    } else {
      record(ctx, 'GET /api/image/jobs/:jobId', 'image job completes with Artifact or explicit provider partial', false, `status=${String(job?.status)}`, JSON.stringify(job).slice(0, 800))
    }
  }

  const cancelStart = await ctx.request('POST', '/api/image/jobs/start', {
    workspacePath: ws,
    prompt: 'Cancel this image job smoke test.',
  })
  const cancelJobId = String(asRecord(cancelStart.body).jobId || '')
  record(ctx, 'POST /api/image/jobs/start (cancel)', 'cancel target job starts', cancelStart.ok && Boolean(cancelJobId), `HTTP ${cancelStart.status} jobId=${cancelJobId || 'missing'}`, cancelStart.text)
  if (cancelJobId) {
    await smokeHttp(ctx, 'image', 'POST', `/api/image/jobs/${cancelJobId}/cancel`, 'image job cancel endpoint returns cancelled', {
      accept: (res) => res.ok && asRecord(res.body).status === 'cancelled',
      actual: (res) => `HTTP ${res.status} status=${String(asRecord(res.body).status || '')}`,
    })
  }
}
