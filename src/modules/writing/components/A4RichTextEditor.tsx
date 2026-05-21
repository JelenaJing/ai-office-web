/**
 * A4RichTextEditor — A4 富文本编辑区（TipTap），对外暴露 A4EditorHandle
 */
import React, { forwardRef, useEffect, useImperativeHandle } from 'react'
import styled from 'styled-components'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { DOMSerializer } from '@tiptap/pm/model'
import type { HeaderFooterSpec, PageSpec } from '../webDocumentTypes'

export interface A4EditorHandle {
  getHtml(): string
  getText(): string
  getSelectionHtml(): string
  getSelectionText(): string
  hasSelection(): boolean
  isEmpty(): boolean
  replaceSelection(html: string): void
  insertAtCursor(html: string): void
  replaceDocument(html: string): void
  focus(): void
  focusEnd(): void
  getTipTapEditor(): Editor | null
  clearFormatting(): void
}

export interface A4RichTextEditorProps {
  initialHtml?: string
  pageSpec: PageSpec
  headerFooter: HeaderFooterSpec
  onChange?: (html: string) => void
}

const PageScroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 24px 20px;
  display: flex;
  justify-content: center;
  background: #e2e8f0;
`

const A4Page = styled.div<{ $widthMm: number; $heightMm: number }>`
  width: min(100%, ${(p) => p.$widthMm * 3.2}px);
  min-height: ${(p) => p.$heightMm * 3.2}px);
  background: #fff;
  box-shadow: 0 6px 28px rgba(15, 23, 42, 0.14);
  border: 1px solid #cbd5e1;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
`

const PageHeader = styled.div<{ $align: string }>`
  flex-shrink: 0;
  padding: 14px 28px 8px;
  font-size: 11px;
  color: #64748b;
  text-align: ${(p) => p.$align};
  border-bottom: 1px dashed #e2e8f0;
`

const PageFooter = styled.div<{ $align: string }>`
  flex-shrink: 0;
  padding: 10px 28px 16px;
  font-size: 11px;
  color: #94a3b8;
  text-align: ${(p) => p.$align};
  border-top: 1px dashed #e2e8f0;
`

const EditorWrap = styled.div`
  flex: 1;
  padding: 20px 28px 24px;
  min-height: 300px;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 14px;
  line-height: 1.65;
  color: #1e293b;

  .ProseMirror {
    outline: none;
    min-height: 260px;
  }
  .ProseMirror h1 {
    font-size: 22px;
    margin: 0 0 12px;
  }
  .ProseMirror h2 {
    font-size: 16px;
    margin: 18px 0 8px;
    color: #2e74b5;
  }
  .ProseMirror p {
    margin: 0 0 10px;
  }
  .ProseMirror ul,
  .ProseMirror ol {
    margin: 0 0 10px;
    padding-left: 1.4em;
  }
  .ProseMirror p.is-editor-empty:first-child::before {
    color: #94a3b8;
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }
`

function selectionHtml(editor: Editor): string {
  const { from, to } = editor.state.selection
  if (from === to) return ''
  const slice = editor.state.doc.slice(from, to)
  const div = document.createElement('div')
  const frag = DOMSerializer.fromSchema(editor.schema).serializeFragment(slice.content)
  div.appendChild(frag)
  return div.innerHTML
}

function bindEditorApi(editor: Editor | null): A4EditorHandle | null {
  if (!editor) return null
  return {
    getHtml: () => editor.getHTML(),
    getText: () => editor.getText({ blockSeparator: '\n' }).trim(),
    getSelectionHtml: () => selectionHtml(editor),
    getSelectionText: () => {
      const { from, to } = editor.state.selection
      if (from === to) return ''
      return editor.state.doc.textBetween(from, to, '\n')
    },
    hasSelection: () => {
      const { from, to } = editor.state.selection
      return to > from
    },
    isEmpty: () => editor.isEmpty,
    replaceSelection(html: string) {
      editor.chain().focus().deleteSelection().insertContent(html).run()
    },
    insertAtCursor(html: string) {
      editor.chain().focus().insertContent(html).run()
    },
    replaceDocument(html: string) {
      editor.commands.setContent(html || '<p></p>', false)
    },
    focus: () => editor.commands.focus(),
    focusEnd: () => editor.commands.focus('end'),
    getTipTapEditor: () => editor,
    clearFormatting: () => {
      editor.chain().focus().clearNodes().unsetAllMarks().run()
    },
  }
}

const emptyHandle: A4EditorHandle = {
  getHtml: () => '',
  getText: () => '',
  getSelectionHtml: () => '',
  getSelectionText: () => '',
  hasSelection: () => false,
  isEmpty: () => true,
  replaceSelection: () => {},
  insertAtCursor: () => {},
  replaceDocument: () => {},
  focus: () => {},
  focusEnd: () => {},
  getTipTapEditor: () => null,
  clearFormatting: () => {},
}

export const A4RichTextEditor = forwardRef<A4EditorHandle, A4RichTextEditorProps>(
  function A4RichTextEditor({ initialHtml, pageSpec, headerFooter, onChange }, ref) {
    const editor = useEditor({
      extensions: [
        StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
        Placeholder.configure({
          placeholder: '在此直接输入正文，或选中文字后在右侧输入 AI 指令…',
        }),
      ],
      content: initialHtml || '<p></p>',
      onUpdate: ({ editor: ed }) => onChange?.(ed.getHTML()),
    })

    useEffect(() => {
      if (!editor || initialHtml === undefined) return
      const current = editor.getHTML()
      if (initialHtml !== current && initialHtml !== '') {
        editor.commands.setContent(initialHtml, false)
      }
    }, [editor, initialHtml])

    useImperativeHandle(ref, () => bindEditorApi(editor) ?? emptyHandle, [editor])

    const headerText = headerFooter.headerText?.trim() || ''
    const footerText = (headerFooter.footerText || '').replace('{page}', '1')
    const headerAlign = headerFooter.headerAlign || 'center'
    const footerAlign = headerFooter.footerAlign || 'center'

    return (
      <PageScroll data-testid="a4-rich-text-editor">
        <A4Page $widthMm={pageSpec.widthMm} $heightMm={pageSpec.heightMm}>
          {headerText ? <PageHeader $align={headerAlign}>{headerText}</PageHeader> : null}
          <EditorWrap>
            <EditorContent editor={editor} />
          </EditorWrap>
          {footerText ? <PageFooter $align={footerAlign}>{footerText}</PageFooter> : null}
        </A4Page>
      </PageScroll>
    )
  },
)

/** @deprecated 使用 A4RichTextEditor / A4EditorHandle */
export const A4RichEditor = A4RichTextEditor
export type A4RichEditorHandle = A4EditorHandle
