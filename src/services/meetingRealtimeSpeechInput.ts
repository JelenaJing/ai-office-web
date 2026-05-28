/**
 * 会议助手 FunASR 实时语音转写（WebSocket float32 PCM 16kHz）
 * 接口文档：temp/语音识别接口.md
 */

const SAMPLE_RATE = 16_000

export interface MeetingSpeechInputHandlers {
  onFinalText: (text: string) => void
  onPartialText: (text: string) => void
  onError: (message: string) => void
  onStatusChange?: (message: string) => void
}

export interface MeetingSpeechInputSession {
  stop: () => Promise<void>
}

function linearResampleTo16k(input: Float32Array, inputRate: number): Float32Array {
  if (inputRate === SAMPLE_RATE) return input.slice()
  const ratio = inputRate / SAMPLE_RATE
  const outputLength = Math.round(input.length / ratio)
  const output = new Float32Array(outputLength)
  for (let i = 0; i < outputLength; i++) {
    const pos = i * ratio
    const floor = Math.floor(pos)
    const frac = pos - floor
    const a = input[floor] ?? 0
    const b = floor + 1 < input.length ? input[floor + 1] : a
    output[i] = a + (b - a) * frac
  }
  return output
}

export function resolveMeetingSpeechWsUrl(): string {
  const fromEnv = String(import.meta.env.VITE_SPEECH_REALTIME_WS || '').trim()
  if (fromEnv) return fromEnv

  if (typeof window === 'undefined') {
    return 'ws://10.20.5.62:8600/api/realtime/ws'
  }

  const isHttps = window.location.protocol === 'https:'
  const host = window.location.host
  const scheme = isHttps ? 'wss' : 'ws'
  // 经 Vite → BFF(3001) → 8600，避免 HTTPS 下直连 /speech-realtime 代理握手失败
  return `${scheme}://${host}/api/speech-realtime/api/realtime/ws`
}

async function probeSpeechRealtimeReachable(wsUrl: string): Promise<string | null> {
  try {
    const httpUrl = wsUrl
      .replace(/^wss:/i, 'https:')
      .replace(/^ws:/i, 'http:')
      .replace(/\/api\/realtime\/ws.*$/i, '/docs')
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), 2500)
    const res = await fetch(httpUrl, { method: 'GET', signal: controller.signal })
    window.clearTimeout(timer)
    if (res.ok || res.status === 404) return null
    return `语音识别服务返回 HTTP ${res.status}`
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (/abort/i.test(msg)) {
      return '无法连接语音识别服务（8600 未启动或网络不可达，请检查 SPEECH_REALTIME_HTTP_BASE）'
    }
    return `无法连接语音识别服务：${msg}`
  }
}

/** 麦克风在非 localhost 的 HTTP 页面会被浏览器拒绝，需 HTTPS 或 localhost */
export function isSpeechInputSecureContext(): boolean {
  if (typeof window === 'undefined') return false
  return window.isSecureContext === true
}

export function supportsMeetingRealtimeSpeechInput(): boolean {
  if (typeof window === 'undefined') return false
  return Boolean(
    window.WebSocket
    && window.AudioContext
    && typeof navigator.mediaDevices?.getUserMedia === 'function'
    && isSpeechInputSecureContext(),
  )
}

function mergeTranscript(base: string, chunk: string): string {
  const t = chunk.trim()
  if (!t) return base
  if (!base.trim()) return t
  if (base.endsWith(t) || base.includes(t)) return base
  return `${base.trim()}\n${t}`
}

export async function startMeetingRealtimeSpeechInput(
  handlers: MeetingSpeechInputHandlers,
): Promise<MeetingSpeechInputSession> {
  if (!supportsMeetingRealtimeSpeechInput()) {
    throw new Error('当前浏览器不支持麦克风或 WebSocket 语音输入')
  }

  const wsUrl = resolveMeetingSpeechWsUrl()
  handlers.onStatusChange?.('正在连接语音识别服务…')
  const reachability = await probeSpeechRealtimeReachable(wsUrl)
  if (reachability) {
    throw new Error(reachability)
  }

  let closed = false
  let stream: MediaStream | null = null
  let audioContext: AudioContext | null = null
  let processor: ScriptProcessorNode | null = null
  let source: MediaStreamAudioSourceNode | null = null
  let ws: WebSocket | null = null
  let partialBase = ''

  const cleanup = async () => {
    if (closed) return
    closed = true
    if (processor) processor.onaudioprocess = null
    try {
      source?.disconnect()
      processor?.disconnect()
    } catch {
      /* ignore */
    }
    stream?.getTracks().forEach(t => t.stop())
    if (audioContext && audioContext.state !== 'closed') {
      await audioContext.close().catch(() => undefined)
    }
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close()
    }
    ws = null
  }

  await new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error('连接语音识别服务超时，请确认 8600 服务已启动'))
    }, 12_000)

    ws = new WebSocket(wsUrl)
    ws.binaryType = 'arraybuffer'

    ws.onopen = () => {
      window.clearTimeout(timer)
      resolve()
    }
    ws.onerror = () => {
      window.clearTimeout(timer)
      reject(
        new Error(
          'WebSocket 握手失败：请确认会议助手 8600 已启动，且 BFF(3001) 与 Vite 已重启；开发地址应为 https://本机:5173',
        ),
      )
    }
    ws.onclose = () => {
      if (!closed) {
        handlers.onError('语音连接已断开')
      }
    }
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(String(event.data)) as {
          text?: string
          is_partial?: boolean
          is_final?: boolean
        }
        const text = String(data.text || '').trim()
        if (!text) return
        if (data.is_partial) {
          const merged = mergeTranscript(partialBase, text)
          handlers.onPartialText(merged)
          return
        }
        partialBase = mergeTranscript(partialBase, text)
        handlers.onFinalText(text)
        handlers.onPartialText(partialBase)
      } catch {
        /* ignore malformed frames */
      }
    }
  })

  handlers.onStatusChange?.('正在请求麦克风权限…')
  stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
  audioContext = new AudioContext({ latencyHint: 'interactive' })
  if (audioContext.state === 'suspended') {
    await audioContext.resume()
  }
  const inputRate = audioContext.sampleRate
  source = audioContext.createMediaStreamSource(stream)
  processor = audioContext.createScriptProcessor(4096, 1, 1)
  processor.onaudioprocess = ev => {
    if (closed || !ws || ws.readyState !== WebSocket.OPEN) return
    const channel = ev.inputBuffer.getChannelData(0)
    const pcm = inputRate === SAMPLE_RATE ? channel.slice() : linearResampleTo16k(channel, inputRate)
    ws.send(pcm.buffer.slice(0))
  }
  source.connect(processor)
  processor.connect(audioContext.destination)
  handlers.onStatusChange?.('语音输入中，请直接说出需求')

  return {
    stop: async () => {
      await cleanup()
    },
  }
}
