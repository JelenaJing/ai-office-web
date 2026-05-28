import { useCallback, useState } from 'react'
import styled from 'styled-components'
import { Send } from 'lucide-react'
import type { DocumentSelectionState } from '../hooks/useDocumentSelection'

const Panel = styled.aside`
  width: min(360px, 38vw);
  min-width: 280px;
  flex-shrink: 0;
  border-left: 1px solid #e2e8f0;
  background: #fafbfc;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  overflow: hidden;
`

const Header = styled.div`
  padding: 14px 16px;
  font-weight: 600;
  font-size: 15px;
  color: #0f172a;
  border-bottom: 1px solid #e2e8f0;
  background: #fff;
  flex-shrink: 0;
`

const ContextSection = styled.div`
  padding: 12px 14px;
  border-bottom: 1px solid #f1f5f9;
  flex-shrink: 0;
  background: #fff;
`

const ContextLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 4px;
`

const Hint = styled.p`
  margin: 0;
  font-size: 12px;
  color: #64748b;
  line-height: 1.55;
`

const Preview = styled.div`
  margin-top: 8px;
  padding: 8px 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 12px;
  color: #475569;
  line-height: 1.5;
  max-height: 72px;
  overflow: hidden;
`

const QuickList = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 10px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  align-content: start;
  border-bottom: 1px solid #f1f5f9;
`

const ActionBtn = styled.button<{ $disabled?: boolean; $wide?: boolean }>`
  text-align: left;
  padding: 9px 10px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #fff;
  cursor: ${p => (p.$disabled ? 'not-allowed' : 'pointer')};
  opacity: ${p => (p.$disabled ? 0.55 : 1)};
  grid-column: ${p => (p.$wide ? '1 / -1' : 'auto')};
  min-width: 0;
  &:hover:not(:disabled) {
    border-color: #93c5fd;
    background: #f8fafc;
  }
`

const ActionTitle = styled.div`
  font-weight: 600;
  font-size: 13px;
  color: #0f172a;
`

const ActionMeta = styled.div`
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
`

const DialogSection = styled.div`
  flex-shrink: 0;
  padding: 12px 14px;
  border-bottom: 1px solid #f1f5f9;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const DialogLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #334155;
`

const TextArea = styled.textarea<{ $disabled?: boolean }>`
  width: 100%;
  min-height: 84px;
  resize: vertical;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: ${p => (p.$disabled ? '#f1f5f9' : '#fff')};
  color: #0f172a;
  font-size: 13px;
  line-height: 1.55;
  box-sizing: border-box;
  &:focus {
    outline: none;
    border-color: #93c5fd;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
  }
  &::placeholder {
    color: #94a3b8;
  }
`

const SendRow = styled.div`
  display: flex;
  justify-content: flex-end;
`

const SendBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 14px;
  border: none;
  border-radius: 8px;
  background: #2563eb;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
  &:hover:not(:disabled) {
    background: #1d4ed8;
  }
`

const ResultSection = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const ResultBox = styled.div`
  padding: 12px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
`

const ResultTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 8px;
`

const ResultText = styled.pre`
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 13px;
  line-height: 1.6;
  color: #1e293b;
  font-family: inherit;
`

const ResultActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
`

const SmallBtn = styled.button`
  height: 30px;
  padding: 0 10px;
  border-radius: 7px;
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #334155;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  &:hover {
    background: #f8fafc;
  }
`

const ErrorText = styled.p`
  margin: 0;
  font-size: 12px;
  color: #b91c1c;
  line-height: 1.5;
`

const DisabledNote = styled.p`
  margin: 0;
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.5;
`

interface ActionItem {
  id: string
  label: string
  meta?: string
  needsSelection?: boolean
}

const QUICK_ACTIONS: ActionItem[] = [
  { id: 'rewrite-selection', label: '改写', meta: '保持原意', needsSelection: true },
  { id: 'polish-selection', label: '润色', meta: '优化表达', needsSelection: true },
  { id: 'humanize-selection', label: '快速改写', meta: '速度快', needsSelection: true },
  { id: 'humanize-document-advanced', label: '深度改写', meta: 'humanizer Skill' },
  { id: 'rewrite-shorten', label: '缩写', meta: '压缩篇幅', needsSelection: true },
  { id: 'rewrite-expand', label: '扩写', meta: '补充细节', needsSelection: true },
  { id: 'summarize-document', label: '生成摘要', meta: '全文要点' },
]

interface Props {
  documentId: string | null
  documentType?: string
  title?: string
  fullText?: string
  hasSelection: boolean
  selection: DocumentSelectionState | null
  loading?: boolean
  error?: string | null
  lastTextResult?: string | null
  onRun: (capabilityId: string, instruction?: string) => void
  onFreeformSend: (instruction: string) => void
  onInsertText: (text: string) => void
  onRegenerate: () => void
  onFullDocumentHumanize?: () => void
}

export default function DocumentAiAssistantPanel({
  documentId,
  hasSelection,
  selection,
  loading,
  error,
  lastTextResult,
  onRun,
  onFreeformSend,
  onInsertText,
  onRegenerate,
  onFullDocumentHumanize,
}: Props) {
  const [instruction, setInstruction] = useState('')

  const placeholder = hasSelection
    ? '输入你想如何修改选中文本，例如：改正式、扩写、降低重复表达'
    : '输入你想让 AI 如何处理全文，例如：总结全文、改成正式报告、压缩到 800 字'

  const handleQuickRun = (item: ActionItem) => {
    if (item.id === 'rewrite-shorten') {
      onRun('rewrite-selection', '缩写选中文本，删除冗余，保留核心信息与事实')
      return
    }
    if (item.id === 'rewrite-expand') {
      onRun('rewrite-selection', '扩写选中文本，补充合理细节与衔接，不编造事实')
      return
    }
    if (item.id === 'humanize-document-advanced') {
      onRun('humanize-document-advanced')
      return
    }
    onRun(item.id)
  }

  const handleSend = useCallback(() => {
    const text = instruction.trim()
    if (!text || loading || !documentId) return
    onFreeformSend(text)
  }, [documentId, instruction, loading, onFreeformSend])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleCopy = async () => {
    if (!lastTextResult) return
    try {
      await navigator.clipboard.writeText(lastTextResult)
    } catch {
      // ignore
    }
  }

  return (
    <Panel>
      <Header>AI 文稿助手</Header>

      <ContextSection>
        <ContextLabel>
          {hasSelection && selection
            ? `当前作用范围：选区（已选中 ${selection.text.length} 字）`
            : '当前作用范围：全文'}
        </ContextLabel>
        {hasSelection && selection ? (
          <Preview>
            {selection.text.slice(0, 180)}
            {selection.text.length > 180 ? '…' : ''}
          </Preview>
        ) : (
          <Hint>未选中文本时，自由指令与「生成摘要」作用于全文；改写/润色等选区能力需先选中段落。</Hint>
        )}
      </ContextSection>

      <QuickList>
        {onFullDocumentHumanize ? (
          <ActionBtn type="button" $wide disabled={loading || !documentId} onClick={onFullDocumentHumanize}>
            <ActionTitle>全文 AI 改写</ActionTitle>
            <ActionMeta>打开 AI 改写页处理全文</ActionMeta>
          </ActionBtn>
        ) : null}
        {QUICK_ACTIONS.map(item => {
          const needsSelection = Boolean(item.needsSelection)
          const disabled = loading || !documentId || (needsSelection && !hasSelection)
          return (
            <ActionBtn
              key={item.id}
              type="button"
              $disabled={disabled}
              disabled={disabled}
              onClick={() => handleQuickRun(item)}
            >
              <ActionTitle>{item.label}</ActionTitle>
              <ActionMeta>
                {needsSelection && !hasSelection ? '选中文本后可用' : item.meta}
              </ActionMeta>
            </ActionBtn>
          )
        })}
      </QuickList>

      <DialogSection>
        <DialogLabel>AI 对话</DialogLabel>
        {!documentId ? (
          <DisabledNote>请先生成或打开一篇文稿</DisabledNote>
        ) : null}
        <TextArea
          $disabled={!documentId || loading}
          disabled={!documentId || loading}
          value={instruction}
          onChange={e => setInstruction(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={3}
        />
        <SendRow>
          <SendBtn type="button" disabled={!documentId || loading || !instruction.trim()} onClick={handleSend}>
            <Send size={14} />
            {loading ? '处理中…' : '发送'}
          </SendBtn>
        </SendRow>
        {error ? <ErrorText>{error}</ErrorText> : null}
      </DialogSection>

      <ResultSection>
        {lastTextResult ? (
          <ResultBox>
            <ResultTitle>AI 返回结果</ResultTitle>
            <ResultText>{lastTextResult}</ResultText>
            <ResultActions>
              <SmallBtn type="button" onClick={() => onInsertText(lastTextResult)}>
                插入到光标处
              </SmallBtn>
              <SmallBtn type="button" onClick={() => void handleCopy()}>
                复制
              </SmallBtn>
              <SmallBtn type="button" onClick={onRegenerate} disabled={loading}>
                重新生成
              </SmallBtn>
            </ResultActions>
          </ResultBox>
        ) : (
          <Hint>发送指令后，文本类结果将显示在此处；改写类结果会弹出预览确认。</Hint>
        )}
      </ResultSection>
    </Panel>
  )
}
