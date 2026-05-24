import type { DocumentEditPatch } from './documentWorkbenchApi'

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
  const html = patch.type === 'replace_document'
    ? patch.html
    : patch.type === 'replace_section'
      ? patch.html || ''
      : patch.type === 'insert_at_cursor'
        ? patch.html || patch.text || ''
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
  if (patch.type === 'insert_at_cursor') {
    return insertAtCursor(root, patch, savedRange)
  }
  if (patch.type === 'append_section') {
    return appendSection(root, patch)
  }
  return { applied: false, html: root.innerHTML, affectedSectionId: null }
}
