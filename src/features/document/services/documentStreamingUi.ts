import type { RefObject } from 'react'
import type { A4EditorHandle } from '../components/A4RichTextEditor'

export interface DocumentStreamProgress {
  current: number
  total: number
  label: string
  html: string
}

export interface DocumentStreamResult {
  cancelled: boolean
  insertedBlocks: number
  totalBlocks: number
  html: string
}

export interface DocumentStreamController {
  cancel: () => void
  promise: Promise<DocumentStreamResult>
}

export interface StreamHtmlIntoEditorOptions {
  editorRef: RefObject<A4EditorHandle | null>
  html: string
  mode: 'replace' | 'append'
  intervalMs?: number
  onProgress?: (progress: DocumentStreamProgress) => void
  onDone?: () => void
  onError?: (error: Error) => void
}

const BLOCK_TAGS = new Set([
  'P',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'BLOCKQUOTE',
  'PRE',
  'TABLE',
  'HR',
])

function textNodeToParagraph(text: string): string {
  const p = document.createElement('p')
  p.textContent = text
  return p.outerHTML
}

function splitHtmlIntoBlocks(html: string): string[] {
  const trimmed = String(html || '').trim()
  if (!trimmed) return []
  if (typeof document === 'undefined') return [trimmed]

  const container = document.createElement('div')
  container.innerHTML = trimmed
  const blocks: string[] = []

  const appendNode = (node: ChildNode) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim()
      if (text) blocks.push(textNodeToParagraph(text))
      return
    }
    if (!(node instanceof HTMLElement)) return

    const tag = node.tagName
    if (tag === 'UL' || tag === 'OL') {
      const listTag = tag.toLowerCase()
      const items = Array.from(node.children).filter((child) => child.tagName === 'LI')
      if (items.length > 0) {
        items.forEach((item) => {
          blocks.push(`<${listTag}>${item.outerHTML}</${listTag}>`)
        })
        return
      }
    }

    if (BLOCK_TAGS.has(tag)) {
      blocks.push(node.outerHTML)
      return
    }

    if (node.children.length > 0) {
      Array.from(node.childNodes).forEach(appendNode)
      return
    }

    const text = node.textContent?.trim()
    if (text) blocks.push(textNodeToParagraph(text))
  }

  Array.from(container.childNodes).forEach(appendNode)
  return blocks.length > 0 ? blocks : [trimmed]
}

function nextDelay(intervalMs?: number): number {
  if (typeof intervalMs === 'number' && intervalMs >= 0) return intervalMs
  return 40 + Math.floor(Math.random() * 41)
}

function keepEditorVisible(editor: A4EditorHandle): void {
  const tiptap = editor.getTipTapEditor()
  if (!tiptap) return

  editor.focusEnd()

  if (typeof window !== 'undefined') {
    window.requestAnimationFrame(() => {
      const dom = tiptap.view.dom as HTMLElement | null
      const scrollHost = dom?.closest('[data-testid="a4-rich-text-editor"]') as HTMLElement | null
      if (scrollHost) {
        scrollHost.scrollTop = scrollHost.scrollHeight
      }
      dom?.lastElementChild?.scrollIntoView?.({ block: 'end', behavior: 'smooth' })
    })
  }
}

export function streamHtmlIntoEditor(
  options: StreamHtmlIntoEditorOptions,
): DocumentStreamController {
  const blocks = splitHtmlIntoBlocks(options.html)
  const editor = options.editorRef.current

  if (!editor) {
    const error = new Error('编辑器尚未就绪')
    options.onError?.(error)
    return {
      cancel: () => {},
      promise: Promise.reject(error),
    }
  }

  let insertedBlocks = 0
  let timer: number | null = null
  let cancelled = false
  let settled = false
  let resolvePromise!: (result: DocumentStreamResult) => void
  let rejectPromise!: (reason?: unknown) => void

  const finish = (result: DocumentStreamResult) => {
    if (settled) return
    settled = true
    if (timer !== null) {
      window.clearTimeout(timer)
      timer = null
    }
    if (!result.cancelled) options.onDone?.()
    resolvePromise(result)
  }

  const promise = new Promise<DocumentStreamResult>((resolve, reject) => {
    resolvePromise = resolve
    rejectPromise = reject
  })

  const step = () => {
    if (cancelled) {
      finish({
        cancelled: true,
        insertedBlocks,
        totalBlocks: blocks.length,
        html: editor.getHtml(),
      })
      return
    }

    try {
      if (blocks.length === 0) {
        if (options.mode === 'replace') {
          editor.replaceDocument('<p></p>')
        }
        finish({
          cancelled: false,
          insertedBlocks: 0,
          totalBlocks: 0,
          html: editor.getHtml(),
        })
        return
      }

      const block = blocks[insertedBlocks]
      if (insertedBlocks === 0 && options.mode === 'replace') {
        editor.replaceDocument(block)
      } else {
        editor.focusEnd()
        editor.insertAtCursor(block)
      }
      keepEditorVisible(editor)
      insertedBlocks += 1

      options.onProgress?.({
        current: insertedBlocks,
        total: blocks.length,
        label: `AI 正在写入第 ${insertedBlocks} / ${blocks.length} 段`,
        html: editor.getHtml(),
      })

      if (insertedBlocks >= blocks.length) {
        finish({
          cancelled: false,
          insertedBlocks,
          totalBlocks: blocks.length,
          html: editor.getHtml(),
        })
        return
      }

      timer = window.setTimeout(step, nextDelay(options.intervalMs))
    } catch (error) {
      const err = error instanceof Error ? error : new Error('写入编辑器失败')
      options.onError?.(err)
      if (!settled) {
        settled = true
        if (timer !== null) {
          window.clearTimeout(timer)
          timer = null
        }
        rejectPromise(err)
      }
    }
  }

  step()

  return {
    cancel() {
      cancelled = true
      finish({
        cancelled: true,
        insertedBlocks,
        totalBlocks: blocks.length,
        html: editor.getHtml(),
      })
    },
    promise,
  }
}
