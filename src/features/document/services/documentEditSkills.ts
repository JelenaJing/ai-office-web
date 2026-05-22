import { platformApi } from '../../../platform'
import type { SkillResult } from '../../../platform'
import type { DocumentEditMode } from '../webDocumentPatchTypes'
import type { WebDocumentPatch } from '../webDocumentPatchTypes'

export interface DocumentTypePresetPayload {
  id?: string
  label?: string
  promptHint?: string
}

export interface TemplateDocumentPayload {
  title?: string
  sourceType?: string
  extractedText?: string
  outline?: string[]
}

export interface DocumentGenerateInput {
  instruction: string
  workspacePath: string
  title?: string
  documentText?: string
  selectedText?: string
  selectedHtml?: string
  language?: 'zh' | 'en'
  outputLanguage?: 'zh-CN' | 'en-US'
  extraContext?: string
  generationMode?: 'default' | 'knowledge-template-document'
  templateDocument?: TemplateDocumentPayload | null
  documentTypePreset?: DocumentTypePresetPayload | null
  templateSkillId?: string
  templateManifest?: Record<string, unknown>
  knowledgeBaseIds?: string[]
  fileIds?: string[]
  currentDocumentText?: string
  /** Workflow type identifier from documentWorkflowRegistry */
  workflowId?: string
  /** Human-readable workflow label for prompt enrichment */
  workflowLabel?: string
  /** Key-value fields filled in by the user for this workflow */
  workflowFields?: Record<string, string>
  /** Recommended outline sections from the workflow registry */
  outlineSections?: string[]
  /** Document kind hint (e.g. 'academic_paper', 'formal_notice') */
  documentKind?: string
}

export interface DocumentEditInput {
  instruction: string
  mode: DocumentEditMode
  workspacePath: string
  title?: string
  selectedText?: string
  selectedHtml?: string
  documentText?: string
  documentHtml?: string
  language?: 'zh' | 'en'
  outputLanguage?: 'zh-CN' | 'en-US'
  extraContext?: string
  documentTypePreset?: DocumentTypePresetPayload | null
  templateSkillId?: string
  templateManifest?: Record<string, unknown>
  knowledgeBaseIds?: string[]
  fileIds?: string[]
}

export type DocumentSkillResult = SkillResult & {
  data?: {
    patch?: WebDocumentPatch
    documentSession?: Record<string, unknown>
    html?: string
    markdown?: string
    text?: string
    knowledgeContext?: {
      kbCount: number
      fileCount: number
      hasContext: boolean
      isRagEnabled: boolean
    }
  }
}

function buildWorkflowDocumentTypePreset(input: DocumentGenerateInput): DocumentTypePresetPayload | null | undefined {
  // Explicit preset always takes priority
  if (input.documentTypePreset) return input.documentTypePreset

  // Build a preset from workflow fields if provided
  const workflowId = input.workflowId
  if (!workflowId || workflowId === 'general') return undefined

  const parts: string[] = []
  if (input.workflowFields) {
    for (const [key, value] of Object.entries(input.workflowFields)) {
      if (value?.trim()) parts.push(`${key}：${value.trim()}`)
    }
  }

  return {
    id: workflowId,
    label: input.workflowLabel,
    promptHint: parts.length > 0 ? parts.join('\n') : undefined,
    outlineSections: input.outlineSections,
    documentKind: input.documentKind ?? workflowId,
  } as DocumentTypePresetPayload & { outlineSections?: string[]; documentKind?: string }
}

function buildGenerateParams(input: DocumentGenerateInput): Record<string, unknown> {
  return {
    instruction: input.instruction.trim(),
    title: input.title,
    documentText: input.documentText ?? input.currentDocumentText,
    selectedText: input.selectedText,
    selectedHtml: input.selectedHtml,
    language: input.language,
    outputLanguage: input.outputLanguage,
    extraContext: input.extraContext,
    generationMode: input.generationMode,
    templateDocument: input.templateDocument,
    documentTypePreset: buildWorkflowDocumentTypePreset(input),
    templateSkillId: input.templateSkillId,
    templateManifest: input.templateManifest,
    knowledgeBaseIds: input.knowledgeBaseIds,
    fileIds: input.fileIds,
  }
}

/** 选择生成 skill：模板 > 知识库 legacy > 默认 legacy workflow */
export function resolveGenerateSkillId(input: DocumentGenerateInput): string {
  const hasTemplateText = Boolean(input.templateDocument?.extractedText?.trim())
  if (input.generationMode === 'knowledge-template-document' || hasTemplateText) {
    return 'web.template.document.generate.legacy'
  }
  if ((input.knowledgeBaseIds?.length ?? 0) > 0) {
    return 'web.knowledge.writing.legacy'
  }
  return 'web.document.generate'
}

export async function runDocumentGenerate(
  input: DocumentGenerateInput,
): Promise<DocumentSkillResult> {
  const skillId = resolveGenerateSkillId(input)
  const params = buildGenerateParams(input)

  if (skillId === 'web.template.document.generate.legacy') {
    return platformApi.skills.run(skillId, {
      workspacePath: input.workspacePath,
      params: {
        instruction: input.instruction.trim(),
        title: input.title,
        templateTitle: input.templateDocument?.title,
        templateExtractedText: input.templateDocument?.extractedText,
        templateOutline: input.templateDocument?.outline,
        language: input.language,
        extraContext: input.extraContext,
        knowledgeBaseIds: input.knowledgeBaseIds,
        fileIds: input.fileIds,
      },
    }) as Promise<DocumentSkillResult>
  }

  if (skillId === 'web.knowledge.writing.legacy') {
    return platformApi.skills.run(skillId, {
      workspacePath: input.workspacePath,
      params: {
        instruction: input.instruction.trim(),
        title: input.title,
        documentText: input.documentText ?? input.currentDocumentText,
        language: input.language,
        extraContext: input.extraContext,
        knowledgeBaseIds: input.knowledgeBaseIds,
        fileIds: input.fileIds,
      },
    }) as Promise<DocumentSkillResult>
  }

  return platformApi.skills.run('web.document.generate', {
    prompt: input.instruction.trim(),
    workspacePath: input.workspacePath,
    params,
  }) as Promise<DocumentSkillResult>
}

export async function runDocumentEdit(input: DocumentEditInput): Promise<DocumentSkillResult> {
  return platformApi.skills.run('web.document.edit', {
    workspacePath: input.workspacePath,
    params: {
      instruction: input.instruction.trim(),
      mode: input.mode,
      title: input.title,
      selectedText: input.selectedText,
      selectedHtml: input.selectedHtml,
      documentText: input.documentText,
      documentHtml: input.documentHtml,
      language: input.language,
      outputLanguage: input.outputLanguage,
      extraContext: input.extraContext,
      documentTypePreset: input.documentTypePreset,
      templateSkillId: input.templateSkillId,
      templateManifest: input.templateManifest,
      knowledgeBaseIds: input.knowledgeBaseIds,
      fileIds: input.fileIds,
    },
  }) as Promise<DocumentSkillResult>
}

export function applyWebDocumentPatch(
  editor: {
    replaceSelection(html: string): void
    insertAtCursor(html: string): void
    replaceDocument(html: string): void
    focusEnd?(): void
  },
  patch: WebDocumentPatch,
): void {
  switch (patch.type) {
    case 'replace_selection':
      editor.replaceSelection(patch.html)
      break
    case 'insert_at_cursor':
      editor.insertAtCursor(patch.html)
      break
    case 'replace_document':
      editor.replaceDocument(patch.html)
      break
    case 'append_section': {
      const block = `${patch.title ? `<h2>${patch.title}</h2>` : ''}${patch.html}`
      if (editor.focusEnd) editor.focusEnd()
      editor.insertAtCursor(block)
      break
    }
    default:
      break
  }
}

export function inferDocumentEditMode(
  instruction: string,
  hasSelection: boolean,
  isBodyEmpty: boolean,
): DocumentEditMode | 'generate' {
  if (hasSelection) return 'rewrite_selection'
  if (isBodyEmpty) return 'generate'
  const t = instruction.trim()
  if (/补充|添加|插入|加上|在此|这里|写一段|增加/.test(t)) return 'insert_at_cursor'
  if (/重新生成|重写全文|改成一篇|整篇重写/.test(t)) return 'replace_document'
  if (/优化|润色|整理|改成|正式|简洁|语气/.test(t)) return 'polish_document'
  return 'insert_at_cursor'
}

export type AiCommandModeHint =
  | 'rewrite_selection'
  | 'generate_document'
  | 'insert_at_cursor'
  | 'polish_document'
  | 'replace_document'

export function resolveAiCommandModeHint(
  instruction: string,
  hasSelection: boolean,
  isBodyEmpty: boolean,
): AiCommandModeHint {
  if (hasSelection) return 'rewrite_selection'
  if (isBodyEmpty) return 'generate_document'
  const mode = inferDocumentEditMode(instruction, false, false)
  if (mode === 'generate') return 'generate_document'
  return mode
}

export const AI_MODE_HINT_LABELS: Record<AiCommandModeHint, string> = {
  rewrite_selection: '已选中文本：将修改选区',
  generate_document: '无选区且正文为空：将生成初稿',
  insert_at_cursor: '无选区：将按指令在光标处插入',
  polish_document: '无选区：将优化全文',
  replace_document: '无选区：将重写全文',
}

export function patchResultMessage(patch: WebDocumentPatch): string {
  switch (patch.type) {
    case 'replace_selection':
      return 'AI 已修改选区'
    case 'insert_at_cursor':
      return 'AI 已插入内容'
    case 'replace_document':
      return 'AI 已优化全文'
    case 'append_section':
      return 'AI 已追加章节'
    default:
      return 'AI 已更新文稿'
  }
}
