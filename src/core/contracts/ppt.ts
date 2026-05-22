/**
 * core/contracts/ppt.ts
 *
 * DeckGenerationInput and DeckDocument — the canonical input/output types
 * for the PPT module.
 *
 * The document module and bridge must produce DeckGenerationInput.
 * The PPT module consumes DeckGenerationInput and produces DeckDocument.
 * No PPT component may be imported outside the ppt feature boundary.
 */

import type { ArtifactRef } from './artifact'

// ── PPT input contract ────────────────────────────────────────────────────────

/** Source for a deck slide. */
export interface SlideContent {
  title: string
  bullets: string[]
  notes?: string
}

/** Input required to generate a PPT deck. */
export interface DeckGenerationInput {
  title: string
  prompt: string
  workspacePath: string
  slides?: SlideContent[]
  templateId?: string
  /** Source feature that produced this input, for audit. */
  sourceFeature?: 'document' | 'aios' | 'manual' | string
  /** ArtifactRef of the source document, if generated from a document. */
  sourceDocumentArtifact?: ArtifactRef
}

// ── PPT output contract ───────────────────────────────────────────────────────

/** Artifact produced by the PPT module. */
export interface DeckDocument extends ArtifactRef {
  type: 'presentation'
  /** Number of slides in the generated deck. */
  slideCount?: number
}

/** PPT generation result passed across module boundaries. */
export interface DeckGenerationResult {
  success: true
  artifact: DeckDocument
}
