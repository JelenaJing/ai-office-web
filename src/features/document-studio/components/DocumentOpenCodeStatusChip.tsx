import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { fetchOpenCodeStatus, type OpenCodeStatusResponse } from '../services/documentStudioApi'

const Wrap = styled.div`
  position: relative;
`

const ChipBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid #e2e8f0;
  background: #fff;
  font-size: 12px;
  color: #475569;
  cursor: pointer;
  &:hover {
    border-color: #cbd5e1;
    background: #f8fafc;
  }
`

const Dot = styled.span<{ $ok?: boolean }>`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${p => (p.$ok ? '#22c55e' : '#f59e0b')};
`

const Popover = styled.div`
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 20;
  min-width: 240px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #fff;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
  font-size: 12px;
  color: #475569;
  line-height: 1.6;
`

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 8px;
`

export default function DocumentOpenCodeStatusChip() {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<OpenCodeStatusResponse | null>(null)

  useEffect(() => {
    void fetchOpenCodeStatus().then(setStatus).catch(() => setStatus(null))
  }, [])

  const ready =
    status?.opencodeAvailable &&
    status.newsWriter.installed &&
    status.humanizer.installed

  return (
    <Wrap>
      <ChipBtn type="button" onClick={() => setOpen(v => !v)} aria-expanded={open}>
        <Dot $ok={Boolean(ready)} />
        OpenCode {ready ? '就绪' : '状态'}
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </ChipBtn>
      {open ? (
        <Popover>
          {!status ? (
            <span>正在检测…</span>
          ) : (
            <>
              <Row>
                <span>OpenCode</span>
                <strong>{status.opencodeAvailable ? `可用 ${status.opencodeVersion || ''}` : '不可用'}</strong>
              </Row>
              <Row>
                <span>新闻稿 Skill</span>
                <strong>{status.newsWriter.installed ? '已安装' : '未安装'}</strong>
              </Row>
              <Row>
                <span>改写 Skill</span>
                <strong>{status.humanizer.installed ? '已安装' : '未安装'}</strong>
              </Row>
              <Row>
                <span>论文 pipeline</span>
                <strong style={{ color: '#b45309' }}>待接入</strong>
              </Row>
            </>
          )}
        </Popover>
      ) : null}
    </Wrap>
  )
}
