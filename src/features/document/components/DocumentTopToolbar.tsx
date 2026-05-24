import styled from 'styled-components'
import { AlertCircle, Clock3, Download, FileDown, RotateCcw, Save, Upload } from 'lucide-react'

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid #d8e3ef;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
`

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`

const MetaChip = styled.div<{ $tone?: 'warn' }>`
  padding: 8px 12px;
  border-radius: 999px;
  background: ${({ $tone }) => ($tone === 'warn' ? '#fff6eb' : '#f3f7fb')};
  border: 1px solid ${({ $tone }) => ($tone === 'warn' ? '#f2c48d' : '#d9e3ee')};
  font-size: 12px;
  color: ${({ $tone }) => ($tone === 'warn' ? '#8a4b08' : '#36506b')};
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
`

const Actions = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`

const ActionButton = styled.button`
  height: 36px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid #c8d5e3;
  background: #fff;
  color: #24415d;
  font-size: 13px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`

interface DocumentTopToolbarProps {
  engineLabel: string
  templateLabel: string
  knowledgeCount: number
  fallbackReason?: string | null
  artifactLabel?: string | null
  dirty?: boolean
  saving?: boolean
  lastSavedAt?: string | null
  docxReady?: boolean
  exportError?: string | null
  onDownloadDocx: () => void
  onImportDocx?: () => void
  onExportPdf: () => void
  onSave: () => void
  onRegenerate: () => void
  onViewVersions: () => void
  busy?: boolean
  pdfDisabled?: boolean
  regenerateDisabled?: boolean
}

export function DocumentTopToolbar({
  engineLabel,
  templateLabel,
  knowledgeCount,
  fallbackReason,
  artifactLabel,
  dirty,
  saving,
  lastSavedAt,
  docxReady,
  exportError,
  onDownloadDocx,
  onImportDocx,
  onExportPdf,
  onSave,
  onRegenerate,
  onViewVersions,
  busy,
  pdfDisabled,
  regenerateDisabled,
}: DocumentTopToolbarProps) {
  return (
    <Toolbar>
      <MetaRow>
        <MetaChip>生成引擎：{engineLabel}</MetaChip>
        <MetaChip>模板：{templateLabel}</MetaChip>
        <MetaChip>知识库：已选择 {knowledgeCount} 个</MetaChip>
        {artifactLabel ? <MetaChip>当前产物：{artifactLabel}</MetaChip> : null}
        {saving ? <MetaChip><Clock3 size={14} />保存中</MetaChip> : null}
        {!saving && dirty ? <MetaChip $tone="warn">未保存修改</MetaChip> : null}
        {!dirty && lastSavedAt ? <MetaChip>已保存：{new Date(lastSavedAt).toLocaleTimeString('zh-CN', { hour12: false })}</MetaChip> : null}
        {docxReady ? <MetaChip>DOCX 已更新</MetaChip> : null}
        {exportError ? <MetaChip $tone="warn">导出失败：{exportError}</MetaChip> : null}
        {fallbackReason ? (
          <MetaChip $tone="warn">
            <AlertCircle size={14} />
            fallbackReason：{fallbackReason}
          </MetaChip>
        ) : null}
      </MetaRow>
      <Actions>
        <ActionButton type="button" data-testid="document-import-docx" onClick={onImportDocx} disabled={busy}>
          <Upload size={15} />
          导入 DOCX
        </ActionButton>
        <ActionButton type="button" data-testid="document-download-docx" onClick={onDownloadDocx} disabled={busy}>
          <Download size={15} />
          下载 DOCX
        </ActionButton>
        <ActionButton type="button" data-testid="document-export-pdf" onClick={onExportPdf} disabled={busy || pdfDisabled}>
          <FileDown size={15} />
          导出 PDF
        </ActionButton>
        <ActionButton type="button" data-testid="document-save" onClick={onSave} disabled={busy}>
          <Save size={15} />
          保存
        </ActionButton>
        <ActionButton
          type="button"
          data-testid="document-regenerate"
          onClick={onRegenerate}
          disabled={busy || regenerateDisabled}
        >
          <RotateCcw size={15} />
          重新生成
        </ActionButton>
        <ActionButton type="button" data-testid="document-view-versions" onClick={onViewVersions} disabled>
          查看版本
        </ActionButton>
      </Actions>
    </Toolbar>
  )
}
