import type { Artifact } from '../../artifacts/ArtifactStore'
import type { GeneratedSlidePlan, SlidePlanItem } from './services/simplePptx'

export interface WebDeckSlide {
  id: string
  index: number
  type: SlidePlanItem['type']
  title: string
  subtitle?: string
  items: string[]
  layoutId: string
  slots: Record<string, string | string[]>
  diagnostics: {
    slotBinding: 'server-bound'
    layoutMatching: 'heuristic'
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
    chain: 'web-deck-document-runtime'
    partialMissing: string[]
  }
}

export interface WebDeckTaskResult {
  deckId: string
  deck: WebDeckDocument
  slidePlan: GeneratedSlidePlan
  artifact: Artifact
  relationships: {
    deckId: string
    artifactId: string
    sourceRefs: WebDeckDocument['sourceRefs']
  }
  diagnostics: {
    chain: 'web-deck-document-runtime'
    steps: string[]
    partialMissing: string[]
  }
}

export type WebDeckTaskStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
