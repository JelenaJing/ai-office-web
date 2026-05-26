import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { spawn } from 'child_process'
import { invokeLlmText, invokeLlmTextStream, isLlmConfigured, type LlmMessage } from '../../../modules/ai-gateway'

const OPENCODE_BIN = '/data/darebug/tools/bin/opencode'
const OPENCODE_TIMEOUT_MS = 90_000
const WEBDOC_SKILL_ID = 'html-webdoc'
const AIOS_SKILLS_ROOT = '/data/darebug/aios-skills'
const WEBDOC_JOB_ROOT = '/data/darebug/aios-agent-jobs'

const BUNDLED_SKILL_DIR = path.join(__dirname, '../skills/html-webdoc')

export const WEBDOC_TOOL_IDS = [
  'chat',
  'rewrite_selection',
  'expand_selection',
  'polish_selection',
  'continue_writing',
  'add_citation',
  'generate_document',
] as const

export type WebDocToolId = (typeof WEBDOC_TOOL_IDS)[number]

export interface WebDocPatchJson {
  type: string
  blockId?: string
  replacementText?: string
  selectedText?: string
  html?: string
  text?: string
}

export interface WebDocChatTurn {
  role: 'user' | 'assistant'
  text: string
}

export interface WebDocInvokeInput {
  tool: WebDocToolId
  instruction: string
  title?: string
  html: string
  selectedText?: string
  selectedBlockId?: string | null
  selectedSectionId?: string | null
  chatHistory?: WebDocChatTurn[]
}

export interface WebDocInvokeResult {
  success: boolean
  assistantMessage: string
  patch?: WebDocPatchJson | null
  source: 'opencode' | 'llm-fallback'
  error?: string
}

function safeSegment(value: string, maxLen = 96): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, maxLen)
}

function ensureWithinBaseDir(baseDir: string, targetDir: string): string {
  fs.mkdirSync(baseDir, { recursive: true })
  fs.mkdirSync(targetDir, { recursive: true })
  const realBaseDir = fs.realpathSync(baseDir)
  const realTargetDir = fs.realpathSync(targetDir)
  if (realTargetDir !== realBaseDir && !realTargetDir.startsWith(`${realBaseDir}${path.sep}`)) {
    throw new Error(`路径越界：${realTargetDir}`)
  }
  return realTargetDir
}

function copyDirRecursive(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath)
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

function resolveSkillDir(): string {
  const fromAios = path.join(AIOS_SKILLS_ROOT, WEBDOC_SKILL_ID)
  if (fs.existsSync(path.join(fromAios, 'SKILL.md'))) {
    return fromAios
  }
  if (fs.existsSync(path.join(BUNDLED_SKILL_DIR, 'SKILL.md'))) {
    return BUNDLED_SKILL_DIR
  }
  throw new Error(`未找到 ${WEBDOC_SKILL_ID} 技能目录`)
}

function buildOpenCodePrompt(tool: WebDocToolId, instruction: string, historyCount: number): string {
  return [
    '请严格执行 html-webdoc 技能：',
    '1. 阅读 input/context.json（含 chatHistory 对话上下文）与 input/source.html。',
    '2. 按 context.json 中的 tool 语义处理用户 instruction；需结合历史对话理解指代。',
    '3. 将完整结果写入 output/response.json（JSON，UTF-8）。',
    '4. 不要只在终端回复；必须落盘 output/response.json。',
    '',
    `当前 tool: ${tool}`,
    `对话轮数: ${historyCount}`,
    `用户 instruction: ${instruction}`,
  ].join('\n')
}

function parseResponseJson(raw: string): WebDocInvokeResult | null {
  try {
    const parsed = JSON.parse(raw) as {
      assistantMessage?: string
      patch?: WebDocPatchJson | null
    }
    if (!parsed || typeof parsed.assistantMessage !== 'string') return null
    return {
      success: true,
      assistantMessage: parsed.assistantMessage.trim(),
      patch: parsed.patch ?? null,
      source: 'opencode',
    }
  } catch {
    return null
  }
}

function extractJsonFromLlmText(text: string): WebDocInvokeResult | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = (fenced?.[1] || text).trim()
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  return parseResponseJson(candidate.slice(start, end + 1))
}

async function runLlmFallback(input: WebDocInvokeInput): Promise<WebDocInvokeResult> {
  if (!isLlmConfigured()) {
    return {
      success: false,
      assistantMessage: '当前未配置 LLM，且 OpenCode 不可用，无法处理请求。',
      source: 'llm-fallback',
      error: 'llm_not_configured',
    }
  }

  const raw = await invokeLlmText(
    buildLlmFallbackMessages(input),
    { temperature: 0.3, maxTokens: 4096, timeoutMs: 60_000 },
  )

  const parsed = extractJsonFromLlmText(raw)
  if (parsed) {
    return { ...parsed, source: 'llm-fallback' }
  }

  return {
    success: true,
    assistantMessage: raw.trim() || '已完成处理。',
    patch: null,
    source: 'llm-fallback',
  }
}

function prepareJobWorkspace(input: WebDocInvokeInput): {
  jobDir: string
  responsePath: string
  logPath: string
} {
  const jobId = `webdoc-${safeSegment(randomUUID())}`
  const jobDir = ensureWithinBaseDir(WEBDOC_JOB_ROOT, path.join(WEBDOC_JOB_ROOT, jobId))
  const inputDir = path.join(jobDir, 'input')
  const skillDir = path.join(jobDir, 'skill')
  const outputDir = path.join(jobDir, 'output')
  const logsDir = path.join(jobDir, 'logs')
  fs.mkdirSync(inputDir, { recursive: true })
  fs.mkdirSync(skillDir, { recursive: true })
  fs.mkdirSync(outputDir, { recursive: true })
  fs.mkdirSync(logsDir, { recursive: true })

  fs.writeFileSync(path.join(inputDir, 'source.html'), input.html, 'utf-8')
  fs.writeFileSync(
    path.join(inputDir, 'context.json'),
    JSON.stringify(
      {
        tool: input.tool,
        instruction: input.instruction,
        title: input.title || '',
        selectedText: input.selectedText || '',
        selectedBlockId: input.selectedBlockId || null,
        selectedSectionId: input.selectedSectionId || null,
        chatHistory: (input.chatHistory || []).slice(-20),
      },
      null,
      2,
    ),
    'utf-8',
  )

  copyDirRecursive(resolveSkillDir(), skillDir)

  return {
    jobDir,
    responsePath: path.join(outputDir, 'response.json'),
    logPath: path.join(logsDir, 'opencode.log'),
  }
}

function runOpenCode(jobDir: string, responsePath: string, logPath: string, prompt: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(OPENCODE_BIN)) {
      reject(new Error(`未找到 OpenCode：${OPENCODE_BIN}`))
      return
    }

    const attachments = [
      path.join(jobDir, 'input', 'context.json'),
      path.join(jobDir, 'input', 'source.html'),
      path.join(jobDir, 'skill', 'SKILL.md'),
    ].filter((filePath) => fs.existsSync(filePath))

    const args = ['run', '--pure', '--dir', jobDir]
    for (const attachment of attachments) {
      args.push('-f', attachment)
    }
    args.push('--', prompt)

    fs.writeFileSync(logPath, `[${new Date().toISOString()}] opencode start\n`, 'utf-8')

    const child = spawn(OPENCODE_BIN, args, {
      cwd: jobDir,
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let finished = false
    let timedOut = false

    const settle = (callback: () => void) => {
      if (finished) return
      finished = true
      callback()
    }

    const timeout = setTimeout(() => {
      timedOut = true
      fs.appendFileSync(logPath, `\n[${new Date().toISOString()}] timeout\n`, 'utf-8')
      child.kill('SIGTERM')
      setTimeout(() => {
        if (!finished) child.kill('SIGKILL')
      }, 5_000).unref()
    }, OPENCODE_TIMEOUT_MS)

    const writeChunk = (chunk: Buffer | string) => {
      fs.appendFileSync(logPath, typeof chunk === 'string' ? chunk : chunk.toString('utf-8'))
    }

    child.stdout.on('data', writeChunk)
    child.stderr.on('data', writeChunk)

    child.on('error', (error) => {
      clearTimeout(timeout)
      settle(() => reject(error))
    })

    child.on('close', (code) => {
      clearTimeout(timeout)
      if (timedOut) {
        settle(() => reject(new Error('OpenCode 执行超时')))
        return
      }
      if (code !== 0) {
        settle(() => reject(new Error(`OpenCode 退出码 ${code ?? 'null'}`)))
        return
      }
      if (!fs.existsSync(responsePath)) {
        settle(() => reject(new Error('OpenCode 未生成 output/response.json')))
        return
      }
      settle(resolve)
    })
  })
}

export function listWebDocTools(): Array<{ id: WebDocToolId; label: string; description: string; needsSelection: boolean }> {
  return [
    { id: 'rewrite_selection', label: '重写选区', description: '改写选中文字', needsSelection: true },
    { id: 'expand_selection', label: '扩写选区', description: '丰富选中内容', needsSelection: true },
    { id: 'polish_selection', label: '润色选区', description: '改为正式文风', needsSelection: true },
    { id: 'continue_writing', label: 'AI 续写', description: '在光标处续写', needsSelection: false },
    { id: 'add_citation', label: '添加引用', description: '插入引用占位', needsSelection: false },
    { id: 'generate_document', label: '生成全文', description: '按主题生成文稿', needsSelection: false },
    { id: 'chat', label: '对话', description: '自由描述修改需求', needsSelection: false },
  ]
}

function buildLlmFallbackMessages(input: WebDocInvokeInput): LlmMessage[] {
  const system = [
    '你是 AI Office HTML 文稿助手。只输出 JSON，不要其他文字。',
    '格式：{"assistantMessage":"简短说明（一两句话）","patch":补丁对象或null}',
    '补丁类型：replace_block_text | replace_selection | insert_at_cursor | replace_document',
    '当用户要求撰写、生成、续写、改写正文时，必须把正文写入 patch，不能只写在 assistantMessage。',
    '生成/改写全文时用 replace_document，html 字段为完整 article；局部修改用 replace_selection 或 insert_at_cursor。',
    'insert_at_cursor 的 html 可含 <figure><img src="..." alt="..."/><figcaption>图注</figcaption></figure>。',
    'assistantMessage 仅用于简短状态说明，不要重复整篇正文。',
    '不要编造事实与数据。',
  ].join('\n')

  const history = (input.chatHistory || []).slice(-20)
  const historyMessages = history.map((turn) => ({
    role: turn.role,
    content: turn.text.slice(0, 4000),
  }))

  const user = [
    `tool: ${input.tool}`,
    `instruction: ${input.instruction}`,
    `title: ${input.title || '未命名文稿'}`,
    `selectedBlockId: ${input.selectedBlockId || ''}`,
    `selectedText: ${input.selectedText || ''}`,
    '--- HTML ---',
    input.html.slice(0, 120_000),
  ].join('\n')

  return [
    { role: 'system', content: system },
    ...historyMessages,
    { role: 'user', content: user },
  ]
}

/** 对话快速路径：直接 LLM 流式，跳过 OpenCode 以降低首字延迟。 */
export async function streamWebDocChatLlm(
  input: WebDocInvokeInput,
  onDelta: (text: string) => void,
): Promise<WebDocInvokeResult> {
  const instruction = input.instruction.trim()
  if (!instruction) {
    return {
      success: false,
      assistantMessage: '请输入修改说明。',
      source: 'llm-fallback',
      error: 'empty_instruction',
    }
  }

  if (!isLlmConfigured()) {
    return {
      success: false,
      assistantMessage: '当前未配置 LLM，无法处理请求。',
      source: 'llm-fallback',
      error: 'llm_not_configured',
    }
  }

  const raw = await invokeLlmTextStream(
    buildLlmFallbackMessages({ ...input, tool: input.tool || 'chat' }),
    onDelta,
    { temperature: 0.3, maxTokens: 4096, timeoutMs: 60_000 },
  )

  const parsed = extractJsonFromLlmText(raw)
  if (parsed) {
    return { ...parsed, source: 'llm-fallback' }
  }

  return {
    success: true,
    assistantMessage: raw.trim() || '已完成处理。',
    patch: null,
    source: 'llm-fallback',
  }
}

export async function invokeWebDocOpenCode(input: WebDocInvokeInput): Promise<WebDocInvokeResult> {
  const instruction = input.instruction.trim()
  if (!instruction) {
    return {
      success: false,
      assistantMessage: '请输入修改说明。',
      source: 'llm-fallback',
      error: 'empty_instruction',
    }
  }

  if (!input.html.trim()) {
    return {
      success: false,
      assistantMessage: '文稿内容为空，请先在编辑区输入文字。',
      source: 'llm-fallback',
      error: 'empty_html',
    }
  }

  const selectionTools: WebDocToolId[] = ['rewrite_selection', 'expand_selection', 'polish_selection']
  if (selectionTools.includes(input.tool) && !input.selectedText?.trim()) {
    return {
      success: false,
      assistantMessage: '请先在正文中选中要处理的文字。',
      source: 'llm-fallback',
      error: 'missing_selection',
    }
  }

  const { jobDir, responsePath, logPath } = prepareJobWorkspace(input)
  const prompt = buildOpenCodePrompt(input.tool, instruction, (input.chatHistory || []).length)

  try {
    await runOpenCode(jobDir, responsePath, logPath, prompt)
    const raw = fs.readFileSync(responsePath, 'utf-8')
    const parsed = parseResponseJson(raw)
    if (parsed) return parsed
    return {
      success: false,
      assistantMessage: 'OpenCode 返回格式无效，已尝试回退。',
      source: 'opencode',
      error: 'invalid_response_json',
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn('[webdoc/opencode]', message)
    const fallback = await runLlmFallback(input)
    if (fallback.success) {
      return {
        ...fallback,
        assistantMessage: `${fallback.assistantMessage}\n\n_(OpenCode 未可用：${message}，已使用 LLM 回退)_`,
      }
    }
    return {
      success: false,
      assistantMessage: `处理失败：${message}`,
      source: 'llm-fallback',
      error: message,
    }
  }
}
