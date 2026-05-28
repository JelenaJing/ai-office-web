import React, { useCallback, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { useWorkspace } from '../../../contexts/WorkspaceContext'
import { useGenerationWorkbench } from '../../../contexts/GenerationWorkbenchContext'
import { toFileUrl } from '../../../shared/url/fileUrlHelper'
import { listPlotDataModels, type PlotDataModelOption } from '../../../modules/plot/services/PlotService'
import { isWebShim } from '../../../platform/detect'
import { platformApi } from '../../../platform'
import type { Artifact, FileEntry } from '../../../platform'
import {
  artifactDownloadFilename,
  artifactHasExport,
} from '../../../utils/artifactDisplay'
import { AssistantMarkdown } from '../../../modules/materials-research/components/assistant/AssistantMarkdown'

// ─── Python env state machine ─────────────────────────────────────────────────
type PythonEnvState = 'idle' | 'checking' | 'installing' | 'rebuilding' | 'ready' | 'failed'

const WEB_ENV_BANNER = {
  bg: '#eff6ff',
  color: '#1d4ed8',
  text: () => 'Web 版由服务器执行，无需本机 Python 环境',
}

const SPREADSHEET_EXTS = new Set(['xlsx', 'csv', 'xls'])
const BATTERY_LIFE_MODEL_ID = 'battery_life_prediction_a'

function isSpreadsheetEntry(f: FileEntry): boolean {
  return SPREADSHEET_EXTS.has(f.ext.toLowerCase())
}

const ENV_BANNER: Record<PythonEnvState, { bg: string; color: string; text: (msg?: string) => string }> = {
  idle:       { bg: '#f1f5f9', color: '#475569', text: () => '未检测到 Python 环境，点击「开始分析」时将自动安装。' },
  checking:   { bg: '#eff6ff', color: '#1d4ed8', text: () => '正在检查 Python 运行环境…' },
  installing: { bg: '#fff7ed', color: '#c2410c', text: () => '正在安装 Python 依赖，首次运行可能需要几分钟…' },
  rebuilding: { bg: '#fef9c3', color: '#92400e', text: () => 'Python 环境异常，正在重建缓存…' },
  ready:      { bg: '#f0fdf4', color: '#15803d', text: (msg) => msg ? `Python 环境就绪 · ${msg}` : 'Python 环境就绪' },
  failed:     { bg: '#fef2f2', color: '#b91c1c', text: (msg) => msg ? `Python 环境初始化失败：${msg}` : 'Python 环境初始化失败，请查看调试输出。' },
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const Shell = styled.div`
  flex: 1;
  min-height: 0;
  min-width: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #f8fbfe 0%, #eef4f9 100%);
  overflow: hidden;
`

const EnvBanner = styled.div<{ $bg: string; $color: string }>`
  flex-shrink: 0;
  padding: 7px 18px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: ${(p) => p.$color};
  background: ${(p) => p.$bg};
  border-bottom: 1px solid rgba(0,0,0,0.06);
  display: flex;
  align-items: center;
  gap: 10px;
`

const PhaseBanner = styled.div`
  flex-shrink: 0;
  padding: 8px 18px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: #42576b;
  background: #eef2f7;
  border-bottom: 1px solid #dde3ec;
`

const Body = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 14px 18px 18px;
  display: grid;
  gap: 12px;
  align-content: start;
`

const Card = styled.div`
  border: 1px solid rgba(203, 214, 226, 0.95);
  border-radius: 14px;
  background: linear-gradient(180deg, #ffffff 0%, #fafcfe 100%);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  padding: 16px 18px;
  display: grid;
  gap: 12px;
`

const Label = styled.div`
  font-size: var(--font-size-xs);
  font-weight: 800;
  color: #7a8ea2;
  letter-spacing: 0.04em;
`

const FileActionsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
`

const ModelToggleRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
`

const ModelBtn = styled.button<{ $active?: boolean }>`
  height: 34px;
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid ${(p) => (p.$active ? '#1f6fd6' : '#c9d6e4')};
  background: ${(p) => (p.$active ? 'linear-gradient(180deg, #e8f2ff 0%, #dbeafe 100%)' : '#fff')};
  color: ${(p) => (p.$active ? '#0c4a9e' : '#334155')};
  font-size: var(--font-size-sm);
  font-weight: 700;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
  &:hover:not(:disabled) {
    border-color: #1f6fd6;
    color: #0c4a9e;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const Btn = styled.button`
  height: 34px;
  padding: 0 16px;
  border-radius: 8px;
  border: 1px solid #cad6e2;
  background: #fff;
  color: #304255;
  font-size: var(--font-size-sm);
  font-weight: 700;
  cursor: pointer;
  &:hover:not(:disabled) {
    background: #f5f8fc;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const PrimaryBtn = styled(Btn)`
  border-color: #1f6fd6;
  background: #1f6fd6;
  color: #fff;
  &:hover:not(:disabled) {
    background: #195cb1;
    border-color: #195cb1;
  }
`

const DangerBtn = styled(Btn)`
  border-color: #fca5a5;
  color: #b91c1c;
  font-size: var(--font-size-xs);
  height: 26px;
  padding: 0 10px;
  &:hover:not(:disabled) {
    background: #fff1f2;
  }
`

const HintLine = styled.div`
  font-size: var(--font-size-xs);
  line-height: 1.5;
  color: #6b7d90;
`

const FilePathLine = styled.div`
  font-size: var(--font-size-sm);
  line-height: 1.45;
  color: #243447;
  word-break: break-all;
`

const FileSelect = styled.select`
  flex: 1;
  min-width: 200px;
  height: 34px;
  padding: 0 12px;
  border: 1px solid #cad6e2;
  border-radius: 8px;
  font-size: var(--font-size-sm);
  color: #304255;
  background: #fff;
`

const TextArea = styled.textarea`
  width: 100%;
  min-height: 100px;
  resize: vertical;
  padding: 10px 12px;
  border: 1px solid #d6e0ea;
  border-radius: 8px;
  font-size: var(--font-size-sm);
  line-height: 1.55;
  color: #1f2937;
  box-sizing: border-box;
  outline: none;
  &:focus {
    border-color: #1f6fd6;
  }
`

const ErrorBox = styled.div`
  padding: 12px 14px;
  border-radius: 8px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  font-size: var(--font-size-sm);
  line-height: 1.5;
`

const DebugToggle = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: var(--font-size-xs);
  color: #64748b;
  padding: 2px 4px;
  border-radius: 4px;
  &:hover { background: #f1f5f9; }
`

const DebugLog = styled.div`
  margin-top: 4px;
  max-height: 200px;
  overflow-y: auto;
  background: #0f172a;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 11px;
  font-family: 'Cascadia Code', 'Consolas', monospace;
  color: #94a3b8;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
`

const ChartGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
`

const ChartCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const ChartTitle = styled.div`
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: #4a6074;
`

const ChartImg = styled.img`
  max-width: 100%;
  width: 100%;
  border: 1px solid #dde6f0;
  border-radius: 8px;
  background: #f8fafc;
  display: block;
`

// ─── Helpers ───────────────────────────────────────────────────────────────────

function isDataFile(p: string): boolean {
  return /\.(csv|xlsx|xls)$/i.test(String(p || ''))
}

const ENV_BUSY: PythonEnvState[] = ['checking', 'installing', 'rebuilding']

export default function ExcelAnalysisWorkbench() {
  const webMode = isWebShim()
  const { activeWorkspacePath, refreshTree } = useWorkspace()
  const workbench = useGenerationWorkbench()
  const [sourcePath, setSourcePath] = useState('')
  const [selectedFileId, setSelectedFileId] = useState('')
  const [spreadsheetFiles, setSpreadsheetFiles] = useState<FileEntry[]>([])
  const [filesLoading, setFilesLoading] = useState(false)
  const [webArtifact, setWebArtifact] = useState<Artifact | null>(null)
  const [webImageUrls, setWebImageUrls] = useState<string[]>([])
  const [webSummary, setWebSummary] = useState('')
  const [pickingFile, setPickingFile] = useState(false)
  const [analysisRunning, setAnalysisRunning] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  const [lastOutputDir, setLastOutputDir] = useState<string | null>(null)
  const [lastScriptPath, setLastScriptPath] = useState<string | null>(null)
  const [plotDataModels, setPlotDataModels] = useState<PlotDataModelOption[]>([])
  const [selectedDataModelId, setSelectedDataModelId] = useState('')
  const [envState, setEnvState] = useState<PythonEnvState>(webMode ? 'ready' : 'idle')
  const [envMessage, setEnvMessage] = useState<string>('')
  const [envLogs, setEnvLogs] = useState<string[]>([])
  const appendEnvLog = useCallback((line: string) => setEnvLogs((prev) => [...prev, line]), [])
  const [showDebug, setShowDebug] = useState(false)
  const logEndRef = useRef<HTMLDivElement>(null)
  const [localOutputImages, setLocalOutputImages] = useState<string[]>([])
  const [localResultTitle, setLocalResultTitle] = useState('')

  const isEnvBusy = !webMode && ENV_BUSY.includes(envState)
  const hasDataSource = webMode ? Boolean(selectedFileId) : Boolean(sourcePath)
  const canRun = Boolean(activeWorkspacePath && hasDataSource && !analysisRunning && !isEnvBusy)

  const selectedWebFile = spreadsheetFiles.find((f) => f.id === selectedFileId)

  // ── Load data models on mount (Electron IPC) ────────────────────────────────
  useEffect(() => {
    if (webMode) return
    void listPlotDataModels().then(setPlotDataModels).catch(() => setPlotDataModels([]))
  }, [webMode])

  // ── Web: load uploaded spreadsheets from resource center ─────────────────
  const loadWebSpreadsheetFiles = useCallback(async () => {
    setFilesLoading(true)
    try {
      const list = await platformApi.files.list()
      const sheets = list.filter(isSpreadsheetEntry)
      setSpreadsheetFiles(sheets)
      if (sheets.length > 0 && !selectedFileId) {
        setSelectedFileId(sheets[0].id)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setLastError(msg)
      appendEnvLog(`[error] 加载文件列表失败：${msg}`)
    } finally {
      setFilesLoading(false)
    }
  }, [appendEnvLog, selectedFileId])

  useEffect(() => {
    if (!webMode) return
    void loadWebSpreadsheetFiles()
  }, [webMode, loadWebSpreadsheetFiles])

  // ── Fast stamp check on mount (Electron only) ─────────────────────────────
  useEffect(() => {
    if (webMode) return
    void window.electronAPI?.excelCheckEnvStatus?.().then((r) => {
      if (r?.status) setEnvState(r.status as PythonEnvState)
      if (r?.message) setEnvMessage(r.message)
    }).catch(() => undefined)
  }, [webMode])

  // ── Subscribe to real-time env logs (Electron only) ───────────────────────
  useEffect(() => {
    if (webMode) return
    const unsub = window.electronAPI?.onExcelAnalysisEnvLog?.((payload) => {
      setEnvLogs((prev) => [...prev.slice(-400), payload.message])
    })
    return () => unsub?.()
  }, [webMode])

  // ── Subscribe to env status updates (Electron only) ───────────────────────
  useEffect(() => {
    if (webMode) return
    const unsub = window.electronAPI?.onExcelAnalysisEnvStatus?.((payload) => {
      if (payload?.status) setEnvState(payload.status as PythonEnvState)
      if (payload?.message !== undefined) setEnvMessage(payload.message ?? '')
    })
    return () => unsub?.()
  }, [webMode])

  // ── Analysis progress (Electron only) ─────────────────────────────────────
  useEffect(() => {
    if (webMode) return
    const unsub = window.electronAPI?.onExcelAnalysisProgress?.((rawPayload) => {
      const payload = rawPayload as Record<string, unknown>
      const phase = String(payload?.['phase'] || '').trim()
      if (!phase) return
      workbench.setGenerationStatus('running', phase)
    })
    return () => unsub?.()
  }, [webMode, workbench])

  // ── Auto-scroll debug log ─────────────────────────────────────────────────
  useEffect(() => {
    if (showDebug) logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [envLogs, showDebug])

  // ── Pick file — NOT gated on Python env ───────────────────────────────────
  const pickFile = useCallback(async () => {
    setPickingFile(true)
    try {
      const fp = await window.electronAPI.openFileDialog()
      if (!fp || !isDataFile(fp)) return
      setSourcePath(fp)
      setLastError(null)
    } finally {
      setPickingFile(false)
    }
  }, [])

  // ── Rebuild Python environment ────────────────────────────────────────────
  const rebuildEnv = useCallback(async () => {
    setEnvLogs([])
    setEnvState('rebuilding')
    setEnvMessage('正在重建 Python 环境…')
    try {
      await window.electronAPI?.excelRebuildEnv?.()
    } catch (e) {
      setEnvState('failed')
      setEnvMessage(e instanceof Error ? e.message : String(e))
    }
  }, [])

  const downloadWebReport = useCallback(async () => {
    if (!webArtifact) return
    const filename = artifactDownloadFilename(webArtifact)
    if (!filename) {
      setLastError('分析完成但暂无可下载文件')
      return
    }
    try {
      await platformApi.artifacts.download(webArtifact.id, filename)
      appendEnvLog(`[ok] 已下载 ${filename}`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setLastError(`下载失败：${msg}`)
      appendEnvLog(`[error] ${msg}`)
    }
  }, [appendEnvLog, webArtifact])

  const downloadBatteryExport = useCallback(async (exportFilename: string) => {
    if (!webArtifact) return
    const exists = webArtifact.exports?.some((e) => e.filename === exportFilename)
    if (!exists) {
      setLastError('未找到对应的导出文件，请稍后重试。')
      return
    }
    try {
      await platformApi.artifacts.download(webArtifact.id, exportFilename)
      appendEnvLog(`[ok] 已下载 ${exportFilename}`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setLastError(`下载失败：${msg}`)
      appendEnvLog(`[error] ${msg}`)
    }
  }, [appendEnvLog, webArtifact])

  // ── Run analysis ──────────────────────────────────────────────────────────
  const runAnalysis = useCallback(async () => {
    if (!activeWorkspacePath || !hasDataSource) return
    setAnalysisRunning(true)
    setLastError(null)
    setLastOutputDir(null)
    setLastScriptPath(null)
    setLocalOutputImages([])
    setLocalResultTitle('')
    setWebArtifact(null)
    setWebImageUrls([])
    setWebSummary('')
    setShowDebug(true)
    workbench.clearCurrentResult()
    workbench.setGenerationStatus('running', webMode ? '正在提交服务器分析…' : '正在启动分析…')

    if (webMode) {
      try {
        appendEnvLog(`[web] 分析文件：${selectedWebFile?.name ?? selectedFileId}`)
        const result = await platformApi.excel.analyze({
          fileId: selectedFileId,
          prompt: workbench.generationPrompt.trim() || undefined,
          workspacePath: activeWorkspacePath,
          options: {
            dataModelId: selectedDataModelId.trim() || undefined,
            modelId: selectedDataModelId.trim() || undefined,
          },
          onProgress: (u) => {
            // Stage animation in the banner (Web runtime only).
            if (u.status === 'running' && u.stage) {
              workbench.setGenerationStatus('running', `分析阶段：${u.stage}`)
            } else if (u.status === 'running' && u.message) {
              workbench.setGenerationStatus('running', u.message)
            }
          },
        })
        let artifact = result.artifact
        if (!artifact) {
          const list = await platformApi.artifacts.list()
          artifact = list.find((a) => a.id === result.artifactId)
        }
        if (!artifact) {
          throw new Error('分析完成但未返回生成记录')
        }
        if (!artifactHasExport(artifact)) {
          workbench.setGenerationStatus('error', '分析完成但暂无可下载文件')
          setLastError('分析完成但暂无可下载文件')
          appendEnvLog('[warn] artifact 无 exports')
          return
        }
        setWebArtifact(artifact)
        setWebImageUrls(result.imageUrls || (Array.isArray(artifact.metadata?.imageUrls) ? artifact.metadata.imageUrls.map(String) : []))
        setWebSummary(result.summary || (typeof artifact.metadata?.summary === 'string' ? artifact.metadata.summary : ''))
        workbench.setGenerationStatus('completed', '分析完成')
        appendEnvLog(`[ok] 已生成报告：${artifact.title}`)
        if ((result.imageUrls || []).length > 0) appendEnvLog(`[ok] 已生成图表图片：${result.imageUrls!.length} 张`)
        appendEnvLog('[hint] 可在资源中心 › 生成记录查看（类型：表格分析）')
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        workbench.setGenerationStatus('error', msg)
        setLastError(msg)
        appendEnvLog(`[error] ${msg}`)
      } finally {
        setAnalysisRunning(false)
      }
      return
    }

    try {
      const raw = (await window.electronAPI.excelAnalysisRun({
        workspacePath: activeWorkspacePath,
        sourcePath,
        userRequirement: workbench.generationPrompt,
        dataModelId: selectedDataModelId.trim() || '',
      })) as Record<string, unknown>
      const ok = Boolean(raw?.['ok'])
      const rawOutputDir = String((raw as { outputDir?: string }).outputDir || '')
      const rawScriptFolder = String((raw as { scriptRelFolder?: string }).scriptRelFolder || '')
      if (rawOutputDir) setLastOutputDir(rawOutputDir)
      if (rawScriptFolder) setLastScriptPath(rawScriptFolder)
      if (ok) {
        workbench.setGenerationStatus('completed', '分析完成')
        const imgs = (raw as { outputImages?: string[] }).outputImages || []
        console.log('[ExcelAnalysisWorkbench] outputImages from backend', imgs)
        if (imgs.length > 0) {
          imgs.forEach((p) => {
            const src = toFileUrl(p)
            console.log('[ExcelAnalysisWorkbench] image file path', p)
            console.log('[ExcelAnalysisWorkbench] image src', src)
          })
          const title = imgs.length > 1 ? `数据分析图表（${imgs.length} 张）` : '数据分析图表'
          setLocalOutputImages(imgs)
          setLocalResultTitle(title)
          workbench.setGenerationResult({
            resultChartPaths: imgs,
            resultPreviewUrl: toFileUrl(imgs[0]),
            resultPath: imgs[0],
            resultTitle: title,
          })
        } else {
          // ok:true but no images (shouldn't happen after backend fix, but guard anyway)
          const warnMsg = '分析脚本执行成功，但未生成图表。请打开调试日志查看 Python 输出。'
          workbench.setGenerationStatus('error', warnMsg)
          setLastError(warnMsg)
          const outDir = String((raw as { outputDir?: string }).outputDir || '')
          const stdoutSnip = String((raw as { stdout?: string }).stdout || '').slice(-600)
          const stderrSnip = String((raw as { stderr?: string }).stderr || '').slice(-600)
          const logLines: string[] = [
            `[warn] exitCode=0 but no outputImages`,
            outDir ? `[outDir] ${outDir}` : '',
            stdoutSnip ? `[stdout]\n${stdoutSnip}` : '',
            stderrSnip ? `[stderr]\n${stderrSnip}` : '',
          ].filter(Boolean)
          logLines.forEach((l) => appendEnvLog(l))
          setShowDebug(true)
        }
        void refreshTree().catch(() => undefined)
      } else {
        const msg = String((raw as { error?: string })?.error || '分析失败')
        workbench.setGenerationStatus('error', msg)
        setLastError(msg)
        // Push stdout/stderr/outputDir into debug log for diagnostics
        const outDir = String((raw as { outputDir?: string }).outputDir || '')
        const stdoutSnip = String((raw as { stdout?: string }).stdout || '').slice(-800)
        const stderrSnip = String((raw as { stderr?: string }).stderr || '').slice(-800)
        const logLines: string[] = [
          `[error] ${msg}`,
          outDir ? `[outDir] ${outDir}` : '',
          stdoutSnip ? `[stdout]\n${stdoutSnip}` : '',
          stderrSnip ? `[stderr]\n${stderrSnip}` : '',
        ].filter(Boolean)
        logLines.forEach((l) => appendEnvLog(l))
        setShowDebug(true)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      workbench.setGenerationStatus('error', msg)
      setLastError(msg)
    } finally {
      setAnalysisRunning(false)
    }
  }, [
    activeWorkspacePath,
    appendEnvLog,
    hasDataSource,
    refreshTree,
    selectedDataModelId,
    selectedFileId,
    selectedWebFile?.name,
    sourcePath,
    webMode,
    workbench,
  ])

  const phaseVisible =
    analysisRunning &&
    workbench.generationStatus.phase === 'running' &&
    Boolean(workbench.generationStatus.message?.trim())

  const bannerCfg = webMode ? WEB_ENV_BANNER : ENV_BANNER[envState]

  const webArtifactMeta = webArtifact?.metadata as Record<string, unknown> | undefined
  const webAnalysisModelId = String(webArtifactMeta?.analysisModelId || '')
  const isBatteryLifePrediction = webMode && webAnalysisModelId === BATTERY_LIFE_MODEL_ID
  const batteryMarkdownPreview = isBatteryLifePrediction
    ? String(webArtifactMeta?.markdownPreview || '')
    : ''
  const batteryHtmlUrl = isBatteryLifePrediction ? String(webArtifactMeta?.htmlUrl || '') : ''
  const batteryN80 = isBatteryLifePrediction ? (webArtifactMeta?.n80 as Record<string, unknown> | undefined) : undefined

  return (
    <Shell data-testid="excel-analysis-workbench">
      {/* ── Python env status banner ── */}
      <EnvBanner $bg={bannerCfg.bg} $color={bannerCfg.color} role="status" aria-live="polite">
        <span style={{ flex: 1 }}>{bannerCfg.text(envMessage)}</span>
        <DebugToggle type="button" onClick={() => setShowDebug((v) => !v)} title="显示/隐藏调试日志">
          {showDebug ? '▲ 日志' : '▼ 日志'}
        </DebugToggle>
        {!webMode && (envState === 'failed' || envState === 'idle') && (
          <DangerBtn type="button" onClick={() => void rebuildEnv()} disabled={isEnvBusy}>
            重建 Python 环境
          </DangerBtn>
        )}
        {webMode ? (
          <span
            style={{ fontSize: 11, color: '#64748b', marginLeft: 4 }}
            title="服务器环境由管理员维护"
          >
            服务器环境由管理员维护
          </span>
        ) : (
          <DebugToggle
            type="button"
            onClick={() => void window.electronAPI?.excelPythonDiagnostics?.().then((d) => {
              setEnvLogs((prev) => [...prev, '[diagnostics] ' + JSON.stringify(d, null, 2)])
              setShowDebug(true)
            })}
            title="Python 环境诊断"
            style={{ marginLeft: 4 }}
          >
            🔍 诊断
          </DebugToggle>
        )}
      </EnvBanner>
      {/* ── Debug log panel ── */}
      {showDebug && envLogs.length > 0 && (
        <DebugLog>
          {envLogs.join('\n')}
          <div ref={logEndRef} />
        </DebugLog>
      )}
      {/* ── Analysis phase banner ── */}
      {phaseVisible ? (
        <PhaseBanner role="status" aria-live="polite">{workbench.generationStatus.message}</PhaseBanner>
      ) : null}
      <Body>
        {!activeWorkspacePath ? (
          <Card>
            <Label>提示</Label>
            <HintLine>请先打开或创建工作区。</HintLine>
          </Card>
        ) : null}
        <Card>
          <Label>数据文件</Label>
          <FileActionsRow>
            {webMode ? (
              <>
                {filesLoading ? (
                  <HintLine style={{ flex: 1 }}>正在加载资源中心表格文件…</HintLine>
                ) : spreadsheetFiles.length === 0 ? (
                  <HintLine style={{ flex: 1 }}>
                    请先到 <strong>资源中心 › 我的文件</strong> 上传 xlsx 或 csv 表格。
                  </HintLine>
                ) : (
                  <FileSelect
                    value={selectedFileId}
                    onChange={(e) => {
                      setSelectedFileId(e.target.value)
                      setLastError(null)
                    }}
                    disabled={analysisRunning}
                    aria-label="选择表格文件"
                  >
                    {spreadsheetFiles.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({(f.size / 1024).toFixed(1)} KB)
                      </option>
                    ))}
                  </FileSelect>
                )}
                <Btn
                  type="button"
                  onClick={() => void loadWebSpreadsheetFiles()}
                  disabled={filesLoading || analysisRunning}
                  title="刷新文件列表"
                >
                  刷新列表
                </Btn>
              </>
            ) : (
              <Btn type="button" onClick={() => void pickFile()} disabled={pickingFile}>
                选择文件
              </Btn>
            )}
            <PrimaryBtn type="button" onClick={() => void runAnalysis()} disabled={!canRun}>
              开始分析
            </PrimaryBtn>
          </FileActionsRow>
          <Label style={{ marginTop: 2 }}>模型选择</Label>
          {/* Model buttons: only disabled while analysis running, NOT by Python env */}
          <ModelToggleRow role="group" aria-label="模型选择">
            <ModelBtn
              type="button"
              $active={!selectedDataModelId}
              disabled={analysisRunning}
              onClick={() => setSelectedDataModelId('')}
            >
              不套用模型
            </ModelBtn>
            {webMode ? (
              <ModelBtn
                type="button"
                id={BATTERY_LIFE_MODEL_ID}
                $active={selectedDataModelId === BATTERY_LIFE_MODEL_ID}
                disabled={analysisRunning}
                onClick={() => {
                  setSelectedDataModelId(BATTERY_LIFE_MODEL_ID)
                  window.dispatchEvent(new CustomEvent('open-ai4science-battery'))
                }}
              >
                模型A：电池寿命预测
              </ModelBtn>
            ) : null}
            {plotDataModels.map((m) => (
              <ModelBtn
                key={m.id}
                type="button"
                $active={selectedDataModelId === m.id}
                disabled={analysisRunning}
                onClick={() => setSelectedDataModelId(m.id)}
              >
                {m.label}
              </ModelBtn>
            ))}
          </ModelToggleRow>
          <HintLine>
            {webMode
              ? selectedDataModelId
                ? selectedDataModelId === BATTERY_LIFE_MODEL_ID
                  ? '已选择：模型A：电池寿命预测（将使用专用模型 Runner，生成 N80 指标、PNG 图表与交互式预测曲线）。'
                  : 'Web 版已记录模型选择；服务器第一版分析暂不套用本地绘图模型脚本。'
                : 'Web 版从资源中心选择已上传表格，由服务器生成 Markdown 分析报告。'
              : selectedDataModelId
                ? `${plotDataModels.find((x) => x.id === selectedDataModelId)?.description || ''} 若下方「分析需求」为空，将直接使用模型随包内置绘图脚本，不再向大模型索要作图代码；填写需求后则按你的描述重新生成 Python 分析脚本（不复用历史脚本）。`
                : '可选。套用模型时会在分析前预处理表格。'}
          </HintLine>
          <HintLine>支持 Excel（.xlsx / .xls）或 CSV，表头从 A1 开始。</HintLine>
          {webMode && selectedDataModelId === BATTERY_LIFE_MODEL_ID ? (
            <>
              <HintLine>
                数据格式说明（文件必须符合要求）：<br />
                Excel：包含「25℃」与「45℃」两个 sheet；第 1 列为 Cycle；其余列为样本容量（E0039、E0040…）。<br />
                CSV：仅支持四列（temperature、cycle、sample_id、capacity）。
              </HintLine>
              <FileActionsRow>
                <PrimaryBtn type="button" onClick={() => void platformApi.dataAnalysis.downloadTemplate(BATTERY_LIFE_MODEL_ID)} disabled={analysisRunning}>
                  下载数据模板
                </PrimaryBtn>
              </FileActionsRow>
            </>
          ) : null}
          {webMode && selectedWebFile ? (
            <FilePathLine>{selectedWebFile.name}</FilePathLine>
          ) : null}
          {!webMode && sourcePath ? <FilePathLine>{sourcePath}</FilePathLine> : null}
          <Label style={{ marginTop: 4 }}>分析需求（可选）</Label>
          {/* Textarea: never disabled */}
          <TextArea
            value={workbench.generationPrompt}
            onChange={(e) => workbench.setGenerationPrompt(e.target.value)}
            placeholder="例如：按地区汇总销售额并画柱状图；或说明要看的指标与维度。"
          />
        </Card>
        {webArtifact ? (
          <Card>
            <Label>分析完成</Label>
            <HintLine style={{ color: '#15803d', fontWeight: 600 }}>
              {webArtifact.title}
            </HintLine>
            {webSummary ? <HintLine>{webSummary}</HintLine> : null}
            {isBatteryLifePrediction && batteryN80 ? (
              <HintLine style={{ color: '#0f766e', fontWeight: 800 }}>
                N80 指标：{JSON.stringify(batteryN80)}
              </HintLine>
            ) : null}
            {webImageUrls.length > 0 ? (
              <ChartGrid data-testid="data-analysis-image-results">
                {webImageUrls.map((url, index) => (
                  <ChartCard key={`${url}-${index}`}>
                    <ChartTitle>
                      {isBatteryLifePrediction
                        ? /capacity_decay_25C/i.test(url)
                          ? '25℃ 容量衰减曲线'
                          : /capacity_decay_45C/i.test(url)
                            ? '45℃ 容量衰减曲线'
                            : `电池寿命分析图表 ${index + 1}`
                        : `服务器生成图表 ${index + 1}`}
                    </ChartTitle>
                    <ChartImg src={url} alt={`服务器生成图表 ${index + 1}`} />
                  </ChartCard>
                ))}
              </ChartGrid>
            ) : null}

            {isBatteryLifePrediction ? (
              <>
                {batteryMarkdownPreview ? (
                  <div style={{ marginTop: 12 }}>
                    <Label>Markdown 报告</Label>
                    <div style={{ padding: '10px 12px', border: '1px solid rgba(203, 214, 226, 0.95)', borderRadius: 12, background: '#ffffff', maxHeight: 260, overflow: 'auto' }}>
                      <AssistantMarkdown content={batteryMarkdownPreview} />
                    </div>
                  </div>
                ) : null}
                {batteryHtmlUrl ? (
                  <div style={{ marginTop: 12 }}>
                    <Label>交互式预测曲线</Label>
                    <iframe
                      title="battery life prediction viewer"
                      src={batteryHtmlUrl}
                      style={{ width: '100%', height: 520, border: '1px solid rgba(203, 214, 226, 0.95)', borderRadius: 12, background: '#ffffff' }}
                    />
                  </div>
                ) : null}
              </>
            ) : null}
            <HintLine>
              可在 <strong>资源中心 › 生成记录</strong> 查看（类型：表格分析）。
            </HintLine>
            <FileActionsRow style={{ marginTop: 8 }}>
              {isBatteryLifePrediction ? (
                artifactHasExport(webArtifact) ? (
                  <>
                    <PrimaryBtn
                      type="button"
                      onClick={() => void downloadBatteryExport('report.md')}
                    >
                      下载 Markdown 报告
                    </PrimaryBtn>
                    <Btn
                      type="button"
                      onClick={() => void downloadBatteryExport('files/model_parameters.csv')}
                      style={{ marginLeft: 8 }}
                    >
                      下载 模型参数 CSV
                    </Btn>
                    <Btn
                      type="button"
                      onClick={() => void downloadBatteryExport('result.json')}
                      style={{ marginLeft: 8 }}
                    >
                      下载 结果 JSON
                    </Btn>
                  </>
                ) : (
                  <ErrorBox>分析完成但暂无可下载文件</ErrorBox>
                )
              ) : artifactHasExport(webArtifact) ? (
                <PrimaryBtn type="button" onClick={() => void downloadWebReport()}>
                  下载分析报告
                </PrimaryBtn>
              ) : (
                <ErrorBox>分析完成但暂无可下载文件</ErrorBox>
              )}
            </FileActionsRow>
          </Card>
        ) : null}
        {lastError ? (
          <Card>
            <Label>未能完成</Label>
            <ErrorBox style={{ whiteSpace: 'pre-wrap' }}>{lastError}</ErrorBox>
            <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {!webMode && lastOutputDir ? (
                <button
                  type="button"
                  style={{ fontSize: 12, padding: '4px 10px', cursor: 'pointer', borderRadius: 6, border: '1px solid #d6e0ea', background: '#f8fafc' }}
                  onClick={() => {
                    void window.electronAPI?.openExternalFile?.(lastOutputDir)
                  }}
                >
                  📂 打开输出目录
                </button>
              ) : null}
              {!webMode && lastScriptPath ? (
                <button
                  type="button"
                  style={{ fontSize: 12, padding: '4px 10px', cursor: 'pointer', borderRadius: 6, border: '1px solid #d6e0ea', background: '#f8fafc' }}
                  onClick={() => {
                    void navigator.clipboard?.writeText(lastScriptPath)
                  }}
                >
                  📋 复制脚本路径
                </button>
              ) : null}
              {envLogs.length > 0 ? (
                <button
                  type="button"
                  style={{ fontSize: 12, padding: '4px 10px', cursor: 'pointer', borderRadius: 6, border: '1px solid #d6e0ea', background: '#f8fafc' }}
                  onClick={() => {
                    void navigator.clipboard?.writeText(envLogs.join('\n'))
                  }}
                >
                  📋 复制调试日志
                </button>
              ) : null}
            </div>
          </Card>
        ) : null}
        {!webMode && localOutputImages.length > 0 ? (
          <Card>
            <Label>{localResultTitle}</Label>
            <ChartGrid>
              {localOutputImages.map((p, index) => {
                const src = toFileUrl(p)
                return (
                  <ChartCard key={p}>
                    <ChartTitle>图表 {index + 1}</ChartTitle>
                    <ChartImg
                      src={src}
                      alt={`数据分析图表 ${index + 1}`}
                      onLoad={() => console.log('[ExcelAnalysisWorkbench] image loaded', src)}
                      onError={(e) => {
                        console.error('[ExcelAnalysisWorkbench] image load failed', src, e)
                      }}
                    />
                    <FilePathLine style={{ fontSize: 10, color: '#9aa5b4' }}>{p}</FilePathLine>
                  </ChartCard>
                )
              })}
            </ChartGrid>
            {lastOutputDir ? (
              <div>
                <button
                  type="button"
                  style={{ fontSize: 12, padding: '4px 10px', cursor: 'pointer', borderRadius: 6, border: '1px solid #d6e0ea', background: '#f8fafc' }}
                  onClick={() => void window.electronAPI?.openExternalFile?.(lastOutputDir)}
                >
                  📂 打开输出目录
                </button>
              </div>
            ) : null}
          </Card>
        ) : null}
      </Body>
    </Shell>
  )
}
