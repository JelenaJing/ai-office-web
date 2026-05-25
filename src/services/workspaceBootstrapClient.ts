const PRIMARY_TOKEN_KEY = 'aios_auth_token'
const USER_KEY = 'aios_auth_user'
const LEGACY_TOKEN_KEYS = ['aios_itoken', 'ai_office_internal_token'] as const

const CURRENT_USER_ID_KEY = 'aios.currentUserId'
const CURRENT_TENANT_ID_KEY = 'aios.currentTenantId'
const CURRENT_WORKSPACE_ID_KEY = 'aios.currentWorkspaceId'
const CURRENT_WORKSPACE_PATH_KEY = 'aios.currentWorkspacePath'

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

export interface CurrentWorkspaceState {
  currentUserId: string | null
  currentTenantId: string | null
  currentWorkspaceId: string | null
  currentWorkspacePath: string | null
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

function readCurrentUserIdFromSession(): string | null {
  const raw = localStorage.getItem(USER_KEY)
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
  }
}

export function clearCurrentWorkspaceState(): void {
  localStorage.removeItem(CURRENT_USER_ID_KEY)
  localStorage.removeItem(CURRENT_TENANT_ID_KEY)
  localStorage.removeItem(CURRENT_WORKSPACE_ID_KEY)
  localStorage.removeItem(CURRENT_WORKSPACE_PATH_KEY)
}

export function persistCurrentWorkspaceState(input: {
  currentUserId?: string | null
  currentTenantId?: string | null
  currentWorkspaceId?: string | null
  currentWorkspacePath?: string | null
}): CurrentWorkspaceState {
  const previous = readCurrentWorkspaceState()
  const has = (key: keyof typeof input) => Object.prototype.hasOwnProperty.call(input, key)
  const next: CurrentWorkspaceState = {
    currentUserId: has('currentUserId') ? (input.currentUserId ?? null) : previous.currentUserId,
    currentTenantId: has('currentTenantId') ? (input.currentTenantId ?? null) : previous.currentTenantId,
    currentWorkspaceId: has('currentWorkspaceId') ? (input.currentWorkspaceId ?? null) : previous.currentWorkspaceId,
    currentWorkspacePath: has('currentWorkspacePath') ? (input.currentWorkspacePath ?? null) : previous.currentWorkspacePath,
  }

  if (next.currentUserId) localStorage.setItem(CURRENT_USER_ID_KEY, next.currentUserId)
  else localStorage.removeItem(CURRENT_USER_ID_KEY)

  if (next.currentTenantId) localStorage.setItem(CURRENT_TENANT_ID_KEY, next.currentTenantId)
  else localStorage.removeItem(CURRENT_TENANT_ID_KEY)

  if (next.currentWorkspaceId) localStorage.setItem(CURRENT_WORKSPACE_ID_KEY, next.currentWorkspaceId)
  else localStorage.removeItem(CURRENT_WORKSPACE_ID_KEY)

  if (next.currentWorkspacePath) localStorage.setItem(CURRENT_WORKSPACE_PATH_KEY, next.currentWorkspacePath)
  else localStorage.removeItem(CURRENT_WORKSPACE_PATH_KEY)

  return next
}

export function persistWorkspaceSelection(input: {
  currentUserId?: string | null
  currentTenantId?: string | null
  currentWorkspacePath?: string | null
  currentWorkspaceId?: string | null
}): CurrentWorkspaceState {
  const resolvedWorkspaceId = input.currentWorkspaceId ?? workspaceIdFromPath(input.currentWorkspacePath)
  return persistCurrentWorkspaceState({
    currentUserId: input.currentUserId,
    currentTenantId: input.currentTenantId,
    currentWorkspaceId: resolvedWorkspaceId,
    currentWorkspacePath: input.currentWorkspacePath,
  })
}

export async function bootstrapWorkspaceForUser(userId?: string | null): Promise<WorkspaceBootstrapPayload> {
  const expectedUserId = userId || readCurrentUserIdFromSession()
  const res = await fetch('/api/workspaces/bootstrap', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ userId: expectedUserId ?? undefined }),
  })

  const payload = await res.json().catch(() => ({ error: res.statusText })) as WorkspaceBootstrapPayload & { error?: string }
  if (!res.ok || !payload?.workspace?.path || !payload.currentWorkspaceId || !payload.currentTenantId) {
    throw new Error(payload.error || '工作区 bootstrap 失败')
  }
  if (expectedUserId && payload.currentUserId !== expectedUserId) {
    throw new Error('工作区 bootstrap 返回的 userId 与当前登录用户不一致')
  }

  persistCurrentWorkspaceState({
    currentUserId: payload.currentUserId,
    currentTenantId: payload.currentTenantId,
    currentWorkspaceId: payload.currentWorkspaceId,
    currentWorkspacePath: payload.currentWorkspacePath || payload.workspace.path,
  })

  return payload
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
  ) {
    return current
  }
  return bootstrapWorkspaceForUser(expectedUserId)
}
