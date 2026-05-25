import type { ContentHandoffDetail } from '../features/document/services/contentHandoffApi'
import { claimHandoffSession } from '../features/document/services/contentHandoffApi'
import { setPendingDocumentHandoff } from './pendingDocumentHandoff'

export function readHandoffIdFromLocation(): string | null {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get('handoff')?.trim() || null
}

export function clearHandoffQueryFromLocation(): void {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  if (!url.searchParams.has('handoff')) return
  url.searchParams.delete('handoff')
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
}

function toContentHandoffDetail(handoff: Awaited<ReturnType<typeof claimHandoffSession>>['handoff']): ContentHandoffDetail {
  return {
    handoffId: handoff.handoffId,
    targetPage: handoff.targetPage,
    documentId: handoff.documentId,
    workspacePath: handoff.workspacePath,
    title: handoff.title,
    status: handoff.status,
    artifactId: handoff.artifactId,
    exportUrl: handoff.exportUrl,
    filename: handoff.filename,
    result: handoff.result,
    metadata: handoff.metadata,
    sourceApp: handoff.sourceApp,
    externalId: handoff.externalId,
    createdAt: handoff.createdAt,
  }
}

export async function bootstrapHandoffEntry(handoffId: string): Promise<{
  token: string
  detail: ContentHandoffDetail
}> {
  const claimed = await claimHandoffSession(handoffId)
  const detail = toContentHandoffDetail(claimed.handoff)
  setPendingDocumentHandoff({
    handoffId,
    workspacePath: detail.workspacePath,
    detail,
  })
  return { token: claimed.token, detail }
}
