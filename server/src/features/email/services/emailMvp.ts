import { ImapFlow } from 'imapflow'
import nodemailer from 'nodemailer'
import { simpleParser } from 'mailparser'
import type { StoredEmailAccount } from './emailStore'

function normalizeMailboxError(err: unknown): string {
  const raw = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
  const lower = raw.toLowerCase()
  if (lower.includes('authenticationfailed') || lower.includes('auth') || lower.includes('invalid login')) {
    return `AUTHENTICATIONFAILED: ${raw}`
  }
  if (lower.includes('econnrefused')) return `ECONNREFUSED: ${raw}`
  if (lower.includes('etimedout') || lower.includes('timeout')) return `ETIMEDOUT: ${raw}`
  if (lower.includes('certificate') || lower.includes('self-signed') || lower.includes('unable to verify')) return `certificate: ${raw}`
  if (lower.includes('wrong version number')) return `SSL wrong version number: ${raw}`
  if (lower.includes('starttls')) return `STARTTLS unsupported: ${raw}`
  return raw
}

function imapOptions(account: StoredEmailAccount) {
  return {
    host: account.imapHost,
    port: account.imapPort,
    secure: account.imapSecure,
    doSTARTTLS: account.imapTlsMode === 'starttls' ? true : account.imapTlsMode === 'none' ? false : undefined,
    auth: { user: account.user, pass: account.password },
    logger: false as const,
    connectionTimeout: Number(process.env.EMAIL_LOGIN_CONNECT_TIMEOUT_MS || 8000),
    greetingTimeout: Number(process.env.EMAIL_LOGIN_GREETING_TIMEOUT_MS || 8000),
    socketTimeout: Number(process.env.EMAIL_LOGIN_SOCKET_TIMEOUT_MS || 12000),
    tls: { rejectUnauthorized: !account.allowSelfSignedCerts },
  }
}

function smtpOptions(account: StoredEmailAccount) {
  return {
    host: account.smtpHost,
    port: account.smtpPort,
    secure: account.smtpSecure,
    requireTLS: account.smtpTlsMode === 'starttls',
    ignoreTLS: account.smtpTlsMode === 'none',
    auth: { user: account.user, pass: account.password },
    connectionTimeout: Number(process.env.EMAIL_LOGIN_CONNECT_TIMEOUT_MS || 8000),
    greetingTimeout: Number(process.env.EMAIL_LOGIN_GREETING_TIMEOUT_MS || 8000),
    socketTimeout: Number(process.env.EMAIL_LOGIN_SOCKET_TIMEOUT_MS || 12000),
    tls: { rejectUnauthorized: !account.allowSelfSignedCerts },
  }
}

function createImapClient(account: StoredEmailAccount): ImapFlow {
  const client = new ImapFlow(imapOptions(account))
  client.on('error', () => {
    // ImapFlow may emit after a failed connect even when the promise is caught.
  })
  return client
}

export async function testEmailAccount(account: StoredEmailAccount): Promise<string> {
  const client = createImapClient(account)
  await client.connect()
  await client.logout()
  return 'IMAP 连接成功'
}

export interface MailboxCredentialTest {
  ok: boolean
  imap: { ok: boolean; message: string }
  smtp: { ok: boolean; message: string }
  error?: string
}

export async function testMailboxCredential(
  account: StoredEmailAccount,
  password: string,
): Promise<MailboxCredentialTest> {
  const testAccount = { ...account, password }
  const result: MailboxCredentialTest = {
    ok: false,
    imap: { ok: false, message: '未测试' },
    smtp: { ok: false, message: '未测试' },
  }

  try {
    const client = createImapClient(testAccount)
    await client.connect()
    await client.logout()
    result.imap = { ok: true, message: 'IMAP 连接成功' }
  } catch (err) {
    result.imap = { ok: false, message: normalizeMailboxError(err) }
    result.error = result.imap.message
    return result
  }

  try {
    const transport = nodemailer.createTransport(smtpOptions(testAccount))
    await transport.verify()
    result.smtp = { ok: true, message: 'SMTP 连接成功' }
  } catch (err) {
    result.smtp = { ok: false, message: normalizeMailboxError(err) }
    result.error = result.smtp.message
    return result
  }

  result.ok = true
  return result
}

export interface MailSummary {
  id: string
  from: string
  subject: string
  timestamp: string
  unread: boolean
  preview: string
  attachmentCount: number
}

export interface MailAttachmentSummary {
  id: string
  filename: string
  contentType: string
  size: number
}

export interface MailAttachmentContent extends MailAttachmentSummary {
  content: Buffer
}

interface ParsedMailAttachment {
  contentId?: string
  cid?: string
  filename?: string
  contentType?: string
  size?: number
  content: Buffer
}

function parsedAttachments(parsed: unknown): ParsedMailAttachment[] {
  const record = parsed && typeof parsed === 'object' ? parsed as { attachments?: unknown } : {}
  return Array.isArray(record.attachments)
    ? record.attachments.filter((item): item is ParsedMailAttachment => Boolean(item && typeof item === 'object' && Buffer.isBuffer((item as ParsedMailAttachment).content)))
    : []
}

export async function fetchInbox(
  account: StoredEmailAccount,
  limit = 30,
): Promise<MailSummary[]> {
  const client = createImapClient(account)
  await client.connect()
  const lock = await client.getMailboxLock('INBOX')
  const out: MailSummary[] = []
  try {
    const uids = await client.search({ seen: false }, { uid: true })
    const all = await client.search({ all: true }, { uid: true })
    const pick = [...new Set([...(uids || []), ...(all || [])])].slice(-limit)
    for (const uid of pick.reverse()) {
      const msg = await client.fetchOne(uid, { envelope: true, source: true }, { uid: true })
      if (!msg) continue
      let preview = ''
      const env = msg.envelope
      if (msg.source) {
        const parsed = await simpleParser(msg.source)
        preview = (parsed.text || parsed.html || '').slice(0, 200)
        const attachments = parsedAttachments(parsed)
        out.push({
          id: String(uid),
          from: env?.from?.[0]?.address || env?.from?.[0]?.name || '',
          subject: env?.subject || '(无主题)',
          timestamp: env?.date?.toISOString() || new Date().toISOString(),
          unread: !msg.flags?.has('\\Seen'),
          preview,
          attachmentCount: attachments.length,
        })
        continue
      }
      out.push({
        id: String(uid),
        from: env?.from?.[0]?.address || env?.from?.[0]?.name || '',
        subject: env?.subject || '(无主题)',
        timestamp: env?.date?.toISOString() || new Date().toISOString(),
        unread: !msg.flags?.has('\\Seen'),
        preview,
        attachmentCount: 0,
      })
    }
  } finally {
    lock.release()
    await client.logout()
  }
  return out
}

export async function fetchMessage(
  account: StoredEmailAccount,
  uid: string,
): Promise<{ id: string; from: string; to: string; subject: string; body: string; timestamp: string; attachments: MailAttachmentSummary[] }> {
  const client = createImapClient(account)
  await client.connect()
  const lock = await client.getMailboxLock('INBOX')
  try {
    const msg = await client.fetchOne(
      Number(uid),
      { envelope: true, source: true },
      { uid: true },
    )
    if (!msg || !msg.source) {
      throw new Error('邮件不存在')
    }
    const parsed = await simpleParser(msg.source)
    const env = msg.envelope
    const attachments = parsedAttachments(parsed).map((attachment, index) => ({
      id: attachment.contentId || attachment.cid || String(index),
      filename: attachment.filename || `attachment-${index + 1}`,
      contentType: attachment.contentType || 'application/octet-stream',
      size: attachment.size || attachment.content.length,
    }))
    return {
      id: uid,
      from: env?.from?.[0]?.address || '',
      to: env?.to?.[0]?.address || account.user,
      subject: env?.subject || '',
      body: parsed.text || parsed.html || '',
      timestamp: env?.date?.toISOString() || new Date().toISOString(),
      attachments,
    }
  } finally {
    lock.release()
    await client.logout()
  }
}

export async function fetchMessageAttachment(
  account: StoredEmailAccount,
  uid: string,
  attachmentId: string,
): Promise<MailAttachmentContent> {
  const client = createImapClient(account)
  await client.connect()
  const lock = await client.getMailboxLock('INBOX')
  try {
    const msg = await client.fetchOne(
      Number(uid),
      { source: true },
      { uid: true },
    )
    if (!msg || !msg.source) {
      throw new Error('邮件不存在')
    }
    const parsed = await simpleParser(msg.source)
    const attachment = parsedAttachments(parsed).find((item, index) => (
      item.contentId === attachmentId
        || item.cid === attachmentId
        || String(index) === attachmentId
        || item.filename === attachmentId
    ))
    if (!attachment) {
      throw new Error('附件不存在')
    }
    return {
      id: attachment.contentId || attachment.cid || attachmentId,
      filename: attachment.filename || 'attachment.bin',
      contentType: attachment.contentType || 'application/octet-stream',
      size: attachment.size || attachment.content.length,
      content: attachment.content,
    }
  } finally {
    lock.release()
    await client.logout()
  }
}

export async function sendPlainEmail(
  account: StoredEmailAccount,
  input: { to: string; subject: string; body: string },
): Promise<void> {
  const transport = nodemailer.createTransport(smtpOptions(account))
  await transport.sendMail({
    from: account.displayName
      ? `"${account.displayName}" <${account.user}>`
      : account.user,
    to: input.to,
    subject: input.subject,
    text: input.body,
  })
}
