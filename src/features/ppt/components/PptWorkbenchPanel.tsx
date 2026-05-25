import React from 'react'
import styled from 'styled-components'
import type { PptAiMessage, PptSlidePreview, PptTaskStatus } from '../../../contexts/GenerationWorkbenchContext'
import PptAiEditPanel from './PptAiEditPanel'
import PptEditorShell from './PptEditorShell'
import PptSlideNavigator from './PptSlideNavigator'
import type { PptTemplateOption } from '../services/pptTemplates'

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
  pptEditEngineLabel: string
  templateLabel: string
  templateId: string | null
  templateOptions: PptTemplateOption[]
  pptDirty: boolean
  pptEditMessages: Record<string, PptAiMessage[]>
  pptEditingSlideId: string | null
  pptSlideEditStatus: 'idle' | 'editing' | 'applying' | 'error'
  templateBusy?: boolean
  pptOutputMode?: 'editable_pptx' | 'web_deck'
  pptPreviewUrl?: string
  pptDownloadUrl?: string | null
  pptSlidevMarkdown?: string
  onDownloadPpt: () => void
  onExportSlidev?: (format: 'pdf' | 'png' | 'pptx') => void
  onTemplateChange: (templateId: string) => void
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
  pptEditEngineLabel,
  templateLabel,
  templateId,
  templateOptions,
  pptDirty,
  pptEditMessages,
  pptEditingSlideId,
  pptSlideEditStatus,
  templateBusy,
  pptOutputMode,
  pptPreviewUrl,
  pptDownloadUrl,
  pptSlidevMarkdown,
  onDownloadPpt,
  onExportSlidev,
  onTemplateChange,
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

  const activeSlide = liveSlides[activeSlideIndex] ?? null
  const activeMessages = activeSlide?.id ? pptEditMessages[activeSlide.id] || [] : []

  if (pptOutputMode === 'web_deck' && pptPreviewUrl) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', minHeight: 0, background: '#f5f7fa' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', background: '#fff', borderBottom: '1px solid #e4e9f0', fontSize: 13, color: '#2d3a4a' }}>
          <span style={{ fontWeight: 600 }}>{title}</span>
          <span style={{ marginLeft: 4, padding: '2px 8px', borderRadius: 4, background: '#e8f0fe', color: '#3367d6', fontSize: 12 }}>当前模式：网页演示 Slidev</span>
          <span style={{ flex: 1 }} />
          <button
            type="button"
            onClick={onDownloadPpt}
            disabled={!pptDownloadUrl}
            style={{ padding: '4px 12px', borderRadius: 4, background: '#0f766e', color: '#fff', fontSize: 13, border: 'none', cursor: pptDownloadUrl ? 'pointer' : 'not-allowed', opacity: pptDownloadUrl ? 1 : 0.55 }}
          >
            下载 Markdown
          </button>
          <a
            href={pptPreviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '4px 12px', borderRadius: 4, background: '#3367d6', color: '#fff', fontSize: 13, textDecoration: 'none', cursor: 'pointer' }}
          >
            全屏预览
          </a>
          <a
            href={pptPreviewUrl}
            download
            style={{ padding: '4px 12px', borderRadius: 4, background: '#fff', color: '#3367d6', fontSize: 13, textDecoration: 'none', border: '1px solid #3367d6', cursor: 'pointer' }}
          >
            下载 HTML
          </a>
          <button
            type="button"
            disabled
            title="Slidev CLI export 未启用，请设置 SLIDEV_CLI_ENABLED=1 并安装 @slidev/cli 与 playwright-chromium。"
            style={{ padding: '4px 12px', borderRadius: 4, background: '#f1f5f9', color: '#64748b', fontSize: 13, border: '1px solid #cbd5e1', cursor: 'not-allowed' }}
          >
            导出 PDF
          </button>
          <button
            type="button"
            onClick={() => {
              window.alert('Slidev PPTX 为图片型 PPTX，文字不可直接编辑，不作为正式可编辑 PPTX 主方案。')
              onExportSlidev?.('pptx')
            }}
            style={{ padding: '4px 12px', borderRadius: 4, background: '#fff7ed', color: '#9a3412', fontSize: 13, border: '1px solid #fed7aa', cursor: 'pointer' }}
          >
            导出 PPTX（图片型）
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '220px minmax(0, 1fr) 360px', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <PptSlideNavigator
            slides={liveSlides}
            activeIndex={activeSlideIndex}
            editingSlideId={pptEditingSlideId}
            slideEditStatus={pptSlideEditStatus}
            onSelectSlide={onSelectSlide}
          />
          <iframe
            src={pptPreviewUrl}
            title={`Slidev 预览：${title}`}
            style={{ flex: 1, border: 'none', background: '#fff' }}
            sandbox=""
          />
          <div style={{ minWidth: 0, borderLeft: '1px solid #e4e9f0', background: '#fff', display: 'grid', gridTemplateRows: 'minmax(0, 1fr) auto' }}>
            <PptAiEditPanel
              slide={activeSlide}
              pageNumber={activeSlideIndex + 1}
              engineLabel="当前页修改引擎：Slidev"
              messages={activeMessages}
              status={pptSlideEditStatus}
              onSend={onAiEditSlide}
            />
            <div style={{ borderTop: '1px solid #e4e9f0', padding: 10 }}>
              {pptSlidevMarkdown && (
                <pre style={{ margin: 0, fontSize: 11, color: '#627385', background: '#f5f7fa', borderRadius: 6, padding: 10, overflow: 'auto', maxHeight: 160, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {pptSlidevMarkdown.slice(0, 2000)}{pptSlidevMarkdown.length > 2000 ? '\n…（已截断）' : ''}
                </pre>
              )}
            </div>
          </div>
        </div>
        <div style={{ padding: '6px 16px', background: '#fff', borderTop: '1px solid #e4e9f0', fontSize: 12, color: '#627385', display: 'flex', gap: 8 }}>
          <span>{pptEngineLabel}</span>
          <span>·</span>
          <span>Slidev PPTX 为图片型 PPTX，文字不可直接编辑；如需正式可编辑 PPTX，请切换到"正式 PPTX"模式。</span>
        </div>
      </div>
    )
  }

  return (
    <PptEditorShell
      title={title}
      slides={liveSlides}
      activeSlideIndex={activeSlideIndex}
      engineLabel={pptEngineLabel}
      slideEditEngineLabel={pptEditEngineLabel}
      templateLabel={templateLabel}
      templateId={templateId}
      templateOptions={templateOptions}
      statusMessage={templateStatusMessage}
      dirty={pptDirty}
      messages={pptEditMessages}
      editingSlideId={pptEditingSlideId}
      slideEditStatus={pptSlideEditStatus}
      templateBusy={templateBusy}
      onSelectSlide={onSelectSlide}
      onDownload={onDownloadPpt}
      onTemplateChange={onTemplateChange}
      onRegenerate={onRegenerateDeck}
      onSave={onSaveDeck}
      onEditSlide={onAiEditSlide}
    />
  )
}
