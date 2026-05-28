export interface ContentBlock {
  id: string
  type: 'heading' | 'paragraph' | 'blockquote' | 'list'
  level?: number
  text: string
  items?: string[]
}

export interface StudioContentModel {
  title?: string
  blocks?: ContentBlock[]
}

const SUPPORTED_BLOCK_TYPES = new Set([
  'doc',
  'paragraph',
  'heading',
  'text',
  'bulletList',
  'orderedList',
  'listItem',
  'blockquote',
])

const SUPPORTED_MARK_TYPES = new Set(['bold', 'italic', 'underline'])

function nextBlockId(index: number): string {
  return `block-${String(index + 1).padStart(3, '0')}`
}

export function collectTextFromNodes(nodes: unknown[]): string {
  let out = ''
  for (const node of nodes) {
    if (!node || typeof node !== 'object') continue
    const n = node as { type?: string; text?: string; content?: unknown[] }
    if (n.type === 'text' && n.text) out += n.text
    else if (n.content) out += collectTextFromNodes(n.content)
  }
  return out
}

export function extractPlainTextFromEditorJson(json: Record<string, unknown> | null | undefined): string {
  if (!json || json.type !== 'doc' || !Array.isArray(json.content)) return ''
  return collectTextFromNodes(json.content as unknown[]).trim()
}

export function isEditorJsonRenderable(json: Record<string, unknown> | null | undefined): boolean {
  if (!json || json.type !== 'doc' || !Array.isArray(json.content)) return false
  if (json.content.length === 0) return false
  return extractPlainTextFromEditorJson(json).length > 0
}

function sanitizeMarks(marks: unknown[] | undefined): unknown[] | undefined {
  if (!marks?.length) return undefined
  const filtered = marks.filter(m => {
    if (!m || typeof m !== 'object') return false
    return SUPPORTED_MARK_TYPES.has(String((m as { type?: string }).type || ''))
  })
  return filtered.length ? filtered : undefined
}

function sanitizeInlineContent(content: unknown[] | undefined): unknown[] {
  if (!content?.length) return []
  const out: unknown[] = []
  for (const item of content) {
    if (!item || typeof item !== 'object') continue
    const n = item as { type?: string; text?: string; marks?: unknown[]; content?: unknown[] }
    if (n.type === 'text') {
      const text = typeof n.text === 'string' ? n.text : ''
      if (!text) continue
      const marks = sanitizeMarks(n.marks)
      out.push(marks ? { type: 'text', text, marks } : { type: 'text', text })
    }
  }
  return out
}

function sanitizeBlockNode(node: unknown, blockIndex: { value: number }): unknown | null {
  if (!node || typeof node !== 'object') return null
  const n = node as {
    type?: string
    attrs?: Record<string, unknown>
    content?: unknown[]
    text?: string
  }
  const type = String(n.type || '')
  const attrs = { ...(n.attrs || {}) }

  if (type === 'heading') {
    const level = Math.min(3, Math.max(1, Number(attrs.level) || 1))
    if (!attrs.blockId) {
      blockIndex.value += 1
      attrs.blockId = nextBlockId(blockIndex.value - 1)
    }
    const inline = sanitizeInlineContent(n.content)
    if (!inline.length) return null
    return { type: 'heading', attrs: { ...attrs, level }, content: inline }
  }

  if (type === 'blockquote') {
    if (!attrs.blockId) {
      blockIndex.value += 1
      attrs.blockId = nextBlockId(blockIndex.value - 1)
    }
    const inner = (n.content || [])
      .map(child => sanitizeBlockNode(child, blockIndex))
      .filter(Boolean) as unknown[]
    if (!inner.length) {
      const text = collectTextFromNodes(n.content || []).trim()
      if (!text) return null
      blockIndex.value += 1
      return {
        type: 'blockquote',
        attrs,
        content: [
          {
            type: 'paragraph',
            attrs: { blockId: nextBlockId(blockIndex.value - 1) },
            content: [{ type: 'text', text }],
          },
        ],
      }
    }
    return { type: 'blockquote', attrs, content: inner }
  }

  if (type === 'bulletList' || type === 'orderedList') {
    const items = (n.content || [])
      .map(child => sanitizeBlockNode(child, blockIndex))
      .filter(Boolean) as unknown[]
    if (!items.length) return null
    return { type, content: items }
  }

  if (type === 'listItem') {
    if (!attrs.blockId) {
      blockIndex.value += 1
      attrs.blockId = nextBlockId(blockIndex.value - 1)
    }
    const inner = (n.content || [])
      .map(child => sanitizeBlockNode(child, blockIndex))
      .filter(Boolean) as unknown[]
    if (!inner.length) return null
    return { type: 'listItem', attrs, content: inner }
  }

  if (type === 'paragraph') {
    if (!attrs.blockId) {
      blockIndex.value += 1
      attrs.blockId = nextBlockId(blockIndex.value - 1)
    }
    const inline = sanitizeInlineContent(n.content)
    if (!inline.length) return null
    return { type: 'paragraph', attrs, content: inline }
  }

  if (SUPPORTED_BLOCK_TYPES.has(type)) {
    return null
  }

  const fallbackText = collectTextFromNodes(n.content || []).trim() || (typeof n.text === 'string' ? n.text.trim() : '')
  if (!fallbackText) return null
  blockIndex.value += 1
  return {
    type: 'paragraph',
    attrs: { blockId: nextBlockId(blockIndex.value - 1), role: attrs.role ?? 'body' },
    content: [{ type: 'text', text: fallbackText }],
  }
}

export function sanitizeEditorJson(json: Record<string, unknown> | null | undefined): Record<string, unknown> | null {
  if (!json || typeof json !== 'object') return null
  const blockIndex = { value: 0 }
  const rawContent = Array.isArray(json.content) ? json.content : []
  const content = rawContent
    .map(node => sanitizeBlockNode(node, blockIndex))
    .filter(Boolean) as unknown[]
  if (!content.length) return null
  const sanitized = { type: 'doc', content }
  return isEditorJsonRenderable(sanitized) ? sanitized : null
}

export function blocksToEditorJson(blocks: ContentBlock[]): Record<string, unknown> {
  const content = blocks.map(block => {
    if (block.type === 'heading') {
      return {
        type: 'heading',
        attrs: { level: block.level ?? 1, blockId: block.id },
        content: block.text ? [{ type: 'text', text: block.text }] : [],
      }
    }
    if (block.type === 'blockquote') {
      return {
        type: 'blockquote',
        attrs: { blockId: block.id },
        content: [
          {
            type: 'paragraph',
            attrs: { blockId: `${block.id}-p` },
            content: block.text ? [{ type: 'text', text: block.text }] : [],
          },
        ],
      }
    }
    if (block.type === 'list' && block.items?.length) {
      return {
        type: 'bulletList',
        content: block.items.map((item, i) => ({
          type: 'listItem',
          attrs: { blockId: `${block.id}-li-${i + 1}` },
          content: [
            {
              type: 'paragraph',
              attrs: { blockId: `${block.id}-p-${i + 1}` },
              content: [{ type: 'text', text: item }],
            },
          ],
        })),
      }
    }
    return {
      type: 'paragraph',
      attrs: { blockId: block.id },
      content: block.text ? [{ type: 'text', text: block.text }] : [],
    }
  })
  return { type: 'doc', content }
}

export function markdownToEditorJson(markdown: string): Record<string, unknown> | null {
  const text = markdown.trim()
  if (!text) return null
  const blocks: ContentBlock[] = []
  const lines = text.split(/\r?\n/)
  let index = 0
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/)
    if (heading) {
      blocks.push({
        id: nextBlockId(index++),
        type: 'heading',
        level: heading[1].length,
        text: heading[2].trim(),
      })
      continue
    }
    const quote = trimmed.match(/^>\s*(.+)$/)
    if (quote) {
      blocks.push({ id: nextBlockId(index++), type: 'blockquote', text: quote[1].trim() })
      continue
    }
    blocks.push({ id: nextBlockId(index++), type: 'paragraph', text: trimmed })
  }
  if (!blocks.length) return null
  const json = blocksToEditorJson(blocks)
  return isEditorJsonRenderable(json) ? json : null
}

export function resolveEditorJsonForStudio(input: {
  editorJson?: Record<string, unknown> | null
  contentModel?: Record<string, unknown> | null
  documentMarkdown?: string | null
  title?: string
}): Record<string, unknown> | null {
  const fromEditor = sanitizeEditorJson(input.editorJson as Record<string, unknown> | undefined)
  if (fromEditor) return fromEditor

  const model = input.contentModel as StudioContentModel | undefined
  if (model?.blocks?.length) {
    const fromBlocks = sanitizeEditorJson(blocksToEditorJson(model.blocks))
    if (fromBlocks) return fromBlocks
  }

  if (input.documentMarkdown?.trim()) {
    const fromMd = markdownToEditorJson(input.documentMarkdown)
    if (fromMd) return fromMd
  }

  return null
}

export function editorJsonContentVersion(json: Record<string, unknown> | null | undefined): string {
  if (!json) return 'empty'
  return `${Array.isArray(json.content) ? json.content.length : 0}:${extractPlainTextFromEditorJson(json).slice(0, 64)}`
}

export function logDocumentLoadSummary(input: {
  documentId: string
  title: string
  editorJson?: Record<string, unknown> | null
  contentModel?: Record<string, unknown> | null
  documentMarkdown?: string | null
  resolved?: Record<string, unknown> | null
}): void {
  const raw = input.editorJson
  const blocksLen = (input.contentModel as StudioContentModel | undefined)?.blocks?.length ?? 0
  const preview = extractPlainTextFromEditorJson(raw).slice(0, 300)
  const resolvedPreview = extractPlainTextFromEditorJson(input.resolved).slice(0, 120)

  console.debug('[DocumentStudio] load', {
    documentId: input.documentId,
    title: input.title,
    editorJsonExists: Boolean(raw && raw.type === 'doc'),
    editorJsonContentLength: Array.isArray(raw?.content) ? raw.content.length : 0,
    editorJsonTextPreview: preview,
    contentModelBlocksLength: blocksLen,
    documentMarkdownLength: input.documentMarkdown?.length ?? 0,
    resolvedContentLength: Array.isArray(input.resolved?.content) ? input.resolved.content.length : 0,
    resolvedTextPreview: resolvedPreview,
  })

  if (!input.resolved) {
    console.warn('[DocumentStudio] 文稿内容未解析：editorJson / contentModel / document.md 均无可用正文')
  } else if (!raw || !isEditorJsonRenderable(raw)) {
    console.warn('[DocumentStudio] editorJson 不可用，已使用 fallback 内容', {
      source: blocksLen > 0 ? 'contentModel.blocks' : input.documentMarkdown ? 'document.md' : 'unknown',
    })
  }
}

export interface OutlineHeading {
  blockId: string
  level: number
  text: string
}

export function extractOutlineFromEditorJson(json: Record<string, unknown> | null): OutlineHeading[] {
  if (!json || !Array.isArray(json.content)) return []
  const items: OutlineHeading[] = []
  const walk = (nodes: unknown[]) => {
    for (const node of nodes) {
      if (!node || typeof node !== 'object') continue
      const n = node as {
        type?: string
        attrs?: { blockId?: string; level?: number }
        content?: unknown[]
      }
      if (n.type === 'heading') {
        const text = collectTextFromNodes((n.content as unknown[]) || []).trim()
        if (text) {
          items.push({
            blockId: String(n.attrs?.blockId || `h-${items.length}`),
            level: n.attrs?.level ?? 1,
            text,
          })
        }
      }
      if (n.content) walk(n.content)
    }
  }
  walk(json.content as unknown[])
  return items
}
