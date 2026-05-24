/**
 * @deprecated 不再作为 data 面板入口。Web 数据分析使用 ExcelAnalysisWorkbench + platformApi.excel.analyze。
 * 保留本文件以免破坏构建引用；请勿在 WorkspaceViewportHost 中挂载。
 */

import { useCallback, useEffect, useState } from 'react'
import styled from 'styled-components'
import { BarChart2, Download, FileSpreadsheet, Sparkles } from 'lucide-react'
import { useWorkspace } from '../../../contexts/WorkspaceContext'
import { platformApi } from '../../../platform'
import type { Artifact, FileEntry } from '../../../platform'
import {
  artifactDownloadFilename,
  artifactHasExport,
} from '../../../utils/artifactDisplay'

const SPREADSHEET_EXTS = new Set(['xlsx', 'csv'])

function isSpreadsheetFile(f: FileEntry): boolean {
  return SPREADSHEET_EXTS.has(f.ext.toLowerCase())
}

const Wrap = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 48px 32px 32px;
  background: linear-gradient(180deg, #f7fafd 0%, #eef4f9 100%);
  overflow-y: auto;
`

const Card = styled.div`
  width: 100%;
  max-width: 680px;
  background: #ffffff;
  border: 1px solid #e2eaf5;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(20, 40, 80, 0.07);
  overflow: hidden;
`

const CardHeader = styled.div`
  padding: 24px 28px 20px;
  border-bottom: 1px solid #f0f4f8;
  background: #fafdff;
`

const CardTitle = styled.h2`
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 800;
  color: #1a2f47;
  display: flex;
  align-items: center;
  gap: 8px;
`

const CardSubtitle = styled.p`
  margin: 0;
  font-size: 13px;
  color: #6b84a0;
  line-height: 1.5;
`

const CardBody = styled.div`
  padding: 24px 28px 28px;
  display: flex;
  flex-direction: column;
  gap: 18px;
`

const FieldLabel = styled.label`
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: #4a5f73;
  margin-bottom: 7px;
`

const Select = styled.select`
  width: 100%;
  box-sizing: border-box;
  padding: 10px 14px;
  border: 1px solid #c8d8e8;
  border-radius: 8px;
  font-size: 14px;
  color: #1a2f47;
  background: #fff;
`

const TextArea = styled.textarea`
  width: 100%;
  box-sizing: border-box;
  padding: 10px 14px;
  border: 1px solid #c8d8e8;
  border-radius: 8px;
  font-size: 13px;
  color: #1a2f47;
  resize: vertical;
  min-height: 100px;
  line-height: 1.65;
`

const ErrorBox = styled.div`
  padding: 10px 14px;
  border-radius: 8px;
  background: #fff0f0;
  color: #c0392b;
  font-size: 13px;
  line-height: 1.5;
`

const HintBox = styled.div`
  padding: 12px 14px;
  border-radius: 8px;
  background: #f0f7ff;
  color: #3a6fa0;
  font-size: 13px;
  line-height: 1.6;
`

const PrimaryBtn = styled.button<{ $disabled?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 11px 22px;
  background: ${p => (p.$disabled ? '#8ca8c8' : '#00897b')};
  color: #fff;
  border: none;
  border-radius: 9px;
  font-size: 14px;
  font-weight: 700;
  cursor: ${p => (p.$disabled ? 'not-allowed' : 'pointer')};
  align-self: flex-end;
`

const SuccessCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 32px 24px;
  text-align: center;
`

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export default function WebExcelAnalysisPanel() {
  const { activeWorkspacePath } = useWorkspace()
  const [files, setFiles] = useState<FileEntry[]>([])
  const [filesLoading, setFilesLoading] = useState(true)
  const [filesError, setFilesError] = useState<string | null>(null)
  const [fileId, setFileId] = useState('')
  const [prompt, setPrompt] = useState(
    '分析这个表格的整体情况，指出缺失值、异常值和主要趋势。',
  )
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [artifact, setArtifact] = useState<Artifact | null>(null)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [summary, setSummary] = useState('')

  const spreadsheetFiles = files.filter(isSpreadsheetFile)

  const loadFiles = useCallback(async () => {
    setFilesLoading(true)
    setFilesError(null)
    try {
      const list = await platformApi.files.list()
      setFiles(list)
      const sheets = list.filter(isSpreadsheetFile)
      if (sheets.length > 0 && !fileId) {
        setFileId(sheets[0].id)
      }
    } catch (err) {
      setFilesError(err instanceof Error ? err.message : '加载文件列表失败')
    } finally {
      setFilesLoading(false)
    }
  }, [fileId])

  useEffect(() => {
    void loadFiles()
  }, [loadFiles])

  const handleAnalyze = async () => {
    if (!activeWorkspacePath) {
      setError('正在初始化工作空间，请稍后重试。')
      return
    }
    if (!fileId) {
      setError('请选择要分析的表格文件')
      return
    }
    setAnalyzing(true)
    setError(null)
    setDownloadError(null)
    setArtifact(null)
    setImageUrls([])
    setSummary('')
    try {
      const result = await platformApi.excel.analyze({
        fileId,
        prompt: prompt.trim() || undefined,
        workspacePath: activeWorkspacePath,
      })
      const art = result.artifact
      if (art) {
        if (!artifactHasExport(art)) {
          setError('分析完成但暂无可下载文件')
          return
        }
        setArtifact(art)
        setImageUrls(result.imageUrls || (Array.isArray(art.metadata?.imageUrls) ? art.metadata.imageUrls.map(String) : []))
        setSummary(result.summary || (typeof art.metadata?.summary === 'string' ? art.metadata.summary : ''))
        return
      }
      const list = await platformApi.artifacts.list()
      const found = list.find((a) => a.id === result.artifactId)
      if (!found || !artifactHasExport(found)) {
        setError('分析完成但未找到可下载的生成记录')
        return
      }
      setArtifact(found)
      setImageUrls(Array.isArray(found.metadata?.imageUrls) ? found.metadata.imageUrls.map(String) : [])
      setSummary(typeof found.metadata?.summary === 'string' ? found.metadata.summary : '')
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失败，请重试')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleDownload = async () => {
    if (!artifact) return
    const filename = artifactDownloadFilename(artifact)
    if (!filename) {
      setDownloadError('暂无可下载文件')
      return
    }
    setDownloadError(null)
    try {
      await platformApi.artifacts.download(artifact.id, filename)
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : '下载失败')
    }
  }

  const handleReset = () => {
    setArtifact(null)
    setImageUrls([])
    setSummary('')
    setError(null)
    setDownloadError(null)
  }

  if (artifact) {
    return (
      <Wrap>
        <Card>
          <CardBody>
            <SuccessCard>
              <div style={{ fontSize: 42 }}>✅</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#1a2f47' }}>
                {artifact.title}
              </div>
              <div style={{ fontSize: 12, color: '#8094a8' }}>
                生成时间：{fmtDate(artifact.createdAt)}
              </div>
              <div style={{ fontSize: 12, color: '#8094a8' }}>
                可在 <strong>资源中心 › 生成记录</strong> 查看（类型：表格分析）。
              </div>
              {summary ? (
                <div style={{ fontSize: 12, color: '#4b647a', lineHeight: 1.6 }}>
                  {summary}
                </div>
              ) : null}
              {imageUrls.length > 0 ? (
                <div data-testid="data-analysis-image-results" style={{ display: 'grid', gap: 8, width: '100%' }}>
                  {imageUrls.map((url, index) => (
                    <img
                      key={`${url}-${index}`}
                      src={url}
                      alt={`服务器生成图表 ${index + 1}`}
                      style={{ width: '100%', border: '1px solid #d8e3ef', borderRadius: 12, background: '#f8fafc' }}
                    />
                  ))}
                </div>
              ) : null}
              {downloadError && <ErrorBox>{downloadError}</ErrorBox>}
              {artifactHasExport(artifact) ? (
                <PrimaryBtn onClick={() => void handleDownload()}>
                  <Download size={15} /> 下载分析报告
                </PrimaryBtn>
              ) : (
                <ErrorBox>暂无可下载文件</ErrorBox>
              )}
              <PrimaryBtn
                $disabled={false}
                onClick={handleReset}
                style={{ background: '#f0f5fb', color: '#304255' }}
              >
                <Sparkles size={14} /> 再分析一份
              </PrimaryBtn>
            </SuccessCard>
          </CardBody>
        </Card>
      </Wrap>
    )
  }

  return (
    <Wrap>
      <Card>
        <CardHeader>
          <CardTitle>
            <BarChart2 size={18} color="#00897b" />
            数据分析
          </CardTitle>
          <CardSubtitle>
            选择已上传的 xlsx / csv 文件，生成 Markdown 分析报告并保存到生成记录。
          </CardSubtitle>
        </CardHeader>

        <CardBody>
          {error && <ErrorBox>{error}</ErrorBox>}

          {filesLoading && (
            <HintBox>正在加载「我的文件」中的表格…</HintBox>
          )}

          {filesError && <ErrorBox>{filesError}</ErrorBox>}

          {!filesLoading && !filesError && spreadsheetFiles.length === 0 && (
            <HintBox>
              <FileSpreadsheet size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              暂无 xlsx / csv 文件。请先到 <strong>资源中心 › 我的文件</strong> 上传表格后再分析。
            </HintBox>
          )}

          {spreadsheetFiles.length > 0 && (
            <>
              <div>
                <FieldLabel>选择表格文件</FieldLabel>
                <Select
                  value={fileId}
                  onChange={(e) => setFileId(e.target.value)}
                  disabled={analyzing}
                >
                  {spreadsheetFiles.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({(f.size / 1024).toFixed(1)} KB)
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <FieldLabel>分析需求</FieldLabel>
                <TextArea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={analyzing}
                  placeholder="描述你希望重点分析的内容…"
                />
              </div>

              <PrimaryBtn
                onClick={() => void handleAnalyze()}
                disabled={analyzing || !fileId}
                $disabled={analyzing || !fileId}
              >
                <Sparkles size={14} />
                {analyzing ? '正在分析表格…' : '开始分析'}
              </PrimaryBtn>

              <HintBox>
                分析结果将保存为 <strong>表格分析</strong> 类型，可在资源中心 › 生成记录下载
                <code>analysis.md</code>。
              </HintBox>
            </>
          )}
        </CardBody>
      </Card>
    </Wrap>
  )
}
