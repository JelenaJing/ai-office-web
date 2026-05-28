import { Mic, MicOff } from 'lucide-react'
import styled from 'styled-components'

const Btn = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid ${p => (p.$active ? '#93c5fd' : '#cbd5e1')};
  background: ${p => (p.$active ? '#eff6ff' : '#fff')};
  color: ${p => (p.$active ? '#1d4ed8' : '#475569')};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
  &:hover:not(:disabled) {
    border-color: #93c5fd;
    background: #f8fafc;
  }
`

interface Props {
  listening: boolean
  supported: boolean
  disabled?: boolean
  onClick: () => void
  className?: string
  /** 仅图标，适合侧栏窄布局 */
  compact?: boolean
}

export default function VoiceInputMicButton({
  listening,
  supported,
  disabled,
  onClick,
  className,
  compact,
}: Props) {
  const inlineStyle = {
    ...(compact
      ? { width: 40, height: 40, padding: 0, justifyContent: 'center' as const, borderRadius: 10 }
      : {}),
    ...(!supported ? { opacity: 0.72, borderStyle: 'dashed' as const } : {}),
  }

  return (
    <Btn
      type="button"
      className={className}
      $active={listening}
      style={Object.keys(inlineStyle).length > 0 ? inlineStyle : undefined}
      disabled={disabled}
      onClick={onClick}
      title={
        !supported
          ? '需 HTTPS 安全访问（dev:web 默认自签名证书）才能使用麦克风'
          : listening
            ? '停止语音输入'
            : '语音输入（会议助手 FunASR / 8600）'
      }
    >
      {listening ? <MicOff size={16} /> : <Mic size={16} />}
      {compact ? null : listening ? '停止语音' : '语音输入'}
    </Btn>
  )
}
