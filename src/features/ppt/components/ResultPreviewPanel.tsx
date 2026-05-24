import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import { useDocument } from '../../../contexts/DocumentContext'
import { useGenerationWorkbench, type GenerationStatusPhase, type PptAiMessage, type PptSlidePreview } from '../../../contexts/GenerationWorkbenchContext'
import { useKnowledge } from '../../../contexts/KnowledgeContext'
import { useFormalTemplateSession } from '../../../modules/formal/contexts/FormalTemplateSessionContext'
import { useWorkspace } from '../../../contexts/WorkspaceContext'
import {
  applyDocumentEditAction,
  rebaseDocumentEditState,
  type DocumentEditAction,
  type DocumentEditState,
} from '../../../document/editor'
import type { DocumentPatch } from '../../../document/core'
import { buildDocumentPreviewModel, DocumentPreviewRenderer } from '../../../document/preview'
import { type GenerationMode, useWorkspaceMode } from '../../../contexts/WorkspaceModeContext'
import { useDocumentPreview } from '../../../hooks/useDocumentPreview'
import { useFormalTemplateGeneration } from '../../../modules/formal/hooks/useFormalTemplateGeneration'
import { useDocumentEngineHostCommands } from '../../../engines/documentEngine/hostCommands'
import { useDocumentEngineRuntime } from '../../../engines/documentEngine/runtime'
import ReadonlyDocumentPreview from '../../../modules/writing/components/ReadonlyDocumentPreview'
import { getGenerationModeOption } from './generationWorkbenchConfig'
import {
  buildTimestampStamp,
  getFileName,
  getParentPath,
  normalizeFileLikePath,
  sanitizeFileStem,
  toDisplayUrl,
} from './generationWorkbenchUtils'
import { createPptPrimarySourceState } from '../../../utils/pptPrimarySource'
import PptWorkbenchPanel from './PptWorkbenchPanel'
import { isWebShim } from '../../../platform/detect'
import { platformApi } from '../../../platform'
import { artifactDownloadFilename, artifactHasExport } from '../../../utils/artifactDisplay'
import { webMigrationLabel } from '../../../platform/webMigration'
import { buildNearbySlidesContext, mergeDeckIntoLiveSlides, replaceSlideInPreviews } from '../services/webDeckSlides'
import { editWebPptSlide, exportWebPptDeck, retemplateWebPptDeck } from '../services/pptWebGeneration'
import { buildPptTemplateOptions, resolvePptTemplateId, resolvePptTemplateLabel } from '../services/pptTemplates'

const Shell = styled.section`
  flex: 1;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  background: linear-gradient(180deg, rgba(252, 253, 255, 0.96) 0%, rgba(245, 249, 253, 0.98) 100%);
`

const Toolbar = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px 12px;
  border-bottom: 1px solid #e1e9f1;
  background: rgba(255, 255, 255, 0.96);
`

const ToolbarCopy = styled.div`
  min-width: 0;
  display: grid;
  gap: 4px;
`

const ToolbarTitle = styled.div`
  font-size: 14px;
  font-weight: 800;
  color: #1f3447;
`

const ToolbarHint = styled.div`
  font-size: var(--font-size-xs);
  line-height: 1.65;
  color: #6f8396;
`

const ToolbarActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
  flex-shrink: 0;
`

const Stage = styled.div`
  min-width: 0;
  min-height: 0;
  overflow: hidden;
`

const StageScroll = styled.div`
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  padding: 20px;
  scrollbar-gutter: stable both-edges;
  scrollbar-width: thin;
  scrollbar-color: rgba(110, 135, 164, 0.45) rgba(148, 167, 190, 0.12);

  &::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(148, 167, 190, 0.12);
    border-radius: 999px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(110, 135, 164, 0.38);
    border-radius: 999px;
    border: 2px solid rgba(248, 251, 255, 0.92);
  }
`

const StageCanvas = styled.div`
  position: relative;
  min-height: 100%;
`

const FloatingActionIsland = styled.aside`
  position: absolute;
  right: 28px;
  bottom: 24px;
  z-index: 4;
  width: min(320px, calc(100% - 40px));
  display: grid;
  gap: 10px;
  padding: 16px;
  border: 1px solid rgba(186, 205, 223, 0.92);
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(245, 249, 253, 0.98) 100%);
  box-shadow: 0 18px 40px rgba(31, 52, 71, 0.14);
  backdrop-filter: blur(10px);

  @media (max-width: 960px) {
    position: sticky;
    right: auto;
    bottom: 16px;
    margin: 20px 0 0 auto;
  }
`

const FloatingActionEyebrow = styled.div`
  font-size: var(--font-size-xs);
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #6d8499;
`

const FloatingActionTitle = styled.div`
  font-size: 16px;
  line-height: 1.45;
  font-weight: 800;
  color: #21384b;
`

const FloatingActionHint = styled.div`
  font-size: var(--font-size-xs);
  line-height: 1.7;
  color: #607487;
`

const FloatingActionButtons = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`

const FloatingActionButton = styled.button<{ $tone?: 'primary' | 'secondary' }>`
  min-height: 42px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid ${({ $tone }) => ($tone === 'primary' ? '#5f97d7' : '#cad8e6')};
  background: ${({ $tone }) => ($tone === 'primary'
    ? 'linear-gradient(180deg, #6aa3e1 0%, #4e8fd6 100%)'
    : '#ffffff')};
  color: ${({ $tone }) => ($tone === 'primary' ? '#ffffff' : '#2b4358')};
  font-size: var(--font-size-sm);
  font-weight: 800;
  cursor: pointer;
  box-shadow: ${({ $tone }) => ($tone === 'primary' ? '0 10px 22px rgba(74, 140, 214, 0.22)' : 'none')};

  &:hover:not(:disabled) {
    background: ${({ $tone }) => ($tone === 'primary'
      ? 'linear-gradient(180deg, #5f9bdd 0%, #4787cf 100%)'
      : '#f4f8fb')};
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    box-shadow: none;
  }
`

const MinimalHint = styled.div`
  padding: 2px 0;
  font-size: var(--font-size-sm);
  line-height: 1.7;
  color: #6e8295;
`

const HintText = styled.div`
  padding: 2px 0 6px;
  font-size: var(--font-size-sm);
  line-height: 1.7;
  color: #4e657b;
  font-weight: 700;
`

const TextStage = styled.div`
  width: 100%;
  min-height: 100%;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 14px;
  line-height: 1.9;
  color: #23384a;
`

const SecondaryButton = styled.button`
  min-width: 108px;
  height: 38px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid #cfdce8;
  background: #ffffff;
  color: #30485f;
  font-size: var(--font-size-sm);
  font-weight: 700;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #f4f8fb;
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`

const PrimaryButton= styled.button`
  min-width: 120px;
  height: 38px;
  padding: 0 16px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #0f766e, #2563eb);
  color: #ffffff;
  font-size: var(--font-size-sm);
  font-weight: 700;
  cursor: pointer;

  &:hover:not(:disabled) {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`

const BottomBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 10px 20px 14px;
  border-top: 1px solid #e1e9f1;
  background: rgba(255, 255, 255, 0.96);
`

const StatusMain = styled.div`
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 10px;
`

const StatusDot = styled.span<{ $phase: GenerationStatusPhase }>`
  width: 10px;
  height: 10px;
  border-radius: 999px;
  flex-shrink: 0;
  background: ${({ $phase }) => (
    $phase === 'completed'
      ? '#2f8f5b'
      : $phase === 'running'
        ? '#2f7dd1'
        : $phase === 'error'
          ? '#c84a4a'
          : '#9aacbe'
  )};
  box-shadow: ${({ $phase }) => (
    $phase === 'running'
      ? '0 0 0 5px rgba(47, 125, 209, 0.12)'
      : $phase === 'completed'
        ? '0 0 0 5px rgba(47, 143, 91, 0.12)'
        : $phase === 'error'
          ? '0 0 0 5px rgba(200, 74, 74, 0.12)'
          : '0 0 0 5px rgba(154, 172, 190, 0.12)'
  )};
`

const StatusText = styled.div`
  min-width: 0;
  font-size: var(--font-size-sm);
  line-height: 1.5;
  font-weight: 700;
  color: #294158;
`

const StatusMeta = styled.div`
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
  margin-left: auto;
`

const StatusMetaItem = styled.div<{ $tone?: 'neutral' | 'error' }>`
  min-width: 0;
  max-width: min(360px, 100%);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid ${({ $tone }) => ($tone === 'error' ? '#f0c6c6' : '#d7e2ec')};
  background: ${({ $tone }) => ($tone === 'error' ? '#fff4f4' : '#f7fafc')};
`

const StatusMetaLabel = styled.span`
  flex-shrink: 0;
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: #73879a;
`

const StatusMetaValue = styled.span<{ $tone?: 'neutral' | 'error' }>`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: ${({ $tone }) => ($tone === 'error' ? '#a33d3d' : '#30485f')};
`

function formatTemplateModeLabel(mode: 'overlay' | 'base-replace' | undefined): string {
  if (mode === 'base-replace') return '替换模式'
  if (mode === 'overlay') return '覆盖模式'
  return '自动'
}

function formatExecutionModeLabel(value: ReturnType<typeof buildDocumentPreviewModel>['diagnostics']): string | null {
  if (!value?.formalTemplate?.actualMode) return null
  if (value.formalTemplate.actualMode === 'schema-first') {
    return '模板优先'
  }
  return '兼容模式'
}

const ImagePreview = styled.img`
  display: block;
  width: 100%;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 14px;
  background: linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%);
  box-shadow: 0 12px 28px rgba(30, 58, 95, 0.08);
`

const ImageStage = styled.div`
  width: 100%;
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`

const ImageStageSurface = styled.div`
  width: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 18px;
  border: 1px solid #dbe5ef;
  border-radius: 20px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  padding: 28px;
`

const ImageEmptyState = styled.div`
  display: grid;
  gap: 10px;
  justify-items: center;
  text-align: center;
  padding: 36px 18px;
  color: #6d8296;
`

const ImageEmptyTitle = styled.div`
  font-size: 16px;
  font-weight: 800;
  color: #27445d;
`

const ImageEmptyText = styled.div`
  max-width: 520px;
  font-size: var(--font-size-sm);
  line-height: 1.75;
`

const SlideGrid = styled.div`
  display: grid;
  gap: 10px;
  align-content: start;
`

const SlideCard = styled.div`
  border: 1px solid #dbe6ef;
  border-radius: 14px;
  background: #fbfdff;
  padding: 14px;
  display: grid;
  gap: 8px;
`

const SlideTitle = styled.div`
  font-size: var(--font-size-sm);
  font-weight: 800;
  color: #1f3447;
`

const SlideBullet = styled.div`
  font-size: var(--font-size-xs);
  line-height: 1.65;
  color: #5b6f83;
`

interface SlideOutline {
  title: string
  bullets: string[]
}

interface SlidePlanSlide {
  type: string
  title?: string
  subtitle?: string
  heading?: string
  items?: string[]
  imagePath?: string
}

interface SlidePlanJson {
  title: string
  slides: SlidePlanSlide[]
}

function parseSlidePlanJson(text: string): SlidePlanJson | null {
  try {
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
    const parsed = JSON.parse(cleaned)
    if (parsed && Array.isArray(parsed.slides) && parsed.slides.length > 0) {
      return parsed as SlidePlanJson
    }
  } catch {
    // not valid JSON, fall through
  }
  return null
}

function slideTypeLabel(type: string): string {
  const labels: Record<string, string> = { cover: '封面', toc: '目录', section: '章节', content: '内容', summary: '总结' }
  return labels[type] || type
}

function formatModeStatusText(mode: GenerationMode, phase: GenerationStatusPhase): string {
  const exactLabels: Record<GenerationMode, Record<GenerationStatusPhase, string>> = {
    document: {
      idle: '未开始生成',
      running: '正在生成文稿…',
      completed: '文稿已生成',
      error: '文稿生成失败',
    },
    image: {
      idle: '未开始生成',
      running: '正在生成图片…',
      completed: '图片已生成',
      error: '图片生成失败',
    },
    ppt: {
      idle: '未开始生成',
      running: '正在生成 PPT…',
      completed: 'PPT 已生成',
      error: 'PPT 生成失败',
    },
    email: {
      idle: '未开始生成',
      running: '正在生成邮件…',
      completed: '邮件已生成',
      error: '邮件生成失败',
    },
    'daily-report': {
      idle: '未开始生成',
      running: '正在生成日报…',
      completed: '日报已生成',
      error: '日报生成失败',
    },
    homework: {
      idle: '未开始生成',
      running: '正在解答作业…',
      completed: '作业已解答',
      error: '作业解答失败',
    },
    'ai-class': {
      idle: '未连接',
      running: '连接中…',
      completed: '已连接',
      error: '连接失败',
    },
    'ai-forum': {
      idle: '未连接',
      running: '连接中…',
      completed: '已连接',
      error: '连接失败',
    },
    paper: {
      idle: '未开始生成',
      running: '正在生成论文…',
      completed: '论文已生成',
      error: '论文生成失败',
    },
    data: {
      idle: '未开始分析',
      running: '正在分析数据…',
      completed: '分析完成',
      error: '分析失败',
    },
    model: {
      idle: '未开始',
      running: '运行中…',
      completed: '已完成',
      error: '运行失败',
    },
    'daily-feed': {
      idle: '未加载',
      running: '加载中…',
      completed: '已加载',
      error: '加载失败',
    },
  }
  return exactLabels[mode]?.[phase] ?? phase
}

function summarizeFailureMessage(message: string, mode: GenerationMode): string {
  const trimmed = String(message || '').replace(/\s+/g, ' ').trim()
  if (!trimmed) return '生成失败，请重试'
  if (/工作区/.test(trimmed)) return '请先打开工作区'
  if (/模板/.test(trimmed)) return '未选择模板'
  if (/(素材|参考图|参考资料|勾选|至少|主参考图)/.test(trimmed)) {
    return mode === 'image' ? '素材不足' : '未选择模板 / 素材不足'
  }
  if (/(第三方|接口|服务|API|超时|timeout|network|fetch|HTTP|连接)/i.test(trimmed)) {
    return '第三方接口异常'
  }
  if (/请重试/.test(trimmed)) return '生成失败，请重试'
  const firstSentence = trimmed.split(/[。！？!?]/)[0]?.trim() || trimmed
  return firstSentence.length > 24 ? `${firstSentence.slice(0, 24)}…` : firstSentence
}

function formatRecentGenerationTime(value: string | null): string | null {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).replace(/\//g, '-')
}

function compactMetaText(value: string): string {
  const trimmed = String(value || '').replace(/\s+/g, ' ').trim()
  return trimmed.length > 28 ? `${trimmed.slice(0, 28)}…` : trimmed
}

function stripFileExtension(value: string): string {
  return String(value || '').replace(/\.[^.]+$/, '').trim()
}

function buildDefaultPptPrompt(title: string): string {
  const normalizedTitle = stripFileExtension(title) || '当前文稿'
  return `请基于《${normalizedTitle}》生成一份结构清晰、适合汇报展示的 PPT，突出核心信息、逻辑层次与可展示性。`
}

function parseSlideOutline(text: string): { deckTitle: string; slides: SlideOutline[] } {
  const lines = String(text || '').split(/\r?\n/)
  const slides: SlideOutline[] = []
  let deckTitle = ''
  let current: SlideOutline | null = null

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue
    if (!deckTitle && /^#\s+/.test(line)) {
      deckTitle = line.replace(/^#\s+/, '').trim()
      continue
    }
    if (/^##\s+/.test(line)) {
      if (current) slides.push(current)
      current = {
        title: line.replace(/^##\s+/, '').trim(),
        bullets: [],
      }
      continue
    }
    if (!current) {
      if (!deckTitle) deckTitle = line
      continue
    }
    if (/^-\s+/.test(line)) {
      current.bullets.push(line.replace(/^-\s+/, '').trim())
      continue
    }
    current.bullets.push(line.replace(/^[0-9]+[.)、]\s+/, '').trim())
  }

  if (current) slides.push(current)
  return { deckTitle, slides }
}

export default function ResultPreviewPanel() {
  const { currentMode, enterPptGenerationMode } = useWorkspaceMode()
  const workbench = useGenerationWorkbench()
  const knowledge = useKnowledge()
  const { activeWorkspacePath, refreshTree } = useWorkspace()
  const { tabs, activeTabId, mainTabId, setStatusMessage } = useDocument()
  const { saveActiveDocument, saveActiveDocumentAs } = useDocumentEngineHostCommands()
  const { runtime } = useDocumentEngineRuntime()
  const { commitResult } = useFormalTemplateSession()
  const { commitDocumentEdit } = useFormalTemplateGeneration()
  const [previewMessage, setPreviewMessage] = useState<string | null>(null)
  const [floatingActionBusy, setFloatingActionBusy] = useState<'knowledge' | 'ppt' | null>(null)
  const [documentEditState, setDocumentEditState] = useState<DocumentEditState | null>(null)
  const documentEditStateRef = useRef<DocumentEditState | null>(null)
  const pendingRebasePatchesRef = useRef<DocumentPatch[]>([])
  const [pptSkillApplyStatus, setPptSkillApplyStatus] = useState<string>('')
  const [pptSkillBusy, setPptSkillBusy] = useState(false)
  const [pptTemplateImporting, setPptTemplateImporting] = useState(false)
  const [pptAvailableSkills, setPptAvailableSkills] = useState<Array<{ id: string; name: string; description: string; previewColor: string; source?: 'built-in' | 'skill'; widthInches?: number; heightInches?: number }>>([])
  const [pptPackageHistory, setPptPackageHistory] = useState<Array<{ packageId: string; title: string; createdAt: string }>>([])
  const pptActiveSkillId = workbench.sessions.ppt.pptActiveSkillId
  const pptContentPackageId = workbench.sessions.ppt.pptContentPackageId
  const pptDeckId = workbench.sessions.ppt.pptDeckId || workbench.sessions.ppt.pptDeckDocumentId
  const pptArtifactId = workbench.sessions.ppt.pptArtifactId || (typeof workbench.sessions.ppt.resultAssetId === 'string' ? workbench.sessions.ppt.resultAssetId : null)
  const pptDownloadUrl = workbench.sessions.ppt.pptDownloadUrl || workbench.sessions.ppt.resultPath
  const pptDeckDocumentId = workbench.sessions.ppt.pptDeckDocumentId ?? null
  const pptActiveTemplateManifestId = workbench.sessions.ppt.pptActiveTemplateManifestId ?? null
  const pptTaskStatus = workbench.sessions.ppt.pptTaskStatus
  const pptEngine = workbench.sessions.ppt.pptEngine
  const pptFallbackFrom = workbench.sessions.ppt.pptFallbackFrom
  const pptFallbackReason = workbench.sessions.ppt.pptFallbackReason
  const pptOutputMode = workbench.sessions.ppt.pptOutputMode
  const pptPreviewUrl = workbench.sessions.ppt.pptPreviewUrl
  const pptSlidevMarkdown = workbench.sessions.ppt.pptSlidevMarkdown
  const pptSlides = workbench.sessions.ppt.pptSlides
  const pptLiveSlides = workbench.sessions.ppt.pptLiveSlides
  const pptTotalSlides = workbench.sessions.ppt.pptTotalSlides
  const pptActiveSlideIndex = workbench.sessions.ppt.pptActiveSlideIndex
  const pptEditMessages = workbench.sessions.ppt.pptEditMessages
  const pptDirty = workbench.sessions.ppt.pptDirty
  const pptEditingSlideId = workbench.sessions.ppt.pptEditingSlideId
  const pptSlideEditStatus = workbench.sessions.ppt.pptSlideEditStatus
  const pptIsResuming = workbench.sessions.ppt.pptIsResuming
  const pptSourceType = workbench.sessions.ppt.pptSourceType
  const pptOriginalFilePath = workbench.sessions.ppt.pptOriginalFilePath
  const pptOriginalFileName = workbench.sessions.ppt.pptOriginalFileName
  const pptImportStatus = workbench.sessions.ppt.pptImportStatus
  const pptImportWarnings = workbench.sessions.ppt.pptImportWarnings
  const effectivePptSlides = pptSlides.length > 0 ? pptSlides : pptLiveSlides
  const pptTemplateOptions = useMemo(() => buildPptTemplateOptions(), [])
  const activePptTemplateId = resolvePptTemplateId(pptActiveTemplateManifestId)
  const activePptTemplateLabel = resolvePptTemplateLabel(activePptTemplateId, pptTemplateOptions)

  const modeOption = getGenerationModeOption(currentMode)
  // document 结果优先读 formal template session；workbench.resultPath 仅用于兼容旧预览消费者。
  const documentPath = currentMode === 'document' ? (commitResult?.outputPath ?? workbench.resultPath) : null
  const activeDocumentTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTabId) || null,
    [activeTabId, tabs],
  )
  const hasEditableDocumentTab = Boolean(activeDocumentTab && activeDocumentTab.id !== mainTabId && !activeDocumentTab.preview)
  const activeDocumentFilePath = hasEditableDocumentTab ? (activeDocumentTab?.filePath || null) : null
  const isCurrentDraftDocument = Boolean(hasEditableDocumentTab && !activeDocumentFilePath)
  const resolvedDocumentPath = activeDocumentFilePath || documentPath
  const documentDirectoryPath = resolvedDocumentPath ? getParentPath(resolvedDocumentPath) : ''
  const documentJsonPreviewDocument = currentMode === 'document' ? (commitResult?.documentArtifact?.document ?? null) : null
  const editableDocumentJsonPreviewDocument = currentMode === 'document'
    ? (documentEditState?.previewDocument ?? documentJsonPreviewDocument)
    : null
  const documentPreviewModel = useMemo(
    () => (editableDocumentJsonPreviewDocument ? buildDocumentPreviewModel(editableDocumentJsonPreviewDocument) : null),
    [editableDocumentJsonPreviewDocument],
  )
  const previewDiagnostics = documentPreviewModel?.diagnostics || null
  const currentPreviewPath = currentMode === 'document' ? documentPath : workbench.resultPath
  const documentPreview = useDocumentPreview(currentMode === 'document' && !documentJsonPreviewDocument ? documentPath : null)
  const slideOutline = useMemo(() => parseSlideOutline(workbench.resultPreviewText), [workbench.resultPreviewText])
  const currentTemplate = useMemo(
    () => knowledge.documents.find((item) => item.id === workbench.currentTemplateId) || null,
    [knowledge.documents, workbench.currentTemplateId],
  )
  const statusText = useMemo(
    () => formatModeStatusText(currentMode, workbench.generationStatus.phase),
    [currentMode, workbench.generationStatus.phase],
  )
  const failureSummary = useMemo(() => (
    workbench.generationStatus.phase === 'error'
      ? summarizeFailureMessage(workbench.generationStatus.message, currentMode)
      : null
  ), [currentMode, workbench.generationStatus.message, workbench.generationStatus.phase])
  const recentGenerationTime = useMemo(
    () => formatRecentGenerationTime(workbench.generationStatus.updatedAt),
    [workbench.generationStatus.updatedAt],
  )
  const selectedAssetCount = currentMode === 'image'
    ? workbench.imageReferences.length
    : workbench.selectedAssetIds.length
  const selectedAssetLabel = currentMode === 'image' ? '参考图' : '已选素材'
  const compactPreviewMessage = useMemo(
    () => (previewMessage ? compactMetaText(previewMessage) : null),
    [previewMessage],
  )
  const documentActionTitle = useMemo(() => {
    const preferredTitle = activeDocumentTab?.fileName
      || workbench.resultTitle
      || getFileName(resolvedDocumentPath || '')
      || '当前文稿'
    return stripFileExtension(preferredTitle) || '当前文稿'
  }, [activeDocumentTab?.fileName, resolvedDocumentPath, workbench.resultTitle])
  const canUseDocumentFloatingActions = currentMode === 'document'
    && !isCurrentDraftDocument
    && Boolean(resolvedDocumentPath)
  const documentFloatingHint = useMemo(() => {
    if (floatingActionBusy === 'knowledge') return '正在把当前文稿导入知识库，请稍候。'
    if (floatingActionBusy === 'ppt') return '正在切换到 PPT 工作台，并准备自动开始生成。'
    if (isCurrentDraftDocument) return '当前是未保存草稿，请先保存到工作区后再继续。'
    if (!resolvedDocumentPath) return '请先生成或打开一个可落盘的文稿。'
    return '你可以把当前文稿沉淀到知识库，或直接把它作为主材料切到 PPT 工作台继续生成。'
  }, [floatingActionBusy, isCurrentDraftDocument, resolvedDocumentPath])
  const previewToolbarTitle = currentMode === 'document'
    ? (documentJsonPreviewDocument ? '成稿预览' : '文稿预览')
    : `${modeOption.label}预览主区`
  const previewToolbarHint = currentMode === 'document' && documentJsonPreviewDocument
    ? '这里默认按 A4 成稿页面展示当前文稿。需要微调时，将鼠标移到标题、正文、待补内容或图片上，即可直接在原位置修改。'
    : modeOption.previewHint

  useEffect(() => {
    documentEditStateRef.current = documentEditState
  }, [documentEditState])

  useEffect(() => {
    const nextState = documentJsonPreviewDocument
      ? rebaseDocumentEditState(documentJsonPreviewDocument, pendingRebasePatchesRef.current)
      : null
    pendingRebasePatchesRef.current = []
    documentEditStateRef.current = nextState
    setDocumentEditState(nextState)
  }, [documentJsonPreviewDocument])

  const getCommitMessages = useCallback((action: DocumentEditAction) => {
    if (action.type === 'replace_block') {
      return {
        pending: '正在把当前段落改写提交到正式模板结果...',
        success: '段落改写已提交为正式结果，预览已重新对齐正式结果。',
        mirror: '段落改写已提交为正式结果。',
        failure: '段落改写提交失败。',
        shellValidationFailure: '模板壳层校验未通过，本次段落改写未生效。',
      }
    }

    if (action.type === 'fill_slot') {
      return {
        pending: '正在把当前待补内容提交到正式模板结果...',
        success: '待补内容已提交为正式结果，预览已重新对齐正式结果。',
        mirror: '待补内容已提交为正式结果。',
        failure: '待补内容提交失败。',
        shellValidationFailure: '模板壳层校验未通过，本次待补内容修改未生效。',
      }
    }

    return {
      pending: '正在把当前图片替换提交到正式模板结果...',
      success: '图片替换已提交为正式结果，预览已重新对齐正式结果。',
      mirror: '图片替换已提交为正式结果。',
      failure: '图片替换提交失败。',
      shellValidationFailure: '模板壳层校验未通过，本次图片替换未生效。',
    }
  }, [])

  const handleApplyDocumentEditAction = useCallback(async (action: DocumentEditAction): Promise<boolean> => {
    const currentState = documentEditStateRef.current
    if (!currentState) {
      setPreviewMessage('当前文稿暂不可编辑。')
      return false
    }

    const result = applyDocumentEditAction(currentState, action)
    documentEditStateRef.current = result.state
    setDocumentEditState(result.state)

    if (!result.ok) {
      setPreviewMessage(`修改未生效：${result.error.message}`)
      return false
    }

    setPreviewMessage(result.message)

    if (action.type === 'replace_block' || action.type === 'fill_slot' || action.type === 'replace_image') {
      const commitMessages = getCommitMessages(action)
      const commitResult = await commitDocumentEdit(result.state.patches, {
        pendingStatusMessage: commitMessages.pending,
        successStatusMessage: commitMessages.mirror,
        successMirrorMessage: commitMessages.mirror,
        genericFailureMessage: commitMessages.failure,
        shellValidationFailureMessage: commitMessages.shellValidationFailure,
      })
      if (!commitResult.success) {
        setPreviewMessage(`本地预览已更新，但正式提交失败：${commitResult.errorMessage}`)
        return true
      }

      pendingRebasePatchesRef.current = result.state.patches.filter((patch) => patch.type !== 'replace_block' && patch.type !== 'fill_slot' && patch.type !== 'replace_image')
      setPreviewMessage(commitMessages.success)
    }

    return true
  }, [commitDocumentEdit, getCommitMessages])

  const isWebArtifactId = (path: string) => {
    const p = String(path || '').trim()
    return p.length > 0 && !p.includes('/') && !p.includes('\\')
  }

  const isApiDownloadUrl = (path: string) => String(path || '').trim().startsWith('/api/')

  const ensurePptxFilename = (name: string | null | undefined) => {
    const normalized = String(name || '').trim()
    if (!normalized) return '演示文稿.pptx'
    return normalized.toLowerCase().endsWith('.pptx') ? normalized : `${normalized}.pptx`
  }

  const readWebAuthToken = () => {
    if (typeof window === 'undefined') return null
    return (
      window.localStorage.getItem('aios_auth_token')
      ?? window.localStorage.getItem('aios_itoken')
      ?? window.localStorage.getItem('ai_office_internal_token')
    )
  }

  const downloadProtectedUrl = async (url: string, filename: string) => {
    const token = readWebAuthToken()
    const headers: Record<string, string> = {}
    if (token) headers.Authorization = `Bearer ${token}`
    const response = await fetch(url, { headers })
    if (!response.ok) {
      const body = await response.json().catch(() => null) as { message?: string; error?: string } | null
      throw new Error(body?.message || body?.error || `下载失败 (${response.status})`)
    }
    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000)
  }

  const handleOpenPath = async (targetPath: string, successMessage: string, failurePrefix: string) => {
    if (isWebShim()) {
      setPreviewMessage(webMigrationLabel('用系统程序打开本地文件'))
      return
    }
    const normalizedPath = normalizeFileLikePath(targetPath)
    if (!normalizedPath) {
      setPreviewMessage(failurePrefix)
      return
    }
    const opened = await window.electronAPI.openExternalFile(normalizedPath)
    setPreviewMessage(opened.success ? successMessage : `${failurePrefix}${opened.error ? `：${opened.error}` : ''}`)
  }

  const handleDownloadDocument = async () => {
    if (!documentPath) {
      setPreviewMessage('请先生成文稿，再下载结果。')
      return
    }
    const defaultName = getFileName(documentPath) || '正式模板输出.docx'
    const chosenPath = await window.electronAPI.saveFileDialog(defaultName)
    if (!chosenPath) return
    const finalPath = /\.[^.]+$/.test(chosenPath) ? chosenPath : `${chosenPath}.docx`
    try {
      const copied = await window.electronAPI.copyFileToPath(documentPath, finalPath)
      setPreviewMessage(`文稿已保存到 ${copied.path}`)
    } catch (error) {
      setPreviewMessage(error instanceof Error ? `下载失败：${error.message}` : '下载失败。')
    }
  }

  const handleSaveDocumentToWorkspace = useCallback(async () => {
    await saveActiveDocument({ reason: 'manual' })
    if (activeWorkspacePath) {
      void refreshTree().catch(() => undefined)
    }
  }, [activeWorkspacePath, refreshTree, saveActiveDocument])

  const handleSaveDocumentAs = useCallback(async () => {
    await saveActiveDocumentAs()
    if (activeWorkspacePath) {
      void refreshTree().catch(() => undefined)
    }
  }, [activeWorkspacePath, refreshTree, saveActiveDocumentAs])

  const handleOpenPptx = async () => {
    const pptxPath = workbench.resultPath
    if (!pptxPath) {
      setPreviewMessage('请先生成 PPT，再打开。')
      return
    }
    await handleOpenPath(pptxPath, '已用 PowerPoint 打开 PPT 文件。', '打开 PPT 文件失败')
  }

  const handleDownloadPptx = async () => {
    const deckId = pptDeckId || pptDeckDocumentId
    let effectiveExportUrl = pptDownloadUrl || workbench.resultPath
    let effectiveArtifactId = typeof pptArtifactId === 'string' && pptArtifactId.trim() ? pptArtifactId : null
    if (isWebShim() && deckId && (pptDirty || !effectiveExportUrl)) {
      const exported = await exportWebPptDeck({ deckId, engine: pptEngine || undefined })
      if (!exported.success || !exported.artifact?.id || !exported.exportUrl) {
        setPreviewMessage(exported.error || '下载前刷新最新 PPT 失败')
        return
      }
      const nextSlides = mergeDeckIntoLiveSlides(exported, effectivePptSlides)
      effectiveExportUrl = exported.exportUrl
      effectiveArtifactId = exported.artifact.id
      workbench.setModeSession('ppt', (session) => ({
        ...session,
        pptSlides: nextSlides,
        pptLiveSlides: nextSlides,
        pptArtifactId: exported.artifact?.id || session.pptArtifactId,
        pptDownloadUrl: exported.exportUrl || session.pptDownloadUrl,
        resultAssetId: exported.artifact?.id || session.resultAssetId,
        resultPath: exported.exportUrl || session.resultPath,
        resultTitle: exported.artifact?.title || session.resultTitle,
        pptDirty: false,
      }))
    }
    const pptxPath = effectiveExportUrl
    if (!pptxPath) {
      setPreviewMessage('请先生成 PPT，再下载结果。')
      return
    }
    if (isWebShim()) {
      try {
        const artifactId = isWebArtifactId(String(workbench.resultAssetId || ''))
          ? String(workbench.resultAssetId)
          : (isWebArtifactId(pptxPath) ? pptxPath : '')
        const resolvedArtifactId = (effectiveArtifactId && isWebArtifactId(String(effectiveArtifactId)) ? String(effectiveArtifactId) : '') || artifactId
        if (resolvedArtifactId) {
          const artifacts = await platformApi.artifacts.list()
          const artifact = artifacts.find((a) => a.id === resolvedArtifactId)
          const filename = artifact
            ? (artifactDownloadFilename(artifact) || '演示文稿.pptx')
            : '演示文稿.pptx'
          if (artifact && artifactHasExport(artifact)) {
            await platformApi.artifacts.download(artifact.id, filename)
            setPreviewMessage(`已下载 ${filename}`)
            return
          }
        }

        const filename = isApiDownloadUrl(pptxPath)
          ? ensurePptxFilename(workbench.resultTitle)
          : (getFileName(pptxPath) || ensurePptxFilename(workbench.resultTitle))
        if (isApiDownloadUrl(pptxPath)) {
          await downloadProtectedUrl(pptxPath, filename)
          setPreviewMessage(`已下载 ${filename}`)
          return
        }
        if (deckId) {
          await downloadProtectedUrl(`/api/ppt/decks/${deckId}/download`, filename)
          setPreviewMessage(`已下载 ${filename}`)
          return
        }
        setPreviewMessage('未找到可下载的 PPT 产物')
      } catch (e) {
        setPreviewMessage(e instanceof Error ? e.message : '下载失败')
      }
      return
    }
    const defaultName = getFileName(pptxPath) || '演示文稿.pptx'
    const chosenPath = await window.electronAPI.saveFileDialog(defaultName)
    if (!chosenPath) return
    const finalPath = /\.[^.]+$/.test(chosenPath) ? chosenPath : `${chosenPath}.pptx`
    try {
      const copied = await window.electronAPI.copyFileToPath(pptxPath, finalPath)
      setPreviewMessage(`PPT 已保存到 ${copied.path}`)
    } catch (error) {
      setPreviewMessage(error instanceof Error ? `下载 PPT 失败：${error.message}` : '下载 PPT 失败。')
    }
  }

  const handleInsertImageToDocument = async () => {
    const src = workbench.resultPreviewUrl || toDisplayUrl(workbench.resultPath || '')
    if (!src) {
      setPreviewMessage('没有可插入的图片，请先生成图表。')
      return
    }
    if (!runtime) {
      setPreviewMessage('当前没有激活的文档，请先打开或新建文档后再插入。')
      return
    }
    await runtime.insertAnchoredImage({ src, alt: workbench.resultTitle || '图表', placement: 'cursor' })
    setPreviewMessage('图表已插入编辑器。')
    setStatusMessage('图表已插入编辑器')
  }

  const handleSaveImageToWorkspace = async () => {
    const sourcePath = workbench.resultPath || workbench.resultPreviewUrl || ''
    if (!sourcePath || !activeWorkspacePath) {
      setPreviewMessage('请先打开工作区，再保存图片结果。')
      return
    }

    try {
      const structure = await window.electronAPI.detectProjectStructure(activeWorkspacePath)
      const fileName = workbench.resultTitle || 'generated-image.png'
      const isBase64 = /^data:image\//i.test(sourcePath)
      let saved: { success: boolean; path: string; relativePath: string; filename: string }
      if (isBase64) {
        const base64Data = sourcePath.replace(/^data:[^;]+;base64,/, '')
        saved = structure.hasFigures
          ? await window.electronAPI.saveImageToFiguresBase64(activeWorkspacePath, fileName, base64Data)
          : await window.electronAPI.saveImageToWorkspace(activeWorkspacePath, fileName, base64Data)
      } else {
        saved = structure.hasFigures
          ? await window.electronAPI.saveImageToFigures(activeWorkspacePath, normalizeFileLikePath(sourcePath), fileName)
          : await window.electronAPI.saveImageFromUrl(activeWorkspacePath, normalizeFileLikePath(sourcePath), fileName)
      }
      workbench.setGenerationResult({
        resultAssetId: saved.path,
        resultPath: saved.path,
        resultTitle: saved.filename,
        resultPreviewUrl: toDisplayUrl(saved.path),
      })
      setStatusMessage(`图片已保存到工作区：${saved.filename}`)
      setPreviewMessage(`图片已保存到 ${saved.path}`)
    } catch (error) {
      setPreviewMessage(error instanceof Error ? `保存图片失败：${error.message}` : '保存图片失败。')
    }
  }

  // Load available PPT skills once when entering PPT mode
  useEffect(() => {
    if (currentMode !== 'ppt') return
    // Only expose the 3 canonical deck templates in the template switcher
    const DECK_TEMPLATE_IDS = ['academic_defense', 'chinese_season', 'business_report']
    window.electronAPI.pptxListSkills({ workspacePath: activeWorkspacePath || undefined }).then((result) => {
      if (result.success && result.skills) {
        setPptAvailableSkills(result.skills.filter((s) => DECK_TEMPLATE_IDS.includes(s.id) || s.source === 'skill'))
      }
    }).catch(() => undefined)
    // Also load recent content package history (last 5)
    if (activeWorkspacePath) {
      window.electronAPI.pptxListContentPackages({ workspacePath: activeWorkspacePath })
        .then((result) => {
          if (result.success && result.packages) {
            setPptPackageHistory(result.packages.slice(0, 5))
          }
        })
        .catch(() => undefined)
    }
  }, [currentMode, activeWorkspacePath])

  // Auto-recover the most recent content package after app restart
  useEffect(() => {
    if (currentMode !== 'ppt') return
    if (pptContentPackageId) return  // already have one in memory
    if (!activeWorkspacePath) return
    window.electronAPI.pptxListContentPackages({ workspacePath: activeWorkspacePath })
      .then((result) => {
        if (result.success && result.packages && result.packages.length > 0) {
          const latest = result.packages[0]  // sorted newest-first
          workbench.setModeSession('ppt', (session) => ({
            ...session,
            pptContentPackageId: session.pptContentPackageId || latest.packageId,
          }))
        }
      })
      .catch(() => undefined)
  }, [currentMode, pptContentPackageId, activeWorkspacePath, workbench])

  const handleApplyPptSkill = useCallback(async (skillId: string) => {
    if (!activeWorkspacePath || !pptContentPackageId || pptSkillBusy) return
    if (skillId === pptActiveSkillId) return
    setPptSkillBusy(true)
    setPptSkillApplyStatus('应用模板中 · 不消耗 token')
    workbench.setGenerationStatus('running', '应用模板中 · 不消耗 token')
    try {
      const rendered = await window.electronAPI.pptxRenderWithSkill({
        workspacePath: activeWorkspacePath,
        contentPackageId: pptContentPackageId,
        skillId,
      })
      if (!rendered.success) {
        setPptSkillApplyStatus(`应用模板失败：${rendered.error || '未知错误'}`)
        workbench.setGenerationStatus('error', rendered.error || '应用模板失败')
        return
      }
      workbench.setModeSession('ppt', (session) => ({
        ...session,
        resultPath: rendered.outputPath || session.resultPath,
        resultAssetId: rendered.outputPath || session.resultAssetId,
        pptActiveSkillId: skillId,
        generationStatus: { phase: 'completed', message: '模板已切换 · 不消耗 token', updatedAt: new Date().toISOString() },
      }))
      const skillName = pptAvailableSkills.find((s) => s.id === skillId)?.name || skillId
      setPptSkillApplyStatus(`已切换到「${skillName}」· 不消耗 token`)
    } catch (error) {
      const message = error instanceof Error ? error.message : '应用模板失败'
      setPptSkillApplyStatus(`应用模板失败：${message}`)
      workbench.setGenerationStatus('error', message)
    } finally {
      setPptSkillBusy(false)
    }
  }, [activeWorkspacePath, pptContentPackageId, pptSkillBusy, pptActiveSkillId, workbench, pptAvailableSkills])

  const handleStopPptGeneration = useCallback(() => {
    workbench.setModeSession('ppt', (session) => ({
      ...session,
      pptStopRequested: true,
      pptTaskStatus: 'stopped',
    }))
  }, [workbench])

  const handlePptSkillApplied = useCallback(async (skillId: string, outputPath: string) => {
    const skillName = pptAvailableSkills.find(s => s.id === skillId)?.name || skillId
    workbench.setModeSession('ppt', (session) => ({
      ...session,
      resultPath: outputPath,
      resultAssetId: outputPath,
      resultTitle: getFileName(outputPath),
      pptActiveSkillId: skillId,
      pptActiveTemplateManifestId: skillId,
      pptTaskStatus: 'completed',
      generationStatus: { phase: 'completed', message: `模板已应用：${skillName} · 不消耗 token`, updatedAt: new Date().toISOString() },
    }))
    setPptSkillApplyStatus(`模板已应用：${skillName} · 不消耗 token`)

    // Refresh preview images for the new template's PPTX output
    const deckId = workbench.sessions.ppt.pptDeckDocumentId
    if (activeWorkspacePath && deckId && outputPath) {
      try {
        const previewDir = `${activeWorkspacePath}\\05_Presentation\\decks\\${deckId}\\preview\\${skillId}`
        const previewResult = await window.electronAPI.deckPreview({
          pptxPath: outputPath,
          previewDir,
        })
        if (previewResult.success && previewResult.slides && previewResult.slides.length > 0) {
          const previewSlides = previewResult.slides
          workbench.setModeSession('ppt', (session) => ({
            ...session,
            pptLiveSlides: session.pptLiveSlides.length > 0
              ? session.pptLiveSlides.map((slide, index) => ({
                  ...slide,
                  imagePath: previewSlides[index]?.imagePath || slide.imagePath,
                  imageLoading: false,
                  isGenerating: false,
                }))
              : previewSlides.map((ps: { index: number; imagePath: string }) => ({
                  index: ps.index,
                  type: 'content' as const,
                  title: `第 ${ps.index + 1} 页`,
                  imagePath: ps.imagePath,
                  imageLoading: false,
                  isGenerating: false,
                })),
            pptActiveSlideIndex: 0,
            pptTotalSlides: session.pptLiveSlides.length || previewSlides.length,
            pptPreviewSlides: previewSlides.map((ps: { index: number; imagePath: string }) => ({
              index: ps.index,
              imagePath: ps.imagePath,
              title: session.pptLiveSlides[ps.index]?.title || `第 ${ps.index + 1} 页`,
            })),
          }))
        } else if (previewResult.warning) {
          console.warn('[pptSkill] preview warning after template switch:', previewResult.warning)
        }
      } catch (prevErr) {
        console.warn('[pptSkill] preview error after template switch:', prevErr)
      }
    }
  }, [workbench, pptAvailableSkills, activeWorkspacePath])

  const appendPptEditMessage = useCallback((slideId: string, message: PptAiMessage) => {
    workbench.setModeSession('ppt', (session) => ({
      ...session,
      pptEditMessages: {
        ...session.pptEditMessages,
        [slideId]: [...(session.pptEditMessages[slideId] || []), message],
      },
    }))
  }, [workbench])

  const handlePptSelectSlide= useCallback((index: number) => {
    const slide = effectivePptSlides[index]
    workbench.setModeSession('ppt', (session) => ({
      ...session,
      pptActiveSlideIndex: index,
      pptEditingSlideId: slide?.id || session.pptEditingSlideId,
    }))
  }, [effectivePptSlides, workbench])

  const handlePptSelectPackage = useCallback((packageId: string) => {
    workbench.setModeSession('ppt', (session) => ({
      ...session,
      pptContentPackageId: packageId,
      pptActiveSkillId: null,
    }))
  }, [workbench])

  const handlePptEditSlideWithAi = useCallback(async (instruction: string) => {
    const activeSlide = effectivePptSlides[pptActiveSlideIndex]
    const deckId = pptDeckId || pptDeckDocumentId
    if (!activeSlide?.id || !deckId) {
      const message = '请先生成 PPT，再选择要修改的页面。'
      setPreviewMessage(message)
      return
    }
    const slideId = activeSlide.id
    const now = new Date().toISOString()
    appendPptEditMessage(slideId, {
      id: `user-${Date.now()}`,
      role: 'user',
      content: instruction,
      createdAt: now,
      slideId,
      status: 'done',
    })
    workbench.setModeSession('ppt', (session) => ({
      ...session,
      pptEditingSlideId: slideId,
      pptSlideEditStatus: 'applying',
    }))
    const result = await editWebPptSlide({
      deckId,
      slideId,
      instruction,
      currentSlide: {
        ...activeSlide.raw,
        id: activeSlide.id,
        index: activeSlide.index,
        title: activeSlide.title,
        subtitle: activeSlide.subtitle,
        bullets: activeSlide.bullets || activeSlide.items || [],
        layout: activeSlide.layout,
        notes: activeSlide.notes || activeSlide.speakerNotes,
        table: activeSlide.table,
        timeline: activeSlide.timeline,
        columns: activeSlide.columns,
        quote: activeSlide.quote,
      },
      deckContext: {
        title: workbench.resultTitle || workbench.generationPrompt.slice(0, 40) || '演示文稿',
        slideCount: effectivePptSlides.length,
        nearbySlides: buildNearbySlidesContext(effectivePptSlides, pptActiveSlideIndex),
      },
      engine: pptEngine === 'slidev' ? 'slidev' : pptEngine === 'builtin' ? 'builtin' : 'minimax_pptx_generator',
      allowFallback: pptEngine !== 'slidev',
    })
    if (!result.success || !result.updatedSlide || !result.artifact?.id || !result.exportUrl) {
      appendPptEditMessage(slideId, {
        id: `assistant-error-${Date.now()}`,
        role: 'system',
        content: result.error || '当前页修改失败',
        createdAt: new Date().toISOString(),
        slideId,
        status: 'error',
      })
      workbench.setModeSession('ppt', (session) => ({
        ...session,
        pptSlideEditStatus: 'error',
      }))
      setPreviewMessage(result.error || '当前页修改失败')
      return
    }
    const nextSlides = result.deck
      ? mergeDeckIntoLiveSlides(result, effectivePptSlides)
      : replaceSlideInPreviews(effectivePptSlides, result.updatedSlide)
    appendPptEditMessage(slideId, {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: result.message || `已使用 MiniMax PPTX Generator 修改第 ${pptActiveSlideIndex + 1} 页。只修改当前页，其他页面未变更。`,
      createdAt: new Date().toISOString(),
      slideId,
      status: 'done',
    })
    workbench.setModeSession('ppt', (session) => ({
      ...session,
      pptSlides: nextSlides,
      pptLiveSlides: nextSlides,
      pptTotalSlides: nextSlides.length,
      pptArtifactId: result.artifact?.id || session.pptArtifactId,
      pptDownloadUrl: result.exportUrl || session.pptDownloadUrl,
      resultAssetId: result.artifact?.id || session.resultAssetId,
      resultPath: result.exportUrl || session.resultPath,
      resultTitle: result.artifact?.title || session.resultTitle,
      pptDirty: false,
      pptSlideEditStatus: 'idle',
      pptEditingSlideId: slideId,
      pptEngine: result.engine === 'slidev' ? 'slidev' : result.engine === 'builtin' ? 'builtin' : result.engine === 'minimax_pptx_generator' ? 'minimax_pptx_generator' : session.pptEngine,
      pptPreviewUrl: result.previewUrl || session.pptPreviewUrl,
      pptSlidevMarkdown: result.slidevMarkdown || session.pptSlidevMarkdown,
      generationStatus: {
        phase: 'completed',
        message: result.message || `已修改第 ${pptActiveSlideIndex + 1} 页。只修改当前页，其他页面未变更。`,
        updatedAt: new Date().toISOString(),
      },
    }))
    setPreviewMessage(result.message || `已修改第 ${pptActiveSlideIndex + 1} 页。只修改当前页，其他页面未变更。`)
  }, [appendPptEditMessage, effectivePptSlides, pptActiveSlideIndex, pptDeckDocumentId, pptDeckId, pptEngine, workbench])

  const handleSavePptDeck = useCallback(async () => {
    const deckId = pptDeckId || pptDeckDocumentId
    if (!deckId) {
      setPreviewMessage('当前没有可保存的 deck。')
      return
    }
    if (!pptDirty) {
      setPreviewMessage('当前修改已保存。')
      return
    }
    const result = await exportWebPptDeck({ deckId, engine: pptEngine || undefined })
    if (!result.success || !result.artifact) {
      setPreviewMessage(result.error || '保存修改失败')
      return
    }
    const nextSlides = mergeDeckIntoLiveSlides(result, effectivePptSlides)
    workbench.setModeSession('ppt', (session) => ({
      ...session,
      pptSlides: nextSlides,
      pptLiveSlides: nextSlides,
      pptArtifactId: result.artifact?.id || session.pptArtifactId,
      pptDownloadUrl: result.exportUrl || session.pptDownloadUrl,
      resultAssetId: result.artifact?.id || session.resultAssetId,
      resultPath: result.exportUrl || session.resultPath,
      pptDirty: false,
      generationStatus: {
        phase: 'completed',
        message: result.message || '已保存',
        updatedAt: new Date().toISOString(),
      },
    }))
    setPreviewMessage(result.message || '已保存')
  }, [effectivePptSlides, mergeDeckIntoLiveSlides, pptDeckDocumentId, pptDeckId, pptDirty, pptEngine, workbench])

  const handleRetemplatePptDeck = useCallback(async (templateId: string) => {
    const deckId = pptDeckId || pptDeckDocumentId
    const nextTemplateId = resolvePptTemplateId(templateId)
    const currentTemplateId = resolvePptTemplateId(pptActiveTemplateManifestId)
    if (!deckId || !nextTemplateId) {
      setPreviewMessage('请先生成 PPT，再切换模板。')
      return
    }
    if (pptSkillBusy) return
    if (nextTemplateId === currentTemplateId) {
      setPreviewMessage(`当前已使用「${resolvePptTemplateLabel(nextTemplateId, pptTemplateOptions)}」模板。`)
      return
    }

    const switchingMessage = '模板切换中，不消耗 token'
    setPptSkillBusy(true)
    setPptSkillApplyStatus(switchingMessage)
    workbench.setModeSession('ppt', (session) => ({
      ...session,
      pptTaskStatus: 'applying_template',
      pptDirty: false,
      generationStatus: {
        phase: 'running',
        message: switchingMessage,
        updatedAt: new Date().toISOString(),
      },
    }))

    try {
      const result = await retemplateWebPptDeck({ deckId, templateId: nextTemplateId })
      if (!result.success || !result.deck) {
        const message = result.error || '模板切换失败'
        setPptSkillApplyStatus(message)
        setPreviewMessage(message)
        setStatusMessage(message)
        workbench.setModeSession('ppt', (session) => ({
          ...session,
          pptTaskStatus: 'completed',
          generationStatus: {
            phase: 'error',
            message,
            updatedAt: new Date().toISOString(),
          },
        }))
        return
      }

      const nextSlides = mergeDeckIntoLiveSlides(result, effectivePptSlides)
      const appliedLabel = resolvePptTemplateLabel(nextTemplateId, pptTemplateOptions)
      const successMessage = '模板已切换，不消耗 token'
      workbench.setModeSession('ppt', (session) => ({
        ...session,
        pptSlides: nextSlides,
        pptLiveSlides: nextSlides,
        pptTotalSlides: nextSlides.length,
        pptActiveSlideIndex: Math.min(session.pptActiveSlideIndex, Math.max(nextSlides.length - 1, 0)),
        pptDeckId: result.deckId || session.pptDeckId,
        pptDeckDocumentId: result.deckId || session.pptDeckDocumentId,
        pptArtifactId: result.artifact?.id || session.pptArtifactId,
        pptDownloadUrl: result.exportUrl || session.pptDownloadUrl,
        pptActiveTemplateManifestId: nextTemplateId,
        resultAssetId: result.artifact?.id || session.resultAssetId,
        resultPath: result.exportUrl || session.resultPath,
        resultTitle: result.artifact?.title || session.resultTitle,
        pptDirty: false,
        pptTaskStatus: 'completed',
        generationStatus: {
          phase: 'completed',
          message: successMessage,
          updatedAt: new Date().toISOString(),
        },
      }))
      setPptSkillApplyStatus(`${successMessage} · 当前模板：${appliedLabel}`)
      setPreviewMessage(successMessage)
      setStatusMessage(`${successMessage}，预览和下载内容已更新。`)
    } catch (error) {
      const message = error instanceof Error ? error.message : '模板切换失败'
      setPptSkillApplyStatus(message)
      setPreviewMessage(message)
      setStatusMessage(message)
      workbench.setModeSession('ppt', (session) => ({
        ...session,
        pptTaskStatus: 'completed',
        generationStatus: {
          phase: 'error',
          message,
          updatedAt: new Date().toISOString(),
        },
      }))
    } finally {
      setPptSkillBusy(false)
    }
  }, [
    effectivePptSlides,
    pptActiveTemplateManifestId,
    pptDeckDocumentId,
    pptDeckId,
    pptSkillBusy,
    pptTemplateOptions,
    setStatusMessage,
    workbench,
  ])

  const handleRegenerateDeck = useCallback(() => {
    window.dispatchEvent(new CustomEvent('ppt-workbench-regenerate'))
  }, [])

  const handleImportPptContent = useCallback(async () => {
    if (!activeWorkspacePath) {
      setPreviewMessage('请先选择工作区。')
      return
    }
    if (pptTemplateImporting || pptSkillBusy) return

    setPptTemplateImporting(true)
    workbench.setGenerationStatus('running', '正在导入 PPT 内容…')
    try {
      const imported = await window.electronAPI.pptxImportFromDialog({ workspacePath: activeWorkspacePath })
      if (imported.canceled) {
        workbench.setGenerationStatus('idle', '')
        return
      }
      if (!imported.success) {
        const message = imported.error || '导入 PPT 失败。'
        setPreviewMessage(message)
        workbench.setGenerationStatus('error', message)
        return
      }

      const filename = imported.originalPptxPath
        ? getFileName(imported.originalPptxPath)
        : '导入的 PPT'

      const nextSlides: PptSlidePreview[] = mergeDeckIntoLiveSlides(imported.deck, []).map((slide, index) => ({
        ...slide,
        imagePath: imported.previewSlides?.[index]?.imagePath || null,
        imageLoading: false,
        isGenerating: false,
      }))

      const message = `已导入原版 PPT：${filename}`
      workbench.setModeSession('ppt', (session) => ({
        ...session,
        resultPath: imported.originalPptxPath || session.resultPath,
        resultAssetId: imported.originalPptxPath || session.resultAssetId,
        resultTitle: filename,
        pptDeckDocumentId: imported.deckDocumentId || session.pptDeckDocumentId,
        pptDeckPath: imported.deckPath || session.pptDeckPath,
        pptOriginalFilePath: imported.originalPptxPath || session.pptOriginalFilePath,
        pptOriginalFileName: filename,
        pptSourceType: 'imported_pptx',
        pptActiveSkillId: null,
        pptActiveTemplateManifestId: null,
        pptLiveSlides: nextSlides.length > 0 ? nextSlides : session.pptLiveSlides,
        pptPreviewSlides: nextSlides.length > 0
          ? nextSlides.filter((s) => s.imagePath).map((s) => ({ index: s.index, imagePath: s.imagePath as string, title: s.title || '' }))
          : session.pptPreviewSlides,
        pptTotalSlides: nextSlides.length || session.pptTotalSlides,
        pptActiveSlideIndex: 0,
        pptTaskStatus: 'completed',
        pptImportStatus: 'ready',
        pptImportWarnings: imported.extractionWarnings || [],
        generationStatus: {
          phase: 'completed',
          message: `${message} · 当前查看：原始 PPT，尚未应用模板`,
          updatedAt: new Date().toISOString(),
        },
      }))
      setPreviewMessage(message)
      setPptSkillApplyStatus('当前查看：原始 PPT · 尚未应用模板')
    } catch (error) {
      const message = error instanceof Error ? error.message : '导入 PPT 失败。'
      setPreviewMessage(message)
      workbench.setGenerationStatus('error', message)
    } finally {
      setPptTemplateImporting(false)
    }
  }, [activeWorkspacePath, mergeDeckIntoLiveSlides, pptSkillBusy, pptTemplateImporting, workbench])

  const refreshRenderedDeckPreview= useCallback(async (
    outputPath: string,
    deckId: string,
    manifestId: string,
    baseSlides: PptSlidePreview[],
  ): Promise<PptSlidePreview[] | null> => {
    if (!activeWorkspacePath) return null
    const previewDir = `${activeWorkspacePath}\\05_Presentation\\decks\\${deckId}\\preview\\${manifestId}`
    const previewResult = await window.electronAPI.deckPreview({
      pptxPath: outputPath,
      previewDir,
    })
    if (!previewResult.success || !previewResult.slides?.length) return null
    if (baseSlides.length === 0) {
      return previewResult.slides.map((slide) => ({
        index: slide.index,
        type: 'content',
        title: slide.title || `第 ${slide.index + 1} 页`,
        imagePath: slide.imagePath,
        imageLoading: false,
        isGenerating: false,
      }))
    }
    return baseSlides.map((slide, index) => ({
      ...slide,
      imagePath: previewResult.slides?.[index]?.imagePath || slide.imagePath,
      imageLoading: false,
      isGenerating: false,
    }))
  }, [activeWorkspacePath])

  const handlePptRerender = useCallback(async () => {
    if (!activeWorkspacePath || pptSkillBusy) return
    if (!pptContentPackageId && !pptDeckDocumentId) return
    const skillId = pptActiveTemplateManifestId || pptActiveSkillId || 'business_report'
    setPptSkillBusy(true)
    setPptSkillApplyStatus('应用模板中 · 不消耗 token')
    workbench.setModeSession('ppt', (s) => ({ ...s, pptTaskStatus: 'rendering_preview' }))
    try {
      const rendered = pptDeckDocumentId
        ? await window.electronAPI.deckRender({
            workspacePath: activeWorkspacePath,
            deckId: pptDeckDocumentId,
            manifestId: skillId,
          })
        : await window.electronAPI.pptxRenderWithSkill({
            workspacePath: activeWorkspacePath,
            contentPackageId: pptContentPackageId || '',
            skillId,
          })
      if (rendered.success && rendered.outputPath) {
        let nextSlides: PptSlidePreview[] | null = null
        if (pptDeckDocumentId) {
          const previewDir = `${activeWorkspacePath}\\05_Presentation\\decks\\${pptDeckDocumentId}\\preview\\${skillId}`
          const previewResult = await window.electronAPI.deckPreview({
            pptxPath: rendered.outputPath,
            previewDir,
          })
          if (previewResult.success && previewResult.slides?.length) {
            nextSlides = pptLiveSlides.map((slide, index) => ({
              ...slide,
              imagePath: previewResult.slides?.[index]?.imagePath || slide.imagePath,
              imageLoading: false,
              isGenerating: false,
            }))
          } else if (previewResult.warning || previewResult.error) {
            setPptSkillApplyStatus(`重新渲染完成，预览提示：${previewResult.warning || previewResult.error}`)
          }
        }
        workbench.setModeSession('ppt', (s) => ({
          ...s,
          resultPath: rendered.outputPath || s.resultPath,
          resultAssetId: rendered.outputPath || s.resultAssetId,
          pptActiveSkillId: skillId,
          pptActiveTemplateManifestId: skillId,
          pptTaskStatus: 'completed',
          pptLiveSlides: nextSlides || s.pptLiveSlides,
          pptPreviewSlides: nextSlides
            ? nextSlides.filter((slide) => slide.imagePath).map((slide) => ({ index: slide.index, imagePath: slide.imagePath as string, title: slide.title }))
            : s.pptPreviewSlides,
          generationStatus: { phase: 'completed', message: '重新渲染完成 · 不消耗 token', updatedAt: new Date().toISOString() },
        }))
        setPptSkillApplyStatus('重新渲染完成 · 不消耗 token')
      } else {
        const message = rendered.error || '重新渲染失败'
        workbench.setGenerationStatus('error', message)
        setPptSkillApplyStatus(message)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '重新渲染失败'
      workbench.setGenerationStatus('error', message)
      setPptSkillApplyStatus(message)
    } finally {
      setPptSkillBusy(false)
    }
  }, [activeWorkspacePath, pptContentPackageId, pptDeckDocumentId, pptActiveTemplateManifestId, pptActiveSkillId, pptSkillBusy, pptLiveSlides, workbench])

  const handleResumePptGeneration = useCallback(() => {
    if (!pptContentPackageId) return
    // Signal GenerationPromptComposer to resume from partial ContentPackage
    workbench.setModeSession('ppt', (s) => ({
      ...s,
      pptResumeRequested: true,
      pptStopRequested: false,
    }))
  }, [pptContentPackageId, workbench])

  const handleOpenPptOriginalFile = useCallback(async () => {
    let sourcePath = pptOriginalFilePath || ''
    if (!sourcePath && activeWorkspacePath && pptDeckDocumentId) {
      const loaded = await window.electronAPI.deckLoad({ workspacePath: activeWorkspacePath, deckId: pptDeckDocumentId })
      const deckSource = loaded.success && loaded.deck && typeof loaded.deck === 'object'
        ? (loaded.deck as { source?: { sourcePath?: string } }).source
        : null
      sourcePath = deckSource?.sourcePath || ''
    }
    if (!sourcePath) {
      const message = '源文件不存在，可能已被移动或删除。'
      setPreviewMessage(message)
      setPptSkillApplyStatus(message)
      return
    }
    const opened = await window.electronAPI.openExternalFile(sourcePath)
    if (!opened.success) {
      const message = opened.error?.includes('路径不存在')
        ? '源文件不存在，可能已被移动或删除。'
        : `打开源文件失败${opened.error ? `：${opened.error}` : ''}`
      setPreviewMessage(message)
      setPptSkillApplyStatus(message)
      return
    }
    setPreviewMessage('已打开源文件。')
    setPptSkillApplyStatus('已打开源文件。')
  }, [activeWorkspacePath, pptDeckDocumentId, pptOriginalFilePath])

  const handlePptUpdateSlide = useCallback(async (slideIndex: number, updates: Record<string, unknown>): Promise<boolean> => {
    if (!activeWorkspacePath || !pptDeckDocumentId) {
      setPreviewMessage('当前没有可保存的 DeckDocument。')
      return false
    }
    try {
      const result = await window.electronAPI.deckUpdateSlide({
        workspacePath: activeWorkspacePath,
        deckId: pptDeckDocumentId,
        slideIndex,
        updates,
      })
      if (!result.success) {
        setPreviewMessage(`保存当前页失败：${result.error || '未知错误'}`)
        return false
      }
      const manifestId = pptActiveTemplateManifestId || pptActiveSkillId || 'business_report'
      const baseSlides = mergeDeckIntoLiveSlides(result.deck, workbench.sessions.ppt.pptLiveSlides)
      workbench.setModeSession('ppt', (session) => ({
        ...session,
        pptLiveSlides: baseSlides,
        pptDeckPath: result.filePath || session.pptDeckPath,
        pptTaskStatus: 'rendering_preview',
        generationStatus: {
          phase: 'running',
          message: '当前页已保存，正在重新渲染预览 · 不消耗 token',
          updatedAt: new Date().toISOString(),
        },
      }))

      const rendered = await window.electronAPI.deckRender({
        workspacePath: activeWorkspacePath,
        deckId: pptDeckDocumentId,
        manifestId,
      })
      if (!rendered.success || !rendered.outputPath) {
        const message = `当前页已保存，但重新渲染失败：${rendered.error || '未知错误'}`
        workbench.setModeSession('ppt', (session) => ({
          ...session,
          pptTaskStatus: 'completed',
          generationStatus: { phase: 'error', message, updatedAt: new Date().toISOString() },
        }))
        setPreviewMessage(message)
        return true
      }

      const nextSlides = await refreshRenderedDeckPreview(rendered.outputPath, pptDeckDocumentId, manifestId, baseSlides)
      workbench.setModeSession('ppt', (session) => ({
        ...session,
        resultPath: rendered.outputPath || session.resultPath,
        resultAssetId: rendered.outputPath || session.resultAssetId,
        resultTitle: rendered.outputPath ? getFileName(rendered.outputPath) : session.resultTitle,
        pptLiveSlides: nextSlides || baseSlides,
        pptPreviewSlides: nextSlides
          ? nextSlides.filter((slide) => slide.imagePath).map((slide) => ({ index: slide.index, imagePath: slide.imagePath as string, title: slide.title }))
          : session.pptPreviewSlides,
        pptTotalSlides: (nextSlides || baseSlides).length,
        pptTaskStatus: 'completed',
        generationStatus: {
          phase: 'completed',
          message: '当前页已保存并刷新预览 · 不消耗 token',
          updatedAt: new Date().toISOString(),
        },
      }))
      setPreviewMessage('当前页已保存并刷新预览。')
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : '保存当前页失败'
      setPreviewMessage(message)
      return false
    }
  }, [activeWorkspacePath, mergeDeckIntoLiveSlides, pptActiveSkillId, pptActiveTemplateManifestId, pptDeckDocumentId, refreshRenderedDeckPreview, workbench])

  const handleAiOptimizePptStructure = useCallback(async () => {
    if (!activeWorkspacePath || !pptDeckDocumentId) {
      const message = '请先生成或导入 PPT 内容后再优化结构。'
      setPreviewMessage(message)
      setPptSkillApplyStatus(message)
      return
    }
    if (pptSkillBusy) return

    const manifestId = pptActiveTemplateManifestId || pptActiveSkillId || 'business_report'
    setPptSkillBusy(true)
    setPptSkillApplyStatus('正在优化结构...')
    workbench.setModeSession('ppt', (session) => ({
      ...session,
      pptTaskStatus: 'generating_deck',
      generationStatus: { phase: 'running', message: '正在优化结构...', updatedAt: new Date().toISOString() },
    }))

    try {
      const optimized = await window.electronAPI.deckOptimizeStructure({
        workspacePath: activeWorkspacePath,
        deckId: pptDeckDocumentId,
      })
      if (!optimized.success || !optimized.deck) {
        const message = optimized.error || 'AI 返回的结构不完整，已保留原 PPT。'
        workbench.setModeSession('ppt', (session) => ({
          ...session,
          pptTaskStatus: 'completed',
          generationStatus: { phase: 'error', message, updatedAt: new Date().toISOString() },
        }))
        setPreviewMessage(message)
        setPptSkillApplyStatus(`优化失败：${message}`)
        return
      }

      const baseSlides = mergeDeckIntoLiveSlides(optimized.deck, workbench.sessions.ppt.pptLiveSlides)
      setPptSkillApplyStatus('正在重新渲染...')
      workbench.setModeSession('ppt', (session) => ({
        ...session,
        pptDeckPath: optimized.deckPath || session.pptDeckPath,
        pptLiveSlides: baseSlides,
        pptTotalSlides: baseSlides.length,
        pptTaskStatus: 'rendering_preview',
        generationStatus: { phase: 'running', message: '正在重新渲染...', updatedAt: new Date().toISOString() },
      }))

      const rendered = await window.electronAPI.deckRender({
        workspacePath: activeWorkspacePath,
        deckId: pptDeckDocumentId,
        manifestId,
      })
      if (!rendered.success || !rendered.outputPath) {
        const message = rendered.error || '重新渲染失败'
        workbench.setModeSession('ppt', (session) => ({
          ...session,
          pptTaskStatus: 'completed',
          generationStatus: { phase: 'error', message: `优化已保存，但${message}`, updatedAt: new Date().toISOString() },
        }))
        setPreviewMessage(`优化已保存，但${message}`)
        setPptSkillApplyStatus(`优化失败：${message}`)
        return
      }

      const nextSlides = await refreshRenderedDeckPreview(rendered.outputPath, pptDeckDocumentId, manifestId, baseSlides)
      workbench.setModeSession('ppt', (session) => ({
        ...session,
        resultPath: rendered.outputPath || session.resultPath,
        resultAssetId: rendered.outputPath || session.resultAssetId,
        resultTitle: rendered.outputPath ? getFileName(rendered.outputPath) : session.resultTitle,
        pptLiveSlides: nextSlides || baseSlides,
        pptPreviewSlides: nextSlides
          ? nextSlides.filter((slide) => slide.imagePath).map((slide) => ({ index: slide.index, imagePath: slide.imagePath as string, title: slide.title }))
          : session.pptPreviewSlides,
        pptTotalSlides: (nextSlides || baseSlides).length,
        pptActiveSkillId: manifestId,
        pptActiveTemplateManifestId: manifestId,
        pptTaskStatus: 'completed',
        generationStatus: { phase: 'completed', message: '优化完成', updatedAt: new Date().toISOString() },
      }))
      setPreviewMessage('优化完成')
      setPptSkillApplyStatus('优化完成')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI 优化结构失败'
      workbench.setModeSession('ppt', (session) => ({
        ...session,
        pptTaskStatus: 'completed',
        generationStatus: { phase: 'error', message: `优化失败：${message}`, updatedAt: new Date().toISOString() },
      }))
      setPreviewMessage(`优化失败：${message}`)
      setPptSkillApplyStatus(`优化失败：${message}`)
    } finally {
      setPptSkillBusy(false)
    }
  }, [activeWorkspacePath, mergeDeckIntoLiveSlides, pptActiveSkillId, pptActiveTemplateManifestId, pptDeckDocumentId, pptSkillBusy, refreshRenderedDeckPreview, workbench])

  const handleExportPartialPptx = useCallback(async () => {
    if (!activeWorkspacePath || !pptContentPackageId || pptSkillBusy) return
    const skillId = pptActiveSkillId || 'cuhk_sz_default'
    setPptSkillBusy(true)
    workbench.setModeSession('ppt', (s) => ({ ...s, pptTaskStatus: 'rendering_preview' }))
    try {
      const rendered = await window.electronAPI.pptxRenderWithSkill({
        workspacePath: activeWorkspacePath,
        contentPackageId: pptContentPackageId,
        skillId,
      })
      if (rendered.success && rendered.outputPath) {
        workbench.setModeSession('ppt', (s) => ({
          ...s,
          resultPath: rendered.outputPath || s.resultPath,
          resultAssetId: rendered.outputPath || s.resultAssetId,
          pptActiveSkillId: skillId,
          pptTaskStatus: 'stopped', // stay in stopped, not completed
        }))
        setPptSkillApplyStatus('已导出已生成部分 · 不消耗 token')
      }
    } catch { /* ignore */ } finally {
      setPptSkillBusy(false)
    }
  }, [activeWorkspacePath, pptContentPackageId, pptActiveSkillId, pptSkillBusy, workbench])

  const handleOpenFolder = useCallback(async () => {
    if (!activeWorkspacePath) {
      setPreviewMessage('请先选择工作区。')
      return
    }
    const folderPath = workbench.resultPath
      ? getParentPath(workbench.resultPath)
      : `${activeWorkspacePath.replace(/[\\/]+$/, '')}/05_Presentation`
    if (!folderPath) {
      setPreviewMessage('无法确定目录路径。')
      return
    }
    const result = await window.electronAPI.openFolderSafe(folderPath, { createIfMissing: true })
    if (!result.ok) {
      setPreviewMessage(result.error || '打开目录失败。')
    }
  }, [workbench.resultPath, activeWorkspacePath])

  const ensureKnowledgeDocumentImported = useCallback(async (options?: { announce?: boolean }) => {
    if (isCurrentDraftDocument || !resolvedDocumentPath) {
      const message = isCurrentDraftDocument
        ? '请先保存当前文稿，再存入知识库或生成 PPT。'
        : '当前没有可导入到知识库的文稿。'
      setPreviewMessage(message)
      setStatusMessage(message)
      return null
    }

    const targetPath = normalizeFileLikePath(resolvedDocumentPath)
    if (!targetPath) {
      const message = '当前文稿路径无效，暂时无法导入知识库。'
      setPreviewMessage(message)
      setStatusMessage(message)
      return null
    }

    try {
      const result = await window.electronAPI.importKnowledgeDocumentFromPath(knowledge.departmentId, targetPath)
      const preferredDocument = result.imported[0] || result.duplicates[0] || null
      if (!preferredDocument?.id) {
        const failure = result.failed[0]
        const message = result.canceled
          ? '已取消导入知识库。'
          : failure
            ? `导入知识库失败：${failure.error}`
            : '导入知识库失败。'
        setPreviewMessage(message)
        setStatusMessage(message)
        return null
      }

      await knowledge.refresh()

      if (options?.announce !== false) {
        const importedNow = result.imported.some((item) => item.id === preferredDocument.id)
        const message = importedNow
          ? `已存入知识库：${preferredDocument.title}`
          : `知识库已存在该文稿：${preferredDocument.title}`
        setPreviewMessage(message)
        setStatusMessage(message)
      }

      return preferredDocument
    } catch (error) {
      const message = error instanceof Error ? `导入知识库失败：${error.message}` : '导入知识库失败。'
      setPreviewMessage(message)
      setStatusMessage(message)
      return null
    }
  }, [isCurrentDraftDocument, knowledge, resolvedDocumentPath, setStatusMessage])

  const handleSaveToKnowledge = useCallback(async () => {
    if (floatingActionBusy) return
    setFloatingActionBusy('knowledge')
    try {
      await ensureKnowledgeDocumentImported()
    } finally {
      setFloatingActionBusy(null)
    }
  }, [ensureKnowledgeDocumentImported, floatingActionBusy])

  const handleGeneratePptFromDocument = useCallback(async () => {
    if (floatingActionBusy) return
    setFloatingActionBusy('ppt')
    try {
      const now = new Date().toISOString()
      let previewText = documentPreview.kind === 'ready' ? (documentPreview.plainText || '') : ''
      if (!previewText.trim() && resolvedDocumentPath?.toLowerCase().endsWith('.docx')) {
        const snapshot = await window.electronAPI.readOoxmlPackage(resolvedDocumentPath).catch(() => null)
        previewText = String(snapshot?.plainText || '').trim()
      }
      const directSource = createPptPrimarySourceState({
        title: documentActionTitle,
        documentArtifact: commitResult?.documentArtifact || workbench.sessions.document.documentArtifact,
        previewText,
        updatedAt: now,
      })
      if (!directSource) {
        const message = '当前文稿暂无可用于生成 PPT 的正文内容。'
        setPreviewMessage(message)
        setStatusMessage(message)
        return
      }

      const nextPrompt = workbench.sessions.ppt.generationPrompt.trim() || buildDefaultPptPrompt(documentActionTitle)
      workbench.setModeSession('ppt', (session) => ({
        ...session,
        generationPrompt: nextPrompt,
        generationStatus: {
          phase: 'idle',
          message: '已载入当前文稿，切换后将自动开始生成 PPT。',
          updatedAt: now,
        },
        pendingAutoSubmitToken: `${Date.now()}-ppt-direct-source`,
        pendingAutoSubmitTargetAssetId: null,
        pptPrimarySource: directSource,
        lastUpdatedAt: now,
      }))
      enterPptGenerationMode()

      const message = `已切换到 PPT 模式，正在基于《${documentActionTitle}》准备生成。`
      setPreviewMessage(message)
      setStatusMessage(message)
    } finally {
      setFloatingActionBusy(null)
    }
  }, [commitResult?.documentArtifact, documentActionTitle, documentPreview, enterPptGenerationMode, floatingActionBusy, resolvedDocumentPath, setStatusMessage, workbench])

  const renderDocumentFloatingActions = () => {
    if (currentMode !== 'document') return null

    return (
      <FloatingActionIsland data-testid="document-preview-floating-actions">
        <FloatingActionEyebrow>文稿后续动作</FloatingActionEyebrow>
        <FloatingActionTitle>{documentActionTitle}</FloatingActionTitle>
        <FloatingActionHint>{documentFloatingHint}</FloatingActionHint>
        <FloatingActionButtons>
          <FloatingActionButton
            type="button"
            onClick={() => void handleSaveToKnowledge()}
            disabled={!canUseDocumentFloatingActions || floatingActionBusy !== null}
            data-testid="document-preview-save-knowledge-button"
          >
            {floatingActionBusy === 'knowledge' ? '正在存入…' : '存入知识库'}
          </FloatingActionButton>
          <FloatingActionButton
            type="button"
            $tone="primary"
            onClick={() => void handleGeneratePptFromDocument()}
            disabled={!canUseDocumentFloatingActions || floatingActionBusy !== null}
            data-testid="document-preview-generate-ppt-button"
          >
            {floatingActionBusy === 'ppt' ? '正在跳转…' : '生成 PPT'}
          </FloatingActionButton>
        </FloatingActionButtons>
      </FloatingActionIsland>
    )
  }

  const renderToolbarActions = () => {
    if (currentMode === 'document') {
      if (hasEditableDocumentTab && isCurrentDraftDocument) {
        return (
          <>
            {/* Only show "保存到工作区" when a workspace is actually open */}
            {activeWorkspacePath && (
              <SecondaryButton type="button" onClick={() => void handleSaveDocumentToWorkspace()}>
                保存到工作区
              </SecondaryButton>
            )}
            <SecondaryButton type="button" onClick={() => void handleSaveDocumentAs()}>
              另存为
            </SecondaryButton>
          </>
        )
      }

      if (hasEditableDocumentTab) {
        return (
          <>
            <SecondaryButton type="button" onClick={() => void handleOpenPath(resolvedDocumentPath || '', '已打开当前文稿。', '打开当前文稿失败')} disabled={!resolvedDocumentPath}>
              打开文稿
            </SecondaryButton>
            <SecondaryButton type="button" onClick={() => void handleSaveDocumentAs()}>
              另存为
            </SecondaryButton>
            <SecondaryButton type="button" onClick={() => void handleOpenPath(documentDirectoryPath, '已打开文稿目录。', '打开文稿目录失败')} disabled={!documentDirectoryPath}>
              打开目录
            </SecondaryButton>
          </>
        )
      }

      return (
        <>
          <SecondaryButton type="button" onClick={() => void handleOpenPath(documentPath || '', '已打开生成文稿。', '打开生成文稿失败')} disabled={!documentPath}>
            打开文稿
          </SecondaryButton>
          <SecondaryButton type="button" onClick={() => void handleDownloadDocument()} disabled={!documentPath}>
            下载文稿
          </SecondaryButton>
          <SecondaryButton type="button" onClick={() => void handleOpenPath(outputDirectoryPath, '已打开输出目录。', '打开输出目录失败')} disabled={!documentPath}>
            打开目录
          </SecondaryButton>
        </>
      )
    }

    if (currentMode === 'image') {
      const hasResult = Boolean(workbench.resultPreviewUrl || workbench.resultPath)
      return (
        <>
          <PrimaryButton type="button" onClick={() => void handleInsertImageToDocument()} disabled={!hasResult || !runtime}>
            插入编辑器
          </PrimaryButton>
          <SecondaryButton type="button" onClick={() => void handleSaveImageToWorkspace()} disabled={!hasResult || !activeWorkspacePath || imageAlreadyInWorkspace}>
            {imageAlreadyInWorkspace ? '已在工作区' : '保存到工作区'}
          </SecondaryButton>
          <SecondaryButton type="button" onClick={() => void handleOpenPath(workbench.resultPath || '', '已打开图片结果。', '打开图片结果失败')} disabled={!workbench.resultPath}>
            打开图片
          </SecondaryButton>
        </>
      )
    }

    if (currentMode === 'ppt') {
      return (
        <>
          {!isWebShim() && (
            <SecondaryButton type="button" onClick={() => void handleOpenPath(workbench.resultPath || '', '已打开 PPT 文件。', '打开 PPT 文件失败')} disabled={!workbench.resultPath}>
              打开 PPT
            </SecondaryButton>
          )}
          <SecondaryButton type="button" onClick={() => void handleDownloadPptx()} disabled={!workbench.resultPath}>
            下载 PPT
          </SecondaryButton>
          {!isWebShim() && (
            <SecondaryButton type="button" onClick={() => void handleOpenFolder()} disabled={!workbench.resultPath}>
              打开目录
            </SecondaryButton>
          )}
        </>
      )
    }

    return null
  }

  const renderPreviewBody = () => {
    if (currentMode === 'document') {
      if (editableDocumentJsonPreviewDocument) {
        return (
          <DocumentPreviewRenderer
            document={editableDocumentJsonPreviewDocument}
            model={documentPreviewModel || undefined}
            editErrorMessage={documentEditState?.lastError || null}
            onApplyEditAction={handleApplyDocumentEditAction}
            testId="generation-result-document-preview"
          />
        )
      }

      return (
        <ReadonlyDocumentPreview
          preview={documentPreview}
          idleMessage={modeOption.previewHint}
          loadingMessage="正在读取文稿预览..."
          testId="generation-result-document-preview"
        />
      )
    }

    if (currentMode === 'image') {
      const previewUrl = workbench.resultPreviewUrl || toDisplayUrl(workbench.resultPath || '')
      return (
        <ImageStageSurface>
          {previewUrl ? (
            <ImageStage>
              <ImagePreview src={previewUrl} alt={workbench.resultTitle || '生成图片结果'} />
            </ImageStage>
          ) : (
            <ImageEmptyState>
              <ImageEmptyTitle>图片结果将在这里显示</ImageEmptyTitle>
              <ImageEmptyText>
                右侧主区只保留结果预览本身。生成完成后，结果会直接挂载到这里，并可从右上角直接打开、保存到工作区或打开所在目录。
              </ImageEmptyText>
            </ImageEmptyState>
          )}
        </ImageStageSurface>
      )
    }

    // PPT mode: show slide plan preview (JSON-based or Markdown-based)
    if (!workbench.resultPreviewText.trim()) {
      return <MinimalHint>{modeOption.previewHint}</MinimalHint>
    }

    // Try to parse JSON slide plan (new pptx flow)
    const jsonPlan = parseSlidePlanJson(workbench.resultPreviewText)
    if (jsonPlan) {
      return (
        <SlideGrid>
          {jsonPlan.title ? <HintText>{jsonPlan.title}（共 {jsonPlan.slides.length} 页）</HintText> : null}
          {jsonPlan.slides.map((slide, index) => (
            <SlideCard key={`${slide.heading || slide.title || ''}-${index}`}>
              <SlideTitle>{slideTypeLabel(slide.type)}：{slide.heading || slide.title || `第 ${index + 1} 页`}</SlideTitle>
              {(slide.items || []).map((item, bulletIndex) => (
                <SlideBullet key={`${item}-${bulletIndex}`}>• {item}</SlideBullet>
              ))}
              {slide.subtitle ? <SlideBullet>{slide.subtitle}</SlideBullet> : null}
            </SlideCard>
          ))}
        </SlideGrid>
      )
    }

    // Fallback: old markdown outline
    if (slideOutline.slides.length === 0) {
      return <TextStage>{workbench.resultPreviewText}</TextStage>
    }

    return (
      <SlideGrid>
        {slideOutline.deckTitle ? <HintText>{slideOutline.deckTitle}</HintText> : null}
        {slideOutline.slides.map((slide, index) => (
          <SlideCard key={`${slide.title}-${index}`}>
            <SlideTitle>{slide.title}</SlideTitle>
            {slide.bullets.map((bullet, bulletIndex) => (
              <SlideBullet key={`${bullet}-${bulletIndex}`}>- {bullet}</SlideBullet>
            ))}
          </SlideCard>
        ))}
      </SlideGrid>
    )
  }

  const outputDirectoryPath = currentPreviewPath ? getParentPath(currentPreviewPath) : ''
  const imageAlreadyInWorkspace = currentMode === 'image'
    && Boolean(activeWorkspacePath && workbench.resultPath && normalizeFileLikePath(workbench.resultPath).startsWith(activeWorkspacePath))
  const pptEngineStatusMessage = useMemo(() => {
    if (pptFallbackFrom) {
      const reason = pptFallbackReason ? `（原因：${pptFallbackReason}）` : ''
      return `MiniMax PPTX Generator 失败，已回退内置引擎${reason}`
    }
    return pptEngine === 'minimax_pptx_generator'
      ? '生成引擎：MiniMax PPTX Generator Skill'
      : pptEngine === 'slidev'
        ? '生成引擎：Slidev 网页演示'
        : pptEngine === 'builtin'
          ? '生成引擎：内置 PptxGenJS'
          : ''
  }, [pptEngine, pptFallbackFrom, pptFallbackReason])
  const pptPageEditEngineLabel = useMemo(() => (
    isWebShim() || pptEngine === 'minimax_pptx_generator'
      ? '当前页修改引擎：MiniMax PPTX Generator Skill'
      : pptEngine === 'slidev'
        ? '当前页修改引擎：Slidev'
        : '当前页修改引擎：内置 fallback'
  ), [pptEngine])

  // PPT mode: full-screen workbench replaces the default Shell layout
  if (currentMode === 'ppt') {
    return (
      <div data-testid="generation-result-preview-panel" style={{ flex: 1, width: '100%', height: '100%', minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <PptWorkbenchPanel
          title={workbench.resultTitle || workbench.generationPrompt.slice(0, 40) || 'PPT 工作台'}
          taskStatus={pptTaskStatus}
          liveSlides={effectivePptSlides}
          totalSlides={pptTotalSlides}
          activeSlideIndex={pptActiveSlideIndex}
          resultPath={workbench.resultPath}
          templateStatusMessage={pptSkillApplyStatus || pptEngineStatusMessage || workbench.generationStatus.message}
          pptEngineLabel={pptEngineStatusMessage || '生成引擎：待生成'}
          pptEditEngineLabel={pptPageEditEngineLabel}
          templateLabel={activePptTemplateLabel}
          templateId={activePptTemplateId}
          templateOptions={pptTemplateOptions}
          pptDirty={pptDirty}
          pptEditMessages={pptEditMessages}
          pptEditingSlideId={pptEditingSlideId}
          pptSlideEditStatus={pptSlideEditStatus}
          templateBusy={pptSkillBusy || pptTaskStatus === 'applying_template'}
          pptOutputMode={pptOutputMode || undefined}
          pptPreviewUrl={pptPreviewUrl || undefined}
          pptSlidevMarkdown={pptSlidevMarkdown || undefined}
          onDownloadPpt={() => void handleDownloadPptx()}
          onTemplateChange={(templateId) => void handleRetemplatePptDeck(templateId)}
          onSelectSlide={handlePptSelectSlide}
          onRegenerateDeck={handleRegenerateDeck}
          onSaveDeck={() => void handleSavePptDeck()}
          onAiEditSlide={handlePptEditSlideWithAi}
        />
      </div>
    )
  }

  return (
    <Shell data-testid="generation-result-preview-panel">
      <Toolbar>
        <ToolbarCopy>
          <ToolbarTitle>{previewToolbarTitle}</ToolbarTitle>
          <ToolbarHint>
            {previewToolbarHint}
          </ToolbarHint>
        </ToolbarCopy>
        <ToolbarActions>{renderToolbarActions()}</ToolbarActions>
      </Toolbar>

      <Stage>
        <StageScroll>
          <StageCanvas>
            {renderPreviewBody()}
            {renderDocumentFloatingActions()}
          </StageCanvas>
        </StageScroll>
      </Stage>

      <BottomBar>
        <StatusMain>
          <StatusDot $phase={workbench.generationStatus.phase} />
          <StatusText>{statusText}</StatusText>
        </StatusMain>

        <StatusMeta>
          {currentTemplate?.title ? (
            <StatusMetaItem title={`当前模板：${currentTemplate.title}`}>
              <StatusMetaLabel>当前模板</StatusMetaLabel>
              <StatusMetaValue>{currentTemplate.title}</StatusMetaValue>
            </StatusMetaItem>
          ) : null}

          {currentMode === 'document' && previewDiagnostics?.template?.mode ? (
            <StatusMetaItem title={`模板模式：${previewDiagnostics.template.mode}`}>
              <StatusMetaLabel>模板模式</StatusMetaLabel>
              <StatusMetaValue>{formatTemplateModeLabel(previewDiagnostics.template.mode)}</StatusMetaValue>
            </StatusMetaItem>
          ) : null}

          {currentMode === 'document' && formatExecutionModeLabel(previewDiagnostics) ? (
            <StatusMetaItem title={`生成策略：${formatExecutionModeLabel(previewDiagnostics) || ''}`}>
              <StatusMetaLabel>生成策略</StatusMetaLabel>
              <StatusMetaValue>{formatExecutionModeLabel(previewDiagnostics) || ''}</StatusMetaValue>
            </StatusMetaItem>
          ) : null}

          {currentMode === 'document' && previewDiagnostics?.formalTemplate?.fallbackReasonCode ? (
            <StatusMetaItem $tone="error" title={previewDiagnostics.formalTemplate.fallbackReason || previewDiagnostics.formalTemplate.fallbackReasonCode}>
              <StatusMetaLabel>回退原因</StatusMetaLabel>
              <StatusMetaValue $tone="error">{previewDiagnostics.formalTemplate.fallbackReason || previewDiagnostics.formalTemplate.fallbackReasonCode}</StatusMetaValue>
            </StatusMetaItem>
          ) : null}

          {selectedAssetCount > 0 ? (
            <StatusMetaItem title={`${selectedAssetLabel}：${selectedAssetCount}`}>
              <StatusMetaLabel>{selectedAssetLabel}</StatusMetaLabel>
              <StatusMetaValue>{String(selectedAssetCount)}</StatusMetaValue>
            </StatusMetaItem>
          ) : null}

          {recentGenerationTime ? (
            <StatusMetaItem title={`最近生成：${recentGenerationTime}`}>
              <StatusMetaLabel>最近生成</StatusMetaLabel>
              <StatusMetaValue>{recentGenerationTime}</StatusMetaValue>
            </StatusMetaItem>
          ) : null}

          {failureSummary ? (
            <StatusMetaItem $tone="error" title={failureSummary}>
              <StatusMetaLabel>错误</StatusMetaLabel>
              <StatusMetaValue $tone="error">{failureSummary}</StatusMetaValue>
            </StatusMetaItem>
          ) : null}

          {compactPreviewMessage ? (
            <StatusMetaItem title={previewMessage || undefined}>
              <StatusMetaLabel>最近操作</StatusMetaLabel>
              <StatusMetaValue>{compactPreviewMessage}</StatusMetaValue>
            </StatusMetaItem>
          ) : null}
        </StatusMeta>
      </BottomBar>
    </Shell>
  )
}
