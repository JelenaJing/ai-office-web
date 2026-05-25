import React, { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'
import styled from 'styled-components'
import type { PptSlidePreview, PptTaskStatus } from '../../../contexts/GenerationWorkbenchContext'
import { parseSlidevMarkdownToPreviews } from '../services/webDeckSlides'
import PptEditorShell from './PptEditorShell'
import PptFloatingEditPanel from './PptFloatingEditPanel'
import { resolveWebApiUrl } from '../../../runtime/apiBase'
import {
  fetchProtectedTextResource,
  rebuildSlidevPreview,
} from '../services/pptWebGeneration'

const MoreMenuWrap = styled.div`
  position: relative;
`

const MoreMenuPanel = styled.div`
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 168px;
  padding: 6px;
  border-radius: 10px;
  border: 1px solid #dbe4ee;
  background: #ffffff;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.12);
  z-index: 20;
  display: grid;
  gap: 4px;
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

const SlidevViewport = styled.div`
  position: relative;
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

const PreviewStatusOverlay = styled.div`
  position: absolute;
  left: 16px;
  right: 16px;
  top: 16px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  pointer-events: none;
`

const PreviewStatusLine = styled.div`
  max-width: min(720px, 100%);
  padding: 8px 14px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.72);
  color: #e2e8f0;
  font-size: 13px;
  line-height: 1.5;
  text-align: center;
  backdrop-filter: blur(8px);
`

const PreviewProgressTrack = styled.div`
  width: min(320px, 70%);
  height: 3px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  overflow: hidden;
`

const PreviewProgressFill = styled.div<{ $value: number }>`
  height: 100%;
  width: ${({ $value }) => `${Math.max(0, Math.min(100, $value))}%`};
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
  transition: width 0.35s ease;
`

const SlidevEditFab = styled.button<{ $visible: boolean }>`
  position: absolute;
  right: 24px;
  bottom: 88px;
  z-index: 4;
  display: ${({ $visible }) => ($visible ? 'inline-flex' : 'none')};
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 999px;
  border: none;
  background: #2563eb;
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.45);
  pointer-events: auto;

  &:hover {
    background: #1d4ed8;
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`

const SlidevFrame = styled.iframe`
  width: min(100%, 1180px);
  height: 100%;
  min-height: 420px;
  border: none;
  border-radius: 4px;
  background: #ffffff;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
  color-scheme: normal;
`

const PreviewStateCard = styled.div`
  width: min(480px, calc(100% - 32px));
  padding: 28px 24px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.96);
  text-align: center;
  display: grid;
  gap: 8px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
`

const PreviewStateTitle = styled.div`
  font-size: 15px;
  font-weight: 800;
  color: #1e3a5f;
`

const PreviewStateText = styled.div`
  font-size: 13px;
  line-height: 1.7;
  color: #64748b;
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

function toUserPreviewMessage(message: string | null | undefined): string {
  const text = String(message || '').trim()
  if (!text) return ''
  if (/deckdocument/i.test(text)) {
    return '演示文稿预览暂时不可用，请稍候或重新生成'
  }
  return text
}

interface PptWorkbenchPanelProps {
  title: string
  taskStatus: PptTaskStatus
  liveSlides: PptSlidePreview[]
  activeSlideIndex: number
  templateStatusMessage?: string | null
  pptDeckId?: string | null
  pptOutputMode?: 'editable_pptx' | 'web_deck'
  pptEngine?: 'builtin' | 'minimax_pptx_generator' | 'slidev' | null
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
  onGeneratePpt?: (prompt: string) => Promise<void> | void
  onNewPpt?: () => void
  onRegeneratePreview?: () => Promise<void> | void
  onPreviewUrlChange?: (previewUrl: string) => void
}

export default function PptWorkbenchPanel({
  title,
  taskStatus,
  liveSlides,
  activeSlideIndex,
  templateStatusMessage,
  pptDeckId,
  pptOutputMode,
  pptEngine,
  pptPreviewUrl,
  pptSlidevMarkdown,
  generationProgress = 0,
  generationMessage,
  onDownloadPpt,
  onDownloadSlidevHtml,
  onOpenSlidevPreview,
  onExportSlidev,
  onSelectSlide,
  onAiEditSlide,
  onGeneratePpt,
  onNewPpt,
  onRegeneratePreview,
  onPreviewUrlChange,
}: PptWorkbenchPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const rebuildAttemptedRef = useRef(false)
  const [resolvedPreviewUrl, setResolvedPreviewUrl] = useState(pptPreviewUrl || '')
  const [officialPreviewReady, setOfficialPreviewReady] = useState<boolean | null>(null)
  const [fallbackPreviewReady, setFallbackPreviewReady] = useState(false)
  const [slidevPreviewError, setSlidevPreviewError] = useState<string | null>(null)
  const [slidevPreviewLoading, setSlidevPreviewLoading] = useState(false)
  const selectedElement: {
    slideIndex: number
    tagName: string
    textPreview: string
  } | null = null
  const [promptValue, setPromptValue] = useState('')
  const [actionBusy, setActionBusy] = useState(false)
  const [editFabVisible, setEditFabVisible] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const moreMenuRef = useRef<HTMLDivElement | null>(null)
  const floatingInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!moreMenuOpen) return
    const close = (event: MouseEvent) => {
      if (moreMenuRef.current?.contains(event.target as Node)) return
      setMoreMenuOpen(false)
    }
    window.addEventListener('mousedown', close)
    return () => window.removeEventListener('mousedown', close)
  }, [moreMenuOpen])

  const isGenerating = GENERATING_STATUSES.includes(taskStatus)
  const isSlidevWeb = Boolean(onGeneratePpt)
  const isSlidev = isSlidevWeb || pptOutputMode === 'web_deck' || pptEngine === 'slidev' || Boolean(pptSlidevMarkdown?.trim())
  const navigatorSlides = useMemo(() => {
    if (liveSlides.length > 0) return liveSlides
    if (isSlidev && pptSlidevMarkdown?.trim()) {
      return parseSlidevMarkdownToPreviews(pptSlidevMarkdown, title)
    }
    return liveSlides
  }, [isSlidev, liveSlides, pptSlidevMarkdown, title])
  const hasDeckContent = navigatorSlides.length > 0 || Boolean(pptDeckId) || Boolean(pptSlidevMarkdown?.trim())
  const floatingMode = hasDeckContent && !isGenerating ? 'edit' : 'generate'
  const showFloatingPanel = isSlidev && (floatingMode === 'generate' ? isSlidevWeb : hasDeckContent)
  const centerFloatingInput = floatingMode === 'generate' && !hasDeckContent && !isGenerating

  useEffect(() => {
    setResolvedPreviewUrl(pptPreviewUrl || '')
    rebuildAttemptedRef.current = false
    setOfficialPreviewReady(null)
  }, [pptPreviewUrl, pptDeckId])

  const isOfficialSlidev = Boolean(resolvedPreviewUrl.includes('/slidev-access/'))
  const officialSlidevAppUrl = useMemo(() => (
    isOfficialSlidev ? resolveWebApiUrl(resolvedPreviewUrl) : ''
  ), [isOfficialSlidev, resolvedPreviewUrl])

  const slidevFallbackPreviewUrl = useMemo(() => (
    pptDeckId ? `/api/ppt/decks/${encodeURIComponent(pptDeckId)}/slidev-preview` : ''
  ), [pptDeckId])

  const useOfficialIframe = isOfficialSlidev && officialPreviewReady !== false
  const useFallbackPreview = isSlidev && !useOfficialIframe && Boolean(slidevFallbackPreviewUrl)

  const previewStatusLine = useMemo(() => {
    if (isGenerating) {
      const message = toUserPreviewMessage(generationMessage || templateStatusMessage) || '正在生成幻灯片预览'
      const progress = generationProgress > 0 ? ` · ${Math.round(generationProgress)}%` : ''
      return `${message}${progress}`
    }
    if (slidevPreviewLoading) return '正在加载幻灯片预览…'
    if (slidevPreviewError) return toUserPreviewMessage(slidevPreviewError)
    if (isOfficialSlidev && officialPreviewReady === false) {
      return '官方 Slidev 预览不可用，正在尝试 HTML 预览…'
    }
    if (!hasDeckContent) return '在下方输入一句话开始生成 Slidev 演示'
    if (!fallbackPreviewReady && !useOfficialIframe) return '正在准备幻灯片预览…'
    return ''
  }, [
    generationMessage,
    generationProgress,
    hasDeckContent,
    isGenerating,
    isOfficialSlidev,
    officialPreviewReady,
    slidevPreviewError,
    fallbackPreviewReady,
    slidevPreviewLoading,
    templateStatusMessage,
    useOfficialIframe,
  ])

  const showPreviewStatusOverlay = Boolean(previewStatusLine) && (isGenerating || (!fallbackPreviewReady && !useOfficialIframe) || slidevPreviewLoading || slidevPreviewError)
  const fallbackFrameUrl = useMemo(() => (
    slidevFallbackPreviewUrl ? `${resolveWebApiUrl(slidevFallbackPreviewUrl)}#slide-${activeSlideIndex + 1}` : ''
  ), [activeSlideIndex, slidevFallbackPreviewUrl])

  const tryRebuildPreview = useCallback(async () => {
    if (!pptDeckId || !pptSlidevMarkdown?.trim() || rebuildAttemptedRef.current) return false
    rebuildAttemptedRef.current = true
    const rebuilt = await rebuildSlidevPreview({
      deckId: pptDeckId,
      title,
      slidevMarkdown: pptSlidevMarkdown,
    })
    if (!rebuilt.success || !rebuilt.previewUrl) return false
    setResolvedPreviewUrl(rebuilt.previewUrl)
    onPreviewUrlChange?.(rebuilt.previewUrl)
    return true
  }, [onPreviewUrlChange, pptDeckId, pptSlidevMarkdown, title])

  useEffect(() => {
    if (!isOfficialSlidev || !officialSlidevAppUrl) {
      setOfficialPreviewReady(null)
      return
    }
    let cancelled = false
    setSlidevPreviewLoading(true)
    void fetch(officialSlidevAppUrl, { credentials: 'include' })
      .then(async (response) => {
        if (cancelled) return
        const contentType = (response.headers.get('content-type') || '').toLowerCase()
        if (contentType.includes('application/json')) {
          setOfficialPreviewReady(false)
          return
        }
        const text = await response.text().catch(() => '')
        if (text.trim().startsWith('{') && text.includes('"success"')) {
          setOfficialPreviewReady(false)
          return
        }
        if (!response.ok) {
          setOfficialPreviewReady(false)
          return
        }
        setOfficialPreviewReady(true)
      })
      .catch(() => {
        if (!cancelled) setOfficialPreviewReady(false)
      })
      .finally(() => {
        if (!cancelled) setSlidevPreviewLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isOfficialSlidev, officialSlidevAppUrl])

  const loadFallbackPreview = useCallback(() => {
    if (!useFallbackPreview || !slidevFallbackPreviewUrl) {
      setFallbackPreviewReady(false)
      if (!useFallbackPreview) {
        setSlidevPreviewError(null)
        setSlidevPreviewLoading(false)
      }
      return
    }

    let cancelled = false
    setSlidevPreviewLoading(true)
    setSlidevPreviewError(null)

    void fetchProtectedTextResource(slidevFallbackPreviewUrl)
      .then(async (result) => {
        if (cancelled) return
        if (result.success && result.text && result.contentType.includes('text/html')) {
          setFallbackPreviewReady(true)
          setSlidevPreviewError(null)
          return
        }
        const recovered = await tryRebuildPreview()
        if (cancelled) return
        if (recovered) {
          setSlidevPreviewError(null)
          return
        }
        setFallbackPreviewReady(false)
        setSlidevPreviewError(toUserPreviewMessage(result.error) || '预览加载失败')
      })
      .catch(async (error) => {
        if (cancelled) return
        const recovered = await tryRebuildPreview()
        if (cancelled) return
        if (recovered) return
        setFallbackPreviewReady(false)
        setSlidevPreviewError(error instanceof Error ? error.message : '预览加载失败')
      })
      .finally(() => {
        if (!cancelled) setSlidevPreviewLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [slidevFallbackPreviewUrl, tryRebuildPreview, useFallbackPreview])

  useEffect(() => {
    if (!isSlidev) return
    if (useOfficialIframe) {
      setFallbackPreviewReady(false)
      setSlidevPreviewError(null)
      return
    }
    if (isOfficialSlidev && officialPreviewReady === null) return
    if (isOfficialSlidev && officialPreviewReady === false && pptSlidevMarkdown?.trim()) {
      void tryRebuildPreview()
    }
    return loadFallbackPreview()
  }, [
    isSlidev,
    isOfficialSlidev,
    loadFallbackPreview,
    officialPreviewReady,
    pptSlidevMarkdown,
    resolvedPreviewUrl,
    tryRebuildPreview,
    useOfficialIframe,
  ])

  useEffect(() => {
    if (!useOfficialIframe || !iframeRef.current || !officialSlidevAppUrl) return
    const base = officialSlidevAppUrl.replace(/\/?$/, '')
    iframeRef.current.src = `${base}#/${activeSlideIndex + 1}`
  }, [activeSlideIndex, officialSlidevAppUrl, useOfficialIframe])

  const handleSelectSlide = (index: number) => {
    onSelectSlide(index)
    if (useOfficialIframe && iframeRef.current && officialSlidevAppUrl) {
      const base = officialSlidevAppUrl.replace(/\/?$/, '')
      iframeRef.current.src = `${base}#/${index + 1}`
      return
    }
    if (iframeRef.current && fallbackFrameUrl) {
      iframeRef.current.src = `${resolveWebApiUrl(slidevFallbackPreviewUrl)}#slide-${index + 1}`
    }
  }

  const handleFloatingApply = async () => {
    const text = promptValue.trim()
    if (!text) return
    setActionBusy(true)
    try {
      if (floatingMode === 'generate') {
        await onGeneratePpt?.(text)
        setPromptValue('')
        return
      }
      const context = selectedElement
        ? `请修改当前页中选中的 ${selectedElement.tagName} 区域，原文：${selectedElement.textPreview}。用户要求：${text}`
        : text
      await onAiEditSlide(context)
      setPromptValue('')
      rebuildAttemptedRef.current = false
      if (!useOfficialIframe) {
        loadFallbackPreview()
      }
    } finally {
      setActionBusy(false)
    }
  }

  const handleExportPdf = () => {
    onExportSlidev?.('pdf')
  }

  const canExportPreview = Boolean(useOfficialIframe || fallbackPreviewReady || pptDeckId)
  const closeMoreMenu = () => setMoreMenuOpen(false)
  const runMoreAction = (handler?: () => void) => (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    closeMoreMenu()
    handler?.()
  }
  const slidevToolbarActions = isSlidev ? (
    <>
      {onNewPpt ? (
        <ToolbarButton type="button" onClick={onNewPpt} $tone="muted">
          新建 PPT
        </ToolbarButton>
      ) : null}
      <MoreMenuWrap ref={moreMenuRef}>
        <ToolbarButton type="button" onClick={() => setMoreMenuOpen((value) => !value)} $tone="muted">
          更多
        </ToolbarButton>
        {moreMenuOpen ? (
          <MoreMenuPanel>
            {slidevPreviewError && onRegeneratePreview ? (
              <ToolbarButton type="button" onClick={runMoreAction(() => void onRegeneratePreview())} $tone="warning">
                重新生成预览
              </ToolbarButton>
            ) : null}
            <ToolbarButton type="button" onClick={runMoreAction(onDownloadSlidevHtml)} disabled={!canExportPreview}>
              下载 HTML
            </ToolbarButton>
            <ToolbarButton type="button" onClick={runMoreAction(onOpenSlidevPreview)} disabled={!canExportPreview}>
              全屏预览
            </ToolbarButton>
            <ToolbarButton type="button" onClick={runMoreAction(handleExportPdf)} disabled={!canExportPreview}>
              导出 PDF
            </ToolbarButton>
          </MoreMenuPanel>
        ) : null}
      </MoreMenuWrap>
    </>
  ) : undefined

  const handleEditCurrentSlide = () => {
    const page = activeSlideIndex + 1
    setPromptValue((current) => (
      current.trim()
        ? current
        : `请修改第 ${page} 页：`
    ))
    window.setTimeout(() => floatingInputRef.current?.focus(), 0)
  }

  const slidevPreviewContent = isSlidev ? (
    <SlidevViewport
      data-testid="ppt-slidev-preview-shell"
      onMouseEnter={() => {
        if (floatingMode === 'edit' && hasDeckContent) setEditFabVisible(true)
      }}
      onMouseLeave={() => setEditFabVisible(false)}
    >
      {useOfficialIframe && officialSlidevAppUrl ? (
        <SlidevFrame
          ref={iframeRef}
          src={officialSlidevAppUrl}
          title={`Slidev 预览：${title}`}
        />
      ) : fallbackPreviewReady ? (
        <SlidevFrame
          ref={iframeRef}
          src={fallbackFrameUrl}
          title={`Slidev 预览：${title}`}
        />
      ) : !isGenerating && slidevPreviewError && !centerFloatingInput ? (
        <PreviewStateCard>
          <PreviewStateTitle>预览不可用</PreviewStateTitle>
          <PreviewStateText>{toUserPreviewMessage(slidevPreviewError)}</PreviewStateText>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 4 }}>
            {onRegeneratePreview ? (
              <ToolbarButton type="button" onClick={() => void onRegeneratePreview()} $tone="primary">
                重新生成预览
              </ToolbarButton>
            ) : null}
            {onNewPpt ? (
              <ToolbarButton type="button" onClick={onNewPpt} $tone="muted">
                新建 PPT
              </ToolbarButton>
            ) : null}
          </div>
        </PreviewStateCard>
      ) : null}
      {showPreviewStatusOverlay ? (
        <PreviewStatusOverlay>
          <PreviewStatusLine>{previewStatusLine}</PreviewStatusLine>
          {isGenerating ? (
            <PreviewProgressTrack>
              <PreviewProgressFill $value={generationProgress} />
            </PreviewProgressTrack>
          ) : null}
        </PreviewStatusOverlay>
      ) : null}
      <SlidevEditFab
        type="button"
        $visible={editFabVisible && floatingMode === 'edit'}
        disabled={actionBusy || isGenerating}
        onClick={handleEditCurrentSlide}
        data-testid="ppt-slidev-edit-fab"
      >
        编辑本页
      </SlidevEditFab>
    </SlidevViewport>
  ) : null

  const floatingOverlay = showFloatingPanel ? (
    <PptFloatingEditPanel
      visible
      mode={floatingMode}
      centered={centerFloatingInput}
      selectedLabel={
        floatingMode === 'edit'
          ? `第 ${activeSlideIndex + 1} 页`
          : (selectedElement ? `${selectedElement.tagName}：${selectedElement.textPreview.slice(0, 40)}` : null)
      }
      value={promptValue}
      busy={actionBusy || isGenerating}
      onChange={setPromptValue}
      onApply={() => void handleFloatingApply()}
      inputRef={floatingInputRef}
    />
  ) : null

  return (
    <PptEditorShell
      title={title}
      slides={navigatorSlides}
      activeSlideIndex={activeSlideIndex}
      statusMessage={
        useOfficialIframe
          ? 'Slidev 官方预览'
          : fallbackPreviewReady
            ? 'Slidev HTML 预览'
            : (isGenerating ? (generationMessage || templateStatusMessage) : 'Slidev 网页演示')
      }
      previewContent={isSlidev ? slidevPreviewContent : null}
      floatingOverlay={floatingOverlay}
      downloadLabel={isSlidev ? '下载 Markdown' : '下载 PPTX'}
      toolbarExtraActions={slidevToolbarActions}
      compactMode={isSlidev}
      hideNavigator={centerFloatingInput}
      onSelectSlide={handleSelectSlide}
      onDownload={onDownloadPpt}
    />
  )
}
