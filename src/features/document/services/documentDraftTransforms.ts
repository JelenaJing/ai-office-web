import type {
  DocumentDraft,
  DocumentDraftCitation,
  DocumentDraftTable,
  EditableDocumentState,
} from './documentWorkbenchApi'

function escapeHtml(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function normalizeText(value: string): string {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function splitParagraphs(value: string): string[] {
  return String(value || '')
    .split(/\n{2,}/)
    .map((item) => normalizeText(item))
    .filter(Boolean)
}

function renderCitations(citations: DocumentDraftCitation[] | undefined): string {
  if (!citations || citations.length === 0) return ''
  return [
    '<blockquote data-block-type="citation-list" class="document-citation-block">',
    ...citations.map((citation) => (
      `<p data-citation-item="true" data-citation-id="${escapeHtml(citation.id)}" data-citation-kind="${escapeHtml(citation.kind)}" data-citation-status="${escapeHtml(citation.citationStatus)}">` +
      `${escapeHtml(citation.label)}${citation.note ? `（${escapeHtml(citation.note)}）` : ''}` +
      '</p>'
    )),
    '</blockquote>',
  ].join('')
}

function renderTables(tables: DocumentDraftTable[] | undefined): string {
  if (!tables || tables.length === 0) return ''
  return tables.map((table) => [
    `<div data-block-type="table" data-table-id="${escapeHtml(table.id)}" class="document-table-block">`,
    table.title ? `<div class="document-table-title">${escapeHtml(table.title)}</div>` : '',
    '<table><tbody>',
    table.headers.length > 0
      ? `<tr>${table.headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr>`
      : '',
    ...table.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`),
    '</tbody></table>',
    '</div>',
  ].join('')).join('')
}

export function renderDraftToEditableHtml(draft: DocumentDraft | null): string {
  if (!draft) return ''
  const outlineMap = new Map(draft.outline.map((item) => [item.id, item]))
  return [
    `<article data-document-id="${escapeHtml(draft.id)}" data-document-root="true">`,
    `<h1 data-document-title="true">${escapeHtml(draft.title)}</h1>`,
    ...draft.sections.map((section) => {
      const level = outlineMap.get(section.id)?.level === 2 ? 2 : 1
      const headingTag = level === 2 ? 'h3' : 'h2'
      return [
        `<section data-section-id="${escapeHtml(section.id)}" data-section-title="${escapeHtml(section.title)}" data-section-level="${level}">`,
        `<${headingTag} data-section-heading="true">${escapeHtml(section.title)}</${headingTag}>`,
        ...splitParagraphs(section.content).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`),
        renderTables(section.tables),
        renderCitations(section.citations),
        '</section>',
      ].join('')
    }),
    '</article>',
  ].join('')
}

function parseTable(tableRoot: HTMLTableElement | null, fallbackId: string, title?: string): DocumentDraftTable | undefined {
  if (!tableRoot) return undefined
  const rows = Array.from(tableRoot.querySelectorAll('tr'))
  if (rows.length === 0) return undefined
  const firstRowCells = Array.from(rows[0].children)
  const hasHeader = firstRowCells.some((cell) => cell.tagName.toLowerCase() === 'th')
  const headers = hasHeader
    ? firstRowCells.map((cell) => normalizeText(cell.textContent || '')).filter(Boolean)
    : []
  const bodyRows = rows
    .slice(hasHeader ? 1 : 0)
    .map((row) => Array.from(row.children).map((cell) => normalizeText(cell.textContent || '')))
    .filter((row) => row.some(Boolean))
  if (headers.length === 0 && bodyRows.length === 0) return undefined
  return {
    id: fallbackId,
    title: normalizeText(title || '') || undefined,
    headers,
    rows: bodyRows,
  }
}

function parseCitationBlock(block: Element): DocumentDraftCitation[] | undefined {
  const items = Array.from(block.querySelectorAll('[data-citation-item="true"], p, li'))
    .map((item, index) => {
      const label = normalizeText(item.textContent || '').replace(/^依据[:：]\s*/u, '')
      if (!label) return null
      return {
        id: item.getAttribute('data-citation-id') || `citation-${index + 1}`,
        label,
        kind: (item.getAttribute('data-citation-kind') as DocumentDraftCitation['kind']) || 'manual_note',
        citationStatus: (item.getAttribute('data-citation-status') as DocumentDraftCitation['citationStatus']) || 'partial',
        note: label.includes('需要人工确认依据') ? '需要人工确认依据' : undefined,
      } satisfies DocumentDraftCitation
    })
    .filter((item): item is DocumentDraftCitation => Boolean(item))
  return items.length > 0 ? items : undefined
}

function textWithinSection(section: HTMLElement, rangeStart?: number, rangeEnd?: number): { beforeText?: string; afterText?: string } {
  const fullText = normalizeText(section.textContent || '')
  if (!fullText) return {}
  const start = Math.max(0, Math.min(fullText.length, rangeStart ?? 0))
  const end = Math.max(start, Math.min(fullText.length, rangeEnd ?? start))
  return {
    beforeText: fullText.slice(Math.max(0, start - 160), start).trim() || undefined,
    afterText: fullText.slice(end, Math.min(fullText.length, end + 160)).trim() || undefined,
  }
}

export function parseEditableHtmlToDraft(input: {
  html: string
  baseDraft?: DocumentDraft | null
}): DocumentDraft {
  const parser = new DOMParser()
  const doc = parser.parseFromString(input.html || '', 'text/html')
  const baseDraft = input.baseDraft || null
  const title = normalizeText(
    doc.querySelector('[data-document-title="true"]')?.textContent
    || doc.querySelector('h1')?.textContent
    || baseDraft?.title
    || '办公文稿',
  ) || '办公文稿'
  const sections = Array.from(doc.querySelectorAll<HTMLElement>('section[data-section-id]'))
    .map((section, index) => {
      const sectionId = section.getAttribute('data-section-id') || baseDraft?.sections[index]?.id || `section-${index + 1}`
      const titleNode = section.querySelector('[data-section-heading="true"], h2, h3, h4')
      const sectionTitle = normalizeText(titleNode?.textContent || section.getAttribute('data-section-title') || '') || `第 ${index + 1} 节`
      const level = Number(section.getAttribute('data-section-level') || (titleNode?.tagName === 'H3' ? 2 : 1)) || 1
      const contentBlocks: string[] = []
      const tables: DocumentDraftTable[] = []
      let citations: DocumentDraftCitation[] | undefined

      Array.from(section.children).forEach((child, childIndex) => {
        if (!(child instanceof HTMLElement)) return
        if (child.matches('[data-section-heading="true"], h2, h3, h4')) return
        if (child.matches('p')) {
          const text = normalizeText(child.textContent || '')
          if (text) contentBlocks.push(text)
          return
        }
        if (child.matches('ul, ol')) {
          const items = Array.from(child.querySelectorAll(':scope > li'))
            .map((item, itemIndex) => {
              const text = normalizeText(item.textContent || '')
              if (!text) return ''
              return child.tagName.toLowerCase() === 'ol' ? `${itemIndex + 1}. ${text}` : `- ${text}`
            })
            .filter(Boolean)
          if (items.length > 0) contentBlocks.push(items.join('\n'))
          return
        }
        if (child.matches('blockquote, .document-citation-block, [data-block-type="citation-list"]')) {
          citations = parseCitationBlock(child) || citations
          return
        }
        if (child.matches('[data-block-type="table"], .document-table-block')) {
          const table = parseTable(
            child.querySelector('table'),
            child.getAttribute('data-table-id') || `${sectionId}-table-${childIndex + 1}`,
            child.querySelector('.document-table-title')?.textContent || undefined,
          )
          if (table) tables.push(table)
          return
        }
        const text = normalizeText(child.textContent || '')
        if (text) contentBlocks.push(text)
      })

      return {
        id: sectionId,
        title: sectionTitle,
        level,
        content: contentBlocks.join('\n\n'),
        citations,
        tables: tables.length > 0 ? tables : undefined,
      }
    })

  const normalizedSections = sections.length > 0
    ? sections
    : (baseDraft?.sections || []).map((section, index) => ({
        id: section.id || `section-${index + 1}`,
        title: section.title,
        level: baseDraft?.outline.find((item) => item.id === section.id)?.level || 1,
        content: section.content,
        citations: section.citations,
        tables: section.tables,
      }))

  return {
    id: baseDraft?.id || `document-${Date.now()}`,
    title,
    type: baseDraft?.type || 'report',
    language: baseDraft?.language || 'zh-CN',
    outline: normalizedSections.map((section) => ({
      id: section.id,
      level: section.level,
      title: section.title,
    })),
    sections: normalizedSections.map((section) => ({
      id: section.id,
      title: section.title,
      content: section.content || '',
      citations: section.citations,
      tables: section.tables,
    })),
    metadata: {
      engine: baseDraft?.metadata.engine || 'minimax_docx',
      templateId: baseDraft?.metadata.templateId,
      knowledgeRefs: baseDraft?.metadata.knowledgeRefs || [],
    },
  }
}

export function renderDraftToMarkdown(draft: DocumentDraft | null): string {
  if (!draft) return ''
  const lines: string[] = [`# ${draft.title}`]
  draft.sections.forEach((section) => {
    const level = draft.outline.find((item) => item.id === section.id)?.level === 2 ? '###' : '##'
    lines.push('', `${level} ${section.title}`)
    splitParagraphs(section.content).forEach((paragraph) => {
      lines.push('', paragraph)
    })
    section.tables?.forEach((table) => {
      if (table.title) lines.push('', `> ${table.title}`)
      if (table.headers.length > 0) {
        lines.push('', `| ${table.headers.join(' | ')} |`)
        lines.push(`| ${table.headers.map(() => '---').join(' | ')} |`)
      }
      table.rows.forEach((row) => lines.push(`| ${row.join(' | ')} |`))
    })
    section.citations?.forEach((citation) => {
      lines.push('', `- 依据：${citation.label}${citation.note ? `（${citation.note}）` : ''}`)
    })
  })
  return lines.join('\n')
}

export function createEditableStateFromTaskResult(input: {
  documentId: string
  artifactId: string
  exportUrl: string
  engine: string
  fallbackFrom?: string
  fallbackReason?: string
  document: DocumentDraft
}): EditableDocumentState {
  const html = renderDraftToEditableHtml(input.document)
  return {
    documentId: input.documentId,
    artifactId: input.artifactId,
    exportUrl: input.exportUrl,
    title: input.document.title,
    html,
    markdown: renderDraftToMarkdown(input.document),
    documentDraft: input.document,
    outline: input.document.outline,
    selectedSectionId: input.document.sections[0]?.id || null,
    selectedText: '',
    selectionRange: undefined,
    dirty: false,
    saving: false,
    lastSavedAt: undefined,
    engine: input.engine,
    fallbackFrom: input.fallbackFrom,
    fallbackReason: input.fallbackReason,
  }
}

export function updateEditableStateFromHtml(
  state: EditableDocumentState,
  html: string,
): EditableDocumentState {
  const draft = parseEditableHtmlToDraft({
    html,
    baseDraft: state.documentDraft || null,
  })
  return {
    ...state,
    title: draft.title,
    html,
    markdown: renderDraftToMarkdown(draft),
    documentDraft: draft,
    outline: draft.outline,
  }
}

export function buildSelectionContextFromOffsets(input: {
  sectionElement: HTMLElement
  startOffset?: number
  endOffset?: number
}): { beforeText?: string; afterText?: string } {
  return textWithinSection(input.sectionElement, input.startOffset, input.endOffset)
}
