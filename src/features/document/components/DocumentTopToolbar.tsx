import styled from 'styled-components'
import { FileDown, ImagePlus, Presentation, Save, Upload } from 'lucide-react'

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  height: 48px;
  border-bottom: 1px solid #e2e8f0;
  background: #fff;
  flex-shrink: 0;
`

const Spacer = styled.div`
  flex: 1;
`

const ToolButton = styled.button<{ $primary?: boolean }>`
  height: 34px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid ${({ $primary }) => ($primary ? '#7aaee0' : '#d4deea')};
  background: ${({ $primary }) => ($primary ? '#eef5fc' : '#fff')};
  color: #2c4b67;
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`

export interface DocumentTopToolbarProps {
  onDownloadDocx: () => void
  onImportDocx?: () => void
  onExportPdf: () => void
  onSave: () => void
  onConvertToReport?: () => void
  onInsertImage?: () => void
  busy?: boolean
  docxDisabled?: boolean
  pdfDisabled?: boolean
}

export function DocumentTopToolbar({
  onDownloadDocx,
  onImportDocx,
  onExportPdf,
  onSave,
  onConvertToReport,
  onInsertImage,
  busy,
  docxDisabled,
  pdfDisabled,
}: DocumentTopToolbarProps) {
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
      {onInsertImage ? (
        <ToolButton type="button" data-testid="document-insert-image" onClick={onInsertImage} disabled={busy || docxDisabled}>
          <ImagePlus size={14} />
          插入图片
        </ToolButton>
      ) : null}
      <Spacer />
      {onConvertToReport ? (
        <ToolButton
          type="button"
          data-testid="document-convert-report"
          onClick={onConvertToReport}
          disabled={busy || docxDisabled}
        >
          <Presentation size={14} />
          转为汇报
        </ToolButton>
      ) : null}
      {onImportDocx ? (
        <ToolButton type="button" data-testid="document-import-docx" onClick={onImportDocx} disabled={busy}>
          <Upload size={14} />
          导入 DOCX
        </ToolButton>
      ) : null}
    </Toolbar>
  )
}
