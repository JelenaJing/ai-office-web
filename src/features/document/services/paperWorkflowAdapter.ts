import { isWebShim } from '../../../platform'
import { markdownToHtml } from '../../../utils/markdownToHtml'

export type PaperWorkflowPaperType = 'research' | 'review' | 'thesis_research'

export type PaperWorkflowMode =
  | 'full'
  | 'outline'
  | 'abstract'
  | 'introduction'
  | 'methodology'
  | 'conclusion'
  | 'trajectory'
  | 'representative-studies'
  | 'debates'
  | 'future-directions'

export interface PaperWorkflowProgress {
  step: string
  message: string
}

export interface RunPaperWorkflowGenerateInput {
  topic: string
  paperType: PaperWorkflowPaperType
  language?: 'zh' | 'en'
  workspacePath?: string
  extraContext?: string
  yearFrom?: string
  yearTo?: string
  mode?: PaperWorkflowMode
  onStatus?: (message: string) => void
  onProgress?: (progress: PaperWorkflowProgress) => void
  onContent?: (payload: { markdown?: string; html?: string }) => void
  signal?: AbortSignal
}

export interface PaperWorkflowGenerateResult {
  html: string
  markdown: string
  title?: string
  taskId?: string
  artifact?: unknown
  message?: string
  diagnostics?: {
    chain: 'paper-workflow' | 'paper-workflow-web-adapter'
    steps: string[]
  }
}

function readAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return (
    window.localStorage.getItem('aios_auth_token')
    ?? window.localStorage.getItem('aios_itoken')
    ?? window.localStorage.getItem('ai_office_internal_token')
  )
}

function isDesktopRuntime(): boolean {
  if (typeof window === 'undefined') return false
  const api = (window as unknown as { electronAPI?: { __isWebShim?: boolean; generatePaper?: unknown } }).electronAPI
  return Boolean(api && api.__isWebShim !== true && !isWebShim())
}

function buildPaperModeExtraContext(mode?: PaperWorkflowMode): string {
  switch (mode) {
    case 'outline':
      return '本次仅生成论文大纲，不要输出完整正文。'
    case 'abstract':
      return '本次聚焦生成标题、摘要与关键词。'
    case 'introduction':
      return '本次聚焦生成引言相关内容。'
    case 'methodology':
      return '本次聚焦生成研究方法 / 分析框架章节。'
    case 'conclusion':
      return '本次聚焦生成结论章节。'
    case 'trajectory':
      return '本次聚焦生成研究脉络章节。'
    case 'representative-studies':
      return '本次聚焦生成代表性研究章节。'
    case 'debates':
      return '本次聚焦生成争议与不足章节。'
    case 'future-directions':
      return '本次聚焦生成未来研究方向章节。'
    default:
      return ''
  }
}

async function runDesktopPaperWorkflow(
  input: RunPaperWorkflowGenerateInput,
): Promise<PaperWorkflowGenerateResult> {
  const paperService = await import('../../../modules/paper/services/PaperService')
  const runtime = (window as unknown as {
    electronAPI?: {
      generatePaper?: unknown
    }
  }).electronAPI

  const steps = ['analyze-topic', 'retrieve-references', 'draft-outline', 'generate-sections', 'normalize-artifact']

  if (typeof runtime?.generatePaper === 'function') {
    let latestMarkdown = ''
    let runtimeError: string | null = null
    input.onStatus?.(input.paperType === 'review' ? '正在启动综述文章链路…' : '正在启动研究文章链路…')
    const result = await paperService.generatePaper(
      {
        topic: input.topic,
        paperType: input.paperType,
        language: input.language ?? 'zh',
        workspacePath: input.workspacePath,
        extraContext: [input.extraContext, buildPaperModeExtraContext(input.mode)].filter(Boolean).join('\n\n') || undefined,
        yearFrom: input.yearFrom,
        yearTo: input.yearTo,
        scope: 'paper',
      },
      {
        onStatus: (_step, message) => {
          input.onStatus?.(message)
          input.onProgress?.({ step: 'paper-runtime', message })
        },
        onContent: (chunk) => {
          latestMarkdown = paperService.resolvePaperText(chunk as Record<string, any>, latestMarkdown)
          input.onContent?.({ markdown: latestMarkdown, html: latestMarkdown ? markdownToHtml(latestMarkdown) : undefined })
        },
        onComplete: (chunk) => {
          latestMarkdown = paperService.resolvePaperText(chunk as Record<string, any>, latestMarkdown)
        },
        onError: (message) => {
          runtimeError = message
        },
      },
      input.signal,
    )

    if (runtimeError) {
      throw new Error(runtimeError)
    }

    const markdown = paperService.resolvePaperText(result as Record<string, any>, latestMarkdown)
    if (!markdown.trim()) {
      throw new Error('研究文章链路未返回正文')
    }

    const html = markdownToHtml(markdown)
    input.onContent?.({ markdown, html })
    return {
      html,
      markdown,
      title: String((result as Record<string, any> | null)?.title || '').trim() || input.topic,
      message: input.paperType === 'review' ? '文献综述链路已完成' : '研究文章链路已完成',
      diagnostics: {
        chain: 'paper-workflow',
        steps,
      },
    }
  }

  input.onStatus?.('正在提交论文任务到兼容链路…')
  const taskId = await paperService.submitTask({
    topic: input.topic,
    paperType: input.paperType,
    language: input.language ?? 'zh',
    workspacePath: input.workspacePath,
    extraContext: [input.extraContext, buildPaperModeExtraContext(input.mode)].filter(Boolean).join('\n\n') || undefined,
    yearFrom: input.yearFrom,
    yearTo: input.yearTo,
    scope: 'paper',
  })
  input.onProgress?.({ step: 'submit-task', message: `论文任务已提交：${taskId}` })

  while (!input.signal?.aborted) {
    const result = await paperService.getTaskResult(taskId)
    if (result.status === 'success' && result.result) {
      const markdown = paperService.resolvePaperText(result.result as Record<string, any>, '')
      if (!markdown.trim()) {
        throw new Error('兼容论文链路未返回正文')
      }
      const html = markdownToHtml(markdown)
      input.onContent?.({ markdown, html })
      return {
        html,
        markdown,
        title: String((result.result as Record<string, any>)?.title || '').trim() || input.topic,
        taskId,
        message: input.paperType === 'review' ? '文献综述链路已完成' : '研究文章链路已完成',
        diagnostics: {
          chain: 'paper-workflow',
          steps,
        },
      }
    }
    if (result.status === 'failed') {
      throw new Error(String(result.error || '论文任务失败'))
    }
    await new Promise((resolve) => setTimeout(resolve, 1200))
  }

  throw new Error('已停止生成')
}

async function runWebPaperWorkflow(
  input: RunPaperWorkflowGenerateInput,
): Promise<PaperWorkflowGenerateResult> {
  const token = readAuthToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const label = input.paperType === 'review' ? '综述文章' : '研究文章'
  input.onStatus?.(`正在启动${label}链路…`)

  // ── Step 1: start the async task ────────────────────────────────────────────
  const startResp = await fetch('/api/document/paper-workflow/start', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      topic: input.topic,
      paperType: input.paperType,
      language: input.language ?? 'zh',
      extraContext: [input.extraContext, buildPaperModeExtraContext(input.mode)].filter(Boolean).join('\n\n') || undefined,
      yearFrom: input.yearFrom,
      yearTo: input.yearTo,
      mode: input.mode ?? 'full',
    }),
    signal: input.signal,
  })

  const startBody = await startResp.json().catch(() => ({ error: `HTTP ${startResp.status}` })) as
    | { success: boolean; taskId: string; paperType: string; status: string }
    | { error?: string; message?: string }

  if (!startResp.ok || 'error' in startBody) {
    const serverMsg = ('error' in startBody && startBody.error)
      || ('message' in startBody && (startBody as Record<string, unknown>).message)
      || null
    throw new Error(serverMsg ? `论文工作流失败：${serverMsg}` : `论文工作流启动失败 (${startResp.status})`)
  }

  const { taskId } = startBody as { taskId: string }
  input.onProgress?.({
    step: 'paper-workflow',
    message: input.paperType === 'review' ? 'paper workflow / review' : 'paper workflow / research',
  })

  const cancelTask = async () => {
    try {
      await fetch(`/api/document/paper-workflow/tasks/${taskId}/cancel`, {
        method: 'POST',
        headers,
      })
    } catch {
      // no-op
    }
  }

  if (input.signal?.aborted) {
    await cancelTask()
    throw new Error('论文任务已取消')
  }

  const abortHandler = () => {
    void cancelTask()
  }
  input.signal?.addEventListener('abort', abortHandler, { once: true })

  // ── Step 2: poll task status ─────────────────────────────────────────────────
  let lastMessage = ''
  const POLL_INTERVAL_MS = 1500
  const MAX_POLLS = 200 // 200 × 1.5 s = 5 min hard cap

  try {
    for (let i = 0; i < MAX_POLLS; i++) {
      if (input.signal?.aborted) throw new Error('已停止生成')

      await new Promise<void>((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))

      if (input.signal?.aborted) throw new Error('已停止生成')

      const pollResp = await fetch(`/api/document/paper-workflow/tasks/${taskId}`, {
        headers,
        signal: input.signal,
      })

      const pollBody = await pollResp.json().catch(() => ({ error: '轮询失败' })) as {
        success?: boolean
        taskId?: string
        status?: string
        progress?: number
        message?: string
        partialMarkdown?: string
        result?: PaperWorkflowGenerateResult & { success?: boolean }
        error?: string
      }

      if (!pollResp.ok || pollBody.error) {
        throw new Error(`论文工作流失败：${pollBody.error || '轮询失败'}`)
      }

      const { status, message, result, error: taskError } = pollBody

      if (message && message !== lastMessage) {
        input.onStatus?.(message)
        input.onProgress?.({ step: 'task-progress', message })
        lastMessage = message
      }

      if (status === 'failed') {
        throw new Error(`论文工作流失败：${taskError || '未知错误'}`)
      }

      if (status === 'cancelled') {
        throw new Error(String(message || '论文任务已取消'))
      }

      if (status === 'completed' && result) {
        if (!result.html?.trim() || !result.markdown?.trim()) {
          throw new Error('论文工作流未返回正文')
        }
        input.onContent?.({ html: result.html, markdown: result.markdown })
        return {
          html: result.html,
          markdown: result.markdown,
          title: result.title,
          taskId,
          message: input.paperType === 'review' ? '文献综述链路已完成' : '研究文章链路已完成',
          diagnostics: result.diagnostics,
        }
      }
    }

    throw new Error('论文工作流超时：生成时间过长，请重试')
  } finally {
    input.signal?.removeEventListener('abort', abortHandler)
  }
}

export async function runPaperWorkflowGenerate(
  input: RunPaperWorkflowGenerateInput,
): Promise<PaperWorkflowGenerateResult> {
  if (isDesktopRuntime()) {
    return runDesktopPaperWorkflow(input)
  }
  return runWebPaperWorkflow(input)
}
