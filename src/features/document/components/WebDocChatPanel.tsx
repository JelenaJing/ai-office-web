import { useCallback, useState } from 'react'
import styled from 'styled-components'

export interface WebDocChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
}

const Panel = styled.section`
  flex-shrink: 0;
  padding: 10px 16px 12px;
  border-top: 1px solid #d8e3ef;
  background: #fff;
`

const ComposerRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`

const Input = styled.input`
  flex: 1;
  min-width: 0;
  height: 38px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid #cfd9e6;
  font-size: 14px;
  font-family: inherit;
  color: #1e3348;
  background: #fafcfd;

  &::placeholder {
    color: #94a3b5;
  }

  &:focus {
    outline: none;
    border-color: #7aaee0;
    background: #fff;
  }
`

const SubmitBtn = styled.button`
  flex-shrink: 0;
  height: 38px;
  padding: 0 16px;
  border: none;
  border-radius: 10px;
  background: #3f84c8;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #3574b3;
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`

interface WebDocChatPanelProps {
  busy?: boolean
  onSend: (instruction: string) => Promise<void>
}

export function WebDocChatPanel({ busy, onSend }: WebDocChatPanelProps) {
  const [draft, setDraft] = useState('')

  const handleSubmit = useCallback(async () => {
    const text = draft.trim()
    if (!text || busy) return
    setDraft('')
    await onSend(text)
  }, [busy, draft, onSend])

  return (
    <Panel data-testid="webdoc-chat-panel">
      <ComposerRow>
        <Input
          data-testid="webdoc-chat-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="描述要如何修改文稿…"
          disabled={busy}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              void handleSubmit()
            }
          }}
        />
        <SubmitBtn
          type="button"
          data-testid="webdoc-chat-send"
          disabled={busy || !draft.trim()}
          onClick={() => void handleSubmit()}
        >
          {busy ? '处理中' : '发送'}
        </SubmitBtn>
      </ComposerRow>
    </Panel>
  )
}
