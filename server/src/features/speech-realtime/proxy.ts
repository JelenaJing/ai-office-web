import type { Server } from 'node:http'
import type { Socket } from 'node:net'
import type { Request, Response, NextFunction } from 'express'
import httpProxy from 'http-proxy'

const PREFIX = '/api/speech-realtime'

function speechTargetBase(): string {
  return (process.env.SPEECH_REALTIME_HTTP_BASE ?? 'http://10.20.5.62:8600').replace(/\/$/, '')
}

function rewriteUrl(url: string): string {
  const [pathname, query = ''] = url.split('?')
  if (!pathname.startsWith(PREFIX)) return url
  const rest = pathname.slice(PREFIX.length) || '/'
  return query ? `${rest}?${query}` : rest
}

const proxy = httpProxy.createProxyServer({
  ws: true,
  changeOrigin: true,
  secure: false,
})

proxy.on('error', (err, _req, res) => {
  const message = err instanceof Error ? err.message : String(err)
  console.warn('[speech-realtime] proxy error:', message)
  const httpRes = res as Response | undefined
  if (httpRes && !httpRes.headersSent) {
    httpRes.status(502).json({
      success: false,
      error: '语音识别服务不可达',
      detail: message,
      hint: '请确认会议助手 8600 已启动，或设置 SPEECH_REALTIME_HTTP_BASE',
    })
  }
})

/** HTTP 健康检查等（WebSocket 走 upgrade） */
export function speechRealtimeHttpProxy(req: Request, res: Response, next: NextFunction): void {
  const path = req.originalUrl.split('?')[0]
  if (!path.startsWith(PREFIX)) {
    next()
    return
  }

  req.url = rewriteUrl(req.url)
  proxy.web(req, res, { target: speechTargetBase() }, (err) => {
    if (err) next(err)
  })
}

export function attachSpeechRealtimeWsUpgrade(server: Server): void {
  server.on('upgrade', (req, socket: Socket, head) => {
    const url = req.url ?? ''
    if (!url.startsWith(PREFIX)) return

    req.url = rewriteUrl(url)
    proxy.ws(req, socket, head, { target: speechTargetBase() }, (err) => {
      if (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.warn('[speech-realtime] ws upgrade failed:', message)
        socket.destroy()
      }
    })
  })
}
