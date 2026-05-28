import styled from 'styled-components'
import { ArrowLeft } from 'lucide-react'
import type { RecentDocumentEntry } from '../services/documentStudioRecent'

const Page = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
`

const Top = styled.div`
  flex-shrink: 0;
  padding: 16px 24px;
  border-bottom: 1px solid #e2e8f0;
  background: #fff;
  display: flex;
  align-items: center;
  gap: 12px;
`

const BackBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: none;
  color: #64748b;
  font-size: 13px;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 6px;
  &:hover {
    background: #f1f5f9;
    color: #0f172a;
  }
`

const Title = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
`

const List = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px 40px;
  max-width: 720px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
`

const Item = styled.button`
  display: block;
  width: 100%;
  text-align: left;
  padding: 14px 16px;
  margin-bottom: 10px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #fff;
  cursor: pointer;
  &:hover {
    border-color: #93c5fd;
    background: #f8fafc;
  }
`

const ItemTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 4px;
`

const ItemMeta = styled.div`
  font-size: 12px;
  color: #94a3b8;
`

const Empty = styled.p`
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
  margin-top: 48px;
`

interface Props {
  items: RecentDocumentEntry[]
  onBack: () => void
  onOpen: (documentId: string) => void
}

export default function DocumentRecentListView({ items, onBack, onOpen }: Props) {
  return (
    <Page>
      <Top>
        <BackBtn type="button" onClick={onBack}>
          <ArrowLeft size={16} /> 返回首页
        </BackBtn>
        <Title>最近文稿</Title>
      </Top>
      <List>
        {items.length === 0 ? <Empty>暂无最近文稿</Empty> : null}
        {items.map(item => (
          <Item key={item.documentId} type="button" onClick={() => onOpen(item.documentId)}>
            <ItemTitle>{item.title}</ItemTitle>
            <ItemMeta>
              {item.documentId}
              {item.updatedAt ? ` · ${new Date(item.updatedAt).toLocaleString()}` : ''}
            </ItemMeta>
          </Item>
        ))}
      </List>
    </Page>
  )
}
