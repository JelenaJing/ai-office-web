import type { Request, Response, NextFunction } from 'express'
import { Readable } from 'node:stream'

const DEFAULT_BASE = 'http://127.0.0.1:8082'

function getBaseUrl(): string {
  return (process.env.AI4SCIENCE_API_BASE_URL ?? DEFAULT_BASE).replace(/\/$/, '')
}

async function readProxyBody(req: Request): Promise<Buffer | undefined> {
  if (req.method === 'GET' || req.method === 'HEAD') return undefined

  const contentType = String(req.headers['content-type'] ?? '')
  if (contentType.includes('application/json') && req.body !== undefined) {
    return Buffer.from(JSON.stringify(req.body))
  }

  if (req.readableEnded) return undefined

  const chunks: Buffer[] = []
  await new Promise<void>((resolve, reject) => {
    req.on('data', c => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)))
    req.on('end', () => resolve())
    req.on('error', reject)
  })
  return chunks.length ? Buffer.concat(chunks) : undefined
}

/** 将 ai4science FastAPI（8082）挂到主站 /ai4science/api */
export async function ai4scienceProxy(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const upstreamPath = req.originalUrl.replace(/^\/ai4science\/api/, '/api') || '/api'
  const target = `${getBaseUrl()}${upstreamPath}`
  const headers: Record<string, string> = {}
  if (req.headers['content-type']) headers['content-type'] = String(req.headers['content-type'])
  if (req.headers.accept) headers.accept = String(req.headers.accept)

  try {
    const body = await readProxyBody(req)
    const init: RequestInit = {
      method: req.method,
      headers,
      signal: AbortSignal.timeout(Number(process.env.AI4SCIENCE_PROXY_TIMEOUT_MS ?? 120_000)),
    }
    if (body) init.body = body

    const upstream = await fetch(target, init)
    res.status(upstream.status)
    upstream.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'transfer-encoding') return
      res.setHeader(key, value)
    })
    if (!upstream.body) {
      res.end()
      return
    }
    Readable.fromWeb(upstream.body as import('stream/web').ReadableStream).pipe(res)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (!res.headersSent) {
      res.status(502).json({
        message: 'ai4science 模型服务暂不可用，请确认已启动（npm run dev:ai4science:backend）。',
        detail: message,
      })
    }
  }
}
