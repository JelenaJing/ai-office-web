import type { SkillResult } from '../../../platform'
import { DEFAULT_TASK_POLL_INTERVAL_MS, TASK_TIMEOUTS } from '../../../constants/taskTimeouts'
import { resolveWebApiUrl } from '../../../runtime/apiBase'

function readAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return (
    window.localStorage.getItem('aios_auth_token')
    ?? window.localStorage.getItem('aios_itoken')
    ?? window.localStorage.getItem('ai_office_internal_token')
  )
}

function authHeaders(): Record<string, string> {
  const token = readAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function sanitizePptUserMessage(message: string): string {
  const text = message.trim()
  if (!text) return '操作失败，请稍后重试'
  if (/deckdocument|deck document/i.test(text)) {
    return '演示文稿预览已过期，正在尝试恢复…'
  }
  if (/任务不存在|已过期/i.test(text)) {
    return '生成任务已过期，请重新生成 PPT'
  }
  return text
}

function extractResponseError(
  status: number,
  fallbackMessage: string,
  payload?: Record<string, unknown> | null,
): string {
  const raw = (
    (typeof payload?.message === 'string' && payload.message.trim())
    || (typeof payload?.error === 'string' && payload.error.trim())
    || `${fallbackMessage} (${status})`
  )
  if (/deckdocument/i.test(raw)) {
    return '演示文稿预览已过期，正在尝试恢复…'
  }
  return raw
}

export async function rebuildSlidevPreview(input: {
  deckId: string
  workspacePath?: string
  title?: string
  slidevMarkdown: string
}): Promise<{
  success: boolean
  previewUrl?: string
  slidevAppUrl?: string
  slidevPreviewMode?: 'official' | 'fallback'
  error?: string
}> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  Object.assign(headers, authHeaders())
  try {
    const response = await fetch(`/api/ppt/decks/${encodeURIComponent(input.deckId)}/slidev-rebuild-preview`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        slidevMarkdown: input.slidevMarkdown,
        workspacePath: input.workspacePath,
        title: input.title,
      }),
    })
    const body = await response.json().catch(() => ({ error: `HTTP ${response.status}` })) as Record<string, unknown>
    if (!response.ok || body.success === false) {
      return {
        success: false,
        error: extractResponseError(response.status, '预览恢复失败', body),
      }
    }
    return {
      success: true,
      previewUrl: pickString(body.previewUrl),
      slidevAppUrl: pickString(body.slidevAppUrl),
      slidevPreviewMode: body.slidevPreviewMode === 'official' ? 'official' : 'fallback',
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '预览恢复失败',
    }
  }
}

export interface ProtectedTextFetchResult {
  success: boolean
  status: number
  contentType: string
  text?: string
  error?: string
  json?: Record<string, unknown>
}

export async function fetchProtectedTextResource(url: string): Promise<ProtectedTextFetchResult> {
  const response = await fetch(resolveWebApiUrl(url), { headers: authHeaders() })
  const contentType = (response.headers.get('content-type') || '').toLowerCase()
  const isJson = contentType.includes('application/json')

  if (isJson) {
    const payload = await response.json().catch(() => null) as Record<string, unknown> | null
    return {
      success: false,
      status: response.status,
      contentType,
      error: extractResponseError(response.status, '服务器返回了 JSON 响应，无法作为预览内容', payload),
      json: payload || undefined,
    }
  }

  const text = await response.text().catch(() => '')
  if (!response.ok) {
    return {
      success: false,
      status: response.status,
      contentType,
      error: text.trim() || `资源加载失败 (${response.status})`,
      text,
    }
  }

  return {
    success: true,
    status: response.status,
    contentType,
    text,
  }
}

export async function downloadProtectedResource(url: string, filename: string): Promise<void> {
  const response = await fetch(resolveWebApiUrl(url), { headers: authHeaders() })
  const contentType = (response.headers.get('content-type') || '').toLowerCase()
  const isJson = contentType.includes('application/json')

  if (isJson) {
    const payload = await response.json().catch(() => null) as Record<string, unknown> | null
    throw new Error(extractResponseError(response.status, '下载失败', payload))
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(text.trim() || `下载失败 (${response.status})`)
  }

  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000)
}

export function createHtmlBlobUrl(html: string): string {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  return URL.createObjectURL(blob)
}

export function revokeHtmlBlobUrl(url: string): void {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}

export async function openProtectedHtmlPreview(url: string): Promise<void> {
  const result = await fetchProtectedTextResource(url)
  if (!result.success || !result.text) {
    throw new Error(result.error || '预览加载失败')
  }
  if (!result.contentType.includes('text/html')) {
    throw new Error(`预览接口返回了非 HTML 内容：${result.contentType || 'unknown'}`)
  }

  const objectUrl = createHtmlBlobUrl(result.text)
  const opened = window.open(objectUrl, '_blank', 'noopener,noreferrer')
  if (!opened) {
    URL.revokeObjectURL(objectUrl)
    throw new Error('浏览器拦截了预览窗口，请允许弹窗后重试。')
  }
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
}

function pickObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function pickString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

export interface WebPptPreviewImagePayload {
  slideId?: string
  index: number
  previewImageUrl?: string
  previewHtmlUrl?: string
}

export interface WebPptDeckPayload {
  engine?: 'builtin' | 'minimax_pptx_generator' | 'slidev'
  outputMode?: 'editable_pptx' | 'web_deck'
  deckId?: string
  deck?: Record<string, unknown>
  slides: Array<Record<string, unknown>>
  previewImages: WebPptPreviewImagePayload[]
  artifact?: SkillResult['artifact']
  exportUrl?: string
  previewUrl?: string
  slidevMarkdown?: string
  htmlArtifactId?: string
  fallbackFrom?: 'minimax_pptx_generator'
  fallbackReason?: string
  diagnostics?: Record<string, unknown>
  tokenUsed?: boolean
  message?: string
}

function parsePreviewImages(value: unknown): WebPptPreviewImagePayload[] {
  if (!Array.isArray(value)) return []
  return value.reduce<WebPptPreviewImagePayload[]>((acc, entry, index) => {
    const raw = pickObject(entry)
    if (!raw) return acc
    const previewImageUrl = pickString(raw.previewImageUrl)
    const previewHtmlUrl = pickString(raw.previewHtmlUrl)
    if (!previewImageUrl && !previewHtmlUrl) return acc
    const next: WebPptPreviewImagePayload = {
      index: typeof raw.index === 'number' ? raw.index : index,
    }
    const slideId = pickString(raw.slideId)
    if (slideId) next.slideId = slideId
    if (previewImageUrl) next.previewImageUrl = previewImageUrl
    if (previewHtmlUrl) next.previewHtmlUrl = previewHtmlUrl
    acc.push(next)
    return acc
  }, [])
}

export function parseWebPptDeckPayload(value: unknown): WebPptDeckPayload {
  const raw = pickObject(value) || {}
  const deck = pickObject(raw.deck) || undefined
  const deckSlides = Array.isArray(deck?.slides)
    ? deck.slides.filter((slide): slide is Record<string, unknown> => Boolean(pickObject(slide)))
    : []
  const directSlides = Array.isArray(raw.slides)
    ? raw.slides.filter((slide): slide is Record<string, unknown> => Boolean(pickObject(slide)))
    : []
  const engineRaw = raw.engine
  const engine: WebPptDeckPayload['engine'] =
    engineRaw === 'minimax_pptx_generator' ? 'minimax_pptx_generator'
    : engineRaw === 'slidev' ? 'slidev'
    : engineRaw === 'builtin' ? 'builtin'
    : undefined
  const outputModeRaw = raw.outputMode
  const outputMode: WebPptDeckPayload['outputMode'] =
    outputModeRaw === 'editable_pptx' ? 'editable_pptx'
    : outputModeRaw === 'web_deck' ? 'web_deck'
    : engine === 'slidev' ? 'web_deck'
    : undefined
  return {
    engine,
    outputMode,
    deckId: pickString(raw.deckId) || pickString(deck?.deckId),
    deck,
    slides: directSlides.length > 0 ? directSlides : deckSlides,
    previewImages: parsePreviewImages(raw.previewImages ?? deck?.previewImages),
    artifact: pickObject(raw.artifact) ? raw.artifact as SkillResult['artifact'] : undefined,
    exportUrl: pickString(raw.exportUrl),
    previewUrl: pickString(raw.previewUrl),
    slidevMarkdown: pickString(raw.slidevMarkdown),
    htmlArtifactId: pickString(raw.htmlArtifactId),
    fallbackFrom: raw.fallbackFrom === 'minimax_pptx_generator' ? 'minimax_pptx_generator' : undefined,
    fallbackReason: pickString(raw.fallbackReason),
    diagnostics: pickObject(raw.diagnostics) || undefined,
    tokenUsed: typeof raw.tokenUsed === 'boolean' ? raw.tokenUsed : undefined,
    message: pickString(raw.message),
  }
}

export type WebPptCreateResult = Omit<SkillResult, 'data'> & {
  data?: WebPptDeckPayload
}

function validateCompletedCreatePayload(payload: WebPptDeckPayload | undefined, fallbackArtifact?: SkillResult['artifact']): string | null {
  if (!payload) return 'PPT 任务已完成，但缺少结果数据。'
  if (!payload.deckId) return 'PPT 任务已完成，但缺少 deckId。'
  const deckSlides = Array.isArray(payload.deck?.slides) ? payload.deck.slides : []
  const directSlides = Array.isArray(payload.slides) ? payload.slides : []
  const slideCount = deckSlides.length > 0 ? deckSlides.length : directSlides.length
  if (payload.engine === 'slidev') {
    if (slideCount === 0 && !payload.slidevMarkdown?.trim()) {
      return 'PPT 任务已完成，但缺少 Slidev Markdown 或 slides。'
    }
  } else if (slideCount === 0) {
    return 'PPT 任务已完成，但缺少有效的 deck/slides。'
  }
  const artifactId = payload.artifact?.id || fallbackArtifact?.id
  if (!artifactId) return 'PPT 任务已完成，但缺少 artifact。'
  if (!payload.exportUrl) return 'PPT 任务已完成，但缺少 exportUrl。'
  // Slidev engine: previewImages not required (Markdown/HTML output, no PPTX preview images)
  if (payload.engine !== 'slidev') {
    if (!Array.isArray(payload.previewImages) || payload.previewImages.length === 0) {
      return 'PPT 任务已完成，但缺少 previewImages。'
    }
  }
  return null
}

export interface WebPptTaskProgressUpdate {
  taskId: string
  status: string
  progress: number
  message: string
  data?: WebPptDeckPayload
}

export async function runWebPptxCreate(input: {
  workspacePath: string
  title: string
  prompt: string
  slideCount?: number
  themeId?: string
  templateId?: string
  language?: 'zh-CN' | 'en-US'
  engine?: 'minimax_pptx_generator' | 'slidev' | 'builtin'
  outputMode?: 'editable_pptx' | 'web_deck'
  onProgress?: (update: WebPptTaskProgressUpdate) => void
}): Promise<WebPptCreateResult> {
  const POLL_INTERVAL_MS = DEFAULT_TASK_POLL_INTERVAL_MS
  const MAX_POLL_ATTEMPTS = Math.ceil(TASK_TIMEOUTS.ppt / POLL_INTERVAL_MS)
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  Object.assign(headers, authHeaders())

  try {
    console.log('[ppt-web] start request', {
      title: input.title.trim() || '演示文稿',
      workspacePath: input.workspacePath,
      promptLength: input.prompt.trim().length,
      templateId: input.templateId ?? null,
    })

    const startResp = await fetch('/api/ppt/decks/start', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        workspacePath: input.workspacePath,
        title: input.title.trim() || '演示文稿',
        prompt: input.prompt.trim() || input.title,
        slideCount: input.slideCount,
        themeId: input.themeId,
        templateId: input.templateId,
        language: input.language,
        source: 'topic',
        engine: input.engine,
        outputMode: input.outputMode,
      }),
    })
    const startBody = await startResp.json().catch(() => ({ error: `HTTP ${startResp.status}` })) as {
      success?: boolean
      taskId?: string
      error?: string
      message?: string
    }
    if (!startResp.ok || !startBody.success || !startBody.taskId) {
      const message = startBody.error || startBody.message || `PPT 任务启动失败 (${startResp.status})`
      console.error('[ppt-web] error', { stage: 'start', status: startResp.status, message })
      return { success: false, error: message }
    }

    console.log('[ppt-web] task created', { taskId: startBody.taskId })

    for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
      const pollResp = await fetch(`/api/ppt/decks/tasks/${startBody.taskId}`, { headers })
      const pollBody = await pollResp.json().catch(() => ({ error: `HTTP ${pollResp.status}` })) as {
        success?: boolean
        status?: string
        progress?: number
        message?: string
        error?: string
      result?: {
        engine?: 'builtin' | 'minimax_pptx_generator' | 'slidev'
        outputMode?: 'editable_pptx' | 'web_deck'
        deckId?: string
        deck?: unknown
        slides?: unknown
        previewImages?: unknown
        artifact?: SkillResult['artifact']
        exportUrl?: string
        previewUrl?: string
        slidevMarkdown?: string
        htmlArtifactId?: string
        fallbackFrom?: 'minimax_pptx_generator'
        fallbackReason?: string
        tokenUsed?: boolean
        message?: string
        diagnostics?: unknown
      }
    }
      console.log('[ppt-web] polling task', {
        taskId: startBody.taskId,
        attempt: i + 1,
        status: pollBody.status ?? `http-${pollResp.status}`,
        progress: pollBody.progress ?? null,
      })
      if (pollBody.status === 'running') {
        const partialPayload = pollBody.result ? parseWebPptDeckPayload(pollBody.result) : null
        input.onProgress?.({
          taskId: startBody.taskId,
          status: pollBody.status,
          progress: pollBody.progress ?? 0,
          message: pollBody.message || '正在生成…',
          data: partialPayload?.deckId ? partialPayload : undefined,
        })
      }
      if (!pollResp.ok || !pollBody.success) {
        const message = pollBody.error || pollBody.message || `PPT 任务查询失败 (${pollResp.status})`
        console.error('[ppt-web] error', { stage: 'poll', taskId: startBody.taskId, status: pollResp.status, message })
        return { success: false, taskId: startBody.taskId, error: message }
      }
      if (pollBody.error && pollBody.status !== 'completed') {
        const message = pollBody.error || pollBody.message || 'PPT 任务失败'
        console.error('[ppt-web] error', { stage: 'task', taskId: startBody.taskId, status: pollBody.status, message })
        return { success: false, taskId: startBody.taskId, error: message }
      }
      if (pollBody.status === 'failed') {
        const message = pollBody.error || pollBody.message || 'PPT 生成失败'
        console.error('[ppt-web] error', { stage: 'task', taskId: startBody.taskId, status: pollBody.status, message })
        return { success: false, taskId: startBody.taskId, error: message }
      }
      if (pollBody.status === 'cancelled') {
        const message = pollBody.message || 'PPT 任务已取消'
        console.error('[ppt-web] error', { stage: 'task', taskId: startBody.taskId, status: pollBody.status, message })
        return { success: false, taskId: startBody.taskId, status: 'cancelled', error: message }
      }
      if (pollBody.status === 'completed') {
        const rawResult = pollBody.result
        const slideCount = Array.isArray((rawResult?.deck as { slides?: unknown[] } | undefined)?.slides)
          ? ((rawResult?.deck as { slides: unknown[] }).slides.length)
          : 0
        const payload = parseWebPptDeckPayload(rawResult)
        const validationError = validateCompletedCreatePayload(payload, rawResult?.artifact)
        if (validationError) {
          console.error('[ppt-web] error', {
            stage: 'completed-invalid',
            taskId: startBody.taskId,
            deckId: rawResult?.deckId ?? null,
            message: validationError,
          })
          return { success: false, taskId: startBody.taskId, error: validationError }
        }
        console.log('[ppt-web] task completed', {
          taskId: startBody.taskId,
          deckId: payload.deckId ?? null,
          artifactId: (payload.artifact || rawResult?.artifact)?.id ?? null,
          previewImagesCount: payload.previewImages.length,
        })
        console.log('[ppt-web] deck slides count', slideCount)
        return {
          success: true,
          taskId: startBody.taskId,
          status: 'completed',
          artifact: payload.artifact || rawResult?.artifact,
          data: payload,
        }
      }
    }

    const message = `PPT 任务超时：${Math.round((MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS) / 1000)} 秒内未完成。触发了前端轮询超时，请稍后重试。`
    console.error('[ppt-web] error', { stage: 'timeout', message })
    return { success: false, taskId: startBody.taskId, error: message }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'PPT 生成失败'
    console.error('[ppt-web] error', { stage: 'exception', message })
    return { success: false, error: message }
  }
}

export interface WebPptSlideEditResult {
  success: boolean
  engine?: 'builtin' | 'minimax_pptx_generator' | 'slidev'
  outputMode?: 'editable_pptx' | 'web_deck'
  skillId?: string
  deckId?: string
  slideId?: string
  deck?: Record<string, unknown>
  slides?: Array<Record<string, unknown>>
  previewImages?: WebPptPreviewImagePayload[]
  updatedSlide?: Record<string, unknown>
  artifact?: SkillResult['artifact']
  exportUrl?: string
  previewUrl?: string
  slidevMarkdown?: string
  htmlArtifactId?: string
  changedSlideIds?: string[]
  unchangedSlideIds?: string[]
  message?: string
  error?: string
}

export async function editWebPptSlide(input: {
  deckId: string
  slideId: string
  instruction: string
  currentSlide: Record<string, unknown>
  deckContext?: {
    title?: string
    slideCount?: number
    nearbySlides?: Array<Record<string, unknown>>
  }
  engine?: 'builtin' | 'minimax_pptx_generator' | 'slidev'
  allowFallback?: boolean
}): Promise<WebPptSlideEditResult> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  Object.assign(headers, authHeaders())

  try {
    const response = await fetch(`/api/ppt/decks/${encodeURIComponent(input.deckId)}/slides/${encodeURIComponent(input.slideId)}/edit`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        instruction: input.instruction,
        currentSlide: input.currentSlide,
        deckContext: input.deckContext,
        engine: input.engine ?? 'minimax_pptx_generator',
        allowFallback: input.allowFallback ?? false,
      }),
    })
    const body = await response.json().catch(() => ({ error: `HTTP ${response.status}` })) as WebPptSlideEditResult
    if (!response.ok || !body.success) {
      const message = body.error || body.message || `当前页修改失败 (${response.status})`
      console.error('[ppt-web] error', { stage: 'slide-edit', deckId: input.deckId, slideId: input.slideId, message })
      return { success: false, error: message }
    }
    return {
      ...body,
      skillId: pickString(body.skillId),
      deck: pickObject(body.deck) || undefined,
      slides: Array.isArray(body.slides)
        ? body.slides.filter((slide): slide is Record<string, unknown> => Boolean(pickObject(slide)))
        : undefined,
      previewImages: parsePreviewImages(body.previewImages),
      changedSlideIds: Array.isArray(body.changedSlideIds)
        ? body.changedSlideIds.map((item) => pickString(item)).filter((item): item is string => Boolean(item))
        : undefined,
      unchangedSlideIds: Array.isArray(body.unchangedSlideIds)
        ? body.unchangedSlideIds.map((item) => pickString(item)).filter((item): item is string => Boolean(item))
        : undefined,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '当前页修改失败'
    console.error('[ppt-web] error', { stage: 'slide-edit', deckId: input.deckId, slideId: input.slideId, message })
    return { success: false, error: message }
  }
}

export interface WebPptDeckExportResult {
  success: boolean
  engine?: 'builtin' | 'minimax_pptx_generator' | 'slidev'
  outputMode?: 'editable_pptx' | 'web_deck'
  deckId?: string
  artifact?: SkillResult['artifact']
  exportUrl?: string
  previewUrl?: string
  slidevMarkdown?: string
  htmlArtifactId?: string
  format?: string
  deck?: Record<string, unknown>
  slides?: Array<Record<string, unknown>>
  previewImages?: WebPptPreviewImagePayload[]
  message?: string
  error?: string
}

export async function exportWebPptDeck(input: {
  deckId: string
  engine?: 'builtin' | 'minimax_pptx_generator' | 'slidev'
  format?: 'pptx' | 'md' | 'html' | 'pdf' | 'png'
}): Promise<WebPptDeckExportResult> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  Object.assign(headers, authHeaders())

  try {
    const response = await fetch(`/api/ppt/decks/${encodeURIComponent(input.deckId)}/export`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ engine: input.engine, format: input.format }),
    })
    const body = await response.json().catch(() => ({ error: `HTTP ${response.status}` })) as WebPptDeckExportResult
    if (!response.ok || !body.success) {
      const message = body.error || body.message || `PPT 导出失败 (${response.status})`
      console.error('[ppt-web] error', { stage: 'export', deckId: input.deckId, message })
      return { success: false, error: message }
    }
    const payload = parseWebPptDeckPayload(body)
    return {
      success: true,
      engine: payload.engine,
      outputMode: payload.outputMode,
      deckId: payload.deckId,
      artifact: payload.artifact,
      exportUrl: payload.exportUrl,
      previewUrl: payload.previewUrl,
      slidevMarkdown: payload.slidevMarkdown,
      htmlArtifactId: payload.htmlArtifactId,
      format: body.format,
      deck: payload.deck,
      slides: payload.slides,
      previewImages: payload.previewImages,
      message: body.message || payload.message,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'PPT 导出失败'
    console.error('[ppt-web] error', { stage: 'export', deckId: input.deckId, message })
    return { success: false, error: message }
  }
}

export interface WebPptDeckRetemplateResult extends WebPptDeckExportResult {
  tokenUsed?: boolean
}

export async function retemplateWebPptDeck(input: {
  deckId: string
  templateId: string
}): Promise<WebPptDeckRetemplateResult> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  Object.assign(headers, authHeaders())

  try {
    const response = await fetch(`/api/ppt/decks/${encodeURIComponent(input.deckId)}/retemplate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ templateId: input.templateId }),
    })
    const body = await response.json().catch(() => ({ error: `HTTP ${response.status}` })) as WebPptDeckRetemplateResult
    if (!response.ok || !body.success) {
      const message = body.error || body.message || `模板切换失败 (${response.status})`
      console.error('[ppt-web] error', { stage: 'retemplate', deckId: input.deckId, templateId: input.templateId, message })
      return { success: false, error: message }
    }
    const payload = parseWebPptDeckPayload(body)
    return {
      success: true,
      engine: payload.engine,
      deckId: payload.deckId,
      artifact: payload.artifact,
      exportUrl: payload.exportUrl,
      deck: payload.deck,
      slides: payload.slides,
      previewImages: payload.previewImages,
      tokenUsed: typeof body.tokenUsed === 'boolean' ? body.tokenUsed : payload.tokenUsed,
      message: body.message || payload.message,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '模板切换失败'
    console.error('[ppt-web] error', { stage: 'retemplate', deckId: input.deckId, templateId: input.templateId, message })
    return { success: false, error: message }
  }
}

export async function runWebPptxCreateViaSkill(input: {
  workspacePath: string
  title: string
  prompt: string
  templateId?: string
}): Promise<SkillResult> {
  const { platformApi } = await import('../../../platform')
  return platformApi.skills.run('web.pptx.create', {
    prompt: input.prompt.trim() || input.title,
    workspacePath: input.workspacePath,
    params: {
      title: input.title.trim() || '演示文稿',
      templateId: input.templateId,
    },
  })
}
