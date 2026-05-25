import React, { useMemo, useState } from 'react'
import styled from 'styled-components'
import type { PptAiMessage, PptSlidePreview } from '../../../contexts/GenerationWorkbenchContext'
import PptSlideInspector from './PptSlideInspector'

const Panel = styled.aside`
  width: 360px;
  min-width: 360px;
  max-width: 360px;
  border-left: 1px solid #e2e8f0;
  background: #ffffff;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  min-height: 0;

  @media (max-width: 1280px) {
    width: 320px;
    min-width: 320px;
    max-width: 320px;
  }
`

const Header = styled.div`
  padding: 18px 18px 12px;
  border-bottom: 1px solid #eef2f7;
  display: grid;
  gap: 6px;
`

const Eyebrow = styled.div`
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #64748b;
`

const Title = styled.div`
  font-size: 16px;
  font-weight: 800;
  color: #15324b;
`

const Hint = styled.div`
  font-size: 12px;
  color: #64748b;
  line-height: 1.7;
`

const InspectorWrap = styled.div`
  padding: 14px 18px 0;
`

const Messages = styled.div`
  min-height: 0;
  overflow-y: auto;
  padding: 14px 18px;
  display: grid;
  gap: 10px;
  align-content: start;
`

const MessageBubble = styled.div<{ $role: 'user' | 'assistant' | 'system' }>`
  padding: 12px 14px;
  border-radius: 16px;
  font-size: 13px;
  line-height: 1.7;
  border: 1px solid ${({ $role }) => ($role === 'user' ? '#bfdbfe' : $role === 'assistant' ? '#dbe4ee' : '#fecaca')};
  background: ${({ $role }) => ($role === 'user' ? '#eff6ff' : $role === 'assistant' ? '#f8fbff' : '#fff5f5')};
  color: ${({ $role }) => ($role === 'system' ? '#b91c1c' : '#243b53')};
`

const QuickActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

const QuickAction = styled.button`
  padding: 8px 10px;
  border-radius: 999px;
  border: 1px solid #dbe4ee;
  background: #f8fbff;
  color: #30485f;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #eff6ff;
    border-color: #93c5fd;
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`

const Composer = styled.div`
  border-top: 1px solid #eef2f7;
  padding: 16px 18px 18px;
  display: grid;
  gap: 10px;
`

const Textarea = styled.textarea`
  width: 100%;
  min-height: 110px;
  resize: vertical;
  border-radius: 16px;
  border: 1px solid #dbe4ee;
  background: #f8fbff;
  padding: 12px 14px;
  font-size: 13px;
  line-height: 1.7;
  color: #243b53;
`

const ComposerFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`

const ScopeHint = styled.div`
  font-size: 12px;
  color: #64748b;
`

const SendButton = styled.button`
  min-width: 96px;
  height: 40px;
  padding: 0 16px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #2563eb, #0ea5e9);
  color: #ffffff;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`

interface PptAiEditPanelProps {
  slide: PptSlidePreview | null
  pageNumber: number
  engineLabel: string
  messages: PptAiMessage[]
  status: 'idle' | 'editing' | 'applying' | 'error'
  onSend: (instruction: string) => Promise<void> | void
}

const QUICK_ACTIONS = [
  '精简内容',
  '增加视觉图',
  '改成图文页',
  '改成卡片页',
  '改成时间线',
  '改成对比表',
  '给这一页加图片',
  '增加讲稿备注',
]

export default function PptAiEditPanel({ slide, pageNumber, engineLabel, messages, status, onSend }: PptAiEditPanelProps) {
  const [draft, setDraft] = useState('')
  const busy = status === 'editing' || status === 'applying'
  const title = slide?.title || `第 ${pageNumber} 页`

  const timelineMessages = useMemo(
    () => messages.length > 0
      ? messages
      : [{ id: 'empty', role: 'assistant' as const, content: '选中当前页后，告诉 AI 你希望如何修改它。', createdAt: new Date().toISOString() }],
    [messages],
  )

  const submit = async (content?: string) => {
    const instruction = String(content ?? draft).trim()
    if (!instruction || !slide) return
    await onSend(instruction)
    if (!content) setDraft('')
  }

  return (
    <Panel>
      <Header>
        <Eyebrow>AI 页面级修改</Eyebrow>
        <Title>当前正在修改：第 {pageNumber} 页 / {title}</Title>
        <Hint>{engineLabel}</Hint>
        <Hint>本次只会修改第 {pageNumber} 页</Hint>
      </Header>

      <InspectorWrap>
        <PptSlideInspector slide={slide} />
      </InspectorWrap>

      <Messages>
        <QuickActions>
          {QUICK_ACTIONS.map((action) => (
            <QuickAction key={action} type="button" onClick={() => void submit(action)} disabled={busy || !slide}>
              {action}
            </QuickAction>
          ))}
        </QuickActions>
        {timelineMessages.map((message) => (
          <MessageBubble key={message.id} $role={message.role}>
            {message.content}
          </MessageBubble>
        ))}
      </Messages>

      <Composer>
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="告诉 AI 如何修改当前页，例如：给这一页加一个视觉图，改成图文排版"
          disabled={!slide || busy}
        />
        <ComposerFooter>
          <ScopeHint>{busy ? '正在应用修改…' : '发送后会立即刷新当前页预览'}</ScopeHint>
          <SendButton type="button" onClick={() => void submit()} disabled={!slide || busy || !draft.trim()}>
            {busy ? '修改中…' : '发送'}
          </SendButton>
        </ComposerFooter>
      </Composer>
    </Panel>
  )
}
