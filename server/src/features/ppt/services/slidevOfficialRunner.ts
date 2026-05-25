import { randomUUID } from 'crypto'
import { spawnSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const SERVER_ROOT = path.resolve(__dirname, '../../../../')
const SLIDEV_RUNTIME_DIR = path.join(SERVER_ROOT, 'slidev-runtime')
const SLIDEV_APPS_ROOT = path.join(
  process.env.AIOFFICE_SLIDEV_APPS_DIR || path.join(SERVER_ROOT, 'data', 'slidev-apps'),
)

export interface SlidevOfficialBuildResult {
  success: boolean
  appUrl: string
  accessToken: string
  distDir: string
  error?: string
  durationMs?: number
}

function resolveSlidevCliBin(): string {
  const localBin = path.join(SLIDEV_RUNTIME_DIR, 'node_modules', '.bin', 'slidev')
  if (fs.existsSync(localBin)) return localBin
  return 'slidev'
}

function ensureRuntimeDependencies(): string | null {
  const requiredPackages = [
    path.join(SLIDEV_RUNTIME_DIR, 'node_modules', '@slidev', 'cli'),
    path.join(SLIDEV_RUNTIME_DIR, 'node_modules', '@slidev', 'theme-default'),
    path.join(SLIDEV_RUNTIME_DIR, 'node_modules', '@slidev', 'theme-seriph'),
  ]
  if (requiredPackages.every((pkgPath) => fs.existsSync(pkgPath))) return null
  console.info('[slidev-official] installing runtime dependencies…')
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  const install = spawnSync(npmCmd, ['install', '--no-audit', '--no-fund'], {
    cwd: SLIDEV_RUNTIME_DIR,
    stdio: 'pipe',
    encoding: 'utf-8',
    env: { ...process.env, CI: 'true' },
    timeout: 300_000,
  })
  if (install.status !== 0) {
    return install.stderr || install.stdout || 'Slidev runtime npm install failed'
  }
  return null
}

export function getDeckDistDirForServe(deckId: string): string {
  return path.join(SLIDEV_APPS_ROOT, deckId, 'dist')
}

function getDeckDistDir(deckId: string): string {
  return getDeckDistDirForServe(deckId)
}

function getDeckSlidesPath(deckId: string): string {
  return path.join(SLIDEV_APPS_ROOT, deckId, 'slides.md')
}

export function resolveSlidevOfficialAppRoute(deckId: string, accessToken: string): string {
  return `/api/ppt/decks/${encodeURIComponent(deckId)}/slidev-access/${encodeURIComponent(accessToken)}/`
}

export function resolveSlidevOfficialAppIndexPath(deckId: string): string | null {
  const indexPath = path.join(getDeckDistDir(deckId), 'index.html')
  return fs.existsSync(indexPath) ? indexPath : null
}

export function isSlidevOfficialRuntimeReady(): boolean {
  try {
    return fs.existsSync(path.join(SLIDEV_RUNTIME_DIR, 'package.json'))
  } catch {
    return false
  }
}

export function buildOfficialSlidevApp(input: {
  deckId: string
  slidevMarkdown: string
  accessToken?: string
}): SlidevOfficialBuildResult {
  const started = Date.now()
  const accessToken = input.accessToken || randomUUID().replace(/-/g, '')
  const appUrl = resolveSlidevOfficialAppRoute(input.deckId, accessToken)
  const distDir = getDeckDistDir(input.deckId)
  const deckDir = path.dirname(getDeckSlidesPath(input.deckId))
  const slidesPath = getDeckSlidesPath(input.deckId)
  const base = appUrl.endsWith('/') ? appUrl : `${appUrl}/`

  if (!input.slidevMarkdown.trim()) {
    return { success: false, appUrl, accessToken, distDir, error: 'Slidev Markdown 为空，无法构建官方预览。' }
  }

  const installError = ensureRuntimeDependencies()
  if (installError) {
    return { success: false, appUrl, accessToken, distDir, error: installError }
  }

  fs.mkdirSync(deckDir, { recursive: true })
  fs.writeFileSync(slidesPath, input.slidevMarkdown, 'utf-8')
  const runtimeSlidesPath = path.join(SLIDEV_RUNTIME_DIR, 'slides.md')
  fs.writeFileSync(runtimeSlidesPath, input.slidevMarkdown, 'utf-8')

  const slidevBin = resolveSlidevCliBin()
  const build = spawnSync(
    slidevBin,
    ['build', 'slides.md', '--base', base, '--out', distDir],
    {
      cwd: SLIDEV_RUNTIME_DIR,
      stdio: 'pipe',
      encoding: 'utf-8',
      env: { ...process.env, CI: 'true', NODE_ENV: 'production' },
      timeout: 180_000,
    },
  )

  if (build.status !== 0) {
    const stderr = (build.stderr || '').trim()
    const stdout = (build.stdout || '').trim()
    const message = stderr || stdout || `slidev build exited with code ${build.status ?? 'unknown'}`
    console.info(`[slidev-official] deckId=${input.deckId} error=${message}`)
    return { success: false, appUrl, accessToken, distDir, error: message, durationMs: Date.now() - started }
  }

  if (!resolveSlidevOfficialAppIndexPath(input.deckId)) {
    return {
      success: false,
      appUrl,
      accessToken,
      distDir,
      error: 'Slidev 构建完成但未找到 index.html',
      durationMs: Date.now() - started,
    }
  }

  console.info(`[slidev-official] deckId=${input.deckId} built in ${Date.now() - started}ms`)
  return { success: true, appUrl, accessToken, distDir, durationMs: Date.now() - started }
}

export function validateSlidevAccessToken(
  runtimeToken: string | null | undefined,
  requestedToken: string,
): boolean {
  if (!runtimeToken || !requestedToken) return false
  return runtimeToken === requestedToken
}

export function serveOfficialSlidevAsset(input: {
  deckId: string
  accessToken: string
  runtimeToken: string | null | undefined
  relativePath: string
}): { ok: true; filePath: string; contentType: string } | { ok: false; status: number; error: string } {
  if (!validateSlidevAccessToken(input.runtimeToken, input.accessToken)) {
    return { ok: false, status: 403, error: '预览访问令牌无效' }
  }

  const distDir = getDeckDistDirForServe(input.deckId)
  const safeRelative = input.relativePath.replace(/^\/+/, '') || 'index.html'
  const resolved = path.resolve(distDir, safeRelative)
  if (!resolved.startsWith(path.resolve(distDir))) {
    return { ok: false, status: 400, error: '非法资源路径' }
  }

  let filePath = resolved
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    const indexPath = path.join(distDir, 'index.html')
    if (!fs.existsSync(indexPath)) {
      return { ok: false, status: 404, error: 'Slidev 应用尚未构建' }
    }
    filePath = indexPath
  }

  const ext = path.extname(filePath).toLowerCase()
  const contentType = ext === '.js'
    ? 'application/javascript; charset=utf-8'
    : ext === '.css'
      ? 'text/css; charset=utf-8'
      : ext === '.svg'
        ? 'image/svg+xml'
        : ext === '.png'
          ? 'image/png'
          : ext === '.woff2'
            ? 'font/woff2'
            : 'text/html; charset=utf-8'

  return { ok: true, filePath, contentType }
}
