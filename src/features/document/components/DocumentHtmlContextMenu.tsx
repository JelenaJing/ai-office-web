import { useEffect, useRef } from 'react'
import styled from 'styled-components'
import { WEBDOC_CONTEXT_MENU_ACTIONS, type WebDocToolId } from '../services/documentOpenCodeApi'

export interface DocumentHtmlContextMenuState {
  x: number
  y: number
  hasSelection: boolean
  selectedText?: string
}

interface DocumentHtmlContextMenuProps {
  menu: DocumentHtmlContextMenuState | null
  busy?: boolean
  onRequestTool: (tool: WebDocToolId, label: string, placeholder: string, selectedText?: string) => void
  onClose: () => void
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9998;
`

const Menu = styled.div<{ $x: number; $y: number }>`
  position: fixed;
  left: ${({ $x }) => $x}px;
  top: ${({ $y }) => $y}px;
  z-index: 9999;
  min-width: 168px;
  padding: 4px 0;
  background: #fff;
  border: 1px solid #d0dce9;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
  font-size: 13px;
`

const Item = styled.button<{ $disabled?: boolean }>`
  display: block;
  width: 100%;
  padding: 8px 14px;
  border: none;
  background: none;
  text-align: left;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  color: ${({ $disabled }) => ($disabled ? '#b8c5d2' : '#2a4055')};

  &:hover {
    background: ${({ $disabled }) => ($disabled ? 'transparent' : '#f3f7fb')};
  }
`

export function DocumentHtmlContextMenu({ menu, busy, onRequestTool, onClose }: DocumentHtmlContextMenuProps) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!menu) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menu, onClose])

  useEffect(() => {
    const el = ref.current
    if (!el || !menu) return
    const rect = el.getBoundingClientRect()
    if (rect.right > window.innerWidth) {
      el.style.left = `${Math.max(8, window.innerWidth - rect.width - 8)}px`
    }
    if (rect.bottom > window.innerHeight) {
      el.style.top = `${Math.max(8, window.innerHeight - rect.height - 8)}px`
    }
  }, [menu])

  if (!menu) return null

  return (
    <>
      <Overlay onClick={onClose} onContextMenu={(event) => { event.preventDefault(); onClose() }} />
      <Menu ref={ref} $x={menu.x} $y={menu.y} role="menu">
        {WEBDOC_CONTEXT_MENU_ACTIONS.map((action) => {
          const disabled = busy || (action.needsSelection && !menu.hasSelection)
          return (
            <Item
              key={action.tool}
              type="button"
              $disabled={disabled}
              onClick={() => {
                if (disabled) return
                onRequestTool(action.tool, action.label, action.placeholder, menu.selectedText)
                onClose()
              }}
            >
              {action.label}
            </Item>
          )
        })}
      </Menu>
    </>
  )
}
