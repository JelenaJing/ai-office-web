/**
 * pendingResourceOpen — 从资源中心跳转到对应编辑器时携带的打开意图。
 */

export type PendingResourceOpen =
  | { kind: 'document-artifact'; artifactId: string }
  | { kind: 'document-studio'; documentId: string }
  | { kind: 'document-file'; fileId: string }
  | { kind: 'html-ppt-artifact'; artifactId: string }
  | { kind: 'ppt-artifact'; artifactId: string; deckId?: string }

let _pending: PendingResourceOpen | null = null

export function setPendingResourceOpen(intent: PendingResourceOpen): void {
  _pending = intent
}

export function peekPendingResourceOpen(): PendingResourceOpen | null {
  return _pending
}

export function consumePendingResourceOpen(): PendingResourceOpen | null {
  const data = _pending
  _pending = null
  return data
}

export function hasPendingDocumentResourceOpen(): boolean {
  const pending = _pending
  return Boolean(
    pending
    && (pending.kind === 'document-artifact' || pending.kind === 'document-file'),
  )
}
