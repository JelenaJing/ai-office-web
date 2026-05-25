import { saveEmailAccount, type StoredEmailAccount } from './emailStore'
import { presetForDomain, type CandidateMailbox } from './emailProviderPresets'
import type { CanonicalAccountUser } from '../../../lib/accountCenterIdentity'

export interface MailboxBindingResult {
  mailboxId: string
  email: string
  provider: string
  status?: string
  verified?: boolean
  lastVerifiedAt?: string
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
    status: 'connected',
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
    verified: true,
    lastVerifiedAt: new Date().toISOString(),
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
  account.ownerUserId = userId
  saveEmailAccount(userId, account)
  return {
    mailboxId: account.mailboxId,
    email: candidate.email,
    provider: candidate.provider,
    status: account.status,
    verified: account.verified,
    lastVerifiedAt: account.lastVerifiedAt,
  }
}

export interface ConnectedMailboxBindingInput {
  email: string
  provider?: string
  status?: string
  verified?: boolean
  lastVerifiedAt?: string
  displayName?: string
  label?: string
}

export function autoBindConnectedMailboxForUser(
  userId: string,
  mailbox: ConnectedMailboxBindingInput,
  password: string,
  owner?: Pick<CanonicalAccountUser, 'username' | 'displayName'>,
): MailboxBindingResult {
  const email = mailbox.email.trim().toLowerCase()
  const domain = email.split('@')[1] || ''
  const preset = presetForDomain(domain)
  const verifiedAt = mailbox.lastVerifiedAt || new Date().toISOString()
  const account: StoredEmailAccount = {
    mailboxId: mailboxIdFor(userId, email),
    user: email,
    email,
    username: email,
    password,
    displayName: mailbox.displayName || owner?.displayName || email.split('@')[0] || email,
    provider: mailbox.provider || preset.provider || 'imap/smtp/custom',
    label: mailbox.label || preset.label || email,
    ownerUserId: userId,
    ownerUsername: owner?.username,
    status: mailbox.status || 'connected',
    verified: mailbox.verified ?? true,
    lastVerifiedAt: verifiedAt,
    imapHost: preset.imapHost,
    imapPort: preset.imapPort,
    imapSecure: preset.imapSecure,
    imapTlsMode: preset.imapTlsMode,
    smtpHost: preset.smtpHost,
    smtpPort: preset.smtpPort,
    smtpSecure: preset.smtpSecure,
    smtpTlsMode: preset.smtpTlsMode,
    allowSelfSignedCerts: preset.allowSelfSignedCerts,
    isDefaultSend: true,
    isDefaultReceive: true,
    canSend: true,
    canReceive: true,
    lastTestAt: verifiedAt,
  }
  saveEmailAccount(userId, account)
  return {
    mailboxId: account.mailboxId || mailboxIdFor(userId, email),
    email,
    provider: account.provider || 'imap/smtp/custom',
    status: account.status,
    verified: account.verified,
    lastVerifiedAt: account.lastVerifiedAt,
  }
}
