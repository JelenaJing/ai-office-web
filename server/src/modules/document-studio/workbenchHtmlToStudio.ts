import { parseDocument } from 'htmlparser2'
import type { Element, Node } from 'domhandler'
import { getAttributeValue, getName, getText, isTag } from 'domutils'
import type { DocumentBlock } from './editorJsonUtils'

function normalizeText(value: string): string {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function collectElements(nodes: Node[] | undefined, matcher: (node: Element) => boolean, acc: Element[] = []): Element[] {
  if (!Array.isArray(nodes)) return acc
  for (const node of nodes) {
    if (!isTag(node)) continue
    if (matcher(node)) acc.push(node)
    collectElements(node.children, matcher, acc)
  }
  return acc
}

function nextBlockId(index: number): string {
  return `block-${String(index + 1).padStart(3, '0')}`
}

export function workbenchHtmlToStudioBlocks(html: string, fallbackTitle: string): { title: string; blocks: DocumentBlock[] } {
  const parsed = parseDocument(String(html || ''))
  const rootNodes = parsed.children || []
  const titleNode = collectElements(rootNodes, (node) =>
    getName(node) === 'h1' && getAttributeValue(node, 'data-document-title') === 'true',
  )[0]
  const title = normalizeText(titleNode ? getText(titleNode) : '') || fallbackTitle.trim() || '未命名文稿'

  const blocks: DocumentBlock[] = []
  let index = 0

  const pushBlock = (block: DocumentBlock) => {
    blocks.push(block)
    index += 1
  }

  if (titleNode) {
    pushBlock({
      id: getAttributeValue(titleNode, 'data-block-id') || 'document-title',
      type: 'heading',
      level: 1,
      role: 'title',
      text: title,
    })
  }

  const bodySections = collectElements(rootNodes, (node) => getName(node) === 'section' && getAttributeValue(node, 'data-document-body') === 'true')
  const scopeNodes = bodySections.length > 0 ? bodySections : rootNodes

  const walkSection = (section: Element) => {
    for (const child of section.children || []) {
      if (!isTag(child)) continue
      const tag = getName(child)
      const blockId = getAttributeValue(child, 'data-block-id') || nextBlockId(index)

      if (['h2', 'h3', 'h4'].includes(tag)) {
        pushBlock({
          id: blockId,
          type: 'heading',
          level: tag === 'h3' ? 2 : tag === 'h4' ? 3 : 2,
          role: 'heading',
          text: normalizeText(getText(child)),
        })
        continue
      }

      if (tag === 'p') {
        const text = normalizeText(getText(child))
        if (text) {
          pushBlock({ id: blockId, type: 'paragraph', role: 'paragraph', text })
        }
        continue
      }

      if (tag === 'ul' || tag === 'ol') {
        const items = collectElements(child.children, (node) => getName(node) === 'li')
          .map((li) => normalizeText(getText(li)))
          .filter(Boolean)
        if (items.length > 0) {
          pushBlock({ id: blockId, type: 'list', role: 'list', text: items.join('\n'), items })
        }
        continue
      }

      if (tag === 'blockquote') {
        const text = normalizeText(getText(child))
        if (text) {
          pushBlock({ id: blockId, type: 'blockquote', role: 'quote', text })
        }
        continue
      }

      if (tag === 'div' && getAttributeValue(child, 'data-block-type') === 'table') {
        const text = normalizeText(getText(child))
        if (text) {
          pushBlock({ id: blockId, type: 'paragraph', role: 'table', text })
        }
      }
    }
  }

  if (bodySections.length > 0) {
    bodySections.forEach(walkSection)
  } else {
    for (const node of collectElements(rootNodes, (n) => ['h2', 'h3', 'p', 'ul', 'ol', 'blockquote'].includes(getName(n)))) {
      const tag = getName(node)
      const blockId = getAttributeValue(node, 'data-block-id') || nextBlockId(index)
      if (['h2', 'h3'].includes(tag)) {
        pushBlock({ id: blockId, type: 'heading', level: tag === 'h3' ? 2 : 2, text: normalizeText(getText(node)) })
      } else if (tag === 'p') {
        const text = normalizeText(getText(node))
        if (text) pushBlock({ id: blockId, type: 'paragraph', text })
      } else if (tag === 'ul' || tag === 'ol') {
        const items = collectElements(node.children, (n) => getName(n) === 'li').map((li) => normalizeText(getText(li))).filter(Boolean)
        if (items.length) pushBlock({ id: blockId, type: 'list', text: items.join('\n'), items })
      } else if (tag === 'blockquote') {
        const text = normalizeText(getText(node))
        if (text) pushBlock({ id: blockId, type: 'blockquote', text })
      }
    }
  }

  if (!blocks.length) {
    pushBlock({ id: 'block-001', type: 'heading', level: 1, text: title })
    pushBlock({ id: 'block-002', type: 'paragraph', text: '' })
  }

  return { title, blocks }
}
