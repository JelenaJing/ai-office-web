import { buildAccountCenterUrl } from './accountCenter'

export interface CanonicalAccountUser {
  id: string
  username: string
  displayName: string
  email: string
  roles: string[]
  permissions?: string[]
  status: 'active' | 'disabled' | string
  mustChangePassword: boolean
}

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => normalizeString(item))
    .filter(Boolean)
}

function normalizeUserCandidate(raw: unknown): CanonicalAccountUser | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const id = normalizeString(record.id ?? record.userId)
  if (!id) return null
  const username = normalizeString(record.username) || normalizeString(record.email) || id
  const email = normalizeString(record.email)
  return {
    id,
    username,
    displayName: normalizeString(record.displayName) || username,
    email,
    roles: normalizeStringArray(record.roles),
    permissions: normalizeStringArray(record.permissions),
    status: normalizeString(record.status) || 'active',
    mustChangePassword: Boolean(record.mustChangePassword),
  }
}

function extractCanonicalUser(raw: unknown): CanonicalAccountUser | null {
  const queue: unknown[] = [raw]
  const seen = new Set<unknown>()

  while (queue.length > 0) {
    const candidate = queue.shift()
    if (!candidate || seen.has(candidate)) continue
    seen.add(candidate)

    const user = normalizeUserCandidate(candidate)
    if (user) return user

    if (candidate && typeof candidate === 'object') {
      const record = candidate as Record<string, unknown>
      queue.push(record.user, record.data, record.result, record.account, record.profile)
      if (Array.isArray(record.users)) queue.push(...record.users)
      if (Array.isArray(record.items)) queue.push(...record.items)
      if (Array.isArray(record.results)) queue.push(...record.results)
    }
  }

  return null
}

async function fetchJson(
  url: string,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const response = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(5000),
  })
  const contentType = response.headers.get('content-type') ?? ''
  const data = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null)
  return { ok: response.ok, status: response.status, data }
}

export async function fetchCanonicalAccountUserByToken(token: string): Promise<CanonicalAccountUser | null> {
  const trimmedToken = normalizeString(token)
  if (!trimmedToken) return null
  try {
    const response = await fetchJson(buildAccountCenterUrl('/api/auth/me'), {
      headers: { Authorization: `Bearer ${trimmedToken}` },
    })
    if (!response.ok) return null
    return extractCanonicalUser(response.data)
  } catch {
    return null
  }
}

function buildResolveAttempts(input: {
  email?: string | null
  username?: string | null
  login?: string | null
}): Array<{ method: 'POST' | 'GET'; path: string; body?: unknown; query?: URLSearchParams }> {
  const email = normalizeString(input.email)
  const username = normalizeString(input.username)
  const login = normalizeString(input.login)
  const identifiers = Array.from(new Set([email, username, login].filter(Boolean)))
  const attempts: Array<{ method: 'POST' | 'GET'; path: string; body?: unknown; query?: URLSearchParams }> = []

  const postBodies: unknown[] = [
    { email, username, login, identifiers },
    { email },
    { username: email || username || login },
    { login: email || username || login },
  ]

  for (const path of ['/api/users/resolve', '/api/users/resolve-by-email']) {
    for (const body of postBodies) {
      attempts.push({ method: 'POST', path, body })
    }
    const query = new URLSearchParams()
    if (email) query.set('email', email)
    if (username) query.set('username', username)
    if (login) query.set('login', login)
    if (identifiers.length > 0) query.set('identifier', identifiers[0])
    attempts.push({ method: 'GET', path, query })
  }

  return attempts
}

export async function resolveCanonicalAccountUser(input: {
  token?: string | null
  email?: string | null
  username?: string | null
  login?: string | null
}): Promise<CanonicalAccountUser | null> {
  const byToken = await fetchCanonicalAccountUserByToken(input.token ?? '')
  if (byToken) return byToken

  for (const attempt of buildResolveAttempts(input)) {
    try {
      const url = attempt.query && Array.from(attempt.query.keys()).length > 0
        ? `${buildAccountCenterUrl(attempt.path)}?${attempt.query.toString()}`
        : buildAccountCenterUrl(attempt.path)
      const response = await fetchJson(url, {
        method: attempt.method,
        headers: attempt.method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
        body: attempt.method === 'POST' ? JSON.stringify(attempt.body ?? {}) : undefined,
      })
      if (!response.ok) continue
      const resolved = extractCanonicalUser(response.data)
      if (resolved) return resolved
    } catch {
      // Try the next known resolve contract.
    }
  }

  return null
}
