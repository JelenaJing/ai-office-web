import React, { useEffect, useRef } from 'react'
import styled from 'styled-components'
import type { PptSlidePreview } from '../../../contexts/GenerationWorkbenchContext'

const Nav = styled.aside<{ $compact?: boolean }>`
  width: ${({ $compact }) => ($compact ? '148px' : '168px')};
  min-width: ${({ $compact }) => ($compact ? '148px' : '168px')};
  max-width: ${({ $compact }) => ($compact ? '148px' : '168px')};
  padding: 12px 10px;
  background: #eceff4;
  border-right: 1px solid #d0d7e2;
  overflow-y: auto;
  display: grid;
  align-content: start;
  gap: 8px;
`

const EmptyState = styled.div`
  padding: 16px 8px;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
  font-size: 11px;
  color: #64748b;
  line-height: 1.6;
  text-align: center;
`

const SlideCard = styled.button<{ $active: boolean }>`
  width: 100%;
  padding: 6px;
  border-radius: 6px;
  border: 2px solid ${({ $active }) => ($active ? '#d24726' : 'transparent')};
  background: ${({ $active }) => ($active ? '#fff4f0' : 'transparent')};
  display: grid;
  gap: 4px;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s ease, background 0.15s ease;

  &:hover {
    border-color: ${({ $active }) => ($active ? '#d24726' : '#94a3b8')};
    background: ${({ $active }) => ($active ? '#fff4f0' : 'rgba(255,255,255,0.65)')};
  }
`

const Thumbnail = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 4px;
  border: 1px solid #c8d0dc;
  background: #ffffff;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.08);
`

const ThumbnailImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`

const ThumbFallback = styled.div`
  width: 100%;
  height: 100%;
  padding: 6px 8px;
  display: grid;
  align-content: center;
  gap: 3px;
  background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%);
`

const ThumbTitle = styled.div`
  font-size: 8px;
  font-weight: 700;
  color: #1e3a5f;
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const PageLabel = styled.span`
  font-size: 10px;
  font-weight: 700;
  color: #64748b;
  text-align: center;
`

interface PptSlideNavigatorProps {
  slides: PptSlidePreview[]
  activeIndex: number
  compact?: boolean
  onSelectSlide: (index: number) => void
}

export default function PptSlideNavigator({
  slides,
  activeIndex,
  compact = false,
  onSelectSlide,
}: PptSlideNavigatorProps) {
  const activeRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [activeIndex])

  if (slides.length === 0) {
    return <Nav $compact={compact}><EmptyState>暂无幻灯片</EmptyState></Nav>
  }

  return (
    <Nav $compact={compact} data-testid="ppt-slide-navigator">
      {slides.map((slide, index) => {
        const active = index === activeIndex
        const previewImage = slide.previewImageUrl || slide.imagePath || null
        return (
          <SlideCard
            key={slide.id || `slide-${index}`}
            $active={active}
            onClick={() => onSelectSlide(index)}
            ref={active ? (node) => { activeRef.current = node } : undefined}
            type="button"
            data-slide-index={index}
            title={slide.title || `第 ${index + 1} 页`}
          >
            <Thumbnail>
              {previewImage ? (
                <ThumbnailImage src={previewImage} alt={slide.title || `第 ${index + 1} 页`} />
              ) : (
                <ThumbFallback>
                  <ThumbTitle>{slide.title || `第 ${index + 1} 页`}</ThumbTitle>
                </ThumbFallback>
              )}
            </Thumbnail>
            <PageLabel>{index + 1}</PageLabel>
          </SlideCard>
        )
      })}
    </Nav>
  )
}
