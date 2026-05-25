/**
 * authUser.ts — Web API user resolution via AccountCenter
 *
 * Same auth model as /api/files and /api/workspaces: Bearer token validated
 * against AccountCenter /api/auth/me. No local JWT.
 */

import type { NextFunction, Request, Response } from 'express'
import { verifyWebAuthToken } from '../features/auth/services/webAuthToken'
import {
  ACCOUNT_CENTER_UNREACHABLE_MESSAGE,
  buildAccountCenterUrl,
  getAccountCenterBaseUrl,
  logAccountCenterIssue,
} from './accountCenter'
import { resolveCanonicalAccountUser } from './accountCenterIdentity'

export const ACCOUNT_CENTER_URL = getAccountCenterBaseUrl()

/** Fallback used only in dev when no token is present. */
export const DEV_FALLBACK_USER = 'web-demo-user'

const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const ACCOUNT_IDENTITY_RETRY_DELAY_MS = 150

export interface AccountIdentity {
  id: string
  username: string
  displayName?: string
  email?: string
}

function bearerToken(req: Request): string | null {
  const auth = req.headers['authorization']
  if (auth?.startsWith('Bearer ')) {
    const token = auth.slice(7).trim()
    if (token) return token
  }
  const cookieHeader = req.headers.cookie
  if (!cookieHeader) return null
  const cookieMap = new Map<string, string>()
  for (const part of cookieHeader.split(';')) {
    const [rawKey, ...rawValue] = part.split('=')
    const key = rawKey?.trim()
    if (!key) continue
    cookieMap.set(key, decodeURIComponent(rawValue.join('=').trim()))
  }
  return (
    cookieMap.get('aios_auth_token')
    ?? cookieMap.get('aios_itoken')
    ?? cookieMap.get('ai_office_internal_token')
    ?? null
  )
}

function fallbackIdentity(): AccountIdentity {
  return {
    id: DEV_FALLBACK_USER,
    username: DEV_FALLBACK_USER,
    displayName: DEV_FALLBACK_USER,
  }
}

function identityFromLocalUser(user: ReturnType<typeof verifyWebAuthToken>): AccountIdentity | null {
  if (!user?.id) return null
  return {
    id: user.id,
    username: user.username || user.email || user.id,
    displayName: user.displayName || user.username || user.email || user.id,
    email: user.email || undefined,
  }
}

async function normalizeLocalIdentity(user: ReturnType<typeof verifyWebAuthToken>): Promise<AccountIdentity | null> {
  if (!user?.id) return null
  if (!user.id.startsWith('mailbox:')) {
    return identityFromLocalUser(user)
  }
  const canonical = await resolveCanonicalAccountUser({
    email: user.email,
    username: user.username,
    login: user.email || user.username,
  })
  return canonical ? identityFromPayload(canonical) : null
}

function identityFromPayload(data: {
  id?: string
  userId?: string
  username?: string
  email?: string
  displayName?: string
  user?: {
    id?: string
    username?: string
    email?: string
    displayName?: string
  }
} | null | undefined): AccountIdentity | null {
  const id = data?.id ?? data?.userId ?? data?.user?.id
  if (!id) return null
  const username = data?.username ?? data?.user?.username ?? data?.email ?? data?.user?.email ?? String(id)
  return {
    id: String(id),
    username: String(username),
    displayName: data?.displayName ?? data?.user?.displayName ?? String(username),
    email: data?.email ?? data?.user?.email,
  }
}

/** Resolve user identity from AccountCenter; dev may fall back to DEV_FALLBACK_USER when no token is present. */
export async function resolveAccountIdentity(req: Request): Promise<AccountIdentity> {
  const token = bearerToken(req)
  if (!token) return fallbackIdentity()
  const localUser = await normalizeLocalIdentity(verifyWebAuthToken(token))
  if (localUser) return localUser
  try {
    const resp = await fetch(buildAccountCenterUrl('/api/auth/me'), {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
    })
    if (resp.status >= 500) {
      logAccountCenterIssue({
        scope: 'auth-user-resolve',
        method: 'GET',
        path: '/api/auth/me',
        baseUrl: getAccountCenterBaseUrl(),
        status: resp.status,
      })
    }
    if (!resp.ok) return fallbackIdentity()
    const data = (await resp.json()) as {
      id?: string
      userId?: string
      username?: string
      email?: string
      displayName?: string
      user?: { id?: string; username?: string; email?: string; displayName?: string }
    }
    return identityFromPayload(data) ?? fallbackIdentity()
  } catch (error) {
    logAccountCenterIssue({
      scope: 'auth-user-resolve',
      method: 'GET',
      path: '/api/auth/me',
      baseUrl: getAccountCenterBaseUrl(),
      error,
    })
    return fallbackIdentity()
  }
}

/** Resolve user id from AccountCenter; dev may fall back to DEV_FALLBACK_USER when no token is present. */
export async function resolveUserId(req: Request): Promise<string> {
  return (await resolveAccountIdentity(req)).id
}

export async function requireAccountIdentity(
  req: Request,
  res: Response,
  next?: NextFunction,
): Promise<AccountIdentity | null> {
  const token = bearerToken(req)
  if (!token) {
    if (!IS_PRODUCTION) {
      next?.()
      return fallbackIdentity()
    }
    res.status(401).json({ message: '未授权' })
    return null
  }
  const localUser = await normalizeLocalIdentity(verifyWebAuthToken(token))
  if (localUser) {
    next?.()
    return localUser
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const resp = await fetch(buildAccountCenterUrl('/api/auth/me'), {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(5000),
      })
      if (resp.status >= 500) {
        logAccountCenterIssue({
          scope: 'auth-user-require',
          method: 'GET',
          path: '/api/auth/me',
          baseUrl: getAccountCenterBaseUrl(),
          status: resp.status,
        })
      }
      if (!resp.ok) {
        if (attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, ACCOUNT_IDENTITY_RETRY_DELAY_MS))
          continue
        }
        res.status(401).json({ message: 'token 无效或已过期' })
        return null
      }
      const data = (await resp.json()) as {
        id?: string
        userId?: string
        username?: string
        email?: string
        displayName?: string
        user?: { id?: string; username?: string; email?: string; displayName?: string }
      }
      const identity = identityFromPayload(data)
      if (identity) {
        next?.()
        return identity
      }
      if (attempt === 0) {
        await new Promise((resolve) => setTimeout(resolve, ACCOUNT_IDENTITY_RETRY_DELAY_MS))
        continue
      }
      res.status(502).json({ message: '无法解析用户信息' })
      return null
    } catch (error) {
      logAccountCenterIssue({
        scope: 'auth-user-require',
        method: 'GET',
        path: '/api/auth/me',
        baseUrl: getAccountCenterBaseUrl(),
        error,
      })
      if (attempt === 0) {
        await new Promise((resolve) => setTimeout(resolve, ACCOUNT_IDENTITY_RETRY_DELAY_MS))
        continue
      }
      res.status(502).json({ message: ACCOUNT_CENTER_UNREACHABLE_MESSAGE })
      return null
    }
  }

  res.status(502).json({ message: ACCOUNT_CENTER_UNREACHABLE_MESSAGE })
  return null
}

/**
 * Stricter gate for routes that must not run anonymously in production.
 * Returns userId or sends 401 and returns null.
 */
export async function requireAccountUser(
  req: Request,
  res: Response,
  next?: NextFunction,
): Promise<string | null> {
  const identity = await requireAccountIdentity(req, res, next)
  return identity?.id ?? null
}
