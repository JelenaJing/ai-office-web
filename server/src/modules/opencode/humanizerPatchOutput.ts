import fs from 'fs'
import path from 'path'
import { invokeLlmText, isLlmConfigured } from '../ai-gateway'

export interface HumanizerPatchJson {
  type: 'replace_selection'
  text: string
  summary: string[]
  warnings: string[]
}

export interface HumanizerJobDebugInfo {
  jobDir: string
  materializedSkillPath?: string
  skillSourcePath?: string
  skillSourceExists?: boolean
  skillSourceSha256?: string
  opencodeCommand?: string
  opencodeArgs?: string[]
  cwd?: string
  resultPath?: string
  resultExists?: boolean
  usedFallback?: boolean
  selectionPath: string
  documentContextPath: string
  stdoutLogPath: string
  stderrLogPath: string
  patchJsonPath: string
  patchJsonExists: boolean
  opencodeExitOk: boolean
  fallbackReason?: string
  repaired?: boolean
  repairReason?: string
  repairWarnings?: string[]
}

const PATCH_REL = 'output/patch.json'

export function humanizerPatchPath(jobDir: string): string {
  return path.join(jobDir, PATCH_REL)
}

export function normalizePatchJson(
  raw: Record<string, unknown>,
  selectionText: string,
): HumanizerPatchJson | null {
  const text = typeof raw.text === 'string' ? raw.text.trim() : ''
  if (!text || text === selectionText.trim()) return null
  const summary = Array.isArray(raw.summary)
    ? raw.summary.map(s => String(s)).filter(Boolean)
    : ['已完成深度降重']
  const warnings = Array.isArray(raw.warnings) ? raw.warnings.map(w => String(w)) : []
  const type = raw.type === 'replace_selection' ? 'replace_selection' : 'replace_selection'
  return { type, text, summary, warnings }
}

export function readHumanizerPatch(jobDir: string): HumanizerPatchJson | null {
  const full = humanizerPatchPath(jobDir)
  if (!fs.existsSync(full)) return null
  try {
    const raw = JSON.parse(fs.readFileSync(full, 'utf-8')) as Record<string, unknown>
    return normalizePatchJson(raw, '')
  } catch {
    return null
  }
}

function extractJsonObjects(text: string): Record<string, unknown>[] {
  const found: Record<string, unknown>[] = []
  const fenceRe = /```(?:json)?\s*([\s\S]*?)```/gi
  let m: RegExpExecArray | null
  while ((m = fenceRe.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(m[1].trim()) as Record<string, unknown>
      found.push(parsed)
    } catch {
      // ignore
    }
  }
  const braceRe = /\{[\s\S]*?"type"\s*:\s*"replace_selection"[\s\S]*?\}/g
  while ((m = braceRe.exec(text)) !== null) {
    try {
      found.push(JSON.parse(m[0]) as Record<string, unknown>)
    } catch {
      // ignore
    }
  }
  return found
}

function pickBestRewrittenPlainText(raw: string, selectionText: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed || trimmed.length < 4) return null
  if (trimmed === selectionText.trim()) return null
  if (/^OpenCode 未生成/i.test(trimmed)) return null
  const lines = trimmed
    .split(/\n/)
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('$') && !l.startsWith('>') && !/^\[/.test(l))
  const candidate = lines.length ? lines.join('\n').trim() : trimmed
  if (candidate.length < 4 || candidate === selectionText.trim()) return null
  return candidate
}

export async function repairHumanizerPatchFromJobArtifacts(input: {
  jobDir: string
  selectionText: string
}): Promise<{ patch: HumanizerPatchJson | null; warnings: string[] }> {
  const warnings: string[] = ['OpenCode 未直接写出 output/patch.json，已尝试从运行日志修复。']
  const existing = readHumanizerPatch(input.jobDir)
  if (existing?.text) {
    return { patch: existing, warnings: [] }
  }

  const stdoutPath = path.join(input.jobDir, 'logs', 'stdout.log')
  const stderrPath = path.join(input.jobDir, 'logs', 'stderr.log')
  const stdout = fs.existsSync(stdoutPath) ? fs.readFileSync(stdoutPath, 'utf-8') : ''
  const stderr = fs.existsSync(stderrPath) ? fs.readFileSync(stderrPath, 'utf-8') : ''
  const combined = `${stdout}\n${stderr}`

  for (const obj of extractJsonObjects(combined)) {
    const patch = normalizePatchJson(obj, input.selectionText)
    if (patch) {
      writeHumanizerPatch(input.jobDir, patch, warnings)
      return { patch, warnings }
    }
  }

  const plain = pickBestRewrittenPlainText(combined, input.selectionText)
  if (plain) {
    const patch: HumanizerPatchJson = {
      type: 'replace_selection',
      text: plain,
      summary: ['已从 OpenCode 输出修复生成 patch'],
      warnings,
    }
    writeHumanizerPatch(input.jobDir, patch, warnings)
    return { patch, warnings }
  }

  if (isLlmConfigured()) {
    try {
      const llmOut = await invokeLlmText(
        [
          {
            role: 'system',
            content:
              '从 OpenCode 运行日志中提取 humanizer 改写结果，只输出一个 JSON 对象，格式：{"type":"replace_selection","text":"...","summary":["..."],"warnings":[]}。不要 Markdown。',
          },
          {
            role: 'user',
            content: [
              `原始选区：\n${input.selectionText}`,
              `日志：\n${combined.slice(0, 12000)}`,
            ].join('\n\n'),
          },
        ],
        { temperature: 0.1, maxTokens: 2000 },
      )
      for (const obj of extractJsonObjects(llmOut)) {
        const patch = normalizePatchJson(obj, input.selectionText)
        if (patch) {
          warnings.push('已通过 LLM 从 OpenCode 日志结构化修复 patch.json。')
          writeHumanizerPatch(input.jobDir, patch, warnings)
          return { patch, warnings }
        }
      }
      const llmPlain = pickBestRewrittenPlainText(llmOut, input.selectionText)
      if (llmPlain) {
        warnings.push('已通过 LLM 从 OpenCode 日志提取纯文本修复 patch.json。')
        const patch: HumanizerPatchJson = {
          type: 'replace_selection',
          text: llmPlain,
          summary: ['已从 OpenCode 日志修复生成 patch'],
          warnings,
        }
        writeHumanizerPatch(input.jobDir, patch, warnings)
        return { patch, warnings }
      }
    } catch (err) {
      warnings.push(`LLM 修复失败：${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return { patch: null, warnings }
}

export function writeHumanizerPatch(
  jobDir: string,
  patch: HumanizerPatchJson,
  extraWarnings: string[] = [],
): void {
  const outDir = path.join(jobDir, 'output')
  fs.mkdirSync(outDir, { recursive: true })
  const merged: HumanizerPatchJson = {
    type: 'replace_selection',
    text: patch.text,
    summary: patch.summary?.length ? patch.summary : ['已完成深度降重'],
    warnings: [...(patch.warnings || []), ...extraWarnings],
  }
  fs.writeFileSync(humanizerPatchPath(jobDir), JSON.stringify(merged, null, 2), 'utf-8')
}

export function writeHumanizerJobDebug(jobDir: string, info: HumanizerJobDebugInfo): string {
  const debugPath = path.join(jobDir, 'logs', 'debug.json')
  fs.mkdirSync(path.dirname(debugPath), { recursive: true })
  fs.writeFileSync(debugPath, JSON.stringify(info, null, 2), 'utf-8')
  return debugPath
}
