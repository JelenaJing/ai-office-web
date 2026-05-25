import React from 'react'
import styled, { keyframes } from 'styled-components'

const pulse = keyframes`
  0%, 100% { opacity: 0.45; }
  50% { opacity: 1; }
`

const Pipeline = styled.div`
  display: grid;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid #dbe4ee;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
`

const PipelineTitle = styled.div`
  font-size: 12px;
  font-weight: 800;
  color: #1e3a5f;
`

const StepList = styled.ol`
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 8px;
`

const StepItem = styled.li<{ $state: 'pending' | 'active' | 'done' }>`
  display: grid;
  grid-template-columns: 18px 1fr;
  gap: 10px;
  align-items: start;
  font-size: 12px;
  line-height: 1.55;
  color: ${({ $state }) => (
    $state === 'done' ? '#047857'
      : $state === 'active' ? '#1d4ed8'
      : '#94a3b8'
  )};
`

const StepDot = styled.span<{ $state: 'pending' | 'active' | 'done' }>`
  width: 10px;
  height: 10px;
  margin-top: 4px;
  border-radius: 999px;
  background: ${({ $state }) => (
    $state === 'done' ? '#10b981'
      : $state === 'active' ? '#3b82f6'
      : '#cbd5e1'
  )};
  ${({ $state }) => ($state === 'active' ? `animation: ${pulse} 1.2s ease-in-out infinite;` : '')}
`

const ProgressBar = styled.div`
  height: 4px;
  border-radius: 999px;
  background: #e2e8f0;
  overflow: hidden;
`

const ProgressFill = styled.div<{ $value: number }>`
  height: 100%;
  width: ${({ $value }) => `${Math.max(0, Math.min(100, $value))}%`};
  background: linear-gradient(90deg, #2563eb, #38bdf8);
  transition: width 0.35s ease;
`

export interface PipelineStep {
  id: string
  label: string
}

interface PptGenerationPipelineProps {
  title?: string
  steps: PipelineStep[]
  activeStepId: string
  progress?: number
  detailMessage?: string | null
}

export default function PptGenerationPipeline({
  title = 'AI 正在生成演示文稿',
  steps,
  activeStepId,
  progress = 0,
  detailMessage,
}: PptGenerationPipelineProps) {
  const activeIndex = Math.max(0, steps.findIndex((step) => step.id === activeStepId))

  return (
    <Pipeline data-testid="ppt-generation-pipeline">
      <PipelineTitle>{title}</PipelineTitle>
      <ProgressBar><ProgressFill $value={progress} /></ProgressBar>
      <StepList>
        {steps.map((step, index) => {
          const state: 'pending' | 'active' | 'done' = index < activeIndex
            ? 'done'
            : index === activeIndex
              ? 'active'
              : 'pending'
          return (
            <StepItem key={step.id} $state={state}>
              <StepDot $state={state} />
              <span>{step.label}{state === 'active' && detailMessage ? `：${detailMessage}` : ''}</span>
            </StepItem>
          )
        })}
      </StepList>
    </Pipeline>
  )
}

export const SLIDEV_PIPELINE_STEPS: PipelineStep[] = [
  { id: 'read', label: '读取需求与参考资料' },
  { id: 'plan', label: '解析内容结构' },
  { id: 'markdown', label: '编译 Slidev Markdown' },
  { id: 'render', label: '实时渲染网页幻灯片' },
  { id: 'export', label: '准备下载与导出' },
]

export function resolveSlidevPipelineStep(progress: number, message: string): string {
  const lower = message.toLowerCase()
  if (progress >= 88 || lower.includes('完成')) return 'export'
  if (progress >= 55 || lower.includes('markdown') || lower.includes('html')) return 'render'
  if (progress >= 20 || lower.includes('deck') || lower.includes('构建')) return 'markdown'
  if (lower.includes('读取') || lower.includes('解析')) return 'read'
  return progress < 20 ? 'read' : 'plan'
}
