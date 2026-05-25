import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { isWebShim } from '../platform/detect'
import { platformApi } from '../platform'
import type { WorkspaceInfo as PlatformWorkspaceInfo } from '../platform/types'
import { useInternalAccount, useInternalSession } from './InternalAccountContext'
import {
  bootstrapWorkspaceForUser,
  clearCurrentWorkspaceState,
  persistCurrentWorkspaceState,
  persistWorkspaceSelection,
  readCurrentWorkspaceState,
  workspaceIdFromPath,
} from '../services/workspaceBootstrapClient'

export interface FileTreeNode {
  name: string
  path: string
  relativePath: string
  type: 'file' | 'folder'
  size?: number
  children?: FileTreeNode[]
}

interface WorkspaceInfo {
  name: string
  path: string
  hasDocument: boolean
  modifiedAt: string
}

interface WorkspaceState {
  workspaceRoot: string | null
  projectRoot: string | null
  activeWorkspacePath: string | null
  activeWorkspaceName: string | null
  currentUserId: string | null
  currentTenantId: string | null
  currentWorkspaceId: string | null
  initialized: boolean
  initError: string | null
  fileTree: FileTreeNode[]
  fileTreeData: FileTreeNode[]
  workspaces: WorkspaceInfo[]
  loading: boolean
  createWorkspace: (name: string, parentDir?: string) => Promise<string | null>
  renameWorkspace: (wsPath: string, nextName: string) => Promise<string | null>
  registerWorkspace: (wsPath: string) => Promise<string | null>
  openWorkspace: (wsPath: string) => Promise<void>
  closeWorkspace: () => void
  refreshTree: () => Promise<void>
  refreshWorkspaces: () => Promise<void>
  deleteWorkspace: (wsPath: string) => Promise<void>
  initializeDefaultWorkspace: () => Promise<void>
}

const WorkspaceContext = createContext<WorkspaceState | null>(null)

export function useWorkspace(): WorkspaceState {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace 必须在 WorkspaceProvider 内使用')
  return ctx
}

function workspaceNameFromToken(wsPath: string, fallback?: string): string {
  if (fallback) return fallback
  const parts = wsPath.split(':')
  return parts[parts.length - 1] || wsPath
}

function workspaceOwnerFromToken(wsPath: string | null | undefined): string | null {
  const match = String(wsPath || '').match(/^web-workspace:([^:]+):/)
  return match?.[1] ?? null
}

function toWorkspaceInfo(ws: PlatformWorkspaceInfo): WorkspaceInfo {
  return {
    name: ws.name,
    path: ws.path,
    hasDocument: true,
    modifiedAt: new Date().toISOString(),
  }
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const internalSession = useInternalSession()
  const { state: accountState } = useInternalAccount()
  const initialWorkspaceState = readCurrentWorkspaceState()
  const [workspaceRoot, setWorkspaceRoot] = useState<string | null>(null)
  const [projectRoot, setProjectRoot] = useState<string | null>(null)
  const [activeWorkspacePath, setActiveWorkspacePath] = useState<string | null>(null)
  const [activeWorkspaceName, setActiveWorkspaceName] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(initialWorkspaceState.currentUserId)
  const [currentTenantId, setCurrentTenantId] = useState<string | null>(initialWorkspaceState.currentTenantId)
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(initialWorkspaceState.currentWorkspaceId)
  const [initialized, setInitialized] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  const [fileTree, setFileTree] = useState<FileTreeNode[]>([])
  const [workspaces, setWorkspaces] = useState<WorkspaceInfo[]>([])
  const [loading, setLoading] = useState(false)

  const applyWebWorkspace = useCallback((ws: PlatformWorkspaceInfo) => {
    const name = ws.name || '默认工作区'
    const wsPath = ws.path
    const selection = persistWorkspaceSelection({
      currentUserId: internalSession?.user.id ?? readCurrentWorkspaceState().currentUserId,
      currentTenantId: ws.tenantId ?? readCurrentWorkspaceState().currentTenantId,
      currentWorkspacePath: wsPath,
      currentWorkspaceId: ws.id || workspaceIdFromPath(wsPath),
    })
    setWorkspaceRoot(wsPath)
    setProjectRoot(wsPath)
    setActiveWorkspacePath(wsPath)
    setActiveWorkspaceName(name)
    setCurrentUserId(selection.currentUserId)
    setCurrentTenantId(selection.currentTenantId)
    setCurrentWorkspaceId(selection.currentWorkspaceId)
    setFileTree([])
    setWorkspaces([toWorkspaceInfo({ ...ws, name, path: wsPath })])
  }, [internalSession?.user.id])

  const initializeDefaultWorkspace = useCallback(async () => {
    if (!isWebShim()) return
    const expectedUserId = internalSession?.user.id ?? null
    if (!expectedUserId) return
    setLoading(true)
    setInitError(null)
    try {
      const bootstrap = await bootstrapWorkspaceForUser(expectedUserId)
      if (!bootstrap.workspace?.path) {
        throw new Error('服务器未返回有效的工作区路径')
      }
      setCurrentUserId(bootstrap.currentUserId)
      setCurrentTenantId(bootstrap.currentTenantId)
      setCurrentWorkspaceId(bootstrap.currentWorkspaceId)
      applyWebWorkspace({
        id: bootstrap.currentWorkspaceId,
        name: bootstrap.workspace.name,
        path: bootstrap.workspace.path,
        isDefault: bootstrap.workspace.isDefault,
        tenantId: bootstrap.currentTenantId,
        userId: bootstrap.currentUserId,
      })
      setInitError(null)
      setInitialized(true)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setInitError(message || '默认工作区初始化失败')
      setInitialized(true)
    } finally {
      setLoading(false)
    }
  }, [applyWebWorkspace, internalSession?.user.id])

  const refreshWorkspaces = useCallback(async () => {
    if (isWebShim()) {
      try {
        const list = await platformApi.workspaces.list()
        if (list.length > 0) {
          setWorkspaces(list.map((w) => toWorkspaceInfo(w)))
        }
      } catch {
        // 保留当前列表，避免覆盖已打开的工作区
      }
      return
    }

    const list = await window.electronAPI.listWorkspaces()
    setWorkspaces(list as WorkspaceInfo[])
    setInitialized(true)
  }, [])

  const refreshTree = useCallback(async () => {
    if (isWebShim()) return
    if (!activeWorkspacePath) return
    const tree = await window.electronAPI.getWorkspaceTree(activeWorkspacePath)
    setFileTree(tree as FileTreeNode[])
  }, [activeWorkspacePath])

  const createWorkspace = useCallback(async (name: string, parentDir?: string) => {
    setLoading(true)
    try {
      if (isWebShim()) {
        const result = await platformApi.workspaces.create(name)
        await refreshWorkspaces()
        return result.path
      }
      const result = await window.electronAPI.createWorkspace(name, parentDir)
      await refreshWorkspaces()
      return result.path
    } finally {
      setLoading(false)
    }
  }, [refreshWorkspaces])

  const renameWorkspace = useCallback(async (wsPath: string, nextName: string) => {
    if (isWebShim()) {
      throw new Error('Web 版不支持重命名本地工作区目录')
    }
    setLoading(true)
    try {
      const result = await window.electronAPI.renameWorkspace(wsPath, nextName)
      await refreshWorkspaces()
      if (activeWorkspacePath === wsPath) {
        const tree = await window.electronAPI.getWorkspaceTree(result.path)
        setWorkspaceRoot(result.path)
        setProjectRoot(result.path)
        setActiveWorkspacePath(result.path)
        setActiveWorkspaceName(result.name)
        setFileTree(tree as FileTreeNode[])
      }
      return result.path
    } finally {
      setLoading(false)
    }
  }, [activeWorkspacePath, refreshWorkspaces])

  const registerWorkspace = useCallback(async (wsPath: string) => {
    if (isWebShim()) {
      throw new Error('Web 版不支持注册本地工作区目录')
    }
    setLoading(true)
    try {
      const result = await window.electronAPI.registerWorkspace(wsPath)
      await refreshWorkspaces()
      return result.path
    } finally {
      setLoading(false)
    }
  }, [refreshWorkspaces])

  const openWorkspace = useCallback(async (wsPath: string) => {
    setLoading(true)
    try {
      if (isWebShim()) {
        const known = workspaces.find((w) => w.path === wsPath)
        const name = known?.name ?? workspaceNameFromToken(wsPath)
        const selection = persistWorkspaceSelection({
          currentUserId: internalSession?.user.id ?? currentUserId,
          currentTenantId,
          currentWorkspacePath: wsPath,
          currentWorkspaceId: workspaceIdFromPath(wsPath),
        })
        setWorkspaceRoot(wsPath)
        setProjectRoot(wsPath)
        setActiveWorkspacePath(wsPath)
        setActiveWorkspaceName(name)
        setCurrentUserId(selection.currentUserId)
        setCurrentTenantId(selection.currentTenantId)
        setCurrentWorkspaceId(selection.currentWorkspaceId)
        setFileTree([])
        setInitError(null)
        return
      }

      const tree = await window.electronAPI.getWorkspaceTree(wsPath)
      setWorkspaceRoot(wsPath)
      setProjectRoot(wsPath)
      setActiveWorkspacePath(wsPath)
      setActiveWorkspaceName(wsPath.split(/[/\\]/).pop() || wsPath)
      setFileTree(tree as FileTreeNode[])
      void (async () => {
        try {
          const api = window.electronAPI
          if (typeof api.readWorkspaceDocumentSchema !== 'function') return
          const docResult = await api.readWorkspaceDocumentSchema(wsPath)
          if (docResult.source === 'document-json' && docResult.compatHtml) {
            window.dispatchEvent(new CustomEvent('workspace-document-loaded', {
              detail: {
                workspacePath: wsPath,
                source: docResult.source,
                compatHtml: docResult.compatHtml,
                displayName: docResult.displayName,
              },
            }))
          }
        } catch {
          // Non-critical — editor stays empty if restore fails
        }
      })()
    } finally {
      setLoading(false)
    }
  }, [currentTenantId, currentUserId, internalSession?.user.id, workspaces])

  const closeWorkspace = useCallback(() => {
    const next = persistCurrentWorkspaceState({
      currentWorkspaceId: null,
      currentWorkspacePath: null,
    })
    setWorkspaceRoot(null)
    setProjectRoot(null)
    setActiveWorkspacePath(null)
    setActiveWorkspaceName(null)
    setCurrentWorkspaceId(next.currentWorkspaceId)
    setFileTree([])
  }, [])

  const deleteWorkspace = useCallback(async (wsPath: string) => {
    if (isWebShim()) {
      await platformApi.workspaces.delete(wsPath)
    } else {
      await window.electronAPI.deleteWorkspace(wsPath)
    }
    if (activeWorkspacePath === wsPath) {
      closeWorkspace()
    }
    await refreshWorkspaces()
  }, [activeWorkspacePath, closeWorkspace, refreshWorkspaces])

  useEffect(() => {
      if (isWebShim()) {
        if (accountState.phase === 'restoring' || accountState.phase === 'loading') return
        if (accountState.phase !== 'logged_in' && accountState.phase !== 'must_change_password') {
          clearCurrentWorkspaceState()
          setWorkspaceRoot(null)
          setProjectRoot(null)
          setActiveWorkspacePath(null)
          setActiveWorkspaceName(null)
          setCurrentTenantId(null)
          setCurrentWorkspaceId(null)
          setCurrentUserId(null)
          setFileTree([])
          return
        }
        const currentUserId = internalSession?.user.id ?? null
        const persisted = readCurrentWorkspaceState()
      const activeOwner = workspaceOwnerFromToken(activeWorkspacePath)
      if (
        (currentUserId && persisted.currentUserId && persisted.currentUserId !== currentUserId)
        || (!currentUserId && persisted.currentUserId)
      ) {
        clearCurrentWorkspaceState()
        setCurrentTenantId(null)
        setCurrentWorkspaceId(null)
        setCurrentUserId(null)
      }
      if (
        !activeWorkspacePath
        || !persisted.currentWorkspaceId
        || (currentUserId && activeOwner !== currentUserId)
        || (!currentUserId && activeOwner !== null && activeOwner !== 'web-demo-user')
      ) {
        void initializeDefaultWorkspace()
      }
      return
    }
    void refreshWorkspaces()
  }, [accountState.phase, activeWorkspacePath, initializeDefaultWorkspace, internalSession?.user.id, refreshWorkspaces])

  const contextValue = useMemo<WorkspaceState>(() => ({
    workspaceRoot,
    projectRoot,
    activeWorkspacePath,
    activeWorkspaceName,
    currentUserId,
    currentTenantId,
    currentWorkspaceId,
    initialized,
    initError,
    fileTree,
    fileTreeData: fileTree,
    workspaces,
    loading,
    createWorkspace,
    renameWorkspace,
    registerWorkspace,
    openWorkspace,
    closeWorkspace,
    refreshTree,
    refreshWorkspaces,
    deleteWorkspace,
    initializeDefaultWorkspace,
  }), [
    workspaceRoot,
    projectRoot,
    activeWorkspacePath,
    activeWorkspaceName,
    currentUserId,
    currentTenantId,
    currentWorkspaceId,
    initialized,
    initError,
    fileTree,
    workspaces,
    loading,
    createWorkspace,
    renameWorkspace,
    registerWorkspace,
    openWorkspace,
    closeWorkspace,
    refreshTree,
    refreshWorkspaces,
    deleteWorkspace,
    initializeDefaultWorkspace,
  ])

  return (
    <WorkspaceContext.Provider value={contextValue}>
      {children}
    </WorkspaceContext.Provider>
  )
}
