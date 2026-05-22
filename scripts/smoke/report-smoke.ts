import { smokeHttp, type SmokeContext } from './smoke-utils'

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {}
}

function record(ctx: SmokeContext, endpoint: string, expected: string, passed: boolean, actual: string, error?: string): void {
  ctx.record({
    module: 'report',
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

export default async function runReportSmoke(ctx: SmokeContext): Promise<void> {
  const ws = await workspacePath(ctx)
  if (!ws) return
  const date = new Date().toISOString().slice(0, 10)

  const matter = await ctx.request('POST', '/api/aios/matters', {
    workspacePath: ws,
    title: 'Report smoke Matter',
    goal: '验证日报可以收录 Matter 事件',
    status: 'draft',
    sourceType: 'manual',
  })
  const matterId = String(asRecord(asRecord(matter.body).matter).id || '')
  record(ctx, 'POST /api/aios/matters', 'Matter fixture created for report', matter.ok && Boolean(matterId), `HTTP ${matter.status} matterId=${matterId || 'missing'}`, matter.text)

  const artifact = await ctx.request('POST', '/api/artifacts', {
    workspacePath: ws,
    type: 'document',
    title: 'Report smoke Artifact',
    filename: 'report-smoke.md',
    format: 'md',
    content: '# Report smoke Artifact\n',
    matterId,
    sourceRefs: [{ type: 'matter', id: matterId || 'manual', label: 'Report smoke Matter' }],
  })
  const artifactId = String(asRecord(asRecord(artifact.body).artifact).id || '')
  record(ctx, 'POST /api/artifacts', 'Artifact fixture created for report', artifact.ok && Boolean(artifactId), `HTTP ${artifact.status} artifact=${artifactId || 'missing'}`, artifact.text)

  const events = [
    { type: 'matter', title: '处理 Report smoke Matter', module: 'aios', summary: 'Matter event should enter daily report', metadata: { matterId } },
    { type: 'artifact', title: '生成 Report smoke Artifact', module: 'resource-center', summary: 'Artifact event should enter daily report', metadata: { artifactId } },
    { type: 'email', title: '邮件整理事件', module: 'email', summary: 'Email event should enter daily report', metadata: { emailId: 'smoke-email-001' } },
  ]
  for (const event of events) {
    await smokeHttp(ctx, 'report', 'POST', '/api/work-report/events', `work report event recorded: ${event.type}`, {
      body: event,
      accept: (res) => res.ok && asRecord(res.body).success === true,
      actual: (res) => `HTTP ${res.status} event=${String(asRecord(asRecord(res.body).event).id || '')}`,
    })
  }

  await smokeHttp(ctx, 'report', 'GET', `/api/work-report/daily?date=${date}&workspacePath=${encodeURIComponent(ws)}`, 'daily report includes Matter/Artifact/email events and emits Artifact', {
    accept: (res) => {
      const body = asRecord(res.body)
      const reportEvents = Array.isArray(body.events) ? body.events as unknown[] : []
      const modules = new Set(reportEvents.map((event) => String(asRecord(event).module)))
      return res.ok
        && typeof body.artifactId === 'string'
        && modules.has('aios')
        && modules.has('resource-center')
        && modules.has('email')
    },
    actual: (res) => {
      const body = asRecord(res.body)
      return `HTTP ${res.status} artifact=${String(body.artifactId || '')} events=${Array.isArray(body.events) ? (body.events as unknown[]).length : 0}`
    },
  })

  await smokeHttp(ctx, 'report', 'GET', `/api/work-report/summary?date=${date}`, 'summary aggregates modules', {
    accept: (res) => {
      const modules = asRecord(asRecord(res.body).summary).modules
      return res.ok && Boolean(modules)
    },
    actual: (res) => `HTTP ${res.status} eventCount=${String(asRecord(asRecord(res.body).summary).eventCount || '')}`,
  })

  await smokeHttp(ctx, 'report', 'GET', '/api/work-report/subordinates', 'subordinates endpoint returns partial when hierarchy is unavailable', {
    accept: (res) => res.ok && Array.isArray(asRecord(res.body).partialMissing),
    actual: (res) => `HTTP ${res.status} subordinates=${Array.isArray(asRecord(res.body).subordinates) ? (asRecord(res.body).subordinates as unknown[]).length : 0}`,
  })
}
