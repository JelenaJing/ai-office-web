/**
 * typewriterDocument — 前端打字机效果 (character-level)
 *
 * 后端仍然一次性返回完整 HTML，前端拿到后按字符逐步写入编辑器，
 * 模拟 AI "正在打字" 效果。不依赖 SSE / WebSocket。
 *
 * 流程：
 *   1. 把 HTML 拆分成内容块 (h1-h6 / p / li / blockquote / pre)
 *   2. 对每个块，逐字符写入编辑器（展示纯文本）
 *   3. 一个块写完后，替换为该块完整 outerHTML（恢复 bold/link 等格式）
 *   4. 全部块写完后，用原始完整 HTML 做最终同步，保证导出格式正确
 */

import type { RefObject } from 'react'
import type { A4EditorHandle } from '../components/A4RichTextEditor'

// ─── 公开类型 ──────────────────────────────────────────────────────────────────

export interface TypewriterState {
  phase: 'waiting' | 'typing' | 'done' | 'cancelled' | 'error'
  charsDone: number
  totalChars: number
  currentBlockIndex: number
  totalBlocks: number
  message: string
}

export interface TypewriterOptions {
  editorRef: RefObject<A4EditorHandle | null>
  /** 要写入的完整 HTML */
  html: string
  /** replace = 覆盖当前文档；append = 追加到末尾 */
  mode?: 'replace' | 'append'
  /** 每字符基准速度 (ms)，默认 15 */
  typingSpeed?: number
  /** 标点符号后的暂停 (ms)，默认 120 */
  sentencePauseMs?: number
  /** 段落（块）之间的暂停 (ms)，默认 250 */
  blockPauseMs?: number
  /** 打字机开始（第一个字符出现前）回调 */
  onStart?: () => void
  /** 每次字符更新后回调 */
  onProgress?: (state: TypewriterState) => void
  /** 全部完成回调 */
  onDone?: (finalHtml: string) => void
  /** 用户取消回调，传入已写入部分的 HTML */
  onCancel?: (partialHtml: string) => void
  /** 错误回调 */
  onError?: (error: Error) => void
}

export interface TypewriterController {
  /** 停止打字（已打出内容保留） */
  cancel: () => void
  /** resolved with { cancelled, html } */
  promise: Promise<{ cancelled: boolean; html: string }>
}

// ─── 内部类型 ──────────────────────────────────────────────────────────────────

interface TypewriterBlock {
  /** 显示标签 (h1..h6 / p / blockquote / pre / li) */
  tag: string
  /** li 时外层列表标签 (ul | ol) */
  listTag?: string
  /** 纯文本内容（用于逐字符打字） */
  text: string
  /** 完整 outerHTML（包含 inline 格式，打字完成后恢复） */
  outerHtml: string
}

// ─── 工具函数 ──────────────────────────────────────────────────────────────────

const BLOCK_TAGS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre'])

const PUNCTUATION_SET = new Set([
  '，', '。', '！', '？', '；', '：', '、', '…',
  ',', '.', '!', '?', ';', ':',
])

function parseHtmlIntoBlocks(html: string): TypewriterBlock[] {
  if (typeof document === 'undefined') return []

  const root = document.createElement('div')
  root.innerHTML = html.trim()
  const blocks: TypewriterBlock[] = []

  const walk = (node: ChildNode) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent ?? '').trim()
      if (text) blocks.push({ tag: 'p', text, outerHtml: `<p>${escapeHtml(text)}</p>` })
      return
    }
    if (!(node instanceof HTMLElement)) return

    const tag = node.tagName.toLowerCase()

    if (BLOCK_TAGS.has(tag)) {
      const text = node.textContent ?? ''
      if (text.trim()) blocks.push({ tag, text, outerHtml: node.outerHTML })
      return
    }

    if (tag === 'ul' || tag === 'ol') {
      Array.from(node.children)
        .filter((c): c is HTMLElement => c.tagName === 'LI')
        .forEach((li) => {
          const text = li.textContent ?? ''
          if (text.trim()) {
            blocks.push({
              tag: 'li',
              listTag: tag,
              text,
              outerHtml: `<${tag}>${li.outerHTML}</${tag}>`,
            })
          }
        })
      return
    }

    // 其他容器（div / section / article …）递归处理
    Array.from(node.childNodes).forEach(walk)
  }

  Array.from(root.childNodes).forEach(walk)

  // 兜底：无块时把全文当一个段落
  if (blocks.length === 0) {
    const text = root.textContent?.trim() ?? ''
    if (text) blocks.push({ tag: 'p', text, outerHtml: `<p>${escapeHtml(text)}</p>` })
  }

  return blocks
}

/** 为打字中途展示的部分块构造临时 HTML */
function makePartialBlock(block: TypewriterBlock, typedText: string): string {
  const safe = escapeHtml(typedText)
  if (block.tag === 'li' && block.listTag) {
    return `<${block.listTag}><li>${safe}</li></${block.listTag}>`
  }
  return `<${block.tag}>${safe}</${block.tag}>`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function scrollEditorToBottom(editor: A4EditorHandle): void {
  try {
    const tiptap = editor.getTipTapEditor()
    const dom = tiptap?.view?.dom
    if (!dom) return
    // 向上找最近的可滚动容器
    let el: HTMLElement | null = dom.parentElement
    while (el) {
      if (el.scrollHeight > el.clientHeight) {
        el.scrollTop = el.scrollHeight
        return
      }
      el = el.parentElement
    }
  } catch {
    // 滚动失败不影响主流程
  }
}

// ─── 主函数 ────────────────────────────────────────────────────────────────────

export function createDocumentTypewriter(options: TypewriterOptions): TypewriterController {
  const {
    editorRef,
    html,
    mode = 'replace',
    typingSpeed,
    sentencePauseMs,
    blockPauseMs,
    onStart,
    onProgress,
    onDone,
    onCancel,
    onError,
  } = options

  let cancelled = false
  let settled = false
  let resolvePromise!: (r: { cancelled: boolean; html: string }) => void
  let rejectPromise!: (e: unknown) => void

  const promise = new Promise<{ cancelled: boolean; html: string }>((res, rej) => {
    resolvePromise = res
    rejectPromise = rej
  })

  const cancel = () => { cancelled = true }

  async function run() {
    const editor = editorRef.current
    if (!editor) {
      const err = new Error('编辑器尚未就绪')
      onError?.(err)
      if (!settled) { settled = true; rejectPromise(err) }
      return
    }

    const blocks = parseHtmlIntoBlocks(html)
    if (blocks.length === 0) {
      if (mode === 'replace') editor.replaceDocument('<p></p>')
      const finalHtml = editor.getHtml()
      onDone?.(finalHtml)
      if (!settled) { settled = true; resolvePromise({ cancelled: false, html: finalHtml }) }
      return
    }

    const totalChars = blocks.reduce((acc, b) => acc + b.text.length, 0)

    // 自动加速：长文档控制在 ≤ 22 秒内完成
    const baseMs = typeof typingSpeed === 'number' ? typingSpeed : 15
    const maxDuration = 22_000
    const effectiveMs = totalChars > 0
      ? Math.max(3, Math.min(baseMs, maxDuration / totalChars))
      : baseMs

    // 高速时批量处理多个字符，减少 DOM 更新频率
    const batchSize = effectiveMs < 5 ? 4 : effectiveMs < 10 ? 2 : 1
    const frameMs = Math.max(3, effectiveMs * batchSize)

    const puncMs = typeof sentencePauseMs === 'number' ? sentencePauseMs : 120
    const paraMs = typeof blockPauseMs === 'number' ? blockPauseMs : 250

    onStart?.()

    let accumulatedHtml = mode === 'append' ? (editor.getHtml() || '') : ''
    let charsDone = 0

    const emitProgress = (blockIdx: number) => {
      onProgress?.({
        phase: 'typing',
        charsDone: Math.min(charsDone, totalChars),
        totalChars,
        currentBlockIndex: blockIdx,
        totalBlocks: blocks.length,
        message: `AI 正在写入… 已完成 ${Math.min(charsDone, totalChars)} / ${totalChars} 字`,
      })
    }

    try {
      for (let bi = 0; bi < blocks.length; bi++) {
        if (cancelled) break

        const block = blocks[bi]
        const text = block.text
        let charPos = 0

        while (charPos < text.length) {
          if (cancelled) break

          const batchEnd = Math.min(charPos + batchSize, text.length)
          const typedText = text.slice(0, batchEnd)
          charPos = batchEnd
          charsDone += batchSize

          // 展示当前块的已打出部分（纯文本，不含 inline 格式）
          const partialHtml = accumulatedHtml + makePartialBlock(block, typedText)
          editor.replaceDocument(partialHtml)
          scrollEditorToBottom(editor)
          emitProgress(bi)

          // 标点后多停留一会儿，模拟真实打字节奏
          const lastCh = typedText[typedText.length - 1]
          const delay = PUNCTUATION_SET.has(lastCh)
            ? Math.max(frameMs, puncMs)
            : frameMs
          await sleep(delay)
        }

        if (!cancelled) {
          // 块打字完成后，用完整 outerHtml 恢复 inline 格式
          accumulatedHtml += block.outerHtml
          editor.replaceDocument(accumulatedHtml)

          if (bi < blocks.length - 1) {
            await sleep(paraMs)
          }
        }
      }

      if (!cancelled) {
        // 最终同步：用原始完整 HTML 保证 TipTap 节点结构正确，导出无误
        if (mode === 'replace') editor.replaceDocument(html)
        const finalHtml = editor.getHtml()
        onDone?.(finalHtml)
        if (!settled) { settled = true; resolvePromise({ cancelled: false, html: finalHtml }) }
      } else {
        const partialHtml = editor.getHtml()
        onCancel?.(partialHtml)
        if (!settled) { settled = true; resolvePromise({ cancelled: true, html: partialHtml }) }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('打字机出错')
      onError?.(err)
      if (!settled) { settled = true; rejectPromise(err) }
    }
  }

  void run()
  return { cancel, promise }
}
