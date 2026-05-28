import { platformApi } from '../../../platform'
import type { FileEntry } from '../../../platform'
import type { DocumentKnowledgeRefInput } from '../../document/services/documentWorkbenchApi'
import { resolveWebApiUrl } from '../../../runtime/apiBase'

export type StudioAttachmentStatus = 'uploading' | 'ready' | 'failed' | 'unsupported'

export type StudioAttachment = {
  id: string
  name: string
  size: number
  type: string
  status: StudioAttachmentStatus
  fileRef?: string
  extractedTextPreview?: string
  error?: string
}

const TEXT_PREVIEW_MAX = 2400

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

export function isPdfAttachment(name: string): boolean {
  return extensionOf(name) === 'pdf'
}

export function isSupportedStudioUpload(name: string): boolean {
  const ext = extensionOf(name)
  return ext === 'docx' || ext === 'txt' || ext === 'md' || ext === 'markdown' || ext === 'pdf'
}

async function extractUploadText(file: File): Promise<{ preview?: string; error?: string }> {
  const ext = extensionOf(file.name)
  if (ext === 'txt' || ext === 'md' || ext === 'markdown') {
    const text = await file.text()
    const trimmed = text.trim()
    return trimmed ? { preview: trimmed.slice(0, TEXT_PREVIEW_MAX) } : {}
  }
  if (ext === 'docx') {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(resolveWebApiUrl('/api/document-studio/humanize/extract-file'), {
      method: 'POST',
      headers: authHeaders(),
      body: form,
    })
    const payload = await res.json().catch(() => ({})) as { success?: boolean; text?: string; error?: string }
    if (!res.ok || payload.success === false) {
      return { error: payload.error || 'Word 文件解析失败' }
    }
    const text = String(payload.text || '').trim()
    return text ? { preview: text.slice(0, TEXT_PREVIEW_MAX) } : {}
  }
  return {}
}

export async function uploadStudioMaterial(file: File): Promise<StudioAttachment> {
  const id = `att-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
  if (isPdfAttachment(file.name)) {
    return {
      id,
      name: file.name,
      size: file.size,
      type: file.type || 'application/pdf',
      status: 'unsupported',
      error: 'PDF 暂未支持正文抽取，可先转换为 Word 或文本后上传。',
    }
  }
  if (!isSupportedStudioUpload(file.name)) {
    return {
      id,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'failed',
      error: '暂不支持该文件格式，请上传 Word、文本或 Markdown。',
    }
  }

  try {
    const extracted = await extractUploadText(file)
    if (extracted.error) {
      return {
        id,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'failed',
        error: extracted.error,
      }
    }
    const entry = await platformApi.files.upload(file)
    return {
      id,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'ready',
      fileRef: entry.id,
      extractedTextPreview: extracted.preview,
    }
  } catch (error) {
    return {
      id,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'failed',
      error: error instanceof Error ? error.message : '上传失败',
    }
  }
}

export function studioAttachmentToFileEntry(attachment: StudioAttachment): FileEntry | null {
  if (!attachment.fileRef || attachment.status !== 'ready') return null
  return {
    id: attachment.fileRef,
    name: attachment.name,
    path: attachment.fileRef,
    ext: extensionOf(attachment.name),
    size: attachment.size,
    updatedAt: new Date().toISOString(),
  }
}

export function buildAttachmentKnowledgeRefs(
  attachments: StudioAttachment[],
): DocumentKnowledgeRefInput[] {
  return attachments
    .filter((item) => item.status === 'ready' && item.fileRef)
    .map((item) => ({
      kind: 'file' as const,
      id: item.fileRef!,
      label: item.name,
      provider: 'workspace' as const,
      sourceType: 'file' as const,
      sourceId: item.fileRef!,
      trustLevel: 'verified' as const,
      metadata: item.extractedTextPreview
        ? { previewText: item.extractedTextPreview.slice(0, TEXT_PREVIEW_MAX) }
        : undefined,
    }))
}

export function buildAttachmentPromptBlock(attachments: StudioAttachment[]): string {
  const ready = attachments.filter((item) => item.status === 'ready' && item.extractedTextPreview)
  if (ready.length === 0) return ''
  const lines = ready.map((item) => {
    return `【材料：${item.name}】\n${item.extractedTextPreview}`
  })
  return ['【用户上传材料摘要】', ...lines].join('\n\n')
}
