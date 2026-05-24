import {
  inferDocumentEditMode,
  runDocumentEdit,
  runDocumentGenerate,
  type DocumentEditInput,
  type DocumentGenerateInput,
  type DocumentSkillResult,
  type DocumentTypePresetPayload,
  type TemplateDocumentPayload,
} from './documentEditSkills'
import type { DocumentEditMode, WebDocumentPatch } from '../webDocumentPatchTypes'

export type DocumentSkillProvider = 'internal' | 'minimax_word'

export type DocumentSkillInput = {
  instruction: string
  currentHtml: string
  currentText: string
  selectedText?: string
  workflowId: string
  knowledgeBaseIds: string[]
  fileIds: string[]
  workspacePath: string
}

export type DocumentSkillOutput = {
  mode: 'replace_document' | 'patch' | 'export'
  html?: string
  markdown?: string
  patch?: unknown
  artifactId?: string
  message?: string
}

export interface RunDocumentSkillOptions {
  provider?: DocumentSkillProvider
  operation?: 'generate' | 'edit' | 'export'
  editMode?: DocumentEditMode
  title?: string
  language?: 'zh' | 'en'
  outputLanguage?: 'zh-CN' | 'en-US'
  extraContext?: string
  documentTypePreset?: DocumentTypePresetPayload | null
  templateSkillId?: string
  templateManifest?: Record<string, unknown>
  generationMode?: 'default' | 'knowledge-template-document'
  templateDocument?: TemplateDocumentPayload | null
  workflowLabel?: string
  workflowFields?: Record<string, string>
  outlineSections?: string[]
  documentKind?: string
}

function extractArtifactId(result: DocumentSkillResult): string | undefined {
  const artifact = result.artifact
  if (!artifact || typeof artifact !== 'object') return undefined
  const record = artifact as unknown as Record<string, unknown>
  return typeof record.id === 'string' ? record.id : undefined
}

function patchMessage(patch: WebDocumentPatch | undefined, fallback: string): string {
  switch (patch?.type) {
    case 'replace_selection':
      return '已完成选中内容修改。'
    case 'insert_at_cursor':
      return '已补充新的文稿内容。'
    case 'replace_document':
      return '已更新全文内容。'
    case 'append_section':
      return '已新增章节内容。'
    default:
      return fallback
  }
}

function mapInternalResult(result: DocumentSkillResult, fallback: string): DocumentSkillOutput {
  const patch = result.data?.patch as WebDocumentPatch | undefined
  const artifactId = extractArtifactId(result)
  if (patch?.type === 'replace_document') {
    return {
      mode: 'replace_document',
      html: patch.html,
      markdown: patch.markdown ?? result.data?.markdown,
      patch,
      artifactId,
      message: patchMessage(patch, fallback),
    }
  }
  if (patch) {
    return {
      mode: 'patch',
      patch,
      html: result.data?.html,
      markdown: result.data?.markdown,
      artifactId,
      message: patchMessage(patch, fallback),
    }
  }
  return {
    mode: 'replace_document',
    html: result.data?.html,
    markdown: result.data?.markdown,
    artifactId,
    message: fallback,
  }
}

async function runInternalSkill(
  input: DocumentSkillInput,
  options: RunDocumentSkillOptions,
): Promise<DocumentSkillOutput> {
  if (options.operation === 'export') {
    return { mode: 'export', message: '导出由宿主层执行。' }
  }

  if (options.operation === 'generate') {
    const generateInput: DocumentGenerateInput = {
      instruction: input.instruction,
      workspacePath: input.workspacePath,
      title: options.title,
      documentText: input.currentText,
      selectedText: input.selectedText,
      language: options.language,
      outputLanguage: options.outputLanguage,
      extraContext: options.extraContext,
      generationMode: options.generationMode,
      templateDocument: options.templateDocument,
      documentTypePreset: options.documentTypePreset,
      templateSkillId: options.templateSkillId,
      templateManifest: options.templateManifest,
      knowledgeBaseIds: input.knowledgeBaseIds,
      fileIds: input.fileIds,
      currentDocumentText: input.currentText,
      workflowId: input.workflowId,
      workflowLabel: options.workflowLabel,
      workflowFields: options.workflowFields,
      outlineSections: options.outlineSections,
      documentKind: options.documentKind,
    }
    const result = await runDocumentGenerate(generateInput)
    if (!result.success) {
      throw new Error(result.error || '生成失败')
    }
    return mapInternalResult(result, '已生成初稿。')
  }

  const resolvedMode = options.editMode ?? inferDocumentEditMode(
    input.instruction,
    Boolean(input.selectedText?.trim()),
    !input.currentText.trim(),
  )

  if (resolvedMode === 'generate') {
    return runInternalSkill(input, { ...options, operation: 'generate' })
  }

  const editInput: DocumentEditInput = {
    instruction: input.instruction,
    mode: resolvedMode,
    workspacePath: input.workspacePath,
    title: options.title,
    selectedText: input.selectedText,
    documentText: input.currentText,
    documentHtml: input.currentHtml,
    language: options.language,
    outputLanguage: options.outputLanguage,
    extraContext: options.extraContext,
    documentTypePreset: options.documentTypePreset,
    templateSkillId: options.templateSkillId,
    templateManifest: options.templateManifest,
    knowledgeBaseIds: input.knowledgeBaseIds,
    fileIds: input.fileIds,
  }
  const result = await runDocumentEdit(editInput)
  if (!result.success) {
    throw new Error(result.error || '编辑失败')
  }
  return mapInternalResult(result, '文稿已更新。')
}

export async function runDocumentSkill(
  input: DocumentSkillInput,
  options: RunDocumentSkillOptions = {},
): Promise<DocumentSkillOutput> {
  const provider = options.provider ?? 'internal'
  if (provider === 'minimax_word') {
    throw new Error('MiniMax Word Skill adapter 尚未接入 Web 版。')
  }
  return runInternalSkill(input, options)
}
