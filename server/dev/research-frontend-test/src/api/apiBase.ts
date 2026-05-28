export type ApiEntryMode = 'bff' | 'fastapi-v2'

export function getApiEntryMode(): ApiEntryMode {
  const v = localStorage.getItem('research_test_api_mode')
  return v === 'fastapi-v2' ? 'fastapi-v2' : 'bff'
}

export function setApiEntryMode(mode: ApiEntryMode) {
  localStorage.setItem('research_test_api_mode', mode)
}

export function getAuthToken(): string {
  return (
    localStorage.getItem('research_test_auth_token') ||
    localStorage.getItem('aios_auth_token') ||
    localStorage.getItem('aios_itoken') ||
    ''
  ).trim()
}

export function setAuthToken(token: string) {
  localStorage.setItem('research_test_auth_token', token.trim())
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  const token = getAuthToken()
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

export async function researchFetch(path: string, init?: RequestInit): Promise<Response> {
  const mode = getApiEntryMode()
  let url = path
  if (mode === 'bff') {
    url = path.startsWith('/api') ? path : `/api/research${path}`
  } else {
    url = `/paper-api${path}`
  }
  return fetch(url, {
    ...init,
    headers: {
      ...authHeaders(),
      ...(init?.headers as Record<string, string> | undefined),
    },
  })
}

export async function researchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await researchFetch(path, init)
  const text = await res.text()
  let body: unknown = {}
  try {
    body = text ? JSON.parse(text) : {}
  } catch {
    body = { raw: text }
  }
  if (!res.ok) {
    const err = body as { error?: string; message?: string }
    throw new Error(err.error || err.message || text || res.statusText)
  }
  const envelope = body as { success?: boolean; error?: string }
  if (envelope.success === false) {
    throw new Error(envelope.error || '请求失败')
  }
  return body as T
}
