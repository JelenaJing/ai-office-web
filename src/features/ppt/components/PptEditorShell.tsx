import React from 'react'
import styled from 'styled-components'
import type { PptSlidePreview } from '../../../contexts/GenerationWorkbenchContext'
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

const Body = styled.div`
  position: relative;
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-columns: 168px minmax(0, 1fr);
  overflow: hidden;

  @media (max-width: 980px) {
    grid-template-columns: 148px minmax(0, 1fr);
  }
`

const CenterPane = styled.div`
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

interface PptEditorShellProps {
  title: string
  slides: PptSlidePreview[]
  activeSlideIndex: number
  statusMessage?: string | null
  previewContent?: React.ReactNode
  pipelineContent?: React.ReactNode
  selectionBar?: React.ReactNode
  downloadLabel?: string
  toolbarExtraActions?: React.ReactNode
  compactMode?: boolean
  onSelectSlide: (index: number) => void
  onDownload: () => void
}

export default function PptEditorShell({
  title,
  slides,
  activeSlideIndex,
  statusMessage,
  previewContent,
  pipelineContent,
  selectionBar,
  downloadLabel,
  toolbarExtraActions,
  compactMode = false,
  onSelectSlide,
  onDownload,
}: PptEditorShellProps) {
  return (
    <Shell>
      <PptTopToolbar
        title={title}
        statusMessage={statusMessage}
        downloadLabel={downloadLabel}
        extraActions={toolbarExtraActions}
        onDownload={onDownload}
      />
      <Body>
        <PptSlideNavigator
          slides={slides}
          activeIndex={activeSlideIndex}
          compact={compactMode}
          onSelectSlide={onSelectSlide}
        />
        <CenterPane>
          {pipelineContent}
          {previewContent}
          {selectionBar}
        </CenterPane>
      </Body>
    </Shell>
  )
}

// 保留类型导出，避免其他模块引用断裂
export type { PptTemplateOption }
