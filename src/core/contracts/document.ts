/**
 * core/contracts/document.ts
 *
 * DocumentArtifact and DocumentOutline — the canonical output types
 * that the document module publishes to the outside world.
 *
 * PPT and other modules must receive document output via these types only.
 * They must NOT import document/components or document/services directly.
 */

import type { ArtifactRef } from './artifact'

// ── Document output types ─────────────────────────────────────────────────────

/** Structured outline extracted from a document (for PPT bridge etc.) */
export interface DocumentSection {
  heading: string
  paragraphs: string[]
  level?: number
}

/** Minimal outline passed across module boundaries. */
export interface DocumentOutline {
  title: string
  sections: DocumentSection[]
  /** Raw markdown content if available */
  markdown?: string
}

/** Artifact produced by the document module — used in cross-module handoff. */
export interface DocumentArtifact extends ArtifactRef {
  type: 'document'
  /** Optional inline outline for bridge consumers that don't need to re-fetch. */
  outline?: DocumentOutline
}

// ── Document input types ──────────────────────────────────────────────────────

/** Minimal input to request document generation. */
export interface DocumentGenerationRequest {
  title: string
  prompt: string
  workspacePath: string
  knowledgeBaseIds?: string[]
  fileIds?: string[]
}
