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
}

export interface WebDeckDocument {
  deckId: string
  title: string
  source: 'topic' | 'manuscript' | 'matter'
  templateId: string
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
  diagnostics: {
    chain: 'web-deck-document-runtime'
    steps: string[]
    partialMissing: string[]
  }
}

export type WebDeckTaskStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
