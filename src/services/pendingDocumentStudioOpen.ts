/**
 * Web 文稿中心（/document）打开意图：邮件附件、资源文件等。
 */

export type PendingDocumentStudioOpenSource =
  | 'email-attachment'
  | 'resource-file'
  | 'manual-upload'

export type PendingDocumentStudioOpen = {
  source: PendingDocumentStudioOpenSource
  fileName: string
  mimeType?: string
  fileId?: string
  artifactId?: string
  extractedTextPreview?: string
  /** docx 等可直接导入编辑器 */
  importAsEditor?: boolean
  emailId?: string
  attachmentId?: string
  emailSubject?: string
  /** 非致命提示（如 PDF 暂不支持抽取） */
  userNotice?: string
}

let _pending: PendingDocumentStudioOpen | null = null

export function setPendingDocumentStudioOpen(intent: PendingDocumentStudioOpen): void {
  _pending = intent
}

export function peekPendingDocumentStudioOpen(): PendingDocumentStudioOpen | null {
  return _pending
}

export function consumePendingDocumentStudioOpen(): PendingDocumentStudioOpen | null {
  const data = _pending
  _pending = null
  return data
}
