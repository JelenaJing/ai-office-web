import type { Artifact } from '../../../platform/types'
import { resolveWebApiUrl } from '../../../runtime/apiBase'
import type { PendingDocumentStudioOpen } from '../../../services/pendingDocumentStudioOpen'

function authHeaders(): Record<string, string> {
  const keys = ['aios_auth_token', 'aios_itoken', 'ai_office_internal_token'] as const
  for (const key of keys) {
    const token = localStorage.getItem(key)
    if (token) return { Authorization: `Bearer ${token}` }
  }
  return {}
}

function extensionOf(name: string): string {
  const lower = name.toLowerCase()
  const dot = lower.lastIndexOf('.')
  return dot >= 0 ? lower.slice(dot + 1) : ''
}

export async function saveEmailAttachmentForStudio(input: {
  messageId: string
  attachmentId: string
  fileName: string
  mimeType?: string
  workspacePath: string
  emailSubject?: string
}): Promise<PendingDocumentStudioOpen> {
  const res = await fetch(
    resolveWebApiUrl(
      `/api/email/messages/${encodeURIComponent(input.messageId)}/attachments/${encodeURIComponent(input.attachmentId)}/artifact`,
    ),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify({ workspacePath: input.workspacePath }),
    },
  )
  const payload = await res.json().catch(() => ({})) as {
    success?: boolean
    error?: string
    message?: string
    artifact?: Artifact
  }
  if (!res.ok || payload.success === false) {
    throw new Error(payload.error || payload.message || `保存附件失败 (${res.status})`)
  }
  const artifact = payload.artifact
  if (!artifact?.id) {
    throw new Error('保存附件成功但未返回资源记录')
  }

  const ext = extensionOf(input.fileName)
  if (ext === 'pdf') {
    return {
      source: 'email-attachment',
      fileName: input.fileName,
      mimeType: input.mimeType,
      artifactId: artifact.id,
      emailId: input.messageId,
      attachmentId: input.attachmentId,
      emailSubject: input.emailSubject,
      userNotice: 'PDF 暂未支持正文抽取，可先转换为 Word 或文本后上传。',
    }
  }

  const importAsEditor = ext === 'docx' || ext === 'doc'
  return {
    source: 'email-attachment',
    fileName: input.fileName,
    mimeType: input.mimeType,
    artifactId: artifact.id,
    importAsEditor,
    emailId: input.messageId,
    attachmentId: input.attachmentId,
    emailSubject: input.emailSubject,
  }
}
