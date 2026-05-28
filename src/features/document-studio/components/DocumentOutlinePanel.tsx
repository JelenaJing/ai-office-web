import styled from 'styled-components'
import type { OutlineHeading } from '../services/editorContentBridge'

const Panel = styled.aside<{ $collapsed: boolean }>`
  width: ${p => (p.$collapsed ? '0' : '220px')};
  flex-shrink: 0;
  border-right: ${p => (p.$collapsed ? 'none' : '1px solid #e2e8f0')};
  background: #f8fafc;
  overflow: hidden;
  transition: width 0.2s ease;
`

const Inner = styled.div`
  width: 220px;
  padding: 14px 12px;
  height: 100%;
  overflow-y: auto;
`

const Title = styled.div`
  font-weight: 600;
  font-size: 13px;
  color: #0f172a;
  margin-bottom: 10px;
`

const Item = styled.button<{ $level: number }>`
  display: block;
  width: 100%;
  text-align: left;
  border: none;
  background: none;
  cursor: pointer;
  padding: 6px 8px;
  padding-left: ${p => 8 + (p.$level - 1) * 12}px;
  border-radius: 6px;
  font-size: 13px;
  color: #475569;
  line-height: 1.4;
  &:hover {
    background: #e2e8f0;
    color: #0f172a;
  }
`

interface Props {
  headings: OutlineHeading[]
  collapsed: boolean
  onJump: (blockId: string) => void
}

export default function DocumentOutlinePanel({ headings, collapsed, onJump }: Props) {
  if (collapsed) return <Panel $collapsed />

  return (
    <Panel $collapsed={false}>
      <Inner>
        <Title>大纲</Title>
        {!headings.length ? (
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>暂无大纲</p>
        ) : (
          headings.map(h => (
            <Item key={h.blockId} type="button" $level={h.level} onClick={() => onJump(h.blockId)}>
              {h.text.slice(0, 40)}
              {h.text.length > 40 ? '…' : ''}
            </Item>
          ))
        )}
      </Inner>
    </Panel>
  )
}
