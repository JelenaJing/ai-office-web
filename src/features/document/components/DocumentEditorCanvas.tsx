import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  type ClipboardEvent,
} from 'react'
import styled from 'styled-components'
import { applyDocumentEditPatch, applyFormatOp, appendCitationToBlock, type ApplyDocumentEditPatchResult, type ApplyFormatOpResult, type AppendCitationToBlockResult } from '../services/documentPatchApplier'
import type {
  DocumentEditPatch,
  DocumentSelectionRange,
  EditableDocumentState,
} from '../services/documentWorkbenchApi'
import type { FormatOp } from '../services/documentCommandEngine'
import { buildSelectionContextFromOffsets } from '../services/documentDraftTransforms'

const DEFAULT_SECTION_ID = 'section-main'
const TITLE_PLACEHOLDER = '未命名文稿'
const BODY_PLACEHOLDER = '从这里开始写作，或在下方输入需求让 AI 帮你生成'

const CanvasShell = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 28px;
  background: linear-gradient(180deg, #e8eef5 0%, #dfe7ef 100%);
`

const EditorToolbar = styled.div`
  width: min(794px, 100%);
  margin: 0 auto 14px;
  padding: 10px 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  border: 1px solid rgba(191, 208, 226, 0.9);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 8px 26px rgba(15, 23, 42, 0.08);
`

const ToolbarButton = styled.button`
  min-height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid #d4deea;
  background: #fff;
  color: #36506b;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`

const ToolbarHint = styled.div`
  display: flex;
  align-items: center;
  margin-left: auto;
  color: #688095;
  font-size: 12px;
`

const Paper = styled.div`
  width: min(794px, 100%);
  min-height: 1123px;
  margin: 0 auto;
  background: #fff;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.12);
  border-radius: 8px;
  border: 1px solid rgba(191, 208, 226, 0.9);
  padding: 84px 76px 96px;
  box-sizing: border-box;
`

const EditableRoot = styled.div`
  outline: none;
  min-height: 940px;
  color: #28384a;
  font-size: 16px;
  line-height: 1.95;
  font-family: "FangSong", "STSong", "SimSun", serif;

  article[data-document-root="true"] {
    min-height: 940px;
  }

  h1[data-document-title="true"] {
    margin: 0 0 40px;
    text-align: center;
    font-size: 30px;
    line-height: 1.4;
    color: #17283a;
    letter-spacing: 0.04em;
    position: relative;
    min-height: 1.4em;
  }

  h1[data-document-title="true"][data-placeholder-visible="true"]::before {
    content: '${TITLE_PLACEHOLDER}';
    position: absolute;
    inset: 0;
    color: #97a8b8;
    pointer-events: none;
  }

  section[data-section-id] {
    margin-bottom: 18px;
    padding: 14px 18px;
    border-radius: 18px;
    border: 1px solid transparent;
    transition: background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
    position: relative;
  }

  section[data-document-body="true"] {
    min-height: 220px;
  }

  section[data-document-body="true"][data-placeholder-visible="true"]::before {
    content: '${BODY_PLACEHOLDER}';
    position: absolute;
    top: 14px;
    left: 18px;
    right: 18px;
    color: #98a9b8;
    pointer-events: none;
  }

  section[data-section-id][data-active="true"] {
    border-color: #7eaee3;
    background: rgba(236, 245, 255, 0.82);
    box-shadow: inset 0 0 0 1px rgba(126, 174, 227, 0.12);
  }

  section[data-section-id][data-modified="true"] {
    border-style: dashed;
  }

  section[data-section-id][data-ai-highlight="true"] {
    border-color: #5aa3eb;
    background: rgba(226, 239, 255, 0.9);
    box-shadow: 0 0 0 2px rgba(90, 163, 235, 0.12);
  }

  h2[data-section-heading="true"],
  h3[data-section-heading="true"] {
    margin: 0 0 16px;
    color: #173f69;
    line-height: 1.5;
  }

  h2[data-section-heading="true"] {
    font-size: 22px;
  }

  h3[data-section-heading="true"] {
    font-size: 18px;
    color: #355a7f;
  }

  p {
    margin: 0 0 16px;
    text-indent: 2em;
    min-height: 1.95em;
  }

  ul,
  ol {
    margin: 0 0 16px;
    padding-left: 28px;
  }

  li {
    margin: 6px 0;
  }

  blockquote {
    margin: 16px 0;
    padding: 12px 14px;
    border-left: 4px solid #bcd2e9;
    background: #f5f8fc;
    color: #516679;
    font-size: 14px;
    line-height: 1.75;
  }

  hr {
    margin: 18px 0;
    border: none;
    border-top: 1px solid #d2dce7;
  }

  .document-table-block {
    margin: 16px 0;
  }

  .document-table-title {
    margin-bottom: 8px;
    text-align: center;
    font-size: 14px;
    font-weight: 700;
    color: #2b4d69;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th,
  td {
    border: 1px solid #bfd0e2;
    padding: 10px 12px;
    font-size: 14px;
    color: #334a60;
    vertical-align: top;
  }

  th {
    background: #edf4fb;
    font-weight: 800;
  }

  figure[data-block-type="image"] {
    margin: 18px 0;
    display: grid;
    gap: 8px;
    justify-items: center;
  }

  figure[data-block-type="image"] img {
    display: block;
    max-width: 100%;
    max-height: 420px;
    border-radius: 10px;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
  }

  figure[data-block-type="image"] figcaption {
    font-size: 13px;
    line-height: 1.6;
    color: #60758a;
    text-align: center;
  }

  mark[data-ai-change="true"] {
    padding: 0 2px;
    border-radius: 4px;
    background: #fff2b3;
    color: inherit;
  }
`

type ToolbarAction =
  | { label: string; kind: 'exec'; command: string; value?: string }
  | { label: string; kind: 'clear' }
  | { label: string; kind: 'insert'; html: string }
  | { label: string; kind: 'image' }

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  { label: '撤销', kind: 'exec', command: 'undo' },
  { label: '重做', kind: 'exec', command: 'redo' },
  { label: '标题', kind: 'exec', command: 'formatBlock', value: 'h2' },
  { label: '正文', kind: 'exec', command: 'formatBlock', value: 'p' },
  { label: '加粗', kind: 'exec', command: 'bold' },
  { label: '列表', kind: 'exec', command: 'insertUnorderedList' },
  { label: '引用', kind: 'insert', html: '<blockquote data-block-type="quote"><p>请输入引用内容</p></blockquote><p><br /></p>' },
  {
    label: '表格',
    kind: 'insert',
    html: [
      '<div data-block-type="table" class="document-table-block">',
      '<div class="document-table-title">表格标题</div>',
      '<table><tbody>',
      '<tr><th>列 1</th><th>列 2</th></tr>',
      '<tr><td>内容 1</td><td>内容 2</td></tr>',
      '</tbody></table>',
      '</div>',
      '<p><br /></p>',
    ].join(''),
  },
  { label: '图片', kind: 'image' },
]

const ALLOWED_PASTE_TAGS = new Set([
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  'ul',
  'ol',
  'li',
  'blockquote',
  'h1',
  'h2',
  'h3',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'hr',
  'figure',
  'figcaption',
  'img',
])

export interface DocumentEditorCanvasHandle {
  scrollToSection: (sectionId: string) => void
  applyPatch: (patch: DocumentEditPatch) => ApplyDocumentEditPatchResult
  applyFormatOp: (op: FormatOp) => ApplyFormatOpResult
  getHtml: () => string
  focusBody: () => void
  insertCitation: (input: {
    citationId: string
    refId: string
    sourceId?: string
    provider?: 'remote' | 'workspace'
    sourceType?: string
    chunkId?: string
    trustLevel?: string
    label: string
    renderMode?: 'inline' | 'badge' | 'footnote'
  }) => ApplyDocumentEditPatchResult
  appendCitationToBlock: (input: {
    blockId: string
    citationId: string
    refId: string
    label: string
    refLabel?: string
    sourceId?: string
    provider?: 'remote' | 'workspace'
    sourceType?: string
    chunkId?: string
    trustLevel?: string
    renderMode?: 'inline' | 'badge' | 'footnote'
  }) => AppendCitationToBlockResult
}

interface DocumentEditorCanvasProps {
  state: EditableDocumentState
  modifiedSectionIds: string[]
  compact?: boolean
  recentAiChange?: {
    token: number
    scope: 'selection' | 'section' | 'document'
    sectionId: string | null
  } | null
  onContextMenu?: (event: React.MouseEvent) => void
  onHtmlChange: (html: string, activeSectionId: string | null) => void
  onSelectionChange: (payload: {
    selectedSectionId: string | null
    selectedBlockId: string | null
    selectedBlockRole?: string
    selectedBlockText?: string
    selectedText: string
    selectionRange?: DocumentSelectionRange
  }) => void
}

function escapeHtml(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildBlankEditorHtml(): string {
  return [
    '<article data-document-root="true" data-document-mode="draft">',
    '<h1 data-document-title="true" data-block-id="document-title" data-role="title"></h1>',
    `<section data-section-id="${DEFAULT_SECTION_ID}" data-section-title="正文" data-section-level="1" data-document-body="true">`,
    '<p data-block-id="body-paragraph-1" data-role="paragraph"><br /></p>',
    '</section>',
    '</article>',
  ].join('')
}

function unwrapElement(element: HTMLElement) {
  const parent = element.parentNode
  if (!parent) return
  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element)
  }
  parent.removeChild(element)
}

function clearTransientHighlights(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>('mark[data-ai-change="true"]').forEach((element) => unwrapElement(element))
}

function safeImageSrc(value: string): string {
  const normalized = String(value || '').trim()
  return /^(https?:|data:image\/|blob:)/iu.test(normalized) ? normalized : ''
}

function sanitizePastedHtml(input: string): string {
  if (!input.trim()) return ''
  const parser = new DOMParser()
  const doc = parser.parseFromString(input, 'text/html')
  const serialize = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return escapeHtml(node.textContent || '')
    }
    if (!(node instanceof HTMLElement)) return ''
    const tag = node.tagName.toLowerCase()
    if (['style', 'script', 'meta', 'link'].includes(tag)) return ''
    if (tag === 'div') {
      const content = Array.from(node.childNodes).map(serialize).join('')
      return content.trim() ? `<p>${content}</p>` : ''
    }
    if (['span', 'font', 'section', 'article'].includes(tag)) {
      return Array.from(node.childNodes).map(serialize).join('')
    }
    if (!ALLOWED_PASTE_TAGS.has(tag)) {
      return Array.from(node.childNodes).map(serialize).join('')
    }
    if (tag === 'br') return '<br />'
    if (tag === 'hr') return '<hr />'
    if (tag === 'img') {
      const src = safeImageSrc(node.getAttribute('src') || '')
      if (!src) return ''
      return `<img src="${escapeHtml(src)}" alt="${escapeHtml(node.getAttribute('alt') || '')}" />`
    }
    const content = Array.from(node.childNodes).map(serialize).join('')
    if (!content.trim() && tag !== 'figure') return ''
    if (tag === 'figure') return `<figure data-block-type="image">${content}</figure>`
    return `<${tag}>${content}</${tag}>`
  }
  return Array.from(doc.body.childNodes)
    .map(serialize)
    .join('')
    .replace(/<p>\s*<\/p>/g, '')
    .trim()
}

function plainTextToHtml(input: string): string {
  return String(input || '')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block.split('\n').map((line) => line.trim()).filter(Boolean)
      if (lines.length > 0 && lines.every((line) => /^[-*•]\s+/u.test(line))) {
        return `<ul>${lines.map((line) => `<li>${escapeHtml(line.replace(/^[-*•]\s+/u, ''))}</li>`).join('')}</ul>`
      }
      if (lines.length > 0 && lines.every((line) => /^\d+[.)、]\s+/u.test(line))) {
        return `<ol>${lines.map((line) => `<li>${escapeHtml(line.replace(/^\d+[.)、]\s+/u, ''))}</li>`).join('')}</ol>`
      }
      return `<p>${escapeHtml(lines.join('<br />'))}</p>`.replace(/&lt;br \/&gt;/g, '<br />')
    })
    .join('')
}

function insertHtmlAtSelection(root: HTMLElement, html: string) {
  root.focus()
  if (document.queryCommandSupported?.('insertHTML')) {
    document.execCommand('insertHTML', false, html)
    return
  }
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return
  const range = selection.getRangeAt(0)
  range.deleteContents()
  range.insertNode(range.createContextualFragment(html))
}

function selectionOffsetsInSection(sectionElement: HTMLElement, range: Range) {
  const startRange = document.createRange()
  startRange.selectNodeContents(sectionElement)
  startRange.setEnd(range.startContainer, range.startOffset)
  const endRange = document.createRange()
  endRange.selectNodeContents(sectionElement)
  endRange.setEnd(range.endContainer, range.endOffset)
  return {
    startOffset: startRange.toString().length,
    endOffset: endRange.toString().length,
  }
}

function ensureDocumentScaffold(root: HTMLElement) {
  if (!root.innerHTML.trim()) {
    root.innerHTML = buildBlankEditorHtml()
  }
  let article = root.querySelector<HTMLElement>('article[data-document-root="true"]')
  if (!article) {
    root.innerHTML = buildBlankEditorHtml()
    article = root.querySelector<HTMLElement>('article[data-document-root="true"]')
  }
  if (!article) return null

  let title = article.querySelector<HTMLElement>('h1[data-document-title="true"]')
  if (!title) {
    title = document.createElement('h1')
    title.dataset.documentTitle = 'true'
    article.insertBefore(title, article.firstChild)
  }

  let bodySection = article.querySelector<HTMLElement>('section[data-document-body="true"]')
    || article.querySelector<HTMLElement>('section[data-section-id]')
  if (!bodySection) {
    bodySection = document.createElement('section')
    bodySection.dataset.sectionId = DEFAULT_SECTION_ID
    bodySection.dataset.sectionTitle = '正文'
    bodySection.dataset.sectionLevel = '1'
    bodySection.dataset.documentBody = 'true'
    bodySection.innerHTML = '<p><br /></p>'
    article.appendChild(bodySection)
  }

  bodySection.dataset.documentBody = 'true'
  bodySection.dataset.sectionId = bodySection.dataset.sectionId || DEFAULT_SECTION_ID
  bodySection.dataset.sectionTitle = bodySection.dataset.sectionTitle || '正文'
  bodySection.dataset.sectionLevel = bodySection.dataset.sectionLevel || '1'

  if (!bodySection.innerHTML.trim()) {
    bodySection.innerHTML = '<p><br /></p>'
  }

  return { article, title, bodySection }
}

function blockTypeForNode(node: HTMLElement): string {
  const explicit = node.dataset.blockType?.trim()
  if (explicit) return explicit
  const tag = node.tagName.toLowerCase()
  if (tag === 'p') return 'paragraph'
  if (tag === 'ul') return 'bulleted-list'
  if (tag === 'ol') return 'numbered-list'
  if (tag === 'li') return 'list-item'
  if (tag === 'blockquote') return 'quote'
  if (tag === 'figure' || tag === 'img') return 'image'
  if (tag === 'table' || node.matches('.document-table-block')) return 'table'
  if (tag === 'hr') return 'divider'
  return tag
}

function normalizeSectionBlocks(section: HTMLElement) {
  Array.from(section.childNodes).forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      const paragraph = document.createElement('p')
      paragraph.textContent = node.textContent
      section.replaceChild(paragraph, node)
      return
    }
    if (!(node instanceof HTMLElement)) return
    if (node.matches('[data-section-heading="true"], h2, h3, h4')) return
    if (node.tagName.toLowerCase() === 'div' && !node.matches('.document-table-block, [data-block-type="table"]')) {
      const paragraph = document.createElement('p')
      paragraph.innerHTML = node.innerHTML
      section.replaceChild(paragraph, node)
    }
  })
}

function ensureCanonicalBlockMetadata(root: HTMLElement) {
  const scaffold = ensureDocumentScaffold(root)
  if (!scaffold) return
  scaffold.title.dataset.blockId = scaffold.title.dataset.blockId || 'document-title'
  scaffold.title.dataset.role = scaffold.title.dataset.role || 'title'
  root.querySelectorAll<HTMLElement>('section[data-section-id]').forEach((section) => {
    normalizeSectionBlocks(section)
    const sectionId = section.dataset.sectionId || DEFAULT_SECTION_ID
    const heading = section.querySelector<HTMLElement>(':scope > [data-section-heading="true"], :scope > h2, :scope > h3, :scope > h4')
    if (heading) {
      heading.dataset.sectionHeading = 'true'
      heading.dataset.blockId = heading.dataset.blockId || `${sectionId}-heading`
      heading.dataset.role = heading.dataset.role || 'heading'
      section.dataset.sectionTitle = heading.textContent?.trim() || section.dataset.sectionTitle || '正文'
      section.dataset.sectionLevel = section.dataset.sectionLevel || (heading.tagName === 'H3' ? '2' : '1')
    }
    Array.from(section.children).forEach((child, index) => {
      if (!(child instanceof HTMLElement)) return
      if (child.matches('[data-section-heading="true"], h2, h3, h4')) return
      child.dataset.blockType = blockTypeForNode(child)
      child.dataset.blockId = child.dataset.blockId || `${sectionId}-${child.dataset.blockType}-${index + 1}`
      child.dataset.role = child.dataset.role || (
        child.dataset.blockType === 'bulleted-list' || child.dataset.blockType === 'numbered-list'
          ? 'list'
          : child.dataset.blockType || child.tagName.toLowerCase()
      )
      if (child.tagName.toLowerCase() === 'figure') {
        child.dataset.blockType = 'image'
        child.dataset.role = 'image'
      }
      if (child.matches('.document-table-block')) {
        child.dataset.blockType = 'table'
        child.dataset.role = 'table'
      }
      if (child.matches('ul, ol')) {
        const listKind = child.tagName.toLowerCase() === 'ol' ? 'numbered' : 'bulleted'
        Array.from(child.querySelectorAll<HTMLElement>(':scope > li')).forEach((item, itemIndex) => {
          item.dataset.blockType = 'list-item'
          item.dataset.blockId = item.dataset.blockId || `${child.dataset.blockId || `${sectionId}-${child.dataset.blockType}-${index + 1}`}-item-${itemIndex + 1}`
          item.dataset.role = 'list-item'
          item.dataset.listKind = item.dataset.listKind || listKind
        })
      }
    })
  })
}

function bodyText(section: HTMLElement): string {
  const hasNonTextBlock = section.querySelector('img, table, hr, ul, ol, blockquote, figure')
  if (hasNonTextBlock) return 'non-empty'
  const content = Array.from(section.childNodes)
    .filter((node) => !(node instanceof HTMLElement && node.matches('[data-section-heading="true"], h2, h3, h4')))
    .map((node) => node.textContent || '')
    .join('')
  return content.replace(/\u200B/g, '').trim()
}

function updatePlaceholderState(root: HTMLElement) {
  const scaffold = ensureDocumentScaffold(root)
  if (!scaffold) return
  ensureCanonicalBlockMetadata(root)
  scaffold.title.dataset.placeholderVisible = scaffold.title.textContent?.trim() ? 'false' : 'true'
  scaffold.bodySection.dataset.placeholderVisible = bodyText(scaffold.bodySection) ? 'false' : 'true'
}

function placeCaret(root: HTMLElement, toEnd: boolean) {
  const scaffold = ensureDocumentScaffold(root)
  const target = scaffold?.bodySection.querySelector<HTMLElement>('p:last-of-type, li:last-of-type, blockquote:last-of-type')
    || scaffold?.bodySection
    || root
  if (!target) return
  const selection = window.getSelection()
  if (!selection) return
  const range = document.createRange()
  range.selectNodeContents(target)
  range.collapse(!toEnd)
  selection.removeAllRanges()
  selection.addRange(range)
  root.focus()
}

function commandSupported(command: string): boolean {
  if (typeof document === 'undefined') return false
  if (typeof document.queryCommandSupported !== 'function') return true
  try {
    return document.queryCommandSupported(command)
  } catch {
    return false
  }
}

export const DocumentEditorCanvas = forwardRef<DocumentEditorCanvasHandle, DocumentEditorCanvasProps>(
  function DocumentEditorCanvas({
    state,
    modifiedSectionIds,
    compact = false,
    recentAiChange,
    onContextMenu,
    onHtmlChange,
    onSelectionChange,
  }, ref) {
    const rootRef = useRef<HTMLDivElement | null>(null)
    const savedRangeRef = useRef<Range | null>(null)
    const didAutoFocusRef = useRef(false)

    useEffect(() => {
      const root = rootRef.current
      if (!root) return
      const nextHtml = state.html || buildBlankEditorHtml()
      if (root.innerHTML !== nextHtml) {
        root.innerHTML = nextHtml
      }
      updatePlaceholderState(root)
    }, [state.html])

    useEffect(() => {
      const root = rootRef.current
      if (!root || didAutoFocusRef.current) return
      const timer = window.requestAnimationFrame(() => {
        const scaffold = ensureDocumentScaffold(root)
        if (!scaffold) return
        placeCaret(root, Boolean(bodyText(scaffold.bodySection)))
        updatePlaceholderState(root)
        didAutoFocusRef.current = true
      })
      return () => {
        window.cancelAnimationFrame(timer)
      }
    }, [state.html])

    useEffect(() => {
      const root = rootRef.current
      if (!root) return
      root.querySelectorAll<HTMLElement>('section[data-section-id]').forEach((section) => {
        const sectionId = section.dataset.sectionId || ''
        section.dataset.active = state.selectedSectionId === sectionId ? 'true' : 'false'
        section.dataset.modified = modifiedSectionIds.includes(sectionId) ? 'true' : 'false'
        section.dataset.aiHighlight = 'false'
      })
      updatePlaceholderState(root)
    }, [modifiedSectionIds, state.selectedSectionId, state.html])

    useEffect(() => {
      const root = rootRef.current
      if (!root || !recentAiChange) return
      const targets = recentAiChange.scope === 'document'
        ? Array.from(root.querySelectorAll<HTMLElement>('section[data-section-id]'))
        : recentAiChange.sectionId
          ? [root.querySelector<HTMLElement>(`section[data-section-id="${CSS.escape(recentAiChange.sectionId)}"]`)].filter(Boolean) as HTMLElement[]
          : []
      targets.forEach((section) => {
        section.dataset.aiHighlight = 'true'
      })
    }, [recentAiChange, state.html])

    const emitSelection = useCallback((target?: EventTarget | null) => {
      const root = rootRef.current
      if (!root) return
      updatePlaceholderState(root)
      const selection = window.getSelection()
      const anchorElement = (
        target instanceof Element
          ? target
          : selection?.anchorNode instanceof Element
            ? selection.anchorNode
            : selection?.anchorNode?.parentElement
      ) || null
      const sectionElement = anchorElement?.closest<HTMLElement>('section[data-section-id]') || null
      const blockElement = anchorElement?.closest<HTMLElement>('[data-block-id]') || null

      if (!selection || selection.rangeCount === 0 || !root.contains(selection.anchorNode)) {
        onSelectionChange({
          selectedSectionId: sectionElement?.dataset.sectionId || null,
          selectedBlockId: blockElement?.dataset.blockId || null,
          selectedBlockRole: blockElement?.dataset.role || blockElement?.dataset.blockType,
          selectedBlockText: blockElement?.textContent?.trim() || '',
          selectedText: '',
          selectionRange: sectionElement
            ? {
                sectionId: sectionElement.dataset.sectionId,
                blockId: blockElement?.dataset.blockId,
                blockRole: blockElement?.dataset.role || blockElement?.dataset.blockType,
                sectionTitle: sectionElement.dataset.sectionTitle,
                text: '',
              }
            : undefined,
        })
        return
      }

      const range = selection.getRangeAt(0).cloneRange()
      savedRangeRef.current = range
      const selectedText = selection.toString().trim()

      if (!sectionElement) {
        onSelectionChange({
          selectedSectionId: null,
          selectedBlockId: blockElement?.dataset.blockId || null,
          selectedBlockRole: blockElement?.dataset.role || blockElement?.dataset.blockType,
          selectedBlockText: blockElement?.textContent?.trim() || '',
          selectedText,
          selectionRange: selectedText ? { text: selectedText } : undefined,
        })
        return
      }

      const { startOffset, endOffset } = selectionOffsetsInSection(sectionElement, range)
      const contextText = buildSelectionContextFromOffsets({
        sectionElement,
        startOffset,
        endOffset,
      })

      onSelectionChange({
        selectedSectionId: sectionElement.dataset.sectionId || null,
        selectedText,
        selectionRange: {
          sectionId: sectionElement.dataset.sectionId,
          sectionTitle: sectionElement.dataset.sectionTitle || undefined,
          startOffset,
          endOffset,
          text: selectedText,
          beforeText: contextText.beforeText,
          afterText: contextText.afterText,
        },
      })
    }, [onSelectionChange])

    const handleInput = useCallback(() => {
      const root = rootRef.current
      if (!root) return
      ensureDocumentScaffold(root)
      clearTransientHighlights(root)
      updatePlaceholderState(root)
      const currentSelection = window.getSelection()
      const activeSection = currentSelection?.anchorNode instanceof Element
        ? currentSelection.anchorNode.closest<HTMLElement>('section[data-section-id]')
        : currentSelection?.anchorNode?.parentElement?.closest<HTMLElement>('section[data-section-id]') || null
      onHtmlChange(root.innerHTML || buildBlankEditorHtml(), activeSection?.dataset.sectionId || state.selectedSectionId)
      emitSelection()
    }, [emitSelection, onHtmlChange, state.selectedSectionId])

    const runCommand = useCallback((action: ToolbarAction) => {
      const root = rootRef.current
      if (!root) return
      if (action.kind === 'clear') {
        if (!window.confirm('确认清空当前文稿内容？')) return
        root.innerHTML = buildBlankEditorHtml()
        updatePlaceholderState(root)
        handleInput()
        placeCaret(root, false)
        return
      }
      if (action.kind === 'insert') {
        insertHtmlAtSelection(root, action.html)
        handleInput()
        return
      }
      if (action.kind === 'image') {
        const src = window.prompt('请输入图片 URL（支持 https://、blob: 或 data:image/...）')
        const safeSrc = safeImageSrc(src || '')
        if (!safeSrc) return
        const caption = window.prompt('请输入图片说明（可留空）') || ''
        insertHtmlAtSelection(
          root,
          [
            '<figure data-block-type="image">',
            `<img src="${escapeHtml(safeSrc)}" alt="${escapeHtml(caption || '图片')}" />`,
            caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : '',
            '</figure>',
            '<p><br /></p>',
          ].join(''),
        )
        handleInput()
        return
      }
      root.focus()
      document.execCommand(action.command, false, action.value)
      handleInput()
    }, [handleInput])

    const handlePaste = useCallback((event: ClipboardEvent<HTMLDivElement>) => {
      const root = rootRef.current
      if (!root) return
      event.preventDefault()
      const html = event.clipboardData.getData('text/html')
      const plainText = event.clipboardData.getData('text/plain')
      const normalized = sanitizePastedHtml(html) || plainTextToHtml(plainText)
      if (!normalized) return
      insertHtmlAtSelection(root, normalized)
      handleInput()
    }, [handleInput])

    useImperativeHandle(ref, () => ({
      scrollToSection(sectionId: string) {
        rootRef.current?.querySelector<HTMLElement>(`section[data-section-id="${CSS.escape(sectionId)}"]`)
          ?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      },
      applyPatch(patch: DocumentEditPatch) {
        const root = rootRef.current
        if (!root) {
          return { applied: false, html: '', affectedSectionId: null }
        }
        const result = applyDocumentEditPatch({
          root,
          patch,
          savedRange: savedRangeRef.current,
          selectedSectionId: state.selectedSectionId,
        })
        if (result.applied) {
          savedRangeRef.current = null
          ensureDocumentScaffold(root)
          updatePlaceholderState(root)
          onHtmlChange(result.html, result.affectedSectionId)
        onSelectionChange({
          selectedSectionId: result.affectedSectionId,
          selectedBlockId: null,
          selectedBlockRole: undefined,
          selectedBlockText: '',
          selectedText: '',
          selectionRange: result.affectedSectionId
              ? { sectionId: result.affectedSectionId, text: '' }
              : undefined,
          })
        }
        return result
      },
      getHtml() {
        const root = rootRef.current
        if (!root) return ''
        ensureDocumentScaffold(root)
        return root.innerHTML || buildBlankEditorHtml()
      },
      applyFormatOp(op: FormatOp) {
        const root = rootRef.current
        if (!root) return { applied: false, html: '', affectedBlockIds: [], previousTexts: {} }
        const result = applyFormatOp(root, op)
        if (result.applied) {
          ensureDocumentScaffold(root)
          updatePlaceholderState(root)
          onHtmlChange(result.html, state.selectedSectionId)
        }
        return result
      },
      focusBody() {
        const root = rootRef.current
        if (!root) return
        placeCaret(root, Boolean(bodyText(ensureDocumentScaffold(root)?.bodySection || root)))
      },
      insertCitation(input) {
        const root = rootRef.current
        if (!root) return { applied: false, html: '', affectedSectionId: null }
        const result = applyDocumentEditPatch({
          root,
          patch: {
            type: 'insert_citation',
            html: `<span class="doc-citation" data-citation-id="${escapeHtml(input.citationId)}" data-ref-id="${escapeHtml(input.refId)}" data-ref-label="${escapeHtml(input.label)}" data-source-id="${escapeHtml(input.sourceId || '')}" data-provider="${escapeHtml(input.provider || '')}" data-source-type="${escapeHtml(input.sourceType || '')}" data-chunk-id="${escapeHtml(input.chunkId || '')}" data-trust-level="${escapeHtml(input.trustLevel || '')}" data-render-mode="${escapeHtml(input.renderMode || 'inline')}">[${escapeHtml(input.label)}]</span>`,
            citation: {
              id: input.citationId,
              refId: input.refId,
              blockId: '',
              text: input.label,
              renderMode: input.renderMode || 'inline',
              sourceId: input.sourceId,
              sourceType: input.sourceType,
              chunkId: input.chunkId,
              trustLevel: input.trustLevel,
            },
            reference: {
              id: input.refId,
              label: input.label,
              kind: 'knowledge_base',
              sourceId: input.sourceId || input.refId,
              sourceType: input.sourceType,
              chunkId: input.chunkId,
              trustLevel: input.trustLevel,
            },
          },
          savedRange: savedRangeRef.current,
          selectedSectionId: state.selectedSectionId,
        })
        if (result.applied) {
          ensureDocumentScaffold(root)
          updatePlaceholderState(root)
          onHtmlChange(result.html, result.affectedSectionId)
        }
        return result
      },
      appendCitationToBlock(input) {
        const root = rootRef.current
        if (!root) return { applied: false, html: '', affectedSectionId: null }
        const result = appendCitationToBlock(root, input)
        if (result.applied) {
          ensureDocumentScaffold(root)
          updatePlaceholderState(root)
          onHtmlChange(result.html, result.affectedSectionId)
        }
        return result
      },
    }), [emitSelection, onHtmlChange, onSelectionChange, state.selectedSectionId])

    return (
      <CanvasShell>
        {!compact ? (
          <EditorToolbar>
            {TOOLBAR_ACTIONS.map((action) => (
              <ToolbarButton
                key={action.label}
                type="button"
                disabled={action.kind === 'exec' ? !commandSupported(action.command) : false}
                onMouseDown={(event) => {
                  event.preventDefault()
                  runCommand(action)
                }}
              >
                {action.label}
              </ToolbarButton>
            ))}
          </EditorToolbar>
        ) : null}
        <Paper>
          <EditableRoot
            ref={rootRef}
            contentEditable
            suppressContentEditableWarning
            data-testid="document-editor-canvas"
            onInput={() => handleInput()}
            onPaste={handlePaste}
            onContextMenu={(event) => {
              if (onContextMenu) {
                event.preventDefault()
                onContextMenu(event)
              }
            }}
            onMouseUp={(event) => emitSelection(event.target)}
            onKeyUp={(event) => emitSelection(event.target)}
            onClick={(event) => emitSelection(event.target)}
          />
        </Paper>
      </CanvasShell>
    )
  },
)
