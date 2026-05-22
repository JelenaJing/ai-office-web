import { invokeLlmText, isLlmConfigured } from '../../../modules/ai-gateway'
import type { WritingWorkflowInput, WritingWorkflowResult } from './documentGenerationTypes'
import { markdownToHtml } from './markdownToHtml'
import {
  buildLegacyWritingAssistantSystemPrompt,
  buildLegacyWritingAssistantUserPrompt,
  resolveOutputLanguage,
} from './writingPromptRecipes'

function buildOfflineMarkdown(input: WritingWorkflowInput): string {
  const title = input.title?.trim() || '办公文稿'
  const instruction = input.instruction.trim()
  const body = input.documentText?.trim()
  if (body) {
    return `# ${title}\n\n${body}\n\n---\n\n（已按指令整理：${instruction.slice(0, 120)}）`
  }
  return `# ${title}\n\n${instruction}\n\n## 正文\n\n（LLM 未配置，请配置后重新生成。）`
}

export async function runLegacyWritingWorkflow(
  input: WritingWorkflowInput,
): Promise<WritingWorkflowResult> {
  const outputLanguage = resolveOutputLanguage(input)

  if (!isLlmConfigured()) {
    const markdown = buildOfflineMarkdown(input)
    return { markdown, html: markdownToHtml(markdown) }
  }

  const markdown = await invokeLlmText(
    [
      { role: 'system', content: buildLegacyWritingAssistantSystemPrompt(outputLanguage) },
      { role: 'user', content: buildLegacyWritingAssistantUserPrompt(input) },
    ],
    { temperature: 0.55, maxTokens: 4200 },
  )

  return { markdown, html: markdownToHtml(markdown) }
}
