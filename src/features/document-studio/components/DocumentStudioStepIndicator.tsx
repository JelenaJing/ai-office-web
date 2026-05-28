import styled from 'styled-components'
import type { StudioStep } from '../hooks/useDocumentStudio'

const Bar = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
`

const Step = styled.div<{ $active?: boolean; $done?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: ${p => (p.$active ? '#0f172a' : p.$done ? '#64748b' : '#94a3b8')};
  font-weight: ${p => (p.$active ? 600 : 400)};
`

const Dot = styled.span<{ $active?: boolean; $done?: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${p => (p.$done ? '#22c55e' : p.$active ? '#2563eb' : '#cbd5e1')};
`

const Sep = styled.span`
  color: #cbd5e1;
  font-size: 12px;
  user-select: none;
`

const STEPS: Array<{ key: StudioStep | 'generating'; label: string }> = [
  { key: 'type', label: '选择类型' },
  { key: 'form', label: '填写需求' },
  { key: 'generating', label: '生成中' },
  { key: 'editor', label: '编辑文稿' },
]

function stepIndex(step: StudioStep): number {
  if (step === 'type') return 0
  if (step === 'form') return 1
  if (step === 'generating') return 2
  return 3
}

interface Props {
  step: StudioStep
}

export default function DocumentStudioStepIndicator({ step }: Props) {
  const active = stepIndex(step)
  return (
    <Bar>
      {STEPS.map((s, i) => (
        <span key={s.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {i > 0 ? <Sep>›</Sep> : null}
          <Step $active={i === active} $done={i < active}>
            <Dot $active={i === active} $done={i < active} />
            {s.label}
          </Step>
        </span>
      ))}
    </Bar>
  )
}
