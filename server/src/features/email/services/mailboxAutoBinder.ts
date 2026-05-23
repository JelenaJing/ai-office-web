import { saveEmailAccount, type StoredEmailAccount } from './emailStore'
import type { CandidateMailbox } from './emailProviderPresets'

export interface MailboxBindingResult {
  mailboxId: string
  email: string
  provider: string
}

function mailboxIdFor(userId: string, email: string): string {
  const raw = `${userId}:${email}`.toLowerCase()
  return `mailbox_${Buffer.from(raw).toString('base64url').slice(0, 32)}`
}

export function accountFromCandidate(candidate: CandidateMailbox, password: string): StoredEmailAccount {
  const mailboxId = mailboxIdFor(candidate.email, candidate.email)
  return {
    mailboxId,
    user: candidate.email,
    email: candidate.email,
    username: candidate.email,
    password,
    displayName: candidate.email.split('@')[0] || candidate.email,
    provider: candidate.provider,
    label: candidate.label,
    imapHost: candidate.imapHost,
    imapPort: candidate.imapPort,
    imapSecure: candidate.imapSecure,
    imapTlsMode: candidate.imapTlsMode,
    smtpHost: candidate.smtpHost,
    smtpPort: candidate.smtpPort,
    smtpSecure: candidate.smtpSecure,
    smtpTlsMode: candidate.smtpTlsMode,
    allowSelfSignedCerts: candidate.allowSelfSignedCerts,
    isDefaultSend: true,
    isDefaultReceive: true,
    canSend: true,
    canReceive: true,
    lastTestAt: new Date().toISOString(),
  }
}

export function autoBindMailboxForUser(
  userId: string,
  candidate: CandidateMailbox,
  password: string,
): MailboxBindingResult {
  const account = accountFromCandidate(candidate, password)
  account.mailboxId = mailboxIdFor(userId, candidate.email)
  saveEmailAccount(userId, account)
  return {
    mailboxId: account.mailboxId,
    email: candidate.email,
    provider: candidate.provider,
  }
}
