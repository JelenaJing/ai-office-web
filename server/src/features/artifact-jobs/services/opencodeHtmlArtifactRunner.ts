import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import {
  ArtifactJobCanceledError,
  assertArtifactJobNotCanceled,
  clearArtifactJobRuntime,
  getArtifactJob,
  isArtifactJobCanceledError,
  registerArtifactJobRuntime,
  updateArtifactJob,
  type ArtifactJobRecord,
} from './artifactJobStore'
import { createHtmlArtifact } from './htmlArtifactStore'
import { registerUserFile } from '../../../lib/userFiles'
import { bootstrapWorkspaceForUser } from '../../../lib/workspaceAccess'
import {
  postProcessHtmlPresentationOutput,
  type ContentModelBlock,
  type ContentModelRecord,
  type ContentModelSlide,
} from './htmlPresentationPostProcess'
import {
  fulfillPlannedImages,
  isHtmlPresentationImageProviderConfigured,
} from './htmlPresentationImagePersistence'
import {
  buildHighQualityOpenCodeAttachments,
  buildHighQualityOpenCodePrompt,
  HIGH_QUALITY_ORIGINAL_SKILL_DIRS,
  buildFastTemplateValidationRepairOpenCodeAttachments,
  buildFastTemplateValidationRepairOpenCodePrompt,
  prepareHighQualityOriginalSkillWorkspace,
  resolveHtmlPptSkillMode,
  validateOriginalSkillPaths,
} from './htmlPresentationHighQualitySkills'
import type { ArtifactJobSkillStats } from './artifactJobStore'
import {
  finalizeOpencodeTemplateDrivenJobOutput,
  renderHtmlPresentationFromContentModel,
} from './htmlPresentationRetemplateService'
import { validateFinalHtmlSlides, type RenderedSlidesValidationResult } from './htmlPresentationSlideValidation'
import { resolveTaskTimeoutMs } from '../../../lib/taskTimeouts'
import {
  appendArtifactJobLogLine,
  buildFastTimeoutFallbackWarning,
  buildHighQualityTimeoutFallbackWarning,
  logHtmlPptTimeoutConfig,
  OPENCODE_HEARTBEAT_INTERVAL_MS,
  patchArtifactJobProgress,
  resolveHtmlPptOpenCodeTimeoutMs,
  sanitizeOpenCodeOutputLine,
} from './artifactJobProgress'
import {
  buildCandidateTemplatesSidecar,
  resolveBeautifulTemplateFile,
  normalizeHtmlPresentationJobOptions,
  resolveTemplateSelection,
  type CandidateTemplateRecord,
  type HtmlPresentationJobOptions,
  type TemplateProfileRecord,
  type TemplateSelectionResult,
} from './htmlPresentationTemplates'
import { AIOS_JOBS_DIR } from '../../../config/runtimePaths'

export const ARTIFACT_JOB_ROOT = AIOS_JOBS_DIR
export const AIOS_SKILLS_ROOT = '/data/darebug/aios-skills'

const OPENCODE_BIN = '/data/darebug/tools/bin/opencode'
const HTML_PPT_TIMEOUT_MS = resolveTaskTimeoutMs('html_ppt')
const FINAL_CHECK_TIMEOUT_MS = 8_000
const PROCESS_KILL_GRACE_MS = 5_000
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
- skill/TEMPLATE_PROFILE.json
- skill/CANDIDATE_TEMPLATES.json
- skill/frontend-slides-lite/*

必须遵守：
- 只输出完整 HTML 到 output/index.html
- 单文件 HTML，内联 CSS，可选少量内联 JS
- 16:9 横向演示文稿，7-10 页
- 每页信息密度适中，重点明确，不要堆满文字
- 每一页必须使用 <section class="slide"> 作为 slide 根节点
- 尽量直接输出 data-slide-id、data-block-id、data-block-type、data-block-role；如果未输出，后处理层会补齐
- 最终结果需要兼容 output/content-model.json、output/template-profile.json、output/candidate-templates.json 作为 sidecar
- 如果启用了图片规划，优先保留图片槽位；图片失败时允许使用内联 SVG placeholder
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

type HtmlPptPreparedSelection = TemplateSelectionResult

interface OpenCodeTimeoutConfig {
  timeoutMs: number
  fallbackAfterMs: number
}

interface OpenCodeExecutionResult {
  timeoutMs: number
  fallbackAfterMs: number
  noOutputSoftTimeoutTriggered?: boolean
}

interface HtmlPresentationJobSummary {
  message?: string
  warning?: string
  fallbackUsed?: boolean
  fallbackRenderer?: string
  fallbackReason?: string
  opencodeTimedOut?: boolean
  timeoutMs?: number
  requestedTemplateSlug?: string
  selectedTemplateSlug?: string
  appliedTemplateSlug?: string | null
  selectedStyleId?: string
  rendererMode?: string
  templateStyleApplied?: 'full' | 'basic' | 'not-applied'
  repairAttempted?: boolean
  repairSucceeded?: boolean
}

type OpenCodeRunKind = 'generate' | 'repair-output-path' | 'fast-template-validation-repair'

interface OpenCodeRunOverrides {
  kind?: OpenCodeRunKind
  attachments?: string[]
  prompt?: string
  validationSummary?: string
}

export class OpenCodeTimeoutError extends Error {
  readonly code = 'OPENCODE_TIMEOUT'
  readonly timeoutMs: number

  constructor(timeoutMs: number) {
    super(`OpenCode 在 ${Math.round(timeoutMs / 1000)} 秒内未完成`)
    this.name = 'OpenCodeTimeoutError'
    this.timeoutMs = timeoutMs
  }
}

export class OpenCodeNoOutputTimeoutError extends Error {
  readonly code = 'OPENCODE_NO_OUTPUT_TIMEOUT'
  readonly timeoutMs: number

  constructor(timeoutMs: number) {
    super(`OpenCode 在 ${Math.round(timeoutMs / 1000)} 秒内未产出 output/index.html`)
    this.name = 'OpenCodeNoOutputTimeoutError'
    this.timeoutMs = timeoutMs
  }
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

function logHtmlArtifactTask(job: ArtifactJobRecord, patch: {
  status: string
  timeoutMs?: number
  startedAt?: string
  elapsedMs?: number
}): void {
  const parts = [
    `[html-artifact-job]`,
    `jobId=${job.id}`,
    `skillId=${job.skillId || ''}`,
    `status=${patch.status}`,
    `taskType=html_ppt`,
    `timeoutMs=${patch.timeoutMs ?? HTML_PPT_TIMEOUT_MS}`,
    `startedAt=${patch.startedAt || new Date(job.createdAt).toISOString()}`,
  ]
  if (typeof patch.elapsedMs === 'number') parts.push(`elapsedMs=${patch.elapsedMs}`)
  console.info(parts.join(' '))
}

function markJobPhase(jobId: string, phase: string, message: string): void {
  updateArtifactJob(jobId, { currentPhase: phase, message })
}

function markHtmlPptProgress(
  job: ArtifactJobRecord,
  stage: Parameters<typeof patchArtifactJobProgress>[1],
  label: string,
  options?: Parameters<typeof patchArtifactJobProgress>[3],
): void {
  patchArtifactJobProgress(job.id, stage, label, {
    ...options,
    currentPhase: options?.currentPhase ?? stage,
    message: options?.message ?? label,
    logLine: options?.logLine ?? `progress stage=${stage} label=${label}`,
  })
}

function markPartialOutput(job: ArtifactJobRecord): void {
  updateArtifactJob(job.id, { partialOutput: ensureRegularFile(job.outputPath) })
}

function getOpenCodeTimeoutConfig(job: ArtifactJobRecord): OpenCodeTimeoutConfig {
  const options = normalizeHtmlPresentationJobOptions(job.htmlPresentationOptions)
  const resolved = resolveHtmlPptOpenCodeTimeoutMs({ qualityMode: options.qualityMode })
  return {
    timeoutMs: resolved.timeoutMs,
    fallbackAfterMs: resolved.timeoutMs,
  }
}

function ignoreMissingProcessError(error: unknown): void {
  if (
    error
    && typeof error === 'object'
    && 'code' in error
    && (error as { code?: string }).code === 'ESRCH'
  ) {
    return
  }
  throw error
}

function killProcessTree(pid: number | undefined, reason: string): void {
  if (!pid || pid <= 0) return
  try {
    if (process.platform === 'linux') process.kill(-pid, 'SIGTERM')
    else process.kill(pid, 'SIGTERM')
  } catch (error) {
    ignoreMissingProcessError(error)
  }
  setTimeout(() => {
    try {
      if (process.platform === 'linux') process.kill(-pid, 'SIGKILL')
      else process.kill(pid, 'SIGKILL')
    } catch (error) {
      ignoreMissingProcessError(error)
    }
  }, PROCESS_KILL_GRACE_MS).unref()
  void reason
}

async function runFinalCheck(job: ArtifactJobRecord): Promise<string | null> {
  return Promise.race([
    Promise.resolve().then(() => {
      assertArtifactJobNotCanceled(job.id, 'final-check')
      ensureOutputFile(job.outputPath)
      return null
    }),
    new Promise<string>((resolve) => {
      setTimeout(() => resolve(`final check exceeded ${FINAL_CHECK_TIMEOUT_MS}ms and was skipped`), FINAL_CHECK_TIMEOUT_MS).unref()
    }),
  ])
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

function buildHtmlPptLiteOpenCodePrompt(userPrompt: string, options: HtmlPresentationJobOptions, repairOnly = false): string {
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
  const imageLines = !options.enableImages || options.maxImages <= 0
    ? [
      '8. 当前为无图模式：不要生成图片区域、封面图、章节图、配图区域、figure、img、image placeholder、visual placeholder、media placeholder、空白图片框或“图片待生成”等文字。',
      '8.1 无图模式下只允许纯文本、标题页、目录页、列表页、数据页、流程页、结论页等无图布局；如果模板暗示图片槽位，必须折叠图片槽位并让文本自然扩展。',
    ]
    : [
      `8. 当前允许图片规划，最多 ${options.maxImages} 张；优先为封面页、场景页、概念页预留可视区域；图片失败时允许使用内联 SVG placeholder。`,
    ]

  return [
    '请严格执行以下任务：',
    '1. 只允许读取 input/source.md、skill/SKILL.md、skill/TEMPLATE_STYLE.md、skill/TEMPLATE_PROFILE.json、skill/CANDIDATE_TEMPLATES.json。',
    '2. 如需参考版式，只允许读取 skill/frontend-slides-lite/viewport-base.css、skill/frontend-slides-lite/html-template.md、skill/frontend-slides-lite/animation-patterns.md、skill/frontend-slides-lite/STYLE_PRESETS.md。',
    '3. 不要扫描 skill/vendors，不要读取 beautiful-html-templates/templates，不要读取任何 template.html。',
    '3.1 不存在额外的模板 markdown 文件；不要猜测或尝试读取 product-keynote-lite.md、academic-report-lite.md 之类的文件。',
    '4. 不要读取 job 目录之外的文件，不要访问网络，不要安装依赖。',
    '5. 生成单文件 HTML PPT，适合 iframe sandbox 预览，必须是 16:9 横向页面。',
    '6. 每个 slide 根节点必须优先使用 <section class="slide">。',
    '7. 每个 slide 尽量直接带 data-slide-id；每个文本块尽量带 data-block-id、data-block-type="text"、data-block-role；仅在非无图模式下才允许图片块带 data-block-id、data-block-type="image"、data-block-role="visual"。',
    ...imageLines,
    '9. 必须把完整结果写入 output/index.html。',
    '10. 不要只在回复中输出 HTML。',
    '11. 不要输出到 index.html、presentation.html、slides.html、output.html；如果误写到这些名字，结束前必须复制为 output/index.html。',
    ...repairLines,
    '',
    '用户 prompt：',
    userPrompt,
  ].join('\n')
}

function resolveJobTemplateSelection(job: ArtifactJobRecord): TemplateSelectionResult {
  const options = normalizeHtmlPresentationJobOptions(job.htmlPresentationOptions)
  return resolveTemplateSelection({
    prompt: job.prompt,
    inputMarkdown: fs.readFileSync(job.inputPath, 'utf-8'),
    options,
  })
}

function buildOpenCodePrompt(job: ArtifactJobRecord, repairOnly = false): string {
  if (job.skillId === HTML_PPT_BEAUTIFUL_SKILL_ID) {
    const options = normalizeHtmlPresentationJobOptions(job.htmlPresentationOptions)
    if (options.qualityMode === 'high') {
      const templateSelection = resolveJobTemplateSelection(job)
      return buildHighQualityOpenCodePrompt(job.prompt, options, repairOnly, templateSelection)
    }
    return buildHtmlPptLiteOpenCodePrompt(job.prompt, options, repairOnly)
  }
  return buildDefaultOpenCodePrompt(job.prompt)
}

function buildSkillStatsForJob(job: ArtifactJobRecord): ArtifactJobSkillStats {
  const options = normalizeHtmlPresentationJobOptions(job.htmlPresentationOptions)
  if (options.qualityMode !== 'high') {
    return {
      mode: 'fast-lite',
      usesLiteSkill: true,
      usesOriginalFiveSkills: false,
    }
  }
  const validation = validateOriginalSkillPaths()
  return {
    mode: 'high-original-five-skills',
    usesLiteSkill: false,
    usesOriginalFiveSkills: true,
    requiredSkills: [...HIGH_QUALITY_ORIGINAL_SKILL_DIRS],
    loadedSkills: validation.loadedSkills,
    missingSkills: validation.missingSkills,
  }
}

function appendSkillModeLogs(job: ArtifactJobRecord, skillStats: ArtifactJobSkillStats, options: HtmlPresentationJobOptions): void {
  const skillMode = resolveHtmlPptSkillMode(options)
  appendLog(
    job.logPath,
    [
      `[${new Date().toISOString()}] qualityMode=${options.qualityMode}`,
      `[${new Date().toISOString()}] skillMode=${skillMode}`,
      `[${new Date().toISOString()}] usesLiteSkill=${String(skillStats.usesLiteSkill ?? false)}`,
      `[${new Date().toISOString()}] usesOriginalFiveSkills=${String(skillStats.usesOriginalFiveSkills ?? false)}`,
      skillStats.usesOriginalFiveSkills
        ? `[${new Date().toISOString()}] using original five skills`
        : `[${new Date().toISOString()}] using fast lite skill workspace`,
      options.qualityMode === 'high'
        ? `[${new Date().toISOString()}] lite skill disabled for high quality mode`
        : '',
      `[${new Date().toISOString()}] enableImages=${String(options.enableImages)}`,
      `[${new Date().toISOString()}] maxImages=${options.maxImages}`,
      `[${new Date().toISOString()}] opencodeWorkspace=${job.jobDir}`,
      `[${new Date().toISOString()}] orchestrationPath=${path.join(job.jobDir, 'ORCHESTRATION.md')}`,
      ...(skillStats.loadedSkills ?? []).map((name) => `[${new Date().toISOString()}] skillLoaded=${name}`),
      ...(skillStats.missingSkills ?? []).map((name) => `[${new Date().toISOString()}] skillMissing=${name}`),
    ].filter(Boolean).join('\n') + '\n',
  )
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

function pad(value: number, size = 3): string {
  return String(value).padStart(size, '0')
}

function slideId(index: number): string {
  return `slide-${pad(index + 1)}`
}

function blockId(slideIndex: number, blockIndex: number): string {
  return `block-${pad(slideIndex + 1)}-${pad(blockIndex + 1)}`
}

function stripMarkdownLine(value: string): string {
  return value
    .replace(/^#{1,6}\s*/, '')
    .replace(/^\s*[-*+]\s+/, '')
    .replace(/^\s*\d+\.\s+/, '')
    .replace(/[*_`>#]/g, '')
    .trim()
}

function splitSentences(value: string): string[] {
  return value
    .split(/[。！？!?；;\n]/)
    .map((item) => stripMarkdownLine(item))
    .filter(Boolean)
}

function truncateLine(value: string, maxLength = 88): string {
  return value.length <= maxLength ? value : `${value.slice(0, Math.max(0, maxLength - 1)).trim()}…`
}

function uniqueItems(values: string[]): string[] {
  return Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)))
}

interface MarkdownSectionDraft {
  title: string
  bullets: string[]
  paragraphs: string[]
}

function parseFallbackOutline(inputMarkdown: string, prompt: string): {
  title: string
  subtitle: string
  sections: MarkdownSectionDraft[]
} {
  const lines = inputMarkdown.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const headingLine = lines.find((line) => /^#\s+/.test(line))
  const title = truncateLine(stripMarkdownLine(headingLine || prompt || 'HTML 演示文稿'))
  const sections: MarkdownSectionDraft[] = []
  let current: MarkdownSectionDraft | null = null

  for (const line of lines) {
    if (/^#\s+/.test(line)) continue
    if (/^##+\s+/.test(line)) {
      current = {
        title: truncateLine(stripMarkdownLine(line)),
        bullets: [],
        paragraphs: [],
      }
      sections.push(current)
      continue
    }

    const text = truncateLine(stripMarkdownLine(line))
    if (!text) continue
    if (!current) {
      current = {
        title: '核心内容',
        bullets: [],
        paragraphs: [],
      }
      sections.push(current)
    }

    if (/^\s*([-*+]|\d+\.)\s+/.test(line)) current.bullets.push(text)
    else current.paragraphs.push(text)
  }

  const narrative = uniqueItems(splitSentences(`${prompt}\n${inputMarkdown}`))
  if (sections.length === 0) {
    const defaults = [
      '项目背景与目标',
      '方案架构',
      '核心能力',
      '实施路径',
    ]
    for (const [index, sectionTitle] of defaults.entries()) {
      sections.push({
        title: sectionTitle,
        bullets: narrative.slice(index * 2, index * 2 + 3),
        paragraphs: narrative.slice(index, index + 2),
      })
    }
  }

  for (const section of sections) {
    if (section.bullets.length === 0) {
      section.bullets = narrative
        .filter((item) => item !== title && item !== section.title)
        .slice(0, 4)
    }
    if (section.paragraphs.length === 0) {
      section.paragraphs = section.bullets.slice(0, 2)
    }
  }

  const subtitle = truncateLine(
    uniqueItems([
      ...sections.flatMap((section) => section.paragraphs),
      ...narrative,
    ])[0] || `围绕“${title}”生成的快速备用初稿`,
    96,
  )

  return {
    title,
    subtitle,
    sections,
  }
}

function buildFallbackTextBlock(slideIndex: number, blockIndex: number, role: ContentModelBlock['role'], text: string): ContentModelBlock {
  return {
    id: blockId(slideIndex, blockIndex),
    type: 'text',
    role,
    text: truncateLine(text, role === 'title' ? 80 : 140),
    assetPath: '',
    imagePrompt: '',
  }
}

function buildFallbackSlide(input: {
  slideIndex: number
  role: ContentModelSlide['role']
  title: string
  subtitle: string
  bullets: string[]
  body: string[]
  layoutHint: string
}): ContentModelSlide {
  const blocks: ContentModelBlock[] = [
    buildFallbackTextBlock(input.slideIndex, 0, 'title', input.title),
  ]

  if (input.subtitle) {
    blocks.push(buildFallbackTextBlock(input.slideIndex, blocks.length, 'subtitle', input.subtitle))
  }
  for (const bullet of input.bullets.slice(0, 4)) {
    blocks.push(buildFallbackTextBlock(input.slideIndex, blocks.length, 'body', bullet))
  }
  for (const paragraph of input.body.slice(0, 2)) {
    blocks.push(buildFallbackTextBlock(input.slideIndex, blocks.length, 'body', paragraph))
  }

  return {
    id: slideId(input.slideIndex),
    index: input.slideIndex,
    role: input.role,
    title: input.title,
    subtitle: input.subtitle,
    bullets: input.bullets.slice(0, 5),
    layoutHint: input.layoutHint,
    blocks,
    visual: {
      type: 'none',
      prompt: '',
      assetPath: '',
      placement: 'card',
    },
  }
}

function buildServerFallbackContentModel(input: {
  prompt: string
  inputMarkdown: string
  selectedTemplateSlug: string
  templateProfile: TemplateProfileRecord
}): ContentModelRecord {
  const outline = parseFallbackOutline(input.inputMarkdown, input.prompt)
  const sections = outline.sections.slice(0, 4)
  const agendaItems = uniqueItems(sections.map((section) => section.title)).slice(0, 5)
  const createdAt = new Date().toISOString()
  const slides: ContentModelSlide[] = []

  slides.push(buildFallbackSlide({
    slideIndex: slides.length,
    role: 'cover',
    title: outline.title,
    subtitle: outline.subtitle,
    bullets: agendaItems,
    body: [outline.subtitle],
    layoutHint: 'cover-hero',
  }))

  if (agendaItems.length > 1) {
    slides.push(buildFallbackSlide({
      slideIndex: slides.length,
      role: 'agenda',
      title: '汇报目录',
      subtitle: '基于原始需求快速整理的内容结构',
      bullets: agendaItems,
      body: agendaItems,
      layoutHint: 'agenda-list',
    }))
  }

  for (const [index, section] of sections.entries()) {
    slides.push(buildFallbackSlide({
      slideIndex: slides.length,
      role: index === sections.length - 1 ? 'timeline' : 'content',
      title: section.title,
      subtitle: section.paragraphs[0] || section.bullets[0] || outline.subtitle,
      bullets: uniqueItems(section.bullets).slice(0, 4),
      body: uniqueItems(section.paragraphs).slice(0, 3),
      layoutHint: index === sections.length - 1 ? 'timeline-track' : 'content-split',
    }))
  }

  slides.push(buildFallbackSlide({
    slideIndex: slides.length,
    role: 'closing',
    title: '下一步建议',
    subtitle: '当前为快速备用渲染初稿，可继续换模板、编辑文本并重新生成高质量版本。',
    bullets: [
      '确认页面结构与重点章节',
      '继续局部编辑与模板切换',
      '需要更完整视觉时可切换高质量模式',
    ],
    body: [outline.title],
    layoutHint: 'closing-statement',
  }))

  return {
    deckId: `fallback-${safeSegment(outline.title || 'deck', 48)}`,
    title: outline.title,
    subtitle: outline.subtitle,
    templateSlug: input.selectedTemplateSlug,
    theme: input.templateProfile.colorScheme,
    slides,
    assets: [],
    createdAt,
    updatedAt: createdAt,
  }
}

function buildTemplateStyleMarkdown(
  selection: HtmlPptStyleProfile,
  prepared: HtmlPptPreparedSelection,
  options: HtmlPresentationJobOptions,
): string {
  const lockedTemplateLines = prepared.templateLocked
    ? [
      '## User-selected template (hard lock)',
      '',
      `用户已选择 HTML Slides 模板：${prepared.selectedTemplate.name}`,
      `模板 slug：${prepared.selectedTemplateSlug}`,
      '必须使用该模板的视觉结构、版式和样式生成演示文稿。',
      '不要自动更换模板。',
      '不要选择其他模板。',
      '',
      '## Visual Direction',
      ...prepared.templateProfile.visualRules.map((item) => `- ${item}`),
      '',
      '## Layout Requirements',
      `- color scheme: ${prepared.templateProfile.colorScheme}`,
      `- density: ${prepared.templateProfile.density}`,
      `- best for: ${prepared.templateProfile.bestFor.join(', ') || 'general presentation'}`,
    ]
    : [
      '## Visual Direction',
      ...selection.visualDirection.map((item) => `- ${item}`),
      '',
      '## Layout Requirements',
      ...selection.layoutRequirements.map((item) => `- ${item}`),
    ]

  return [
    '# Selected Template Style',
    '',
    `templateId: ${prepared.templateLocked ? prepared.selectedTemplateSlug : selection.styleId}`,
    `reason: ${prepared.templateLocked ? prepared.selectionReason : selection.reason}`,
    `inspirationTemplates: ${prepared.templateLocked ? prepared.selectedTemplateSlug : selection.inspirationTemplates.join(', ')}`,
    `selectedTemplateSlug: ${prepared.selectedTemplateSlug}`,
    `candidateTemplateSlugs: ${prepared.candidateTemplateSlugs.join(', ')}`,
    `fallbackUsed: ${prepared.fallbackUsed}`,
    `templateLocked: ${String(prepared.templateLocked)}`,
    `qualityMode: ${options.qualityMode}`,
    `enableImages: ${options.enableImages}`,
    `maxImages: ${options.maxImages}`,
    `imageMode: ${!options.enableImages || options.maxImages <= 0 ? 'none' : 'planned'}`,
    '',
    ...lockedTemplateLines,
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
    ...(!options.enableImages || options.maxImages <= 0
      ? [
        '- 无图模式：不要生成 img、figure、image placeholder、visual placeholder、media placeholder、SVG 图片占位或空白图片框',
        '- 无图模式：只选择纯文本 / 列表 / 数据 / 流程 / 结论类布局，并让文本区域占满可用空间',
      ]
      : [
        `- 图片模式：最多 ${options.maxImages} 张图片，图片区必须是明确 visual slot，不要堆叠到正文上`,
      ]),
  ].join('\n')
}

function formatSkillPrepareLog(
  files: SkillTextFileSummary[],
  totalTextBytes: number,
  selection: HtmlPptStyleProfile,
  prepared: HtmlPptPreparedSelection,
  options: HtmlPresentationJobOptions,
): string {
  const lines = [
    `requestedTemplateSlug: ${options.templateSlug || ''}`,
    `selectedStyleId: ${selection.styleId}`,
    `selectedStyleReason: ${selection.reason}`,
    `inspirationTemplates: ${selection.inspirationTemplates.join(', ')}`,
    `selectedTemplateSlug: ${prepared.selectedTemplateSlug}`,
    `templateSelectionFallbackUsed: ${prepared.fallbackUsed}`,
    `candidateTemplateSlugs: ${prepared.candidateTemplateSlugs.join(', ')}`,
    'fallbackUsed: false',
    `imagePlanningEnabled: ${options.enableImages}`,
    `maxImages: ${options.maxImages}`,
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

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T
}

function prepareHtmlPptBeautifulLiteSkillWorkspace(input: {
  jobDir: string
  inputMarkdown: string
  prompt: string
  sourceSkillDir: string
  skillDir: string
  outputDir: string
  skillPrepareLogPath: string
  options: HtmlPresentationJobOptions
}): HtmlPptPreparedSelection {
  const frontendSlidesSourceDir = path.join(input.sourceSkillDir, 'vendors', 'frontend-slides')
  const frontendSlidesLiteDir = path.join(input.skillDir, 'frontend-slides-lite')
  const selection = chooseHtmlPptStyle(input.prompt, input.inputMarkdown)
  const prepared = resolveTemplateSelection({
    prompt: input.prompt,
    inputMarkdown: input.inputMarkdown,
    options: input.options,
  })
  const files: SkillTextFileSummary[] = []

  fs.rmSync(input.skillDir, { recursive: true, force: true })
  fs.mkdirSync(frontendSlidesLiteDir, { recursive: true })
  fs.mkdirSync(input.outputDir, { recursive: true })
  fs.mkdirSync(path.join(input.outputDir, 'assets'), { recursive: true })

  files.push(addRelativePath(
    writeTextFileWithLimit(path.join(input.skillDir, 'SKILL.md'), HTML_PPT_BEAUTIFUL_LITE_SKILL, MAX_SKILL_TEXT_FILE_BYTES),
    'SKILL.md',
  ))
  files.push(addRelativePath(
    writeTextFileWithLimit(
      path.join(input.skillDir, 'TEMPLATE_STYLE.md'),
      buildTemplateStyleMarkdown(selection, prepared, input.options),
      MAX_SKILL_TEXT_FILE_BYTES,
    ),
    'TEMPLATE_STYLE.md',
  ))
  const templateProfileJson = JSON.stringify(prepared.templateProfile, null, 2)
  const candidateTemplatesJson = JSON.stringify(buildCandidateTemplatesSidecar(prepared), null, 2)
  files.push(addRelativePath(
    writeTextFileWithLimit(
      path.join(input.skillDir, 'TEMPLATE_PROFILE.json'),
      templateProfileJson,
      MAX_SKILL_TEXT_FILE_BYTES,
    ),
    'TEMPLATE_PROFILE.json',
  ))
  files.push(addRelativePath(
    writeTextFileWithLimit(
      path.join(input.skillDir, 'CANDIDATE_TEMPLATES.json'),
      candidateTemplatesJson,
      MAX_SKILL_TEXT_FILE_BYTES,
    ),
    'CANDIDATE_TEMPLATES.json',
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

  fs.writeFileSync(path.join(input.outputDir, 'template-profile.json'), templateProfileJson, 'utf-8')
  fs.writeFileSync(path.join(input.outputDir, 'candidate-templates.json'), candidateTemplatesJson, 'utf-8')

  const totalTextBytes = files.reduce((sum, file) => sum + file.sizeBytes, 0)
  const skillPrepareLog = formatSkillPrepareLog(files, totalTextBytes, selection, prepared, input.options)
  fs.mkdirSync(path.dirname(input.skillPrepareLogPath), { recursive: true })
  fs.writeFileSync(input.skillPrepareLogPath, skillPrepareLog, 'utf-8')

  if (totalTextBytes > MAX_SKILL_TOTAL_HARD_LIMIT_BYTES) {
    throw new Error('Skill workspace too large for OpenCode context')
  }

  return prepared
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
  if (job.skillId === HTML_PPT_BEAUTIFUL_SKILL_ID) {
    const options = normalizeHtmlPresentationJobOptions(job.htmlPresentationOptions)
    if (options.qualityMode === 'high') {
      return buildHighQualityOpenCodeAttachments(job.jobDir, job.inputPath)
    }
    const attachments = [job.inputPath, job.skillPath]
    const extraFiles = [
      path.join(job.jobDir, 'skill', 'TEMPLATE_STYLE.md'),
      path.join(job.jobDir, 'skill', 'TEMPLATE_PROFILE.json'),
      path.join(job.jobDir, 'skill', 'CANDIDATE_TEMPLATES.json'),
      path.join(job.jobDir, 'skill', 'frontend-slides-lite', 'viewport-base.css'),
      path.join(job.jobDir, 'skill', 'frontend-slides-lite', 'html-template.md'),
      path.join(job.jobDir, 'skill', 'frontend-slides-lite', 'animation-patterns.md'),
      path.join(job.jobDir, 'skill', 'frontend-slides-lite', 'STYLE_PRESETS.md'),
    ]
    for (const filePath of extraFiles) {
      if (ensureRegularFile(filePath)) attachments.push(filePath)
    }
    return attachments
  }

  return [job.inputPath, job.skillPath]
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

function resolveOpenCodeRun(job: ArtifactJobRecord, overrides: OpenCodeRunOverrides = {}): {
  kind: OpenCodeRunKind
  attachments: string[]
  prompt: string
} {
  const kind = overrides.kind ?? (overrides.prompt || overrides.attachments ? 'generate' : 'generate')
  if (overrides.attachments && overrides.prompt) {
    return { kind, attachments: overrides.attachments, prompt: overrides.prompt }
  }
  if (kind === 'fast-template-validation-repair') {
    const templateSelection = resolveJobTemplateSelection(job)
    return {
      kind,
      attachments: buildFastTemplateValidationRepairOpenCodeAttachments(job.jobDir, job.inputPath, job.outputPath),
      prompt: buildFastTemplateValidationRepairOpenCodePrompt(
        job.prompt,
        templateSelection,
        overrides.validationSummary,
      ),
    }
  }
  const repairOnly = kind === 'repair-output-path'
  return {
    kind: repairOnly ? 'repair-output-path' : 'generate',
    attachments: buildOpenCodeAttachments(job),
    prompt: buildOpenCodePrompt(job, repairOnly),
  }
}

function runOpenCode(
  job: ArtifactJobRecord,
  abortController: AbortController,
  overrides: OpenCodeRunOverrides = {},
): Promise<OpenCodeExecutionResult> {
  const runKind = overrides.kind ?? 'generate'
  const repairOnly = runKind === 'repair-output-path'
  const fastTemplateRepair = runKind === 'fast-template-validation-repair'
  const { attachments, prompt } = resolveOpenCodeRun(job, overrides)

  return new Promise((resolve, reject) => {
    if (!fs.existsSync(OPENCODE_BIN)) {
      reject(new Error(`未找到 OpenCode 可执行文件：${OPENCODE_BIN}`))
      return
    }
    const startLabel = fastTemplateRepair
      ? 'opencode-fast-template-repair-start'
      : repairOnly
        ? 'opencode-repair-start'
        : 'opencode-start'
    assertArtifactJobNotCanceled(job.id, startLabel)

    const timeoutConfig = getOpenCodeTimeoutConfig(job)
    logHtmlArtifactTask(job, {
      status: repairOnly || fastTemplateRepair ? 'repairing-output' : 'running',
      timeoutMs: timeoutConfig.timeoutMs,
    })
    const runLabel = fastTemplateRepair
      ? 'fast-template-validation-repair'
      : repairOnly
        ? 'repair'
        : ''
    appendLog(
      job.logPath,
      `[${new Date().toISOString()}] Starting OpenCode in ${job.jobDir}${runLabel ? ` (${runLabel})` : ''}\n`
      + `[${new Date().toISOString()}] Attached files:\n${attachments.map((filePath) => `- ${path.relative(job.jobDir, filePath)}`).join('\n')}\n`
      + `[${new Date().toISOString()}] OpenCode timeout budget=${timeoutConfig.timeoutMs}ms fallbackAfter=${timeoutConfig.fallbackAfterMs}ms\n`,
    )

    const args = ['run', '--pure', '--dir', job.jobDir]
    for (const attachment of attachments) {
      args.push('-f', attachment)
    }
    args.push('--', prompt)
    appendLog(job.logPath, `[${new Date().toISOString()}] OpenCode args: ${JSON.stringify(args)}\n`)
    appendLog(job.logPath, `[${new Date().toISOString()}] promptChars=${prompt.length}\n`)

    const child = spawn(
      OPENCODE_BIN,
      args,
      {
        cwd: job.jobDir,
        env: { ...process.env },
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: process.platform === 'linux',
      },
    )

    const presentationOptions = normalizeHtmlPresentationJobOptions(job.htmlPresentationOptions)
    const isHtmlPptBeautiful = job.skillId === HTML_PPT_BEAUTIFUL_SKILL_ID
    const isHighPpt = isHtmlPptBeautiful && presentationOptions.qualityMode === 'high'
    const isFastTemplatePpt = isHtmlPptBeautiful && presentationOptions.qualityMode === 'fast'
    if (fastTemplateRepair) {
      markHtmlPptProgress(job, 'postprocessing', '正在修复模板页面校验问题', {
        detail: '保留所选模板视觉系统，修复空白页与 demo 文案',
        currentPhase: 'template-repair',
      })
    } else if (!repairOnly) {
      markHtmlPptProgress(
        job,
        'running_opencode',
        isHighPpt
          ? '正在使用五个原版 Skill 生成 HTML 演示文稿'
          : isFastTemplatePpt
            ? '正在基于所选模板快速生成 HTML 演示文稿'
            : '正在调用 OpenCode 生成 HTML 演示文稿',
        {
          detail: isHighPpt ? '高质量模式最长可能需要约 15 分钟' : isFastTemplatePpt ? '快速模式将按所选模板直接生成' : undefined,
          currentPhase: 'opencode',
        },
      )
    } else {
      markJobPhase(job.id, 'repairing-output', '正在修复输出路径…')
    }

    const currentPhase = fastTemplateRepair
      ? 'template-repair'
      : repairOnly
        ? 'repairing-output'
        : 'opencode'
    const progressMessage = fastTemplateRepair
      ? '正在修复模板页面校验问题…'
      : repairOnly
        ? '正在修复输出路径…'
        : (isHighPpt ? '正在使用五个原版 Skill 生成 HTML 演示文稿' : '正在调用 OpenCode 生成 HTML Artifact…')

    updateArtifactJob(job.id, {
      runnerPid: child.pid,
      runnerProcessGroupId: process.platform === 'linux' ? child.pid : undefined,
      cancellable: true,
      currentPhase,
      message: progressMessage,
      timeoutMs: timeoutConfig.timeoutMs,
    })

    registerArtifactJobRuntime(job.id, {
      abortController,
      terminate: (reason) => {
        appendLog(job.logPath, `[${new Date().toISOString()}] terminating runner: ${reason}\n`)
        killProcessTree(child.pid, reason)
      },
    })

    let finished = false
    let timedOut = false
    let noOutputSoftTimedOut = false
    let canceled = abortController.signal.aborted

    const settle = (callback: () => void) => {
      if (finished) return
      finished = true
      clearArtifactJobRuntime(job.id)
      callback()
    }

    const timeout = setTimeout(() => {
      timedOut = true
      appendLog(job.logPath, `\n[${new Date().toISOString()}] OpenCode timeout after ${timeoutConfig.fallbackAfterMs} ms\n`)
      killProcessTree(child.pid, 'timeout')
    }, timeoutConfig.fallbackAfterMs)

    const fastNoOutputSoftTimeoutMs = 90_000
    const fastNoOutputProbeIntervalMs = 10_000
    const shouldEnableFastNoOutputGuard = false
    const noOutputSoftTimeout = shouldEnableFastNoOutputGuard
      ? setTimeout(() => {
          if (ensureRegularFile(job.outputPath)) return
          noOutputSoftTimedOut = true
          appendLog(job.logPath, `[${new Date().toISOString()}] fastNoOutputSoftTimeout=true timeoutMs=${fastNoOutputSoftTimeoutMs}\n`)
          killProcessTree(child.pid, 'fast-no-output-soft-timeout')
        }, fastNoOutputSoftTimeoutMs)
      : null
    const noOutputProbe = shouldEnableFastNoOutputGuard
      ? setInterval(() => {
          const exists = ensureRegularFile(job.outputPath)
          appendLog(job.logPath, `[${new Date().toISOString()}] fastOutputProbe indexHtmlExists=${String(exists)}\n`)
        }, fastNoOutputProbeIntervalMs)
      : null
    noOutputSoftTimeout?.unref?.()
    noOutputProbe?.unref?.()

    const handleAbort = () => {
      canceled = true
      appendLog(job.logPath, `[${new Date().toISOString()}] abort signal received\n`)
      killProcessTree(child.pid, job.cancelReason || 'user_cancelled')
    }

    if (abortController.signal.aborted) handleAbort()
    else abortController.signal.addEventListener('abort', handleAbort, { once: true })

    let lastOpenCodeOutput = ''
    const captureOutput = (chunk: Buffer | string, stream: 'stdout' | 'stderr') => {
      const raw = typeof chunk === 'string' ? chunk : chunk.toString('utf-8')
      appendLog(job.logPath, raw)
      const line = sanitizeOpenCodeOutputLine(raw, 160)
      if (line) {
        lastOpenCodeOutput = line
        appendArtifactJobLogLine(job, `opencode${stream} ${line}`)
      }
    }

    child.stdout.on('data', (chunk) => captureOutput(chunk, 'stdout'))
    child.stderr.on('data', (chunk) => captureOutput(chunk, 'stderr'))

    const heartbeat = setInterval(() => {
      const message = lastOpenCodeOutput
        ? `OpenCode 正在运行：${lastOpenCodeOutput}`
        : 'OpenCode 仍在运行，高质量生成中……'
      appendArtifactJobLogLine(job, `opencodeHeartbeat ${message}`)
      patchArtifactJobProgress(job.id, 'opencode_heartbeat', 'OpenCode 正在生成演示文稿', {
        detail: message,
        heartbeatAt: new Date().toISOString(),
        heartbeatMessage: message,
        currentPhase: 'opencode',
        logLine: undefined,
      })
    }, OPENCODE_HEARTBEAT_INTERVAL_MS)
    heartbeat.unref?.()

    child.on('error', (error) => {
      clearInterval(heartbeat)
      clearTimeout(timeout)
      if (noOutputSoftTimeout) clearTimeout(noOutputSoftTimeout)
      if (noOutputProbe) clearInterval(noOutputProbe)
      abortController.signal.removeEventListener('abort', handleAbort)
      settle(() => reject(error))
    })

    child.on('close', (code, signal) => {
      clearInterval(heartbeat)
      clearTimeout(timeout)
      if (noOutputSoftTimeout) clearTimeout(noOutputSoftTimeout)
      if (noOutputProbe) clearInterval(noOutputProbe)
      abortController.signal.removeEventListener('abort', handleAbort)
      updateArtifactJob(job.id, {
        runnerPid: undefined,
        runnerProcessGroupId: undefined,
      })
      if (canceled || abortController.signal.aborted) {
        settle(() => reject(new ArtifactJobCanceledError(job.cancelReason || 'Artifact job canceled')))
        return
      }
      if (timedOut) {
        settle(() => reject(new OpenCodeTimeoutError(timeoutConfig.fallbackAfterMs)))
        return
      }
      if (noOutputSoftTimedOut) {
        settle(() => reject(new OpenCodeNoOutputTimeoutError(fastNoOutputSoftTimeoutMs)))
        return
      }
      if (code !== 0) {
        settle(() => reject(new Error(`OpenCode 执行失败（exit=${code ?? 'null'}, signal=${signal ?? 'none'}）`)))
        return
      }
      settle(() => resolve({ ...timeoutConfig, noOutputSoftTimeoutTriggered: false }))
    })
  })
}

function isOpenCodeTimeoutError(error: unknown): error is OpenCodeTimeoutError {
  return error instanceof OpenCodeTimeoutError
}

function isOpenCodeNoOutputTimeoutError(error: unknown): error is OpenCodeNoOutputTimeoutError {
  return error instanceof OpenCodeNoOutputTimeoutError
}

function summarizeValidationFailure(validation: RenderedSlidesValidationResult): string {
  const parts: string[] = []
  if (validation.slideCount < 2) parts.push(`slides=${validation.slideCount}`)
  if (validation.blankSlideCount > 0) parts.push(`blankSlides=${validation.blankSlideCount}`)
  if (validation.hasDemoText) parts.push('hasDemoText=true')
  if (validation.hasImagePromptText) parts.push('hasImagePromptText=true')
  return parts.join(', ') || 'validation-failed'
}

function syncJobSummaryFromTemplateApply(
  jobSummary: HtmlPresentationJobSummary,
  templateApplyResult: Awaited<ReturnType<typeof finalizeOpencodeTemplateDrivenJobOutput>>,
  lockedSelection: TemplateSelectionResult,
  options: ReturnType<typeof normalizeHtmlPresentationJobOptions>,
): HtmlPresentationJobSummary {
  const requested = lockedSelection.requestedTemplateSlug || options.templateSlug || ''
  const applied = templateApplyResult.appliedTemplateSlug
  const templateApplied = Boolean(applied) && !templateApplyResult.fallbackUsed
    && (templateApplyResult.rendererMode === 'opencode-template-driven-fast'
      || templateApplyResult.rendererMode === 'opencode-template-driven-high'
      || templateApplyResult.rendererMode === 'opencode-template-driven'
      || templateApplyResult.rendererMode === 'beautiful-template-adapter-fast')

  return {
    ...jobSummary,
    requestedTemplateSlug: requested,
    selectedTemplateSlug: templateApplied ? (applied ?? undefined) : undefined,
    appliedTemplateSlug: applied,
    rendererMode: templateApplyResult.rendererMode,
    fallbackUsed: templateApplyResult.fallbackUsed,
    fallbackReason: templateApplyResult.templateProfile.fallbackReason,
    templateStyleApplied: templateApplyResult.templateProfile.templateStyleApplied,
    repairAttempted: templateApplyResult.repairAttempted,
    repairSucceeded: templateApplyResult.repairSucceeded,
    warning: templateApplyResult.warning || jobSummary.warning,
  }
}

function createTimeoutFallbackArtifact(
  job: ArtifactJobRecord,
  timeoutError: OpenCodeTimeoutError | OpenCodeNoOutputTimeoutError,
  reason: 'opencode-timeout' | 'fast-opencode-no-output-timeout' = 'opencode-timeout',
): HtmlPresentationJobSummary {
  const inputMarkdown = fs.readFileSync(job.inputPath, 'utf-8')
  const options = normalizeHtmlPresentationJobOptions(job.htmlPresentationOptions)
  const styleSelection = chooseHtmlPptStyle(job.prompt, inputMarkdown)
  const templateSelection = resolveTemplateSelection({
    prompt: job.prompt,
    inputMarkdown,
    options,
  })
  const contentModel = buildServerFallbackContentModel({
    prompt: job.prompt,
    inputMarkdown,
    selectedTemplateSlug: templateSelection.selectedTemplateSlug,
    templateProfile: templateSelection.templateProfile,
  })
  const templateFile = resolveBeautifulTemplateFile(templateSelection.selectedTemplateSlug) || templateSelection.templateProfile.templateFile
  const renderResult = renderHtmlPresentationFromContentModel({
    contentModel,
    templateProfile: {
      ...templateSelection.templateProfile,
      templateFile,
    },
    artifactId: '',
    purpose: 'timeout-fallback',
  })
  const requestedTemplateSlug = templateSelection.requestedTemplateSlug
    || options.templateSlug
    || templateSelection.selectedTemplateSlug
  const profile: TemplateProfileRecord = {
    ...templateSelection.templateProfile,
    templateFile,
    templateSlug: requestedTemplateSlug,
    requestedTemplateSlug,
    appliedTemplateSlug: templateSelection.selectedTemplateSlug,
    rendererMode: renderResult.rendererMode,
    fallbackUsed: true,
    fallbackReason: reason,
    templateStyleApplied: 'full',
    warning: renderResult.warning,
  }
  const outputDir = path.join(job.jobDir, 'output')
  const candidatePayload = {
    selectedTemplateSlug: templateSelection.selectedTemplateSlug,
    fallbackUsed: templateSelection.fallbackUsed,
    candidates: templateSelection.candidateTemplates,
  }
  fs.mkdirSync(outputDir, { recursive: true })
  fs.writeFileSync(job.outputPath, renderResult.html, 'utf-8')
  fs.writeFileSync(path.join(outputDir, 'content-model.json'), JSON.stringify(contentModel, null, 2), 'utf-8')
  fs.writeFileSync(path.join(outputDir, 'template-profile.json'), JSON.stringify(profile, null, 2), 'utf-8')
  fs.writeFileSync(path.join(outputDir, 'candidate-templates.json'), JSON.stringify(candidatePayload, null, 2), 'utf-8')

  const timeoutSeconds = Math.round(timeoutError.timeoutMs / 1000)
  const warningLines = [
    options.qualityMode === 'high'
      ? buildHighQualityTimeoutFallbackWarning(timeoutSeconds)
      : buildFastTimeoutFallbackWarning(timeoutSeconds),
  ]
  if (renderResult.warning) warningLines.push(renderResult.warning)
  const warning = warningLines.join(' ')

  markHtmlPptProgress(
    job,
    'fallback',
    options.qualityMode === 'high' ? '高质量生成超时，已生成可预览草稿' : '生成超时，已生成可预览初稿',
    {
      detail: `OpenCode 在 ${timeoutSeconds} 秒内未完成，已生成一个可预览版本`,
      logLine: `fallback opencode timeout after ${timeoutError.timeoutMs}ms`,
    },
  )

  appendLog(
    job.logPath,
    [
      '',
      `[${new Date().toISOString()}] opencode_timeout=true`,
      `[${new Date().toISOString()}] fallbackUsed=true`,
      `[${new Date().toISOString()}] fallbackRenderer=server`,
      `[${new Date().toISOString()}] timeoutMs=${timeoutError.timeoutMs}`,
      `[${new Date().toISOString()}] requestedTemplateSlug=${options.templateSlug || ''}`,
      `[${new Date().toISOString()}] selectedTemplateSlug=${templateSelection.selectedTemplateSlug}`,
      `[${new Date().toISOString()}] selectedStyleId=${styleSelection.styleId}`,
      `[${new Date().toISOString()}] rendererMode=${renderResult.rendererMode}`,
      `[${new Date().toISOString()}] imagePlanningEnabled=${String(options.enableImages)}`,
      `[${new Date().toISOString()}] maxImages=${options.maxImages}`,
      renderResult.warning ? `[${new Date().toISOString()}] warning=${renderResult.warning}` : '',
    ].filter(Boolean).join('\n') + '\n',
  )

  return {
    message: 'HTML Artifact 生成完成（超时保底草稿）',
    warning,
    fallbackUsed: true,
    fallbackRenderer: 'server',
    opencodeTimedOut: true,
    timeoutMs: timeoutError.timeoutMs,
    requestedTemplateSlug,
    selectedTemplateSlug: profile.appliedTemplateSlug ?? undefined,
    appliedTemplateSlug: profile.appliedTemplateSlug ?? null,
    selectedStyleId: styleSelection.styleId,
    rendererMode: renderResult.rendererMode,
    fallbackReason: reason,
    templateStyleApplied: profile.templateStyleApplied,
  }
}

export function prepareArtifactJobWorkspace(input: {
  jobId: string
  inputMarkdown: string
  prompt: string
  skillId?: string
  htmlPresentationOptions?: HtmlPresentationJobOptions
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

  let resolvedSkillPath = skillPath

  if (input.skillId) {
    if (input.skillId === HTML_PPT_BEAUTIFUL_SKILL_ID) {
      const htmlPresentationOptions = normalizeHtmlPresentationJobOptions(input.htmlPresentationOptions)
      const templateSelection = resolveTemplateSelection({
        prompt: input.prompt,
        inputMarkdown: input.inputMarkdown,
        options: htmlPresentationOptions,
      })
      if (htmlPresentationOptions.qualityMode === 'high') {
        prepareHighQualityOriginalSkillWorkspace({
          jobDir,
          options: htmlPresentationOptions,
          skillPrepareLogPath,
          templateSelection,
        })
      } else {
        const sourceSkillDir = validateAndResolveSkillDir(input.skillId)
        prepareHtmlPptBeautifulLiteSkillWorkspace({
          jobDir,
          inputMarkdown: input.inputMarkdown,
          prompt: input.prompt,
          sourceSkillDir,
          skillDir,
          outputDir,
          options: htmlPresentationOptions,
          skillPrepareLogPath,
        })
      }
      resolvedSkillPath = htmlPresentationOptions.qualityMode === 'high'
        ? path.join(jobDir, 'ORCHESTRATION.md')
        : path.join(skillDir, 'SKILL.md')
    } else {
      const sourceSkillDir = validateAndResolveSkillDir(input.skillId)
      copyDirRecursive(sourceSkillDir, skillDir)
      resolvedSkillPath = path.join(skillDir, 'SKILL.md')
    }
  } else {
    fs.writeFileSync(skillPath, DEFAULT_HTML_SKILL, 'utf-8')
    resolvedSkillPath = skillPath
  }

  return {
    jobDir,
    inputPath,
    skillPath: resolvedSkillPath,
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
  message?: string
  warning?: string
  fallbackUsed?: boolean
  fallbackRenderer?: string
  opencodeTimedOut?: boolean
  timeoutMs?: number
  requestedTemplateSlug?: string
  selectedTemplateSlug?: string
  appliedTemplateSlug?: string | null
  selectedStyleId?: string
  rendererMode?: string
  fallbackReason?: string
  templateStyleApplied?: 'full' | 'basic' | 'not-applied'
  repairAttempted?: boolean
  repairSucceeded?: boolean
}> {
  assertArtifactJobNotCanceled(job.id, 'job-start')
  const abortController = new AbortController()
  let jobSummary: HtmlPresentationJobSummary = {}
  const startedAt = Date.now()
  const presentationOptions = normalizeHtmlPresentationJobOptions(job.htmlPresentationOptions)
  const skillStats = buildSkillStatsForJob(job)
  updateArtifactJob(job.id, { skillStats, timeoutMs: resolveHtmlPptOpenCodeTimeoutMs({ qualityMode: presentationOptions.qualityMode }).timeoutMs })
  if (job.skillId === HTML_PPT_BEAUTIFUL_SKILL_ID) {
    const timeoutConfig = resolveHtmlPptOpenCodeTimeoutMs({ qualityMode: presentationOptions.qualityMode })
    logHtmlPptTimeoutConfig(presentationOptions.qualityMode)
    appendLog(
      job.logPath,
      `[${new Date().toISOString()}] htmlPptTimeout qualityMode=${presentationOptions.qualityMode} timeoutMs=${timeoutConfig.timeoutMs} timeoutSeconds=${timeoutConfig.timeoutSeconds} timeoutSource=${timeoutConfig.timeoutSource}\n`,
    )
    appendSkillModeLogs(job, skillStats, presentationOptions)
    markHtmlPptProgress(job, 'preparing', '正在准备生成工作区')
    if (presentationOptions.qualityMode === 'high') {
      markHtmlPptProgress(job, 'loading_skills', '正在加载高质量 PPT Skill', {
        detail: '正在加载 beautiful-html-templates / frontend-slides / guizang-ppt-skil / html-ppt-beautiful / html-ppt-skill',
      })
    } else {
      markHtmlPptProgress(job, 'loading_skills', '正在加载模板与 Skill', {
        detail: '正在准备 selected-template 与 beautiful-html-templates',
      })
    }
    markHtmlPptProgress(job, 'analyzing', '正在分析主题与生成要求')
    if (presentationOptions.enableImages && presentationOptions.maxImages > 0) {
      markHtmlPptProgress(job, 'planning_visuals', '正在规划配图槽位', {
        detail: '配图数量将根据模板槽位自动规划',
      })
    } else {
      markHtmlPptProgress(job, 'planning_slides', '正在规划页面结构')
    }
  }

  try {
    if (job.skillId !== HTML_PPT_BEAUTIFUL_SKILL_ID) {
      markJobPhase(job.id, 'opencode', '正在调用 OpenCode 生成 HTML Artifact…')
    }
    const execution = await runOpenCode(job, abortController, { kind: 'generate' })
    if (execution.noOutputSoftTimeoutTriggered) {
      updateArtifactJob(job.id, { noOutputSoftTimeoutTriggered: true })
    }
  } catch (error) {
    if (isArtifactJobCanceledError(error)) {
      markPartialOutput(job)
      throw error
    }
    if (job.skillId === HTML_PPT_BEAUTIFUL_SKILL_ID && (isOpenCodeTimeoutError(error) || isOpenCodeNoOutputTimeoutError(error))) {
      assertArtifactJobNotCanceled(job.id, 'timeout-fallback')
      markHtmlPptProgress(job, 'postprocessing', 'OpenCode 超时，正在切换备用渲染器…', {
        currentPhase: 'postprocess',
      })
      updateArtifactJob(job.id, {
        opencodeTimedOut: true,
        timeoutMs: error.timeoutMs,
        noOutputSoftTimeoutTriggered: isOpenCodeNoOutputTimeoutError(error),
      })
      try {
        const fallbackReason = isOpenCodeNoOutputTimeoutError(error)
          ? 'fast-opencode-no-output-timeout'
          : 'opencode-timeout'
        jobSummary = createTimeoutFallbackArtifact(job, error, fallbackReason)
      } catch (fallbackError) {
        markPartialOutput(job)
        const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
        throw new Error(
          `OpenCode 在 ${Math.round(error.timeoutMs / 1000)} 秒内未完成。系统已尝试备用渲染，但未成功：${fallbackMessage}`,
        )
      }
      updateArtifactJob(job.id, {
        warning: jobSummary.warning,
        fallbackUsed: jobSummary.fallbackUsed,
        fallbackRenderer: jobSummary.fallbackRenderer,
        opencodeTimedOut: jobSummary.opencodeTimedOut,
        timeoutMs: jobSummary.timeoutMs,
        noOutputSoftTimeoutTriggered: isOpenCodeNoOutputTimeoutError(error),
        requestedTemplateSlug: jobSummary.requestedTemplateSlug,
        selectedTemplateSlug: jobSummary.selectedTemplateSlug,
        appliedTemplateSlug: jobSummary.appliedTemplateSlug,
        selectedStyleId: jobSummary.selectedStyleId,
        rendererMode: jobSummary.rendererMode,
        fallbackReason: jobSummary.fallbackReason,
        templateStyleApplied: jobSummary.templateStyleApplied,
        message: jobSummary.message,
      })
    } else if (!tryMaterializeFallbackOutput(job)) {
      markPartialOutput(job)
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

  assertArtifactJobNotCanceled(job.id, 'after-opencode')

  if (!jobSummary.fallbackUsed && !tryMaterializeFallbackOutput(job)) {
    const firstPassTail = readLogTail(job.logPath)
    if (job.skillId === HTML_PPT_BEAUTIFUL_SKILL_ID && isContextLimitError(firstPassTail)) {
      throw new Error(buildHtmlPptFailureMessage(job, 'OpenCode context length exceeded'))
    }

    appendLog(job.logPath, `\n[${new Date().toISOString()}] Missing output/index.html after first pass, retrying once with repair prompt\n`)
    markJobPhase(job.id, 'repairing-output', '正在修复输出路径…')
    await runOpenCode(job, abortController, { kind: 'repair-output-path' }).catch((error) => {
      if (isArtifactJobCanceledError(error)) throw error
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

  assertArtifactJobNotCanceled(job.id, 'before-final-check')
  tryMaterializeFallbackOutput(job)
  ensureOutputFile(job.outputPath)

  if (job.skillId === HTML_PPT_BEAUTIFUL_SKILL_ID) {
    const options = normalizeHtmlPresentationJobOptions(job.htmlPresentationOptions)
    const templateProfilePath = path.join(job.jobDir, 'output', 'template-profile.json')
    const candidateTemplatesPath = path.join(job.jobDir, 'output', 'candidate-templates.json')
    const templateProfile = ensureRegularFile(templateProfilePath)
      ? readJsonFile<TemplateProfileRecord>(templateProfilePath)
      : resolveTemplateSelection({ prompt: job.prompt, inputMarkdown: fs.readFileSync(job.inputPath, 'utf-8'), options }).templateProfile
    const candidatePayload = ensureRegularFile(candidateTemplatesPath)
      ? readJsonFile<{ selectedTemplateSlug: string; fallbackUsed: boolean; candidates: CandidateTemplateRecord[] }>(candidateTemplatesPath)
      : (() => {
          const selection = resolveTemplateSelection({
            prompt: job.prompt,
            inputMarkdown: fs.readFileSync(job.inputPath, 'utf-8'),
            options,
          })
          return {
            selectedTemplateSlug: selection.selectedTemplateSlug,
            fallbackUsed: selection.fallbackUsed,
            candidates: selection.candidateTemplates,
          }
        })()

    if (!jobSummary.fallbackUsed) {
      assertArtifactJobNotCanceled(job.id, 'before-postprocess')
      markHtmlPptProgress(job, 'postprocessing', '正在检查和整理页面结构', {
        currentPhase: 'postprocess',
        message: '正在注入模板与编辑运行时…',
      })
      const lockedSelection = resolveTemplateSelection({
        prompt: job.prompt,
        inputMarkdown: fs.readFileSync(job.inputPath, 'utf-8'),
        options,
      })
      const isTemplateDrivenOpenCode = job.skillId === HTML_PPT_BEAUTIFUL_SKILL_ID
      const postProcessed = postProcessHtmlPresentationOutput({
        jobId: job.id,
        outputDir: path.join(job.jobDir, 'output'),
        htmlPath: job.outputPath,
        title: titleFromPrompt(job.prompt),
        templateProfile: lockedSelection.templateProfile,
        candidateTemplates: lockedSelection.candidateTemplates,
        selectedTemplateSlug: lockedSelection.selectedTemplateSlug,
        fallbackUsed: lockedSelection.fallbackUsed,
        candidateTemplatesSidecar: buildCandidateTemplatesSidecar(lockedSelection),
        options,
        preserveSourceHtml: isTemplateDrivenOpenCode,
        assertNotCanceled: () => assertArtifactJobNotCanceled(job.id, 'postprocess'),
      })

      let renderContentModel = postProcessed.contentModel
      let generatedImageCount = postProcessed.generatedImageCount
      let placeholderCount = postProcessed.placeholderCount
      let unfilledImageCount = Math.max(0, postProcessed.plannedImageCount - generatedImageCount)
      let resolvedBudget = postProcessed.imageBudget

      if (options.qualityMode === 'high' && options.enableImages && options.maxImages > 0) {
        markHtmlPptProgress(job, 'fulfilling_images', '正在生成配图', {
          detail: '正在调用图片 provider 生成主题图片',
          currentPhase: 'image-fulfillment',
        })
        assertArtifactJobNotCanceled(job.id, 'before-image-fulfillment')
        const fulfillment = await fulfillPlannedImages({
          jobId: job.id,
          outputDir: path.join(job.jobDir, 'output'),
          htmlPath: job.outputPath,
          contentModelPath: postProcessed.contentModelPath,
          contentModel: postProcessed.contentModel,
          options,
          plannedBudget: postProcessed.imageBudget,
          logAppend: (line) => appendLog(job.logPath, `[${new Date().toISOString()}] ${line}\n`),
        })
        generatedImageCount = fulfillment.generatedImageCount
        placeholderCount = fulfillment.placeholderCount
        unfilledImageCount = fulfillment.unfilled
        resolvedBudget = fulfillment.imageBudget
        renderContentModel = fulfillment.contentModel
      }

      markHtmlPptProgress(job, 'postprocessing', '正在整理模板页面', {
        currentPhase: 'template-apply',
        message: `保留 OpenCode 模板页面：${lockedSelection.selectedTemplate.name}`,
      })
      let templateApplyResult = finalizeOpencodeTemplateDrivenJobOutput({
        outputDir: path.join(job.jobDir, 'output'),
        htmlPath: job.outputPath,
        contentModel: renderContentModel,
        contentModelPath: postProcessed.contentModelPath,
        templateSelection: lockedSelection,
        qualityMode: options.qualityMode,
      })
      let repairAttempted = false
      let repairSucceeded = false
      if (options.qualityMode === 'fast' && !templateApplyResult.validationOk) {
        const validationSummary = summarizeValidationFailure(
          validateFinalHtmlSlides(fs.readFileSync(job.outputPath, 'utf-8'), {
            minSlides: Math.min(2, renderContentModel.slides.length),
          }),
        )
        appendLog(
          job.logPath,
          [
            `[${new Date().toISOString()}] fastTemplateValidationFailed=true`,
            `[${new Date().toISOString()}] fastTemplateRepairAttempted=true`,
            `[${new Date().toISOString()}] validationSummary=${validationSummary}`,
            `[${new Date().toISOString()}] blankSlides=${templateApplyResult.blankSlideCount ?? 0}`,
          ].join('\n') + '\n',
        )
        repairAttempted = true
        assertArtifactJobNotCanceled(job.id, 'before-fast-template-repair')
        markHtmlPptProgress(job, 'postprocessing', '正在修复模板页面', {
          currentPhase: 'template-repair',
          message: 'OpenCode 输出未通过校验，正在保留模板视觉进行修复',
        })
        try {
          await runOpenCode(job, abortController, {
            kind: 'fast-template-validation-repair',
            validationSummary,
          })
          tryMaterializeFallbackOutput(job)
          const repairPostProcessed = postProcessHtmlPresentationOutput({
            jobId: job.id,
            outputDir: path.join(job.jobDir, 'output'),
            htmlPath: job.outputPath,
            title: titleFromPrompt(job.prompt),
            templateProfile: lockedSelection.templateProfile,
            candidateTemplates: lockedSelection.candidateTemplates,
            selectedTemplateSlug: lockedSelection.selectedTemplateSlug,
            fallbackUsed: lockedSelection.fallbackUsed,
            candidateTemplatesSidecar: buildCandidateTemplatesSidecar(lockedSelection),
            options,
            preserveSourceHtml: true,
            assertNotCanceled: () => assertArtifactJobNotCanceled(job.id, 'postprocess-after-fast-repair'),
          })
          renderContentModel = repairPostProcessed.contentModel
          templateApplyResult = finalizeOpencodeTemplateDrivenJobOutput({
            outputDir: path.join(job.jobDir, 'output'),
            htmlPath: job.outputPath,
            contentModel: renderContentModel,
            contentModelPath: repairPostProcessed.contentModelPath,
            templateSelection: lockedSelection,
            qualityMode: options.qualityMode,
          })
          templateApplyResult = {
            ...templateApplyResult,
            repairAttempted: true,
            repairSucceeded: Boolean(templateApplyResult.validationOk),
          }
          repairSucceeded = Boolean(templateApplyResult.validationOk)
          appendLog(
            job.logPath,
            `[${new Date().toISOString()}] fastTemplateRepairSucceeded=${String(repairSucceeded)}\n`,
          )
        } catch (repairError) {
          if (isArtifactJobCanceledError(repairError)) throw repairError
          const repairMessage = repairError instanceof Error ? repairError.message : String(repairError)
          appendLog(
            job.logPath,
            `[${new Date().toISOString()}] fastTemplateRepairFailed=true reason=${repairMessage}\n`,
          )
        }
      }
      if (options.qualityMode === 'fast' && !templateApplyResult.validationOk) {
        appendLog(
          job.logPath,
          `[${new Date().toISOString()}] fastTemplateValidationFailedAfterRepair=${String(repairAttempted)} keep=opencode-template-output blankSlides=${templateApplyResult.blankSlideCount ?? 0}\n`,
        )
      }

      const finalValidation = validateFinalHtmlSlides(
        fs.readFileSync(job.outputPath, 'utf-8'),
        { minSlides: Math.min(2, renderContentModel.slides.length) },
      )
      appendLog(
        job.logPath,
        [
          `[${new Date().toISOString()}] finalHtmlValidationOk=${String(finalValidation.ok)}`,
          `[${new Date().toISOString()}] finalHtmlSlideCount=${finalValidation.slideCount}`,
          `[${new Date().toISOString()}] finalBlankSlideCount=${finalValidation.blankSlideCount}`,
        ].join('\n'),
      )
      appendLog(
        job.logPath,
        [
          '',
          `[${new Date().toISOString()}] appliedTemplateSlug=${templateApplyResult.appliedTemplateSlug}`,
          `[${new Date().toISOString()}] templateRendererMode=${templateApplyResult.rendererMode}`,
          `[${new Date().toISOString()}] templateApplyFallbackUsed=${String(templateApplyResult.fallbackUsed)}`,
          templateApplyResult.warning
            ? `[${new Date().toISOString()}] templateApplyWarning=${templateApplyResult.warning}`
            : '',
        ].filter(Boolean).join('\n'),
      )
      jobSummary = syncJobSummaryFromTemplateApply(jobSummary, templateApplyResult, lockedSelection, options)

      const providerConfigured = await isHtmlPresentationImageProviderConfigured()
      updateArtifactJob(job.id, {
        imageStats: {
          planned: postProcessed.plannedImageCount,
          required: postProcessed.requiredImageCount,
          optional: postProcessed.optionalImageCount,
          resolvedMaxImages: resolvedBudget.maxImages,
          generated: generatedImageCount,
          placeholder: placeholderCount,
          unfilled: unfilledImageCount,
          budgetSource: resolvedBudget.source,
          providerConfigured,
        },
      })

      appendLog(
        job.logPath,
        [
          '',
          `[${new Date().toISOString()}] requestedTemplateSlug=${options.templateSlug || ''}`,
          `[${new Date().toISOString()}] selectedTemplateSlug=${postProcessed.selectedTemplateSlug}`,
          `[${new Date().toISOString()}] candidateTemplateSlugs=${postProcessed.candidateTemplateSlugs.join(',')}`,
          `[${new Date().toISOString()}] templateSelectionFallbackUsed=${String(postProcessed.fallbackUsed)}`,
          `[${new Date().toISOString()}] fallbackUsed=${String(jobSummary.fallbackUsed ?? false)}`,
          `[${new Date().toISOString()}] qualityMode=${options.qualityMode}`,
          `[${new Date().toISOString()}] skillMode=${resolveHtmlPptSkillMode(options)}`,
          `[${new Date().toISOString()}] imagePlanningEnabled=${String(postProcessed.imagePlanningEnabled)}`,
          `[${new Date().toISOString()}] imageProviderConfigured=${String(providerConfigured)}`,
          `[${new Date().toISOString()}] plannedImageCount=${postProcessed.plannedImageCount}`,
          `[${new Date().toISOString()}] requiredImageCount=${postProcessed.requiredImageCount}`,
          `[${new Date().toISOString()}] optionalImageCount=${postProcessed.optionalImageCount}`,
          `[${new Date().toISOString()}] resolvedMaxImages=${resolvedBudget.maxImages}`,
          `[${new Date().toISOString()}] budgetSource=${resolvedBudget.source}`,
          `[${new Date().toISOString()}] generatedImageCount=${generatedImageCount}`,
          `[${new Date().toISOString()}] placeholderCount=${placeholderCount}`,
          `[${new Date().toISOString()}] unfilledImageCount=${unfilledImageCount}`,
        ].join('\n'),
      )
    }

    if (!jobSummary.requestedTemplateSlug && !jobSummary.selectedTemplateSlug) {
      jobSummary = {
        ...jobSummary,
        requestedTemplateSlug: options.templateSlug || '',
        selectedTemplateSlug: candidatePayload.selectedTemplateSlug,
        selectedStyleId: chooseHtmlPptStyle(job.prompt, fs.readFileSync(job.inputPath, 'utf-8')).styleId,
        rendererMode: templateProfile.rendererMode,
      }
    }
  }

  assertArtifactJobNotCanceled(job.id, 'before-packaging')
  if (job.skillId === HTML_PPT_BEAUTIFUL_SKILL_ID) {
    markHtmlPptProgress(job, 'packaging', '正在打包预览文件', { currentPhase: 'finalizing' })
  }
  markJobPhase(job.id, 'final-check', '正在完成最终检查…')
  const finalCheckWarning = await runFinalCheck(job)
  if (finalCheckWarning) {
    appendLog(job.logPath, `[${new Date().toISOString()}] warning: ${finalCheckWarning}\n`)
  }

  assertArtifactJobNotCanceled(job.id, 'before-artifact-create')
  const latestBeforeArtifact = getArtifactJob(job.id)
  if (!latestBeforeArtifact || latestBeforeArtifact.status === 'canceled') {
    throw new ArtifactJobCanceledError(job.cancelReason || 'Artifact job canceled')
  }
  markJobPhase(job.id, 'finalizing', '正在写入预览产物…')
  const artifact = createHtmlArtifact({
    userId: job.userId,
    jobId: job.id,
    sourceFilePath: job.outputPath,
    title: titleFromPrompt(job.prompt),
    type: job.type,
    sidecarFilePaths: [
      path.join(job.jobDir, 'output', 'content-model.json'),
      path.join(job.jobDir, 'output', 'template-profile.json'),
      path.join(job.jobDir, 'output', 'candidate-templates.json'),
    ],
    sidecarDirPaths: [
      path.join(job.jobDir, 'output', 'assets'),
    ],
  })

  assertArtifactJobNotCanceled(job.id, 'before-user-file-mirror')
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
  } finally {
    clearArtifactJobRuntime(job.id)
  }

  if (job.skillId === HTML_PPT_BEAUTIFUL_SKILL_ID) {
    markHtmlPptProgress(job, 'completed', '生成完成')
  }

  logHtmlArtifactTask(job, {
    status: 'succeeded',
    timeoutMs: jobSummary.timeoutMs ?? resolveHtmlPptOpenCodeTimeoutMs({ qualityMode: presentationOptions.qualityMode }).timeoutMs,
    elapsedMs: Date.now() - startedAt,
  })

  return {
    artifactId: artifact.id,
    artifactFileUrl: `/api/artifacts/${artifact.id}/file`,
    ...jobSummary,
  }
}
