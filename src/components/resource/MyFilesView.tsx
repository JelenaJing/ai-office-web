/**
 * MyFilesView — inline (non-modal) file management panel.
 *
 * Used by both ResourceWorkspace (embedded tab) and MyFilesPanel (modal).
 * Calls /api/files with the user's auth token.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Upload, Download, Trash2, File as FileIcon } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FileEntry {
  id: string
  name: string
  ext: string
  mimeType: string
  size: number
  uploadedAt: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getToken(): string {
  return (
    localStorage.getItem('aios_itoken') ??
    localStorage.getItem('ai_office_internal_token') ??
    ''
  )
}

export function authHeaders(): Record<string, string> {
  const t = getToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return iso }
}

const ALLOWED_ACCEPT = '.docx,.pdf,.pptx,.xlsx,.csv,.txt,.md,.png,.jpg,.jpeg'

// ── Component ─────────────────────────────────────────────────────────────────

interface MyFilesViewProps {
  /** If true, wrap in a scrollable full-height container */
  fullHeight?: boolean
}

export default function MyFilesView({ fullHeight }: MyFilesViewProps) {
  const [files, setFiles] = useState<FileEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchFiles = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/files', { headers: authHeaders() })
      const data = await res.json() as { files: FileEntry[] }
      setFiles(data.files ?? [])
    } catch {
      setError('加载文件列表失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchFiles() }, [fetchFiles])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/files/upload', {
        method: 'POST',
        headers: authHeaders(),
        body: form,
      })
      const data = await res.json() as { success: boolean; error?: string }
      if (!res.ok || !data.success) {
        setError(data.error ?? `上传失败 (${res.status})`)
        return
      }
      await fetchFiles()
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (fileId: string) => {
    if (!window.confirm('确认删除该文件？')) return
    try {
      const res = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (res.ok) await fetchFiles()
    } catch {
      setError('删除失败，请重试')
    }
  }

  const handleDownload = (f: FileEntry) => {
    const a = document.createElement('a')
    a.href = `/api/files/${f.id}/download`
    a.download = f.name
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: fullHeight ? '100%' : 'auto',
      minHeight: 0,
    }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px', borderBottom: '1px solid #e8eef5', flexShrink: 0,
        background: '#fafdff',
      }}>
        <div style={{ fontSize: 13, color: '#627385' }}>
          共 {files.length} 个文件
        </div>
        <label style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '7px 14px', background: '#1a5fb4', color: '#fff',
          borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          opacity: uploading ? 0.6 : 1, pointerEvents: uploading ? 'none' : 'auto',
        }}>
          <Upload size={13} />
          {uploading ? '上传中…' : '上传文件'}
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_ACCEPT}
            style={{ display: 'none' }}
            onChange={(e) => void handleUpload(e)}
          />
        </label>
      </div>

      {error && (
        <div style={{
          margin: '10px 20px', padding: '9px 14px', borderRadius: 8,
          background: '#fff0f0', color: '#c0392b', fontSize: 13, flexShrink: 0,
        }}>
          {error}
        </div>
      )}

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 24px', color: '#8094a8', fontSize: 14 }}>
            加载中…
          </div>
        ) : files.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📂</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#304255', marginBottom: 6 }}>
              还没有上传任何文件
            </div>
            <div style={{ fontSize: 12, color: '#aab8c8' }}>
              点击"上传文件"添加你的第一个文件
            </div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f7fafd', position: 'sticky', top: 0 }}>
                {(['文件名', '大小', '上传时间', '操作'] as const).map((h) => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '8px 20px',
                    fontSize: 11, fontWeight: 700, color: '#8094a8',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    borderBottom: '1px solid #e8eef5',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {files.map((f) => (
                <tr key={f.id} style={{ borderBottom: '1px solid #f0f4f8' }}>
                  <td style={{ padding: '10px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FileIcon size={15} color="#5c8abf" style={{ flexShrink: 0 }} />
                      <span style={{
                        fontSize: 13, color: '#1a2f47', fontWeight: 500,
                        wordBreak: 'break-all',
                      }}>
                        {f.name}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 20px', fontSize: 12, color: '#627385', whiteSpace: 'nowrap' }}>
                    {fmtSize(f.size)}
                  </td>
                  <td style={{ padding: '10px 20px', fontSize: 12, color: '#627385', whiteSpace: 'nowrap' }}>
                    {fmtDate(f.uploadedAt)}
                  </td>
                  <td style={{ padding: '10px 20px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleDownload(f)}
                        title="下载"
                        style={{
                          width: 30, height: 30, border: '1px solid #c8d8e8',
                          borderRadius: 6, background: '#fff', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <Download size={13} color="#4a7fb5" />
                      </button>
                      <button
                        onClick={() => void handleDelete(f.id)}
                        title="删除"
                        style={{
                          width: 30, height: 30, border: '1px solid #f0c8c8',
                          borderRadius: 6, background: '#fff', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <Trash2 size={13} color="#c0392b" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
