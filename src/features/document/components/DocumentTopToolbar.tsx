import { useState } from 'react'
import styled from 'styled-components'
import { ChevronDown, Clock3, Download, FileDown, List, MoreHorizontal, RotateCcw, Save, Upload } from 'lucide-react'

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 14px;
  height: 52px;
  border-bottom: 1px solid #d8e3ef;
  background: rgba(255, 255, 255, 0.97);
  backdrop-filter: blur(8px);
  flex-shrink: 0;
  overflow: hidden;
`

const Spacer = styled.div`flex: 1; min-width: 4px;`

const StatusChip = styled.div<{ $tone?: 'warn' | 'ok' }>`
  padding: 3px 9px;
  border-radius: 999px;
  background: ${({ $tone }) => ($tone === 'warn' ? '#fff6eb' : $tone === 'ok' ? '#f0fdf4' : '#f3f7fb')};
  border: 1px solid ${({ $tone }) => ($tone === 'warn' ? '#f2c48d' : $tone === 'ok' ? '#a3d9b1' : '#d9e3ee')};
  font-size: 11px;
  color: ${({ $tone }) => ($tone === 'warn' ? '#8a4b08' : $tone === 'ok' ? '#15803d' : '#36506b')};
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  flex-shrink: 0;
`

const ToolButton = styled.button`
  height: 34px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid #d4deea;
  background: #fff;
  color: #334e68;
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    background: #f5f8fc;
    border-color: #b8c9d9;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`

const PrimaryButton = styled(ToolButton)`
  border-color: #78a9de;
  background: linear-gradient(180deg, #e8f2fd 0%, #dceefb 100%);
  color: #1d4f80;

  &:hover:not(:disabled) {
    background: linear-gradient(180deg, #d8eafc 0%, #cce2f9 100%);
  }
`

const MoreMenuWrapper = styled.div`
  position: relative;
  flex-shrink: 0;
`

const ExportMenuWrapper = styled(MoreMenuWrapper)``

const MoreMenu = styled.div`
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 168px;
  background: #fff;
  border: 1px solid #d0dce9;
  border-radius: 12px;
  box-shadow: 0 8px 28px rgba(15, 23, 42, 0.12);
  z-index: 300;
  padding: 6px;
  display: grid;
  gap: 2px;
`

const MoreMenuItem = styled.button`
  height: 36px;
  padding: 0 12px;
  text-align: left;
  background: transparent;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  color: #274865;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;

  &:hover:not(:disabled) {
    background: #f0f7ff;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`

export interface DocumentTopToolbarProps {
  engineLabel: string
  templateLabel: string
  knowledgeCount: number
  fallbackReason?: string | null
  dirty?: boolean
  saving?: boolean
  lastSavedAt?: string | null
  exportError?: string | null
  onOpenOutline: () => void
  onOpenTemplate: () => void
  onOpenKnowledge: () => void
  onOpenAcademicWriting?: () => void
  onDownloadDocx: () => void
  onImportDocx?: () => void
  onExportPdf: () => void
  onSave: () => void
  onRegenerate: () => void
  onViewVersions?: () => void
  busy?: boolean
  docxDisabled?: boolean
  pdfDisabled?: boolean
  regenerateDisabled?: boolean
}

export function DocumentTopToolbar({
  engineLabel: _engineLabel,
  templateLabel,
  knowledgeCount,
  fallbackReason: _fallbackReason,
  dirty,
  saving,
  lastSavedAt,
  exportError,
  onOpenOutline,
  onOpenTemplate,
  onOpenKnowledge,
  onOpenAcademicWriting,
  onDownloadDocx,
  onImportDocx,
  onExportPdf,
  onSave,
  onRegenerate,
  onViewVersions,
  busy,
  docxDisabled,
  pdfDisabled,
  regenerateDisabled,
}: DocumentTopToolbarProps) {
  const [moreOpen, setMoreOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)

  return (
    <Toolbar>
      <ToolButton type="button" data-testid="document-save" onClick={onSave} disabled={busy}>
        <Save size={14} />
        保存
      </ToolButton>
      <ExportMenuWrapper>
        <PrimaryButton
          type="button"
          data-testid="document-export-menu"
          onClick={() => setExportOpen((v) => !v)}
          disabled={busy}
        >
          <Download size={14} />
          导出
          <ChevronDown size={12} />
        </PrimaryButton>
        {exportOpen && (
          <MoreMenu>
            <MoreMenuItem
              type="button"
              data-testid="document-download-docx"
              onClick={() => { onDownloadDocx(); setExportOpen(false) }}
              disabled={busy || docxDisabled}
            >
              <Download size={14} />
              导出 DOCX
            </MoreMenuItem>
            <MoreMenuItem
              type="button"
              data-testid="document-export-pdf"
              onClick={() => { onExportPdf(); setExportOpen(false) }}
              disabled={pdfDisabled}
            >
              <FileDown size={14} />
              {pdfDisabled ? '导出 PDF（即将支持）' : '导出 PDF'}
            </MoreMenuItem>
          </MoreMenu>
        )}
      </ExportMenuWrapper>
      <Spacer />
      {saving ? <StatusChip><Clock3 size={11} />保存中</StatusChip> : null}
      {!saving && dirty ? <StatusChip $tone="warn">未保存修改</StatusChip> : null}
      {!dirty && !saving && lastSavedAt ? <StatusChip $tone="ok">已保存</StatusChip> : null}
      {exportError ? <StatusChip $tone="warn">导出失败</StatusChip> : null}
      <MoreMenuWrapper>
        <ToolButton
          type="button"
          data-testid="document-more-menu"
          onClick={() => setMoreOpen((v) => !v)}
        >
          <MoreHorizontal size={15} />
        </ToolButton>
        {moreOpen && (
          <MoreMenu>
            <MoreMenuItem
              type="button"
              data-testid="document-toolbar-outline"
              onClick={() => { onOpenOutline(); setMoreOpen(false) }}
            >
              <List size={14} />
              目录
            </MoreMenuItem>
            <MoreMenuItem
              type="button"
              data-testid="document-toolbar-template"
              onClick={() => { onOpenTemplate(); setMoreOpen(false) }}
            >
              <ChevronDown size={14} />
              模板：{templateLabel}
            </MoreMenuItem>
            <MoreMenuItem
              type="button"
              data-testid="document-toolbar-academic"
              onClick={() => { onOpenAcademicWriting?.(); setMoreOpen(false) }}
            >
              <ChevronDown size={14} />
              学术写作
            </MoreMenuItem>
            <MoreMenuItem
              type="button"
              data-testid="document-toolbar-knowledge"
              onClick={() => { onOpenKnowledge(); setMoreOpen(false) }}
            >
              <ChevronDown size={14} />
              知识库{knowledgeCount > 0 ? ` ${knowledgeCount}` : ''}
            </MoreMenuItem>
            <MoreMenuItem
              type="button"
              data-testid="document-import-docx"
              onClick={() => { onImportDocx?.(); setMoreOpen(false) }}
            >
              <Upload size={14} />
              导入 DOCX
            </MoreMenuItem>
            <MoreMenuItem
              type="button"
              data-testid="document-export-pdf"
              onClick={() => { onExportPdf(); setMoreOpen(false) }}
              disabled={pdfDisabled}
            >
              <FileDown size={14} />
              {pdfDisabled ? '导出 PDF（即将支持）' : '导出 PDF'}
            </MoreMenuItem>
            <MoreMenuItem
              type="button"
              data-testid="document-regenerate"
              onClick={() => { onRegenerate(); setMoreOpen(false) }}
              disabled={busy || regenerateDisabled}
            >
              <RotateCcw size={14} />
              重新生成
            </MoreMenuItem>
            <MoreMenuItem
              type="button"
              data-testid="document-view-versions"
              onClick={() => { onViewVersions?.(); setMoreOpen(false) }}
              disabled
            >
              查看版本
            </MoreMenuItem>
          </MoreMenu>
        )}
      </MoreMenuWrapper>
    </Toolbar>
  )
}
