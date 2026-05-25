import { randomUUID } from 'crypto'
import { saveSkillArtifact } from '../../../lib/skillArtifact'
import { buildSlidevPlanFromPrompt } from './slidevPlanBuilder'
import { buildDeckDocument, PPT_PARTIAL_MISSING } from './deckRuntime'
import { withDeckPreviewImages } from './deckRenderer'
import { compileDeckToSlidevMarkdown } from './slidevMarkdownCompiler'
import { generateSlidevHtmlPreview } from './slidevHtmlPreview'
import { buildOfficialSlidevApp } from './slidevOfficialRunner'
import { saveDeck } from './deckTaskStore'
import type { WebDeckDocument, WebDeckPreviewImage, WebDeckTaskResult } from '../types'

export interface SlidevDeckPartialSnapshot {
  deckId: string
  deck: WebDeckDocument
  slidevMarkdown?: string
  previewUrl?: string
  slidevAppUrl?: string
  slidevPreviewAccessToken?: string
  slidevPreviewMode?: 'official' | 'fallback'
  htmlArtifactId?: string
}

function resolveSlidevPreviewBundle(input: {
  deckId: string
  title: string
  slidevMarkdown: string
  deck: WebDeckDocument
  onStep?: (message: string, progress: number) => void
}): {
  htmlPreview: string
  previewUrl: string
  slidevAppUrl: string | null
  slidevPreviewAccessToken: string | null
  slidevPreviewMode: 'official' | 'fallback'
} {
  const htmlPreview = generateSlidevHtmlPreview({
    title: input.title,
    slidevMarkdown: compileDeckToSlidevMarkdown(input.deck, { mode: 'preview' }),
    deck: input.deck,
  })
  const fallbackPreviewUrl = slidevPreviewUrl(input.deckId)
  const officialEnabled = process.env.PPT_SLIDEV_OFFICIAL !== '0'
  if (!officialEnabled) {
    return {
      htmlPreview,
      previewUrl: fallbackPreviewUrl,
      slidevAppUrl: null,
      slidevPreviewAccessToken: null,
      slidevPreviewMode: 'fallback',
    }
  }

  input.onStep?.('正在构建官方 Slidev 网页应用…', 78)
  const official = buildOfficialSlidevApp({
    deckId: input.deckId,
    slidevMarkdown: input.slidevMarkdown,
  })
  if (official.success) {
    console.info(`[slidev-official] deckId=${input.deckId} appUrl=${official.appUrl}`)
    return {
      htmlPreview,
      previewUrl: official.appUrl,
      slidevAppUrl: official.appUrl,
      slidevPreviewAccessToken: official.accessToken,
      slidevPreviewMode: 'official',
    }
  }

  console.info(`[slidev-official] deckId=${input.deckId} fallback=${official.error || 'unknown'}`)
  return {
    htmlPreview,
    previewUrl: fallbackPreviewUrl,
    slidevAppUrl: null,
    slidevPreviewAccessToken: null,
    slidevPreviewMode: 'fallback',
  }
}

export interface RunSlidevDeckInput {
  userId: string
  username?: string
  workspacePath: string
  prompt: string
  title?: string
  language?: 'zh-CN' | 'en-US'
  slideCount?: number
  taskId?: string
  source?: 'topic' | 'manuscript' | 'matter'
  sourceId?: string
  isCancelled?: () => boolean
  onStep?: (message: string, progress: number) => void
  onPartial?: (snapshot: SlidevDeckPartialSnapshot) => void
}

export interface SlidevDeckResult {
  engine: 'slidev'
  outputMode: 'web_deck'
  deckId: string
  deck: WebDeckDocument
  slides: WebDeckDocument['slides']
  previewImages: WebDeckPreviewImage[]
  artifact: WebDeckTaskResult['artifact']
  exportUrl: string
  previewUrl: string
  slidevAppUrl?: string
  slidevPreviewAccessToken?: string
  slidevPreviewMode?: 'official' | 'fallback'
  slidevMarkdown: string
  markdownArtifactId: string
  htmlArtifactId: string
  relationships: {
    deckId: string
    artifactId: string
    sourceRefs: WebDeckDocument['sourceRefs']
  }
  diagnostics: {
    chain: string
    steps: string[]
    partialMissing: string[]
  }
}

interface SaveSlidevArtifactsInput {
  userId: string
  username?: string
  workspacePath: string
  deck: WebDeckDocument
  slidevMarkdown: string
  htmlPreview: string
}

interface SaveSlidevArtifactsResult {
  deck: WebDeckDocument
  artifact: WebDeckTaskResult['artifact']
  htmlArtifact: WebDeckTaskResult['artifact']
  exportUrl: string
  previewUrl: string
  markdownArtifactId: string
  htmlArtifactId: string
}

function toSafeArtifactName(title: string): string {
  return title.replace(/[^\w\u4e00-\u9fa5\-]+/g, '_').slice(0, 60) || 'presentation'
}

function slidevPreviewUrl(deckId: string): string {
  return `/api/ppt/decks/${encodeURIComponent(deckId)}/slidev-preview`
}

function escapeSvgText(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .trim()
}

function visualPalette(index: number): { start: string; end: string; accent: string; soft: string } {
  const palettes = [
    { start: '#2563eb', end: '#7c3aed', accent: '#38bdf8', soft: '#dbeafe' },
    { start: '#0f766e', end: '#14b8a6', accent: '#34d399', soft: '#ccfbf1' },
    { start: '#ea580c', end: '#f59e0b', accent: '#fb7185', soft: '#ffedd5' },
    { start: '#4f46e5', end: '#a855f7', accent: '#f472b6', soft: '#ede9fe' },
  ]
  return palettes[index % palettes.length]
}

function buildVisualSvg(input: {
  kind: 'cover' | 'cards' | 'diagram' | 'chart' | 'placeholder'
  title: string
  description?: string
  index: number
}): string {
  const palette = visualPalette(input.index)
  const title = escapeSvgText(input.title)
  const description = escapeSvgText(input.description || '')
  const gradientId = `slidev-gradient-${input.index}`
  const common = `
<defs>
  <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="${palette.start}" />
    <stop offset="100%" stop-color="${palette.end}" />
  </linearGradient>
</defs>`

  if (input.kind === 'cover') {
    return `<svg viewBox="0 0 520 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${title}">
${common}
<rect width="520" height="320" rx="28" fill="#f8fbff"/>
<circle cx="420" cy="78" r="64" fill="${palette.soft}" />
<circle cx="110" cy="250" r="92" fill="${palette.soft}" opacity="0.75" />
<rect x="58" y="56" width="220" height="208" rx="28" fill="url(#${gradientId})" opacity="0.94"/>
<rect x="290" y="74" width="160" height="18" rx="9" fill="${palette.soft}" />
<rect x="290" y="108" width="124" height="14" rx="7" fill="${palette.soft}" opacity="0.85" />
<rect x="290" y="148" width="170" height="92" rx="22" fill="#fff" stroke="${palette.soft}" />
<circle cx="336" cy="194" r="22" fill="${palette.accent}" opacity="0.24" />
<path d="M328 194h16M336 186v16" stroke="${palette.accent}" stroke-width="3" stroke-linecap="round"/>
<text x="90" y="110" fill="#fff" font-size="28" font-weight="700">${title.slice(0, 16)}</text>
<text x="90" y="150" fill="#dbeafe" font-size="14">${description.slice(0, 28)}</text>
<rect x="90" y="190" width="126" height="12" rx="6" fill="#dbeafe" opacity="0.92"/>
<rect x="90" y="214" width="156" height="12" rx="6" fill="#dbeafe" opacity="0.64"/>
</svg>`
  }

  if (input.kind === 'cards') {
    return `<svg viewBox="0 0 520 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${title}">
${common}
<rect width="520" height="320" rx="28" fill="#f8fbff"/>
<rect x="42" y="44" width="210" height="106" rx="22" fill="url(#${gradientId})" opacity="0.95" />
<rect x="268" y="44" width="210" height="106" rx="22" fill="#ffffff" stroke="${palette.soft}" />
<rect x="42" y="170" width="210" height="106" rx="22" fill="#ffffff" stroke="${palette.soft}" />
<rect x="268" y="170" width="210" height="106" rx="22" fill="${palette.soft}" opacity="0.92" />
<circle cx="86" cy="88" r="16" fill="#fff" opacity="0.86" />
<circle cx="312" cy="88" r="16" fill="${palette.accent}" opacity="0.28" />
<circle cx="86" cy="214" r="16" fill="${palette.accent}" opacity="0.22" />
<circle cx="312" cy="214" r="16" fill="#fff" opacity="0.76" />
</svg>`
  }

  if (input.kind === 'diagram') {
    return `<svg viewBox="0 0 520 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${title}">
${common}
<rect width="520" height="320" rx="28" fill="#f8fbff"/>
<path d="M118 102h78M236 102h78M354 102h48" stroke="${palette.accent}" stroke-width="8" stroke-linecap="round" opacity="0.5"/>
<rect x="54" y="68" width="112" height="68" rx="20" fill="url(#${gradientId})"/>
<rect x="188" y="68" width="112" height="68" rx="20" fill="#ffffff" stroke="${palette.soft}"/>
<rect x="322" y="68" width="112" height="68" rx="20" fill="#ffffff" stroke="${palette.soft}"/>
<rect x="154" y="196" width="212" height="78" rx="24" fill="${palette.soft}" opacity="0.88"/>
<circle cx="260" cy="175" r="18" fill="${palette.accent}" opacity="0.22"/>
</svg>`
  }

  if (input.kind === 'chart') {
    return `<svg viewBox="0 0 520 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${title}">
${common}
<rect width="520" height="320" rx="28" fill="#f8fbff"/>
<rect x="62" y="208" width="52" height="52" rx="14" fill="${palette.soft}" />
<rect x="136" y="160" width="52" height="100" rx="14" fill="${palette.accent}" opacity="0.46" />
<rect x="210" y="118" width="52" height="142" rx="14" fill="url(#${gradientId})" />
<rect x="284" y="146" width="52" height="114" rx="14" fill="${palette.soft}" />
<rect x="358" y="88" width="52" height="172" rx="14" fill="url(#${gradientId})" opacity="0.78" />
<path d="M70 122c40 22 74 18 112 0s72-22 108-10 70 14 136-40" fill="none" stroke="${palette.start}" stroke-width="8" stroke-linecap="round"/>
</svg>`
  }

  return `<svg viewBox="0 0 520 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${title}">
${common}
<rect width="520" height="320" rx="28" fill="#f8fbff"/>
<rect x="72" y="56" width="376" height="208" rx="28" fill="#ffffff" stroke="${palette.soft}" stroke-width="2"/>
<rect x="112" y="96" width="296" height="128" rx="22" fill="url(#${gradientId})" opacity="0.18"/>
<path d="M220 148h82l-34 44h52l-20 34" fill="none" stroke="${palette.start}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`
}

function normalizeVisualType(
  requested: string | undefined,
): 'svg' | 'image' | 'diagram' | 'chart' | 'cards' | 'placeholder' | undefined {
  if (!requested) return undefined
  return ['svg', 'image', 'diagram', 'chart', 'cards', 'placeholder'].includes(requested)
    ? requested as 'svg' | 'image' | 'diagram' | 'chart' | 'cards' | 'placeholder'
    : undefined
}

function inferVisualDescriptor(slide: WebDeckDocument['slides'][number], index: number): {
  visualType: 'svg' | 'image' | 'diagram' | 'chart' | 'cards' | 'placeholder'
  svgKind: 'cover' | 'cards' | 'diagram' | 'chart' | 'placeholder'
  title: string
  description: string
} {
  const layout = slide.layout || slide.layoutId || slide.type
  const firstItem = Array.isArray(slide.items) ? slide.items[0] || '' : ''
  if (slide.type === 'cover') {
    return {
      visualType: 'svg',
      svgKind: 'cover',
      title: slide.title || '演示封面',
      description: slide.subtitle || 'Hero visual',
    }
  }
  if (slide.type === 'toc' || layout === 'cards') {
    return {
      visualType: 'cards',
      svgKind: 'cards',
      title: slide.title || '目录卡片',
      description: firstItem || '章节导航',
    }
  }
  if (layout === 'timeline' || slide.timeline?.length) {
    return {
      visualType: 'diagram',
      svgKind: 'diagram',
      title: slide.title || '时间线',
      description: slide.timeline?.[0]?.title || firstItem || '阶段推进',
    }
  }
  if (layout === 'comparison' || layout === 'table' || slide.table) {
    return {
      visualType: 'chart',
      svgKind: 'chart',
      title: slide.title || '对比信息',
      description: firstItem || '关键指标对比',
    }
  }
  if (slide.type === 'summary') {
    return {
      visualType: 'cards',
      svgKind: 'cards',
      title: slide.title || '重点结论',
      description: firstItem || '下一步行动',
    }
  }
  return {
    visualType: 'svg',
    svgKind: index % 2 === 0 ? 'placeholder' : 'chart',
    title: slide.title || '内容视觉',
    description: firstItem || slide.subtitle || '图文内容',
  }
}

function withSlideVisual(
  slide: WebDeckDocument['slides'][number],
  deckTitle: string,
  index: number,
  forcedType?: 'svg' | 'image' | 'diagram' | 'chart' | 'cards' | 'placeholder',
): WebDeckDocument['slides'][number] {
  const existingType = normalizeVisualType(slide.visual?.type)
  const descriptor = inferVisualDescriptor(slide, index)
  const visualType = forcedType || existingType || descriptor.visualType
  const svgKind = visualType === 'cards'
    ? 'cards'
    : visualType === 'diagram'
      ? 'diagram'
      : visualType === 'chart'
        ? 'chart'
        : slide.type === 'cover'
          ? 'cover'
          : 'placeholder'
  const visualTitle = slide.visual?.title || descriptor.title
  const visualDescription = slide.visual?.description || descriptor.description || deckTitle
  const shouldProvideSvg = visualType !== 'image' && !slide.visual?.imageUrl
  const imagePrompt = slide.visual?.imagePrompt
    || `${deckTitle} - ${visualTitle} - ${visualDescription}`
  return {
    ...slide,
    visual: {
      type: visualType,
      title: visualTitle,
      description: visualDescription,
      imageUrl: slide.visual?.imageUrl,
      imagePrompt,
      svg: shouldProvideSvg ? buildVisualSvg({ kind: svgKind, title: visualTitle, description: visualDescription, index }) : slide.visual?.svg,
      alt: slide.visual?.alt || `${visualTitle} 视觉图`,
    },
    raw: {
      ...(slide.raw || {}),
      visual: {
        type: visualType,
        title: visualTitle,
        description: visualDescription,
      },
    },
  }
}

function decorateSlidevDeck(deck: WebDeckDocument): WebDeckDocument {
  return {
    ...deck,
    slides: deck.slides.map((slide, index) => withSlideVisual(slide, deck.title, index)),
    updatedAt: new Date().toISOString(),
  }
}

function saveSlidevArtifacts(input: SaveSlidevArtifactsInput): SaveSlidevArtifactsResult {
  const safeName = toSafeArtifactName(input.deck.title)
  const markdownArtifact = saveSkillArtifact({
    userId: input.userId,
    username: input.username,
    workspacePath: input.workspacePath,
    skillId: 'web.ppt.slidev',
    type: 'presentation',
    title: input.deck.title,
    filename: `${safeName}.slidev.md`,
    format: 'md',
    content: input.slidevMarkdown,
    deckId: input.deck.deckId,
    sourceRefs: input.deck.sourceRefs.map((ref) => ({ type: ref.type, id: ref.id, label: ref.label })),
  })
  const htmlArtifact = saveSkillArtifact({
    userId: input.userId,
    username: input.username,
    workspacePath: input.workspacePath,
    skillId: 'web.ppt.slidev',
    type: 'presentation',
    title: `${input.deck.title} - HTML Preview`,
    filename: `${safeName}.slidev.html`,
    format: 'html',
    content: input.htmlPreview,
    deckId: input.deck.deckId,
    sourceRefs: input.deck.sourceRefs.map((ref) => ({ type: ref.type, id: ref.id, label: ref.label })),
  })
  const deck: WebDeckDocument = {
    ...input.deck,
    artifactRefs: [
      { artifactId: markdownArtifact.id, type: 'presentation', relation: 'export' },
      { artifactId: htmlArtifact.id, type: 'presentation', relation: 'export' },
    ],
    updatedAt: new Date().toISOString(),
  }
  return {
    deck,
    artifact: markdownArtifact,
    htmlArtifact,
    exportUrl: markdownArtifact.exports?.[0]?.url || `/api/ppt/decks/${input.deck.deckId}/download`,
    previewUrl: slidevPreviewUrl(input.deck.deckId),
    markdownArtifactId: markdownArtifact.id,
    htmlArtifactId: htmlArtifact.id,
  }
}

function buildDeterministicSlidevDeck(title: string, prompt: string): { title: string; slides: WebDeckDocument['slides'] } {
  const deckTitle = title || prompt.slice(0, 40) || '技术分享'
  return {
    title: deckTitle,
    slides: [
      {
        id: 'slide-1',
        index: 0,
        type: 'cover',
        title: deckTitle,
        subtitle: 'Slidev 网页演示',
        items: [],
        layoutId: 'cover-title-subtitle',
        layout: 'cover',
        slots: { title: deckTitle, subtitle: 'Slidev 网页演示', body: [] },
        speakerNotes: '欢迎参与本次分享',
        diagnostics: {
          slotBinding: 'server-bound',
          layoutMatching: 'heuristic',
          contentFit: { status: 'fit', itemCount: 0, maxRecommendedItems: 6 },
          partialMissing: [...PPT_PARTIAL_MISSING],
        },
      },
      {
        id: 'slide-2',
        index: 1,
        type: 'toc',
        title: '目录',
        items: ['背景介绍', '核心内容', '技术细节', '总结展望'],
        layoutId: 'toc-list',
        layout: 'toc-list',
        slots: { title: '目录', body: ['背景介绍', '核心内容', '技术细节', '总结展望'] },
        diagnostics: {
          slotBinding: 'server-bound',
          layoutMatching: 'heuristic',
          contentFit: { status: 'fit', itemCount: 4, maxRecommendedItems: 6 },
          partialMissing: [...PPT_PARTIAL_MISSING],
        },
      },
      {
        id: 'slide-3',
        index: 2,
        type: 'content',
        title: '管理层关注点',
        items: ['效率提升与协同提速', '流程透明与数据闭环', '投入产出与风险可控'],
        layoutId: 'title-bullets',
        layout: 'title-bullets',
        slots: { title: '管理层关注点', body: ['效率提升与协同提速', '流程透明与数据闭环', '投入产出与风险可控'] },
        diagnostics: {
          slotBinding: 'server-bound',
          layoutMatching: 'heuristic',
          contentFit: { status: 'fit', itemCount: 3, maxRecommendedItems: 6 },
          partialMissing: [...PPT_PARTIAL_MISSING],
        },
      },
      {
        id: 'slide-4',
        index: 3,
        type: 'content',
        title: '落地路径',
        items: ['梳理流程与角色', '接入统一工作台', '沉淀数据与模板', '扩展到跨部门协作'],
        layoutId: 'timeline',
        layout: 'timeline',
        timeline: [
          { title: '阶段 1', detail: '梳理流程与角色' },
          { title: '阶段 2', detail: '接入统一工作台' },
          { title: '阶段 3', detail: '沉淀数据与模板' },
          { title: '阶段 4', detail: '扩展到跨部门协作' },
        ],
        slots: { title: '落地路径', body: ['梳理流程与角色', '接入统一工作台', '沉淀数据与模板', '扩展到跨部门协作'] },
        diagnostics: {
          slotBinding: 'server-bound',
          layoutMatching: 'heuristic',
          contentFit: { status: 'fit', itemCount: 4, maxRecommendedItems: 6 },
          partialMissing: [...PPT_PARTIAL_MISSING],
        },
      },
      {
        id: 'slide-5',
        index: 4,
        type: 'summary',
        title: '关键结论',
        items: ['先从高频流程切入', '用统一模板保证可复制', '下一步扩展到跨团队协同'],
        layoutId: 'cards',
        layout: 'cards',
        slots: { title: '关键结论', body: ['先从高频流程切入', '用统一模板保证可复制', '下一步扩展到跨团队协同'] },
        diagnostics: {
          slotBinding: 'server-bound',
          layoutMatching: 'heuristic',
          contentFit: { status: 'fit', itemCount: 3, maxRecommendedItems: 6 },
          partialMissing: [...PPT_PARTIAL_MISSING],
        },
      },
    ],
  }
}

export async function runSlidevDeckGenerator(input: RunSlidevDeckInput): Promise<SlidevDeckResult> {
  const steps: string[] = []
  const emit = (message: string, progress: number) => {
    steps.push(message)
    input.onStep?.(message, progress)
  }

  const now = new Date().toISOString()
  const deckId = randomUUID()
  const title = (input.title || input.prompt.slice(0, 40) || '技术分享').trim()

  console.info('[ppt-runtime] engine=slidev')
  console.info(`[ppt-runtime] deckId=${deckId}`)
  console.info(`[ppt-runtime] taskId=${input.taskId || 'n/a'}`)

  emit('正在构建 Slidev DeckDocument…', 20)

  if (input.isCancelled?.()) {
    const error = new Error('PPT 任务已取消')
    error.name = 'PptDeckTaskCancelledError'
    throw error
  }

  let deck: WebDeckDocument

  if (process.env.PPT_ACCEPTANCE_MODE === '1') {
    console.info('[ppt-runtime] slidev=deterministic-fallback')
    const det = buildDeterministicSlidevDeck(title, input.prompt)
    deck = decorateSlidevDeck({
      deckId,
      title: det.title,
      source: input.source || 'topic',
      templateId: 'slidev_default',
      templateManifest: {
        templateId: 'slidev_default',
        inventoryStatus: 'available',
        layouts: ['cover', 'toc-list', 'title-bullets'],
        tokenUsed: false,
      },
      sourceRefs: [{ type: 'topic', id: `topic:${title}`, label: title }],
      artifactRefs: [],
      slides: det.slides,
      createdAt: now,
      updatedAt: now,
      diagnostics: { chain: 'slidev-deck-runner', partialMissing: [...PPT_PARTIAL_MISSING] },
    })
  } else {
    const plan = await buildSlidevPlanFromPrompt(title, input.prompt)
    deck = decorateSlidevDeck(buildDeckDocument({
      deckId,
      plan,
      templateId: 'slidev_default',
      source: input.source || 'topic',
      sourceId: input.sourceId,
      chain: 'slidev-deck-runner',
    }))
  }

  if (input.isCancelled?.()) {
    const error = new Error('PPT 任务已取消')
    error.name = 'PptDeckTaskCancelledError'
    throw error
  }

  saveDeck(deck)
  input.onPartial?.({
    deckId: deck.deckId,
    deck,
    previewUrl: `/api/ppt/decks/${deck.deckId}/slidev-preview`,
  })

  emit('正在编译 Slidev Markdown…', 55)
  const slidevMarkdown = compileDeckToSlidevMarkdown(deck, { mode: 'official' })
  input.onPartial?.({
    deckId: deck.deckId,
    deck,
    slidevMarkdown,
    previewUrl: `/api/ppt/decks/${deck.deckId}/slidev-preview`,
  })

  emit('正在生成预览…', 70)
  const previewBundle = resolveSlidevPreviewBundle({
    deckId: deck.deckId,
    title: deck.title,
    slidevMarkdown,
    deck,
    onStep: (message, progress) => input.onStep?.(message, progress),
  })
  input.onPartial?.({
    deckId: deck.deckId,
    deck,
    slidevMarkdown,
    previewUrl: previewBundle.previewUrl,
    slidevAppUrl: previewBundle.slidevAppUrl || undefined,
    slidevPreviewAccessToken: previewBundle.slidevPreviewAccessToken || undefined,
    slidevPreviewMode: previewBundle.slidevPreviewMode,
  })

  if (input.isCancelled?.()) {
    const error = new Error('PPT 任务已取消')
    error.name = 'PptDeckTaskCancelledError'
    throw error
  }

  emit('正在保存 Slidev Markdown artifact…', 80)
  emit('正在保存 HTML 预览 artifact…', 88)
  const exported = saveSlidevArtifacts({
    userId: input.userId,
    username: input.username,
    workspacePath: input.workspacePath,
    deck,
    slidevMarkdown,
    htmlPreview: previewBundle.htmlPreview,
  })
  deck = exported.deck
  const previewImages = withDeckPreviewImages(deck).previewImages

  emit('Slidev DeckDocument 已完成', 100)
  console.info(`[ppt-runtime] markdownArtifactId=${exported.markdownArtifactId}`)
  console.info(`[ppt-runtime] htmlArtifactId=${exported.htmlArtifactId}`)
  console.info(`[ppt-runtime] exportUrl=${exported.exportUrl}`)
  console.info(`[ppt-runtime] previewUrl=${previewBundle.previewUrl}`)
  console.info(`[ppt-runtime] slidevPreviewMode=${previewBundle.slidevPreviewMode}`)

  return {
    engine: 'slidev',
    outputMode: 'web_deck',
    deckId,
    deck,
    slides: deck.slides,
    previewImages,
    artifact: exported.artifact,
    exportUrl: exported.exportUrl,
    previewUrl: previewBundle.previewUrl,
    slidevAppUrl: previewBundle.slidevAppUrl || undefined,
    slidevPreviewAccessToken: previewBundle.slidevPreviewAccessToken || undefined,
    slidevPreviewMode: previewBundle.slidevPreviewMode,
    slidevMarkdown,
    markdownArtifactId: exported.markdownArtifactId,
    htmlArtifactId: exported.htmlArtifactId,
    relationships: {
      deckId,
      artifactId: exported.markdownArtifactId,
      sourceRefs: deck.sourceRefs,
    },
    diagnostics: {
      chain: 'slidev-deck-runner',
      steps,
      partialMissing: [...PPT_PARTIAL_MISSING],
    },
  }
}

export async function editSlidevSlide(input: {
  userId: string
  username?: string
  workspacePath: string
  deck: WebDeckDocument
  deckId: string
  slideId: string
  instruction: string
}): Promise<{
  engine: 'slidev'
  outputMode: 'web_deck'
  deckId: string
  slideId: string
  deck: WebDeckDocument
  slides: WebDeckDocument['slides']
  previewImages: WebDeckPreviewImage[]
  updatedSlide: WebDeckDocument['slides'][0]
  changedSlideIds: string[]
  unchangedSlideIds: string[]
  artifact: WebDeckTaskResult['artifact']
  htmlArtifact: WebDeckTaskResult['artifact']
  exportUrl: string
  previewUrl: string
  slidevAppUrl?: string
  slidevPreviewAccessToken?: string
  slidevPreviewMode?: 'official' | 'fallback'
  slidevMarkdown: string
  htmlArtifactId: string
  message: string
}> {
  const slideIndex = input.deck.slides.findIndex((s) => s.id === input.slideId)
  if (slideIndex < 0) throw new Error(`slideId ${input.slideId} 不存在`)

  const normalized = input.instruction.trim()
  const original = input.deck.slides[slideIndex]
  const items = Array.isArray(original.items) ? [...original.items] : []

  const updatedSlide: typeof original = {
    ...original,
    modified: true,
    modifiedAt: new Date().toISOString(),
  }

  if (/时间线|timeline/iu.test(normalized)) {
    updatedSlide.layout = 'timeline'
    updatedSlide.timeline = items.slice(0, 4).map((item, i) => ({ title: `阶段 ${i + 1}`, detail: item }))
    updatedSlide.visual = withSlideVisual(updatedSlide, input.deck.title, slideIndex, 'diagram').visual
  } else if (/压缩|精简|三点|3\s*点/u.test(normalized)) {
    updatedSlide.items = (items.length > 0 ? items : ['要点一', '要点二', '要点三']).slice(0, 3)
    updatedSlide.slots = { ...updatedSlide.slots, body: updatedSlide.items }
  } else if (/正式|formal/iu.test(normalized)) {
    updatedSlide.subtitle = updatedSlide.subtitle || '正式版本'
    updatedSlide.slots = { ...updatedSlide.slots, subtitle: updatedSlide.subtitle }
  }

  if (/图文|加图片|加一个视觉图|加视觉|视觉图|示意图|图片|hero|配图/iu.test(normalized)) {
    updatedSlide.layout = /图文|排版/iu.test(normalized) ? 'two-column' : (updatedSlide.layout || 'title-bullets')
    updatedSlide.visual = withSlideVisual(updatedSlide, input.deck.title, slideIndex, /卡片/iu.test(normalized) ? 'cards' : 'placeholder').visual
  }
  if (/卡片页|卡片/iu.test(normalized)) {
    updatedSlide.layout = 'cards'
    updatedSlide.visual = withSlideVisual(updatedSlide, input.deck.title, slideIndex, 'cards').visual
  }
  if (/对比图|对比页|对比/iu.test(normalized)) {
    updatedSlide.layout = 'comparison'
    updatedSlide.table = updatedSlide.table || {
      headers: ['维度', '当前情况', '建议方案'],
      rows: (updatedSlide.items || ['效率', '协同', '风险']).slice(0, 3).map((item, idx) => [
        `要点 ${idx + 1}`,
        item,
        `优化${idx + 1}`,
      ]),
    }
    updatedSlide.visual = withSlideVisual(updatedSlide, input.deck.title, slideIndex, 'chart').visual
  }

  const normalizedSlide = withSlideVisual(updatedSlide, input.deck.title, slideIndex)

  const nextDeck: WebDeckDocument = {
    ...input.deck,
    slides: input.deck.slides.map((s, i) => i === slideIndex ? normalizedSlide : s),
    updatedAt: new Date().toISOString(),
  }

  const slidevMarkdown = compileDeckToSlidevMarkdown(nextDeck, { mode: 'official' })
  const previewBundle = resolveSlidevPreviewBundle({
    deckId: input.deckId,
    title: nextDeck.title,
    slidevMarkdown,
    deck: nextDeck,
  })

  const exported = saveSlidevArtifacts({
    userId: input.userId,
    username: input.username,
    workspacePath: input.workspacePath,
    deck: nextDeck,
    slidevMarkdown,
    htmlPreview: previewBundle.htmlPreview,
  })
  const exportedDeck = exported.deck
  const previewImages = withDeckPreviewImages(exportedDeck).previewImages

  return {
    engine: 'slidev',
    outputMode: 'web_deck',
    deckId: input.deckId,
    slideId: input.slideId,
    deck: exportedDeck,
    slides: exportedDeck.slides,
    previewImages,
    updatedSlide: exportedDeck.slides[slideIndex] || normalizedSlide,
    changedSlideIds: [input.slideId],
    unchangedSlideIds: exportedDeck.slides.filter((s) => s.id !== input.slideId).map((s) => s.id),
    artifact: exported.artifact,
    htmlArtifact: exported.htmlArtifact,
    exportUrl: exported.exportUrl,
    previewUrl: previewBundle.previewUrl,
    slidevAppUrl: previewBundle.slidevAppUrl || undefined,
    slidevPreviewAccessToken: previewBundle.slidevPreviewAccessToken || undefined,
    slidevPreviewMode: previewBundle.slidevPreviewMode,
    slidevMarkdown,
    htmlArtifactId: exported.htmlArtifactId,
    message: `已修改 Slidev 第 ${slideIndex + 1} 页（${input.slideId}）`,
  }
}

export function exportSlidevDeckArtifacts(input: {
  userId: string
  username?: string
  workspacePath: string
  deck: WebDeckDocument
}): {
  engine: 'slidev'
  outputMode: 'web_deck'
  deck: WebDeckDocument
  slides: WebDeckDocument['slides']
  artifact: WebDeckTaskResult['artifact']
  htmlArtifact: WebDeckTaskResult['artifact']
  exportUrl: string
  previewUrl: string
  slidevMarkdown: string
  markdownArtifactId: string
  htmlArtifactId: string
  message: string
} {
  const normalizedDeck = decorateSlidevDeck(input.deck)
  const slidevMarkdown = compileDeckToSlidevMarkdown(normalizedDeck, { mode: 'official' })
  const htmlPreview = generateSlidevHtmlPreview({
    title: normalizedDeck.title,
    slidevMarkdown: compileDeckToSlidevMarkdown(normalizedDeck, { mode: 'preview' }),
    deck: normalizedDeck,
  })
  const exported = saveSlidevArtifacts({
    userId: input.userId,
    username: input.username,
    workspacePath: input.workspacePath,
    deck: normalizedDeck,
    slidevMarkdown,
    htmlPreview,
  })
  return {
    engine: 'slidev',
    outputMode: 'web_deck',
    deck: exported.deck,
    slides: exported.deck.slides,
    artifact: exported.artifact,
    htmlArtifact: exported.htmlArtifact,
    exportUrl: exported.exportUrl,
    previewUrl: exported.previewUrl,
    slidevMarkdown,
    markdownArtifactId: exported.markdownArtifactId,
    htmlArtifactId: exported.htmlArtifactId,
    message: 'Slidev Markdown 与 HTML preview 已导出',
  }
}
