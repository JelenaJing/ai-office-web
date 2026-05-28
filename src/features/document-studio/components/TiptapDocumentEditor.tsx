import { useCallback, useEffect, useImperativeHandle, forwardRef, useRef, useState } from 'react'
import styled from 'styled-components'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import { BlockIdExtension, ensureBlockIdsInJson } from '../extensions/blockIdExtension'
import { extractPlainTextFromEditorJson, sanitizeEditorJson } from '../services/editorContentBridge'

export interface TiptapDocumentEditorHandle {
  getEditor: () => Editor | null
  getEditorJson: () => Record<string, unknown>
  scrollToBlockId: (blockId: string) => void
}

const EditorShell = styled.div`
  flex: 1 1 auto;
  width: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
`

const EditorWrap = styled.div`
  flex: 1 1 auto;
  width: 100%;
  min-height: calc(100vh - 120px - 72px - 112px - 80px);
  box-sizing: border-box;
  position: relative;
  display: flex;
  flex-direction: column;

  & > div {
    flex: 1 1 auto;
    width: 100%;
    min-height: inherit;
    display: flex;
    flex-direction: column;
  }

  .ProseMirror {
    flex: 1 1 auto;
    width: 100%;
    min-height: calc(100vh - 120px - 72px - 112px - 80px);
    outline: none;
    font-size: 16px;
    line-height: 1.8;
    color: #111827;
    caret-color: #2563eb;
    background: transparent;
  }

  .ProseMirror p.is-editor-empty:first-child::before {
    color: #94a3b8;
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }

  .ProseMirror h1 {
    font-size: 1.75rem;
    margin: 0 0 0.75em;
    color: #0f172a;
  }

  .ProseMirror h2 {
    font-size: 1.35rem;
    margin: 1.25em 0 0.5em;
    color: #0f172a;
  }

  .ProseMirror h3 {
    font-size: 1.15rem;
    margin: 1em 0 0.4em;
    color: #1e293b;
  }

  .ProseMirror ul,
  .ProseMirror ol {
    padding-left: 1.4em;
    margin: 0.5em 0;
  }

  .ProseMirror blockquote {
    border-left: 4px solid #cbd5e1;
    margin: 1em 0;
    padding-left: 1em;
    color: #475569;
  }

  .ProseMirror table {
    border-collapse: collapse;
    width: 100%;
    margin: 1em 0;
  }

  .ProseMirror td,
  .ProseMirror th {
    border: 1px solid #cbd5e1;
    padding: 6px 10px;
  }
`

const ErrorBanner = styled.div`
  margin-bottom: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 13px;
  line-height: 1.5;
`

const STUDIO_EXTENSIONS = [
  StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
  Placeholder.configure({ placeholder: '在此编辑文稿…' }),
  Underline,
  Table.configure({ resizable: false }),
  TableRow,
  TableHeader,
  TableCell,
  BlockIdExtension,
]

function prepareEditorContent(editorJson: Record<string, unknown>): Record<string, unknown> {
  const sanitized = sanitizeEditorJson(editorJson)
  return ensureBlockIdsInJson(sanitized ?? editorJson)
}

interface Props {
  documentId: string
  contentVersion: string
  editorJson: Record<string, unknown>
  onChange?: (json: Record<string, unknown>) => void
  onSelectionChange?: (editor: Editor) => void
  onContentError?: (message: string) => void
}

const TiptapDocumentEditor = forwardRef<TiptapDocumentEditorHandle, Props>(function TiptapDocumentEditor(
  { documentId, contentVersion, editorJson, onChange, onSelectionChange, onContentError },
  ref,
) {
  const [contentError, setContentError] = useState<string | null>(null)
  const lastAppliedRef = useRef<string>('')
  const hydratingRef = useRef(false)

  const applyContent = useCallback(
    (editor: Editor, json: Record<string, unknown>) => {
      const incoming = prepareEditorContent(json)
      const fingerprint = `${contentVersion}:${extractPlainTextFromEditorJson(incoming).length}:${Array.isArray(incoming.content) ? incoming.content.length : 0}`
      if (lastAppliedRef.current === fingerprint) return true

      hydratingRef.current = true
      try {
        const currentText = editor.state.doc.textContent.trim()
        const incomingText = extractPlainTextFromEditorJson(incoming)
        if (currentText === incomingText.trim() && incomingText.length > 0) {
          lastAppliedRef.current = fingerprint
          hydratingRef.current = false
          return true
        }

        const ok = editor.commands.setContent(incoming, false, { preserveWhitespace: 'full' })
        if (!ok) {
          const message = '编辑器无法加载文稿内容（setContent 返回 false）'
          setContentError(message)
          onContentError?.(message)
          hydratingRef.current = false
          return false
        }
        lastAppliedRef.current = fingerprint
        setContentError(null)
        hydratingRef.current = false
        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        setContentError(message)
        onContentError?.(message)
        console.warn('[DocumentStudio] setContent failed', message)
        hydratingRef.current = false
        return false
      }
    },
    [contentVersion, onContentError],
  )

  const editor = useEditor(
    {
      extensions: STUDIO_EXTENSIONS,
      content: { type: 'doc', content: [] },
      immediatelyRender: true,
      editorProps: {
        attributes: {
          class: 'document-studio-prosemirror',
          'data-placeholder': '在此编辑文稿…',
        },
      },
      onContentError: ({ error }) => {
        const message = error?.message || '编辑器内容解析失败'
        setContentError(message)
        onContentError?.(message)
        console.warn('[DocumentStudio] onContentError', message)
      },
      onCreate: ({ editor: ed }) => {
        applyContent(ed, editorJson)
      },
      onUpdate: ({ editor: ed, transaction }) => {
        if (hydratingRef.current || !transaction.docChanged) return
        onChange?.(ed.getJSON() as Record<string, unknown>)
      },
      onSelectionUpdate: ({ editor: ed }) => {
        onSelectionChange?.(ed)
      },
    },
    [documentId],
  )

  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    applyContent(editor, editorJson)
  }, [editor, editorJson, contentVersion, applyContent])

  useImperativeHandle(ref, () => ({
    getEditor: () => editor,
    getEditorJson: () => (editor?.getJSON() as Record<string, unknown>) || { type: 'doc', content: [] },
    scrollToBlockId: (blockId: string) => {
      if (!editor) return
      const { doc } = editor.state
      let targetPos: number | null = null
      doc.descendants((node, pos) => {
        if (targetPos !== null) return false
        if (node.attrs?.blockId === blockId) {
          targetPos = pos
          return false
        }
        return true
      })
      if (targetPos !== null) {
        editor.chain().focus().setTextSelection(targetPos).scrollIntoView().run()
      }
    },
  }))

  if (!editor) {
    return (
      <EditorShell>
        <EditorWrap style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
          编辑器初始化中…
        </EditorWrap>
      </EditorShell>
    )
  }

  return (
    <EditorShell>
      <EditorWrap>
        {contentError ? <ErrorBanner>内容加载异常：{contentError}</ErrorBanner> : null}
        <EditorContent editor={editor} />
      </EditorWrap>
    </EditorShell>
  )
})

export default TiptapDocumentEditor
