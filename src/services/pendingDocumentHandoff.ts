/**
 * pendingDocumentHandoff — cross-page handoff from external apps into DocumentWorkbench.
 */

import type { ContentHandoffDetail } from '../features/document/services/contentHandoffApi'

export interface PendingDocumentHandoff {
  handoffId: string
  workspacePath?: string
  detail?: ContentHandoffDetail
}

let _pending: PendingDocumentHandoff | null = null

export function setPendingDocumentHandoff(handoff: PendingDocumentHandoff): void {
  _pending = handoff
}

export function peekPendingDocumentHandoff(): PendingDocumentHandoff | null {
  return _pending
}

export function consumePendingDocumentHandoff(): PendingDocumentHandoff | null {
  const data = _pending
  _pending = null
  return data
}
