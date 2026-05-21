import {
  invokeLlmJson,
  isLlmConfigured,
  resolveBaseUrl,
  resolveModel,
  resolveProvider,
  resolveProviderApiKey,
} from '../ai-gateway/llmClient'
import { isImageServiceConfigured } from '../image-generation'

export function getAiSettingsView() {
  const provider = resolveProvider()
  const apiKey = resolveProviderApiKey(provider)
  return {
    provider,
    model: resolveModel(),
    baseUrl: resolveBaseUrl() || '(default)',
    hasApiKey: Boolean(apiKey),
    imageConfigured: isImageServiceConfigured(),
  }
}

export async function testAiConnection(): Promise<{ ok: boolean; message: string }> {
  if (!isLlmConfigured()) {
    return { ok: false, message: 'LLM 未配置：请设置服务器环境变量 LLM_API_KEY 等' }
  }
  try {
    const reply = await invokeLlmJson<{ pong: string }>(
      [
        { role: 'system', content: 'Reply JSON: {"pong":"ok"}' },
        { role: 'user', content: 'ping' },
      ],
      { maxTokens: 50, temperature: 0 },
    )
    return { ok: true, message: `连接成功：${reply?.pong ?? 'ok'}` }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, message: msg }
  }
}
