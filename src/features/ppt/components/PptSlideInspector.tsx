import React from 'react'
import styled from 'styled-components'
import type { PptSlidePreview } from '../../../contexts/GenerationWorkbenchContext'

const Card = styled.div`
  border: 1px solid #dbe4ee;
  border-radius: 16px;
  background: #ffffff;
  padding: 14px;
  display: grid;
  gap: 10px;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
`

const Item = styled.div`
  padding: 10px 12px;
  border-radius: 12px;
  background: #f8fbff;
  border: 1px solid #e2e8f0;
  display: grid;
  gap: 4px;
`

const Label = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
`

const Value = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: #243b53;
`

interface PptSlideInspectorProps {
  slide: PptSlidePreview | null
}

export default function PptSlideInspector({ slide }: PptSlideInspectorProps) {
  if (!slide) return null
  const bullets = slide.bullets || slide.items || []
  return (
    <Card>
      <Grid>
        <Item>
          <Label>布局</Label>
          <Value>{slide.layout || slide.type || 'content'}</Value>
        </Item>
        <Item>
          <Label>要点数</Label>
          <Value>{bullets.length}</Value>
        </Item>
        <Item>
          <Label>讲稿备注</Label>
          <Value>{slide.notes || slide.speakerNotes ? '已填写' : '未填写'}</Value>
        </Item>
        <Item>
          <Label>修改状态</Label>
          <Value>{slide.modified ? '已修改' : '原始'}</Value>
        </Item>
      </Grid>
    </Card>
  )
}
