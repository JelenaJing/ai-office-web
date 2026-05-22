import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Department } from '../../../types/knowledge'
import { platformApi } from '../../../platform'
import { ApiFetchError } from '../../../platform/webPlatformApi'

export type DepartmentErrorKind = 'none' | 'auth' | 'connection' | 'empty'

interface DepartmentState {
  departments: Department[]
  selectedDepartmentId: string
  loading: boolean
  error: string | null
  /** Distinguishes empty list vs auth vs remote connection failure */
  errorKind: DepartmentErrorKind
  selectDepartment: (id: string) => void
  /** @deprecated Server-managed — kept for backward compat */
  createDepartment: (name: string, nameEn: string) => Promise<Department>
  /** @deprecated Server-managed — kept for backward compat */
  renameDepartment: (id: string, name: string, nameEn: string) => Promise<Department>
  /** @deprecated Server-managed — kept for backward compat */
  deleteDepartment: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

const DepartmentContext = createContext<DepartmentState | null>(null)

const STORAGE_KEY = 'ai_writer3_selected_department_id'

export function useDepartment(): DepartmentState {
  const context = useContext(DepartmentContext)
  if (!context) throw new Error('useDepartment 必须在 DepartmentProvider 内使用')
  return context
}

export function DepartmentProvider({ children }: { children: ReactNode }) {
  const [departments, setDepartments] = useState<Department[]>([])
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [errorKind, setErrorKind] = useState<DepartmentErrorKind>('none')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    setErrorKind('none')
    try {
      const list: Department[] = await platformApi.departments.list()
      setDepartments(list)

      // Restore from localStorage or use default
      const stored = localStorage.getItem(STORAGE_KEY)
      const validId = list.find((d) => d.id === stored)?.id ?? list[0]?.id ?? ''
      setSelectedDepartmentId(validId)
      if (validId) localStorage.setItem(STORAGE_KEY, validId)
      if (list.length === 0) {
        setErrorKind('empty')
      }
    } catch (err) {
      setDepartments([])
      if (err instanceof ApiFetchError) {
        if (err.status === 401) {
          setError('登录状态异常，请重新登录')
          setErrorKind('auth')
        } else if (err.status === 502 || err.status === 503) {
          setError('连接失败：远程知识库服务不可用')
          setErrorKind('connection')
        } else {
          setError(err.message || '连接失败')
          setErrorKind('connection')
        }
      } else if (err instanceof TypeError) {
        setError('连接失败：网络异常')
        setErrorKind('connection')
      } else {
        const msg = err instanceof Error ? err.message : String(err)
        setError(
          msg.includes('timeout') || msg.includes('abort') ? '连接失败：请求超时' : msg || '连接失败',
        )
        setErrorKind('connection')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const selectDepartment = useCallback((id: string) => {
    setSelectedDepartmentId(id)
    localStorage.setItem(STORAGE_KEY, id)
  }, [])

  // CRUD stubs — departments are now managed server-side
  const createDept = useCallback(async (_name: string, _nameEn: string): Promise<Department> => {
    throw new Error('Department creation is managed on the server')
  }, [])
  const renameDept = useCallback(async (_id: string, _name: string, _nameEn: string): Promise<Department> => {
    throw new Error('Department renaming is managed on the server')
  }, [])
  const deleteDept = useCallback(async (_id: string): Promise<void> => {
    throw new Error('Department deletion is managed on the server')
  }, [])

  const value = useMemo<DepartmentState>(() => ({
    departments,
    selectedDepartmentId,
    loading,
    error,
    errorKind,
    selectDepartment,
    createDepartment: createDept,
    renameDepartment: renameDept,
    deleteDepartment: deleteDept,
    refresh,
  }), [departments, selectedDepartmentId, loading, error, errorKind, selectDepartment, createDept, renameDept, deleteDept, refresh])

  return <DepartmentContext.Provider value={value}>{children}</DepartmentContext.Provider>
}
