import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import { marked } from 'marked'

export interface WebDocChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
}

const Panel = styled.section`
  flex-shrink: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-top: 1px solid #c5d5e6;
  background: #f4f8fc;
`

const Header = styled.div`
  padding: 10px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid #dbe6f2;
  background: rgba(255, 255, 255, 0.9);
`

const Title = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 800;
  color: #1e3f5f;
`

const SourceBadge = styled.span`
  font-size: 11px;
  color: #5a7389;
  padding: 2px 8px;
  border-radius: 999px;
  background: #e8f1fa;
`

const MessageList = styled.div`
  flex: 1;
  min-height: 120px;
  max-height: 220px;
  overflow: auto;
  padding: 12px 16px;
  display: grid;
  align-content: start;
  gap: 10px;
`

const UserBubble = styled.div`
  justify-self: end;
  max-width: 92%;
  padding: 8px 12px;
  border-radius: 12px 12px 4px 12px;
  background: #2f6fad;
  color: #fff;
  font-size: 13px;
  line-height: 1.65;
  white-space: pre-wrap;
`

const AssistantBubble = styled.div`
  justify-self: start;
  max-width: 96%;
  padding: 10px 12px;
  border-radius: 12px 12px 12px 4px;
  background: #fff;
  border: 1px solid #d5e3f0;
  color: #2a4055;
  font-size: 13px;
  line-height: 1.7;

  p {
    margin: 0 0 8px;
  }
  p:last-child {
    margin-bottom: 0;
  }
  ul, ol {
    margin: 0 0 8px;
    padding-left: 20px;
  }
  code {
    background: #f0f5fa;
    padding: 1px 4px;
    border-radius: 4px;
    font-size: 12px;
  }
`

const Composer = styled.div`
  padding: 10px 16px 14px;
  display: grid;
  gap: 8px;
  border-top: 1px solid #dbe6f2;
  background: #fff;
`

const Input = styled.textarea`
  width: 100%;
  min-height: 56px;
  max-height: 120px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #c9d9ea;
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: #6aa3dc;
    box-shadow: 0 0 0 2px rgba(106, 163, 220, 0.2);
  }
`

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`

const Hint = styled.span`
  font-size: 12px;
  color: #6d8499;
`

const SubmitBtn = styled.button`
  min-height: 36px;
  padding: 0 18px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(180deg, #5a9ad8 0%, #3f84c8 100%);
  color: #fff;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`

const EmptyHint = styled.div`
  font-size: 12px;
  color: #7d92a5;
  line-height: 1.7;
`

interface WebDocChatPanelProps {
  messages: WebDocChatMessage[]
  busy?: boolean
  lastSource?: string | null
  onSend: (instruction: string) => Promise<void>
}

function renderMarkdown(text: string): string {
  try {
    return marked.parse(text, { async: false }) as string
  } catch {
    return text.replace(/</g, '&lt;').replace(/\n/g, '<br />')
  }
}

export function WebDocChatPanel({ messages, busy, lastSource, onSend }: WebDocChatPanelProps) {
  const [draft, setDraft] = useState('')
  const listRef = useRef<HTMLDivElement | null>(null)

  const recent = useMemo(() => messages.slice(-12), [messages])

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [recent])

  const handleSubmit = useCallback(async () => {
    const text = draft.trim()
    if (!text || busy) return
    setDraft('')
    await onSend(text)
  }, [busy, draft, onSend])

  return (
    <Panel data-testid="webdoc-chat-panel">
      <Header>
        <Title>AI 对话</Title>
        {lastSource ? <SourceBadge>{lastSource === 'opencode' ? 'OpenCode' : 'LLM 回退'}</SourceBadge> : null}
      </Header>

      <MessageList ref={listRef}>
        {recent.length === 0 ? (
          <EmptyHint>
            在下方描述你想如何修改文稿。AI 由 OpenCode 驱动，会返回说明并尝试用补丁更新上方 HTML 正文。
          </EmptyHint>
        ) : (
          recent.map((message) => (
            message.role === 'user' ? (
              <UserBubble key={message.id}>{message.text}</UserBubble>
            ) : (
              <AssistantBubble
                key={message.id}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(message.text) }}
              />
            )
          ))
        )}
        {busy ? <AssistantBubble>正在处理…</AssistantBubble> : null}
      </MessageList>

      <Composer>
        <Input
          data-testid="webdoc-chat-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="描述修改需求，例如：把第二段改得更正式…"
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
              event.preventDefault()
              void handleSubmit()
            }
          }}
        />
        <Footer>
          <Hint>Enter 换行 · Ctrl/Cmd+Enter 发送</Hint>
          <SubmitBtn
            type="button"
            data-testid="webdoc-chat-send"
            disabled={busy || !draft.trim()}
            onClick={() => void handleSubmit()}
          >
            {busy ? '处理中…' : '发送'}
          </SubmitBtn>
        </Footer>
      </Composer>
    </Panel>
  )
}
