import fs from 'fs'
import path from 'path'
import { stringifyJsonSafe } from '../../../lib/jsonSafe'

const EMAIL_ROOT = path.resolve(__dirname, '../../../data/email')

export type FolderRole = 'inbox' | 'sent' | 'drafts' | 'trash' | 'junk' | 'archive' | 'other'

export interface MailFolderMapping {
  accountId: string
  email: string
  role: FolderRole
  path: string
  delimiter: string
  specialUse?: string
  displayName?: string
  updatedAt: string
}

function mappingPath(userId: string): string {
  const safe = userId.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 64)
  return path.join(EMAIL_ROOT, `${safe}_folders.json`)
}

export function saveFolderMappings(userId: string, mappings: MailFolderMapping[]): void {
  fs.mkdirSync(EMAIL_ROOT, { recursive: true })
  fs.writeFileSync(mappingPath(userId), stringifyJsonSafe(mappings, 2), 'utf-8')
}

export function getFolderMappings(userId: string): MailFolderMapping[] {
  const p = mappingPath(userId)
  if (!fs.existsSync(p)) return []
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8')) as MailFolderMapping[]
  } catch {
    return []
  }
}

export function getFolderByRole(userId: string, role: FolderRole): MailFolderMapping | null {
  return getFolderMappings(userId).find((m) => m.role === role) ?? null
}

/** Candidate folder names per role for servers without IMAP special-use */
const SENT_CANDIDATES = [
  'Sent', 'Sent Items', 'Sent Messages',
  '已发送', '已发送邮件', '已发送邮件/Sent Messages',
  'INBOX.Sent', 'INBOX/Sent',
]
const DRAFTS_CANDIDATES = ['Drafts', '草稿', 'INBOX.Drafts', 'INBOX/Drafts']
const TRASH_CANDIDATES = ['Trash', 'Deleted Items', 'Deleted Messages', '已删除', 'INBOX.Trash']
const JUNK_CANDIDATES = ['Junk', 'Spam', 'Junk Email', '垃圾邮件', 'INBOX.Junk']

export function detectFolderRole(folderPath: string, specialUse?: string): FolderRole {
  if (folderPath.toUpperCase() === 'INBOX') return 'inbox'

  if (specialUse) {
    const su = specialUse.toLowerCase()
    if (su.includes('\\sent')) return 'sent'
    if (su.includes('\\drafts')) return 'drafts'
    if (su.includes('\\trash') || su.includes('\\deleted')) return 'trash'
    if (su.includes('\\junk') || su.includes('\\spam')) return 'junk'
    if (su.includes('\\archive') || su.includes('\\all')) return 'archive'
  }

  const name = folderPath.split(/[./]/).pop() || folderPath

  if (SENT_CANDIDATES.some((c) => c.toLowerCase() === folderPath.toLowerCase() || c.toLowerCase() === name.toLowerCase())) return 'sent'
  if (DRAFTS_CANDIDATES.some((c) => c.toLowerCase() === folderPath.toLowerCase() || c.toLowerCase() === name.toLowerCase())) return 'drafts'
  if (TRASH_CANDIDATES.some((c) => c.toLowerCase() === folderPath.toLowerCase() || c.toLowerCase() === name.toLowerCase())) return 'trash'
  if (JUNK_CANDIDATES.some((c) => c.toLowerCase() === folderPath.toLowerCase() || c.toLowerCase() === name.toLowerCase())) return 'junk'

  return 'other'
}
