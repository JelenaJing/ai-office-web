import { platformApi } from '../../../platform'
import type { FileEntry } from '../../../platform'

export type DocumentEngine = 'builtin' | 'minimax_docx'
export type DocumentLanguage = 'zh-CN' | 'en-US'
export type DocumentType = 'report' | 'notice' | 'memo' | 'proposal' | 'summary' | 'official_letter'

export interface DocumentKnowledgeRefInput {
  kind: 'knowledge_base' | 'file'
  id: string
  label?: string
}

export interface DocumentKnowledgeRef {
  kind: 'knowledge_base' | 'file'
  id: string
  label: string
  excerpt?: string
  sourceTitles?: string[]
  citationStatus: 'verified' | 'partial' | 'unverified'
}

export interface DocumentDraftCitation {
  id: string
  label: string
  kind: 'knowledge_base' | 'file' | 'manual_note'
  note?: string
  citationStatus: 'verified' | 'partial' | 'unverified'
}

export interface DocumentDraftTable {
  id: string
  title?: string
  headers: string[]
  rows: string[][]
}

export interface DocumentDraft {
  id: string
  title: string
  type: string
  language: string
  outline: Array<{
    id: string
    level: number
    title: string
  }>
  sections: Array<{
    id: string
    title: string
    content: string
    citations?: DocumentDraftCitation[]
    tables?: DocumentDraftTable[]
  }>
  metadata: {
    engine: string
    templateId?: string
    knowledgeRefs?: DocumentKnowledgeRef[]
  }
}

export type DocumentOutlineItem = DocumentDraft['outline'][number]

export interface DocumentSelectionRange {
  sectionId?: string
  startOffset?: number
  endOffset?: number
  text: string
  beforeText?: string
  afterText?: string
  sectionTitle?: string
}

export interface EditableDocumentState {
  documentId: string | null
  artifactId: string | null
  exportUrl: string | null
  title: string
  html: string
  markdown?: string
  documentDraft?: DocumentDraft
  outline: DocumentOutlineItem[]
  selectedSectionId: string | null
  selectedText: string
  selectionRange?: DocumentSelectionRange
  dirty: boolean
  saving: boolean
  lastSavedAt?: string
  engine: string
  fallbackFrom?: string
  fallbackReason?: string
}

export type DocumentEditPatch =
  | { type: 'replace_selection'; selectedText: string; replacementText: string }
  | { type: 'replace_section'; sectionId: string; html?: string; markdown?: string }
  | { type: 'insert_at_cursor'; html?: string; text?: string }
  | { type: 'append_section'; section: Record<string, unknown> }
  | { type: 'replace_document'; html: string; document?: DocumentDraft }

export interface DocumentTemplateOption {
  id: string
  label: string
  description: string
  documentType: DocumentType
  defaultTitle: string
  outline: string[]
  promptHint: string
}

export interface DocumentTaskResult {
  engine: DocumentEngine
  skillId: string
  documentId: string
  artifactId: string
  exportUrl: string
  filename: string
  document: DocumentDraft
  outline: DocumentDraft['outline']
  templateId?: string
  templateLabel?: string
  knowledgeRefs: DocumentKnowledgeRef[]
  fallbackFrom?: 'minimax_docx'
  fallbackReason?: string
}

export interface DocumentSaveResponse {
  success: boolean
  documentId: string
  savedAt: string
  artifact?: {
    id: string
    title?: string
    exports?: Array<{ format: string; filename: string; url: string }>
  }
  artifactId?: string
  exportUrl?: string
  filename?: string
  document?: DocumentDraft
  outline?: DocumentDraft['outline']
}

export interface DocumentSelectionEditResponse {
  success: boolean
  documentId: string
  sectionId?: string
  updatedText: string
  patch: Extract<DocumentEditPatch, { type: 'replace_selection' }>
  artifact?: {
    id: string
    title?: string
  }
  exportUrl?: string
  message: string
}

export interface DocumentTaskStatusResponse {
  success: boolean
  taskId: string
  documentId?: string
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: number
  message: string
  result?: DocumentTaskResult
  error?: string
}

export interface DocumentWorkbenchConfig {
  success: boolean
  templates: DocumentTemplateOption[]
  engine: DocumentEngine
  fallback: 'builtin' | 'none'
}

function authHeaders(): Record<string, string> {
  const token = platformApi.auth.getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      ...authHeaders(),
      ...(init?.headers as Record<string, string> | undefined),
    },
  })
  const payload = await response.json().catch(() => ({})) as { error?: string; message?: string }
  if (!response.ok) {
    throw new Error(payload.error || payload.message || `请求失败 (${response.status})`)
  }
  return payload as T
}

export async function loadDocumentWorkbenchConfig(): Promise<DocumentWorkbenchConfig> {
  return requestJson<DocumentWorkbenchConfig>('/api/documents/templates/list')
}

export async function startDocumentTask(input: {
  workspacePath: string
  prompt: string
  title?: string
  templateId?: string
  knowledgeRefs?: DocumentKnowledgeRefInput[]
  documentType?: DocumentType
  language?: DocumentLanguage
}): Promise<{ success: boolean; taskId: string; status: string }> {
  const payload = {
    ...input,
    documentType: input.documentType || 'report',
    language: input.language || 'zh-CN',
  }
  return requestJson('/api/documents/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function getDocumentTask(taskId: string): Promise<DocumentTaskStatusResponse> {
  return requestJson<DocumentTaskStatusResponse>(`/api/documents/tasks/${encodeURIComponent(taskId)}`)
}

export async function waitForDocumentTask(
  taskId: string,
  onProgress?: (state: DocumentTaskStatusResponse) => void,
): Promise<DocumentTaskResult> {
  for (;;) {
    const state = await getDocumentTask(taskId)
    onProgress?.(state)
    if (state.status === 'completed' && state.result) {
      return state.result
    }
    if (state.status === 'failed' || state.status === 'cancelled') {
      throw new Error(state.error || state.message || '文稿任务失败')
    }
    await new Promise((resolve) => window.setTimeout(resolve, 1200))
  }
}

export async function editDocumentSection(input: {
  documentId: string
  sectionId: string
  instruction: string
  title?: string
  html?: string
  document?: DocumentDraft
  knowledgeRefs?: DocumentKnowledgeRefInput[]
  currentSection: DocumentDraft['sections'][number]
  documentContext: {
    title: string
    type: string
    outline: DocumentDraft['outline']
    nearbySections: Array<{ id: string; title: string; content: string }>
  }
}): Promise<{
  success: boolean
  engine: DocumentEngine
  skillId: string
  documentId: string
  artifactId: string
  exportUrl: string
  filename: string
  document: DocumentDraft
  outline: DocumentDraft['outline']
  updatedSectionId: string
  updatedSectionIndex: number | null
}> {
  return requestJson(`/api/documents/${encodeURIComponent(input.documentId)}/sections/${encodeURIComponent(input.sectionId)}/edit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export async function exportDocumentArtifact(input: {
  documentId: string
  format: 'docx' | 'pdf'
  title?: string
  html?: string
  documentDraft?: DocumentDraft
  outline?: DocumentDraft['outline']
}): Promise<{
  success: boolean
  engine: DocumentEngine
  documentId: string
  artifactId: string
  exportUrl: string
  filename: string
}> {
  return requestJson(`/api/documents/${encodeURIComponent(input.documentId)}/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export async function saveEditableDocument(input: {
  documentId: string
  title: string
  html: string
  documentDraft: DocumentDraft
  outline: DocumentDraft['outline']
}): Promise<DocumentSaveResponse> {
  return requestJson(`/api/documents/${encodeURIComponent(input.documentId)}/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export async function editDocumentSelection(input: {
  documentId: string
  instruction: string
  selectedText: string
  selectionContext: {
    sectionId?: string
    beforeText?: string
    afterText?: string
    documentTitle?: string
    sectionTitle?: string
  }
  document: DocumentDraft
  html?: string
}): Promise<DocumentSelectionEditResponse> {
  return requestJson(`/api/documents/${encodeURIComponent(input.documentId)}/edit-selection`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function buildKnowledgeRefsFromSelection(
  knowledgeIds: string[],
  attachments: FileEntry[],
  knowledgeNameMap: Map<string, string>,
): DocumentKnowledgeRefInput[] {
  return [
    ...knowledgeIds.map((id) => ({
      kind: 'knowledge_base' as const,
      id,
      label: knowledgeNameMap.get(id) || id,
    })),
    ...attachments.map((file) => ({
      kind: 'file' as const,
      id: file.id,
      label: file.name,
    })),
  ]
}

export function engineLabel(engine: DocumentEngine): string {
  return engine === 'minimax_docx' ? 'MiniMax DOCX Skill' : '内置文稿引擎'
}
