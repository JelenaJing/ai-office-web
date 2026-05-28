/**
 * Document Studio humanize job API smoke（OpenCode + 原始 aios-skills humanizer）。
 *
 * Usage: npm run smoke:document-studio-humanizer
 */

import { spawn, type ChildProcess } from 'child_process'
import fs from 'fs'
import path from 'path'
import { getOpenCodeStatusReport } from '../../src/modules/opencode/opencodeStatus.service'
import {
  HUMANIZER_SKILL_SOURCE_PATH,
  isSkillInstalledAtAios,
} from '../../src/modules/opencode/skillMaterializer'
import { checkMarkitdownAvailable } from '../../src/modules/document-studio/humanizeFileExtractor'
import { buildDocxBufferFromPlainText } from '../../src/modules/document-studio/studioDocxExport'

const BASE = (process.env.DOCUMENT_STUDIO_SMOKE_BASE ?? 'http://127.0.0.1:3001').replace(/\/$/, '')
const SERVER_ROOT = path.resolve(__dirname, '../..')
const JOB_ROOT = path.join(SERVER_ROOT, 'runtime/opencode-jobs')

const SAMPLE_ZH =
  '本单位将于下周召开年度工作总结会议，请各部门提前准备汇报材料，并于周五前提交办公室汇总。会议重点包括年度指标完成情况与下一年度工作计划。'

const SAMPLE_EN =
  'Our department will hold the annual performance review next week. Please prepare briefing materials and submit them to the office by Friday. The meeting will cover annual KPI completion and plans for the next fiscal year.'

let spawnedServer: ChildProcess | null = null
let weSpawnedServer = false
let failures = 0

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
  if (process.env.DOCUMENT_STUDIO_SMOKE_START_SERVER !== '1') {
    throw new Error('server not running; set DOCUMENT_STUDIO_SMOKE_START_SERVER=1')
  }
  spawnedServer = spawn('node', ['-r', 'dotenv/config', 'dist/index.js'], {
    cwd: SERVER_ROOT,
    env: {
      ...process.env,
      NODE_ENV: 'development',
      DOTENV_CONFIG_PATH: path.join(SERVER_ROOT, '.env.local'),
      PORT: '3001',
    },
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

function fail(msg: string): void {
  failures += 1
  console.error(`  FAIL ${msg}`)
}

function ok(msg: string, detail?: string): void {
  console.info(`  OK ${msg}${detail ? ` — ${detail}` : ''}`)
}

function latinRatio(text: string): number {
  const latin = (text.match(/[a-zA-Z]/g) || []).length
  const cjk = (text.match(/[\u4e00-\u9fff]/g) || []).length
  const total = latin + cjk
  if (!total) return 0
  return latin / total
}

function hasCjkInterWordSpaces(text: string): boolean {
  const matches = text.match(/[\u4e00-\u9fff]\s+[\u4e00-\u9fff]/g)
  return (matches?.length ?? 0) >= 3
}

async function pollHumanizeJob(jobId: string): Promise<Record<string, unknown>> {
  for (let i = 0; i < 90; i++) {
    const res = await request('GET', `/api/document-studio/humanize/jobs/${encodeURIComponent(jobId)}`)
    const body = res.body
    const st = String(body.status || '')
    if (st === 'succeeded' || st === 'failed') return body
    await sleep(2000)
  }
  return {}
}

async function runDeepHumanizeFixture(label: string, text: string, expect: 'zh' | 'en'): Promise<void> {
  console.info(`[smoke:humanizer] ${label}`)
  const create = await request<{ jobId?: string }>('POST', '/api/document-studio/humanize/jobs', {
    inputMode: 'text',
    text,
    options: {
      strength: 'deep',
      tone: 'natural',
      preserveMeaning: true,
      preserveTerms: [],
      language: 'auto',
    },
  })
  if (!create.ok || !create.body.jobId) {
    fail(`${label}: POST humanize/jobs — ${create.text.slice(0, 200)}`)
    return
  }
  ok(`${label}: POST humanize/jobs`, String(create.body.jobId))

  const job = await pollHumanizeJob(String(create.body.jobId))
  const jobId = String(job.jobId || create.body.jobId)
  const status = String(job.status || '')
  const source = String(job.source || '')
  const skillSource = String(job.skillSource || (job.result as { skillSource?: string })?.skillSource || '')
  const usedFallback = Boolean(job.usedFallback)
  const repaired = Boolean(job.repaired)
  const humanized = String(job.humanizedText || (job.result as { text?: string })?.text || '')
  const original = String(job.originalText || text)

  if (status !== 'succeeded') fail(`${label}: status=${status} error=${job.error}`)
  else ok(`${label}: job succeeded`)

  if (source !== 'opencode-humanizer') fail(`${label}: source=${source}`)
  else ok(`${label}: source opencode-humanizer`)

  if (skillSource !== HUMANIZER_SKILL_SOURCE_PATH) {
    fail(`${label}: skillSource=${skillSource}`)
  } else ok(`${label}: skillSource matches aios-skills`)

  if (usedFallback) fail(`${label}: usedFallback=true reason=${job.fallbackReason}`)
  else ok(`${label}: usedFallback false`)

  if (repaired) {
    fail(`${label}: repaired=true reason=${job.repairReason || 'unknown'}`)
  } else ok(`${label}: repaired false`)

  const jobDir = path.join(JOB_ROOT, jobId)
  const resultPath = path.join(jobDir, 'output', 'result.json')
  const debugPath = path.join(jobDir, 'logs', 'debug.json')

  if (!fs.existsSync(resultPath)) fail(`${label}: missing result.json`)
  else ok(`${label}: output/result.json exists`)

  let resultJson: { type?: string; text?: string; skillSource?: string } = {}
  try {
    resultJson = JSON.parse(fs.readFileSync(resultPath, 'utf-8')) as typeof resultJson
    if (resultJson.type !== 'humanized_text' || !resultJson.text?.trim()) {
      fail(`${label}: invalid result.json`)
    } else if (resultJson.skillSource !== HUMANIZER_SKILL_SOURCE_PATH) {
      fail(`${label}: result.json skillSource=${resultJson.skillSource}`)
    } else {
      ok(`${label}: result.json skillSource ok`)
    }
  } catch {
    fail(`${label}: result.json parse error`)
  }

  if (fs.existsSync(debugPath)) {
    try {
      const dbg = JSON.parse(fs.readFileSync(debugPath, 'utf-8')) as {
        opencodeArgs?: string[]
        skillSourcePath?: string
      }
      const args = dbg.opencodeArgs ?? []
      if (!args.includes('-f') || !args.includes(HUMANIZER_SKILL_SOURCE_PATH)) {
        fail(`${label}: debug opencodeArgs missing -f ${HUMANIZER_SKILL_SOURCE_PATH}`)
      } else {
        ok(`${label}: debug opencodeArgs includes original SKILL.md`)
      }
      if (dbg.skillSourcePath !== HUMANIZER_SKILL_SOURCE_PATH) {
        fail(`${label}: debug skillSourcePath mismatch`)
      }
    } catch {
      fail(`${label}: debug.json parse error`)
    }
  } else {
    fail(`${label}: missing debug.json`)
  }

  if (!humanized.trim()) fail(`${label}: empty humanizedText`)
  if (humanized.trim() === original.trim()) fail(`${label}: text unchanged`)

  const ratio = latinRatio(humanized)
  if (expect === 'en') {
    if (ratio < 0.5) fail(`${label}: expected English output, latinRatio=${ratio.toFixed(2)}`)
    else ok(`${label}: output remains English`)
    const cjk = (humanized.match(/[\u4e00-\u9fff]/g) || []).length
    if (cjk > humanized.length * 0.15) fail(`${label}: English input produced too much Chinese`)
  } else {
    if (ratio > 0.35) fail(`${label}: expected Chinese output, latinRatio=${ratio.toFixed(2)}`)
    else ok(`${label}: output remains Chinese`)
    if (hasCjkInterWordSpaces(humanized)) fail(`${label}: Chinese output has inter-character spaces`)
    else ok(`${label}: no excessive CJK spacing`)
  }
}

async function uploadExtractFile(label: string, fileName: string, content: string | Buffer): Promise<void> {
  const form = new FormData()
  const blob =
    typeof content === 'string'
      ? new Blob([content], { type: 'text/plain' })
      : new Blob([content], {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        })
  form.append('file', blob, fileName)
  const res = await fetch(`${BASE}/api/document-studio/humanize/extract-file`, {
    method: 'POST',
    body: form,
  })
  const text = await res.text()
  let body = {} as {
    success?: boolean
    text?: string
    markdown?: string
    fileType?: string
    error?: string
  }
  try {
    body = JSON.parse(text) as typeof body
  } catch {
    // ignore
  }
  if (!res.ok || !body.success || !body.text?.trim()) {
    fail(`${label}: extract-file — ${body.error || text.slice(0, 120)}`)
    return
  }
  if (!body.markdown?.trim()) fail(`${label}: extract-file missing markdown`)
  else ok(`${label}: extract-file`, `${body.text.length} chars (${body.fileType})`)
}

async function testExportDocx(): Promise<void> {
  const res = await fetch(`${BASE}/api/document-studio/humanize/export-docx`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: '# 标题\n\n改写 smoke 导出段落。', title: '改写 smoke' }),
  })
  if (!res.ok) {
    fail(`export-docx status ${res.status}`)
    return
  }
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length < 2000) fail(`export-docx too small (${buf.length} bytes)`)
  else ok('export-docx', `${buf.length} bytes`)
}

async function main(): Promise<void> {
  console.info('document-studio-humanizer smoke')
  const report = await getOpenCodeStatusReport()
  const humanizerReady = report.opencodeAvailable && isSkillInstalledAtAios('humanizer')
  if (!humanizerReady || !fs.existsSync(HUMANIZER_SKILL_SOURCE_PATH)) {
    console.warn('  SKIP OpenCode/humanizer 未就绪，跳过严格断言')
    process.exit(0)
  }

  await ensureServer()

  console.info('[smoke:humanizer] file extract')
  await uploadExtractFile('txt', 'sample.txt', SAMPLE_ZH)
  await uploadExtractFile('md', 'sample.md', `# 标题\n\n${SAMPLE_ZH}`)

  const markitdown = await checkMarkitdownAvailable()
  if (markitdown.available) {
    const fixtureDir = path.join(SERVER_ROOT, 'scripts/smoke/fixtures')
    fs.mkdirSync(fixtureDir, { recursive: true })
    const docxFixture = path.join(fixtureDir, 'sample-rewrite.docx')
    if (!fs.existsSync(docxFixture)) {
      const buf = await buildDocxBufferFromPlainText('改写样例', SAMPLE_ZH)
      fs.writeFileSync(docxFixture, buf)
    }
    await uploadExtractFile('docx', 'sample.docx', fs.readFileSync(docxFixture))
  } else {
    console.warn(`  SKIP docx extract — MarkItDown unavailable (${markitdown.error || markitdown.bin})`)
  }

  await testExportDocx()

  await runDeepHumanizeFixture('zh-CN fixture', SAMPLE_ZH, 'zh')
  await runDeepHumanizeFixture('en-US fixture', SAMPLE_EN, 'en')

  if (failures > 0) {
    console.error(`\nFAILED (${failures})`)
    process.exit(1)
  }
  console.info('\nALL OK')
}

main()
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => {
    if (weSpawnedServer && spawnedServer) spawnedServer.kill('SIGTERM')
  })
