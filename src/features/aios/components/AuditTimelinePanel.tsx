import React from 'react'
import styled from 'styled-components'
import type { AuditEvent } from '../types'

interface Props {
  events: AuditEvent[]
  loading?: boolean
}

const ACTION_LABELS: Record<string, string> = {
  create_matter: '创建事项',
  update_matter: '更新事项',
  add_evidence: '添加证据',
  delete_evidence: '删除证据',
  generate_decision_package: '生成决策包',
  change_status: '变更状态',
  delete_matter: '删除事项',
}

const ACTION_COLORS: Record<string, string> = {
  create_matter: '#38a169',
  update_matter: '#3182ce',
  add_evidence: '#805ad5',
  delete_evidence: '#e53e3e',
  generate_decision_package: '#d69e2e',
  change_status: '#dd6b20',
  delete_matter: '#e53e3e',
}

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0 0 8px;
`

const EmptyState = styled.div`
  color: #a0aec0;
  font-size: 13px;
  padding: 16px 0;
  text-align: center;
`

const TimelineList = styled.div`
  position: relative;
  padding-left: 20px;
  &::before {
    content: '';
    position: absolute;
    left: 6px;
    top: 8px;
    bottom: 8px;
    width: 2px;
    background: #e2e8f0;
    border-radius: 1px;
  }
`

const EventItem = styled.div`
  position: relative;
  padding: 6px 0 6px 16px;
  &::before {
    content: '';
    position: absolute;
    left: -14px;
    top: 12px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--dot-color, #3182ce);
    border: 2px solid #fff;
    box-shadow: 0 0 0 1px #e2e8f0;
  }
`

const EventHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const ActionBadge = styled.span<{ $color: string }>`
  font-size: 11px;
  font-weight: 600;
  color: ${p => p.$color};
  background: ${p => p.$color}18;
  padding: 1px 7px;
  border-radius: 8px;
  white-space: nowrap;
`

const EventTime = styled.span`
  font-size: 11px;
  color: #a0aec0;
`

const EventDetail = styled.div`
  font-size: 12px;
  color: #718096;
  margin-top: 2px;
  padding-left: 2px;
`

function formatDetail(action: string, detail: Record<string, unknown>): string {
  if (action === 'change_status' && detail.from && detail.to) {
    return `${detail.from} → ${detail.to}`
  }
  if (action === 'add_evidence' && detail.title) {
    return `${detail.type ?? ''} · ${detail.title}`
  }
  if (action === 'generate_decision_package' && detail.evidenceCount !== undefined) {
    return `基于 ${detail.evidenceCount} 条证据生成`
  }
  return ''
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AuditTimelinePanel({ events, loading }: Props) {
  if (loading) {
    return <EmptyState>加载中…</EmptyState>
  }
  if (events.length === 0) {
    return <EmptyState>暂无审计记录</EmptyState>
  }

  const sorted = [...events].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  return (
    <Shell>
      <TimelineList>
        {sorted.map(ev => {
          const color = ACTION_COLORS[ev.action] ?? '#3182ce'
          const detailText = formatDetail(ev.action, ev.detail)
          return (
            <EventItem key={ev.id} style={{ '--dot-color': color } as React.CSSProperties}>
              <EventHeader>
                <ActionBadge $color={color}>{ACTION_LABELS[ev.action] ?? ev.action}</ActionBadge>
                <EventTime>{formatTime(ev.createdAt)}</EventTime>
              </EventHeader>
              {detailText && <EventDetail>{detailText}</EventDetail>}
            </EventItem>
          )
        })}
      </TimelineList>
    </Shell>
  )
}
