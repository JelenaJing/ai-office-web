import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { fetchOpenCodeStatus, type OpenCodeStatusResponse } from '../services/documentStudioApi'

const Bar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  padding: 8px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 12px;
  color: #475569;
  margin-bottom: 16px;
`

const Pill = styled.span<{ $tone: 'ok' | 'warn' | 'pending' | 'err' }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  background: ${p =>
    p.$tone === 'ok' ? '#dcfce7' : p.$tone === 'warn' ? '#fef3c7' : p.$tone === 'pending' ? '#e0e7ff' : '#fee2e2'};
  color: ${p =>
    p.$tone === 'ok' ? '#166534' : p.$tone === 'warn' ? '#b45309' : p.$tone === 'pending' ? '#4338ca' : '#b91c1c'};
`

function skillTone(
  skill: { installed: boolean; status: string; source?: string },
): 'ok' | 'warn' | 'pending' | 'err' {
  if (skill.status === 'pending') return 'pending'
  if (skill.installed && skill.source === 'aios-skills') return 'ok'
  if (skill.installed) return 'warn'
  return 'err'
}

export default function DocumentOpenCodeStatusBar() {
  const [status, setStatus] = useState<OpenCodeStatusResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void fetchOpenCodeStatus()
      .then(setStatus)
      .catch(err => setError(err instanceof Error ? err.message : String(err)))
  }, [])

  if (error) {
    return (
      <Bar>
        <Pill $tone="err">OpenCode 状态加载失败</Pill>
        <span>{error}</span>
      </Bar>
    )
  }
  if (!status) {
    return <Bar>正在检测 OpenCode 与 Skill 状态…</Bar>
  }

  return (
    <Bar>
      <Pill $tone={status.opencodeAvailable ? 'ok' : 'err'}>
        OpenCode {status.opencodeAvailable ? '可用' : '不可用'}
        {status.opencodeVersion ? ` (${status.opencodeVersion})` : ''}
      </Pill>
      <Pill $tone={skillTone(status.humanizer)}>
        AI改写 {status.humanizer.installed ? (status.humanizer.source === 'aios-skills' ? '已安装' : '内置占位') : '未安装'}
      </Pill>
      <Pill $tone={skillTone(status.newsWriter)}>
        新闻稿生成{' '}
        {status.newsWriter.installed
          ? status.newsWriter.source === 'aios-skills'
            ? '已安装'
            : '内置占位'
          : '未安装'}
      </Pill>
      <Pill $tone="pending">论文写作 待接入</Pill>
    </Bar>
  )
}
