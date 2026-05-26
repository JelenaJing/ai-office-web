/**
 * 从文稿工作台跳转到「汇报」生成页时携带的输入。
 */

export interface PendingReportFromDocument {
  title: string
  inputMarkdown: string
  prompt: string
}

let _pending: PendingReportFromDocument | null = null

export function setPendingReportFromDocument(payload: PendingReportFromDocument): void {
  _pending = payload
}

export function peekPendingReportFromDocument(): PendingReportFromDocument | null {
  return _pending
}

export function consumePendingReportFromDocument(): PendingReportFromDocument | null {
  const data = _pending
  _pending = null
  return data
}
