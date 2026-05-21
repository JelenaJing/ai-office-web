/**
 * middleware/rateLimit.ts — API rate limiting
 *
 * Strategy:
 *  - Global API limit: 200 req / 15 min per IP (protects all /api/* routes)
 *  - Auth limit: 10 req / 15 min per IP (brute-force protection for login/register)
 *  - Upload limit: 20 req / 15 min per IP (cost protection for file ingestion)
 *  - Skill run limit: 30 req / 15 min per IP (AI cost protection)
 *
 * Limits are intentionally generous for MVP. Tighten per environment via env vars.
 */

import rateLimit from 'express-rate-limit'

/** Applied globally to all /api/* routes */
export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_GLOBAL ?? 200),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: '请求过于频繁，请稍后再试。' },
})

/** Applied to /api/auth/* — stricter to prevent brute-force */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_AUTH ?? 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: '登录请求过于频繁，请 15 分钟后重试。' },
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
