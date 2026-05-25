import React, { useEffect, useRef } from 'react'
import styled, { keyframes } from 'styled-components'
import type { PptSlidePreview } from '../../../contexts/GenerationWorkbenchContext'

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`

const Nav = styled.aside`
  width: 220px;
  min-width: 220px;
  max-width: 220px;
  padding: 14px 12px;
  background: #f7f9fc;
  border-right: 1px solid #e2e8f0;
  overflow-y: auto;
  display: grid;
  align-content: start;
  gap: 10px;

  @media (max-width: 1080px) {
    width: 200px;
    min-width: 200px;
    max-width: 200px;
  }
`

const EmptyState = styled.div`
  padding: 20px 12px;
  border: 1px dashed #cbd5e1;
  border-radius: 16px;
  background: #ffffff;
  font-size: 12px;
  color: #64748b;
  line-height: 1.7;
  text-align: center;
`

const SlideCard = styled.button<{ $active: boolean }>`
  width: 100%;
  padding: 10px;
  border-radius: 16px;
  border: 2px solid ${({ $active }) => ($active ? '#3b82f6' : '#dbe4ee')};
  background: ${({ $active }) => ($active ? '#eff6ff' : '#ffffff')};
  display: grid;
  gap: 8px;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
  box-shadow: ${({ $active }) => ($active ? '0 10px 22px rgba(59, 130, 246, 0.16)' : '0 3px 10px rgba(15, 23, 42, 0.04)')};

  &:hover {
    border-color: #60a5fa;
    transform: translateY(-1px);
  }
`

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`

const PageNumber = styled.span`
  font-size: 11px;
  font-weight: 800;
  color: #3b82f6;
`

const LayoutBadge = styled.span`
  padding: 2px 8px;
  border-radius: 999px;
  background: #eef2ff;
  color: #4f46e5;
  font-size: 10px;
  font-weight: 700;
`

const Thumbnail = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 12px;
  border: 1px solid #dbe4ee;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  overflow: hidden;
  padding: 8px;
  display: grid;
  align-content: start;
  gap: 4px;
`

const ThumbnailImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 10px;
`

const ThumbTitle = styled.div`
  font-size: 10px;
  font-weight: 800;
  color: #1e3a5f;
  line-height: 1.35;
`

const ThumbBullet = styled.div`
  font-size: 9px;
  color: #64748b;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const SlideTitle = styled.div`
  font-size: 12px;
  font-weight: 700;
  color: #243b53;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const CardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`

const MetaText = styled.span`
  font-size: 11px;
  color: #64748b;
`

const StatusTag = styled.span<{ $tone: 'editing' | 'modified' }>`
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  ${({ $tone }) => ($tone === 'editing'
    ? 'background:#eff6ff;color:#2563eb;'
    : 'background:#ecfdf5;color:#047857;')}
`

const Spinner = styled.span`
  width: 12px;
  height: 12px;
  border-radius: 999px;
  border: 2px solid rgba(59, 130, 246, 0.18);
  border-top-color: #3b82f6;
  display: inline-block;
  animation: ${spin} 0.9s linear infinite;
`

const MoveButtons = styled.div`
  display: inline-flex;
  gap: 4px;
`

const MoveButton = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 8px;
  border: 1px solid #dbe4ee;
  background: #ffffff;
  color: #94a3b8;
  cursor: not-allowed;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  user-select: none;
`

function formatLayout(layout?: string, type?: string): string {
  const key = layout || type || 'content'
  const labelMap: Record<string, string> = {
    cover: '封面',
    toc: '目录',
    content: '内容',
    summary: '总结',
    timeline: '时间线',
    comparison: '对比',
    table: '表格',
    'two-column': '双栏',
    quote: '引用',
    'section-divider': '章节',
    cards: '卡片',
    split: '分栏',
  }
  return labelMap[key] || key
}

interface PptSlideNavigatorProps {
  slides: PptSlidePreview[]
  activeIndex: number
  editingSlideId?: string | null
  slideEditStatus?: 'idle' | 'editing' | 'applying' | 'error'
  onSelectSlide: (index: number) => void
}

export default function PptSlideNavigator({
  slides,
  activeIndex,
  editingSlideId,
  slideEditStatus = 'idle',
  onSelectSlide,
}: PptSlideNavigatorProps) {
  const activeRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [activeIndex])

  if (slides.length === 0) {
    return <Nav><EmptyState>暂无幻灯片</EmptyState></Nav>
  }

  return (
    <Nav>
      {slides.map((slide, index) => {
        const active = index === activeIndex
        const previewImage = slide.previewImageUrl || slide.imagePath || null
        const isEditing = editingSlideId && slide.id === editingSlideId && (slideEditStatus === 'editing' || slideEditStatus === 'applying')
        const bullets = (slide.bullets || slide.items || []).slice(0, 2)
        return (
          <SlideCard
            key={slide.id || index}
            $active={active}
            onClick={() => onSelectSlide(index)}
            ref={active ? (node) => { activeRef.current = node } : undefined}
            type="button"
            data-slide-index={index}
          >
            <CardHeader>
              <PageNumber>第 {index + 1} 页</PageNumber>
              <LayoutBadge>{formatLayout(slide.layout, slide.type)}</LayoutBadge>
            </CardHeader>
            <Thumbnail>
              {previewImage ? (
                <ThumbnailImage src={previewImage} alt={slide.title || `第 ${index + 1} 页`} />
              ) : (
                <>
                  <ThumbTitle>{slide.title || `第 ${index + 1} 页`}</ThumbTitle>
                  {bullets.map((bullet, bulletIndex) => (
                    <ThumbBullet key={`${bullet}-${bulletIndex}`}>• {bullet}</ThumbBullet>
                  ))}
                </>
              )}
            </Thumbnail>
            <SlideTitle>{slide.title || `第 ${index + 1} 页`}</SlideTitle>
            <CardFooter>
              <MetaText>{slide.modified ? '已修改' : '未修改'}</MetaText>
              {isEditing ? (
                <StatusTag $tone="editing"><Spinner /> 修改中</StatusTag>
              ) : slide.modified ? (
                <StatusTag $tone="modified">已修改</StatusTag>
              ) : (
                <MoveButtons>
                  <MoveButton title="TODO">↑</MoveButton>
                  <MoveButton title="TODO">↓</MoveButton>
                </MoveButtons>
              )}
            </CardFooter>
          </SlideCard>
        )
      })}
    </Nav>
  )
}
