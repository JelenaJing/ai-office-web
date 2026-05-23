import fs from 'fs'
import os from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { saveSkillArtifact } from '../../../lib/skillArtifact'
import { invokeLlmJson, isLlmConfigured } from '../../../modules/ai-gateway'
import { buildDeckDocument } from './deckRuntime'
import { type GeneratedSlidePlan, type SlidePlanItem } from './simplePptx'
import type { WebDeckDocument, WebDeckSlide, WebDeckTaskResult } from '../types'

const execFileAsync = promisify(execFile)
const DEFAULT_OUTPUT_NAME = 'presentation.pptx'
const COMPILE_TIMEOUT_MS = 60_000
const MAX_SLIDES = 12
const MIN_SLIDES = 4

type LanguageCode = 'zh-CN' | 'en-US'
type MinimaxSlideType = 'cover' | 'toc' | 'content' | 'summary'
type LayoutVariant = 'hero' | 'agenda' | 'split' | 'cards' | 'summary' | 'timeline' | 'comparison' | 'table' | 'two-column' | 'quote' | 'section-divider'

interface MinimaxTablePlan {
  headers: string[]
  rows: string[][]
}

interface MinimaxColumnPlan {
  title: string
  items: string[]
}

interface MinimaxQuotePlan {
  text: string
  author?: string
}

interface MinimaxThemePlan {
  paletteName: string
  styleName: string
  primary: string
  secondary: string
  accent: string
  light: string
  bg: string
}

interface MinimaxSlidePlan {
  type: MinimaxSlideType
  title: string
  subtitle?: string
  bullets: string[]
  speakerNotes?: string
  layoutVariant?: LayoutVariant
  table?: MinimaxTablePlan
  timeline?: Array<{ title: string; detail?: string }>
  columns?: MinimaxColumnPlan[]
  quote?: MinimaxQuotePlan
}

interface MinimaxProjectPlan {
  title: string
  language: LanguageCode
  theme: MinimaxThemePlan
  slides: MinimaxSlidePlan[]
}

export interface RunMinimaxPptxGeneratorInput {
  userId: string
  username?: string
  workspacePath: string
  prompt: string
  title?: string
  language?: LanguageCode
  slideCount?: number
  themeId?: string
  taskId?: string
  routePath?: string
  skillId?: string
  source?: 'topic' | 'manuscript' | 'matter'
  sourceId?: string
  isCancelled?: () => boolean
  onStep?: (message: string, progress: number) => void
}

export interface EditSlideWithMinimaxInput {
  userId: string
  username?: string
  workspacePath: string
  deck: WebDeckDocument
  deckId?: string
  slideId: string
  instruction: string
  currentSlide?: Record<string, unknown> | null
  deckContext?: {
    title?: string
    slideCount?: number
    nearbySlides?: Array<Record<string, unknown>>
  }
  routePath?: string
}

function assertNotCancelled(input: Pick<RunMinimaxPptxGeneratorInput, 'isCancelled'>): void {
  if (input.isCancelled?.()) {
    const error = new Error('MiniMax PPTX Generator 任务已取消')
    error.name = 'MinimaxPptxGeneratorCancelledError'
    throw error
  }
}

function emitLog(name: string, value: string | boolean | null | undefined): void {
  console.info(`[ppt-runtime] ${name}=${value == null ? '' : String(value)}`)
}

function resolveSkillDir(): string {
  const candidates = [
    path.resolve(__dirname, '../skills/minimax-pptx-generator'),
    path.resolve(process.cwd(), 'src/features/ppt/skills/minimax-pptx-generator'),
    path.resolve(process.cwd(), 'server/src/features/ppt/skills/minimax-pptx-generator'),
  ]
  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, 'SKILL.md')) && fs.existsSync(path.join(candidate, 'references'))) {
      return candidate
    }
  }
  throw new Error(`未找到 vendored MiniMax pptx-generator skill 目录：${candidates.join(' | ')}`)
}

function readSpecBundle(): { skillSpecPath: string; contextPrompt: string } {
  const skillDir = resolveSkillDir()
  const skillSpecPath = path.join(skillDir, 'SKILL.md')
  const referencesDir = path.join(skillDir, 'references')
  const referenceFiles = fs.readdirSync(referencesDir)
    .filter((file) => file.endsWith('.md'))
    .sort()
  const skillDoc = fs.readFileSync(skillSpecPath, 'utf-8')
  const references = referenceFiles.map((file) => {
    const content = fs.readFileSync(path.join(referencesDir, file), 'utf-8')
    return `\n\n### ${file}\n${content}`
  }).join('')
  return {
    skillSpecPath,
    contextPrompt: `# Vendored MiniMax PPTX Generator Skill\n\n${skillDoc}\n\n# References${references}`,
  }
}

function clampSlideCount(input: RunMinimaxPptxGeneratorInput): number {
  const explicit = typeof input.slideCount === 'number' && Number.isFinite(input.slideCount)
    ? input.slideCount
    : Number((input.prompt.match(/(\d{1,2})\s*页/u)?.[1] || '').trim())
  if (!Number.isFinite(explicit)) return 8
  return Math.max(MIN_SLIDES, Math.min(MAX_SLIDES, Math.round(explicit)))
}

function resolveLanguage(input: RunMinimaxPptxGeneratorInput): LanguageCode {
  if (input.language === 'zh-CN' || input.language === 'en-US') return input.language
  return /[\u4e00-\u9fff]/u.test(input.prompt) ? 'zh-CN' : 'en-US'
}

function sanitizeTheme(theme: Partial<MinimaxThemePlan> | null | undefined): MinimaxThemePlan {
  const fallback: MinimaxThemePlan = {
    paletteName: 'Vibrant & Tech',
    styleName: 'Sharp',
    primary: '023047',
    secondary: '219EBC',
    accent: 'FFB703',
    light: '8ECAE6',
    bg: 'F5FAFD',
  }
  const pickHex = (value: unknown, key: keyof MinimaxThemePlan): string => {
    const normalized = String(value || '').trim().replace(/^#/, '').toUpperCase()
    return /^[0-9A-F]{6}$/.test(normalized) ? normalized : fallback[key]
  }
  return {
    paletteName: String(theme?.paletteName || fallback.paletteName).trim() || fallback.paletteName,
    styleName: String(theme?.styleName || fallback.styleName).trim() || fallback.styleName,
    primary: pickHex(theme?.primary, 'primary'),
    secondary: pickHex(theme?.secondary, 'secondary'),
    accent: pickHex(theme?.accent, 'accent'),
    light: pickHex(theme?.light, 'light'),
    bg: pickHex(theme?.bg, 'bg'),
  }
}

function normalizeBullets(value: unknown, fallback: string[] = []): string[] {
  if (!Array.isArray(value)) return fallback
  const bullets = value.map((item) => String(item || '').trim()).filter(Boolean)
  return bullets.length > 0 ? bullets : fallback
}

function normalizeText(value: unknown, fallback = ''): string {
  const text = String(value || '').trim()
  return text || fallback
}

function normalizeTable(value: unknown): MinimaxTablePlan | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const raw = value as Record<string, unknown>
  const headers = Array.isArray(raw.headers) ? raw.headers.map((item) => normalizeText(item)).filter(Boolean) : []
  const rows = Array.isArray(raw.rows)
    ? raw.rows
        .map((row) => Array.isArray(row) ? row.map((cell) => normalizeText(cell)).filter(Boolean) : [])
        .filter((row) => row.length > 0)
    : []
  if (!headers.length && !rows.length) return undefined
  return { headers, rows }
}

function normalizeTimeline(value: unknown, fallback: Array<{ title: string; detail?: string }> = []): Array<{ title: string; detail?: string }> | undefined {
  if (!Array.isArray(value)) return fallback.length > 0 ? fallback : undefined
  const items: Array<{ title: string; detail?: string }> = []
  value.forEach((entry) => {
    if (!entry || typeof entry !== 'object') return
    const raw = entry as Record<string, unknown>
    const title = normalizeText(raw.title)
    const detail = normalizeText(raw.detail)
    if (!title && !detail) return
    items.push({
      title: title || detail,
      detail: detail || undefined,
    })
  })
  return items.length > 0 ? items : (fallback.length > 0 ? fallback : undefined)
}

function normalizeColumns(value: unknown): MinimaxColumnPlan[] | undefined {
  if (!Array.isArray(value)) return undefined
  const columns = value
    .map((entry, index) => {
      if (!entry || typeof entry !== 'object') return null
      const raw = entry as Record<string, unknown>
      const title = normalizeText(raw.title, `栏目 ${index + 1}`)
      const items = Array.isArray(raw.items) ? raw.items.map((item) => normalizeText(item)).filter(Boolean) : []
      return { title, items }
    })
    .filter((item): item is MinimaxColumnPlan => Boolean(item))
  return columns.length > 0 ? columns.slice(0, 2) : undefined
}

function normalizeQuote(value: unknown): MinimaxQuotePlan | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const raw = value as Record<string, unknown>
  const text = normalizeText(raw.text)
  if (!text) return undefined
  const author = normalizeText(raw.author)
  return { text, author: author || undefined }
}

function normalizeSlideType(value: unknown, index: number, total: number): MinimaxSlideType {
  const type = String(value || '').trim()
  if (type === 'cover' || type === 'toc' || type === 'content' || type === 'summary') return type
  if (index === 0) return 'cover'
  if (index === total - 1) return 'summary'
  if (index === 1) return 'toc'
  return 'content'
}

function normalizeLayoutVariant(value: unknown, type: MinimaxSlideType): LayoutVariant {
  const candidate = String(value || '').trim()
  if (
    candidate === 'hero'
    || candidate === 'agenda'
    || candidate === 'split'
    || candidate === 'cards'
    || candidate === 'summary'
    || candidate === 'timeline'
    || candidate === 'comparison'
    || candidate === 'table'
    || candidate === 'two-column'
    || candidate === 'quote'
    || candidate === 'section-divider'
  ) {
    return candidate
  }
  if (type === 'cover') return 'hero'
  if (type === 'toc') return 'agenda'
  if (type === 'summary') return 'summary'
  return 'split'
}

function normalizeProjectPlan(candidate: unknown, input: RunMinimaxPptxGeneratorInput): MinimaxProjectPlan {
  const raw = candidate && typeof candidate === 'object' ? candidate as Record<string, unknown> : {}
  const language = resolveLanguage(input)
  const slideCount = clampSlideCount(input)
  const rawSlides = Array.isArray(raw.slides) ? raw.slides : []
  const fallback = buildFallbackProjectPlan(input, slideCount, language)

  const slides = rawSlides.map((entry, index) => {
    const slide = entry && typeof entry === 'object' ? entry as Record<string, unknown> : {}
    const type = normalizeSlideType(slide.type, index, rawSlides.length || slideCount)
    return {
      type,
      title: String(slide.title || fallback.slides[index]?.title || (language === 'zh-CN' ? `第 ${index + 1} 页` : `Slide ${index + 1}`)).trim(),
      subtitle: String(slide.subtitle || '').trim() || undefined,
      bullets: normalizeBullets(slide.bullets, fallback.slides[index]?.bullets || []),
      speakerNotes: String(slide.speakerNotes || '').trim() || undefined,
      layoutVariant: normalizeLayoutVariant(slide.layoutVariant, type),
      table: normalizeTable(slide.table),
      timeline: normalizeTimeline(slide.timeline, fallback.slides[index]?.timeline),
      columns: normalizeColumns(slide.columns),
      quote: normalizeQuote(slide.quote),
    } satisfies MinimaxSlidePlan
  }).filter((slide) => slide.title || slide.bullets.length > 0 || !!slide.table || !!slide.quote || !!slide.timeline?.length || !!slide.columns?.length)

  if (slides.length === 0) return fallback

  const normalizedSlides = normalizeSlideCount(slides, fallback.slides, slideCount, language)
  return {
    title: String(raw.title || input.title || fallback.title).trim() || fallback.title,
    language,
    theme: sanitizeTheme(raw.theme as Partial<MinimaxThemePlan> | undefined),
    slides: normalizedSlides,
  }
}

function normalizeSlideCount(
  slides: MinimaxSlidePlan[],
  fallbackSlides: MinimaxSlidePlan[],
  slideCount: number,
  language: LanguageCode,
): MinimaxSlidePlan[] {
  const working = slides.slice(0, slideCount)
  while (working.length < slideCount) {
    const fallback = fallbackSlides[working.length]
      || {
        type: working.length === slideCount - 1 ? 'summary' : 'content',
        title: language === 'zh-CN' ? `补充内容 ${working.length}` : `Additional Topic ${working.length}`,
        bullets: language === 'zh-CN' ? ['补充要点待完善'] : ['Additional key point'],
      }
    working.push(fallback)
  }
  if (working[0]) working[0].type = 'cover'
  if (working[1]) working[1].type = 'toc'
  if (working[working.length - 1]) working[working.length - 1].type = 'summary'
  return working.map((slide, index) => ({
    ...slide,
    type: normalizeSlideType(slide.type, index, working.length),
    layoutVariant: normalizeLayoutVariant(slide.layoutVariant, normalizeSlideType(slide.type, index, working.length)),
    bullets: slide.type === 'cover' ? [] : slide.bullets.slice(0, 6),
    timeline: slide.timeline?.slice(0, 5),
    table: slide.table ? {
      headers: slide.table.headers.slice(0, 4),
      rows: slide.table.rows.slice(0, 4).map((row) => row.slice(0, 4)),
    } : undefined,
    columns: slide.columns?.slice(0, 2).map((column) => ({ ...column, items: column.items.slice(0, 4) })),
  }))
}

async function buildProjectPlan(input: RunMinimaxPptxGeneratorInput, contextPrompt: string): Promise<MinimaxProjectPlan> {
  const language = resolveLanguage(input)
  const slideCount = clampSlideCount(input)
  if (!isLlmConfigured()) {
    return buildFallbackProjectPlan(input, slideCount, language)
  }

  try {
    const plan = await invokeLlmJson<MinimaxProjectPlan>([
      {
        role: 'system',
        content:
          `${contextPrompt}\n\n` +
          'You are generating a MiniMax PPTX Generator project plan. Return JSON only with this schema: ' +
          '{ "title": string, "language": "zh-CN"|"en-US", "theme": { "paletteName": string, "styleName": string, "primary": "RRGGBB", "secondary": "RRGGBB", "accent": "RRGGBB", "light": "RRGGBB", "bg": "RRGGBB" }, "slides": [{ "type": "cover"|"toc"|"content"|"summary", "title": string, "subtitle"?: string, "bullets": string[], "speakerNotes"?: string, "layoutVariant"?: "hero"|"agenda"|"split"|"cards"|"summary" }] }. ' +
          'Follow the vendored MiniMax pptx-generator contract. Do not emit code. Plan an actual deck with visual variety, 16:9, Chinese font Microsoft YaHei, English font Arial.',
      },
      {
        role: 'user',
        content: JSON.stringify({
          prompt: input.prompt,
          title: input.title,
          workspacePath: input.workspacePath,
          language,
          slideCount,
          themeId: input.themeId || null,
        }),
      },
    ], {
      temperature: 0.35,
      maxTokens: 4000,
    })
    return normalizeProjectPlan(plan, input)
  } catch {
    return buildFallbackProjectPlan(input, slideCount, language)
  }
}

function buildFallbackProjectPlan(input: RunMinimaxPptxGeneratorInput, slideCount: number, language: LanguageCode): MinimaxProjectPlan {
  const title = (input.title || input.prompt.slice(0, 40) || (language === 'zh-CN' ? '演示文稿' : 'Presentation')).trim()
  const zhSections = ['项目背景', '战略目标', '产品能力', '关键场景', '实施路径', '价值收益', '风险管控', '下一步计划', '总结建议']
  const enSections = ['Background', 'Strategic Goals', 'Capabilities', 'Key Scenarios', 'Execution Plan', 'Value', 'Risk Control', 'Next Steps', 'Recommendations']
  const sectionTitles = (language === 'zh-CN' ? zhSections : enSections).slice(0, Math.max(1, slideCount - 3))
  const promptSnippet = input.prompt.trim().slice(0, 80)
  const contentSlides = sectionTitles.map((sectionTitle, index) => ({
    type: 'content' as const,
    title: sectionTitle,
    subtitle: language === 'zh-CN' ? `围绕“${title}”的关键内容` : `Key content for ${title}`,
    bullets: language === 'zh-CN'
      ? [
          `${sectionTitle}与业务目标保持一致`,
          index === 0 && promptSnippet ? `需求摘要：${promptSnippet}` : `${sectionTitle}需量化关键指标与里程碑`,
          '建议配合图表或关键数据增强说服力',
        ]
      : [
          `${sectionTitle} aligns with the business objective`,
          index === 0 && promptSnippet ? `Prompt summary: ${promptSnippet}` : `${sectionTitle} should include metrics and milestones`,
          'Use charts or quantified evidence for credibility',
        ],
    speakerNotes: language === 'zh-CN' ? '可补充案例、数据或负责人信息。' : 'Add examples, metrics, or owner details.',
    layoutVariant: (index % 2 === 0 ? 'split' : 'cards') as LayoutVariant,
  }))

  return {
    title,
    language,
    theme: sanitizeTheme(input.themeId?.includes('dark')
      ? {
          paletteName: 'Tech & Night',
          styleName: 'Sharp',
          primary: '001D3D',
          secondary: '003566',
          accent: 'FFC300',
          light: 'FFD60A',
          bg: 'F6F8FB',
        }
      : undefined),
    slides: normalizeSlideCount([
      {
        type: 'cover',
        title,
        subtitle: language === 'zh-CN' ? 'MiniMax PPTX Generator Skill' : 'MiniMax PPTX Generator Skill',
        bullets: [],
        layoutVariant: 'hero',
      },
      {
        type: 'toc',
        title: language === 'zh-CN' ? '目录' : 'Agenda',
        bullets: sectionTitles.slice(0, 5),
        layoutVariant: 'agenda',
      },
      ...contentSlides,
      {
        type: 'summary',
        title: language === 'zh-CN' ? '总结与建议' : 'Summary & Next Steps',
        bullets: language === 'zh-CN'
          ? ['聚焦核心价值', '明确推进优先级', '建议会后继续跟进执行计划']
          : ['Highlight the core value', 'Clarify the top priorities', 'Follow up with an execution plan'],
        layoutVariant: 'summary' as const,
      },
    ], [], slideCount, language),
  }
}

function extractDeckSlideItems(slide: WebDeckSlide): string[] {
  if (Array.isArray(slide.items) && slide.items.length > 0) return slide.items.map((item) => normalizeText(item)).filter(Boolean)
  const body = slide.slots?.body
  return Array.isArray(body) ? body.map((item) => normalizeText(item)).filter(Boolean) : []
}

function deckSlideToMinimaxSlide(slide: WebDeckSlide, index: number, total: number): MinimaxSlidePlan {
  const type: MinimaxSlideType = slide.type === 'cover'
    ? 'cover'
    : slide.type === 'toc'
      ? 'toc'
      : slide.type === 'summary'
        ? 'summary'
        : index === 0
          ? 'cover'
          : index === total - 1
            ? 'summary'
            : 'content'
  const raw = slide.raw && typeof slide.raw === 'object' ? slide.raw as Record<string, unknown> : {}
  const bullets = extractDeckSlideItems(slide)
  const timeline = normalizeTimeline(slide.timeline ?? raw.timeline)
  const table = normalizeTable(slide.table ?? raw.table)
  const columns = normalizeColumns(slide.columns ?? raw.columns)
  const quote = normalizeQuote(slide.quote ?? raw.quote)
  return {
    type,
    title: slide.title || `第 ${index + 1} 页`,
    subtitle: normalizeText(slide.subtitle || raw.subtitle) || undefined,
    bullets,
    speakerNotes: normalizeText(slide.speakerNotes || slide.notes || raw.notes) || undefined,
    layoutVariant: normalizeLayoutVariant(slide.layout || raw.layout || raw.layoutVariant, type),
    table,
    timeline,
    columns,
    quote,
  }
}

function toProjectPlanFromDeck(deck: WebDeckDocument, language: LanguageCode = 'zh-CN'): MinimaxProjectPlan {
  return {
    title: deck.title,
    language,
    theme: sanitizeTheme(deck.templateId.includes('dark') ? {
      paletteName: 'Tech & Night',
      styleName: 'Sharp',
      primary: '001D3D',
      secondary: '003566',
      accent: 'FFC300',
      light: 'FFD60A',
      bg: 'F6F8FB',
    } : undefined),
    slides: deck.slides.map((slide, index) => deckSlideToMinimaxSlide(slide, index, deck.slides.length)),
  }
}

function buildEditedSlideHeuristically(current: WebDeckSlide, instruction: string, slideNumber: number): { updatedSlide: WebDeckSlide; message: string } {
  const normalized = instruction.trim()
  const items = extractDeckSlideItems(current)
  const next: WebDeckSlide = {
    ...current,
    items: [...items],
    raw: { ...(current.raw || {}) },
    modified: true,
    modifiedAt: new Date().toISOString(),
  }

  if (/正式|商务/u.test(normalized)) {
    next.title = current.title.includes('方案') ? current.title : `${current.title}方案概览`
    next.subtitle = current.subtitle || '面向管理层的正式表达'
    next.layout = 'two-column'
    next.raw = { ...next.raw, layout: 'two-column' }
    next.columns = [
      { title: '核心结论', items: next.items.slice(0, 2) },
      { title: '行动建议', items: next.items.slice(2, 4).length > 0 ? next.items.slice(2, 4) : ['明确优先级', '安排执行节奏'] },
    ]
  }
  if (/3\s*个|三点|精简|压缩/u.test(normalized)) {
    next.items = (next.items.length > 0 ? next.items : ['核心观点', '关键举措', '预期收益']).slice(0, 3)
  }
  if (/时间线/u.test(normalized)) {
    next.layout = 'timeline'
    next.raw = { ...next.raw, layout: 'timeline' }
    next.timeline = (next.items.length > 0 ? next.items : ['阶段一', '阶段二', '阶段三']).slice(0, 4).map((item, index) => ({
      title: `阶段 ${index + 1}`,
      detail: item,
    }))
  }
  if (/(对比表|表格|对比)/u.test(normalized)) {
    next.layout = 'comparison'
    next.raw = { ...next.raw, layout: 'comparison' }
    next.table = {
      headers: ['维度', '当前情况', '建议方案'],
      rows: (next.items.length > 0 ? next.items : ['价值主张', '实施方式', '预期收益']).slice(0, 3).map((item, index) => [
        `要点 ${index + 1}`,
        item,
        `优化 ${item}`,
      ]),
    }
  }
  if (/备注|讲稿/u.test(normalized)) {
    next.notes = `${current.notes || current.speakerNotes || ''}${current.notes || current.speakerNotes ? '\n' : ''}讲稿备注：请围绕本页的关键信息做 30 秒以内的管理层口播。`
    next.speakerNotes = next.notes
  }

  next.slots = {
    ...current.slots,
    title: next.title,
    subtitle: next.subtitle || '',
    body: next.items,
  }
  return {
    updatedSlide: next,
    message: `已修改第 ${slideNumber} 页`,
  }
}

function toGeneratedSlidePlan(plan: MinimaxProjectPlan): GeneratedSlidePlan {
  return {
    title: plan.title,
    slides: plan.slides.map((slide): SlidePlanItem => ({
      type: slide.type,
      title: slide.title,
      subtitle: slide.subtitle,
      items: slide.bullets.length > 0
        ? slide.bullets
        : slide.timeline?.map((item) => [item.title, item.detail].filter(Boolean).join('：'))
          || slide.table?.rows.map((row) => row.join(' / '))
          || slide.columns?.flatMap((column) => [column.title, ...column.items])
          || (slide.quote?.text ? [slide.quote.text] : []),
    })),
  }
}

function renderSlideModule(slide: MinimaxSlidePlan, index: number, _totalSlides: number, language: LanguageCode, pptxgenModulePath: string): string {
  const fileNumber = String(index + 1).padStart(2, '0')
  const fontFace = language === 'zh-CN' ? 'Microsoft YaHei' : 'Arial'
  return `const PptxGenJS = require(${JSON.stringify(pptxgenModulePath)});\n\nconst slideConfig = ${JSON.stringify({
    type: slide.type,
    index: index + 1,
    title: slide.title,
    subtitle: slide.subtitle || '',
    bullets: slide.bullets,
    speakerNotes: slide.speakerNotes || '',
    layoutVariant: slide.layoutVariant || '',
    table: slide.table || null,
    timeline: slide.timeline || [],
    columns: slide.columns || [],
    quote: slide.quote || null,
  }, null, 2)};\n\nfunction addPageBadge(slide, theme) {\n  if (slideConfig.type === 'cover') return;\n  slide.addShape('roundRect', {\n    x: 9.05, y: 5.0, w: 0.55, h: 0.28,\n    fill: { color: theme.accent }, line: { color: theme.accent, transparency: 100 }, radius: 0.08,\n  });\n  slide.addText(String(slideConfig.index), {\n    x: 9.05, y: 5.02, w: 0.55, h: 0.2,\n    fontFace: ${JSON.stringify(fontFace)}, fontSize: 10, bold: true, color: theme.primary, align: 'center',\n    margin: 0,\n  });\n}\n\nfunction addBulletList(slide, theme, x, y, w) {\n  const bullets = Array.isArray(slideConfig.bullets) ? slideConfig.bullets : [];\n  bullets.slice(0, 6).forEach((item, bulletIndex) => {\n    slide.addText('• ' + item, {\n      x, y: y + bulletIndex * 0.46, w, h: 0.34,\n      fontFace: ${JSON.stringify(fontFace)}, fontSize: 17, color: theme.secondary,\n      breakLine: false, margin: 0,\n      fit: 'shrink',\n    });\n  });\n}\n\nfunction addTimeline(slide, theme) {\n  const points = Array.isArray(slideConfig.timeline) ? slideConfig.timeline : [];\n  slide.addShape('line', { x: 1.2, y: 1.6, w: 0, h: 2.6, line: { color: theme.accent, width: 2 } });\n  points.slice(0, 4).forEach((item, idx) => {\n    const y = 1.7 + idx * 0.7;\n    slide.addShape('ellipse', { x: 1.03, y: y, w: 0.18, h: 0.18, fill: { color: theme.accent }, line: { color: theme.accent, transparency: 100 } });\n    slide.addText(item.title || ('阶段 ' + (idx + 1)), {\n      x: 1.45, y: y - 0.03, w: 2.1, h: 0.22, fontFace: ${JSON.stringify(fontFace)}, fontSize: 15, bold: true, color: theme.primary, margin: 0,\n    });\n    if (item.detail) {\n      slide.addText(item.detail, {\n        x: 3.15, y: y - 0.02, w: 5.4, h: 0.26, fontFace: ${JSON.stringify(fontFace)}, fontSize: 13, color: theme.secondary, margin: 0, fit: 'shrink',\n      });\n    }\n  });\n}\n\nfunction addTable(slide, theme) {\n  const table = slideConfig.table || {};\n  const headers = Array.isArray(table.headers) ? table.headers : [];\n  const rows = Array.isArray(table.rows) ? table.rows : [];\n  const columns = Math.max(headers.length, rows[0] ? rows[0].length : 0, 3);\n  const cellW = 8 / columns;\n  const startX = 1.0;\n  const startY = 1.55;\n  headers.slice(0, columns).forEach((header, idx) => {\n    slide.addShape('rect', {\n      x: startX + idx * cellW, y: startY, w: cellW - 0.02, h: 0.42,\n      fill: { color: theme.primary }, line: { color: theme.bg, transparency: 100 },\n    });\n    slide.addText(header, {\n      x: startX + idx * cellW + 0.08, y: startY + 0.1, w: cellW - 0.18, h: 0.18,\n      fontFace: ${JSON.stringify(fontFace)}, fontSize: 12, bold: true, color: 'FFFFFF', margin: 0, align: 'center',\n    });\n  });\n  rows.slice(0, 4).forEach((row, rowIndex) => {\n    row.slice(0, columns).forEach((cell, colIndex) => {\n      const x = startX + colIndex * cellW;\n      const y = startY + 0.48 + rowIndex * 0.54;\n      slide.addShape('rect', {\n        x, y, w: cellW - 0.02, h: 0.46,\n        fill: { color: rowIndex % 2 === 0 ? 'FFFFFF' : theme.light, transparency: rowIndex % 2 === 0 ? 0 : 55 },\n        line: { color: theme.light, transparency: 10 },\n      });\n      slide.addText(String(cell || ''), {\n        x: x + 0.08, y: y + 0.12, w: cellW - 0.18, h: 0.18,\n        fontFace: ${JSON.stringify(fontFace)}, fontSize: 11, color: theme.secondary, margin: 0, fit: 'shrink', align: 'center',\n      });\n    });\n  });\n}\n\nfunction addColumns(slide, theme) {\n  const columns = Array.isArray(slideConfig.columns) ? slideConfig.columns : [];\n  columns.slice(0, 2).forEach((column, idx) => {\n    const x = 0.9 + idx * 4.25;\n    slide.addShape('roundRect', {\n      x, y: 1.5, w: 3.65, h: 2.55,\n      fill: { color: idx === 0 ? 'FFFFFF' : theme.light, transparency: idx === 0 ? 0 : 55 },\n      line: { color: theme.accent, transparency: 40 }, radius: 0.12,\n    });\n    slide.addText(column.title || ('栏目 ' + (idx + 1)), {\n      x: x + 0.16, y: 1.68, w: 3.2, h: 0.24, fontFace: ${JSON.stringify(fontFace)}, fontSize: 15, bold: true, color: theme.primary, margin: 0,\n    });\n    (Array.isArray(column.items) ? column.items : []).slice(0, 4).forEach((item, itemIndex) => {\n      slide.addText('• ' + item, {\n        x: x + 0.18, y: 2.05 + itemIndex * 0.42, w: 3.08, h: 0.24,\n        fontFace: ${JSON.stringify(fontFace)}, fontSize: 13, color: theme.secondary, margin: 0, fit: 'shrink',\n      });\n    });\n  });\n}\n\nfunction addQuote(slide, theme) {\n  const quote = slideConfig.quote || {};\n  slide.addShape('roundRect', {\n    x: 1.0, y: 1.5, w: 8.0, h: 2.55,\n    fill: { color: 'FFFFFF' }, line: { color: theme.light, transparency: 15 }, radius: 0.18,\n  });\n  slide.addText('“' + (quote.text || '') + '”', {\n    x: 1.35, y: 1.95, w: 7.2, h: 0.9,\n    fontFace: ${JSON.stringify(fontFace)}, fontSize: 22, bold: true, color: theme.primary, margin: 0, align: 'center', fit: 'shrink',\n  });\n  if (quote.author) {\n    slide.addText('— ' + quote.author, {\n      x: 5.95, y: 3.2, w: 2.2, h: 0.22,\n      fontFace: ${JSON.stringify(fontFace)}, fontSize: 12, color: theme.secondary, margin: 0, align: 'right',\n    });\n  }\n}\n\nfunction createSlide(pres, theme) {\n  const slide = pres.addSlide();\n  slide.background = { color: theme.bg };\n\n  if (slideConfig.type === 'cover') {\n    slide.addShape('rect', {\n      x: 0, y: 0, w: 10, h: 5.625,\n      fill: { color: theme.bg }, line: { color: theme.bg, transparency: 100 },\n    });\n    slide.addShape('rect', {\n      x: 0.55, y: 0.7, w: 0.18, h: 2.9,\n      fill: { color: theme.accent }, line: { color: theme.accent, transparency: 100 },\n    });\n    slide.addText(slideConfig.title, {\n      x: 0.95, y: 1.15, w: 7.8, h: 1.25,\n      fontFace: ${JSON.stringify(fontFace)}, fontSize: 28, bold: true, color: theme.primary,\n      fit: 'shrink', margin: 0,\n    });\n    if (slideConfig.subtitle) {\n      slide.addText(slideConfig.subtitle, {\n        x: 0.98, y: 2.55, w: 7.4, h: 0.48,\n        fontFace: ${JSON.stringify(fontFace)}, fontSize: 15, color: theme.secondary,\n        fit: 'shrink', margin: 0,\n      });\n    }\n    slide.addShape('roundRect', {\n      x: 7.55, y: 3.85, w: 1.55, h: 0.38,\n      fill: { color: theme.light }, line: { color: theme.light, transparency: 100 }, radius: 0.1,\n    });\n    slide.addText('MiniMax', {\n      x: 7.65, y: 3.93, w: 1.35, h: 0.18,\n      fontFace: 'Arial', fontSize: 10, bold: true, color: theme.primary, align: 'center', margin: 0,\n    });\n    return slide;\n  }\n\n  slide.addShape('rect', {\n    x: 0, y: 0, w: 10, h: 0.24,\n    fill: { color: theme.primary }, line: { color: theme.primary, transparency: 100 },\n  });\n  slide.addText(slideConfig.title, {\n    x: 0.62, y: 0.48, w: 7.75, h: 0.48,\n    fontFace: ${JSON.stringify(fontFace)}, fontSize: 24, bold: true, color: theme.primary,\n    fit: 'shrink', margin: 0,\n  });\n\n  if (slideConfig.layoutVariant === 'section-divider') {\n    slide.addText(slideConfig.subtitle || '', {\n      x: 1.15, y: 2.05, w: 7.6, h: 0.32,\n      fontFace: ${JSON.stringify(fontFace)}, fontSize: 14, color: theme.secondary, margin: 0, align: 'center',\n    });\n    slide.addText(String(slideConfig.index).padStart(2, '0'), {\n      x: 3.6, y: 1.1, w: 2.8, h: 0.72,\n      fontFace: 'Arial', fontSize: 34, bold: true, color: theme.accent, margin: 0, align: 'center',\n    });\n    addPageBadge(slide, theme);\n    return slide;\n  }\n\n  if (slideConfig.subtitle) {\n    slide.addText(slideConfig.subtitle, {\n      x: 0.7, y: 1.04, w: 7.2, h: 0.3,\n      fontFace: ${JSON.stringify(fontFace)}, fontSize: 12, color: theme.secondary,\n      fit: 'shrink', margin: 0,\n    });\n  }\n\n  if (slideConfig.type === 'toc') {\n    addBulletList(slide, theme, 1.0, 1.42, 7.3);\n  } else if (slideConfig.layoutVariant === 'cards') {\n    const bullets = Array.isArray(slideConfig.bullets) ? slideConfig.bullets : [];\n    bullets.slice(0, 4).forEach((item, cardIndex) => {\n      const row = Math.floor(cardIndex / 2);\n      const col = cardIndex % 2;\n      const x = 0.72 + col * 4.45;\n      const y = 1.38 + row * 1.48;\n      slide.addShape('roundRect', {\n        x, y, w: 3.9, h: 1.05,\n        fill: { color: cardIndex % 2 === 0 ? theme.light : theme.bg },\n        line: { color: theme.accent, transparency: 35 }, radius: 0.12,\n      });\n      slide.addText(item, {\n        x: x + 0.18, y: y + 0.18, w: 3.45, h: 0.62,\n        fontFace: ${JSON.stringify(fontFace)}, fontSize: 16, color: theme.secondary,\n        fit: 'shrink', margin: 0,\n      });\n    });\n  } else if (slideConfig.layoutVariant === 'timeline' && Array.isArray(slideConfig.timeline) && slideConfig.timeline.length) {\n    addTimeline(slide, theme);\n  } else if ((slideConfig.layoutVariant === 'comparison' || slideConfig.layoutVariant === 'table') && slideConfig.table) {\n    addTable(slide, theme);\n  } else if (slideConfig.layoutVariant === 'two-column' && Array.isArray(slideConfig.columns) && slideConfig.columns.length) {\n    addColumns(slide, theme);\n  } else if (slideConfig.layoutVariant === 'quote' && slideConfig.quote && slideConfig.quote.text) {\n    addQuote(slide, theme);\n  } else {\n    slide.addShape('roundRect', {\n      x: 0.72, y: 1.45, w: 8.0, h: 3.0,\n      fill: { color: 'FFFFFF', transparency: 0 }, line: { color: theme.light, transparency: 50 }, radius: 0.12,\n    });\n    addBulletList(slide, theme, 1.02, 1.8, 7.4);\n  }\n\n  if (slideConfig.type === 'summary') {\n    slide.addShape('roundRect', {\n      x: 6.95, y: 1.1, w: 2.1, h: 0.46,\n      fill: { color: theme.accent }, line: { color: theme.accent, transparency: 100 }, radius: 0.12,\n    });\n    slide.addText(${JSON.stringify(language === 'zh-CN' ? '感谢聆听' : 'Thank You')}, {\n      x: 7.02, y: 1.22, w: 1.96, h: 0.2,\n      fontFace: ${JSON.stringify(fontFace)}, fontSize: 12, bold: true, color: theme.primary, align: 'center', margin: 0,\n    });\n  }\n\n  addPageBadge(slide, theme);\n  return slide;\n}\n\nif (require.main === module) {\n  const pres = new PptxGenJS();\n  pres.layout = 'LAYOUT_16x9';\n  const theme = { primary: '023047', secondary: '219EBC', accent: 'FFB703', light: '8ECAE6', bg: 'F5FAFD' };\n  createSlide(pres, theme);\n  pres.writeFile({ fileName: ${JSON.stringify(`slide-${fileNumber}-preview.pptx`)} });\n}\n\nmodule.exports = { createSlide, slideConfig };\n`
}

function renderCompileJs(plan: MinimaxProjectPlan, pptxgenModulePath: string): string {
  return `const path = require('path');\nconst pptxgen = require(${JSON.stringify(pptxgenModulePath)});\n\nconst pres = new pptxgen();\npres.layout = 'LAYOUT_16x9';\npres.title = ${JSON.stringify(plan.title)};\npres.subject = ${JSON.stringify('Generated by MiniMax PPTX Generator Skill (vendored)')};\npres.author = ${JSON.stringify('ai-office-web')};\npres.company = ${JSON.stringify('MiniMax PPTX Generator Skill (vendored)')};\npres.lang = ${JSON.stringify(plan.language)};\n\nconst theme = ${JSON.stringify({ primary: plan.theme.primary, secondary: plan.theme.secondary, accent: plan.theme.accent, light: plan.theme.light, bg: plan.theme.bg }, null, 2)};\n\nfor (let i = 1; i <= ${plan.slides.length}; i += 1) {\n  const num = String(i).padStart(2, '0');\n  const slideModule = require(path.join(__dirname, 'slide-' + num + '.js'));\n  slideModule.createSlide(pres, theme);\n}\n\npres.writeFile({ fileName: path.join(__dirname, 'output', ${JSON.stringify(DEFAULT_OUTPUT_NAME)}) });\n`
}

function validateGeneratedFiles(slidesDir: string): void {
  const files = fs.readdirSync(slidesDir)
    .filter((file) => file.endsWith('.js'))
    .sort()
  const bannedPatterns = [
    /require\((['"])child_process\1\)/u,
    /require\((['"])fs\1\)/u,
    /require\((['"])net\1\)/u,
    /require\((['"])http\1\)/u,
    /require\((['"])https\1\)/u,
    /require\((['"])os\1\)/u,
    /process\.env/u,
  ]

  for (const file of files) {
    const content = fs.readFileSync(path.join(slidesDir, file), 'utf-8')
    const hit = bannedPatterns.find((pattern) => pattern.test(content))
    if (hit) {
      throw new Error(`安全检查失败：${file} 命中禁止模式 ${hit}`)
    }
  }
}

async function runCompileScript(slidesDir: string): Promise<string> {
  await execFileAsync(process.execPath, ['compile.js'], {
    cwd: slidesDir,
    timeout: COMPILE_TIMEOUT_MS,
    maxBuffer: 1024 * 1024,
    env: { PATH: process.env.PATH || '' },
  })
  return path.join(slidesDir, 'output', DEFAULT_OUTPUT_NAME)
}

function ensureOutputExists(outputPath: string): void {
  if (!fs.existsSync(outputPath)) {
    throw new Error(`MiniMax PPTX Generator 未生成输出文件：${outputPath}`)
  }
}

function createWorkDir(): { rootDir: string; slidesDir: string } {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-office-minimax-ppt-'))
  const slidesDir = path.join(rootDir, 'slides')
  fs.mkdirSync(path.join(slidesDir, 'output'), { recursive: true })
  return { rootDir, slidesDir }
}

function materializeProjectFiles(plan: MinimaxProjectPlan, slidesDir: string): void {
  const pptxgenModulePath = require.resolve('pptxgenjs')
  plan.slides.forEach((slide, index) => {
    const fileName = `slide-${String(index + 1).padStart(2, '0')}.js`
    fs.writeFileSync(
      path.join(slidesDir, fileName),
      renderSlideModule(slide, index, plan.slides.length, plan.language, pptxgenModulePath),
      'utf-8',
    )
  })
  fs.writeFileSync(path.join(slidesDir, 'compile.js'), renderCompileJs(plan, pptxgenModulePath), 'utf-8')
}

function toPreviewDeck(plan: MinimaxProjectPlan, deckId: string, input: RunMinimaxPptxGeneratorInput): WebDeckDocument {
  return buildDeckDocument({
    deckId,
    plan: toGeneratedSlidePlan(plan),
    templateId: input.themeId?.trim() || 'minimax-pptx-generator',
    source: input.source || 'topic',
    sourceId: input.sourceId,
    chain: 'minimax-pptx-generator',
    partialMissing: [],
  })
}

async function compileProjectPlanToArtifact(input: {
  projectPlan: MinimaxProjectPlan
  deckId: string
  userId: string
  username?: string
  workspacePath: string
  skillId: string
  sourceRefs: WebDeckDocument['sourceRefs']
}): Promise<{ artifact: WebDeckTaskResult['artifact']; exportUrl: string }> {
  const { rootDir, slidesDir } = createWorkDir()
  emitLog('workDir', rootDir)
  try {
    materializeProjectFiles(input.projectPlan, slidesDir)
    validateGeneratedFiles(slidesDir)
    const outputPath = await runCompileScript(slidesDir)
    ensureOutputExists(outputPath)
    const artifact = saveSkillArtifact({
      userId: input.userId,
      username: input.username,
      workspacePath: input.workspacePath,
      skillId: input.skillId,
      type: 'presentation',
      title: input.projectPlan.title,
      filename: `${(input.projectPlan.title || 'presentation').replace(/[^\w\u4e00-\u9fa5\-]+/g, '_').slice(0, 60) || 'presentation'}.pptx`,
      format: 'pptx',
      content: fs.readFileSync(outputPath),
      deckId: input.deckId,
      sourceRefs: input.sourceRefs.map((ref) => ({ type: ref.type, id: ref.id, label: ref.label })),
    })
    return {
      artifact,
      exportUrl: artifact.exports?.[0]?.url || `/api/artifacts/${artifact.id}/download`,
    }
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true })
  }
}

export async function exportDeckWithMinimaxPptxGenerator(input: {
  userId: string
  username?: string
  workspacePath: string
  deck: WebDeckDocument
  skillId?: string
}): Promise<{ deck: WebDeckDocument; artifact: WebDeckTaskResult['artifact']; exportUrl: string }> {
  const projectPlan = toProjectPlanFromDeck(input.deck)
  const { artifact, exportUrl } = await compileProjectPlanToArtifact({
    projectPlan,
    deckId: input.deck.deckId,
    userId: input.userId,
    username: input.username,
    workspacePath: input.workspacePath,
    skillId: input.skillId || 'minimax.pptx-generator',
    sourceRefs: input.deck.sourceRefs,
  })
  input.deck.artifactRefs = [{ artifactId: artifact.id, type: artifact.type, relation: 'export' }]
  input.deck.updatedAt = new Date().toISOString()
  return { deck: input.deck, artifact, exportUrl }
}

async function buildEditedSlideWithLlm(input: EditSlideWithMinimaxInput, contextPrompt: string, current: WebDeckSlide, slideNumber: number): Promise<{ updatedSlide: WebDeckSlide; message: string }> {
  if (!isLlmConfigured()) {
    return buildEditedSlideHeuristically(current, input.instruction, slideNumber)
  }

  try {
    const response = await invokeLlmJson<Record<string, unknown>>([
      {
        role: 'system',
        content:
          `${contextPrompt}\n\n` +
          'You are editing exactly one PPT slide for the vendored MiniMax PPTX Generator skill. ' +
          'Return JSON only with this schema: ' +
          '{ "title": string, "subtitle"?: string, "layout": "split"|"cards"|"timeline"|"comparison"|"table"|"two-column"|"quote"|"section-divider"|"summary", "bullets"?: string[], "notes"?: string, "table"?: { "headers": string[], "rows": string[][] }, "timeline"?: [{ "title": string, "detail"?: string }], "columns"?: [{ "title": string, "items": string[] }], "quote"?: { "text": string, "author"?: string }, "message": string }. ' +
          'Only rewrite the target slide. Keep the same topic, keep the deck language, and do not mention other slides.',
      },
      {
        role: 'user',
        content: JSON.stringify({
          instruction: input.instruction,
          currentSlide: input.currentSlide || current,
          deckContext: input.deckContext || {
            title: input.deck.title,
            slideCount: input.deck.slides.length,
          },
        }),
      },
    ], {
      temperature: 0.35,
      maxTokens: 2200,
    })

    const bullets = normalizeBullets(response.bullets, extractDeckSlideItems(current))
    const layout = normalizeLayoutVariant(response.layout, current.type === 'cover' ? 'cover' : current.type === 'toc' ? 'toc' : current.type === 'summary' ? 'summary' : 'content')
    const updatedSlide: WebDeckSlide = {
      ...current,
      title: normalizeText(response.title, current.title),
      subtitle: normalizeText(response.subtitle, current.subtitle || '') || undefined,
      items: bullets,
      notes: normalizeText(response.notes, current.notes || current.speakerNotes || '') || undefined,
      speakerNotes: normalizeText(response.notes, current.speakerNotes || current.notes || '') || undefined,
      layout,
      table: normalizeTable(response.table) ?? current.table,
      timeline: normalizeTimeline(response.timeline, current.timeline) ?? current.timeline,
      columns: normalizeColumns(response.columns) ?? current.columns,
      quote: normalizeQuote(response.quote) ?? current.quote,
      modified: true,
      modifiedAt: new Date().toISOString(),
      raw: {
        ...(current.raw || {}),
        layout,
        table: normalizeTable(response.table) ?? current.table ?? null,
        timeline: normalizeTimeline(response.timeline, current.timeline) ?? current.timeline ?? [],
        columns: normalizeColumns(response.columns) ?? current.columns ?? [],
        quote: normalizeQuote(response.quote) ?? current.quote ?? null,
      },
      slots: {
        ...current.slots,
        title: normalizeText(response.title, current.title),
        subtitle: normalizeText(response.subtitle, current.subtitle || ''),
        body: bullets,
      },
    }
    return {
      updatedSlide,
      message: normalizeText(response.message, `已修改第 ${slideNumber} 页`),
    }
  } catch {
    return buildEditedSlideHeuristically(current, input.instruction, slideNumber)
  }
}

export async function editSlideWithMinimaxPptxGenerator(input: EditSlideWithMinimaxInput): Promise<{
  engine: 'minimax_pptx_generator'
  deckId: string
  slideId: string
  deck: WebDeckDocument
  updatedSlide: WebDeckSlide
  artifact: WebDeckTaskResult['artifact']
  exportUrl: string
  message: string
}> {
  const { skillSpecPath, contextPrompt } = readSpecBundle()
  emitLog('engine', 'minimax_pptx_generator')
  emitLog('route', input.routePath || '/api/ppt/decks/:deckId/slides/:slideId/edit')
  emitLog('slideId', input.slideId)
  emitLog('skillId', 'minimax.pptx-generator')
  emitLog('usingMinimaxSkill', true)
  emitLog('skillSpecPath', skillSpecPath)

  const slideIndex = input.deck.slides.findIndex((slide) => slide.id === input.slideId)
  if (slideIndex < 0) {
    throw new Error('slideId 不存在')
  }
  const current = input.deck.slides[slideIndex]
  const { updatedSlide, message } = await buildEditedSlideWithLlm(input, contextPrompt, current, slideIndex + 1)
  const deck: WebDeckDocument = {
    ...input.deck,
    slides: input.deck.slides.map((slide, index) => (index === slideIndex ? updatedSlide : slide)),
    updatedAt: new Date().toISOString(),
  }
  const exported = await exportDeckWithMinimaxPptxGenerator({
    userId: input.userId,
    username: input.username,
    workspacePath: input.workspacePath,
    deck,
    skillId: 'minimax.pptx-generator',
  })
  emitLog('outputArtifactId', exported.artifact.id)
  emitLog('exportUrl', exported.exportUrl)
  return {
    engine: 'minimax_pptx_generator',
    deckId: input.deckId || deck.deckId,
    slideId: updatedSlide.id,
    deck: exported.deck,
    updatedSlide,
    artifact: exported.artifact,
    exportUrl: exported.exportUrl,
    message,
  }
}

export async function runMinimaxPptxGenerator(input: RunMinimaxPptxGeneratorInput): Promise<WebDeckTaskResult> {
  const { skillSpecPath, contextPrompt } = readSpecBundle()
  const taskId = input.taskId || `direct-skill-${Date.now()}`
  const routePath = input.routePath || '/api/skills/minimax.pptx-generator/run'
  const skillId = input.skillId || 'minimax.pptx-generator'
  const steps: string[] = []
  const emit = (message: string, progress: number) => {
    steps.push(message)
    input.onStep?.(message, progress)
  }

  emitLog('engine', 'minimax_pptx_generator')
  emitLog('route', routePath)
  emitLog('taskId', taskId)
  emitLog('skillId', skillId)
  emitLog('usingMinimaxSkill', true)
  emitLog('skillSpecPath', skillSpecPath)

  const { rootDir, slidesDir } = createWorkDir()
  emitLog('workDir', rootDir)

  try {
    assertNotCancelled(input)
    emit('读取 MiniMax skill 规范…', 10)

    const projectPlan = await buildProjectPlan(input, contextPrompt)
    assertNotCancelled(input)
    emit('生成 MiniMax PPT JS 项目…', 35)
    materializeProjectFiles(projectPlan, slidesDir)
    validateGeneratedFiles(slidesDir)

    assertNotCancelled(input)
    emit('编译 MiniMax PPTX…', 70)
    const outputPath = await runCompileScript(slidesDir)
    ensureOutputExists(outputPath)

    assertNotCancelled(input)
    emit('注册 PPT Artifact…', 90)
    const deckId = randomUUID()
    const deck = toPreviewDeck(projectPlan, deckId, input)
    const artifact = saveSkillArtifact({
      userId: input.userId,
      username: input.username,
      workspacePath: input.workspacePath,
      skillId,
      type: 'presentation',
      title: projectPlan.title,
      filename: `${(projectPlan.title || 'presentation').replace(/[^\w\u4e00-\u9fa5\-]+/g, '_').slice(0, 60) || 'presentation'}.pptx`,
      format: 'pptx',
      content: fs.readFileSync(outputPath),
      deckId,
      sourceRefs: deck.sourceRefs.map((ref) => ({ type: ref.type, id: ref.id, label: ref.label })),
    })
    const exportUrl = artifact.exports?.[0]?.url || `/api/artifacts/${artifact.id}/download`
    deck.artifactRefs = [
      { artifactId: artifact.id, type: artifact.type, relation: 'export' },
    ]

    emitLog('outputArtifactId', artifact.id)
    emitLog('exportUrl', exportUrl)

    return {
      engine: 'minimax_pptx_generator',
      deckId,
      deck,
      slides: deck.slides.length > 0 ? deck.slides : [{
        id: 'slide-1',
        index: 0,
        type: 'cover',
        title: projectPlan.title,
        items: [input.prompt.trim().slice(0, 120) || 'PPT 已生成，可下载查看完整文件。'],
        layoutId: 'cover-title-subtitle',
        slots: { title: projectPlan.title, subtitle: '', body: ['PPT 已生成，可下载查看完整文件。'] },
        diagnostics: {
          slotBinding: 'minimax-generated',
          layoutMatching: 'skill-guided',
          contentFit: { status: 'fit', itemCount: 1, maxRecommendedItems: 6 },
          partialMissing: [],
        },
      }],
      slidePlan: toGeneratedSlidePlan(projectPlan),
      artifact,
      exportUrl,
      relationships: {
        deckId,
        artifactId: artifact.id,
        sourceRefs: deck.sourceRefs,
      },
      diagnostics: {
        chain: 'minimax-pptx-generator',
        steps,
        partialMissing: [],
      },
    }
  } catch (error) {
    emitLog('error', error instanceof Error ? error.message : String(error))
    throw error
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true })
  }
}
