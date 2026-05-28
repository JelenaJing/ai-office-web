import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { platformApi } from '../../platform'
import { TASK_TIMEOUTS } from '../../constants/taskTimeouts'
import { resolveWebApiUrl } from '../../runtime/apiBase'
import { consumePendingResourceOpen, peekPendingResourceOpen } from '../../services/pendingResourceOpen'
import { consumePendingReportFromDocument } from '../../services/pendingReportFromDocument'
import {
  clearActiveHtmlSlidesJobPersistence,
  clearHtmlPptWorkbenchState,
  clearHtmlSlidesActiveJob,
  loadHtmlPptWorkbenchState,
  loadHtmlSlidesActiveJob,
  saveHtmlPptWorkbenchState,
  saveHtmlSlidesActiveJob,
  type PersistedHtmlPptChatMessage,
  type PersistedHtmlPptExportState,
} from '../../services/htmlPptWorkbenchState'

type ArtifactJobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled'
type QualityMode = 'fast' | 'high'
type UiState = 'idle' | 'generating' | 'succeeded' | 'failed' | 'canceled'

interface ArtifactJobResponse {
  success: boolean
  jobId: string
  status: ArtifactJobStatus
  type: string
  skillId?: string
  message?: string
  currentPhase?: string
  cancellable?: boolean
  error?: string
  warning?: string
  fallbackUsed?: boolean
  fallbackRenderer?: string
  opencodeTimedOut?: boolean
  noOutputSoftTimeoutTriggered?: boolean
  timeoutMs?: number
  artifactId?: string
  artifactFileUrl?: string
  requestedTemplateSlug?: string
  selectedTemplateSlug?: string
  appliedTemplateSlug?: string | null
  selectedStyleId?: string
  rendererMode?: string
  fallbackReason?: string
  templateStyleApplied?: 'full' | 'basic' | 'not-applied'
  repairAttempted?: boolean
  repairSucceeded?: boolean
  imageStats?: {
    planned: number
    generated: number
    placeholder: number
    providerConfigured?: boolean
  }
  skillStats?: {
    mode: 'fast-lite' | 'high-original-five-skills'
    requiredSkills?: string[]
    loadedSkills?: string[]
    missingSkills?: string[]
    usesLiteSkill?: boolean
    usesOriginalFiveSkills?: boolean
  }
  cancelRequestedAt?: string
  canceledAt?: string
  cancelReason?: string
  runnerPid?: number
  runnerProcessGroupId?: number
  partialOutput?: boolean
  htmlPresentationOptions?: {
    templateSlug?: string
    enableImages: boolean
    maxImages: number
    qualityMode: QualityMode
  }
  progress?: {
    stage?: string
    label?: string
    detail?: string
    percent?: number
    elapsedSeconds?: number
    heartbeatAt?: string
    heartbeatMessage?: string
    updatedAt?: string
  }
  createdAt?: number
  updatedAt?: number
}

interface ArtifactJobLogsResponse {
  success: boolean
  jobId: string
  logs: string
  entries?: string[]
  error?: string
  updatedAt?: number
}

interface PreviewState {
  artifactId: string
  url: string
}

type PptxExportState = PersistedHtmlPptExportState
type ChatMessage = PersistedHtmlPptChatMessage

interface TemplateOption {
  slug: string
  name: string
  tagline: string
  scheme: string
  density: string
  thumbnailUrl?: string
  previewUrl?: string
  coverUrl?: string
  screenshot?: string
  image?: string
  previewImage?: string
}

interface TemplateListResponse {
  success: boolean
  templates: TemplateOption[]
}

type HtmlSlidesTemplateCard = {
  id: string
  name: string
  description?: string
  thumbnailUrl?: string
  templateSlug: string
  tags: string[]
  usageCount?: number
  source?: 'beautiful-html-templates' | 'built_in' | 'uploaded'
  tone?: 'light' | 'dark' | 'mixed'
  complexity?: 'low' | 'medium' | 'high'
  cover: {
    gradient: string
    accent: string
    titleColor: string
  }
}

const TEMPLATE_DISPLAY_NAME_MAP: Record<string, string> = {
  'daisy-days-light': 'Daisy Days',
  'editorial-forest': 'Editorial Forest',
  'academic-presentation': 'Academic Presentation',
  'business-review': 'Business Review',
}

function pickTemplateThumbnailUrl(template: TemplateOption): string | undefined {
  const candidates = [
    template.thumbnailUrl,
    template.previewUrl,
    template.coverUrl,
    template.screenshot,
    template.image,
    template.previewImage,
  ]
  return candidates.find((x) => typeof x === 'string' && x.trim().length > 0)?.trim()
}

function buildTemplateCard(template: TemplateOption): HtmlSlidesTemplateCard {
  const key = `${template.slug} ${template.name}`.toLowerCase()
  const cover =
    /daisy/.test(key)
      ? { gradient: 'linear-gradient(135deg,#fff8e7,#fde68a)', accent: '#f59e0b', titleColor: '#92400e' }
      : /forest|editorial/.test(key)
        ? { gradient: 'linear-gradient(135deg,#14532d,#166534)', accent: '#fda4af', titleColor: '#ecfeff' }
        : /blue-professional|business-review|business/.test(key)
          ? { gradient: 'linear-gradient(135deg,#eff6ff,#bfdbfe)', accent: '#1d4ed8', titleColor: '#1e3a8a' }
          : /cobalt|academic/.test(key)
            ? { gradient: 'linear-gradient(135deg,#ffffff,#e0f2fe)', accent: '#0369a1', titleColor: '#0f172a' }
            : /coral/.test(key)
              ? { gradient: 'linear-gradient(135deg,#fff1f2,#fecdd3)', accent: '#e11d48', titleColor: '#881337' }
              : /bold|poster/.test(key)
                ? { gradient: 'linear-gradient(135deg,#111827,#334155)', accent: '#f97316', titleColor: '#f8fafc' }
                : /8-bit|orbit/.test(key)
                  ? { gradient: 'linear-gradient(135deg,#0f172a,#1e293b)', accent: '#22d3ee', titleColor: '#93c5fd' }
                  : { gradient: 'linear-gradient(135deg,#f8fafc,#e2e8f0)', accent: '#334155', titleColor: '#0f172a' }

  const tone: HtmlSlidesTemplateCard['tone'] = /dark|night|8-bit/.test(key) ? 'dark' : 'light'
  const complexity: HtmlSlidesTemplateCard['complexity'] = /editorial|bold|creative/.test(key) ? 'high' : 'medium'
  return {
    id: template.slug,
    name: TEMPLATE_DISPLAY_NAME_MAP[template.slug] || template.name,
    description: template.tagline,
    thumbnailUrl: pickTemplateThumbnailUrl(template),
    templateSlug: template.slug,
    tags: [template.scheme, template.density].filter(Boolean),
    tone,
    complexity,
    source: 'beautiful-html-templates',
    cover,
  }
}

interface HtmlPptExportResponse {
  success: boolean
  exportArtifactId: string
  filename: string
  downloadUrl: string
  cached: boolean
  artifact?: {
    id: string
    title: string
    exports: Array<{ format: string; filename: string; url: string }>
  }
  error?: string
}

const EXAMPLE_PROMPTS = [
  'AI Office 产品发布会',
  '高校行政办公 AIOS 方案',
  '企业内部知识库建设汇报',
]

const CHAT_QUICK_COMMANDS = [
  '改成更正式',
  '增加目录页',
  '减少文字',
  '改成无图版本',
  '导出 PPTX',
  '更换模板',
]

const SHOW_ARTIFACT_DEBUG_LOGS =
  import.meta.env.DEV
  || import.meta.env.VITE_SHOW_ARTIFACT_DEBUG_LOGS === 'true'

type ArtifactJobProgress = NonNullable<ArtifactJobResponse['progress']>

type UserFacingPptAnimation =
  | 'queue'
  | 'prepare'
  | 'loading'
  | 'analyze'
  | 'plan'
  | 'design'
  | 'generate'
  | 'polish'
  | 'image'
  | 'package'
  | 'done'
  | 'fallback'
  | 'error'

type UserFacingPptProgress = {
  title: string
  detail: string
  statusText: string
  animation: UserFacingPptAnimation
}

const GENERATING_ANIMATION_CSS = `
@keyframes htmlPptGeneratingPulse {
  0%, 100% { opacity: 0.45; transform: scale(0.96); }
  50% { opacity: 1; transform: scale(1); }
}
@keyframes htmlPptGeneratingBlink {
  0%, 80%, 100% { opacity: 0.25; transform: translateY(0); }
  40% { opacity: 1; transform: translateY(-2px); }
}
@keyframes htmlPptGeneratingShimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.html-ppt-generating-pulse {
  animation: htmlPptGeneratingPulse 1.6s ease-in-out infinite;
}
.html-ppt-generating-dots span {
  display: inline-block;
  width: 7px;
  height: 7px;
  margin: 0 3px;
  border-radius: 50%;
  background: #4f8ff7;
  animation: htmlPptGeneratingBlink 1.4s infinite both;
}
.html-ppt-generating-dots span:nth-child(2) { animation-delay: 0.2s; }
.html-ppt-generating-dots span:nth-child(3) { animation-delay: 0.4s; }
.html-ppt-generating-shimmer {
  background: linear-gradient(90deg, #e8f0fb 0%, #f6f9ff 40%, #e8f0fb 80%);
  background-size: 200% 100%;
  animation: htmlPptGeneratingShimmer 2.2s ease-in-out infinite;
}
`

const DEFAULT_CHAT_MESSAGES: ChatMessage[] = [{
  id: 'assistant-default',
  role: 'assistant',
  text: '这里可以记录你对当前演示文稿的修改要求。真实局部修改能力正在接入；目前可先通过左侧重新生成、应用模板、下载 HTML/PPTX。',
  createdAt: '',
}]

function createChatMessage(role: ChatMessage['role'], text: string): ChatMessage {
  return {
    id: `${role}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    text,
    createdAt: new Date().toISOString(),
  }
}

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = platformApi.auth.getToken()
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extra ?? {}),
  }
}

class ApiRequestError extends Error {
  readonly status: number
  readonly reason?: string

  constructor(status: number, message: string, reason?: string) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.reason = reason
  }
}

function isApiNotFoundError(error: unknown): boolean {
  return error instanceof ApiRequestError && error.status === 404
}

function isApiNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) return true
  return error instanceof ApiRequestError && error.status <= 0
}

async function apiFetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(resolveWebApiUrl(url), {
      ...init,
      headers: authHeaders(init?.headers as Record<string, string> | undefined),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new ApiRequestError(0, message || '网络请求失败')
  }
  if (!res.ok) {
    const payload = await res.json().catch(() => ({ error: res.statusText }))
    const reason = typeof (payload as { reason?: string }).reason === 'string'
      ? (payload as { reason?: string }).reason
      : undefined
    const message = (payload as { message?: string; error?: string }).message
      ?? (payload as { error?: string }).error
      ?? res.statusText
    throw new ApiRequestError(res.status, message, reason)
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
    case 'canceled':
      return '已停止'
    default:
      return '未开始'
  }
}

function phaseText(phase?: string): string {
  switch (phase) {
    case 'queued':
      return '任务排队中'
    case 'starting':
      return '正在准备生成环境'
    case 'opencode':
      return '正在生成 HTML PPT'
    case 'repairing-output':
      return '正在修复输出路径'
    case 'postprocess':
      return '正在注入模板与运行时'
    case 'final-check':
      return '正在完成最终检查'
    case 'finalizing':
      return '正在写入预览产物'
    case 'canceling':
      return '正在停止生成'
    case 'completed':
      return '生成已完成'
    case 'failed':
      return '生成失败'
    case 'canceled':
      return '已停止生成'
    default:
      return '正在处理中'
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

function resolveJobTimeoutSeconds(job: ArtifactJobResponse | null, qualityMode: QualityMode): number {
  if (job?.timeoutMs) return Math.round(job.timeoutMs / 1000)
  return qualityMode === 'high' ? 600 : Math.round(TASK_TIMEOUTS.htmlPpt / 1000)
}

function sanitizeUserVisibleLog(input: string): string {
  return input
    .replace(/OpenCode/gi, '生成引擎')
    .replace(/opencodeHeartbeat/gi, '生成心跳')
    .replace(/skills\/[^\s]+/g, '内部生成资源')
    .replace(/\/data\/[^\s]+/g, '内部路径')
    .replace(/Read\s+[^\s]+/gi, '读取内部资源')
    .replace(/stdout/gi, '输出')
    .replace(/stderr/gi, '运行信息')
    .replace(/(api[_-]?key|token|secret|authorization|bearer)[^\n]*/gi, '[已隐藏]')
    .slice(0, 200)
}

function sanitizeUserFacingWarning(message: string): string {
  const secondsMatch = message.match(/(\d+)\s*秒/)
  const seconds = secondsMatch ? secondsMatch[1] : ''
  let text = sanitizeUserVisibleLog(message)
  if (/高质量|high/i.test(message) || /备用|草稿|fallback/i.test(message)) {
    if (seconds) {
      return `高质量生成耗时较长（超过 ${seconds} 秒），系统已先生成一个可预览草稿。你可以继续使用草稿，或稍后重新生成高质量版本。`
    }
    return '高质量生成耗时较长，系统已先生成一个可预览草稿。你可以继续使用草稿，或稍后重新生成高质量版本。'
  }
  if (/超时|未完成|timed\s*out/i.test(text)) {
    return seconds
      ? `生成时间较长（超过 ${seconds} 秒），系统已使用快速备用方案完成初稿。`
      : '生成时间较长，系统已使用快速备用方案完成初稿。'
  }
  return text
}

function isHtmlSlidesTemplateActuallyApplied(job: ArtifactJobResponse | null): boolean {
  if (!job || job.fallbackUsed) return false
  const mode = job.rendererMode || ''
  return mode === 'opencode-template-driven-fast'
    || mode === 'opencode-template-driven-high'
    || mode === 'opencode-template-driven'
    || mode === 'beautiful-template-adapter-retemplate'
    || mode === 'beautiful-template-adapter-fast'
}

function isHtmlSlidesFastDraftFallback(job: ArtifactJobResponse | null): boolean {
  return Boolean(job?.fallbackUsed) && job?.rendererMode === 'safe-fast-renderer'
}

function buildTemplateFallbackWarning(job: ArtifactJobResponse | null): string {
  if (!isHtmlSlidesFastDraftFallback(job)) return ''
  const planned = job?.requestedTemplateSlug || job?.selectedTemplateSlug
  return planned
    ? `所选模板未完整应用（原计划：${planned}）。可点击「高质量重新生成」或「应用模板」重试。`
    : '所选模板未完整应用。可点击「高质量重新生成」或「应用模板」重试。'
}

function buildSuccessWarning(job: ArtifactJobResponse | null, qualityMode: QualityMode): string {
  if (!job) return ''
  const templateFallbackWarning = buildTemplateFallbackWarning(job)
  if (templateFallbackWarning) return templateFallbackWarning
  if (job.warning) return sanitizeUserFacingWarning(job.warning)
  if (!job.opencodeTimedOut || !job.fallbackUsed) return ''
  const seconds = resolveJobTimeoutSeconds(job, qualityMode)
  const isHigh = qualityMode === 'high' || job.htmlPresentationOptions?.qualityMode === 'high'
  if (isHigh) {
    return `高质量生成在 ${seconds} 秒内未完成，系统已先生成一个可预览草稿。你可以重新生成或先使用当前草稿。`
  }
  return `生成时间较长（超过 ${seconds} 秒），系统已使用快速备用方案完成初稿。`
}

function heartbeatFreshness(progress?: ArtifactJobProgress): 'active' | 'stale' | 'unknown' {
  if (!progress?.heartbeatAt) return 'unknown'
  const ageMs = Date.now() - Date.parse(progress.heartbeatAt)
  if (!Number.isFinite(ageMs)) return 'unknown'
  return ageMs <= 45_000 ? 'active' : 'stale'
}

function getUserFacingHeartbeatStatus(
  heartbeatState: 'active' | 'stale' | 'unknown',
  qualityMode: QualityMode,
): string {
  if (heartbeatState === 'active') {
    return qualityMode === 'high' ? '高质量生成仍在进行，请稍等' : '生成任务正在运行'
  }
  if (heartbeatState === 'stale') {
    return '生成时间较长，系统仍在等待结果'
  }
  return qualityMode === 'high' ? '高质量生成准备中…' : '生成任务准备中…'
}

function getUserFacingPptProgress(
  progress: ArtifactJobProgress | undefined,
  qualityMode: QualityMode,
): UserFacingPptProgress {
  switch (progress?.stage) {
    case 'queued':
      return {
        title: '正在排队生成',
        detail: '系统正在准备你的演示文稿任务。',
        statusText: '任务已加入生成队列',
        animation: 'queue',
      }
    case 'preparing':
      return {
        title: '正在准备内容',
        detail: '正在整理主题、要求和生成素材。',
        statusText: '正在准备生成环境',
        animation: 'prepare',
      }
    case 'loading_skills':
      return {
        title: '正在加载高质量生成能力',
        detail: '正在准备页面设计、版式和视觉生成能力。',
        statusText: '正在准备高质量生成能力',
        animation: 'loading',
      }
    case 'analyzing':
      return {
        title: '正在理解演示主题',
        detail: '正在分析你的输入内容，提取核心信息。',
        statusText: '正在分析主题',
        animation: 'analyze',
      }
    case 'planning_slides':
      return {
        title: '正在规划页面结构',
        detail: '正在设计每一页的标题、重点和内容层次。',
        statusText: '正在规划页面',
        animation: 'plan',
      }
    case 'planning_visuals':
      return {
        title: '正在设计视觉风格',
        detail: '正在匹配适合的版式、颜色和视觉表达。',
        statusText: '正在设计视觉风格',
        animation: 'design',
      }
    case 'running_opencode':
    case 'opencode_heartbeat':
      return {
        title: qualityMode === 'high' ? '正在生成高质量演示文稿' : '正在快速生成演示文稿',
        detail: qualityMode === 'high' ? '高质量模式需要更多时间，请稍等。' : '正在生成快速预览版本。',
        statusText: '生成任务正在运行',
        animation: 'generate',
      }
    case 'postprocessing':
      return {
        title: '正在优化页面细节',
        detail: '正在检查页面结构、排版和内容完整性。',
        statusText: '正在优化页面',
        animation: 'polish',
      }
    case 'fulfilling_images':
      return {
        title: '正在生成配图',
        detail: '正在为页面生成匹配主题的视觉图片。',
        statusText: '正在生成页面图片',
        animation: 'image',
      }
    case 'packaging':
      return {
        title: '正在打包预览文件',
        detail: '即将完成，你马上可以预览和下载。',
        statusText: '正在打包结果',
        animation: 'package',
      }
    case 'completed':
      return {
        title: '生成完成',
        detail: '你可以预览、下载 HTML 包 或继续生成 PPTX。',
        statusText: '生成完成',
        animation: 'done',
      }
    case 'fallback':
      return {
        title: '已生成快速草稿',
        detail: '高质量生成耗时较长，系统已先生成一个可预览草稿。你可以继续使用草稿，或稍后重新生成高质量版本。',
        statusText: '当前展示的是快速草稿',
        animation: 'fallback',
      }
    case 'failed':
      return {
        title: '生成失败',
        detail: '生成过程中出现问题，请稍后重试。',
        statusText: '生成失败',
        animation: 'error',
      }
    default:
      return {
        title: '正在生成演示文稿',
        detail: '系统正在处理你的请求。',
        statusText: '生成任务正在运行',
        animation: 'generate',
      }
  }
}

function parseRecentLogEntries(logs: string, entries?: string[], limit = 10): string[] {
  const raw = entries && entries.length > 0
    ? entries.slice(-limit)
    : logs
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(-limit)
  return raw.map((line) => sanitizeUserVisibleLog(line))
}

export default function HtmlPptPage({ onBack }: { onBack?: () => void }) {
  const [inputText, setInputText] = useState('')
  const [templateOptions, setTemplateOptions] = useState<TemplateOption[]>([])
  const [hoveredTemplateSlug, setHoveredTemplateSlug] = useState('')
  const [templatePreviewSlug, setTemplatePreviewSlug] = useState('')
  const [thumbnailLoadFailedSlugs, setThumbnailLoadFailedSlugs] = useState<string[]>([])
  const [selectedTemplateSlug, setSelectedTemplateSlug] = useState('')
  const [qualityMode, setQualityMode] = useState<QualityMode>('fast')
  const [enableImages, setEnableImages] = useState(false)
  const [maxImages, setMaxImages] = useState(0)
  const [job, setJob] = useState<ArtifactJobResponse | null>(null)
  const [logs, setLogs] = useState('')
  const [logEntries, setLogEntries] = useState<string[]>([])
  const [submitError, setSubmitError] = useState('')
  const [cancelError, setCancelError] = useState('')
  const [noticeMessage, setNoticeMessage] = useState('')
  const [previewError, setPreviewError] = useState('')
  const [preview, setPreview] = useState<PreviewState | null>(null)
  const [previewLoaded, setPreviewLoaded] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isStateReady, setIsStateReady] = useState(false)
  const [pptxExport, setPptxExport] = useState<PptxExportState | null>(null)
  const [lastGeneratedAt, setLastGeneratedAt] = useState('')
  const [showDebug, setShowDebug] = useState(false)
  const [showGeneratingDebugLogs, setShowGeneratingDebugLogs] = useState(false)
  const [generationElapsedMs, setGenerationElapsedMs] = useState(0)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  // Retemplate state
  const [retemplateSlug, setRetemplateSlug] = useState('')
  const [isRetemplating, setIsRetemplating] = useState(false)
  const [retemplateError, setRetemplateError] = useState('')
  const [retemplateWarning, setRetemplateWarning] = useState('')

  const previewRef = useRef<HTMLDivElement | null>(null)
  const previewIframeRef = useRef<HTMLIFrameElement | null>(null)
  const loadedArtifactIdRef = useRef<string>('')
  const generationStartedAtRef = useRef<number | null>(null)
  const pendingReportMarkdownRef = useRef('')
  const pendingReportPromptRef = useRef('')
  const pendingReportStartedRef = useRef(false)
  const stateRestoredRef = useRef(false)
  const jobReconciledRef = useRef(false)
  const pollStoppedRef = useRef(false)
  const pollErrorCountRef = useRef(0)

  useEffect(() => {
    syncPreviewAuthCookie()
  }, [])

  useEffect(() => {
    if (stateRestoredRef.current) return
    stateRestoredRef.current = true
    const restored = loadHtmlPptWorkbenchState()
    if (restored) {
      setInputText(restored.currentPrompt || '')
      setSelectedTemplateSlug(restored.selectedTemplateId || '')
      setQualityMode(restored.qualityMode === 'high' ? 'high' : 'fast')
      setEnableImages(Boolean(restored.enableImages))
      setMaxImages(typeof restored.maxImages === 'number' ? restored.maxImages : 0)
      setJob((restored.job as ArtifactJobResponse | null | undefined) ?? null)
      setLogs(restored.logs || '')
      setSubmitError(restored.error || '')
      setRetemplateSlug(restored.retemplateSlug || '')
      setRetemplateWarning(restored.retemplateWarning || '')
      setPptxExport(restored.pptxExport || null)
      setLastGeneratedAt(restored.lastGeneratedAt || '')
      setChatMessages(Array.isArray(restored.chatMessages) ? restored.chatMessages : [])
      if (restored.preview?.artifactId) {
        setPreview({
          artifactId: restored.preview.artifactId,
          url: `${buildPreviewUrl(restored.preview.artifactId)}?t=${Date.now()}`,
        })
        setPreviewLoaded(false)
      }
      if (restored.lastGeneratedAt) {
        const restoredStartedAt = new Date(restored.lastGeneratedAt).getTime()
        generationStartedAtRef.current = Number.isFinite(restoredStartedAt) ? restoredStartedAt : null
      }
    }
    const activeJob = loadHtmlSlidesActiveJob()
    if (activeJob?.jobId && !restored?.job) {
      setJob({
        success: true,
        jobId: activeJob.jobId,
        status: 'running',
        type: 'html_presentation',
        message: '正在恢复生成任务…',
      })
      if (activeJob.startedAt) {
        const restoredStartedAt = new Date(activeJob.startedAt).getTime()
        generationStartedAtRef.current = Number.isFinite(restoredStartedAt) ? restoredStartedAt : null
      }
    }
    setIsStateReady(true)
  }, [])

  const clearActiveHtmlSlidesJob = useCallback((reason: 'cancelled' | 'stale' | 'completed' | 'failed' | 'network') => {
    pollStoppedRef.current = true
    pollErrorCountRef.current = 0
    generationStartedAtRef.current = null
    setGenerationElapsedMs(0)
    setIsSubmitting(false)
    setIsCancelling(false)
    clearHtmlSlidesActiveJob()
    clearActiveHtmlSlidesJobPersistence()
    if (reason === 'cancelled') {
      setJob((prev) => (prev ? {
        ...prev,
        status: 'canceled',
        message: '已停止生成',
        currentPhase: 'canceled',
        cancellable: false,
      } : null))
    } else if (reason === 'stale' || reason === 'network') {
      setJob(null)
      setLogs('')
      setLogEntries([])
    } else if (reason === 'completed' || reason === 'failed') {
      clearHtmlSlidesActiveJob()
    }
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
          (targetWindow as { postMessage: (message: unknown, targetOrigin: string) => void }).postMessage(responsePayload, '*')
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

  useEffect(() => {
    if (qualityMode === 'fast') {
      setEnableImages(false)
      setMaxImages(0)
      return
    }
    setEnableImages(true)
    setMaxImages((value) => (value > 0 ? value : 4))
  }, [qualityMode])

  const loadPreview = useCallback(async (artifactId: string) => {
    if (!artifactId || loadedArtifactIdRef.current === artifactId) return
    syncPreviewAuthCookie()
    setPreviewError('')
    setPreviewLoaded(false)
    loadedArtifactIdRef.current = artifactId
    setPreview({
      artifactId,
      url: `${buildPreviewUrl(artifactId)}?t=${Date.now()}`,
    })
  }, [])

  useEffect(() => {
    const pending = peekPendingResourceOpen()
    if (!pending || pending.kind !== 'html-ppt-artifact') return
    consumePendingResourceOpen()
    void loadPreview(pending.artifactId)
    setLastGeneratedAt(new Date().toISOString())
    setJob({
      success: true,
      jobId: `opened-${pending.artifactId}`,
      status: 'succeeded',
      type: 'html_presentation',
      artifactId: pending.artifactId,
    })
  }, [loadPreview])

  const loadJobStatus = useCallback(async (jobId: string) => {
    const jobData = await apiFetchJson<ArtifactJobResponse>(`/api/artifact-jobs/${jobId}`)
    setJob(jobData)
    if (jobData.appliedTemplateSlug) {
      setSelectedTemplateSlug(jobData.appliedTemplateSlug)
      setRetemplateSlug(jobData.appliedTemplateSlug)
    } else if (jobData.requestedTemplateSlug) {
      setRetemplateSlug(jobData.requestedTemplateSlug)
    } else if (jobData.selectedTemplateSlug) {
      setSelectedTemplateSlug(jobData.selectedTemplateSlug)
      setRetemplateSlug(jobData.selectedTemplateSlug)
    }
    if (jobData.status === 'succeeded' && jobData.artifactId) {
      const completedAt = typeof jobData.updatedAt === 'number'
        ? new Date(jobData.updatedAt).toISOString()
        : typeof jobData.updatedAt === 'string'
          ? jobData.updatedAt
          : typeof jobData.createdAt === 'number'
            ? new Date(jobData.createdAt).toISOString()
            : typeof jobData.createdAt === 'string'
              ? jobData.createdAt
              : new Date().toISOString()
      setLastGeneratedAt(completedAt)
      try {
        await loadPreview(jobData.artifactId)
      } catch (error) {
        setPreviewError(error instanceof Error ? error.message : String(error))
      }
    }
    return jobData
  }, [loadPreview])

  const loadJobLogs = useCallback(async (jobId: string) => {
    const logsData = await apiFetchJson<ArtifactJobLogsResponse>(`/api/artifact-jobs/${jobId}/logs?limit=10`)
    setLogs(logsData.logs ?? '')
    setLogEntries(logsData.entries ?? [])
    return logsData
  }, [])

  const loadJob = useCallback(async (jobId: string) => {
    const jobData = await loadJobStatus(jobId)
    await loadJobLogs(jobId).catch(() => {})
    return jobData
  }, [loadJobLogs, loadJobStatus])

  useEffect(() => {
    if (!isStateReady || jobReconciledRef.current) return
    const jobId = job?.jobId
    if (!jobId || jobId.startsWith('opened-')) return
    if (job.status !== 'queued' && job.status !== 'running') {
      jobReconciledRef.current = true
      return
    }

    jobReconciledRef.current = true
    pollStoppedRef.current = false
    pollErrorCountRef.current = 0

    void (async () => {
      try {
        const latest = await loadJobStatus(jobId)
        if (latest.status === 'succeeded' || latest.status === 'failed' || latest.status === 'canceled') {
          clearHtmlSlidesActiveJob()
        }
      } catch (error) {
        if (isApiNotFoundError(error)) {
          clearActiveHtmlSlidesJob('stale')
          setNoticeMessage('上一次生成任务已结束或服务已重启，请重新生成。')
          setSubmitError('')
        } else if (isApiNetworkError(error)) {
          clearActiveHtmlSlidesJob('network')
          setSubmitError('无法连接生成服务，请检查后端是否运行。')
        } else {
          setSubmitError(error instanceof Error ? error.message : String(error))
        }
      }
    })()
  }, [clearActiveHtmlSlidesJob, isStateReady, job?.jobId, job?.status, loadJobStatus])

  useEffect(() => {
    if (!job?.jobId || (job.status !== 'queued' && job.status !== 'running')) return
    if (pollStoppedRef.current) return
    let cancelled = false

    const pollStatus = async () => {
      if (pollStoppedRef.current || cancelled) return
      try {
        const next = await loadJobStatus(job.jobId)
        pollErrorCountRef.current = 0
        if (!cancelled && !pollStoppedRef.current) {
          if (next.status === 'succeeded') {
            clearHtmlSlidesActiveJob()
            setIsCancelling(false)
            void loadJobLogs(job.jobId).catch(() => {})
          } else if (next.status === 'failed') {
            clearActiveHtmlSlidesJob('failed')
            setIsCancelling(false)
            void loadJobLogs(job.jobId).catch(() => {})
          } else if (next.status === 'canceled') {
            clearActiveHtmlSlidesJob('cancelled')
            setNoticeMessage('已停止生成')
            setIsCancelling(false)
            void loadJobLogs(job.jobId).catch(() => {})
          }
        }
      } catch (error) {
        if (cancelled || pollStoppedRef.current) return
        if (isApiNotFoundError(error)) {
          pollStoppedRef.current = true
          clearActiveHtmlSlidesJob('stale')
          setNoticeMessage('上一次生成任务已结束或服务已重启，请重新生成。')
          setSubmitError('')
          return
        }
        if (isApiNetworkError(error)) {
          pollErrorCountRef.current += 1
          if (pollErrorCountRef.current >= 3) {
            pollStoppedRef.current = true
            clearActiveHtmlSlidesJob('network')
            setSubmitError('无法连接生成服务，请检查后端是否运行。')
          }
          return
        }
        setSubmitError(error instanceof Error ? error.message : String(error))
      }
    }

    void pollStatus()
    const timer = window.setInterval(() => {
      void pollStatus()
    }, 2500)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [clearActiveHtmlSlidesJob, job?.jobId, job?.status, loadJobLogs, loadJobStatus])

  useEffect(() => {
    if (!SHOW_ARTIFACT_DEBUG_LOGS) return
    if (!job?.jobId || (job.status !== 'queued' && job.status !== 'running')) return
    let cancelled = false

    const pollLogs = async () => {
      try {
        await loadJobLogs(job.jobId)
      } catch {
        // logs polling failure should not block generation UI
      }
    }

    void pollLogs()
    const timer = window.setInterval(() => {
      void pollLogs()
    }, 4000)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [job?.jobId, job?.status, loadJobLogs])

  useEffect(() => {
    if (job?.status === 'queued' || job?.status === 'running') return
    setIsCancelling(false)
  }, [job?.status])

  const uiState = useMemo<UiState>(() => {
    if (job?.status === 'queued' || job?.status === 'running' || isSubmitting) return 'generating'
    if (job?.status === 'succeeded') return 'succeeded'
    if (job?.status === 'canceled') return 'canceled'
    if (job?.status === 'failed' || submitError) return 'failed'
    return 'idle'
  }, [isSubmitting, job?.status, submitError])

  useEffect(() => {
    if (!isStateReady) return
    const isActiveJob = job?.status === 'queued' || job?.status === 'running'
    saveHtmlPptWorkbenchState({
      currentPrompt: inputText,
      currentJobId: isActiveJob ? (job?.jobId || '') : '',
      currentDeckId: '',
      currentArtifactId: preview?.artifactId || job?.artifactId || '',
      selectedTemplateId: selectedTemplateSlug,
      generationStatus: isActiveJob ? (job?.status || '') : (job?.status === 'succeeded' ? 'succeeded' : ''),
      htmlPreviewUrl: preview?.url || '',
      htmlContent: '',
      pptxExportUrl: pptxExport?.downloadUrl || '',
      exportStatus: pptxExport?.status || 'idle',
      lastGeneratedAt,
      currentStep: isActiveJob ? (job?.currentPhase || '') : '',
      error: submitError,
      logs: logs.slice(-20_000),
      qualityMode,
      enableImages,
      maxImages,
      retemplateSlug,
      retemplateWarning,
      job: isActiveJob ? (job as Record<string, unknown>) : (job?.status === 'succeeded' ? (job as Record<string, unknown>) : null),
      preview,
      pptxExport,
      chatMessages,
    })
  }, [
    chatMessages,
    enableImages,
    inputText,
    isStateReady,
    job,
    lastGeneratedAt,
    logs,
    maxImages,
    pptxExport,
    preview,
    qualityMode,
    retemplateSlug,
    retemplateWarning,
    selectedTemplateSlug,
    submitError,
    uiState,
  ])

  useEffect(() => {
    if (!preview?.artifactId) return
    setPptxExport((prev) => (prev && prev.artifactId !== preview.artifactId ? null : prev))
  }, [preview?.artifactId])

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
    const markdown = pendingReportMarkdownRef.current || buildArtifactMarkdown(trimmedInput)
    const prompt = pendingReportPromptRef.current || buildArtifactPrompt(trimmedInput)
    if (!markdown.trim() && !trimmedInput) return

    setIsSubmitting(true)
    setSubmitError('')
    setCancelError('')
    setNoticeMessage('')
    setPreviewError('')
    pollStoppedRef.current = false
    pollErrorCountRef.current = 0
    jobReconciledRef.current = false
    setLogs('')
    setLogEntries([])
    setShowDebug(false)
    setRetemplateWarning('')
    setIsCancelling(false)
    setPptxExport(null)
    setJob(null)
    const startedAtIso = new Date().toISOString()
    setLastGeneratedAt(startedAtIso)
    generationStartedAtRef.current = new Date(startedAtIso).getTime()
    loadedArtifactIdRef.current = ''
    setPreview(null)
    setPreviewLoaded(false)

    try {
      if (import.meta.env.DEV) {
        console.info(`htmlSlidesGenerate selectedTemplateSlug=${selectedTemplateSlug || '(auto)'}`)
      }
      const created = await apiFetchJson<ArtifactJobResponse>('/api/artifact-jobs', {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          type: 'html_presentation',
          skillId: 'html-ppt-beautiful',
          prompt,
          inputMarkdown: markdown,
          templateSlug: selectedTemplateSlug || undefined,
          enableImages,
          maxImages,
          qualityMode,
        }),
      })
      pendingReportMarkdownRef.current = ''
      pendingReportPromptRef.current = ''
      setJob(created)
      saveHtmlSlidesActiveJob({
        jobId: created.jobId,
        startedAt: startedAtIso,
        qualityMode,
        templateSlug: selectedTemplateSlug || undefined,
      })
      await loadJob(created.jobId)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : String(error))
    } finally {
      setIsSubmitting(false)
    }
  }, [enableImages, inputText, loadJob, maxImages, qualityMode, selectedTemplateSlug])

  useEffect(() => {
    if (pendingReportStartedRef.current) return
    const pending = consumePendingReportFromDocument()
    if (!pending) return
    pendingReportStartedRef.current = true
    pendingReportMarkdownRef.current = pending.inputMarkdown
    pendingReportPromptRef.current = pending.prompt
    setInputText(pending.title)
    void startGeneration()
  }, [startGeneration])

  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await startGeneration()
  }, [startGeneration])

  const handleCancelGeneration = useCallback(async () => {
    if (!job?.jobId || job.jobId.startsWith('opened-') || isCancelling || (job.status !== 'queued' && job.status !== 'running')) return
    setCancelError('')
    setNoticeMessage('')
    setIsCancelling(true)
    pollStoppedRef.current = true
    try {
      const result = await apiFetchJson<{
        success: boolean
        ok?: boolean
        jobId: string
        status: ArtifactJobStatus
        message?: string
        cancelRequestedAt?: string
        canceledAt?: string
        alreadyFinished?: boolean
      }>(`/api/artifact-jobs/${job.jobId}/cancel`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ reason: 'user_cancelled' }),
      })
      if (result.status === 'canceled' || result.alreadyFinished) {
        clearActiveHtmlSlidesJob('cancelled')
        setNoticeMessage(result.message === 'already completed'
          ? '生成已完成。'
          : '已停止生成')
        setIsCancelling(false)
        return
      }
      setJob((prev) => (prev && prev.jobId === job.jobId ? {
        ...prev,
        status: 'running',
        cancelRequestedAt: result.cancelRequestedAt,
        canceledAt: result.canceledAt,
        message: '正在停止…',
        currentPhase: 'canceling',
        cancellable: false,
      } : prev))
      pollStoppedRef.current = false
      void loadJob(job.jobId).catch((error) => {
        if (isApiNotFoundError(error)) {
          clearActiveHtmlSlidesJob('stale')
          setNoticeMessage('上一次生成任务已结束或服务已重启，请重新生成。')
          setIsCancelling(false)
          return
        }
        setIsCancelling(false)
        setCancelError('停止生成失败，请稍后重试。')
      })
    } catch (error) {
      setIsCancelling(false)
      if (isApiNotFoundError(error)) {
        clearActiveHtmlSlidesJob('stale')
        setNoticeMessage('上一次生成任务已结束或服务已重启，请重新生成。')
        return
      }
      setCancelError('停止生成失败，请稍后重试。')
    }
  }, [clearActiveHtmlSlidesJob, isCancelling, job?.jobId, job?.status, loadJob])

  const handleDownloadHtml = useCallback(async () => {
    if (!job?.artifactId) return
    const artifactId = job.artifactId
    const res = await fetch(resolveWebApiUrl(`/api/artifacts/${artifactId}/download-html-ppt`), {
      headers: authHeaders(),
    })
    if (!res.ok) {
      setPreviewError('下载失败，请稍后重试。')
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(inputText || '演示文稿').replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_').slice(0, 48)}.zip`
    a.click()
    URL.revokeObjectURL(url)
  }, [inputText, job?.artifactId])

  const handleExportPptx = useCallback(async () => {
    const artifactId = job?.artifactId || preview?.artifactId
    if (!artifactId) return

    if (pptxExport?.status === 'ready' && pptxExport.exportArtifactId) {
      await platformApi.artifacts.download(pptxExport.exportArtifactId, pptxExport.filename || 'presentation.pptx')
      return
    }

    setPptxExport({
      status: 'running',
      artifactId,
      error: '',
      filename: pptxExport?.filename || `${(inputText || '演示文稿').replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_').slice(0, 48)}.pptx`,
      exportArtifactId: '',
      downloadUrl: '',
    })

    try {
      const result = await apiFetchJson<HtmlPptExportResponse>(`/api/artifacts/${artifactId}/html-presentation/export-pptx`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({}),
      })
      if (!result.success || !result.exportArtifactId) {
        throw new Error(result.error || 'PPTX 转换失败')
      }
      const nextState: PptxExportState = {
        status: 'ready',
        artifactId,
        exportArtifactId: result.exportArtifactId,
        downloadUrl: result.downloadUrl,
        filename: result.filename,
        error: '',
      }
      setPptxExport(nextState)
      await platformApi.artifacts.download(result.exportArtifactId, result.filename)
    } catch (error) {
      setPptxExport({
        status: 'failed',
        artifactId,
        error: error instanceof Error ? error.message : String(error),
        filename: pptxExport?.filename || 'presentation.pptx',
        exportArtifactId: '',
        downloadUrl: '',
      })
    }
  }, [inputText, job?.artifactId, pptxExport, preview?.artifactId])

  const handleRetemplate = useCallback(async () => {
    if (!retemplateSlug || !job?.artifactId) return
    setIsRetemplating(true)
    setRetemplateError('')
    setRetemplateWarning('')
    setPreviewLoaded(false)
    try {
      const res = await fetch(resolveWebApiUrl(`/api/artifacts/${job.artifactId}/html-presentation/retemplate`), {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ templateSlug: retemplateSlug }),
      })
      const data = (await res.json()) as {
        success?: boolean
        previewUrl?: string
        error?: string
        warning?: string
        rendererMode?: string
        fallbackUsed?: boolean
        templateSlug?: string
      }
      if (!res.ok || !data.success) throw new Error(data.error ?? '换模板失败')
      if (data.fallbackUsed || data.rendererMode === 'generic-fallback' || data.rendererMode === 'html-ppt-beautiful-fallback') {
        throw new Error(data.warning || 'TEMPLATE_RENDERER_NOT_FOUND')
      }
      const appliedTemplateSlug = data.templateSlug || retemplateSlug
      setRetemplateWarning(data.warning ?? '')
      setSelectedTemplateSlug(appliedTemplateSlug)
      setRetemplateSlug(appliedTemplateSlug)
      setPptxExport(null)
      setLastGeneratedAt(new Date().toISOString())
      // Force iframe remount with a cache-buster
      const cacheBuster = `?t=${Date.now()}`
      setPreview((prev) => prev ? { ...prev, url: buildPreviewUrl(job.artifactId!) + cacheBuster } : prev)
    } catch (err) {
      setRetemplateError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsRetemplating(false)
    }
  }, [job?.artifactId, retemplateSlug])

  const handleSendChat = useCallback((textOverride?: string) => {
    const text = (textOverride ?? chatInput).trim()
    if (!text) return
    setChatMessages((prev) => [
      ...prev,
      createChatMessage('user', text),
      createChatMessage(
        'assistant',
        text.includes('PPTX') && (job?.artifactId || preview?.artifactId)
          ? '已收到导出请求。请使用左侧“生成 / 下载 PPTX”按钮完成真实导出。'
          : '修改能力正在接入，可先在左侧重新生成、应用模板或导出 PPTX。',
      ),
    ])
    setChatInput('')
  }, [chatInput, job?.artifactId, preview?.artifactId])

  const handleQuickChatCommand = useCallback((command: string) => {
    if (command === '改成无图版本') {
      setEnableImages(false)
      setMaxImages(0)
      setChatInput(command)
      return
    }
    if (command === '导出 PPTX') {
      if (job?.artifactId || preview?.artifactId) {
        void handleExportPptx()
      }
      handleSendChat(command)
      return
    }
    setChatInput(command)
  }, [handleExportPptx, handleSendChat, job?.artifactId, preview?.artifactId])

  const handleReset = useCallback(() => {
    pollStoppedRef.current = true
    pollErrorCountRef.current = 0
    jobReconciledRef.current = false
    setInputText('')
    setJob(null)
    setLogs('')
    setLogEntries([])
    setSubmitError('')
    setCancelError('')
    setNoticeMessage('')
    setPreviewError('')
    setShowDebug(false)
    setRetemplateWarning('')
    setIsCancelling(false)
    setPptxExport(null)
    setLastGeneratedAt('')
    setChatMessages([])
    setChatInput('')
    loadedArtifactIdRef.current = ''
    setPreview(null)
    setPreviewLoaded(false)
    generationStartedAtRef.current = null
    clearHtmlPptWorkbenchState()
  }, [])

  const canSubmit = Boolean(inputText.trim()) && uiState !== 'generating'
  const templateCards = useMemo(() => templateOptions.map(buildTemplateCard), [templateOptions])
  const selectedTemplateCard = useMemo(
    () => templateCards.find((item) => item.templateSlug === selectedTemplateSlug) ?? null,
    [templateCards, selectedTemplateSlug],
  )
  const requestedTemplateSlug = job?.requestedTemplateSlug
    || job?.htmlPresentationOptions?.templateSlug
    || selectedTemplateSlug
  const appliedTemplateSlugFromJob = job?.appliedTemplateSlug ?? undefined
  const templateActuallyApplied = isHtmlSlidesTemplateActuallyApplied(job)
  const isFastDraftFallback = isHtmlSlidesFastDraftFallback(job)
  const displayAppliedSlug = templateActuallyApplied
    ? (appliedTemplateSlugFromJob || job?.selectedTemplateSlug || selectedTemplateSlug)
    : ''
  const appliedTemplateCard = useMemo(
    () => (displayAppliedSlug
      ? templateCards.find((item) => item.templateSlug === displayAppliedSlug) ?? null
      : null),
    [displayAppliedSlug, templateCards],
  )
  const requestedTemplateCard = useMemo(
    () => (requestedTemplateSlug
      ? templateCards.find((item) => item.templateSlug === requestedTemplateSlug) ?? null
      : null),
    [requestedTemplateSlug, templateCards],
  )
  const currentTemplateLabel = isFastDraftFallback
    ? '快速草稿'
    : templateActuallyApplied
      ? (appliedTemplateCard?.name || displayAppliedSlug || '自动')
      : (selectedTemplateSlug ? (requestedTemplateCard?.name || requestedTemplateSlug) : '自动')
  const retemplateSelectValue = retemplateSlug
    || (templateActuallyApplied ? displayAppliedSlug : requestedTemplateSlug)
    || ''
  const showTemplateFallbackBanner = isFastDraftFallback
    || (Boolean(requestedTemplateSlug) && !templateActuallyApplied && job?.status === 'succeeded')
  const previewTemplateCard = useMemo(
    () => templateCards.find((item) => item.templateSlug === templatePreviewSlug) ?? null,
    [templateCards, templatePreviewSlug],
  )
  const elapsedSeconds = job?.progress?.elapsedSeconds ?? Math.max(0, Math.floor(generationElapsedMs / 1000))
  const progressPercent = Math.min(100, Math.max(0, job?.progress?.percent ?? 8))
  const heartbeatState = heartbeatFreshness(job?.progress)
  const userFacingProgress = useMemo(
    () => getUserFacingPptProgress(job?.progress, qualityMode),
    [job?.progress, qualityMode],
  )
  const userFacingHeartbeat = getUserFacingHeartbeatStatus(heartbeatState, qualityMode)
  const recentDebugLogs = useMemo(
    () => (SHOW_ARTIFACT_DEBUG_LOGS ? parseRecentLogEntries(logs, logEntries, 10) : []),
    [logEntries, logs],
  )
  const debugSummary = summarizeDebugError(job?.error || submitError)
  const successWarning = buildSuccessWarning(job, qualityMode)
  const isHighGenerating = qualityMode === 'high'
  const maxWaitLabel = isHighGenerating ? '约 15 分钟' : '约 5 分钟'

  const renderTemplateCover = (card: HtmlSlidesTemplateCard) => {
    const canUseRealThumbnail =
      Boolean(card.thumbnailUrl)
      && !thumbnailLoadFailedSlugs.includes(card.templateSlug)
    if (canUseRealThumbnail && card.thumbnailUrl) {
      return (
        <img
          src={card.thumbnailUrl}
          alt={card.name}
          style={s.templateImg}
          loading="lazy"
          onError={(event) => {
            setThumbnailLoadFailedSlugs((prev) => (
              prev.includes(card.templateSlug) ? prev : [...prev, card.templateSlug]
            ))
            ;(event.currentTarget as HTMLImageElement).style.display = 'none'
          }}
        />
      )
    }
    return (
      <>
        <div style={{ ...s.templateAccent, background: card.cover.accent }} />
        <div style={s.templateFallbackStripe} />
        <div style={{ ...s.templateFallbackTitle, color: card.cover.titleColor }}>{card.name}</div>
      </>
    )
  }

  const renderWelcomeView = () => (
    <section style={s.welcomeWrap}>
      <div style={s.pageTitle}>AI Office / HTML Slides</div>
      {noticeMessage ? (
        <div style={s.noticeBanner}>
          <div>{noticeMessage}</div>
          <div style={s.noticeBannerHint}>你可以修改需求后重新生成。</div>
        </div>
      ) : null}
      {submitError && uiState === 'idle' ? (
        <div style={s.errorBanner}>{submitError}</div>
      ) : null}
      <h1 style={s.welcomeTitle}>今天想创建什么演示文稿？</h1>
      <form onSubmit={handleSubmit} style={s.welcomeComposer}>
        <textarea
          value={inputText}
          onChange={(event) => setInputText(event.target.value)}
          placeholder="例如：生成一份面向学校行政部门的 AI Office 产品介绍 PPT"
          style={s.welcomeTextarea}
        />
        <div style={s.welcomeToolbar}>
          <div style={s.toolbarLeft}>
            <button type="button" style={s.linkBtn} onClick={() => setInputText('创建一份空白演示文稿，含封面、目录和结束页。')}>创建空白</button>
          </div>
          <div style={s.toolbarRight}>
            <button type="button" style={qualityMode === 'fast' ? s.modeBtnActive : s.modeBtn} onClick={() => setQualityMode('fast')}>快速</button>
            <button type="button" style={qualityMode === 'high' ? s.modeBtnActive : s.modeBtn} onClick={() => setQualityMode('high')}>高质量</button>
            <label style={s.toggleLabel}>
              <input type="checkbox" checked={enableImages} onChange={(e) => setEnableImages(e.target.checked)} disabled={qualityMode === 'fast'} />
              自动配图
            </label>
            <button type="submit" disabled={!canSubmit} style={canSubmit ? s.sendBtn : s.sendBtnDisabled}>↑</button>
          </div>
        </div>
      </form>
      <div style={s.selectedTemplateHint}>
        <span>
          {selectedTemplateSlug
            ? `将使用模板：${templateCards.find((c) => c.templateSlug === selectedTemplateSlug)?.name || selectedTemplateSlug}`
            : '未选择模板（将自动推荐）'}
        </span>
        {selectedTemplateSlug ? (
          <button
            type="button"
            style={s.clearTemplateBtn}
            onClick={() => {
              setSelectedTemplateSlug('')
              setRetemplateSlug('')
            }}
          >
            取消模板
          </button>
        ) : null}
      </div>
      <div style={s.templateSectionTitle}>HTML Slides 模板</div>
      <div style={s.templateGrid}>
        {templateCards.map((card) => (
          <div
            key={card.id}
            style={{
              ...s.templateCard,
              ...(selectedTemplateSlug === card.templateSlug ? s.templateCardSelected : null),
            }}
            onMouseEnter={() => setHoveredTemplateSlug(card.templateSlug)}
            onMouseLeave={() => setHoveredTemplateSlug('')}
          >
            <div style={{ ...s.templateCover, background: card.cover.gradient }}>
              {renderTemplateCover(card)}
              <div style={s.templateCoverLabel}>16:9</div>
              <div
                style={{
                  ...s.templateCardOverlay,
                  opacity: hoveredTemplateSlug === card.templateSlug ? 1 : 0,
                }}
              />
              <div
                style={{
                  ...s.templateCardActions,
                  opacity: hoveredTemplateSlug === card.templateSlug ? 1 : 0,
                  transform: hoveredTemplateSlug === card.templateSlug ? 'translateY(0)' : 'translateY(4px)',
                  pointerEvents: hoveredTemplateSlug === card.templateSlug ? 'auto' : 'none',
                }}
              >
                <button type="button" style={s.templateActionBtn} onClick={() => setSelectedTemplateSlug(card.templateSlug)}>使用</button>
                <button type="button" style={s.templateActionBtnGhost} onClick={() => setTemplatePreviewSlug(card.templateSlug)}>预览</button>
              </div>
            </div>
            <div style={s.templateName}>{card.name}</div>
            <div style={s.templateMeta}>HTML Slides · {card.tone || 'light'} · {card.complexity || 'medium'}</div>
          </div>
        ))}
      </div>
    </section>
  )

  const renderGeneratingView = () => (
    <section style={s.centerStageWrap}>
      <style>{GENERATING_ANIMATION_CSS}</style>
      <div style={s.generatingCard}>
        <div style={s.generatingEyebrow}>{isHighGenerating ? '正在生成高质量 HTML Slides' : '正在快速生成 HTML Slides'}</div>
        <h2 style={s.generatingTitle}>{userFacingProgress.title}</h2>
        <p style={s.generatingSubtitle}>
          {isHighGenerating ? '正在进行深度排版与视觉生成，最长可能需要约 15 分钟。' : '快速模式正在生成草稿。'}
        </p>
        <div style={s.generatingMetaRow}>
          <div style={s.generatingMetaChip}>当前阶段：{userFacingProgress.title}</div>
          <div style={s.generatingMetaChip}>已用时间：{elapsedSeconds}s</div>
          <div style={s.generatingMetaChip}>最近更新：{job?.progress?.updatedAt ? new Date(job.progress.updatedAt).toLocaleTimeString() : '--:--'}</div>
        </div>
        <div style={s.progressTrack}>
          <div style={{ ...s.progressFill, width: `${progressPercent}%` }} />
        </div>
        <p style={s.generatingStatusLine}>{userFacingHeartbeat}</p>
        <button type="button" onClick={() => void handleCancelGeneration()} disabled={isCancelling || !job?.jobId} style={isCancelling ? s.stopBtnDisabled : s.stopBtn}>
          {isCancelling ? '正在停止…' : '停止生成'}
        </button>
        {cancelError ? <p style={s.generatingErrorLine}>{cancelError}</p> : null}
      </div>
    </section>
  )

  const renderPreviewWorkspace = () => {
    const visibleMessages = chatMessages.length > 0 ? chatMessages : DEFAULT_CHAT_MESSAGES
    return (
      <section style={s.workspaceWrap}>
        <div style={s.workspaceTopBar}>
          <div style={s.workspaceTitle}>HTML Slides 工作台</div>
          <div style={s.previewActions}>
            <button type="button" onClick={handleReset} style={s.previewGhostBtn}>返回首页</button>
            <button type="button" onClick={() => void startGeneration()} style={s.previewGhostBtn}>重新生成</button>
            <button type="button" onClick={() => void handleDownloadHtml()} style={s.previewGhostBtn}>下载 HTML 包</button>
            <button type="button" onClick={() => void handleExportPptx()} style={s.previewPrimaryBtn}>
              {pptxExport?.status === 'running' ? '正在转换 PPTX…' : pptxExport?.status === 'ready' ? '下载 PPTX' : '生成 / 下载 PPTX'}
            </button>
          </div>
        </div>
        <div style={s.workspaceBody}>
          <aside style={s.chatPanel}>
            <div style={s.chatHeader}>
              <div style={s.chatTitle}>{inputText || '当前演示文稿'}</div>
              <div style={s.chatSubtitle}>输入修改要求（当前先走重新生成流程）</div>
            </div>
            <div style={s.chatQuickRow}>
              {['改正式', '减少文字', '增加图片', '改成中文', '重新生成', '换模板'].map((command) => (
                <button key={command} type="button" style={s.chatQuickBtn} onClick={() => setChatInput(command)}>{command}</button>
              ))}
            </div>
            <div style={s.chatMessages}>
              {visibleMessages.map((message) => (
                <div key={message.id} style={{ ...s.chatBubble, ...(message.role === 'user' ? s.chatBubbleUser : s.chatBubbleAssistant) }}>
                  <div style={s.chatBubbleMeta}>{message.role === 'user' ? '你' : 'AI 助手'}</div>
                  <div style={s.chatBubbleText}>{message.text}</div>
                </div>
              ))}
            </div>
            <form
              style={s.chatInputWrap}
              onSubmit={(event) => {
                event.preventDefault()
                handleSendChat()
              }}
            >
              <textarea value={chatInput} onChange={(event) => setChatInput(event.target.value)} style={s.chatTextarea} placeholder="继续描述修改要求…" />
              <button type="submit" style={chatInput.trim() ? s.chatSendBtn : s.chatSendBtnDisabled} disabled={!chatInput.trim()}>
                发送
              </button>
            </form>
          </aside>
          <div style={s.previewCard}>
            {previewError ? <div style={s.inlineErrorBox}>{previewError}</div> : null}
            <div style={s.retemplateBar}>
              <span style={s.retemplateLabel}>
                {isFastDraftFallback ? '当前：快速草稿' : `当前模板：${currentTemplateLabel}`}
              </span>
              {showTemplateFallbackBanner ? (
                <span style={s.templateFallbackHint}>{buildTemplateFallbackWarning(job)}</span>
              ) : null}
              <select value={retemplateSelectValue} onChange={(e) => setRetemplateSlug(e.target.value)} style={s.retemplateSelect}>
                <option value="">更换模板</option>
                {templateOptions.map((t) => (
                  <option key={t.slug} value={t.slug}>{t.name}</option>
                ))}
              </select>
              <button type="button" onClick={() => void handleRetemplate()} disabled={!retemplateSlug || isRetemplating} style={s.retemplateApplyBtn}>
                {isRetemplating ? '应用中…' : '应用模板'}
              </button>
              {preview?.url ? (
                <a href={preview.url} target="_blank" rel="noreferrer" style={s.previewGhostLink} onClick={() => syncPreviewAuthCookie()}>
                  新窗口预览
                </a>
              ) : null}
            </div>
            <div style={s.previewFrameWrap}>
              {preview?.url ? (
                <iframe
                  ref={previewIframeRef}
                  key={preview.url}
                  title="HTML Slides Preview"
                  src={preview.url}
                  sandbox="allow-scripts allow-same-origin allow-downloads"
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
              {preview?.url && !previewLoaded && !previewError ? <div style={s.previewLoadingMask}>正在加载预览…</div> : null}
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <div style={s.shell}>
      {onBack ? (
        <div style={{ marginBottom: 8 }}>
          <button type="button" onClick={onBack} style={s.topGhostBtn}>返回</button>
        </div>
      ) : null}
      {uiState === 'idle' ? renderWelcomeView() : null}
      {uiState === 'generating' ? renderGeneratingView() : null}
      {uiState === 'succeeded' ? renderPreviewWorkspace() : null}
      {uiState === 'failed' ? (
        <section style={s.centerStageWrap}>
          <div style={s.failedCard}>
            <h2 style={s.failedTitle}>生成失败</h2>
            <p style={s.failedText}>{submitError || '请稍后重试。'}</p>
            <button type="button" onClick={() => void startGeneration()} style={s.previewPrimaryBtn}>重新生成</button>
          </div>
        </section>
      ) : null}
      {uiState === 'canceled' ? (
        <section style={s.centerStageWrap}>
          <div style={s.canceledCard}>
            <h2 style={s.failedTitle}>已停止生成</h2>
            <p style={s.failedText}>{noticeMessage || '你可以修改需求后重新生成。'}</p>
            <button type="button" onClick={() => { setNoticeMessage(''); setJob(null) }} style={s.previewGhostBtn}>返回首页</button>
            <button type="button" onClick={() => void startGeneration()} style={s.previewPrimaryBtn}>重新生成</button>
          </div>
        </section>
      ) : null}
      {previewTemplateCard ? (
        <div style={s.modalMask} onClick={() => setTemplatePreviewSlug('')}>
          <div style={s.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={{ ...s.templateCover, background: previewTemplateCard.cover.gradient, height: 220 }}>
              {renderTemplateCover(previewTemplateCard)}
            </div>
            <h3 style={{ margin: '14px 0 6px' }}>{previewTemplateCard.name}</h3>
            <p style={{ margin: 0, color: '#64748b' }}>{previewTemplateCard.description || 'HTML Slides 模板'}</p>
            <div style={{ marginTop: 14, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" style={s.previewGhostBtn} onClick={() => setTemplatePreviewSlug('')}>关闭</button>
              <button
                type="button"
                style={s.previewPrimaryBtn}
                onClick={() => {
                  setSelectedTemplateSlug(previewTemplateCard.templateSlug)
                  setTemplatePreviewSlug('')
                }}
              >
                使用模板
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  shell: {
    width: '100%',
    height: '100%',
    minHeight: 0,
    overflowY: 'auto',
    padding: 20,
    background: '#f8fafc',
    color: '#0f172a',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    boxSizing: 'border-box',
  },
  welcomeWrap: {
    maxWidth: 1280,
    margin: '0 auto',
    padding: '20px 8px 36px',
  },
  pageTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#64748b',
    marginBottom: 16,
  },
  welcomeTitle: {
    margin: '0 0 20px',
    fontSize: 42,
    textAlign: 'center',
    lineHeight: 1.15,
  },
  welcomeComposer: {
    width: 'min(860px, 100%)',
    margin: '0 auto',
    border: '1px solid #dbe4f0',
    borderRadius: 20,
    background: '#fff',
    boxShadow: '0 20px 48px rgba(15,23,42,0.08)',
    padding: 14,
  },
  welcomeTextarea: {
    width: '100%',
    minHeight: 132,
    border: 'none',
    outline: 'none',
    resize: 'vertical',
    fontSize: 16,
    lineHeight: 1.7,
    color: '#0f172a',
    fontFamily: 'inherit',
  },
  welcomeToolbar: {
    borderTop: '1px solid #e5e7eb',
    paddingTop: 10,
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  toolbarLeft: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  toolbarRight: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  linkBtn: {
    border: 'none',
    background: 'transparent',
    color: '#475569',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: 13,
  },
  modeBtn: {
    border: '1px solid #dbe4f0',
    background: '#fff',
    borderRadius: 999,
    padding: '6px 12px',
    fontSize: 12,
    cursor: 'pointer',
  },
  modeBtnActive: {
    border: '1px solid #2563eb',
    background: '#eff6ff',
    color: '#1d4ed8',
    borderRadius: 999,
    padding: '6px 12px',
    fontSize: 12,
    cursor: 'pointer',
    fontWeight: 700,
  },
  toggleLabel: {
    display: 'inline-flex',
    gap: 6,
    alignItems: 'center',
    fontSize: 12,
    color: '#475569',
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: '50%',
    border: 'none',
    background: '#2563eb',
    color: '#fff',
    fontWeight: 800,
    cursor: 'pointer',
  },
  sendBtnDisabled: {
    width: 34,
    height: 34,
    borderRadius: '50%',
    border: 'none',
    background: '#94a3b8',
    color: '#fff',
    cursor: 'not-allowed',
  },
  selectedTemplateHint: {
    width: 'min(860px, 100%)',
    margin: '10px auto 16px',
    color: '#64748b',
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  clearTemplateBtn: {
    border: '1px solid #dbeafe',
    background: '#fff',
    color: '#2563eb',
    borderRadius: 999,
    padding: '5px 10px',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  },
  tabsWrap: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tabBtn: {
    border: 'none',
    background: 'transparent',
    padding: '6px 4px',
    color: '#64748b',
    fontSize: 14,
    cursor: 'pointer',
  },
  tabBtnActive: {
    border: 'none',
    background: 'transparent',
    padding: '6px 4px',
    color: '#0f172a',
    fontSize: 14,
    fontWeight: 800,
    borderBottom: '2px solid #2563eb',
    cursor: 'pointer',
  },
  templateGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
    gap: 20,
  },
  templateSectionTitle: {
    margin: '6px 0 14px',
    fontSize: 18,
    fontWeight: 800,
    color: '#0f172a',
  },
  templateCard: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 16,
    padding: 10,
    transition: 'box-shadow 160ms ease, transform 160ms ease, border-color 160ms ease',
    boxShadow: '0 4px 14px rgba(15,23,42,0.04)',
  },
  templateCardSelected: {
    borderColor: '#3b82f6',
    boxShadow: '0 0 0 2px rgba(59,130,246,0.16)',
  },
  templateCover: {
    position: 'relative',
    borderRadius: 14,
    aspectRatio: '16/9',
    overflow: 'hidden',
    border: '1px solid #dbe4f0',
  },
  templateImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  templateAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 6,
    height: '100%',
  },
  templateFallbackStripe: {
    position: 'absolute',
    right: 14,
    top: 14,
    width: 72,
    height: 10,
    borderRadius: 999,
    background: 'rgba(255,255,255,0.65)',
  },
  templateFallbackTitle: {
    position: 'absolute',
    left: 14,
    bottom: 14,
    fontSize: 14,
    fontWeight: 800,
    maxWidth: '80%',
    lineHeight: 1.2,
  },
  templateCoverLabel: {
    position: 'absolute',
    right: 8,
    top: 8,
    fontSize: 11,
    color: '#334155',
    background: 'rgba(255,255,255,0.7)',
    padding: '2px 6px',
    borderRadius: 999,
  },
  templateCardOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(15,23,42,0.32)',
    transition: 'opacity 160ms ease',
  },
  templateCardActions: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'opacity 160ms ease, transform 160ms ease',
  },
  templateActionBtn: {
    height: 32,
    borderRadius: 999,
    border: 'none',
    padding: '0 14px',
    background: '#2563eb',
    color: '#fff',
    fontSize: 12,
    cursor: 'pointer',
  },
  templateActionBtnGhost: {
    height: 32,
    borderRadius: 999,
    border: '1px solid #cbd5e1',
    padding: '0 14px',
    background: '#fff',
    color: '#0f172a',
    fontSize: 12,
    cursor: 'pointer',
  },
  templateName: {
    marginTop: 8,
    fontWeight: 700,
    fontSize: 14,
    color: '#0f172a',
  },
  templateMeta: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748b',
  },
  workspaceWrap: {
    maxWidth: 1400,
    margin: '0 auto',
    display: 'grid',
    gap: 12,
  },
  workspaceTopBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  workspaceTitle: {
    fontSize: 18,
    fontWeight: 800,
  },
  workspaceBody: {
    display: 'grid',
    gridTemplateColumns: '400px minmax(0,1fr)',
    gap: 14,
    minHeight: 0,
  },
  modalMask: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15,23,42,0.45)',
    display: 'grid',
    placeItems: 'center',
    zIndex: 90,
  },
  modalCard: {
    width: 'min(700px,92vw)',
    background: '#fff',
    borderRadius: 16,
    padding: 16,
    border: '1px solid #dbe4f0',
  },
  mainPane: {
    minWidth: 0,
    minHeight: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '8px 8px 40px',
    display: 'flex',
    flexDirection: 'column',
  },
  heroWrap: {
    flex: 1,
    minHeight: '100%',
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
  qualityHint: {
    display: 'block',
    marginTop: 6,
    fontSize: 12,
    lineHeight: 1.5,
    color: '#5f738c',
    fontWeight: 500,
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
    alignItems: 'stretch',
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
  generatingMetaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  generatingMetaChip: {
    padding: '8px 12px',
    borderRadius: 999,
    background: '#eef4ff',
    border: '1px solid #d7e5ff',
    color: '#36506a',
    fontSize: 12,
    fontWeight: 700,
  },
  generatingDetail: {
    position: 'relative',
    margin: '0 0 14px',
    fontSize: 13,
    lineHeight: 1.6,
    color: '#4f657c',
  },
  generatingStatusLine: {
    position: 'relative',
    margin: '0 0 10px',
    fontSize: 14,
    fontWeight: 700,
    color: '#2f4d73',
  },
  generatingAnimationWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 18,
  },
  generatingPulseOrb: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: 'radial-gradient(circle at 30% 30%, #93c5fd 0%, #4f8ff7 55%, #6366f1 100%)',
    boxShadow: '0 10px 24px rgba(79, 143, 247, 0.35)',
  },
  generatingDots: {
    display: 'flex',
    alignItems: 'center',
  },
  generatingDebugPanel: {
    marginTop: 8,
    marginBottom: 12,
  },
  generatingDebugToggle: {
    border: 'none',
    background: 'transparent',
    color: '#5c78a0',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    padding: 0,
    marginBottom: 8,
  },
  generatingLogBox: {
    position: 'relative',
    marginTop: 8,
    marginBottom: 18,
    padding: '12px 14px',
    borderRadius: 14,
    background: '#f6f9fc',
    border: '1px solid #dde7f2',
    maxHeight: 180,
    overflow: 'auto',
  },
  generatingLogTitle: {
    fontSize: 12,
    fontWeight: 800,
    color: '#5c78a0',
    marginBottom: 8,
  },
  generatingLogLine: {
    fontSize: 11,
    lineHeight: 1.5,
    color: '#4a6078',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    marginBottom: 4,
    wordBreak: 'break-word',
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
  generatingActionRow: {
    marginTop: 18,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  stopBtn: {
    height: 40,
    padding: '0 16px',
    borderRadius: 12,
    border: '1px solid #f3b8b8',
    background: '#fff5f5',
    color: '#b42318',
    fontSize: 13,
    fontWeight: 800,
    cursor: 'pointer',
  },
  stopBtnDisabled: {
    height: 40,
    padding: '0 16px',
    borderRadius: 12,
    border: '1px solid #f1d2d2',
    background: '#f8eaea',
    color: '#c27b7b',
    fontSize: 13,
    fontWeight: 800,
    cursor: 'not-allowed',
  },
  inlineErrorText: {
    fontSize: 12,
    lineHeight: 1.5,
    color: '#b42318',
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
    boxSizing: 'border-box',
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
    minHeight: 480,
    maxHeight: '72vh',
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
    minHeight: 480,
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
  inlineWarnBox: {
    padding: '14px 16px',
    borderRadius: 14,
    background: '#fff7e6',
    border: '1px solid #f5d28c',
    color: '#8a5600',
    fontSize: 14,
    marginBottom: 14,
  },
  inlineSuccessBox: {
    padding: '14px 16px',
    borderRadius: 14,
    background: '#ecfdf3',
    border: '1px solid #86efac',
    color: '#166534',
    fontSize: 14,
    marginBottom: 14,
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
  templateFallbackHint: {
    fontSize: 12,
    color: '#b45309',
    flex: '1 1 220px',
    lineHeight: 1.45,
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
  chatPanel: {
    minWidth: 0,
    minHeight: 0,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 24,
    background: 'rgba(255,255,255,0.96)',
    border: '1px solid rgba(214, 225, 238, 0.95)',
    boxShadow: '0 22px 58px rgba(24, 44, 79, 0.08)',
  },
  chatHeader: {
    padding: '20px 20px 14px',
    borderBottom: '1px solid #e5edf6',
    flexShrink: 0,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: 850,
    color: '#13233b',
    marginBottom: 6,
  },
  chatSubtitle: {
    fontSize: 13,
    lineHeight: 1.6,
    color: '#6b7f95',
  },
  chatQuickRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    padding: '14px 16px',
    borderBottom: '1px solid #e9eff7',
    flexShrink: 0,
  },
  chatQuickBtn: {
    height: 32,
    padding: '0 10px',
    borderRadius: 999,
    border: '1px solid #d9e4f0',
    background: '#f8fbff',
    color: '#38506a',
    fontSize: 12,
    fontWeight: 750,
    cursor: 'pointer',
  },
  chatMessages: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    background: 'linear-gradient(180deg, #fbfdff 0%, #f4f8fd 100%)',
  },
  chatBubble: {
    maxWidth: '92%',
    padding: '11px 12px',
    borderRadius: 16,
    fontSize: 13,
    lineHeight: 1.65,
    wordBreak: 'break-word',
  },
  chatBubbleUser: {
    alignSelf: 'flex-end',
    background: '#2563eb',
    color: '#fff',
    borderTopRightRadius: 6,
  },
  chatBubbleAssistant: {
    alignSelf: 'flex-start',
    background: '#fff',
    color: '#25364a',
    border: '1px solid #e1e9f3',
    borderTopLeftRadius: 6,
  },
  chatBubbleMeta: {
    fontSize: 11,
    fontWeight: 800,
    opacity: 0.72,
    marginBottom: 4,
  },
  chatBubbleText: {
    whiteSpace: 'pre-wrap',
  },
  chatInputWrap: {
    flexShrink: 0,
    padding: 14,
    borderTop: '1px solid #e1e9f3',
    display: 'grid',
    gap: 10,
    background: '#fff',
  },
  chatTextarea: {
    width: '100%',
    minHeight: 88,
    maxHeight: 150,
    resize: 'vertical',
    borderRadius: 14,
    border: '1px solid #d8e2ed',
    padding: 12,
    boxSizing: 'border-box',
    outline: 'none',
    fontSize: 13,
    lineHeight: 1.6,
    color: '#13233b',
  },
  chatSendBtn: {
    height: 40,
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    color: '#fff',
    fontSize: 13,
    fontWeight: 800,
    cursor: 'pointer',
  },
  chatSendBtnDisabled: {
    height: 40,
    borderRadius: 12,
    border: 'none',
    background: '#a7b7cc',
    color: '#fff',
    fontSize: 13,
    fontWeight: 800,
    cursor: 'not-allowed',
  },
  noticeBanner: {
    marginBottom: 16,
    padding: '14px 16px',
    borderRadius: 16,
    background: 'rgba(239, 246, 255, 0.95)',
    border: '1px solid rgba(147, 197, 253, 0.8)',
    color: '#1e3a8a',
    fontSize: 14,
    lineHeight: 1.5,
  },
  noticeBannerHint: {
    marginTop: 6,
    fontSize: 13,
    color: '#475569',
  },
  errorBanner: {
    marginBottom: 16,
    padding: '14px 16px',
    borderRadius: 16,
    background: 'rgba(254, 242, 242, 0.95)',
    border: '1px solid rgba(252, 165, 165, 0.8)',
    color: '#991b1b',
    fontSize: 14,
    lineHeight: 1.5,
  },
  generatingErrorLine: {
    marginTop: 12,
    fontSize: 13,
    color: '#b91c1c',
    textAlign: 'center',
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
  canceledCard: {
    width: '100%',
    maxWidth: 720,
    padding: '32px 28px 24px',
    borderRadius: 28,
    background: 'rgba(255,255,255,0.97)',
    border: '1px solid rgba(203, 213, 225, 0.95)',
    boxShadow: '0 22px 64px rgba(51, 65, 85, 0.08)',
    textAlign: 'center',
  },
  canceledIcon: {
    width: 54,
    height: 54,
    margin: '0 auto 14px',
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    background: '#e2e8f0',
    color: '#334155',
    fontSize: 16,
    fontWeight: 800,
  },
  canceledSummary: {
    marginTop: 18,
    padding: '12px 14px',
    borderRadius: 14,
    background: '#f8fafc',
    color: '#475569',
    fontSize: 13,
    lineHeight: 1.6,
    textAlign: 'left',
  },
}
