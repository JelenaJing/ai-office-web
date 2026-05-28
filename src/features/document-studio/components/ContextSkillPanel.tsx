import styled from 'styled-components'
import type { DocumentCapability } from '../services/documentCapabilities'
import { getCapabilitiesForContext, NEWS_EXTRA_CAPABILITIES, PAPER_EXTRA_CAPABILITIES } from '../services/documentCapabilities'

const Panel = styled.aside`
  width: 280px;
  flex-shrink: 0;
  border-left: 1px solid #e2e8f0;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

const Header = styled.div`
  padding: 12px 14px;
  font-weight: 600;
  border-bottom: 1px solid #e2e8f0;
`

const List = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const SkillBtn = styled.button<{ $disabled?: boolean }>`
  text-align: left;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #fff;
  cursor: ${p => (p.$disabled ? 'not-allowed' : 'pointer')};
  opacity: ${p => (p.$disabled ? 0.55 : 1)};
  &:hover:not(:disabled) {
    border-color: #3b82f6;
  }
`

const Title = styled.div`
  font-weight: 600;
  font-size: 13px;
  color: #0f172a;
`

const Desc = styled.div`
  font-size: 11px;
  color: #64748b;
  margin-top: 2px;
`

const Pending = styled.span`
  font-size: 10px;
  color: #b45309;
`

interface Props {
  documentType: string
  hasSelection: boolean
  loading?: boolean
  onRun: (capabilityId: string) => void
}

function runnerHint(cap: DocumentCapability): string | null {
  if (cap.id === 'humanize-selection') return '通道：direct-llm（快速）'
  if (cap.id === 'humanize-document-advanced') return '通道：OpenCode + humanizer（深度）'
  if (cap.runner === 'opencode') return '通道：OpenCode Skill'
  if (cap.runner === 'direct-llm') return '通道：direct-llm'
  if (cap.runner === 'pipeline') return '论文 pipeline 待接入'
  return null
}

function renderCap(cap: DocumentCapability, loading: boolean | undefined, onRun: (id: string) => void) {
  const disabled = !cap.enabled || cap.status === 'pending' || loading
  const hint = runnerHint(cap)
  return (
    <SkillBtn
      key={cap.id}
      type="button"
      $disabled={disabled}
      disabled={disabled}
      onClick={() => onRun(cap.id)}
    >
      <Title>
        {cap.label}
        {cap.status === 'pending' ? <Pending> · 待接入</Pending> : null}
      </Title>
      <Desc>
        {cap.description}
        {hint ? ` · ${hint}` : ''}
      </Desc>
    </SkillBtn>
  )
}

export default function ContextSkillPanel({ documentType, hasSelection, loading, onRun }: Props) {
  let caps = getCapabilitiesForContext({ documentType, hasSelection })
  if (documentType === 'news' && hasSelection) caps = [...caps, ...NEWS_EXTRA_CAPABILITIES]
  if (documentType === 'paper') caps = [...caps, ...PAPER_EXTRA_CAPABILITIES]

  return (
    <Panel>
      <Header>{hasSelection ? '选区能力' : '全文能力'}</Header>
      <List>{caps.map(c => renderCap(c, loading, onRun))}</List>
    </Panel>
  )
}
