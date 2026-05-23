import { useMemo, useState } from 'react'
import styled from 'styled-components'

const Panel = styled.aside`
  width: 360px;
  min-width: 320px;
  border-left: 1px solid #d8e3ef;
  background: #f7fafc;
  display: flex;
  flex-direction: column;
  min-height: 0;
`

const Header = styled.div`
  padding: 16px 16px 12px;
  border-bottom: 1px solid #dbe6f0;
`

const Title = styled.h3`
  margin: 0;
  font-size: 16px;
  color: #1d3a57;
`

const Hint = styled.div`
  margin-top: 8px;
  font-size: 12px;
  color: #607487;
  line-height: 1.6;
`

const QuickActions = styled.div`
  padding: 14px 16px 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

const QuickButton = styled.button`
  height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid #d4deea;
  background: #fff;
  color: #32577a;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
`

const History = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 16px;
  display: grid;
  gap: 10px;
`

const Bubble = styled.div<{ $role: 'user' | 'assistant' }>`
  padding: 12px 14px;
  border-radius: 14px;
  background: ${({ $role }) => ($role === 'user' ? '#346ea8' : '#fff')};
  color: ${({ $role }) => ($role === 'user' ? '#fff' : '#304356')};
  border: 1px solid ${({ $role }) => ($role === 'user' ? 'transparent' : '#dbe5ef')};
  font-size: 13px;
  line-height: 1.7;
  white-space: pre-wrap;
`

const Composer = styled.div`
  padding: 14px 16px 16px;
  border-top: 1px solid #dbe6f0;
  background: #fff;
  display: grid;
  gap: 10px;
`

const Input = styled.textarea`
  width: 100%;
  min-height: 92px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid #d5dfeb;
  resize: vertical;
  font-size: 13px;
  line-height: 1.7;
  font-family: inherit;
`

const SubmitButton = styled.button`
  height: 38px;
  border-radius: 10px;
  border: 1px solid #77a9df;
  background: linear-gradient(180deg, #6aa4e2 0%, #4b8fd7 100%);
  color: #fff;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`

export interface SectionHistoryEntry {
  role: 'user' | 'assistant'
  text: string
}

interface DocumentAiEditPanelProps {
  selectedSectionLabel: string
  selectedParagraphLabel: string | null
  history: SectionHistoryEntry[]
  busy?: boolean
  disabled?: boolean
  onSubmit: (instruction: string) => Promise<void> | void
}

const QUICK_ACTIONS = [
  '润色',
  '扩写',
  '压缩',
  '改正式',
  '加依据',
  '生成摘要',
] as const

function quickActionPrompt(action: typeof QUICK_ACTIONS[number]): string {
  switch (action) {
    case '润色':
      return '请对这一节进行润色，保持事实不变。'
    case '扩写':
      return '请在保持事实不变的前提下扩写这一节，使论述更完整。'
    case '压缩':
      return '请压缩这一节内容，保留核心信息，控制为三段以内。'
    case '改正式':
      return '请把这一节改写得更正式，符合中文办公文稿风格。'
    case '加依据':
      return '请补充这一节的依据表达；如果依据不足，请明确写“需要人工确认依据”。'
    case '生成摘要':
      return '请把这一节整理成一段简明摘要，适合给领导快速浏览。'
    default:
      return ''
  }
}

export function DocumentAiEditPanel({
  selectedSectionLabel,
  selectedParagraphLabel,
  history,
  busy,
  disabled,
  onSubmit,
}: DocumentAiEditPanelProps) {
  const [input, setInput] = useState('')

  const currentLabel = useMemo(() => {
    return selectedParagraphLabel
      ? `${selectedSectionLabel} / ${selectedParagraphLabel}`
      : selectedSectionLabel
  }, [selectedParagraphLabel, selectedSectionLabel])

  const handleSubmit = async () => {
    const instruction = input.trim()
    if (!instruction) return
    await onSubmit(instruction)
    setInput('')
  }

  return (
    <Panel>
      <Header>
        <Title>AI 修改面板</Title>
        <Hint>当前正在修改：{currentLabel || '请先选择章节'}</Hint>
      </Header>

      <QuickActions>
        {QUICK_ACTIONS.map((action) => (
          <QuickButton
            key={action}
            type="button"
            disabled={disabled || busy}
            onClick={() => setInput(quickActionPrompt(action))}
          >
            {action}
          </QuickButton>
        ))}
      </QuickActions>

      <History>
        {history.length > 0
          ? history.map((item, index) => (
            <Bubble key={`${item.role}-${index}`} $role={item.role}>
              {item.text}
            </Bubble>
          ))
          : <div style={{ fontSize: 12, color: '#708395', lineHeight: 1.7 }}>选中某一节后，可在这里发起章节级 AI 修改；历史会按 sectionId 保留。</div>}
      </History>

      <Composer>
        <Input
          value={input}
          disabled={disabled || busy}
          onChange={(event) => setInput(event.target.value)}
          placeholder={disabled ? '请先选择章节或段落' : '例如：这一节写得更正式，压缩成三段。'}
        />
        <SubmitButton type="button" disabled={disabled || busy || !input.trim()} onClick={() => void handleSubmit()}>
          {busy ? '正在修改…' : '修改当前章节'}
        </SubmitButton>
      </Composer>
    </Panel>
  )
}
