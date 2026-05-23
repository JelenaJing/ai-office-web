import { createHmac, timingSafeEqual } from 'crypto'

export interface WebAuthUser {
  id: string
  username: string
  displayName: string
  email: string
  roles: string[]
  status: 'active' | 'disabled' | string
  mustChangePassword: boolean
}

interface TokenPayload {
  typ: 'web-email-fallback'
  user: WebAuthUser
  iat: number
}

function secret(): string {
  return process.env.WEB_AUTH_TOKEN_SECRET || process.env.EMAIL_SECRET || 'dev-web-email-fallback-token-secret'
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url')
}

export function createWebAuthToken(user: WebAuthUser): string {
  const payload: TokenPayload = {
    typ: 'web-email-fallback',
    user,
    iat: Date.now(),
  }
  const encoded = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url')
  return `web-email.${encoded}.${sign(encoded)}`
}

export function verifyWebAuthToken(token: string | null | undefined): WebAuthUser | null {
  const raw = String(token || '')
  if (!raw.startsWith('web-email.')) return null
  const [, encoded, signature] = raw.split('.')
  if (!encoded || !signature) return null
  const expected = sign(encoded)
  const left = Buffer.from(signature)
  const right = Buffer.from(expected)
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8')) as TokenPayload
    return payload.typ === 'web-email-fallback' && payload.user?.id ? payload.user : null
  } catch {
    return null
  }
}

export function createProvisionedMailboxUser(inputLogin: string, email: string): WebAuthUser {
  const username = String(inputLogin || email).trim().toLowerCase().split('@')[0] || email.split('@')[0]
  return {
    id: `mailbox:${email.toLowerCase()}`,
    username,
    displayName: username,
    email: email.toLowerCase(),
    roles: ['mailbox-fallback'],
    status: 'active',
    mustChangePassword: false,
  }
}
