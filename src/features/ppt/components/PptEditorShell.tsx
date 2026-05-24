import React, { useMemo, useState } from 'react'
import styled from 'styled-components'
import type { PptAiMessage, PptSlidePreview } from '../../../contexts/GenerationWorkbenchContext'
import PptAiEditPanel from './PptAiEditPanel'
import PptCanvasPreview from './PptCanvasPreview'
import PptSlideNavigator from './PptSlideNavigator'
import PptTopToolbar from './PptTopToolbar'
import type { PptTemplateOption } from '../services/pptTemplates'

const Shell = styled.div`
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  background: #f3f6fb;
`

const Body = styled.div<{ $collapsed: boolean }>`
  position: relative;
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr) ${({ $collapsed }) => ($collapsed ? '0px' : '360px')};
  overflow: hidden;

  @media (max-width: 1280px) {
    grid-template-columns: 200px minmax(0, 1fr) ${({ $collapsed }) => ($collapsed ? '0px' : '320px')};
  }

  @media (max-width: 980px) {
    grid-template-columns: 180px minmax(0, 1fr);
  }
`

const RightPaneWrap = styled.div<{ $collapsed: boolean }>`
  min-width: 0;
  overflow: hidden;

  @media (max-width: 980px) {
    display: ${({ $collapsed }) => ($collapsed ? 'none' : 'block')};
    position: absolute;
    top: 64px;
    right: 0;
    bottom: 0;
    width: min(360px, calc(100vw - 24px));
    box-shadow: -16px 0 40px rgba(15, 23, 42, 0.12);
    z-index: 6;
  }
`

interface PptEditorShellProps {
  title: string
  slides: PptSlidePreview[]
  activeSlideIndex: number
  engineLabel: string
  slideEditEngineLabel: string
  templateLabel: string
  templateId: string | null
  templateOptions: PptTemplateOption[]
  statusMessage?: string | null
  dirty: boolean
  messages: Record<string, PptAiMessage[]>
  editingSlideId: string | null
  slideEditStatus: 'idle' | 'editing' | 'applying' | 'error'
  templateBusy?: boolean
  onSelectSlide: (index: number) => void
  onDownload: () => void
  onTemplateChange: (templateId: string) => void
  onRegenerate: () => void
  onSave: () => void
  onEditSlide: (instruction: string) => Promise<void> | void
}

export default function PptEditorShell({
  title,
  slides,
  activeSlideIndex,
  engineLabel,
  slideEditEngineLabel,
  templateLabel,
  templateId,
  templateOptions,
  statusMessage,
  dirty,
  messages,
  editingSlideId,
  slideEditStatus,
  templateBusy,
  onSelectSlide,
  onDownload,
  onTemplateChange,
  onRegenerate,
  onSave,
  onEditSlide,
}: PptEditorShellProps) {
  const [aiPanelCollapsed, setAiPanelCollapsed] = useState(false)
  const activeSlide = slides[activeSlideIndex] ?? null
  const pageLabel = slides.length > 0 ? `当前页：${activeSlideIndex + 1} / ${slides.length}` : '当前页：0 / 0'
  const activeMessages = useMemo(
    () => (activeSlide?.id ? messages[activeSlide.id] || [] : []),
    [activeSlide?.id, messages],
  )

  return (
    <Shell>
      <PptTopToolbar
        title={title}
        engineLabel={engineLabel}
        slideEditEngineLabel={slideEditEngineLabel}
        pageLabel={pageLabel}
        templateLabel={templateLabel}
        templateId={templateId}
        templateOptions={templateOptions}
        statusMessage={statusMessage}
        dirty={dirty}
        aiPanelCollapsed={aiPanelCollapsed}
        canSave={dirty}
        templateBusy={templateBusy}
        onDownload={onDownload}
        onTemplateChange={onTemplateChange}
        onRegenerate={onRegenerate}
        onSave={onSave}
        onToggleAiPanel={() => setAiPanelCollapsed((value) => !value)}
      />
      <Body $collapsed={aiPanelCollapsed}>
        <PptSlideNavigator
          slides={slides}
          activeIndex={activeSlideIndex}
          editingSlideId={editingSlideId}
          slideEditStatus={slideEditStatus}
          onSelectSlide={onSelectSlide}
        />
        <PptCanvasPreview slide={activeSlide} pageNumber={activeSlideIndex + 1} />
        <RightPaneWrap $collapsed={aiPanelCollapsed}>
          {!aiPanelCollapsed ? (
            <PptAiEditPanel
                slide={activeSlide}
                pageNumber={activeSlideIndex + 1}
                engineLabel={slideEditEngineLabel}
                messages={activeMessages}
                status={slideEditStatus}
                onSend={onEditSlide}
            />
          ) : null}
        </RightPaneWrap>
      </Body>
    </Shell>
  )
}
