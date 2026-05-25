import { randomUUID } from 'crypto'
import fs from 'fs'
import path from 'path'
import { spawnSync } from 'child_process'
import { tmpdir } from 'os'
import {
  buildOfficialSlidevApp,
  getDeckDistDirForServe,
  resolveSlidevOfficialAppIndexPath,
  resolveSlidevOfficialAppRoute,
} from './slidevOfficialRunner'

const SERVER_ROOT = path.resolve(__dirname, '../../../../')
const SLIDEV_RUNTIME_DIR = path.join(SERVER_ROOT, 'slidev-runtime')

function resolveSlidevCliBin(): string {
  const localBin = path.join(SLIDEV_RUNTIME_DIR, 'node_modules', '.bin', 'slidev')
  if (fs.existsSync(localBin)) return localBin
  return 'slidev'
}

export interface EnsureOfficialSlidevDistResult {
  success: boolean
  appUrl?: string
  accessToken?: string
  error?: string
}

export function ensureOfficialSlidevDist(input: {
  deckId: string
  slidevMarkdown: string
  accessToken?: string | null
}): EnsureOfficialSlidevDistResult {
  if (resolveSlidevOfficialAppIndexPath(input.deckId)) {
    const token = input.accessToken || ''
    return {
      success: true,
      appUrl: token ? resolveSlidevOfficialAppRoute(input.deckId, token) : undefined,
      accessToken: token || undefined,
    }
  }
  const official = buildOfficialSlidevApp({
    deckId: input.deckId,
    slidevMarkdown: input.slidevMarkdown,
    accessToken: input.accessToken || undefined,
  })
  if (!official.success) {
    return { success: false, error: official.error || 'Slidev 官方构建失败' }
  }
  return {
    success: true,
    appUrl: official.appUrl,
    accessToken: official.accessToken,
  }
}

export function zipOfficialSlidevDist(deckId: string): { success: boolean; zipPath?: string; error?: string } {
  const distDir = getDeckDistDirForServe(deckId)
  if (!resolveSlidevOfficialAppIndexPath(deckId)) {
    return { success: false, error: 'Slidev 官方应用尚未构建' }
  }
  const zipPath = path.join(tmpdir(), `slidev-${deckId}-${randomUUID()}.zip`)
  const zip = spawnSync('zip', ['-r', '-q', zipPath, '.'], {
    cwd: distDir,
    encoding: 'utf-8',
    timeout: 120_000,
  })
  if (zip.status !== 0) {
    const message = (zip.stderr || zip.stdout || '').trim() || `zip exited with code ${zip.status ?? 'unknown'}`
    return { success: false, error: message }
  }
  if (!fs.existsSync(zipPath)) {
    return { success: false, error: 'ZIP 打包失败' }
  }
  return { success: true, zipPath }
}

export function exportOfficialSlidevPdf(input: {
  deckId: string
  slidevMarkdown: string
  accessToken?: string | null
}): { success: boolean; pdfPath?: string; error?: string } {
  const ensured = ensureOfficialSlidevDist(input)
  if (!ensured.success) {
    return { success: false, error: ensured.error }
  }

  const slidesPath = path.join(SLIDEV_RUNTIME_DIR, 'slides.md')
  fs.writeFileSync(slidesPath, input.slidevMarkdown, 'utf-8')

  const pdfPath = path.join(tmpdir(), `slidev-${input.deckId}-${randomUUID()}.pdf`)
  const base = ensured.appUrl?.endsWith('/') ? ensured.appUrl : `${ensured.appUrl || ''}/`
  const slidevBin = resolveSlidevCliBin()
  const exported = spawnSync(
    slidevBin,
    ['export', 'slides.md', '--format', 'pdf', '--output', pdfPath, '--base', base],
    {
      cwd: SLIDEV_RUNTIME_DIR,
      stdio: 'pipe',
      encoding: 'utf-8',
      env: { ...process.env, CI: 'true' },
      timeout: 300_000,
    },
  )

  if (exported.status !== 0) {
    const stderr = (exported.stderr || '').trim()
    const stdout = (exported.stdout || '').trim()
    const message = stderr || stdout || `slidev export pdf exited with code ${exported.status ?? 'unknown'}`
    return { success: false, error: message }
  }
  if (!fs.existsSync(pdfPath)) {
    return { success: false, error: 'PDF 导出完成但未找到输出文件' }
  }
  return { success: true, pdfPath }
}

export function cleanupTempExportFile(filePath: string | undefined): void {
  if (!filePath) return
  try {
    fs.unlinkSync(filePath)
  } catch {
    // ignore cleanup errors
  }
}
