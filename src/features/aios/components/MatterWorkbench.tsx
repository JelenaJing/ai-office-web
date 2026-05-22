import React, { useEffect, useState, useCallback } from 'react'
import styled from 'styled-components'
import type { Matter, MatterEvidence, AuditEvent, DecisionPackage, MatterStatus, MatterPriority } from '../types'
import { STATUS_LABELS, PRIORITY_LABELS, PRIORITY_COLORS, STATUS_COLORS } from '../types'
import * as matterRuntime from '../services/matterRuntime'
import MatterEvidencePanel from './MatterEvidencePanel'
import DecisionPackagePanel from './DecisionPackagePanel'
import AuditTimelinePanel from './AuditTimelinePanel'

interface Props {
  matterId: string
  onBack: () => void
}

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: #f4f7fc;
`

const TopBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 24px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
`

const BackBtn = styled.button`
  background: none;
  border: none;
  color: #3182ce;
  font-size: 14px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  &:hover { background: #ebf8ff; }
`

const MatterTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1a2f47;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const Badge = styled.span<{ $color: string }>`
  font-size: 12px;
  font-weight: 600;
  color: ${p => p.$color};
  background: ${p => p.$color}18;
  padding: 3px 10px;
  border-radius: 10px;
  white-space: nowrap;
  border: 1px solid ${p => p.$color}30;
`

const Body = styled.div`
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: hidden;
  gap: 0;
`

const LeftPanel = styled.div`
  width: 240px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 16px;
  gap: 12px;
`

const CenterPanel = styled.div`
  flex: 1;
  min-width: 0;
  background: #fff;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 16px;
`

const RightPanel = styled.div`
  width: 280px;
  flex-shrink: 0;
  background: #f7fafc;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 16px;
`

const BottomBar = styled.div`
  border-top: 1px solid #e2e8f0;
  background: #fff;
  padding: 10px 16px;
  flex-shrink: 0;
  max-height: 200px;
  overflow-y: auto;
`

const FieldLabel = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: #a0aec0;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 4px;
`

const FieldValue = styled.div`
  font-size: 13px;
  color: #2d3748;
`

const FieldBlock = styled.div``

const Select = styled.select`
  width: 100%;
  padding: 5px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  background: #fff;
  color: #2d3748;
  cursor: pointer;
`

const Textarea = styled.textarea`
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  color: #2d3748;
  resize: vertical;
  min-height: 60px;
  box-sizing: border-box;
  &:focus { outline: none; border-color: #3182ce; }
`

const PanelTitle = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: #4a5568;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
`

const AuditTitle = styled.div`
  font-size: 12px;
  font-weight: 700;
  color: #718096;
  margin-bottom: 6px;
`

const SaveBtn = styled.button`
  width: 100%;
  padding: 6px;
  background: #3182ce;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  &:disabled { background: #a0aec0; }
`

const ErrorMsg = styled.div`
  color: #e53e3e;
  font-size: 12px;
  text-align: center;
`

export default function MatterWorkbench({ matterId, onBack }: Props) {
  const [matter, setMatter] = useState<Matter | null>(null)
  const [evidence, setEvidence] = useState<MatterEvidence[]>([])
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Edit fields
  const [goalDraft, setGoalDraft] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [detail, audit] = await Promise.all([
        matterRuntime.getMatter(matterId),
        matterRuntime.getAuditTrail(matterId),
      ])
      setMatter(detail.matter)
      setEvidence(detail.evidence)
      setGoalDraft(detail.matter.goal ?? '')
      setAuditEvents(audit)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [matterId])

  useEffect(() => { load() }, [load])

  async function handleStatusChange(status: MatterStatus) {
    if (!matter) return
    try {
      const updated = await matterRuntime.updateMatter(matterId, { status })
      setMatter(updated)
      const audit = await matterRuntime.getAuditTrail(matterId)
      setAuditEvents(audit)
    } catch (e) {
      alert(e instanceof Error ? e.message : '更新失败')
    }
  }

  async function handlePriorityChange(priority: MatterPriority) {
    if (!matter) return
    try {
      const updated = await matterRuntime.updateMatter(matterId, { priority })
      setMatter(updated)
    } catch (e) {
      alert(e instanceof Error ? e.message : '更新失败')
    }
  }

  async function handleSaveGoal() {
    if (!matter) return
    setSaving(true)
    try {
      const updated = await matterRuntime.updateMatter(matterId, { goal: goalDraft })
      setMatter(updated)
    } catch (e) {
      alert(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  function handleDecisionPackageGenerated(pkg: DecisionPackage) {
    if (matter) setMatter({ ...matter, decisionPackage: pkg })
    matterRuntime.getAuditTrail(matterId).then(setAuditEvents).catch(() => {})
  }

  if (loading) {
    return (
      <Shell>
        <TopBar>
          <BackBtn onClick={onBack}>← 返回</BackBtn>
          <MatterTitle>加载中…</MatterTitle>
        </TopBar>
      </Shell>
    )
  }

  if (error || !matter) {
    return (
      <Shell>
        <TopBar>
          <BackBtn onClick={onBack}>← 返回</BackBtn>
          <MatterTitle>加载失败</MatterTitle>
        </TopBar>
        <ErrorMsg style={{ padding: 32 }}>{error ?? '未知错误'}</ErrorMsg>
      </Shell>
    )
  }

  return (
    <Shell>
      <TopBar>
        <BackBtn onClick={onBack}>← 返回</BackBtn>
        <MatterTitle title={matter.title}>{matter.title}</MatterTitle>
        <Badge $color={PRIORITY_COLORS[matter.priority]}>
          {PRIORITY_LABELS[matter.priority]}
        </Badge>
        <Badge $color={STATUS_COLORS[matter.status]}>
          {STATUS_LABELS[matter.status]}
        </Badge>
      </TopBar>

      <Body>
        {/* Left: matter info */}
        <LeftPanel>
          <PanelTitle>📋 事项信息</PanelTitle>

          <FieldBlock>
            <FieldLabel>状态</FieldLabel>
            <Select
              value={matter.status}
              onChange={e => handleStatusChange(e.target.value as MatterStatus)}
            >
              {(Object.keys(STATUS_LABELS) as MatterStatus[]).map(s => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </Select>
          </FieldBlock>

          <FieldBlock>
            <FieldLabel>优先级</FieldLabel>
            <Select
              value={matter.priority}
              onChange={e => handlePriorityChange(e.target.value as MatterPriority)}
            >
              {(Object.keys(PRIORITY_LABELS) as MatterPriority[]).map(p => (
                <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
              ))}
            </Select>
          </FieldBlock>

          <FieldBlock>
            <FieldLabel>来源</FieldLabel>
            <FieldValue>{matter.sourceType}</FieldValue>
          </FieldBlock>

          <FieldBlock>
            <FieldLabel>目标</FieldLabel>
            <Textarea
              value={goalDraft}
              onChange={e => setGoalDraft(e.target.value)}
              placeholder="填写事项目标…"
            />
            <SaveBtn
              style={{ marginTop: 6 }}
              disabled={saving || goalDraft === matter.goal}
              onClick={handleSaveGoal}
            >
              {saving ? '保存中…' : '保存目标'}
            </SaveBtn>
          </FieldBlock>

          <FieldBlock>
            <FieldLabel>创建时间</FieldLabel>
            <FieldValue>{new Date(matter.createdAt).toLocaleString('zh-CN')}</FieldValue>
          </FieldBlock>

          <FieldBlock>
            <FieldLabel>更新时间</FieldLabel>
            <FieldValue>{new Date(matter.updatedAt).toLocaleString('zh-CN')}</FieldValue>
          </FieldBlock>
        </LeftPanel>

        {/* Center: evidence */}
        <CenterPanel>
          <PanelTitle>🗂 证据材料（{evidence.length}）</PanelTitle>
          <MatterEvidencePanel
            matterId={matterId}
            evidence={evidence}
            onEvidenceChange={newEvidence => {
              setEvidence(newEvidence)
              matterRuntime.getAuditTrail(matterId).then(setAuditEvents).catch(() => {})
            }}
          />
        </CenterPanel>

        {/* Right: decision package */}
        <RightPanel>
          <PanelTitle>🧠 决策包</PanelTitle>
          <DecisionPackagePanel
            matterId={matterId}
            pkg={matter.decisionPackage}
            onPackageGenerated={handleDecisionPackageGenerated}
          />
        </RightPanel>
      </Body>

      {/* Bottom: audit timeline */}
      <BottomBar>
        <AuditTitle>📜 审计时间线</AuditTitle>
        <AuditTimelinePanel events={auditEvents} />
      </BottomBar>
    </Shell>
  )
}
