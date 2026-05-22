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
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) headers.Authorization = `Bearer ${token}`

  input.onStatus?.(input.paperType === 'review' ? '正在启动综述文章链路…' : '正在启动研究文章链路…')
  input.onProgress?.({
    step: 'paper-workflow',
    message: input.paperType === 'review' ? 'paper workflow / review' : 'paper workflow / research',
  })
  input.onProgress?.({
    step: 'draft-outline',
    message: input.paperType === 'review' ? '正在生成综述大纲…' : '正在生成论文大纲…',
  })

  const resp = await fetch('/api/document/paper-workflow/generate', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      topic: input.topic,
      paperType: input.paperType,
      language: input.language ?? 'zh',
      workspacePath: input.workspacePath,
      extraContext: input.extraContext,
      yearFrom: input.yearFrom,
      yearTo: input.yearTo,
      mode: input.mode ?? 'full',
    }),
    signal: input.signal,
  })

  const body = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` })) as
    | (PaperWorkflowGenerateResult & { success?: boolean })
    | { error?: string }

  if (!resp.ok || ('error' in body && body.error)) {
    const serverMsg = ('error' in body && body.error)
      || ('message' in body && (body as Record<string, unknown>).message)
      || null
    throw new Error(serverMsg ? `论文工作流失败：${serverMsg}` : `论文工作流失败 (${resp.status})`)
  }

  const result = body as PaperWorkflowGenerateResult & { success?: boolean }
  if (!result.html?.trim() || !result.markdown?.trim()) {
    throw new Error('论文工作流未返回正文')
  }

  input.onProgress?.({
    step: 'generate-body',
    message: input.paperType === 'review' ? '正在生成综述正文…' : '正在生成论文正文…',
  })
  input.onProgress?.({
    step: 'prepare-references',
    message: '正在整理参考文献占位…',
  })
  input.onContent?.({ html: result.html, markdown: result.markdown })
  return result
}

export async function runPaperWorkflowGenerate(
  input: RunPaperWorkflowGenerateInput,
): Promise<PaperWorkflowGenerateResult> {
  if (isDesktopRuntime()) {
    return runDesktopPaperWorkflow(input)
  }
  return runWebPaperWorkflow(input)
}
