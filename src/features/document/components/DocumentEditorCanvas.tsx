import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
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
`

export interface DocumentEditorCanvasHandle {
  scrollToSection: (sectionId: string) => void
  applyPatch: (patch: DocumentEditPatch) => ApplyDocumentEditPatchResult
  getHtml: () => string
}

interface DocumentEditorCanvasProps {
  state: EditableDocumentState
  modifiedSectionIds: string[]
  onHtmlChange: (html: string, activeSectionId: string | null) => void
  onSelectionChange: (payload: {
    selectedSectionId: string | null
    selectedText: string
    selectionRange?: DocumentSelectionRange
  }) => void
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
      })
    }, [modifiedSectionIds, state.selectedSectionId, state.html])

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
      const currentSelection = window.getSelection()
      const activeSection = currentSelection?.anchorNode instanceof Element
        ? currentSelection.anchorNode.closest<HTMLElement>('section[data-section-id]')
        : currentSelection?.anchorNode?.parentElement?.closest<HTMLElement>('section[data-section-id]') || null
      onHtmlChange(root.innerHTML, activeSection?.dataset.sectionId || state.selectedSectionId)
      emitSelection()
    }, [emitSelection, onHtmlChange, state.selectedSectionId])

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
        <Paper>
          <EditableRoot
            ref={rootRef}
            contentEditable
            suppressContentEditableWarning
            data-testid="document-editor-canvas"
            onInput={() => handleInput()}
            onMouseUp={(event) => emitSelection(event.target)}
            onKeyUp={(event) => emitSelection(event.target)}
            onClick={(event) => emitSelection(event.target)}
          />
        </Paper>
      </CanvasShell>
    )
  },
)
