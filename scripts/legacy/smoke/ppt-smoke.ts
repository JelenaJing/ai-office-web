import { convertDocumentToDeckInput } from '../../../src/bridges/document-to-ppt'
import { smokeHttp, type SmokeContext } from '../../smoke/smoke-utils'

function record(ctx: SmokeContext, endpoint: string, expected: string, passed: boolean, actual: string, error?: string): void {
  ctx.record({
    module: 'ppt',
    endpoint,
    expected,
    actual,
    status: passed ? 'passed' : 'failed',
    error: passed ? undefined : error,
  })
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {}
}

async function workspacePath(ctx: SmokeContext): Promise<string | null> {
  const res = await ctx.request('GET', '/api/workspaces/default')
  const workspace = asRecord(asRecord(res.body).workspace)
  const path = typeof workspace.path === 'string' ? workspace.path : null
  record(ctx, 'GET /api/workspaces/default', 'workspace path', res.ok && Boolean(path), `HTTP ${res.status} workspace=${path || 'missing'}`, res.text)
  return path
}

async function pollDeckTask(ctx: SmokeContext, taskId: string): Promise<Record<string, unknown> | null> {
  for (let i = 0; i < 80; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1500))
    const res = await ctx.request('GET', `/api/ppt/decks/tasks/${taskId}`)
    const body = asRecord(res.body)
    if (!res.ok) return body
    if (body.status === 'completed' || body.status === 'failed' || body.status === 'cancelled') return body
  }
  return null
}

async function startDeck(ctx: SmokeContext, input: Record<string, unknown>, label: string): Promise<{ deckId: string; task: Record<string, unknown> | null }> {
  const start = await ctx.request('POST', '/api/ppt/decks/start', input)
  const taskId = typeof asRecord(start.body).taskId === 'string' ? asRecord(start.body).taskId as string : ''
  record(ctx, `POST /api/ppt/decks/start (${label})`, 'taskId returned', start.ok && Boolean(taskId), `HTTP ${start.status} taskId=${taskId || 'missing'}`, start.text)
  if (!taskId) return { deckId: '', task: null }

  const task = await pollDeckTask(ctx, taskId)
  const result = asRecord(task?.result)
  const deckId = typeof result.deckId === 'string' ? result.deckId : ''
  record(
    ctx,
    `GET /api/ppt/decks/tasks/:taskId (${label})`,
    'completed task with deckId and artifact relationship',
    task?.status === 'completed' && Boolean(deckId) && Boolean(asRecord(result.artifact).id) && Boolean(asRecord(result.relationships).artifactId),
    `status=${String(task?.status)} deckId=${deckId || 'missing'} artifact=${String(asRecord(result.artifact).id || '')}`,
    JSON.stringify(task).slice(0, 800),
  )
  return { deckId, task }
}

async function runBridgeCheck(ctx: SmokeContext, workspacePathValue: string): Promise<void> {
  try {
    const output = convertDocumentToDeckInput({
      workspacePath: workspacePathValue,
      sourceArtifact: { id: 'smoke-document-artifact', type: 'document', title: 'Smoke 文稿', createdAt: new Date().toISOString() },
      outline: {
        title: 'Smoke 文稿转 PPT',
        sections: [
          { heading: '背景', paragraphs: ['介绍 Web 文稿转 PPT 的背景。'] },
          { heading: '方案', paragraphs: ['通过 src/bridges/document-to-ppt 输出 DeckGenerationInput。'] },
        ],
      },
      templateId: 'web-default',
    })
    record(
      ctx,
      'src/bridges/document-to-ppt/convertDocumentToDeckInput',
      'document-to-ppt bridge returns deck input without importing PPT internals',
      output.sourceFeature === 'document' && output.slides.length === 2 && output.prompt.includes('Smoke 文稿转 PPT'),
      `sourceFeature=${output.sourceFeature} slides=${output.slides.length}`,
    )
  } catch (error) {
    record(ctx, 'src/bridges/document-to-ppt/convertDocumentToDeckInput', 'bridge conversion succeeds', false, 'threw', error instanceof Error ? error.message : String(error))
  }
}

export default async function runPptSmoke(ctx: SmokeContext): Promise<void> {
  const ws = await workspacePath(ctx)
  if (!ws) return

  const { deckId } = await startDeck(ctx, {
    workspacePath: ws,
    title: 'Web PPT E2E Smoke',
    prompt: '生成一份 5 页以内的 Web PPT E2E smoke 演示，包含背景、能力、流程、风险、结论。',
    templateId: 'web-default',
  }, 'topic')
  if (deckId) {
    await smokeHttp(ctx, 'ppt', 'GET', `/api/ppt/decks/${deckId}`, 'DeckDocument has slides, template manifest, slide diagnostics', {
      accept: (res) => {
        const deck = asRecord(asRecord(res.body).deck)
        const slides = Array.isArray(deck.slides) ? deck.slides as unknown[] : []
        const firstSlide = asRecord(slides[0])
        return res.ok
          && typeof deck.deckId === 'string'
          && slides.length > 0
          && Boolean(deck.templateManifest)
          && Boolean(firstSlide.diagnostics)
      },
      actual: (res) => {
        const deck = asRecord(asRecord(res.body).deck)
        return `HTTP ${res.status} slides=${Array.isArray(deck.slides) ? deck.slides.length : 0}`
      },
    })

    await smokeHttp(ctx, 'ppt', 'GET', `/api/ppt/decks/${deckId}/download`, 'download returns PPTX artifact/file', {
      accept: (res) => res.ok && res.text.length > 0,
      actual: (res) => `HTTP ${res.status} bytes=${res.text.length}`,
    })

    await smokeHttp(ctx, 'ppt', 'POST', `/api/ppt/decks/${deckId}/retemplate`, 'retemplate preview is zero-token', {
      body: { templateId: 'web-default-alt' },
      accept: (res) => {
        const body = asRecord(res.body)
        const diagnostics = asRecord(body.diagnostics)
        const steps = Array.isArray(diagnostics.steps) ? diagnostics.steps.join(',') : ''
        return res.ok && body.tokenUsed === false && Boolean(body.retemplatePreview) && !steps.toLowerCase().includes('llm')
      },
      actual: (res) => `HTTP ${res.status} tokenUsed=${String(asRecord(res.body).tokenUsed)}`,
    })
  }

  const matter = await ctx.request('POST', '/api/aios/matters', {
    title: 'PPT smoke matter',
    goal: '验证 Matter 到 PPT 输入链路',
    sourceType: 'manual',
    workspacePath: ws,
  })
  const matterId = typeof asRecord(asRecord(matter.body).matter).id === 'string'
    ? asRecord(asRecord(matter.body).matter).id as string
    : ''
  record(ctx, 'POST /api/aios/matters', 'matter fixture created for Matter -> PPT', matter.ok && Boolean(matterId), `HTTP ${matter.status} matterId=${matterId || 'missing'}`, matter.text)
  if (matterId) {
    await startDeck(ctx, {
      workspacePath: ws,
      title: 'Matter 转 PPT Smoke',
      prompt: '根据 Matter 目标生成一份简短汇报 PPT。',
      source: 'matter',
      matterId,
    }, 'matter')
  }

  await runBridgeCheck(ctx, ws)
}
