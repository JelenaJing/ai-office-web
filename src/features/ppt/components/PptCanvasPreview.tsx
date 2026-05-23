import React from 'react'
import styled from 'styled-components'
import type { PptSlidePreview } from '../../../contexts/GenerationWorkbenchContext'

const Workspace = styled.div`
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px;
  background: #eef3f8;
  overflow: auto;
`

const Canvas = styled.div`
  width: min(100%, 980px);
  aspect-ratio: 16 / 9;
  border-radius: 24px;
  background: #ffffff;
  border: 1px solid #dbe4ee;
  box-shadow: 0 24px 64px rgba(15, 23, 42, 0.12);
  padding: 36px 42px;
  display: grid;
  align-content: start;
  gap: 18px;
  overflow: hidden;
`

const PreviewImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 18px;
`

const Header = styled.div`
  display: grid;
  gap: 8px;
`

const Title = styled.h2`
  margin: 0;
  font-size: clamp(28px, 3vw, 40px);
  line-height: 1.2;
  color: #15324b;
`

const Subtitle = styled.div`
  font-size: 15px;
  color: #64748b;
  line-height: 1.7;
`

const BulletList = styled.div`
  display: grid;
  gap: 12px;
`

const Bullet = styled.div`
  padding: 12px 14px;
  border-radius: 14px;
  background: #f8fbff;
  border: 1px solid #dbe4ee;
  font-size: 16px;
  color: #30485f;
  line-height: 1.6;
`

const TwoColumn = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
`

const Column = styled.div`
  padding: 16px;
  border-radius: 16px;
  border: 1px solid #dbe4ee;
  background: #f8fbff;
  display: grid;
  gap: 12px;
`

const ColumnTitle = styled.div`
  font-size: 16px;
  font-weight: 800;
  color: #15324b;
`

const Timeline = styled.div`
  display: grid;
  gap: 14px;
`

const TimelineItem = styled.div`
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  gap: 12px;
`

const TimelineDot = styled.div`
  width: 14px;
  height: 14px;
  margin-top: 5px;
  border-radius: 999px;
  background: #3b82f6;
  box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.12);
`

const TimelineText = styled.div`
  display: grid;
  gap: 4px;
`

const TimelineTitle = styled.div`
  font-size: 16px;
  font-weight: 800;
  color: #15324b;
`

const TimelineDetail = styled.div`
  font-size: 14px;
  color: #5b7083;
  line-height: 1.6;
`

const Table = styled.div`
  border-radius: 16px;
  border: 1px solid #dbe4ee;
  overflow: hidden;
`

const TableRow = styled.div<{ $header?: boolean }>`
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  background: ${({ $header }) => ($header ? '#eff6ff' : '#ffffff')};
  border-bottom: 1px solid #e2e8f0;
`

const TableCell = styled.div<{ $header?: boolean }>`
  padding: 12px 14px;
  font-size: ${({ $header }) => ($header ? '14px' : '13px')};
  font-weight: ${({ $header }) => ($header ? 800 : 500)};
  color: ${({ $header }) => ($header ? '#1d4ed8' : '#30485f')};
  border-right: 1px solid #e2e8f0;

  &:last-child {
    border-right: none;
  }
`

const QuoteCard = styled.div`
  margin-top: 18px;
  padding: 30px;
  border-radius: 20px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  border: 1px solid #dbe4ee;
  display: grid;
  gap: 14px;
`

const QuoteText = styled.div`
  font-size: clamp(24px, 2.6vw, 34px);
  line-height: 1.4;
  font-weight: 800;
  color: #15324b;
`

const QuoteAuthor = styled.div`
  justify-self: end;
  font-size: 14px;
  color: #64748b;
`

const SectionDivider = styled.div`
  flex: 1;
  display: grid;
  place-items: center;
  text-align: center;
`

const SectionNumber = styled.div`
  font-size: 56px;
  line-height: 1;
  font-weight: 800;
  color: #3b82f6;
`

const EmptyState = styled.div`
  height: 100%;
  display: grid;
  place-items: center;
  text-align: center;
  color: #64748b;
  line-height: 1.8;
  font-size: 15px;
`

interface PptCanvasPreviewProps {
  slide: PptSlidePreview | null
  pageNumber: number
}

export default function PptCanvasPreview({ slide, pageNumber }: PptCanvasPreviewProps) {
  const bullets = slide?.bullets || slide?.items || []
  const layout = slide?.layout || slide?.type || 'content'
  const previewImageUrl = slide?.previewImageUrl || slide?.imagePath || null

  return (
    <Workspace>
      <Canvas>
        {previewImageUrl ? (
          <PreviewImage src={previewImageUrl} alt={slide?.title || `第 ${pageNumber} 页`} />
        ) : !slide ? (
          <EmptyState>当前页暂无可预览内容，但 PPTX 已生成，可下载查看。</EmptyState>
        ) : layout === 'section-divider' ? (
          <SectionDivider>
            <div>
              <SectionNumber>{String(pageNumber).padStart(2, '0')}</SectionNumber>
              <Title>{slide.title || `第 ${pageNumber} 页`}</Title>
              {slide.subtitle ? <Subtitle>{slide.subtitle}</Subtitle> : null}
            </div>
          </SectionDivider>
        ) : (
          <>
            <Header>
              <Title>{slide.title || `第 ${pageNumber} 页`}</Title>
              {slide.subtitle ? <Subtitle>{slide.subtitle}</Subtitle> : null}
            </Header>

            {layout === 'timeline' && slide.timeline?.length ? (
              <Timeline>
                {slide.timeline.map((item, index) => (
                  <TimelineItem key={`${item.title}-${index}`}>
                    <TimelineDot />
                    <TimelineText>
                      <TimelineTitle>{item.title}</TimelineTitle>
                      {item.detail ? <TimelineDetail>{item.detail}</TimelineDetail> : null}
                    </TimelineText>
                  </TimelineItem>
                ))}
              </Timeline>
            ) : null}

            {(layout === 'comparison' || layout === 'table') && slide.table ? (
              <Table>
                {slide.table.headers.length > 0 ? (
                  <TableRow $header>
                    {slide.table.headers.map((header, index) => (
                      <TableCell key={`${header}-${index}`} $header>{header}</TableCell>
                    ))}
                  </TableRow>
                ) : null}
                {slide.table.rows.map((row, rowIndex) => (
                  <TableRow key={`row-${rowIndex}`}>
                    {row.map((cell, cellIndex) => (
                      <TableCell key={`${cell}-${cellIndex}`}>{cell}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </Table>
            ) : null}

            {layout === 'two-column' && slide.columns?.length ? (
              <TwoColumn>
                {slide.columns.slice(0, 2).map((column, index) => (
                  <Column key={`${column.title}-${index}`}>
                    <ColumnTitle>{column.title}</ColumnTitle>
                    <BulletList>
                      {column.items.map((item, itemIndex) => (
                        <Bullet key={`${item}-${itemIndex}`}>• {item}</Bullet>
                      ))}
                    </BulletList>
                  </Column>
                ))}
              </TwoColumn>
            ) : null}

            {layout === 'quote' && slide.quote?.text ? (
              <QuoteCard>
                <QuoteText>“{slide.quote.text}”</QuoteText>
                {slide.quote.author ? <QuoteAuthor>— {slide.quote.author}</QuoteAuthor> : null}
              </QuoteCard>
            ) : null}

            {!['timeline', 'comparison', 'table', 'two-column', 'quote', 'section-divider'].includes(layout) ? (
              bullets.length > 0 ? (
                <BulletList>
                  {bullets.map((item, index) => (
                    <Bullet key={`${item}-${index}`}>• {item}</Bullet>
                  ))}
                </BulletList>
              ) : (
                <EmptyState>当前页暂无可预览内容，但 PPTX 已生成，可下载查看。</EmptyState>
              )
            ) : null}
          </>
        )}
      </Canvas>
    </Workspace>
  )
}
