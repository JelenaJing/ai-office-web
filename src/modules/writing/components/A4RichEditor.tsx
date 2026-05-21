/**
 * A4RichEditor — Web 文稿 A4 富文本编辑区（TipTap）
 */
import React, { forwardRef, useEffect, useImperativeHandle } from 'react'
import styled from 'styled-components'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { DOMSerializer } from '@tiptap/pm/model'
import type { HeaderFooterSpec, PageSpec } from '../webDocumentTypes'

export interface A4RichEditorHandle {
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
}

export interface A4RichEditorProps {
  initialHtml?: string
  pageSpec: PageSpec
  headerFooter: HeaderFooterSpec
  onChange?: (html: string) => void
}

const PreviewScroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  justify-content: center;
  background: #eef2f7;
`

const A4Page = styled.div<{ $widthMm: number; $heightMm: number }>`
  width: min(100%, ${(p) => p.$widthMm * 3.2}px);
  min-height: ${(p) => p.$heightMm * 3.2}px);
  background: #fff;
  box-shadow: 0 4px 24px rgba(15, 23, 42, 0.12);
  border: 1px solid #d1dae6;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
`

const PageHeader = styled.div<{ $align: string }>`
  flex-shrink: 0;
  padding: 14px 24px 8px;
  font-size: 11px;
  color: #64748b;
  text-align: ${(p) => p.$align};
  border-bottom: 1px dashed #e2e8f0;
`

const PageFooter = styled.div<{ $align: string }>`
  flex-shrink: 0;
  padding: 10px 24px 14px;
  font-size: 11px;
  color: #94a3b8;
  text-align: ${(p) => p.$align};
  border-top: 1px dashed #e2e8f0;
`

const FormatBar = styled.div`
  flex-shrink: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px 16px;
  border-bottom: 1px solid #e8eef5;
  background: #f8fafc;
`

const FormatBtn = styled.button<{ $active?: boolean }>`
  height: 28px;
  min-width: 32px;
  padding: 0 8px;
  border-radius: 6px;
  border: 1px solid ${(p) => (p.$active ? '#3b82f6' : '#cbd5e1')};
  background: ${(p) => (p.$active ? '#eff6ff' : '#fff')};
  color: #334155;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`

const EditorWrap = styled.div`
  flex: 1;
  padding: 16px 24px 20px;
  min-height: 280px;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 14px;
  line-height: 1.65;
  color: #1e293b;

  .ProseMirror {
    outline: none;
    min-height: 240px;
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

function bindEditorApi(editor: Editor | null): A4RichEditorHandle | null {
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
      editor.chain().focus().deleteSelection().insertContent(html, { parseOptions: { preserveWhitespace: false } }).run()
    },
    insertAtCursor(html: string) {
      editor.chain().focus().insertContent(html).run()
    },
    replaceDocument(html: string) {
      editor.commands.setContent(html || '<p></p>', false)
    },
    focus: () => editor.commands.focus(),
    focusEnd: () => editor.commands.focus('end'),
  }
}

function FormatToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null
  return (
    <FormatBar>
      <FormatBtn
        type="button"
        $active={editor.isActive('heading', { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        标题1
      </FormatBtn>
      <FormatBtn
        type="button"
        $active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        标题2
      </FormatBtn>
      <FormatBtn
        type="button"
        $active={editor.isActive('paragraph')}
        onClick={() => editor.chain().focus().setParagraph().run()}
      >
        正文
      </FormatBtn>
      <FormatBtn
        type="button"
        $active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        加粗
      </FormatBtn>
      <FormatBtn
        type="button"
        $active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        列表
      </FormatBtn>
    </FormatBar>
  )
}

export const A4RichEditor = forwardRef<A4RichEditorHandle, A4RichEditorProps>(
  function A4RichEditor({ initialHtml, pageSpec, headerFooter, onChange }, ref) {
    const editor = useEditor({
      extensions: [
        StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
        Placeholder.configure({ placeholder: '在此输入正文，或选中文字后使用底部 AI 指令…' }),
      ],
      content: initialHtml || '<p></p>',
      onUpdate: ({ editor: ed }) => {
        onChange?.(ed.getHTML())
      },
    })

    useEffect(() => {
      if (!editor || initialHtml === undefined) return
      const current = editor.getHTML()
      if (initialHtml !== current && initialHtml !== '') {
        editor.commands.setContent(initialHtml, false)
      }
    }, [editor, initialHtml])

    useImperativeHandle(
      ref,
      () =>
        bindEditorApi(editor) ?? {
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
        },
      [editor],
    )

    const headerText = headerFooter.headerText?.trim() || ''
    const footerText = (headerFooter.footerText || '').replace('{page}', '1')
    const headerAlign = headerFooter.headerAlign || 'center'
    const footerAlign = headerFooter.footerAlign || 'center'

    return (
      <PreviewScroll data-testid="a4-rich-editor">
        <A4Page $widthMm={pageSpec.widthMm} $heightMm={pageSpec.heightMm}>
          {headerText ? <PageHeader $align={headerAlign}>{headerText}</PageHeader> : null}
          <FormatToolbar editor={editor} />
          <EditorWrap>
            <EditorContent editor={editor} />
          </EditorWrap>
          {footerText ? <PageFooter $align={footerAlign}>{footerText}</PageFooter> : null}
        </A4Page>
      </PreviewScroll>
    )
  },
)
