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
  attachments: FileEntry[]
  onOpenKnowledgePicker: () => void
  onAddAttachment: () => void
  onRemoveAttachment: (fileId: string) => void
}

export function DocumentKnowledgePanel({
  departments,
  selectedKnowledgeIds,
  attachments,
  onOpenKnowledgePicker,
  onAddAttachment,
  onRemoveAttachment,
}: DocumentKnowledgePanelProps) {
  const departmentNameMap = new Map(departments.map((department) => [department.id, department.name]))

  return (
    <Panel>
      <div>
        <Title>知识库选择</Title>
        <div style={{ marginTop: 10 }}>
          <ActionButton type="button" onClick={onOpenKnowledgePicker}>
            <BookOpen size={14} />
            选择知识库
          </ActionButton>
        </div>
        <TagList style={{ marginTop: 10 }}>
          {selectedKnowledgeIds.length > 0
            ? selectedKnowledgeIds.map((id) => <Tag key={id}>{departmentNameMap.get(id) || id}</Tag>)
            : <div style={{ fontSize: 12, color: '#6b7f92' }}>未选择知识库</div>}
        </TagList>
      </div>

      <div>
        <Title>附件引用</Title>
        <div style={{ marginTop: 10 }}>
          <ActionButton type="button" onClick={onAddAttachment}>
            <Plus size={14} />
            添加附件
          </ActionButton>
        </div>
        <TagList style={{ marginTop: 10 }}>
          {attachments.length > 0
            ? attachments.map((file) => (
              <Tag key={file.id}>
                <Paperclip size={12} />
                {file.name}
                <RemoveButton type="button" onClick={() => onRemoveAttachment(file.id)}>
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
