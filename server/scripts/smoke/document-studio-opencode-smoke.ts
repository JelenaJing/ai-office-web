/**
 * Document Studio OpenCode 真实路径 smoke。
 * humanizer 已安装且 OpenCode 可用时，必须产出 output/patch.json（source=opencode），否则 exit 1。
 *
 * Usage: npm run smoke:document-studio-opencode
 */

import { spawn, type ChildProcess } from 'child_process'
import fs from 'fs'
import path from 'path'
import { getOpenCodeStatusReport } from '../../src/modules/opencode/opencodeStatus.service'
import { isSkillInstalledAtAios } from '../../src/modules/opencode/skillMaterializer'

const BASE = (process.env.DOCUMENT_STUDIO_SMOKE_BASE ?? 'http://127.0.0.1:3001').replace(/\/$/, '')
const SERVER_ROOT = path.resolve(__dirname, '../..')
const JOB_ROOT = path.join(SERVER_ROOT, 'runtime/opencode-jobs')

let spawnedServer: ChildProcess | null = null
let weSpawnedServer = false
let failures = 0

const summary = {
  opencodeInstalled: false,
  humanizerSkillFound: false,
  newsWriterSkillFound: false,
  usedFallback: false,
  skippedReason: '' as string | null,
  humanizerPatchOk: false,
  newsWriterArtifactOk: false,
  humanizerDebug: null as Record<string, unknown> | null,
}

async function sleep(ms: number): Promise<void> {
  await new Promise(r => setTimeout(r, ms))
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
  let parsed = {} as T
  if (text) {
    try {
      parsed = JSON.parse(text) as T
    } catch {
      parsed = {} as T
    }
  }
  return { status: res.status, ok: res.ok, body: parsed, text }
}

async function ensureServer(): Promise<void> {
  try {
    const h = await fetch(`${BASE}/api/health`)
    if (h.ok) return
  } catch {
    // spawn
  }
  spawnedServer = spawn('node', ['-r', 'dotenv/config', 'dist/index.js'], {
    cwd: SERVER_ROOT,
    env: { ...process.env, NODE_ENV: 'development', DOTENV_CONFIG_PATH: path.join(SERVER_ROOT, '.env.local'), PORT: '3001' },
    stdio: 'ignore',
  })
  weSpawnedServer = true
  for (let i = 0; i < 60; i++) {
    try {
      const h = await fetch(`${BASE}/api/health`)
      if (h.ok) return
    } catch {
      // retry
    }
    await sleep(500)
  }
  throw new Error('server not ready')
}

async function pollJob(jobId: string): Promise<Record<string, unknown>> {
  for (let i = 0; i < 80; i++) {
    const res = await request('GET', `/api/jobs/${encodeURIComponent(jobId)}`)
    const body = res.body
    const st = String(body.status || '')
    if (st === 'succeeded' || st === 'failed' || st === 'pending') return body
    await sleep(2000)
  }
  return {}
}

function fail(msg: string): void {
  failures += 1
  console.error(`  FAIL ${msg}`)
}

function ok(msg: string, detail?: string): void {
  console.info(`  OK ${msg}${detail ? ` — ${detail}` : ''}`)
}

async function createNewsDocument(): Promise<string | null> {
  const create = await request<{ jobId?: string }>('POST', '/api/documents/jobs', {
    documentType: 'news',
    capabilityId: 'generate-news',
    fields: {
      topic: 'OpenCode Smoke 新闻稿',
      coreEvent: 'Document Studio 完成 OpenCode 链路验证',
      eventTime: '2026年5月',
      location: '深圳',
    },
  })
  if (!create.body.jobId) {
    fail('create news job')
    return null
  }
  const job = await pollJob(create.body.jobId)
  summary.usedFallback = Boolean(job.fallback)
  if (job.fallback) {
    fail(`news-writer used fallback: ${String(job.fallbackReason || '')}`)
    return null
  }
  if (job.status !== 'succeeded' || !job.documentId) {
    fail(`news job status=${job.status}`)
    return null
  }
  const documentId = String(job.documentId)
  const doc = await request<{ editorJson?: Record<string, unknown> }>(
    'GET',
    `/api/documents/${encodeURIComponent(documentId)}`,
  )
  if (doc.body.editorJson?.type !== 'doc') {
    fail('news-writer missing editorJson')
    return null
  }
  summary.newsWriterArtifactOk = true
  ok('news-writer opencode artifact', documentId)
  return documentId
}

function findLatestHumanizerJobDir(): string | null {
  if (!fs.existsSync(JOB_ROOT)) return null
  const dirs = fs
    .readdirSync(JOB_ROOT)
    .filter(d => d.startsWith('oc_'))
    .map(d => ({
      name: d,
      mtime: fs.statSync(path.join(JOB_ROOT, d)).mtimeMs,
      hasSelection: fs.existsSync(path.join(JOB_ROOT, d, 'input/selection.json')),
    }))
    .filter(d => d.hasSelection)
    .sort((a, b) => b.mtime - a.mtime)
  return dirs[0] ? path.join(JOB_ROOT, dirs[0].name) : null
}

function printHumanizerDebug(jobDir: string | null): void {
  if (!jobDir) {
    console.error('  (no humanizer jobDir found)')
    return
  }
  const debugPath = path.join(jobDir, 'logs/debug.json')
  if (fs.existsSync(debugPath)) {
    try {
      summary.humanizerDebug = JSON.parse(fs.readFileSync(debugPath, 'utf-8')) as Record<string, unknown>
      console.info('  debug.json:', JSON.stringify(summary.humanizerDebug, null, 2))
    } catch {
      console.error('  debug.json unreadable:', debugPath)
    }
  }
  console.info('  jobDir:', jobDir)
  console.info('  skill:', path.join(jobDir, '.opencode/skills/humanizer/SKILL.md'), fs.existsSync(path.join(jobDir, '.opencode/skills/humanizer/SKILL.md')))
  console.info('  selection:', path.join(jobDir, 'input/selection.json'), fs.existsSync(path.join(jobDir, 'input/selection.json')))
  console.info('  context:', path.join(jobDir, 'input/document-context.json'), fs.existsSync(path.join(jobDir, 'input/document-context.json')))
  console.info('  patch:', path.join(jobDir, 'output/patch.json'), fs.existsSync(path.join(jobDir, 'output/patch.json')))
  console.info('  stdout:', path.join(jobDir, 'logs/stdout.log'))
  console.info('  stderr:', path.join(jobDir, 'logs/stderr.log'))
}

async function runHumanizerSmoke(documentId: string): Promise<void> {
  console.info('[smoke:opencode] humanizer patch')
  const text =
    '这是用于 humanizer smoke 的测试段落，需要减少重复表达并优化句式，同时保留原意。'
  const run = await request<{
    success?: boolean
    patch?: { type?: string; text?: string }
    source?: string
    fallback?: boolean
    fallbackReason?: string
    error?: string
  }>('POST', `/api/documents/${encodeURIComponent(documentId)}/capabilities/humanize-document-advanced/run`, {
    scope: 'selection',
    selection: { text, from: 0, to: text.length },
  })

  const jobDir = findLatestHumanizerJobDir()

  if (!run.body.success || !run.body.patch?.text?.trim()) {
    fail(`humanizer API: ${run.body.error || run.text.slice(0, 300)}`)
    printHumanizerDebug(jobDir)
    return
  }

  if (run.body.fallback || run.body.source !== 'opencode') {
    fail(
      `humanizer must use real OpenCode path (source=${run.body.source}, fallback=${run.body.fallback}, reason=${run.body.fallbackReason || 'n/a'})`,
    )
    printHumanizerDebug(jobDir)
    return
  }

  const patchPath = jobDir ? path.join(jobDir, 'output/patch.json') : ''
  if (!patchPath || !fs.existsSync(patchPath)) {
    fail('humanizer output/patch.json missing on disk')
    printHumanizerDebug(jobDir)
    return
  }

  let patchOnDisk: { type?: string; text?: string } | null = null
  try {
    patchOnDisk = JSON.parse(fs.readFileSync(patchPath, 'utf-8')) as { type?: string; text?: string }
  } catch {
    fail('humanizer patch.json invalid JSON')
    printHumanizerDebug(jobDir)
    return
  }

  if (patchOnDisk.type !== 'replace_selection' || !patchOnDisk.text?.trim()) {
    fail('humanizer patch.json schema invalid')
    printHumanizerDebug(jobDir)
    return
  }

  summary.humanizerPatchOk = true
  ok('humanizer patch', `source=opencode patch.json=${patchPath}`)
  printHumanizerDebug(jobDir)
}

async function main(): Promise<void> {
  console.info('[smoke:opencode] Document Studio OpenCode path\n')

  const report = await getOpenCodeStatusReport()
  summary.opencodeInstalled = report.opencodeAvailable
  summary.humanizerSkillFound = isSkillInstalledAtAios('humanizer')
  summary.newsWriterSkillFound = isSkillInstalledAtAios('news-writer')

  console.info('Summary probe:', {
    opencodeInstalled: summary.opencodeInstalled,
    opencodeVersion: report.opencodeVersion,
    humanizerSkillFound: summary.humanizerSkillFound,
    newsWriterSkillFound: summary.newsWriterSkillFound,
  })

  if (!summary.opencodeInstalled) {
    summary.skippedReason = 'OpenCode 不可用'
    printSummary()
    process.exit(0)
  }

  if (!summary.humanizerSkillFound && !summary.newsWriterSkillFound) {
    summary.skippedReason = 'humanizer 与 news-writer 均未安装在 aios-skills'
    printSummary()
    process.exit(0)
  }

  await ensureServer()

  const statusApi = await request('GET', '/api/document-studio/opencode-status')
  if (!statusApi.ok) {
    fail(`opencode-status API HTTP ${statusApi.status}`)
  } else {
    ok('opencode-status API')
  }

  let documentId = ''

  if (summary.newsWriterSkillFound) {
    console.info('[smoke:opencode] news-writer generation job')
    documentId = (await createNewsDocument()) || ''
  }

  if (summary.humanizerSkillFound) {
    if (!documentId) {
      console.info('[smoke:opencode] creating general document for humanizer (news job unavailable)')
      const create = await request<{ jobId?: string }>('POST', '/api/documents/jobs', {
        documentType: 'general',
        capabilityId: 'generate-general-document',
        fields: { topic: 'Humanizer smoke', requirements: '短段落用于降重测试' },
      })
      if (create.body.jobId) {
        const job = await pollJob(create.body.jobId)
        if (job.documentId) documentId = String(job.documentId)
      }
    }
    if (!documentId) {
      fail('no documentId for humanizer smoke')
    } else {
      await runHumanizerSmoke(documentId)
    }
  }

  printSummary()

  if (spawnedServer && weSpawnedServer) spawnedServer.kill('SIGTERM')

  if (summary.humanizerSkillFound && !summary.humanizerPatchOk) {
    failures += 1
    console.error('\n  FAIL humanizer installed but OpenCode patch path did not pass')
  }

  if (failures > 0) process.exit(1)
  process.exit(0)
}

function printSummary(): void {
  console.info('\n--- OpenCode smoke summary ---')
  console.info(JSON.stringify(summary, null, 2))
}

main().catch(err => {
  console.error(err)
  if (spawnedServer && weSpawnedServer) spawnedServer.kill('SIGTERM')
  process.exit(1)
})
