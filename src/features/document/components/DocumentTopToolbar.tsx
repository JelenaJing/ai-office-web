import { useState } from 'react'
import styled from 'styled-components'
import { FileDown, MoreHorizontal, RotateCcw, Save, Upload } from 'lucide-react'

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  height: 56px;
  border-bottom: 1px solid #d8e3ef;
  background: rgba(255, 255, 255, 0.97);
  backdrop-filter: blur(8px);
  flex-shrink: 0;
  overflow: hidden;
`

const Spacer = styled.div`
  flex: 1;
  min-width: 8px;
`

const ToolButton = styled.button<{ $primary?: boolean }>`
  height: 36px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid ${({ $primary }) => ($primary ? '#78a9de' : '#d4deea')};
  background: ${({ $primary }) => ($primary ? 'linear-gradient(180deg, #e8f2fd 0%, #dceefb 100%)' : '#fff')};
  color: ${({ $primary }) => ($primary ? '#1d4f80' : '#334e68')};
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    background: ${({ $primary }) => ($primary ? 'linear-gradient(180deg, #d8eafc 0%, #cce2f9 100%)' : '#f5f8fc')};
    border-color: #b8c9d9;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`

const MoreMenuWrapper = styled.div`
  position: relative;
  flex-shrink: 0;
`

const MoreMenu = styled.div`
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 188px;
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
  min-height: 36px;
  padding: 8px 12px;
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
  templateLabel: _templateLabel,
  knowledgeCount: _knowledgeCount,
  fallbackReason: _fallbackReason,
  dirty: _dirty,
  saving: _saving,
  lastSavedAt: _lastSavedAt,
  exportError: _exportError,
  onOpenOutline: _onOpenOutline,
  onOpenTemplate: _onOpenTemplate,
  onOpenKnowledge: _onOpenKnowledge,
  onOpenAcademicWriting,
  onDownloadDocx,
  onImportDocx,
  onExportPdf,
  onSave,
  onRegenerate,
  onViewVersions: _onViewVersions,
  busy,
  docxDisabled,
  pdfDisabled,
  regenerateDisabled,
}: DocumentTopToolbarProps) {
  const [moreOpen, setMoreOpen] = useState(false)

  return (
    <Toolbar>
      <ToolButton type="button" data-testid="document-save" onClick={onSave} disabled={busy} $primary>
        <Save size={14} />
        保存
      </ToolButton>
      <ToolButton type="button" data-testid="document-download-docx" onClick={onDownloadDocx} disabled={busy || docxDisabled}>
        <FileDown size={14} />
        导出 DOCX
      </ToolButton>
      <ToolButton type="button" data-testid="document-export-pdf" onClick={onExportPdf} disabled={busy || pdfDisabled}>
        <FileDown size={14} />
        导出 PDF
      </ToolButton>

      <Spacer />

      <MoreMenuWrapper>
        <ToolButton
          type="button"
          data-testid="document-more-menu"
          onClick={() => setMoreOpen((value) => !value)}
        >
          <MoreHorizontal size={15} />
          更多
        </ToolButton>
        {moreOpen && (
          <MoreMenu>
            <MoreMenuItem
              type="button"
              data-testid="document-import-docx"
              onClick={() => {
                onImportDocx?.()
                setMoreOpen(false)
              }}
            >
              <Upload size={14} />
              导入 DOCX
            </MoreMenuItem>
            {onOpenAcademicWriting ? (
              <MoreMenuItem
                type="button"
                data-testid="document-toolbar-academic"
                onClick={() => {
                  onOpenAcademicWriting()
                  setMoreOpen(false)
                }}
              >
                <MoreHorizontal size={14} />
                更多场景：学术写作
              </MoreMenuItem>
            ) : null}
            <MoreMenuItem
              type="button"
              data-testid="document-regenerate"
              onClick={() => {
                onRegenerate()
                setMoreOpen(false)
              }}
              disabled={busy || regenerateDisabled}
            >
              <RotateCcw size={14} />
              重新生成
            </MoreMenuItem>
          </MoreMenu>
        )}
      </MoreMenuWrapper>
    </Toolbar>
  )
}
