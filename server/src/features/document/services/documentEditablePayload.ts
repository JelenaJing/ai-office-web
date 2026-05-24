import { parseDocument } from 'htmlparser2'
import type { Element, Node } from 'domhandler'
import { getAttributeValue, getName, getText, isTag } from 'domutils'
import { normalizeDocumentDraft } from './documentDraft'
import type { DocumentDraft, DocumentDraftCitation, DocumentDraftTable, DocumentRecord } from '../types'

function normalizeText(value: string): string {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function safeText(node?: Element | null): string {
  return node ? getText(node) : ''
}

function collectElements(nodes: Node[] | undefined, matcher: (node: Element) => boolean, acc: Element[] = []): Element[] {
  if (!Array.isArray(nodes)) return acc
  nodes.forEach((node) => {
    if (isTag(node)) {
      if (matcher(node)) acc.push(node)
      collectElements(node.children, matcher, acc)
    }
  })
  return acc
}

function directTagChildren(node: Element): Element[] {
  return (node.children || []).filter((child): child is Element => isTag(child))
}

function firstMatchingChild(node: Element, matcher: (child: Element) => boolean): Element | null {
  return directTagChildren(node).find(matcher) || null
}

function parseTable(tableNode: Element | null, fallbackId: string, title?: string): DocumentDraftTable | undefined {
  if (!tableNode) return undefined
  const rowNodes = collectElements(tableNode.children, (node) => getName(node) === 'tr')
  if (rowNodes.length === 0) return undefined
  const firstRowCells = directTagChildren(rowNodes[0]).filter((child) => ['th', 'td'].includes(getName(child)))
  const hasHeader = firstRowCells.some((cell) => getName(cell) === 'th')
  const headers = hasHeader
    ? firstRowCells.map((cell) => normalizeText(getText(cell))).filter(Boolean)
    : []
  const rows = rowNodes
    .slice(hasHeader ? 1 : 0)
    .map((row) => directTagChildren(row)
      .filter((cell) => ['th', 'td'].includes(getName(cell)))
      .map((cell) => normalizeText(getText(cell))))
    .filter((row) => row.some(Boolean))
  if (headers.length === 0 && rows.length === 0) return undefined
  return {
    id: fallbackId,
    title: normalizeText(title || '') || undefined,
    headers,
    rows,
  }
}

function parseCitations(node: Element): DocumentDraftCitation[] | undefined {
  const items = collectElements(node.children, (child) => {
    const name = getName(child)
    return name === 'p' || name === 'li'
  }).map((item, index): DocumentDraftCitation | null => {
    const label = normalizeText(getText(item)).replace(/^依据[:：]\s*/u, '')
    if (!label) return null
    return {
      id: getAttributeValue(item, 'data-citation-id') || `citation-${index + 1}`,
      label,
      kind: (getAttributeValue(item, 'data-citation-kind') as DocumentDraftCitation['kind']) || 'manual_note',
      citationStatus: (getAttributeValue(item, 'data-citation-status') as DocumentDraftCitation['citationStatus']) || 'partial',
      ...(label.includes('需要人工确认依据') ? { note: '需要人工确认依据' } : {}),
    }
  }).filter((item): item is DocumentDraftCitation => item !== null)

  return items.length > 0 ? items : undefined
}

function normalizeOutline(input: {
  sections: DocumentDraft['sections']
  outline?: unknown
  fallbackOutline: DocumentDraft['outline']
}): DocumentDraft['outline'] {
  const rawOutline = Array.isArray(input.outline) ? input.outline : []
  if (rawOutline.length === 0) {
    return input.sections.map((section) => ({
      id: section.id,
      level: input.fallbackOutline.find((item) => item.id === section.id)?.level || 1,
      title: section.title,
    }))
  }
  return input.sections.map((section, index) => {
    const matched = rawOutline.find((item) => item && typeof item === 'object' && String((item as { id?: string }).id || '') === section.id)
    const fallback = input.fallbackOutline.find((item) => item.id === section.id)
    return {
      id: section.id,
      level: matched && typeof matched === 'object' && Number.isFinite((matched as { level?: number }).level)
        ? Number((matched as { level?: number }).level)
        : fallback?.level || 1,
      title: matched && typeof matched === 'object' && typeof (matched as { title?: string }).title === 'string'
        ? String((matched as { title?: string }).title).trim() || section.title
        : section.title,
    }
  })
}

function parseEditableHtmlToDraft(input: {
  html: string
  title?: string
  record: DocumentRecord
  outline?: unknown
}): DocumentDraft {
  const parsed = parseDocument(input.html || '')
  const rootNodes = parsed.children || []
  const titleNode = collectElements(rootNodes, (node) => getAttributeValue(node, 'data-document-title') === 'true' || getName(node) === 'h1')[0]
  const title = normalizeText(input.title || safeText(titleNode) || input.record.draft.title) || input.record.draft.title
  const sectionNodes = collectElements(rootNodes, (node) => getName(node) === 'section' && Boolean(getAttributeValue(node, 'data-section-id')))

  const sections = sectionNodes.map((sectionNode, index) => {
    const sectionId = getAttributeValue(sectionNode, 'data-section-id') || input.record.draft.sections[index]?.id || `section-${index + 1}`
    const headingNode = firstMatchingChild(sectionNode, (child) => ['h2', 'h3', 'h4'].includes(getName(child)))
    const sectionTitle = normalizeText(
      safeText(headingNode)
      || getAttributeValue(sectionNode, 'data-section-title')
      || input.record.draft.sections[index]?.title
      || `第 ${index + 1} 节`,
    ) || `第 ${index + 1} 节`
    const contentBlocks: string[] = []
    const tables: DocumentDraftTable[] = []
    let citations: DocumentDraftCitation[] | undefined

    directTagChildren(sectionNode).forEach((child, childIndex) => {
      const name = getName(child)
      if (['h2', 'h3', 'h4'].includes(name)) return
      if (name === 'p') {
        const text = normalizeText(getText(child))
        if (text) contentBlocks.push(text)
        return
      }
      if (name === 'ul' || name === 'ol') {
        const items = directTagChildren(child)
          .filter((item) => getName(item) === 'li')
          .map((item, itemIndex) => {
            const text = normalizeText(getText(item))
            if (!text) return ''
            return name === 'ol' ? `${itemIndex + 1}. ${text}` : `- ${text}`
          })
          .filter(Boolean)
        if (items.length > 0) contentBlocks.push(items.join('\n'))
        return
      }
      if (name === 'blockquote' || getAttributeValue(child, 'data-block-type') === 'citation-list') {
        citations = parseCitations(child) || citations
        return
      }
      if (name === 'table' || getAttributeValue(child, 'data-block-type') === 'table') {
        const table = parseTable(
          name === 'table' ? child : firstMatchingChild(child, (item) => getName(item) === 'table'),
          getAttributeValue(child, 'data-table-id') || `${sectionId}-table-${childIndex + 1}`,
          normalizeText(safeText(firstMatchingChild(child, (item) => getAttributeValue(item, 'class') === 'document-table-title'))),
        )
        if (table) tables.push(table)
        return
      }
      const text = normalizeText(getText(child))
      if (text) contentBlocks.push(text)
    })

    return {
      id: sectionId,
      title: sectionTitle,
      content: contentBlocks.join('\n\n'),
      citations,
      tables: tables.length > 0 ? tables : undefined,
    }
  })

  const normalized = normalizeDocumentDraft({
    raw: {
      id: input.record.documentId,
      title,
      outline: normalizeOutline({
        sections: sections.length > 0 ? sections : input.record.draft.sections,
        outline: input.outline,
        fallbackOutline: input.record.draft.outline,
      }),
      sections: sections.length > 0 ? sections : input.record.draft.sections,
    },
    title,
    type: input.record.documentType,
    language: input.record.language,
    engine: input.record.engine,
    templateId: input.record.templateId,
    knowledgeRefs: input.record.knowledgeRefs,
    preferredOutline: input.record.draft.outline.map((item) => item.title),
  })
  normalized.id = input.record.documentId
  normalized.outline = normalizeOutline({
    sections: normalized.sections,
    outline: input.outline,
    fallbackOutline: normalized.outline,
  })
  return normalized
}

export function resolveDocumentDraftFromPayload(input: {
  record: DocumentRecord
  title?: unknown
  html?: unknown
  documentDraft?: unknown
  outline?: unknown
}): DocumentDraft {
  const title = typeof input.title === 'string' ? input.title.trim() : ''
  if (input.documentDraft && typeof input.documentDraft === 'object') {
    const normalized = normalizeDocumentDraft({
      raw: {
        ...(input.documentDraft as Record<string, unknown>),
        ...(title ? { title } : {}),
        ...(Array.isArray(input.outline) ? { outline: input.outline } : {}),
      },
      title: title || input.record.draft.title,
      type: input.record.documentType,
      language: input.record.language,
      engine: input.record.engine,
      templateId: input.record.templateId,
      knowledgeRefs: input.record.knowledgeRefs,
      preferredOutline: input.record.draft.outline.map((item) => item.title),
    })
    normalized.id = input.record.documentId
    normalized.outline = normalizeOutline({
      sections: normalized.sections,
      outline: input.outline,
      fallbackOutline: normalized.outline,
    })
    return normalized
  }
  if (typeof input.html === 'string' && input.html.trim()) {
    return parseEditableHtmlToDraft({
      html: input.html,
      title: title || undefined,
      record: input.record,
      outline: input.outline,
    })
  }
  return {
    ...input.record.draft,
    title: title || input.record.draft.title,
    outline: normalizeOutline({
      sections: input.record.draft.sections,
      outline: input.outline,
      fallbackOutline: input.record.draft.outline,
    }),
  }
}
