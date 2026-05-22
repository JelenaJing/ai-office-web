import fs from 'fs'
import path from 'path'

export type SmokeStatus = 'passed' | 'failed' | 'skipped'

export interface SmokeStep {
  module: string
  endpoint: string
  expected: string
  actual: string
  status: SmokeStatus
  error?: string
  durationMs: number
}

export interface SmokeContext {
  baseUrl: string
  token: string | null
  startedAt: string
  request<T = unknown>(method: string, endpoint: string, body?: unknown): Promise<{
    status: number
    ok: boolean
    body: T
    text: string
  }>
  record(step: Omit<SmokeStep, 'durationMs'> & { durationMs?: number }): void
}

export interface SmokeModuleResult {
  module: string
  steps: SmokeStep[]
}

export type SmokeModule = (ctx: SmokeContext) => Promise<void>

export function resolveBaseUrl(): string {
  return (process.env.WEB_BASE_URL || 'http://127.0.0.1:3001').replace(/\/$/, '')
}

export async function requestJson<T = unknown>(
  baseUrl: string,
  token: string | null,
  method: string,
  endpoint: string,
  body?: unknown,
): Promise<{ status: number; ok: boolean; body: T; text: string }> {
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const text = await response.text()
  let parsed: unknown = {}
  if (text) {
    try {
      parsed = JSON.parse(text)
    } catch {
      parsed = { raw: text }
    }
  }
  return { status: response.status, ok: response.ok, body: parsed as T, text }
}

export function extractToken(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null
  const record = body as Record<string, unknown>
  for (const key of ['token', 'accessToken', 'access_token', 'itoken']) {
    if (typeof record[key] === 'string' && record[key]) return record[key] as string
  }
  for (const key of ['data', 'user', 'result']) {
    const nested = record[key]
    if (nested && typeof nested === 'object') {
      const token = extractToken(nested)
      if (token) return token
    }
  }
  return null
}

export async function login(baseUrl: string): Promise<{ token: string | null; step: SmokeStep }> {
  const started = Date.now()
  const email = process.env.TEST_USER_EMAIL || 'yifeichen@ai.cuhk.edu.cn'
  const password = process.env.TEST_USER_PASSWORD || '12345678'
  try {
    const response = await requestJson(baseUrl, null, 'POST', '/api/auth/login', { email, password })
    const token = extractToken(response.body)
    return {
      token,
      step: {
        module: 'auth',
        endpoint: 'POST /api/auth/login',
        expected: 'HTTP 2xx and token',
        actual: `HTTP ${response.status}${token ? ' with token' : ' without token'}`,
        status: response.ok && token ? 'passed' : 'failed',
        error: response.ok && token ? undefined : response.text.slice(0, 500),
        durationMs: Date.now() - started,
      },
    }
  } catch (error) {
    return {
      token: null,
      step: {
        module: 'auth',
        endpoint: 'POST /api/auth/login',
        expected: 'HTTP 2xx and token',
        actual: 'request failed',
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - started,
      },
    }
  }
}

export async function smokeHttp(
  ctx: SmokeContext,
  module: string,
  method: string,
  endpoint: string,
  expected: string,
  options: {
    body?: unknown
    accept?: (response: { status: number; ok: boolean; body: unknown; text: string }) => boolean
    actual?: (response: { status: number; ok: boolean; body: unknown; text: string }) => string
  } = {},
): Promise<void> {
  const started = Date.now()
  try {
    const response = await ctx.request(method, endpoint, options.body)
    const accept = options.accept ? options.accept(response) : response.ok
    ctx.record({
      module,
      endpoint: `${method} ${endpoint}`,
      expected,
      actual: options.actual ? options.actual(response) : `HTTP ${response.status}`,
      status: accept ? 'passed' : 'failed',
      error: accept ? undefined : response.text.slice(0, 500),
      durationMs: Date.now() - started,
    })
  } catch (error) {
    ctx.record({
      module,
      endpoint: `${method} ${endpoint}`,
      expected,
      actual: 'request failed',
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - started,
    })
  }
}

export function ensureSmokeDocsDir(rootDir: string): string {
  const dir = path.join(rootDir, 'docs', 'smoke')
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

export function writeSmokeReports(rootDir: string, report: unknown, markdown: string): void {
  const dir = ensureSmokeDocsDir(rootDir)
  fs.writeFileSync(path.join(dir, 'latest-web-parity-smoke.json'), `${JSON.stringify(report, null, 2)}\n`)
  fs.writeFileSync(path.join(dir, 'latest-web-parity-smoke.md'), markdown)
}

export function formatMarkdownReport(report: {
  startedAt: string
  finishedAt: string
  baseUrl: string
  modules: string[]
  totals: Record<SmokeStatus, number>
  steps: SmokeStep[]
}): string {
  const lines = [
    '# Latest Web Parity Smoke Report',
    '',
    `- Started: ${report.startedAt}`,
    `- Finished: ${report.finishedAt}`,
    `- Base URL: ${report.baseUrl}`,
    `- Modules: ${report.modules.join(', ')}`,
    `- Totals: passed ${report.totals.passed}, failed ${report.totals.failed}, skipped ${report.totals.skipped}`,
    '',
    '| Module | Endpoint | Expected | Actual | Status | Error |',
    '| --- | --- | --- | --- | --- | --- |',
  ]
  for (const step of report.steps) {
    lines.push(`| ${step.module} | \`${step.endpoint}\` | ${escapeMd(step.expected)} | ${escapeMd(step.actual)} | ${step.status} | ${escapeMd(step.error || '')} |`)
  }
  lines.push('')
  return lines.join('\n')
}

function escapeMd(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, '<br>')
}
