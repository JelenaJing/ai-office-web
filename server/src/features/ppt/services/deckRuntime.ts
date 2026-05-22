import fs from 'fs'
import os from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
import { saveSkillArtifact } from '../../../lib/skillArtifact'
import {
  buildSlidePlanFromPrompt,
  writePptxFile,
  type GeneratedSlidePlan,
  type SlidePlanItem,
} from './simplePptx'
import type { WebDeckDocument, WebDeckSlide, WebDeckTaskResult } from '../types'

export const PPT_PARTIAL_MISSING = [
  'Electron RetemplateEngine layout matching is only represented as metadata on Web',
  'external PPT import is not yet ported to Web server',
  'slotBinder/contentPaginator are not yet used by server PPTX export',
] as const

export interface CreateDeckInput {
  userId: string
  workspacePath: string
  title: string
  prompt: string
  templateId?: string
  source?: 'topic' | 'manuscript' | 'matter'
  sourceId?: string
  isCancelled?: () => boolean
  onStep?: (message: string, progress: number) => void
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

function toDeckSlide(slide: SlidePlanItem, index: number): WebDeckSlide {
  const items = normalizeItems(slide.items)
  const title = String(slide.title || (index === 0 ? '封面' : `第 ${index + 1} 页`)).trim()
  return {
    id: `slide-${index + 1}`,
    index,
    type: slide.type,
    title,
    subtitle: slide.subtitle,
    items,
    layoutId: slide.type === 'cover' ? 'cover-title-subtitle' : slide.type === 'toc' ? 'toc-list' : 'title-bullets',
    slots: {
      title,
      subtitle: slide.subtitle || '',
      body: items,
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

export function buildDeckDocument(input: {
  deckId: string
  plan: GeneratedSlidePlan
  templateId: string
  source: 'topic' | 'manuscript' | 'matter'
  sourceId?: string
}): WebDeckDocument {
  const now = new Date().toISOString()
  const layouts = Array.from(new Set(input.plan.slides.map((slide, index) => toDeckSlide(slide, index).layoutId)))
  const sourceLabel = input.source === 'matter' ? 'AIOS Matter' : input.source === 'manuscript' ? 'Document manuscript' : input.plan.title
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
      chain: 'web-deck-document-runtime',
      partialMissing: [...PPT_PARTIAL_MISSING],
    },
  }
}

export async function createDeckFromPrompt(input: CreateDeckInput): Promise<WebDeckTaskResult> {
  const steps: string[] = []
  const emit = (message: string, progress: number) => {
    steps.push(message)
    input.onStep?.(message, progress)
  }

  assertNotCancelled(input)
  emit('正在生成 DeckDocument 内容层…', 20)
  const plan = await buildSlidePlanFromPrompt(input.title, input.prompt)
  const deckId = randomUUID()
  const templateId = input.templateId || 'web-default'
  const deck = buildDeckDocument({
    deckId,
    plan,
    templateId,
    source: input.source || 'topic',
    sourceId: input.sourceId,
  })

  assertNotCancelled(input)
  emit('正在渲染 DeckDocument 为 PPTX…', 70)
  const safeName = (deck.title || 'presentation').replace(/[^\w\u4e00-\u9fa5\-]+/g, '_').slice(0, 60) || 'presentation'
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-office-ppt-'))
  const tmpPath = path.join(tmpDir, `${safeName}.pptx`)
  await writePptxFile(plan, tmpPath)

  assertNotCancelled(input)
  emit('正在保存 PPT Artifact…', 90)
  const artifact = saveSkillArtifact({
    userId: input.userId,
    workspacePath: input.workspacePath,
    skillId: 'web.ppt.deck.create',
    type: 'presentation',
    title: deck.title,
    filename: `${safeName}.pptx`,
    format: 'pptx',
    content: fs.readFileSync(tmpPath),
  })
  deck.artifactRefs = [
    { artifactId: artifact.id, type: artifact.type, relation: 'export' },
  ]

  fs.rmSync(tmpDir, { recursive: true, force: true })

  return {
    deckId,
    deck,
    slidePlan: plan,
    artifact,
    relationships: {
      deckId,
      artifactId: artifact.id,
      sourceRefs: deck.sourceRefs,
    },
    diagnostics: {
      chain: 'web-deck-document-runtime',
      steps,
      partialMissing: [...PPT_PARTIAL_MISSING],
    },
  }
}

export function retemplateDeck(deck: WebDeckDocument, templateId: string): WebDeckDocument {
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
