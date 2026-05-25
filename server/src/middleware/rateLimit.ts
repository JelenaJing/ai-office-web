/**
 * middleware/rateLimit.ts — API rate limiting
 *
 * Strategy:
 *  - Global API limit: 200 req / 15 min per IP (prod) / 2000 (dev) — all /api/*
 *  - Auth limit: 10 req / 15 min (prod) / 200 req / 15 min (dev) per IP
 *  - Upload limit: 20 req / 15 min per IP
 *  - Skill run limit: 30 req / 15 min per IP
 *  - Handoff claim: 120 req / 15 min per IP (separate from global)
 *
 * Global rate limit env vars:
 *  RATE_LIMIT_GLOBAL=<n>                    — max requests per 15 min window
 *  RATE_LIMIT_GLOBAL_DISABLED=true          — skip global limit entirely (dev only)
 *  RATE_LIMIT_GLOBAL_SKIP_LOCALHOST=true      — skip for 127.0.0.1 / ::1 (dev proxy default)
 *
 * Auth rate limit env vars:
 *  RATE_LIMIT_AUTH_DISABLED=true        — skip auth limit entirely (dev only)
 *  RATE_LIMIT_AUTH_SKIP_LOCALHOST=true  — skip for 127.0.0.1 / ::1 (dev only)
 *  RATE_LIMIT_AUTH_MAX=<n>             — override max requests per window
 *  RATE_LIMIT_AUTH_WINDOW_MS=<ms>      — override window in milliseconds
 */

import type { Request } from 'express'
import rateLimit from 'express-rate-limit'

const isProd = process.env.NODE_ENV === 'production'
const globalWindowMs = Number(process.env.RATE_LIMIT_GLOBAL_WINDOW_MS ?? 15 * 60 * 1000)
const globalMax = Number(process.env.RATE_LIMIT_GLOBAL ?? (isProd ? 200 : 2000))
const globalDisabled = process.env.RATE_LIMIT_GLOBAL_DISABLED === 'true'
const globalSkipLocalhost = process.env.RATE_LIMIT_GLOBAL_SKIP_LOCALHOST === 'true'
  || (!isProd && process.env.RATE_LIMIT_GLOBAL_SKIP_LOCALHOST !== 'false')

function isLocalhostIp(req: Request): boolean {
  const ip = req.ip ?? req.socket?.remoteAddress ?? ''
  return ip.includes('127.0.0.1') || ip.includes('::1') || ip.includes('::ffff:127.0.0.1') || ip.includes('localhost')
}

function isHandoffIntegrationPath(req: Request): boolean {
  const path = `${req.path || ''}${req.url || ''}`
  return path.includes('/integrations/content-handoff')
}

/** Applied globally to all /api/* routes */
export const globalRateLimit = rateLimit({
  windowMs: globalWindowMs,
  max: globalMax,
  skip: (req: Request) => {
    if (globalDisabled) return true
    if (globalSkipLocalhost && isLocalhostIp(req)) return true
    if (isHandoffIntegrationPath(req)) return true
    return false
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: '请求过于频繁，请稍后再试。' },
})

/** Handoff entry — separate bucket so link跳转不会和全站 API 共用 200 次配额 */
export const handoffRateLimit = rateLimit({
  windowMs: globalWindowMs,
  max: Number(process.env.RATE_LIMIT_HANDOFF ?? (isProd ? 120 : 1000)),
  skip: (req: Request) => {
    if (globalDisabled) return true
    if (globalSkipLocalhost && isLocalhostIp(req)) return true
    return false
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: '外部文稿跳转过于频繁，请稍后再试。' },
})

// ── Auth rate limit configuration ────────────────────────────────────────────

const authWindowMs = Number(process.env.RATE_LIMIT_AUTH_WINDOW_MS ?? 15 * 60 * 1000)
const authMax = Number(process.env.RATE_LIMIT_AUTH_MAX ?? (isProd ? 10 : 200))
const authDisabled = process.env.RATE_LIMIT_AUTH_DISABLED === 'true'
const skipLocalhost = process.env.RATE_LIMIT_AUTH_SKIP_LOCALHOST === 'true'

/** Applied to /api/auth/* — brute-force protection.
 *  In non-production envs the default max is 200 (vs 10 in production).
 *  Set RATE_LIMIT_AUTH_DISABLED=true or RATE_LIMIT_AUTH_SKIP_LOCALHOST=true to
 *  further relax during local development. */
export const authRateLimit = rateLimit({
  windowMs: authWindowMs,
  max: authMax,
  skip: (req: Request) => {
    if (authDisabled) return true
    if (skipLocalhost && isLocalhostIp(req)) return true
    return false
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: '登录请求过于频繁，请稍后再试。' },
})

/** Applied to /api/files/upload */
export const uploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_UPLOAD ?? 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: '上传过于频繁，请稍后再试。' },
})

/** Applied to /api/skills/:id/run */
export const skillRunRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_SKILL_RUN ?? 30),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'AI 生成请求过于频繁，请稍后再试。' },
})
