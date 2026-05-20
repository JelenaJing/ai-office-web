/**
 * MyFilesPanel — modal overlay for file management
 *
 * Provides: file list, upload, download, delete.
 * Calls /api/files/* with the user's auth token.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { X, Upload, Download, Trash2, File as FileIcon } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface FileEntry {
  id: string
  name: string
  ext: string
  mimeType: string
  size: number
  uploadedAt: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getToken(): string {
  return (
    localStorage.getItem('aios_itoken') ??
    localStorage.getItem('ai_office_internal_token') ??
    ''
  )
}

function authHeaders(): Record<string, string> {
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
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

const ALLOWED_ACCEPT = '.docx,.pdf,.pptx,.xlsx,.csv,.txt,.md,.png,.jpg,.jpeg'

// ── Component ─────────────────────────────────────────────────────────────────

interface MyFilesPanelProps {
  onClose: () => void
}

export default function MyFilesPanel({ onClose }: MyFilesPanelProps) {
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
      // Reset input so the same file can be re-uploaded
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
    const token = getToken()
    // For download we open the link directly; token passed via cookie or
    // by opening a window. Since we control the server, let the browser handle it.
    a.download = f.name
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15, 30, 55, 0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#fff', borderRadius: 16,
        boxShadow: '0 12px 48px rgba(20, 40, 80, 0.18)',
        width: 680, maxWidth: 'calc(100vw - 40px)',
        maxHeight: 'calc(100vh - 80px)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid #e8eef5',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#1a2f47' }}>我的文件</div>
            <div style={{ fontSize: 12, color: '#8094a8', marginTop: 2 }}>
              支持 docx、pdf、pptx、xlsx、csv、txt、md、png、jpg
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <label style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', background: '#1a5fb4', color: '#fff',
              borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              opacity: uploading ? 0.6 : 1, pointerEvents: uploading ? 'none' : 'auto',
            }}>
              <Upload size={14} />
              {uploading ? '上传中…' : '上传文件'}
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_ACCEPT}
                style={{ display: 'none' }}
                onChange={(e) => void handleUpload(e)}
              />
            </label>
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, border: 'none',
                background: '#f0f4f8', borderRadius: 8, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={16} color="#627385" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {error && (
            <div style={{
              margin: '12px 24px', padding: '10px 14px', borderRadius: 8,
              background: '#fff0f0', color: '#c0392b', fontSize: 13,
            }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 24px', color: '#8094a8', fontSize: 14 }}>
              加载中…
            </div>
          ) : files.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 24px' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
              <div style={{ fontSize: 15, color: '#8094a8' }}>还没有上传任何文件</div>
              <div style={{ fontSize: 12, color: '#aab8c8', marginTop: 6 }}>
                点击"上传文件"添加你的第一个文件
              </div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f7fafd' }}>
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
                        <span style={{ fontSize: 13, color: '#1a2f47', fontWeight: 500, wordBreak: 'break-all' }}>
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

        {/* Footer */}
        <div style={{
          padding: '12px 24px', borderTop: '1px solid #e8eef5',
          fontSize: 12, color: '#aab8c8',
        }}>
          共 {files.length} 个文件 · 文件归属于当前用户的默认工作区
        </div>
      </div>
    </div>
  )
}
