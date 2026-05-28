import styled from 'styled-components'
import { formatGenerationSourceLabel } from '../services/sourceLabels'
import DocumentStudioStepIndicator from './DocumentStudioStepIndicator'

const Page = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #f1f5f9;
`

const Center = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
`

const Card = styled.div`
  width: min(520px, 100%);
  background: #fff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  padding: 32px 28px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
`

const Stage = styled.div`
  font-size: 20px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 20px;
`

const Steps = styled.ol`
  margin: 0 0 20px;
  padding: 0;
  list-style: none;
`

const Step = styled.li<{ $active?: boolean; $done?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  font-size: 14px;
  color: ${p => (p.$active ? '#0f172a' : p.$done ? '#64748b' : '#94a3b8')};
  font-weight: ${p => (p.$active ? 600 : 400)};
`

const Dot = styled.span<{ $active?: boolean; $done?: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${p => (p.$done ? '#22c55e' : p.$active ? '#2563eb' : '#cbd5e1')};
`

const Spinner = styled.div`
  width: 28px;
  height: 28px;
  border: 3px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`

const SourceBox = styled.div`
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.5;
  background: ${p => (p.$fallback ? '#fffbeb' : '#eff6ff')};
  color: ${p => (p.$fallback ? '#92400e' : '#1e40af')};
  border: 1px solid ${p => (p.$fallback ? '#fcd34d' : '#bfdbfe')};
`

const ErrorBox = styled.div`
  margin-top: 12px;
  padding: 12px;
  background: #fef2f2;
  color: #b91c1c;
  border-radius: 8px;
  font-size: 14px;
`

const GENERATION_STEPS = [
  { key: 'analyze', label: '正在分析需求' },
  { key: 'capability', label: '正在调用写作能力' },
  { key: 'generate', label: '正在生成文稿' },
  { key: 'editor', label: '正在整理编辑器内容' },
] as const

function resolveActiveStepIndex(progressStage: string, status: string): number {
  const stage = progressStage.toLowerCase()
  if (status === 'succeeded') return 3
  if (stage.includes('编辑器') || stage.includes('整理')) return 3
  if (stage.includes('生成') || stage.includes('写入')) return 2
  if (stage.includes('skill') || stage.includes('opencode') || stage.includes('能力')) return 1
  if (status === 'running' || status === 'queued') return stage.includes('分析') ? 0 : 1
  return 0
}

interface Props {
  progressStage: string
  status: string
  error?: string | null
  fallback?: boolean
  source?: string
  fallbackReason?: string | null
}

export default function DocumentGenerationView({
  progressStage,
  status,
  error,
  fallback,
  source,
  fallbackReason,
}: Props) {
  const activeIdx = resolveActiveStepIndex(progressStage, status)
  const displayStage = progressStage || GENERATION_STEPS[activeIdx]?.label || '正在生成…'
  const showSource = status === 'succeeded' || status === 'running' || fallback

  return (
    <Page>
      <DocumentStudioStepIndicator step="generating" />
      <Center>
        <Card>
          {status !== 'failed' && status !== 'succeeded' ? <Spinner /> : null}
          <Stage>{displayStage}</Stage>
          <Steps>
            {GENERATION_STEPS.map((step, i) => (
              <Step key={step.key} $active={i === activeIdx} $done={i < activeIdx}>
                <Dot $active={i === activeIdx} $done={i < activeIdx} />
                {step.label}
              </Step>
            ))}
          </Steps>
          {showSource ? (
            <SourceBox $fallback={Boolean(fallback)}>
              {formatGenerationSourceLabel({ source, fallback, fallbackReason })}
            </SourceBox>
          ) : null}
          {error ? <ErrorBox>{error}</ErrorBox> : null}
        </Card>
      </Center>
    </Page>
  )
}
