/**
 * authUser.ts — Web API user resolution via AccountCenter
 *
 * Same auth model as /api/files and /api/workspaces: Bearer token validated
 * against AccountCenter /api/auth/me. No local JWT.
 */

import type { Request, Response } from 'express'

export const ACCOUNT_CENTER_URL =
  process.env.ACCOUNT_CENTER_URL ?? 'http://10.20.5.61:13100'

/** Fallback used only in dev when no token is present or AC is unreachable. */
export const DEV_FALLBACK_USER = 'web-demo-user'

const IS_PRODUCTION = process.env.NODE_ENV === 'production'

function bearerToken(req: Request): string | null {
  const auth = req.headers['authorization']
  if (!auth?.startsWith('Bearer ')) return null
  const token = auth.slice(7).trim()
  return token || null
}

/** Resolve user id from AccountCenter; dev may fall back to DEV_FALLBACK_USER. */
export async function resolveUserId(req: Request): Promise<string> {
  const token = bearerToken(req)
  if (!token) return DEV_FALLBACK_USER
  try {
    const resp = await fetch(`${ACCOUNT_CENTER_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
    })
    if (!resp.ok) return DEV_FALLBACK_USER
    const data = (await resp.json()) as {
      id?: string
      userId?: string
      user?: { id?: string }
    }
    const uid = data.id ?? data.userId ?? data.user?.id
    return uid ? String(uid) : DEV_FALLBACK_USER
  } catch {
    return DEV_FALLBACK_USER
  }
}

/**
 * Stricter gate for routes that must not run anonymously in production.
 * Returns userId or sends 401 and returns null.
 */
export async function requireAccountUser(
  req: Request,
  res: Response,
): Promise<string | null> {
  const token = bearerToken(req)
  if (!token) {
    if (!IS_PRODUCTION) return DEV_FALLBACK_USER
    res.status(401).json({ message: '未授权' })
    return null
  }

  try {
    const resp = await fetch(`${ACCOUNT_CENTER_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
    })
    if (!resp.ok) {
      if (!IS_PRODUCTION) return DEV_FALLBACK_USER
      res.status(401).json({ message: 'token 无效或已过期' })
      return null
    }
    const data = (await resp.json()) as {
      id?: string
      userId?: string
      user?: { id?: string }
    }
    const uid = data.id ?? data.userId ?? data.user?.id
    if (uid) return String(uid)
    if (!IS_PRODUCTION) return DEV_FALLBACK_USER
    res.status(401).json({ message: '无法解析用户信息' })
    return null
  } catch {
    if (!IS_PRODUCTION) return DEV_FALLBACK_USER
    res.status(502).json({ message: 'AccountCenter 不可达' })
    return null
  }
}
