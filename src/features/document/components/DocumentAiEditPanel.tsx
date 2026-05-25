import { useMemo } from 'react'
import styled from 'styled-components'
import type { DocumentCitation, DocumentReference } from '../services/documentWorkbenchApi'
import type { DocumentPatchOperation } from '../services/documentCommandEngine'

const Panel = styled.aside`
  width: 300px;
  min-width: 280px;
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
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const ScrollRegion = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
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

const InspectorSection = styled.div`
  margin: 0 14px 12px;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid #dbe5ef;
  background: rgba(255, 255, 255, 0.88);
  display: grid;
  gap: 8px;
`

const InspectorTitle = styled.div`
  font-size: 12px;
  font-weight: 800;
  color: #4a647c;
`

const MetaLine = styled.div`
  font-size: 12px;
  color: #627789;
  line-height: 1.6;
`

const RefList = styled.div`
  display: grid;
  gap: 8px;
`

const RefCard = styled.div`
  padding: 10px 12px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #d8e3ef;
  display: grid;
  gap: 6px;
`

const RefLabel = styled.div`
  font-size: 12px;
  font-weight: 700;
  color: #294764;
`

const RefMeta = styled.div`
  font-size: 11px;
  color: #6d8193;
  line-height: 1.6;
`

const CitationList = styled.div`
  display: grid;
  gap: 6px;
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
  onUndoLastAiEdit?: () => void
  onUndoLastCommand?: () => void
  onContinueWriting?: (instruction?: string) => Promise<void> | void
  onInsertCitation?: (reference: DocumentReference) => void
  onGenerate: (text: string) => Promise<void> | void
  onSubmit: (instruction: string, scope: DocumentAiScope) => Promise<void> | void
}

function providerLabel(provider?: 'remote' | 'workspace'): string {
  if (provider === 'remote') return '远端知识库'
  if (provider === 'workspace') return '工作区附件'
  return '未标注来源'
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
  onUndoLastAiEdit,
  onUndoLastCommand,
  onContinueWriting,
  onInsertCitation,
  onGenerate,
  onSubmit,
}: DocumentAiEditPanelProps) {
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

  const lastInstruction = useMemo(() => {
    if (lastCommandOp?.instruction) return lastCommandOp.instruction
    return [...history].reverse().find((item) => item.role === 'user')?.text || ''
  }, [history, lastCommandOp])

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

      <ScrollRegion>
        <InspectorSection data-testid="document-current-location">
          <InspectorTitle>当前定位</InspectorTitle>
          <MetaLine>{selectedSectionId ? `章节：${selectedSectionLabel}` : '章节：全文'}</MetaLine>
          <MetaLine>{selectedBlockId ? `Block：${selectedBlockRole || 'paragraph'} · ${selectedBlockId}` : 'Block：未选中'}</MetaLine>
          {selectedBlockText ? <MetaLine>{selectedBlockText.slice(0, 80)}</MetaLine> : null}
        </InspectorSection>

        <InspectorSection data-testid="document-save-status">
          <InspectorTitle>保存状态</InspectorTitle>
          <MetaLine>{saving ? '状态：保存中' : dirty ? '状态：有未保存修改' : '状态：已保存 / 已同步本地草稿'}</MetaLine>
          {lastSavedAt ? <MetaLine>最近保存：{new Date(lastSavedAt).toLocaleString()}</MetaLine> : null}
          {statusMessage ? <MetaLine>提示：{statusMessage}</MetaLine> : null}
        </InspectorSection>

        <InspectorSection data-testid="document-last-command-inspector">
          <InspectorTitle>上一次指令</InspectorTitle>
          {lastInstruction ? <MetaLine>原始指令：{lastInstruction}</MetaLine> : <MetaLine>暂无指令记录</MetaLine>}
          {lastCommandOp ? (
            <>
              <MetaLine>Intent：{lastCommandOp.intent}</MetaLine>
              <MetaLine>作用块：{lastCommandOp.blockIds.join('、') || '—'}</MetaLine>
              <MetaLine>影响数量：{lastCommandOp.blockIds.length} 个 block</MetaLine>
              <MetaLine>AI 调用：{lastCommandOp.aiCalled ? '是' : '否'}</MetaLine>
              <MetaLine>可撤销：{canUndoLastCommand ? '是' : '否'}</MetaLine>
              <MetaLine data-testid="document-last-command-card">
                {lastCommandOp.summary} · intent：{lastCommandOp.intent}
              </MetaLine>
            </>
          ) : null}
        </InspectorSection>

        <InspectorSection data-testid="document-undo-status">
          <InspectorTitle>可撤销状态</InspectorTitle>
          <MetaLine>上次 AI 修改：{canUndoLastAiEdit ? '可撤回' : '无可撤回项'}</MetaLine>
          <MetaLine>上次指令操作：{canUndoLastCommand ? '可撤销' : '无可撤销项'}</MetaLine>
          {canUndoLastAiEdit ? <QuickBtn type="button" disabled={busy || disabled} onClick={onUndoLastAiEdit}>撤回 AI 修改</QuickBtn> : null}
          {canUndoLastCommand ? <QuickBtn type="button" disabled={busy || disabled} onClick={onUndoLastCommand}>撤销指令操作</QuickBtn> : null}
        </InspectorSection>

        {references.length > 0 || citations.length > 0 ? (
          <InspectorSection data-testid="document-reference-panel">
            <InspectorTitle>引用来源</InspectorTitle>
            {citations.length > 0 ? <MetaLine>当前文稿引用 {citations.length} 条</MetaLine> : null}
            <RefList>
              {references.map((reference) => (
                <RefCard key={reference.id}>
                  <RefLabel>{reference.label}</RefLabel>
                  <RefMeta>来源：{providerLabel(reference.provider)} · {reference.sourceType || reference.kind}</RefMeta>
                  <RefMeta>sourceId: {reference.sourceId || '手动来源'}</RefMeta>
                  <RefMeta>chunkId: {reference.chunkId || '待检索'} · trustLevel: {reference.trustLevel || reference.citationStatus || 'unknown'}</RefMeta>
                  {reference.citedBlockIds?.length ? <RefMeta>引用段落：{reference.citedBlockIds.join('、')}</RefMeta> : null}
                  {reference.excerpt ? <RefMeta>{reference.excerpt}</RefMeta> : null}
                  {onInsertCitation ? (
                    <QuickBtn
                      type="button"
                      disabled={busy || disabled || !selectedBlockId}
                      onClick={() => onInsertCitation(reference)}
                    >
                      插入引用
                    </QuickBtn>
                  ) : null}
                </RefCard>
              ))}
            </RefList>
            {citations.length > 0 ? (
              <CitationList>
                {citations.slice(0, 6).map((citation) => (
                  <RefCard key={citation.id}>
                    <RefLabel>{citation.text || citation.id}</RefLabel>
                    <RefMeta>{citation.renderMode} · blockId: {citation.blockId}</RefMeta>
                    <RefMeta>来源：{providerLabel(citation.provider)}</RefMeta>
                    <RefMeta>sourceId: {citation.sourceId || 'manual'} · chunkId: {citation.chunkId || '待检索'} · trustLevel: {citation.trustLevel || 'unknown'}</RefMeta>
                  </RefCard>
                ))}
              </CitationList>
            ) : null}
          </InspectorSection>
        ) : null}

      </ScrollRegion>
    </Panel>
  )
}
