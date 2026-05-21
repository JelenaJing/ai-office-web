/**
 * llmClient.ts — Server-side OpenAI-compatible LLM client.
 *
 * Resolves API key / base URL / model from (highest priority first):
 *   LLM_API_KEY, LLM_BASE_URL, LLM_MODEL
 *   → LLM_PROVIDER + provider env keys (QWEN_API_KEY, …)
 *   → build/ai-config.json defaults (llm.active + providers.*)
 *
 * Never reads VITE_* or exposes keys to the frontend.
 */

import fs from 'fs'
import path from 'path'

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LlmInvokeOptions {
  temperature?: number
  maxTokens?: number
}

export type ServerLlmProvider = 'openai' | 'qwen' | 'deepseek' | 'cuhk' | 'custom'

type ConfigOrigin = 'env' | 'ai-config' | 'default'

type ApiKeyOrigin =
  | 'LLM_API_KEY'
  | 'QWEN_API_KEY'
  | 'DEEPSEEK_API_KEY'
  | 'CUHK_API_KEY'
  | 'OPENAI_API_KEY'
  | 'none'

interface AiConfigFile {
  llm: {
    active: string
    providers: Record<
      string,
      {
        defaultModel?: string
        defaultBaseUrl?: string
      }
    >
  }
}

interface ResolvedLlmRuntime {
  provider: ServerLlmProvider
  apiKey: string
  baseUrl: string
  model: string
  origins: {
    provider: ConfigOrigin
    apiKey: ApiKeyOrigin
    baseUrl: ConfigOrigin
    model: ConfigOrigin
  }
}

const AI_CONFIG_PATH = path.resolve(__dirname, '../../../../build/ai-config.json')
const DEFAULT_TIMEOUT_MS = 60_000
const FALLBACK_MODEL = 'gpt-4o-mini'

let cachedAiConfig: AiConfigFile | null = null

function loadAiConfig(): AiConfigFile {
  if (!cachedAiConfig) {
    const raw = fs.readFileSync(AI_CONFIG_PATH, 'utf-8')
    cachedAiConfig = JSON.parse(raw) as AiConfigFile
  }
  return cachedAiConfig
}

function isKnownProvider(id: string): id is ServerLlmProvider {
  return ['openai', 'qwen', 'deepseek', 'cuhk', 'custom'].includes(id)
}

export function resolveProvider(): ServerLlmProvider {
  const aiConfig = loadAiConfig()
  const candidate = process.env.LLM_PROVIDER?.trim() || aiConfig.llm.active || 'openai'
  if (isKnownProvider(candidate)) return candidate
  return 'openai'
}

export function resolveProviderApiKey(provider: ServerLlmProvider): string {
  if (process.env.LLM_API_KEY?.trim()) {
    return process.env.LLM_API_KEY.trim()
  }

  if (provider === 'qwen') return process.env.QWEN_API_KEY?.trim() || ''
  if (provider === 'deepseek') return process.env.DEEPSEEK_API_KEY?.trim() || ''
  if (provider === 'cuhk') return process.env.CUHK_API_KEY?.trim() || ''
  if (provider === 'openai') return process.env.OPENAI_API_KEY?.trim() || ''
  return ''
}

function apiKeyOrigin(provider: ServerLlmProvider): ApiKeyOrigin {
  if (process.env.LLM_API_KEY?.trim()) return 'LLM_API_KEY'
  if (provider === 'qwen' && process.env.QWEN_API_KEY?.trim()) return 'QWEN_API_KEY'
  if (provider === 'deepseek' && process.env.DEEPSEEK_API_KEY?.trim()) return 'DEEPSEEK_API_KEY'
  if (provider === 'cuhk' && process.env.CUHK_API_KEY?.trim()) return 'CUHK_API_KEY'
  if (provider === 'openai' && process.env.OPENAI_API_KEY?.trim()) return 'OPENAI_API_KEY'
  return 'none'
}

export function resolveModel(): string {
  if (process.env.LLM_MODEL?.trim()) return process.env.LLM_MODEL.trim()
  const provider = resolveProvider()
  const aiConfig = loadAiConfig()
  return aiConfig.llm.providers[provider]?.defaultModel?.trim() || FALLBACK_MODEL
}

export function resolveBaseUrl(): string {
  if (process.env.LLM_BASE_URL?.trim()) {
    return process.env.LLM_BASE_URL.trim().replace(/\/$/, '')
  }
  const provider = resolveProvider()
  const aiConfig = loadAiConfig()
  return aiConfig.llm.providers[provider]?.defaultBaseUrl?.trim().replace(/\/$/, '') || ''
}

function resolveRuntime(): ResolvedLlmRuntime {
  const provider = resolveProvider()
  const apiKey = resolveProviderApiKey(provider)
  const baseUrl = resolveBaseUrl()
  const model = resolveModel()

  return {
    provider,
    apiKey,
    baseUrl,
    model,
    origins: {
      provider: process.env.LLM_PROVIDER?.trim() ? 'env' : 'ai-config',
      apiKey: apiKeyOrigin(provider),
      baseUrl: process.env.LLM_BASE_URL?.trim() ? 'env' : baseUrl ? 'ai-config' : 'default',
      model: process.env.LLM_MODEL?.trim() ? 'env' : 'ai-config',
    },
  }
}

function resolveChatCompletionsUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/$/, '')
  if (trimmed.endsWith('/chat/completions')) return trimmed
  return `${trimmed}/chat/completions`
}

function logResolvedConfig(config: ResolvedLlmRuntime): void {
  console.info(
    `[ai-gateway] llm provider=${config.provider} (from ${config.origins.provider}) ` +
      `model=${config.model} (from ${config.origins.model}) ` +
      `baseUrl=${config.baseUrl || '(empty)'} (from ${config.origins.baseUrl}) ` +
      `apiKeySource=${config.origins.apiKey}`,
  )
}

export function getLlmModel(): string {
  return resolveModel()
}

export function isLlmConfigured(): boolean {
  const { apiKey, baseUrl } = resolveRuntime()
  return Boolean(apiKey && baseUrl)
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
  const runtime = resolveRuntime()
  const { apiKey, baseUrl, model, provider } = runtime

  if (!apiKey || !baseUrl) {
    throw new Error(
      `LLM 未配置：请设置 LLM_API_KEY 或 ${provider} 对应的 provider API Key（如 QWEN_API_KEY），` +
        '并确保 build/ai-config.json 中有 defaultBaseUrl。',
    )
  }

  logResolvedConfig(runtime)

  const url = resolveChatCompletionsUrl(baseUrl)
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
        model,
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
