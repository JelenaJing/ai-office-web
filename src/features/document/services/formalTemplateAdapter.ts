import { isWebShim } from '../../../platform'

function readAuthToken(): string | null {
  try {
    return (
      window.localStorage.getItem('aios_auth_token')
      ?? window.localStorage.getItem('aios_itoken')
      ?? window.localStorage.getItem('ai_office_internal_token')
      ?? null
    )
  } catch {
    return null
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export interface WebFieldSchema {
  fieldId: string
  label: string
  required: boolean
  dataType: string
  hint?: string
  occurrences: number
}

export interface FormalTemplatePreset {
  id: string
  label: string
  description: string
  category: string
  templateKind: string
  runtimeKind: string
  runtimeLabel: string
  supported: boolean
  unavailableReason?: string
}

export interface FormalTemplateAnalyzeResult {
  presetId: string
  presetLabel: string
  templateKind: string
  runtimeKind: string
  supported: boolean
  unavailableReason?: string
  templateText: string
  fields: WebFieldSchema[]
  defaultSections: string[]
  diagnostics: { chain: string; steps: string[] }
}

export interface FormalTemplateGenerateResult {
  html: string
  markdown: string
  title: string
  taskId?: string
  presetId: string
  presetLabel: string
  templateKind: string
  runtimeKind: string
  resolvedFields: Record<string, string>
  message?: string
  diagnostics: {
    chain: 'web-formal-template-schema-first' | 'web-template-document-rewrite'
    steps: string[]
  }
}

export interface FormalTemplateProgress {
  step: string
  message: string
}

export interface RunFormalTemplateGenerateInput {
  instruction: string
  presetId?: string
  customTemplateText?: string
  fieldOverrides?: Record<string, string>
  language?: 'zh' | 'en'
  workspacePath?: string
  extraContext?: string
  onStatus?: (message: string) => void
  onProgress?: (progress: FormalTemplateProgress) => void
  onContent?: (payload: { markdown?: string; html?: string }) => void
  signal?: AbortSignal
}

export async function listFormalTemplatePresets(): Promise<FormalTemplatePreset[]> {
  const token = readAuthToken()
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch('/api/document/formal-template/presets', { headers })
  const data = await response.json()
  if (!response.ok || !data.success) {
    throw new Error(String(data.error || `获取正式模板列表失败 (${response.status})`))
  }
  return Array.isArray(data.presets) ? data.presets as FormalTemplatePreset[] : []
}

export async function analyzeFormalTemplate(input: {
  presetId?: string
  customTemplateText?: string
  instruction?: string
}): Promise<FormalTemplateAnalyzeResult> {
  const token = readAuthToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch('/api/document/formal-template/analyze', {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  })
  const data = await response.json()
  if (!response.ok || !data.success) {
    throw new Error(String(data.error || `分析失败 (${response.status})`))
  }
  return data as FormalTemplateAnalyzeResult
}

export async function runFormalTemplateGenerate(
  input: RunFormalTemplateGenerateInput,
): Promise<FormalTemplateGenerateResult> {
  if (
    typeof window !== 'undefined'
    && typeof (window as { electronAPI?: unknown }).electronAPI !== 'undefined'
    && !isWebShim()
  ) {
    throw new Error('Electron 正式模板链路请继续通过 FormalTemplatePanel 调用。')
  }

  const token = readAuthToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  input.onStatus?.('正在启动正式模板链路…')

  const startResponse = await fetch('/api/document/formal-template/start', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      presetId: input.presetId,
      customTemplateText: input.customTemplateText,
      instruction: input.instruction,
      language: input.language ?? 'zh',
      fieldOverrides: input.fieldOverrides,
      extraContext: input.extraContext,
      workspacePath: input.workspacePath,
    }),
    signal: input.signal,
  })

  const startData = await startResponse.json()
  if (!startResponse.ok || !startData.success) {
    throw new Error(String(startData.error || `正式模板启动失败 (${startResponse.status})`))
  }

  const taskId = String(startData.taskId || '').trim()
  if (!taskId) {
    throw new Error('正式模板启动失败：服务端未返回 taskId')
  }

  const cancelTask = async () => {
    try {
      await fetch(`/api/document/formal-template/tasks/${taskId}/cancel`, {
        method: 'POST',
        headers,
      })
    } catch {
      // no-op
    }
  }

  if (input.signal?.aborted) {
    await cancelTask()
    throw new Error('正式模板任务已取消')
  }

  const abortHandler = () => {
    void cancelTask()
  }
  input.signal?.addEventListener('abort', abortHandler, { once: true })

  try {
    while (true) {
      const pollResponse = await fetch(`/api/document/formal-template/tasks/${taskId}`, {
        headers,
        signal: input.signal,
      })
      const pollData = await pollResponse.json()

      if (!pollResponse.ok || !pollData.success) {
        throw new Error(String(pollData.error || `正式模板状态查询失败 (${pollResponse.status})`))
      }

      const message = String(pollData.message || '正在生成正式模板…')
      const step = String(pollData.step || '')
      input.onStatus?.(message)
      input.onProgress?.({ step, message })
      if (pollData.partialMarkdown || pollData.partialHtml) {
        input.onContent?.({
          markdown: typeof pollData.partialMarkdown === 'string' ? pollData.partialMarkdown : undefined,
          html: typeof pollData.partialHtml === 'string' ? pollData.partialHtml : undefined,
        })
      }

      if (pollData.status === 'completed') {
        const result = pollData.result as Record<string, unknown> | undefined
        if (!result) {
          throw new Error('正式模板任务已完成，但服务端未返回结果')
        }
        return {
          html: String(result.html ?? ''),
          markdown: String(result.markdown ?? ''),
          title: String(result.title ?? '正式模板文稿'),
          taskId,
          presetId: String(result.presetId ?? input.presetId ?? 'unknown'),
          presetLabel: String(result.presetLabel ?? '正式模板'),
          templateKind: String(result.templateKind ?? 'generic'),
          runtimeKind: String(result.runtimeKind ?? 'template-document-rewrite'),
          resolvedFields: (result.resolvedFields as Record<string, string>) ?? {},
          message: `${String(result.presetLabel ?? '正式模板')}链路已完成`,
          diagnostics: (result.diagnostics as FormalTemplateGenerateResult['diagnostics']) ?? {
            chain: 'web-template-document-rewrite',
            steps: [],
          },
        }
      }

      if (pollData.status === 'failed') {
        throw new Error(String(pollData.error || pollData.message || '正式模板任务失败'))
      }

      if (pollData.status === 'cancelled') {
        throw new Error(String(pollData.message || '正式模板任务已取消'))
      }

      await sleep(1500)
    }
  } finally {
    input.signal?.removeEventListener('abort', abortHandler)
  }
}
