import styled from 'styled-components'

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

const Preview = styled.pre`
  white-space: pre-wrap;
  background: #f8fafc;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.65;
  color: #1e293b;
  margin: 0;
`

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
`

const Btn = styled.button<{ $primary?: boolean }>`
  padding: 8px 14px;
  border-radius: 8px;
  border: ${({ $primary }) => ($primary ? 'none' : '1px solid #e2e8f0')};
  cursor: pointer;
  background: ${({ $primary }) => ($primary ? '#2563eb' : '#fff')};
  color: ${({ $primary }) => ($primary ? '#fff' : '#334155')};
  font-size: 13px;
  font-weight: 600;
`

interface Props {
  title?: string
  text: string
  busy?: boolean
  onReplace: () => void
  onInsertBelow: () => void
  onRegenerate: () => void
  onCancel: () => void
}

export default function DocumentStudioTextPreviewModal({
  title = 'AI 修改预览',
  text,
  busy,
  onReplace,
  onInsertBelow,
  onRegenerate,
  onCancel,
}: Props) {
  return (
    <Overlay onClick={onCancel}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0, marginBottom: 12 }}>{title}</h3>
        <Preview>{text || '（无内容）'}</Preview>
        <Actions>
          <Btn type="button" onClick={onCancel} disabled={busy}>
            取消
          </Btn>
          <Btn type="button" onClick={onRegenerate} disabled={busy}>
            重新生成
          </Btn>
          <Btn type="button" onClick={onInsertBelow} disabled={busy}>
            插入下方
          </Btn>
          <Btn type="button" $primary onClick={onReplace} disabled={busy}>
            替换原文
          </Btn>
        </Actions>
      </Modal>
    </Overlay>
  )
}
