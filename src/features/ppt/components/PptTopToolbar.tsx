import React from 'react'
import styled from 'styled-components'

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 16px;
  border-bottom: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.96);
`

const Left = styled.div`
  min-width: 0;
  display: grid;
  gap: 2px;
`

const Title = styled.div`
  font-size: 14px;
  font-weight: 800;
  color: #15324b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const StatusText = styled.div`
  font-size: 11px;
  line-height: 1.5;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const Actions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
  flex-shrink: 0;
`

const Button = styled.button<{ $primary?: boolean }>`
  height: 34px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid ${({ $primary }) => ($primary ? '#2563eb' : '#dbe4ee')};
  background: ${({ $primary }) => ($primary ? 'linear-gradient(135deg, #2563eb, #0ea5e9)' : '#ffffff')};
  color: ${({ $primary }) => ($primary ? '#ffffff' : '#243b53')};
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`

interface PptTopToolbarProps {
  title: string
  statusMessage?: string | null
  onDownload: () => void
  downloadLabel?: string
  extraActions?: React.ReactNode
}

export default function PptTopToolbar({
  title,
  statusMessage,
  onDownload,
  downloadLabel = '下载',
  extraActions,
}: PptTopToolbarProps) {
  return (
    <Toolbar>
      <Left>
        <Title>{title}</Title>
        {statusMessage ? <StatusText>{statusMessage}</StatusText> : null}
      </Left>
      <Actions>
        {extraActions}
        <Button type="button" $primary onClick={onDownload}>{downloadLabel}</Button>
      </Actions>
    </Toolbar>
  )
}
