/**
 * bridges/document-to-ppt/convertDocumentToDeckInput.ts
 *
 * Transforms a DocumentOutline (from the document module public API)
 * into a DeckGenerationInput (for the PPT module public API).
 *
 * This is the only file allowed to know about both DocumentOutline and DeckGenerationInput.
 * Neither the document module nor the PPT module should depend on each other directly.
 *
 * IMPORTANT: imports from core/contracts only — no feature internals.
 */

import type { DocumentOutline } from '../../core/contracts/document'
import type { DeckGenerationInput, SlideContent } from '../../core/contracts/ppt'
import type { ArtifactRef } from '../../core/contracts/artifact'
import type { DocumentToDeckBridgeInput } from './types'

/**
 * Converts a document section outline into a prompt for the PPT skill.
 * The prompt is constructed from the outline title + top-level heading list,
 * giving the LLM enough context to generate a coherent slide plan.
 */
function buildDeckPrompt(outline: DocumentOutline): string {
  const headings = outline.sections.map(s => `- ${s.heading}`).join('\n')
  return `根据以下文稿大纲生成演示文稿：\n\n标题：${outline.title}\n\n章节：\n${headings}`
}

/**
 * Converts a DocumentOutline section into a SlideContent.
 * Extracts up to 6 bullet points per slide from the section's paragraphs.
 */
function sectionToSlide(section: { heading: string; paragraphs: string[] }): SlideContent {
  return {
    title: section.heading,
    bullets: section.paragraphs
      .filter(p => p.trim().length > 0)
      .slice(0, 6)
      .map(p => p.slice(0, 120)),
  }
}

/**
 * Main bridge function.
 * Converts DocumentToDeckBridgeInput into DeckGenerationInput.
 *
 * @param input - Bridge input containing document outline and options
 * @returns DeckGenerationInput ready to pass to the PPT module
 */
export function convertDocumentToDeckInput(
  input: DocumentToDeckBridgeInput,
): DeckGenerationInput {
  const { outline, sourceArtifact, workspacePath, deckTitle, templateId } = input

  const slides: SlideContent[] = outline.sections
    .slice(0, 20)
    .map(sectionToSlide)

  return {
    title: deckTitle ?? outline.title,
    prompt: buildDeckPrompt(outline),
    workspacePath,
    slides,
    templateId,
    sourceFeature: 'document',
    sourceDocumentArtifact: sourceArtifact,
  }
}

/**
 * Convenience overload: build DeckGenerationInput from a plain outline + artifact ref.
 */
export function buildDeckInputFromDocumentArtifact(
  outline: DocumentOutline,
  sourceArtifact: ArtifactRef,
  workspacePath: string,
  options?: { deckTitle?: string; templateId?: string },
): DeckGenerationInput {
  return convertDocumentToDeckInput({
    outline,
    sourceArtifact,
    workspacePath,
    deckTitle: options?.deckTitle,
    templateId: options?.templateId,
  })
}
