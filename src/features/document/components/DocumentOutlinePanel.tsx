import styled from 'styled-components'
import type { DocumentOutlineItem } from '../services/documentWorkbenchApi'

const Panel = styled.section`
  border: 1px solid #d8e3ef;
  border-radius: 16px;
  background: #fff;
  padding: 14px;
`

const Title = styled.h3`
  margin: 0 0 10px;
  font-size: 14px;
  color: #1e3954;
`

const Description = styled.div`
  margin-bottom: 12px;
  font-size: 12px;
  color: #6b7f92;
  line-height: 1.6;
`

const OutlineList = styled.div`
  display: grid;
  gap: 8px;
`

const OutlineButton = styled.button<{ $active?: boolean; $level?: number }>`
  width: 100%;
  text-align: left;
  padding: 10px 12px 10px ${({ $level }) => 12 + Math.max(0, (($level || 1) - 1) * 18)}px;
  border-radius: 12px;
  border: 1px solid ${({ $active }) => ($active ? '#7aa8dc' : '#dbe5ef')};
  background: ${({ $active }) => ($active ? '#eef5fd' : '#f9fbfd')};
  color: ${({ $active }) => ($active ? '#1f4f82' : '#334e68')};
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`

const OutlineLabel = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const OutlineMeta = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
`

const ModifiedBadge = styled.span`
  padding: 2px 8px;
  border-radius: 999px;
  background: #fff7e5;
  color: #8a5f1f;
  font-size: 11px;
  font-weight: 800;
`

const TodoBadge = styled.span`
  padding: 2px 8px;
  border-radius: 999px;
  background: #eef3f8;
  color: #607487;
  font-size: 11px;
  font-weight: 700;
`

interface DocumentOutlinePanelProps {
  outline: DocumentOutlineItem[]
  selectedSectionId: string | null
  modifiedSectionIds: string[]
  onSelectSection: (sectionId: string) => void
}

export function DocumentOutlinePanel({
  outline,
  selectedSectionId,
  modifiedSectionIds,
  onSelectSection,
}: DocumentOutlinePanelProps) {
  return (
    <Panel data-testid="document-outline-panel">
      <Title>文档目录</Title>
      <Description>{outline.length > 0 ? `共 ${outline.length} 个章节，可点击定位到中间 A4 文稿页面。` : '生成文稿后自动生成目录。'}</Description>
      <OutlineList>
        {outline.length > 0 ? outline.map((item, index) => (
          <OutlineButton
            key={item.id}
            type="button"
            data-testid={`document-outline-item-${item.id}`}
            $active={selectedSectionId === item.id}
            $level={item.level}
            onClick={() => onSelectSection(item.id)}
          >
            <OutlineLabel>{index + 1}. {item.title}</OutlineLabel>
            <OutlineMeta>
              {modifiedSectionIds.includes(item.id) ? <ModifiedBadge>已修改</ModifiedBadge> : null}
            </OutlineMeta>
          </OutlineButton>
        )) : <div style={{ fontSize: 12, color: '#6b7f92', lineHeight: 1.7 }}>生成文稿后自动生成目录。</div>}
      </OutlineList>
      <Description style={{ marginTop: 10, marginBottom: 0 }}>
        <TodoBadge>TODO</TodoBadge> 拖拽重排将在后续版本开放。
      </Description>
    </Panel>
  )
}
