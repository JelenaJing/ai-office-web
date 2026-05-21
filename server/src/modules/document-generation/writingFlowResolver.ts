import type { WritingGenerationMode, WritingWorkflowInput } from './documentGenerationTypes'
import { normalizeTemplateDocument } from './writingPromptRecipes'

export type ResolvedWritingFlow =
  | 'template-document'
  | 'legacy-assistant'

export function resolveWritingFlow(input: WritingWorkflowInput): ResolvedWritingFlow {
  const mode = input.generationMode as WritingGenerationMode | undefined
  if (mode === 'knowledge-template-document') return 'template-document'
  if (normalizeTemplateDocument(input.templateDocument)) return 'template-document'
  return 'legacy-assistant'
}

export function shouldUseKnowledgeLegacySkill(input: WritingWorkflowInput): boolean {
  const hasKb = (input.knowledgeBaseIds?.length ?? 0) > 0
  const hasTemplate = Boolean(normalizeTemplateDocument(input.templateDocument))
  const mode = input.generationMode
  return hasKb && !hasTemplate && mode !== 'knowledge-template-document'
}

export function shouldUseTemplateLegacySkill(input: WritingWorkflowInput): boolean {
  return resolveWritingFlow(input) === 'template-document'
}
