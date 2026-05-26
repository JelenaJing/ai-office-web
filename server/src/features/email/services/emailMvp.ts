import { ImapFlow } from 'imapflow'
import nodemailer from 'nodemailer'
import { simpleParser } from 'mailparser'
import { stringifyJsonSafe } from '../../../lib/jsonSafe'
import type { StoredEmailAccount } from './emailStore'
import { normalizeEmailBody, type EmailBodyFormat } from './emailBodyNormalization'
import { detectFolderRole } from './folderMappingStore'
import type { MailFolderMapping } from './folderMappingStore'

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
  uid: string
  uidValidity?: string
  from: string
  subject: string
  timestamp: string
  snippet: string
  receivedAt?: string
  internalDate?: string
  date?: string
  sentAt?: string
  createdAt?: string
  flags: string[]
  isRead: boolean
  unread: boolean
  preview: string
  bodyPreview: string
  bodyFormat: EmailBodyFormat
  attachmentCount: number
  messageId?: string
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

function parsedPartAsString(parsed: unknown, key: 'text' | 'html'): string {
  const value = parsed && typeof parsed === 'object'
    ? (parsed as { text?: unknown; html?: unknown })[key]
    : undefined
  if (typeof value === 'string') return value
  if (Buffer.isBuffer(value)) return value.toString('utf-8')
  return ''
}

function normalizeParsedMailBody(parsed: unknown) {
  return normalizeEmailBody({
    text: parsedPartAsString(parsed, 'text'),
    html: parsedPartAsString(parsed, 'html'),
  })
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
      let bodyPreview = ''
      let bodyFormat: EmailBodyFormat = 'text'
      const env = msg.envelope
      if (msg.source) {
        const parsed = await simpleParser(msg.source)
        const normalized = normalizeParsedMailBody(parsed)
        preview = normalized.bodyPreview
        bodyPreview = normalized.bodyPreview
        bodyFormat = normalized.bodyFormat
        const attachments = parsedAttachments(parsed)
        out.push({
          id: String(uid),
          from: env?.from?.[0]?.address || env?.from?.[0]?.name || '',
          subject: env?.subject || '(无主题)',
          timestamp: env?.date?.toISOString() || new Date().toISOString(),
          unread: !msg.flags?.has('\\Seen'),
          preview,
          bodyPreview,
          bodyFormat,
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
        bodyPreview,
        bodyFormat,
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
): Promise<{
  id: string
  uid: string
  uidValidity?: string
  from: string
  to: string
  subject: string
  body: string
  bodyText: string
  bodyHtml?: string | null
  htmlBody?: string
  bodyPreview: string
  bodyFormat: EmailBodyFormat
  bodySource: 'text' | 'html' | 'mixed' | 'empty'
  timestamp: string
  snippet: string
  receivedAt?: string
  internalDate?: string
  date?: string
  createdAt?: string
  flags: string[]
  isRead: boolean
  unread: boolean
  messageId?: string
  attachments: MailAttachmentSummary[]
}> {
  const client = createImapClient(account)
  await client.connect()
  const lock = await client.getMailboxLock('INBOX')
  try {
    const mailbox = client.mailbox
    const msg = await client.fetchOne(
      Number(uid),
      { uid: true, envelope: true, flags: true, internalDate: true, source: true },
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
    const normalized = normalizeParsedMailBody(parsed)
    const receivedAt = env?.date?.toISOString()
    const internalDate = msg.internalDate?.toISOString()
    const flags = [...(msg.flags ?? [])].map((flag) => String(flag))
    const isRead = msg.flags?.has('\\Seen') ?? false
    return {
      id: String(msg.uid ?? uid),
      uid: String(msg.uid ?? uid),
      uidValidity: mailbox && 'uidValidity' in mailbox ? stringifyImapScalar((mailbox as { uidValidity?: unknown }).uidValidity) : undefined,
      from: env?.from?.[0]?.address || '',
      to: env?.to?.[0]?.address || account.user,
      subject: env?.subject || '',
      body: normalized.bodyText,
      bodyText: normalized.bodyText,
      bodyHtml: normalized.bodyHtml,
      htmlBody: normalized.bodyHtml || undefined,
      bodyPreview: normalized.bodyPreview,
      bodyFormat: normalized.bodyFormat,
      bodySource: normalized.hasHtml ? (normalized.hasText ? 'mixed' : 'html') : normalized.bodyText ? 'text' : 'empty',
      timestamp: receivedAt || internalDate || new Date().toISOString(),
      snippet: normalized.bodyPreview,
      receivedAt,
      internalDate,
      date: receivedAt,
      createdAt: internalDate || receivedAt,
      flags,
      isRead,
      unread: !isRead,
      messageId: env?.messageId ? String(env.messageId) : undefined,
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
): Promise<{ messageId: string; raw: Buffer }> {
  const transport = nodemailer.createTransport(smtpOptions(account))
  const info = await transport.sendMail({
    from: account.displayName
      ? `"${account.displayName}" <${account.user}>`
      : account.user,
    to: input.to,
    subject: input.subject,
    text: input.body,
  })
  // Build raw MIME for APPEND; nodemailer may expose it via envelope/message
  const raw = await buildRawMime(account, input, info.messageId)
  return { messageId: String(info.messageId || ''), raw }
}

async function buildRawMime(
  account: StoredEmailAccount,
  input: { to: string; subject: string; body: string },
  messageId: string,
): Promise<Buffer> {
  const { createTransport } = nodemailer
  const tmp = createTransport({ jsonTransport: true })
  const info = await tmp.sendMail({
    messageId,
    from: account.displayName
      ? `"${account.displayName}" <${account.user}>`
      : account.user,
    to: input.to,
    subject: input.subject,
    text: input.body,
    date: new Date(),
  })
  // jsonTransport stores message in info.message as JSON string
  const parsed = (info as unknown as { message: string }).message
  if (parsed) {
    try {
      const obj = JSON.parse(parsed) as { text?: string }
      if (obj.text) return Buffer.from(obj.text, 'utf-8')
    } catch { /* ignore */ }
  }
  // Fallback: build minimal RFC 2822 message
  const lines = [
    `Message-ID: ${messageId}`,
    `Date: ${new Date().toUTCString()}`,
    `From: ${account.displayName ? `"${account.displayName}" <${account.user}>` : account.user}`,
    `To: ${input.to}`,
    `Subject: ${input.subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    input.body,
  ]
  return Buffer.from(lines.join('\r\n'), 'utf-8')
}

/** IMAP LIST — discover all folders and map to roles. */
export async function fetchFolderList(account: StoredEmailAccount): Promise<MailFolderMapping[]> {
  const client = createImapClient(account)
  await client.connect()
  const mappings: MailFolderMapping[] = []
  try {
    const folders = await client.list()
    for (const folder of folders) {
      const folderPath = folder.path || ''
      const specialUse = typeof folder.specialUse === 'string' ? folder.specialUse : ''
      const role = detectFolderRole(folderPath, specialUse)
      mappings.push({
        accountId: account.user,
        email: account.user,
        role,
        path: folderPath,
        delimiter: folder.delimiter || '/',
        specialUse: specialUse || undefined,
        displayName: folder.name || folderPath,
        updatedAt: new Date().toISOString(),
      })
    }
  } finally {
    await client.logout().catch(() => {})
  }
  // Ensure INBOX is always present
  if (!mappings.find((m) => m.role === 'inbox')) {
    mappings.unshift({
      accountId: account.user,
      email: account.user,
      role: 'inbox',
      path: 'INBOX',
      delimiter: '/',
      displayName: 'INBOX',
      updatedAt: new Date().toISOString(),
    })
  }
  return mappings
}

export interface FetchFolderOptions {
  limit?: number
  force?: boolean
}

export interface FetchFolderLog {
  email: string
  folder: string
  force: boolean
  selectedFolderPath: string
  uidValidity?: string
  uidNext?: string
  fetchedCount: number
  newestDate?: string
  newestSubject?: string
}

function stringifyImapScalar(value: unknown): string | undefined {
  if (typeof value === 'bigint' || typeof value === 'number' || typeof value === 'string') {
    return String(value)
  }
  return undefined
}

/** Fetch emails from a specific IMAP folder path with logging. */
export async function fetchFolder(
  account: StoredEmailAccount,
  folderPath: string,
  options: FetchFolderOptions = {},
): Promise<{ mails: MailSummary[]; log: FetchFolderLog }> {
  const limit = options.limit ?? 30
  const force = options.force ?? false
  const client = createImapClient(account)
  await client.connect()
  const lock = await client.getMailboxLock(folderPath)
  const log: FetchFolderLog = {
    email: account.user,
    folder: folderPath,
    force,
    selectedFolderPath: folderPath,
    fetchedCount: 0,
  }
  const out: MailSummary[] = []
  try {
    // Read mailbox status
    const status = client.mailbox
    if (status) {
      if ('uidValidity' in status) {
        log.uidValidity = stringifyImapScalar((status as { uidValidity?: unknown }).uidValidity)
      }
      if ('uidNext' in status) {
        log.uidNext = stringifyImapScalar((status as { uidNext?: unknown }).uidNext)
      }
    }

    const all = await client.search({ all: true }, { uid: true })
    const pick = (all || []).slice(-limit)
    for (const uid of pick.reverse()) {
      const msg = await client.fetchOne(uid, { uid: true, envelope: true, flags: true, internalDate: true, source: true }, { uid: true })
      if (!msg) continue
      let preview = ''
      let bodyPreview = ''
      let bodyFormat: EmailBodyFormat = 'text'
      const env = msg.envelope
      const receivedAt = env?.date?.toISOString()
      const internalDate = msg.internalDate?.toISOString()
      const flags = [...(msg.flags ?? [])].map((flag) => String(flag))
      const isRead = msg.flags?.has('\\Seen') ?? false
      let attachmentCount = 0
      if (msg.source) {
        const parsed = await simpleParser(msg.source)
        const normalized = normalizeParsedMailBody(parsed)
        preview = normalized.bodyPreview
        bodyPreview = normalized.bodyPreview
        bodyFormat = normalized.bodyFormat
        attachmentCount = parsedAttachments(parsed).length
      }
      out.push({
        id: String(msg.uid ?? uid),
        uid: String(msg.uid ?? uid),
        uidValidity: log.uidValidity,
        from: env?.from?.[0]?.address || env?.from?.[0]?.name || '',
        subject: env?.subject || '(无主题)',
        timestamp: receivedAt || internalDate || new Date().toISOString(),
        snippet: bodyPreview || preview,
        receivedAt,
        internalDate,
        date: receivedAt,
        createdAt: internalDate || receivedAt,
        flags,
        isRead,
        unread: !isRead,
        preview,
        bodyPreview,
        bodyFormat,
        attachmentCount,
        messageId: env?.messageId ? String(env.messageId) : undefined,
      })
    }
    log.fetchedCount = out.length
    if (out.length > 0) {
      log.newestDate = out[0].timestamp
      log.newestSubject = out[0].subject
    }
    console.log('[EmailSync]', stringifyJsonSafe(log))
  } finally {
    lock.release()
    await client.logout().catch(() => {})
  }
  return { mails: out, log }
}

/** IMAP APPEND — save a MIME message to a folder. Returns false if duplicate detected. */
export async function appendToFolder(
  account: StoredEmailAccount,
  folderPath: string,
  rawMime: Buffer,
  messageId: string,
): Promise<{ appended: boolean; duplicate: boolean }> {
  const client = createImapClient(account)
  await client.connect()
  try {
    // Check for duplicate by Message-ID in the folder
    const lock = await client.getMailboxLock(folderPath)
    try {
      if (messageId) {
        const msgIdKey = messageId.replace(/^<|>$/g, '')
        const found = await client.search({ header: { 'Message-ID': msgIdKey } }, { uid: true })
        if (found && found.length > 0) {
          console.log(`[EmailAppend] Duplicate detected in ${folderPath}: ${messageId}`)
          return { appended: false, duplicate: true }
        }
      }
    } finally {
      lock.release()
    }
    await client.append(folderPath, rawMime, ['\\Seen'], new Date())
    console.log(`[EmailAppend] Appended to ${folderPath}: ${messageId}`)
    return { appended: true, duplicate: false }
  } finally {
    await client.logout().catch(() => {})
  }
}
