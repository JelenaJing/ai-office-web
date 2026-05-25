import React, { useMemo } from 'react'
import styled from 'styled-components'
import { useGenerationWorkbench } from '../../../contexts/GenerationWorkbenchContext'
import { parseSlidevMarkdownToPreviews } from '../services/webDeckSlides'
import PptSlideNavigator from './PptSlideNavigator'
import { resolveWebApiUrl } from '../../../runtime/apiBase'

const Card = styled.section`
  margin-top: 36px;
  padding: 20px 22px 18px;
  border-radius: 16px;
  border: 1px solid #dde6f0;
  background: #ffffff;
  display: grid;
  gap: 14px;
`

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`

const CardTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #1a2f47;
`

const OpenBtn = styled.button`
  padding: 8px 16px;
  border-radius: 10px;
  border: none;
  background: #2563eb;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
`

const Layout = styled.div`
  display: grid;
  grid-template-columns: 168px minmax(0, 1fr);
  gap: 12px;
  min-height: 280px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`

const PreviewPane = styled.div`
  min-height: 280px;
  border-radius: 12px;
  overflow: hidden;
  background: #525659;
  display: flex;
  align-items: center;
  justify-content: center;
`

const PreviewFrame = styled.iframe`
  width: 100%;
  height: 100%;
  min-height: 280px;
  border: none;
  background: #ffffff;
`

const NavWrap = styled.div`
  border: 1px solid #d0d7e2;
  border-radius: 10px;
  overflow: hidden;
  min-height: 280px;
`

interface PptHomePreviewCardProps {
  onOpenWorkspace: () => void
}

export default function PptHomePreviewCard({ onOpenWorkspace }: PptHomePreviewCardProps) {
  const { sessions, setModeSession } = useGenerationWorkbench()
  const pptSession = sessions.ppt
  const title = pptSession.resultTitle || '演示文稿'
  const slides = useMemo(() => {
    if (pptSession.pptLiveSlides?.length) return pptSession.pptLiveSlides
    if (pptSession.pptSlides?.length) return pptSession.pptSlides
    if (pptSession.pptSlidevMarkdown?.trim()) {
      return parseSlidevMarkdownToPreviews(pptSession.pptSlidevMarkdown, title)
    }
    return []
  }, [pptSession.pptLiveSlides, pptSession.pptSlides, pptSession.pptSlidevMarkdown, title])

  const previewUrl = pptSession.pptPreviewUrl || ''
  const hasDeck = Boolean(pptSession.pptDeckId) && slides.length > 0
  const officialUrl = previewUrl.includes('/slidev-access/')
    ? resolveWebApiUrl(previewUrl)
    : ''

  if (!hasDeck) return null

  const activeIndex = Math.min(
    Math.max(pptSession.pptActiveSlideIndex || 0, 0),
    Math.max(slides.length - 1, 0),
  )

  return (
    <Card data-testid="ppt-home-preview-card">
      <CardHeader>
        <CardTitle>最近 PPT：{title}</CardTitle>
        <OpenBtn type="button" onClick={onOpenWorkspace}>继续编辑</OpenBtn>
      </CardHeader>
      <Layout>
        <NavWrap>
          <PptSlideNavigator
            slides={slides}
            activeIndex={activeIndex}
            compact
            onSelectSlide={(index) => {
              setModeSession('ppt', (session) => ({
                ...session,
                pptActiveSlideIndex: index,
              }))
            }}
          />
        </NavWrap>
        <PreviewPane>
          {officialUrl ? (
            <PreviewFrame
              src={`${officialUrl.replace(/\/?$/, '')}#/${activeIndex + 1}`}
              title={`首页预览：${title}`}
            />
          ) : (
            <PreviewFrame
              src={resolveWebApiUrl(`/api/ppt/decks/${encodeURIComponent(pptSession.pptDeckId || '')}/slidev-preview#slide-${activeIndex + 1}`)}
              title={`首页预览：${title}`}
            />
          )}
        </PreviewPane>
      </Layout>
    </Card>
  )
}
