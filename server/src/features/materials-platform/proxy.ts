import type { Request, Response, NextFunction } from 'express'
import { Readable } from 'node:stream'

const DEFAULT_BASE = 'http://127.0.0.1:8040'

const PREFIXES = [
  '/mock',
  '/dashboard',
  '/polymer',
  '/eln',
  '/battery',
  '/literature',
  '/assistant',
  '/innovation',
  '/outputs',
  '/print3d',
  '/teacher',
  '/student',
  '/databases',
  '/readonly',
  '/catalog',
  '/calc',
]

function getBaseUrl(): string {
  return (process.env.MATERIALS_PLATFORM_BASE_URL ?? DEFAULT_BASE).replace(/\/$/, '')
}

function shouldProxy(path: string): boolean {
  const normalized = path.startsWith('/api/') ? path.slice(4) : path
  return PREFIXES.some(prefix => normalized === prefix || normalized.startsWith(`${prefix}/`))
}

/** express.json() 已消费 body 时不能再读 req 流，否则会一直挂起直到超时 */
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

/** 将材料研发平台 FastAPI 挂到主站 /api 下（与现有路由不冲突的路径） */
export async function materialsPlatformProxy(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!shouldProxy(req.path)) {
    next()
    return
  }

  const target = `${getBaseUrl()}${req.originalUrl}`
  const headers: Record<string, string> = {}
  if (req.headers.authorization) headers.authorization = String(req.headers.authorization)
  if (req.headers['content-type']) headers['content-type'] = String(req.headers['content-type'])
  if (req.headers.accept) headers.accept = String(req.headers.accept)
  if (req.headers['x-demo-user']) headers['x-demo-user'] = String(req.headers['x-demo-user'])
  if (req.headers['x-user-id']) headers['x-user-id'] = String(req.headers['x-user-id'])

  try {
    const body = await readProxyBody(req)
    const init: RequestInit = {
      method: req.method,
      headers,
      signal: AbortSignal.timeout(Number(process.env.MATERIALS_PROXY_TIMEOUT_MS ?? 120_000)),
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
        message: '材料研发服务暂不可用，请确认 MATERIALS_PLATFORM_BASE_URL 后端已启动。',
        detail: message,
      })
    }
  }
}
