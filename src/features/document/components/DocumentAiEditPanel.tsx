import { useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import { ChevronDown, ChevronUp } from 'lucide-react'

const Panel = styled.aside`
  width: 360px;
  min-width: 320px;
  border-left: 1px solid #d8e3ef;
  background: #f7fafc;
  display: flex;
  flex-direction: column;
  min-height: 0;
`

const PanelHeader = styled.div`
  padding: 14px 16px 10px;
  border-bottom: 1px solid #dbe6f0;
  flex-shrink: 0;
`

const PanelTitle = styled.h3`
  margin: 0 0 6px;
  font-size: 15px;
  color: #1d3a57;
  font-weight: 800;
`

const ScopeBadgeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
`

const ScopeBadge = styled.div<{ $tone?: 'warn' | 'info' }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 9px;
  border-radius: 999px;
  background: ${({ $tone }) => ($tone === 'warn' ? '#fff7e5' : '#edf4fb')};
  color: ${({ $tone }) => ($tone === 'warn' ? '#8a5f1f' : '#31516f')};
  font-size: 11px;
  font-weight: 700;
`

const ChatHistory = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const EmptyHint = styled.div`
  font-size: 12px;
  color: #7a8fa0;
  line-height: 1.8;
  padding: 8px 0;
`

const Bubble = styled.div<{ $role: 'user' | 'assistant' }>`
  padding: 10px 13px;
  border-radius: 14px;
  background: ${({ $role }) => ($role === 'user' ? '#2e6aad' : '#fff')};
  color: ${({ $role }) => ($role === 'user' ? '#fff' : '#304356')};
  border: 1px solid ${({ $role }) => ($role === 'user' ? 'transparent' : '#dbe5ef')};
  font-size: 13px;
  line-height: 1.7;
  white-space: pre-wrap;
  align-self: ${({ $role }) => ($role === 'user' ? 'flex-end' : 'flex-start')};
  max-width: 92%;
`

const QuickRow = styled.div`
  padding: 8px 12px 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  border-top: 1px solid #e6eef5;
  flex-shrink: 0;
`

const QuickBtn = styled.button`
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid #d4deea;
  background: #fff;
  color: #32577a;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;

  &:hover:not(:disabled) {
    background: #eef4fb;
    border-color: #aec8e0;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`

const MoreWrapper = styled.div`
  position: relative;
`

const MoreDropdown = styled.div`
  position: absolute;
  bottom: calc(100% + 6px);
  left: 0;
  min-width: 190px;
  background: #fff;
  border: 1px solid #d0dce9;
  border-radius: 12px;
  box-shadow: 0 8px 28px rgba(15, 23, 42, 0.12);
  z-index: 200;
  padding: 6px;
  display: grid;
  gap: 2px;
`

const MoreItem = styled.button`
  height: 34px;
  padding: 0 12px;
  text-align: left;
  background: transparent;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  color: #274865;
  cursor: pointer;
  display: flex;
  align-items: center;
  width: 100%;

  &:hover:not(:disabled) {
    background: #f0f7ff;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`

const DangerItem = styled(MoreItem)`
  color: #a03636;

  &:hover:not(:disabled) {
    background: #fff5f5;
  }
`

const Composer = styled.div`
  padding: 10px 12px 14px;
  border-top: 1px solid #dbe6f0;
  background: #fff;
  display: grid;
  gap: 8px;
  flex-shrink: 0;
`

const InputArea = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #d5dfeb;
  resize: vertical;
  font-size: 13px;
  line-height: 1.7;
  font-family: inherit;
  background: #fafcff;

  &:focus {
    outline: none;
    border-color: #7aaee0;
    background: #fff;
  }
`

const SubmitRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`

const SubmitButton = styled.button`
  flex: 1;
  height: 36px;
  border-radius: 10px;
  border: 1px solid #77a9df;
  background: linear-gradient(180deg, #6aa4e2 0%, #4b8fd7 100%);
  color: #fff;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: linear-gradient(180deg, #5e9ade 0%, #3f83cf 100%);
  }

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

const QUICK_ACTIONS = [
  { label: '改正式', prompt: '请改得更正式，符合中文办公文稿风格。' },
  { label: '压缩', prompt: '请压缩成三段以内，保留核心信息。' },
  { label: '扩写', prompt: '请扩写依据表达；如果依据不足，请明确写"需要人工确认依据"。' },
  { label: '检查逻辑', prompt: '请检查逻辑并直接改成更严谨的表达。' },
] as const

const MORE_ACTIONS = [
  { label: '加入政策引用', prompt: '请补充相关政策引用；如果依据不足，请明确写"需要人工确认依据"。', scope: 'section' as const },
  { label: '生成摘要', prompt: '请生成一段简洁摘要，方便快速汇报。', scope: 'section' as const },
  { label: '改成汇报口吻', prompt: '请改成适合会议汇报的口吻。', scope: 'section' as const },
  { label: '重写当前章节', prompt: '请重写当前章节，保持主题不变但结构更清晰。', scope: 'section' as const },
] as const

interface DocumentAiEditPanelProps {
  selectedSectionId: string | null
  selectedSectionLabel: string
  selectedText: string
  selectionLength: number
  history: SectionHistoryEntry[]
  busy?: boolean
  disabled?: boolean
  hasDocument: boolean
  canUndoLastAiEdit?: boolean
  onUndoLastAiEdit?: () => void
  onContinueWriting?: (instruction?: string) => Promise<void> | void
  onGenerate: (text: string) => Promise<void> | void
  onSubmit: (instruction: string, scope: DocumentAiScope) => Promise<void> | void
}

export function DocumentAiEditPanel({
  selectedSectionId,
  selectedSectionLabel,
  selectedText,
  selectionLength,
  history,
  busy,
  disabled,
  hasDocument,
  canUndoLastAiEdit,
  onUndoLastAiEdit,
  onContinueWriting,
  onGenerate,
  onSubmit,
}: DocumentAiEditPanelProps) {
  const [input, setInput] = useState('')
  const [moreOpen, setMoreOpen] = useState(false)
  const historyEndRef = useRef<HTMLDivElement | null>(null)

  const resolvedScope = useMemo<DocumentAiScope | null>(() => {
    if (!hasDocument) return null
    if (selectionLength > 0) return 'selection'
    if (selectedSectionId) return 'section'
    return null
  }, [hasDocument, selectedSectionId, selectionLength])

  const scopeLabel = (() => {
    if (!hasDocument) return '新文稿'
    if (selectionLength > 0) return `已选中 ${selectionLength} 字`
    if (selectedSectionId) return `当前章节：${selectedSectionLabel}`
    return '全文'
  })()

  const placeholder = !hasDocument
    ? '告诉 AI 你要写什么，例如：生成一份学院年度工作总结，包含主要成绩、问题分析、下一年度计划。'
    : resolvedScope === 'selection'
      ? `已选中 ${selectionLength} 字，输入修改指令…`
      : selectedSectionId
        ? `当前章节：${selectedSectionLabel}，输入修改指令…`
        : '告诉 AI 如何修改当前文稿…'

  const submitLabel = !hasDocument
    ? busy ? '正在生成…' : '生成文稿'
    : resolvedScope === 'selection'
      ? busy ? '正在修改…' : '修改选中内容'
      : resolvedScope === 'section'
        ? busy ? '正在修改…' : '修改当前章节'
        : '请先选择章节或内容'

  const handleSubmit = async () => {
    const text = input.trim()
    if (!text) return
    if (!hasDocument) {
      await onGenerate(text)
      setInput('')
      return
    }
    const scope = resolvedScope
    if (!scope) return
    await onSubmit(text, scope)
    setInput('')
  }

  const handleQuickAction = async (prompt: string, scopeOverride?: DocumentAiScope) => {
    if (!hasDocument || disabled || busy) return
    const scope = scopeOverride || resolvedScope
    if (!scope) return
    await onSubmit(prompt, scope)
  }

  const isSubmitDisabled = busy || (!hasDocument ? !input.trim() : (!resolvedScope || !input.trim()))

  return (
    <Panel data-testid="document-ai-edit-panel">
      <PanelHeader>
        <PanelTitle>AI 文稿助手</PanelTitle>
        <ScopeBadgeRow>
          <ScopeBadge>{scopeLabel}</ScopeBadge>
          {selectionLength > 0
            ? <ScopeBadge $tone="warn">选中文字将被替换</ScopeBadge>
            : hasDocument && !selectedSectionId
              ? <ScopeBadge>请点击章节或选中文字</ScopeBadge>
              : null}
        </ScopeBadgeRow>
      </PanelHeader>

      <ChatHistory>
        {history.length === 0
          ? (
            <EmptyHint>
              {hasDocument
                ? '在下方输入修改指令，或选中文字后发送。AI 会记住每次对话历史，可随时撤回上一次修改。'
                : '在下方输入你想写的文稿类型，AI 会先做任务识别再生成。'}
            </EmptyHint>
          )
          : history.map((item, index) => (
            <Bubble key={`${item.role}-${index}`} $role={item.role}>
              {item.text}
            </Bubble>
          ))}
        <div ref={historyEndRef} />
      </ChatHistory>

      {hasDocument ? (
        <QuickRow>
          {QUICK_ACTIONS.map((action) => (
            <QuickBtn
              key={action.label}
              type="button"
              data-testid={`document-ai-quick-${action.label}`}
              disabled={disabled || busy || !resolvedScope}
              onClick={() => void handleQuickAction(action.prompt)}
            >
              {action.label}
            </QuickBtn>
          ))}
          <MoreWrapper>
            <QuickBtn
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              disabled={disabled || busy}
            >
              更多指令
              {moreOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </QuickBtn>
            {moreOpen && (
              <MoreDropdown>
                {MORE_ACTIONS.map((action) => (
                  <MoreItem
                    key={action.label}
                    type="button"
                    disabled={disabled || busy || !resolvedScope}
                    onClick={() => {
                      setMoreOpen(false)
                      void handleQuickAction(action.prompt, action.scope)
                    }}
                  >
                    {action.label}
                  </MoreItem>
                ))}
                <MoreItem
                  type="button"
                  disabled={disabled || busy || !selectedSectionId}
                  onClick={() => {
                    setMoreOpen(false)
                    void onContinueWriting?.(input.trim() || '请紧接当前光标继续往下写。')
                    setInput('')
                  }}
                >
                  续写下文
                </MoreItem>
                <MoreItem
                  type="button"
                  disabled={!canUndoLastAiEdit || busy}
                  onClick={() => {
                    setMoreOpen(false)
                    onUndoLastAiEdit?.()
                  }}
                >
                  撤回上一次 AI 修改
                </MoreItem>
                <DangerItem
                  type="button"
                  data-testid="document-ai-rewrite-document"
                  disabled={busy || disabled}
                  onClick={() => {
                    setMoreOpen(false)
                    if (!window.confirm('确认重写全文？这会用 AI 覆盖当前文稿内容。')) return
                    void onSubmit('请重写当前全文，保留主题但重构整体表达。', 'document')
                  }}
                >
                  重写全文
                </DangerItem>
              </MoreDropdown>
            )}
          </MoreWrapper>
        </QuickRow>
      ) : null}

      <Composer>
        <InputArea
          value={input}
          data-testid="document-ai-edit-input"
          disabled={busy}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
              event.preventDefault()
              void handleSubmit()
            }
          }}
          placeholder={placeholder}
        />
        <SubmitRow>
          <SubmitButton
            type="button"
            data-testid="document-ai-edit-submit"
            disabled={isSubmitDisabled}
            onClick={() => void handleSubmit()}
          >
            {submitLabel}
          </SubmitButton>
        </SubmitRow>
      </Composer>
    </Panel>
  )
}
