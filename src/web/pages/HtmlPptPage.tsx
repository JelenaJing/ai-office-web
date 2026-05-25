import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { platformApi } from '../../platform'
import { resolveWebApiUrl } from '../../runtime/apiBase'

type ArtifactJobStatus = 'queued' | 'running' | 'succeeded' | 'failed'
type UiState = 'idle' | 'generating' | 'succeeded' | 'failed'

interface ArtifactJobResponse {
  success: boolean
  jobId: string
  status: ArtifactJobStatus
  type: string
  skillId?: string
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

interface PreviewState {
  artifactId: string
  url: string
}

interface TemplateOption {
  slug: string
  name: string
  tagline: string
  scheme: string
  density: string
}

interface TemplateListResponse {
  success: boolean
  templates: TemplateOption[]
}

const EXAMPLE_PROMPTS = [
  'AI Office 产品发布会',
  '高校行政办公 AIOS 方案',
  '企业内部知识库建设汇报',
]

const GENERATING_STEPS = [
  '正在分析内容',
  '正在匹配演示风格',
  '正在规划页面结构',
  '正在生成视觉版式',
  '正在完成最终检查',
]

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

function syncPreviewAuthCookie(): void {
  const token = platformApi.auth.getToken()
  if (!token || typeof document === 'undefined') return
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `aios_auth_token=${encodeURIComponent(token)}; Path=/; SameSite=Lax${secure}`
}

function buildPreviewUrl(artifactId: string): string {
  return resolveWebApiUrl(`/api/artifacts/${artifactId}/file`)
}

function statusText(status?: ArtifactJobStatus): string {
  switch (status) {
    case 'queued':
      return '排队中'
    case 'running':
      return '生成中'
    case 'succeeded':
      return '已完成'
    case 'failed':
      return '生成失败'
    default:
      return '未开始'
  }
}

function buildArtifactPrompt(inputText: string): string {
  const normalized = inputText.replace(/\s+/g, ' ').trim().slice(0, 200)
  return `请根据以下需求生成一份结构清晰、适合正式展示的 HTML 演示文稿：${normalized}`
}

function buildArtifactMarkdown(inputText: string): string {
  const trimmed = inputText.trim()
  if (!trimmed) return ''
  return /^#/.test(trimmed)
    ? trimmed
    : `# 演示文稿需求\n\n${trimmed}`
}

function summarizeDebugError(message: string | undefined): string {
  const trimmed = String(message || '').replace(/\s+/g, ' ').trim()
  if (!trimmed) return '未提供底层错误详情。'
  return trimmed.length > 160 ? `${trimmed.slice(0, 160)}…` : trimmed
}

export default function HtmlPptPage({ onBack }: { onBack?: () => void }) {
  const [inputText, setInputText] = useState('')
  const [templateOptions, setTemplateOptions] = useState<TemplateOption[]>([])
  const [selectedTemplateSlug, setSelectedTemplateSlug] = useState('')
  const [enableImages, setEnableImages] = useState(true)
  const [maxImages, setMaxImages] = useState(3)
  const [job, setJob] = useState<ArtifactJobResponse | null>(null)
  const [logs, setLogs] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [previewError, setPreviewError] = useState('')
  const [preview, setPreview] = useState<PreviewState | null>(null)
  const [previewLoaded, setPreviewLoaded] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const [generationElapsedMs, setGenerationElapsedMs] = useState(0)
  // Retemplate state
  const [retemplateSlug, setRetemplateSlug] = useState('')
  const [isRetemplating, setIsRetemplating] = useState(false)
  const [retemplateError, setRetemplateError] = useState('')

  const previewRef = useRef<HTMLDivElement | null>(null)
  const previewIframeRef = useRef<HTMLIFrameElement | null>(null)
  const loadedArtifactIdRef = useRef<string>('')
  const generationStartedAtRef = useRef<number | null>(null)

  useEffect(() => {
    syncPreviewAuthCookie()
  }, [])

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      const data = event.data as
        | {
            type?: string
            artifactId?: string
            storageKey?: string
            requestId?: string
            patch?: { op?: string; slideId?: string; blockId?: string; text?: string; createdAt?: string }
            payload?: { slideId?: string; blockId?: string; imagePrompt?: string }
          }
        | null
      if (!data?.type || !data.artifactId) return

      if (data.type === 'aios-html-ppt:patch' && data.patch) {
        const patch = data.patch
        if (!patch.slideId || !patch.blockId || typeof patch.text !== 'string') return

        if (data.storageKey) {
          try {
            const current = JSON.parse(localStorage.getItem(data.storageKey) || '[]') as Array<Record<string, unknown>>
            const nextPatch = {
              op: patch.op || 'replace_text',
              slideId: patch.slideId,
              blockId: patch.blockId,
              text: patch.text,
              createdAt: patch.createdAt || new Date().toISOString(),
            }
            const existingIndex = current.findIndex((item) => item.slideId === patch.slideId && item.blockId === patch.blockId)
            if (existingIndex >= 0) current[existingIndex] = nextPatch
            else current.push(nextPatch)
            localStorage.setItem(data.storageKey, JSON.stringify(current))
          } catch {
            // ignore storage failures in parent page
          }
        }

        try {
          await fetch(resolveWebApiUrl(`/api/artifacts/${data.artifactId}/html-presentation/patch`), {
            method: 'POST',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({
              op: 'replace_text',
              slideId: patch.slideId,
              blockId: patch.blockId,
              text: patch.text,
            }),
          })
        } catch {
          // runtime already updated DOM locally; server writeback is best-effort here
        }
        return
      }

      if (data.type === 'aios-html-ppt:image' && data.payload && data.requestId) {
        const payload = data.payload
        if (!payload.slideId || !payload.blockId || !payload.imagePrompt) return
        let responsePayload: Record<string, unknown>
        try {
          const response = await fetch(resolveWebApiUrl(`/api/artifacts/${data.artifactId}/html-presentation/image`), {
            method: 'POST',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(payload),
          })
          const json = await response.json().catch(() => ({}))
          responsePayload = {
            type: 'aios-html-ppt:image-result',
            requestId: data.requestId,
            ...(typeof json === 'object' && json ? json : {}),
          }
        } catch (error) {
          responsePayload = {
            type: 'aios-html-ppt:image-result',
            requestId: data.requestId,
            success: false,
            error: error instanceof Error ? error.message : String(error),
          }
        }

        const targetWindow =
          event.source && typeof event.source === 'object' && 'postMessage' in event.source
            ? event.source
            : previewIframeRef.current?.contentWindow
        if (targetWindow && typeof targetWindow.postMessage === 'function') {
          targetWindow.postMessage(responsePayload, '*')
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  useEffect(() => {
    let cancelled = false
    const loadTemplates = async () => {
      try {
        const payload = await apiFetchJson<TemplateListResponse>('/api/artifact-jobs/html-presentation/templates')
        if (!cancelled) setTemplateOptions(payload.templates ?? [])
      } catch {
        if (!cancelled) setTemplateOptions([])
      }
    }
    void loadTemplates()
    return () => {
      cancelled = true
    }
  }, [])

  const loadPreview = useCallback(async (artifactId: string) => {
    if (!artifactId || loadedArtifactIdRef.current === artifactId) return
    syncPreviewAuthCookie()
    setPreviewError('')
    setPreviewLoaded(false)
    loadedArtifactIdRef.current = artifactId
    setPreview({
      artifactId,
      url: buildPreviewUrl(artifactId),
    })
  }, [])

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
        setPreviewError(error instanceof Error ? error.message : String(error))
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
        if (!cancelled && (next.status === 'succeeded' || next.status === 'failed')) return
      } catch (error) {
        if (!cancelled) setSubmitError(error instanceof Error ? error.message : String(error))
      }
    }

    void poll()
    const timer = window.setInterval(() => {
      void poll()
    }, 2000)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [job, loadJob])

  const uiState = useMemo<UiState>(() => {
    if (job?.status === 'queued' || job?.status === 'running' || isSubmitting) return 'generating'
    if (job?.status === 'succeeded') return 'succeeded'
    if (job?.status === 'failed' || submitError) return 'failed'
    return 'idle'
  }, [isSubmitting, job?.status, submitError])

  useEffect(() => {
    if (uiState !== 'generating') {
      generationStartedAtRef.current = null
      setGenerationElapsedMs(0)
      return
    }

    if (!generationStartedAtRef.current) {
      generationStartedAtRef.current = Date.now()
      setGenerationElapsedMs(0)
    }

    const timer = window.setInterval(() => {
      if (!generationStartedAtRef.current) return
      setGenerationElapsedMs(Date.now() - generationStartedAtRef.current)
    }, 900)

    return () => window.clearInterval(timer)
  }, [uiState])

  useEffect(() => {
    if (uiState !== 'succeeded' || !preview?.url) return
    window.setTimeout(() => {
      previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }, [preview?.url, uiState])

  const startGeneration = useCallback(async () => {
    const trimmedInput = inputText.trim()
    if (!trimmedInput) return

    setIsSubmitting(true)
    setSubmitError('')
    setPreviewError('')
    setLogs('')
    setShowDebug(false)
    setJob(null)
    loadedArtifactIdRef.current = ''
    setPreview(null)
    setPreviewLoaded(false)

    try {
      const created = await apiFetchJson<ArtifactJobResponse>('/api/artifact-jobs', {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          type: 'html_presentation',
          skillId: 'html-ppt-beautiful',
          prompt: buildArtifactPrompt(trimmedInput),
          inputMarkdown: buildArtifactMarkdown(trimmedInput),
          templateSlug: selectedTemplateSlug || undefined,
          enableImages,
          maxImages,
        }),
      })
      setJob(created)
      await loadJob(created.jobId)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : String(error))
    } finally {
      setIsSubmitting(false)
    }
  }, [enableImages, inputText, loadJob, maxImages, selectedTemplateSlug])

  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await startGeneration()
  }, [startGeneration])

  const handleDownloadHtml = useCallback(async () => {
    if (!job?.artifactId) return
    const res = await fetch(resolveWebApiUrl(`/api/artifacts/${job.artifactId}/file`), {
      headers: authHeaders(),
    })
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(inputText || '演示文稿').replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_').slice(0, 48)}.html`
    a.click()
    URL.revokeObjectURL(url)
  }, [inputText, job?.artifactId])

  const handleRetemplate = useCallback(async () => {
    if (!retemplateSlug || !job?.artifactId) return
    setIsRetemplating(true)
    setRetemplateError('')
    setPreviewLoaded(false)
    try {
      const res = await fetch(resolveWebApiUrl(`/api/artifacts/${job.artifactId}/html-presentation/retemplate`), {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ templateSlug: retemplateSlug }),
      })
      const data = (await res.json()) as { success?: boolean; previewUrl?: string; error?: string }
      if (!res.ok || !data.success) throw new Error(data.error ?? '换模板失败')
      // Force iframe remount with a cache-buster
      const cacheBuster = `?v=${Date.now()}`
      setPreview((prev) => prev ? { ...prev, url: resolveWebApiUrl(`/api/artifacts/${job.artifactId!}/file`) + cacheBuster } : prev)
    } catch (err) {
      setRetemplateError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsRetemplating(false)
    }
  }, [job?.artifactId, retemplateSlug])

  const handleReset = useCallback(() => {
    setInputText('')
    setJob(null)
    setLogs('')
    setSubmitError('')
    setPreviewError('')
    setShowDebug(false)
    loadedArtifactIdRef.current = ''
    setPreview(null)
    setPreviewLoaded(false)
  }, [])

  const canSubmit = Boolean(inputText.trim()) && uiState !== 'generating'
  const stageIndex = Math.min(GENERATING_STEPS.length - 1, Math.floor(generationElapsedMs / 2200))
  const progressPercent = Math.min(96, 14 + ((stageIndex + 1) / GENERATING_STEPS.length) * 78)
  const activeDot = Math.floor(generationElapsedMs / 500) % 3
  const debugSummary = summarizeDebugError(job?.error || submitError)

  const renderComposer = (compact: boolean) => (
    <form onSubmit={handleSubmit} style={{ ...s.composerCard, ...(compact ? s.composerCompact : s.composerHero) }}>
      {!compact ? (
        <>
          <h1 style={s.heroTitle}>生成演示文稿</h1>
          <p style={s.heroSubtitle}>
            输入主题或提纲，AI 将生成可在浏览器中预览的 HTML 演示文稿。
          </p>
        </>
      ) : (
        <div style={s.compactHead}>
          <div>
            <div style={s.compactTitle}>生成演示文稿</div>
            <div style={s.compactSubtitle}>修改需求后可直接重新生成。</div>
          </div>
          <div style={s.topActions}>
            <button type="button" onClick={handleReset} style={s.topGhostBtn}>清空</button>
            {onBack ? (
              <button type="button" onClick={onBack} style={s.topGhostBtn}>返回</button>
            ) : null}
          </div>
        </div>
      )}

      <div style={s.textareaWrap}>
        <textarea
          value={inputText}
          onChange={(event) => setInputText(event.target.value)}
          placeholder="输入你想生成的演示文稿，例如：AI Office 2026 产品发布会，面向学校和企业客户，重点讲邮件、文稿、PPT、知识库和 AIOS 工作流。"
          style={{ ...s.textarea, ...(compact ? s.textareaCompact : s.textareaHero) }}
          disabled={uiState === 'generating'}
        />
        <button
          type="submit"
          disabled={!canSubmit}
          style={canSubmit ? s.generateBtn : s.generateBtnDisabled}
        >
          {uiState === 'generating' ? '生成中…' : '生成演示文稿'}
        </button>
      </div>

      <div style={s.controlRow}>
        <label style={s.controlField}>
          <span style={s.controlLabel}>模板</span>
          <select
            value={selectedTemplateSlug}
            onChange={(event) => setSelectedTemplateSlug(event.target.value)}
            style={s.select}
            disabled={uiState === 'generating'}
          >
            <option value="">自动选择（推荐）</option>
            {templateOptions.map((template) => (
              <option key={template.slug} value={template.slug}>
                {template.name} · {template.scheme} · {template.density}
              </option>
            ))}
          </select>
        </label>

        <label style={{ ...s.controlField, ...s.controlFieldInline }}>
          <span style={s.controlLabel}>自动配图</span>
          <input
            type="checkbox"
            checked={enableImages}
            onChange={(event) => setEnableImages(event.target.checked)}
            disabled={uiState === 'generating'}
          />
        </label>

        <label style={s.controlField}>
          <span style={s.controlLabel}>最大图片数</span>
          <input
            type="number"
            min={0}
            max={6}
            value={maxImages}
            onChange={(event) => setMaxImages(Math.max(0, Math.min(6, Number.parseInt(event.target.value || '0', 10) || 0)))}
            style={s.numberInput}
            disabled={uiState === 'generating' || !enableImages}
          />
        </label>
      </div>

      {selectedTemplateSlug && templateOptions.some((template) => template.slug === selectedTemplateSlug) ? (
        <div style={s.templateHint}>
          {templateOptions.find((template) => template.slug === selectedTemplateSlug)?.tagline}
        </div>
      ) : null}

      {!compact ? (
        <div style={s.chipRow}>
          {EXAMPLE_PROMPTS.map((example) => (
            <button
              key={example}
              type="button"
              style={s.exampleChip}
              onClick={() => setInputText(example)}
            >
              {example}
            </button>
          ))}
        </div>
      ) : null}
    </form>
  )

  const renderGeneratingView = () => (
    <section style={s.centerStageWrap}>
      <div style={s.generatingCard}>
        <div style={s.generatingGlow} />
        <div style={s.generatingEyebrow}>AI 正在生成演示文稿</div>
        <h2 style={s.generatingTitle}>请稍候，正在完成版式与内容生成</h2>
        <p style={s.generatingSubtitle}>
          系统会自动规划页面结构、匹配风格并生成可直接预览的 HTML 演示文稿。
        </p>

        <div style={s.progressTrack}>
          <div style={{ ...s.progressFill, width: `${progressPercent}%` }} />
        </div>

        <div style={s.stepList}>
          {GENERATING_STEPS.map((step, index) => {
            const state = index < stageIndex ? 'done' : index === stageIndex ? 'active' : 'idle'
            return (
              <div
                key={step}
                style={{
                  ...s.stepItem,
                  ...(state === 'active' ? s.stepItemActive : state === 'done' ? s.stepItemDone : s.stepItemIdle),
                }}
              >
                <span
                  style={{
                    ...s.stepDot,
                    ...(state === 'active' ? s.stepDotActive : state === 'done' ? s.stepDotDone : s.stepDotIdle),
                  }}
                />
                <span>{step}</span>
                {state === 'active' ? (
                  <span style={s.loadingDots}>
                    <span style={{ ...s.loadingDot, ...(activeDot === 0 ? s.loadingDotActive : null) }} />
                    <span style={{ ...s.loadingDot, ...(activeDot === 1 ? s.loadingDotActive : null) }} />
                    <span style={{ ...s.loadingDot, ...(activeDot === 2 ? s.loadingDotActive : null) }} />
                  </span>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )

  const renderSucceededView = () => (
    <>
      <section ref={previewRef} style={s.previewCard}>
        <div style={s.previewHeader}>
          <div>
            <div style={s.previewTitle}>HTML 演示文稿预览</div>
            <div style={s.previewSubtitle}>已生成，可直接在浏览器中查看和下载。</div>
          </div>
          <div style={s.previewActions}>
            <button type="button" onClick={() => void startGeneration()} style={s.previewGhostBtn}>
              重新生成
            </button>
            {preview?.url ? (
              <a
                href={preview.url}
                target="_blank"
                rel="noreferrer"
                style={s.previewGhostLink}
                onClick={() => syncPreviewAuthCookie()}
              >
                在新窗口打开预览
              </a>
            ) : null}
            <button type="button" onClick={() => void handleDownloadHtml()} style={s.previewPrimaryBtn}>
              下载 HTML
            </button>
          </div>
        </div>

        {/* Retemplate panel — shown only when templates are available */}
        {templateOptions.length > 0 ? (
          <div style={s.retemplateBar}>
            <span style={s.retemplateLabel}>更换模板：</span>
            <select
              value={retemplateSlug}
              onChange={(e) => setRetemplateSlug(e.target.value)}
              style={s.retemplateSelect}
              disabled={isRetemplating}
            >
              <option value="">— 选择新模板 —</option>
              {templateOptions.map((t) => (
                <option key={t.slug} value={t.slug}>{t.name} ({t.scheme})</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void handleRetemplate()}
              disabled={!retemplateSlug || isRetemplating}
              style={s.retemplateApplyBtn}
            >
              {isRetemplating ? '应用中…' : '应用模板'}
            </button>
            {retemplateError ? <span style={s.retemplateError}>{retemplateError}</span> : null}
          </div>
        ) : null}

        {previewError ? (
          <div style={s.inlineErrorBox}>预览加载失败，请点击“在新窗口打开预览”或“下载 HTML”。</div>
        ) : (
          <>
            <div style={s.previewFrameWrap}>
              {preview?.url ? (
                <iframe
                  ref={previewIframeRef}
                  key={preview.url}
                  title="HTML Presentation Preview"
                  src={preview.url}
                  sandbox="allow-scripts allow-downloads"
                  style={s.iframe}
                  onLoad={() => {
                    setPreviewLoaded(true)
                    setPreviewError('')
                  }}
                  onError={() => {
                    setPreviewLoaded(false)
                    setPreviewError('预览加载失败')
                  }}
                />
              ) : (
                <div style={s.previewPlaceholder}>正在准备预览…</div>
              )}
              {preview?.url && !previewLoaded && !previewError ? (
                <div style={s.previewLoadingMask}>正在加载预览…</div>
              ) : null}
            </div>
            <div style={s.weakHint}>PPTX 导出即将支持</div>
          </>
        )}
      </section>

      <section style={s.debugSection}>
        <button type="button" style={s.debugToggle} onClick={() => setShowDebug((value) => !value)}>
          {showDebug ? '隐藏调试信息' : '查看调试信息'}
        </button>
        {showDebug ? (
          <div style={s.debugCard}>
            <div style={s.debugMetaGrid}>
              <div style={s.debugMetaRow}><strong>Job ID</strong><span>{job?.jobId ?? '-'}</span></div>
              <div style={s.debugMetaRow}><strong>Artifact ID</strong><span>{job?.artifactId ?? '-'}</span></div>
              <div style={s.debugMetaRow}><strong>状态</strong><span>{statusText(job?.status)}</span></div>
            </div>
            <pre style={s.logs}>{logs || '暂无日志输出'}</pre>
          </div>
        ) : null}
      </section>
    </>
  )

  const renderFailedView = () => (
    <>
      <section style={s.centerStageWrap}>
        <div style={s.failedCard}>
          <div style={s.failedIcon}>!</div>
          <h2 style={s.failedTitle}>生成失败</h2>
          <p style={s.failedText}>演示文稿未能生成，请稍后重试或简化输入内容。</p>
          <div style={s.failedActions}>
            <button type="button" onClick={() => void startGeneration()} style={s.previewPrimaryBtn}>
              重新生成
            </button>
            <button type="button" onClick={() => setShowDebug((value) => !value)} style={s.previewGhostBtn}>
              查看调试信息
            </button>
          </div>
          <div style={s.failedSummary}>错误摘要：{debugSummary}</div>
        </div>
      </section>

      <section style={s.debugSection}>
        {showDebug ? (
          <div style={s.debugCard}>
            <div style={s.debugMetaGrid}>
              <div style={s.debugMetaRow}><strong>Job ID</strong><span>{job?.jobId ?? '-'}</span></div>
              <div style={s.debugMetaRow}><strong>Artifact ID</strong><span>{job?.artifactId ?? '-'}</span></div>
              <div style={s.debugMetaRow}><strong>状态</strong><span>{statusText(job?.status)}</span></div>
              <div style={s.debugMetaRow}><strong>底层错误</strong><span>{job?.error || submitError || '-'}</span></div>
            </div>
            <pre style={s.logs}>{logs || '暂无日志输出'}</pre>
          </div>
        ) : null}
      </section>
    </>
  )

  return (
    <div style={s.shell}>
      {uiState === 'idle' ? (
        <div style={s.heroWrap}>
          {renderComposer(false)}
        </div>
      ) : (
        <>
          <div style={s.topComposerWrap}>
            {renderComposer(true)}
          </div>
          {uiState === 'generating' ? renderGeneratingView() : null}
          {uiState === 'succeeded' ? renderSucceededView() : null}
          {uiState === 'failed' ? renderFailedView() : null}
        </>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  shell: {
    minHeight: '100vh',
    padding: '36px 28px 56px',
    background: 'linear-gradient(180deg, #f6f8fc 0%, #eef3fb 100%)',
    color: '#0f172a',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    boxSizing: 'border-box',
  },
  heroWrap: {
    minHeight: 'calc(100vh - 72px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topComposerWrap: {
    width: '100%',
    maxWidth: 1280,
    margin: '0 auto 24px',
  },
  composerCard: {
    width: '100%',
    background: 'rgba(255,255,255,0.96)',
    border: '1px solid rgba(217,226,239,0.9)',
    boxShadow: '0 22px 60px rgba(20, 45, 90, 0.08)',
    backdropFilter: 'blur(12px)',
    borderRadius: 24,
  },
  composerHero: {
    maxWidth: 760,
    padding: '34px 32px 26px',
  },
  composerCompact: {
    maxWidth: 1280,
    padding: '20px 22px 18px',
  },
  heroTitle: {
    margin: 0,
    fontSize: 34,
    lineHeight: 1.15,
    fontWeight: 800,
    textAlign: 'center',
    color: '#10213a',
  },
  heroSubtitle: {
    margin: '12px 0 22px',
    fontSize: 15,
    lineHeight: 1.7,
    textAlign: 'center',
    color: '#5d7086',
  },
  compactHead: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 14,
  },
  compactTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: '#13233b',
    marginBottom: 4,
  },
  compactSubtitle: {
    fontSize: 13,
    lineHeight: 1.6,
    color: '#6a7d91',
  },
  topActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  topGhostBtn: {
    height: 36,
    padding: '0 14px',
    borderRadius: 12,
    border: '1px solid #d7e1ec',
    background: '#fff',
    color: '#38506a',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  },
  textareaWrap: {
    position: 'relative',
  },
  controlRow: {
    marginTop: 14,
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'flex-end',
  },
  controlField: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    minWidth: 180,
    flex: '1 1 220px',
  },
  controlFieldInline: {
    flex: '0 0 auto',
    minWidth: 120,
    alignItems: 'flex-start',
  },
  controlLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: '#667a90',
  },
  select: {
    height: 40,
    borderRadius: 12,
    border: '1px solid #d7e1ec',
    background: '#fff',
    color: '#13233b',
    padding: '0 12px',
    fontSize: 13,
    fontWeight: 600,
  },
  numberInput: {
    height: 40,
    borderRadius: 12,
    border: '1px solid #d7e1ec',
    background: '#fff',
    color: '#13233b',
    padding: '0 12px',
    fontSize: 13,
    fontWeight: 600,
    width: 120,
  },
  templateHint: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 1.6,
    color: '#667a90',
  },
  textarea: {
    width: '100%',
    resize: 'vertical',
    boxSizing: 'border-box',
    borderRadius: 20,
    border: '1.5px solid #d7e1ec',
    background: '#fbfdff',
    color: '#13233b',
    outline: 'none',
    fontSize: 15,
    lineHeight: 1.7,
    padding: '18px 18px 74px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    boxShadow: 'inset 0 1px 2px rgba(15,23,42,0.03)',
  },
  textareaHero: {
    minHeight: 120,
    maxHeight: 220,
  },
  textareaCompact: {
    minHeight: 108,
    maxHeight: 220,
  },
  generateBtn: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    height: 44,
    padding: '0 18px',
    borderRadius: 14,
    border: 'none',
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    color: '#fff',
    fontSize: 14,
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '0 12px 28px rgba(37, 99, 235, 0.28)',
  },
  generateBtnDisabled: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    height: 44,
    padding: '0 18px',
    borderRadius: 14,
    border: 'none',
    background: '#a7b7cc',
    color: '#fff',
    fontSize: 14,
    fontWeight: 800,
    cursor: 'not-allowed',
  },
  chipRow: {
    marginTop: 16,
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  exampleChip: {
    height: 36,
    padding: '0 14px',
    borderRadius: 999,
    border: '1px solid #d9e3ee',
    background: '#fff',
    color: '#39506a',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  },
  centerStageWrap: {
    width: '100%',
    maxWidth: 980,
    margin: '28px auto 0',
    display: 'flex',
    justifyContent: 'center',
  },
  generatingCard: {
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
    maxWidth: 760,
    padding: '34px 30px 28px',
    borderRadius: 28,
    background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(245,249,255,0.98) 100%)',
    border: '1px solid rgba(199, 214, 232, 0.9)',
    boxShadow: '0 26px 70px rgba(30, 58, 95, 0.12)',
  },
  generatingGlow: {
    position: 'absolute',
    inset: '-20% auto auto -8%',
    width: 220,
    height: 220,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(59,130,246,0.20) 0%, rgba(59,130,246,0.06) 52%, rgba(59,130,246,0) 72%)',
    pointerEvents: 'none',
  },
  generatingEyebrow: {
    position: 'relative',
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#5c78a0',
    marginBottom: 10,
  },
  generatingTitle: {
    position: 'relative',
    margin: '0 0 10px',
    fontSize: 28,
    lineHeight: 1.25,
    fontWeight: 800,
    color: '#13233b',
  },
  generatingSubtitle: {
    position: 'relative',
    margin: '0 0 20px',
    fontSize: 14,
    lineHeight: 1.7,
    color: '#617589',
  },
  progressTrack: {
    position: 'relative',
    height: 10,
    borderRadius: 999,
    background: '#e3edf8',
    overflow: 'hidden',
    marginBottom: 22,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    background: 'linear-gradient(90deg, #4f8ff7 0%, #7c5cff 100%)',
    transition: 'width 800ms ease',
  },
  stepList: {
    display: 'grid',
    gap: 10,
  },
  stepItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    minHeight: 48,
    padding: '0 14px',
    borderRadius: 16,
    fontSize: 14,
    fontWeight: 700,
    transition: 'all 200ms ease',
  },
  stepItemActive: {
    background: 'rgba(59, 130, 246, 0.12)',
    color: '#194fb8',
    border: '1px solid rgba(59, 130, 246, 0.18)',
  },
  stepItemDone: {
    background: 'rgba(16, 185, 129, 0.08)',
    color: '#0f766e',
    border: '1px solid rgba(16, 185, 129, 0.12)',
  },
  stepItemIdle: {
    background: '#f8fbff',
    color: '#7a8ca2',
    border: '1px solid #e3edf8',
  },
  stepDot: {
    width: 11,
    height: 11,
    borderRadius: '50%',
    flexShrink: 0,
  },
  stepDotActive: {
    background: '#2563eb',
    boxShadow: '0 0 0 6px rgba(37,99,235,0.12)',
  },
  stepDotDone: {
    background: '#10b981',
  },
  stepDotIdle: {
    background: '#cbd5e1',
  },
  loadingDots: {
    marginLeft: 'auto',
    display: 'inline-flex',
    gap: 6,
    alignItems: 'center',
  },
  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'rgba(37,99,235,0.24)',
  },
  loadingDotActive: {
    background: '#2563eb',
    transform: 'scale(1.15)',
  },
  previewCard: {
    width: '100%',
    maxWidth: 1280,
    margin: '0 auto',
    padding: '24px 24px 18px',
    borderRadius: 26,
    background: '#ffffff',
    border: '1px solid rgba(214, 225, 238, 0.92)',
    boxShadow: '0 26px 70px rgba(24, 44, 79, 0.10)',
  },
  previewHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 18,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: '#13233b',
    marginBottom: 4,
  },
  previewSubtitle: {
    fontSize: 13,
    lineHeight: 1.6,
    color: '#697c90',
  },
  previewActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  previewPrimaryBtn: {
    height: 40,
    padding: '0 16px',
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    color: '#fff',
    fontSize: 13,
    fontWeight: 800,
    cursor: 'pointer',
  },
  previewGhostBtn: {
    height: 40,
    padding: '0 16px',
    borderRadius: 12,
    border: '1px solid #d8e2ed',
    background: '#fff',
    color: '#36506a',
    fontSize: 13,
    fontWeight: 800,
    cursor: 'pointer',
  },
  previewGhostLink: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    padding: '0 16px',
    borderRadius: 12,
    border: '1px solid #d8e2ed',
    background: '#fff',
    color: '#36506a',
    fontSize: 13,
    fontWeight: 800,
    cursor: 'pointer',
    textDecoration: 'none',
  },
  previewFrameWrap: {
    position: 'relative',
    width: '100%',
    aspectRatio: '16 / 9',
    borderRadius: 22,
    overflow: 'hidden',
    border: '1px solid #e3ebf6',
    background: '#000',
    minHeight: 620,
    maxHeight: '78vh',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
  },
  iframe: {
    display: 'block',
    width: '100%',
    height: '100%',
    border: 'none',
    background: '#000',
  },
  previewPlaceholder: {
    minHeight: 620,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#7b8da2',
    fontSize: 14,
    background: '#000',
  },
  previewLoadingMask: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 0, 0, 0.38)',
    color: '#e5eef9',
    fontSize: 14,
    fontWeight: 700,
    pointerEvents: 'none',
  },
  weakHint: {
    marginTop: 12,
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'right',
  },
  inlineErrorBox: {
    padding: '14px 16px',
    borderRadius: 14,
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#b91c1c',
    fontSize: 14,
  },
  retemplateBar: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: 10,
    padding: '12px 16px',
    background: '#f1f5f9',
    borderRadius: 14,
    marginBottom: 14,
  },
  retemplateLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: '#334155',
    whiteSpace: 'nowrap' as const,
  },
  retemplateSelect: {
    height: 36,
    padding: '0 10px',
    borderRadius: 10,
    border: '1px solid #cbd5e1',
    background: '#fff',
    fontSize: 13,
    color: '#1e293b',
    minWidth: 180,
    flex: 1,
  },
  retemplateApplyBtn: {
    height: 36,
    padding: '0 16px',
    borderRadius: 10,
    border: 'none',
    background: '#0ea5e9',
    color: '#fff',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  },
  retemplateError: {
    fontSize: 12,
    color: '#dc2626',
    flex: '0 0 100%',
  },
  debugSection: {
    width: '100%',
    maxWidth: 1280,
    margin: '16px auto 0',
  },
  debugToggle: {
    height: 38,
    padding: '0 14px',
    borderRadius: 12,
    border: '1px solid #dbe5ef',
    background: 'rgba(255,255,255,0.85)',
    color: '#51667d',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  },
  debugCard: {
    marginTop: 12,
    padding: 18,
    borderRadius: 18,
    background: 'rgba(255,255,255,0.9)',
    border: '1px solid #dee7f1',
    boxShadow: '0 12px 32px rgba(15,23,42,0.05)',
  },
  debugMetaGrid: {
    display: 'grid',
    gap: 10,
    marginBottom: 14,
  },
  debugMetaRow: {
    display: 'grid',
    gridTemplateColumns: '96px minmax(0, 1fr)',
    gap: 10,
    fontSize: 13,
    lineHeight: 1.6,
    color: '#334155',
    wordBreak: 'break-word',
  },
  logs: {
    margin: 0,
    padding: 14,
    maxHeight: 320,
    overflow: 'auto',
    borderRadius: 14,
    background: '#0f172a',
    color: '#e2e8f0',
    fontSize: 12,
    lineHeight: 1.65,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  failedCard: {
    width: '100%',
    maxWidth: 720,
    padding: '32px 28px 24px',
    borderRadius: 28,
    background: 'rgba(255,255,255,0.97)',
    border: '1px solid rgba(241, 205, 205, 0.9)',
    boxShadow: '0 22px 64px rgba(120, 32, 32, 0.08)',
    textAlign: 'center',
  },
  failedIcon: {
    width: 54,
    height: 54,
    margin: '0 auto 14px',
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    background: '#fee2e2',
    color: '#b91c1c',
    fontSize: 24,
    fontWeight: 800,
  },
  failedTitle: {
    margin: 0,
    fontSize: 28,
    fontWeight: 800,
    color: '#1b2330',
  },
  failedText: {
    margin: '12px 0 0',
    fontSize: 15,
    lineHeight: 1.7,
    color: '#5b6677',
  },
  failedActions: {
    marginTop: 22,
    display: 'flex',
    justifyContent: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  failedSummary: {
    marginTop: 18,
    padding: '12px 14px',
    borderRadius: 14,
    background: '#fff7f7',
    color: '#8f3b3b',
    fontSize: 13,
    lineHeight: 1.6,
    textAlign: 'left',
  },
}
