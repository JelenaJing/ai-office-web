import { useMemo, useState } from 'react'
import styled from 'styled-components'
import { BookOpen, Search, X } from 'lucide-react'
import type { KnowledgeSourceListItem } from '../../../platform'

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.38);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
`

const Card = styled.div`
  width: min(720px, calc(100vw - 40px));
  max-height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.18);
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px 12px;
  border-bottom: 1px solid #e6edf5;
`

const Title = styled.h3`
  margin: 0;
  font-size: 15px;
  color: #1d3650;
`

const CloseButton = styled.button`
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #70859a;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`

const SearchRow = styled.div`
  padding: 12px 18px;
  border-bottom: 1px solid #eef3f8;
  position: relative;
`

const SearchIcon = styled.div`
  position: absolute;
  left: 28px;
  top: 50%;
  transform: translateY(-50%);
  color: #92a4b5;
`

const SearchInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px 10px 34px;
  border: 1px solid #d8e3ef;
  border-radius: 10px;
  font-size: 13px;
  color: #1f3347;
  outline: none;
`

const Body = styled.div`
  flex: 1;
  overflow: auto;
  padding: 14px 18px;
  display: grid;
  gap: 10px;
`

const Hint = styled.div`
  font-size: 12px;
  color: #6e8296;
  line-height: 1.6;
`

const Row = styled.label<{ $selected: boolean }>`
  display: grid;
  gap: 6px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid ${({ $selected }) => ($selected ? '#9ebef0' : '#dce6f0')};
  background: ${({ $selected }) => ($selected ? '#f5f9ff' : '#fff')};
  cursor: pointer;
`

const RowTop = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`

const RowTitle = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: #294662;
  flex: 1;
`

const Meta = styled.div`
  font-size: 12px;
  color: #72869a;
  line-height: 1.6;
`

const ProviderPill = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  background: #e8efff;
  color: #2c55b8;
  font-size: 11px;
  font-weight: 700;
`

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  border-top: 1px solid #e6edf5;
`

const FooterButtons = styled.div`
  display: flex;
  gap: 8px;
`

const GhostButton = styled.button`
  height: 34px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid #d7e1ec;
  background: #fff;
  color: #334f69;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
`

const PrimaryButton = styled(GhostButton)`
  border-color: #2f67c8;
  background: #2f67c8;
  color: #fff;
`

interface DocumentKnowledgeSourcePickerProps {
  sources: KnowledgeSourceListItem[]
  selectedIds: string[]
  loading?: boolean
  onApply: (ids: string[]) => void
  onClose: () => void
}

export function DocumentKnowledgeSourcePicker({
  sources,
  selectedIds,
  loading,
  onApply,
  onClose,
}: DocumentKnowledgeSourcePickerProps) {
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState(() => new Set(selectedIds))

  const remoteSources = useMemo(() => {
    const query = search.trim().toLowerCase()
    return sources
      .filter((source) => source.provider === 'remote')
      .filter((source) => {
        if (!query) return true
        const departmentName = typeof source.metadata?.departmentName === 'string' ? source.metadata.departmentName : ''
        return `${source.title} ${departmentName}`.toLowerCase().includes(query)
      })
      .sort((left, right) => {
        const updatedDiff = new Date(right.updatedAt || 0).getTime() - new Date(left.updatedAt || 0).getTime()
        if (updatedDiff !== 0) return updatedDiff
        return left.title.localeCompare(right.title, 'zh-Hans-CN')
      })
  }, [search, sources])

  return (
    <Overlay onClick={onClose}>
      <Card onClick={(event) => event.stopPropagation()}>
        <Header>
          <Title>选择远端知识库文档</Title>
          <CloseButton type="button" onClick={onClose}>
            <X size={16} />
          </CloseButton>
        </Header>
        <SearchRow>
          <SearchIcon><Search size={14} /></SearchIcon>
          <SearchInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="搜索文档标题或所属知识库…"
            autoFocus
          />
        </SearchRow>
        <Body>
          <Hint>工作区附件仍通过下方“添加附件”维护；这里仅选择远端知识库文档。</Hint>
          {loading ? <Hint>正在加载远端知识库文档…</Hint> : null}
          {!loading && remoteSources.length === 0 ? <Hint>当前没有可选的远端知识库文档。</Hint> : null}
          {remoteSources.map((source) => (
            <Row key={source.id} $selected={draft.has(source.id)}>
              <RowTop>
                <input
                  type="checkbox"
                  checked={draft.has(source.id)}
                  onChange={() => {
                    setDraft((prev) => {
                      const next = new Set(prev)
                      if (next.has(source.id)) next.delete(source.id)
                      else next.add(source.id)
                      return next
                    })
                  }}
                />
                <ProviderPill><BookOpen size={12} />远端知识库</ProviderPill>
                <RowTitle>{source.title}</RowTitle>
              </RowTop>
              <Meta>
                所属：{typeof source.metadata?.departmentName === 'string' ? source.metadata.departmentName : (typeof source.metadata?.departmentId === 'string' ? source.metadata.departmentId : '远端知识库')}
                {' · '}
                sourceId：{source.id}
                {' · '}
                trustLevel：{source.trustLevel}
              </Meta>
            </Row>
          ))}
        </Body>
        <Footer>
          <Hint>{draft.size > 0 ? `已选择 ${draft.size} 个远端来源` : '未选择远端来源'}</Hint>
          <FooterButtons>
            <GhostButton type="button" onClick={() => setDraft(new Set())}>清空</GhostButton>
            <GhostButton type="button" onClick={onClose}>取消</GhostButton>
            <PrimaryButton type="button" onClick={() => onApply(Array.from(draft))}>确认</PrimaryButton>
          </FooterButtons>
        </Footer>
      </Card>
    </Overlay>
  )
}
