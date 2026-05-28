import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import { materializeSkillForJob, SkillNotInstalledError } from './skillMaterializer'
import { resolveOpencodeBin } from './opencodeStatus.service'

export const OPENCODE_BIN = resolveOpencodeBin()
const DEFAULT_TIMEOUT_MS = 180_000
export const DOCUMENT_STUDIO_JOB_ROOT = path.resolve(__dirname, '../../../runtime/opencode-jobs')

export interface OpenCodeJobRunOptions {
  jobId: string
  skillId: string
  taskPrompt: string
  inputFiles?: Record<string, unknown>
  selectionJson?: Record<string, unknown>
  documentContextJson?: Record<string, unknown>
  timeoutMs?: number
  permissions?: Record<string, unknown>
  /** humanizer / news-writer 等正式 Skill 必须来自 aios-skills */
  requireAiosSkills?: boolean
  /** 相对 jobDir 的路径，传给 opencode run -f */
  attachedFiles?: string[]
  /** 绝对路径，原样传给 opencode run -f（用于 aios-skills 原始 SKILL.md） */
  attachedAbsoluteFiles?: string[]
  /** 为 true 时不 materialize 到 jobDir/.opencode/skills（仅写 permissions 配置） */
  skipSkillMaterialize?: boolean
}

export interface OpenCodeJobRunResult {
  success: boolean
  jobDir: string
  stdout: string
  stderr: string
  timedOut?: boolean
  error?: string
  skillNotInstalled?: boolean
  opencodeCommand?: string
  opencodeArgs?: string[]
}

function ensureJobDirs(jobDir: string): void {
  for (const sub of ['input', 'output', 'logs', 'input/materials']) {
    fs.mkdirSync(path.join(jobDir, sub), { recursive: true })
  }
}

export function prepareOpenCodeJobDir(jobId: string): string {
  const jobDir = path.join(DOCUMENT_STUDIO_JOB_ROOT, jobId)
  ensureJobDirs(jobDir)
  return jobDir
}

export function assertOpencodeBinAvailable(): void {
  if (!fs.existsSync(OPENCODE_BIN)) {
    throw new Error(`未找到 OpenCode 可执行文件：${OPENCODE_BIN}`)
  }
}

export async function runOpenCodeJob(options: OpenCodeJobRunOptions): Promise<OpenCodeJobRunResult> {
  const jobDir = prepareOpenCodeJobDir(options.jobId)

  try {
    assertOpencodeBinAvailable()
    if (options.skipSkillMaterialize) {
      if (options.permissions) {
        const opencodeRoot = path.join(jobDir, '.opencode')
        fs.mkdirSync(opencodeRoot, { recursive: true })
        fs.writeFileSync(
          path.join(opencodeRoot, 'opencode.json'),
          JSON.stringify(options.permissions, null, 2),
          'utf-8',
        )
      }
    } else {
      materializeSkillForJob({
        skillId: options.skillId,
        jobDir,
        permissions: options.permissions,
        requireAiosSkills: options.requireAiosSkills,
      })
    }
  } catch (error) {
    if (error instanceof SkillNotInstalledError) {
      return {
        success: false,
        jobDir,
        stdout: '',
        stderr: error.message,
        error: error.message,
        skillNotInstalled: true,
      }
    }
    throw error
  }

  if (options.inputFiles) {
    fs.writeFileSync(
      path.join(jobDir, 'input', 'document-request.json'),
      JSON.stringify(options.inputFiles, null, 2),
      'utf-8',
    )
  }
  if (options.selectionJson) {
    fs.writeFileSync(
      path.join(jobDir, 'input', 'selection.json'),
      JSON.stringify(options.selectionJson, null, 2),
      'utf-8',
    )
  }
  if (options.documentContextJson) {
    fs.writeFileSync(
      path.join(jobDir, 'input', 'document-context.json'),
      JSON.stringify(options.documentContextJson, null, 2),
      'utf-8',
    )
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const stdoutPath = path.join(jobDir, 'logs', 'stdout.log')
  const stderrPath = path.join(jobDir, 'logs', 'stderr.log')

  const spawnArgs = [OPENCODE_BIN, 'run', '--pure', '--dir', jobDir]
  for (const absFile of options.attachedAbsoluteFiles ?? []) {
    if (fs.existsSync(absFile)) spawnArgs.push('-f', absFile)
  }
  for (const rel of options.attachedFiles ?? []) {
    const abs = path.join(jobDir, rel)
    if (fs.existsSync(abs)) spawnArgs.push('-f', rel)
  }
  spawnArgs.push('--', options.taskPrompt)
  const opencodeCommand = OPENCODE_BIN
  const opencodeArgs = spawnArgs.slice(1)

  return new Promise(resolve => {
    let stdout = ''
    let stderr = ''
    let timedOut = false
    const child = spawn(spawnArgs[0], spawnArgs.slice(1), {
      env: { ...process.env },
      cwd: jobDir,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    const timer = setTimeout(() => {
      timedOut = true
      child.kill('SIGTERM')
    }, timeoutMs)
    child.stdout?.on('data', chunk => {
      stdout += String(chunk)
    })
    child.stderr?.on('data', chunk => {
      stderr += String(chunk)
    })
    child.on('close', code => {
      clearTimeout(timer)
      fs.writeFileSync(stdoutPath, stdout, 'utf-8')
      fs.writeFileSync(stderrPath, stderr, 'utf-8')
      resolve({
        success: !timedOut && code === 0,
        jobDir,
        stdout,
        stderr,
        timedOut,
        opencodeCommand,
        opencodeArgs,
        error: timedOut
          ? `OpenCode 在 ${Math.round(timeoutMs / 1000)} 秒内未完成，已终止。`
          : code !== 0
            ? `OpenCode 退出码 ${code}${stderr ? `：${stderr.slice(0, 200)}` : ''}`
            : undefined,
      })
    })
    child.on('error', err => {
      clearTimeout(timer)
      resolve({
        success: false,
        jobDir,
        stdout,
        stderr: `${stderr}\n${err.message}`,
        opencodeCommand,
        opencodeArgs,
        error: err.message,
      })
    })
  })
}

export function readOpenCodeOutputJson<T>(jobDir: string, relativePath: string): T | null {
  const full = path.join(jobDir, relativePath)
  if (!fs.existsSync(full)) return null
  try {
    return JSON.parse(fs.readFileSync(full, 'utf-8')) as T
  } catch {
    return null
  }
}

export function openCodeOutputFileExists(jobDir: string, relativePath: string): boolean {
  return fs.existsSync(path.join(jobDir, relativePath))
}

export const GENERATION_REQUIRED_OUTPUTS = [
  'output/document.json',
  'output/editor.json',
  'output/document.md',
  'output/index.html',
  'output/result.json',
] as const

export function validateGenerationOutputs(jobDir: string): { ok: boolean; missing: string[] } {
  const missing = GENERATION_REQUIRED_OUTPUTS.filter(rel => !openCodeOutputFileExists(jobDir, rel))
  return { ok: missing.length === 0, missing: [...missing] }
}
