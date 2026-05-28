import type { DocumentTaskTemplate } from './documentTaskTemplates'
import type { EditableDocumentState } from '../../document/services/documentWorkbenchApi'
import type { DocumentTone } from './documentTaskTemplates'

const KEY_PREFIX = 'document-studio-workbench-draft:'
const LEGACY_KEY = 'document-studio-workbench-draft'
const TEMP_PREFIX = 'temp:'

export type DocumentStudioPersistedDraft = {
  editorState: EditableDocumentState
  taskTemplateId: string | null
  tone: DocumentTone
  updatedAt: string
}

export function createTempDraftId(): string {
  return `draft-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function draftStorageKey(input: {
  documentId?: string | null
  tempDraftId?: string | null
}): string {
  const documentId = input.documentId?.trim()
  if (documentId) return `${KEY_PREFIX}${documentId}`
  const tempId = input.tempDraftId?.trim()
  if (tempId) return `${KEY_PREFIX}${TEMP_PREFIX}${tempId}`
  return `${KEY_PREFIX}${TEMP_PREFIX}anon`
}

export function loadDocumentStudioDraft(input: {
  documentId?: string | null
  tempDraftId?: string | null
}): DocumentStudioPersistedDraft | null {
  if (typeof window === 'undefined') return null
  const key = draftStorageKey(input)
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) {
      if (!input.documentId && !input.tempDraftId) {
        return loadLegacyDraft()
      }
      return null
    }
    const parsed = JSON.parse(raw) as DocumentStudioPersistedDraft
    if (!parsed?.editorState?.html) return null
    return parsed
  } catch {
    return null
  }
}

function loadLegacyDraft(): DocumentStudioPersistedDraft | null {
  try {
    const raw = window.localStorage.getItem(LEGACY_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DocumentStudioPersistedDraft
    if (!parsed?.editorState?.html) return null
    return parsed
  } catch {
    return null
  }
}

export function saveDocumentStudioDraft(input: {
  editorState: EditableDocumentState
  taskTemplateId: string | null
  tone: DocumentTone
  tempDraftId?: string | null
}): void {
  if (typeof window === 'undefined') return
  const key = draftStorageKey({
    documentId: input.editorState.documentId,
    tempDraftId: input.editorState.documentId ? null : input.tempDraftId,
  })
  const payload: DocumentStudioPersistedDraft = {
    editorState: input.editorState,
    taskTemplateId: input.taskTemplateId,
    tone: input.tone,
    updatedAt: new Date().toISOString(),
  }
  window.localStorage.setItem(key, JSON.stringify(payload))
  if (window.localStorage.getItem(LEGACY_KEY)) {
    window.localStorage.removeItem(LEGACY_KEY)
  }
}

export function migrateTempDraftToDocument(tempDraftId: string, documentId: string): void {
  if (typeof window === 'undefined') return
  const fromKey = draftStorageKey({ tempDraftId })
  const toKey = draftStorageKey({ documentId })
  const raw = window.localStorage.getItem(fromKey)
  if (!raw) return
  window.localStorage.setItem(toKey, raw)
  window.localStorage.removeItem(fromKey)
}

export function clearDocumentStudioDraft(input: {
  documentId?: string | null
  tempDraftId?: string | null
}): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(draftStorageKey(input))
}

export function hasDocumentStudioContent(state: EditableDocumentState): boolean {
  const html = String(state.html || '').trim()
  if (!html) return false
  if (state.documentId) return true
  return !html.includes('从这里开始写作') && html.replace(/<[^>]+>/g, '').trim().length > 8
}
