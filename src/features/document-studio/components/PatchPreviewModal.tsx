import styled from 'styled-components'
import type { DocumentPatch } from '../services/documentStudioApi'
import { formatPatchSourceLabel } from '../services/sourceLabels'

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`

const Modal = styled.div`
  width: min(560px, 92vw);
  max-height: 80vh;
  overflow: auto;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
`

const SourceNote = styled.p`
  font-size: 13px;
  line-height: 1.5;
  color: #475569;
  margin: 0 0 12px;
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 8px;
`

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
`

const Btn = styled.button<{ $primary?: boolean }>`
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  background: ${p => (p.$primary ? '#2563eb' : '#e2e8f0')};
  color: ${p => (p.$primary ? '#fff' : '#334155')};
`

interface Props {
  patch: DocumentPatch
  source?: string
  fallback?: boolean
  onAccept: () => void
  onCancel: () => void
}

export default function PatchPreviewModal({ patch, source, fallback, onAccept, onCancel }: Props) {
  const sourceLabel = formatPatchSourceLabel(source, fallback)

  return (
    <Overlay onClick={onCancel}>
      <Modal onClick={e => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>预览修改</h3>
        {sourceLabel ? <SourceNote>{sourceLabel}</SourceNote> : null}
        {patch.summary?.length ? (
          <ul>
            {patch.summary.map(s => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        ) : null}
        {patch.warnings?.length ? (
          <p style={{ color: '#b45309', fontSize: 13 }}>{patch.warnings.join('；')}</p>
        ) : null}
        <pre style={{ whiteSpace: 'pre-wrap', background: '#f8fafc', padding: 12, borderRadius: 8, fontSize: 14 }}>
          {patch.text || '（无文本变更）'}
        </pre>
        <Actions>
          <Btn type="button" onClick={onCancel}>
            取消
          </Btn>
          <Btn type="button" $primary onClick={onAccept} disabled={patch.type === 'comments'}>
            {patch.type === 'comments' ? '关闭' : '接受并写入'}
          </Btn>
        </Actions>
      </Modal>
    </Overlay>
  )
}
