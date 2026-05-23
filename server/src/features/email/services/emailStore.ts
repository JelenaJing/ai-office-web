import fs from 'fs'
import path from 'path'
import { encryptPassword, decryptPassword } from '../../../lib/passwordCrypto'

const EMAIL_ROOT = path.resolve(__dirname, '../../../data/email')

export interface StoredEmailAccount {
  mailboxId?: string
  user: string
  email?: string
  username?: string
  password: string
  displayName: string
  provider?: string
  label?: string
  imapHost: string
  imapPort: number
  imapSecure: boolean
  imapTlsMode?: 'ssl' | 'starttls' | 'none'
  smtpHost: string
  smtpPort: number
  smtpSecure: boolean
  smtpTlsMode?: 'ssl' | 'starttls' | 'none'
  allowSelfSignedCerts?: boolean
  isDefaultSend?: boolean
  isDefaultReceive?: boolean
  canSend?: boolean
  canReceive?: boolean
  lastTestAt?: string
  lastTestError?: string
}

function accountPath(userId: string): string {
  const safe = userId.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 64)
  return path.join(EMAIL_ROOT, `${safe}.json`)
}

export function saveEmailAccount(userId: string, account: StoredEmailAccount): void {
  const toSave: StoredEmailAccount = {
    ...account,
    password: encryptPassword(account.password),
  }
  fs.mkdirSync(EMAIL_ROOT, { recursive: true })
  fs.writeFileSync(accountPath(userId), JSON.stringify(toSave, null, 2), 'utf-8')
}

export function getEmailAccount(userId: string): StoredEmailAccount | null {
  const p = accountPath(userId)
  if (!fs.existsSync(p)) return null
  try {
    const stored = JSON.parse(fs.readFileSync(p, 'utf-8')) as StoredEmailAccount
    return { ...stored, password: decryptPassword(stored.password) }
  } catch {
    return null
  }
}

export function maskAccount(account: StoredEmailAccount | null) {
  if (!account) return { configured: false as const }
  return {
    configured: true as const,
    mailboxId: account.mailboxId,
    user: account.user,
    email: account.email || account.user,
    username: account.username || account.user,
    displayName: account.displayName,
    provider: account.provider,
    label: account.label,
    imapHost: account.imapHost,
    imapPort: account.imapPort,
    imapSecure: account.imapSecure,
    imapTlsMode: account.imapTlsMode,
    smtpHost: account.smtpHost,
    smtpPort: account.smtpPort,
    smtpSecure: account.smtpSecure,
    smtpTlsMode: account.smtpTlsMode,
    isDefaultSend: account.isDefaultSend,
    isDefaultReceive: account.isDefaultReceive,
    canSend: account.canSend,
    canReceive: account.canReceive,
    lastTestAt: account.lastTestAt,
    lastTestError: account.lastTestError,
  }
}
