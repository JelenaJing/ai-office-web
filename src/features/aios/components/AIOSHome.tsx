import React, { useEffect, useState, useCallback } from 'react'
import styled from 'styled-components'
import type { Matter, MatterStatus, MatterPriority, MatterSourceType } from '../types'
import { STATUS_LABELS, PRIORITY_LABELS, PRIORITY_COLORS, STATUS_COLORS } from '../types'
import * as matterRuntime from '../services/matterRuntime'
import MatterWorkbench from './MatterWorkbench'

// ── Styled components ─────────────────────────────────────────────────────────

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: #f4f7fc;
`

const PageHeader = styled.div`
  padding: 28px 40px 0;
  flex-shrink: 0;
`

const PageTitle = styled.h1`
  margin: 0 0 4px;
  font-size: 26px;
  font-weight: 800;
  color: #1a2f47;
`

const PageSubtitle = styled.p`
  margin: 0 0 20px;
  font-size: 14px;
  color: #6b7f94;
`

const ToolBar = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 0 40px 16px;
  flex-wrap: wrap;
`

const CreateBtn = styled.button`
  padding: 8px 20px;
  background: #3182ce;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  &:hover { background: #2b6cb0; }
`

const FilterSelect = styled.select`
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  background: #fff;
  color: #2d3748;
  cursor: pointer;
`

const MatterGrid = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 40px 32px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const MatterCard = styled.div`
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: box-shadow 0.15s, border-color 0.15s;
  &:hover {
    border-color: #90cdf4;
    box-shadow: 0 2px 8px rgba(49, 130, 206, 0.1);
  }
`

const MatterBody = styled.div`
  flex: 1;
  min-width: 0;
`

const MatterTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #1a2f47;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const MatterMeta = styled.div`
  font-size: 12px;
  color: #a0aec0;
  margin-top: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const Badge = styled.span<{ $color: string }>`
  font-size: 11px;
  font-weight: 600;
  color: ${p => p.$color};
  background: ${p => p.$color}18;
  padding: 2px 8px;
  border-radius: 8px;
  white-space: nowrap;
  border: 1px solid ${p => p.$color}30;
  flex-shrink: 0;
`

const EvidenceBadge = styled.span`
  font-size: 11px;
  color: #718096;
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  padding: 2px 8px;
  border-radius: 8px;
  flex-shrink: 0;
`

const OpenBtn = styled.button`
  padding: 5px 12px;
  background: #ebf8ff;
  color: #3182ce;
  border: 1px solid #bee3f8;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  &:hover { background: #bee3f8; }
`

const DeleteBtn = styled.button`
  padding: 5px 8px;
  background: none;
  color: #fc8181;
  border: 1px solid #fed7d7;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  &:hover { background: #fff5f5; }
`

const EmptyState = styled.div`
  text-align: center;
  padding: 48px 0;
  color: #a0aec0;
`

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 12px;
`

const EmptyText = styled.div`
  font-size: 15px;
  margin-bottom: 6px;
  color: #718096;
`

const EmptySubtext = styled.div`
  font-size: 13px;
  color: #a0aec0;
`

const ErrorMsg = styled.div`
  color: #e53e3e;
  font-size: 14px;
  padding: 24px;
  text-align: center;
`

// ── Create Modal ──────────────────────────────────────────────────────────────

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`

const ModalBox = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 28px 28px 20px;
  width: 420px;
  max-width: 90vw;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
`

const ModalTitle = styled.h3`
  margin: 0 0 18px;
  font-size: 17px;
  font-weight: 700;
  color: #1a2f47;
`

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
`

const Label = styled.label`
  font-size: 12px;
  font-weight: 600;
  color: #718096;
`

const Input = styled.input`
  padding: 7px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  color: #2d3748;
  &:focus { outline: none; border-color: #3182ce; }
`

const Textarea = styled.textarea`
  padding: 7px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  color: #2d3748;
  resize: vertical;
  min-height: 56px;
  &:focus { outline: none; border-color: #3182ce; }
`

const Select = styled.select`
  padding: 7px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  background: #fff;
  color: #2d3748;
`

const ModalActions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
`

const CancelBtn = styled.button`
  padding: 7px 18px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #fff;
  color: #718096;
  cursor: pointer;
  font-size: 14px;
  &:hover { background: #f7fafc; }
`

const SubmitBtn = styled.button`
  padding: 7px 20px;
  background: #3182ce;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  &:disabled { background: #a0aec0; cursor: not-allowed; }
`

// ── Main component ────────────────────────────────────────────────────────────

const STATUS_FILTER_OPTIONS: Array<{ value: MatterStatus | 'all'; label: string }> = [
  { value: 'all', label: '全部事项' },
  { value: 'new', label: '新建' },
  { value: 'todo', label: '待处理' },
  { value: 'doing', label: '处理中' },
  { value: 'waiting', label: '等待中' },
  { value: 'done', label: '已完成' },
]

export default function AIOSHome({ initialMatterId }: { initialMatterId?: string | null } = {}) {
  const [matters, setMatters] = useState<Matter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<MatterStatus | 'all'>('all')
  const [openMatterId, setOpenMatterId] = useState<string | null>(null)

  // Auto-open matter passed from external navigation (e.g. email → matter conversion)
  useEffect(() => {
    if (initialMatterId) setOpenMatterId(initialMatterId)
  }, [initialMatterId])

  // Create modal state
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newGoal, setNewGoal] = useState('')
  const [newSourceType, setNewSourceType] = useState<MatterSourceType>('manual')
  const [newPriority, setNewPriority] = useState<MatterPriority>('normal')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const loadMatters = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const status = filterStatus === 'all' ? undefined : filterStatus
      const list = await matterRuntime.listMatters(status)
      setMatters(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [filterStatus])

  useEffect(() => { loadMatters() }, [loadMatters])

  async function handleCreate() {
    if (!newTitle.trim()) { setCreateError('请填写事项标题'); return }
    setCreating(true)
    setCreateError(null)
    try {
      const m = await matterRuntime.createMatter({
        title: newTitle,
        goal: newGoal,
        sourceType: newSourceType,
        priority: newPriority,
      })
      setMatters(prev => [m, ...prev])
      setShowCreate(false)
      setNewTitle('')
      setNewGoal('')
      setNewSourceType('manual')
      setNewPriority('normal')
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : '创建失败')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: string, title: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm(`确认删除事项「${title}」？此操作不可恢复。`)) return
    try {
      await matterRuntime.deleteMatter(id)
      setMatters(prev => prev.filter(m => m.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败')
    }
  }

  // Show workbench if matter is open
  if (openMatterId) {
    return (
      <MatterWorkbench
        matterId={openMatterId}
        onBack={() => { setOpenMatterId(null); loadMatters() }}
      />
    )
  }

  return (
    <Shell>
      <PageHeader>
        <PageTitle>📋 AIOS 事项中心</PageTitle>
        <PageSubtitle>管理工作事项、收集证据材料、生成决策包</PageSubtitle>
      </PageHeader>

      <ToolBar>
        <CreateBtn onClick={() => setShowCreate(true)}>＋ 新建事项</CreateBtn>
        <FilterSelect
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as MatterStatus | 'all')}
        >
          {STATUS_FILTER_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </FilterSelect>
        <span style={{ fontSize: 13, color: '#a0aec0', marginLeft: 4 }}>
          {matters.length > 0 ? `共 ${matters.length} 项` : ''}
        </span>
      </ToolBar>

      <MatterGrid>
        {loading && (
          <EmptyState><EmptyIcon>⏳</EmptyIcon><EmptyText>加载中…</EmptyText></EmptyState>
        )}
        {!loading && error && <ErrorMsg>{error}</ErrorMsg>}
        {!loading && !error && matters.length === 0 && (
          <EmptyState>
            <EmptyIcon>📭</EmptyIcon>
            <EmptyText>暂无事项</EmptyText>
            <EmptySubtext>点击「新建事项」创建第一个工作事项</EmptySubtext>
          </EmptyState>
        )}
        {!loading && !error && matters.map(m => (
          <MatterCard key={m.id} onClick={() => setOpenMatterId(m.id)}>
            <MatterBody>
              <MatterTitle>{m.title}</MatterTitle>
              <MatterMeta>
                {m.goal ? m.goal.slice(0, 80) : '（暂无目标描述）'}
              </MatterMeta>
            </MatterBody>
            <EvidenceBadge>📎 {m.evidenceIds.length} 证据</EvidenceBadge>
            <Badge $color={PRIORITY_COLORS[m.priority]}>{PRIORITY_LABELS[m.priority]}</Badge>
            <Badge $color={STATUS_COLORS[m.status]}>{STATUS_LABELS[m.status]}</Badge>
            <OpenBtn onClick={e => { e.stopPropagation(); setOpenMatterId(m.id) }}>
              打开
            </OpenBtn>
            <DeleteBtn onClick={e => handleDelete(m.id, m.title, e)}>删除</DeleteBtn>
          </MatterCard>
        ))}
      </MatterGrid>

      {showCreate && (
        <ModalOverlay onClick={() => setShowCreate(false)}>
          <ModalBox onClick={e => e.stopPropagation()}>
            <ModalTitle>新建事项</ModalTitle>

            <FormGroup>
              <Label>事项标题 *</Label>
              <Input
                placeholder="简明描述这个工作事项"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
              />
            </FormGroup>

            <FormGroup>
              <Label>目标（可选）</Label>
              <Textarea
                placeholder="描述该事项的预期目标或完成标准"
                value={newGoal}
                onChange={e => setNewGoal(e.target.value)}
              />
            </FormGroup>

            <FormGroup>
              <Label>来源类型</Label>
              <Select
                value={newSourceType}
                onChange={e => setNewSourceType(e.target.value as MatterSourceType)}
              >
                <option value="manual">手动创建</option>
                <option value="email">来自邮件</option>
                <option value="document">来自文档</option>
                <option value="upload">来自上传</option>
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>优先级</Label>
              <Select
                value={newPriority}
                onChange={e => setNewPriority(e.target.value as MatterPriority)}
              >
                {(Object.keys(PRIORITY_LABELS) as MatterPriority[]).map(p => (
                  <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                ))}
              </Select>
            </FormGroup>

            {createError && (
              <div style={{ color: '#e53e3e', fontSize: 13, marginBottom: 8 }}>{createError}</div>
            )}

            <ModalActions>
              <CancelBtn onClick={() => setShowCreate(false)}>取消</CancelBtn>
              <SubmitBtn onClick={handleCreate} disabled={creating}>
                {creating ? '创建中…' : '创建'}
              </SubmitBtn>
            </ModalActions>
          </ModalBox>
        </ModalOverlay>
      )}
    </Shell>
  )
}
