/**
 * web.template.document.generate.legacy — 知识库模板正式文稿（两段式）
 */
import { buildDocumentExtraContext } from '../../modules/document-generation/documentContextBuilder'
import { runTemplateWritingWorkflow } from '../../modules/document-generation/templateWritingWorkflow'
import type { TemplateDocumentInput } from '../../modules/document-generation/documentGenerationTypes'
import { parseMarkdownToDocxContent } from '../../modules/document-generation/markdownToHtml'
import type { GeneratedDocxContent } from '../../modules/ai-gateway'
import { runCreateDocxFromGeneratedContent } from '../docx/createDocxSkill'

export interface TemplateDocumentLegacyInput {
  instruction: string
  workspacePath: string
  title?: string
  templateTitle?: string
  templateExtractedText?: string
  templateOutline?: string[]
  language?: 'zh' | 'en'
  extraContext?: string
  knowledgeBaseIds?: string[]
  fileIds?: string[]
}

export type TemplateDocumentLegacyResult =
  | {
      success: true
      artifact?: import('../../artifacts/ArtifactStore').Artifact
      data: { text: string; markdown: string; html: string; patch: { type: 'replace_document'; html: string; markdown: string } }
    }
  | { success: false; error: string }

export async function runTemplateDocumentGenerateLegacySkill(
  input: TemplateDocumentLegacyInput,
): Promise<TemplateDocumentLegacyResult> {
  const instruction = String(input.instruction || '').trim()
  if (!instruction) return { success: false, error: '必须提供 instruction' }
  if (!input.workspacePath) return { success: false, error: '缺少 workspacePath' }

  const templateDocument: TemplateDocumentInput = {
    title: input.templateTitle,
    extractedText: input.templateExtractedText,
    outline: input.templateOutline,
  }

  const builtContext = await buildDocumentExtraContext({
    workspacePath: input.workspacePath,
    knowledgeBaseIds: input.knowledgeBaseIds,
    fileIds: input.fileIds,
    instruction,
  })
  const extraContext = [input.extraContext, builtContext].filter(Boolean).join('\n\n')

  const { markdown, html } = await runTemplateWritingWorkflow({
    instruction,
    language: input.language,
    extraContext,
    generationMode: 'knowledge-template-document',
    templateDocument,
    title: input.title,
    workspacePath: input.workspacePath,
  })

  const parsed = parseMarkdownToDocxContent(markdown, input.title || input.templateTitle || '办公文稿')
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
    'web.template.document.generate.legacy',
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
