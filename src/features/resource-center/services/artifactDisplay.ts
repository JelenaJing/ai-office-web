import type { Artifact } from '../../../platform/types'

/** Human-readable label for artifact.type on Web resource center. */
export function artifactTypeLabel(type: string): string {
  switch (type) {
    case 'document':
      return '文稿'
    case 'excel_analysis':
      return '表格分析'
    case 'deck':
    case 'presentation':
      return 'PPT'
    case 'image':
      return '图片'
    case 'report':
    case 'daily_report':
      return '报告'
    case 'email_draft':
      return '邮件草稿'
    case 'decision_package':
      return '决策包'
    default:
      return type || '未知'
  }
}

export function artifactHasExport(artifact: Artifact): boolean {
  return Array.isArray(artifact.exports) && artifact.exports.length > 0
}

/** Preferred download filename: exports[0].filename, else title + inferred ext. */
export function artifactDownloadFilename(artifact: Artifact): string | null {
  const first = artifact.exports?.[0]
  if (first?.filename?.trim()) return first.filename.trim()
  const title = artifact.title?.trim()
  if (!title) return null
  const ext = first?.format === 'xlsx' ? '.xlsx'
    : first?.format === 'pptx' ? '.pptx'
    : first?.format === 'png' ? '.png'
    : '.docx'
  return `${title}${ext}`
}
