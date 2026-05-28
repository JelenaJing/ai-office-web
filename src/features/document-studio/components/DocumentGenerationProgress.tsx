import styled from 'styled-components'
import { formatGenerationSourceLabel } from '../services/sourceLabels'

const Shell = styled.div`
  max-width: 520px;
  padding: 24px;
`

const Stage = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 12px;
`

const Hint = styled.p`
  color: #64748b;
  font-size: 14px;
`

const SourceBox = styled.div`
  margin-top: 12px;
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.5;
  background: ${p => (p.$fallback ? '#fffbeb' : '#eff6ff')};
  color: ${p => (p.$fallback ? '#92400e' : '#1e40af')};
  border: 1px solid ${p => (p.$fallback ? '#fcd34d' : '#bfdbfe')};
`

const ErrorBox = styled.div`
  margin-top: 16px;
  padding: 12px;
  background: #fef2f2;
  color: #b91c1c;
  border-radius: 8px;
  font-size: 14px;
`

interface Props {
  stage: string
  status: string
  error?: string | null
  fallback?: boolean
  source?: string
  fallbackReason?: string | null
}

export default function DocumentGenerationProgress({
  stage,
  status,
  error,
  fallback,
  source,
  fallbackReason,
}: Props) {
  const showSource = status === 'succeeded' || status === 'running' || fallback
  const sourceText = formatGenerationSourceLabel({ source, fallback, fallbackReason })

  return (
    <Shell>
      <Stage>{stage || '正在生成…'}</Stage>
      <Hint>状态：{status}</Hint>
      {showSource ? <SourceBox $fallback={Boolean(fallback)}>{sourceText}</SourceBox> : null}
      {error ? <ErrorBox>{error}</ErrorBox> : null}
    </Shell>
  )
}
