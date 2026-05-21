/**
 * Web image generation — OpenAI-compatible images API (server-side keys only).
 */

import { resolveBaseUrl, resolveModel, resolveProviderApiKey, resolveProvider } from '../ai-gateway/llmClient'

export function isImageServiceConfigured(): boolean {
  const key =
    process.env.IMAGE_API_KEY?.trim() ||
    process.env.OPENAI_API_KEY?.trim() ||
    resolveProviderApiKey(resolveProvider())
  return Boolean(key?.length)
}

export async function generateImagePng(prompt: string): Promise<Buffer> {
  if (!isImageServiceConfigured()) {
    throw new Error('图片生成服务未配置：请在服务器设置 IMAGE_API_KEY 或 OPENAI_API_KEY')
  }

  const apiKey =
    process.env.IMAGE_API_KEY?.trim() ||
    process.env.OPENAI_API_KEY?.trim() ||
    resolveProviderApiKey(resolveProvider())

  const base =
    process.env.IMAGE_API_ENDPOINT?.trim()?.replace(/\/$/, '') ||
    (resolveBaseUrl() || 'https://api.openai.com/v1')

  const model = process.env.IMAGE_MODEL?.trim() || 'dall-e-3'
  const url = `${base}/images/generations`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      prompt: prompt.trim().slice(0, 4000),
      n: 1,
      size: '1024x1024',
      response_format: 'b64_json',
    }),
    signal: AbortSignal.timeout(120_000),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText)
    throw new Error(`图片生成失败 (${res.status})：${errText.slice(0, 300)}`)
  }

  const data = (await res.json()) as {
    data?: Array<{ b64_json?: string; url?: string }>
  }

  const item = data.data?.[0]
  if (item?.b64_json) {
    return Buffer.from(item.b64_json, 'base64')
  }

  if (item?.url) {
    const imgRes = await fetch(item.url, { signal: AbortSignal.timeout(60_000) })
    if (!imgRes.ok) throw new Error('下载生成图片失败')
    return Buffer.from(await imgRes.arrayBuffer())
  }

  throw new Error('图片服务返回了无法识别的响应')
}
