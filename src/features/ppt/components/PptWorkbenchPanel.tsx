import React from 'react'
import styled from 'styled-components'
import type { PptAiMessage, PptSlidePreview, PptTaskStatus } from '../../../contexts/GenerationWorkbenchContext'
import PptEditorShell from './PptEditorShell'

const EmptyShell = styled.div`
  flex: 1;
  min-height: 0;
  display: grid;
  place-items: center;
  padding: 28px;
  background: #f3f6fb;
`

const EmptyCard = styled.div`
  width: min(440px, 100%);
  padding: 28px;
  border-radius: 20px;
  border: 1px solid #dbe4ee;
  background: #ffffff;
  text-align: center;
  display: grid;
  gap: 10px;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
`

const EmptyTitle = styled.div`
  font-size: 16px;
  font-weight: 800;
  color: #15324b;
`

const EmptyText = styled.div`
  font-size: 13px;
  color: #64748b;
  line-height: 1.8;
`

interface PptWorkbenchPanelProps {
  title: string
  taskStatus: PptTaskStatus
  liveSlides: PptSlidePreview[]
  totalSlides: number
  activeSlideIndex: number
  resultPath: string | null
  templateStatusMessage?: string | null
  pptEngineLabel: string
  pptDirty: boolean
  pptEditMessages: Record<string, PptAiMessage[]>
  pptEditingSlideId: string | null
  pptSlideEditStatus: 'idle' | 'editing' | 'applying' | 'error'
  onDownloadPpt: () => void
  onSelectSlide: (index: number) => void
  onRegenerateDeck: () => void
  onSaveDeck: () => void
  onAiEditSlide: (instruction: string) => Promise<void> | void
}

export default function PptWorkbenchPanel({
  title,
  taskStatus,
  liveSlides,
  activeSlideIndex,
  templateStatusMessage,
  pptEngineLabel,
  pptDirty,
  pptEditMessages,
  pptEditingSlideId,
  pptSlideEditStatus,
  onDownloadPpt,
  onSelectSlide,
  onRegenerateDeck,
  onSaveDeck,
  onAiEditSlide,
}: PptWorkbenchPanelProps) {
  if (taskStatus !== 'completed' && liveSlides.length === 0) {
    return (
      <EmptyShell>
        <EmptyCard>
          <EmptyTitle>{taskStatus === 'failed' ? 'PPT 生成失败' : '准备生成 PPT'}</EmptyTitle>
          <EmptyText>{templateStatusMessage || '生成完成后，这里会显示左侧缩略图、中间画布和右侧 AI 修改面板。'}</EmptyText>
        </EmptyCard>
      </EmptyShell>
    )
  }

  return (
    <PptEditorShell
      title={title}
      slides={liveSlides}
      activeSlideIndex={activeSlideIndex}
      engineLabel={pptEngineLabel}
      dirty={pptDirty}
      messages={pptEditMessages}
      editingSlideId={pptEditingSlideId}
      slideEditStatus={pptSlideEditStatus}
      onSelectSlide={onSelectSlide}
      onDownload={onDownloadPpt}
      onRegenerate={onRegenerateDeck}
      onSave={onSaveDeck}
      onEditSlide={onAiEditSlide}
    />
  )
}
