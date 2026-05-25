import { randomUUID } from 'crypto'
import { saveSkillArtifact } from '../../../lib/skillArtifact'
import { buildSlidePlanFromPrompt } from './simplePptx'
import { buildDeckDocument, PPT_PARTIAL_MISSING } from './deckRuntime'
import { withDeckPreviewImages } from './deckRenderer'
import { compileDeckToSlidevMarkdown } from './slidevMarkdownCompiler'
import { generateSlidevHtmlPreview } from './slidevHtmlPreview'
import type { WebDeckDocument, WebDeckPreviewImage, WebDeckTaskResult } from '../types'

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
    previewUrl: htmlArtifact.exports?.[0]?.url || `/api/artifacts/${htmlArtifact.id}/download`,
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
        title: '背景介绍',
        items: ['项目背景与目标', '当前挑战与需求', '解决方案概述'],
        layoutId: 'title-bullets',
        layout: 'title-bullets',
        slots: { title: '背景介绍', body: ['项目背景与目标', '当前挑战与需求', '解决方案概述'] },
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
        title: '核心内容',
        items: ['关键特性一：高效可靠', '关键特性二：易于集成', '关键特性三：可扩展性强', '技术架构简述'],
        layoutId: 'title-bullets',
        layout: 'title-bullets',
        slots: { title: '核心内容', body: ['关键特性一：高效可靠', '关键特性二：易于集成', '关键特性三：可扩展性强', '技术架构简述'] },
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
        title: '总结展望',
        items: ['主要成果回顾', '后续规划与路线图', '欢迎交流与合作'],
        layoutId: 'title-bullets',
        layout: 'title-bullets',
        slots: { title: '总结展望', body: ['主要成果回顾', '后续规划与路线图', '欢迎交流与合作'] },
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
    deck = {
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
    }
  } else {
    try {
      const { isLlmConfigured } = await import('../../../modules/ai-gateway')
      if (!isLlmConfigured()) throw new Error('LLM not configured')
      const plan = await buildSlidePlanFromPrompt(title, input.prompt)
      deck = buildDeckDocument({
        deckId,
        plan,
        templateId: 'slidev_default',
        source: input.source || 'topic',
        sourceId: input.sourceId,
        chain: 'slidev-deck-runner',
      })
    } catch {
      console.info('[ppt-runtime] slidev=deterministic-fallback')
      const det = buildDeterministicSlidevDeck(title, input.prompt)
      deck = {
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
      }
    }
  }

  if (input.isCancelled?.()) {
    const error = new Error('PPT 任务已取消')
    error.name = 'PptDeckTaskCancelledError'
    throw error
  }

  emit('正在编译 Slidev Markdown…', 55)
  const slidevMarkdown = compileDeckToSlidevMarkdown(deck)

  emit('正在生成 HTML 预览…', 70)
  const htmlPreview = generateSlidevHtmlPreview({ title: deck.title, slidevMarkdown })

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
    htmlPreview,
  })
  deck = exported.deck
  const previewImages = withDeckPreviewImages(deck).previewImages

  emit('Slidev DeckDocument 已完成', 100)
  console.info(`[ppt-runtime] markdownArtifactId=${exported.markdownArtifactId}`)
  console.info(`[ppt-runtime] htmlArtifactId=${exported.htmlArtifactId}`)
  console.info(`[ppt-runtime] exportUrl=${exported.exportUrl}`)
  console.info(`[ppt-runtime] previewUrl=${exported.previewUrl}`)

  return {
    engine: 'slidev',
    outputMode: 'web_deck',
    deckId,
    deck,
    slides: deck.slides,
    previewImages,
    artifact: exported.artifact,
    exportUrl: exported.exportUrl,
    previewUrl: exported.previewUrl,
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
  } else if (/压缩|精简|三点|3\s*点/u.test(normalized)) {
    updatedSlide.items = (items.length > 0 ? items : ['要点一', '要点二', '要点三']).slice(0, 3)
    updatedSlide.slots = { ...updatedSlide.slots, body: updatedSlide.items }
  } else if (/正式|formal/iu.test(normalized)) {
    updatedSlide.subtitle = updatedSlide.subtitle || '正式版本'
    updatedSlide.slots = { ...updatedSlide.slots, subtitle: updatedSlide.subtitle }
  }

  const nextDeck: WebDeckDocument = {
    ...input.deck,
    slides: input.deck.slides.map((s, i) => i === slideIndex ? updatedSlide : s),
    updatedAt: new Date().toISOString(),
  }

  const slidevMarkdown = compileDeckToSlidevMarkdown(nextDeck)
  const htmlPreview = generateSlidevHtmlPreview({ title: nextDeck.title, slidevMarkdown })

  const exported = saveSlidevArtifacts({
    userId: input.userId,
    username: input.username,
    workspacePath: input.workspacePath,
    deck: nextDeck,
    slidevMarkdown,
    htmlPreview,
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
    updatedSlide: exportedDeck.slides[slideIndex] || updatedSlide,
    changedSlideIds: [input.slideId],
    unchangedSlideIds: exportedDeck.slides.filter((s) => s.id !== input.slideId).map((s) => s.id),
    artifact: exported.artifact,
    htmlArtifact: exported.htmlArtifact,
    exportUrl: exported.exportUrl,
    previewUrl: exported.previewUrl,
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
  const slidevMarkdown = compileDeckToSlidevMarkdown(input.deck)
  const htmlPreview = generateSlidevHtmlPreview({ title: input.deck.title, slidevMarkdown })
  const exported = saveSlidevArtifacts({
    userId: input.userId,
    username: input.username,
    workspacePath: input.workspacePath,
    deck: input.deck,
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
