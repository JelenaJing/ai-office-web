import { platformApi } from '../../../platform'
import type { FileEntry } from '../../../platform'

export type DocumentEngine = 'builtin' | 'minimax_docx'
export type DocumentLanguage = 'zh-CN' | 'en-US'
export type DocumentType = 'report' | 'notice' | 'memo' | 'proposal' | 'summary' | 'official_letter'
export type DocumentTaskIntent =
  | 'official_notice'
  | 'formal_letter'
  | 'meeting_minutes'
  | 'work_summary'
  | 'annual_report'
  | 'form_fill'
  | 'academic_paper'
  | 'literature_review'
  | 'formal_template'
  | 'edit_selection'
  | 'edit_section'
  | 'unknown'

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

export interface DocumentReference {
  id: string
  label: string
  kind: 'knowledge_base' | 'file' | 'manual_note'
  sourceId: string
  sourceLabel?: string
  excerpt?: string
  citationStatus?: 'verified' | 'partial' | 'unverified'
}

export interface DocumentCitation {
  id: string
  refId: string
  blockId: string
  sectionId?: string | null
  text: string
  renderMode: 'inline' | 'footnote' | 'badge'
  sourceId?: string
}

export interface DocumentExportPaths {
  pdf?: string
  docx?: string
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

export type DocumentCanonicalBlock =
  | {
      id: string
      type: 'title' | 'heading' | 'paragraph' | 'quote'
      role: 'title' | 'heading' | 'paragraph' | 'quote'
      sectionId: string | null
      sectionTitle?: string
      order: number
      text: string
      level?: number
      sourceId?: string
      citationIds?: string[]
      html?: string
    }
  | {
      id: string
      type: 'list-item'
      role: 'list-item'
      sectionId: string | null
      sectionTitle?: string
      order: number
      text: string
      listKind: 'bulleted' | 'numbered'
      index: number
      sourceId?: string
      citationIds?: string[]
      html?: string
    }
  | {
      id: string
      type: 'table'
      role: 'table'
      sectionId: string | null
      sectionTitle?: string
      order: number
      title?: string
      headers: string[]
      rows: string[][]
      sourceId?: string
      citationIds?: string[]
      html?: string
    }
  | {
      id: string
      type: 'image'
      role: 'image'
      sectionId: string | null
      sectionTitle?: string
      order: number
      src: string
      alt?: string
      caption?: string
      sourceId?: string
      citationIds?: string[]
      html?: string
    }
  | {
      id: string
      type: 'divider'
      role: 'divider'
      sectionId: string | null
      sectionTitle?: string
      order: number
      sourceId?: string
      citationIds?: string[]
      html?: string
    }

export interface DocumentCanonicalSection {
  id: string
  title: string
  level: number
  blockIds: string[]
}

export interface DocumentCanonicalData {
  version: 'document-html-workbench/v1'
  documentId: string
  title: string
  type: string
  language: string
  engine: string
  templateId?: string
  outline: DocumentDraft['outline']
  sections: DocumentCanonicalSection[]
  blocks: DocumentCanonicalBlock[]
  knowledgeRefs: DocumentKnowledgeRef[]
  references: DocumentReference[]
  citations: DocumentCitation[]
}

export interface DocumentArtifact {
  id: string
  type: 'document'
  title: string
  html: string
  canonicalData: DocumentCanonicalData
  sourceRefs: Array<{ type: string; id: string; label?: string }>
  knowledgeRefs: DocumentKnowledgeRef[]
  references: DocumentReference[]
  citations: DocumentCitation[]
  exportPaths: DocumentExportPaths
  createdAt: string
  updatedAt: string
}

export type DocumentWorkbenchArtifact = DocumentArtifact

export type DocumentOutlineItem = DocumentDraft['outline'][number]

export interface DocumentSelectionRange {
  sectionId?: string
  blockId?: string
  blockRole?: string
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
  documentArtifact?: DocumentWorkbenchArtifact
  markdown?: string
  documentDraft?: DocumentDraft
  outline: DocumentOutlineItem[]
  selectedSectionId: string | null
  selectedBlockId: string | null
  selectedBlockRole?: string | null
  selectedBlockText?: string
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
  | { type: 'replace_block_text'; blockId: string; replacementText: string }
  | { type: 'replace_section'; sectionId: string; html?: string; markdown?: string }
  | { type: 'insert_at_cursor'; html?: string; text?: string }
  | {
      type: 'insert_citation'
      html: string
      citation: DocumentCitation
      reference: DocumentReference
    }
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
  html: string
  documentArtifact: DocumentWorkbenchArtifact
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
  html?: string
  documentArtifact?: DocumentWorkbenchArtifact
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
  engine?: DocumentEngine
  fallbackFrom?: 'minimax_docx'
  fallbackReason?: string
  startedAt?: string
  completedAt?: string
  failedAt?: string
  lastProgressMessage?: string
  result?: DocumentTaskResult
  error?: string
}

export interface DocumentWorkbenchConfig {
  success: boolean
  templates: DocumentTemplateOption[]
  engine: DocumentEngine
  fallback: 'builtin' | 'none'
}

export interface DocumentTaskRouterResponse {
  success: boolean
  intent: DocumentTaskIntent
  confidence: number
  workflowId: string
  documentType: DocumentType
  requiredInputs: string[]
  missingInputs: string[]
  targetEditor: 'DocumentWorkbench'
  defaultLanguage: DocumentLanguage
  nextAction: {
    type: 'generate' | 'ask' | 'upload_template' | 'selection_edit' | 'section_edit'
    message: string
    question?: string
  }
}

export interface DocumentContinueResponse {
  success: boolean
  documentId: string
  sectionId?: string
  patch: Extract<DocumentEditPatch, { type: 'insert_at_cursor' }>
  message: string
}

export interface FormalTemplateFieldConfirmResponse {
  success: boolean
  presetId: string
  presetLabel: string
  templateKind: string
  runtimeKind: string
  confirmedFields: Record<string, string>
  missingFields: string[]
  supported: boolean
  fallbackReason?: string | null
}

export interface FormalTemplatePreviewResponse {
  success: boolean
  title: string
  markdown: string
  html: string
  presetId: string
  presetLabel: string
  templateKind: string
  runtimeKind: string
  resolvedFields: Record<string, string>
  fallbackReason?: string | null
  diagnostics?: {
    chain: string
    steps: string[]
    partialMissing?: string[]
  }
}

export interface FormalTemplateCommitResponse extends DocumentTaskResult {
  success: boolean
  stage: 'commit'
  presetId: string
  presetLabel: string
  resolvedFields: Record<string, string>
  fallbackReason?: string | null
}

export interface DocumentImportResponse extends DocumentTaskResult {
  success: boolean
  source: 'upload' | 'artifact'
  text: string
  title: string
  wordCount: number
}

export interface DocumentSectionEditResponse extends DocumentTaskResult {
  success: boolean
  updatedSectionId: string
  updatedSectionIndex: number | null
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

export async function routeDocumentTask(input: {
  prompt: string
  currentDocument?: { title?: string; type?: string } | null
  selectedText?: string
  selectedSectionId?: string
  attachments?: Array<{ id?: string; name?: string }>
  templateId?: string
  knowledgeRefs?: DocumentKnowledgeRefInput[]
}): Promise<DocumentTaskRouterResponse> {
  return requestJson('/api/documents/task-router', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export async function getDocumentTask(taskId: string): Promise<DocumentTaskStatusResponse> {
  return requestJson<DocumentTaskStatusResponse>(`/api/documents/tasks/${encodeURIComponent(taskId)}`)
}

export async function waitForDocumentTask(
  taskId: string,
  onProgress?: (state: DocumentTaskStatusResponse) => void,
): Promise<DocumentTaskResult> {
  const deadline = Date.now() + 120_000
  let lastState: DocumentTaskStatusResponse | null = null
  for (;;) {
    const state = await getDocumentTask(taskId)
    lastState = state
    onProgress?.(state)
    if (state.status === 'completed' && state.result) {
      return state.result
    }
    if (state.status === 'failed' || state.status === 'cancelled') {
      throw new Error(state.error || state.message || '文稿任务失败')
    }
    if (Date.now() >= deadline) {
      throw new Error(state.error || state.lastProgressMessage || state.message || '文稿任务轮询超时')
    }
    await new Promise((resolve) => window.setTimeout(resolve, 1200))
  }
  throw new Error(lastState?.error || lastState?.lastProgressMessage || lastState?.message || '文稿任务轮询异常退出')
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
}): Promise<DocumentSectionEditResponse> {
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

/**
 * Stateless text-level AI edit that does NOT require an existing documentId.
 * Use when the user is editing a blank new document that has not been saved yet.
 */
export async function editDocumentText(input: {
  instruction: string
  selectedText: string
  selectionContext?: {
    documentTitle?: string
    sectionTitle?: string
    sectionId?: string
    beforeText?: string
    afterText?: string
    language?: string
  }
}): Promise<DocumentSelectionEditResponse> {
  return requestJson('/api/documents/edit-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}


export async function continueDocument(input: {
  documentId: string
  instruction?: string
  cursorContext: {
    sectionId?: string
    sectionTitle?: string
    beforeText?: string
    afterText?: string
  }
  document?: DocumentDraft
  html?: string
}): Promise<DocumentContinueResponse> {
  return requestJson(`/api/documents/${encodeURIComponent(input.documentId)}/continue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export async function confirmFormalTemplateFields(input: {
  presetId?: string
  customTemplateText?: string
  instruction?: string
  fieldOverrides?: Record<string, string>
}): Promise<FormalTemplateFieldConfirmResponse> {
  return requestJson('/api/document/formal-template/confirm-fields', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export async function analyzeFormalTemplateFlow(input: {
  presetId?: string
  customTemplateText?: string
  instruction?: string
}): Promise<{
  success: boolean
  presetId: string
  presetLabel: string
  templateKind: string
  runtimeKind: string
  supported: boolean
  unavailableReason?: string
  templateText: string
  fields: Array<{
    fieldId: string
    label: string
    required: boolean
    dataType: string
    hint?: string
    occurrences: number
  }>
  defaultSections: string[]
  diagnostics: { chain: string; steps: string[] }
}> {
  return requestJson('/api/document/formal-template/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export async function previewFormalTemplate(input: {
  presetId?: string
  customTemplateText?: string
  instruction: string
  language?: 'zh' | 'en'
  fieldOverrides?: Record<string, string>
  extraContext?: string
  workspacePath?: string
}): Promise<FormalTemplatePreviewResponse> {
  return requestJson('/api/document/formal-template/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export async function commitFormalTemplate(input: {
  presetId?: string
  customTemplateText?: string
  instruction: string
  language?: 'zh' | 'en'
  fieldOverrides?: Record<string, string>
  extraContext?: string
  workspacePath?: string
}): Promise<FormalTemplateCommitResponse> {
  return requestJson('/api/document/formal-template/commit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export async function importDocumentDocx(input: {
  file?: File
  artifactId?: string
  workspacePath?: string
}): Promise<DocumentImportResponse> {
  const formData = new FormData()
  if (input.file) formData.append('file', input.file)
  if (input.artifactId) formData.append('artifactId', input.artifactId)
  if (input.workspacePath) formData.append('workspacePath', input.workspacePath)
  const response = await fetch('/api/documents/import-docx', {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  })
  const payload = await response.json().catch(() => ({})) as { error?: string; message?: string }
  if (!response.ok) {
    throw new Error(payload.error || payload.message || `请求失败 (${response.status})`)
  }
  return payload as DocumentImportResponse
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
