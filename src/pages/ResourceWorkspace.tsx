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
import { FolderOpen, Sparkles, BookOpen, Download, Trash2, RefreshCw, ExternalLink } from 'lucide-react'
import type { FileEntry } from '../platform'
import { canOpenArtifact, openArtifactLabel } from '../services/openResourceIntent'
import MyFilesView from '../components/resource/MyFilesView'
import RemoteKnowledgePanel from '../components/resource/RemoteKnowledgePanel'
import { platformApi } from '../platform'
import type { Artifact } from '../platform'
import {
  artifactDownloadFilename,
  artifactHasExport,
  artifactTypeLabel,
} from '../utils/artifactDisplay'

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

function ArtifactsTab({ onOpenArtifact }: { onOpenArtifact?: (artifact: Artifact) => void }) {
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [actionBusy, setActionBusy] = useState(false)
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const fetchArtifacts = useCallback(async () => {
    setLoading(true)
    setError(null)
    setDownloadError(null)
    try {
      const list = await platformApi.artifacts.list()
      setArtifacts(list)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '加载失败'
      setError(`加载生成记录失败：${msg}`)
      setArtifacts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchArtifacts() }, [fetchArtifacts])

  useEffect(() => {
    const handler = () => { void fetchArtifacts() }
    window.addEventListener('resource-files-changed', handler)
    return () => window.removeEventListener('resource-files-changed', handler)
  }, [fetchArtifacts])

  const handleDownload = async (artifact: Artifact) => {
    const filename = artifactDownloadFilename(artifact)
    if (!filename) {
      setDownloadError('暂无可下载文件')
      return
    }
    setDownloadError(null)
    setActionBusy(true)
    try {
      await platformApi.artifacts.download(artifact.id, filename)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '下载失败'
      setDownloadError(`下载失败：${msg}`)
    } finally {
      setActionBusy(false)
    }
  }

  const handleDelete = async (artifact: Artifact) => {
    if (!window.confirm(`确定删除「${artifact.title}」？`)) return
    setDeletingId(artifact.id)
    setDownloadError(null)
    try {
      await platformApi.artifacts.delete(artifact.id)
      await fetchArtifacts()
    } catch (err) {
      const msg = err instanceof Error ? err.message : '删除失败'
      setDownloadError(`删除失败：${msg}`)
    } finally {
      setDeletingId(null)
    }
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
        <div style={{ fontSize: 14, color: '#c0392b', maxWidth: 320 }}>{error}</div>
        <button
          type="button"
          onClick={() => void fetchArtifacts()}
          style={{
            marginTop: 8, padding: '8px 16px', borderRadius: 8,
            border: '1px solid #c8d8e8', background: '#fff', cursor: 'pointer',
            fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6,
          }}
        >
          <RefreshCw size={14} /> 重试
        </button>
      </PlaceholderWrap>
    )
  }

  if (artifacts.length === 0) {
    return (
      <PlaceholderWrap>
        <div style={{ fontSize: 36, marginBottom: 8 }}>✨</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#304255' }}>暂无生成记录</div>
        <div style={{ fontSize: 13, color: '#8094a8', maxWidth: 280 }}>
          生成的文稿、PPT、表格分析等会显示在这里（保留 7 天），也可在「我的文件」长期查看。
        </div>
      </PlaceholderWrap>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {downloadError && (
        <div style={{
          flexShrink: 0, padding: '10px 20px', fontSize: 13, color: '#c0392b',
          background: '#fff5f5', borderBottom: '1px solid #f5c6c6',
        }}>
          {downloadError}
        </div>
      )}
      {/* Type filter */}
      <div style={{ flexShrink: 0, padding: '8px 20px', borderBottom: '1px solid #eef2f7', display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: '#8094a8' }}>类型：</span>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          style={{ fontSize: 12, padding: '3px 8px', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', color: '#2d3748', cursor: 'pointer' }}
        >
          <option value="all">全部</option>
          {Array.from(new Set(artifacts.map(a => a.type))).sort().map(t => (
            <option key={t} value={t}>{artifactTypeLabel(t)}</option>
          ))}
        </select>
        <span style={{ fontSize: 12, color: '#a0aec0', marginLeft: 4 }}>
          {typeFilter === 'all' ? artifacts.length : artifacts.filter(a => a.type === typeFilter).length} 条
        </span>
      </div>
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
            {artifacts.filter(a => typeFilter === 'all' || a.type === typeFilter).map((a) => {
              const canDownload = artifactHasExport(a)
              const canOpen = canOpenArtifact(a)
              return (
                <tr key={a.id} style={{ borderBottom: '1px solid #f0f4f8' }}>
                  <td style={{ padding: '10px 20px' }}>
                    <div style={{ fontSize: 13, color: '#1a2f47', fontWeight: 500 }}>
                      {a.title}
                    </div>
                  </td>
                  <td style={{ padding: '10px 20px', fontSize: 12, color: '#627385', whiteSpace: 'nowrap' }}>
                    {artifactTypeLabel(a.type)}
                  </td>
                  <td style={{ padding: '10px 20px', fontSize: 12, color: '#627385', whiteSpace: 'nowrap' }}>
                    {fmtDate(a.createdAt)}
                  </td>
                  <td style={{ padding: '10px 20px' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {canOpen && onOpenArtifact ? (
                        <button
                          type="button"
                          onClick={() => onOpenArtifact(a)}
                          disabled={actionBusy}
                          title={openArtifactLabel(a)}
                          style={{
                            height: 30, padding: '0 10px', border: '1px solid #b8d4f0',
                            borderRadius: 6, background: '#f0f7ff',
                            cursor: actionBusy ? 'not-allowed' : 'pointer',
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            fontSize: 12, color: '#1f6fd6', fontWeight: 600,
                            opacity: actionBusy ? 0.6 : 1,
                          }}
                        >
                          <ExternalLink size={13} />
                          {openArtifactLabel(a)}
                        </button>
                      ) : null}
                      {canDownload ? (
                        <button
                          type="button"
                          onClick={() => void handleDownload(a)}
                          disabled={actionBusy}
                          title="下载"
                          style={{
                            width: 30, height: 30, border: '1px solid #c8d8e8',
                            borderRadius: 6, background: '#fff',
                            cursor: actionBusy ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            opacity: actionBusy ? 0.6 : 1,
                          }}
                        >
                          <Download size={13} color="#4a7fb5" />
                        </button>
                      ) : (
                        <span style={{ fontSize: 11, color: '#9aabb8' }}>暂无可下载文件</span>
                      )}
                      <button
                        type="button"
                        onClick={() => void handleDelete(a)}
                        disabled={deletingId === a.id}
                        title="删除"
                        style={{
                          width: 30, height: 30, border: '1px solid #e8c8c8',
                          borderRadius: 6, background: '#fff',
                          cursor: deletingId === a.id ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          opacity: deletingId === a.id ? 0.6 : 1,
                        }}
                      >
                        <Trash2 size={13} color="#c0392b" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface ResourceWorkspaceProps {
  onGoToWorkspace?: () => void
  onOpenFile?: (file: FileEntry) => void
  onOpenArtifact?: (artifact: Artifact) => void
}

export default function ResourceWorkspace({ onOpenFile, onOpenArtifact }: ResourceWorkspaceProps) {
  const [tab, setTab] = useState<ResourceTab>('files')

  return (
    <Page>
      <PageHeader>
        <PageTitle>资源中心</PageTitle>
        <PageSubtitle>管理上传文件与 AI 生成结果。生成记录保留 7 天；DOCX/PPT 等成品会同步到「我的文件」。</PageSubtitle>
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
        {tab === 'files' && <MyFilesView fullHeight onOpenFile={onOpenFile} />}

        {tab === 'artifacts' && <ArtifactsTab onOpenArtifact={onOpenArtifact} />}

        {tab === 'kb' && <RemoteKnowledgePanel />}
      </PanelArea>
    </Page>
  )
}
