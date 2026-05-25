import styled from 'styled-components'
import type { DocumentTemplateOption } from '../services/documentWorkbenchApi'

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

const TemplateGrid = styled.div`
  display: grid;
  gap: 8px;
`

const TemplateCard = styled.button<{ $active?: boolean }>`
  text-align: left;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid ${({ $active }) => ($active ? '#77a6dd' : '#d9e4ee')};
  background: ${({ $active }) => ($active ? '#eef5ff' : '#f8fbfd')};
  cursor: pointer;
`

const TemplateName = styled.div`
  font-size: 13px;
  font-weight: 800;
  color: #274865;
`

const TemplateMeta = styled.div`
  margin-top: 4px;
  font-size: 12px;
  color: #4e6a84;
  font-weight: 700;
`

const TemplateDesc = styled.div`
  margin-top: 6px;
  font-size: 12px;
  color: #607487;
  line-height: 1.5;
`

interface DocumentTemplatePanelProps {
  templates: DocumentTemplateOption[]
  selectedTemplateId: string
  onSelectTemplate: (templateId: string) => void
}

export function DocumentTemplatePanel({
  templates,
  selectedTemplateId,
  onSelectTemplate,
}: DocumentTemplatePanelProps) {
  return (
    <Panel data-testid="document-template-panel">
      <Title>模板选择</Title>
      <Description>选择一份常用模板作为当前文稿起点，生成时会自动套用对应结构。</Description>
      <TemplateGrid>
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            type="button"
            data-testid={`document-template-${template.id}`}
            $active={selectedTemplateId === template.id}
            onClick={() => onSelectTemplate(template.id)}
          >
            <TemplateName>{template.label}</TemplateName>
            <TemplateMeta>{template.defaultTitle}</TemplateMeta>
            <TemplateDesc>{template.description}</TemplateDesc>
          </TemplateCard>
        ))}
      </TemplateGrid>
    </Panel>
  )
}
