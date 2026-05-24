import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  type ClipboardEvent,
} from 'react'
import styled from 'styled-components'
import { applyDocumentEditPatch, type ApplyDocumentEditPatchResult } from '../services/documentPatchApplier'
import type {
  DocumentEditPatch,
  DocumentSelectionRange,
  EditableDocumentState,
} from '../services/documentWorkbenchApi'
import { buildSelectionContextFromOffsets } from '../services/documentDraftTransforms'

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

const EmptyState = styled.div`
  color: #627789;
  font-size: 14px;
  line-height: 1.9;
`

const EditableRoot = styled.div`
  outline: none;
  min-height: 940px;
  color: #28384a;
  font-size: 16px;
  line-height: 1.95;
  font-family: "FangSong", "STSong", "SimSun", serif;

  h1[data-document-title="true"] {
    margin: 0 0 40px;
    text-align: center;
    font-size: 30px;
    line-height: 1.4;
    color: #17283a;
    letter-spacing: 0.04em;
  }

  section[data-section-id] {
    margin-bottom: 18px;
    padding: 14px 18px;
    border-radius: 18px;
    border: 1px solid transparent;
    transition: background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
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

  mark[data-ai-change="true"] {
    padding: 0 2px;
    border-radius: 4px;
    background: #fff2b3;
    color: inherit;
  }
`

export interface DocumentEditorCanvasHandle {
  scrollToSection: (sectionId: string) => void
  applyPatch: (patch: DocumentEditPatch) => ApplyDocumentEditPatchResult
  getHtml: () => string
}

interface DocumentEditorCanvasProps {
  state: EditableDocumentState
  modifiedSectionIds: string[]
  recentAiChange?: {
    token: number
    scope: 'selection' | 'section' | 'document'
    sectionId: string | null
  } | null
  onHtmlChange: (html: string, activeSectionId: string | null) => void
  onSelectionChange: (payload: {
    selectedSectionId: string | null
    selectedText: string
    selectionRange?: DocumentSelectionRange
  }) => void
}

const ALLOWED_PASTE_TAGS = new Set(['p', 'br', 'strong', 'b', 'u', 'ul', 'ol', 'li', 'blockquote', 'h1', 'h2', 'h3', 'table', 'thead', 'tbody', 'tr', 'th', 'td'])

const TOOLBAR_ACTIONS = [
  { label: '正文', command: 'formatBlock', value: 'p' },
  { label: '一级标题', command: 'formatBlock', value: 'h2' },
  { label: '二级标题', command: 'formatBlock', value: 'h3' },
  { label: '列表', command: 'insertUnorderedList' },
  { label: '引用', command: 'formatBlock', value: 'blockquote' },
  { label: '加粗', command: 'bold' },
  { label: '下划线', command: 'underline' },
] as const

function escapeHtml(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
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
    const content = Array.from(node.childNodes).map(serialize).join('')
    if (!content.trim()) return ''
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

export const DocumentEditorCanvas = forwardRef<DocumentEditorCanvasHandle, DocumentEditorCanvasProps>(
  function DocumentEditorCanvas({
    state,
    modifiedSectionIds,
    recentAiChange,
    onHtmlChange,
    onSelectionChange,
  }, ref) {
    const rootRef = useRef<HTMLDivElement | null>(null)
    const savedRangeRef = useRef<Range | null>(null)

    useEffect(() => {
      const root = rootRef.current
      if (!root) return
      if (state.html && root.innerHTML !== state.html) {
        root.innerHTML = state.html
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
      const selection = window.getSelection()
      const anchorElement = (
        target instanceof Element
          ? target
          : selection?.anchorNode instanceof Element
            ? selection.anchorNode
            : selection?.anchorNode?.parentElement
      ) || null
      const sectionElement = anchorElement?.closest<HTMLElement>('section[data-section-id]') || null

      if (!selection || selection.rangeCount === 0 || !root.contains(selection.anchorNode)) {
        onSelectionChange({
          selectedSectionId: sectionElement?.dataset.sectionId || null,
          selectedText: '',
          selectionRange: sectionElement
            ? {
                sectionId: sectionElement.dataset.sectionId,
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
      clearTransientHighlights(root)
      const currentSelection = window.getSelection()
      const activeSection = currentSelection?.anchorNode instanceof Element
        ? currentSelection.anchorNode.closest<HTMLElement>('section[data-section-id]')
        : currentSelection?.anchorNode?.parentElement?.closest<HTMLElement>('section[data-section-id]') || null
      onHtmlChange(root.innerHTML, activeSection?.dataset.sectionId || state.selectedSectionId)
      emitSelection()
    }, [emitSelection, onHtmlChange, state.selectedSectionId])

    const runCommand = useCallback((command: string, value?: string) => {
      const root = rootRef.current
      if (!root) return
      root.focus()
      document.execCommand(command, false, value)
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
          onHtmlChange(result.html, result.affectedSectionId)
          onSelectionChange({
            selectedSectionId: result.affectedSectionId,
            selectedText: '',
            selectionRange: result.affectedSectionId
              ? { sectionId: result.affectedSectionId, text: '' }
              : undefined,
          })
        }
        return result
      },
      getHtml() {
        return rootRef.current?.innerHTML || ''
      },
    }), [onHtmlChange, onSelectionChange, state.selectedSectionId])

    if (!state.documentDraft) {
      return (
        <CanvasShell>
          <Paper>
            <EmptyState>
              当前为 A4 文稿编辑区。请选择模板、知识库与附件，输入文稿需求后点击“生成文稿”。
            </EmptyState>
          </Paper>
        </CanvasShell>
      )
    }

    return (
      <CanvasShell>
        <EditorToolbar>
          {TOOLBAR_ACTIONS.map((action) => (
            <ToolbarButton
              key={action.label}
              type="button"
              onMouseDown={(event) => {
                event.preventDefault()
                runCommand(action.command, 'value' in action ? action.value : undefined)
              }}
            >
              {action.label}
            </ToolbarButton>
          ))}
          <ToolbarHint>标题可直接在页面顶部修改；粘贴外部内容时会自动清洗样式。</ToolbarHint>
        </EditorToolbar>
        <Paper>
          <EditableRoot
            ref={rootRef}
            contentEditable
            suppressContentEditableWarning
            data-testid="document-editor-canvas"
            onInput={() => handleInput()}
            onPaste={handlePaste}
            onMouseUp={(event) => emitSelection(event.target)}
            onKeyUp={(event) => emitSelection(event.target)}
            onClick={(event) => emitSelection(event.target)}
          />
        </Paper>
      </CanvasShell>
    )
  },
)
