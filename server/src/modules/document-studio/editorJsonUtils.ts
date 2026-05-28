import { randomUUID } from 'crypto'

export interface DocumentBlock {
  id: string
  type: 'heading' | 'paragraph' | 'blockquote' | 'list'
  level?: number
  role?: string
  text: string
  items?: string[]
}

export interface StudioDocumentJson {
  id: string
  type: string
  title: string
  blocks: DocumentBlock[]
}

function nextBlockId(index: number): string {
  return `block-${String(index + 1).padStart(3, '0')}`
}

export function plainTextFromEditorJson(editorJson: Record<string, unknown> | undefined): string {
  if (!editorJson || editorJson.type !== 'doc' || !Array.isArray(editorJson.content)) {
    return ''
  }
  const lines: string[] = []
  const walk = (nodes: unknown[]) => {
    for (const node of nodes) {
      if (!node || typeof node !== 'object') continue
      const n = node as { type?: string; content?: unknown[]; text?: string; attrs?: { level?: number } }
      if (n.type === 'text' && typeof n.text === 'string') {
        lines.push(n.text)
      } else if (Array.isArray(n.content)) {
        walk(n.content)
        if (['paragraph', 'heading', 'blockquote', 'listItem'].includes(String(n.type))) {
          lines.push('')
        }
      }
    }
  }
  walk(editorJson.content as unknown[])
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

export function editorJsonFromBlocks(blocks: DocumentBlock[]): Record<string, unknown> {
  const content = blocks.map(block => {
    if (block.type === 'heading') {
      return {
        type: 'heading',
        attrs: { level: block.level ?? 1, blockId: block.id, role: block.role ?? 'heading' },
        content: [{ type: 'text', text: block.text }],
      }
    }
    if (block.type === 'blockquote') {
      return {
        type: 'blockquote',
        attrs: { blockId: block.id, role: block.role ?? 'quote' },
        content: [
          {
            type: 'paragraph',
            attrs: { blockId: `${block.id}-p`, role: 'body' },
            content: [{ type: 'text', text: block.text }],
          },
        ],
      }
    }
    if (block.type === 'list' && block.items?.length) {
      return {
        type: 'bulletList',
        attrs: { blockId: block.id, role: block.role ?? 'list' },
        content: block.items.map((item, i) => ({
          type: 'listItem',
          attrs: { blockId: `${block.id}-li-${i + 1}` },
          content: [
            {
              type: 'paragraph',
              attrs: { blockId: `${block.id}-p-${i + 1}`, role: 'body' },
              content: [{ type: 'text', text: item }],
            },
          ],
        })),
      }
    }
    return {
      type: 'paragraph',
      attrs: { blockId: block.id, role: block.role ?? 'body' },
      content: [{ type: 'text', text: block.text }],
    }
  })
  return { type: 'doc', content }
}

export function documentJsonFromEditor(
  documentId: string,
  documentType: string,
  title: string,
  editorJson: Record<string, unknown>,
): StudioDocumentJson {
  const blocks: DocumentBlock[] = []
  let index = 0
  const content = Array.isArray(editorJson.content) ? editorJson.content : []
  for (const node of content) {
    if (!node || typeof node !== 'object') continue
    const n = node as {
      type?: string
      attrs?: { blockId?: string; level?: number; role?: string }
      content?: Array<{ type?: string; text?: string; content?: unknown[] }>
    }
    const blockId = n.attrs?.blockId || nextBlockId(index)
    const textParts: string[] = []
    const collectText = (items: unknown[] | undefined) => {
      if (!items) return
      for (const item of items) {
        if (!item || typeof item !== 'object') continue
        const t = item as { type?: string; text?: string; content?: unknown[] }
        if (t.type === 'text' && t.text) textParts.push(t.text)
        else if (t.content) collectText(t.content)
      }
    }
    collectText(n.content as unknown[] | undefined)
    const text = textParts.join('').trim()
    if (!text && n.type !== 'table') continue
    if (n.type === 'heading') {
      blocks.push({
        id: blockId,
        type: 'heading',
        level: n.attrs?.level ?? 1,
        role: n.attrs?.role,
        text,
      })
    } else if (n.type === 'blockquote') {
      blocks.push({ id: blockId, type: 'blockquote', role: n.attrs?.role, text })
    } else if (n.type === 'bulletList' || n.type === 'orderedList') {
      const items: string[] = []
      for (const li of n.content || []) {
        const liText: string[] = []
        const walkLi = (nodes: unknown[] | undefined) => {
          if (!nodes) return
          for (const x of nodes) {
            if (!x || typeof x !== 'object') continue
            const lx = x as { type?: string; text?: string; content?: unknown[] }
            if (lx.type === 'text' && lx.text) liText.push(lx.text)
            else if (lx.content) walkLi(lx.content)
          }
        }
        walkLi((li as { content?: unknown[] }).content)
        if (liText.join('').trim()) items.push(liText.join('').trim())
      }
      blocks.push({ id: blockId, type: 'list', role: n.attrs?.role, text: items.join('\n'), items })
    } else {
      blocks.push({ id: blockId, type: 'paragraph', role: n.attrs?.role, text })
    }
    index += 1
  }
  return { id: documentId, type: documentType, title, blocks }
}

export function markdownFromDocument(doc: StudioDocumentJson): string {
  const lines: string[] = [`# ${doc.title}`, '']
  for (const block of doc.blocks) {
    if (block.type === 'heading') {
      const level = Math.min(6, Math.max(1, block.level ?? 2))
      lines.push(`${'#'.repeat(level)} ${block.text}`, '')
    } else if (block.type === 'blockquote') {
      lines.push(`> ${block.text}`, '')
    } else if (block.type === 'list' && block.items?.length) {
      for (const item of block.items) lines.push(`- ${item}`)
      lines.push('')
    } else {
      lines.push(block.text, '')
    }
  }
  return lines.join('\n').trim() + '\n'
}

export function htmlFromDocument(doc: StudioDocumentJson): string {
  const body = doc.blocks
    .map(block => {
      if (block.type === 'heading') {
        const level = Math.min(6, Math.max(1, block.level ?? 2))
        return `<h${level} data-block-id="${block.id}">${escapeHtml(block.text)}</h${level}>`
      }
      if (block.type === 'blockquote') {
        return `<blockquote data-block-id="${block.id}"><p>${escapeHtml(block.text)}</p></blockquote>`
      }
      if (block.type === 'list' && block.items?.length) {
        const lis = block.items.map(i => `<li>${escapeHtml(i)}</li>`).join('')
        return `<ul data-block-id="${block.id}">${lis}</ul>`
      }
      return `<p data-block-id="${block.id}">${escapeHtml(block.text)}</p>`
    })
    .join('\n')
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(doc.title)}</title>
  <style>
    body { font-family: "Noto Sans SC", "PingFang SC", sans-serif; max-width: 720px; margin: 2rem auto; line-height: 1.75; color: #1e293b; }
    h1,h2,h3 { color: #0f172a; }
    blockquote { border-left: 4px solid #cbd5e1; margin: 1rem 0; padding-left: 1rem; color: #475569; }
  </style>
</head>
<body>
  <h1>${escapeHtml(doc.title)}</h1>
  ${body}
</body>
</html>`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function emptyEditorJson(title = '未命名文稿'): Record<string, unknown> {
  return editorJsonFromBlocks([
    { id: 'block-001', type: 'heading', level: 1, role: 'title', text: title },
    { id: 'block-002', type: 'paragraph', role: 'body', text: '' },
  ])
}

export function parseLlmDocumentOutput(raw: {
  title?: string
  blocks?: Array<{ type?: string; level?: number; role?: string; text?: string; items?: string[] }>
}): { title: string; blocks: DocumentBlock[] } {
  const title = String(raw.title || '未命名文稿').trim() || '未命名文稿'
  const blocks: DocumentBlock[] = []
  const source = Array.isArray(raw.blocks) ? raw.blocks : []
  source.forEach((b, i) => {
    const id = nextBlockId(i)
    const type = b.type === 'heading' ? 'heading' : b.type === 'blockquote' ? 'blockquote' : b.type === 'list' ? 'list' : 'paragraph'
    blocks.push({
      id,
      type,
      level: b.level,
      role: b.role,
      text: String(b.text || '').trim(),
      items: Array.isArray(b.items) ? b.items.map(String) : undefined,
    })
  })
  if (!blocks.length) {
    blocks.push({ id: 'block-001', type: 'heading', level: 1, text: title })
    blocks.push({ id: 'block-002', type: 'paragraph', text: '（生成内容为空，请重试或补充需求。）' })
  }
  return { title, blocks }
}

export function newStudioDocumentId(): string {
  return `dstudio_${randomUUID().replace(/-/g, '').slice(0, 16)}`
}

export function newStudioArtifactId(): string {
  return `dart_${randomUUID().replace(/-/g, '').slice(0, 16)}`
}

export function newStudioJobId(): string {
  return `job_${randomUUID().replace(/-/g, '').slice(0, 16)}`
}

export function isStudioDocumentId(documentId: string): boolean {
  return documentId.startsWith('dstudio_')
}
