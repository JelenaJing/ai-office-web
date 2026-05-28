import styled from 'styled-components'
import { DOCUMENT_TYPE_CARDS } from '../services/documentCapabilities'

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
`

const Card = styled.button<{ $pending?: boolean }>`
  text-align: left;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid ${p => (p.$pending ? '#fcd34d' : '#e2e8f0')};
  background: #fff;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.12);
  }
`

const Label = styled.div`
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 4px;
`

const Badge = styled.span`
  font-size: 11px;
  color: #b45309;
  background: #fef3c7;
  padding: 2px 6px;
  border-radius: 4px;
`

interface Props {
  onSelect: (typeId: string) => void
}

export default function DocumentTypeSelector({ onSelect }: Props) {
  return (
    <Grid>
      {DOCUMENT_TYPE_CARDS.map(card => (
        <Card key={card.id} type="button" $pending={Boolean(card.pending)} onClick={() => onSelect(card.id)}>
          <Label>{card.label}</Label>
          {'pending' in card && card.pending ? <Badge>论文 pipeline 待接入</Badge> : null}
        </Card>
      ))}
    </Grid>
  )
}
