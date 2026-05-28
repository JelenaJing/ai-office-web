import { Extension } from '@tiptap/core'

export const BlockIdExtension = Extension.create({
  name: 'blockId',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading', 'blockquote', 'listItem', 'tableCell'],
        attributes: {
          blockId: {
            default: null,
            parseHTML: element => element.getAttribute('data-block-id'),
            renderHTML: attributes => {
              if (!attributes.blockId) return {}
              return { 'data-block-id': attributes.blockId }
            },
          },
          role: {
            default: null,
            parseHTML: element => element.getAttribute('data-role'),
            renderHTML: attributes => {
              if (!attributes.role) return {}
              return { 'data-role': attributes.role }
            },
          },
        },
      },
    ]
  },
})

export function ensureBlockIdsInJson(doc: Record<string, unknown>): Record<string, unknown> {
  let index = 0
  const walk = (nodes: unknown[]): unknown[] =>
    nodes.map(node => {
      if (!node || typeof node !== 'object') return node
      const n = { ...(node as Record<string, unknown>) }
      const type = String(n.type || '')
      if (['paragraph', 'heading', 'blockquote', 'listItem'].includes(type)) {
        const attrs = { ...(n.attrs as Record<string, unknown> | undefined) }
        if (!attrs.blockId) {
          index += 1
          attrs.blockId = `block-${String(index).padStart(3, '0')}`
        }
        n.attrs = attrs
      }
      if (Array.isArray(n.content)) n.content = walk(n.content)
      return n
    })
  if (doc.type === 'doc' && Array.isArray(doc.content)) {
    return { ...doc, content: walk(doc.content) }
  }
  return doc
}
