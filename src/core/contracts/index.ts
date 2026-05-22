/**
 * core/contracts/index.ts — re-exports all contracts for easy import.
 *
 * Usage: import type { DocumentOutline, DeckGenerationInput } from '@/core/contracts'
 */

export type {
  ArtifactType,
  ArtifactExport,
  ArtifactRef,
  ArtifactRecord,
} from './artifact'

export type {
  DocumentSection,
  DocumentOutline,
  DocumentArtifact,
  DocumentGenerationRequest,
} from './document'

export type {
  SlideContent,
  DeckGenerationInput,
  DeckDocument,
  DeckGenerationResult,
} from './ppt'

export type {
  FeatureNavEntry,
  FeaturePageFactory,
  FeatureRoute,
  FeatureManifest,
} from './feature'
