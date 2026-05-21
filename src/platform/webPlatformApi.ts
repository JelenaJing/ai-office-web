import type {
  PlatformApi,
  AuthResult,
  UserInfo,
  WorkspaceInfo,
  FileEntry,
  Artifact,
  SkillInfo,
  SkillInput,
  SkillResult,
  Department,
  KnowledgeLibraryInfo,
  KnowledgeDocumentMeta,
  KnowledgeImportResult,
} from './types'

// ── Token storage ─────────────────────────────────────────────────────────────
// Check all known token keys so that sessions created by the legacy login flow
// (aios_itoken / ai_office_internal_token) still work after migration.

const PRIMARY_TOKEN_KEY = 'aios_auth_token'
const USER_KEY = 'aios_auth_user'
const LEGACY_TOKEN_KEYS = ['aios_itoken', 'ai_office_internal_token'] as const

function storedToken(): string | null {
  return (
    localStorage.getItem(PRIMARY_TOKEN_KEY) ??
    localStorage.getItem(LEGACY_TOKEN_KEYS[0]) ??
    localStorage.getItem(LEGACY_TOKEN_KEYS[1]) ??
    null
  )
}

function authHeaders(): Record<string, string> {
  const t = storedToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

/** Thrown by apiFetch when the server returns a non-2xx status. */
export class ApiFetchError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiFetchError'
    this.status = status
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      ...authHeaders(),
      ...(init?.headers as Record<string, string> | undefined),
    },
  })
  if (!res.ok) {
    const payload = await res.json().catch(() => ({ message: res.statusText }))
    const message =
      (payload as { message?: string; error?: string }).message ??
      (payload as { error?: string }).error ??
      res.statusText
    throw new ApiFetchError(res.status, message)
  }
  return res.json() as Promise<T>
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

/** Fetch a protected resource and trigger a browser file download. */
async function downloadBlob(url: string, filename: string): Promise<void> {
  const res = await fetch(url, { headers: authHeaders() })
  if (!res.ok) throw new Error(`下载失败 (${res.status})`)
  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(objectUrl)
}

// ── Web PlatformApi implementation ────────────────────────────────────────────

/**
 * Web implementation of PlatformApi.
 *
 * All methods call /api/* with the user's Authorization header.
 * Token and user info are persisted to localStorage.
 * Downloads use fetch + Blob + createObjectURL (never bare <a href>).
 */
export const webPlatformApi: PlatformApi = {
  platform: 'web',

  // ── auth ────────────────────────────────────────────────────────────────────

  auth: {
    async login(email: string, password: string): Promise<AuthResult> {
      const result = await apiPost<AuthResult>('/api/auth/login', {
        email,
        password,
      })
      localStorage.setItem(PRIMARY_TOKEN_KEY, result.token)
      localStorage.setItem(USER_KEY, JSON.stringify(result.user))
      return result
    },

    async register(
      email: string,
      password: string,
      name: string,
    ): Promise<AuthResult> {
      const result = await apiPost<AuthResult>('/api/auth/register', {
        email,
        password,
        name,
      })
      localStorage.setItem(PRIMARY_TOKEN_KEY, result.token)
      localStorage.setItem(USER_KEY, JSON.stringify(result.user))
      return result
    },

    async logout(): Promise<void> {
      localStorage.removeItem(PRIMARY_TOKEN_KEY)
      LEGACY_TOKEN_KEYS.forEach(k => localStorage.removeItem(k))
      localStorage.removeItem(USER_KEY)
    },

    getCurrentUser(): UserInfo | null {
      const raw = localStorage.getItem(USER_KEY)
      if (!raw) return null
      try {
        return JSON.parse(raw) as UserInfo
      } catch {
        return null
      }
    },

    getToken(): string | null {
      return storedToken()
    },
  },

  // ── workspaces ──────────────────────────────────────────────────────────────

  workspaces: {
    async getDefault(): Promise<WorkspaceInfo> {
      const data = await apiFetch<{
        success: boolean
        workspace: { name: string; path: string; isDefault?: boolean }
      }>('/api/workspaces/default')
      const w = data.workspace
      return { id: w.path, name: w.name, path: w.path, isDefault: w.isDefault }
    },

    async list(): Promise<WorkspaceInfo[]> {
      const data = await apiFetch<{
        workspaces: Array<{ name: string; path: string; isDefault?: boolean }>
      }>('/api/workspaces')
      return (data.workspaces ?? []).map(w => ({
        id: w.path,
        name: w.name,
        path: w.path,
        isDefault: w.isDefault,
      }))
    },

    async create(name: string): Promise<WorkspaceInfo> {
      const data = await apiPost<{ success: boolean; name: string; path: string }>(
        '/api/workspaces',
        { name },
      )
      return { id: data.path, name: data.name, path: data.path }
    },

    async delete(path: string): Promise<void> {
      await apiFetch<{ success: boolean }>('/api/workspaces', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      })
    },
  },

  // ── files ───────────────────────────────────────────────────────────────────

  files: {
    async list(): Promise<FileEntry[]> {
      const data = await apiFetch<{ files: FileEntry[] }>('/api/files')
      return data.files ?? []
    },

    async upload(file: File): Promise<FileEntry> {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/files/upload', {
        method: 'POST',
        headers: authHeaders(),
        body: form,
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error(
          (payload as { error?: string }).error ?? `上传失败 (${res.status})`,
        )
      }
      const data = await res.json() as {
        success: boolean
        file?: FileEntry
        error?: string
      }
      if (!data.success) throw new Error(data.error ?? '上传失败')
      if (!data.file) throw new Error('服务器未返回文件信息')
      return data.file
    },

    async download(fileId: string, filename: string): Promise<void> {
      await downloadBlob(`/api/files/${fileId}/download`, filename)
    },

    async delete(fileId: string): Promise<void> {
      await apiFetch<void>(`/api/files/${fileId}`, { method: 'DELETE' })
    },
  },

  // ── artifacts ───────────────────────────────────────────────────────────────

  artifacts: {
    async list(): Promise<Artifact[]> {
      const data = await apiFetch<{ artifacts: Artifact[] }>('/api/artifacts')
      return data.artifacts ?? []
    },

    async download(artifactId: string, filename: string): Promise<void> {
      await downloadBlob(`/api/artifacts/${artifactId}/download`, filename)
    },

    async delete(artifactId: string): Promise<void> {
      await apiFetch<void>(`/api/artifacts/${artifactId}`, { method: 'DELETE' })
    },
  },

  // ── skills ──────────────────────────────────────────────────────────────────

  skills: {
    async list(): Promise<SkillInfo[]> {
      const data = await apiFetch<{ skills: SkillInfo[] }>('/api/skills')
      return data.skills ?? []
    },

    async run(skillId: string, input: SkillInput): Promise<SkillResult> {
      return apiPost<SkillResult>(
        `/api/skills/${encodeURIComponent(skillId)}/run`,
        input,
      )
    },
  },

  // ── departments / remote knowledge ─────────────────────────────────────────

  departments: {
    async list(): Promise<Department[]> {
      const data = await apiFetch<{ departments: Department[] }>('/api/departments')
      return data.departments ?? []
    },
  },

  knowledge: {
    async getBaseInfo(departmentId: string): Promise<KnowledgeLibraryInfo> {
      return apiFetch<KnowledgeLibraryInfo>(
        `/api/knowledge/${encodeURIComponent(departmentId)}/info`,
      )
    },

    async listDocuments(departmentId: string): Promise<KnowledgeDocumentMeta[]> {
      const data = await apiFetch<{ documents: KnowledgeDocumentMeta[] }>(
        `/api/knowledge/${encodeURIComponent(departmentId)}/documents`,
      )
      return data.documents ?? []
    },

    async importDocuments(departmentId: string): Promise<KnowledgeImportResult> {
      const res = await fetch(
        `/api/knowledge/${encodeURIComponent(departmentId)}/import`,
        {
          method: 'POST',
          headers: authHeaders(),
        },
      )
      const payload = await res.json().catch(() => ({
        message: res.statusText,
      })) as KnowledgeImportResult & { message?: string }
      if (!res.ok) {
        throw new Error(
          payload.message ??
            (payload as { error?: string }).error ??
            `导入失败 (${res.status})`,
        )
      }
      return payload
    },

    async deleteDocument(departmentId: string, documentId: string): Promise<void> {
      await apiFetch<{ success: boolean }>(
        `/api/knowledge/${encodeURIComponent(departmentId)}/documents/${encodeURIComponent(documentId)}`,
        { method: 'DELETE' },
      )
    },
  },

  // ── system ──────────────────────────────────────────────────────────────────

  system: {
    isFeatureAvailable(featureKey: string): boolean {
      const webFeatures = new Set([
        'auth',
        'workspaces',
        'files',
        'artifacts',
        'skills',
        'docx.create',
        'web.docx.create',
        'file.upload',
        'file.download',
        'file.delete',
        'artifact.list',
        'artifact.download',
        'knowledge',
        'departments',
      ])
      return webFeatures.has(featureKey)
    },

    getRuntime(): 'web' {
      return 'web'
    },
  },
}
