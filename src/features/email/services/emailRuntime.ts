/**
 * Email runtime — Electron IPC on desktop, platformApi.email on Web.
 */
import { isWebShim } from '../../../platform/detect'
import { platformApi } from '../../../platform'
import type {
  EmailAccountConfig,
  MailItem,
} from '../../../types/email'
import type { EmailAnalysisTaskSnapshot } from '../../../types/mailTriage'
import type {
  EmailAccountInput,
  EmailAccountState,
  EmailMessageDetail,
  EmailMessageSummary,
  EmailSendInput,
} from '../../../platform/types'

function getElectronApi() {
  return window.electronAPI
}

function readAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return (
    window.localStorage.getItem('aios_auth_token')
    ?? window.localStorage.getItem('aios_itoken')
    ?? window.localStorage.getItem('ai_office_internal_token')
  )
}

function mapWebAccountToConfig(state: EmailAccountState): EmailAccountConfig | null {
  if (!state.configured || !state.user) return null
  return {
    mailboxId: state.mailboxId,
    user: state.user,
    email: state.email || state.user,
    password: '',
    displayName: state.displayName || state.user,
    providerType: state.provider,
    label: state.label,
    ownerUserId: state.ownerUserId,
    ownerUsername: state.ownerUsername,
    status: state.status,
    verified: state.verified,
    lastVerifiedAt: state.lastVerifiedAt,
    imapHost: state.imapHost || 'imap.example.com',
    imapPort: state.imapPort || 993,
    imapSecure: state.imapSecure !== false,
    smtpHost: state.smtpHost || 'smtp.example.com',
    smtpPort: state.smtpPort || 465,
    smtpSecure: state.smtpSecure !== false,
    allowSelfSignedCerts: state.allowSelfSignedCerts,
    smtpStartTls: state.smtpTlsMode === 'starttls',
  }
}

function configToInput(config: EmailAccountConfig): EmailAccountInput {
  return {
    user: config.user || config.email || '',
    password: config.password,
    displayName: config.displayName,
    email: config.email,
    username: config.username,
    provider: config.providerType,
    label: config.label,
    ownerUserId: config.ownerUserId,
    ownerUsername: config.ownerUsername,
    status: config.status,
    verified: config.verified,
    lastVerifiedAt: config.lastVerifiedAt,
    imapHost: config.imapHost,
    imapPort: config.imapPort,
    imapSecure: config.imapSecure,
    imapTlsMode: config.imapSecure ? 'ssl' : 'starttls',
    smtpHost: config.smtpHost,
    smtpPort: config.smtpPort,
    smtpSecure: config.smtpSecure,
    smtpTlsMode: config.smtpStartTls ? 'starttls' : (config.smtpSecure ? 'ssl' : 'none'),
    allowSelfSignedCerts: config.allowSelfSignedCerts,
  }
}

function summaryToMailItem(summary: EmailMessageSummary, folder: 'inbox' | 'sent' | 'trash' = 'inbox'): MailItem {
  const bodyPreview = summary.bodyPreview || summary.preview || ''
  return {
    id: summary.id,
    from: summary.from,
    fromName: summary.from.split('@')[0] || summary.from,
    to: '',
    toName: '',
    subject: summary.subject,
    body: bodyPreview,
    bodyText: bodyPreview,
    bodyPreview,
    bodyFormat: summary.bodyFormat || 'text',
    timestamp: summary.timestamp,
    unread: summary.unread,
    replied: false,
    folder,
  }
}

function detailToMailItem(detail: EmailMessageDetail): MailItem {
  const bodyHtml = detail.bodyHtml || detail.htmlBody || undefined
  const bodyText = detail.bodyText || detail.body || ''
  return {
    id: detail.id,
    from: detail.from,
    fromName: detail.from.split('@')[0] || detail.from,
    to: detail.to,
    toName: detail.to,
    subject: detail.subject,
    body: bodyText,
    bodyText,
    bodyPreview: detail.bodyPreview || bodyText,
    bodyFormat: detail.bodyFormat || (bodyHtml ? 'html' : 'text'),
    bodyHtml,
    htmlBody: bodyHtml,
    timestamp: detail.timestamp,
    unread: detail.unread,
    replied: false,
    folder: 'inbox',
  }
}

export async function emailRuntimeGetAccount(): Promise<EmailAccountConfig | null> {
  if (isWebShim()) {
    const state = await platformApi.email.getAccount()
    return mapWebAccountToConfig(state)
  }
  const api = getElectronApi()
  if (!api?.emailGetAccount) return null
  return api.emailGetAccount()
}

export async function emailRuntimeSaveAccount(config: EmailAccountConfig): Promise<void> {
  if (isWebShim()) {
    const saved = await platformApi.email.saveAccount(configToInput(config))
    if (!saved.configured) throw new Error('保存邮箱配置失败')
    return
  }
  await getElectronApi().emailSaveAccount(config)
}

/** Web 暂无清除 server 凭据 API；由 EmailContext 清空本地状态即可。 */
export async function emailRuntimeClearAccount(): Promise<void> {
  if (isWebShim()) return
  await getElectronApi().emailClearAccount()
}

export async function emailRuntimeTestConnection(
  config: EmailAccountConfig,
): Promise<{ ok: boolean; message: string }> {
  if (isWebShim()) {
    await platformApi.email.saveAccount(configToInput(config))
    return platformApi.email.testConnection()
  }
  const result = await getElectronApi().emailTestConnection?.(config)
  if (result && typeof result === 'object' && 'ok' in result) {
    return result as { ok: boolean; message: string }
  }
  return { ok: true, message: '连接成功' }
}

export async function emailRuntimeFetchInbox(options?: { force?: boolean; limit?: number }): Promise<MailItem[]> {
  if (isWebShim()) {
    const list = await platformApi.email.listMessages('inbox', options)
    return list.map((s) => summaryToMailItem(s, 'inbox'))
  }
  const response = await getElectronApi().emailFetchInbox()
  if (Array.isArray(response)) return response as MailItem[]
  if (response?.ok) return response.mails as MailItem[]
  throw new Error(response?.error?.message || '拉取收件箱失败')
}

export async function emailRuntimeFetchMessage(id: string): Promise<MailItem> {
  if (isWebShim()) {
    const detail = await platformApi.email.getMessage(id)
    return detailToMailItem(detail)
  }
  throw new Error('Electron 请使用收件箱列表中的完整邮件对象')
}

export async function emailRuntimeFetchSent(options?: { force?: boolean; limit?: number }): Promise<MailItem[]> {
  if (isWebShim()) {
    const list = await platformApi.email.listMessages('sent', options)
    return list.map((s) => summaryToMailItem(s, 'sent'))
  }
  const api = getElectronApi()
  if (!api?.emailFetchSent) return []
  const response = await api.emailFetchSent()
  if (Array.isArray(response)) return response as MailItem[]
  return response?.ok ? (response.mails as MailItem[]) : []
}

export async function emailRuntimeFetchTrash(options?: { force?: boolean; limit?: number }): Promise<MailItem[]> {
  if (isWebShim()) {
    try {
      const list = await platformApi.email.listMessages('trash', options)
      return list.map((s) => summaryToMailItem(s, 'trash'))
    } catch {
      return []
    }
  }
  const api = getElectronApi()
  if (!api?.emailFetchTrash) return []
  const response = await api.emailFetchTrash()
  if (Array.isArray(response)) return response as MailItem[]
  return response?.ok ? (response.mails as MailItem[]) : []
}

export async function emailRuntimeSendPlain(input: EmailSendInput): Promise<void> {
  if (isWebShim()) {
    const res = await platformApi.email.sendMessage(input)
    if (!res.ok) throw new Error(res.message || '发送失败')
    return
  }
  throw new Error('请使用 Electron emailSend')
}

export async function emailRuntimeSendReply(options: {
  to: string
  subject: string
  body: string
}): Promise<void> {
  if (isWebShim()) {
    const res = await platformApi.email.sendMessage({
      to: options.to,
      subject: options.subject,
      body: options.body,
    })
    if (!res.ok) throw new Error(res.message || '发送失败')
    return
  }
  throw new Error('请使用 Electron emailSend')
}

export function emailRuntimeSupportsAttachments(): boolean {
  return !isWebShim()
}

export async function emailRuntimeStartTriage(options?: {
  limit?: number
  messageIds?: string[]
  force?: boolean
}): Promise<{ taskId: string }> {
  if (!isWebShim()) {
    throw new Error('Electron 邮件整理继续使用本地 MailTriageContext。')
  }
  const token = readAuthToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const response = await fetch('/api/email/triage/start', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      limit: options?.limit ?? 30,
      messageIds: options?.messageIds,
      force: options?.force,
    }),
  })
  const body = await response.json().catch(() => ({ error: `HTTP ${response.status}` })) as { taskId?: string; error?: string }
  if (!response.ok || !body.taskId) {
    throw new Error(body.error || `邮件整理任务启动失败 (${response.status})`)
  }
  return { taskId: body.taskId }
}

export async function emailRuntimeGetTriageTask(taskId: string): Promise<EmailAnalysisTaskSnapshot> {
  const token = readAuthToken()
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  const response = await fetch(`/api/email/triage/tasks/${taskId}`, { headers })
  const body = await response.json().catch(() => ({ error: `HTTP ${response.status}` })) as EmailAnalysisTaskSnapshot & { error?: string }
  if (!response.ok) {
    throw new Error(String(body.error || `邮件整理任务查询失败 (${response.status})`))
  }
  return body
}

export async function emailRuntimeCancelTriageTask(taskId: string): Promise<void> {
  const token = readAuthToken()
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  const response = await fetch(`/api/email/triage/tasks/${taskId}/cancel`, { method: 'POST', headers })
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: `HTTP ${response.status}` })) as { error?: string }
    throw new Error(body.error || `邮件整理任务取消失败 (${response.status})`)
  }
}
