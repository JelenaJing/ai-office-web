import React from 'react'
import styled from 'styled-components'
import type { PptAiMessage, PptSlidePreview, PptTaskStatus } from '../../../contexts/GenerationWorkbenchContext'
import PptEditorShell from './PptEditorShell'
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
  pptSlidevMarkdown?: string
  onDownloadPpt: () => void
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
  pptSlidevMarkdown,
  onDownloadPpt,
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

  // Slidev web_deck: show HTML preview iframe + download buttons
  if (pptOutputMode === 'web_deck' && pptPreviewUrl) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', minHeight: 0, background: '#f5f7fa' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', background: '#fff', borderBottom: '1px solid #e4e9f0', fontSize: 13, color: '#2d3a4a' }}>
          <span style={{ fontWeight: 600 }}>{title}</span>
          <span style={{ marginLeft: 4, padding: '2px 8px', borderRadius: 4, background: '#e8f0fe', color: '#3367d6', fontSize: 12 }}>Slidev 网页演示</span>
          <span style={{ flex: 1 }} />
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
        </div>
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <iframe
            src={pptPreviewUrl}
            title={`Slidev 预览：${title}`}
            style={{ flex: 1, border: 'none', background: '#fff' }}
            sandbox="allow-same-origin allow-scripts"
          />
          {/* Right: AI edit panel */}
          <div style={{ width: 320, flexShrink: 0, borderLeft: '1px solid #e4e9f0', background: '#fff', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e4e9f0', fontWeight: 600, fontSize: 14, color: '#2d3a4a' }}>AI 页面修改</div>
            <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
              {pptSlidevMarkdown && (
                <pre style={{ fontSize: 11, color: '#627385', background: '#f5f7fa', borderRadius: 6, padding: 10, overflow: 'auto', maxHeight: 320, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {pptSlidevMarkdown.slice(0, 2000)}{pptSlidevMarkdown.length > 2000 ? '\n…（已截断）' : ''}
                </pre>
              )}
            </div>
            <div style={{ padding: 12, borderTop: '1px solid #e4e9f0', fontSize: 12, color: '#627385' }}>
              <p style={{ margin: '0 0 8px' }}>Slidev 网页演示支持按页 AI 修改。在左侧选择页面后输入指令。</p>
              <button
                style={{ padding: '6px 14px', borderRadius: 4, background: '#3367d6', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13 }}
                onClick={() => {
                  const instruction = window.prompt('输入修改指令（将修改当前选中页）：')
                  if (instruction?.trim()) void onAiEditSlide(instruction.trim())
                }}
              >
                修改当前页
              </button>
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
