/**
 * Document Studio API smoke (requires built server: npm run build).
 *
 * Usage (from server/):
 *   npm run smoke:document-studio
 *
 * Env:
 *   DOCUMENT_STUDIO_SMOKE_BASE — default http://127.0.0.1:3001
 *   DOCUMENT_STUDIO_SMOKE_START_SERVER=1 — spawn dist/index.js if /api/health fails
 */

import { spawn, type ChildProcess } from 'child_process'
import fs from 'fs'
import path from 'path'

const BASE = (process.env.DOCUMENT_STUDIO_SMOKE_BASE ?? 'http://127.0.0.1:3001').replace(/\/$/, '')
const SERVER_ROOT = path.resolve(__dirname, '../..')
const JOB_POLL_MS = 1500
const JOB_MAX_WAIT_MS = 120_000

let failures = 0
let spawnedServer: ChildProcess | null = null
let weSpawnedServer = false

function ok(name: string, detail?: string): void {
  console.info(`  OK ${name}${detail ? ` — ${detail}` : ''}`)
}

function fail(name: string, detail: string): void {
  failures += 1
  console.error(`  FAIL ${name} — ${detail}`)
}

function warn(name: string, detail: string): void {
  console.warn(`  WARN ${name} — ${detail}`)
}

async function sleep(ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms))
}

async function request<T = Record<string, unknown>>(
  method: string,
  route: string,
  body?: unknown,
): Promise<{ status: number; ok: boolean; body: T; text: string }> {
  const res = await fetch(`${BASE}${route}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let parsed: T = {} as T
  if (text) {
    try {
      parsed = JSON.parse(text) as T
    } catch {
      parsed = { raw: text } as T
    }
  }
  return { status: res.status, ok: res.ok, body: parsed, text }
}

async function waitForHealth(timeoutMs = 30_000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/api/health`)
      if (res.ok) return true
    } catch {
      // retry
    }
    await sleep(500)
  }
  return false
}

async function ensureServer(): Promise<void> {
  if (await waitForHealth(3_000)) {
    ok('server reachable', BASE)
    return
  }
  if (process.env.DOCUMENT_STUDIO_SMOKE_START_SERVER !== '1') {
    fail('server health', `不可达 ${BASE}；请先 npm run start 或设置 DOCUMENT_STUDIO_SMOKE_START_SERVER=1`)
    throw new Error('server not running')
  }
  const distEntry = path.join(SERVER_ROOT, 'dist/index.js')
  if (!fs.existsSync(distEntry)) {
    fail('server dist', `缺少 ${distEntry}，请先 npm run build`)
    throw new Error('dist missing')
  }
  console.info('[smoke] 启动临时 Express…')
  spawnedServer = spawn('node', ['-r', 'dotenv/config', 'dist/index.js'], {
    cwd: SERVER_ROOT,
    env: {
      ...process.env,
      NODE_ENV: 'development',
      DOTENV_CONFIG_PATH: path.join(SERVER_ROOT, '.env.local'),
      PORT: '3001',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  weSpawnedServer = true
  if (!(await waitForHealth(45_000))) {
    fail('server spawn', '超时未就绪')
    throw new Error('server spawn timeout')
  }
  ok('server spawned', BASE)
}

function isProseMirrorDoc(editorJson: unknown): boolean {
  if (!editorJson || typeof editorJson !== 'object') return false
  const doc = editorJson as { type?: string; content?: unknown[] }
  return doc.type === 'doc' && Array.isArray(doc.content)
}

function firstParagraphText(editorJson: Record<string, unknown>): string {
  const content = Array.isArray(editorJson.content) ? editorJson.content : []
  for (const node of content) {
    if (!node || typeof node !== 'object') continue
    const n = node as { type?: string; content?: Array<{ type?: string; text?: string }> }
    if (n.type === 'paragraph' && Array.isArray(n.content)) {
      const text = n.content.map(c => c.text || '').join('')
      if (text.trim()) return text.trim()
    }
    if (n.type === 'heading' && Array.isArray(n.content)) {
      const text = n.content.map(c => c.text || '').join('')
      if (text.trim()) return text.trim()
    }
  }
  return '这是 smoke 测试选区文本。'
}

function assertPatchShape(patch: unknown): boolean {
  if (!patch || typeof patch !== 'object') return false
  const p = patch as { type?: string; text?: string; content?: string; summary?: unknown }
  if (!p.type) return false
  const hasText = typeof p.text === 'string' && p.text.length > 0
  const hasContent = typeof p.content === 'string' && p.content.length > 0
  if (!hasText && !hasContent && p.type !== 'comments') return false
  if (p.summary !== undefined && !Array.isArray(p.summary)) return false
  return true
}

async function pollJob(jobId: string): Promise<Record<string, unknown>> {
  const deadline = Date.now() + JOB_MAX_WAIT_MS
  while (Date.now() < deadline) {
    const res = await request<Record<string, unknown>>('GET', `/api/jobs/${encodeURIComponent(jobId)}`)
    if (!res.ok) {
      fail('GET /api/jobs/:jobId', `HTTP ${res.status} ${res.text.slice(0, 200)}`)
      return res.body
    }
    const status = String(res.body.status || '')
    if (status === 'succeeded' || status === 'failed' || status === 'pending') {
      return res.body
    }
    await sleep(JOB_POLL_MS)
  }
  fail('job poll', '超时')
  return {}
}

async function testDocumentTypes(): Promise<void> {
  console.info('[smoke] GET /api/document-types')
  const res = await request<{ success?: boolean; documentTypes?: Array<{ id: string; label: string }> }>(
    'GET',
    '/api/document-types',
  )
  if (!res.ok || !res.body.success) {
    fail('document-types', `HTTP ${res.status}`)
    return
  }
  const types = res.body.documentTypes || []
  const labels = types.map(t => t.label)
  for (const label of ['通用文稿', '新闻稿', '论文']) {
    if (!labels.includes(label)) fail('document-types labels', `缺少「${label}」`)
    else ok(`document-type label`, label)
  }
}

async function testJobAndDocumentFlow(): Promise<{ documentId: string; editorJson: Record<string, unknown> } | null> {
  console.info('[smoke] POST /api/documents/jobs (general)')
  const create = await request<{ success?: boolean; jobId?: string }>('POST', '/api/documents/jobs', {
    documentType: 'general',
    capabilityId: 'generate-general-document',
    fields: {
      topic: 'Document Studio Smoke',
      requirements: '生成一篇极短的测试文稿，包含标题与两段正文。',
      wordCount: '200',
    },
    language: 'zh-CN',
    tone: 'formal',
  })
  if (!create.ok || !create.body.jobId) {
    fail('create job', `HTTP ${create.status} ${create.text.slice(0, 300)}`)
    return null
  }
  ok('create job', create.body.jobId)

  console.info('[smoke] GET /api/jobs/:jobId')
  const job = await pollJob(create.body.jobId)
  const status = String(job.status || '')
  if (status !== 'succeeded') {
    fail('job succeeded', `status=${status} error=${String(job.error || '')}`)
    return null
  }
  if (!job.documentId || !job.artifactId) {
    fail('job artifacts', '缺少 documentId / artifactId')
    return null
  }
  ok('job completed', `documentId=${job.documentId} fallback=${String(job.fallback ?? false)}`)

  console.info('[smoke] GET /api/documents/:documentId')
  const doc = await request<{
    success?: boolean
    documentId?: string
    editorJson?: Record<string, unknown>
  }>('GET', `/api/documents/${encodeURIComponent(String(job.documentId))}`)
  if (!doc.ok || !doc.body.success || !doc.body.editorJson) {
    fail('get document', `HTTP ${doc.status}`)
    return null
  }
  if (!isProseMirrorDoc(doc.body.editorJson)) {
    fail('editorJson shape', '不是 TipTap/ProseMirror doc 结构')
    return null
  }
  ok('editorJson', `blocks=${Array.isArray(doc.body.editorJson.content) ? doc.body.editorJson.content.length : 0}`)

  return { documentId: String(job.documentId), editorJson: doc.body.editorJson }
}

async function testRewriteAndPatch(documentId: string, editorJson: Record<string, unknown>): Promise<void> {
  const selected = firstParagraphText(editorJson)
  console.info('[smoke] POST .../capabilities/rewrite-selection/run')
  const run = await request<{
    success?: boolean
    resultType?: string
    patch?: Record<string, unknown>
    source?: string
    fallback?: boolean
  }>('POST', `/api/documents/${encodeURIComponent(documentId)}/capabilities/rewrite-selection/run`, {
    scope: 'selection',
    selection: { text: selected, from: 0, to: selected.length, blockIds: ['block-002'] },
    instruction: '略微改写，保持原意',
  })
  if (!run.ok || !run.body.success) {
    fail('rewrite-selection', `HTTP ${run.status} ${run.text.slice(0, 300)}`)
    return
  }
  if (run.body.resultType !== 'patch' || !assertPatchShape(run.body.patch)) {
    fail('patch schema', JSON.stringify(run.body.patch).slice(0, 200))
    return
  }
  ok('rewrite-selection patch', `source=${run.body.source ?? 'unknown'} fallback=${String(run.body.fallback ?? false)}`)

  const patch = run.body.patch!
  console.info('[smoke] POST /api/documents/:documentId/patch')
  const applied = await request<{ success?: boolean; editorJson?: Record<string, unknown> }>(
    'POST',
    `/api/documents/${encodeURIComponent(documentId)}/patch`,
    {
      patch: {
        type: patch.type,
        text: patch.text,
        selection: { text: selected, from: 0, to: selected.length },
      },
      editorJson,
    },
  )
  if (!applied.ok || !applied.body.success || !isProseMirrorDoc(applied.body.editorJson)) {
    fail('apply patch', `HTTP ${applied.status}`)
    return
  }
  ok('apply patch')
}

async function testExport(documentId: string, format: 'markdown' | 'html'): Promise<void> {
  console.info(`[smoke] POST /api/documents/:documentId/export (${format})`)
  const res = await request<{ success?: boolean; exportUrl?: string; filename?: string }>(
    'POST',
    `/api/documents/${encodeURIComponent(documentId)}/export`,
    { format },
  )
  if (!res.ok || !res.body.success || !res.body.exportUrl) {
    fail(`export ${format}`, `HTTP ${res.status} ${res.text.slice(0, 200)}`)
    return
  }
  ok(`export ${format}`, res.body.filename || res.body.exportUrl)
}

async function testPendingResponses(documentId: string): Promise<void> {
  console.info('[smoke] pending: paper pipeline job')
  const paperJob = await request('POST', '/api/documents/jobs', {
    documentType: 'paper',
    capabilityId: 'academic-paper-pipeline',
    fields: { researchTopic: 'Smoke 论文', scope: 'outline' },
  })
  if (!paperJob.ok && paperJob.status >= 500) {
    fail('paper job', `服务器错误 HTTP ${paperJob.status}`)
  } else if (paperJob.body && typeof paperJob.body === 'object') {
    const body = paperJob.body as { jobId?: string }
    if (body.jobId) {
      const job = await pollJob(body.jobId)
      const st = String(job.status || '')
      if (st === 'pending' || (st === 'failed' && job.error)) {
        ok('paper pipeline pending/error', `${st}: ${String(job.error || 'pending')}`)
      } else {
        fail('paper pipeline', `意外 status=${st}`)
      }
    } else {
      ok('paper pipeline rejected at create', paperJob.text.slice(0, 120))
    }
  }

  console.info('[smoke] export-docx capability')
  const docx = await request<{ success?: boolean; exportUrl?: string; filename?: string; error?: string }>(
    'POST',
    `/api/documents/${encodeURIComponent(documentId)}/capabilities/export-docx/run`,
    { scope: 'document' },
  )
  if (!docx.body?.success || !docx.body.exportUrl) {
    fail('export-docx', docx.body?.error || `HTTP ${docx.status}`)
  } else {
    ok('export-docx', docx.body.filename || docx.body.exportUrl)
    const dl = await fetch(`${BASE}${docx.body.exportUrl}`)
    if (!dl.ok) fail('export-docx download', `HTTP ${dl.status}`)
    else {
      const buf = Buffer.from(await dl.arrayBuffer())
      if (buf.length < 1000) fail('export-docx download', '文件过小')
      else ok('export-docx file', `${buf.length} bytes`)
    }
  }

  console.info('[smoke] POST export format=docx')
  const docxRoute = await request<{ success?: boolean; exportUrl?: string; filename?: string }>(
    'POST',
    `/api/documents/${encodeURIComponent(documentId)}/export`,
    { format: 'docx' },
  )
  if (!docxRoute.body?.success || !docxRoute.body.exportUrl) {
    fail('POST /export docx', JSON.stringify(docxRoute.body).slice(0, 120))
  } else {
    ok('POST /export docx', docxRoute.body.filename || '')
  }

  console.info('[smoke] pending: export-pdf capability')
  const pdf = await request(
    'POST',
    `/api/documents/${encodeURIComponent(documentId)}/capabilities/export-pdf/run`,
    { scope: 'document' },
  )
  const pdfBody = pdf.body as { success?: boolean; error?: string; pending?: boolean }
  if (pdfBody?.success) {
    fail('export-pdf', '应返回 pending/error 而非 success')
  } else if (pdf.status >= 500 && !pdfBody?.pending && !pdfBody?.error) {
    fail('export-pdf', `无结构化错误 HTTP ${pdf.status}`)
  } else {
    ok('export-pdf pending', pdfBody?.error?.slice(0, 80) || `HTTP ${pdf.status}`)
  }
}

async function shutdown(): Promise<void> {
  if (weSpawnedServer && spawnedServer) {
    spawnedServer.kill('SIGTERM')
    await sleep(500)
  }
}

async function main(): Promise<void> {
  console.info(`[smoke] Document Studio @ ${BASE}\n`)
  try {
    await ensureServer()
    await testDocumentTypes()
    const flow = await testJobAndDocumentFlow()
    if (flow) {
      await testRewriteAndPatch(flow.documentId, flow.editorJson)
      await testExport(flow.documentId, 'markdown')
      await testExport(flow.documentId, 'html')
      await testPendingResponses(flow.documentId)
    }
  } finally {
    await shutdown()
  }

  if (failures > 0) {
    console.error(`\n${failures} check(s) failed`)
    process.exit(1)
  }
  console.info('\nAll Document Studio smoke checks passed')
}

main().catch(err => {
  console.error(err)
  void shutdown().finally(() => process.exit(1))
})
