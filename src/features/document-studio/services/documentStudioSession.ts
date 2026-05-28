const STORAGE_KEY = 'aios.document-studio.activeDocumentId'
const DOCUMENT_PATH = '/document'

export type DocumentStudioUrlMode = 'humanize'

export function readActiveDocumentIdFromUrl(): string | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  const doc = params.get('doc')?.trim()
  return doc || null
}

export function isNewDocumentRequested(): boolean {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('new') === '1'
}

export function readDocumentStudioModeFromUrl(): DocumentStudioUrlMode | null {
  if (typeof window === 'undefined') return null
  const mode = new URLSearchParams(window.location.search).get('mode')?.trim()
  return mode === 'humanize' ? 'humanize' : null
}

export function buildDocumentStudioUrl(options?: {
  new?: boolean
  doc?: string
  mode?: DocumentStudioUrlMode
}): string {
  const params = new URLSearchParams()
  if (options?.new) params.set('new', '1')
  if (options?.doc?.trim()) params.set('doc', options.doc.trim())
  if (options?.mode) params.set('mode', options.mode)
  const q = params.toString()
  return q ? `${DOCUMENT_PATH}?${q}` : DOCUMENT_PATH
}

/** 进入 Document Studio 前设置地址栏（须在 navigateTo('document-studio') 之前调用）。 */
export function applyDocumentStudioUrl(options?: {
  new?: boolean
  doc?: string
  mode?: DocumentStudioUrlMode
}): void {
  if (typeof window === 'undefined') return
  const next = buildDocumentStudioUrl(options)
  if (window.location.pathname + window.location.search !== next) {
    window.history.replaceState(null, '', next)
  }
}

export function persistActiveDocumentId(documentId: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, documentId)
  } catch {
    // ignore quota
  }
  applyDocumentStudioUrl({ doc: documentId })
}

export function readStoredActiveDocumentId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const id = localStorage.getItem(STORAGE_KEY)?.trim()
    return id || null
  } catch {
    return null
  }
}

export function clearActiveDocumentSession(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

/** 处理完 ?new=1 后去掉该参数，保留 mode 等其它查询项。 */
export function stripNewDocumentQueryFromUrl(): void {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  if (!params.has('new')) return
  params.delete('new')
  const q = params.toString()
  const next = q ? `${DOCUMENT_PATH}?${q}` : DOCUMENT_PATH
  window.history.replaceState(null, '', next)
}

export type DocumentStudioEntryIntent =
  | { kind: 'new' }
  | { kind: 'home' }
  | { kind: 'humanize'; documentId?: string }
  | { kind: 'doc'; documentId: string }

export function resolveDocumentStudioEntryIntent(): DocumentStudioEntryIntent {
  if (typeof window === 'undefined') return { kind: 'home' }
  if (isNewDocumentRequested()) {
    return { kind: 'new' }
  }
  const mode = readDocumentStudioModeFromUrl()
  const doc = readActiveDocumentIdFromUrl()
  if (mode === 'humanize') {
    return { kind: 'humanize', documentId: doc || undefined }
  }
  if (doc) return { kind: 'doc', documentId: doc }
  return { kind: 'home' }
}

export function goToDocumentStudioHome(): void {
  applyDocumentStudioUrl()
}

export function goToNewDocumentFlow(): void {
  applyDocumentStudioUrl({ new: true })
}

export function goToHumanizeMode(documentId?: string): void {
  applyDocumentStudioUrl({ mode: 'humanize', doc: documentId })
}
