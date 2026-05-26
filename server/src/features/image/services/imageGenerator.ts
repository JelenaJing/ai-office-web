import { deflateSync } from 'node:zlib'

import {
  getImageProviderStatus,
  getWebImageProviderLabel,
  loadWebImageSettings,
  type WebImageProvider,
} from './imageProviderConfig'
import { resolveTaskTimeoutMs } from '../../../lib/taskTimeouts'

export interface GenerateImagePngInput {
  prompt: string
  aspectRatio?: string
  negativePrompt?: string
  references?: unknown[]
  referenceImages?: unknown[]
  styleOptions?: Record<string, unknown>
  generationMode?: string
  styleProfile?: Record<string, unknown> | null
  traceId?: string
  debug?: Record<string, unknown>
}

export interface GenerateImagePngResult {
  png: Buffer
  provider: WebImageProvider
  label: string
  model: string
  endpointConfigured: boolean
  keyConfigured: boolean
  aspectRatio: string
  generationMode: string
  referenceCount: number
  fallbackNotes: string[]
}

interface PromptPayload {
  finalPrompt: string
  promptSummary: string
}

interface NormalizedReferenceImage {
  id: string
  role: 'primary-style' | 'style' | 'content'
  order: number
  url: string
  weight?: number
}

interface ResolvedImagePayload {
  url?: string
  base64?: string
}

interface JsonValueMap {
  [key: string]: unknown
}

const NANOBANANA_MAX_ATTEMPTS = 3
const NANOBANANA_MAX_REFERENCES = 4
const FETCH_TIMEOUT_MS = resolveTaskTimeoutMs('image')
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
const CRC32_TABLE = buildCrc32Table()
const FONT_5X7: Record<string, string[]> = {
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  '/': ['00001', '00010', '00100', '01000', '10000', '00000', '00000'],
  ':': ['00000', '01100', '01100', '00000', '01100', '01100', '00000'],
  '?': ['01110', '10001', '00001', '00010', '00100', '00000', '00100'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '11100'],
  'A': ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  'B': ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  'C': ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  'D': ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  'E': ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  'F': ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  'G': ['01110', '10001', '10000', '10111', '10001', '10001', '01110'],
  'H': ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  'I': ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  'J': ['00001', '00001', '00001', '00001', '10001', '10001', '01110'],
  'K': ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  'L': ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  'M': ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  'N': ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  'O': ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  'P': ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  'Q': ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  'R': ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  'S': ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  'T': ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  'U': ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  'V': ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  'W': ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
  'X': ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  'Y': ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  'Z': ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
}

export function isImageServiceConfigured(): boolean {
  return getImageProviderStatus().configured
}

export { getImageProviderStatus }

export async function generateImagePng(
  input: GenerateImagePngInput,
  onProgress?: (message: string) => void,
): Promise<GenerateImagePngResult> {
  const status = getImageProviderStatus()
  const settings = loadWebImageSettings()
  if (!status.configured && settings.provider !== 'mock') {
    throw new Error(status.error || '图片生成服务未配置')
  }

  const aspectRatio = normalizeAspectRatio(input.aspectRatio)
  const generationMode = String(input.generationMode || 'default').trim() || 'default'
  const references = normalizeReferenceImages(input.references, input.referenceImages)
  const promptPayload = buildPromptPayload(input, references)

  console.info('[image:prompt-builder]', JSON.stringify({
    provider: settings.provider,
    model: settings.model,
    taskType: 'image',
    timeoutMs: FETCH_TIMEOUT_MS,
    aspectRatio,
    generationMode,
    referenceCount: references.length,
    promptSummary: promptPayload.promptSummary,
    traceId: input.traceId || null,
  }))

  switch (settings.provider) {
    case 'mock': {
      onProgress?.('正在生成 Mock 图片...')
      return {
        png: createMockPng(input.prompt, aspectRatio),
        provider: 'mock',
        label: getWebImageProviderLabel('mock'),
        model: settings.model,
        endpointConfigured: true,
        keyConfigured: true,
        aspectRatio,
        generationMode,
        referenceCount: references.length,
        fallbackNotes: [],
      }
    }
    case 'nanobanana':
      return generateNanobananaImage(settings, status, promptPayload, input, references, aspectRatio, generationMode, onProgress)
    case 'openai-image':
    case 'custom':
      return generateOpenAiCompatibleImage(settings.provider, settings, status, promptPayload, input, references, aspectRatio, generationMode, onProgress)
    default:
      throw new Error(`暂不支持的图片 provider: ${settings.provider}`)
  }
}

async function generateNanobananaImage(
  settings: ReturnType<typeof loadWebImageSettings>,
  status: ReturnType<typeof getImageProviderStatus>,
  promptPayload: PromptPayload,
  input: GenerateImagePngInput,
  references: NormalizedReferenceImage[],
  aspectRatio: string,
  generationMode: string,
  onProgress?: (message: string) => void,
): Promise<GenerateImagePngResult> {
  const outboundReferenceImages = references.map((item) => ({
    id: item.id,
    role: item.role,
    url: item.url,
    ...(typeof item.weight === 'number' ? { weight: item.weight } : {}),
  }))
  const outboundImages = outboundReferenceImages.map((item) => item.url)
  const requestBody: JsonValueMap = {
    model: settings.model,
    prompt: promptPayload.finalPrompt,
    aspectRatio,
    shutProgress: false,
  }
  if (String(input.negativePrompt || '').trim()) requestBody.negativePrompt = String(input.negativePrompt).trim()
  if (outboundReferenceImages.length > 0) {
    requestBody.referenceImages = outboundReferenceImages
    requestBody.images = outboundImages
  }

  console.info(
    `[ai:image][request-summary] provider=${settings.provider} model=${settings.model} taskType=image timeoutMs=${FETCH_TIMEOUT_MS} aspectRatio=${aspectRatio} referenceCount=${references.length} outboundImageField=images endpoint=${settings.endpoint}`,
  )
  console.info('[Image Generation Debug]', JSON.stringify({
    provider: settings.provider,
    model: settings.model,
    endpoint: settings.endpoint,
    aspectRatio,
    generationMode,
    requestBodyKeys: Object.keys(requestBody),
    debug: input.debug || null,
    traceId: input.traceId || null,
  }))

  let lastError: unknown = null
  for (let attempt = 1; attempt <= NANOBANANA_MAX_ATTEMPTS; attempt += 1) {
    try {
      onProgress?.(`正在调用 ${getWebImageProviderLabel(settings.provider)}（第 ${attempt}/${NANOBANANA_MAX_ATTEMPTS} 次）...`)
      const response = await fetch(settings.endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${settings.apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      })
      const resolved = await parseNanobananaResponse(response, onProgress)
      const png = await resolveImagePayloadToPng(resolved)
      return {
        png,
        provider: settings.provider,
        label: status.label,
        model: settings.model,
        endpointConfigured: status.endpointConfigured,
        keyConfigured: status.keyConfigured,
        aspectRatio,
        generationMode,
        referenceCount: references.length,
        fallbackNotes: [],
      }
    } catch (error) {
      lastError = error
      if (attempt >= NANOBANANA_MAX_ATTEMPTS) break
      await sleep(attempt * 400)
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError || 'Nano Banana 图片生成失败'))
}

async function generateOpenAiCompatibleImage(
  provider: 'openai-image' | 'custom',
  settings: ReturnType<typeof loadWebImageSettings>,
  status: ReturnType<typeof getImageProviderStatus>,
  promptPayload: PromptPayload,
  input: GenerateImagePngInput,
  references: NormalizedReferenceImage[],
  aspectRatio: string,
  generationMode: string,
  onProgress?: (message: string) => void,
): Promise<GenerateImagePngResult> {
  const endpoint = provider === 'openai-image'
    ? settings.endpoint
    : resolveOpenAiCompatibleEndpoint(settings.endpoint)
  const fallbackNotes = references.length > 0
    ? ['当前图片引擎不支持直接上传参考图，已降级为 prompt 引导生成。']
    : []
  const requestBody: JsonValueMap = {
    model: settings.model,
    prompt: promptPayload.finalPrompt,
    n: 1,
    size: mapAspectRatioToOpenAiSize(aspectRatio),
    response_format: 'b64_json',
  }

  console.info(
    `[ai:image][request-summary] provider=${provider} model=${settings.model} aspectRatio=${aspectRatio} referenceCount=${references.length} outboundImageField=none endpoint=${endpoint}`,
  )
  console.info('[Image Generation Debug]', JSON.stringify({
    provider,
    model: settings.model,
    endpoint,
    aspectRatio,
    generationMode,
    requestBodyKeys: Object.keys(requestBody),
    debug: input.debug || null,
    traceId: input.traceId || null,
  }))

  onProgress?.(`正在调用 ${getWebImageProviderLabel(provider)}...`)
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${settings.apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  })
  const payload = await parseJsonLikeImageResponse(response)
  const png = await resolveImagePayloadToPng(payload)

  return {
    png,
    provider,
    label: status.label,
    model: settings.model,
    endpointConfigured: status.endpointConfigured,
    keyConfigured: status.keyConfigured,
    aspectRatio,
    generationMode,
    referenceCount: references.length,
    fallbackNotes,
  }
}

function buildPromptPayload(input: GenerateImagePngInput, references: NormalizedReferenceImage[]): PromptPayload {
  const prompt = String(input.prompt || '').replace(/\s+/g, ' ').trim()
  const promptParts = [prompt]
  const styleLabel = typeof input.styleProfile?.label === 'string'
    ? input.styleProfile.label
    : typeof input.styleProfile?.name === 'string'
      ? input.styleProfile.name
      : ''
  const styleProfileText = styleLabel.trim()
  if (styleProfileText) promptParts.push(`风格参考：${styleProfileText}`)
  if (references.length > 0) {
    promptParts.push(`参考图角色：${references.map((item) => `${item.role}:${item.id}`).join(', ')}`)
  }
  return {
    finalPrompt: promptParts.filter(Boolean).join('\n\n'),
    promptSummary: prompt.slice(0, 120),
  }
}

function normalizeReferenceImages(references?: unknown[], referenceImages?: unknown[]): NormalizedReferenceImage[] {
  const rawItems = [...(Array.isArray(referenceImages) ? referenceImages : []), ...(Array.isArray(references) ? references : [])]
  const seen = new Set<string>()
  const normalized: NormalizedReferenceImage[] = []

  rawItems.forEach((item, index) => {
    if (!item || typeof item !== 'object') return
    const value = item as Record<string, unknown>
    const url = normalizeReferenceImageUrl(value)
    if (!url) return
    const id = String(value.id || value.documentId || value.fileId || `reference-${index + 1}`)
    const key = `${id}:${url}`
    if (seen.has(key)) return
    seen.add(key)
    normalized.push({
      id,
      role: normalizeReferenceRole(value.role),
      order: typeof value.order === 'number' ? value.order : index,
      url,
      ...(typeof value.weight === 'number' ? { weight: value.weight } : {}),
    })
  })

  return normalized
    .sort((left, right) => left.order - right.order)
    .slice(0, NANOBANANA_MAX_REFERENCES)
}

function normalizeReferenceImageUrl(value: Record<string, unknown>): string {
  const candidates = [value.dataUrl, value.url, value.previewUrl, value.imageUrl]
  for (const candidate of candidates) {
    const normalized = String(candidate || '').trim()
    if (!normalized) continue
    if (normalized.startsWith('data:image/')) return normalized
    if (/^https?:\/\//i.test(normalized)) return normalized
  }
  return ''
}

function normalizeReferenceRole(value: unknown): 'primary-style' | 'style' | 'content' {
  const normalized = String(value || '').trim().toLowerCase()
  if (normalized === 'primary-style') return 'primary-style'
  if (normalized === 'content') return 'content'
  return 'style'
}

async function parseNanobananaResponse(
  response: Response,
  onProgress?: (message: string) => void,
): Promise<ResolvedImagePayload> {
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Nano Banana 响应失败（${response.status}）`)
  }
  const contentType = response.headers.get('content-type') || ''
  if (/text\/event-stream/i.test(contentType)) {
    const raw = await response.text()
    return parseNanobananaEventStream(raw, onProgress)
  }
  return parseJsonLikeImageResponse(response)
}

function parseNanobananaEventStream(raw: string, onProgress?: (message: string) => void): ResolvedImagePayload {
  const events = raw
    .split(/\n\n+/)
    .map((block) => block.trim())
    .filter(Boolean)

  let lastPayload: unknown = null
  for (const block of events) {
    const dataLines = block
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trim())
      .filter(Boolean)
    for (const line of dataLines) {
      if (line === '[DONE]') continue
      try {
        const payload = JSON.parse(line)
        lastPayload = payload
        const phase = extractPhaseText(payload)
        if (phase) onProgress?.(phase)
      } catch {
        // ignore malformed event lines and continue reading later payloads
      }
    }
  }

  const resolved = extractResolvedImagePayload(lastPayload)
  if (!resolved) throw new Error('Nano Banana 未返回可解析的图片结果')
  return resolved
}

async function parseJsonLikeImageResponse(response: Response): Promise<ResolvedImagePayload> {
  const contentType = response.headers.get('content-type') || ''
  const rawText = await response.text()
  if (!response.ok) {
    throw new Error(rawText || `图片生成失败（${response.status}）`)
  }
  if (/^https?:\/\//i.test(rawText.trim())) {
    return { url: rawText.trim() }
  }
  const maybeBase64 = rawText.trim()
  if (isBase64Like(maybeBase64)) {
    return { base64: maybeBase64 }
  }
  if (!/json/i.test(contentType) && !rawText.trim().startsWith('{') && !rawText.trim().startsWith('[')) {
    throw new Error('图片服务返回了无法识别的响应')
  }
  const parsed = JSON.parse(rawText)
  const payload = extractResolvedImagePayload(parsed)
  if (!payload) throw new Error('图片服务未返回可解析的图片结果')
  return payload
}

function extractResolvedImagePayload(value: unknown): ResolvedImagePayload | null {
  if (!value) return null
  if (Array.isArray(value)) {
    for (const item of value) {
      const resolved = extractResolvedImagePayload(item)
      if (resolved) return resolved
    }
    return null
  }
  if (typeof value === 'string') {
    if (/^https?:\/\//i.test(value.trim())) return { url: value.trim() }
    if (value.startsWith('data:image/')) return { base64: value.slice(value.indexOf(',') + 1) }
    if (isBase64Like(value.trim())) return { base64: value.trim() }
    return null
  }
  if (typeof value !== 'object') return null

  const record = value as Record<string, unknown>
  const directUrl = [record.url, record.imageUrl, record.output_url, record.downloadUrl]
    .map((item) => String(item || '').trim())
    .find((item) => /^https?:\/\//i.test(item))
  if (directUrl) return { url: directUrl }

  const directBase64 = [record.b64_json, record.base64, record.imageBase64, record.image_data]
    .map((item) => String(item || '').trim())
    .find((item) => isBase64Like(item))
  if (directBase64) return { base64: directBase64 }

  const dataUrl = [record.dataUrl, record.image]
    .map((item) => String(item || '').trim())
    .find((item) => item.startsWith('data:image/'))
  if (dataUrl) return { base64: dataUrl.slice(dataUrl.indexOf(',') + 1) }

  const nestedKeys = ['data', 'result', 'results', 'output', 'outputs', 'payload']
  for (const key of nestedKeys) {
    const resolved = extractResolvedImagePayload(record[key])
    if (resolved) return resolved
  }

  return null
}

function extractPhaseText(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const candidates = [record.message, record.status, record.phase]
  for (const candidate of candidates) {
    const text = String(candidate || '').trim()
    if (text) return text
  }
  return null
}

async function resolveImagePayloadToPng(payload: ResolvedImagePayload): Promise<Buffer> {
  if (payload.base64) return Buffer.from(stripDataUrlPrefix(payload.base64), 'base64')
  if (payload.url) {
    const response = await fetch(payload.url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
    if (!response.ok) throw new Error(`图片下载失败（${response.status}）`)
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }
  throw new Error('图片结果为空')
}

function stripDataUrlPrefix(value: string): string {
  const trimmed = value.trim()
  if (!trimmed.startsWith('data:')) return trimmed
  const commaIndex = trimmed.indexOf(',')
  return commaIndex >= 0 ? trimmed.slice(commaIndex + 1) : trimmed
}

function isBase64Like(value: string): boolean {
  if (!value) return false
  if (!/^[A-Za-z0-9+/=\r\n_-]+$/.test(value)) return false
  return value.length >= 64
}

function resolveOpenAiCompatibleEndpoint(endpoint: string): string {
  const normalized = endpoint.trim().replace(/\/+$/, '')
  if (!normalized) return ''
  if (/\/images\/generations$/i.test(normalized)) return normalized
  return `${normalized}/images/generations`
}

function mapAspectRatioToOpenAiSize(aspectRatio: string): string {
  switch (aspectRatio) {
    case '16:9':
      return '1536x1024'
    case '9:16':
      return '1024x1536'
    case '4:3':
    case '3:4':
    case '1:1':
    default:
      return '1024x1024'
  }
}

function normalizeAspectRatio(value: string | undefined): string {
  const normalized = String(value || '').trim()
  return normalized || '16:9'
}

function createMockPng(prompt: string, aspectRatio: string): Buffer {
  const { width, height } = dimensionsForAspectRatio(aspectRatio)
  const pixels = Buffer.alloc(width * height * 4)
  fillRect(pixels, width, height, 0, 0, width, height, [12, 25, 54, 255])
  fillRect(pixels, width, height, 36, 36, width - 72, height - 72, [24, 49, 97, 255])
  fillRect(pixels, width, height, 36, 36, width - 72, 12, [74, 144, 226, 255])
  fillRect(pixels, width, height, 36, height - 48, width - 72, 12, [74, 144, 226, 255])
  fillRect(pixels, width, height, width - 180, 36, 96, 96, [116, 198, 157, 255])
  fillRect(pixels, width, height, width - 152, 64, 40, 40, [12, 25, 54, 255])

  const lines = wrapMockText([
    'AI OFFICE IMAGE MOCK',
    `PROMPT ${String(prompt || '').slice(0, 40)}`,
    `ASPECT ${aspectRatio}`,
  ])
  let cursorY = 120
  for (const line of lines) {
    drawText(pixels, width, height, normalizeMockText(line), 72, cursorY, 4, [244, 247, 255, 255])
    cursorY += 44
  }

  return encodePng(width, height, pixels)
}

function dimensionsForAspectRatio(aspectRatio: string): { width: number, height: number } {
  switch (aspectRatio) {
    case '1:1':
      return { width: 960, height: 960 }
    case '4:3':
      return { width: 1200, height: 900 }
    case '3:4':
      return { width: 900, height: 1200 }
    case '9:16':
      return { width: 900, height: 1600 }
    case '16:9':
    default:
      return { width: 1280, height: 720 }
  }
}

function wrapMockText(lines: string[]): string[] {
  const wrapped: string[] = []
  lines.forEach((line) => {
    const normalized = line.trim()
    if (!normalized) return
    for (let start = 0; start < normalized.length; start += 24) {
      wrapped.push(normalized.slice(start, start + 24))
    }
  })
  return wrapped.slice(0, 6)
}

function normalizeMockText(value: string): string {
  return value
    .toUpperCase()
    .split('')
    .map((char) => (FONT_5X7[char] ? char : '?'))
    .join('')
}

function drawText(
  pixels: Buffer,
  width: number,
  height: number,
  text: string,
  x: number,
  y: number,
  scale: number,
  color: [number, number, number, number],
): void {
  let cursorX = x
  for (const char of text) {
    drawChar(pixels, width, height, char, cursorX, y, scale, color)
    cursorX += 6 * scale
  }
}

function drawChar(
  pixels: Buffer,
  width: number,
  height: number,
  char: string,
  x: number,
  y: number,
  scale: number,
  color: [number, number, number, number],
): void {
  const bitmap = FONT_5X7[char] || FONT_5X7['?']
  bitmap.forEach((row, rowIndex) => {
    row.split('').forEach((cell, columnIndex) => {
      if (cell !== '1') return
      fillRect(pixels, width, height, x + columnIndex * scale, y + rowIndex * scale, scale, scale, color)
    })
  })
}

function fillRect(
  pixels: Buffer,
  width: number,
  height: number,
  x: number,
  y: number,
  rectWidth: number,
  rectHeight: number,
  color: [number, number, number, number],
): void {
  const startX = Math.max(0, x)
  const startY = Math.max(0, y)
  const endX = Math.min(width, x + rectWidth)
  const endY = Math.min(height, y + rectHeight)
  for (let currentY = startY; currentY < endY; currentY += 1) {
    for (let currentX = startX; currentX < endX; currentX += 1) {
      const offset = (currentY * width + currentX) * 4
      pixels[offset] = color[0]
      pixels[offset + 1] = color[1]
      pixels[offset + 2] = color[2]
      pixels[offset + 3] = color[3]
    }
  }
}

function encodePng(width: number, height: number, pixels: Buffer): Buffer {
  const raw = Buffer.alloc((width * 4 + 1) * height)
  for (let row = 0; row < height; row += 1) {
    const rawOffset = row * (width * 4 + 1)
    raw[rawOffset] = 0
    pixels.copy(raw, rawOffset + 1, row * width * 4, (row + 1) * width * 4)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0
  const idat = deflateSync(raw)
  return Buffer.concat([
    PNG_SIGNATURE,
    makePngChunk('IHDR', ihdr),
    makePngChunk('IDAT', idat),
    makePngChunk('IEND', Buffer.alloc(0)),
  ])
}

function makePngChunk(type: string, data: Buffer): Buffer {
  const typeBuffer = Buffer.from(type, 'ascii')
  const lengthBuffer = Buffer.alloc(4)
  lengthBuffer.writeUInt32BE(data.length, 0)
  const crcBuffer = Buffer.alloc(4)
  crcBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0)
  return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer])
}

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff
  for (let index = 0; index < buffer.length; index += 1) {
    crc = CRC32_TABLE[(crc ^ buffer[index]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function buildCrc32Table(): number[] {
  const table: number[] = []
  for (let value = 0; value < 256; value += 1) {
    let current = value
    for (let bit = 0; bit < 8; bit += 1) {
      current = (current & 1) === 1 ? (0xedb88320 ^ (current >>> 1)) : (current >>> 1)
    }
    table[value] = current >>> 0
  }
  return table
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
