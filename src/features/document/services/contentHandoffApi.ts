import type { DocumentTaskResult } from './documentWorkbenchApi'

export interface ContentHandoffDetail {
  handoffId: string
  targetPage: 'word'
  documentId: string
  workspacePath: string
  title: string
  status: 'ready' | 'expired' | 'failed'
  artifactId: string
  exportUrl: string
  filename: string
  result: DocumentTaskResult
  metadata?: Record<string, unknown>
  sourceApp?: string
  externalId?: string
  createdAt: string
}

function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const token = window.localStorage.getItem('aios_auth_token')
    || window.localStorage.getItem('aios_itoken')
    || window.localStorage.getItem('ai_office_internal_token')
    || window.sessionStorage.getItem('aios_auth_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function fetchContentHandoff(handoffId: string): Promise<ContentHandoffDetail> {
  const response = await fetch(`/api/integrations/content-handoff/${encodeURIComponent(handoffId)}`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok || !body?.success) {
    throw new Error(body?.error || body?.message || `handoff 加载失败 (${response.status})`)
  }
  return body.data as ContentHandoffDetail
}

export async function claimHandoffSession(handoffId: string): Promise<{
  token: string
  user: {
    id: string
    username: string
    displayName?: string
    email?: string
  }
  handoff: ContentHandoffDetail & {
    user?: {
      id: string
      username: string
      displayName?: string
      email?: string
    }
  }
}> {
  const response = await fetch(`/api/integrations/content-handoff/${encodeURIComponent(handoffId)}/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok || !body?.success) {
    throw new Error(body?.error || body?.message || `handoff 认领失败 (${response.status})`)
  }
  return body.data
}

export async function submitContentHandoff(input: {
  targetPage: 'word'
  title?: string
  content: string
  contentFormat?: 'text' | 'markdown'
  workspacePath?: string
  sourceApp?: string
  externalId?: string
  metadata?: Record<string, unknown>
}): Promise<{
  handoffId: string
  openUrl: string
  documentId: string
  workspacePath: string
}> {
  const response = await fetch('/api/integrations/content-handoff', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(input),
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok || !body?.success) {
    throw new Error(body?.error || body?.message || `handoff 投递失败 (${response.status})`)
  }
  return body.data
}
