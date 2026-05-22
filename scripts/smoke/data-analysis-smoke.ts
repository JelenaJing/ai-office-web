import { smokeHttp, type SmokeContext } from './smoke-utils'

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {}
}

function record(ctx: SmokeContext, endpoint: string, expected: string, passed: boolean, actual: string, error?: string): void {
  ctx.record({
    module: 'data-analysis',
    endpoint,
    expected,
    actual,
    status: passed ? 'passed' : 'failed',
    error: passed ? undefined : error,
  })
}

async function workspacePath(ctx: SmokeContext): Promise<string | null> {
  const res = await ctx.request('GET', '/api/workspaces/default')
  const workspace = asRecord(asRecord(res.body).workspace)
  const ws = typeof workspace.path === 'string' ? workspace.path : null
  record(ctx, 'GET /api/workspaces/default', 'workspace path', res.ok && Boolean(ws), `HTTP ${res.status} workspace=${ws || 'missing'}`, res.text)
  return ws
}

async function uploadCsv(ctx: SmokeContext): Promise<string> {
  const form = new FormData()
  form.append('file', new Blob(['month,revenue,cost\nJan,120,80\nFeb,150,95\nMar,180,120\n'], { type: 'text/csv' }), 'smoke-analysis.csv')
  const response = await fetch(`${ctx.baseUrl}/api/files/upload`, {
    method: 'POST',
    headers: ctx.token ? { Authorization: `Bearer ${ctx.token}` } : {},
    body: form,
  })
  const text = await response.text()
  let body: unknown = {}
  try {
    body = text ? JSON.parse(text) : {}
  } catch {
    body = { raw: text }
  }
  const fileId = String(asRecord(asRecord(body).file).id || '')
  record(ctx, 'POST /api/files/upload', 'CSV fixture uploaded', response.ok && Boolean(fileId), `HTTP ${response.status} fileId=${fileId || 'missing'}`, text)
  return fileId
}

async function pollAnalysisJob(ctx: SmokeContext, jobId: string): Promise<Record<string, unknown> | null> {
  for (let i = 0; i < 60; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const res = await ctx.request('GET', `/api/data-analysis/jobs/${jobId}`)
    const body = asRecord(res.body)
    if (!res.ok) return body
    if (body.status === 'completed' || body.status === 'failed' || body.status === 'cancelled') return body
  }
  return null
}

export default async function runDataAnalysisSmoke(ctx: SmokeContext): Promise<void> {
  const ws = await workspacePath(ctx)
  if (!ws) return
  const fileId = await uploadCsv(ctx)
  if (!fileId) return

  const start = await ctx.request('POST', '/api/data-analysis/jobs/start', {
    workspacePath: ws,
    fileId,
    prompt: 'Summarize revenue and cost columns.',
  })
  const jobId = String(asRecord(start.body).jobId || '')
  record(ctx, 'POST /api/data-analysis/jobs/start', 'analysis job starts', start.ok && Boolean(jobId), `HTTP ${start.status} jobId=${jobId || 'missing'}`, start.text)
  if (!jobId) return

  const job = await pollAnalysisJob(ctx, jobId)
  const result = asRecord(job?.result)
  const artifact = asRecord(result.artifact)
  record(ctx, 'GET /api/data-analysis/jobs/:jobId', 'analysis job completes with markdown report Artifact', job?.status === 'completed' && artifact.type === 'excel_analysis', `status=${String(job?.status)} artifact=${String(artifact.id || '')}`, JSON.stringify(job).slice(0, 800))

  await smokeHttp(ctx, 'data-analysis', 'GET', `/api/data-analysis/jobs/${jobId}/artifacts`, 'analysis job exposes Artifact list', {
    accept: (res) => {
      const artifacts = Array.isArray(asRecord(res.body).artifacts) ? asRecord(res.body).artifacts as unknown[] : []
      return res.ok && artifacts.length === 1
    },
    actual: (res) => `HTTP ${res.status} artifacts=${Array.isArray(asRecord(res.body).artifacts) ? (asRecord(res.body).artifacts as unknown[]).length : 0}`,
  })

  if (typeof artifact.id === 'string') {
    await smokeHttp(ctx, 'data-analysis', 'GET', `/api/artifacts/${artifact.id}/preview`, 'markdown analysis preview is readable', {
      accept: (res) => res.ok && res.text.includes('表格分析报告'),
      actual: (res) => `HTTP ${res.status} bytes=${res.text.length}`,
    })
    await smokeHttp(ctx, 'data-analysis', 'GET', `/api/artifacts/${artifact.id}/relationships`, 'analysis Artifact carries source file reference', {
      accept: (res) => res.ok && asRecord(res.body).documentId === fileId && Array.isArray(asRecord(res.body).sourceRefs),
      actual: (res) => `HTTP ${res.status} documentId=${String(asRecord(res.body).documentId || '')}`,
    })
  }
}
