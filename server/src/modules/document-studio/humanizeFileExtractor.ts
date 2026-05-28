import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

export type HumanizeUploadFormat = 'txt' | 'md' | 'docx'

export interface ExtractHumanizeFileResult {
  text: string
  markdown: string
  format: HumanizeUploadFormat
  savedPath: string
  markdownPath?: string
  warnings: string[]
}

export function resolveMarkitdownBin(): string {
  return process.env.MARKITDOWN_BIN?.trim() || 'markitdown'
}

export async function checkMarkitdownAvailable(): Promise<{
  available: boolean
  bin: string
  version?: string
  error?: string
}> {
  const bin = resolveMarkitdownBin()
  return new Promise(resolve => {
    const child = spawn(bin, ['--version'], { stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    child.stdout?.on('data', c => {
      stdout += String(c)
    })
    child.stderr?.on('data', c => {
      stderr += String(c)
    })
    child.on('error', err => {
      resolve({ available: false, bin, error: err.message })
    })
    child.on('close', code => {
      if (code === 0) {
        resolve({ available: true, bin, version: (stdout || stderr).trim() })
      } else {
        resolve({
          available: false,
          bin,
          error: (stderr || stdout || `exit ${code}`).trim() || 'markitdown --version failed',
        })
      }
    })
  })
}

function detectFormat(fileName: string): HumanizeUploadFormat {
  const lower = fileName.toLowerCase()
  if (lower.endsWith('.docx')) return 'docx'
  if (lower.endsWith('.md') || lower.endsWith('.markdown')) return 'md'
  if (lower.endsWith('.txt')) return 'txt'
  throw new Error('仅支持 .txt / .md / .docx 文件')
}

async function runMarkitdown(inputPath: string, outputPath: string): Promise<void> {
  const bin = resolveMarkitdownBin()
  await new Promise<void>((resolve, reject) => {
    const child = spawn(bin, [inputPath, '-o', outputPath], { stdio: ['ignore', 'pipe', 'pipe'] })
    let stderr = ''
    child.stderr?.on('data', c => {
      stderr += String(c)
    })
    child.on('error', err => {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        reject(new Error('Word 解析能力未安装，请先安装 MarkItDown。'))
        return
      }
      reject(err)
    })
    child.on('close', code => {
      if (code === 0 && fs.existsSync(outputPath)) resolve()
      else reject(new Error(stderr.trim() || 'Word 文件解析失败，请检查文件格式。'))
    })
  })
}

/**
 * 将上传文件写入 job input 目录并提取可供改写的纯文本 / Markdown。
 */
export async function extractHumanizeFileToText(input: {
  jobDir: string
  buffer: Buffer
  originalName: string
}): Promise<ExtractHumanizeFileResult> {
  const format = detectFormat(input.originalName)
  const inputDir = path.join(input.jobDir, 'input')
  fs.mkdirSync(inputDir, { recursive: true })

  if (format === 'txt' || format === 'md') {
    const ext = format === 'md' ? '.md' : '.txt'
    const savedPath = path.join(inputDir, `uploaded${ext}`)
    fs.writeFileSync(savedPath, input.buffer)
    const text = input.buffer.toString('utf-8').trim()
    if (!text) throw new Error('文件内容为空')
    fs.writeFileSync(path.join(inputDir, 'original.txt'), text, 'utf-8')
    if (format === 'md') {
      fs.writeFileSync(path.join(inputDir, 'original.md'), text, 'utf-8')
    }
    return {
      text,
      markdown: text,
      format,
      savedPath,
      markdownPath: format === 'md' ? savedPath : undefined,
      warnings: [],
    }
  }

  const docxPath = path.join(inputDir, 'uploaded.docx')
  const markdownPath = path.join(inputDir, 'original.md')
  fs.writeFileSync(docxPath, input.buffer)
  await runMarkitdown(docxPath, markdownPath)
  const markdown = fs.readFileSync(markdownPath, 'utf-8').trim()
  if (!markdown) throw new Error('Word 文件解析失败，请检查文件格式。')
  fs.writeFileSync(path.join(inputDir, 'original.txt'), markdown, 'utf-8')
  return {
    text: markdown,
    markdown,
    format: 'docx',
    savedPath: docxPath,
    markdownPath,
    warnings: [],
  }
}
