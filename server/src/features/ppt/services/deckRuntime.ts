import fs from 'fs'
import os from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
import { saveSkillArtifact } from '../../../lib/skillArtifact'
import {
  buildSlidePlanFromPrompt,
  type GeneratedSlidePlan,
  type SlidePlanItem,
} from './simplePptx'
import { withDeckPreviewImages, writeDeckPptxFile } from './deckRenderer'
import type { WebDeckDocument, WebDeckPreviewImage, WebDeckSlide, WebDeckTaskResult } from '../types'

export const PPT_PARTIAL_MISSING = [
  'Electron RetemplateEngine layout matching is only represented as metadata on Web',
  'external PPT import is not yet ported to Web server',
  'slotBinder/contentPaginator are not yet used by server PPTX export',
] as const

export interface CreateDeckInput {
  userId: string
  username?: string
  workspacePath: string
  title: string
  prompt: string
  templateId?: string
  taskId?: string
  source?: 'topic' | 'manuscript' | 'matter'
  sourceId?: string
  isCancelled?: () => boolean
  onStep?: (message: string, progress: number) => void
}

export interface RetemplateDeckInput {
  userId: string
  username?: string
  workspacePath: string
  deck: WebDeckDocument
  templateId: string
  skillId?: string
}

function assertNotCancelled(input: Pick<CreateDeckInput, 'isCancelled'>): void {
  if (input.isCancelled?.()) {
    const error = new Error('PPT 任务已取消')
    error.name = 'PptDeckTaskCancelledError'
    throw error
  }
}

function normalizeItems(items: SlidePlanItem['items']): string[] {
  return Array.isArray(items) ? items.map((item) => String(item || '').trim()).filter(Boolean) : []
}

function normalizeString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function toDeckSlide(slide: SlidePlanItem, index: number): WebDeckSlide {
  const items = normalizeItems(slide.items)
  const title = String(slide.title || (index === 0 ? '封面' : `第 ${index + 1} 页`)).trim()
  const layoutId = slide.type === 'cover' ? 'cover-title-subtitle' : slide.type === 'toc' ? 'toc-list' : 'title-bullets'
  return {
    id: `slide-${index + 1}`,
    index,
    type: slide.type,
    title,
    subtitle: slide.subtitle,
    items,
    layoutId,
    slots: {
      title,
      subtitle: slide.subtitle || '',
      body: items,
    },
    notes: undefined,
    speakerNotes: undefined,
    layout: layoutId,
    raw: {
      layout: layoutId,
      bullets: items,
    },
    diagnostics: {
      slotBinding: 'server-bound',
      layoutMatching: 'heuristic',
      contentFit: {
        status: items.length > 6 ? 'overflow-risk' : 'fit',
        itemCount: items.length,
        maxRecommendedItems: 6,
      },
      partialMissing: [...PPT_PARTIAL_MISSING],
    },
  }
}

export function toGeneratedSlidePlanFromDeck(deck: WebDeckDocument): GeneratedSlidePlan {
  return {
    title: deck.title,
    slides: deck.slides.map((slide, index): SlidePlanItem => ({
      type: slide.type === 'section' ? 'content' : slide.type,
      title: slide.title || (index === 0 ? deck.title : `第 ${index + 1} 页`),
      subtitle: normalizeString(slide.subtitle),
      items: normalizeItems(slide.items?.length ? slide.items : (
        Array.isArray(slide.slots?.body) ? slide.slots.body : []
      )),
    })),
  }
}

export async function exportDeckWithBuiltin(input: {
  userId: string
  username?: string
  workspacePath: string
  deck: WebDeckDocument
  skillId?: string
}): Promise<{ artifact: WebDeckTaskResult['artifact']; exportUrl: string; deck: WebDeckDocument; previewImages: WebDeckPreviewImage[] }> {
  console.info('[ppt-runtime] render start')
  console.info(`[ppt-runtime] deckId=${input.deck.deckId}`)
  console.info(`[ppt-runtime] templateId=${input.deck.templateId}`)
  const safeName = (input.deck.title || 'presentation').replace(/[^\w\u4e00-\u9fa5\-]+/g, '_').slice(0, 60) || 'presentation'
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-office-ppt-export-'))
  const tmpPath = path.join(tmpDir, `${safeName}.pptx`)
  try {
    const rendered = withDeckPreviewImages(input.deck)
    const deck = rendered.deck
    console.info(`[ppt-runtime] previewImagesCount=${rendered.previewImages.length}`)
    console.info(`[ppt-runtime] pptxExportPath=${tmpPath}`)
    await writeDeckPptxFile(deck, tmpPath)
    const artifact = saveSkillArtifact({
      userId: input.userId,
      username: input.username,
      workspacePath: input.workspacePath,
      skillId: input.skillId || 'web.ppt.deck.create',
      type: 'presentation',
      title: deck.title,
      filename: `${safeName}.pptx`,
      format: 'pptx',
      content: fs.readFileSync(tmpPath),
      deckId: deck.deckId,
      sourceRefs: deck.sourceRefs.map((ref) => ({ type: ref.type, id: ref.id, label: ref.label })),
    })
    const exportUrl = artifact.exports?.[0]?.url || `/api/ppt/decks/${input.deck.deckId}/download`
    deck.artifactRefs = [{ artifactId: artifact.id, type: artifact.type, relation: 'export' }]
    deck.updatedAt = new Date().toISOString()
    console.info(`[ppt-runtime] outputArtifactId=${artifact.id}`)
    console.info(`[ppt-runtime] exportUrl=${exportUrl}`)
    return { artifact, exportUrl, deck, previewImages: rendered.previewImages }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.info(`[ppt-runtime] builtinExportFailed=${message}`)
    throw new Error(`内置 PPT 渲染失败：${message}`)
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
}

export function buildDeckDocument(input: {
  deckId: string
  plan: GeneratedSlidePlan
  templateId: string
  source: 'topic' | 'manuscript' | 'matter'
  sourceId?: string
  chain?: string
  partialMissing?: string[]
}): WebDeckDocument {
  const now = new Date().toISOString()
  const layouts = Array.from(new Set(input.plan.slides.map((slide, index) => toDeckSlide(slide, index).layoutId)))
  const sourceLabel = input.source === 'matter' ? 'AIOS Matter' : input.source === 'manuscript' ? 'Document manuscript' : input.plan.title
  const partialMissing = input.partialMissing ?? [...PPT_PARTIAL_MISSING]
  return {
    deckId: input.deckId,
    title: input.plan.title,
    source: input.source,
    templateId: input.templateId,
    templateManifest: {
      templateId: input.templateId,
      inventoryStatus: 'available',
      layouts,
      tokenUsed: false,
    },
    sourceRefs: [
      {
        type: input.source === 'topic' ? 'topic' : input.source,
        id: input.sourceId || `${input.source}:${input.plan.title}`,
        label: sourceLabel,
      },
    ],
    artifactRefs: [],
    slides: input.plan.slides.map(toDeckSlide),
    createdAt: now,
    updatedAt: now,
    diagnostics: {
      chain: input.chain || 'web-deck-document-runtime',
      partialMissing,
    },
  }
}

export async function createDeckFromPrompt(input: CreateDeckInput): Promise<WebDeckTaskResult> {
  const steps: string[] = []
  const emit = (message: string, progress: number) => {
    steps.push(message)
    input.onStep?.(message, progress)
  }
  console.info('[ppt-runtime] engine=builtin')
  console.info('[ppt-runtime] route=/api/ppt/decks/start')
  console.info(`[ppt-runtime] taskId=${input.taskId || 'n/a'}`)
  console.info('[ppt-runtime] skillId=web.ppt.deck.create')
  console.info('[ppt-runtime] usingMinimaxSkill=false')

  assertNotCancelled(input)
  emit('正在生成 DeckDocument 内容层…', 20)
  const plan = await buildSlidePlanFromPrompt(input.title, input.prompt)
  const deckId = randomUUID()
  const templateId = input.templateId || 'business_report'
  const deck = buildDeckDocument({
    deckId,
    plan,
    templateId,
    source: input.source || 'topic',
    sourceId: input.sourceId,
    chain: 'web-deck-document-runtime',
  })
  console.info(`[ppt-runtime] deckId=${deckId}`)

  assertNotCancelled(input)
  emit('正在渲染 DeckDocument 为 PPTX…', 70)
  const exported = await exportDeckWithBuiltin({
    userId: input.userId,
    username: input.username,
    workspacePath: input.workspacePath,
    deck,
    skillId: 'web.ppt.deck.create',
  })

  assertNotCancelled(input)
  emit('正在生成页面预览…', 85)
  emit('正在保存 PPT Artifact…', 90)
  console.info(`[ppt-runtime] previewImagesCount=${exported.previewImages.length}`)

  return {
    engine: 'builtin',
    deckId,
    deck: exported.deck,
    slides: exported.deck.slides,
    previewImages: exported.previewImages,
    slidePlan: plan,
    artifact: exported.artifact,
    exportUrl: exported.exportUrl,
    relationships: {
      deckId,
      artifactId: exported.artifact.id,
      sourceRefs: exported.deck.sourceRefs,
    },
    diagnostics: {
      chain: 'web-deck-document-runtime',
      steps: [...steps, 'preview:svg-rendered'],
      partialMissing: [...PPT_PARTIAL_MISSING],
    },
  }
}

function applyDeckTemplate(deck: WebDeckDocument, templateId: string): WebDeckDocument {
  const layouts = deck.templateManifest.layouts
  return {
    ...deck,
    templateId: templateId.trim() || deck.templateId,
    templateManifest: {
      templateId: templateId.trim() || deck.templateId,
      inventoryStatus: 'available',
      layouts,
      tokenUsed: false,
    },
    updatedAt: new Date().toISOString(),
    diagnostics: {
      chain: 'web-deck-document-runtime',
      partialMissing: [...PPT_PARTIAL_MISSING],
    },
  }
}

export async function retemplateDeck(input: RetemplateDeckInput): Promise<{
  deck: WebDeckDocument
  artifact: WebDeckTaskResult['artifact']
  exportUrl: string
  previewImages: WebDeckPreviewImage[]
  tokenUsed: false
}> {
  const nextDeck = applyDeckTemplate(input.deck, input.templateId)
  const exported = await exportDeckWithBuiltin({
    userId: input.userId,
    username: input.username,
    workspacePath: input.workspacePath,
    deck: nextDeck,
    skillId: input.skillId || 'web.ppt.deck.create',
  })
  return {
    deck: exported.deck,
    artifact: exported.artifact,
    exportUrl: exported.exportUrl,
    previewImages: exported.previewImages,
    tokenUsed: false,
  }
}
