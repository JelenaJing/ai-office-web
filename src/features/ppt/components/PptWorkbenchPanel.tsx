import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import type { PptSlidePreview, PptTaskStatus } from '../../../contexts/GenerationWorkbenchContext'
import PptCanvasPreview from './PptCanvasPreview'
import PptEditorShell from './PptEditorShell'
import PptGenerationPipeline, {
  SLIDEV_PIPELINE_STEPS,
  resolveSlidevPipelineStep,
} from './PptGenerationPipeline'
import { resolveWebApiUrl } from '../../../runtime/apiBase'
import {
  fetchProtectedTextResource,
} from '../services/pptWebGeneration'
import {
  postToSlidevPreview,
  subscribeSlidevPreview,
  type SlidevPreviewOutboundMessage,
} from '../services/slidevPreviewBridge'

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

const ToolbarButton = styled.button<{ $tone?: 'primary' | 'warning' | 'muted' }>`
  height: 34px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid ${({ $tone }) => (
    $tone === 'primary' ? '#dbe4ee'
      : $tone === 'warning' ? '#fed7aa'
      : '#cbd5e1'
  )};
  background: ${({ $tone }) => (
    $tone === 'primary' ? '#ffffff'
      : $tone === 'warning' ? '#fff7ed'
      : '#f8fafc'
  )};
  color: ${({ $tone }) => (
    $tone === 'primary' ? '#243b53'
      : $tone === 'warning' ? '#9a3412'
      : '#64748b'
  )};
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`

const PipelineWrap = styled.div`
  padding: 12px 16px 0;
  flex-shrink: 0;
`

const SlidevViewport = styled.div`
  flex: 1;
  min-width: 0;
  min-height: 0;
  background: #525659;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
`

const SlidevFrame = styled.iframe`
  width: min(100%, 1180px);
  height: 100%;
  min-height: 420px;
  border: none;
  border-radius: 4px;
  background: #ffffff;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
`

const SlidevFallbackCard = styled.div`
  width: min(100%, 720px);
  display: grid;
  gap: 14px;
  align-content: start;
`

const SlidevInfoCard = styled.div`
  border: 1px solid #dbe4ee;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.95);
  padding: 16px;
  color: #31485f;
`

const SlidevMarkdownPreview = styled.pre`
  margin: 0;
  border-radius: 12px;
  padding: 16px;
  background: #0f172a;
  color: #dbeafe;
  font-size: 12px;
  line-height: 1.7;
  overflow: auto;
  max-height: 280px;
  white-space: pre-wrap;
  word-break: break-word;
`

const SelectionBar = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px 12px;
  border-top: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.98);
`

const SelectionHint = styled.span`
  flex: 1;
  min-width: 0;
  font-size: 12px;
  color: #475569;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const SelectionInput = styled.input`
  flex: 2;
  min-width: 0;
  height: 36px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid #dbe4ee;
  font-size: 13px;
`

const SelectionButton = styled.button<{ $primary?: boolean }>`
  height: 36px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid ${({ $primary }) => ($primary ? '#2563eb' : '#dbe4ee')};
  background: ${({ $primary }) => ($primary ? '#2563eb' : '#ffffff')};
  color: ${({ $primary }) => ($primary ? '#ffffff' : '#334155')};
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const CanvasStage = styled.div`
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #eef4fb 0%, #e7eef7 100%);
`

const GENERATING_STATUSES: PptTaskStatus[] = [
  'generating_deck',
  'generating_outline',
  'generating_plan',
  'generating_slide',
  'generating_content',
  'building_deck',
  'rendering_preview',
  'rendering_pptx',
  'generating_image',
  'generating_assets',
]

interface PptWorkbenchPanelProps {
  title: string
  taskStatus: PptTaskStatus
  liveSlides: PptSlidePreview[]
  activeSlideIndex: number
  templateStatusMessage?: string | null
  pptDeckId?: string | null
  pptOutputMode?: 'editable_pptx' | 'web_deck'
  pptPreviewUrl?: string
  pptSlidevMarkdown?: string
  pptHtmlArtifactId?: string | null
  generationProgress?: number
  generationMessage?: string | null
  onDownloadPpt: () => void
  onDownloadSlidevHtml?: () => void
  onOpenSlidevPreview?: () => void
  onExportSlidev?: (format: 'pdf' | 'png' | 'pptx') => void
  onSelectSlide: (index: number) => void
  onAiEditSlide: (instruction: string) => Promise<void> | void
}

export default function PptWorkbenchPanel({
  title,
  taskStatus,
  liveSlides,
  activeSlideIndex,
  templateStatusMessage,
  pptDeckId,
  pptOutputMode,
  pptPreviewUrl,
  pptSlidevMarkdown,
  pptHtmlArtifactId,
  generationProgress = 0,
  generationMessage,
  onDownloadPpt,
  onDownloadSlidevHtml,
  onOpenSlidevPreview,
  onExportSlidev,
  onSelectSlide,
  onAiEditSlide,
}: PptWorkbenchPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const [slidevPreviewHtml, setSlidevPreviewHtml] = useState('')
  const [slidevPreviewError, setSlidevPreviewError] = useState<string | null>(null)
  const [slidevPreviewLoading, setSlidevPreviewLoading] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedElement, setSelectedElement] = useState<{
    slideIndex: number
    selector: string
    tagName: string
    textPreview: string
  } | null>(null)
  const [editInstruction, setEditInstruction] = useState('')
  const [editBusy, setEditBusy] = useState(false)

  const isGenerating = GENERATING_STATUSES.includes(taskStatus)
  const isSlidev = pptOutputMode === 'web_deck'
  const isOfficialSlidev = Boolean(pptPreviewUrl?.includes('/slidev-access/'))
  const officialSlidevAppUrl = useMemo(() => (
    isOfficialSlidev && pptPreviewUrl ? resolveWebApiUrl(pptPreviewUrl) : ''
  ), [isOfficialSlidev, pptPreviewUrl])
  const slidevFallbackPreviewUrl = useMemo(() => (
    !isOfficialSlidev
      ? (pptDeckId ? `/api/ppt/decks/${encodeURIComponent(pptDeckId)}/slidev-preview` : '')
      : ''
  ), [isOfficialSlidev, pptDeckId])

  const pipelineStepId = useMemo(
    () => resolveSlidevPipelineStep(generationProgress, generationMessage || templateStatusMessage || ''),
    [generationProgress, generationMessage, templateStatusMessage],
  )

  const loadPreview = useCallback(() => {
    if (!isSlidev || isOfficialSlidev || !slidevFallbackPreviewUrl) {
      setSlidevPreviewHtml('')
      setSlidevPreviewError(null)
      setSlidevPreviewLoading(false)
      return
    }

    let cancelled = false
    setSlidevPreviewLoading(true)
    setSlidevPreviewError(null)

    void fetchProtectedTextResource(slidevFallbackPreviewUrl)
      .then((result) => {
        if (cancelled) return
        if (result.success && result.text && result.contentType.includes('text/html')) {
          setSlidevPreviewHtml(result.text)
          setSlidevPreviewError(null)
          return
        }
        setSlidevPreviewHtml('')
        setSlidevPreviewError(result.error || '预览加载失败')
      })
      .catch((error) => {
        if (cancelled) return
        setSlidevPreviewHtml('')
        setSlidevPreviewError(error instanceof Error ? error.message : '预览加载失败')
      })
      .finally(() => {
        if (!cancelled) setSlidevPreviewLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isSlidev, isOfficialSlidev, slidevFallbackPreviewUrl])

  useEffect(() => loadPreview(), [loadPreview, pptSlidevMarkdown])

  useEffect(() => {
    if (!isOfficialSlidev || !iframeRef.current || !officialSlidevAppUrl) return
    const base = officialSlidevAppUrl.replace(/\/?$/, '')
    iframeRef.current.src = `${base}#/${activeSlideIndex + 1}`
  }, [activeSlideIndex, isOfficialSlidev, officialSlidevAppUrl])

  useEffect(() => {
    if (isOfficialSlidev) return
    return subscribeSlidevPreview((message: SlidevPreviewOutboundMessage) => {
      if (message.type === 'ppt-element-selected') {
        setSelectedElement({
          slideIndex: message.slideIndex,
          selector: message.selector,
          tagName: message.tagName,
          textPreview: message.textPreview,
        })
        if (message.slideIndex !== activeSlideIndex) {
          onSelectSlide(message.slideIndex)
        }
      }
    })
  }, [activeSlideIndex, isOfficialSlidev, onSelectSlide])

  useEffect(() => {
    if (isOfficialSlidev) return
    postToSlidevPreview(iframeRef.current, { type: 'ppt-set-slide', slideIndex: activeSlideIndex })
  }, [activeSlideIndex, isOfficialSlidev, slidevPreviewHtml])

  useEffect(() => {
    if (isOfficialSlidev) return
    postToSlidevPreview(iframeRef.current, { type: 'ppt-selection-mode', enabled: selectionMode })
  }, [isOfficialSlidev, selectionMode, slidevPreviewHtml])

  const handleSelectSlide = (index: number) => {
    onSelectSlide(index)
    if (isOfficialSlidev && iframeRef.current && officialSlidevAppUrl) {
      const base = officialSlidevAppUrl.replace(/\/?$/, '')
      iframeRef.current.src = `${base}#/${index + 1}`
      return
    }
    postToSlidevPreview(iframeRef.current, { type: 'ppt-set-slide', slideIndex: index })
  }

  const handleToggleSelection = () => {
    setSelectionMode((value) => !value)
  }

  const handleApplyEdit = async () => {
    const instruction = editInstruction.trim()
    if (!instruction) return
    const context = selectedElement
      ? `请修改当前页中选中的 ${selectedElement.tagName} 区域（${selectedElement.selector}），原文：${selectedElement.textPreview}。用户要求：${instruction}`
      : instruction
    setEditBusy(true)
    try {
      await onAiEditSlide(context)
      setEditInstruction('')
      void loadPreview()
    } finally {
      setEditBusy(false)
    }
  }

  const handleExportPdf = () => {
    if (!slidevPreviewHtml) {
      onExportSlidev?.('pdf')
      return
    }
    const blob = new Blob([slidevPreviewHtml], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const opened = window.open(url, '_blank', 'noopener,noreferrer')
    if (!opened) {
      URL.revokeObjectURL(url)
      window.alert('浏览器拦截了打印窗口，请允许弹窗后重试。')
      return
    }
    opened.addEventListener('load', () => {
      opened.focus()
      opened.print()
    })
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  if (taskStatus !== 'completed' && liveSlides.length === 0 && !isGenerating) {
    return (
      <EmptyShell>
        <EmptyCard>
          <EmptyTitle>{taskStatus === 'failed' ? 'PPT 生成失败' : '输入需求，开始生成 PPT'}</EmptyTitle>
          <EmptyText>
            {templateStatusMessage || '在底部输入你想做的演示内容，生成过程会在这里实时展示。'}
          </EmptyText>
        </EmptyCard>
      </EmptyShell>
    )
  }

  const slidevToolbarActions = isSlidev ? (
    <>
      <ToolbarButton type="button" onClick={onDownloadSlidevHtml} disabled={!officialSlidevAppUrl && !slidevFallbackPreviewUrl} $tone="primary">
        下载 HTML
      </ToolbarButton>
      <ToolbarButton type="button" onClick={onOpenSlidevPreview} disabled={!officialSlidevAppUrl && !slidevFallbackPreviewUrl} $tone="primary">
        全屏预览
      </ToolbarButton>
      <ToolbarButton type="button" onClick={handleExportPdf} disabled={!officialSlidevAppUrl && !slidevPreviewHtml} $tone="primary">
        导出 PDF
      </ToolbarButton>
    </>
  ) : undefined

  const pipelineContent = isSlidev && isGenerating ? (
    <PipelineWrap>
      <PptGenerationPipeline
        steps={SLIDEV_PIPELINE_STEPS}
        activeStepId={pipelineStepId}
        progress={generationProgress}
        detailMessage={generationMessage || templateStatusMessage}
      />
    </PipelineWrap>
  ) : null

  const activeSlide = liveSlides[activeSlideIndex] ?? null

  const canvasPreviewContent = !isSlidev && liveSlides.length > 0 ? (
    <CanvasStage>
      <PptCanvasPreview slide={activeSlide} pageNumber={activeSlideIndex + 1} />
    </CanvasStage>
  ) : null

  const slidevPreviewContent = isSlidev ? (
    <SlidevViewport data-testid="ppt-slidev-preview-shell">
      {isOfficialSlidev && officialSlidevAppUrl ? (
        <SlidevFrame
          ref={iframeRef}
          src={officialSlidevAppUrl}
          title={`Slidev 官方预览：${title}`}
          sandbox="allow-scripts allow-same-origin allow-popups"
        />
      ) : slidevPreviewHtml ? (
        <SlidevFrame
          ref={iframeRef}
          srcDoc={slidevPreviewHtml}
          title={`Slidev 预览：${title}`}
          sandbox="allow-scripts allow-same-origin"
        />
      ) : (
        <SlidevFallbackCard>
          <SlidevInfoCard>
            {slidevPreviewLoading
              ? '正在加载幻灯片预览…'
              : slidevPreviewError || (isGenerating ? '正在构建官方 Slidev 预览…' : '等待生成预览…')}
          </SlidevInfoCard>
          {pptSlidevMarkdown && !slidevPreviewLoading ? (
            <SlidevMarkdownPreview>{pptSlidevMarkdown}</SlidevMarkdownPreview>
          ) : null}
        </SlidevFallbackCard>
      )}
    </SlidevViewport>
  ) : null

  const selectionBar = isSlidev && !isOfficialSlidev && (taskStatus === 'completed' || liveSlides.length > 0) ? (
    <SelectionBar data-testid="ppt-selection-bar">
      <SelectionButton type="button" onClick={handleToggleSelection} $primary={selectionMode}>
        {selectionMode ? '退出选区' : '选区编辑'}
      </SelectionButton>
      <SelectionHint>
        {selectedElement
          ? `已选 ${selectedElement.tagName}：${selectedElement.textPreview.slice(0, 48)}`
          : selectionMode
            ? '点击幻灯片中的文字或区块进行选中'
            : '开启选区后，可点选页面元素并用 AI 修改'}
      </SelectionHint>
      <SelectionInput
        value={editInstruction}
        onChange={(event) => setEditInstruction(event.target.value)}
        placeholder="描述要如何修改当前页或选中区域…"
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            void handleApplyEdit()
          }
        }}
      />
      <SelectionButton type="button" $primary onClick={() => void handleApplyEdit()} disabled={editBusy || !editInstruction.trim()}>
        {editBusy ? '应用中…' : 'AI 修改'}
      </SelectionButton>
    </SelectionBar>
  ) : null

  return (
    <PptEditorShell
      title={title}
      slides={liveSlides}
      activeSlideIndex={activeSlideIndex}
      statusMessage={
        isOfficialSlidev
          ? '官方 Slidev 预览'
          : (isGenerating ? (generationMessage || templateStatusMessage) : templateStatusMessage)
      }
      previewContent={slidevPreviewContent || canvasPreviewContent}
      pipelineContent={pipelineContent}
      selectionBar={selectionBar}
      downloadLabel={isSlidev ? '下载 Markdown' : '下载 PPTX'}
      toolbarExtraActions={slidevToolbarActions}
      compactMode={isSlidev}
      onSelectSlide={handleSelectSlide}
      onDownload={onDownloadPpt}
    />
  )
}
