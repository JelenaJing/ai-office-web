import { resolveWebApiUrl } from '../../../runtime/apiBase'

export type HumanizeInputMode = 'text' | 'document' | 'file'
export type HumanizeStrength = 'deep' | 'quick'
export type HumanizeLanguage = 'zh-CN' | 'en-US' | 'auto'

export interface HumanizeJobOptions {
  strength: HumanizeStrength
  tone: 'natural'
  preserveMeaning: boolean
  preserveTerms: string[]
  language: HumanizeLanguage
}

export interface HumanizeJobApiResponse {
  success: boolean
  status: 'queued' | 'running' | 'succeeded' | 'failed'
  jobId: string
  source?: string | null
  skillSource?: string | null
  channel?: string | null
  usedFallback?: boolean
  repaired?: boolean
  repairReason?: string | null
  fallbackReason?: string | null
  originalText?: string
  humanizedText?: string
  error?: string | null
  debugPath?: string | null
  opencodeJobDir?: string
  originalLength?: number
  humanizedLength?: number
  changeRatio?: number
  detectedLanguage?: string | null
  outputLanguage?: string | null
  result?: {
    type: 'humanized_text'
    text: string
    summary?: string[]
    warnings?: string[]
    skillSource?: string | null
  } | null
}

function authHeaders(): Record<string, string> {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('aios_token') : null
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

function jsonHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...authHeaders(),
  }
}

async function humanizeRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(resolveWebApiUrl(path), {
    ...init,
    headers: { ...jsonHeaders(), ...(init?.headers as Record<string, string> | undefined) },
  })
  const data = (await res.json()) as T & { success?: boolean; error?: string }
  if (!res.ok || data.success === false) {
    throw new Error((data as { error?: string }).error || `请求失败 (${res.status})`)
  }
  return data
}

const DEFAULT_OPTIONS: HumanizeJobOptions = {
  strength: 'deep',
  tone: 'natural',
  preserveMeaning: true,
  preserveTerms: [],
  language: 'auto',
}

export interface ExtractHumanizeFileResponse {
  success: boolean
  filename?: string
  fileType?: string
  text?: string
  markdown?: string
  warnings?: string[]
  error?: string
}

function mapDocxExtractError(message: string): string {
  if (message.includes('MarkItDown') || message.includes('解析能力未安装')) {
    return 'Word 解析能力未安装'
  }
  return 'Word 解析失败，请检查文件格式或稍后重试。'
}

/** 上传 .docx 并调用服务端 MarkItDown 解析（.txt/.md 请在前端直接读取）。 */
export async function extractHumanizeUploadFile(file: File): Promise<{
  text: string
  markdown: string
  warnings: string[]
}> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(resolveWebApiUrl('/api/document-studio/humanize/extract-file'), {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  })
  const data = (await res.json()) as ExtractHumanizeFileResponse
  if (!res.ok || data.success === false) {
    const raw = data.error || `文件解析失败 (${res.status})`
    throw new Error(file.name.toLowerCase().endsWith('.docx') ? mapDocxExtractError(raw) : raw)
  }
  const text = String(data.text || data.markdown || '').trim()
  const markdown = String(data.markdown || data.text || '').trim()
  if (!text) throw new Error('未能从文件中提取正文')
  return { text, markdown, warnings: data.warnings ?? [] }
}

export async function createHumanizeJob(body: {
  inputMode: HumanizeInputMode
  text?: string
  documentId?: string
  options?: Partial<HumanizeJobOptions>
}): Promise<HumanizeJobApiResponse> {
  return humanizeRequest<HumanizeJobApiResponse>('/api/document-studio/humanize/jobs', {
    method: 'POST',
    body: JSON.stringify({
      ...body,
      options: { ...DEFAULT_OPTIONS, ...body.options },
    }),
  })
}

export async function fetchHumanizeJob(jobId: string): Promise<HumanizeJobApiResponse> {
  return humanizeRequest<HumanizeJobApiResponse>(
    `/api/document-studio/humanize/jobs/${encodeURIComponent(jobId)}`,
  )
}

export async function pollHumanizeJobUntilDone(
  jobId: string,
  options?: { timeoutMs?: number; intervalMs?: number; onProgress?: (job: HumanizeJobApiResponse) => void },
): Promise<HumanizeJobApiResponse> {
  const timeoutMs = options?.timeoutMs ?? 180_000
  const intervalMs = options?.intervalMs ?? 1500
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const job = await fetchHumanizeJob(jobId)
    options?.onProgress?.(job)
    if (job.status === 'succeeded' || job.status === 'failed') return job
    await new Promise(r => setTimeout(r, intervalMs))
  }
  throw new Error('改写任务超时，请稍后重试')
}

export async function downloadHumanizeResultDocx(text: string, title = '改写文稿'): Promise<void> {
  const res = await fetch(resolveWebApiUrl('/api/document-studio/humanize/export-docx'), {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ text, title }),
  })
  if (!res.ok) {
    let message = `导出 Word 失败 (${res.status})`
    try {
      const data = (await res.json()) as { error?: string }
      if (data.error) message = data.error
    } catch {
      // ignore
    }
    throw new Error(message)
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${title.replace(/[\\/:*?"<>|]/g, '_').slice(0, 60)}.docx`
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadTextFile(filename: string, content: string, mime = 'text/plain;charset=utf-8'): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** 开发环境：在控制台记录内部诊断字段 */
export function logHumanizeJobDebug(job: HumanizeJobApiResponse): void {
  if (import.meta.env?.PROD) return
  console.info('[AI 改写][debug]', {
    jobId: job.jobId,
    source: job.source,
    skillSource: job.skillSource,
    usedFallback: job.usedFallback,
    repaired: job.repaired,
    opencodeJobDir: job.opencodeJobDir,
  })
}
