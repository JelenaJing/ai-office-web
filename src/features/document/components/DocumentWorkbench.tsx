import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import styled from 'styled-components'
import { Sparkles } from 'lucide-react'
import { useWorkspace } from '../../../contexts/WorkspaceContext'
import { useDocumentWorkspaceKnowledge } from '../../../contexts/DocumentWorkspaceContext'
import { useDepartment } from '../../../contexts/DepartmentContext'
import { KnowledgeTreePicker } from '../../../components/knowledge/KnowledgeTreePicker'
import { platformApi } from '../../../platform'
import type { FileEntry } from '../../../platform'
import { DocumentAiEditPanel, type SectionHistoryEntry } from './DocumentAiEditPanel'
import { DocumentEditorCanvas } from './DocumentEditorCanvas'
import { DocumentKnowledgePanel } from './DocumentKnowledgePanel'
import { DocumentOutlinePanel } from './DocumentOutlinePanel'
import { DocumentTemplatePanel } from './DocumentTemplatePanel'
import { DocumentTopToolbar } from './DocumentTopToolbar'
import {
  buildKnowledgeRefsFromSelection,
  editDocumentSection,
  engineLabel,
  exportDocumentArtifact,
  getDocumentTask,
  loadDocumentWorkbenchConfig,
  startDocumentTask,
  type DocumentTaskResult,
  type DocumentTemplateOption,
} from '../services/documentWorkbenchApi'

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
  result: DocumentTaskResult | null
  selectedSectionId: string | null
  sectionHistory: Record<string, SectionHistoryEntry[]>
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

function findNearbySections(result: DocumentTaskResult | null, sectionId: string) {
  if (!result) return []
  const index = result.document.sections.findIndex((section) => section.id === sectionId)
  if (index < 0) return []
  return result.document.sections
    .slice(Math.max(0, index - 1), Math.min(result.document.sections.length, index + 2))
    .map((section) => ({
      id: section.id,
      title: section.title,
      content: section.content,
    }))
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
  const [result, setResult] = useState<DocumentTaskResult | null>(null)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [selectedParagraphKey, setSelectedParagraphKey] = useState<string | null>(null)
  const [generationPrompt, setGenerationPrompt] = useState('')
  const [sectionHistory, setSectionHistory] = useState<Record<string, SectionHistoryEntry[]>>({})
  const [kbPickerOpen, setKbPickerOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [statusTone, setStatusTone] = useState<'ok' | 'err' | undefined>()

  const uploadInputRef = useRef<HTMLInputElement | null>(null)

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
    const persisted = loadPersistedState(activeWorkspacePath)
    if (!persisted) return
    setSelectedTemplateId(persisted.templateId || 'annual_report')
    setGenerationPrompt(persisted.generationPrompt || '')
    setAttachments(Array.isArray(persisted.attachments) ? persisted.attachments : [])
    setResult(persisted.result || null)
    setSelectedSectionId(persisted.selectedSectionId || persisted.result?.document.sections[0]?.id || null)
    setSectionHistory(persisted.sectionHistory || {})
  }, [activeWorkspacePath])

  useEffect(() => {
    const key = storageKey(activeWorkspacePath)
    if (!key || typeof window === 'undefined') return
    const payload: PersistedWorkbenchState = {
      templateId: selectedTemplateId,
      generationPrompt,
      attachments,
      result,
      selectedSectionId,
      sectionHistory,
    }
    window.localStorage.setItem(key, JSON.stringify(payload))
  }, [activeWorkspacePath, attachments, generationPrompt, result, sectionHistory, selectedSectionId, selectedTemplateId])

  const template = useMemo(
    () => templates.find((item) => item.id === selectedTemplateId) || templates[0] || null,
    [selectedTemplateId, templates],
  )

  const selectedSection = useMemo(
    () => result?.document.sections.find((section) => section.id === selectedSectionId) || null,
    [result, selectedSectionId],
  )

  const selectedParagraphLabel = useMemo(() => {
    if (!selectedParagraphKey || !selectedSectionId) return null
    const [, rawIndex] = selectedParagraphKey.split(':')
    const paragraphIndex = Number(rawIndex)
    if (!Number.isFinite(paragraphIndex)) return null
    return `选中段落 ${paragraphIndex + 1}`
  }, [selectedParagraphKey, selectedSectionId])

  const knowledgeNameMap = useMemo(
    () => new Map(departments.map((department) => [department.id, department.name])),
    [departments],
  )

  const activeEngineLabel = engineLabel(result?.engine || defaultEngine)
  const activeTemplateLabel = result?.templateLabel || template?.label || '未选择'
  const fallbackMessage = useMemo(() => {
    if (!result?.fallbackFrom) return null
    return `MiniMax DOCX Skill 失败，已回退内置文稿引擎：${result.fallbackReason || '未提供原因'}`
  }, [result])

  const setHistoryForSection = useCallback((sectionId: string, updater: (history: SectionHistoryEntry[]) => SectionHistoryEntry[]) => {
    setSectionHistory((prev) => ({
      ...prev,
      [sectionId]: updater(prev[sectionId] || []),
    }))
  }, [])

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
      const nextResult = await (async () => {
        for (;;) {
          const state = await getDocumentTask(task.taskId)
          setStatusMessage(state.message)
          setStatusTone(undefined)
          if (state.status === 'completed' && state.result) return state.result
          if (state.status === 'failed' || state.status === 'cancelled') {
            throw new Error(state.error || state.message || '文稿生成失败')
          }
          await new Promise((resolve) => window.setTimeout(resolve, 1200))
        }
      })()
      setResult(nextResult)
      setSelectedSectionId(nextResult.document.sections[0]?.id || null)
      setSelectedParagraphKey(null)
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
  }, [activeWorkspacePath, attachments, generationPrompt, knowledgeNameMap, template, workspaceKbIds])

  const handleSelectSection = useCallback((sectionId: string) => {
    setSelectedSectionId(sectionId)
    setSelectedParagraphKey(null)
  }, [])

  const handleSectionEdit = useCallback(async (instruction: string) => {
    if (!result || !selectedSection) return
    setBusy(true)
    setHistoryForSection(selectedSection.id, (history) => [...history, { role: 'user', text: instruction }])
    try {
      const response = await editDocumentSection({
        documentId: result.documentId,
        sectionId: selectedSection.id,
        instruction,
        currentSection: selectedSection,
        documentContext: {
          title: result.document.title,
          type: result.document.type,
          outline: result.document.outline,
          nearbySections: findNearbySections(result, selectedSection.id),
        },
      })
      const nextResult: DocumentTaskResult = {
        ...result,
        engine: response.engine,
        skillId: response.skillId,
        artifactId: response.artifactId,
        exportUrl: response.exportUrl,
        filename: response.filename,
        document: response.document,
        outline: response.outline,
        fallbackFrom: response.engine === 'builtin' ? result.fallbackFrom : undefined,
        fallbackReason: response.engine === 'builtin' ? result.fallbackReason : undefined,
      }
      setResult(nextResult)
      setHistoryForSection(selectedSection.id, (history) => [
        ...history,
        { role: 'assistant', text: `已修改第 ${response.updatedSectionIndex || '?'} 节。` },
      ])
      setStatusMessage(`已修改第 ${response.updatedSectionIndex || '?'} 节`)
      setStatusTone('ok')
    } catch (error) {
      setHistoryForSection(selectedSection.id, (history) => [
        ...history,
        { role: 'assistant', text: error instanceof Error ? error.message : '章节修改失败' },
      ])
      setStatusMessage(error instanceof Error ? error.message : '章节修改失败')
      setStatusTone('err')
    } finally {
      setBusy(false)
    }
  }, [result, selectedSection, setHistoryForSection])

  const downloadArtifact = useCallback(async (format: 'docx' | 'pdf') => {
    if (!result) return
    try {
      setBusy(true)
      const exported = await exportDocumentArtifact({
        documentId: result.documentId,
        format,
      })
      await platformApi.artifacts.download(exported.artifactId, exported.filename)
      setResult((prev) => prev ? {
        ...prev,
        artifactId: exported.artifactId,
        exportUrl: exported.exportUrl,
        filename: exported.filename,
      } : prev)
      setStatusMessage(`${format.toUpperCase()} 已下载`)
      setStatusTone('ok')
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : `${format.toUpperCase()} 导出失败`)
      setStatusTone('err')
    } finally {
      setBusy(false)
    }
  }, [result])

  const handleSave = useCallback(() => {
    setStatusMessage('当前文稿工作台状态已保存')
    setStatusTone('ok')
  }, [])

  return (
    <Shell data-testid="document-workbench">
        <DocumentTopToolbar
          engineLabel={activeEngineLabel}
          templateLabel={activeTemplateLabel}
          knowledgeCount={workspaceKbIds.length}
          fallbackMessage={fallbackMessage}
          onDownloadDocx={() => void downloadArtifact('docx')}
          onExportPdf={() => void downloadArtifact('pdf')}
          onSave={handleSave}
          onRegenerate={() => void handleGenerate()}
          busy={busy || !result}
          regenerateDisabled={!generationPrompt.trim()}
        />

      <Body>
        <Sidebar>
          <DocumentOutlinePanel
            document={result?.document || null}
            selectedSectionId={selectedSectionId}
            onSelectSection={handleSelectSection}
          />
          <DocumentKnowledgePanel
            departments={departments}
            selectedKnowledgeIds={workspaceKbIds}
            attachments={attachments}
            onOpenKnowledgePicker={() => setKbPickerOpen(true)}
            onAddAttachment={handleUploadAttachment}
            onRemoveAttachment={(fileId) => setAttachments((prev) => prev.filter((item) => item.id !== fileId))}
          />
          <DocumentTemplatePanel
            templates={templates}
            selectedTemplateId={selectedTemplateId}
            onSelectTemplate={setSelectedTemplateId}
          />
        </Sidebar>

        <CenterPane>
          <DocumentEditorCanvas
            document={result?.document || null}
            selectedSectionId={selectedSectionId}
            selectedParagraphKey={selectedParagraphKey}
            onSelectSection={handleSelectSection}
            onSelectParagraph={(sectionId, paragraphIndex) => {
              setSelectedSectionId(sectionId)
              setSelectedParagraphKey(`${sectionId}:${paragraphIndex}`)
            }}
          />
        </CenterPane>

        <DocumentAiEditPanel
          selectedSectionLabel={selectedSection?.title || '未选择章节'}
          selectedParagraphLabel={selectedParagraphLabel}
          history={selectedSectionId ? (sectionHistory[selectedSectionId] || []) : []}
          busy={busy}
          disabled={!selectedSection}
          onSubmit={handleSectionEdit}
        />
      </Body>

      <BottomComposer>
        <ComposerHint>
          底部 Prompt 用于生成整篇文稿。默认会附加 <code>language: zh-CN</code> 与 <code>style: formal_chinese_office</code>；仅当你明确要求英文时才切换。
        </ComposerHint>
        <ComposerInput
          value={generationPrompt}
          onChange={(event) => setGenerationPrompt(event.target.value)}
          placeholder="例如：生成一份学院年度工作总结，包含主要成绩、问题分析、下一年度计划。"
        />
        <ComposerActions>
          <div style={{ fontSize: 12, color: '#607487' }}>
            默认引擎：{engineLabel(defaultEngine)} · fallback：{fallbackMode === 'none' ? '关闭' : '内置文稿引擎'}
          </div>
          <GenerateButton type="button" disabled={busy || !generationPrompt.trim()} onClick={() => void handleGenerate()}>
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
