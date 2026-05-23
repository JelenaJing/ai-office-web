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

export interface WebDeckTaskResult {
  engine: 'builtin' | 'minimax_pptx_generator'
  deckId: string
  deck: WebDeckDocument
  slides: WebDeckSlide[]
  slidePlan: GeneratedSlidePlan
  artifact: Artifact
  exportUrl: string
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
