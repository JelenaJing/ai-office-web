import styled from 'styled-components'
import { FilePlus, RefreshCw, FolderOpen } from 'lucide-react'

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
  padding: 40px 32px 56px;
`

const HeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 16px;
  margin-bottom: 32px;
`

const Title = styled.h1`
  margin: 0 0 8px;
  font-size: 32px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.02em;
`

const Subtitle = styled.p`
  margin: 0;
  font-size: 16px;
  color: #64748b;
  line-height: 1.6;
  max-width: 520px;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
`

const Card = styled.button`
  text-align: left;
  padding: 22px 20px;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s;
  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.1);
    transform: translateY(-2px);
  }
`

const CardIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #eff6ff;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
`

const CardTitle = styled.div`
  font-size: 17px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 8px;
`

const CardDesc = styled.div`
  font-size: 13px;
  color: #64748b;
  line-height: 1.55;
`

interface Props {
  onNewDocument: () => void
  onHumanize: () => void
  onOpenRecent: () => void
}

export default function DocumentStudioHomeView({ onNewDocument, onHumanize, onOpenRecent }: Props) {
  return (
    <Page>
      <Scroll>
        <Inner>
          <HeaderRow>
            <div>
              <Title>Document Studio</Title>
              <Subtitle>生成、编辑、AI 改写和导出你的办公文稿。</Subtitle>
            </div>
          </HeaderRow>
          <Grid>
            <Card type="button" onClick={onNewDocument}>
              <CardIcon>
                <FilePlus size={22} />
              </CardIcon>
              <CardTitle>新建文稿</CardTitle>
              <CardDesc>生成新闻稿、汇报材料、通知公告、会议纪要等。</CardDesc>
            </Card>
            <Card type="button" onClick={onHumanize}>
              <CardIcon>
                <RefreshCw size={22} />
              </CardIcon>
              <CardTitle>AI 改写</CardTitle>
              <CardDesc>粘贴文本、上传文件，或对已有文稿进行自然化改写与表达优化。</CardDesc>
            </Card>
            <Card type="button" onClick={onOpenRecent}>
              <CardIcon>
                <FolderOpen size={22} />
              </CardIcon>
              <CardTitle>打开最近文稿</CardTitle>
              <CardDesc>继续编辑或导出已有文稿。</CardDesc>
            </Card>
          </Grid>
        </Inner>
      </Scroll>
    </Page>
  )
}
