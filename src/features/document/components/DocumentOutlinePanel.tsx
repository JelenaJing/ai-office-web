import styled from 'styled-components'
import type { DocumentDraft } from '../services/documentWorkbenchApi'

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

const OutlineList = styled.div`
  display: grid;
  gap: 8px;
`

const OutlineButton = styled.button<{ $active?: boolean }>`
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid ${({ $active }) => ($active ? '#7aa8dc' : '#dbe5ef')};
  background: ${({ $active }) => ($active ? '#eef5fd' : '#f9fbfd')};
  color: ${({ $active }) => ($active ? '#1f4f82' : '#334e68')};
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
`

interface DocumentOutlinePanelProps {
  document: DocumentDraft | null
  selectedSectionId: string | null
  onSelectSection: (sectionId: string) => void
}

export function DocumentOutlinePanel({
  document,
  selectedSectionId,
  onSelectSection,
}: DocumentOutlinePanelProps) {
  return (
    <Panel>
      <Title>文档目录</Title>
      <OutlineList>
        {document?.outline.map((item, index) => (
          <OutlineButton
            key={item.id}
            type="button"
            $active={selectedSectionId === item.id}
            onClick={() => onSelectSection(item.id)}
          >
            {index + 1}. {item.title}
          </OutlineButton>
        )) ?? <div style={{ fontSize: 12, color: '#6b7f92' }}>生成文稿后，这里会显示章节目录。</div>}
      </OutlineList>
    </Panel>
  )
}
