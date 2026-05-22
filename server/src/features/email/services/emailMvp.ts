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
      if (msg.source) {
        const parsed = await simpleParser(msg.source)
        preview = (parsed.text || parsed.html || '').slice(0, 200)
      }
      const env = msg.envelope
      out.push({
        id: String(uid),
        from: env?.from?.[0]?.address || env?.from?.[0]?.name || '',
        subject: env?.subject || '(无主题)',
        timestamp: env?.date?.toISOString() || new Date().toISOString(),
        unread: !msg.flags?.has('\\Seen'),
        preview,
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
): Promise<{ id: string; from: string; to: string; subject: string; body: string; timestamp: string }> {
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
    return {
      id: uid,
      from: env?.from?.[0]?.address || '',
      to: env?.to?.[0]?.address || account.user,
      subject: env?.subject || '',
      body: parsed.text || parsed.html || '',
      timestamp: env?.date?.toISOString() || new Date().toISOString(),
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
