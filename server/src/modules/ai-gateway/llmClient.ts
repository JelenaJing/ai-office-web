/**
 * llmClient.ts — Server-side OpenAI-compatible LLM client.
 * API keys never leave the server.
 */

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LlmInvokeOptions {
  temperature?: number
  maxTokens?: number
}

const DEFAULT_MODEL = process.env.LLM_MODEL?.trim() || 'gpt-4o-mini'
const DEFAULT_TIMEOUT_MS = 60_000

function resolveBaseUrl(): string {
  const raw = process.env.LLM_BASE_URL?.trim()
  if (raw) return raw.replace(/\/$/, '')
  const key = process.env.LLM_API_KEY?.trim()
  if (key) return 'https://api.openai.com/v1'
  return ''
}

export function getLlmModel(): string {
  return DEFAULT_MODEL
}

export function isLlmConfigured(): boolean {
  return Boolean(process.env.LLM_API_KEY?.trim() && resolveBaseUrl())
}

function stripJsonFence(text: string): string {
  const trimmed = text.trim()
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i)
  if (fenced) return fenced[1].trim()
  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1)
  return trimmed
}

function parseJsonContent<T>(raw: string): T {
  const cleaned = stripJsonFence(raw)
  try {
    return JSON.parse(cleaned) as T
  } catch {
    throw new Error('模型返回的内容不是有效 JSON，请重试或检查 LLM 配置。')
  }
}

/**
 * Invoke chat/completions and parse the assistant message as JSON.
 */
export async function invokeLlmJson<T>(
  messages: LlmMessage[],
  options?: LlmInvokeOptions,
): Promise<T> {
  const apiKey = process.env.LLM_API_KEY?.trim()
  const baseUrl = resolveBaseUrl()

  if (!apiKey || !baseUrl) {
    throw new Error('LLM 未配置：请设置 LLM_API_KEY（及可选 LLM_BASE_URL）。')
  }

  const url = `${baseUrl}/chat/completions`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages,
        temperature: options?.temperature ?? 0.4,
        max_tokens: options?.maxTokens ?? 4096,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(
        `LLM 请求失败 (${res.status})${body ? `：${body.slice(0, 200)}` : ''}`,
      )
    }

    const payload = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>
      error?: { message?: string }
    }

    if (payload.error?.message) {
      throw new Error(`LLM 错误：${payload.error.message}`)
    }

    const content = payload.choices?.[0]?.message?.content
    if (!content?.trim()) {
      throw new Error('LLM 返回为空，请重试。')
    }

    return parseJsonContent<T>(content)
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('LLM 请求超时（60 秒），请稍后重试。')
    }
    if (err instanceof Error) throw err
    throw new Error(`LLM 调用异常：${String(err)}`)
  } finally {
    clearTimeout(timer)
  }
}
