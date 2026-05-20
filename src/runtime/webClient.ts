/**
 * webClient.ts — 面向后端 REST API 的 fetch 封装
 *
 * 统一处理认证 Header、JSON 序列化和错误解析。
 * 所有请求都发向 VITE_API_URL（默认 http://localhost:3001）。
 */

function getApiBase(): string {
  const envUrl = (import.meta as unknown as { env: Record<string, string | undefined> })
    .env?.VITE_API_URL
  return envUrl ?? 'http://localhost:3001'
}

function getStoredToken(): string | null {
  try {
    // 尝试从 platformApi 的 localStorage key 读取 JWT
    return (
      localStorage.getItem('aios_auth_token') ||
      localStorage.getItem('ai_office_internal_token') ||
      null
    )
  } catch {
    return null
  }
}

export async function apiGet<T>(path: string, token?: string): Promise<T> {
  const headers: Record<string, string> = {}
  const t = token ?? getStoredToken()
  if (t) headers['Authorization'] = `Bearer ${t}`

  const res = await fetch(`${getApiBase()}${path}`, { headers })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error((body as { message?: string }).message ?? res.statusText)
  }
  return res.json() as Promise<T>
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const t = token ?? getStoredToken()
  if (t) headers['Authorization'] = `Bearer ${t}`

  const res = await fetch(`${getApiBase()}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const payload = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error((payload as { message?: string }).message ?? res.statusText)
  }
  return res.json() as Promise<T>
}
