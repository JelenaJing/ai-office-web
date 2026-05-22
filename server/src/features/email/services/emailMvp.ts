import { ImapFlow } from 'imapflow'
import nodemailer from 'nodemailer'
import { simpleParser } from 'mailparser'
import type { StoredEmailAccount } from './emailStore'

export async function testEmailAccount(account: StoredEmailAccount): Promise<string> {
  const client = new ImapFlow({
    host: account.imapHost,
    port: account.imapPort,
    secure: account.imapSecure,
    auth: { user: account.user, pass: account.password },
    logger: false,
    tls: { rejectUnauthorized: !account.allowSelfSignedCerts },
  })
  await client.connect()
  await client.logout()
  return 'IMAP 连接成功'
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
  const client = new ImapFlow({
    host: account.imapHost,
    port: account.imapPort,
    secure: account.imapSecure,
    auth: { user: account.user, pass: account.password },
    logger: false,
    tls: { rejectUnauthorized: !account.allowSelfSignedCerts },
  })
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
  const client = new ImapFlow({
    host: account.imapHost,
    port: account.imapPort,
    secure: account.imapSecure,
    auth: { user: account.user, pass: account.password },
    logger: false,
    tls: { rejectUnauthorized: !account.allowSelfSignedCerts },
  })
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
  const client = new ImapFlow({
    host: account.imapHost,
    port: account.imapPort,
    secure: account.imapSecure,
    auth: { user: account.user, pass: account.password },
    logger: false,
    tls: { rejectUnauthorized: !account.allowSelfSignedCerts },
  })
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
  const transport = nodemailer.createTransport({
    host: account.smtpHost,
    port: account.smtpPort,
    secure: account.smtpSecure,
    auth: { user: account.user, pass: account.password },
    tls: { rejectUnauthorized: !account.allowSelfSignedCerts },
  })
  await transport.sendMail({
    from: account.displayName
      ? `"${account.displayName}" <${account.user}>`
      : account.user,
    to: input.to,
    subject: input.subject,
    text: input.body,
  })
}
