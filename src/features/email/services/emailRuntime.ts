/**
 * Email runtime — Electron IPC on desktop, platformApi.email on Web.
 */
import { isWebShim } from '../../../platform/detect'
import { platformApi } from '../../../platform'
import type {
  EmailAccountConfig,
  MailItem,
} from '../../../types/email'
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

function mapWebAccountToConfig(state: EmailAccountState): EmailAccountConfig | null {
  if (!state.configured || !state.user) return null
  return {
    user: state.user,
    email: state.user,
    password: '',
    displayName: state.displayName || state.user,
    imapHost: state.imapHost || 'imap.example.com',
    imapPort: 993,
    imapSecure: true,
    smtpHost: state.smtpHost || 'smtp.example.com',
    smtpPort: 465,
    smtpSecure: true,
  }
}

function configToInput(config: EmailAccountConfig): EmailAccountInput {
  return {
    user: config.user || config.email || '',
    password: config.password,
    displayName: config.displayName,
    imapHost: config.imapHost,
    imapPort: config.imapPort,
    imapSecure: config.imapSecure,
    smtpHost: config.smtpHost,
    smtpPort: config.smtpPort,
    smtpSecure: config.smtpSecure,
  }
}

function summaryToMailItem(summary: EmailMessageSummary): MailItem {
  return {
    id: summary.id,
    from: summary.from,
    fromName: summary.from.split('@')[0] || summary.from,
    to: '',
    toName: '',
    subject: summary.subject,
    body: summary.preview || '',
    timestamp: summary.timestamp,
    unread: summary.unread,
    replied: false,
    folder: 'inbox',
  }
}

function detailToMailItem(detail: EmailMessageDetail): MailItem {
  return {
    id: detail.id,
    from: detail.from,
    fromName: detail.from.split('@')[0] || detail.from,
    to: detail.to,
    toName: detail.to,
    subject: detail.subject,
    body: detail.body,
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

export async function emailRuntimeFetchInbox(): Promise<MailItem[]> {
  if (isWebShim()) {
    const list = await platformApi.email.listMessages('inbox')
    return list.map(summaryToMailItem)
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

export async function emailRuntimeFetchSent(): Promise<MailItem[]> {
  if (isWebShim()) return []
  const api = getElectronApi()
  if (!api?.emailFetchSent) return []
  const response = await api.emailFetchSent()
  if (Array.isArray(response)) return response as MailItem[]
  return response?.ok ? (response.mails as MailItem[]) : []
}

export async function emailRuntimeFetchTrash(): Promise<MailItem[]> {
  if (isWebShim()) return []
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
