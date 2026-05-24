import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import styled from 'styled-components'
import { useWorkspace } from '../../../contexts/WorkspaceContext'
import { useDocumentWorkspaceKnowledge } from '../../../contexts/DocumentWorkspaceContext'
import { useDepartment } from '../../../contexts/DepartmentContext'
import { KnowledgeTreePicker } from '../../../components/knowledge/KnowledgeTreePicker'
import { platformApi } from '../../../platform'
import type { FileEntry } from '../../../platform'
import {
  DocumentAiEditPanel,
  type DocumentAiScope,
  type SectionHistoryEntry,
} from './DocumentAiEditPanel'
import {
  DocumentEditorCanvas,
  type DocumentEditorCanvasHandle,
} from './DocumentEditorCanvas'
import { DocumentAttachmentPanel, DocumentKnowledgePanel } from './DocumentKnowledgePanel'
import { DocumentOutlinePanel } from './DocumentOutlinePanel'
import { DocumentTemplatePanel } from './DocumentTemplatePanel'
import { DocumentTopToolbar } from './DocumentTopToolbar'
import {
  analyzeFormalTemplateFlow,
  buildKnowledgeRefsFromSelection,
  commitFormalTemplate,
  confirmFormalTemplateFields,
  continueDocument,
  editDocumentSection,
  editDocumentSelection,
  engineLabel,
  exportDocumentArtifact,
  importDocumentDocx,
  loadDocumentWorkbenchConfig,
  previewFormalTemplate,
  routeDocumentTask,
  saveEditableDocument,
  startDocumentTask,
  waitForDocumentTask,
  type DocumentTaskResult,
  type DocumentTemplateOption,
  type EditableDocumentState,
} from '../services/documentWorkbenchApi'
import {
  createEditableStateFromTaskResult,
  updateEditableStateFromHtml,
} from '../services/documentDraftTransforms'
import { runDocumentSkill } from '../services/documentSkillAdapter'
import { runPaperWorkflowGenerate } from '../services/paperWorkflowAdapter'
import { fetchContentHandoff } from '../services/contentHandoffApi'
import { consumePendingDocumentHandoff, peekPendingDocumentHandoff } from '../../../services/pendingDocumentHandoff'

const Shell = styled.div`
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #eef3f8;
  position: relative;
`

const Body = styled.div`
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  overflow: hidden;
  position: relative;
`

const CenterPane = styled.div`
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
`

/* ── Overlay system ── */

const OverlayBackdrop = styled.div`
  position: absolute;
  inset: 0;
  z-index: 90;
`

const OutlineDrawerPanel = styled.aside`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 296px;
  z-index: 100;
  background: #f7fafc;
  border-right: 1px solid #d8e3ef;
  overflow: auto;
  padding: 16px;
  box-shadow: 6px 0 24px rgba(15, 23, 42, 0.10);
  display: grid;
  align-content: start;
  gap: 0;
`

const FloatingPanel = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  z-index: 100;
  width: 320px;
  max-height: calc(100vh - 120px);
  overflow: auto;
  background: #fff;
  border: 1px solid #d0dce9;
  border-radius: 16px;
  box-shadow: 0 12px 36px rgba(15, 23, 42, 0.14);
  padding: 16px;
`

const StatusBar = styled.div<{ $tone?: 'ok' | 'err' }>`
  padding: 8px 18px;
  border-top: 1px solid #d8e3ef;
  background: #fff;
  color: ${({ $tone }) => ($tone === 'err' ? '#b91c1c' : $tone === 'ok' ? '#15803d' : '#516679')};
  font-size: 12px;
  flex-shrink: 0;
`

const hiddenInputStyles = {
  display: 'none',
} as const

interface PersistedWorkbenchState {
  templateId: string
  generationPrompt: string
  attachments: FileEntry[]
  editorState: EditableDocumentState
  sectionHistory: Record<string, SectionHistoryEntry[]>
  modifiedSectionIds: string[]
  artifactFilename: string | null
}

interface AiEditSnapshot {
  editorState: EditableDocumentState
  artifactFilename: string | null
  modifiedSectionIds: string[]
  activeHistoryKey: string
  scope: DocumentAiScope
  sectionId: string | null
}

interface RecentAiChange {
  token: number
  scope: DocumentAiScope
  sectionId: string | null
}

function createEmptyEditorState(engine: string): EditableDocumentState {
  return {
    documentId: null,
    artifactId: null,
    exportUrl: null,
    title: '',
    html: '',
    markdown: '',
    documentDraft: undefined,
    outline: [],
    selectedSectionId: null,
    selectedText: '',
    selectionRange: undefined,
    dirty: false,
    saving: false,
    lastSavedAt: undefined,
    engine,
    fallbackFrom: undefined,
    fallbackReason: undefined,
  }
}

function storageKey(workspacePath: string | null): string | null {
  return workspacePath ? `document-workbench:${workspacePath}` : null
}

function loadPersistedState(workspacePath: string | null): PersistedWorkbenchState | null {
  const key = storageKey(workspacePath)
  if (!key || typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as PersistedWorkbenchState
  } catch {
    return null
  }
}

function documentHistoryKey(scope: DocumentAiScope | null, sectionId: string | null): string {
  if (scope === 'selection') return `selection:${sectionId || 'global'}`
  if (scope === 'section') return `section:${sectionId || 'global'}`
  return 'document'
}

function buildDocumentPlainText(result: DocumentTaskResult | EditableDocumentState | null): string {
  const draft = 'document' in (result || {}) ? (result as DocumentTaskResult).document : (result as EditableDocumentState | null)?.documentDraft
  if (!draft) return ''
  return [
    draft.title,
    ...draft.sections.flatMap((section) => [section.title, section.content]),
  ].filter(Boolean).join('\n')
}

function cloneEditorState(state: EditableDocumentState): EditableDocumentState {
  return JSON.parse(JSON.stringify(state)) as EditableDocumentState
}

function stripTransientAiMarkup(html: string): string {
  return String(html || '').replace(/<mark\b[^>]*data-ai-change="true"[^>]*>(.*?)<\/mark>/giu, '$1')
}

export default function DocumentWorkbench() {
  const { activeWorkspacePath, openWorkspace } = useWorkspace()
  const { workspaceKbIds, setWorkspaceKbIds } = useDocumentWorkspaceKnowledge()
  const { departments, loading: departmentsLoading } = useDepartment()

  const [templates, setTemplates] = useState<DocumentTemplateOption[]>([])
  const [defaultEngine, setDefaultEngine] = useState<'builtin' | 'minimax_docx'>('minimax_docx')
  const [fallbackMode, setFallbackMode] = useState<'builtin' | 'none'>('builtin')
  const [selectedTemplateId, setSelectedTemplateId] = useState('annual_report')
  const [attachments, setAttachments] = useState<FileEntry[]>([])
  const [editorState, setEditorState] = useState<EditableDocumentState>(createEmptyEditorState('minimax_docx'))
  const [artifactFilename, setArtifactFilename] = useState<string | null>(null)
  const [modifiedSectionIds, setModifiedSectionIds] = useState<string[]>([])
  const [sectionHistory, setSectionHistory] = useState<Record<string, SectionHistoryEntry[]>>({})
  const [activeHistoryKey, setActiveHistoryKey] = useState('document')
  const [kbPickerOpen, setKbPickerOpen] = useState(false)
  const [outlineOpen, setOutlineOpen] = useState(false)
  const [templatePopoverOpen, setTemplatePopoverOpen] = useState(false)
  const [knowledgeOverlayOpen, setKnowledgeOverlayOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [statusTone, setStatusTone] = useState<'ok' | 'err' | undefined>()
  const [exportError, setExportError] = useState<string | null>(null)
  const [generationPrompt, setGenerationPrompt] = useState('')
  const [hydrated, setHydrated] = useState(false)
  const [lastAiSnapshot, setLastAiSnapshot] = useState<AiEditSnapshot | null>(null)
  const [recentAiChange, setRecentAiChange] = useState<RecentAiChange | null>(null)

  const uploadInputRef = useRef<HTMLInputElement | null>(null)
  const importDocxInputRef = useRef<HTMLInputElement | null>(null)
  const canvasRef = useRef<DocumentEditorCanvasHandle | null>(null)

  useEffect(() => {
    let disposed = false
    void loadDocumentWorkbenchConfig()
      .then((config) => {
        if (disposed) return
        setTemplates(config.templates)
        setDefaultEngine(config.engine)
        setFallbackMode(config.fallback)
        if (!config.templates.some((item) => item.id === selectedTemplateId) && config.templates.length > 0) {
          setSelectedTemplateId(config.templates[0].id)
        }
        setEditorState((prev) => prev.documentId ? prev : createEmptyEditorState(config.engine))
      })
      .catch((error) => {
        if (disposed) return
        setStatusMessage(error instanceof Error ? error.message : '加载文稿模板失败')
        setStatusTone('err')
      })
    return () => {
      disposed = true
    }
  }, [selectedTemplateId])

  useEffect(() => {
    setHydrated(false)
    setLastAiSnapshot(null)
    setRecentAiChange(null)
    if (peekPendingDocumentHandoff()) {
      setHydrated(true)
      return
    }
    const persisted = loadPersistedState(activeWorkspacePath)
    if (persisted) {
      setSelectedTemplateId(persisted.templateId || 'annual_report')
      setAttachments(Array.isArray(persisted.attachments) ? persisted.attachments : [])
      setGenerationPrompt(persisted.generationPrompt || '')
      setEditorState(persisted.editorState || createEmptyEditorState(defaultEngine))
      setModifiedSectionIds(persisted.modifiedSectionIds || [])
      setSectionHistory(persisted.sectionHistory || {})
      setArtifactFilename(persisted.artifactFilename || null)
      setActiveHistoryKey(
        persisted.editorState?.selectedSectionId
          ? documentHistoryKey('section', persisted.editorState.selectedSectionId)
          : 'document',
      )
    }
    setHydrated(true)
  }, [activeWorkspacePath, defaultEngine])

  useEffect(() => {
    const key = storageKey(activeWorkspacePath)
    if (!hydrated || !key || typeof window === 'undefined') return
    const payload: PersistedWorkbenchState = {
      templateId: selectedTemplateId,
      generationPrompt,
      attachments,
      editorState,
      sectionHistory,
      modifiedSectionIds,
      artifactFilename,
    }
    window.localStorage.setItem(key, JSON.stringify(payload))
  }, [activeWorkspacePath, attachments, artifactFilename, editorState, generationPrompt, hydrated, modifiedSectionIds, sectionHistory, selectedTemplateId])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!editorState.dirty) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [editorState.dirty])

  const template = useMemo(
    () => templates.find((item) => item.id === selectedTemplateId) || templates[0] || null,
    [selectedTemplateId, templates],
  )
  const knowledgeNameMap = useMemo(
    () => new Map(departments.map((department) => [department.id, department.name])),
    [departments],
  )

  const selectedSection = useMemo(
    () => editorState.documentDraft?.sections.find((section) => section.id === editorState.selectedSectionId) || null,
    [editorState.documentDraft, editorState.selectedSectionId],
  )

  const currentHistory = sectionHistory[activeHistoryKey] || []

  const activeEngineLabel = engineLabel((editorState.engine as 'builtin' | 'minimax_docx') || defaultEngine)
  const activeTemplateLabel = template?.label || '未选择'
  const artifactLabel = artifactFilename || null

  const appendHistory = useCallback((scope: DocumentAiScope | null, sectionId: string | null, entry: SectionHistoryEntry) => {
    const key = documentHistoryKey(scope, sectionId)
    setSectionHistory((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), entry],
    }))
  }, [])

  const markSectionModified = useCallback((sectionId: string | null) => {
    if (!sectionId) return
    setModifiedSectionIds((prev) => prev.includes(sectionId) ? prev : [...prev, sectionId])
  }, [])

  const captureAiSnapshot = useCallback((scope: DocumentAiScope, sectionId: string | null) => {
    setLastAiSnapshot({
      editorState: cloneEditorState(editorState),
      artifactFilename,
      modifiedSectionIds: [...modifiedSectionIds],
      activeHistoryKey,
      scope,
      sectionId,
    })
  }, [activeHistoryKey, artifactFilename, editorState, modifiedSectionIds])

  const handleUndoLastAiEdit = useCallback(() => {
    if (!lastAiSnapshot) return
    setEditorState({
      ...lastAiSnapshot.editorState,
      dirty: true,
      saving: false,
    })
    setArtifactFilename(lastAiSnapshot.artifactFilename)
    setModifiedSectionIds(lastAiSnapshot.modifiedSectionIds)
    setActiveHistoryKey(lastAiSnapshot.activeHistoryKey)
    setRecentAiChange(null)
    appendHistory(lastAiSnapshot.scope, lastAiSnapshot.sectionId, {
      role: 'assistant',
      text: '已撤回上一次 AI 修改，本地文稿已恢复到修改前状态。',
    })
    setStatusMessage('已撤回上一次 AI 修改，请保存以更新最新 DOCX')
    setStatusTone('ok')
    setExportError(null)
    setLastAiSnapshot(null)
  }, [appendHistory, lastAiSnapshot])

  const syncEditorStateFromTaskResult = useCallback((nextResult: DocumentTaskResult, savedAt?: string) => {
    const nextState = createEditableStateFromTaskResult({
      documentId: nextResult.documentId,
      artifactId: nextResult.artifactId,
      exportUrl: nextResult.exportUrl,
      engine: nextResult.engine,
      fallbackFrom: nextResult.fallbackFrom,
      fallbackReason: nextResult.fallbackReason,
      document: nextResult.document,
    })
    setEditorState({
      ...nextState,
      selectedSectionId: nextState.selectedSectionId,
      selectedText: '',
      selectionRange: undefined,
      dirty: false,
      saving: false,
      lastSavedAt: savedAt,
    })
    setArtifactFilename(nextResult.filename)
    setActiveHistoryKey(
      nextState.selectedSectionId
        ? documentHistoryKey('section', nextState.selectedSectionId)
        : 'document',
    )
  }, [])

  useEffect(() => {
    if (!hydrated) return
    const pending = peekPendingDocumentHandoff()
    if (!pending?.handoffId) return

    let disposed = false
    setBusy(true)
    setStatusMessage('正在加载外部投递文稿…')
    setStatusTone(undefined)

    void (async () => {
      try {
        const detail = pending.detail || await fetchContentHandoff(pending.handoffId)
        if (disposed) return
        if (detail.workspacePath && detail.workspacePath !== activeWorkspacePath) {
          await openWorkspace(detail.workspacePath)
          return
        }
        consumePendingDocumentHandoff()
        syncEditorStateFromTaskResult(detail.result, detail.createdAt)
        setStatusMessage(`已加载外部投递文稿：${detail.title}`)
        setStatusTone('ok')
      } catch (error) {
        if (disposed) return
        consumePendingDocumentHandoff()
        setStatusMessage(error instanceof Error ? error.message : '外部文稿加载失败')
        setStatusTone('err')
      } finally {
        if (!disposed) setBusy(false)
      }
    })()

    return () => {
      disposed = true
    }
  }, [activeWorkspacePath, hydrated, openWorkspace, syncEditorStateFromTaskResult])

  const saveCurrentDocument = useCallback(async (status = '正在保存文稿…') => {
    if (!editorState.documentId || !editorState.documentDraft) return null
    const latestHtml = stripTransientAiMarkup(canvasRef.current?.getHtml() || editorState.html)
    const latestState = latestHtml !== editorState.html
      ? updateEditableStateFromHtml(editorState, latestHtml)
      : editorState
    setEditorState((prev) => ({ ...prev, saving: true }))
    setStatusMessage(status)
    setStatusTone(undefined)
    setExportError(null)
    try {
      const response = await saveEditableDocument({
        documentId: latestState.documentId!,
        title: latestState.title,
        html: latestState.html,
        documentDraft: latestState.documentDraft!,
        outline: latestState.outline,
      })
      const savedAt = response.savedAt || new Date().toISOString()
      setEditorState((prev) => ({
        ...latestState,
        dirty: false,
        saving: false,
        lastSavedAt: savedAt,
        artifactId: response.artifactId || response.artifact?.id || prev.artifactId,
        exportUrl: response.exportUrl || prev.exportUrl,
        documentDraft: response.document || latestState.documentDraft,
        outline: response.outline || latestState.outline,
      }))
      if (response.filename) setArtifactFilename(response.filename)
      setStatusMessage('已保存，DOCX 已更新')
      setStatusTone('ok')
      return response
    } catch (error) {
      const message = error instanceof Error ? error.message : '保存失败'
      setEditorState((prev) => ({ ...prev, saving: false }))
      setExportError(message)
      setStatusMessage(message)
      setStatusTone('err')
      return null
    }
  }, [editorState.documentDraft, editorState.documentId, editorState.html, editorState.outline, editorState.title])

  useEffect(() => {
    if (!hydrated || !editorState.dirty || !editorState.documentId || !editorState.documentDraft || busy || editorState.saving) {
      return
    }
    const timer = window.setTimeout(() => {
      void saveCurrentDocument('正在自动保存文稿…')
    }, 3500)
    return () => {
      window.clearTimeout(timer)
    }
  }, [busy, editorState.dirty, editorState.documentDraft, editorState.documentId, editorState.html, editorState.saving, hydrated, saveCurrentDocument])

  const handleUploadAttachment = useCallback(() => {
    uploadInputRef.current?.click()
  }, [])

  const handleImportDocx = useCallback(() => {
    importDocxInputRef.current?.click()
  }, [])

  const handleAttachmentFileChange = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      setStatusMessage('正在上传附件引用…')
      setStatusTone(undefined)
      const entry = await platformApi.files.upload(file)
      setAttachments((prev) => [...prev, entry])
      setStatusMessage(`已添加附件引用：${entry.name}`)
      setStatusTone('ok')
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : '上传附件失败')
      setStatusTone('err')
    }
  }, [])

  const handleImportDocxFileChange = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !activeWorkspacePath) return
    setBusy(true)
    setStatusTone(undefined)
    setExportError(null)
    try {
      setStatusMessage('正在导入 DOCX…')
      const imported = await importDocumentDocx({
        file,
        workspacePath: activeWorkspacePath,
      })
      syncEditorStateFromTaskResult(imported, new Date().toISOString())
      setModifiedSectionIds([])
      setLastAiSnapshot(null)
      setRecentAiChange(null)
      setOutlineOpen(true)
      setStatusMessage(`DOCX 已导入并进入 DocumentWorkbench：${imported.title}`)
      setStatusTone('ok')
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'DOCX 导入失败')
      setStatusTone('err')
    } finally {
      setBusy(false)
    }
  }, [activeWorkspacePath, syncEditorStateFromTaskResult])

  const handleGenerate = useCallback(async (promptOverride?: string) => {
    const generationText = (promptOverride ?? generationPrompt).trim()
    if (!activeWorkspacePath) {
      setStatusMessage('请先打开工作区')
      setStatusTone('err')
      return
    }
    if (!generationText) {
      setStatusMessage('请先输入文稿需求')
      setStatusTone('err')
      return
    }
    setBusy(true)
    setStatusTone(undefined)
    setExportError(null)
    try {
      if (promptOverride) setGenerationPrompt(promptOverride)
      const knowledgeRefs = buildKnowledgeRefsFromSelection(workspaceKbIds, attachments, knowledgeNameMap)
      const routed = await routeDocumentTask({
        prompt: generationText,
        currentDocument: editorState.documentDraft
          ? { title: editorState.title, type: editorState.documentDraft.type }
          : null,
        selectedText: editorState.selectedText,
        selectedSectionId: editorState.selectedSectionId,
        attachments: attachments.map((item) => ({ id: item.id, name: item.name })),
        templateId: template?.id,
        knowledgeRefs,
      })

      if (routed.confidence < 0.75 || routed.nextAction.type === 'ask') {
        setStatusMessage(routed.nextAction.question || routed.nextAction.message)
        setStatusTone('err')
        return
      }

      if (routed.intent === 'form_fill' && routed.missingInputs.length > 0) {
        setStatusMessage(routed.nextAction.question || '请先上传或选择表格模板。')
        setStatusTone('err')
        return
      }

      if (routed.intent === 'edit_selection') {
        await runAiSubmit(generationText, 'selection')
        return
      }

      if (routed.intent === 'edit_section') {
        await runAiSubmit(generationText, 'section')
        return
      }

      if (routed.intent === 'academic_paper' || routed.intent === 'literature_review') {
        const paperResult = await runPaperWorkflowGenerate({
          topic: generationText,
          paperType: routed.intent === 'literature_review' ? 'review' : 'research',
          language: 'zh',
          workspacePath: activeWorkspacePath,
          onStatus: (message) => {
            setStatusMessage(message)
            setStatusTone(undefined)
          },
        })
        if (!paperResult.documentResult) {
          throw new Error('论文工作流未返回可进入 DocumentWorkbench 的文稿结果')
        }
        syncEditorStateFromTaskResult(paperResult.documentResult, new Date().toISOString())
        setModifiedSectionIds([])
        setLastAiSnapshot(null)
        setRecentAiChange(null)
        setOutlineOpen(true)
        setStatusMessage(paperResult.message || '论文工作流已完成，并已进入 DocumentWorkbench。')
        setStatusTone('ok')
        return
      }

      if (routed.intent === 'formal_template') {
        setStatusMessage('正在分析正式模板字段…')
        const analyzed = await analyzeFormalTemplateFlow({
          instruction: generationText,
        })
        if (!analyzed.supported) {
          setStatusMessage(analyzed.unavailableReason || '当前正式模板能力未完整迁移到 Web')
          setStatusTone('err')
          return
        }
        const confirmed = await confirmFormalTemplateFields({
          instruction: generationText,
        })
        if (confirmed.missingFields.length > 0) {
          setStatusMessage(`正式模板仍缺少字段：${confirmed.missingFields.join('、')}，将继续预览并在提交时使用可解析内容。`)
          setStatusTone(undefined)
        }
        setStatusMessage('正在预览正式模板…')
        await previewFormalTemplate({
          instruction: generationText,
          workspacePath: activeWorkspacePath,
          language: 'zh',
          fieldOverrides: confirmed.confirmedFields,
        })
        setStatusMessage('正在提交正式模板到 DocumentWorkbench…')
        const committed = await commitFormalTemplate({
          instruction: generationText,
          workspacePath: activeWorkspacePath,
          language: 'zh',
          fieldOverrides: confirmed.confirmedFields,
        })
        syncEditorStateFromTaskResult(committed, new Date().toISOString())
        setModifiedSectionIds([])
        setLastAiSnapshot(null)
        setRecentAiChange(null)
        setOutlineOpen(true)
        setStatusMessage(committed.fallbackReason
          ? `正式模板已进入 DocumentWorkbench，但存在回退说明：${committed.fallbackReason}`
          : '正式模板已进入 DocumentWorkbench。')
        setStatusTone(committed.fallbackReason ? 'err' : 'ok')
        return
      }

      const task = await startDocumentTask({
        workspacePath: activeWorkspacePath,
        prompt: generationText,
        title: template?.defaultTitle,
        templateId: template?.id,
        knowledgeRefs,
        documentType: routed.documentType || template?.documentType || 'report',
        language: routed.defaultLanguage || 'zh-CN',
      })
      const nextResult = await waitForDocumentTask(task.taskId, (state) => {
        setStatusMessage(state.message)
        setStatusTone(undefined)
      })
      syncEditorStateFromTaskResult(nextResult, new Date().toISOString())
      setModifiedSectionIds([])
      setLastAiSnapshot(null)
      setRecentAiChange(null)
      setOutlineOpen(true)
      setStatusMessage(nextResult.fallbackFrom
        ? `文稿已完成。MiniMax DOCX Skill 失败，已回退内置文稿引擎：${nextResult.fallbackReason || '未提供原因'}`
        : `${engineLabel(nextResult.engine)} 已完成。`)
      setStatusTone('ok')
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : '文稿生成失败')
      setStatusTone('err')
    } finally {
      setBusy(false)
    }
  }, [activeWorkspacePath, attachments, editorState.documentDraft, editorState.selectedSectionId, editorState.selectedText, editorState.title, generationPrompt, knowledgeNameMap, setOutlineOpen, syncEditorStateFromTaskResult, template, workspaceKbIds])

  const handleSelectSection = useCallback((sectionId: string) => {
    setEditorState((prev) => ({
      ...prev,
      selectedSectionId: sectionId,
      selectedText: '',
        selectionRange: { sectionId, sectionTitle: prev.documentDraft?.sections.find((section) => section.id === sectionId)?.title, text: '' },
    }))
    setActiveHistoryKey(documentHistoryKey('section', sectionId))
    canvasRef.current?.scrollToSection(sectionId)
  }, [])

  const handleCanvasHtmlChange = useCallback((html: string, activeSectionId: string | null) => {
    setEditorState((prev) => {
      const next = updateEditableStateFromHtml({
        ...prev,
        selectedSectionId: activeSectionId || prev.selectedSectionId,
      }, html)
      return {
        ...next,
        selectedSectionId: activeSectionId || next.selectedSectionId,
        dirty: true,
        saving: false,
      }
    })
    setExportError(null)
    markSectionModified(activeSectionId)
  }, [markSectionModified])

  const handleCanvasSelectionChange = useCallback((payload: {
    selectedSectionId: string | null
    selectedText: string
    selectionRange?: EditableDocumentState['selectionRange']
  }) => {
    setEditorState((prev) => ({
      ...prev,
      selectedSectionId: payload.selectedSectionId || prev.selectedSectionId,
      selectedText: payload.selectedText,
      selectionRange: payload.selectionRange,
    }))
    setActiveHistoryKey((prev) => {
      if (payload.selectedText.trim()) {
        return documentHistoryKey('selection', payload.selectedSectionId)
      }
      if (payload.selectedSectionId) {
        return prev.startsWith('selection:') && prev === documentHistoryKey('selection', payload.selectedSectionId)
          ? prev
          : documentHistoryKey('section', payload.selectedSectionId)
      }
      return prev
    })
  }, [])

  const handleDocumentRewrite = useCallback(async (instruction: string) => {
    if (!activeWorkspacePath) {
      setStatusMessage('请先打开工作区')
      setStatusTone('err')
      return
    }
    appendHistory('document', editorState.selectedSectionId, { role: 'user', text: instruction })
    setBusy(true)
    try {
      const output = await runDocumentSkill({
        instruction,
        currentHtml: editorState.html,
        currentText: buildDocumentPlainText(editorState),
        workflowId: 'general',
        knowledgeBaseIds: workspaceKbIds,
        fileIds: attachments.map((item) => item.id),
        workspacePath: activeWorkspacePath,
      }, {
        operation: 'edit',
        editMode: 'replace_document',
        title: editorState.title,
      })
      if (!output.html) {
        throw new Error(output.message || '全文重写失败：未返回新内容')
      }
      const applied = canvasRef.current?.applyPatch({
        type: 'replace_document',
        html: output.html,
      })
      if (!applied?.applied) {
        throw new Error('全文重写补丁应用失败')
      }
      setEditorState((prev) => ({
        ...updateEditableStateFromHtml(prev, applied.html),
        dirty: true,
        selectedText: '',
        selectionRange: undefined,
      }))
      setRecentAiChange({
        token: Date.now(),
        scope: 'document',
        sectionId: editorState.selectedSectionId,
      })
      appendHistory('document', editorState.selectedSectionId, { role: 'assistant', text: output.message || '已重写当前全文。' })
      setStatusMessage(output.message || '已重写当前全文')
      setStatusTone('ok')
    } catch (error) {
      const message = error instanceof Error ? error.message : '全文重写失败'
      appendHistory('document', editorState.selectedSectionId, { role: 'assistant', text: message })
      setStatusMessage(message)
      setStatusTone('err')
    } finally {
      setBusy(false)
    }
  }, [activeWorkspacePath, appendHistory, attachments, editorState, workspaceKbIds])

  const handleContinueWriting = useCallback(async (instruction?: string) => {
    if (!editorState.documentId || !editorState.documentDraft) {
      setStatusMessage('请先生成文稿')
      setStatusTone('err')
      return
    }
    const cursorContext = {
      sectionId: editorState.selectionRange?.sectionId || selectedSection?.id || undefined,
      sectionTitle: editorState.selectionRange?.sectionTitle || selectedSection?.title || undefined,
      beforeText: editorState.selectionRange?.beforeText,
      afterText: editorState.selectionRange?.afterText,
    }
    captureAiSnapshot('section', cursorContext.sectionId || editorState.selectedSectionId)
    appendHistory('section', cursorContext.sectionId || editorState.selectedSectionId, {
      role: 'user',
      text: instruction?.trim() || '请紧接当前光标继续往下写。',
    })
    setBusy(true)
    try {
      const response = await continueDocument({
        documentId: editorState.documentId,
        instruction,
        cursorContext,
        document: editorState.documentDraft,
        html: editorState.html,
      })
      const applied = canvasRef.current?.applyPatch(response.patch)
      if (!applied?.applied) {
        throw new Error('未能把续写补丁插入到当前光标位置，请重新定位光标后再试。')
      }
      setEditorState((prev) => ({
        ...updateEditableStateFromHtml(prev, applied.html),
        selectedSectionId: applied.affectedSectionId || prev.selectedSectionId,
        selectedText: '',
        selectionRange: undefined,
        dirty: true,
      }))
      markSectionModified(applied.affectedSectionId || editorState.selectedSectionId)
      setRecentAiChange({
        token: Date.now(),
        scope: 'section',
        sectionId: applied.affectedSectionId || editorState.selectedSectionId,
      })
      appendHistory('section', applied.affectedSectionId || editorState.selectedSectionId, {
        role: 'assistant',
        text: response.message || '已在当前光标位置续写。',
      })
      setStatusMessage(response.message || '已在当前光标位置续写')
      setStatusTone('ok')
    } catch (error) {
      const message = error instanceof Error ? error.message : '续写失败'
      appendHistory('section', cursorContext.sectionId || editorState.selectedSectionId, {
        role: 'assistant',
        text: message,
      })
      setStatusMessage(message)
      setStatusTone('err')
    } finally {
      setBusy(false)
    }
  }, [appendHistory, captureAiSnapshot, editorState, markSectionModified, selectedSection])

  async function runAiSubmit(instruction: string, scope: DocumentAiScope) {
    if (!editorState.documentId || !editorState.documentDraft) {
      setStatusMessage('请先生成文稿')
      setStatusTone('err')
      return
    }
    if (scope === 'document') {
      setActiveHistoryKey('document')
      captureAiSnapshot('document', editorState.selectedSectionId)
      await handleDocumentRewrite(instruction)
      return
    }

    if (scope === 'selection') {
      if (!editorState.selectedText.trim()) {
        setStatusMessage('请先选中需要修改的内容')
        setStatusTone('err')
        return
      }
      appendHistory('selection', editorState.selectedSectionId, { role: 'user', text: instruction })
      setActiveHistoryKey(documentHistoryKey('selection', editorState.selectedSectionId))
      captureAiSnapshot('selection', editorState.selectedSectionId)
      setBusy(true)
      try {
        const response = await editDocumentSelection({
          documentId: editorState.documentId,
          instruction,
          selectedText: editorState.selectedText,
          selectionContext: {
            sectionId: editorState.selectionRange?.sectionId,
            beforeText: editorState.selectionRange?.beforeText,
            afterText: editorState.selectionRange?.afterText,
            documentTitle: editorState.title,
            sectionTitle: editorState.selectionRange?.sectionTitle || selectedSection?.title,
          },
          document: editorState.documentDraft,
          html: editorState.html,
        })
        const applied = canvasRef.current?.applyPatch(response.patch)
        if (!applied?.applied) {
          throw new Error('未能把选中文本补丁应用到当前选区，请重新选择后再试。')
        }
        setEditorState((prev) => ({
          ...updateEditableStateFromHtml(prev, applied.html),
          selectedSectionId: applied.affectedSectionId || prev.selectedSectionId,
          selectedText: '',
          selectionRange: undefined,
          dirty: true,
        }))
        markSectionModified(applied.affectedSectionId || editorState.selectedSectionId)
        setRecentAiChange({
          token: Date.now(),
          scope: 'selection',
          sectionId: applied.affectedSectionId || editorState.selectedSectionId,
        })
        appendHistory('selection', editorState.selectedSectionId, { role: 'assistant', text: response.message || '已修改选中内容。' })
        setStatusMessage(response.message || '已修改选中内容')
        setStatusTone('ok')
      } catch (error) {
        const message = error instanceof Error ? error.message : '选中文本修改失败'
        appendHistory('selection', editorState.selectedSectionId, { role: 'assistant', text: message })
        setStatusMessage(message)
        setStatusTone('err')
      } finally {
        setBusy(false)
      }
      return
    }

    if (!selectedSection) {
      setStatusMessage('请先选择章节')
      setStatusTone('err')
      return
    }

    appendHistory('section', selectedSection.id, { role: 'user', text: instruction })
    setActiveHistoryKey(documentHistoryKey('section', selectedSection.id))
    captureAiSnapshot('section', selectedSection.id)
    setBusy(true)
    try {
      const response = await editDocumentSection({
        documentId: editorState.documentId,
        sectionId: selectedSection.id,
        instruction,
        title: editorState.title,
        html: editorState.html,
        document: editorState.documentDraft,
        knowledgeRefs: buildKnowledgeRefsFromSelection(workspaceKbIds, attachments, knowledgeNameMap),
        currentSection: selectedSection,
        documentContext: {
          title: editorState.title,
          type: editorState.documentDraft.type,
          outline: editorState.outline,
          nearbySections: editorState.documentDraft.sections
            .filter((section) => section.id !== selectedSection.id)
            .slice(0, 3)
            .map((section) => ({ id: section.id, title: section.title, content: section.content })),
        },
      })
      syncEditorStateFromTaskResult({
        engine: response.engine,
        skillId: response.skillId,
        documentId: response.documentId,
        artifactId: response.artifactId,
        exportUrl: response.exportUrl,
        filename: response.filename,
        document: response.document,
        outline: response.outline,
        templateId: template?.id,
        templateLabel: template?.label,
        knowledgeRefs: editorState.documentDraft.metadata.knowledgeRefs || [],
      }, new Date().toISOString())
      setEditorState((prev) => ({
        ...prev,
        selectedSectionId: selectedSection.id,
      }))
      markSectionModified(selectedSection.id)
      setRecentAiChange({
        token: Date.now(),
        scope: 'section',
        sectionId: selectedSection.id,
      })
      appendHistory('section', selectedSection.id, { role: 'assistant', text: '已修改该章节，DOCX 已同步更新。' })
      setStatusMessage('已修改该章节，DOCX 已同步更新')
      setStatusTone('ok')
    } catch (error) {
      const message = error instanceof Error ? error.message : '章节修改失败'
      appendHistory('section', selectedSection.id, { role: 'assistant', text: message })
      setStatusMessage(message)
      setStatusTone('err')
    } finally {
      setBusy(false)
    }
  }

  const handleAiSubmit = useCallback(runAiSubmit, [appendHistory, attachments, captureAiSnapshot, editorState, handleDocumentRewrite, knowledgeNameMap, markSectionModified, selectedSection, syncEditorStateFromTaskResult, template, workspaceKbIds])

  const handleAiPanelGenerate = useCallback(async (text: string) => {
    await handleGenerate(text)
  }, [handleGenerate])

  const handleDownloadDocx = useCallback(async () => {
    if (!editorState.documentId) return
    setBusy(true)
    try {
      const latestHtml = stripTransientAiMarkup(canvasRef.current?.getHtml() || editorState.html)
      const latestState = latestHtml !== editorState.html
        ? updateEditableStateFromHtml(editorState, latestHtml)
        : editorState
      const exported = await exportDocumentArtifact({
        documentId: latestState.documentId!,
        format: 'docx',
        title: latestState.title,
        html: latestState.html,
        documentDraft: latestState.documentDraft,
        outline: latestState.outline,
      })
      const artifactId = exported.artifactId
      const filename = exported.filename || artifactFilename || 'document.docx'
      setEditorState((prev) => ({
        ...latestState,
        artifactId: exported.artifactId,
        exportUrl: exported.exportUrl,
        dirty: false,
        lastSavedAt: new Date().toISOString(),
        saving: false,
      }))
      setArtifactFilename(exported.filename)
      if (!artifactId) {
        throw new Error('没有可下载的 DOCX 产物')
      }
      await platformApi.artifacts.download(artifactId, filename)
      setStatusMessage('DOCX 已下载，内容为当前最新编辑版本')
      setStatusTone('ok')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'DOCX 下载失败'
      setExportError(message)
      setStatusMessage(message)
      setStatusTone('err')
    } finally {
      setBusy(false)
    }
  }, [artifactFilename, editorState])

  const handleExportPdf = useCallback(() => {
    setStatusMessage('PDF 导出暂未配置')
    setStatusTone('err')
  }, [])

  return (
    <Shell data-testid="document-workbench">
      <DocumentTopToolbar
        engineLabel={activeEngineLabel}
        templateLabel={activeTemplateLabel}
        knowledgeCount={workspaceKbIds.length}
        fallbackReason={editorState.fallbackReason || null}
        dirty={editorState.dirty}
        saving={editorState.saving}
        lastSavedAt={editorState.lastSavedAt || null}
        exportError={exportError}
        onOpenOutline={() => setOutlineOpen((v) => !v)}
        onOpenTemplate={() => setTemplatePopoverOpen((v) => !v)}
        onOpenKnowledge={() => setKnowledgeOverlayOpen((v) => !v)}
        onImportDocx={handleImportDocx}
        onDownloadDocx={() => void handleDownloadDocx()}
        onExportPdf={handleExportPdf}
        onSave={() => void saveCurrentDocument()}
        onRegenerate={() => void handleGenerate()}
        onViewVersions={() => {}}
        busy={busy}
        pdfDisabled
        regenerateDisabled={!editorState.documentId}
      />

      <Body>
        {/* Outline drawer — slides in from left */}
        {outlineOpen && (
          <>
            <OverlayBackdrop onClick={() => setOutlineOpen(false)} />
            <OutlineDrawerPanel>
              <DocumentOutlinePanel
                outline={editorState.outline}
                selectedSectionId={editorState.selectedSectionId}
                modifiedSectionIds={modifiedSectionIds}
                onSelectSection={(sectionId) => {
                  handleSelectSection(sectionId)
                  setOutlineOpen(false)
                }}
              />
            </OutlineDrawerPanel>
          </>
        )}

        {/* Template popover */}
        {templatePopoverOpen && (
          <>
            <OverlayBackdrop onClick={() => setTemplatePopoverOpen(false)} />
            <FloatingPanel style={{ left: 200 }}>
              <DocumentTemplatePanel
                templates={templates}
                selectedTemplateId={selectedTemplateId}
                onSelectTemplate={(id) => {
                  setSelectedTemplateId(id)
                  setTemplatePopoverOpen(false)
                }}
              />
            </FloatingPanel>
          </>
        )}

        {/* Knowledge overlay */}
        {knowledgeOverlayOpen && (
          <>
            <OverlayBackdrop onClick={() => setKnowledgeOverlayOpen(false)} />
            <FloatingPanel style={{ left: 340 }}>
              <DocumentKnowledgePanel
                departments={departments}
                selectedKnowledgeIds={workspaceKbIds}
                onOpenKnowledgePicker={() => {
                  setKnowledgeOverlayOpen(false)
                  setKbPickerOpen(true)
                }}
              />
              <div style={{ marginTop: 12 }}>
                <DocumentAttachmentPanel
                  attachments={attachments}
                  onAddAttachment={() => {
                    setKnowledgeOverlayOpen(false)
                    handleUploadAttachment()
                  }}
                  onRemoveAttachment={(fileId) => setAttachments((prev) => prev.filter((item) => item.id !== fileId))}
                />
              </div>
            </FloatingPanel>
          </>
        )}

        <CenterPane>
          <DocumentEditorCanvas
            ref={canvasRef}
            state={editorState}
            modifiedSectionIds={modifiedSectionIds}
            recentAiChange={recentAiChange}
            onHtmlChange={handleCanvasHtmlChange}
            onSelectionChange={handleCanvasSelectionChange}
          />
        </CenterPane>

        <DocumentAiEditPanel
          selectedSectionId={editorState.selectedSectionId}
          selectedSectionLabel={selectedSection?.title || '未选择章节'}
          selectedText={editorState.selectedText}
          selectionLength={editorState.selectedText.trim().length}
          history={currentHistory}
          busy={busy}
          disabled={false}
          hasDocument={Boolean(editorState.documentId)}
          canUndoLastAiEdit={Boolean(lastAiSnapshot)}
          onUndoLastAiEdit={handleUndoLastAiEdit}
          onContinueWriting={handleContinueWriting}
          onGenerate={handleAiPanelGenerate}
          onSubmit={handleAiSubmit}
        />
      </Body>

      {statusMessage ? <StatusBar $tone={statusTone}>{statusMessage}</StatusBar> : null}

      {kbPickerOpen && (
        <KnowledgeTreePicker
          departments={departments}
          selectedIds={workspaceKbIds}
          loading={departmentsLoading}
          onApply={(ids) => {
            setWorkspaceKbIds(ids)
            setKbPickerOpen(false)
          }}
          onClose={() => setKbPickerOpen(false)}
          title="选择文稿知识库"
        />
      )}

      <input
        ref={uploadInputRef}
        style={hiddenInputStyles}
        type="file"
        accept=".docx,.doc,.pdf,.txt,.md,.csv"
        onChange={(event) => void handleAttachmentFileChange(event)}
      />
      <input
        ref={importDocxInputRef}
        data-testid="document-import-docx-input"
        style={hiddenInputStyles}
        type="file"
        accept=".docx"
        onChange={(event) => void handleImportDocxFileChange(event)}
      />
    </Shell>
  )
}
