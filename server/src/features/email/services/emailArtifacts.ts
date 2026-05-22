import { saveSkillArtifact } from '../../../lib/skillArtifact'
import type { Artifact } from '../../../artifacts/ArtifactStore'

export interface EmailDraftArtifactInput {
  userId: string
  workspacePath: string
  emailId?: string
  to: string
  subject: string
  body: string
}

export interface EmailAttachmentArtifactInput {
  userId: string
  workspacePath: string
  emailId: string
  filename: string
  contentType?: string
  content: Buffer
}

export interface EmailArtifactRelationship {
  emailId: string
  artifactId: string
  relation: 'email_draft' | 'attachment'
  filename?: string
}

function safeFilename(value: string, fallback: string): string {
  const trimmed = value.trim() || fallback
  return trimmed.replace(/[^a-zA-Z0-9_\-\.\u4e00-\u9fa5]+/g, '_').slice(0, 120) || fallback
}

export function buildSalutation(rawRecipient: string): string {
  const recipient = rawRecipient.trim()
  if (!recipient) return '您好'
  const name = recipient.includes('<')
    ? recipient.split('<')[0].replace(/["']/g, '').trim()
    : recipient.split('@')[0].replace(/[._-]+/g, ' ').trim()
  return name ? `${name} 您好` : '您好'
}

export function resolveDryRunRecipients(input: unknown): Array<{ email: string; salutation: string }> {
  const raw = Array.isArray(input)
    ? input
    : typeof input === 'string'
      ? input.split(/[,;\n]/)
      : []
  return raw
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .map((email) => ({ email, salutation: buildSalutation(email) }))
}

export function createEmailDraftArtifact(input: EmailDraftArtifactInput): { artifact: Artifact; relationship: EmailArtifactRelationship } {
  const subject = input.subject.trim() || '邮件回复草稿'
  const body = [
    `To: ${input.to.trim()}`,
    `Subject: ${subject}`,
    input.emailId ? `Source-Email-Id: ${input.emailId}` : undefined,
    '',
    input.body,
  ].filter((line) => line !== undefined).join('\n')
  const artifact = saveSkillArtifact({
    userId: input.userId,
    workspacePath: input.workspacePath,
    skillId: 'web.email.draft',
    type: 'email_draft',
    title: subject,
    filename: safeFilename(`${subject}.txt`, 'email-draft.txt'),
    format: 'txt',
    content: body,
  })
  return {
    artifact,
    relationship: {
      emailId: input.emailId || 'manual',
      artifactId: artifact.id,
      relation: 'email_draft',
    },
  }
}

export function createEmailAttachmentArtifact(input: EmailAttachmentArtifactInput): { artifact: Artifact; relationship: EmailArtifactRelationship } {
  const filename = safeFilename(input.filename, 'email-attachment.bin')
  const artifact = saveSkillArtifact({
    userId: input.userId,
    workspacePath: input.workspacePath,
    skillId: 'web.email.attachment.open',
    type: 'email_attachment',
    title: filename,
    filename,
    format: filename.includes('.') ? filename.split('.').pop() || 'bin' : 'bin',
    content: input.content,
  })
  return {
    artifact,
    relationship: {
      emailId: input.emailId,
      artifactId: artifact.id,
      relation: 'attachment',
      filename,
    },
  }
}
