import fs from 'fs'
import path from 'path'
import { encryptPassword, decryptPassword } from '../../../lib/passwordCrypto'

const EMAIL_ROOT = path.resolve(__dirname, '../../../data/email')

export interface StoredEmailAccount {
  user: string
  password: string
  displayName: string
  imapHost: string
  imapPort: number
  imapSecure: boolean
  smtpHost: string
  smtpPort: number
  smtpSecure: boolean
  allowSelfSignedCerts?: boolean
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
    user: account.user,
    displayName: account.displayName,
    imapHost: account.imapHost,
    smtpHost: account.smtpHost,
  }
}
