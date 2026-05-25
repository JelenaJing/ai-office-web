import { parseDocument } from 'htmlparser2'
import type { Element, Node } from 'domhandler'
import { getAttributeValue, getName, getOuterHTML, getText, isTag } from 'domutils'
import type {
  DocumentCanonicalBlock,
  DocumentCanonicalData,
  DocumentCitation,
  DocumentCanonicalSection,
  DocumentDraft,
  DocumentKnowledgeRef,
  DocumentReference,
  DocumentWorkbenchArtifact,
} from '../types'

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

function directTagChildren(node: Element): Element[] {
  return (node.children || []).filter((child): child is Element => isTag(child))
}

function collectElements(nodes: Node[] | undefined, matcher: (node: Element) => boolean, acc: Element[] = []): Element[] {
  if (!Array.isArray(nodes)) return acc
  nodes.forEach((node) => {
    if (!isTag(node)) return
    if (matcher(node)) acc.push(node)
    collectElements(node.children, matcher, acc)
  })
  return acc
}

function splitParagraphs(value: string): string[] {
  return String(value || '')
    .split(/\n{2,}/)
    .map((item) => normalizeText(item))
    .filter(Boolean)
}

function deriveReferences(knowledgeRefs: DocumentKnowledgeRef[]): DocumentReference[] {
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

function collectCitationElements(node: Element): Element[] {
  return collectElements(node.children, (child) => getName(child) === 'span' && String(getAttributeValue(child, 'class') || '').split(/\s+/).includes('doc-citation'))
}

function citationIdsForNode(node: Element): string[] | undefined {
  const ids = collectCitationElements(node)
    .map((child, index) => getAttributeValue(child, 'data-citation-id') || `citation-${index + 1}`)
    .filter(Boolean)
  return ids.length > 0 ? ids : undefined
}

function sourceIdForNode(node: Element): string | undefined {
  return getAttributeValue(node, 'data-source-id') || collectCitationElements(node)[0]?.attribs?.['data-source-id'] || undefined
}

function deriveCitations(input: {
  html: string
  references: DocumentReference[]
}): DocumentCitation[] {
  const parsed = parseDocument(input.html || '')
  const rootNodes = parsed.children || []
  const citationElements = collectElements(rootNodes, (node) => getName(node) === 'span' && String(getAttributeValue(node, 'class') || '').split(/\s+/).includes('doc-citation'))
  return citationElements.map((node, index) => {
    let parent = node.parent
    let blockId = `block-${index + 1}`
    while (parent && isTag(parent)) {
      const currentId = getAttributeValue(parent, 'data-block-id')
      if (currentId) {
        blockId = currentId
        break
      }
      parent = parent.parent
    }
    const refId = getAttributeValue(node, 'data-ref-id')
      || input.references.find((ref) => ref.sourceId === getAttributeValue(node, 'data-source-id'))?.id
      || `ref-manual-${index + 1}`
    return {
      id: getAttributeValue(node, 'data-citation-id') || `citation-${index + 1}`,
      refId,
      blockId,
      sectionId: undefined,
      text: normalizeText(getText(node)),
      renderMode: (getAttributeValue(node, 'data-render-mode') as DocumentCitation['renderMode']) || 'inline',
      sourceId: getAttributeValue(node, 'data-source-id') || undefined,
      provider: (getAttributeValue(node, 'data-provider') as DocumentCitation['provider']) || undefined,
      sourceType: getAttributeValue(node, 'data-source-type') || undefined,
      chunkId: getAttributeValue(node, 'data-chunk-id') || undefined,
      trustLevel: getAttributeValue(node, 'data-trust-level') || undefined,
    }
  })
}

function supplementReferencesFromInlineCitations(html: string, references: DocumentReference[]): DocumentReference[] {
  const parsed = parseDocument(html || '')
  const rootNodes = parsed.children || []
  const known = new Set(references.map((ref) => ref.id))
  const next = [...references]
  collectElements(rootNodes, (node) => getName(node) === 'span' && String(getAttributeValue(node, 'class') || '').split(/\s+/).includes('doc-citation'))
    .forEach((node, index) => {
      const refId = getAttributeValue(node, 'data-ref-id')
      if (!refId || known.has(refId)) return
      const sourceType = getAttributeValue(node, 'data-source-type') || 'manual_note'
      const label = getAttributeValue(node, 'data-ref-label') || normalizeText(getText(node)) || `引用 ${index + 1}`
      next.push({
        id: refId,
        label,
        kind: sourceType === 'file'
          ? 'file'
          : sourceType === 'knowledge_base' || sourceType === 'policy' || sourceType === 'literature'
            ? 'knowledge_base'
            : 'manual_note',
        sourceId: getAttributeValue(node, 'data-source-id') || refId,
        sourceLabel: label,
        provider: (getAttributeValue(node, 'data-provider') as DocumentReference['provider']) || undefined,
        sourceType: sourceType as DocumentReference['sourceType'],
        chunkId: getAttributeValue(node, 'data-chunk-id') || undefined,
        trustLevel: (getAttributeValue(node, 'data-trust-level') as DocumentReference['trustLevel']) || 'partial',
        metadata: undefined,
        citationStatus: 'partial',
      })
      known.add(refId)
    })
  return next
}

function parseTable(node: Element, fallbackId: string): Extract<DocumentCanonicalBlock, { type: 'table' }> {
  const tableRoot = getName(node) === 'table'
    ? node
    : directTagChildren(node).find((child) => getName(child) === 'table')
  const rows = tableRoot ? collectElements(tableRoot.children, (child) => getName(child) === 'tr') : []
  const firstRowCells = rows[0] ? directTagChildren(rows[0]).filter((child) => ['th', 'td'].includes(getName(child))) : []
  const hasHeader = firstRowCells.some((cell) => getName(cell) === 'th')
  const headers = hasHeader
    ? firstRowCells.map((cell) => normalizeText(getText(cell))).filter(Boolean)
    : []
  const bodyRows = rows
    .slice(hasHeader ? 1 : 0)
    .map((row) => directTagChildren(row)
      .filter((cell) => ['th', 'td'].includes(getName(cell)))
      .map((cell) => normalizeText(getText(cell))))
    .filter((row) => row.some(Boolean))
  const titleNode = directTagChildren(node).find((child) => getAttributeValue(child, 'class') === 'document-table-title')
  return {
    id: getAttributeValue(node, 'data-block-id') || fallbackId,
    type: 'table',
    role: 'table',
    sectionId: null,
    order: 0,
    title: normalizeText(titleNode ? getText(titleNode) : '') || undefined,
    headers,
    rows: bodyRows,
    sourceId: sourceIdForNode(node),
    citationIds: citationIdsForNode(node),
    html: getOuterHTML(node),
  }
}

function parseImage(node: Element, fallbackId: string): Extract<DocumentCanonicalBlock, { type: 'image' }> | null {
  const imageNode = getName(node) === 'img'
    ? node
    : collectElements(node.children, (child) => getName(child) === 'img')[0]
  if (!imageNode) return null
  const src = String(getAttributeValue(imageNode, 'src') || '').trim()
  if (!src) return null
  const captionNode = getName(node) === 'figure'
    ? directTagChildren(node).find((child) => getName(child) === 'figcaption')
    : undefined
  return {
    id: getAttributeValue(node, 'data-block-id') || fallbackId,
    type: 'image',
    role: 'image',
    sectionId: null,
    order: 0,
    src,
    alt: normalizeText(getAttributeValue(imageNode, 'alt') || '') || undefined,
    caption: normalizeText(captionNode ? getText(captionNode) : '') || undefined,
    sourceId: sourceIdForNode(node),
    citationIds: citationIdsForNode(node),
    html: getOuterHTML(node),
  }
}

function renderSectionBody(section: DocumentDraft['sections'][number], level: number): string {
  const body: string[] = []
  body.push(
    `<${level === 2 ? 'h3' : 'h2'} data-section-heading="true" data-block-id="${escapeHtml(`${section.id}-heading`)}" data-role="heading">${escapeHtml(section.title)}</${level === 2 ? 'h3' : 'h2'}>`,
  )
  splitParagraphs(section.content).forEach((paragraph, index) => {
    body.push(`<p data-block-id="${escapeHtml(`${section.id}-paragraph-${index + 1}`)}" data-role="paragraph">${escapeHtml(paragraph)}</p>`)
  })
  section.tables?.forEach((table, index) => {
    body.push([
      `<div data-block-id="${escapeHtml(table.id || `${section.id}-table-${index + 1}`)}" data-role="table" data-block-type="table" data-table-id="${escapeHtml(table.id || `${section.id}-table-${index + 1}`)}" class="document-table-block">`,
      table.title ? `<div class="document-table-title">${escapeHtml(table.title)}</div>` : '',
      '<table><tbody>',
      table.headers.length > 0 ? `<tr>${table.headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr>` : '',
      ...table.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`),
      '</tbody></table>',
      '</div>',
    ].join(''))
  })
  if (section.citations?.length) {
    body.push([
      `<blockquote data-block-id="${escapeHtml(`${section.id}-quote-1`)}" data-role="quote" data-block-type="citation-list" class="document-citation-block">`,
      ...section.citations.map((citation) => (
        `<p data-citation-item="true" data-citation-id="${escapeHtml(citation.id)}" data-citation-kind="${escapeHtml(citation.kind)}" data-citation-status="${escapeHtml(citation.citationStatus)}">` +
        `${escapeHtml(citation.label)}${citation.note ? `（${escapeHtml(citation.note)}）` : ''}` +
        '</p>'
      )),
      '</blockquote>',
    ].join(''))
  }
  if (body.length === 1) {
    body.push(`<p data-block-id="${escapeHtml(`${section.id}-paragraph-1`)}" data-role="paragraph"><br /></p>`)
  }
  return body.join('')
}

export function renderWorkbenchHtmlFromDraft(draft: DocumentDraft): string {
  return [
    '<article data-document-root="true" data-document-mode="workbench">',
    `<h1 data-document-title="true" data-block-id="document-title" data-role="title">${escapeHtml(draft.title)}</h1>`,
    ...draft.sections.map((section, index) => {
      const outlineItem = draft.outline.find((item) => item.id === section.id)
      const level = outlineItem?.level === 2 ? 2 : 1
      return [
        `<section data-section-id="${escapeHtml(section.id)}" data-section-title="${escapeHtml(section.title)}" data-section-level="${level}"${index === 0 ? ' data-document-body="true"' : ''}>`,
        renderSectionBody(section, level),
        '</section>',
      ].join('')
    }),
    '</article>',
  ].join('')
}

export function normalizeWorkbenchHtml(input: {
  html?: string
  draft: DocumentDraft
}): string {
  const html = String(input.html || '').trim()
  if (html && /data-document-root\s*=\s*["']true["']/i.test(html)) {
    return html
  }
  if (html) {
    return [
      '<article data-document-root="true" data-document-mode="workbench">',
      `<h1 data-document-title="true" data-block-id="document-title" data-role="title">${escapeHtml(input.draft.title)}</h1>`,
      `<section data-section-id="${escapeHtml(input.draft.sections[0]?.id || 'section-main')}" data-section-title="${escapeHtml(input.draft.sections[0]?.title || '正文')}" data-section-level="1" data-document-body="true">`,
      html,
      '</section>',
      '</article>',
    ].join('')
  }
  return renderWorkbenchHtmlFromDraft(input.draft)
}

export function buildCanonicalDataFromHtml(input: {
  documentId: string
  draft: DocumentDraft
  html: string
  knowledgeRefs: DocumentKnowledgeRef[]
}): DocumentCanonicalData {
  const parsed = parseDocument(input.html || '')
  const rootNodes = parsed.children || []
  const titleNode = collectElements(rootNodes, (node) => getAttributeValue(node, 'data-document-title') === 'true' || getName(node) === 'h1')[0]
  const title = normalizeText(titleNode ? getText(titleNode) : '') || input.draft.title
  const sectionNodes = collectElements(rootNodes, (node) => getName(node) === 'section' && Boolean(getAttributeValue(node, 'data-section-id')))
  const blocks: DocumentCanonicalBlock[] = []
  const sections: DocumentCanonicalSection[] = []

  blocks.push({
    id: getAttributeValue(titleNode, 'data-block-id') || 'document-title',
    type: 'title',
    role: 'title',
    sectionId: null,
    order: 0,
    text: title,
    level: 1,
    sourceId: titleNode ? sourceIdForNode(titleNode) : undefined,
    citationIds: titleNode ? citationIdsForNode(titleNode) : undefined,
    html: titleNode ? getOuterHTML(titleNode) : undefined,
  })

  sectionNodes.forEach((sectionNode, sectionIndex) => {
    const sectionId = getAttributeValue(sectionNode, 'data-section-id') || input.draft.sections[sectionIndex]?.id || `section-${sectionIndex + 1}`
    const headingNode = directTagChildren(sectionNode).find((child) => ['h2', 'h3', 'h4'].includes(getName(child)))
    const sectionTitle = normalizeText(
      getAttributeValue(sectionNode, 'data-section-title')
      || (headingNode ? getText(headingNode) : '')
      || input.draft.sections[sectionIndex]?.title
      || `第 ${sectionIndex + 1} 节`,
    ) || `第 ${sectionIndex + 1} 节`
    const sectionLevel = Number(getAttributeValue(sectionNode, 'data-section-level') || (headingNode && getName(headingNode) === 'h3' ? '2' : '1')) || 1
    const blockIds: string[] = []

    directTagChildren(sectionNode).forEach((child, childIndex) => {
      const name = getName(child)
      const order = blocks.length
      const fallbackId = `${sectionId}-block-${childIndex + 1}`
      if (['h2', 'h3', 'h4'].includes(name)) {
        const id = getAttributeValue(child, 'data-block-id') || `${sectionId}-heading`
        blocks.push({
          id,
          type: 'heading',
          role: 'heading',
          sectionId,
          sectionTitle,
          order,
          level: name === 'h3' ? 2 : name === 'h4' ? 3 : 1,
          text: normalizeText(getText(child)),
          sourceId: sourceIdForNode(child),
          citationIds: citationIdsForNode(child),
          html: getOuterHTML(child),
        })
        blockIds.push(id)
        return
      }
      if (name === 'p') {
        const text = normalizeText(getText(child))
        if (!text) return
        const id = getAttributeValue(child, 'data-block-id') || fallbackId
        blocks.push({
          id,
          type: 'paragraph',
          role: 'paragraph',
          sectionId,
          sectionTitle,
          order,
          text,
          sourceId: sourceIdForNode(child),
          citationIds: citationIdsForNode(child),
          html: getOuterHTML(child),
        })
        blockIds.push(id)
        return
      }
      if (name === 'ul' || name === 'ol') {
        const items = directTagChildren(child)
          .filter((item) => getName(item) === 'li')
          .map((item, itemIndex) => ({
            node: item,
            text: normalizeText(getText(item)),
            id: getAttributeValue(item, 'data-block-id') || `${getAttributeValue(child, 'data-block-id') || fallbackId}-item-${itemIndex + 1}`,
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
            listKind: name === 'ol' ? 'numbered' : 'bulleted',
            index: itemIndex,
            sourceId: sourceIdForNode(item.node),
            citationIds: citationIdsForNode(item.node),
            html: getOuterHTML(item.node),
          })
          blockIds.push(item.id)
        })
        return
      }
      if (name === 'blockquote') {
        const text = normalizeText(getText(child))
        if (!text) return
        const id = getAttributeValue(child, 'data-block-id') || fallbackId
        blocks.push({
          id,
          type: 'quote',
          role: 'quote',
          sectionId,
          sectionTitle,
          order,
          text,
          sourceId: sourceIdForNode(child),
          citationIds: citationIdsForNode(child),
          html: getOuterHTML(child),
        })
        blockIds.push(id)
        return
      }
      if (name === 'hr') {
        const id = getAttributeValue(child, 'data-block-id') || fallbackId
        blocks.push({
          id,
          type: 'divider',
          role: 'divider',
          sectionId,
          sectionTitle,
          order,
          sourceId: sourceIdForNode(child),
          citationIds: citationIdsForNode(child),
          html: getOuterHTML(child),
        })
        blockIds.push(id)
        return
      }
      if (name === 'figure' || name === 'img') {
        const imageBlock = parseImage(child, fallbackId)
        if (!imageBlock) return
        imageBlock.sectionId = sectionId
        imageBlock.sectionTitle = sectionTitle
        imageBlock.order = order
        blocks.push(imageBlock)
        blockIds.push(imageBlock.id)
        return
      }
      if (name === 'table' || getAttributeValue(child, 'data-block-type') === 'table') {
        const tableBlock = parseTable(child, fallbackId)
        tableBlock.sectionId = sectionId
        tableBlock.sectionTitle = sectionTitle
        tableBlock.order = order
        blocks.push(tableBlock)
        blockIds.push(tableBlock.id)
        return
      }
      const text = normalizeText(getText(child))
      if (!text) return
      const id = getAttributeValue(child, 'data-block-id') || fallbackId
      blocks.push({
        id,
        type: 'paragraph',
        role: 'paragraph',
        sectionId,
        sectionTitle,
        order,
        text,
        sourceId: sourceIdForNode(child),
        citationIds: citationIdsForNode(child),
        html: getOuterHTML(child),
      })
      blockIds.push(id)
    })

    sections.push({
      id: sectionId,
      title: sectionTitle,
      level: sectionLevel,
      blockIds,
    })
  })

  const references = supplementReferencesFromInlineCitations(input.html, deriveReferences(input.knowledgeRefs))
  const citations = deriveCitations({ html: input.html, references }).map((citation) => ({
    ...citation,
    sectionId: blocks.find((block) => block.id === citation.blockId)?.sectionId || null,
  }))

  return {
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
    knowledgeRefs: input.knowledgeRefs,
    references,
    citations,
  }
}

export function buildWorkbenchDocumentArtifact(input: {
  documentId: string
  draft: DocumentDraft
  html?: string
  knowledgeRefs: DocumentKnowledgeRef[]
  artifactId?: string
  sourceRefs?: Array<{ type: string; id: string; label?: string }>
  exportPaths?: { pdf?: string; docx?: string }
  createdAt?: string
  updatedAt?: string
}): DocumentWorkbenchArtifact {
  const html = normalizeWorkbenchHtml({
    html: input.html,
    draft: input.draft,
  })
  const canonicalData = buildCanonicalDataFromHtml({
    documentId: input.documentId,
    draft: input.draft,
    html,
    knowledgeRefs: input.knowledgeRefs,
  })
  const timestamp = input.updatedAt || new Date().toISOString()
  const sourceRefs = input.sourceRefs || canonicalData.references
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
    id: input.artifactId || input.documentId,
    type: 'document',
    title: input.draft.title,
    html,
    canonicalData,
    sourceRefs,
    knowledgeRefs: input.knowledgeRefs,
    references: canonicalData.references,
    citations: canonicalData.citations,
    exportPaths: input.exportPaths || {},
    createdAt: input.createdAt || timestamp,
    updatedAt: timestamp,
  }
}
