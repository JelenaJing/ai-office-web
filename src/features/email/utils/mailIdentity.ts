import type { MailItem } from '../../../types/email'

const SEEN_FLAG = '\\Seen'

function toSafeString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

export function getMailKey(mail: Pick<MailItem, 'accountId' | 'folder' | 'uidValidity' | 'uid' | 'id' | 'messageId'>): string {
  return [
    toSafeString(mail.accountId),
    toSafeString(mail.folder),
    toSafeString(mail.uidValidity),
    toSafeString(mail.uid || mail.id || mail.messageId),
  ].join(':')
}

export function getMailTimestamp(mail: Pick<MailItem, 'receivedAt' | 'internalDate' | 'date' | 'sentAt' | 'createdAt'>): number {
  const value =
    mail.receivedAt ||
    mail.internalDate ||
    mail.date ||
    mail.sentAt ||
    mail.createdAt

  const time = value ? new Date(value).getTime() : 0
  return Number.isFinite(time) ? time : 0
}

export function sortMailsByTimeDesc<T extends Pick<MailItem, 'accountId' | 'folder' | 'uidValidity' | 'uid' | 'id' | 'messageId' | 'receivedAt' | 'internalDate' | 'date' | 'sentAt' | 'createdAt'>>(mails: T[]): T[] {
  return [...mails].sort((a, b) => {
    const delta = getMailTimestamp(b) - getMailTimestamp(a)
    if (delta !== 0) return delta
    return getMailKey(a).localeCompare(getMailKey(b))
  })
}

export function extractLegacyMailId(mailKeyOrId: string): string {
  if (!mailKeyOrId.includes(':')) return mailKeyOrId
  const parts = mailKeyOrId.split(':')
  return parts[parts.length - 1] || mailKeyOrId
}

export function normalizeMailReadState(mail: Pick<MailItem, 'flags' | 'isRead' | 'unread'>): { flags: string[]; isRead: boolean; unread: boolean } {
  const flags = Array.isArray(mail.flags)
    ? mail.flags.map((flag) => String(flag))
    : []
  const hasSeenFlag = flags.includes(SEEN_FLAG)

  const isRead = flags.length > 0
    ? hasSeenFlag
    : typeof mail.isRead === 'boolean'
      ? mail.isRead
      : typeof mail.unread === 'boolean'
        ? !mail.unread
        : false

  return {
    flags,
    isRead,
    unread: !isRead,
  }
}

export function normalizeMailBase(mail: MailItem, accountId?: string): MailItem {
  const readState = normalizeMailReadState(mail)
  const normalized: MailItem = {
    ...mail,
    accountId: mail.accountId || accountId || '',
    folder: mail.folder || 'inbox',
    uid: mail.uid || mail.id || mail.messageId,
    uidValidity: mail.uidValidity || '',
    snippet: mail.snippet || mail.bodyPreview || '',
    receivedAt: mail.receivedAt || mail.timestamp || mail.date || mail.internalDate,
    internalDate: mail.internalDate || mail.receivedAt || mail.timestamp || mail.date,
    date: mail.date || mail.receivedAt || mail.timestamp,
    sentAt: mail.sentAt || (mail.folder === 'sent' ? (mail.timestamp || mail.date || mail.receivedAt) : undefined),
    createdAt: mail.createdAt || mail.receivedAt || mail.internalDate || mail.date || mail.sentAt || mail.timestamp,
    timestamp: mail.timestamp || mail.receivedAt || mail.internalDate || mail.date || mail.sentAt || mail.createdAt || '',
    flags: readState.flags,
    isRead: readState.isRead,
    unread: readState.unread,
  }
  normalized.mailKey = getMailKey(normalized)
  return normalized
}

export function mergeFetchedMail(existing: MailItem | undefined, incoming: MailItem, accountId?: string): MailItem {
  const normalizedIncoming = normalizeMailBase(incoming, accountId)
  if (!existing) return normalizedIncoming

  return normalizeMailBase({
    ...existing,
    ...normalizedIncoming,
    body: existing.body || normalizedIncoming.body,
    bodyText: existing.bodyText || normalizedIncoming.bodyText,
    bodyHtml: existing.bodyHtml || normalizedIncoming.bodyHtml,
    htmlBody: existing.htmlBody || normalizedIncoming.htmlBody,
    attachments: existing.attachments || normalizedIncoming.attachments,
    to: existing.to || normalizedIncoming.to,
    toName: existing.toName || normalizedIncoming.toName,
  }, accountId)
}

export function mergeMailDetail(existing: MailItem, detail: MailItem): MailItem {
  return normalizeMailBase({
    ...existing,
    body: detail.body,
    bodyText: detail.bodyText ?? existing.bodyText,
    bodyPreview: detail.bodyPreview ?? existing.bodyPreview,
    bodyFormat: detail.bodyFormat ?? existing.bodyFormat,
    bodyHtml: detail.bodyHtml ?? existing.bodyHtml,
    htmlBody: detail.htmlBody ?? existing.htmlBody,
    to: detail.to || existing.to,
    toName: detail.toName || existing.toName,
    attachments: detail.attachments ?? existing.attachments,
    snippet: existing.snippet || detail.snippet || detail.bodyPreview || existing.bodyPreview,
    messageId: detail.messageId || existing.messageId,
  }, existing.accountId)
}

export function formatMailDebugEntry(mail: MailItem) {
  return {
    subject: mail.subject,
    uid: mail.uid || mail.id,
    receivedAt: mail.receivedAt || mail.internalDate || mail.date || null,
    timestamp: getMailTimestamp(mail),
    flags: mail.flags ?? [],
    isRead: mail.isRead,
    unread: mail.unread,
    mailKey: mail.mailKey || getMailKey(mail),
  }
}
