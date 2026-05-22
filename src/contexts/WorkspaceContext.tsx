import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { isWebShim } from '../platform/detect'
import { platformApi } from '../platform'
import type { WorkspaceInfo as PlatformWorkspaceInfo } from '../platform/types'

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

function toWorkspaceInfo(ws: PlatformWorkspaceInfo): WorkspaceInfo {
  return {
    name: ws.name,
    path: ws.path,
    hasDocument: true,
    modifiedAt: new Date().toISOString(),
  }
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaceRoot, setWorkspaceRoot] = useState<string | null>(null)
  const [projectRoot, setProjectRoot] = useState<string | null>(null)
  const [activeWorkspacePath, setActiveWorkspacePath] = useState<string | null>(null)
  const [activeWorkspaceName, setActiveWorkspaceName] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  const [fileTree, setFileTree] = useState<FileTreeNode[]>([])
  const [workspaces, setWorkspaces] = useState<WorkspaceInfo[]>([])
  const [loading, setLoading] = useState(false)

  const applyWebWorkspace = useCallback((ws: PlatformWorkspaceInfo) => {
    const name = ws.name || '默认工作区'
    const wsPath = ws.path
    setWorkspaceRoot(wsPath)
    setProjectRoot(wsPath)
    setActiveWorkspacePath(wsPath)
    setActiveWorkspaceName(name)
    setFileTree([])
    setWorkspaces([toWorkspaceInfo({ ...ws, name, path: wsPath })])
  }, [])

  const initializeDefaultWorkspace = useCallback(async () => {
    if (!isWebShim()) return
    setLoading(true)
    setInitError(null)
    try {
      let ws = await platformApi.workspaces.getDefault()
      if (!ws?.path) {
        ws = await platformApi.workspaces.create('默认工作区')
      }
      if (!ws?.path) {
        throw new Error('服务器未返回有效的工作区路径')
      }
      applyWebWorkspace(ws)
      setInitError(null)
      setInitialized(true)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setInitError(message || '默认工作区初始化失败')
      setInitialized(true)
    } finally {
      setLoading(false)
    }
  }, [applyWebWorkspace])

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
        setWorkspaceRoot(wsPath)
        setProjectRoot(wsPath)
        setActiveWorkspacePath(wsPath)
        setActiveWorkspaceName(name)
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
  }, [workspaces])

  const closeWorkspace = useCallback(() => {
    setWorkspaceRoot(null)
    setProjectRoot(null)
    setActiveWorkspacePath(null)
    setActiveWorkspaceName(null)
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
      void initializeDefaultWorkspace()
      return
    }
    void refreshWorkspaces()
  }, [initializeDefaultWorkspace, refreshWorkspaces])

  const contextValue = useMemo<WorkspaceState>(() => ({
    workspaceRoot,
    projectRoot,
    activeWorkspacePath,
    activeWorkspaceName,
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
