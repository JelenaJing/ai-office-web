/**
 * web.document.generate — 复用 legacy writing assistant 工作流生成初稿
 */
import { buildDocumentExtraContext } from '../../modules/document-generation/documentContextBuilder'
import type {
  DocumentTypePreset,
  TemplateDocumentInput,
  WritingGenerationMode,
} from '../../modules/document-generation/documentGenerationTypes'
import { runLegacyWritingWorkflow } from '../../modules/document-generation/legacyWritingWorkflow'
import { parseMarkdownToDocxContent } from '../../modules/document-generation/markdownToHtml'
import { runTemplateWritingWorkflow } from '../../modules/document-generation/templateWritingWorkflow'
import { resolveWritingFlow } from '../../modules/document-generation/writingFlowResolver'
import type { GeneratedDocxContent } from '../../modules/ai-gateway'
import { runCreateDocxFromGeneratedContent, type CreateDocxInput } from '../docx/createDocxSkill'

export interface GenerateDocumentInput {
  instruction: string
  workspacePath: string
  title?: string
  documentText?: string
  language?: 'zh' | 'en'
  outputLanguage?: 'zh-CN' | 'en-US'
  extraContext?: string
  generationMode?: WritingGenerationMode
  templateDocument?: TemplateDocumentInput | null
  documentTypePreset?: DocumentTypePreset | null
  templateSkillId?: string
  templateManifest?: CreateDocxInput['params'] extends { templateManifest?: infer T } ? T : unknown
  knowledgeBaseIds?: string[]
  fileIds?: string[]
}

export type GenerateDocumentResult =
  | {
      success: true
      artifact: import('../../artifacts/ArtifactStore').Artifact
      data: {
        documentSession: unknown
        html: string
        markdown: string
        patch?: { type: 'replace_document'; html: string; markdown: string }
      }
    }
  | { success: false; error: string }

export async function runGenerateDocumentSkill(
  input: GenerateDocumentInput,
): Promise<GenerateDocumentResult> {
  const instruction = String(input.instruction || input.title || '').trim()
  if (!instruction) {
    return { success: false, error: '请输入生成要求' }
  }
  if (!input.workspacePath) {
    return { success: false, error: '请先选择工作区（缺少 workspacePath）' }
  }

  const builtContext = await buildDocumentExtraContext({
    workspacePath: input.workspacePath,
    knowledgeBaseIds: input.knowledgeBaseIds,
    fileIds: input.fileIds,
    instruction,
    documentText: input.documentText,
  })

  const extraContext = [input.extraContext?.trim(), builtContext].filter(Boolean).join('\n\n')

  const workflowInput = {
    instruction,
    documentText: input.documentText,
    language: input.language,
    outputLanguage: input.outputLanguage,
    extraContext,
    generationMode: input.generationMode,
    templateDocument: input.templateDocument,
    documentTypePreset: input.documentTypePreset,
    knowledgeBaseIds: input.knowledgeBaseIds,
    fileIds: input.fileIds,
    workspacePath: input.workspacePath,
    title: input.title,
  }

  const flow = resolveWritingFlow(workflowInput)
  const { markdown, html } =
    flow === 'template-document'
      ? await runTemplateWritingWorkflow(workflowInput)
      : await runLegacyWritingWorkflow(workflowInput)

  const parsed = parseMarkdownToDocxContent(markdown, input.title?.trim() || '办公文稿')
  const content: GeneratedDocxContent = {
    title: parsed.title,
    sections: parsed.sections,
  }

  const createResult = await runCreateDocxFromGeneratedContent(
    {
      workspacePath: input.workspacePath,
      title: input.title,
      prompt: instruction,
      params: {
        title: input.title,
        templateSkillId: input.templateSkillId,
        templateManifest: input.templateManifest as NonNullable<CreateDocxInput['params']>['templateManifest'],
        knowledgeBaseIds: input.knowledgeBaseIds,
        fileIds: input.fileIds,
      },
    },
    content,
    'web.document.generate',
  )

  if (!createResult.success) {
    return { success: false, error: createResult.error }
  }

  return {
    success: true,
    artifact: createResult.artifact,
    data: {
      ...createResult.data,
      html,
      markdown,
      patch: { type: 'replace_document', html, markdown },
    },
  }
}
