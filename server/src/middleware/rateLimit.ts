/**
 * middleware/rateLimit.ts — API rate limiting
 *
 * Strategy:
 *  - Global API limit: 200 req / 15 min per IP (protects all /api/* routes)
 *  - Auth limit: 10 req / 15 min (prod) / 200 req / 15 min (dev) per IP
 *  - Upload limit: 20 req / 15 min per IP (cost protection for file ingestion)
 *  - Skill run limit: 30 req / 15 min per IP (AI cost protection)
 *
 * Auth rate limit env vars:
 *  RATE_LIMIT_AUTH_DISABLED=true        — skip auth limit entirely (dev only)
 *  RATE_LIMIT_AUTH_SKIP_LOCALHOST=true  — skip for 127.0.0.1 / ::1 (dev only)
 *  RATE_LIMIT_AUTH_MAX=<n>             — override max requests per window
 *  RATE_LIMIT_AUTH_WINDOW_MS=<ms>      — override window in milliseconds
 */

import type { Request } from 'express'
import rateLimit from 'express-rate-limit'

/** Applied globally to all /api/* routes */
export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_GLOBAL ?? 200),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: '请求过于频繁，请稍后再试。' },
})

// ── Auth rate limit configuration ────────────────────────────────────────────

const isProd = process.env.NODE_ENV === 'production'
const authWindowMs = Number(process.env.RATE_LIMIT_AUTH_WINDOW_MS ?? 15 * 60 * 1000)
const authMax = Number(process.env.RATE_LIMIT_AUTH_MAX ?? (isProd ? 10 : 200))
const authDisabled = process.env.RATE_LIMIT_AUTH_DISABLED === 'true'
const skipLocalhost = process.env.RATE_LIMIT_AUTH_SKIP_LOCALHOST === 'true'

function isLocalhostIp(req: Request): boolean {
  const ip = req.ip ?? req.socket?.remoteAddress ?? ''
  return ip.includes('127.0.0.1') || ip.includes('::1') || ip.includes('localhost')
}

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
