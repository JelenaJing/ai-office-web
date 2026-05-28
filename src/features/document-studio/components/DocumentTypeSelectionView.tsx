import styled from 'styled-components'
import { ArrowLeft } from 'lucide-react'
import { DOCUMENT_TYPE_CARDS } from '../services/documentCapabilities'
import { DOCUMENT_TYPE_DESCRIPTIONS } from '../services/documentTypeMeta'
import DocumentStudioStepIndicator from './DocumentStudioStepIndicator'

const Page = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
`

const Scroll = styled.div`
  flex: 1;
  overflow: auto;
`

const Inner = styled.div`
  max-width: 960px;
  margin: 0 auto;
  padding: 32px 32px 48px;
`

const HeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 16px;
  margin-bottom: 28px;
`

const Title = styled.h1`
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.02em;
`

const Subtitle = styled.p`
  margin: 0;
  font-size: 15px;
  color: #64748b;
  line-height: 1.6;
  max-width: 520px;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
`

const Card = styled.button<{ $pending?: boolean }>`
  text-align: left;
  padding: 20px 18px;
  border-radius: 14px;
  border: 1px solid ${p => (p.$pending ? '#fde68a' : '#e2e8f0')};
  background: #fff;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s;
  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.1);
    transform: translateY(-2px);
  }
`

const CardTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 8px;
`

const CardDesc = styled.div`
  font-size: 13px;
  color: #64748b;
  line-height: 1.55;
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
  padding: 0 0 12px;
  &:hover {
    color: #0f172a;
  }
`

const Badge = styled.span`
  display: inline-block;
  margin-top: 12px;
  font-size: 11px;
  color: #92400e;
  background: #fffbeb;
  border: 1px solid #fde68a;
  padding: 2px 8px;
  border-radius: 6px;
`

interface Props {
  onSelect: (typeId: string) => void
  onBackToHome?: () => void
}

export default function DocumentTypeSelectionView({ onSelect, onBackToHome }: Props) {
  return (
    <Page>
      <DocumentStudioStepIndicator step="type" />
      <Scroll>
        <Inner>
          {onBackToHome ? (
            <BackBtn type="button" onClick={onBackToHome}>
              <ArrowLeft size={16} /> 返回 Document Studio 首页
            </BackBtn>
          ) : null}
          <HeaderRow>
            <div>
              <Title>你想生成什么文稿？</Title>
              <Subtitle>选择类型后，AI Office 会自动匹配写作能力和模板。</Subtitle>
            </div>
          </HeaderRow>
          <Grid>
            {DOCUMENT_TYPE_CARDS.map(card => {
              const meta = DOCUMENT_TYPE_DESCRIPTIONS[card.id]
              const pending = Boolean('pending' in card && card.pending) || meta?.pending
              return (
                <Card key={card.id} type="button" $pending={pending} onClick={() => onSelect(card.id)}>
                  <CardTitle>{card.label}</CardTitle>
                  <CardDesc>{meta?.summary || '点击开始填写写作需求'}</CardDesc>
                  {pending ? <Badge>pipeline 待接入</Badge> : null}
                </Card>
              )
            })}
          </Grid>
        </Inner>
      </Scroll>
    </Page>
  )
}
