import { resolveWebApiUrl } from '../runtime/apiBase'

const PRIMARY_TOKEN_KEY = 'aios_auth_token'
const USER_KEY = 'aios_auth_user'
const LEGACY_TOKEN_KEYS = ['aios_itoken', 'ai_office_internal_token'] as const

const CURRENT_USER_ID_KEY = 'aios.currentUserId'
const CURRENT_TENANT_ID_KEY = 'aios.currentTenantId'
const CURRENT_WORKSPACE_ID_KEY = 'aios.currentWorkspaceId'
const CURRENT_WORKSPACE_PATH_KEY = 'aios.currentWorkspacePath'
const CURRENT_WORKSPACE_ROLE_KEY = 'aios.currentWorkspaceRole'

export interface WorkspaceBootstrapPayload {
  success: boolean
  currentUserId: string
  currentTenantId: string
  currentWorkspaceId: string
  currentWorkspacePath: string
  currentWorkspaceName?: string
  role?: string
  workspace: {
    id: string
    name: string
    path: string
    isDefault?: boolean
    tenantId?: string
  }
}

export interface MeContextPayload {
  userId: string
  username: string
  displayName?: string
  currentTenantId: string
  currentWorkspaceId: string
  currentWorkspacePath?: string
  currentWorkspaceRole: string
  connectedMailbox?: {
    configured: true
    email?: string
    status?: string
    verified?: boolean
    lastVerifiedAt?: string
    provider?: string
    displayName?: string
    isDefaultSend?: boolean
    isDefaultReceive?: boolean
  } | { configured: false }
}

export interface CurrentWorkspaceState {
  currentUserId: string | null
  currentTenantId: string | null
  currentWorkspaceId: string | null
  currentWorkspacePath: string | null
  currentWorkspaceRole: string | null
}

export class WorkspaceApiError extends Error {
  readonly method: string
  readonly path: string
  readonly url: string
  readonly status: number
  readonly responseBody: string
  readonly code?: string

  constructor(input: {
    method: string
    path: string
    url: string
    status: number
    responseBody: string
    code?: string
  }) {
    super(`${input.method} ${input.path} failed (${input.status}): ${input.responseBody || 'empty response'}`)
    this.name = 'WorkspaceApiError'
    this.method = input.method
    this.path = input.path
    this.url = input.url
    this.status = input.status
    this.responseBody = input.responseBody
    this.code = input.code
  }
}

function storedToken(): string | null {
  return (
    localStorage.getItem(PRIMARY_TOKEN_KEY)
    ?? localStorage.getItem(LEGACY_TOKEN_KEYS[0])
    ?? localStorage.getItem(LEGACY_TOKEN_KEYS[1])
    ?? null
  )
}

function authHeaders(): Record<string, string> {
  const token = storedToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function apiSourceHint(url: string): string {
  if (typeof window === 'undefined') return 'unknown'
  try {
    const parsed = new URL(url)
    if (parsed.origin === window.location.origin) return 'vite-or-same-origin'
    return 'backend-api'
  } catch {
    return 'unknown'
  }
}

async function readResponseBody(res: Response): Promise<{ raw: string; json: Record<string, unknown> | null }> {
  const text = await res.text().catch(() => '')
  if (!text) return { raw: '', json: null }
  try {
    const parsed = JSON.parse(text)
    return {
      raw: text,
      json: parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : null,
    }
  } catch {
    return { raw: text, json: null }
  }
}

async function workspaceFetch<T>(
  path: string,
  init: RequestInit & { method: string },
): Promise<T> {
  const url = resolveWebApiUrl(path)
  let res: Response
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        ...authHeaders(),
        ...(init.headers as Record<string, string> | undefined),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`[workspace-api] ${init.method} ${url} network failure source=${apiSourceHint(url)} body=${message}`)
    throw new WorkspaceApiError({
      method: init.method,
      path,
      url,
      status: 0,
      responseBody: message,
    })
  }

  const body = await readResponseBody(res)
  if (!res.ok) {
    console.warn(`[workspace-api] ${init.method} ${url} status=${res.status} source=${apiSourceHint(url)} body=${body.raw || res.statusText}`)
    throw new WorkspaceApiError({
      method: init.method,
      path,
      url,
      status: res.status,
      responseBody: body.raw || res.statusText,
      code: typeof body.json?.code === 'string' ? body.json.code : undefined,
    })
  }
  console.info(`[workspace-api] ${init.method} ${url} status=${res.status} source=${apiSourceHint(url)}`)
  return (body.json ?? {}) as T
}

function readCurrentUserIdFromSession(): string | null {
  const raw = localStorage.getItem(USER_KEY) || localStorage.getItem('ai_office_internal_user')
  if (!raw) return null
  try {
    const user = JSON.parse(raw) as { id?: string }
    return typeof user.id === 'string' ? user.id : null
  } catch {
    return null
  }
}

export function workspaceIdFromPath(workspacePath: string | null | undefined): string | null {
  const match = String(workspacePath || '').match(/^web-workspace:[^:]+:(.+)$/)
  return match?.[1] ?? null
}

export function readCurrentWorkspaceState(): CurrentWorkspaceState {
  return {
    currentUserId: localStorage.getItem(CURRENT_USER_ID_KEY),
    currentTenantId: localStorage.getItem(CURRENT_TENANT_ID_KEY),
    currentWorkspaceId: localStorage.getItem(CURRENT_WORKSPACE_ID_KEY),
    currentWorkspacePath: localStorage.getItem(CURRENT_WORKSPACE_PATH_KEY),
    currentWorkspaceRole: localStorage.getItem(CURRENT_WORKSPACE_ROLE_KEY),
  }
}

export function clearCurrentWorkspaceState(): void {
  localStorage.removeItem(CURRENT_USER_ID_KEY)
  localStorage.removeItem(CURRENT_TENANT_ID_KEY)
  localStorage.removeItem(CURRENT_WORKSPACE_ID_KEY)
  localStorage.removeItem(CURRENT_WORKSPACE_PATH_KEY)
  localStorage.removeItem(CURRENT_WORKSPACE_ROLE_KEY)
}

export function persistCurrentWorkspaceState(input: {
  currentUserId?: string | null
  currentTenantId?: string | null
  currentWorkspaceId?: string | null
  currentWorkspacePath?: string | null
  currentWorkspaceRole?: string | null
}): CurrentWorkspaceState {
  const previous = readCurrentWorkspaceState()
  const has = (key: keyof typeof input) => Object.prototype.hasOwnProperty.call(input, key)
  const next: CurrentWorkspaceState = {
    currentUserId: has('currentUserId') ? (input.currentUserId ?? null) : previous.currentUserId,
    currentTenantId: has('currentTenantId') ? (input.currentTenantId ?? null) : previous.currentTenantId,
    currentWorkspaceId: has('currentWorkspaceId') ? (input.currentWorkspaceId ?? null) : previous.currentWorkspaceId,
    currentWorkspacePath: has('currentWorkspacePath') ? (input.currentWorkspacePath ?? null) : previous.currentWorkspacePath,
    currentWorkspaceRole: has('currentWorkspaceRole') ? (input.currentWorkspaceRole ?? null) : previous.currentWorkspaceRole,
  }

  if (next.currentUserId) localStorage.setItem(CURRENT_USER_ID_KEY, next.currentUserId)
  else localStorage.removeItem(CURRENT_USER_ID_KEY)

  if (next.currentTenantId) localStorage.setItem(CURRENT_TENANT_ID_KEY, next.currentTenantId)
  else localStorage.removeItem(CURRENT_TENANT_ID_KEY)

  if (next.currentWorkspaceId) localStorage.setItem(CURRENT_WORKSPACE_ID_KEY, next.currentWorkspaceId)
  else localStorage.removeItem(CURRENT_WORKSPACE_ID_KEY)

  if (next.currentWorkspacePath) localStorage.setItem(CURRENT_WORKSPACE_PATH_KEY, next.currentWorkspacePath)
  else localStorage.removeItem(CURRENT_WORKSPACE_PATH_KEY)

  if (next.currentWorkspaceRole) localStorage.setItem(CURRENT_WORKSPACE_ROLE_KEY, next.currentWorkspaceRole)
  else localStorage.removeItem(CURRENT_WORKSPACE_ROLE_KEY)

  return next
}

export function persistWorkspaceSelection(input: {
  currentUserId?: string | null
  currentTenantId?: string | null
  currentWorkspacePath?: string | null
  currentWorkspaceId?: string | null
  currentWorkspaceRole?: string | null
}): CurrentWorkspaceState {
  const resolvedWorkspaceId = input.currentWorkspaceId ?? workspaceIdFromPath(input.currentWorkspacePath)
  return persistCurrentWorkspaceState({
    currentUserId: input.currentUserId,
    currentTenantId: input.currentTenantId,
    currentWorkspaceId: resolvedWorkspaceId,
    currentWorkspacePath: input.currentWorkspacePath,
    currentWorkspaceRole: input.currentWorkspaceRole,
  })
}

function persistMeContext(payload: MeContextPayload): CurrentWorkspaceState {
  return persistCurrentWorkspaceState({
    currentUserId: payload.userId,
    currentTenantId: payload.currentTenantId,
    currentWorkspaceId: payload.currentWorkspaceId,
    currentWorkspacePath: payload.currentWorkspacePath || (
      payload.currentWorkspaceId ? `web-workspace:${payload.userId}:${payload.currentWorkspaceId}` : null
    ),
    currentWorkspaceRole: payload.currentWorkspaceRole,
  })
}

export async function getMeContext(): Promise<MeContextPayload> {
  const payload = await workspaceFetch<MeContextPayload>('/api/me/context', {
    method: 'GET',
  })
  if (!payload.userId || !payload.currentTenantId || !payload.currentWorkspaceId || !payload.currentWorkspaceRole) {
    const isMissingWorkspace = Boolean(payload.userId) && (
      !payload.currentTenantId || !payload.currentWorkspaceId || !payload.currentWorkspaceRole
    )
    throw new WorkspaceApiError({
      method: 'GET',
      path: '/api/me/context',
      url: resolveWebApiUrl('/api/me/context'),
      status: 500,
      responseBody: isMissingWorkspace
        ? 'NO_WORKSPACE: context response missing workspace fields'
        : 'context response missing user fields',
      code: isMissingWorkspace ? 'NO_WORKSPACE' : 'INVALID_CONTEXT',
    })
  }
  persistMeContext(payload)
  return payload
}

export async function bootstrapWorkspaceForUser(userId?: string | null): Promise<WorkspaceBootstrapPayload> {
  const expectedUserId = userId || readCurrentUserIdFromSession()
  const payload = await workspaceFetch<WorkspaceBootstrapPayload>('/api/workspaces/bootstrap', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId: expectedUserId ?? undefined }),
  })
  if (!payload?.workspace?.path || !payload.currentWorkspaceId || !payload.currentTenantId) {
    throw new WorkspaceApiError({
      method: 'POST',
      path: '/api/workspaces/bootstrap',
      url: resolveWebApiUrl('/api/workspaces/bootstrap'),
      status: 500,
      responseBody: 'bootstrap response missing workspace fields',
      code: 'INVALID_BOOTSTRAP',
    })
  }
  if (expectedUserId && payload.currentUserId !== expectedUserId) {
    throw new WorkspaceApiError({
      method: 'POST',
      path: '/api/workspaces/bootstrap',
      url: resolveWebApiUrl('/api/workspaces/bootstrap'),
      status: 403,
      responseBody: '工作区 bootstrap 返回的 userId 与当前登录用户不一致',
      code: 'USER_MISMATCH',
    })
  }

  persistCurrentWorkspaceState({
    currentUserId: payload.currentUserId,
    currentTenantId: payload.currentTenantId,
    currentWorkspaceId: payload.currentWorkspaceId,
    currentWorkspacePath: payload.currentWorkspacePath || payload.workspace.path,
    currentWorkspaceRole: payload.role || null,
  })

  return payload
}

function shouldBootstrapAfterContextFailure(error: unknown): boolean {
  if (!(error instanceof WorkspaceApiError)) return false
  return error.status === 404
    || error.code === 'NO_WORKSPACE'
    || /NO_WORKSPACE|workspace|工作区|Not found/i.test(error.responseBody)
}

export async function initializeWorkspaceContext(userId?: string | null): Promise<WorkspaceBootstrapPayload | MeContextPayload> {
  try {
    return await getMeContext()
  } catch (error) {
    if (!shouldBootstrapAfterContextFailure(error)) throw error
    clearCurrentWorkspaceState()
    return bootstrapWorkspaceForUser(userId)
  }
}

export async function ensureWorkspaceBootstrap(userId?: string | null): Promise<CurrentWorkspaceState | WorkspaceBootstrapPayload | null> {
  const expectedUserId = userId || readCurrentUserIdFromSession()
  if (!expectedUserId) return null
  const current = readCurrentWorkspaceState()
  if (
    current.currentUserId === expectedUserId
    && current.currentTenantId
    && current.currentWorkspaceId
    && current.currentWorkspacePath
    && current.currentWorkspaceRole
  ) {
    return current
  }
  return initializeWorkspaceContext(expectedUserId)
}
