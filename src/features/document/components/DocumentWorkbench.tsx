import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import styled from 'styled-components'
import { Sparkles } from 'lucide-react'
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
  buildKnowledgeRefsFromSelection,
  editDocumentSection,
  editDocumentSelection,
  engineLabel,
  exportDocumentArtifact,
  loadDocumentWorkbenchConfig,
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

const Shell = styled.div`
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #eef3f8;
`

const Body = styled.div`
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr) 360px;
  overflow: hidden;
`

const Sidebar = styled.aside`
  padding: 16px;
  overflow: auto;
  display: grid;
  align-content: start;
  gap: 14px;
  border-right: 1px solid #d8e3ef;
  background: #f7fafc;
`

const CenterPane = styled.div`
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
`

const CanvasHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid #d8e3ef;
  background: rgba(255, 255, 255, 0.88);
  color: #48627b;
  font-size: 12px;
`

const StatusBar = styled.div<{ $tone?: 'ok' | 'err' }>`
  padding: 8px 18px;
  border-top: 1px solid #d8e3ef;
  background: #fff;
  color: ${({ $tone }) => ($tone === 'err' ? '#b91c1c' : $tone === 'ok' ? '#15803d' : '#516679')};
  font-size: 12px;
`

const BottomComposer = styled.div`
  padding: 14px 18px 18px;
  border-top: 1px solid #d8e3ef;
  background: #fff;
  display: grid;
  gap: 10px;
`

const ComposerHint = styled.div`
  font-size: 12px;
  color: #607487;
`

const ComposerInput = styled.textarea`
  width: 100%;
  min-height: 84px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid #d5dfeb;
  resize: vertical;
  font-size: 14px;
  line-height: 1.7;
  font-family: inherit;
`

const ComposerActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`

const GenerateButton = styled.button`
  height: 40px;
  padding: 0 16px;
  border-radius: 12px;
  border: 1px solid #73a8e1;
  background: linear-gradient(180deg, #6aa5e4 0%, #4d90d9 100%);
  color: #fff;
  font-size: 14px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
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

export default function DocumentWorkbench() {
  const { activeWorkspacePath } = useWorkspace()
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
  const [busy, setBusy] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [statusTone, setStatusTone] = useState<'ok' | 'err' | undefined>()
  const [exportError, setExportError] = useState<string | null>(null)
  const [generationPrompt, setGenerationPrompt] = useState('')
  const [hydrated, setHydrated] = useState(false)

  const uploadInputRef = useRef<HTMLInputElement | null>(null)
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

  const saveCurrentDocument = useCallback(async (status = '正在保存文稿…') => {
    if (!editorState.documentId || !editorState.documentDraft) return null
    setEditorState((prev) => ({ ...prev, saving: true }))
    setStatusMessage(status)
    setStatusTone(undefined)
    setExportError(null)
    try {
      const response = await saveEditableDocument({
        documentId: editorState.documentId,
        title: editorState.title,
        html: editorState.html,
        documentDraft: editorState.documentDraft,
        outline: editorState.outline,
      })
      const savedAt = response.savedAt || new Date().toISOString()
      setEditorState((prev) => ({
        ...prev,
        dirty: false,
        saving: false,
        lastSavedAt: savedAt,
        artifactId: response.artifactId || response.artifact?.id || prev.artifactId,
        exportUrl: response.exportUrl || prev.exportUrl,
        documentDraft: response.document || prev.documentDraft,
        outline: response.outline || prev.outline,
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

  const handleUploadAttachment = useCallback(() => {
    uploadInputRef.current?.click()
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

  const handleGenerate = useCallback(async () => {
    if (!activeWorkspacePath) {
      setStatusMessage('请先打开工作区')
      setStatusTone('err')
      return
    }
    if (!generationPrompt.trim()) {
      setStatusMessage('请先输入文稿需求')
      setStatusTone('err')
      return
    }
    setBusy(true)
    setStatusTone(undefined)
    setExportError(null)
    try {
      const task = await startDocumentTask({
        workspacePath: activeWorkspacePath,
        prompt: generationPrompt.trim(),
        title: template?.defaultTitle,
        templateId: template?.id,
        knowledgeRefs: buildKnowledgeRefsFromSelection(workspaceKbIds, attachments, knowledgeNameMap),
        documentType: template?.documentType || 'report',
        language: 'zh-CN',
      })
      const nextResult = await waitForDocumentTask(task.taskId, (state) => {
        setStatusMessage(state.message)
        setStatusTone(undefined)
      })
      syncEditorStateFromTaskResult(nextResult, new Date().toISOString())
      setModifiedSectionIds([])
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
  }, [activeWorkspacePath, attachments, generationPrompt, knowledgeNameMap, syncEditorStateFromTaskResult, template, workspaceKbIds])

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

  const handleAiSubmit = useCallback(async (instruction: string, scope: DocumentAiScope) => {
    if (!editorState.documentId || !editorState.documentDraft) {
      setStatusMessage('请先生成文稿')
      setStatusTone('err')
      return
    }
    if (scope === 'document') {
      setActiveHistoryKey('document')
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
  }, [appendHistory, attachments, editorState, handleDocumentRewrite, knowledgeNameMap, markSectionModified, selectedSection, syncEditorStateFromTaskResult, template, workspaceKbIds])

  const handleDownloadDocx = useCallback(async () => {
    if (!editorState.documentId) return
    setBusy(true)
    try {
      let artifactId = editorState.artifactId
      let filename = artifactFilename || 'document.docx'
      if (editorState.dirty) {
        const saved = await saveCurrentDocument('检测到未保存修改，正在先更新 DOCX…')
        if (!saved) {
          throw new Error('DOCX 更新失败，已阻止下载旧版本。')
        }
        artifactId = saved?.artifactId || saved?.artifact?.id || artifactId
        filename = saved?.filename || filename
      } else if (!artifactId) {
        const exported = await exportDocumentArtifact({
          documentId: editorState.documentId,
          format: 'docx',
          title: editorState.title,
          html: editorState.html,
          documentDraft: editorState.documentDraft,
          outline: editorState.outline,
        })
        artifactId = exported.artifactId
        filename = exported.filename
        setEditorState((prev) => ({
          ...prev,
          artifactId: exported.artifactId,
          exportUrl: exported.exportUrl,
          dirty: false,
          lastSavedAt: new Date().toISOString(),
        }))
        setArtifactFilename(exported.filename)
      }
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
  }, [artifactFilename, editorState, saveCurrentDocument])

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
        artifactLabel={artifactLabel}
        dirty={editorState.dirty}
        saving={editorState.saving}
        lastSavedAt={editorState.lastSavedAt || null}
        docxReady={Boolean(editorState.artifactId && !editorState.dirty)}
        exportError={exportError}
        onDownloadDocx={() => void handleDownloadDocx()}
        onExportPdf={handleExportPdf}
        onSave={() => void saveCurrentDocument()}
        onRegenerate={() => void handleGenerate()}
        onViewVersions={() => {}}
        busy={busy || !editorState.documentId}
        pdfDisabled
        regenerateDisabled={!generationPrompt.trim()}
      />

      <Body>
        <Sidebar>
          <DocumentOutlinePanel
            outline={editorState.outline}
            selectedSectionId={editorState.selectedSectionId}
            modifiedSectionIds={modifiedSectionIds}
            onSelectSection={handleSelectSection}
          />
          <DocumentKnowledgePanel
            departments={departments}
            selectedKnowledgeIds={workspaceKbIds}
            onOpenKnowledgePicker={() => setKbPickerOpen(true)}
          />
          <DocumentTemplatePanel
            templates={templates}
            selectedTemplateId={selectedTemplateId}
            onSelectTemplate={setSelectedTemplateId}
          />
          <DocumentAttachmentPanel
            attachments={attachments}
            onAddAttachment={handleUploadAttachment}
            onRemoveAttachment={(fileId) => setAttachments((prev) => prev.filter((item) => item.id !== fileId))}
          />
        </Sidebar>

        <CenterPane>
          <CanvasHeader>
            <div>中间区域为 A4 可编辑文稿页面，支持直接输入、选中文本、章节定位与局部 AI 修改。</div>
            <div>{selectedSection ? `当前章节：${selectedSection.title}` : '当前章节：未选择'}</div>
          </CanvasHeader>
          <DocumentEditorCanvas
            ref={canvasRef}
            state={editorState}
            modifiedSectionIds={modifiedSectionIds}
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
          disabled={!editorState.documentId}
          onSubmit={handleAiSubmit}
        />
      </Body>

      <BottomComposer>
        <ComposerHint>
          这里用于生成整篇文稿。默认生成中文，并会把当前模板、知识库与附件引用一起传给后端文稿任务。
        </ComposerHint>
        <ComposerInput
          value={generationPrompt}
          data-testid="document-generation-prompt"
          onChange={(event) => setGenerationPrompt(event.target.value)}
          placeholder="例如：生成一份学院年度工作总结，包含主要成绩、问题分析、下一年度计划。"
        />
        <ComposerActions>
          <div style={{ fontSize: 12, color: '#607487' }}>
            默认引擎：{engineLabel(defaultEngine)} · fallback：{fallbackMode === 'none' ? '关闭' : '内置文稿引擎'}
          </div>
          <GenerateButton
            type="button"
            data-testid="document-generate-button"
            disabled={busy || !generationPrompt.trim()}
            onClick={() => void handleGenerate()}
          >
            <Sparkles size={15} />
            {busy ? '正在生成文稿…' : '生成文稿'}
          </GenerateButton>
        </ComposerActions>
      </BottomComposer>

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
    </Shell>
  )
}
