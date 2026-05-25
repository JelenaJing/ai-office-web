import { Router } from 'express'
import { authRateLimit } from '../middleware/rateLimit'
import {
  ACCOUNT_CENTER_UNREACHABLE_CODE,
  ACCOUNT_CENTER_UNREACHABLE_MESSAGE,
  buildAccountCenterUrl,
  getAccountCenterBaseUrl,
  logAccountCenterIssue,
} from '../lib/accountCenter'
import { accountCenterLoginCandidates } from '../features/auth/services/emailLoginFallback'

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

async function parseJsonOrText(upstream: Response): Promise<AccountCenterLoginResponse> {
  const ct = upstream.headers.get('content-type') ?? ''
  if (ct.includes('application/json')) {
    return await upstream.json() as AccountCenterLoginResponse
  }
  return { message: await upstream.text() }
}

router.get('/health', async (_req, res) => {
  const baseUrl = getAccountCenterBaseUrl()
  const path = '/api/health'
  try {
    const upstream = await fetch(buildAccountCenterUrl(path), { signal: AbortSignal.timeout(5000) })
    const payload = await parseJsonOrText(upstream)
    if (upstream.status >= 500) {
      logAccountCenterIssue({
        scope: 'account-center-health',
        method: 'GET',
        path,
        baseUrl,
        status: upstream.status,
      })
    }
    res.status(upstream.status).json({ ok: upstream.ok, baseUrl, path, upstreamStatus: upstream.status, payload })
  } catch (error) {
    logAccountCenterIssue({
      scope: 'account-center-health',
      method: 'GET',
      path,
      baseUrl,
      error,
    })
    res.status(502).json({
      ok: false,
      code: ACCOUNT_CENTER_UNREACHABLE_CODE,
      message: ACCOUNT_CENTER_UNREACHABLE_MESSAGE,
      baseUrl,
      path,
    })
  }
})

router.post('/login', authRateLimit, async (req, res) => {
  const body = req.body as { username?: string; email?: string; password?: string }
  const username = (body.username ?? body.email ?? '').trim()
  const password = body.password ?? ''
  const baseUrl = getAccountCenterBaseUrl()

  if (!username || !password) {
    return res.status(400).json({ message: '请填写用户名和密码' })
  }

  console.info('[account-center] proxy login start')
  console.info(`[account-center] baseUrl=${baseUrl}`)

  for (const login of accountCenterLoginCandidates(username)) {
    try {
      const upstream = await fetch(buildAccountCenterUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: login, password }),
        signal: AbortSignal.timeout(12000),
      })
      const data = await parseJsonOrText(upstream)

      if (upstream.ok && data.token && data.user) {
        console.info('[account-center] login success')
        return res.json({
          ...data,
          authMethod: 'account_center',
        })
      }

      if (upstream.status === 401) {
        continue
      }

      if (upstream.status >= 500) {
        logAccountCenterIssue({
          scope: 'account-center-login',
          method: 'POST',
          path: '/api/auth/login',
          baseUrl,
          status: upstream.status,
        })
      }

      const upstreamMessage = String(data.message ?? '').trim()
      console.warn('[account-center] login failed')
      return res.status(upstream.status).json({
        message: upstream.status === 403 && upstreamMessage
          ? upstreamMessage
          : upstreamMessage || '账号中心登录失败，请稍后重试',
      })
    } catch (error) {
      logAccountCenterIssue({
        scope: 'account-center-login',
        method: 'POST',
        path: '/api/auth/login',
        baseUrl,
        error,
      })
      return res.status(502).json({
        code: ACCOUNT_CENTER_UNREACHABLE_CODE,
        message: ACCOUNT_CENTER_UNREACHABLE_MESSAGE,
      })
    }
  }

  console.warn('[account-center] login failed')
  return res.status(401).json({ message: '用户名或密码错误' })
})

export default router
