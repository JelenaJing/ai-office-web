const RECENT_KEY = 'aios.document-studio.recentDocuments'
const MAX_RECENT = 20

export interface RecentDocumentEntry {
  documentId: string
  title: string
  updatedAt: string
}

export function readRecentDocuments(): RecentDocumentEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    if (!raw) return []
    const list = JSON.parse(raw) as RecentDocumentEntry[]
    return Array.isArray(list)
      ? list.filter(e => e.documentId?.startsWith('dstudio_')).slice(0, MAX_RECENT)
      : []
  } catch {
    return []
  }
}

export function rememberRecentDocument(entry: { documentId: string; title: string }): void {
  if (typeof window === 'undefined') return
  try {
    const now = new Date().toISOString()
    const existing = readRecentDocuments().filter(e => e.documentId !== entry.documentId)
    const next: RecentDocumentEntry[] = [
      { documentId: entry.documentId, title: entry.title || '未命名文稿', updatedAt: now },
      ...existing,
    ].slice(0, MAX_RECENT)
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {
    // ignore
  }
}
