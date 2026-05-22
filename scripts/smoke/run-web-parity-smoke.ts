import path from 'path'
import { pathToFileURL } from 'url'
import {
  formatMarkdownReport,
  login,
  requestJson,
  resolveBaseUrl,
  smokeHttp,
  writeSmokeReports,
  type SmokeContext,
  type SmokeModule,
  type SmokeStatus,
  type SmokeStep,
} from './smoke-utils'

const ROOT_DIR = path.resolve(__dirname, '..', '..')
const ALL_MODULES = ['document', 'ppt', 'email', 'artifact-knowledge', 'aios'] as const
type SmokeModuleName = typeof ALL_MODULES[number]

async function fallbackSmoke(moduleName: SmokeModuleName, ctx: SmokeContext): Promise<void> {
  if (moduleName === 'document') {
    await smokeHttp(ctx, 'document', 'GET', '/api/settings/parity-status', 'authenticated smoke can reach Web API')
    return
  }
  if (moduleName === 'ppt') {
    await smokeHttp(ctx, 'ppt', 'GET', '/api/artifacts', 'authenticated smoke can list artifacts before PPT E2E')
    return
  }
  if (moduleName === 'email') {
    await smokeHttp(ctx, 'email', 'GET', '/api/email/accounts', 'email accounts endpoint exists', {
      accept: (res) => res.ok || res.status === 404,
      actual: (res) => `HTTP ${res.status}`,
    })
    return
  }
  if (moduleName === 'artifact-knowledge') {
    await smokeHttp(ctx, 'artifact-knowledge', 'GET', '/api/artifacts', 'artifact list endpoint exists')
    return
  }
  if (moduleName === 'aios') {
    await smokeHttp(ctx, 'aios', 'GET', '/api/aios/parity-status', 'AIOS parity status endpoint exists')
  }
}

async function loadModuleSmoke(moduleName: SmokeModuleName): Promise<SmokeModule | null> {
  const modulePath = path.join(ROOT_DIR, 'scripts', 'smoke', `${moduleName}-smoke.ts`)
  try {
    const imported = await import(pathToFileURL(modulePath).href)
    if (typeof imported.default === 'function') return imported.default as SmokeModule
    if (typeof imported.run === 'function') return imported.run as SmokeModule
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (!message.includes('Cannot find module') && !message.includes('ERR_MODULE_NOT_FOUND')) {
      throw error
    }
  }
  return null
}

function parseModules(argv: string[]): SmokeModuleName[] {
  const requested = (argv[2] || 'all').trim()
  if (requested === 'all') return [...ALL_MODULES]
  if ((ALL_MODULES as readonly string[]).includes(requested)) return [requested as SmokeModuleName]
  throw new Error(`Unknown smoke module "${requested}". Use one of: ${[...ALL_MODULES, 'all'].join(', ')}`)
}

async function main(): Promise<void> {
  const startedAt = new Date().toISOString()
  const baseUrl = resolveBaseUrl()
  const modules = parseModules(process.argv)
  const steps: SmokeStep[] = []

  const auth = await login(baseUrl)
  steps.push(auth.step)

  const ctx: SmokeContext = {
    baseUrl,
    token: auth.token,
    startedAt,
    request: (method, endpoint, body) => requestJson(baseUrl, auth.token, method, endpoint, body),
    record: (step) => {
      steps.push({ ...step, durationMs: step.durationMs ?? 0 })
    },
  }

  for (const moduleName of modules) {
    try {
      const moduleSmoke = await loadModuleSmoke(moduleName)
      if (moduleSmoke) {
        await moduleSmoke(ctx)
      } else {
        await fallbackSmoke(moduleName, ctx)
      }
    } catch (error) {
      steps.push({
        module: moduleName,
        endpoint: 'module runner',
        expected: 'module smoke completes without throwing',
        actual: 'module smoke threw',
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        durationMs: 0,
      })
    }
  }

  const totals: Record<SmokeStatus, number> = { passed: 0, failed: 0, skipped: 0 }
  for (const step of steps) totals[step.status] += 1
  const report = {
    startedAt,
    finishedAt: new Date().toISOString(),
    baseUrl,
    modules,
    totals,
    steps,
  }
  writeSmokeReports(ROOT_DIR, report, formatMarkdownReport(report))

  console.log(JSON.stringify(report, null, 2))
  if (totals.failed > 0) {
    process.exitCode = 1
  }
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
