import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import type { ArtifactJobRecord } from './artifactJobStore'
import { createHtmlArtifact } from './htmlArtifactStore'
import { registerUserFile } from '../../../lib/userFiles'
import { bootstrapWorkspaceForUser } from '../../../lib/workspaceAccess'

export const ARTIFACT_JOB_ROOT = '/data/darebug/aios-agent-jobs'
export const AIOS_SKILLS_ROOT = '/data/darebug/aios-skills'

const OPENCODE_BIN = '/data/darebug/tools/bin/opencode'
const OPENCODE_TIMEOUT_MS = 120_000
const HTML_PPT_BEAUTIFUL_SKILL_ID = 'html-ppt-beautiful'
const MAX_SKILL_TEXT_FILE_BYTES = 40 * 1024
const MAX_SKILL_TOTAL_TARGET_BYTES = 150 * 1024
const MAX_SKILL_TOTAL_HARD_LIMIT_BYTES = 200 * 1024
const OPENCODE_LOG_TAIL_LINES = 80
const OUTPUT_FALLBACK_CANDIDATES = [
  'index.html',
  'presentation.html',
  'slides.html',
  'output.html',
  path.join('output', 'presentation.html'),
  path.join('output', 'slides.html'),
  path.join('output', 'output.html'),
]

const DEFAULT_HTML_SKILL = `你是 AIOS 的 HTML Artifact 生成器。
请根据 input/source.md 和用户 prompt 生成一个正式、简洁、适合高校/企业办公场景的单文件 HTML 页面。
要求：
- 必须输出到 output/index.html
- 必须是完整 HTML 文件
- CSS 必须内联
- 不要引用外部 CDN
- 不要安装依赖
- 不要访问网络
- 不要写危险脚本
- 页面适合 iframe 预览
- 视觉风格正式、清晰、现代
`

const HTML_PPT_BEAUTIFUL_LITE_SKILL = `你是 AIOS 的 HTML 演示文稿生成器。
请只根据以下轻量上下文生成单文件 HTML PPT：
- input/source.md
- skill/SKILL.md
- skill/TEMPLATE_STYLE.md
- skill/frontend-slides-lite/*

必须遵守：
- 只输出完整 HTML 到 output/index.html
- 单文件 HTML，内联 CSS，可选少量内联 JS
- 16:9 横向演示文稿，7-10 页
- 每页信息密度适中，重点明确，不要堆满文字
- 不要访问网络，不要安装依赖，不要引用外部 CDN
- 不要读取 beautiful-html-templates/templates
- 不要读取任何 template.html
- 不存在额外的 style markdown 或 template markdown；不要尝试读取 product-keynote-lite.md 之类的文件
- 不要只在回复中输出 HTML，必须写入 output/index.html
`

interface SkillTextFileSummary {
  relativePath: string
  sizeBytes: number
  originalSizeBytes: number
  truncated: boolean
}

interface HtmlPptStyleProfile {
  styleId: string
  reason: string
  inspirationTemplates: string[]
  visualDirection: string[]
  layoutRequirements: string[]
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

function appendLog(logPath: string, content: string): void {
  fs.appendFileSync(logPath, content, 'utf-8')
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

function validateAndResolveSkillDir(skillId: string): string {
  const safe = skillId.replace(/[^a-zA-Z0-9_-]/g, '_')
  const candidate = path.join(AIOS_SKILLS_ROOT, safe)
  const metaPath = path.join(candidate, 'metadata.json')
  if (!fs.existsSync(metaPath)) {
    throw new Error(`Skill ${skillId} not found`)
  }
  fs.mkdirSync(AIOS_SKILLS_ROOT, { recursive: true })
  const realSkillsRoot = fs.realpathSync(AIOS_SKILLS_ROOT)
  const realSkillDir = fs.realpathSync(candidate)
  if (!realSkillDir.startsWith(`${realSkillsRoot}${path.sep}`)) {
    throw new Error(`路径越界：${realSkillDir}`)
  }
  return realSkillDir
}

function buildDefaultOpenCodePrompt(userPrompt: string): string {
  return [
    '请严格执行以下任务：',
    '1. 阅读并遵循 skill/SKILL.md。',
    '2. 阅读 input/source.md。',
    '3. 结合用户 prompt 生成单文件 HTML。',
    '4. 只能在当前任务目录内工作，禁止访问父目录，禁止访问任何 AI Office 源码目录。',
    '5. 禁止访问网络，禁止安装依赖，禁止执行危险脚本或危险命令。',
    '6. 最终必须把完整 HTML 写入 output/index.html。',
    '',
    '用户 prompt：',
    userPrompt,
  ].join('\n')
}

function buildHtmlPptLiteOpenCodePrompt(userPrompt: string, repairOnly = false): string {
  const repairLines = repairOnly
    ? [
      '你正在执行一次仅修复输出路径的重试。',
      '不要重新扩写内容，不要增加页数。',
      '如果当前目录已有 index.html、presentation.html、slides.html 或 output.html，只需整理为 output/index.html。',
    ]
    : [
      '生成目标为正式、现代、可汇报的 HTML 演示文稿。',
      '控制在 7-10 页，HTML 总体尽量约 80KB-200KB。',
      '不要生成超长 JS，不要内联超大 base64 资源。',
    ]

  return [
    '请严格执行以下任务：',
    '1. 只允许读取 input/source.md、skill/SKILL.md、skill/TEMPLATE_STYLE.md。',
    '2. 如需参考版式，只允许读取 skill/frontend-slides-lite/viewport-base.css、skill/frontend-slides-lite/html-template.md、skill/frontend-slides-lite/animation-patterns.md、skill/frontend-slides-lite/STYLE_PRESETS.md。',
    '3. 不要扫描 skill/vendors，不要读取 beautiful-html-templates/templates，不要读取任何 template.html。',
    '3.1 不存在额外的模板 markdown 文件；不要猜测或尝试读取 product-keynote-lite.md、academic-report-lite.md 之类的文件。',
    '4. 不要读取 job 目录之外的文件，不要访问网络，不要安装依赖。',
    '5. 生成单文件 HTML PPT，适合 iframe sandbox 预览，必须是 16:9 横向页面。',
    '6. 必须把完整结果写入 output/index.html。',
    '7. 不要只在回复中输出 HTML。',
    '8. 不要输出到 index.html、presentation.html、slides.html、output.html；如果误写到这些名字，结束前必须复制为 output/index.html。',
    ...repairLines,
    '',
    '用户 prompt：',
    userPrompt,
  ].join('\n')
}

function buildOpenCodePrompt(job: ArtifactJobRecord, repairOnly = false): string {
  if (job.skillId === HTML_PPT_BEAUTIFUL_SKILL_ID) {
    return buildHtmlPptLiteOpenCodePrompt(job.prompt, repairOnly)
  }
  return buildDefaultOpenCodePrompt(job.prompt)
}

function titleFromPrompt(prompt: string): string {
  const normalized = prompt.replace(/\s+/g, ' ').trim()
  if (!normalized) return 'HTML Artifact'
  return normalized.slice(0, 48)
}

function sanitizeFileStem(title: string): string {
  const stem = title.replace(/[/\\?%*:|"<>]/g, '-').trim()
  return stem || '演示文稿'
}

function ensureRegularFile(filePath: string): boolean {
  if (!fs.existsSync(filePath)) return false
  const stat = fs.lstatSync(filePath)
  return stat.isFile() && !stat.isSymbolicLink()
}

function ensureOutputFile(outputPath: string): void {
  if (!ensureRegularFile(outputPath)) {
    throw new Error('OpenCode did not generate output/index.html')
  }
}

function utf8ByteLength(value: string): number {
  return Buffer.byteLength(value, 'utf-8')
}

function writeTextFileWithLimit(filePath: string, content: string, maxBytes: number): SkillTextFileSummary {
  let nextContent = content
  let truncated = false
  const originalSizeBytes = utf8ByteLength(content)
  if (originalSizeBytes > maxBytes) {
    const suffix = '\n\n[Truncated by AIOS skill workspace limiter]\n'
    const allowedBytes = Math.max(0, maxBytes - utf8ByteLength(suffix))
    nextContent = Buffer.from(content, 'utf-8').subarray(0, allowedBytes).toString('utf-8') + suffix
    truncated = true
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, nextContent, 'utf-8')
  return {
    relativePath: '',
    sizeBytes: utf8ByteLength(nextContent),
    originalSizeBytes,
    truncated,
  }
}

function copyTextFileWithLimit(sourcePath: string, targetPath: string, maxBytes: number): SkillTextFileSummary {
  const content = fs.readFileSync(sourcePath, 'utf-8')
  return writeTextFileWithLimit(targetPath, content, maxBytes)
}

function chooseHtmlPptStyle(prompt: string, inputMarkdown: string): HtmlPptStyleProfile {
  const combined = `${prompt}\n${inputMarkdown}`.toLowerCase()
  const businessKeywords = ['产品', '发布会', '商业', '路演', '企业', 'aios', '平台', 'product', 'launch', 'business', 'enterprise', 'tech', 'keynote', 'startup']
  const academicKeywords = ['学校', '高校', '科研', '教育', 'academic', 'education', 'research', 'report', 'university']

  if (businessKeywords.some((keyword) => combined.includes(keyword))) {
    return {
      styleId: 'product-keynote-lite',
      reason: '用户主题更接近产品发布 / 商业汇报 / 科技平台场景，适合高层级、强对比、重点突出的产品 keynote 风格。',
      inspirationTemplates: ['blue-professional', 'signal', 'raw-grid'],
      visualDirection: [
        '16:9 横向演示文稿，科技感或高对比商务风',
        '大标题、强层级、少文字、每页一个重点',
        '使用卡片、数字指标、流程线、路线图表达关键信息',
        '避免默认 AI 紫色渐变和普通白底卡片堆砌',
      ],
      layoutRequirements: [
        'cover slide',
        'problem slide',
        'solution slide',
        'architecture slide',
        'capability slide',
        'roadmap slide',
        'closing slide',
      ],
    }
  }

  if (academicKeywords.some((keyword) => combined.includes(keyword))) {
    return {
      styleId: 'academic-report-lite',
      reason: '用户主题更接近学校 / 高校 / 科研 / 教育场景，适合克制、清晰、研究报告式的学术汇报风格。',
      inspirationTemplates: ['vellum', 'cobalt-grid', 'cartesian'],
      visualDirection: [
        '16:9 横向演示文稿，浅色底或中性色研究报告风',
        '强调标题层级、数据结论、图表占位和逻辑顺序',
        '使用分节标题、结论框、方法流程、研究发现摘要',
        '避免娱乐化排版、炫技动效和过重装饰',
      ],
      layoutRequirements: [
        'cover slide',
        'background slide',
        'method or context slide',
        'findings slide',
        'analysis slide',
        'recommendation slide',
        'closing slide',
      ],
    }
  }

  return {
    styleId: 'product-keynote-lite',
    reason: '未识别到明确行业关键词，默认使用稳定的 product keynote 风格，优先保证正式场合可读性与演示效果。',
    inspirationTemplates: ['blue-professional', 'signal', 'emerald-editorial'],
    visualDirection: [
      '16:9 横向演示文稿，现代、正式、简洁',
      '大标题 + 摘要要点 + 模块化信息卡片',
      '重点页使用数字指标、流程图、对比块和路线图',
      '避免默认 AI 紫色渐变和普通白底卡片堆砌',
    ],
    layoutRequirements: [
      'cover slide',
      'problem slide',
      'solution slide',
      'architecture slide',
      'capability slide',
      'roadmap slide',
      'closing slide',
    ],
  }
}

function buildTemplateStyleMarkdown(selection: HtmlPptStyleProfile): string {
  return [
    '# Selected Template Style',
    '',
    `templateId: ${selection.styleId}`,
    `reason: ${selection.reason}`,
    `inspirationTemplates: ${selection.inspirationTemplates.join(', ')}`,
    '',
    '## Visual Direction',
    ...selection.visualDirection.map((item) => `- ${item}`),
    '',
    '## Layout Requirements',
    ...selection.layoutRequirements.map((item) => `- ${item}`),
    '',
    '## Constraints',
    '- 单文件 HTML',
    '- 内联 CSS',
    '- 可在 iframe sandbox 预览',
    '- 不使用外部 CDN',
    '- 不访问网络',
    '- 不安装依赖',
    '- 不读取任何 template.html',
    '- 只输出到 output/index.html',
  ].join('\n')
}

function formatSkillPrepareLog(
  files: SkillTextFileSummary[],
  totalTextBytes: number,
  selection: HtmlPptStyleProfile,
): string {
  const lines = [
    `selectedStyleId: ${selection.styleId}`,
    `selectedStyleReason: ${selection.reason}`,
    `inspirationTemplates: ${selection.inspirationTemplates.join(', ')}`,
    'templateHtmlSkipped: true',
    `targetTotalTextLimitBytes: ${MAX_SKILL_TOTAL_TARGET_BYTES}`,
    `hardTotalTextLimitBytes: ${MAX_SKILL_TOTAL_HARD_LIMIT_BYTES}`,
    `totalCopiedTextBytes: ${totalTextBytes}`,
    'copiedSkillFiles:',
    ...files.map((file) => {
      const suffix = file.truncated ? ' (truncated)' : ''
      return `- ${file.relativePath}: ${file.sizeBytes} bytes (original ${file.originalSizeBytes})${suffix}`
    }),
  ]
  if (totalTextBytes > MAX_SKILL_TOTAL_TARGET_BYTES) {
    lines.push('warning: total skill text size exceeded preferred 150KB target')
  }
  if (totalTextBytes > MAX_SKILL_TOTAL_HARD_LIMIT_BYTES) {
    lines.push('error: skill workspace exceeded hard 200KB limit')
  }
  return `${lines.join('\n')}\n`
}

function addRelativePath(summary: SkillTextFileSummary, relativePath: string): SkillTextFileSummary {
  return { ...summary, relativePath }
}

function prepareHtmlPptBeautifulLiteSkillWorkspace(input: {
  jobDir: string
  inputMarkdown: string
  prompt: string
  sourceSkillDir: string
  skillDir: string
  skillPrepareLogPath: string
}): void {
  const frontendSlidesSourceDir = path.join(input.sourceSkillDir, 'vendors', 'frontend-slides')
  const frontendSlidesLiteDir = path.join(input.skillDir, 'frontend-slides-lite')
  const selection = chooseHtmlPptStyle(input.prompt, input.inputMarkdown)
  const files: SkillTextFileSummary[] = []

  fs.rmSync(input.skillDir, { recursive: true, force: true })
  fs.mkdirSync(frontendSlidesLiteDir, { recursive: true })

  files.push(addRelativePath(
    writeTextFileWithLimit(path.join(input.skillDir, 'SKILL.md'), HTML_PPT_BEAUTIFUL_LITE_SKILL, MAX_SKILL_TEXT_FILE_BYTES),
    'SKILL.md',
  ))
  files.push(addRelativePath(
    writeTextFileWithLimit(
      path.join(input.skillDir, 'TEMPLATE_STYLE.md'),
      buildTemplateStyleMarkdown(selection),
      MAX_SKILL_TEXT_FILE_BYTES,
    ),
    'TEMPLATE_STYLE.md',
  ))

  const liteFiles = [
    'viewport-base.css',
    'html-template.md',
    'animation-patterns.md',
    'STYLE_PRESETS.md',
  ] as const

  for (const filename of liteFiles) {
    const sourcePath = path.join(frontendSlidesSourceDir, filename)
    const targetPath = path.join(frontendSlidesLiteDir, filename)
    files.push(addRelativePath(
      copyTextFileWithLimit(sourcePath, targetPath, MAX_SKILL_TEXT_FILE_BYTES),
      path.posix.join('frontend-slides-lite', filename),
    ))
  }

  const totalTextBytes = files.reduce((sum, file) => sum + file.sizeBytes, 0)
  const skillPrepareLog = formatSkillPrepareLog(files, totalTextBytes, selection)
  fs.mkdirSync(path.dirname(input.skillPrepareLogPath), { recursive: true })
  fs.writeFileSync(input.skillPrepareLogPath, skillPrepareLog, 'utf-8')

  if (totalTextBytes > MAX_SKILL_TOTAL_HARD_LIMIT_BYTES) {
    throw new Error('Skill workspace too large for OpenCode context')
  }
}

function readLogTail(logPath: string, lineCount = OPENCODE_LOG_TAIL_LINES): string {
  if (!fs.existsSync(logPath)) return ''
  const lines = fs.readFileSync(logPath, 'utf-8').split(/\r?\n/)
  return lines.slice(-lineCount).join('\n').trim()
}

function isContextLimitError(...values: string[]): boolean {
  const text = values.join('\n').toLowerCase()
  return (
    text.includes('context length exceeded')
    || text.includes('model max context')
    || text.includes('requested a total of')
    || text.includes('input tokens:')
    || text.includes('max context')
    || text.includes('context window')
    || text.includes('too many tokens')
  )
}

function buildHtmlPptFailureMessage(job: ArtifactJobRecord, baseMessage: string): string {
  const skillPrepareLogPath = path.join(job.jobDir, 'logs', 'skill-prepare.log')
  const sections = [baseMessage]

  if (fs.existsSync(skillPrepareLogPath)) {
    sections.push(`skill-prepare.log:\n${fs.readFileSync(skillPrepareLogPath, 'utf-8').trim()}`)
  }

  const logTail = readLogTail(job.logPath, OPENCODE_LOG_TAIL_LINES)
  if (logTail) {
    sections.push(`opencode.log tail (${OPENCODE_LOG_TAIL_LINES} lines):\n${logTail}`)
  }

  return sections.join('\n\n')
}

function buildOpenCodeAttachments(job: ArtifactJobRecord): string[] {
  const attachments = [job.inputPath, job.skillPath]
  if (job.skillId === HTML_PPT_BEAUTIFUL_SKILL_ID) {
    const extraFiles = [
      path.join(job.jobDir, 'skill', 'TEMPLATE_STYLE.md'),
      path.join(job.jobDir, 'skill', 'frontend-slides-lite', 'viewport-base.css'),
      path.join(job.jobDir, 'skill', 'frontend-slides-lite', 'html-template.md'),
      path.join(job.jobDir, 'skill', 'frontend-slides-lite', 'animation-patterns.md'),
      path.join(job.jobDir, 'skill', 'frontend-slides-lite', 'STYLE_PRESETS.md'),
    ]
    for (const filePath of extraFiles) {
      if (ensureRegularFile(filePath)) attachments.push(filePath)
    }
  }
  return attachments
}

function tryMaterializeFallbackOutput(job: ArtifactJobRecord): boolean {
  if (ensureRegularFile(job.outputPath)) return true

  for (const candidate of OUTPUT_FALLBACK_CANDIDATES) {
    const candidatePath = path.join(job.jobDir, candidate)
    if (path.resolve(candidatePath) === path.resolve(job.outputPath)) continue
    if (!ensureRegularFile(candidatePath)) continue
    fs.mkdirSync(path.dirname(job.outputPath), { recursive: true })
    fs.copyFileSync(candidatePath, job.outputPath)
    appendLog(job.logPath, `\n[${new Date().toISOString()}] Recovered output/index.html from ${candidate}\n`)
    return true
  }

  return false
}

function runOpenCode(job: ArtifactJobRecord, repairOnly = false): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(OPENCODE_BIN)) {
      reject(new Error(`未找到 OpenCode 可执行文件：${OPENCODE_BIN}`))
      return
    }

    const attachments = buildOpenCodeAttachments(job)
    appendLog(
      job.logPath,
      `[${new Date().toISOString()}] Starting OpenCode in ${job.jobDir}${repairOnly ? ' (repair)' : ''}\n`
      + `[${new Date().toISOString()}] Attached files:\n${attachments.map((filePath) => `- ${path.relative(job.jobDir, filePath)}`).join('\n')}\n`,
    )

    const args = ['run', '--pure', '--dir', job.jobDir]
    for (const attachment of attachments) {
      args.push('-f', attachment)
    }
    args.push('--', buildOpenCodePrompt(job, repairOnly))

    const child = spawn(
      OPENCODE_BIN,
      args,
      {
        cwd: job.jobDir,
        env: { ...process.env },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    )

    let finished = false
    let timedOut = false

    const settle = (callback: () => void) => {
      if (finished) return
      finished = true
      callback()
    }

    const timeout = setTimeout(() => {
      timedOut = true
      appendLog(job.logPath, `\n[${new Date().toISOString()}] OpenCode timeout after 120 seconds\n`)
      child.kill('SIGTERM')
      setTimeout(() => {
        if (!finished) child.kill('SIGKILL')
      }, 5_000).unref()
    }, OPENCODE_TIMEOUT_MS)

    const writeChunk = (chunk: Buffer | string) => {
      appendLog(job.logPath, typeof chunk === 'string' ? chunk : chunk.toString('utf-8'))
    }

    child.stdout.on('data', writeChunk)
    child.stderr.on('data', writeChunk)

    child.on('error', (error) => {
      clearTimeout(timeout)
      settle(() => reject(error))
    })

    child.on('close', (code, signal) => {
      clearTimeout(timeout)
      if (timedOut) {
        settle(() => reject(new Error('OpenCode 执行超时（120 秒）')))
        return
      }
      if (code !== 0) {
        settle(() => reject(new Error(`OpenCode 执行失败（exit=${code ?? 'null'}, signal=${signal ?? 'none'}）`)))
        return
      }
      settle(resolve)
    })
  })
}

export function prepareArtifactJobWorkspace(input: {
  jobId: string
  inputMarkdown: string
  prompt: string
  skillId?: string
}): {
  jobDir: string
  inputPath: string
  skillPath: string
  outputPath: string
  logPath: string
  errorPath: string
} {
  const jobDir = ensureWithinBaseDir(ARTIFACT_JOB_ROOT, path.join(ARTIFACT_JOB_ROOT, safeSegment(input.jobId)))
  const inputDir = path.join(jobDir, 'input')
  const skillDir = path.join(jobDir, 'skill')
  const outputDir = path.join(jobDir, 'output')
  const logsDir = path.join(jobDir, 'logs')
  fs.mkdirSync(inputDir, { recursive: true })
  fs.mkdirSync(skillDir, { recursive: true })
  fs.mkdirSync(outputDir, { recursive: true })
  fs.mkdirSync(logsDir, { recursive: true })

  const inputPath = path.join(inputDir, 'source.md')
  const skillPath = path.join(skillDir, 'SKILL.md')
  const outputPath = path.join(outputDir, 'index.html')
  const logPath = path.join(logsDir, 'opencode.log')
  const errorPath = path.join(logsDir, 'error.txt')
  const skillPrepareLogPath = path.join(logsDir, 'skill-prepare.log')

  fs.writeFileSync(inputPath, input.inputMarkdown, 'utf-8')
  fs.writeFileSync(logPath, '', 'utf-8')
  fs.writeFileSync(skillPrepareLogPath, '', 'utf-8')
  if (fs.existsSync(errorPath)) {
    fs.rmSync(errorPath, { force: true })
  }

  if (input.skillId) {
    const sourceSkillDir = validateAndResolveSkillDir(input.skillId)
    if (input.skillId === HTML_PPT_BEAUTIFUL_SKILL_ID) {
      prepareHtmlPptBeautifulLiteSkillWorkspace({
        jobDir,
        inputMarkdown: input.inputMarkdown,
        prompt: input.prompt,
        sourceSkillDir,
        skillDir,
        skillPrepareLogPath,
      })
    } else {
      copyDirRecursive(sourceSkillDir, skillDir)
    }
  } else {
    fs.writeFileSync(skillPath, DEFAULT_HTML_SKILL, 'utf-8')
  }

  return {
    jobDir,
    inputPath,
    skillPath,
    outputPath,
    logPath,
    errorPath,
  }
}

export function recordArtifactJobFailure(job: ArtifactJobRecord, message: string): void {
  fs.writeFileSync(job.errorPath, `${message}\n`, 'utf-8')
  appendLog(job.logPath, `\n[${new Date().toISOString()}] ${message}\n`)
}

export async function runHtmlArtifactJob(job: ArtifactJobRecord): Promise<{
  artifactId: string
  artifactFileUrl: string
}> {
  try {
    await runOpenCode(job)
  } catch (error) {
    if (!tryMaterializeFallbackOutput(job)) {
      const message = error instanceof Error ? error.message : String(error)
      const detailedMessage = job.skillId === HTML_PPT_BEAUTIFUL_SKILL_ID
        ? buildHtmlPptFailureMessage(
          job,
          isContextLimitError(message, readLogTail(job.logPath))
            ? 'OpenCode context length exceeded'
            : message,
        )
        : message
      throw new Error(detailedMessage)
    }
  }

  if (!tryMaterializeFallbackOutput(job)) {
    const firstPassTail = readLogTail(job.logPath)
    if (job.skillId === HTML_PPT_BEAUTIFUL_SKILL_ID && isContextLimitError(firstPassTail)) {
      throw new Error(buildHtmlPptFailureMessage(job, 'OpenCode context length exceeded'))
    }

    appendLog(job.logPath, `\n[${new Date().toISOString()}] Missing output/index.html after first pass, retrying once with repair prompt\n`)
    await runOpenCode(job, true).catch((error) => {
      if (!tryMaterializeFallbackOutput(job)) {
        const message = error instanceof Error ? error.message : String(error)
        const detailedMessage = job.skillId === HTML_PPT_BEAUTIFUL_SKILL_ID
          ? buildHtmlPptFailureMessage(
            job,
            isContextLimitError(message, readLogTail(job.logPath))
              ? 'OpenCode context length exceeded'
              : message,
          )
          : message
        throw new Error(detailedMessage)
      }
    })
  }

  tryMaterializeFallbackOutput(job)
  ensureOutputFile(job.outputPath)

  const artifact = createHtmlArtifact({
    userId: job.userId,
    jobId: job.id,
    sourceFilePath: job.outputPath,
    title: titleFromPrompt(job.prompt),
    type: job.type,
  })

  try {
    const workspace = bootstrapWorkspaceForUser(job.userId)
    const stem = sanitizeFileStem(titleFromPrompt(job.prompt))
    const html = fs.readFileSync(job.outputPath)
    registerUserFile({
      userId: job.userId,
      workspacePath: workspace.currentWorkspacePath,
      filename: `${stem}.html`,
      content: html,
      generated: true,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`[html-artifact-mirror] failed for job ${job.id}: ${message}`)
  }

  return {
    artifactId: artifact.id,
    artifactFileUrl: `/api/artifacts/${artifact.id}/file`,
  }
}
