import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import type { WebDocToolId } from '../services/documentOpenCodeApi'

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(15, 23, 42, 0.18);
`

const Dialog = styled.div`
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 10001;
  width: min(420px, calc(100vw - 32px));
  padding: 16px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #d0dce9;
  box-shadow: 0 16px 48px rgba(15, 23, 42, 0.16);
`

const Title = styled.h4`
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 800;
  color: #1e3a55;
`

const Hint = styled.p`
  margin: 0 0 12px;
  font-size: 12px;
  color: #6b8196;
  line-height: 1.6;
`

const Preview = styled.div`
  margin-bottom: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  background: #f5f8fb;
  font-size: 12px;
  color: #4a6278;
  line-height: 1.6;
  max-height: 72px;
  overflow: hidden;
  white-space: pre-wrap;
`

const Textarea = styled.textarea`
  width: 100%;
  min-height: 72px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #cfd9e6;
  font-size: 14px;
  line-height: 1.6;
  font-family: inherit;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #7aaee0;
  }
`

const Actions = styled.div`
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`

const Btn = styled.button<{ $primary?: boolean }>`
  height: 34px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid ${({ $primary }) => ($primary ? '#5a94cc' : '#d0dce9')};
  background: ${({ $primary }) => ($primary ? '#3f84c8' : '#fff')};
  color: ${({ $primary }) => ($primary ? '#fff' : '#3d556c')};
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`

export interface WebDocToolPromptState {
  tool: WebDocToolId
  label: string
  placeholder: string
  selectedText?: string
}

interface WebDocToolPromptDialogProps {
  state: WebDocToolPromptState | null
  busy?: boolean
  onConfirm: (instruction: string) => void
  onClose: () => void
}

export function WebDocToolPromptDialog({ state, busy, onConfirm, onClose }: WebDocToolPromptDialogProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (!state) return
    setValue('')
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0)
    return () => window.clearTimeout(timer)
  }, [state])

  useEffect(() => {
    if (!state) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state, onClose])

  if (!state) return null

  const preview = state.selectedText?.trim()
  const canSubmit = !busy

  return (
    <>
      <Overlay onClick={onClose} />
      <Dialog role="dialog" aria-label={state.label}>
        <Title>{state.label}</Title>
        <Hint>请说明你的具体要求；留空则使用默认规则。</Hint>
        {preview ? <Preview>{preview.length > 160 ? `${preview.slice(0, 160)}…` : preview}</Preview> : null}
        <Textarea
          ref={inputRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={state.placeholder}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey) && canSubmit) {
              event.preventDefault()
              onConfirm(value.trim())
            }
          }}
        />
        <Actions>
          <Btn type="button" onClick={onClose}>取消</Btn>
          <Btn
            type="button"
            $primary
            disabled={!canSubmit}
            onClick={() => onConfirm(value.trim())}
          >
            确定
          </Btn>
        </Actions>
      </Dialog>
    </>
  )
}
