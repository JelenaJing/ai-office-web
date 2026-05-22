import fs from 'fs'
import path from 'path'
import { smokeHttp, type SmokeContext, type SmokeStep } from './smoke-utils'

function getRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {}
}

function arrayHas(value: unknown, expected: string): boolean {
  return Array.isArray(value) && value.some((item) => String(item).includes(expected))
}

function record(
  ctx: SmokeContext,
  endpoint: string,
  expected: string,
  passed: boolean,
  actual: string,
  error?: string,
): void {
  ctx.record({
    module: 'document',
    endpoint,
    expected,
    actual,
    status: passed ? 'passed' : 'failed',
    error: passed ? undefined : error,
  })
}

async function defaultWorkspace(ctx: SmokeContext): Promise<string | null> {
  const response = await ctx.request('GET', '/api/workspaces/default')
  const workspace = getRecord(getRecord(response.body).workspace)
  const workspacePath = typeof workspace.path === 'string' ? workspace.path : null
  record(
    ctx,
    'GET /api/workspaces/default',
    'default workspace path',
    response.ok && Boolean(workspacePath),
    response.ok ? `workspace=${workspacePath || 'missing'}` : `HTTP ${response.status}`,
    response.text,
  )
  return workspacePath
}

async function pollTask(
  ctx: SmokeContext,
  endpoint: string,
  done: (body: Record<string, unknown>) => boolean,
): Promise<Record<string, unknown> | null> {
  for (let i = 0; i < 60; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1500))
    const response = await ctx.request('GET', endpoint)
    const body = getRecord(response.body)
    if (!response.ok) return body
    if (done(body)) return body
    if (body.status === 'failed' || body.status === 'cancelled') return body
  }
  return null
}

async function runPaperCase(ctx: SmokeContext, paperType: 'research' | 'review'): Promise<void> {
  const label = paperType === 'research' ? 'academic_paper' : 'literature_review'
  const start = await ctx.request('POST', '/api/document/paper-workflow/start', {
    topic: paperType === 'research' ? 'Web 端智能办公协同的可用性评估' : '智能办公协同系统研究综述',
    paperType,
    mode: 'outline',
    language: 'zh',
    extraContext: 'Smoke test: return concise structured output.',
  })
  const taskId = typeof getRecord(start.body).taskId === 'string' ? getRecord(start.body).taskId as string : ''
  record(ctx, `POST /api/document/paper-workflow/start (${label})`, 'taskId returned', start.ok && Boolean(taskId), `HTTP ${start.status} taskId=${taskId || 'missing'}`, start.text)
  if (!taskId) return

  const task = await pollTask(ctx, `/api/document/paper-workflow/tasks/${taskId}`, (body) => body.status === 'completed')
  const result = getRecord(task?.result)
  const artifact = getRecord(result.artifact)
  const diagnostics = getRecord(result.diagnostics)
  const markdown = String(result.markdown || '')
  const outline = result.outline
  const chain = String(diagnostics.chain || '')
  const sourceRuntime = String(artifact.sourceRuntime || '')
  const expectedReviewSections = ['文献检索与筛选说明', '研究脉络', '代表性研究', '争议与不足', '未来']
  const reviewOk = paperType === 'research'
    || expectedReviewSections.every((section) => markdown.includes(section) || arrayHas(outline, section))
  const passed =
    task?.status === 'completed'
    && result.paperType === paperType
    && typeof result.title === 'string'
    && markdown.includes('摘要')
    && markdown.includes('关键词')
    && Array.isArray(outline)
    && Array.isArray(result.references)
    && (chain.includes('paper') || sourceRuntime.includes('nftcore'))
    && typeof artifact.artifactId === 'string'
    && Array.isArray(artifact.sourceRefs)
    && Array.isArray(artifact.exportRefs)
    && reviewOk
  record(
    ctx,
    `GET /api/document/paper-workflow/tasks/:taskId (${label})`,
    'completed structured paper result with artifactId/sourceRefs/exportRefs',
    passed,
    `status=${String(task?.status)} paperType=${String(result.paperType)} chain=${chain} artifactId=${String(artifact.artifactId || '')}`,
    JSON.stringify(task).slice(0, 800),
  )
}

async function runCancelCase(ctx: SmokeContext): Promise<void> {
  const start = await ctx.request('POST', '/api/document/paper-workflow/start', {
    topic: 'Smoke cancel case',
    paperType: 'research',
    mode: 'outline',
  })
  const taskId = typeof getRecord(start.body).taskId === 'string' ? getRecord(start.body).taskId as string : ''
  if (!taskId) {
    record(ctx, 'POST /api/document/paper-workflow/start cancel-case', 'taskId returned', false, `HTTP ${start.status}`, start.text)
    return
  }
  const cancel = await ctx.request('POST', `/api/document/paper-workflow/tasks/${taskId}/cancel`)
  const body = getRecord(cancel.body)
  record(
    ctx,
    'POST /api/document/paper-workflow/tasks/:taskId/cancel',
    'cancelled status',
    cancel.ok && body.status === 'cancelled',
    `HTTP ${cancel.status} status=${String(body.status)}`,
    cancel.text,
  )
}

async function runFormalTemplate(ctx: SmokeContext, workspacePath: string): Promise<void> {
  const start = await ctx.request('POST', '/api/document/formal-template/start', {
    workspacePath,
    customTemplateText: '关于{{事项}}的情况说明\n\n{{正文}}\n\n联系人：{{联系人}}',
    instruction: '生成一份关于 Web 端文稿 E2E smoke 的情况说明，联系人为测试员。',
    fieldOverrides: {
      事项: 'Web 端文稿 E2E smoke',
      联系人: '测试员',
    },
  })
  const taskId = typeof getRecord(start.body).taskId === 'string' ? getRecord(start.body).taskId as string : ''
  record(ctx, 'POST /api/document/formal-template/start', 'taskId returned', start.ok && Boolean(taskId), `HTTP ${start.status} taskId=${taskId || 'missing'}`, start.text)
  if (!taskId) return

  const task = await pollTask(ctx, `/api/document/formal-template/tasks/${taskId}`, (body) => body.status === 'completed')
  const result = getRecord(task?.result)
  const artifact = getRecord(result.artifact)
  const diagnostics = getRecord(result.diagnostics)
  const steps = diagnostics.steps
  const required = ['analyze', 'confirm', 'preview', 'commit']
  const phasesOk = required.every((phase) => arrayHas(steps, phase))
  const passed =
    task?.status === 'completed'
    && phasesOk
    && typeof artifact.artifactId === 'string'
    && getRecord(result.previewMetadata).stage === 'preview'
    && getRecord(result.commitMetadata).stage === 'commit'
    && Array.isArray(artifact.sourceRefs)
    && Array.isArray(artifact.exportRefs)
  record(
    ctx,
    'GET /api/document/formal-template/tasks/:taskId',
    'completed formal template with analyze/confirm/preview/commit and artifact metadata',
    passed,
    `status=${String(task?.status)} phases=${Array.isArray(steps) ? steps.join(',') : 'missing'} artifactId=${String(artifact.artifactId || '')}`,
    JSON.stringify(task).slice(0, 800),
  )
}

async function runDocxFixture(ctx: SmokeContext): Promise<void> {
  const fixturePath = path.join(process.cwd(), 'fixtures', 'test-duty.docx')
  if (!fs.existsSync(fixturePath)) {
    const docsDir = path.join(process.cwd(), 'docs', 'smoke')
    fs.mkdirSync(docsDir, { recursive: true })
    fs.writeFileSync(
      path.join(docsDir, 'manual-fixtures-needed.md'),
      '# Manual Fixtures Needed\n\n- `fixtures/test-duty.docx` is required for DOCX import smoke coverage.\n',
    )
    ctx.record({
      module: 'document',
      endpoint: 'POST /api/document/import-docx',
      expected: 'fixtures/test-duty.docx exists',
      actual: 'fixture missing',
      status: 'skipped',
      error: 'Created docs/smoke/manual-fixtures-needed.md',
    })
  }
}

export default async function runDocumentSmoke(ctx: SmokeContext): Promise<void> {
  const workspacePath = await defaultWorkspace(ctx)
  if (!workspacePath) return

  await smokeHttp(ctx, 'document', 'POST', '/api/skills/web.document.generate/run', 'normal document returns html/session or artifact', {
    body: {
      workspacePath,
      prompt: '生成一段用于 Web 文稿 smoke 的简短通知。',
      params: { title: 'Web 文稿 smoke 通知' },
    },
    accept: (res) => {
      const body = getRecord(res.body)
      const data = getRecord(body.data)
      return res.ok && body.success === true && (typeof data.html === 'string' || Boolean(body.artifact))
    },
    actual: (res) => `HTTP ${res.status}`,
  })

  await runPaperCase(ctx, 'research')
  await runPaperCase(ctx, 'review')
  await runCancelCase(ctx)
  await runFormalTemplate(ctx, workspacePath)

  await smokeHttp(ctx, 'document', 'POST', '/api/skills/web.docx.export/run', 'Word export returns docx artifact', {
    body: {
      workspacePath,
      params: {
        title: 'Web 文稿 smoke 导出',
        html: '<h1>Web 文稿 smoke 导出</h1><p>用于验证 docx export。</p>',
        markdown: '# Web 文稿 smoke 导出\n\n用于验证 docx export。',
      },
    },
    accept: (res) => {
      const body = getRecord(res.body)
      const artifact = getRecord(body.artifact)
      return res.ok && body.success === true && typeof body.artifactId === 'string' && Array.isArray(artifact.exports)
    },
    actual: (res) => `HTTP ${res.status}`,
  })

  await runDocxFixture(ctx)
}
