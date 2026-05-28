import { useCallback, useState } from 'react'
import styled from 'styled-components'
import { Send } from 'lucide-react'
import VoiceInputMicButton from '../../../components/voice/VoiceInputMicButton'
import { useMeetingSpeechInput } from '../../../hooks/useMeetingSpeechInput'
import type { DocumentTaskTemplate } from '../services/documentTaskTemplates'

const Panel = styled.aside`
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e2e8f0;
  background: #fff;
  min-height: 0;
`

const Header = styled.div`
  padding: 16px 16px 12px;
  border-bottom: 1px solid #f1f5f9;
`

const TaskLabel = styled.div`
  font-size: 12px;
  color: #64748b;
  margin-bottom: 4px;
`

const TaskName = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
`

const ChatScroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const Bubble = styled.div<{ $role: 'user' | 'assistant' }>`
  align-self: ${({ $role }) => ($role === 'user' ? 'flex-end' : 'flex-start')};
  max-width: 92%;
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.55;
  background: ${({ $role }) => ($role === 'user' ? '#2563eb' : '#f1f5f9')};
  color: ${({ $role }) => ($role === 'user' ? '#fff' : '#334155')};
`

const QuickRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 0 16px 10px;
`

const QuickBtn = styled.button`
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #475569;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  &:hover {
    border-color: #93c5fd;
    color: #2563eb;
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`

const Composer = styled.div`
  padding: 12px 16px 16px;
  border-top: 1px solid #f1f5f9;
`

const ComposerRow = styled.div`
  display: flex;
  gap: 8px;
`

const Input = styled.textarea`
  flex: 1;
  min-height: 72px;
  max-height: 140px;
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`

const SendBtn = styled.button`
  align-self: flex-end;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 10px;
  background: #2563eb;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`

export interface StudioChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
}

const QUICK_ACTIONS = [
  { label: '改正式', instruction: '请将全文改为更正式的行政办公语气，保持原意。' },
  { label: '减少文字', instruction: '请压缩全文篇幅，删除冗余表述，保留核心信息。' },
  { label: '增加细节', instruction: '请在全文适当位置补充必要细节与说明，不要编造事实。' },
  { label: '提取行动项', instruction: '请从全文中提取行动事项，并以条目形式补充到文末。' },
  { label: '转成表格', instruction: '请将文中适合表格呈现的内容整理为表格（若无法确定结构，先给出建议表格）。' },
  { label: '改成汇报口吻', instruction: '请将全文调整为面向领导汇报的口吻，突出成绩、问题与计划。' },
  { label: '生成摘要', instruction: '请为全文生成一段 150 字以内的摘要，放在文首合适位置。' },
] as const

interface Props {
  taskTemplate: DocumentTaskTemplate | null
  messages: StudioChatMessage[]
  busy?: boolean
  onSend: (instruction: string) => void
}

export default function DocumentStudioAiPanel({
  taskTemplate,
  messages,
  busy,
  onSend,
}: Props) {
  const [draft, setDraft] = useState('')
  const voice = useMeetingSpeechInput({
    getBaseText: () => draft,
    setText: setDraft,
  })

  const submit = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || busy) return
      setDraft('')
      onSend(trimmed)
    },
    [busy, onSend],
  )

  return (
    <Panel>
      <Header>
        <TaskLabel>当前任务类型</TaskLabel>
        <TaskName>{taskTemplate?.name || '通用文稿'}</TaskName>
      </Header>

      <QuickRow>
        {QUICK_ACTIONS.map((item) => (
          <QuickBtn key={item.label} type="button" disabled={busy} onClick={() => submit(item.instruction)}>
            {item.label}
          </QuickBtn>
        ))}
      </QuickRow>

      <ChatScroll>
        {messages.length === 0 ? (
          <Bubble $role="assistant">在下方输入修改要求，或使用快捷按钮调整当前文稿。</Bubble>
        ) : (
          messages.map((msg) => (
            <Bubble key={msg.id} $role={msg.role}>
              {msg.text}
            </Bubble>
          ))
        )}
      </ChatScroll>

      <p style={{ margin: '0 16px 8px', fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
        未选中文本时，将根据当前文稿与您的要求重新生成全文。
      </p>
      <Composer>
        <ComposerRow>
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="描述你想如何修改当前文稿…"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (voice.listening) void voice.stop()
                submit(draft)
              }
            }}
          />
          <VoiceInputMicButton
            compact
            listening={voice.listening}
            supported={voice.supported}
            disabled={busy}
            onClick={() => void voice.toggle()}
          />
          <SendBtn type="button" disabled={busy || !draft.trim()} onClick={() => submit(draft)}>
            <Send size={16} />
          </SendBtn>
        </ComposerRow>
      </Composer>
    </Panel>
  )
}
