import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { invokeLlmText, isLlmConfigured } from '../ai-gateway'
import { getDocumentPlainText, loadStudioDocument } from './documentArtifact.service'
import { isStudioDocumentId } from './editorJsonUtils'
import {
  DOCUMENT_STUDIO_JOB_ROOT,
  prepareOpenCodeJobDir,
  readOpenCodeOutputJson,
  runOpenCodeJob,
} from '../opencode/opencodeJobRunner'
import {
  AIOS_SKILLS_ROOT,
  assertHumanizerSkillSourceInstalled,
  buildHumanizerJobPermissions,
  HUMANIZER_SKILL_SOURCE_PATH,
  isSkillInstalledAtAios,
} from '../opencode/skillMaterializer'
import {
  repairHumanizerPatchFromJobArtifacts,
  writeHumanizerJobDebug,
  type HumanizerJobDebugInfo,
} from '../opencode/humanizerPatchOutput'
import { extractHumanizeFileToText } from './humanizeFileExtractor'

export type HumanizeInputMode = 'text' | 'document' | 'file'
export type HumanizeStrength = 'deep' | 'quick'
export type HumanizeTone = 'natural' | 'formal' | 'academic' | 'business'
export type HumanizeLanguage = 'zh-CN' | 'en-US' | 'auto'

export interface HumanizeJobOptions {
  strength: HumanizeStrength
  tone: HumanizeTone
  preserveMeaning: boolean
  preserveTerms: string[]
  language: HumanizeLanguage
}

export interface CreateHumanizeJobInput {
  userId: string
  inputMode: HumanizeInputMode
  text?: string
  documentId?: string
  fileBuffer?: Buffer
  fileName?: string
  options: HumanizeJobOptions
}

export interface HumanizeResultJson {
  type: 'humanized_text'
  text: string
  summary: string[]
  warnings: string[]
  skillSource?: string
}

export interface HumanizeJobRecord {
  jobId: string
  userId: string
  inputMode: HumanizeInputMode
  documentId?: string
  options: HumanizeJobOptions
  status: 'queued' | 'running' | 'succeeded' | 'failed'
  source?: string
  skillSource?: string
  usedFallback: boolean
  fallbackReason?: string
  originalText?: string
  humanizedText?: string
  error?: string
  opencodeJobDir?: string
  debugPath?: string
  repaired?: boolean
  repairReason?: string
  createdAt: string
  updatedAt: string
}

const JOBS_META_DIR = path.join(DOCUMENT_STUDIO_JOB_ROOT, '_humanize-meta')

function buildHumanizeTaskPrompt(skillSourcePath: string): string {
  return [
    `请使用 ${skillSourcePath} 中定义的 humanizer skill 对 input/original.txt 进行优化。`,
    '不要翻译文本。',
    '默认保持原文语言：输入英文输出英文，输入中文输出中文。',
    'options.language=auto 表示保持原文语言，不是强制输出中文。',
    '仅当 options.language 为 zh-CN 或 en-US 时，才允许改变输出语言。',
    '中文输出不能在汉字之间插入空格。',
    '不要运行 opencode humanizer 等 shell 子命令。',
    '完成后严格按照 input/output-contract.md 写入 output/result.json。',
    `result.json 必须包含 skillSource: "${skillSourcePath}"`,
  ].join('\n')
}

function buildOutputContract(skillSourcePath: string): string {
  return `# output/result.json 交付契约

你必须将降重结果写入 \`output/result.json\`，且仅此文件为最终交付物。

## JSON 格式

\`\`\`json
{
  "type": "humanized_text",
  "text": "降重后的全文（与 input/original.txt 同语言，不翻译）",
  "summary": ["已完成 humanizer 优化"],
  "warnings": [],
  "skillSource": "${skillSourcePath}"
}
\`\`\`

## 语言规则

- 不要翻译：输入英文则 text 必须为英文；输入中文则 text 必须为中文。
- \`options.language\` 为 \`auto\` 时保持原文语言。
- 中文输出禁止在汉字之间插入空格。

## Skill

必须使用附件中的原始 Skill 文件：\`${skillSourcePath}\`
`
}

function copyDirRecursive(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) copyDirRecursive(srcPath, destPath)
    else if (entry.isFile()) fs.copyFileSync(srcPath, destPath)
  }
}

function copyHumanizerDirForAudit(jobDir: string): void {
  const sourceDir = path.join(AIOS_SKILLS_ROOT, 'humanizer')
  if (!fs.existsSync(sourceDir)) return
  copyDirRecursive(sourceDir, path.join(jobDir, 'audit', 'humanizer'))
}

function sha256File(filePath: string): string | undefined {
  if (!fs.existsSync(filePath)) return undefined
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')
}

function newHumanizeJobId(): string {
  return `hz_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function metaPath(jobId: string): string {
  return path.join(JOBS_META_DIR, `${jobId}.json`)
}

function saveJobMeta(record: HumanizeJobRecord): void {
  fs.mkdirSync(JOBS_META_DIR, { recursive: true })
  record.updatedAt = new Date().toISOString()
  fs.writeFileSync(metaPath(record.jobId), JSON.stringify(record, null, 2), 'utf-8')
}

export function getHumanizeJob(jobId: string, userId?: string): HumanizeJobRecord | null {
  const file = metaPath(jobId)
  if (!fs.existsSync(file)) return null
  const record = JSON.parse(fs.readFileSync(file, 'utf-8')) as HumanizeJobRecord
  if (userId && record.userId !== userId) return null
  return record
}

function writeResultJson(jobDir: string, result: HumanizeResultJson): void {
  const outDir = path.join(jobDir, 'output')
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(path.join(outDir, 'result.json'), JSON.stringify(result, null, 2), 'utf-8')
}

function readResultJson(jobDir: string): HumanizeResultJson | null {
  const raw = readOpenCodeOutputJson<HumanizeResultJson & { skillSource?: string }>(
    jobDir,
    'output/result.json',
  )
  if (!raw || raw.type !== 'humanized_text') return null
  const text = typeof raw.text === 'string' ? raw.text.trim() : ''
  if (!text) return null
  return {
    type: 'humanized_text',
    text,
    summary: Array.isArray(raw.summary) ? raw.summary.map(String).filter(Boolean) : ['已完成降重'],
    warnings: Array.isArray(raw.warnings) ? raw.warnings.map(String) : [],
    skillSource: typeof raw.skillSource === 'string' ? raw.skillSource : undefined,
  }
}

function isValidOpencodeHumanizerResult(
  result: HumanizeResultJson | null,
  skillSourcePath: string,
): boolean {
  return Boolean(result?.text && result.skillSource === skillSourcePath)
}

function computeChangeRatio(original: string, humanized: string): number {
  if (!original.length) return humanized.length ? 1 : 0
  if (original === humanized) return 0
  const maxLen = Math.max(original.length, humanized.length)
  let diff = 0
  const minLen = Math.min(original.length, humanized.length)
  for (let i = 0; i < minLen; i++) {
    if (original[i] !== humanized[i]) diff++
  }
  diff += Math.abs(original.length - humanized.length)
  return Math.min(1, diff / maxLen)
}

async function runQuickHumanize(originalText: string, options: HumanizeJobOptions): Promise<HumanizeResultJson> {
  const toneHint =
    options.tone === 'formal'
      ? '语气正式'
      : options.tone === 'academic'
        ? '语气学术'
        : options.tone === 'business'
          ? '语气商务'
          : '语气自然'
  const terms =
    options.preserveTerms?.length ? `必须保留术语：${options.preserveTerms.join('、')}` : ''
  const langHint =
    options.language === 'en-US'
      ? '输出英文。'
      : options.language === 'zh-CN'
        ? '输出中文。'
        : '保持与输入相同的语言，不要翻译。'
  const prompt = [
    '你是文稿降重助手。对下列全文进行改写，降低重复与模板化痕迹，保留原意。',
    toneHint,
    terms,
    langHint,
    options.preserveMeaning ? '必须保留原意，不编造事实。' : '',
    '只输出改写后的全文，不要解释。',
  ]
    .filter(Boolean)
    .join('\n')

  if (!isLlmConfigured()) {
    return {
      type: 'humanized_text',
      text: `${originalText}\n\n（LLM 未配置，此为占位输出。）`,
      summary: ['快速降重（direct-llm 占位）'],
      warnings: ['请配置 LLM_API_KEY'],
    }
  }

  const text = await invokeLlmText(
    [
      { role: 'system', content: prompt },
      { role: 'user', content: originalText },
    ],
    { temperature: 0.45, maxTokens: 8000 },
  )
  return {
    type: 'humanized_text',
    text: text.trim() || originalText,
    summary: ['已完成快速降重'],
    warnings: [],
  }
}

async function resolveOriginalText(input: CreateHumanizeJobInput, jobId?: string): Promise<string> {
  if (input.inputMode === 'document') {
    if (!input.documentId || !isStudioDocumentId(input.documentId)) {
      throw new Error('document 模式需要有效的 documentId')
    }
    const record = loadStudioDocument(input.documentId, input.userId)
    if (!record) throw new Error('文稿不存在或无权限访问')
    const text = getDocumentPlainText(record).trim()
    if (!text) throw new Error('文稿正文为空')
    return text
  }
  if (input.inputMode === 'file') {
    if (!input.fileBuffer?.length || !input.fileName?.trim()) {
      throw new Error('file 模式需要上传文件')
    }
    if (!jobId) throw new Error('file 模式需要 jobId')
    const jobDir = prepareOpenCodeJobDir(jobId)
    const extracted = await extractHumanizeFileToText({
      jobDir,
      buffer: input.fileBuffer,
      originalName: input.fileName,
    })
    return extracted.text
  }
  const text = String(input.text || '').trim()
  if (!text) throw new Error('text 不能为空')
  return text
}

function detectLanguageLabel(text: string): string {
  const latin = (text.match(/[a-zA-Z]/g) || []).length
  const cjk = (text.match(/[\u4e00-\u9fff]/g) || []).length
  if (!latin && !cjk) return '未知'
  if (latin > cjk * 1.2) return '英文为主'
  if (cjk > latin * 1.2) return '中文为主'
  return '中英混合'
}

function mapChannelLabel(record: HumanizeJobRecord): string {
  if (record.usedFallback) return '备用通道'
  if (record.options.strength === 'quick') return '快速改写'
  if (record.source === 'opencode-humanizer') return '深度改写'
  if (record.source === 'direct-llm') return '快速改写'
  return record.options.strength === 'deep' ? '深度改写' : '快速改写'
}

async function processHumanizeJobAsync(record: HumanizeJobRecord, originalText: string): Promise<void> {
  const skillSourcePath = HUMANIZER_SKILL_SOURCE_PATH
  const jobDir = prepareOpenCodeJobDir(record.jobId)
  record.opencodeJobDir = jobDir
  record.status = 'running'
  saveJobMeta(record)

  fs.writeFileSync(path.join(jobDir, 'input', 'original.txt'), originalText, 'utf-8')
  fs.writeFileSync(path.join(jobDir, 'input', 'options.json'), JSON.stringify(record.options, null, 2), 'utf-8')
  fs.writeFileSync(path.join(jobDir, 'input', 'output-contract.md'), buildOutputContract(skillSourcePath), 'utf-8')

  const selectionJson = {
    text: originalText,
    from: 0,
    to: originalText.length,
    blockIds: [] as string[],
  }
  fs.writeFileSync(path.join(jobDir, 'input', 'selection.json'), JSON.stringify(selectionJson, null, 2), 'utf-8')

  if (record.documentId) {
    const doc = loadStudioDocument(record.documentId, record.userId)
    if (doc) {
      fs.writeFileSync(
        path.join(jobDir, 'input', 'document-context.json'),
        JSON.stringify(
          {
            documentId: doc.documentId,
            title: doc.title,
            documentType: doc.documentType,
            language: record.options.language,
          },
          null,
          2,
        ),
        'utf-8',
      )
    }
  }

  if (record.options.strength === 'quick') {
    try {
      const result = await runQuickHumanize(originalText, record.options)
      writeResultJson(jobDir, result)
      record.status = 'succeeded'
      record.source = 'direct-llm'
      record.usedFallback = false
      record.humanizedText = result.text
      record.fallbackReason = undefined
      record.repaired = false
    } catch (err) {
      record.status = 'failed'
      record.error = err instanceof Error ? err.message : String(err)
      record.source = 'direct-llm'
      record.usedFallback = true
      record.fallbackReason = record.error
    }
    saveJobMeta(record)
    return
  }

  if (!isSkillInstalledAtAios('humanizer') || !fs.existsSync(skillSourcePath)) {
    record.status = 'failed'
    record.error = 'humanizer Skill 未安装。'
    record.source = 'direct-llm'
    record.usedFallback = true
    record.fallbackReason = record.error
    saveJobMeta(record)
    return
  }

  copyHumanizerDirForAudit(jobDir)

  const resultPath = path.join(jobDir, 'output', 'result.json')
  let repaired = false
  let repairReason: string | undefined

  let run
  try {
    assertHumanizerSkillSourceInstalled()
    run = await runOpenCodeJob({
      jobId: record.jobId,
      skillId: 'humanizer',
      taskPrompt: buildHumanizeTaskPrompt(skillSourcePath),
      skipSkillMaterialize: true,
      permissions: buildHumanizerJobPermissions('humanizer'),
      attachedAbsoluteFiles: [skillSourcePath],
      attachedFiles: [
        'input/original.txt',
        'input/options.json',
        'input/output-contract.md',
      ],
      timeoutMs: 180_000,
    })
  } catch (err) {
    run = {
      success: false,
      jobDir,
      stdout: '',
      stderr: err instanceof Error ? err.message : String(err),
      error: err instanceof Error ? err.message : String(err),
    }
  }

  let result = readResultJson(jobDir)
  const hadNativeResult = isValidOpencodeHumanizerResult(result, skillSourcePath)

  if (!hadNativeResult) {
    const repair = await repairHumanizerPatchFromJobArtifacts({
      jobDir,
      selectionText: originalText,
    })
    if (repair.patch?.text) {
      repaired = true
      repairReason = repair.warnings.join('; ') || 'OpenCode 未写出带 skillSource 的 result.json，已从 patch/日志修复'
      result = {
        type: 'humanized_text',
        text: repair.patch.text,
        summary: repair.patch.summary ?? ['已从 patch.json 转换'],
        warnings: repair.patch.warnings ?? repair.warnings,
        skillSource: skillSourcePath,
      }
      writeResultJson(jobDir, result)
    }
  }

  const debugInfo: HumanizerJobDebugInfo = {
    jobDir,
    skillSourcePath,
    skillSourceExists: fs.existsSync(skillSourcePath),
    skillSourceSha256: sha256File(skillSourcePath),
    opencodeCommand: run.opencodeCommand,
    opencodeArgs: run.opencodeArgs,
    cwd: jobDir,
    resultPath,
    resultExists: fs.existsSync(resultPath),
    usedFallback: false,
    materializedSkillPath: path.join(jobDir, 'audit', 'humanizer', 'SKILL.md'),
    selectionPath: path.join(jobDir, 'input', 'selection.json'),
    documentContextPath: path.join(jobDir, 'input', 'document-context.json'),
    stdoutLogPath: path.join(jobDir, 'logs', 'stdout.log'),
    stderrLogPath: path.join(jobDir, 'logs', 'stderr.log'),
    patchJsonPath: path.join(jobDir, 'output', 'patch.json'),
    patchJsonExists: fs.existsSync(path.join(jobDir, 'output', 'patch.json')),
    opencodeExitOk: run.success,
    fallbackReason: run.error,
    repaired,
    repairReason,
  }
  record.debugPath = writeHumanizerJobDebug(jobDir, debugInfo)
  record.repaired = repaired
  record.repairReason = repairReason

  const validOpencode = isValidOpencodeHumanizerResult(result, skillSourcePath) && run.success && !repaired

  if (validOpencode && result) {
    record.status = 'succeeded'
    record.source = 'opencode-humanizer'
    record.skillSource = skillSourcePath
    record.usedFallback = false
    record.humanizedText = result.text
    record.fallbackReason = undefined
    saveJobMeta(record)
    return
  }

  if (!run.success || run.skillNotInstalled) {
    try {
      const fallback = await runQuickHumanize(originalText, record.options)
      writeResultJson(jobDir, { ...fallback, skillSource: undefined })
      record.status = 'succeeded'
      record.source = 'direct-llm'
      record.usedFallback = true
      record.fallbackReason = run.error || 'OpenCode humanizer 未完成'
      record.humanizedText = fallback.text
      record.skillSource = undefined
      debugInfo.usedFallback = true
      writeHumanizerJobDebug(jobDir, debugInfo)
    } catch (err) {
      record.status = 'failed'
      record.error =
        run.error ||
        (err instanceof Error ? err.message : String(err)) ||
        'OpenCode humanizer 失败且备用通道不可用'
      record.usedFallback = true
      record.fallbackReason = record.error
    }
    saveJobMeta(record)
    return
  }

  record.status = 'failed'
  record.error = repaired
    ? `OpenCode 已完成但 result.json 无效（${repairReason}）`
    : 'OpenCode 已完成但未生成有效的 output/result.json（缺少正确 skillSource）'
  record.source = 'opencode-humanizer'
  record.usedFallback = false
  saveJobMeta(record)
}

export async function createHumanizeJob(input: CreateHumanizeJobInput): Promise<HumanizeJobRecord> {
  const now = new Date().toISOString()
  const jobId = newHumanizeJobId()
  const originalText = await resolveOriginalText(input, jobId)
  const record: HumanizeJobRecord = {
    jobId,
    userId: input.userId,
    inputMode: input.inputMode,
    documentId: input.documentId,
    options: {
      strength: input.options.strength === 'quick' ? 'quick' : 'deep',
      tone: input.options.tone || 'natural',
      preserveMeaning: input.options.preserveMeaning !== false,
      preserveTerms: Array.isArray(input.options.preserveTerms) ? input.options.preserveTerms : [],
      language: input.options.language || 'auto',
    },
    status: 'queued',
    usedFallback: false,
    originalText,
    createdAt: now,
    updatedAt: now,
  }
  saveJobMeta(record)
  void processHumanizeJobAsync(record, originalText).catch(err => {
    record.status = 'failed'
    record.error = err instanceof Error ? err.message : String(err)
    record.usedFallback = true
    record.fallbackReason = record.error
    saveJobMeta(record)
  })
  return record
}

export function humanizeJobToApiResponse(record: HumanizeJobRecord): Record<string, unknown> {
  const original = record.originalText || ''
  const humanized = record.humanizedText || ''
  const changeRatio = computeChangeRatio(original, humanized)
  const jobDir = record.opencodeJobDir || path.join(DOCUMENT_STUDIO_JOB_ROOT, record.jobId)
  let skillSource = record.skillSource
  let repaired = record.repaired
  const debugFile = path.join(jobDir, 'logs', 'debug.json')
  if (fs.existsSync(debugFile)) {
    try {
      const dbg = JSON.parse(fs.readFileSync(debugFile, 'utf-8')) as HumanizerJobDebugInfo
      if (!skillSource && dbg.skillSourcePath) skillSource = dbg.skillSourcePath
      if (repaired === undefined && dbg.repaired !== undefined) repaired = dbg.repaired
    } catch {
      // ignore
    }
  }
  const resultJson = readResultJson(jobDir)
  if (!skillSource && resultJson?.skillSource) skillSource = resultJson.skillSource

  return {
    success: record.status !== 'failed',
    status: record.status,
    jobId: record.jobId,
    source: record.source || null,
    skillSource: skillSource || null,
    channel: mapChannelLabel(record),
    usedFallback: record.usedFallback,
    fallbackReason: record.fallbackReason || null,
    repaired: repaired ?? false,
    repairReason: record.repairReason || null,
    originalText: original,
    humanizedText: humanized,
    error: record.error || null,
    debugPath: record.debugPath || null,
    opencodeJobDir: jobDir,
    originalLength: original.length,
    humanizedLength: humanized.length,
    changeRatio,
    detectedLanguage: detectLanguageLabel(original),
    outputLanguage: detectLanguageLabel(humanized),
    result:
      record.humanizedText && record.status === 'succeeded'
        ? {
            type: 'humanized_text',
            text: record.humanizedText,
            summary: resultJson?.summary ?? ['已完成降重'],
            warnings: resultJson?.warnings ?? [],
            skillSource: skillSource ?? resultJson?.skillSource ?? null,
          }
        : null,
  }
}
