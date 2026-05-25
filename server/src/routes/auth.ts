/**
 * routes/auth.ts — Auth routes: transparent proxy to AccountCenter
 *
 * ACCOUNT_CENTER_BASE_URL is read from the environment (default 127.0.0.1:13100).
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
import {
  accountCenterLoginCandidates,
  runEmailLoginFallback,
} from '../features/auth/services/emailLoginFallback'
import { verifyWebAuthToken } from '../features/auth/services/webAuthToken'
import { deriveCandidateMailboxes } from '../features/email/services/emailProviderPresets'
import { accountFromCandidate, autoBindMailboxForUser } from '../features/email/services/mailboxAutoBinder'
import { testMailboxCredential } from '../features/email/services/emailMvp'
import {
  ACCOUNT_CENTER_UNREACHABLE_MESSAGE,
  buildAccountCenterUrl,
} from '../lib/accountCenter'
import { fetchCanonicalAccountUserByToken, resolveCanonicalAccountUser } from '../lib/accountCenterIdentity'

const router = Router()

interface AccountCenterLoginResponse {
  token?: string
  user?: {
    id: string
    username: string
    displayName: string
    email: string
    roles: string[]
    status: string
    mustChangePassword: boolean
  }
  message?: string
}

interface AccountCenterAttemptError {
  login: string
  status?: number
  message: string
}

async function requestAccountCenterLogin(username: string, password: string): Promise<{
  ok: boolean
  status: number
  data: AccountCenterLoginResponse
}> {
  const upstream = await fetch(buildAccountCenterUrl('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
    signal: AbortSignal.timeout(12000),
  })
  const ct = upstream.headers.get('content-type') ?? ''
  const data = ct.includes('application/json')
    ? await upstream.json() as AccountCenterLoginResponse
    : { message: await upstream.text() }
  return { ok: upstream.ok, status: upstream.status, data }
}

async function tryAutoBindAccountCenterMailbox(
  userId: string,
  inputLogin: string,
  password: string,
) {
  if (process.env.EMAIL_ACCOUNT_CENTER_AUTO_BIND !== 'true') return undefined
  const candidates = deriveCandidateMailboxes(inputLogin)
  for (const candidate of candidates) {
    const test = await testMailboxCredential(accountFromCandidate(candidate, password), password)
    if (test.ok) {
      return autoBindMailboxForUser(userId, candidate, password)
    }
  }
  return undefined
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
  const url = buildAccountCenterUrl(path)
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
    res.status(502).json({ message: ACCOUNT_CENTER_UNREACHABLE_MESSAGE })
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

  const accountCenterErrors: AccountCenterAttemptError[] = []
  for (const login of accountCenterLoginCandidates(username)) {
    try {
      const ac = await requestAccountCenterLogin(login, password)
      if (ac.ok && ac.data?.token && ac.data?.user) {
        const canonicalUser = await fetchCanonicalAccountUserByToken(ac.data.token)
        if (!canonicalUser) {
          return res.status(502).json({
            message: '账号中心登录成功，但无法解析 canonical userId。',
          })
        }
        let autoBoundMailbox
        try {
          autoBoundMailbox = await tryAutoBindAccountCenterMailbox(canonicalUser.id, username, password)
        } catch (err) {
          accountCenterErrors.push({
            login,
            message: `AccountCenter 登录成功，但邮箱自动绑定失败：${err instanceof Error ? err.message : String(err)}`,
          })
        }
        return res.json({
          ...ac.data,
          user: canonicalUser,
          authMethod: 'account_center',
          autoBoundMailbox,
          diagnostics: { accountCenterErrors },
        })
      }
      accountCenterErrors.push({
        login,
        status: ac.status,
        message: ac.data?.message || `AccountCenter 登录失败（HTTP ${ac.status}）`,
      })
    } catch (err) {
      accountCenterErrors.push({
        login,
        message: ACCOUNT_CENTER_UNREACHABLE_MESSAGE,
      })
    }
  }

  const fallback = await runEmailLoginFallback({
    inputLogin: username,
    password,
    accountCenterErrors,
  })
  if (fallback.success) {
    return res.json({
      token: fallback.token,
      user: fallback.user,
      authMethod: 'email_fallback',
      autoBoundMailbox: fallback.autoBoundMailbox,
      diagnostics: fallback.diagnostics,
      message: `已通过邮箱验证登录，并自动绑定 ${fallback.autoBoundMailbox?.email || fallback.candidate?.email}。`,
    })
  }

  return res.status(401).json({
    message: fallback.error || 'AI Office 登录失败，且未能通过候选邮箱完成 IMAP/SMTP 验证。',
    accountCenterErrors,
    mailboxFallback: fallback.diagnostics,
  })
})

// GET /api/auth/me
router.get('/me', async (req, res) => {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  const localUser = verifyWebAuthToken(token)
  if (localUser) {
    if (!localUser.id.startsWith('mailbox:')) return res.json(localUser)
    const canonicalUser = await resolveCanonicalAccountUser({
      email: localUser.email,
      username: localUser.username,
      login: localUser.email || localUser.username,
    })
    if (canonicalUser) return res.json(canonicalUser)
    return res.status(502).json({ message: '无法从 AccountCenter 解析 canonical userId' })
  }
  await proxyAC(req, res, 'GET', '/api/auth/me')
})

// GET /api/auth/me/bindings
router.get('/me/bindings', async (req, res) => {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  const localUser = verifyWebAuthToken(token)
  if (localUser) {
    return res.json({
      bindings: [
        {
          service: 'mail',
          status: 'active',
          metadata: {
            source: 'email_fallback',
            mailboxEmail: localUser.email,
          },
        },
      ],
    })
  }
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
