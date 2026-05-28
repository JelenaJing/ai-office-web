import styled from 'styled-components'

const Bar = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
`

const Btn = styled.button`
  height: 32px;
  padding: 0 12px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  background: #fff;
  cursor: pointer;
  font-size: 13px;
  &:hover:not(:disabled) {
    border-color: #3b82f6;
  }
  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`

const PendingTag = styled.span`
  font-size: 11px;
  color: #b45309;
  margin-left: 4px;
`

interface Props {
  onExport: (format: 'markdown' | 'html' | 'docx') => void
  onSaveVersion?: () => void
}

export default function DocumentExportPanel({ onExport, onSaveVersion }: Props) {
  return (
    <Bar>
      {onSaveVersion ? (
        <Btn type="button" onClick={onSaveVersion}>
          保存版本
        </Btn>
      ) : null}
      <Btn type="button" onClick={() => onExport('markdown')}>
        导出 Markdown
      </Btn>
      <Btn type="button" onClick={() => onExport('html')}>
        导出 HTML
      </Btn>
      <Btn type="button" onClick={() => onExport('docx')}>
        导出 Word
      </Btn>
      <Btn type="button" disabled title="PDF 导出待接入">
        导出 PDF
        <PendingTag>待接入</PendingTag>
      </Btn>
    </Bar>
  )
}
