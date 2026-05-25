import { useCallback, useMemo } from 'react'
import styled from 'styled-components'
import type { DocumentCitation, DocumentReference } from '../services/documentWorkbenchApi'
import type { DocumentPatchOperation } from '../services/documentCommandEngine'

const Panel = styled.aside`
  width: 360px;
  min-width: 320px;
  border-left: 1px solid #d8e3ef;
  background: #f8fbfe;
  display: flex;
  flex-direction: column;
  min-height: 0;
`

const PanelHeader = styled.div`
  padding: 18px 18px 14px;
  border-bottom: 1px solid #dbe6f0;
  background: rgba(255, 255, 255, 0.94);
  flex-shrink: 0;
`

const PanelTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  color: #1d3a57;
  font-weight: 800;
`

const PanelDescription = styled.div`
  margin-top: 6px;
  font-size: 12px;
  color: #627789;
  line-height: 1.6;
`

const ScrollRegion = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 14px;
  display: grid;
  align-content: start;
  gap: 12px;
`

const SectionCard = styled.section`
  padding: 14px;
  border-radius: 16px;
  border: 1px solid #dbe5ef;
  background: rgba(255, 255, 255, 0.92);
  display: grid;
  gap: 10px;
`

const SectionTitle = styled.div`
  font-size: 12px;
  font-weight: 800;
  color: #49627a;
`

const MetaGrid = styled.div`
  display: grid;
  gap: 8px;
`

const MetaLabel = styled.div`
  font-size: 12px;
  color: #607487;
  line-height: 1.6;
`

const FocusBadgeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

const FocusBadge = styled.div<{ $tone?: 'info' | 'warn' }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 999px;
  background: ${({ $tone }) => ($tone === 'warn' ? '#fff7e5' : '#edf4fb')};
  color: ${({ $tone }) => ($tone === 'warn' ? '#8a5f1f' : '#31516f')};
  font-size: 11px;
  font-weight: 700;
`

const PreviewBox = styled.div`
  padding: 10px 12px;
  border-radius: 12px;
  background: #f5f9fd;
  color: #39546d;
  font-size: 12px;
  line-height: 1.7;
  white-space: pre-wrap;
`

const ActionGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

const QuickBtn = styled.button`
  min-height: 32px;
  padding: 0 12px;
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

const PromptBox = styled.div`
  display: grid;
  gap: 10px;
`

const PromptTextarea = styled.textarea`
  width: 100%;
  min-height: 116px;
  max-height: 220px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid #d4deea;
  resize: vertical;
  font-size: 14px;
  line-height: 1.7;
  font-family: inherit;
  background: #fbfdff;

  &:focus {
    outline: none;
    border-color: #7aaee0;
    background: #fff;
  }
`

const PromptFooter = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
`

const PromptHint = styled.div`
  font-size: 12px;
  color: #6b7f92;
  line-height: 1.6;
`

const SubmitButton = styled.button`
  min-height: 40px;
  padding: 0 16px;
  border-radius: 12px;
  border: 1px solid #77a9df;
  background: linear-gradient(180deg, #6aa4e2 0%, #4b8fd7 100%);
  color: #fff;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`

const HistoryList = styled.div`
  display: grid;
  gap: 8px;
`

const Bubble = styled.div<{ $role: 'user' | 'assistant' }>`
  padding: 10px 12px;
  border-radius: 14px;
  background: ${({ $role }) => ($role === 'user' ? '#2e6aad' : '#f5f9fd')};
  color: ${({ $role }) => ($role === 'user' ? '#fff' : '#304356')};
  border: 1px solid ${({ $role }) => ($role === 'user' ? 'transparent' : '#dbe5ef')};
  font-size: 12px;
  line-height: 1.7;
  white-space: pre-wrap;
`

const BubbleLabel = styled.div`
  margin-bottom: 4px;
  font-size: 11px;
  font-weight: 800;
  opacity: 0.82;
`

const EmptyHint = styled.div`
  font-size: 12px;
  color: #7a8fa0;
  line-height: 1.8;
`

const SourceList = styled.div`
  display: grid;
  gap: 8px;
`

const SourceCard = styled.div`
  padding: 10px 12px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #d8e3ef;
  display: grid;
  gap: 6px;
`

const SourceTitle = styled.div`
  font-size: 12px;
  font-weight: 700;
  color: #294764;
`

const SourceMeta = styled.div`
  font-size: 11px;
  color: #6d8193;
  line-height: 1.6;
`

export interface SectionHistoryEntry {
  role: 'user' | 'assistant'
  text: string
}

export type DocumentAiScope = 'selection' | 'section' | 'document'

interface DocumentAiEditPanelProps {
  selectedSectionId: string | null
  selectedSectionLabel: string
  selectedBlockId?: string | null
  selectedBlockRole?: string
  selectedBlockText?: string
  selectedText: string
  selectionLength: number
  history: SectionHistoryEntry[]
  references?: DocumentReference[]
  citations?: DocumentCitation[]
  busy?: boolean
  disabled?: boolean
  hasDocument: boolean
  dirty?: boolean
  saving?: boolean
  lastSavedAt?: string | null
  statusMessage?: string
  canUndoLastAiEdit?: boolean
  lastCommandOp?: DocumentPatchOperation | null
  canUndoLastCommand?: boolean
  promptValue: string
  onPromptChange: (value: string) => void
  onUndoLastAiEdit?: () => void
  onUndoLastCommand?: () => void
  onContinueWriting?: (instruction?: string) => Promise<void> | void
  onInsertCitation?: (reference: DocumentReference) => void
  onGenerate: (text: string) => Promise<void> | void
  onSubmit: (instruction: string, scope: DocumentAiScope) => Promise<void> | void
}

function providerLabel(provider?: 'remote' | 'workspace'): string {
  if (provider === 'remote') return '知识库'
  if (provider === 'workspace') return '附件'
  return '引用来源'
}

function summarizeText(text?: string, limit = 96): string {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim()
  if (!normalized) return ''
  return normalized.length > limit ? `${normalized.slice(0, limit)}…` : normalized
}

function formatTime(value?: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

export function DocumentAiEditPanel({
  selectedSectionId,
  selectedSectionLabel,
  selectedBlockId,
  selectedBlockRole,
  selectedBlockText,
  selectedText,
  selectionLength,
  history,
  references = [],
  citations = [],
  busy,
  disabled,
  hasDocument,
  dirty,
  saving,
  lastSavedAt,
  statusMessage,
  canUndoLastAiEdit,
  lastCommandOp,
  canUndoLastCommand,
  promptValue,
  onPromptChange,
  onUndoLastAiEdit,
  onUndoLastCommand,
  onContinueWriting,
  onInsertCitation,
  onGenerate,
  onSubmit,
}: DocumentAiEditPanelProps) {
  const hasCurrentParagraph = Boolean(
    selectedBlockId
    && selectedBlockText?.trim()
    && ['paragraph', 'quote', 'list-item'].includes(selectedBlockRole || ''),
  )

  const resolvedScope = useMemo<DocumentAiScope | null>(() => {
    if (!hasDocument) return null
    if (selectionLength > 0) return 'selection'
    if (hasCurrentParagraph || selectedSectionId) return 'section'
    return 'document'
  }, [hasCurrentParagraph, hasDocument, selectedSectionId, selectionLength])

  const scopeLabel = (() => {
    if (!hasDocument) return '新文稿'
    if (selectionLength > 0) return '已选中文字'
    if (hasCurrentParagraph) return '当前段落'
    if (selectedSectionId) return '当前章节'
    return '全文'
  })()

  const focusPreview = selectionLength > 0
    ? summarizeText(selectedText, 140)
    : hasCurrentParagraph
      ? summarizeText(selectedBlockText, 140)
      : selectedSectionId
        ? `将对“${selectedSectionLabel}”执行操作。`
        : '将对整篇文稿执行操作。'

  const promptHint = !hasDocument
    ? '直接描述你要生成的文稿，例如：帮我生成一份年度总结。'
    : selectionLength > 0
      ? '当前会优先改写已选中的文字。'
      : hasCurrentParagraph
        ? '当前会优先改写光标所在段落；也可直接继续写或补充引用。'
        : selectedSectionId
          ? `当前会作用于章节“${selectedSectionLabel}”。`
          : '未选中内容时，默认作用于全文。'

  const recentHistory = useMemo(
    () => [...history].reverse().slice(0, 6),
    [history],
  )

  const visibleReferences = useMemo(() => {
    const citedRefIds = new Set(citations.map((item) => item.refId))
    const preferred = citedRefIds.size > 0
      ? references.filter((reference) => citedRefIds.has(reference.id))
      : references
    return preferred.slice(0, 6)
  }, [citations, references])

  const handlePrimarySubmit = useCallback(async () => {
    const instruction = promptValue.trim()
    if (!instruction) return
    if (!hasDocument) {
      await onGenerate(instruction)
      onPromptChange('')
      return
    }
    await onSubmit(instruction, resolvedScope || 'document')
    onPromptChange('')
  }, [hasDocument, onGenerate, onPromptChange, onSubmit, promptValue, resolvedScope])

  const runQuickAction = useCallback(async (kind: 'polish' | 'expand' | 'shorten' | 'formalize' | 'cite' | 'continue') => {
    if (!hasDocument) return
    if (kind === 'continue') {
      await onContinueWriting?.()
      return
    }
    if (kind === 'cite') {
      if (references[0] && onInsertCitation) {
        onInsertCitation(references[0])
        return
      }
      await onSubmit('请给当前内容添加引用。', resolvedScope || 'section')
      return
    }

    const instructionMap: Record<'polish' | 'expand' | 'shorten' | 'formalize', string> = {
      polish: '请润色当前内容，让表达更顺滑、自然、清晰。',
      expand: '请扩写当前内容，补充更多细节和依据。',
      shorten: '请缩写当前内容，保留关键信息并更精炼。',
      formalize: '请把当前内容改得更正式，符合中文办公文稿风格。',
    }
    await onSubmit(instructionMap[kind], resolvedScope || 'document')
  }, [hasDocument, onContinueWriting, onInsertCitation, onSubmit, references, resolvedScope])

  return (
    <Panel data-testid="document-ai-edit-panel">
      <PanelHeader>
        <PanelTitle>AI 文稿助手</PanelTitle>
        <PanelDescription>在这里统一生成初稿、改写当前内容、继续写，以及把知识来源插入文稿。</PanelDescription>
      </PanelHeader>

      <ScrollRegion>
        <SectionCard data-testid="document-current-focus">
          <SectionTitle>当前选中</SectionTitle>
          <FocusBadgeRow>
            <FocusBadge>{scopeLabel}</FocusBadge>
            {selectionLength > 0 ? <FocusBadge $tone="warn">将替换已选中文字</FocusBadge> : null}
          </FocusBadgeRow>
          {hasDocument ? (
            <MetaGrid>
              <MetaLabel>{selectedSectionId ? `当前位置：${selectedSectionLabel}` : '当前位置：全文'}</MetaLabel>
              {focusPreview ? <PreviewBox>{focusPreview}</PreviewBox> : null}
            </MetaGrid>
          ) : (
            <MetaLabel>输入需求后可直接生成新文稿。</MetaLabel>
          )}
        </SectionCard>

        <SectionCard data-testid="document-save-status">
          <SectionTitle>保存状态</SectionTitle>
          <MetaGrid>
            <MetaLabel>{saving ? '正在保存…' : dirty ? '有未保存修改' : '内容已保存'}</MetaLabel>
            {lastSavedAt ? <MetaLabel>最近保存：{formatTime(lastSavedAt)}</MetaLabel> : null}
            {statusMessage ? <MetaLabel>{statusMessage}</MetaLabel> : null}
            {(lastCommandOp?.summary || canUndoLastAiEdit || canUndoLastCommand) ? (
              <ActionGrid>
                {lastCommandOp?.summary ? <FocusBadge>{lastCommandOp.summary}</FocusBadge> : null}
                {canUndoLastAiEdit ? (
                  <QuickBtn type="button" disabled={busy || disabled} onClick={onUndoLastAiEdit}>
                    撤回 AI 修改
                  </QuickBtn>
                ) : null}
                {canUndoLastCommand ? (
                  <QuickBtn type="button" disabled={busy || disabled} onClick={onUndoLastCommand}>
                    撤销上一步
                  </QuickBtn>
                ) : null}
              </ActionGrid>
            ) : null}
          </MetaGrid>
        </SectionCard>

        <SectionCard data-testid="document-ai-actions">
          <SectionTitle>快捷操作</SectionTitle>
          <ActionGrid>
            <QuickBtn type="button" disabled={busy || disabled || !hasDocument} onClick={() => void runQuickAction('polish')}>
              润色
            </QuickBtn>
            <QuickBtn type="button" disabled={busy || disabled || !hasDocument} onClick={() => void runQuickAction('expand')}>
              扩写
            </QuickBtn>
            <QuickBtn type="button" disabled={busy || disabled || !hasDocument} onClick={() => void runQuickAction('shorten')}>
              缩写
            </QuickBtn>
            <QuickBtn type="button" disabled={busy || disabled || !hasDocument} onClick={() => void runQuickAction('formalize')}>
              改正式
            </QuickBtn>
            <QuickBtn type="button" disabled={busy || disabled || !hasDocument} onClick={() => void runQuickAction('cite')}>
              加引用
            </QuickBtn>
            <QuickBtn type="button" disabled={busy || disabled || !hasDocument || !onContinueWriting} onClick={() => void runQuickAction('continue')}>
              继续写
            </QuickBtn>
          </ActionGrid>
        </SectionCard>

        <SectionCard data-testid="document-ai-prompt">
          <SectionTitle>{hasDocument ? '输入修改指令' : '生成新文稿'}</SectionTitle>
          <PromptBox>
            <PromptTextarea
              value={promptValue}
              data-testid="document-generation-prompt"
              onChange={(event) => onPromptChange(event.target.value)}
              placeholder={hasDocument
                ? '例如：把这段改得更正式，并补充一条依据。'
                : '例如：帮我生成一份年度总结，包含主要成绩、问题分析和下一步计划。'}
            />
            <PromptFooter>
              <PromptHint>{promptHint}</PromptHint>
              <SubmitButton
                type="button"
                data-testid="document-generate-button"
                disabled={busy || disabled || !promptValue.trim()}
                onClick={() => void handlePrimarySubmit()}
              >
                {busy ? '处理中…' : hasDocument ? '发送给 AI' : '生成文稿'}
              </SubmitButton>
            </PromptFooter>
          </PromptBox>
        </SectionCard>

        <SectionCard data-testid="document-ai-history">
          <SectionTitle>最近操作历史</SectionTitle>
          {recentHistory.length > 0 ? (
            <HistoryList>
              {recentHistory.map((item, index) => (
                <Bubble key={`${item.role}-${index}-${item.text.slice(0, 24)}`} $role={item.role}>
                  <BubbleLabel>{item.role === 'user' ? '你' : 'AI 助手'}</BubbleLabel>
                  {item.text}
                </Bubble>
              ))}
            </HistoryList>
          ) : (
            <EmptyHint>这里会显示最近的生成、改写、续写和引用操作记录。</EmptyHint>
          )}
        </SectionCard>

        {(visibleReferences.length > 0 || citations.length > 0) ? (
          <SectionCard data-testid="document-reference-panel">
            <SectionTitle>引用来源</SectionTitle>
            {visibleReferences.length > 0 ? (
              <SourceList>
                {visibleReferences.map((reference) => (
                  <SourceCard key={reference.id}>
                    <SourceTitle>{reference.label}</SourceTitle>
                    <SourceMeta>{providerLabel(reference.provider)}</SourceMeta>
                    <SourceMeta>{summarizeText(reference.excerpt, 140) || '已选为当前文稿可用来源。'}</SourceMeta>
                    {onInsertCitation ? (
                      <QuickBtn
                        type="button"
                        disabled={busy || disabled || !selectedBlockId}
                        onClick={() => onInsertCitation(reference)}
                      >
                        插入引用
                      </QuickBtn>
                    ) : null}
                  </SourceCard>
                ))}
              </SourceList>
            ) : (
              <SourceList>
                {citations.slice(0, 6).map((citation) => (
                  <SourceCard key={citation.id}>
                    <SourceTitle>{citation.text || '已插入引用'}</SourceTitle>
                    <SourceMeta>{providerLabel(citation.provider)}</SourceMeta>
                    <SourceMeta>该来源已插入到当前文稿中。</SourceMeta>
                  </SourceCard>
                ))}
              </SourceList>
            )}
          </SectionCard>
        ) : null}
      </ScrollRegion>
    </Panel>
  )
}
