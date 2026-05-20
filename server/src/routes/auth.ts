/**
 * routes/auth.ts — Auth routes: transparent proxy to AccountCenter
 *
 * ACCOUNT_CENTER_URL is read from the environment (default 10.20.5.61:13100).
 * The browser never talks to AccountCenter directly — all requests go through
 * this Express server, which forwards them with the appropriate headers.
 *
 * Supported routes:
 *   POST /api/auth/login           — login (accept username OR email field)
 *   GET  /api/auth/me              — fetch current user info
 *   GET  /api/auth/me/bindings     — fetch service bindings
 *   POST /api/auth/change-password — change password
 *   POST /api/auth/logout          — stateless logout (clears nothing server-side)
 */

import { Router } from 'express'
import type { Request, Response } from 'express'

const router = Router()

function getAcUrl(): string {
  return process.env.ACCOUNT_CENTER_URL ?? 'http://10.20.5.61:13100'
}

/**
 * Forward a request to AccountCenter and pipe the response back.
 * Passes Authorization header through if present.
 */
async function proxyAC(
  req: Request,
  res: Response,
  method: string,
  path: string,
  body?: unknown,
): Promise<void> {
  const url = `${getAcUrl()}${path}`
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }

  const auth = req.headers['authorization']
  if (auth) headers['Authorization'] = String(auth)

  try {
    const upstream = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(12000),
    })

    let data: unknown
    const ct = upstream.headers.get('content-type') ?? ''
    if (ct.includes('application/json')) {
      data = await upstream.json()
    } else {
      data = { message: await upstream.text() }
    }

    res.status(upstream.status).json(data)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[auth-proxy] ${method} ${path} →`, msg)
    res.status(502).json({ message: `AccountCenter 不可达：${msg}` })
  }
}

// POST /api/auth/login
// Accept both { username, password } and { email, password } from the frontend.
// AccountCenter expects { username, password }.
router.post('/login', async (req, res) => {
  const body = req.body as { username?: string; email?: string; password?: string }
  const username = (body.username ?? body.email ?? '').trim()
  const password = body.password ?? ''

  if (!username || !password) {
    return res.status(400).json({ message: '请填写用户名和密码' })
  }

  await proxyAC(req, res, 'POST', '/api/auth/login', { username, password })
})

// GET /api/auth/me
router.get('/me', async (req, res) => {
  await proxyAC(req, res, 'GET', '/api/auth/me')
})

// GET /api/auth/me/bindings
router.get('/me/bindings', async (req, res) => {
  await proxyAC(req, res, 'GET', '/api/auth/me/bindings')
})

// POST /api/auth/change-password
router.post('/change-password', async (req, res) => {
  await proxyAC(req, res, 'POST', '/api/auth/change-password', req.body)
})

// POST /api/auth/logout — AccountCenter is stateless; just acknowledge
router.post('/logout', (_req, res) => {
  res.json({ ok: true })
})

export default router
