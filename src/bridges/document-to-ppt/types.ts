/**
 * bridges/document-to-ppt/types.ts
 *
 * Input/output types specific to the document→PPT bridge.
 * This bridge transforms DocumentArtifact / DocumentOutline into
 * DeckGenerationInput for the PPT module.
 *
 * IMPORTANT: This file may import from core/contracts only.
 * It must NOT import from features/document or features/ppt internals.
 */

import type { DocumentOutline } from '../../core/contracts/document'
import type { DeckGenerationInput } from '../../core/contracts/ppt'
import type { ArtifactRef } from '../../core/contracts/artifact'

/** Parameters for the document-to-ppt bridge conversion. */
export interface DocumentToDeckBridgeInput {
  /** The outline extracted from the document. */
  outline: DocumentOutline
  /** Optional source artifact reference (for audit / linking). */
  sourceArtifact?: ArtifactRef
  /** Target workspace path where the PPT artifact should be saved. */
  workspacePath: string
  /** Override PPT title (defaults to outline.title). */
  deckTitle?: string
  /** Optional PPT template id. */
  templateId?: string
}

/** Result of the bridge conversion (the DeckGenerationInput ready to send to PPT module). */
export interface DocumentToDeckBridgeResult {
  input: DeckGenerationInput
}
