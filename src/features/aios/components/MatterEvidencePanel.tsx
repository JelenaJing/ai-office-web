import React, { useState } from 'react'
import styled from 'styled-components'
import type { MatterEvidence, EvidenceType } from '../types'
import * as matterRuntime from '../services/matterRuntime'

interface Props {
  matterId: string
  evidence: MatterEvidence[]
  onEvidenceChange: (evidence: MatterEvidence[]) => void
}

const TYPE_LABELS: Record<EvidenceType, string> = {
  email: '邮件',
  attachment: '附件',
  file: '文件',
  note: '备注',
  knowledge: '知识库',
}

const TYPE_ICONS: Record<EvidenceType, string> = {
  email: '✉️',
  attachment: '📎',
  file: '📄',
  note: '📝',
  knowledge: '📚',
}

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
`

const AddForm = styled.div`
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const FormRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-start;
`

const Select = styled.select`
  padding: 5px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  background: #fff;
  color: #2d3748;
  min-width: 80px;
`

const Input = styled.input`
  flex: 1;
  padding: 5px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  background: #fff;
  color: #2d3748;
  &:focus { outline: none; border-color: #3182ce; }
`

const Textarea = styled.textarea`
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  background: #fff;
  color: #2d3748;
  resize: vertical;
  min-height: 52px;
  &:focus { outline: none; border-color: #3182ce; }
`

const AddBtn = styled.button`
  align-self: flex-end;
  padding: 5px 14px;
  background: #3182ce;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  &:disabled { background: #a0aec0; cursor: not-allowed; }
`

const EvidenceList = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const EvidenceCard = styled.div`
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  gap: 10px;
  align-items: flex-start;
`

const EvidenceIcon = styled.div`
  font-size: 18px;
  line-height: 1;
  margin-top: 1px;
  flex-shrink: 0;
`

const EvidenceBody = styled.div`
  flex: 1;
  min-width: 0;
`

const EvidenceTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #2d3748;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const EvidenceMeta = styled.div`
  font-size: 11px;
  color: #a0aec0;
  margin-top: 2px;
`

const EvidenceContent = styled.div`
  font-size: 12px;
  color: #718096;
  margin-top: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const DeleteBtn = styled.button`
  background: none;
  border: none;
  color: #e53e3e;
  cursor: pointer;
  font-size: 14px;
  padding: 2px 4px;
  border-radius: 4px;
  opacity: 0.7;
  &:hover { opacity: 1; background: #fff5f5; }
`

const EmptyState = styled.div`
  text-align: center;
  color: #a0aec0;
  font-size: 13px;
  padding: 24px 0;
`

export default function MatterEvidencePanel({ matterId, evidence, onEvidenceChange }: Props) {
  const [type, setType] = useState<EvidenceType>('note')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [sourceRef, setSourceRef] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAdd() {
    if (!title.trim()) { setError('请填写证据标题'); return }
    setAdding(true)
    setError(null)
    try {
      const ev = await matterRuntime.addEvidence(matterId, { type, title, content, sourceRef })
      onEvidenceChange([...evidence, ev])
      setTitle('')
      setContent('')
      setSourceRef('')
    } catch (e) {
      setError(e instanceof Error ? e.message : '添加失败')
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(evidenceId: string) {
    if (!confirm('确认删除此证据？')) return
    try {
      await matterRuntime.deleteEvidence(matterId, evidenceId)
      onEvidenceChange(evidence.filter(e => e.id !== evidenceId))
    } catch (e) {
      alert(e instanceof Error ? e.message : '删除失败')
    }
  }

  return (
    <Shell>
      <AddForm>
        <FormRow>
          <Select value={type} onChange={e => setType(e.target.value as EvidenceType)}>
            {(Object.keys(TYPE_LABELS) as EvidenceType[]).map(t => (
              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
            ))}
          </Select>
          <Input
            placeholder="证据标题 *"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
          />
        </FormRow>
        <Textarea
          placeholder="内容摘要（可选）"
          value={content}
          onChange={e => setContent(e.target.value)}
        />
        <FormRow>
          <Input
            placeholder="来源引用（可选，如邮件 ID、文件路径）"
            value={sourceRef}
            onChange={e => setSourceRef(e.target.value)}
          />
          <AddBtn onClick={handleAdd} disabled={adding}>
            {adding ? '…' : '添加'}
          </AddBtn>
        </FormRow>
        {error && <div style={{ color: '#e53e3e', fontSize: 12 }}>{error}</div>}
      </AddForm>

      <EvidenceList>
        {evidence.length === 0 ? (
          <EmptyState>暂无证据材料，请添加相关邮件、文件或备注。</EmptyState>
        ) : (
          evidence.map(ev => (
            <EvidenceCard key={ev.id}>
              <EvidenceIcon>{TYPE_ICONS[ev.type] ?? '📄'}</EvidenceIcon>
              <EvidenceBody>
                <EvidenceTitle>{ev.title}</EvidenceTitle>
                <EvidenceMeta>
                  {TYPE_LABELS[ev.type]} · {new Date(ev.createdAt).toLocaleDateString('zh-CN')}
                  {ev.sourceRef ? ` · ${ev.sourceRef}` : ''}
                </EvidenceMeta>
                {ev.content && <EvidenceContent>{ev.content}</EvidenceContent>}
              </EvidenceBody>
              <DeleteBtn onClick={() => handleDelete(ev.id)} title="删除">✕</DeleteBtn>
            </EvidenceCard>
          ))
        )}
      </EvidenceList>
    </Shell>
  )
}
