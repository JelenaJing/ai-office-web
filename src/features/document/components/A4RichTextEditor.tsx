/**
 * A4RichTextEditor — A4 富文本编辑区（TipTap），对外暴露 A4EditorHandle
 */
import React, { forwardRef, useEffect, useImperativeHandle } from 'react'
import styled from 'styled-components'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Typography from '@tiptap/extension-typography'
import TextStyle from '@tiptap/extension-text-style'
import FontFamily from '@tiptap/extension-font-family'
import { DOMSerializer } from '@tiptap/pm/model'
import FontSize from '../../../extensions/FontSize'
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
  toggleBold(): void
  toggleUnderline(): void
  setTextAlign(align: 'left' | 'center' | 'right' | 'justify'): void
  setParagraph(): void
  setHeading(level: 1 | 2 | 3): void
  toggleBulletList(): void
  toggleOrderedList(): void
  toggleHighlight(): void
  insertTable(): void
  clearFormatting(): void
}

export interface A4RichTextEditorProps {
  initialHtml?: string
  pageSpec: PageSpec
  headerFooter: HeaderFooterSpec
  onChange?: (html: string) => void
  onContextMenu?: (x: number, y: number, hasSelection: boolean) => void
}

const PageScroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 28px 24px 56px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  background: #e8eaed;
`

const A4Page = styled.div<{ $widthPx: number; $heightPx: number }>`
  width: min(100%, ${(p) => p.$widthPx}px);
  min-height: ${(p) => p.$heightPx}px;
  margin: 0 auto 28px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.04);
  border: 1px solid #d9dee8;
  border-radius: 2px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
`

const PageHeader = styled.div<{ $align: string; $leftPx: number; $rightPx: number }>`
  flex-shrink: 0;
  margin: 18px ${(p) => p.$rightPx}px 0 ${(p) => p.$leftPx}px;
  padding: 0 16px 8px;
  min-height: 22px;
  font-size: var(--font-size-xs);
  line-height: 1.45;
  color: #64748b;
  text-align: ${(p) => p.$align};
  border-bottom: 1px solid rgba(148, 163, 184, 0.28);
  white-space: pre-wrap;
  pointer-events: none;
  user-select: none;
`

const PageFooter = styled.div<{ $align: string; $leftPx: number; $rightPx: number }>`
  flex-shrink: 0;
  margin: 0 ${(p) => p.$rightPx}px 14px ${(p) => p.$leftPx}px;
  padding: 8px 16px 0;
  min-height: 22px;
  font-size: var(--font-size-xs);
  line-height: 1.45;
  color: #64748b;
  text-align: ${(p) => p.$align};
  border-top: 1px solid rgba(148, 163, 184, 0.28);
  white-space: pre-wrap;
  pointer-events: none;
  user-select: none;
`

const EditorWrap = styled.div<{
  $topPx: number
  $rightPx: number
  $bottomPx: number
  $leftPx: number
  $fontFamily: string
  $fontSize: string
  $lineHeight: number
}>`
  flex: 1;
  padding: ${(p) => p.$topPx}px ${(p) => p.$rightPx}px ${(p) => p.$bottomPx}px ${(p) => p.$leftPx}px;
  min-height: 300px;
  font-family: ${(p) => p.$fontFamily};
  font-size: ${(p) => p.$fontSize};
  line-height: ${(p) => p.$lineHeight};
  color: #222;
  box-sizing: border-box;

  .ProseMirror {
    outline: none;
    min-height: 760px;
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
    letter-spacing: 0.02em;
  }
  .ProseMirror h1 {
    font-size: 22pt;
    line-height: 1.4;
    font-weight: 700;
    text-align: center;
    letter-spacing: 0.04em;
    margin: 36px 0 20px;
  }
  .ProseMirror h2 {
    font-size: 16pt;
    line-height: 1.45;
    font-weight: 700;
    color: #222;
    margin: 24px 0 12px;
    padding-bottom: 6px;
    border-bottom: 1px solid #eee;
  }
  .ProseMirror h3 {
    font-size: 14pt;
    line-height: 1.5;
    font-weight: 600;
    color: #243447;
    margin: 18px 0 8px;
  }
  .ProseMirror p {
    margin: 0.55em 0;
    text-align: justify;
    text-indent: 2em;
    line-height: inherit;
  }
  .ProseMirror ul,
  .ProseMirror ol {
    margin: 0.6em 0;
    padding-left: 24px;
  }
  .ProseMirror li {
    margin: 4px 0;
  }
  .ProseMirror li > p {
    text-indent: 0;
    margin: 0.25em 0;
  }
  .ProseMirror blockquote {
    border-left: 2px solid #d9dee8;
    padding: 8px 14px;
    color: #616975;
    margin: 14px 0;
    background: #fafbfe;
    border-radius: 0 4px 4px 0;
    line-height: 1.7;
  }
  .ProseMirror table {
    width: 100%;
    border-collapse: collapse;
    margin: 14px 0;
    table-layout: fixed;
  }
  .ProseMirror th,
  .ProseMirror td {
    border: 1px solid #e0e0e0;
    padding: 8px 12px;
    text-align: left;
    vertical-align: top;
  }
  .ProseMirror th {
    background: #f0f2f8;
    font-weight: 600;
    color: #444;
  }
  .ProseMirror th p,
  .ProseMirror td p {
    margin: 0;
    text-indent: 0;
  }
  .ProseMirror code {
    background: #f0f2f5;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: "JetBrains Mono", "Consolas", monospace;
    font-size: 0.92em;
    color: #d63384;
  }
  .ProseMirror pre {
    background: #f7f8fa;
    padding: 16px;
    border-radius: 6px;
    overflow-x: auto;
    border: 1px solid #eee;
  }
  .ProseMirror pre code {
    background: none;
    padding: 0;
    color: #333;
  }
  .ProseMirror mark {
    background-color: #fef08a;
    border-radius: 2px;
    padding: 0 1px;
  }
  .ProseMirror ul[data-type="taskList"] {
    list-style: none;
    padding-left: 0;
  }
  .ProseMirror ul[data-type="taskList"] li {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }
  .ProseMirror ul[data-type="taskList"] li > label {
    flex: 0 0 auto;
  }
  .ProseMirror p.is-editor-empty:first-child::before {
    color: #94a3b8;
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }
`

const MM_TO_PX = 3.7795

function mmToPx(mm: number | undefined, fallback: number): number {
  return Math.round((Number.isFinite(mm) ? Number(mm) : fallback) * MM_TO_PX)
}

function pageFontSize(pageSpec: PageSpec): string {
  if (pageSpec.fontSize) return pageSpec.fontSize
  return `${pageSpec.fontSizePt ?? 12}pt`
}

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
    toggleBold: () => {
      editor.chain().focus().toggleBold().run()
    },
    toggleUnderline: () => {
      editor.chain().focus().toggleUnderline().run()
    },
    setTextAlign: (align) => {
      editor.chain().focus().setTextAlign(align).run()
    },
    setParagraph: () => {
      editor.chain().focus().setParagraph().run()
    },
    setHeading: (level) => {
      editor.chain().focus().setHeading({ level }).run()
    },
    toggleBulletList: () => {
      editor.chain().focus().toggleBulletList().run()
    },
    toggleOrderedList: () => {
      editor.chain().focus().toggleOrderedList().run()
    },
    toggleHighlight: () => {
      editor.chain().focus().toggleHighlight().run()
    },
    insertTable: () => {
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
    },
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
  toggleBold: () => {},
  toggleUnderline: () => {},
  setTextAlign: () => {},
  setParagraph: () => {},
  setHeading: () => {},
  toggleBulletList: () => {},
  toggleOrderedList: () => {},
  toggleHighlight: () => {},
  insertTable: () => {},
  clearFormatting: () => {},
}

export const A4RichTextEditor = forwardRef<A4EditorHandle, A4RichTextEditorProps>(
  function A4RichTextEditor({ initialHtml, pageSpec, headerFooter, onChange, onContextMenu }, ref) {
    const editor = useEditor({
      extensions: [
        StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
        Placeholder.configure({
          placeholder: '在此输入正文，或在右侧让 AI 生成/修改文稿…',
        }),
        Underline,
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        Highlight.configure({ multicolor: true }),
        Table.configure({ resizable: true }),
        TableRow,
        TableCell,
        TableHeader,
        TaskList,
        TaskItem.configure({ nested: true }),
        Typography,
        TextStyle,
        FontFamily.configure({ types: ['textStyle'] }),
        FontSize.configure({ types: ['textStyle'] }),
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
    const margins = pageSpec.marginMm ?? { top: 25, right: 20, bottom: 25, left: 25 }
    const widthPx = mmToPx(pageSpec.widthMm, 210)
    const heightPx = mmToPx(pageSpec.heightMm, 297)
    const topPx = mmToPx(margins.top, 25)
    const rightPx = mmToPx(margins.right, 20)
    const bottomPx = mmToPx(margins.bottom, 25)
    const leftPx = mmToPx(margins.left, 25)
    const fontFamily = pageSpec.fontFamily || '"PingFang SC", "Microsoft YaHei", sans-serif'
    const fontSize = pageFontSize(pageSpec)
    const lineHeight = pageSpec.lineHeight ?? 1.6

    return (
      <PageScroll data-testid="a4-rich-text-editor">
        <A4Page $widthPx={widthPx} $heightPx={heightPx}>
          {headerText ? (
            <PageHeader $align={headerAlign} $leftPx={leftPx} $rightPx={rightPx}>
              {headerText}
            </PageHeader>
          ) : null}
          <EditorWrap
            $topPx={topPx}
            $rightPx={rightPx}
            $bottomPx={bottomPx}
            $leftPx={leftPx}
            $fontFamily={fontFamily}
            $fontSize={fontSize}
            $lineHeight={lineHeight}
          >
            <div
              onContextMenu={(e) => {
                if (!onContextMenu) return
                e.preventDefault()
                const hasSel = editor?.state.selection.empty === false
                onContextMenu(e.clientX, e.clientY, hasSel)
              }}
            >
              <EditorContent editor={editor} />
            </div>
          </EditorWrap>
          {footerText ? (
            <PageFooter $align={footerAlign} $leftPx={leftPx} $rightPx={rightPx}>
              {footerText}
            </PageFooter>
          ) : null}
        </A4Page>
      </PageScroll>
    )
  },
)

/** @deprecated 使用 A4RichTextEditor / A4EditorHandle */
export const A4RichEditor = A4RichTextEditor
export type A4RichEditorHandle = A4EditorHandle
