/**
 * ResourceWorkspace — 资源中心
 *
 * Tabs:
 *   1. 我的文件 — uploaded files via platformApi.files
 *   2. 生成记录 — AI-generated artifacts via platformApi.artifacts
 *   3. 知识库资料 — placeholder for future KB integration
 *
 * Internal workspace paths are never shown to the user.
 */

import { useCallback, useEffect, useState } from 'react'
import styled from 'styled-components'
import { FolderOpen, Sparkles, BookOpen, Download } from 'lucide-react'
import MyFilesView from '../components/resource/MyFilesView'
import RemoteKnowledgePanel from '../components/resource/RemoteKnowledgePanel'
import { platformApi } from '../platform'
import type { Artifact } from '../platform'

// ── Types ─────────────────────────────────────────────────────────────────────

type ResourceTab = 'files' | 'artifacts' | 'kb'

// ── Styled components ─────────────────────────────────────────────────────────

const Page = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: #f4f7fc;
`

const PageHeader = styled.div`
  padding: 20px 28px 0;
  flex-shrink: 0;
`

const PageTitle = styled.h1`
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 800;
  color: #1a2f47;
`

const PageSubtitle = styled.p`
  margin: 0 0 16px;
  font-size: var(--font-size-xs);
  color: #6b7f94;
`

const TabBar = styled.div`
  display: flex;
  align-items: center;
  gap: 0;
  padding: 0 28px;
  border-bottom: 1px solid #dde3ec;
  background: #f4f7fc;
  flex-shrink: 0;
`

const Tab = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  border: none;
  border-bottom: 2px solid ${p => p.$active ? '#1f6fd6' : 'transparent'};
  background: transparent;
  color: ${p => p.$active ? '#1f6fd6' : '#4a5f73'};
  font-size: var(--font-size-xs);
  font-weight: ${p => p.$active ? '700' : '500'};
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
  &:hover { color: #1f6fd6; }
`

const PanelArea = styled.div`
  flex: 1;
  min-height: 0;
  background: #ffffff;
  margin: 12px 28px 20px;
  border: 1px solid #e2e8f2;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`

const PlaceholderWrap = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  gap: 12px;
  text-align: center;
  color: #7a91a8;
`

// ── ArtifactsTab ──────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return iso }
}

function ArtifactsTab() {
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchArtifacts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await platformApi.artifacts.list()
      setArtifacts(list)
    } catch {
      setError('加载生成记录失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchArtifacts() }, [fetchArtifacts])

  const handleDownload = (artifact: Artifact) => {
    void platformApi.artifacts.download(artifact.id, `${artifact.title}.docx`)
  }

  if (loading) {
    return (
      <PlaceholderWrap>
        <div style={{ fontSize: 14, color: '#8094a8' }}>加载中…</div>
      </PlaceholderWrap>
    )
  }

  if (error) {
    return (
      <PlaceholderWrap>
        <div style={{ fontSize: 14, color: '#c0392b' }}>{error}</div>
      </PlaceholderWrap>
    )
  }

  if (artifacts.length === 0) {
    return (
      <PlaceholderWrap>
        <div style={{ fontSize: 36, marginBottom: 8 }}>✨</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#304255' }}>暂无生成记录</div>
        <div style={{ fontSize: 13, color: '#8094a8', maxWidth: 280 }}>
          生成的文稿、表格分析结果会显示在这里，可以直接下载使用。
        </div>
      </PlaceholderWrap>
    )
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f7fafd', position: 'sticky', top: 0 }}>
            {(['标题', '类型', '生成时间', '操作'] as const).map((h) => (
              <th key={h} style={{
                textAlign: 'left', padding: '8px 20px',
                fontSize: 11, fontWeight: 700, color: '#8094a8',
                textTransform: 'uppercase', letterSpacing: '0.06em',
                borderBottom: '1px solid #e8eef5',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {artifacts.map((a) => (
            <tr key={a.id} style={{ borderBottom: '1px solid #f0f4f8' }}>
              <td style={{ padding: '10px 20px' }}>
                <div style={{ fontSize: 13, color: '#1a2f47', fontWeight: 500 }}>
                  {a.title}
                </div>
              </td>
              <td style={{ padding: '10px 20px', fontSize: 12, color: '#627385', whiteSpace: 'nowrap' }}>
                {a.type === 'document' ? '文稿' : a.type}
              </td>
              <td style={{ padding: '10px 20px', fontSize: 12, color: '#627385', whiteSpace: 'nowrap' }}>
                {fmtDate(a.createdAt)}
              </td>
              <td style={{ padding: '10px 20px' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleDownload(a)}
                    title="下载"
                    style={{
                      width: 30, height: 30, border: '1px solid #c8d8e8',
                      borderRadius: 6, background: '#fff', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Download size={13} color="#4a7fb5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface ResourceWorkspaceProps {
  onGoToWorkspace?: () => void
}

export default function ResourceWorkspace(_props: ResourceWorkspaceProps) {
  const [tab, setTab] = useState<ResourceTab>('files')

  return (
    <Page>
      <PageHeader>
        <PageTitle>资源中心</PageTitle>
        <PageSubtitle>管理你的上传文件、AI 生成结果和知识库资料</PageSubtitle>
      </PageHeader>

      <TabBar>
        <Tab $active={tab === 'files'} onClick={() => setTab('files')}>
          <FolderOpen size={14} /> 我的文件
        </Tab>
        <Tab $active={tab === 'artifacts'} onClick={() => setTab('artifacts')}>
          <Sparkles size={14} /> 生成记录
        </Tab>
        <Tab $active={tab === 'kb'} onClick={() => setTab('kb')}>
          <BookOpen size={14} /> 知识库资料
        </Tab>
      </TabBar>

      <PanelArea>
        {tab === 'files' && <MyFilesView fullHeight />}

        {tab === 'artifacts' && <ArtifactsTab />}

        {tab === 'kb' && <RemoteKnowledgePanel />}
      </PanelArea>
    </Page>
  )
}
