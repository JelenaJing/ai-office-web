import type { Artifact } from '../../../platform/types'

function readAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return (
    window.localStorage.getItem('aios_auth_token')
    ?? window.localStorage.getItem('aios_itoken')
    ?? window.localStorage.getItem('ai_office_internal_token')
  )
}

function authHeaders(json = false): Record<string, string> {
  const token = readAuthToken()
  const headers: Record<string, string> = json ? { 'Content-Type': 'application/json' } : {}
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

export async function renameArtifact(artifactId: string, title: string): Promise<Artifact> {
  const response = await fetch(`/api/artifacts/${artifactId}`, {
    method: 'PATCH',
    headers: authHeaders(true),
    body: JSON.stringify({ title }),
  })
  const body = await response.json().catch(() => ({ message: `HTTP ${response.status}` })) as {
    artifact?: Artifact
    message?: string
  }
  if (!response.ok || !body.artifact) {
    throw new Error(body.message || `重命名失败 (${response.status})`)
  }
  return body.artifact
}

export async function deleteArtifact(artifactId: string): Promise<void> {
  const response = await fetch(`/api/artifacts/${artifactId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: `HTTP ${response.status}` })) as { message?: string }
    throw new Error(body.message || `删除失败 (${response.status})`)
  }
}

export function previewArtifactUrl(artifactId: string): string {
  return `/api/artifacts/${artifactId}/preview`
}
