import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import {
  createArtifactDir,
  saveArtifactMetadata,
  type Artifact,
} from '../../../artifacts/ArtifactStore'
import { resolveUserFile } from '../../../lib/userFiles'
import { assertWorkspaceAccess, WorkspaceAccessError } from '../../../lib/workspaceAccess'
import {
  assertSupportedExtension,
  BATTERY_LIFE_MODEL_ID,
} from '../models/analysisModelRegistry'
import {
  getDataAnalysisJob,
  updateDataAnalysisJob,
  type DataAnalysisProgressStage,
  type BatteryLifeJobResult,
} from '../dataAnalysisJobStore'

const SERVER_ROOT = path.resolve(__dirname, '../../../..')
const JOB_ROOT = path.join(SERVER_ROOT, 'data', 'data-analysis-jobs')
const PYTHON_DIR = path.join(SERVER_ROOT, 'python', 'battery_life')
const RUNNER_SCRIPT = path.join(PYTHON_DIR, 'run_battery_life_analysis.py')

const PROGRESS_STAGES: DataAnalysisProgressStage[] = [
  '读取数据',
  '清洗异常点',
  '拟合衰减模型',
  '生成预测曲线',
  '生成报告',
]

function resolvePythonBin(): string {
  return (
    process.env.BATTERY_LIFE_PYTHON?.trim() ||
    process.env.PYTHON_BIN?.trim() ||
    process.env.AI_OFFICE_PYTHON?.trim() ||
    'python3'
  )
}

async function ensurePythonDeps(pythonBin: string): Promise<void> {
  const marker = path.join(PYTHON_DIR, '.deps-ready')
  const lockPath = path.join(PYTHON_DIR, '.deps.lock')

  if (fs.existsSync(marker)) return
  if (!fs.existsSync(PYTHON_DIR)) {
    fs.mkdirSync(PYTHON_DIR, { recursive: true })
  }

  // Simple lock: avoid concurrent pip installs.
  try {
    const fd = fs.openSync(lockPath, 'wx')
    fs.closeSync(fd)
  } catch {
    // someone else is installing; wait up to ~120s
    const start = Date.now()
    while (!fs.existsSync(marker)) {
      if (Date.now() - start > 120_000) break
      await new Promise((r) => setTimeout(r, 2000))
    }
    if (!fs.existsSync(marker)) {
      throw new Error('等待 Python 依赖安装超时')
    }
    return
  }

  try {
    const check = await new Promise<boolean>((resolve) => {
      const child = spawn(
        pythonBin,
        ['-c', 'import numpy, pandas, scipy, plotly, matplotlib, openpyxl, xlrd; print(\"OK\")'],
        { cwd: PYTHON_DIR, env: { ...process.env, PYTHONIOENCODING: 'utf-8' }, stdio: ['ignore', 'ignore', 'ignore'] },
      )
      child.on('close', (code) => resolve(code === 0))
      child.on('error', () => resolve(false))
    })

    if (!check) {
      await new Promise<void>((resolve, reject) => {
        const child = spawn(
          pythonBin,
          ['-m', 'pip', 'install', '--no-cache-dir', '-r', 'requirements.txt'],
          { cwd: PYTHON_DIR, env: { ...process.env, PYTHONIOENCODING: 'utf-8' }, stdio: ['ignore', 'ignore', 'pipe'] },
        )
        let stderr = ''
        child.stderr?.on('data', (chunk) => {
          stderr += String(chunk)
        })
        child.on('error', reject)
        child.on('close', (code) => {
          if (code === 0) resolve()
          else reject(new Error(stderr.trim() || `pip install failed with code ${code}`))
        })
      })
    }

    fs.writeFileSync(marker, JSON.stringify({ ok: true, at: new Date().toISOString() }), 'utf-8')
  } finally {
    try {
      fs.unlinkSync(lockPath)
    } catch {
      // ignore
    }
  }
}

function stageProgress(stage: string): number {
  const idx = PROGRESS_STAGES.indexOf(stage as DataAnalysisProgressStage)
  if (idx < 0) return 50
  return Math.round(((idx + 1) / PROGRESS_STAGES.length) * 90)
}

function summarizeStderr(stderr: string, maxLen = 1200): string {
  const lines = stderr
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  const tail = lines.slice(-12).join('\n')
  return tail.length > maxLen ? tail.slice(-maxLen) : tail
}

function copyDirFilesToArtifact(srcDir: string, destDir: string, relPrefix = ''): string[] {
  const copied: string[] = []
  if (!fs.existsSync(srcDir)) return copied
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const rel = relPrefix ? `${relPrefix}/${entry.name}` : entry.name
    const src = path.join(srcDir, entry.name)
    const dest = path.join(destDir, rel)
    if (entry.isDirectory()) {
      fs.mkdirSync(dest, { recursive: true })
      copied.push(...copyDirFilesToArtifact(src, destDir, rel))
    } else if (entry.isFile()) {
      fs.mkdirSync(path.dirname(dest), { recursive: true })
      fs.copyFileSync(src, dest)
      copied.push(rel)
    }
  }
  return copied
}

function listPngFiles(dir: string, base = ''): string[] {
  const out: string[] = []
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name
    const abs = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...listPngFiles(abs, rel))
    else if (/\.png$/i.test(entry.name)) out.push(rel)
  }
  return out.sort()
}

export interface RunBatteryLifeJobInput {
  jobId: string
  userId: string
  fileId: string
  workspacePath: string
}

export async function runBatteryLifeAnalysisJob(
  input: RunBatteryLifeJobInput,
): Promise<BatteryLifeJobResult | { success: false; error: string; status?: number }> {
  const jobId = input.jobId
  const bump = (stage: DataAnalysisProgressStage, message?: string) => {
    if (getDataAnalysisJob(jobId)?.cancelRequested) return
    updateDataAnalysisJob(jobId, {
      status: 'running',
      stage,
      progress: stageProgress(stage),
      message: message || stage,
    })
  }

  let access
  try {
    access = assertWorkspaceAccess(input.userId, input.workspacePath, 'editor')
  } catch (error) {
    const workspaceError = error instanceof WorkspaceAccessError ? error : null
    return {
      success: false,
      error: workspaceError?.message || (error instanceof Error ? error.message : String(error)),
      status: workspaceError?.status ?? 500,
    }
  }

  const resolved = resolveUserFile(input.userId, input.fileId, access.workspacePath)
  if (!resolved) {
    return { success: false, error: '文件不存在或无权访问', status: 404 }
  }

  const ext = resolved.entry.ext.toLowerCase()
  try {
    assertSupportedExtension(BATTERY_LIFE_MODEL_ID, ext)
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e), status: 400 }
  }

  const jobDir = path.join(JOB_ROOT, jobId)
  const inputDir = path.join(jobDir, 'input')
  const outputDir = path.join(jobDir, 'output')
  fs.mkdirSync(inputDir, { recursive: true })
  fs.mkdirSync(outputDir, { recursive: true })

  const inputName = `upload.${ext}`
  const inputPath = path.join(inputDir, inputName)
  fs.copyFileSync(resolved.absolutePath, inputPath)

  bump('读取数据', '正在读取并校验数据文件…')

  if (!fs.existsSync(RUNNER_SCRIPT)) {
    return {
      success: false,
      error: `电池寿命分析脚本未安装：${RUNNER_SCRIPT}`,
      status: 500,
    }
  }

  const pythonBin = resolvePythonBin()

  bump('读取数据', '正在准备 Python 依赖与运行环境…')
  try {
    await ensurePythonDeps(pythonBin)
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e), status: 500 }
  }
  const runResult = await new Promise<{
    code: number | null
    stdout: string
    stderr: string
  }>((resolve, reject) => {
    const child = spawn(
      pythonBin,
      [RUNNER_SCRIPT, '--input', inputPath, '--output', outputDir],
      {
        cwd: PYTHON_DIR,
        env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    )
    let stdout = ''
    let stderr = ''
    let stdoutTail = ''
    child.stdout?.on('data', (chunk) => {
      const s = String(chunk)
      stdout += s
      stdoutTail += s
      const lines = stdoutTail.split(/\r?\n/)
      stdoutTail = lines.pop() || ''
      for (const line of lines) {
        const trimmed = String(line || '').trim()
        if (!trimmed.startsWith('DATA_ANALYSIS_PROGRESS:')) continue
        try {
          const payload = JSON.parse(trimmed.slice('DATA_ANALYSIS_PROGRESS:'.length)) as {
            stage?: string
            message?: string
          }
          if (payload.stage) bump(payload.stage as DataAnalysisProgressStage, payload.message)
        } catch {
          // ignore malformed progress lines
        }
      }
    })
    child.stderr?.on('data', (chunk) => {
      stderr += String(chunk)
    })
    child.on('error', (err) => {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        reject(
          new Error(
            `未找到 Python 解释器（${pythonBin}）。请在服务器安装 Python 3 及依赖：pip install -r server/python/battery_life/requirements.txt`,
          ),
        )
        return
      }
      reject(err)
    })
    child.on('close', (code) => resolve({ code, stdout, stderr }))
  }).catch((e) => ({
    code: 1,
    stdout: '',
    stderr: e instanceof Error ? e.message : String(e),
  }))

  if (getDataAnalysisJob(jobId)?.cancelRequested) {
    return { success: false, error: '任务已取消', status: 499 }
  }

  if (runResult.code !== 0) {
    const errPath = path.join(outputDir, 'error.json')
    let detail = summarizeStderr(runResult.stderr)
    if (fs.existsSync(errPath)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(errPath, 'utf-8')) as { error?: string }
        if (parsed.error) detail = parsed.error
      } catch {
        // ignore
      }
    }
    if (!detail && runResult.stdout) {
      detail = summarizeStderr(runResult.stdout)
    }
    return {
      success: false,
      error: detail || `Python 分析失败（退出码 ${runResult.code ?? 'unknown'}）`,
      status: 500,
    }
  }

  bump('生成报告', '正在整理分析结果…')

  const reportPath = path.join(outputDir, 'report.md')
  const resultPath = path.join(outputDir, 'result.json')
  if (!fs.existsSync(reportPath) || !fs.existsSync(resultPath)) {
    return {
      success: false,
      error: '分析未生成完整输出（缺少 report.md 或 result.json）',
      status: 500,
    }
  }

  let resultJson: Record<string, unknown> = {}
  try {
    resultJson = JSON.parse(fs.readFileSync(resultPath, 'utf-8')) as Record<string, unknown>
  } catch {
    return { success: false, error: 'result.json 解析失败', status: 500 }
  }

  const artifactId = randomUUID()
  const titleBase = path.basename(resolved.entry.name, path.extname(resolved.entry.name))
  const title = `${titleBase} · 电池寿命预测`
  const now = new Date().toISOString()
  const artifactDirPath = createArtifactDir(input.userId, access.workspaceId, artifactId)
  const relFiles = copyDirFilesToArtifact(outputDir, artifactDirPath)

  const markdown = fs.readFileSync(reportPath, 'utf-8')
  const summary =
    typeof resultJson.summary === 'string'
      ? resultJson.summary
      : '电池寿命预测分析已完成，请查看 N80 指标与图表。'

  const pngFilesInChartsDir = listPngFiles(path.join(artifactDirPath, 'charts'))
  const pngRelPaths = pngFilesInChartsDir.length
    ? pngFilesInChartsDir.map((f) => `charts/${f}`)
    : relFiles.filter((f) => /\.png$/i.test(f))

  const imageUrls = pngRelPaths.map(
    (filename) =>
      `/api/artifacts/${artifactId}/download?filename=${encodeURIComponent(filename)}`,
  )

  const htmlRel =
    relFiles.find((f) => f.replace(/\\/g, '/').endsWith('charts/prediction_viewer.html')) ||
    relFiles.find((f) => /prediction_viewer\.html$/i.test(f))
  const htmlUrl = htmlRel
    ? `/api/artifacts/${artifactId}/download?filename=${encodeURIComponent(htmlRel)}`
    : undefined
  const htmlPreviewUrl = `/api/artifacts/${artifactId}/preview`

  const downloadUrls: BatteryLifeJobResult['downloadUrls'] = []
  const addExport = (filename: string, label: string, format: string) => {
    if (!fs.existsSync(path.join(artifactDirPath, filename))) return
    downloadUrls.push({
      label,
      filename,
      url: `/api/artifacts/${artifactId}/download?filename=${encodeURIComponent(filename)}`,
    })
    relFiles.push(filename)
  }

  addExport('report.md', 'Markdown 报告', 'md')
  addExport('result.json', '结果 JSON', 'json')
  addExport('files/model_parameters.csv', '模型参数 CSV', 'csv')

  const downloadExports = downloadUrls.map((d) => ({
    format: path.extname(d.filename).slice(1) || 'file',
    filename: d.filename,
    url: d.url,
  }))
  const pngExports = pngRelPaths.map((img) => ({
    format: 'image/png',
    filename: img,
    url: `/api/artifacts/${artifactId}/download?filename=${encodeURIComponent(img)}`,
  }))

  const htmlExportEntry = htmlRel
    ? {
        format: 'text/html',
        filename: htmlRel,
        url: htmlUrl!,
      }
    : null

  const exports = [
    ...(htmlExportEntry ? [htmlExportEntry] : []),
    ...downloadExports,
    ...pngExports,
  ]

  const artifact: Artifact = {
    id: artifactId,
    userId: input.userId,
    workspaceId: access.workspaceId,
    workspacePath: access.workspacePath,
    type: 'data_analysis',
    title,
    editable: false,
    createdBySkillId: 'battery_life_prediction_a',
    createdAt: now,
    exports,
    sourceRefs: [{ type: 'spreadsheet', id: input.fileId, label: resolved.entry.name }],
    documentId: input.fileId,
    metadata: {
      summary,
      imageUrls,
      htmlUrl: htmlRel ? htmlPreviewUrl : undefined,
      artifactKind: 'battery_life_analysis',
      analysisModelId: BATTERY_LIFE_MODEL_ID,
      n80: resultJson.n80,
      markdownPreview: markdown.slice(0, 4000),
      downloadUrls,
      sourceRefs: [{ type: 'spreadsheet', id: input.fileId, label: resolved.entry.name }],
    },
  }

  saveArtifactMetadata(artifact)

  return {
    success: true,
    artifactId,
    summary,
    markdown,
    imageUrls,
    htmlUrl,
    downloadUrls,
    resultJson,
    n80: (resultJson.n80 as Record<string, unknown>) || undefined,
  }
}
