import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { platformApi } from '../../platform'
import { resolveWebApiUrl } from '../../runtime/apiBase'

type ArtifactJobStatus = 'queued' | 'running' | 'succeeded' | 'failed'

interface ArtifactJobResponse {
  success: boolean
  jobId: string
  status: ArtifactJobStatus
  type: 'html'
  message?: string
  error?: string
  artifactId?: string
  artifactFileUrl?: string
  createdAt?: number
  updatedAt?: number
}

interface ArtifactJobLogsResponse {
  success: boolean
  jobId: string
  logs: string
  error?: string
  updatedAt?: number
}

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = platformApi.auth.getToken()
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extra ?? {}),
  }
}

async function apiFetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(resolveWebApiUrl(url), {
    ...init,
    headers: authHeaders(init?.headers as Record<string, string> | undefined),
  })
  if (!res.ok) {
    const payload = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(
      (payload as { message?: string; error?: string }).message
      ?? (payload as { error?: string }).error
      ?? res.statusText,
    )
  }
  return res.json() as Promise<T>
}

async function fetchPreviewObjectUrl(artifactId: string): Promise<string> {
  const res = await fetch(resolveWebApiUrl(`/api/artifacts/${artifactId}/file`), {
    headers: authHeaders(),
  })
  if (!res.ok) {
    const payload = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(
      (payload as { message?: string; error?: string }).message
      ?? (payload as { error?: string }).error
      ?? `预览加载失败 (${res.status})`,
    )
  }
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}

function statusText(status?: ArtifactJobStatus): string {
  switch (status) {
    case 'queued':
      return '排队中'
    case 'running':
      return '运行中'
    case 'succeeded':
      return '已成功'
    case 'failed':
      return '已失败'
    default:
      return '未开始'
  }
}

export default function ArtifactLabPage() {
  const [prompt, setPrompt] = useState('请生成一个正式、简洁的会议纪要摘要页面，突出结论和待办事项。')
  const [inputMarkdown, setInputMarkdown] = useState(`# 会议纪要

## 会议主题
2026 年第二季度项目推进会

## 关键结论
- 本周完成 ArtifactJob 最小链路联调
- 下周开始扩展更多 Artifact 类型

## 待办事项
1. 完成 HTML Artifact 测试页
2. 验证异步任务状态轮询
3. 记录失败日志与错误信息
`)
  const [job, setJob] = useState<ArtifactJobResponse | null>(null)
  const [logs, setLogs] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [previewError, setPreviewError] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const previewUrlRef = useRef<string>('')
  const loadedArtifactIdRef = useRef<string>('')

  const cleanupPreviewUrl = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = ''
    }
  }, [])

  useEffect(() => cleanupPreviewUrl, [cleanupPreviewUrl])

  const loadPreview = useCallback(async (artifactId: string) => {
    if (!artifactId || loadedArtifactIdRef.current === artifactId) return
    setPreviewError('')
    const nextPreviewUrl = await fetchPreviewObjectUrl(artifactId)
    cleanupPreviewUrl()
    previewUrlRef.current = nextPreviewUrl
    loadedArtifactIdRef.current = artifactId
    setPreviewUrl(nextPreviewUrl)
  }, [cleanupPreviewUrl])

  const loadJob = useCallback(async (jobId: string) => {
    const [jobData, logsData] = await Promise.all([
      apiFetchJson<ArtifactJobResponse>(`/api/artifact-jobs/${jobId}`),
      apiFetchJson<ArtifactJobLogsResponse>(`/api/artifact-jobs/${jobId}/logs`),
    ])
    setJob(jobData)
    setLogs(logsData.logs ?? '')
    if (jobData.status === 'succeeded' && jobData.artifactId) {
      try {
        await loadPreview(jobData.artifactId)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        setPreviewError(message)
      }
    }
    return jobData
  }, [loadPreview])

  useEffect(() => {
    if (!job || (job.status !== 'queued' && job.status !== 'running')) return
    let cancelled = false

    const poll = async () => {
      try {
        const next = await loadJob(job.jobId)
        if (!cancelled && (next.status === 'succeeded' || next.status === 'failed')) {
          return
        }
      } catch (error) {
        if (cancelled) return
        const message = error instanceof Error ? error.message : String(error)
        setSubmitError(message)
      }
    }

    void poll()
    const timer = window.setInterval(() => {
      void poll()
    }, 1500)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [job, loadJob])

  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setSubmitError('')
    setPreviewError('')
    setLogs('')
    setJob(null)
    loadedArtifactIdRef.current = ''
    cleanupPreviewUrl()
    setPreviewUrl('')

    try {
      const created = await apiFetchJson<ArtifactJobResponse>('/api/artifact-jobs', {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          prompt,
          inputMarkdown,
          type: 'html',
        }),
      })
      setJob(created)
      await loadJob(created.jobId)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
  }, [cleanupPreviewUrl, inputMarkdown, loadJob, prompt])

  const canSubmit = useMemo(() => {
    return Boolean(prompt.trim()) && !isSubmitting
  }, [isSubmitting, prompt])

  return (
    <div style={s.shell}>
      <header style={s.header}>
        <div>
          <div style={s.eyebrow}>内部测试页</div>
          <h1 style={s.title}>HTML Artifact Lab</h1>
        </div>
        <Link to="/" style={s.backLink}>
          返回首页
        </Link>
      </header>

      <div style={s.grid}>
        <section style={s.panel}>
          <form onSubmit={handleSubmit} style={s.form}>
            <label style={s.label}>
              <span>Prompt</span>
              <input
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="描述想生成的 HTML 页面"
                style={s.input}
              />
            </label>

            <label style={s.label}>
              <span>inputMarkdown</span>
              <textarea
                value={inputMarkdown}
                onChange={(event) => setInputMarkdown(event.target.value)}
                rows={18}
                placeholder="输入 Markdown 内容"
                style={s.textarea}
              />
            </label>

            <button type="submit" disabled={!canSubmit} style={canSubmit ? s.primaryButton : s.primaryButtonDisabled}>
              {isSubmitting ? '提交中…' : '生成 HTML Artifact'}
            </button>
          </form>

          {submitError ? <div style={s.errorBox}>提交失败：{submitError}</div> : null}
        </section>

        <section style={s.panel}>
          <div style={s.statusHeader}>
            <h2 style={s.sectionTitle}>任务状态</h2>
            <span style={{ ...s.statusBadge, ...(job ? STATUS_BADGES[job.status] : STATUS_BADGES.idle) }}>
              {statusText(job?.status)}
            </span>
          </div>

          <div style={s.metaList}>
            <div><strong>Job ID：</strong>{job?.jobId ?? '-'}</div>
            <div><strong>Artifact ID：</strong>{job?.artifactId ?? '-'}</div>
            <div><strong>类型：</strong>{job?.type ?? 'html'}</div>
            <div><strong>消息：</strong>{job?.message ?? '-'}</div>
            <div><strong>错误：</strong>{job?.error ?? '-'}</div>
          </div>

          <h2 style={s.sectionTitle}>日志</h2>
          <pre style={s.logs}>{logs || '暂无日志输出'}</pre>
        </section>
      </div>

      <section style={s.previewPanel}>
        <div style={s.statusHeader}>
          <h2 style={s.sectionTitle}>Artifact 预览</h2>
          <span style={s.previewHint}>iframe 已启用 sandbox</span>
        </div>

        {previewError ? <div style={s.errorBox}>预览失败：{previewError}</div> : null}

        {previewUrl ? (
          <iframe
            title="HTML Artifact Preview"
            src={previewUrl}
            sandbox=""
            style={s.iframe}
          />
        ) : (
          <div style={s.previewPlaceholder}>任务成功后将在这里显示 HTML 预览。</div>
        )}
      </section>
    </div>
  )
}

const STATUS_BADGES: Record<string, React.CSSProperties> = {
  idle: {
    background: '#eef2ff',
    color: '#4f46e5',
  },
  queued: {
    background: '#fff7ed',
    color: '#c2410c',
  },
  running: {
    background: '#eff6ff',
    color: '#1d4ed8',
  },
  succeeded: {
    background: '#ecfdf5',
    color: '#047857',
  },
  failed: {
    background: '#fef2f2',
    color: '#b91c1c',
  },
}

const s: Record<string, React.CSSProperties> = {
  shell: {
    minHeight: '100vh',
    padding: '32px',
    background: '#f5f7fb',
    color: '#0f172a',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 24,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 1.2,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  title: {
    margin: '8px 0 0',
    fontSize: 28,
    fontWeight: 700,
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '10px 14px',
    borderRadius: 10,
    background: '#fff',
    color: '#334155',
    textDecoration: 'none',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(320px, 1fr) minmax(320px, 1fr)',
    gap: 20,
  },
  panel: {
    background: '#fff',
    borderRadius: 16,
    padding: 20,
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)',
  },
  previewPanel: {
    marginTop: 20,
    background: '#fff',
    borderRadius: 16,
    padding: 20,
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    fontSize: 14,
    fontWeight: 600,
    color: '#334155',
  },
  input: {
    width: '100%',
    minHeight: 44,
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid #cbd5e1',
    fontSize: 14,
    outline: 'none',
  },
  textarea: {
    width: '100%',
    minHeight: 320,
    padding: '12px 14px',
    borderRadius: 10,
    border: '1px solid #cbd5e1',
    fontSize: 14,
    lineHeight: 1.6,
    resize: 'vertical',
    outline: 'none',
    fontFamily: 'ui-monospace, SFMono-Regular, SFMono-Regular, Consolas, monospace',
  },
  primaryButton: {
    height: 44,
    borderRadius: 10,
    border: 'none',
    background: '#2563eb',
    color: '#fff',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  },
  primaryButtonDisabled: {
    height: 44,
    borderRadius: 10,
    border: 'none',
    background: '#94a3b8',
    color: '#fff',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'not-allowed',
  },
  statusHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 10px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
  },
  metaList: {
    display: 'grid',
    gap: 10,
    marginBottom: 18,
    fontSize: 14,
    lineHeight: 1.5,
  },
  logs: {
    minHeight: 320,
    maxHeight: 420,
    margin: 0,
    padding: 14,
    overflow: 'auto',
    borderRadius: 12,
    background: '#0f172a',
    color: '#e2e8f0',
    fontSize: 12,
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  previewHint: {
    fontSize: 12,
    color: '#64748b',
  },
  iframe: {
    width: '100%',
    minHeight: 720,
    border: '1px solid #dbeafe',
    borderRadius: 12,
    background: '#fff',
  },
  previewPlaceholder: {
    minHeight: 220,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    border: '1px dashed #cbd5e1',
    color: '#64748b',
    background: '#f8fafc',
  },
  errorBox: {
    marginTop: 12,
    padding: '12px 14px',
    borderRadius: 10,
    background: '#fef2f2',
    color: '#b91c1c',
    fontSize: 14,
    lineHeight: 1.5,
  },
}
