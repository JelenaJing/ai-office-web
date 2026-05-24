export type WebImageProvider = 'nanobanana' | 'openai-image' | 'custom' | 'mock'

export interface WebImageSettings {
  provider: WebImageProvider
  endpoint: string
  model: string
  apiKey: string
  useBuiltinKey: boolean
}

export interface WebImageProviderStatus {
  success: true
  provider: WebImageProvider
  label: string
  model: string
  endpointConfigured: boolean
  keyConfigured: boolean
  configured: boolean
  supportsReferences: boolean
  supportsAspectRatio: boolean
  supportsEventStream: boolean
  error?: string
}

const OPENAI_IMAGES_ENDPOINT = 'https://api.openai.com/v1/images/generations'
const DEFAULT_MODEL = 'nano-banana-fast'

function firstNonEmpty(...values: Array<unknown>): string {
  for (const value of values) {
    const normalized = String(value || '').trim()
    if (normalized) return normalized
  }
  return ''
}

function parseBoolean(value: unknown, fallback: boolean): boolean {
  const normalized = String(value || '').trim().toLowerCase()
  if (!normalized) return fallback
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false
  return fallback
}

function normalizeProvider(value: unknown): WebImageProvider {
  switch (String(value || '').trim().toLowerCase()) {
    case 'openai-image':
      return 'openai-image'
    case 'custom':
      return 'custom'
    case 'mock':
      return 'mock'
    case 'nanobanana':
    default:
      return 'nanobanana'
  }
}

export function getWebImageProviderLabel(provider: WebImageProvider): string {
  switch (provider) {
    case 'nanobanana':
      return 'GRSAI / Nano Banana'
    case 'openai-image':
      return 'OpenAI Images'
    case 'custom':
      return 'Custom Image Provider'
    case 'mock':
      return 'AI Office Image Mock'
    default:
      return provider
  }
}

export function loadWebImageSettings(): WebImageSettings {
  const provider = normalizeProvider(process.env.IMAGE_PROVIDER)
  const useBuiltinKey = parseBoolean(process.env.IMAGE_USE_BUILTIN_KEY, false)
  const endpoint = provider === 'openai-image'
    ? OPENAI_IMAGES_ENDPOINT
    : provider === 'mock'
      ? ''
      : firstNonEmpty(process.env.IMAGE_ENDPOINT, process.env.IMAGE_API_ENDPOINT)
  const explicitApiKey = provider === 'nanobanana'
    ? firstNonEmpty(process.env.IMAGE_API_KEY, process.env.NANOBANANA_API_KEY)
    : firstNonEmpty(process.env.IMAGE_API_KEY, process.env.OPENAI_API_KEY)
  const builtinApiKey = provider === 'nanobanana' && useBuiltinKey
    ? firstNonEmpty(process.env.AI_WRITER_DEFAULT_NANOBANANA_API_KEY)
    : ''

  return {
    provider,
    endpoint,
    model: firstNonEmpty(process.env.IMAGE_MODEL, DEFAULT_MODEL),
    apiKey: explicitApiKey || builtinApiKey,
    useBuiltinKey,
  }
}

function statusCapabilities(provider: WebImageProvider): Pick<WebImageProviderStatus, 'supportsReferences' | 'supportsAspectRatio' | 'supportsEventStream'> {
  switch (provider) {
    case 'nanobanana':
      return { supportsReferences: true, supportsAspectRatio: true, supportsEventStream: true }
    case 'openai-image':
      return { supportsReferences: false, supportsAspectRatio: true, supportsEventStream: false }
    case 'custom':
      return { supportsReferences: false, supportsAspectRatio: true, supportsEventStream: false }
    case 'mock':
      return { supportsReferences: false, supportsAspectRatio: true, supportsEventStream: false }
    default:
      return { supportsReferences: false, supportsAspectRatio: false, supportsEventStream: false }
  }
}

function statusErrorMessage(settings: WebImageSettings, endpointConfigured: boolean, keyConfigured: boolean): string | undefined {
  if (settings.provider === 'mock') return undefined
  if (settings.provider === 'nanobanana') {
    if (endpointConfigured && keyConfigured) return undefined
    return 'Nano Banana 图片服务未配置：请设置 IMAGE_ENDPOINT 和 IMAGE_API_KEY / NANOBANANA_API_KEY'
  }
  if (settings.provider === 'openai-image') {
    if (keyConfigured) return undefined
    return 'OpenAI 图片服务未配置：请设置 IMAGE_API_KEY 或 OPENAI_API_KEY'
  }
  if (settings.provider === 'custom') {
    if (endpointConfigured && keyConfigured) return undefined
    return 'Custom 图片服务未配置：请设置 IMAGE_ENDPOINT / IMAGE_API_ENDPOINT 和 IMAGE_API_KEY / OPENAI_API_KEY'
  }
  return '图片服务未配置'
}

export function getImageProviderStatus(): WebImageProviderStatus {
  const settings = loadWebImageSettings()
  const endpointConfigured = settings.provider === 'mock' || settings.provider === 'openai-image'
    ? true
    : Boolean(settings.endpoint.trim())
  const keyConfigured = settings.provider === 'mock'
    ? true
    : Boolean(settings.apiKey.trim())
  const configured = settings.provider === 'mock'
    ? true
    : endpointConfigured && keyConfigured
  const error = statusErrorMessage(settings, endpointConfigured, keyConfigured)

  return {
    success: true,
    provider: settings.provider,
    label: getWebImageProviderLabel(settings.provider),
    model: settings.model,
    endpointConfigured,
    keyConfigured,
    configured,
    ...statusCapabilities(settings.provider),
    ...(error ? { error } : {}),
  }
}

