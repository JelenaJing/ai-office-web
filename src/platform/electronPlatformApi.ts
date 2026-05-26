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
  KnowledgeSourceListItem,
} from './types'

type ElectronApiShape = {
  internalAccountGetToken?: () => Promise<string | null>
  internalAccountClearToken?: () => Promise<void>
  listWorkspaces?: () => Promise<Array<{ path: string; name: string }>>
  getWorkspaces?: () => Promise<Array<{ path: string; name: string }>>
  createWorkspace?: (name: string, parentDir?: string) => Promise<{ path: string; name: string }>
  deleteWorkspace?: (path: string) => Promise<void>
  listDepartments?: () => Promise<Department[]>
  getKnowledgeBaseInfo?: (departmentId?: string) => Promise<KnowledgeLibraryInfo>
  listKnowledgeDocuments?: (
    departmentId?: string,
    query?: string,
  ) => Promise<KnowledgeDocumentMeta[]>
  importKnowledgeDocuments?: (departmentId?: string) => Promise<KnowledgeImportResult>
  deleteKnowledgeDocument?: (
    departmentId: string,
    documentId: string,
  ) => Promise<{ success: boolean }>
  [key: string]: unknown
}

function getElectronApi(): ElectronApiShape {
  return (window as unknown as { electronAPI: ElectronApiShape }).electronAPI
}

/** Throws a clear, user-visible error for features not available in Electron. */
function notSupported(feature: string): never {
  throw new Error(
    `"${feature}" 在桌面版中暂不通过统一 API 访问，请使用对应的本地功能。`,
  )
}

/**
 * Electron implementation of PlatformApi.
 *
 * Auth delegates to the existing internalAccount IPC handlers where available.
 * Files and artifacts are not backed by /api in Electron — those methods
 * throw a clear error so callers know to use the local file system instead.
 * Registration is not supported in Electron (accounts are managed externally).
 */
export const electronPlatformApi: PlatformApi = {
  platform: 'electron',

  // ── auth ────────────────────────────────────────────────────────────────────

  auth: {
    async login(email: string, _password: string): Promise<AuthResult> {
      const api = getElectronApi()
      const token =
        typeof api.internalAccountGetToken === 'function'
          ? await api.internalAccountGetToken()
          : null
      return {
        token: token ?? 'electron-session',
        user: { id: 'electron-user', email, name: 'Local User' },
      }
    },

    async register(
      _email: string,
      _password: string,
      _name: string,
    ): Promise<AuthResult> {
      throw new Error('Registration is not supported in Electron mode.')
    },

    async logout(): Promise<void> {
      const api = getElectronApi()
      if (typeof api.internalAccountClearToken === 'function') {
        await api.internalAccountClearToken()
      }
    },

    getCurrentUser(): UserInfo | null {
      // Electron manages its own session via internalAccount; return null here.
      return null
    },

    getToken(): string | null {
      return null
    },
  },

  // ── workspaces ──────────────────────────────────────────────────────────────

  workspaces: {
    async getDefault(): Promise<WorkspaceInfo> {
      const list = await electronPlatformApi.workspaces.list()
      if (list.length === 0) {
        notSupported('workspaces.getDefault — no local workspace; create one in the app')
      }
      const preferred = list.find(w => w.isDefault) ?? list[0]
      return preferred
    },

    async list(): Promise<WorkspaceInfo[]> {
      const api = getElectronApi()
      const listFn = api.listWorkspaces ?? api.getWorkspaces
      if (typeof listFn !== 'function') return []
      const ws = (await listFn.call(api)) ?? []
      return ws.map(w => ({ id: w.path, name: w.name, path: w.path }))
    },

    async create(name: string): Promise<WorkspaceInfo> {
      const api = getElectronApi()
      if (typeof api.createWorkspace !== 'function') {
        notSupported('workspaces.create')
      }
      const result = await api.createWorkspace(name)
      return { id: result.path, name: result.name, path: result.path }
    },

    async delete(wsPath: string): Promise<void> {
      const api = getElectronApi()
      if (typeof api.deleteWorkspace !== 'function') {
        notSupported('workspaces.delete')
      }
      await api.deleteWorkspace(wsPath)
    },
  },

  // ── files ───────────────────────────────────────────────────────────────────
  // In Electron, files are managed through the local workspace file system.
  // Business components that need file I/O on desktop should use
  // window.electronAPI directly (in the Electron-mode branch).

  files: {
    async list(): Promise<FileEntry[]> {
      notSupported('platformApi.files.list')
    },
    async upload(_file: File): Promise<FileEntry> {
      notSupported('platformApi.files.upload')
    },
    async download(_fileId: string, _filename: string): Promise<void> {
      notSupported('platformApi.files.download')
    },
    async delete(_fileId: string): Promise<void> {
      notSupported('platformApi.files.delete')
    },
  },

  // ── artifacts ───────────────────────────────────────────────────────────────

  artifacts: {
    async list(): Promise<Artifact[]> {
      notSupported('platformApi.artifacts.list')
    },
    async get(_artifactId: string): Promise<Artifact> {
      notSupported('platformApi.artifacts.get')
    },
    async download(_artifactId: string, _filename: string): Promise<void> {
      notSupported('platformApi.artifacts.download')
    },
    async delete(_artifactId: string): Promise<void> {
      notSupported('platformApi.artifacts.delete')
    },
  },

  // ── excel ───────────────────────────────────────────────────────────────────
  // Desktop analysis uses ExcelAnalysisWorkbench + excelAnalysisRun (local paths).

  excel: {
    async analyze(input: {
      fileId: string
      prompt?: string
      options?: Record<string, unknown>
      workspacePath?: string
    }): Promise<{
      artifactId: string
      title?: string
      type?: string
    }> {
      const api = getElectronApi()
      const sourcePath =
        (input.options?.sourcePath as string | undefined) ??
        (input.options?.localPath as string | undefined)
      if (!sourcePath || typeof api.excelAnalysisRun !== 'function') {
        notSupported(
          'platformApi.excel.analyze — 桌面版请使用「数据分析」工作台（本地文件路径）',
        )
      }
      const wsPath =
        input.workspacePath ??
        (input.options?.workspacePath as string | undefined) ??
        ''
      const raw = (await api.excelAnalysisRun({
        workspacePath: wsPath,
        sourcePath,
        userRequirement: input.prompt ?? '',
        dataModelId: String(input.options?.dataModelId ?? ''),
      })) as Record<string, unknown>
      if (!raw?.ok) {
        throw new Error(String(raw?.error ?? raw?.message ?? 'Excel 分析失败'))
      }
      return {
        artifactId: String(raw.artifactId ?? raw.taskId ?? ''),
        title: String(raw.title ?? '表格分析'),
        type: 'excel_analysis',
      }
    },
  },

  // ── skills ──────────────────────────────────────────────────────────────────

  skills: {
    async list(): Promise<SkillInfo[]> {
      // Legacy skills are registered via Electron IPC; return empty here.
      return []
    },
    async run(_skillId: string, _input: SkillInput): Promise<SkillResult> {
      notSupported('platformApi.skills.run')
    },
  },

  // ── departments / remote knowledge ─────────────────────────────────────────

  departments: {
    async list(): Promise<Department[]> {
      const api = getElectronApi()
      if (typeof api.listDepartments !== 'function') {
        notSupported('departments.list')
      }
      return api.listDepartments()
    },
  },

  knowledge: {
    async getBaseInfo(departmentId: string): Promise<KnowledgeLibraryInfo> {
      const api = getElectronApi()
      if (typeof api.getKnowledgeBaseInfo !== 'function') {
        notSupported('knowledge.getBaseInfo')
      }
      return api.getKnowledgeBaseInfo(departmentId)
    },

    async listDocuments(departmentId: string): Promise<KnowledgeDocumentMeta[]> {
      const api = getElectronApi()
      if (typeof api.listKnowledgeDocuments !== 'function') {
        notSupported('knowledge.listDocuments')
      }
      return api.listKnowledgeDocuments(departmentId)
    },

    async listSources(): Promise<KnowledgeSourceListItem[]> {
      const api = getElectronApi()
      if (typeof api.listDepartments !== 'function' || typeof api.listKnowledgeDocuments !== 'function') {
        notSupported('knowledge.listSources')
      }
      const departments = await api.listDepartments()
      const documentGroups = await Promise.all(
        departments.map(async (department) => ({
          department,
          documents: await api.listKnowledgeDocuments?.(department.id) ?? [],
        })),
      )
      return documentGroups.flatMap(({ department, documents }) => (
        documents.map((document) => ({
          id: document.id,
          title: document.title || document.originalName || document.id,
          sourceType: document.documentCategory === 'academic'
            ? 'literature'
            : 'knowledge_base',
          provider: 'remote' as const,
          trustLevel: document.extractionStatus === 'failed'
            ? 'unverified'
            : document.extractionStatus === 'ready'
              ? 'partial'
              : 'unknown',
          updatedAt: document.updatedAt || document.importedAt,
          metadata: {
            departmentId: department.id,
            departmentName: department.name,
            originalName: document.originalName,
          },
        }))
      ))
    },

    async importDocuments(departmentId: string): Promise<KnowledgeImportResult> {
      const api = getElectronApi()
      if (typeof api.importKnowledgeDocuments !== 'function') {
        notSupported('knowledge.importDocuments')
      }
      return api.importKnowledgeDocuments(departmentId)
    },

    async deleteDocument(departmentId: string, documentId: string): Promise<void> {
      const api = getElectronApi()
      if (typeof api.deleteKnowledgeDocument !== 'function') {
        notSupported('knowledge.deleteDocument')
      }
      await api.deleteKnowledgeDocument(departmentId, documentId)
    },
  },

  calendar: {
    async listEvents() {
      notSupported('calendar.listEvents')
    },
    async createEvent() {
      notSupported('calendar.createEvent')
    },
    async updateEvent() {
      notSupported('calendar.updateEvent')
    },
    async deleteEvent() {
      notSupported('calendar.deleteEvent')
    },
  },

  email: {
    async getAccount() {
      notSupported('email.getAccount')
    },
    async saveAccount() {
      notSupported('email.saveAccount')
    },
    async testConnection() {
      notSupported('email.testConnection')
    },
    async listMessages() {
      notSupported('email.listMessages')
    },
    async getMessage() {
      notSupported('email.getMessage')
    },
    async sendMessage() {
      notSupported('email.sendMessage')
    },
    async discoverFolders() {
      notSupported('email.discoverFolders')
    },
  },

  settings: {
    async getAi() {
      notSupported('settings.getAi')
    },
    async testAi() {
      notSupported('settings.testAi')
    },
  },

  store: {
    async getEmbedUrl() {
      notSupported('store.getEmbedUrl')
    },
  },

  // ── system ──────────────────────────────────────────────────────────────────

  system: {
    isFeatureAvailable(featureKey: string): boolean {
      const electronFeatures = new Set([
        'auth',
        'workspaces',
        'local.files',
        'local.editor',
        'email',
        'ppt',
        'excel',
        'knowledge',
      ])
      return electronFeatures.has(featureKey)
    },

    getRuntime(): 'electron' {
      return 'electron'
    },
  },
}
