import React from 'react'
import styled from 'styled-components'

const Overlay = styled.div<{ $centered?: boolean }>`
  position: absolute;
  left: 50%;
  ${({ $centered }) => ($centered ? 'top: 50%;' : 'bottom: 28px;')}
  transform: ${({ $centered }) => ($centered ? 'translate(-50%, -50%)' : 'translateX(-50%)')};
  z-index: 8;
  width: min(560px, calc(100% - 48px));
  pointer-events: none;
`

const GlassCard = styled.div`
  pointer-events: auto;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.55);
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(18px) saturate(1.35);
  -webkit-backdrop-filter: blur(18px) saturate(1.35);
  box-shadow:
    0 18px 48px rgba(15, 23, 42, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.85);
  display: grid;
  gap: 10px;
`

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`

const Input = styled.input`
  flex: 1;
  min-width: 0;
  height: 40px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.45);
  background: rgba(255, 255, 255, 0.88);
  font-size: 14px;
  color: #0f172a;

  &::placeholder {
    color: #94a3b8;
  }
`

const ApplyButton = styled.button`
  height: 40px;
  padding: 0 18px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #2563eb, #0ea5e9);
  color: #ffffff;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const Hint = styled.div`
  font-size: 11px;
  color: #64748b;
  line-height: 1.5;
`

export type PptFloatingPanelMode = 'generate' | 'edit'

interface PptFloatingEditPanelProps {
  visible: boolean
  mode: PptFloatingPanelMode
  centered?: boolean
  selectedLabel?: string | null
  value: string
  busy?: boolean
  inputRef?: React.RefObject<HTMLInputElement | null>
  onChange: (value: string) => void
  onApply: () => void
}

export default function PptFloatingEditPanel({
  visible,
  mode,
  centered = false,
  selectedLabel,
  value,
  busy = false,
  inputRef,
  onChange,
  onApply,
}: PptFloatingEditPanelProps) {
  if (!visible) return null

  const isGenerate = mode === 'generate'
  const hint = isGenerate
    ? (centered ? '输入演示主题，回车或点击按钮开始生成。' : '用一句话描述演示内容，回车即可生成。')
    : selectedLabel
      ? `正在编辑 ${selectedLabel}。输入修改说明后回车提交，或先点击预览区「编辑本页」。`
      : '将鼠标移到预览区并点击「编辑本页」，或直接在下方输入修改说明。'
  const placeholder = isGenerate
    ? '例如：学雷锋月活动介绍，6 页，面向全校师生…'
    : '描述要如何修改当前页…'
  const actionLabel = busy
    ? (isGenerate ? '生成中…' : '修改中…')
    : (isGenerate ? '生成 PPT' : '应用修改')

  return (
    <Overlay data-testid="ppt-floating-edit-panel" $centered={centered}>
      <GlassCard>
        <Hint>{hint}</Hint>
        <Row>
          <Input
            ref={inputRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                onApply()
              }
            }}
          />
          <ApplyButton type="button" onClick={onApply} disabled={busy || !value.trim()}>
            {actionLabel}
          </ApplyButton>
        </Row>
      </GlassCard>
    </Overlay>
  )
}
