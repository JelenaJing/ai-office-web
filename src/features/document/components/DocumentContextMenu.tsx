/**
 * DocumentContextMenu — 文稿编辑区右键菜单
 *
 * 使用方：
 *   <DocumentContextMenu
 *     x={menuX}
 *     y={menuY}
 *     hasSelection={hasSelection}
 *     running={patchActions.running}
 *     onAiAction={(instruction, mode) => patchActions.runAiEditAction(instruction, mode)}
 *     onFormat={(action) => editorRef.current?.[action]?.()}
 *     onClose={closeMenu}
 *   />
 */
import React, { useEffect, useRef } from 'react'
import styled from 'styled-components'
import type { DocumentEditMode } from '../webDocumentPatchTypes'
import type { A4EditorHandle } from './A4RichTextEditor'

export type FormatAction = keyof Pick<
  A4EditorHandle,
  | 'toggleBold'
  | 'toggleUnderline'
  | 'toggleHighlight'
  | 'toggleBulletList'
  | 'toggleOrderedList'
  | 'clearFormatting'
  | 'setParagraph'
  | 'focusEnd'
>

export interface DocumentContextMenuProps {
  x: number
  y: number
  hasSelection: boolean
  running: boolean
  onAiAction: (instruction: string, mode: DocumentEditMode) => void
  onHeading: (level: 1 | 2 | 3) => void
  onFormat: (action: FormatAction) => void
  onTextAlign: (align: 'left' | 'center' | 'right') => void
  onClipboard: (action: 'copy' | 'cut' | 'paste' | 'selectAll') => void
  onClose: () => void
}

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9998;
`

const Menu = styled.div<{ $x: number; $y: number }>`
  position: fixed;
  left: ${(p) => p.$x}px;
  top: ${(p) => p.$y}px;
  z-index: 9999;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.14);
  min-width: 180px;
  max-width: 240px;
  padding: 4px 0;
  font-size: 13px;
  color: #1e293b;
  user-select: none;
`

const Group = styled.div`
  & + & {
    border-top: 1px solid #f1f5f9;
    margin-top: 4px;
    padding-top: 4px;
  }
`

const GroupLabel = styled.div`
  padding: 4px 14px 2px;
  font-size: 10px;
  font-weight: 700;
  color: #94a3b8;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`

const Item = styled.button<{ $disabled?: boolean; $ai?: boolean }>`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 7px 14px;
  border: none;
  background: none;
  font-size: 13px;
  text-align: left;
  cursor: ${(p) => (p.$disabled ? 'not-allowed' : 'pointer')};
  color: ${(p) => (p.$disabled ? '#c0cdd8' : p.$ai ? '#2563eb' : '#1e293b')};
  gap: 8px;
  white-space: nowrap;
  transition: background 0.1s;

  &:hover {
    background: ${(p) => (p.$disabled ? 'transparent' : '#f0f6ff')};
  }

  &:active {
    background: ${(p) => (p.$disabled ? 'transparent' : '#dbeafe')};
  }
`

const Hint = styled.span`
  margin-left: auto;
  font-size: 11px;
  color: #94a3b8;
`

const CLIPBOARD_HINT: Record<string, string> = {
  copy: 'Ctrl+C',
  cut: 'Ctrl+X',
  paste: 'Ctrl+V',
  selectAll: 'Ctrl+A',
}

export function DocumentContextMenu({
  x,
  y,
  hasSelection,
  running,
  onAiAction,
  onHeading,
  onFormat,
  onTextAlign,
  onClipboard,
  onClose,
}: DocumentContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  /* Esc to close */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  /* Clamp menu inside viewport */
  useEffect(() => {
    const el = menuRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    if (rect.right > vw) el.style.left = `${vw - rect.width - 8}px`
    if (rect.bottom > vh) el.style.top = `${vh - rect.height - 8}px`
  })

  const ai = (instruction: string, mode: DocumentEditMode, label?: string) => {
    if (running) return
    onAiAction(instruction, mode)
    onClose()
  }

  const fmt = (action: FormatAction) => {
    onFormat(action)
    onClose()
  }

  const cb = (action: 'copy' | 'cut' | 'paste' | 'selectAll') => {
    onClipboard(action)
    onClose()
  }

  return (
    <>
      <Backdrop onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose() }} />
      <Menu ref={menuRef} $x={x} $y={y} role="menu" onContextMenu={(e) => e.preventDefault()}>
        {/* 基础编辑 */}
        <Group>
          <GroupLabel>编辑</GroupLabel>
          <Item onClick={() => cb('copy')} $disabled={!hasSelection}>
            复制 <Hint>{CLIPBOARD_HINT.copy}</Hint>
          </Item>
          <Item onClick={() => cb('cut')} $disabled={!hasSelection}>
            剪切 <Hint>{CLIPBOARD_HINT.cut}</Hint>
          </Item>
          <Item onClick={() => cb('paste')}>
            粘贴 <Hint>{CLIPBOARD_HINT.paste}</Hint>
          </Item>
          <Item onClick={() => cb('selectAll')}>
            全选 <Hint>{CLIPBOARD_HINT.selectAll}</Hint>
          </Item>
        </Group>

        {/* AI 修改 */}
        <Group>
          <GroupLabel>AI 修改</GroupLabel>
          <Item
            $ai
            $disabled={!hasSelection || running}
            onClick={() => ai('请在保持原意的基础上改写选中内容，使表达更清晰自然。', 'rewrite_selection')}
          >
            AI 改写选区
            {!hasSelection && <Hint>请先选中文本</Hint>}
          </Item>
          <Item
            $ai
            $disabled={!hasSelection || running}
            onClick={() => ai('请润色选中内容，使其更正式、流畅、准确。', 'rewrite_selection')}
          >
            AI 润色选区
            {!hasSelection && <Hint>请先选中文本</Hint>}
          </Item>
          <Item
            $ai
            $disabled={!hasSelection || running}
            onClick={() => ai('请在保持主题一致的基础上适当扩写选中内容，补充必要说明。不得编造事实。', 'rewrite_selection')}
          >
            AI 扩写选区
            {!hasSelection && <Hint>请先选中文本</Hint>}
          </Item>
          <Item
            $ai
            $disabled={!hasSelection || running}
            onClick={() => ai('请将选中内容概括为更简洁的表达。', 'rewrite_selection')}
          >
            AI 总结选区
            {!hasSelection && <Hint>请先选中文本</Hint>}
          </Item>
          <Item
            $ai
            $disabled={running}
            onClick={() => ai('请根据上下文在当前位置续写一段内容。', 'insert_at_cursor')}
          >
            在此处续写
          </Item>
          <Item
            $ai
            $disabled={running}
            onClick={() => ai('请优化全文表达，使其更加正式、清晰、连贯，并保持原有事实不变。', 'polish_document')}
          >
            优化全文
          </Item>
        </Group>

        {/* 格式 */}
        <Group>
          <GroupLabel>格式</GroupLabel>
          <Item onClick={() => { onHeading(1); onClose() }}>设为标题</Item>
          <Item onClick={() => { onHeading(2); onClose() }}>设为小标题</Item>
          <Item onClick={() => fmt('setParagraph')}>设为正文</Item>
          <Item onClick={() => fmt('toggleBold')}>加粗</Item>
          <Item onClick={() => fmt('toggleUnderline')}>下划线</Item>
          <Item onClick={() => fmt('toggleHighlight')}>高亮</Item>
          <Item onClick={() => fmt('toggleBulletList')}>无序列表</Item>
          <Item onClick={() => fmt('toggleOrderedList')}>有序列表</Item>
          <Item onClick={() => { onTextAlign('left'); onClose() }}>左对齐</Item>
          <Item onClick={() => { onTextAlign('center'); onClose() }}>居中</Item>
          <Item onClick={() => { onTextAlign('right'); onClose() }}>右对齐</Item>
          <Item onClick={() => fmt('clearFormatting')}>清除格式</Item>
        </Group>
      </Menu>
    </>
  )
}
