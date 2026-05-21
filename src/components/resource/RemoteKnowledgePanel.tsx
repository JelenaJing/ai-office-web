import { useState } from 'react'
import styled from 'styled-components'
import { BookOpen, RefreshCw, Upload } from 'lucide-react'
import { useDepartment } from '../../contexts/DepartmentContext'
import { DepartmentSelector } from '../DepartmentSelector'
import { isWebShim } from '../../platform/detect'

// ---------------------------------------------------------------------------
// Styled components
// ---------------------------------------------------------------------------

const Wrap = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: linear-gradient(180deg, #fafeff 0%, #f3f7fb 100%);
`

const Header = styled.div`
  padding: 14px 16px 10px;
  border-bottom: 1px solid #e4ecf5;
  flex-shrink: 0;
`

const HeaderTop = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
`

const HeaderTitle = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: #1f3044;
  display: flex;
  align-items: center;
  gap: 7px;
`

const Badge = styled.span<{ $ok?: boolean; $warn?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  background: ${p => (p.$ok ? '#e6f4ea' : p.$warn ? '#fff3cd' : '#fdecea')};
  color: ${p => (p.$ok ? '#1a7a4a' : p.$warn ? '#856404' : '#a94442')};
  flex-shrink: 0;
`

const StatusDot = styled.span<{ $ok?: boolean; $warn?: boolean }>`
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${p => (p.$ok ? '#2d9e6b' : p.$warn ? '#e8a020' : '#d9534f')};
  flex-shrink: 0;
`

const SubTitle = styled.div`
  font-size: var(--font-size-xs);
  color: #6b84a0;
  line-height: 1.5;
`

const Body = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px 14px;
`

const Footer = styled.div`
  padding: 10px 14px;
  border-top: 1px solid #e4ecf5;
  flex-shrink: 0;
`

const UploadButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 8px 0;
  border: none;
  border-radius: 6px;
  background: #e8f0fe;
  color: #1a56db;
  font-size: var(--font-size-xs);
  font-weight: 500;
  cursor: not-allowed;
  opacity: 0.55;
`

const UploadNote = styled.div`
  margin-top: 6px;
  font-size: var(--font-size-xs);
  color: #8094a8;
  text-align: center;
  line-height: 1.5;
`

const StateWrap = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 32px 24px;
  text-align: center;
`

const StateIcon = styled.div`
  font-size: 36px;
  opacity: 0.4;
`

const StateTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #304255;
`

const StateDesc = styled.p`
  margin: 0;
  font-size: var(--font-size-xs);
  color: #7a91a8;
  line-height: 1.6;
  max-width: 300px;
`

const RetryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 7px;
  border: 1px solid #c8d6e6;
  background: #ffffff;
  color: #304255;
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  &:hover { background: #f0f6ff; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`

// ---------------------------------------------------------------------------

export default function RemoteKnowledgePanel() {
  const { departments, selectedDepartmentId, loading, error, errorKind, refresh } = useDepartment()
  const [retrying, setRetrying] = useState(false)
  const webMode = isWebShim()

  const handleRetry = async () => {
    setRetrying(true)
    try {
      await refresh()
    } finally {
      setRetrying(false)
    }
  }

  const connected = !loading && !error && departments.length > 0
  const emptyDepartments = !loading && !error && departments.length === 0 && errorKind === 'empty'

  let badgeLabel = '检测中…'
  let badgeOk = false
  let badgeWarn = false
  if (!loading) {
    if (errorKind === 'auth') {
      badgeLabel = '登录异常'
    } else if (errorKind === 'connection') {
      badgeLabel = '连接失败'
    } else if (emptyDepartments) {
      badgeLabel = '暂无部门'
      badgeWarn = true
    } else if (connected) {
      badgeLabel = '已连接'
      badgeOk = true
    }
  }

  const showBrowse = connected || emptyDepartments

  return (
    <Wrap>
      <Header>
        <HeaderTop>
          <HeaderTitle>
            <BookOpen size={15} />
            远程知识库
          </HeaderTitle>
          <Badge $ok={badgeOk} $warn={badgeWarn}>
            <StatusDot $ok={badgeOk} $warn={badgeWarn} />
            {badgeLabel}
          </Badge>
        </HeaderTop>
        <SubTitle>
          {webMode
            ? 'Web 版知识库上传将在后续接入，目前可浏览远程知识库资料。'
            : '来自服务器的部门共享知识库，可供团队协作使用。'}
        </SubTitle>
      </Header>

      {loading && (
        <StateWrap>
          <StateDesc>正在连接远程知识库…</StateDesc>
        </StateWrap>
      )}

      {!loading && errorKind === 'auth' && (
        <StateWrap>
          <StateIcon>🔐</StateIcon>
          <StateTitle>登录状态异常</StateTitle>
          <StateDesc>{error ?? '请退出后重新登录，再打开知识库资料。'}</StateDesc>
        </StateWrap>
      )}

      {!loading && errorKind === 'connection' && (
        <StateWrap>
          <StateIcon>☁️</StateIcon>
          <StateTitle>连接失败</StateTitle>
          <StateDesc>
            {error ?? '无法连接远程知识库服务，请检查网络或联系管理员。'}
          </StateDesc>
          <RetryButton onClick={() => void handleRetry()} disabled={retrying}>
            <RefreshCw size={13} />
            {retrying ? '重试中…' : '重新连接'}
          </RetryButton>
        </StateWrap>
      )}

      {showBrowse && (
        <>
          <Body>
            {emptyDepartments && (
              <StateDesc style={{ marginBottom: 12, textAlign: 'left' }}>
                远程知识库已连接，但当前暂无部门分区。请联系管理员创建知识库分区。
              </StateDesc>
            )}
            <DepartmentSelector />
          </Body>

          <Footer>
            <UploadButton
              type="button"
              disabled
              title="Web 版知识库上传将在后续接入，目前可浏览远程知识库资料。"
            >
              <Upload size={13} />
              上传功能暂未开放
            </UploadButton>
            <UploadNote title="Web 版知识库上传将在后续接入，目前可浏览远程知识库资料。">
              Web 版知识库上传将在后续接入，目前可浏览远程知识库资料。
            </UploadNote>
          </Footer>
        </>
      )}
    </Wrap>
  )
}
