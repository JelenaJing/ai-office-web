import React from 'react'
import styled from 'styled-components'

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  border-bottom: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.96);
`

const Left = styled.div`
  min-width: 0;
  display: grid;
  gap: 6px;
`

const Title = styled.div`
  font-size: 15px;
  font-weight: 800;
  color: #15324b;
`

const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

const MetaBadge = styled.span`
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid #dbe4ee;
  background: #f8fbff;
  font-size: 11px;
  font-weight: 700;
  color: #30485f;
`

const Actions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
`

const Button = styled.button<{ $primary?: boolean }>`
  height: 38px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid ${({ $primary }) => ($primary ? '#2563eb' : '#dbe4ee')};
  background: ${({ $primary }) => ($primary ? 'linear-gradient(135deg, #2563eb, #0ea5e9)' : '#ffffff')};
  color: ${({ $primary }) => ($primary ? '#ffffff' : '#243b53')};
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`

interface PptTopToolbarProps {
  title: string
  engineLabel: string
  pageLabel: string
  dirty: boolean
  aiPanelCollapsed: boolean
  canSave: boolean
  onDownload: () => void
  onRegenerate: () => void
  onSave: () => void
  onToggleAiPanel: () => void
}

export default function PptTopToolbar({
  title,
  engineLabel,
  pageLabel,
  dirty,
  aiPanelCollapsed,
  canSave,
  onDownload,
  onRegenerate,
  onSave,
  onToggleAiPanel,
}: PptTopToolbarProps) {
  return (
    <Toolbar>
      <Left>
        <Title>{title}</Title>
        <Meta>
          <MetaBadge>{engineLabel}</MetaBadge>
          <MetaBadge>{pageLabel}</MetaBadge>
          <MetaBadge>模板：TODO</MetaBadge>
          <MetaBadge>{dirty ? '存在未保存修改' : '已保存'}</MetaBadge>
        </Meta>
      </Left>
      <Actions>
        <Button type="button" disabled>模板切换（TODO）</Button>
        <Button type="button" onClick={onToggleAiPanel}>{aiPanelCollapsed ? '展开 AI 面板' : '折叠 AI 面板'}</Button>
        <Button type="button" onClick={onDownload}>下载 PPTX</Button>
        <Button type="button" onClick={onRegenerate}>重新生成整套</Button>
        <Button type="button" onClick={onSave} disabled={!canSave}>{dirty ? '保存修改' : '已保存'}</Button>
      </Actions>
    </Toolbar>
  )
}
