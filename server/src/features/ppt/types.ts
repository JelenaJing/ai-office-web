import type { Artifact } from '../../artifacts/ArtifactStore'
import type { GeneratedSlidePlan, SlidePlanItem } from './services/simplePptx'

export interface WebDeckSlide {
  id: string
  index: number
  type: SlidePlanItem['type'] | 'section'
  title: string
  subtitle?: string
  items: string[]
  layoutId: string
  slots: Record<string, string | string[]>
  notes?: string
  speakerNotes?: string
  layout?: string
  previewImageUrl?: string
  previewHtmlUrl?: string
  table?: {
    headers: string[]
    rows: string[][]
  }
  timeline?: Array<{ title: string; detail?: string }>
  columns?: Array<{ title: string; items: string[] }>
  quote?: {
    text: string
    author?: string
  }
  modified?: boolean
  modifiedAt?: string
  raw?: Record<string, unknown>
  diagnostics: {
    slotBinding: 'server-bound' | 'minimax-generated'
    layoutMatching: 'heuristic' | 'skill-guided'
    contentFit: {
      status: 'fit' | 'overflow-risk'
      itemCount: number
      maxRecommendedItems: number
    }
    partialMissing: string[]
  }
}

export interface WebDeckPreviewImage {
  slideId?: string
  index: number
  previewImageUrl?: string
  previewHtmlUrl?: string
}

export interface WebDeckDocument {
  deckId: string
  title: string
  source: 'topic' | 'manuscript' | 'matter'
  templateId: string
  templateManifest: {
    templateId: string
    inventoryStatus: 'available'
    layouts: string[]
    tokenUsed: false
  }
  sourceRefs: Array<{ type: 'topic' | 'matter' | 'manuscript' | 'document'; id: string; label: string }>
  artifactRefs: Array<{ artifactId: string; type: string; relation: 'export' | 'source' }>
  slides: WebDeckSlide[]
  createdAt: string
  updatedAt: string
  diagnostics: {
    chain: string
    partialMissing: string[]
  }
}

export type PptEngine = 'builtin' | 'minimax_pptx_generator' | 'slidev'
export type PptOutputMode = 'editable_pptx' | 'web_deck'

export interface WebDeckTaskResult {
  engine: PptEngine
  outputMode?: PptOutputMode
  deckId: string
  deck: WebDeckDocument
  slides: WebDeckSlide[]
  previewImages: WebDeckPreviewImage[]
  slidePlan?: GeneratedSlidePlan
  artifact: Artifact
  exportUrl: string
  previewUrl?: string
  slidevMarkdown?: string
  markdownArtifactId?: string
  htmlArtifactId?: string
  fallbackFrom?: 'minimax_pptx_generator'
  fallbackReason?: string
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

export type WebDeckTaskStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface WebDeckRuntimeMeta {
  deckId: string
  userId: string
  workspacePath: string
  engine: PptEngine
  outputMode?: PptOutputMode
  skillId: string
  artifactId: string | null
  exportUrl: string | null
  previewUrl?: string | null
  htmlArtifactId?: string | null
  updatedAt: string
}
