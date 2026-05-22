import { invokeLlmText, isLlmConfigured } from '../../../modules/ai-gateway'
import type { WritingWorkflowInput, WritingWorkflowResult } from './documentGenerationTypes'
import { markdownToHtml } from './markdownToHtml'
import {
  buildTemplateAnalysisSystemPrompt,
  buildTemplateAnalysisUserPrompt,
  buildTemplateWritingSystemPrompt,
  buildTemplateWritingUserPrompt,
  normalizeTemplateDocument,
  resolveOutputLanguage,
} from './writingPromptRecipes'
import { runLegacyWritingWorkflow } from './legacyWritingWorkflow'

export async function runTemplateWritingWorkflow(
  input: WritingWorkflowInput,
): Promise<WritingWorkflowResult> {
  const templateDocument = normalizeTemplateDocument(input.templateDocument)
  if (!templateDocument) {
    throw new Error('知识库模板缺少可分析的正文内容')
  }

  if (!isLlmConfigured()) {
    return runLegacyWritingWorkflow(input)
  }

  const outputLanguage = resolveOutputLanguage(input)
  const instruction = String(input.instruction || '').trim()

  const templateAnalysis = await invokeLlmText(
    [
      { role: 'system', content: buildTemplateAnalysisSystemPrompt() },
      {
        role: 'user',
        content: buildTemplateAnalysisUserPrompt(templateDocument, instruction, outputLanguage),
      },
    ],
    { temperature: 0.3, maxTokens: 2200 },
  )

  const markdown = await invokeLlmText(
    [
      { role: 'system', content: buildTemplateWritingSystemPrompt(outputLanguage) },
      {
        role: 'user',
        content: buildTemplateWritingUserPrompt(
          { ...input, generationMode: 'knowledge-template-document' },
          templateAnalysis,
        ),
      },
    ],
    { temperature: 0.5, maxTokens: 4200 },
  )

  return { markdown, html: markdownToHtml(markdown) }
}
