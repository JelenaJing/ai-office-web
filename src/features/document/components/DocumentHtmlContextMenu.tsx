import { useEffect, useRef } from 'react'
import styled from 'styled-components'
import { WEBDOC_CONTEXT_MENU_ACTIONS, type WebDocToolId } from '../services/documentOpenCodeApi'

export interface DocumentHtmlContextMenuState {
  x: number
  y: number
  hasSelection: boolean
}

interface DocumentHtmlContextMenuProps {
  menu: DocumentHtmlContextMenuState | null
  busy?: boolean
  onInvokeTool: (tool: WebDocToolId, instruction: string) => void
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
  min-width: 200px;
  padding: 4px 0;
  background: #fff;
  border: 1px solid #cfd9e6;
  border-radius: 10px;
  box-shadow: 0 12px 32px rgba(19, 41, 61, 0.14);
  font-size: 13px;
`

const Label = styled.div`
  padding: 6px 16px 4px;
  font-size: 11px;
  font-weight: 700;
  color: #8a9bab;
  letter-spacing: 0.04em;
`

const Item = styled.button<{ $disabled?: boolean }>`
  display: block;
  width: 100%;
  padding: 8px 16px;
  border: none;
  background: none;
  text-align: left;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  color: ${({ $disabled }) => ($disabled ? '#b8c5d2' : '#2a4055')};

  &:hover {
    background: ${({ $disabled }) => ($disabled ? 'transparent' : '#eef4fb')};
  }
`

const Divider = styled.div`
  height: 1px;
  margin: 4px 0;
  background: #e8eef4;
`

export function DocumentHtmlContextMenu({ menu, busy, onInvokeTool, onClose }: DocumentHtmlContextMenuProps) {
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
        <Label>OpenCode 工具</Label>
        {WEBDOC_CONTEXT_MENU_ACTIONS.map((action) => {
          const disabled = busy || (action.needsSelection && !menu.hasSelection)
          return (
            <Item
              key={action.tool}
              type="button"
              $disabled={disabled}
              onClick={() => {
                if (disabled) return
                onInvokeTool(action.tool, action.instruction)
                onClose()
              }}
            >
              {action.label}
            </Item>
          )
        })}
        <Divider />
        <Item type="button" $disabled={busy} onClick={onClose}>
          关闭
        </Item>
      </Menu>
    </>
  )
}
