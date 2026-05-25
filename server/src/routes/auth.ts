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
import { verifyWebAuthToken } from '../features/auth/services/webAuthToken'
import { deriveCandidateMailboxes } from '../features/email/services/emailProviderPresets'
import {
  accountFromCandidate,
  autoBindConnectedMailboxForUser,
  autoBindMailboxForUser,
} from '../features/email/services/mailboxAutoBinder'
import { testMailboxCredential } from '../features/email/services/emailMvp'
import {
  ACCOUNT_CENTER_UNREACHABLE_MESSAGE,
  buildAccountCenterUrl,
  getAccountCenterBaseUrl,
  logAccountCenterIssue,
} from '../lib/accountCenter'
import { fetchCanonicalAccountUserByToken, resolveCanonicalAccountUser } from '../lib/accountCenterIdentity'
import { repairLegacyUserState } from '../lib/canonicalUserMigration'

const router = Router()

interface AccountCenterConnectedMailbox {
  email: string
  provider?: string
  status?: string
  verified?: boolean
  lastVerifiedAt?: string
  displayName?: string
  label?: string
}

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
    loginMethod?: string
    connectedMailbox?: AccountCenterConnectedMailbox | string
  }
  loginMethod?: string
  connectedMailbox?: AccountCenterConnectedMailbox | string
  connectedMailboxEmail?: string
  message?: string
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

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeConnectedMailbox(raw: unknown): AccountCenterConnectedMailbox | undefined {
  if (!raw) return undefined
  if (typeof raw === 'string') {
    const email = raw.trim().toLowerCase()
    return email ? { email } : undefined
  }
  if (typeof raw !== 'object') return undefined
  const record = raw as Record<string, unknown>
  const email = normalizeString(record.email ?? record.address).toLowerCase()
  if (!email) return undefined
  return {
    email,
    provider: normalizeString(record.provider ?? record.providerType) || undefined,
    status: normalizeString(record.status) || undefined,
    verified: typeof record.verified === 'boolean'
      ? record.verified
      : (typeof record.isVerified === 'boolean' ? record.isVerified : undefined),
    lastVerifiedAt: normalizeString(record.lastVerifiedAt ?? record.last_verified_at) || undefined,
    displayName: normalizeString(record.displayName ?? record.name) || undefined,
    label: normalizeString(record.label) || undefined,
  }
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
  const baseUrl = getAccountCenterBaseUrl()
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

    if (upstream.status >= 500) {
      logAccountCenterIssue({
        scope: 'auth-proxy',
        method,
        path,
        baseUrl,
        status: upstream.status,
      })
    }

    res.status(upstream.status).json(data)
  } catch (err) {
    logAccountCenterIssue({
      scope: 'auth-proxy',
      method,
      path,
      baseUrl,
      error: err,
    })
    res.status(502).json({ message: ACCOUNT_CENTER_UNREACHABLE_MESSAGE })
  }
}

// POST /api/auth/login
// Delegates entirely to AccountCenter. Accept both { username, password } and
// { email, password } from the frontend — AccountCenter handles both AccountCenter
// passwords and external-mailbox (IMAP/SMTP) passwords internally.
// Web does NOT attempt IMAP/SMTP verification or multi-candidate username expansion.
router.post('/login', async (req, res) => {
  const body = req.body as { username?: string; email?: string; password?: string }
  const username = (body.username ?? body.email ?? '').trim()
  const password = body.password ?? ''

  if (!username || !password) {
    return res.status(400).json({ message: '请填写用户名和密码' })
  }

  let ac: { ok: boolean; status: number; data: AccountCenterLoginResponse }
  try {
    ac = await requestAccountCenterLogin(username, password)
  } catch (err) {
    logAccountCenterIssue({
      scope: 'auth-login',
      method: 'POST',
      path: '/api/auth/login',
      baseUrl: getAccountCenterBaseUrl(),
      error: err,
    })
    return res.status(502).json({ message: ACCOUNT_CENTER_UNREACHABLE_MESSAGE })
  }

  if (!ac.ok || !ac.data?.token || !ac.data?.user) {
    if (ac.status >= 500) {
      logAccountCenterIssue({
        scope: 'auth-login',
        method: 'POST',
        path: '/api/auth/login',
        baseUrl: getAccountCenterBaseUrl(),
        status: ac.status,
      })
    }
    return res.status(ac.status || 401).json({
      message: ac.data?.message || '用户名或密码错误',
    })
  }

  const canonicalUser = await fetchCanonicalAccountUserByToken(ac.data.token)
  if (!canonicalUser) {
    return res.status(502).json({
      message: '账号中心登录成功，但无法解析 canonical userId。',
    })
  }

  const loginMethod = normalizeString(ac.data.loginMethod || ac.data.user.loginMethod)
  const connectedMailbox = normalizeConnectedMailbox(
    ac.data.connectedMailbox || ac.data.user.connectedMailbox || ac.data.connectedMailboxEmail,
  )

  repairLegacyUserState({
    canonicalUserId: canonicalUser.id,
    canonicalUsername: canonicalUser.username,
    canonicalEmail: canonicalUser.email,
    login: username,
    connectedMailboxEmail: connectedMailbox?.email,
  })

  let autoBoundMailbox
  try {
    if (loginMethod === 'external_mailbox_password' && connectedMailbox?.email) {
      autoBoundMailbox = autoBindConnectedMailboxForUser(
        canonicalUser.id,
        {
          ...connectedMailbox,
          provider: connectedMailbox.provider || 'imap/smtp/custom',
          status: connectedMailbox.status || 'connected',
          verified: connectedMailbox.verified ?? true,
          lastVerifiedAt: connectedMailbox.lastVerifiedAt || new Date().toISOString(),
        },
        password,
        canonicalUser,
      )
    } else {
      autoBoundMailbox = await tryAutoBindAccountCenterMailbox(canonicalUser.id, username, password)
    }
  } catch (err) {
    console.warn('[auth] mailbox auto-bind failed:', err instanceof Error ? err.message : String(err))
  }

  return res.json({
    ...ac.data,
    user: canonicalUser,
    authMethod: 'account_center',
    loginMethod,
    connectedMailbox: connectedMailbox
      ? {
          ...connectedMailbox,
          provider: connectedMailbox.provider || autoBoundMailbox?.provider || 'imap/smtp/custom',
          status: connectedMailbox.status || autoBoundMailbox?.status || 'connected',
          verified: connectedMailbox.verified ?? autoBoundMailbox?.verified ?? (loginMethod === 'external_mailbox_password'),
          lastVerifiedAt: connectedMailbox.lastVerifiedAt || autoBoundMailbox?.lastVerifiedAt || new Date().toISOString(),
        }
      : undefined,
    autoBoundMailbox,
    message: autoBoundMailbox ? `已自动绑定邮箱 ${autoBoundMailbox.email}。` : undefined,
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
