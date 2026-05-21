/**
 * web.document.edit — 复用 legacy writing assistant 思路的文稿编辑
 */
import { invokeLlmText, isLlmConfigured } from '../../modules/ai-gateway'
import { buildDocumentExtraContext } from '../../modules/document-generation/documentContextBuilder'
import type { DocumentTypePreset } from '../../modules/document-generation/documentGenerationTypes'
import { runLegacyWritingWorkflow } from '../../modules/document-generation/legacyWritingWorkflow'
import { markdownFragmentToHtml, markdownToHtml } from '../../modules/document-generation/markdownToHtml'
import {
  buildInsertAtCursorSystemPrompt,
  buildInsertAtCursorUserPrompt,
  buildRewriteSelectionSystemPrompt,
  buildRewriteSelectionUserPrompt,
  resolveOutputLanguage,
} from '../../modules/document-generation/writingPromptRecipes'

export type DocumentEditMode =
  | 'rewrite_selection'
  | 'insert_at_cursor'
  | 'replace_document'
  | 'polish_document'

export interface EditDocumentInput {
  instruction: string
  mode: DocumentEditMode
  title?: string
  selectedText?: string
  selectedHtml?: string
  documentText?: string
  documentHtml?: string
  language?: 'zh' | 'en'
  outputLanguage?: 'zh-CN' | 'en-US'
  extraContext?: string
  documentTypePreset?: DocumentTypePreset | null
  templateSkillId?: string
  templateManifest?: unknown
  knowledgeBaseIds?: string[]
  fileIds?: string[]
  workspacePath?: string
}

export interface WebDocumentPatchJson {
  type: 'replace_selection' | 'insert_at_cursor' | 'replace_document' | 'append_section'
  html: string
  markdown?: string
}

export type EditDocumentResult =
  | { success: true; data: { patch: WebDocumentPatchJson } }
  | { success: false; error: string }

function mapModeToPatchType(mode: DocumentEditMode): WebDocumentPatchJson['type'] {
  if (mode === 'rewrite_selection') return 'replace_selection'
  if (mode === 'insert_at_cursor') return 'insert_at_cursor'
  return 'replace_document'
}

async function runSelectionOrInsert(
  input: EditDocumentInput,
  mode: 'rewrite_selection' | 'insert_at_cursor',
): Promise<WebDocumentPatchJson> {
  const outputLanguage = resolveOutputLanguage(input)
  const builtContext = input.workspacePath
    ? await buildDocumentExtraContext({
        workspacePath: input.workspacePath,
        knowledgeBaseIds: input.knowledgeBaseIds,
        fileIds: input.fileIds,
        instruction: input.instruction,
        documentText: input.documentText,
      })
    : ''
  const extraContext = [input.extraContext, builtContext].filter(Boolean).join('\n\n')

  if (!isLlmConfigured()) {
    if (mode === 'rewrite_selection') {
      const text = input.selectedText?.trim() || input.instruction
      return { type: 'replace_selection', html: `<p>${text}</p>`, markdown: text }
    }
    return {
      type: 'insert_at_cursor',
      html: `<p>${input.instruction}</p>`,
      markdown: input.instruction,
    }
  }

  const markdown =
    mode === 'rewrite_selection'
      ? await invokeLlmText(
          [
            { role: 'system', content: buildRewriteSelectionSystemPrompt(outputLanguage) },
            {
              role: 'user',
              content: buildRewriteSelectionUserPrompt({
                instruction: input.instruction,
                selectedText: input.selectedText || '',
                selectedHtml: input.selectedHtml,
                extraContext,
              }),
            },
          ],
          { temperature: 0.45, maxTokens: 2000 },
        )
      : await invokeLlmText(
          [
            { role: 'system', content: buildInsertAtCursorSystemPrompt(outputLanguage) },
            {
              role: 'user',
              content: buildInsertAtCursorUserPrompt({
                instruction: input.instruction,
                documentText: input.documentText,
                extraContext,
              }),
            },
          ],
          { temperature: 0.5, maxTokens: 1800 },
        )

  const html =
    mode === 'insert_at_cursor' ? markdownFragmentToHtml(markdown) : markdownFragmentToHtml(markdown)

  return { type: mapModeToPatchType(mode), html, markdown }
}

async function runFullDocumentRewrite(input: EditDocumentInput): Promise<WebDocumentPatchJson> {
  const builtContext = input.workspacePath
    ? await buildDocumentExtraContext({
        workspacePath: input.workspacePath,
        knowledgeBaseIds: input.knowledgeBaseIds,
        fileIds: input.fileIds,
        instruction: input.instruction,
        documentText: input.documentText,
      })
    : ''
  const extraContext = [input.extraContext, builtContext].filter(Boolean).join('\n\n')

  const { markdown, html } = await runLegacyWritingWorkflow({
    instruction: input.instruction,
    documentText: input.documentText,
    language: input.language,
    outputLanguage: input.outputLanguage,
    extraContext,
    documentTypePreset: input.documentTypePreset,
    title: input.title,
    knowledgeBaseIds: input.knowledgeBaseIds,
    fileIds: input.fileIds,
    workspacePath: input.workspacePath,
  })

  return { type: 'replace_document', html, markdown }
}

export async function runEditDocumentSkill(input: EditDocumentInput): Promise<EditDocumentResult> {
  const instruction = String(input.instruction || '').trim()
  if (!instruction) {
    return { success: false, error: '请输入编辑指令' }
  }

  try {
    if (input.mode === 'rewrite_selection') {
      const patch = await runSelectionOrInsert(input, 'rewrite_selection')
      return { success: true, data: { patch } }
    }
    if (input.mode === 'insert_at_cursor') {
      const patch = await runSelectionOrInsert(input, 'insert_at_cursor')
      return { success: true, data: { patch } }
    }
    const patch = await runFullDocumentRewrite(input)
    return { success: true, data: { patch } }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}
