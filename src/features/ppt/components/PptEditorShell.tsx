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

const Body = styled.div<{ $hideNavigator?: boolean }>`
  position: relative;
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-columns: ${({ $hideNavigator }) => (
    $hideNavigator ? 'minmax(0, 1fr)' : '168px minmax(0, 1fr)'
  )};
  overflow: hidden;

  @media (max-width: 980px) {
    grid-template-columns: ${({ $hideNavigator }) => (
      $hideNavigator ? 'minmax(0, 1fr)' : '148px minmax(0, 1fr)'
    )};
  }
`

const CenterPane = styled.div`
  position: relative;
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
  floatingOverlay?: React.ReactNode
  downloadLabel?: string
  toolbarExtraActions?: React.ReactNode
  compactMode?: boolean
  hideNavigator?: boolean
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
  floatingOverlay,
  downloadLabel,
  toolbarExtraActions,
  compactMode = false,
  hideNavigator = false,
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
      <Body $hideNavigator={hideNavigator}>
        {!hideNavigator ? (
          <PptSlideNavigator
            slides={slides}
            activeIndex={activeSlideIndex}
            compact={compactMode}
            onSelectSlide={onSelectSlide}
          />
        ) : null}
        <CenterPane>
          {pipelineContent}
          {previewContent}
          {floatingOverlay}
        </CenterPane>
      </Body>
    </Shell>
  )
}

// 保留类型导出，避免其他模块引用断裂
export type { PptTemplateOption }
