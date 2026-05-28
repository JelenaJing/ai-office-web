import {
  createEditableStateFromTaskResult,
  updateEditableStateFromHtml,
} from '../../document/services/documentDraftTransforms'
import type { DocumentTaskResult, EditableDocumentState } from '../../document/services/documentWorkbenchApi'
import { wrapDocumentBodyHtml } from '../../document/services/documentContentApply'

export { createEditableStateFromTaskResult, updateEditableStateFromHtml }

const DEFAULT_SECTION_ID = 'section-main'

function escapeHtml(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function createBlankWorkbenchHtml(title = ''): string {
  return wrapDocumentBodyHtml(title, '<p data-block-id="body-paragraph-1" data-role="paragraph"><br /></p>')
}

function createLocalDraft(engine: string) {
  return {
    id: `local-${Date.now()}`,
    title: '',
    type: 'report',
    language: 'zh-CN',
    outline: [{ id: 'outline-1', level: 1, title: '正文' }],
    sections: [{ id: DEFAULT_SECTION_ID, title: '正文', content: '' }],
    metadata: { engine, knowledgeRefs: [] },
  }
}

export function createEmptyWorkbenchState(engine = 'minimax_docx'): EditableDocumentState {
  const draft = createLocalDraft(engine)
  return {
    documentId: null,
    userFileId: null,
    artifactId: null,
    exportUrl: null,
    title: '',
    html: createBlankWorkbenchHtml(),
    documentArtifact: undefined,
    markdown: '',
    documentDraft: draft,
    outline: draft.outline,
    selectedSectionId: DEFAULT_SECTION_ID,
    selectedBlockId: 'document-title',
    selectedBlockRole: 'title',
    selectedBlockText: '',
    selectedText: '',
    selectionRange: undefined,
    dirty: false,
    saving: false,
    lastSavedAt: undefined,
    engine,
  }
}

export function editableStateFromTaskResult(result: DocumentTaskResult): EditableDocumentState {
  return createEditableStateFromTaskResult({
    documentId: result.documentId,
    artifactId: result.artifactId,
    exportUrl: result.exportUrl,
    engine: result.engine,
    fallbackFrom: result.fallbackFrom,
    fallbackReason: result.fallbackReason,
    document: result.document,
    html: result.html,
    documentArtifact: result.documentArtifact,
    userFileId: result.userFileId,
  })
}

export function buildDownloadableHtmlDocument(title: string, articleHtml: string): string {
  const safeTitle = escapeHtml(title || '未命名文稿')
  const body = articleHtml.trim() || '<p></p>'
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle}</title>
  <style>
    body { font-family: "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif; max-width: 794px; margin: 2rem auto; padding: 0 1.5rem; line-height: 1.85; color: #1e293b; background: #fff; }
    h1 { text-align: center; font-size: 1.75rem; margin-bottom: 2rem; color: #0f172a; }
    h2, h3 { color: #173f69; margin: 1.5rem 0 0.75rem; }
    p { text-indent: 2em; margin: 0 0 1rem; }
    ul, ol { margin: 0 0 1rem; padding-left: 1.75rem; }
    blockquote { border-left: 4px solid #cbd5e1; margin: 1rem 0; padding: 0.5rem 1rem; color: #475569; background: #f8fafc; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    th, td { border: 1px solid #bfd0e2; padding: 8px 10px; }
    th { background: #edf4fb; }
  </style>
</head>
<body>
${body}
</body>
</html>`
}

export function downloadHtmlFile(filename: string, html: string): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
