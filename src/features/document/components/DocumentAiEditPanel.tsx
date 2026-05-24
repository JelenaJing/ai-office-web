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
  line-height: 1.7;
`

const ScopeBadgeRow = styled.div`
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

const ScopeBadge = styled.div<{ $tone?: 'warn' }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  background: ${({ $tone }) => ($tone === 'warn' ? '#fff7e5' : '#edf4fb')};
  color: ${({ $tone }) => ($tone === 'warn' ? '#8a5f1f' : '#31516f')};
  font-size: 12px;
  font-weight: 700;
`

const QuickActions = styled.div`
  padding: 14px 16px 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

const QuickButton = styled.button`
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid #d4deea;
  background: #fff;
  color: #32577a;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
`

const DangerButton = styled(QuickButton)`
  border-color: #f0c7c7;
  color: #a03636;
  background: #fff8f8;
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

export type DocumentAiScope = 'selection' | 'section' | 'document'

interface DocumentAiEditPanelProps {
  selectedSectionId: string | null
  selectedSectionLabel: string
  selectedText: string
  selectionLength: number
  history: SectionHistoryEntry[]
  busy?: boolean
  disabled?: boolean
  canUndoLastAiEdit?: boolean
  onUndoLastAiEdit?: () => void
  onSubmit: (instruction: string, scope: DocumentAiScope) => Promise<void> | void
}

const QUICK_ACTIONS = [
  { label: '改正式', prompt: '请改得更正式，符合中文办公文稿风格。' },
  { label: '压缩成三段', prompt: '请压缩成三段以内，保留核心信息。' },
  { label: '扩写依据', prompt: '请扩写依据表达；如果依据不足，请明确写“需要人工确认依据”。' },
  { label: '加入政策引用', prompt: '请补充相关政策引用；如果依据不足，请明确写“需要人工确认依据”。' },
  { label: '生成摘要', prompt: '请生成一段简洁摘要，方便快速汇报。' },
  { label: '检查逻辑', prompt: '请检查逻辑并直接改成更严谨的表达。' },
  { label: '改成汇报口吻', prompt: '请改成适合会议汇报的口吻。' },
  { label: '重写当前章节', prompt: '请重写当前章节，保持主题不变但结构更清晰。', scope: 'section' as const },
] as const

export function DocumentAiEditPanel({
  selectedSectionId,
  selectedSectionLabel,
  selectedText,
  selectionLength,
  history,
  busy,
  disabled,
  canUndoLastAiEdit,
  onUndoLastAiEdit,
  onSubmit,
}: DocumentAiEditPanelProps) {
  const [input, setInput] = useState('')

  const resolvedScope = useMemo<DocumentAiScope | null>(() => {
    if (selectionLength > 0) return 'selection'
    if (selectedSectionId) return 'section'
    return null
  }, [selectedSectionId, selectionLength])

  const submitLabel = resolvedScope === 'selection'
    ? '只修改选中内容'
    : resolvedScope === 'section'
      ? '修改当前章节'
      : '请先选择内容'

  const submitHint = resolvedScope === 'selection'
    ? `已选中 ${selectionLength} 个字，本次默认只修改选中内容。${selectedText ? `\n“${selectedText.slice(0, 36)}${selectedText.length > 36 ? '…' : ''}”` : ''}`
    : selectedSectionId
      ? `当前未选中文字，将默认修改当前章节：${selectedSectionLabel}`
      : '请先在中间 A4 页面选中文字或定位章节。'

  const handleSubmit = async (scopeOverride?: DocumentAiScope) => {
    const instruction = input.trim()
    const scope = scopeOverride || resolvedScope
    if (!instruction || !scope) return
    await onSubmit(instruction, scope)
    setInput('')
  }

  return (
    <Panel data-testid="document-ai-edit-panel">
      <Header>
        <Title>AI 修改面板</Title>
        <Hint>{submitHint}</Hint>
        <ScopeBadgeRow>
          <ScopeBadge>{selectedSectionId ? `当前章节：${selectedSectionLabel}` : '当前章节：未绑定'}</ScopeBadge>
          {selectionLength > 0 ? <ScopeBadge $tone="warn">已选中文字：{selectionLength} 字</ScopeBadge> : null}
          {!selectionLength && selectedSectionId ? <ScopeBadge $tone="warn">未选中文字：发送后将修改当前章节</ScopeBadge> : null}
        </ScopeBadgeRow>
      </Header>

      <QuickActions>
        {QUICK_ACTIONS.map((action) => (
          <QuickButton
            key={action.label}
            type="button"
            data-testid={`document-ai-quick-${action.label}`}
            disabled={disabled || busy || (!selectedSectionId && selectionLength === 0)}
            onClick={() => {
              setInput(action.prompt)
              void onSubmit(action.prompt, action.scope || resolvedScope || 'section')
            }}
          >
            {action.label}
          </QuickButton>
        ))}
        <DangerButton
          type="button"
          disabled={!canUndoLastAiEdit || busy}
          onClick={() => onUndoLastAiEdit?.()}
        >
          撤回上一次 AI 修改
        </DangerButton>
        <DangerButton
          type="button"
          data-testid="document-ai-rewrite-document"
          disabled={busy || disabled}
          onClick={() => {
            if (!window.confirm('确认重写全文？这会用 AI 覆盖当前文稿内容。')) return
            void onSubmit('请重写当前全文，保留主题但重构整体表达。', 'document')
          }}
        >
          重写全文
        </DangerButton>
      </QuickActions>

      <History>
        {history.length > 0
          ? history.map((item, index) => (
            <Bubble key={`${item.role}-${index}`} $role={item.role}>
              {item.text}
            </Bubble>
          ))
          : <div style={{ fontSize: 12, color: '#708395', lineHeight: 1.7 }}>默认优先修改选中文本；未选中文字时会明确改当前章节。每次 AI 修改前都会创建本地快照，可撤回上一次修改。</div>}
      </History>

      <Composer>
        <Input
          value={input}
          data-testid="document-ai-edit-input"
          disabled={disabled || busy}
          onChange={(event) => setInput(event.target.value)}
          placeholder={disabled ? '请先选择章节或选中内容' : '例如：改得更正式，压缩成两句话。'}
        />
        <SubmitButton
          type="button"
          data-testid="document-ai-edit-submit"
          disabled={disabled || busy || !input.trim() || !resolvedScope}
          onClick={() => void handleSubmit()}
        >
          {busy ? '正在修改…' : submitLabel}
        </SubmitButton>
      </Composer>
    </Panel>
  )
}
