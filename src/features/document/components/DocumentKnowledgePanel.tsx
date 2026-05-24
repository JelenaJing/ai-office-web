import styled from 'styled-components'
import { BookOpen, Paperclip, Plus, X } from 'lucide-react'
import type { FileEntry } from '../../../platform'
import type { Department } from '../../../types/knowledge'

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
  departments: Department[]
  selectedKnowledgeIds: string[]
  onOpenKnowledgePicker: () => void
}

interface DocumentAttachmentPanelProps {
  attachments: FileEntry[]
  onAddAttachment: () => void
  onRemoveAttachment: (fileId: string) => void
}

export function DocumentKnowledgePanel({
  departments,
  selectedKnowledgeIds,
  onOpenKnowledgePicker,
}: DocumentKnowledgePanelProps) {
  const departmentNameMap = new Map(departments.map((department) => [department.id, department.name]))

  return (
    <Panel data-testid="document-knowledge-panel">
      <div style={{ display: 'grid', gap: 10 }}>
        <div style={{ display: 'grid', gap: 6 }}>
          <Title>知识库选择</Title>
          <Description>生成文稿时会把所选知识库一并传入 `/api/documents/start`。</Description>
        </div>
        <div>
          <ActionButton type="button" onClick={onOpenKnowledgePicker}>
            <BookOpen size={14} />
            选择知识库
          </ActionButton>
        </div>
        <TagList>
          {selectedKnowledgeIds.length > 0
            ? selectedKnowledgeIds.map((id) => <Tag key={id}>{departmentNameMap.get(id) || id}</Tag>)
            : <div style={{ fontSize: 12, color: '#6b7f92' }}>未选择知识库</div>}
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
          <Title>附件引用</Title>
          <Description>可附加 DOCX、PDF、TXT、Markdown 等材料，作为当前文稿的引用输入。</Description>
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
