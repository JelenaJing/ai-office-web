import styled from 'styled-components'
import { BookOpen, Paperclip, Plus, X } from 'lucide-react'
import type { FileEntry, KnowledgeSourceListItem } from '../../../platform'

const Panel = styled.section`
  border: 1px solid #d8e3ef;
  border-radius: 16px;
  background: #fff;
  padding: 14px;
  display: grid;
  gap: 12px;
`

const Title = styled.h3`
  margin: 0;
  font-size: 14px;
  color: #1e3954;
`

const Description = styled.div`
  font-size: 12px;
  color: #6b7f92;
  line-height: 1.6;
`

const ActionButton = styled.button`
  height: 34px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid #d3dfeb;
  background: #f8fbff;
  color: #2c547c;
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
`

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

const Tag = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  border-radius: 999px;
  background: #edf4fb;
  color: #31516f;
  font-size: 12px;
  font-weight: 700;
`

const ProviderPill = styled.span<{ $provider: 'remote' | 'workspace' }>`
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  border-radius: 999px;
  background: ${({ $provider }) => ($provider === 'remote' ? '#e8efff' : '#eef8ec')};
  color: ${({ $provider }) => ($provider === 'remote' ? '#2c55b8' : '#2e7d32')};
  font-size: 11px;
  font-weight: 700;
`

const RemoveButton = styled.button`
  border: none;
  background: transparent;
  color: inherit;
  padding: 0;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
`

interface DocumentKnowledgePanelProps {
  sources: KnowledgeSourceListItem[]
  selectedKnowledgeIds: string[]
  onOpenKnowledgePicker: () => void
}

interface DocumentAttachmentPanelProps {
  attachments: FileEntry[]
  onAddAttachment: () => void
  onRemoveAttachment: (fileId: string) => void
}

export function DocumentKnowledgePanel({
  sources,
  selectedKnowledgeIds,
  onOpenKnowledgePicker,
}: DocumentKnowledgePanelProps) {
  const sourceMap = new Map(sources.map((source) => [source.id, source]))

  return (
    <Panel data-testid="document-knowledge-panel">
      <div style={{ display: 'grid', gap: 10 }}>
        <div style={{ display: 'grid', gap: 6 }}>
          <Title>远端知识库</Title>
          <Description>选择知识库材料后，AI 生成、改写和补充引用时会优先使用这些内容。</Description>
        </div>
        <div>
          <ActionButton type="button" onClick={onOpenKnowledgePicker}>
            <BookOpen size={14} />
            选择远端文档
          </ActionButton>
        </div>
        <TagList>
          {selectedKnowledgeIds.length > 0
            ? selectedKnowledgeIds.map((id) => {
                const source = sourceMap.get(id)
                return (
                  <Tag key={id}>
                    <ProviderPill $provider="remote">远端知识库</ProviderPill>
                    {source?.title || id}
                  </Tag>
                )
              })
            : <div style={{ fontSize: 12, color: '#6b7f92' }}>未选择远端知识库文档</div>}
        </TagList>
      </div>
    </Panel>
  )
}

export function DocumentAttachmentPanel({
  attachments,
  onAddAttachment,
  onRemoveAttachment,
}: DocumentAttachmentPanelProps) {
  return (
    <Panel data-testid="document-attachment-panel">
      <div style={{ display: 'grid', gap: 10 }}>
        <div style={{ display: 'grid', gap: 6 }}>
          <Title>工作区附件</Title>
          <Description>上传当前工作区里的 DOCX、PDF、TXT 或 Markdown 材料，生成和改写时会一起作为参考。</Description>
        </div>
        <div>
          <ActionButton type="button" onClick={onAddAttachment}>
            <Plus size={14} />
            添加附件
          </ActionButton>
        </div>
        <TagList>
          {attachments.length > 0
            ? attachments.map((file) => (
              <Tag key={file.id}>
                <ProviderPill $provider="workspace">工作区附件</ProviderPill>
                <Paperclip size={12} />
                {file.name}
                <RemoveButton type="button" onClick={() => onRemoveAttachment(file.id)} aria-label={`移除附件 ${file.name}`}>
                  <X size={12} />
                </RemoveButton>
              </Tag>
            ))
            : <div style={{ fontSize: 12, color: '#6b7f92' }}>未添加附件引用</div>}
        </TagList>
      </div>
    </Panel>
  )
}
