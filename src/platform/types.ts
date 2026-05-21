import type {
  Department,
  KnowledgeDocumentMeta,
  KnowledgeImportResult,
  KnowledgeLibraryInfo,
} from '../types/knowledge'

export interface UserInfo {
  id: string
  email: string
  name: string
}

export interface AuthResult {
  token: string
  user: UserInfo
}

export interface WorkspaceInfo {
  id: string
  name: string
  path: string        // opaque client path, e.g. web-workspace:{userId}:{wsId}
  isDefault?: boolean
}

export interface FileEntry {
  id: string
  name: string
  ext: string
  mimeType: string
  size: number
  uploadedAt: string
}

export interface ArtifactExport {
  format: string
  filename: string
  url: string
}

export interface Artifact {
  id: string
  type: string
  title: string
  createdAt: string
  exports: ArtifactExport[]
}

export interface SkillInfo {
  id: string
  name: string
  description: string
  category: string
  version: string
  enabled: boolean
}

export interface SkillInput {
  prompt?: string
  workspacePath?: string
  params?: Record<string, unknown>
}

export interface SkillResult {
  success: boolean
  artifact?: Artifact
  taskId?: string
  status?: string
  error?: string
}

export type { Department, KnowledgeLibraryInfo, KnowledgeDocumentMeta, KnowledgeImportResult }

/**
 * Unified platform API — business components must use this instead of
 * calling window.electronAPI directly or scattering fetch('/api/*') calls.
 *
 * Web implementation  → all methods call /api/* with Authorization header.
 * Electron implementation → delegates to window.electronAPI where available;
 *                           throws a clear error for features not supported.
 */
export interface PlatformApi {
  /** Identifies the current runtime environment. */
  readonly platform: 'electron' | 'web'

  auth: {
    login(email: string, password: string): Promise<AuthResult>
    register(email: string, password: string, name: string): Promise<AuthResult>
    logout(): Promise<void>
    /** Returns the currently cached user, or null if not signed in. */
    getCurrentUser(): UserInfo | null
    /** Returns the JWT / session token, or null. */
    getToken(): string | null
  }

  workspaces: {
    /** Returns (or lazily creates) the user's default workspace. */
    getDefault(): Promise<WorkspaceInfo>
    /** Lists all workspaces for the current user. */
    list(): Promise<WorkspaceInfo[]>
    /** Creates a new workspace with the given name. */
    create(name: string): Promise<WorkspaceInfo>
    /** Deletes a workspace by its opaque client path. */
    delete(path: string): Promise<void>
  }

  files: {
    /** Lists all uploaded files in the user's default workspace. */
    list(): Promise<FileEntry[]>
    /** Uploads a file; returns the created FileEntry. */
    upload(file: File): Promise<FileEntry>
    /** Downloads a file via fetch+blob (sends Authorization header). */
    download(fileId: string, filename: string): Promise<void>
    /** Deletes a file by id. */
    delete(fileId: string): Promise<void>
  }

  artifacts: {
    /** Lists all AI-generated artifacts for the current user. */
    list(): Promise<Artifact[]>
    /** Downloads an artifact via fetch+blob (sends Authorization header). */
    download(artifactId: string, filename: string): Promise<void>
    /** Deletes an artifact by id. */
    delete(artifactId: string): Promise<void>
  }

  skills: {
    /** Returns the list of registered skills. */
    list(): Promise<SkillInfo[]>
    /** Runs a skill; returns the result (may include an Artifact). */
    run(skillId: string, input: SkillInput): Promise<SkillResult>
  }

  excel: {
    /** Analyze an uploaded spreadsheet by fileId; produces excel_analysis artifact. */
    analyze(input: {
      fileId: string
      prompt?: string
      options?: Record<string, unknown>
      workspacePath?: string
    }): Promise<{
      artifactId: string
      title?: string
      type?: string
      artifact?: Artifact
    }>
  }

  departments: {
    /** Lists remote knowledge-base partitions exposed as departments. */
    list(): Promise<Department[]>
  }

  knowledge: {
    getBaseInfo(departmentId: string): Promise<KnowledgeLibraryInfo>
    listDocuments(departmentId: string): Promise<KnowledgeDocumentMeta[]>
    importDocuments(departmentId: string): Promise<KnowledgeImportResult>
    deleteDocument(departmentId: string, documentId: string): Promise<void>
  }

  system: {
    /** Returns true if the given feature is available in the current runtime. */
    isFeatureAvailable(featureKey: string): boolean
    /** Returns 'web' or 'electron'. */
    getRuntime(): 'electron' | 'web'
  }
}

