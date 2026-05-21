import { platformApi } from '../../../platform'
import type { SkillResult } from '../../../platform'
import type { DocumentEditMode } from '../webDocumentPatchTypes'
import type { WebDocumentPatch } from '../webDocumentPatchTypes'

export interface DocumentGenerateInput {
  instruction: string
  workspacePath: string
  title?: string
  templateSkillId?: string
  templateManifest?: Record<string, unknown>
  knowledgeBaseIds?: string[]
  fileIds?: string[]
  currentDocumentText?: string
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
  templateSkillId?: string
  knowledgeBaseIds?: string[]
  fileIds?: string[]
}

export type DocumentSkillResult = SkillResult & {
  data?: {
    patch?: WebDocumentPatch
    documentSession?: Record<string, unknown>
    html?: string
    markdown?: string
  }
}

export async function runDocumentGenerate(
  input: DocumentGenerateInput,
): Promise<DocumentSkillResult> {
  return platformApi.skills.run('web.document.generate', {
    prompt: input.instruction.trim(),
    workspacePath: input.workspacePath,
    params: {
      title: input.title,
      templateSkillId: input.templateSkillId,
      templateManifest: input.templateManifest,
      knowledgeBaseIds: input.knowledgeBaseIds,
      fileIds: input.fileIds,
      currentDocumentText: input.currentDocumentText,
    },
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
      templateSkillId: input.templateSkillId,
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
      if (editor.focusEnd) {
        editor.focusEnd()
      }
      editor.insertAtCursor(block)
      break
    }
    default:
      break
  }
}

/** 根据指令与编辑区状态推断 server edit mode */
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

