import type {
  DocumentCitation,
  DocumentCanonicalBlock,
  DocumentCanonicalData,
  DocumentReference,
  DocumentDraft,
  DocumentDraftCitation,
  DocumentDraftTable,
  DocumentKnowledgeRef,
  DocumentWorkbenchArtifact,
  EditableDocumentState,
} from './documentWorkbenchApi'

function escapeHtml(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
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

function renderCitations(citations: DocumentDraftCitation[] | undefined, sectionId?: string): string {
  if (!citations || citations.length === 0) return ''
  return [
    `<blockquote data-block-id="${escapeHtml(sectionId ? `${sectionId}-quote-1` : 'citation-block-1')}" data-role="quote" data-block-type="citation-list" class="document-citation-block">`,
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
    `<div data-block-id="${escapeHtml(table.id)}" data-role="table" data-block-type="table" data-table-id="${escapeHtml(table.id)}" class="document-table-block">`,
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

function blockId(sectionId: string, kind: string, index: number): string {
  return `${sectionId}-${kind}-${index + 1}`
}

function buildReferences(knowledgeRefs: DocumentKnowledgeRef[]): DocumentReference[] {
  return knowledgeRefs.map((ref) => ({
    id: `ref-${ref.provider || 'unknown'}-${ref.kind}-${ref.sourceId || ref.id}`,
    label: ref.label,
    kind: ref.kind,
    sourceId: ref.sourceId || ref.id,
    sourceLabel: ref.label,
    excerpt: ref.excerpt,
    provider: ref.provider,
    sourceType: ref.sourceType || ref.kind,
    chunkId: ref.chunkId,
    trustLevel: ref.trustLevel || ref.citationStatus,
    metadata: ref.metadata,
    citationStatus: ref.citationStatus,
  }))
}

function citationIdsFromElement(element: HTMLElement): string[] | undefined {
  const ids = Array.from(element.querySelectorAll<HTMLElement>('span.doc-citation[data-citation-id]'))
    .map((node) => node.dataset.citationId || '')
    .filter(Boolean)
  return ids.length > 0 ? ids : undefined
}

function sourceIdFromElement(element: HTMLElement): string | undefined {
  return element.dataset.sourceId || element.querySelector<HTMLElement>('span.doc-citation[data-source-id]')?.dataset.sourceId || undefined
}

function buildCitationsFromHtml(input: {
  doc: Document
  references: DocumentReference[]
}): DocumentCitation[] {
  return Array.from(input.doc.querySelectorAll<HTMLElement>('span.doc-citation')).map((node, index) => {
    const block = node.closest<HTMLElement>('[data-block-id]')
    const refId = node.dataset.refId
      || input.references.find((ref) => ref.sourceId === node.dataset.sourceId)?.id
      || `ref-manual-${index + 1}`
    return {
      id: node.dataset.citationId || `citation-${index + 1}`,
      refId,
      blockId: block?.dataset.blockId || `block-${index + 1}`,
      sectionId: block?.closest<HTMLElement>('section[data-section-id]')?.dataset.sectionId || undefined,
      text: normalizeText(node.textContent || ''),
      renderMode: (node.dataset.renderMode as DocumentCitation['renderMode']) || 'inline',
      sourceId: node.dataset.sourceId || undefined,
      provider: (node.dataset.provider as DocumentCitation['provider']) || undefined,
      sourceType: node.dataset.sourceType || undefined,
      chunkId: node.dataset.chunkId || undefined,
      trustLevel: node.dataset.trustLevel || undefined,
    }
  })
}

function buildDocumentArtifactFromHtml(input: {
  documentId: string
  html: string
  draft: DocumentDraft
  knowledgeRefs?: DocumentKnowledgeRef[]
}): DocumentWorkbenchArtifact {
  const parser = new DOMParser()
  const doc = parser.parseFromString(input.html || '', 'text/html')
  const titleNode = doc.querySelector<HTMLElement>('[data-document-title="true"], h1')
  const blocks: DocumentCanonicalBlock[] = []
  const sections: DocumentCanonicalData['sections'] = []
  const title = normalizeText(titleNode?.textContent || '') || input.draft.title
  const knowledgeRefs = input.knowledgeRefs || input.draft.metadata.knowledgeRefs || []
  blocks.push({
    id: titleNode?.getAttribute('data-block-id') || 'document-title',
    type: 'title',
    role: 'title',
    sectionId: null,
    order: 0,
    text: title,
    level: 1,
    sourceId: titleNode?.dataset.sourceId || undefined,
    citationIds: titleNode ? citationIdsFromElement(titleNode) : undefined,
    html: titleNode?.outerHTML,
  })

  Array.from(doc.querySelectorAll<HTMLElement>('section[data-section-id]')).forEach((section, sectionIndex) => {
    const sectionId = section.getAttribute('data-section-id') || input.draft.sections[sectionIndex]?.id || `section-${sectionIndex + 1}`
    const sectionTitle = normalizeText(section.getAttribute('data-section-title') || section.querySelector('[data-section-heading="true"], h2, h3, h4')?.textContent || '')
      || input.draft.sections[sectionIndex]?.title
      || `第 ${sectionIndex + 1} 节`
    const level = Number(section.getAttribute('data-section-level') || (section.querySelector('h3, h4') ? '2' : '1')) || 1
    const blockIds: string[] = []

    Array.from(section.children).forEach((child, childIndex) => {
      if (!(child instanceof HTMLElement)) return
      const tag = child.tagName.toLowerCase()
      const id = child.getAttribute('data-block-id') || blockId(sectionId, tag, childIndex)
      const order = blocks.length
      if (['h2', 'h3', 'h4'].includes(tag)) {
        blocks.push({
          id,
          type: 'heading',
          role: 'heading',
          sectionId,
          sectionTitle,
          order,
          level: tag === 'h3' ? 2 : tag === 'h4' ? 3 : 1,
          text: normalizeText(child.textContent || ''),
          sourceId: sourceIdFromElement(child),
          citationIds: citationIdsFromElement(child),
          html: child.outerHTML,
        })
        blockIds.push(id)
        return
      }
      if (tag === 'p') {
        const text = normalizeText(child.textContent || '')
        if (!text) return
        blocks.push({
          id,
          type: 'paragraph',
          role: 'paragraph',
          sectionId,
          sectionTitle,
          order,
          text,
          sourceId: sourceIdFromElement(child),
          citationIds: citationIdsFromElement(child),
          html: child.outerHTML,
        })
        blockIds.push(id)
        return
      }
      if (tag === 'ul' || tag === 'ol') {
        const listKind = tag === 'ol' ? 'numbered' : 'bulleted'
        const items = Array.from(child.querySelectorAll(':scope > li'))
          .map((item, itemIndex) => ({
            node: item,
            text: normalizeText(item.textContent || ''),
            id: item.getAttribute('data-block-id') || `${id}-item-${itemIndex + 1}`,
          }))
          .filter((item) => item.text)
        if (items.length === 0) return
        items.forEach((item, itemIndex) => {
          blocks.push({
            id: item.id,
            type: 'list-item',
            role: 'list-item',
            sectionId,
            sectionTitle,
            order: order + itemIndex,
            text: item.text,
            listKind,
            index: itemIndex,
            sourceId: sourceIdFromElement(item.node),
            citationIds: citationIdsFromElement(item.node),
            html: item.node.outerHTML,
          })
          blockIds.push(item.id)
        })
        return
      }
      if (tag === 'blockquote') {
        const text = normalizeText(child.textContent || '')
        if (!text) return
        blocks.push({
          id,
          type: 'quote',
          role: 'quote',
          sectionId,
          sectionTitle,
          order,
          text,
          sourceId: sourceIdFromElement(child),
          citationIds: citationIdsFromElement(child),
          html: child.outerHTML,
        })
        blockIds.push(id)
        return
      }
      if (tag === 'hr') {
        blocks.push({
          id,
          type: 'divider',
          role: 'divider',
          sectionId,
          sectionTitle,
          order,
          sourceId: sourceIdFromElement(child),
          citationIds: citationIdsFromElement(child),
          html: child.outerHTML,
        })
        blockIds.push(id)
        return
      }
      if (tag === 'figure' || tag === 'img') {
        const image = tag === 'img' ? child : child.querySelector<HTMLImageElement>('img')
        if (!image?.getAttribute('src')) return
        blocks.push({
          id,
          type: 'image',
          role: 'image',
          sectionId,
          sectionTitle,
          order,
          src: image.getAttribute('src') || '',
          alt: normalizeText(image.getAttribute('alt') || '') || undefined,
          caption: normalizeText((tag === 'figure' ? child.querySelector('figcaption')?.textContent : '') || '') || undefined,
          sourceId: sourceIdFromElement(child),
          citationIds: citationIdsFromElement(child),
          html: child.outerHTML,
        })
        blockIds.push(id)
        return
      }
      if (tag === 'table' || child.matches('[data-block-type="table"], .document-table-block')) {
        const table = parseTable(
          tag === 'table' ? child as HTMLTableElement : child.querySelector('table'),
          child.getAttribute('data-table-id') || id,
          child.querySelector('.document-table-title')?.textContent || undefined,
        )
        if (!table) return
        blocks.push({
          id,
          type: 'table',
          role: 'table',
          sectionId,
          sectionTitle,
          order,
          title: table.title,
          headers: table.headers,
          rows: table.rows,
          sourceId: sourceIdFromElement(child),
          citationIds: citationIdsFromElement(child),
          html: child.outerHTML,
        })
        blockIds.push(id)
        return
      }
      const text = normalizeText(child.textContent || '')
      if (!text) return
      blocks.push({
        id,
        type: 'paragraph',
        role: 'paragraph',
        sectionId,
        sectionTitle,
        order,
        text,
        sourceId: sourceIdFromElement(child),
        citationIds: citationIdsFromElement(child),
        html: child.outerHTML,
      })
      blockIds.push(id)
    })

    sections.push({
      id: sectionId,
      title: sectionTitle,
      level,
      blockIds,
    })
  })

  const references = buildReferences(knowledgeRefs)
  const citations = buildCitationsFromHtml({ doc, references })

  // Supplement references with any manually-inserted citation refs not yet in knowledgeRefs
  const knownRefIds = new Set(references.map((r) => r.id))
  Array.from(doc.querySelectorAll<HTMLElement>('span.doc-citation[data-ref-id]')).forEach((node, idx) => {
    const refId = node.dataset.refId
    if (!refId || knownRefIds.has(refId)) return
    const label = node.dataset.refLabel || node.textContent?.trim() || `引用 ${idx + 1}`
    references.push({
      id: refId,
      label,
      kind: 'manual_note',
      sourceId: node.dataset.sourceId || refId,
      sourceLabel: label,
      provider: (node.dataset.provider as DocumentReference['provider']) || undefined,
      sourceType: node.dataset.sourceType || 'manual_note',
      chunkId: node.dataset.chunkId,
      trustLevel: node.dataset.trustLevel || 'partial',
      metadata: undefined,
      citationStatus: 'partial',
    })
    knownRefIds.add(refId)
  })
  const timestamp = new Date().toISOString()
  const sourceRefs = references
    .filter((ref) => ref.sourceId)
    .map((ref) => ({
      type: ref.sourceType || ref.kind,
      id: ref.sourceId,
      label: ref.sourceLabel || ref.label,
      provider: ref.provider,
      sourceId: ref.sourceId,
      chunkId: ref.chunkId,
      trustLevel: ref.trustLevel,
      excerpt: ref.excerpt,
      metadata: ref.metadata,
    }))

  return {
    id: input.documentId,
    type: 'document',
    title,
    html: input.html,
    sourceRefs,
    knowledgeRefs,
    references,
    citations,
    exportPaths: {},
    createdAt: timestamp,
    updatedAt: timestamp,
    canonicalData: {
      version: 'document-html-workbench/v1',
      documentId: input.documentId,
      title,
      type: input.draft.type,
      language: input.draft.language,
      engine: input.draft.metadata.engine,
      templateId: input.draft.metadata.templateId,
      outline: input.draft.outline,
      sections,
      blocks,
      knowledgeRefs,
      references,
      citations,
    },
  }
}

export function renderDraftToEditableHtml(draft: DocumentDraft | null): string {
  if (!draft) return ''
  const outlineMap = new Map(draft.outline.map((item) => [item.id, item]))
  return [
    `<article data-document-id="${escapeHtml(draft.id)}" data-document-root="true">`,
    `<h1 data-document-title="true" data-block-id="document-title" data-role="title">${escapeHtml(draft.title)}</h1>`,
    ...draft.sections.map((section, sectionIndex) => {
      const level = outlineMap.get(section.id)?.level === 2 ? 2 : 1
      const headingTag = level === 2 ? 'h3' : 'h2'
      return [
        `<section data-section-id="${escapeHtml(section.id)}" data-section-title="${escapeHtml(section.title)}" data-section-level="${level}"${sectionIndex === 0 ? ' data-document-body="true"' : ''}>`,
        `<${headingTag} data-section-heading="true" data-block-id="${escapeHtml(`${section.id}-heading`)}" data-role="heading">${escapeHtml(section.title)}</${headingTag}>`,
        ...splitParagraphs(section.content).map((paragraph, paragraphIndex) => `<p data-block-id="${escapeHtml(blockId(section.id, 'paragraph', paragraphIndex))}" data-role="paragraph">${escapeHtml(paragraph)}</p>`),
        renderTables(section.tables),
        renderCitations(section.citations, section.id),
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
  const explicitTitleNode = doc.querySelector('[data-document-title="true"]') || doc.querySelector('h1')
  const title = explicitTitleNode
    ? normalizeText(explicitTitleNode.textContent || '')
    : (normalizeText(baseDraft?.title || '') || '办公文稿')
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
  html?: string
  documentArtifact?: DocumentWorkbenchArtifact
  userFileId?: string | null
}): EditableDocumentState {
  const html = input.html || renderDraftToEditableHtml(input.document)
  const documentArtifact = input.documentArtifact || buildDocumentArtifactFromHtml({
    documentId: input.documentId,
    html,
    draft: input.document,
    knowledgeRefs: input.document.metadata.knowledgeRefs,
  })
  return {
    documentId: input.documentId,
    userFileId: input.userFileId ?? null,
    artifactId: input.artifactId,
    exportUrl: input.exportUrl,
    title: input.document.title,
    html,
    documentArtifact,
    markdown: renderDraftToMarkdown(input.document),
    documentDraft: input.document,
    outline: input.document.outline,
    selectedSectionId: input.document.sections[0]?.id || null,
    selectedBlockId: 'document-title',
    selectedBlockRole: 'title',
    selectedBlockText: input.document.title,
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
    documentArtifact: buildDocumentArtifactFromHtml({
      documentId: state.documentId || draft.id,
      html,
      draft,
      knowledgeRefs: draft.metadata.knowledgeRefs,
    }),
    markdown: renderDraftToMarkdown(draft),
    documentDraft: draft,
    outline: draft.outline,
    selectedBlockId: state.selectedBlockId,
    selectedBlockRole: state.selectedBlockRole,
    selectedBlockText: state.selectedBlockText,
  }
}

export function buildSelectionContextFromOffsets(input: {
  sectionElement: HTMLElement
  startOffset?: number
  endOffset?: number
}): { beforeText?: string; afterText?: string } {
  return textWithinSection(input.sectionElement, input.startOffset, input.endOffset)
}
