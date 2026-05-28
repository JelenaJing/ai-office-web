import { useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'

const Page = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
  padding: 32px;
`

const Card = styled.div`
  width: min(480px, 100%);
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 40px 32px;
  text-align: center;
  box-shadow: 0 16px 48px rgba(15, 23, 42, 0.08);
`

const Title = styled.h2`
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
`

const Subtitle = styled.p`
  margin: 0 0 28px;
  font-size: 15px;
  color: #64748b;
  line-height: 1.6;
`

const Stage = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #2563eb;
  margin-bottom: 8px;
`

const Elapsed = styled.div`
  font-size: 13px;
  color: #94a3b8;
`

const Dots = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 24px;
  span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #3b82f6;
    animation: studioGenBlink 1.4s infinite both;
  }
  span:nth-child(2) {
    animation-delay: 0.2s;
  }
  span:nth-child(3) {
    animation-delay: 0.4s;
  }
  @keyframes studioGenBlink {
    0%,
    80%,
    100% {
      opacity: 0.25;
      transform: translateY(0);
    }
    40% {
      opacity: 1;
      transform: translateY(-2px);
    }
  }
`

const ErrorBox = styled.div`
  margin-top: 20px;
  padding: 12px 14px;
  border-radius: 10px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 13px;
  line-height: 1.5;
`

const BackBtn = styled.button`
  margin-top: 20px;
  height: 38px;
  padding: 0 16px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #334155;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
`

function sanitizeStageMessage(message: string): string {
  return String(message || '')
    .replace(/minimax|opencode|skill|workspace|artifact|docx skill|builtin/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function mapProgressToStage(progress: number, rawMessage?: string): string {
  const cleaned = sanitizeStageMessage(rawMessage || '')
  if (cleaned && cleaned.length > 4 && !/失败|错误/i.test(cleaned)) {
    if (/结构|大纲|整理/.test(cleaned)) return '正在生成文稿结构'
    if (/正文|撰写|生成/.test(cleaned)) return '正在撰写正文'
    if (/格式|准备|docx|导出/i.test(cleaned)) return '正在整理格式'
    if (/知识|材料|附件/.test(cleaned)) return '正在分析写作任务'
    return cleaned
  }
  if (progress < 20) return '正在分析写作任务'
  if (progress < 45) return '正在生成文稿结构'
  if (progress < 75) return '正在撰写正文'
  if (progress < 92) return '正在整理格式'
  return '正在准备编辑器'
}

interface Props {
  progress?: number
  message?: string
  error?: string | null
  onCancel?: () => void
}

export default function DocumentStudioGeneratingView({
  progress = 0,
  message,
  error,
  onCancel,
}: Props) {
  const [startedAt] = useState(() => Date.now())
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [startedAt])

  const stage = useMemo(() => mapProgressToStage(progress, message), [progress, message])

  return (
    <Page>
      <Card>
        <Dots>
          <span />
          <span />
          <span />
        </Dots>
        <Title>正在生成文稿</Title>
        <Subtitle>正在分析写作任务和整理结构</Subtitle>
        <Stage>当前阶段：{stage}</Stage>
        <Elapsed>已用时间：{elapsed}s</Elapsed>
        {error ? (
          <>
            <ErrorBox>{error}</ErrorBox>
            {onCancel ? (
              <BackBtn type="button" onClick={onCancel}>
                返回修改需求
              </BackBtn>
            ) : null}
          </>
        ) : null}
      </Card>
    </Page>
  )
}
