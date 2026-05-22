import { smokeHttp, type SmokeContext } from './smoke-utils'

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {}
}

function record(ctx: SmokeContext, endpoint: string, expected: string, passed: boolean, actual: string, error?: string): void {
  ctx.record({
    module: 'skill',
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

async function pollSkillJob(ctx: SmokeContext, jobId: string): Promise<Record<string, unknown> | null> {
  for (let i = 0; i < 60; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const res = await ctx.request('GET', `/api/skill-center/jobs/${jobId}`)
    const body = asRecord(res.body)
    if (!res.ok) return body
    if (body.status === 'completed' || body.status === 'failed' || body.status === 'cancelled') return body
  }
  return null
}

export default async function runSkillSmoke(ctx: SmokeContext): Promise<void> {
  const ws = await workspacePath(ctx)
  if (!ws) return
  const date = new Date().toISOString().slice(0, 10)

  await smokeHttp(ctx, 'skill', 'GET', '/api/skills', 'built-in skills list contains daily report skill', {
    accept: (res) => {
      const skills = Array.isArray(asRecord(res.body).skills) ? asRecord(res.body).skills as unknown[] : []
      return res.ok && skills.some((skill) => asRecord(skill).id === 'web.daily.report')
    },
    actual: (res) => `HTTP ${res.status} skills=${Array.isArray(asRecord(res.body).skills) ? (asRecord(res.body).skills as unknown[]).length : 0}`,
  })

  await smokeHttp(ctx, 'skill', 'POST', '/api/skills/web.daily.report/run', 'direct skill run returns report Artifact', {
    body: { workspacePath: ws, params: { date } },
    accept: (res) => res.ok && typeof asRecord(asRecord(res.body).artifact).id === 'string',
    actual: (res) => `HTTP ${res.status} artifact=${String(asRecord(asRecord(res.body).artifact).id || '')}`,
  })

  await smokeHttp(ctx, 'skill', 'GET', '/api/skill-center/status', 'skill center status exposes partial AOSKIN gap', {
    accept: (res) => res.ok && asRecord(res.body).status === 'partial' && Array.isArray(asRecord(res.body).partialMissing),
    actual: (res) => `HTTP ${res.status} status=${String(asRecord(res.body).status || '')}`,
  })

  const start = await ctx.request('POST', '/api/skill-center/jobs/start', {
    skillId: 'web.daily.report',
    input: { workspacePath: ws, date },
  })
  const jobId = String(asRecord(start.body).jobId || '')
  record(ctx, 'POST /api/skill-center/jobs/start', 'async skill-center job starts', start.ok && Boolean(jobId), `HTTP ${start.status} jobId=${jobId || 'missing'}`, start.text)
  if (!jobId) return
  const job = await pollSkillJob(ctx, jobId)
  const result = asRecord(job?.result)
  const artifact = asRecord(result.artifact)
  record(ctx, 'GET /api/skill-center/jobs/:jobId', 'async skill-center job completes with Artifact or no-artifact reason', job?.status === 'completed' && typeof artifact.id === 'string', `status=${String(job?.status)} artifact=${String(artifact.id || '')}`, JSON.stringify(job).slice(0, 800))
}
