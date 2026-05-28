import { useRef, useState, useEffect } from 'react'
import styled from 'styled-components'
import { ArrowLeft, ChevronDown, PanelLeft, PanelRight } from 'lucide-react'

const Bar = styled.div`
  flex-shrink: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  min-height: 52px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
`

const BarGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
`

const BarSpacer = styled.div`
  flex: 1;
  min-width: 12px;
`

const BackBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: none;
  color: #64748b;
  font-size: 13px;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 6px;
  &:hover {
    background: #f1f5f9;
    color: #0f172a;
  }
`

const TitleInput = styled.input`
  flex: 1;
  min-width: 120px;
  max-width: 360px;
  height: 36px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #0f172a;
  font-size: 14px;
  font-weight: 600;
`

const IconBtn = styled.button<{ $active?: boolean }>`
  height: 34px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid ${p => (p.$active ? '#bfdbfe' : '#e2e8f0')};
  background: ${p => (p.$active ? '#eff6ff' : '#fff')};
  color: #475569;
  font-size: 13px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  &:hover {
    border-color: #cbd5e1;
  }
`

const PrimaryBtn = styled.button`
  height: 34px;
  padding: 0 14px;
  border-radius: 8px;
  border: none;
  background: #2563eb;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  &:hover {
    background: #1d4ed8;
  }
`

const MenuWrap = styled.div`
  position: relative;
`

const Menu = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  min-width: 180px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
  padding: 6px;
  z-index: 30;
`

const MenuItem = styled.button<{ $disabled?: boolean }>`
  display: block;
  width: 100%;
  text-align: left;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  background: none;
  font-size: 13px;
  color: ${p => (p.$disabled ? '#94a3b8' : '#334155')};
  cursor: ${p => (p.$disabled ? 'not-allowed' : 'pointer')};
  &:hover:not(:disabled) {
    background: #f1f5f9;
  }
`

const MenuHint = styled.span`
  float: right;
  font-size: 11px;
  color: #b45309;
`

interface Props {
  title: string
  onTitleChange: (title: string) => void
  onBack: () => void
  onNewDocument: () => void
  onGoHome: () => void
  onFullDocumentHumanize?: () => void
  onSave: () => void
  onExport: (format: 'markdown' | 'html' | 'docx') => void
  outlineOpen: boolean
  onToggleOutline: () => void
  panelOpen: boolean
  onTogglePanel: () => void
  statusMsg?: string
}

export default function DocumentStudioToolbar({
  title,
  onTitleChange,
  onBack,
  onNewDocument,
  onGoHome,
  onFullDocumentHumanize,
  onSave,
  onExport,
  outlineOpen,
  onToggleOutline,
  panelOpen,
  onTogglePanel,
  statusMsg,
}: Props) {
  const [exportOpen, setExportOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setExportOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <Bar>
      <BarGroup>
        <BackBtn type="button" onClick={onBack}>
          <ArrowLeft size={16} /> 返回
        </BackBtn>
        <IconBtn type="button" onClick={onNewDocument}>
          新建
        </IconBtn>
        <IconBtn type="button" onClick={onGoHome}>
          首页
        </IconBtn>
        {onFullDocumentHumanize ? (
          <IconBtn type="button" onClick={onFullDocumentHumanize}>
            全文改写
          </IconBtn>
        ) : null}
      </BarGroup>
      <TitleInput value={title} onChange={e => onTitleChange(e.target.value)} placeholder="文稿标题" />
      <BarGroup>
        <PrimaryBtn type="button" onClick={onSave}>
          保存
        </PrimaryBtn>
        <MenuWrap ref={menuRef}>
          <IconBtn type="button" onClick={() => setExportOpen(v => !v)}>
            导出 <ChevronDown size={14} />
          </IconBtn>
          {exportOpen ? (
            <Menu>
              <MenuItem type="button" onClick={() => { onExport('markdown'); setExportOpen(false) }}>
                导出 Markdown
              </MenuItem>
              <MenuItem type="button" onClick={() => { onExport('html'); setExportOpen(false) }}>
                导出 HTML
              </MenuItem>
              <MenuItem type="button" onClick={() => { onExport('docx'); setExportOpen(false) }}>
                导出 Word
              </MenuItem>
              <MenuItem type="button" $disabled disabled>
                导出 PDF <MenuHint>待接入</MenuHint>
              </MenuItem>
            </Menu>
          ) : null}
        </MenuWrap>
        <IconBtn type="button" $active={outlineOpen} onClick={onToggleOutline} title="大纲">
          <PanelLeft size={16} /> 大纲
        </IconBtn>
        <IconBtn type="button" $active={panelOpen} onClick={onTogglePanel} title="AI 助手">
          <PanelRight size={16} /> AI
        </IconBtn>
      </BarGroup>
      {statusMsg ? (
        <>
          <BarSpacer />
          <span style={{ fontSize: 12, color: '#64748b', flex: '1 1 100%' }}>{statusMsg}</span>
        </>
      ) : null}
    </Bar>
  )
}
