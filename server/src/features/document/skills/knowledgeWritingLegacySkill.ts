/**
 * web.knowledge.writing.legacy — 知识库语境下的 legacy 写作助手
 */
import { buildDocumentExtraContext } from '../../../modules/document-generation/documentContextBuilder'
import { runLegacyWritingWorkflow } from '../../../modules/document-generation/legacyWritingWorkflow'
import { markdownToHtml, parseMarkdownToDocxContent } from '../../../modules/document-generation/markdownToHtml'
import type { GeneratedDocxContent } from '../../../modules/ai-gateway'
import { runCreateDocxFromGeneratedContent, type CreateDocxInput } from './createDocxSkill'

export interface KnowledgeWritingLegacyInput {
  instruction: string
  workspacePath: string
  title?: string
  documentText?: string
  language?: 'zh' | 'en'
  extraContext?: string
  knowledgeBaseIds?: string[]
  fileIds?: string[]
}

export type KnowledgeWritingLegacyResult =
  | {
      success: true
      artifact?: import('../../../artifacts/ArtifactStore').Artifact
      data: { text: string; markdown: string; html: string; patch: { type: 'replace_document'; html: string; markdown: string } }
    }
  | { success: false; error: string }

export async function runKnowledgeWritingLegacySkill(
  input: KnowledgeWritingLegacyInput,
): Promise<KnowledgeWritingLegacyResult> {
  const instruction = String(input.instruction || '').trim()
  if (!instruction) return { success: false, error: '必须提供 instruction' }
  if (!input.workspacePath) return { success: false, error: '缺少 workspacePath' }

  const builtContext = await buildDocumentExtraContext({
    workspacePath: input.workspacePath,
    knowledgeBaseIds: input.knowledgeBaseIds,
    fileIds: input.fileIds,
    instruction,
    documentText: input.documentText,
  })
  const extraContext = [input.extraContext, builtContext].filter(Boolean).join('\n\n')

  const { markdown, html } = await runLegacyWritingWorkflow({
    instruction,
    documentText: input.documentText,
    language: input.language,
    extraContext,
    knowledgeBaseIds: input.knowledgeBaseIds,
    fileIds: input.fileIds,
    workspacePath: input.workspacePath,
    title: input.title,
  })

  const parsed = parseMarkdownToDocxContent(markdown, input.title || '办公文稿')
  const content: GeneratedDocxContent = { title: parsed.title, sections: parsed.sections }

  const docx = await runCreateDocxFromGeneratedContent(
    {
      workspacePath: input.workspacePath,
      title: input.title,
      prompt: instruction,
      params: {
        knowledgeBaseIds: input.knowledgeBaseIds,
        fileIds: input.fileIds,
      },
    },
    content,
    'web.knowledge.writing.legacy',
  )

  if (!docx.success) {
    return {
      success: true,
      data: {
        text: markdown,
        markdown,
        html,
        patch: { type: 'replace_document', html, markdown },
      },
    }
  }

  return {
    success: true,
    artifact: docx.artifact,
    data: {
      text: markdown,
      markdown,
      html,
      patch: { type: 'replace_document', html, markdown },
    },
  }
}
