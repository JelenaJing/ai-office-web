import { deriveCandidateMailboxes, type CandidateMailbox } from '../../email/services/emailProviderPresets'
import { accountFromCandidate, autoBindMailboxForUser, type MailboxBindingResult } from '../../email/services/mailboxAutoBinder'
import { testMailboxCredential } from '../../email/services/emailMvp'
import { createProvisionedMailboxUser, createWebAuthToken, type WebAuthUser } from './webAuthToken'

export interface EmailFallbackDiagnostics {
  enabled: boolean
  provisioningEnabled: boolean
  candidates: Array<{
    email: string
    provider: string
    imapHost: string
    smtpHost: string
    status: 'pending' | 'passed' | 'failed' | 'skipped'
    imap?: string
    smtp?: string
    error?: string
  }>
  accountCenterErrors: Array<{ login: string; status?: number; message: string }>
}

export interface EmailFallbackResult {
  success: boolean
  token?: string
  user?: WebAuthUser
  candidate?: CandidateMailbox
  autoBoundMailbox?: MailboxBindingResult
  diagnostics: EmailFallbackDiagnostics
  error?: string
}

export function isEmailFallbackEnabled(): boolean {
  if (process.env.EMAIL_LOGIN_FALLBACK_ENABLED !== undefined) {
    return process.env.EMAIL_LOGIN_FALLBACK_ENABLED === 'true'
  }
  return process.env.NODE_ENV !== 'production'
}

export function isEmailProvisioningEnabled(): boolean {
  if (process.env.EMAIL_LOGIN_PROVISIONING_ENABLED !== undefined) {
    return process.env.EMAIL_LOGIN_PROVISIONING_ENABLED === 'true'
  }
  return process.env.NODE_ENV !== 'production'
}

export function accountCenterLoginCandidates(inputLogin: string): string[] {
  const raw = String(inputLogin || '').trim().toLowerCase()
  if (!raw) return []
  if (raw.includes('@')) return [raw]
  return [
    raw,
    `${raw}@ai.cuhk.edu.cn`,
    `${raw}@cuhk.edu.cn`,
    `${raw}@link.cuhk.edu.cn`,
  ]
}

export async function runEmailLoginFallback(input: {
  inputLogin: string
  password: string
  accountCenterErrors?: Array<{ login: string; status?: number; message: string }>
}): Promise<EmailFallbackResult> {
  const enabled = isEmailFallbackEnabled()
  const provisioningEnabled = isEmailProvisioningEnabled()
  const candidates = deriveCandidateMailboxes(input.inputLogin)
  const diagnostics: EmailFallbackDiagnostics = {
    enabled,
    provisioningEnabled,
    candidates: candidates.map((candidate) => ({
      email: candidate.email,
      provider: candidate.provider,
      imapHost: `${candidate.imapHost}:${candidate.imapPort}`,
      smtpHost: `${candidate.smtpHost}:${candidate.smtpPort}`,
      status: enabled ? 'pending' : 'skipped',
    })),
    accountCenterErrors: input.accountCenterErrors ?? [],
  }

  if (!enabled) {
    return {
      success: false,
      diagnostics,
      error: '邮箱登录 fallback 未启用',
    }
  }

  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index]
    const diagnostic = diagnostics.candidates[index]
    try {
      const test = await testMailboxCredential(accountFromCandidate(candidate, input.password), input.password)
      diagnostic.status = test.ok ? 'passed' : 'failed'
      diagnostic.imap = test.imap.ok ? 'passed' : test.imap.message
      diagnostic.smtp = test.smtp.ok ? 'passed' : test.smtp.message
      if (!test.ok) {
        diagnostic.error = test.error
        continue
      }
      if (!provisioningEnabled) {
        return {
          success: false,
          diagnostics,
          error: '邮箱验证成功，但当前 AI Office 未允许邮箱自动开通账号。',
        }
      }
      const user = createProvisionedMailboxUser(input.inputLogin, candidate.email)
      const autoBoundMailbox = autoBindMailboxForUser(user.id, candidate, input.password)
      return {
        success: true,
        token: createWebAuthToken(user),
        user,
        candidate,
        autoBoundMailbox,
        diagnostics,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      diagnostic.status = 'failed'
      diagnostic.error = message
    }
  }

  return {
    success: false,
    diagnostics,
    error: 'AI Office 登录失败，且未能通过候选邮箱完成 IMAP/SMTP 验证。',
  }
}
