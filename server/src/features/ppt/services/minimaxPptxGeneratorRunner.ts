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
import type { WebDeckDocument, WebDeckTaskResult } from '../types'

const execFileAsync = promisify(execFile)
const DEFAULT_OUTPUT_NAME = 'presentation.pptx'
const COMPILE_TIMEOUT_MS = 60_000
const MAX_SLIDES = 12
const MIN_SLIDES = 4

type LanguageCode = 'zh-CN' | 'en-US'
type MinimaxSlideType = 'cover' | 'toc' | 'content' | 'summary'
type LayoutVariant = 'hero' | 'agenda' | 'split' | 'cards' | 'summary'

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
}

interface MinimaxProjectPlan {
  title: string
  language: LanguageCode
  theme: MinimaxThemePlan
  slides: MinimaxSlidePlan[]
}

export interface RunMinimaxPptxGeneratorInput {
  userId: string
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
  if (candidate === 'hero' || candidate === 'agenda' || candidate === 'split' || candidate === 'cards' || candidate === 'summary') {
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
    } satisfies MinimaxSlidePlan
  }).filter((slide) => slide.title || slide.bullets.length > 0)

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

function toGeneratedSlidePlan(plan: MinimaxProjectPlan): GeneratedSlidePlan {
  return {
    title: plan.title,
    slides: plan.slides.map((slide): SlidePlanItem => ({
      type: slide.type,
      title: slide.title,
      subtitle: slide.subtitle,
      items: slide.bullets,
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
  }, null, 2)};\n\nfunction addPageBadge(slide, theme) {\n  if (slideConfig.type === 'cover') return;\n  slide.addShape('roundRect', {\n    x: 9.05, y: 5.0, w: 0.55, h: 0.28,\n    fill: { color: theme.accent }, line: { color: theme.accent, transparency: 100 }, radius: 0.08,\n  });\n  slide.addText(String(slideConfig.index), {\n    x: 9.05, y: 5.02, w: 0.55, h: 0.2,\n    fontFace: ${JSON.stringify(fontFace)}, fontSize: 10, bold: true, color: theme.primary, align: 'center',\n    margin: 0,\n  });\n}\n\nfunction addBulletList(slide, theme, x, y, w) {\n  const bullets = Array.isArray(slideConfig.bullets) ? slideConfig.bullets : [];\n  bullets.slice(0, 6).forEach((item, bulletIndex) => {\n    slide.addText('• ' + item, {\n      x, y: y + bulletIndex * 0.46, w, h: 0.34,\n      fontFace: ${JSON.stringify(fontFace)}, fontSize: 17, color: theme.secondary,\n      breakLine: false, margin: 0,\n    });\n  });\n}\n\nfunction createSlide(pres, theme) {\n  const slide = pres.addSlide();\n  slide.background = { color: theme.bg };\n\n  if (slideConfig.type === 'cover') {\n    slide.addShape('rect', {\n      x: 0, y: 0, w: 10, h: 5.625,\n      fill: { color: theme.bg }, line: { color: theme.bg, transparency: 100 },\n    });\n    slide.addShape('rect', {\n      x: 0.55, y: 0.7, w: 0.18, h: 2.9,\n      fill: { color: theme.accent }, line: { color: theme.accent, transparency: 100 },\n    });\n    slide.addText(slideConfig.title, {\n      x: 0.95, y: 1.15, w: 7.8, h: 1.25,\n      fontFace: ${JSON.stringify(fontFace)}, fontSize: 28, bold: true, color: theme.primary,\n      fit: 'shrink', margin: 0,\n    });\n    if (slideConfig.subtitle) {\n      slide.addText(slideConfig.subtitle, {\n        x: 0.98, y: 2.55, w: 7.4, h: 0.48,\n        fontFace: ${JSON.stringify(fontFace)}, fontSize: 15, color: theme.secondary,\n        fit: 'shrink', margin: 0,\n      });\n    }\n    slide.addShape('roundRect', {\n      x: 7.55, y: 3.85, w: 1.55, h: 0.38,\n      fill: { color: theme.light }, line: { color: theme.light, transparency: 100 }, radius: 0.1,\n    });\n    slide.addText('MiniMax', {\n      x: 7.65, y: 3.93, w: 1.35, h: 0.18,\n      fontFace: 'Arial', fontSize: 10, bold: true, color: theme.primary, align: 'center', margin: 0,\n    });\n    return slide;\n  }\n\n  slide.addShape('rect', {\n    x: 0, y: 0, w: 10, h: 0.24,\n    fill: { color: theme.primary }, line: { color: theme.primary, transparency: 100 },\n  });\n  slide.addText(slideConfig.title, {\n    x: 0.62, y: 0.48, w: 7.75, h: 0.48,\n    fontFace: ${JSON.stringify(fontFace)}, fontSize: 24, bold: true, color: theme.primary,\n    fit: 'shrink', margin: 0,\n  });\n\n  if (slideConfig.type === 'toc') {\n    addBulletList(slide, theme, 1.0, 1.42, 7.3);\n  } else if (slideConfig.layoutVariant === 'cards') {\n    const bullets = Array.isArray(slideConfig.bullets) ? slideConfig.bullets : [];\n    bullets.slice(0, 4).forEach((item, cardIndex) => {\n      const row = Math.floor(cardIndex / 2);\n      const col = cardIndex % 2;\n      const x = 0.72 + col * 4.45;\n      const y = 1.38 + row * 1.48;\n      slide.addShape('roundRect', {\n        x, y, w: 3.9, h: 1.05,\n        fill: { color: cardIndex % 2 === 0 ? theme.light : theme.bg },\n        line: { color: theme.accent, transparency: 35 }, radius: 0.12,\n      });\n      slide.addText(item, {\n        x: x + 0.18, y: y + 0.18, w: 3.45, h: 0.62,\n        fontFace: ${JSON.stringify(fontFace)}, fontSize: 16, color: theme.secondary,\n        fit: 'shrink', margin: 0,\n      });\n    });\n  } else {\n    if (slideConfig.subtitle) {\n      slide.addText(slideConfig.subtitle, {\n        x: 0.7, y: 1.04, w: 6.8, h: 0.3,\n        fontFace: ${JSON.stringify(fontFace)}, fontSize: 12, color: theme.secondary,\n        fit: 'shrink', margin: 0,\n      });\n    }\n    slide.addShape('roundRect', {\n      x: 0.72, y: 1.45, w: 8.0, h: 3.0,\n      fill: { color: 'FFFFFF', transparency: 0 }, line: { color: theme.light, transparency: 50 }, radius: 0.12,\n    });\n    addBulletList(slide, theme, 1.02, 1.8, 7.4);\n  }\n\n  if (slideConfig.type === 'summary') {\n    slide.addShape('roundRect', {\n      x: 6.95, y: 1.1, w: 2.1, h: 0.46,\n      fill: { color: theme.accent }, line: { color: theme.accent, transparency: 100 }, radius: 0.12,\n    });\n    slide.addText(${JSON.stringify(language === 'zh-CN' ? '感谢聆听' : 'Thank You')}, {\n      x: 7.02, y: 1.22, w: 1.96, h: 0.2,\n      fontFace: ${JSON.stringify(fontFace)}, fontSize: 12, bold: true, color: theme.primary, align: 'center', margin: 0,\n    });\n  }\n\n  addPageBadge(slide, theme);\n  return slide;\n}\n\nif (require.main === module) {\n  const pres = new PptxGenJS();\n  pres.layout = 'LAYOUT_16x9';\n  const theme = { primary: '023047', secondary: '219EBC', accent: 'FFB703', light: '8ECAE6', bg: 'F5FAFD' };\n  createSlide(pres, theme);\n  pres.writeFile({ fileName: ${JSON.stringify(`slide-${fileNumber}-preview.pptx`)} });\n}\n\nmodule.exports = { createSlide, slideConfig };\n`
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
