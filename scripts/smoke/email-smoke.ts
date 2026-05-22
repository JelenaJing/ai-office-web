import fs from 'fs'
import path from 'path'
import { smokeHttp, type SmokeContext } from './smoke-utils'

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {}
}

function record(ctx: SmokeContext, endpoint: string, expected: string, passed: boolean, actual: string, error?: string, skipped = false): void {
  ctx.record({
    module: 'email',
    endpoint,
    expected,
    actual,
    status: skipped ? 'skipped' : passed ? 'passed' : 'failed',
    error: passed || skipped ? undefined : error,
  })
}

function writeManualSetupNote(): void {
  const docsDir = path.resolve(process.cwd(), 'docs/smoke')
  fs.mkdirSync(docsDir, { recursive: true })
  fs.writeFileSync(
    path.join(docsDir, 'manual-email-setup-needed.md'),
    [
      '# Manual Email Setup Needed',
      '',
      'Email E2E smoke did not find a configured IMAP/SMTP account for the test user.',
      '',
      'Configure `/api/email/account` in the Web UI or via API, then rerun:',
      '',
      '```bash',
      'npx tsx scripts/smoke/run-web-parity-smoke.ts email',
      '```',
      '',
    ].join('\n'),
  )
}

async function workspacePath(ctx: SmokeContext): Promise<string | null> {
  const res = await ctx.request('GET', '/api/workspaces/default')
  const workspace = asRecord(asRecord(res.body).workspace)
  const ws = typeof workspace.path === 'string' ? workspace.path : null
  record(ctx, 'GET /api/workspaces/default', 'workspace path', res.ok && Boolean(ws), `HTTP ${res.status} workspace=${ws || 'missing'}`, res.text)
  return ws
}

async function pollTriageTask(ctx: SmokeContext, taskId: string): Promise<Record<string, unknown> | null> {
  for (let i = 0; i < 60; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const res = await ctx.request('GET', `/api/email/triage/tasks/${taskId}`)
    const body = asRecord(res.body)
    if (!res.ok) return body
    if (body.status === 'completed' || body.status === 'failed' || body.status === 'cancelled') return body
  }
  return null
}

async function runConfiguredAccountSmoke(ctx: SmokeContext, workspacePathValue: string): Promise<void> {
  const inbox = await ctx.request('GET', '/api/email/messages?folder=inbox')
  const messages = Array.isArray(asRecord(inbox.body).messages) ? asRecord(inbox.body).messages as unknown[] : []
  record(ctx, 'GET /api/email/messages?folder=inbox', 'inbox fetch succeeds when account is configured', inbox.ok, `HTTP ${inbox.status} messages=${messages.length}`, inbox.text)
  if (!inbox.ok) return

  const start = await ctx.request('POST', '/api/email/triage/start', { limit: 10, workspacePath: workspacePathValue })
  const taskId = typeof asRecord(start.body).taskId === 'string' ? asRecord(start.body).taskId as string : ''
  record(ctx, 'POST /api/email/triage/start', 'triage task starts for unread-only messages', start.ok && Boolean(taskId), `HTTP ${start.status} taskId=${taskId || 'missing'}`, start.text)
  if (taskId) {
    const task = await pollTriageTask(ctx, taskId)
    const results = Array.isArray(task?.results) ? task.results as unknown[] : []
    const first = asRecord(results[0])
    const shapeOk = task?.status === 'completed'
      && task.unreadOnly === true
      && typeof task.cacheKey === 'string'
      && (results.length === 0 || (
        typeof first.category === 'string'
        && typeof first.summary === 'string'
        && typeof first.priority === 'string'
        && Array.isArray(first.relationships)
      ))
    record(
      ctx,
      'GET /api/email/triage/tasks/:taskId',
      'completed triage with categories, summaries, priorities, draft relationships, unread guard, and cache key',
      shapeOk,
      `status=${String(task?.status)} results=${results.length} cacheKey=${String(task?.cacheKey || '')}`,
      JSON.stringify(task).slice(0, 800),
    )
  }

  const firstWithAttachment = messages
    .map((message) => asRecord(message))
    .find((message) => Number(message.attachmentCount || 0) > 0)
  if (!firstWithAttachment) {
    record(ctx, 'POST /api/email/messages/:id/attachments/:attachmentId/artifact', 'real attachment converted to Artifact when present', false, 'no message with attachment found', undefined, true)
    return
  }
  const detail = await ctx.request('GET', `/api/email/messages/${firstWithAttachment.id}`)
  const attachments = Array.isArray(asRecord(asRecord(detail.body).message).attachments)
    ? asRecord(asRecord(detail.body).message).attachments as unknown[]
    : []
  const attachment = asRecord(attachments[0])
  if (detail.ok && typeof attachment.id === 'string') {
    await smokeHttp(ctx, 'email', 'POST', `/api/email/messages/${firstWithAttachment.id}/attachments/${attachment.id}/artifact`, 'real email attachment converts to Artifact', {
      body: { workspacePath: workspacePathValue },
      accept: (res) => res.ok && typeof asRecord(asRecord(res.body).artifact).id === 'string',
      actual: (res) => `HTTP ${res.status} artifact=${String(asRecord(asRecord(res.body).artifact).id || '')}`,
    })
  }
}

export default async function runEmailSmoke(ctx: SmokeContext): Promise<void> {
  const ws = await workspacePath(ctx)
  if (!ws) return

  const accounts = await ctx.request('GET', '/api/email/accounts')
  const configured = asRecord(accounts.body).configured === true
  record(ctx, 'GET /api/email/accounts', 'account list endpoint reports configuration status', accounts.ok && typeof asRecord(accounts.body).configured === 'boolean', `HTTP ${accounts.status} configured=${configured}`, accounts.text)

  await smokeHttp(ctx, 'email', 'POST', '/api/email/drafts/dry-run', 'dry-run recipient resolver returns salutations without sending', {
    body: { recipients: ['Jing Liu <jing@example.com>', 'ops@example.com'] },
    accept: (res) => {
      const recipients = Array.isArray(asRecord(res.body).recipients) ? asRecord(res.body).recipients as unknown[] : []
      return res.ok && asRecord(res.body).dryRun === true && recipients.length === 2 && typeof asRecord(recipients[0]).salutation === 'string'
    },
    actual: (res) => `HTTP ${res.status} recipients=${Array.isArray(asRecord(res.body).recipients) ? (asRecord(res.body).recipients as unknown[]).length : 0}`,
  })

  await smokeHttp(ctx, 'email', 'POST', '/api/email/drafts/artifact', 'reply draft is saved as email_draft Artifact', {
    body: {
      workspacePath: ws,
      emailId: 'smoke-email-001',
      to: 'sender@example.com',
      subject: 'Re: Smoke 邮件',
      body: '您好：\n\n这是 email smoke 生成的回复草稿。\n',
    },
    accept: (res) => res.ok && asRecord(asRecord(res.body).artifact).type === 'email_draft' && asRecord(asRecord(res.body).relationship).relation === 'email_draft',
    actual: (res) => `HTTP ${res.status} artifact=${String(asRecord(asRecord(res.body).artifact).id || '')}`,
  })

  await smokeHttp(ctx, 'email', 'POST', '/api/email/attachments/artifacts', 'attachment payload is saved as Artifact with email relationship', {
    body: {
      workspacePath: ws,
      emailId: 'smoke-email-001',
      attachments: [{ filename: 'smoke-attachment.txt', textContent: 'email attachment artifact smoke', contentType: 'text/plain' }],
    },
    accept: (res) => {
      const artifacts = Array.isArray(asRecord(res.body).artifacts) ? asRecord(res.body).artifacts as unknown[] : []
      const relationships = Array.isArray(asRecord(res.body).relationships) ? asRecord(res.body).relationships as unknown[] : []
      return res.ok && artifacts.length === 1 && asRecord(relationships[0]).relation === 'attachment'
    },
    actual: (res) => `HTTP ${res.status} artifacts=${Array.isArray(asRecord(res.body).artifacts) ? (asRecord(res.body).artifacts as unknown[]).length : 0}`,
  })

  const matter = await ctx.request('POST', '/api/aios/matters/from-email', {
    workspacePath: ws,
    email: {
      id: 'smoke-email-001',
      subject: 'Smoke 邮件转 Matter',
      from: 'sender@example.com',
      body: '请根据这封邮件形成事项，并准备文稿和 PPT。',
    },
    priority: 'normal',
  })
  const matterId = typeof asRecord(matter.body).matterId === 'string'
    ? asRecord(matter.body).matterId as string
    : typeof asRecord(asRecord(matter.body).matter).id === 'string'
      ? asRecord(asRecord(matter.body).matter).id as string
      : ''
  record(ctx, 'POST /api/aios/matters/from-email', 'email converts to Matter', matter.ok && Boolean(matterId), `HTTP ${matter.status} matterId=${matterId || 'missing'}`, matter.text)
  if (matterId) {
    await smokeHttp(ctx, 'email', 'POST', `/api/aios/matters/${matterId}/generate-document`, 'mail Matter can generate document Artifact', {
      accept: (res) => res.ok && typeof asRecord(asRecord(res.body).artifact).id === 'string',
      actual: (res) => `HTTP ${res.status} artifact=${String(asRecord(asRecord(res.body).artifact).id || '')}`,
    })
    await smokeHttp(ctx, 'email', 'POST', `/api/aios/matters/${matterId}/generate-ppt`, 'mail Matter can generate PPT Artifact', {
      accept: (res) => res.ok && typeof asRecord(asRecord(res.body).artifact).id === 'string',
      actual: (res) => `HTTP ${res.status} artifact=${String(asRecord(asRecord(res.body).artifact).id || '')}`,
    })
  }

  if (configured) {
    await runConfiguredAccountSmoke(ctx, ws)
  } else {
    writeManualSetupNote()
    record(ctx, 'POST /api/email/triage/start', 'configured email account required for live unread triage', false, 'manual setup needed; no IMAP/SMTP account configured', undefined, true)
  }
}
