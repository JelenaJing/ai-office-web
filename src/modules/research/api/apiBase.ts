import { platformApi } from '../../../platform'

export type ApiEntryMode = 'bff'

/** 主站科研模块固定走 Express BFF */
export function getApiEntryMode(): ApiEntryMode {
  return 'bff'
}

export function getAuthToken(): string {
  return (platformApi.auth.getToken() || '').trim()
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  const token = getAuthToken()
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

export async function researchFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = path.startsWith('/api') ? path : `/api/research${path}`
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
