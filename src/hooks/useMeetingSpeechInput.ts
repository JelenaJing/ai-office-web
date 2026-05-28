import { useCallback, useRef, useState } from 'react'
import {
  isSpeechInputSecureContext,
  startMeetingRealtimeSpeechInput,
  supportsMeetingRealtimeSpeechInput,
  type MeetingSpeechInputSession,
} from '../services/meetingRealtimeSpeechInput'

export function useMeetingSpeechInput(options: {
  getBaseText: () => string
  setText: (text: string) => void
  onStatus?: (message: string) => void
}) {
  const { getBaseText, setText, onStatus } = options
  const [listening, setListening] = useState(false)
  const [supported] = useState(() => supportsMeetingRealtimeSpeechInput())
  const sessionRef = useRef<MeetingSpeechInputSession | null>(null)
  const baseRef = useRef('')
  const stopRequestedRef = useRef(false)

  const stop = useCallback(async (reason?: string) => {
    stopRequestedRef.current = true
    const session = sessionRef.current
    sessionRef.current = null
    setListening(false)
    if (reason) onStatus?.(reason)
    await session?.stop().catch(() => undefined)
  }, [onStatus])

  const toggle = useCallback(async () => {
    if (listening) {
      await stop('已停止语音输入')
      return
    }
    if (!supported) {
      onStatus?.(
        typeof window !== 'undefined' && !isSpeechInputSecureContext()
          ? '语音输入需 HTTPS（请用 npm run dev:web 启动，访问 https://本机IP:5173 并信任证书）'
          : '当前浏览器不支持语音输入（需麦克风权限）',
      )
      return
    }
    try {
      stopRequestedRef.current = false
      baseRef.current = getBaseText()
      onStatus?.('正在启动语音输入…')
      const session = await startMeetingRealtimeSpeechInput({
        onPartialText: partial => {
          const base = baseRef.current
          const merged = partial
            ? base.trim()
              ? `${base.trim()}\n${partial.trim()}`
              : partial.trim()
            : base
          setText(merged)
        },
        onFinalText: finalText => {
          const base = baseRef.current
          const merged = finalText
            ? base.trim()
              ? `${base.trim()}\n${finalText.trim()}`
              : finalText.trim()
            : base
          if (finalText.trim()) baseRef.current = merged
          setText(merged)
        },
        onError: msg => {
          void stop(msg || '语音输入失败')
        },
        onStatusChange: onStatus,
      })
      sessionRef.current = session
      setListening(true)
      onStatus?.('语音输入中，请说出文稿需求')
    } catch (e) {
      const msg = e instanceof Error ? e.message : '启动语音输入失败'
      onStatus?.(msg)
      setListening(false)
      sessionRef.current = null
    }
  }, [getBaseText, listening, onStatus, setText, stop, supported])

  return { listening, supported, toggle, stop }
}
