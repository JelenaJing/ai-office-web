import type { DocumentEditPatch } from './documentWorkbenchApi'
import type { FormatOp } from './documentCommandEngine'

export interface ApplyDocumentEditPatchResult {
  applied: boolean
  html: string
  affectedSectionId: string | null
}

function buildFragmentFromPatch(root: HTMLElement, patch: DocumentEditPatch): DocumentFragment {
  const range = root.ownerDocument.createRange()
  if (patch.type === 'replace_selection') {
    const fragment = root.ownerDocument.createDocumentFragment()
    const mark = root.ownerDocument.createElement('mark')
    mark.dataset.aiChange = 'true'
    mark.textContent = patch.replacementText
    fragment.appendChild(mark)
    return fragment
  }
  if (patch.type === 'replace_block_text') {
    const fragment = root.ownerDocument.createDocumentFragment()
    const textNode = root.ownerDocument.createTextNode(patch.replacementText)
    fragment.appendChild(textNode)
    return fragment
  }
  const html = patch.type === 'replace_document'
    ? patch.html
    : patch.type === 'replace_section'
      ? patch.html || ''
      : patch.type === 'insert_at_cursor'
        ? patch.html || patch.text || ''
        : patch.type === 'insert_citation'
          ? patch.html
        : ''
  return range.createContextualFragment(html)
}

function isRangeInsideRoot(root: HTMLElement, range: Range | null | undefined): range is Range {
  if (!range) return false
  return root.contains(range.startContainer) && root.contains(range.endContainer)
}

function replaceCurrentRange(root: HTMLElement, range: Range, patch: DocumentEditPatch): ApplyDocumentEditPatchResult {
  const sectionElement = (range.commonAncestorContainer instanceof Element
    ? range.commonAncestorContainer
    : range.commonAncestorContainer.parentElement)?.closest<HTMLElement>('[data-section-id]')
  range.deleteContents()
  range.insertNode(buildFragmentFromPatch(root, patch))
  return {
    applied: true,
    html: root.innerHTML,
    affectedSectionId: sectionElement?.dataset.sectionId || null,
  }
}

function replaceSelectionByText(root: HTMLElement, patch: Extract<DocumentEditPatch, { type: 'replace_selection' }>, sectionId?: string | null): ApplyDocumentEditPatchResult {
  const scope = sectionId
    ? root.querySelector<HTMLElement>(`section[data-section-id="${CSS.escape(sectionId)}"]`) || root
    : root
  const walker = root.ownerDocument.createTreeWalker(scope, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    const textNode = walker.currentNode as Text
    const content = textNode.nodeValue || ''
    const index = content.indexOf(patch.selectedText)
    if (index < 0) continue
    const range = root.ownerDocument.createRange()
    range.setStart(textNode, index)
    range.setEnd(textNode, index + patch.selectedText.length)
    range.deleteContents()
    range.insertNode(buildFragmentFromPatch(root, patch))
    return {
      applied: true,
      html: root.innerHTML,
      affectedSectionId: sectionId || textNode.parentElement?.closest<HTMLElement>('[data-section-id]')?.dataset.sectionId || null,
    }
  }
  return { applied: false, html: root.innerHTML, affectedSectionId: sectionId || null }
}

function replaceSection(root: HTMLElement, patch: Extract<DocumentEditPatch, { type: 'replace_section' }>): ApplyDocumentEditPatchResult {
  const target = root.querySelector<HTMLElement>(`section[data-section-id="${CSS.escape(patch.sectionId)}"]`)
  if (!target) return { applied: false, html: root.innerHTML, affectedSectionId: null }
  if (patch.html) {
    target.innerHTML = patch.html
  } else if (patch.markdown) {
    target.textContent = patch.markdown
  }
  return {
    applied: true,
    html: root.innerHTML,
    affectedSectionId: patch.sectionId,
  }
}

function replaceDocument(root: HTMLElement, patch: Extract<DocumentEditPatch, { type: 'replace_document' }>): ApplyDocumentEditPatchResult {
  root.innerHTML = patch.html
  return {
    applied: true,
    html: root.innerHTML,
    affectedSectionId: null,
  }
}

function replaceBlockText(root: HTMLElement, patch: Extract<DocumentEditPatch, { type: 'replace_block_text' }>): ApplyDocumentEditPatchResult {
  const block = root.querySelector<HTMLElement>(`[data-block-id="${CSS.escape(patch.blockId)}"]`)
  if (!block) return { applied: false, html: root.innerHTML, affectedSectionId: null }
  if (block.tagName.toLowerCase() === 'table' || block.matches('.document-table-block')) {
    return { applied: false, html: root.innerHTML, affectedSectionId: block.closest<HTMLElement>('[data-section-id]')?.dataset.sectionId || null }
  }
  block.textContent = patch.replacementText
  return {
    applied: true,
    html: root.innerHTML,
    affectedSectionId: block.closest<HTMLElement>('[data-section-id]')?.dataset.sectionId || null,
  }
}

function appendSection(root: HTMLElement, patch: Extract<DocumentEditPatch, { type: 'append_section' }>): ApplyDocumentEditPatchResult {
  const article = root.querySelector('[data-document-root="true"]') || root
  const section = root.ownerDocument.createElement('section')
  const nextSection = patch.section as { id?: string; title?: string; content?: string }
  section.dataset.sectionId = String(nextSection.id || `section-${Date.now()}`)
  section.dataset.sectionTitle = String(nextSection.title || '新增章节')
  section.dataset.sectionLevel = '1'
  const heading = root.ownerDocument.createElement('h2')
  heading.dataset.sectionHeading = 'true'
  heading.textContent = String(nextSection.title || '新增章节')
  section.appendChild(heading)
  if (nextSection.content) {
    String(nextSection.content).split(/\n{2,}/).forEach((paragraph) => {
      const p = root.ownerDocument.createElement('p')
      p.textContent = paragraph
      section.appendChild(p)
    })
  }
  article.appendChild(section)
  return {
    applied: true,
    html: root.innerHTML,
    affectedSectionId: section.dataset.sectionId || null,
  }
}

function insertAtCursor(root: HTMLElement, patch: Extract<DocumentEditPatch, { type: 'insert_at_cursor' }>, range?: Range | null): ApplyDocumentEditPatchResult {
  if (!isRangeInsideRoot(root, range)) return { applied: false, html: root.innerHTML, affectedSectionId: null }
  range.deleteContents()
  range.insertNode(buildFragmentFromPatch(root, patch))
  return {
    applied: true,
    html: root.innerHTML,
    affectedSectionId: range.startContainer.parentElement?.closest<HTMLElement>('[data-section-id]')?.dataset.sectionId || null,
  }
}

function insertCitation(root: HTMLElement, patch: Extract<DocumentEditPatch, { type: 'insert_citation' }>, range?: Range | null): ApplyDocumentEditPatchResult {
  if (!isRangeInsideRoot(root, range)) return { applied: false, html: root.innerHTML, affectedSectionId: null }
  range.deleteContents()
  range.insertNode(buildFragmentFromPatch(root, patch))
  return {
    applied: true,
    html: root.innerHTML,
    affectedSectionId: range.startContainer.parentElement?.closest<HTMLElement>('[data-section-id]')?.dataset.sectionId || null,
  }
}

export function applyDocumentEditPatch(input: {
  root: HTMLElement
  patch: DocumentEditPatch
  savedRange?: Range | null
  selectedSectionId?: string | null
}): ApplyDocumentEditPatchResult {
  const { root, patch, savedRange, selectedSectionId } = input
  if (patch.type === 'replace_document') {
    return replaceDocument(root, patch)
  }
  if (patch.type === 'replace_section') {
    return replaceSection(root, patch)
  }
  if (patch.type === 'replace_selection') {
    if (isRangeInsideRoot(root, savedRange)) {
      return replaceCurrentRange(root, savedRange, patch)
    }
    return replaceSelectionByText(root, patch, selectedSectionId)
  }
  if (patch.type === 'replace_block_text') {
    return replaceBlockText(root, patch)
  }
  if (patch.type === 'insert_at_cursor') {
    return insertAtCursor(root, patch, savedRange)
  }
  if (patch.type === 'insert_citation') {
    return insertCitation(root, patch, savedRange)
  }
  if (patch.type === 'append_section') {
    return appendSection(root, patch)
  }
  return { applied: false, html: root.innerHTML, affectedSectionId: null }
}

// ──────────────────────────────────────────────────────────────────────────────
// applyFormatOp — deterministic format operations, no AI needed
// ──────────────────────────────────────────────────────────────────────────────

export interface ApplyFormatOpResult {
  applied: boolean
  html: string
  affectedBlockIds: string[]
  previousTexts: Record<string, string>
}

export function applyFormatOp(root: HTMLElement, op: FormatOp): ApplyFormatOpResult {
  const affectedBlockIds: string[] = []
  const previousTexts: Record<string, string> = {}

  for (const blockId of op.blockIds) {
    const block = root.querySelector<HTMLElement>(`[data-block-id="${CSS.escape(blockId)}"]`)
    if (!block) continue
    previousTexts[blockId] = block.innerHTML
    affectedBlockIds.push(blockId)

    if (op.type === 'highlight') {
      block.style.backgroundColor = 'rgba(253, 224, 71, 0.35)'
      block.dataset.formatHighlight = 'true'
    } else if (op.type === 'bold') {
      block.style.fontWeight = block.style.fontWeight === 'bold' ? '' : 'bold'
      block.dataset.formatBold = 'true'
    } else if (op.type === 'italic') {
      block.style.fontStyle = block.style.fontStyle === 'italic' ? '' : 'italic'
      block.dataset.formatItalic = 'true'
    } else if (op.type === 'center') {
      block.style.textAlign = block.style.textAlign === 'center' ? '' : 'center'
      block.dataset.formatCenter = 'true'
    } else if (op.type === 'clear_formatting') {
      block.removeAttribute('style')
      delete block.dataset.formatHighlight
      delete block.dataset.formatBold
      delete block.dataset.formatItalic
      delete block.dataset.formatCenter
    }
  }

  return {
    applied: affectedBlockIds.length > 0,
    html: root.innerHTML,
    affectedBlockIds,
    previousTexts,
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// undoFormatOp — restore previous innerHTML for each affected block
// ──────────────────────────────────────────────────────────────────────────────

export function undoFormatOp(root: HTMLElement, previousTexts: Record<string, string>): string {
  for (const [blockId, html] of Object.entries(previousTexts)) {
    const block = root.querySelector<HTMLElement>(`[data-block-id="${CSS.escape(blockId)}"]`)
    if (block) {
      block.innerHTML = html
      // clean format flags
      delete block.dataset.formatHighlight
      delete block.dataset.formatBold
      delete block.dataset.formatItalic
      delete block.dataset.formatCenter
      block.removeAttribute('style')
    }
  }
  return root.innerHTML
}

// ──────────────────────────────────────────────────────────────────────────────
// appendCitationToBlock — insert a span.doc-citation at the end of a block
// without needing a cursor range (used by the command engine)
// ──────────────────────────────────────────────────────────────────────────────

export interface AppendCitationToBlockResult {
  applied: boolean
  html: string
  affectedSectionId: string | null
}

export function appendCitationToBlock(
  root: HTMLElement,
  input: {
    blockId: string
    citationId: string
    refId: string
    label: string
    refLabel?: string
    sourceId?: string
    sourceType?: string
    chunkId?: string
    trustLevel?: string
    renderMode?: 'inline' | 'badge' | 'footnote'
  },
): AppendCitationToBlockResult {
  const block = root.querySelector<HTMLElement>(`[data-block-id="${CSS.escape(input.blockId)}"]`)
  if (!block) return { applied: false, html: root.innerHTML, affectedSectionId: null }

  const doc = root.ownerDocument
  const span = doc.createElement('span')
  span.className = 'doc-citation'
  span.dataset.citationId = input.citationId
  span.dataset.refId = input.refId
  span.dataset.refLabel = input.refLabel || input.label
  if (input.sourceId) {
    span.dataset.sourceId = input.sourceId
  }
  if (input.sourceType) {
    span.dataset.sourceType = input.sourceType
  }
  if (input.chunkId) {
    span.dataset.chunkId = input.chunkId
  }
  if (input.trustLevel) {
    span.dataset.trustLevel = input.trustLevel
  }
  span.dataset.renderMode = input.renderMode || 'inline'
  span.setAttribute('data-citation-id', input.citationId)
  span.setAttribute('data-ref-id', input.refId)
  span.setAttribute('data-ref-label', input.refLabel || input.label)
  if (input.sourceId) {
    span.setAttribute('data-source-id', input.sourceId)
  }
  if (input.sourceType) {
    span.setAttribute('data-source-type', input.sourceType)
  }
  if (input.chunkId) {
    span.setAttribute('data-chunk-id', input.chunkId)
  }
  if (input.trustLevel) {
    span.setAttribute('data-trust-level', input.trustLevel)
  }
  span.setAttribute('data-render-mode', input.renderMode || 'inline')
  span.textContent = `[${input.label}]`
  span.style.cssText = 'color: #1d4ed8; font-size: 0.85em; vertical-align: super; cursor: pointer; margin-left: 2px;'

  block.appendChild(span)

  return {
    applied: true,
    html: root.innerHTML,
    affectedSectionId: block.closest<HTMLElement>('[data-section-id]')?.dataset.sectionId || null,
  }
}
