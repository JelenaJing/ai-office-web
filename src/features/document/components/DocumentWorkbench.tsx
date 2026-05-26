import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type MouseEvent } from 'react'
import styled from 'styled-components'
import { useWorkspace } from '../../../contexts/WorkspaceContext'
import { useDocumentWorkspaceKnowledge } from '../../../contexts/DocumentWorkspaceContext'
import { platformApi } from '../../../platform'
import type { FileEntry, KnowledgeSourceListItem } from '../../../platform'
import {
  DocumentEditorCanvas,
  type DocumentEditorCanvasHandle,
} from './DocumentEditorCanvas'
import { DocumentKnowledgeSourcePicker } from './DocumentKnowledgeSourcePicker'
import { DocumentTopToolbar } from './DocumentTopToolbar'
import { DocumentHtmlContextMenu, type DocumentHtmlContextMenuState } from './DocumentHtmlContextMenu'
import { WebDocChatPanel, type WebDocChatMessage } from './WebDocChatPanel'
import { WebDocToolPromptDialog, type WebDocToolPromptState } from './WebDocToolPromptDialog'
import type { DocumentAiScope, SectionHistoryEntry } from './DocumentAiEditPanel'
import {
  buildToolInstruction,
  chatWebDocOpenCodeStream,
  invokeWebDocOpenCode,
  mapWebDocPatchToDocumentPatch,
  type WebDocToolId,
} from '../services/documentOpenCodeApi'
import {
  generateDocumentFigureHtml,
  shouldGenerateImageForInstruction,
} from '../services/documentWebImageInsert'
import { plainTextToDocumentBodyHtml, wrapDocumentBodyHtml } from '../services/documentContentApply'
import { prepareReportFromDocument } from '../services/documentToReport'
import {
  analyzeFormalTemplateFlow,
  buildKnowledgeRefsFromSelection,
  commitFormalTemplate,
  confirmFormalTemplateFields,
  continueDocument,
  editDocumentSection,
  editDocumentSelection,
  editDocumentText,
  engineLabel,
  exportDocumentArtifact,
  importDocumentDocx,
  listKnowledgeSources,
  loadDocumentWorkbenchConfig,
  previewFormalTemplate,
  queryKnowledgeCitationChunks,
  routeDocumentTask,
  saveEditableDocument,
  saveInitialWorkbenchDocument,
  startDocumentTask,
  waitForDocumentTask,
  type DocumentDraft,
  type DocumentKnowledgeRef,
  type DocumentReference,
  type DocumentTaskResult,
  type DocumentTemplateOption,
  type EditableDocumentState,
} from '../services/documentWorkbenchApi'
import {
  createEditableStateFromTaskResult,
  updateEditableStateFromHtml,
} from '../services/documentDraftTransforms'
import {
  buildFormatOp,
  buildOperationRecord,
  isFormatIntent,
  isSemanticIntent,
  isUndoInstruction,
  parseDocumentCommand,
  resolveCommandTarget,
  type DocumentPatchOperation,
} from '../services/documentCommandEngine'
import { undoFormatOp } from '../services/documentPatchApplier'
import { downloadDocxFromArtifact } from '../services/documentArtifactToDocx'
import { runDocumentSkill } from '../services/documentSkillAdapter'
import { runPaperWorkflowGenerate } from '../services/paperWorkflowAdapter'
import { runAcademicWritingWorkflow } from '../services/academicWritingWorkflow'
import { fetchContentHandoff } from '../services/contentHandoffApi'
import { consumePendingDocumentHandoff, peekPendingDocumentHandoff } from '../../../services/pendingDocumentHandoff'
import { consumePendingResourceOpen, hasPendingDocumentResourceOpen, peekPendingResourceOpen } from '../../../services/pendingResourceOpen'
import { resolveWebApiUrl } from '../../../runtime/apiBase'

const Shell = styled.div`
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
  position: relative;
`

const Body = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

const EditorArea = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

const SidebarCard = styled.div`
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid #d8e3ef;
  border-radius: 16px;
  overflow: hidden;
`

const SidebarSection = styled.section`
  display: grid;
  align-content: start;
  gap: 10px;
`

const SidebarBody = styled.div`
  padding: 0 16px 16px;
  display: grid;
  gap: 12px;
`

const SidebarHeader = styled.div`
  padding: 14px 16px 0;
  font-size: 12px;
  font-weight: 700;
  color: #516679;
  letter-spacing: 0.02em;
`

const SidebarToggle = styled.button`
  width: 100%;
  height: 42px;
  padding: 0 16px;
  border: 0;
  background: transparent;
  color: #2c4b67;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;

  &:hover {
    background: #f1f6fb;
  }
`

const SidebarCollapsedHint = styled.div`
  padding: 0 16px 14px;
  color: #7a8fa0;
  font-size: 12px;
  line-height: 1.6;
`

const ScenarioCard = styled.div`
  border: 1px solid #d8e3ef;
  border-radius: 14px;
  background: #f8fbff;
  overflow: hidden;
`

const ScenarioToggle = styled.button`
  width: 100%;
  min-height: 40px;
  padding: 0 14px;
  border: 0;
  background: transparent;
  color: #2c4b67;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;

  &:hover {
    background: #eff6fd;
  }
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

const LOCAL_DRAFT_STORAGE_KEY = 'aios_document_editor_draft'
const DEFAULT_SECTION_ID = 'section-main'

interface LocalEditorDraft {
  title: string
  body: string
  updatedAt: string
  templateId?: string
  generationPrompt?: string
  attachments?: FileEntry[]
  editorState?: EditableDocumentState
  sectionHistory?: Record<string, SectionHistoryEntry[]>
  modifiedSectionIds?: string[]
  artifactFilename?: string | null
}

function escapeHtml(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

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

function createLocalDocumentDraft(engine: string, title = ''): DocumentDraft {
  return {
    id: 'local-document-draft',
    title,
    type: 'report',
    language: 'zh-CN',
    outline: [
      {
        id: DEFAULT_SECTION_ID,
        level: 1,
        title: '正文',
      },
    ],
    sections: [
      {
        id: DEFAULT_SECTION_ID,
        title: '正文',
        content: '',
      },
    ],
    metadata: {
      engine,
      knowledgeRefs: [],
    },
  }
}

function createBlankDocumentHtml(title = '', bodyHtml = '<p><br /></p>'): string {
  const normalizedBody = String(bodyHtml || '').trim()
  const resolvedBody = normalizedBody
    ? (/data-block-id=/i.test(normalizedBody)
        ? normalizedBody
        : normalizedBody.replace(/<p(\s|>)/i, '<p data-block-id="body-paragraph-1" data-role="paragraph"$1'))
    : '<p data-block-id="body-paragraph-1" data-role="paragraph"><br /></p>'
  return [
    '<article data-document-root="true" data-document-mode="draft">',
    `<h1 data-document-title="true" data-block-id="document-title" data-role="title">${escapeHtml(title)}</h1>`,
    `<section data-section-id="${DEFAULT_SECTION_ID}" data-section-title="正文" data-section-level="1" data-document-body="true">`,
    resolvedBody,
    '</section>',
    '</article>',
  ].join('')
}

function loadLocalEditorDraft(): LocalEditorDraft | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(LOCAL_DRAFT_STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as LocalEditorDraft
    return typeof parsed.body === 'string' ? parsed : null
  } catch {
    return null
  }
}

function buildLocalEditorDraft(input: {
  title: string
  body: string
  updatedAt: string
  templateId: string
  generationPrompt: string
  attachments: FileEntry[]
  editorState: EditableDocumentState
  sectionHistory: Record<string, SectionHistoryEntry[]>
  modifiedSectionIds: string[]
  artifactFilename: string | null
}): LocalEditorDraft {
  return {
    title: input.title,
    body: input.body,
    updatedAt: input.updatedAt,
    templateId: input.templateId,
    generationPrompt: input.generationPrompt,
    attachments: input.attachments,
    editorState: cloneEditorState(input.editorState),
    sectionHistory: JSON.parse(JSON.stringify(input.sectionHistory)) as Record<string, SectionHistoryEntry[]>,
    modifiedSectionIds: [...input.modifiedSectionIds],
    artifactFilename: input.artifactFilename,
  }
}

function clearPersistedWorkbenchDraft(workspacePath: string | null): void {
  if (typeof window === 'undefined') return
  const key = storageKey(workspacePath)
  if (key) window.localStorage.removeItem(key)
  window.localStorage.removeItem(LOCAL_DRAFT_STORAGE_KEY)
}

function createEmptyEditorState(engine: string): EditableDocumentState {
  const draft = createLocalDocumentDraft(engine, '')
  return {
    documentId: null,
    userFileId: null,
    artifactId: null,
    exportUrl: null,
    title: '',
    html: createBlankDocumentHtml(),
    documentArtifact: undefined,
    markdown: '',
    documentDraft: draft,
    outline: draft.outline,
    selectedSectionId: DEFAULT_SECTION_ID,
    selectedBlockId: 'document-title',
    selectedBlockRole: 'title',
    selectedBlockText: '',
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

function hasEditableDocumentContent(state: EditableDocumentState): boolean {
  const blocks = state.documentArtifact?.canonicalData.blocks || []
  return blocks.some((block) => {
    if (block.role === 'title') {
      return 'text' in block && Boolean(block.text?.trim())
    }
    if (block.role === 'paragraph' || block.role === 'heading' || block.role === 'quote' || block.role === 'list-item') {
      return 'text' in block && Boolean(block.text?.trim())
    }
    if (block.role === 'table') {
      return block.headers.length > 0 || block.rows.length > 0
    }
    if (block.role === 'image') {
      return Boolean(block.src)
    }
    return block.role === 'divider'
  })
}

function buildPdfPrintHtml(input: { title: string; html: string }): string {
  return [
    '<!doctype html>',
    '<html lang="zh-CN">',
    '<head>',
    '<meta charset="utf-8" />',
    `<title>${escapeHtml(input.title || '文稿')}</title>`,
    '<style>',
    '@page { size: A4; margin: 18mm 16mm 20mm; }',
    'html, body { margin: 0; padding: 0; background: #dfe7ef; color: #28384a; font-family: "FangSong", "STSong", "SimSun", serif; }',
    'body { padding: 18px 0; }',
    '.paper { width: 210mm; min-height: 297mm; box-sizing: border-box; margin: 0 auto; background: #fff; box-shadow: 0 18px 48px rgba(15, 23, 42, 0.12); border: 1px solid rgba(191, 208, 226, 0.9); padding: 24mm 20mm 26mm; }',
    'article[data-document-root="true"] { min-height: auto; }',
    'h1[data-document-title="true"] { margin: 0 0 32px; text-align: center; font-size: 28px; line-height: 1.4; color: #17283a; }',
    'section[data-section-id] { margin: 0 0 18px; padding: 0; border: 0; background: transparent; box-shadow: none; }',
    'h2[data-section-heading="true"], h3[data-section-heading="true"] { margin: 0 0 14px; color: #173f69; line-height: 1.5; }',
    'h2[data-section-heading="true"] { font-size: 22px; }',
    'h3[data-section-heading="true"] { font-size: 18px; color: #355a7f; }',
    'p { margin: 0 0 16px; line-height: 1.95; text-indent: 2em; }',
    'ul, ol { margin: 0 0 16px; padding-left: 28px; }',
    'li { margin: 6px 0; line-height: 1.85; }',
    'blockquote { margin: 16px 0; padding: 12px 14px; border-left: 4px solid #bcd2e9; background: #f5f8fc; color: #516679; font-size: 14px; line-height: 1.75; }',
    'hr { margin: 18px 0; border: none; border-top: 1px solid #d2dce7; }',
    '.document-table-block { margin: 16px 0; }',
    '.document-table-title { margin-bottom: 8px; text-align: center; font-size: 14px; font-weight: 700; color: #2b4d69; }',
    'table { width: 100%; border-collapse: collapse; }',
    'th, td { border: 1px solid #bfd0e2; padding: 10px 12px; font-size: 14px; color: #334a60; vertical-align: top; }',
    'th { background: #edf4fb; font-weight: 800; }',
    'figure[data-block-type="image"] { margin: 18px 0; display: grid; gap: 8px; justify-items: center; }',
    'figure[data-block-type="image"] img { display: block; max-width: 100%; max-height: 420px; border-radius: 10px; }',
    'figure[data-block-type="image"] figcaption { font-size: 13px; line-height: 1.6; color: #60758a; text-align: center; }',
    '[data-format-highlight="true"], mark[data-ai-change="true"] { background: rgba(253, 224, 71, 0.38) !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }',
    '.doc-citation { color: #1d4ed8; font-size: 0.85em; vertical-align: super; margin-left: 2px; }',
    '@media print { html, body { background: #fff; } body { padding: 0; } .paper { width: auto; min-height: auto; margin: 0; padding: 0; border: none; box-shadow: none; } }',
    '</style>',
    '</head>',
    '<body>',
    `<div class="paper">${input.html}</div>`,
    '<script>',
    'window.addEventListener("load", () => { setTimeout(() => window.print(), 150); });',
    'window.onafterprint = () => { try { window.close(); } catch {} };',
    '</script>',
    '</body>',
    '</html>',
  ].join('')
}

export default function DocumentWorkbench() {
  const { activeWorkspacePath, openWorkspace } = useWorkspace()
  const { workspaceKbIds, setWorkspaceKbIds } = useDocumentWorkspaceKnowledge()

  const [templates, setTemplates] = useState<DocumentTemplateOption[]>([])
  const [defaultEngine, setDefaultEngine] = useState<'builtin' | 'minimax_docx'>('minimax_docx')
  const [fallbackMode, setFallbackMode] = useState<'builtin' | 'none'>('builtin')
  const [selectedTemplateId, setSelectedTemplateId] = useState('annual_report')
  const [attachments, setAttachments] = useState<FileEntry[]>([])
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSourceListItem[]>([])
  const [knowledgeSourcesLoading, setKnowledgeSourcesLoading] = useState(false)
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
  const [lastAiSnapshot, setLastAiSnapshot] = useState<AiEditSnapshot | null>(null)
  const [recentAiChange, setRecentAiChange] = useState<RecentAiChange | null>(null)
  // Command undo stack: most-recent operation first
  const [commandUndoStack, setCommandUndoStack] = useState<DocumentPatchOperation[]>([])
  // Last command operation result — shown in the AI panel
  const [lastCommandOp, setLastCommandOp] = useState<DocumentPatchOperation | null>(null)
  const [chatMessages, setChatMessages] = useState<WebDocChatMessage[]>([])
  const [ctxMenu, setCtxMenu] = useState<DocumentHtmlContextMenuState | null>(null)
  const [toolPrompt, setToolPrompt] = useState<WebDocToolPromptState | null>(null)

  const uploadInputRef = useRef<HTMLInputElement | null>(null)
  const importDocxInputRef = useRef<HTMLInputElement | null>(null)
  const insertImageInputRef = useRef<HTMLInputElement | null>(null)
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
        setEditorState((prev) => (prev.documentId || hasEditableDocumentContent(prev) ? prev : createEmptyEditorState(config.engine)))
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
    let disposed = false
    setKnowledgeSourcesLoading(true)
    void listKnowledgeSources(activeWorkspacePath)
      .then((sources) => {
        if (disposed) return
        setKnowledgeSources(sources)
      })
      .catch((error) => {
        if (disposed) return
        setStatusMessage(error instanceof Error ? error.message : '加载知识来源失败')
        setStatusTone('err')
      })
      .finally(() => {
        if (disposed) return
        setKnowledgeSourcesLoading(false)
      })
    return () => {
      disposed = true
    }
  }, [activeWorkspacePath])

  useEffect(() => {
    setHydrated(false)
    setLastAiSnapshot(null)
    setRecentAiChange(null)
    if (peekPendingDocumentHandoff() || hasPendingDocumentResourceOpen()) {
      setHydrated(true)
      return
    }
    const persisted = loadPersistedState(activeWorkspacePath)
    const localDraft = loadLocalEditorDraft()
    const persistedState = persisted
      ? (persisted.editorState?.documentDraft
        ? persisted.editorState
        : updateEditableStateFromHtml(createEmptyEditorState(defaultEngine), persisted.editorState?.html || createBlankDocumentHtml()))
      : null
    const localDraftState = localDraft
      ? (localDraft.editorState?.documentDraft
        ? localDraft.editorState
        : updateEditableStateFromHtml(
          createEmptyEditorState(defaultEngine),
          localDraft.body || createBlankDocumentHtml(localDraft.title || ''),
        ))
      : null
    const persistedBlockCount = persistedState?.documentArtifact?.canonicalData.blocks.length ?? 0
    const localDraftBlockCount = localDraftState?.documentArtifact?.canonicalData.blocks.length ?? 0
    const shouldPreferLocalDraft = localDraftBlockCount > persistedBlockCount

    if (persistedState && !shouldPreferLocalDraft) {
      setSelectedTemplateId(persisted?.templateId || 'annual_report')
      setAttachments(Array.isArray(persisted?.attachments) ? persisted.attachments : [])
      setGenerationPrompt(persisted?.generationPrompt || '')
      setEditorState({
        ...createEmptyEditorState(defaultEngine),
        ...persistedState,
        selectedSectionId: persistedState.selectedSectionId || DEFAULT_SECTION_ID,
      })
      setModifiedSectionIds(persisted?.modifiedSectionIds || [])
      setSectionHistory(persisted?.sectionHistory || {})
      setArtifactFilename(persisted?.artifactFilename || null)
      setActiveHistoryKey(
        persistedState.selectedSectionId
          ? documentHistoryKey('section', persistedState.selectedSectionId)
          : 'document',
      )
    } else if (localDraft && localDraftState) {
        const localState = localDraftState
        setSelectedTemplateId(localDraft.templateId || 'annual_report')
        setAttachments(Array.isArray(localDraft.attachments) ? localDraft.attachments : [])
        setGenerationPrompt(localDraft.generationPrompt || '')
        setEditorState({
          ...localState,
          title: localDraft.title || localState.title,
          dirty: true,
          lastSavedAt: localDraft.updatedAt,
        })
        setModifiedSectionIds(localDraft.modifiedSectionIds || [])
        setSectionHistory(localDraft.sectionHistory || {})
        setArtifactFilename(localDraft.artifactFilename || null)
        setActiveHistoryKey(
          localState.selectedSectionId
            ? documentHistoryKey('section', localState.selectedSectionId)
            : 'document',
        )
    } else {
      setEditorState(createEmptyEditorState(defaultEngine))
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
    if (!hydrated || typeof window === 'undefined') return
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(LOCAL_DRAFT_STORAGE_KEY, JSON.stringify(buildLocalEditorDraft({
        title: editorState.title,
        body: editorState.html,
        updatedAt: new Date().toISOString(),
        templateId: selectedTemplateId,
        generationPrompt,
        attachments,
        editorState,
        sectionHistory,
        modifiedSectionIds,
        artifactFilename,
      })))
    }, 700)
    return () => {
      window.clearTimeout(timer)
    }
  }, [artifactFilename, attachments, editorState, generationPrompt, hydrated, modifiedSectionIds, sectionHistory, selectedTemplateId])

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
  const knowledgeSourceMap = useMemo(
    () => new Map(knowledgeSources.filter((source) => source.provider === 'remote').map((source) => [source.id, source])),
    [knowledgeSources],
  )

  const selectedSection = useMemo(
    () => editorState.documentDraft?.sections.find((section) => section.id === editorState.selectedSectionId) || null,
    [editorState.documentDraft, editorState.selectedSectionId],
  )

  const activeEngineLabel = engineLabel((editorState.engine as 'builtin' | 'minimax_docx') || defaultEngine)
  const activeTemplateLabel = template?.label || '未选择'
  const hasActiveDocument = Boolean(editorState.documentId || hasEditableDocumentContent(editorState))

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
        userFileId: nextResult.userFileId ?? null,
        artifactId: nextResult.artifactId,
        exportUrl: nextResult.exportUrl,
        engine: nextResult.engine,
        fallbackFrom: nextResult.fallbackFrom,
        fallbackReason: nextResult.fallbackReason,
        document: nextResult.document,
        html: nextResult.html,
        documentArtifact: nextResult.documentArtifact,
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

  useEffect(() => {
    if (!hydrated || !activeWorkspacePath) return
    const pending = peekPendingResourceOpen()
    if (!pending || (pending.kind !== 'document-artifact' && pending.kind !== 'document-file')) return

    let disposed = false
    setBusy(true)
    setStatusMessage('正在打开资源文件…')
    setStatusTone(undefined)

    void (async () => {
      try {
        consumePendingResourceOpen()
        clearPersistedWorkbenchDraft(activeWorkspacePath)

        const imported = pending.kind === 'document-file'
          ? await importDocumentDocx({
            fileId: pending.fileId,
            workspacePath: activeWorkspacePath,
          })
          : await importDocumentDocx({
            artifactId: pending.artifactId,
            workspacePath: activeWorkspacePath,
          })

        if (disposed) return
        syncEditorStateFromTaskResult({
          ...imported,
          userFileId: imported.userFileId || (pending.kind === 'document-file' ? pending.fileId : undefined),
        }, new Date().toISOString())
        if (imported.filename) setArtifactFilename(imported.filename)
        setStatusMessage(`已打开：${imported.title}`)
        setStatusTone('ok')
      } catch (error) {
        if (disposed) return
        consumePendingResourceOpen()
        setStatusMessage(error instanceof Error ? error.message : '打开文件失败')
        setStatusTone('err')
      } finally {
        if (!disposed) setBusy(false)
      }
    })()

    return () => {
      disposed = true
    }
  }, [activeWorkspacePath, hydrated, syncEditorStateFromTaskResult])

  const saveCurrentDocument = useCallback(async (status = '正在保存文稿…') => {
    if (!editorState.documentDraft) return null
    const latestHtml = stripTransientAiMarkup(canvasRef.current?.getHtml() || editorState.html)
    const latestState = latestHtml !== editorState.html
      ? updateEditableStateFromHtml(editorState, latestHtml)
      : editorState
    if (!activeWorkspacePath) {
      setStatusMessage('请先打开工作区')
      setStatusTone('err')
      return null
    }
    if (!latestState.documentId) {
      setEditorState((prev) => ({ ...prev, saving: true }))
      setStatusMessage(status)
      setStatusTone(undefined)
      setExportError(null)
      try {
        const response = await saveInitialWorkbenchDocument({
          title: latestState.title || '未命名文稿',
          html: latestState.html,
          documentDraft: latestState.documentDraft!,
          outline: latestState.outline,
          workspacePath: activeWorkspacePath,
          userFileId: latestState.userFileId,
        })
        const savedAt = response.savedAt || new Date().toISOString()
        const synced = createEditableStateFromTaskResult({
          documentId: response.documentId,
          userFileId: response.userFileId ?? null,
          artifactId: response.artifactId || response.artifact?.id || '',
          exportUrl: response.exportUrl || '',
          engine: latestState.engine,
          document: response.document || latestState.documentDraft!,
          html: response.html || latestState.html,
          documentArtifact: response.documentArtifact,
        })
        setEditorState({
          ...synced,
          dirty: false,
          saving: false,
          lastSavedAt: savedAt,
        })
        if (response.filename) setArtifactFilename(response.filename)
        setStatusMessage(`已保存到「我的文件」：${synced.title}`)
        setStatusTone('ok')
        window.dispatchEvent(new CustomEvent('resource-files-changed'))
        return response
      } catch (error) {
        const message = error instanceof Error ? error.message : '保存失败'
        setEditorState((prev) => ({ ...prev, saving: false }))
        setExportError(message)
        setStatusMessage(message)
        setStatusTone('err')
        return null
      }
    }
    setEditorState((prev) => ({ ...prev, saving: true }))
    setStatusMessage(status)
    setStatusTone(undefined)
    setExportError(null)
    try {
      let response
      try {
        response = await saveEditableDocument({
          documentId: latestState.documentId!,
          title: latestState.title,
          html: latestState.html,
          documentDraft: latestState.documentDraft!,
          outline: latestState.outline,
          userFileId: latestState.userFileId,
        })
      } catch (saveError) {
        const message = saveError instanceof Error ? saveError.message : '保存失败'
        if (/不存在|404|无权限/.test(message)) {
          response = await saveInitialWorkbenchDocument({
            title: latestState.title || '未命名文稿',
            html: latestState.html,
            documentDraft: latestState.documentDraft!,
            outline: latestState.outline,
            workspacePath: activeWorkspacePath,
            userFileId: latestState.userFileId,
          })
        } else {
          throw saveError
        }
      }
      const savedAt = response.savedAt || new Date().toISOString()
        setEditorState((prev) => ({
          ...latestState,
          documentId: response.documentId || latestState.documentId,
          dirty: false,
          saving: false,
          lastSavedAt: savedAt,
          userFileId: response.userFileId || latestState.userFileId,
          artifactId: response.artifactId || response.artifact?.id || prev.artifactId,
          exportUrl: response.exportUrl || prev.exportUrl,
          html: response.html || latestState.html,
          documentArtifact: response.documentArtifact || latestState.documentArtifact,
          documentDraft: response.document || latestState.documentDraft,
          outline: response.outline || latestState.outline,
        }))
      if (response.filename) setArtifactFilename(response.filename)
      setStatusMessage(`已保存到「我的文件」：${latestState.title || response.filename || '文稿'}`)
      setStatusTone('ok')
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('resource-files-changed'))
      }
      return response
    } catch (error) {
      const message = error instanceof Error ? error.message : '保存失败'
      setEditorState((prev) => ({ ...prev, saving: false }))
      setExportError(message)
      setStatusMessage(message)
      setStatusTone('err')
      return null
    }
  }, [activeWorkspacePath, artifactFilename, attachments, editorState, generationPrompt, modifiedSectionIds, sectionHistory, selectedTemplateId])

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
      try {
        const sources = await listKnowledgeSources(activeWorkspacePath)
        setKnowledgeSources(sources)
      } catch {
        // Keep the uploaded attachment selection even if the source list refresh lags behind.
      }
      setStatusMessage(`已添加附件引用：${entry.name}`)
      setStatusTone('ok')
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : '上传附件失败')
      setStatusTone('err')
    }
  }, [activeWorkspacePath])

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
      const knowledgeRefs = buildKnowledgeRefsFromSelection(workspaceKbIds, attachments, knowledgeSourceMap)
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
  }, [activeWorkspacePath, attachments, editorState.documentDraft, editorState.selectedSectionId, editorState.selectedText, editorState.title, generationPrompt, knowledgeSourceMap, syncEditorStateFromTaskResult, template, workspaceKbIds])

  const handleAcademicWritingGenerate = useCallback(async (input: AcademicWritingPanelSubmit) => {
    if (!activeWorkspacePath) {
      setStatusMessage('请先打开工作区')
      setStatusTone('err')
      return
    }
    setBusy(true)
    setStatusTone(undefined)
    setExportError(null)
    try {
      setStatusMessage('正在生成论文大纲与章节内容…')
      const knowledgeRefs = buildKnowledgeRefsFromSelection(workspaceKbIds, attachments, knowledgeSourceMap)
      const response = await runAcademicWritingWorkflow({
        workspacePath: activeWorkspacePath,
        topic: input.topic,
        paperType: input.paperType,
        researchGoal: input.researchGoal,
        lengthHint: input.lengthHint,
        language: input.language,
        style: input.style,
        outline: input.outline,
        knowledgeRefs,
      })
      syncEditorStateFromTaskResult(response.result, new Date().toISOString())
      setSelectedTemplateId(`academic.${input.paperType}`)
      setModifiedSectionIds([])
      setLastAiSnapshot(null)
      setRecentAiChange(null)
      setGenerationPrompt(input.topic)
      setStatusMessage(`学术写作 workflow 已完成：${response.outline.length} 个章节、${response.citations.length} 条引用。`)
      setStatusTone('ok')
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : '学术写作 workflow 失败')
      setStatusTone('err')
    } finally {
      setBusy(false)
    }
  }, [activeWorkspacePath, attachments, knowledgeSourceMap, syncEditorStateFromTaskResult, workspaceKbIds])

  const handleSelectSection = useCallback((sectionId: string) => {
    setEditorState((prev) => ({
      ...prev,
      selectedSectionId: sectionId,
      selectedBlockId: `${sectionId}-heading`,
      selectedBlockRole: 'heading',
      selectedBlockText: prev.documentDraft?.sections.find((section) => section.id === sectionId)?.title || '',
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
    selectedBlockId: string | null
    selectedBlockRole?: string
    selectedBlockText?: string
    selectedText: string
    selectionRange?: EditableDocumentState['selectionRange']
  }) => {
    setEditorState((prev) => ({
      ...prev,
      selectedSectionId: payload.selectedSectionId || prev.selectedSectionId,
      selectedBlockId: payload.selectedBlockId || prev.selectedBlockId,
      selectedBlockRole: payload.selectedBlockRole,
      selectedBlockText: payload.selectedBlockText,
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

  const handleInsertCitation = useCallback((reference: DocumentReference) => {
    if (!editorState.selectedBlockId) {
      setStatusMessage('请先把光标放到要插入引用的位置')
      setStatusTone('err')
      return
    }
    const applied = canvasRef.current?.insertCitation({
      citationId: `citation-${Date.now()}`,
      refId: reference.id,
      sourceId: reference.sourceId,
      sourceType: reference.sourceType || reference.kind,
      chunkId: reference.chunkId,
      trustLevel: reference.trustLevel || reference.citationStatus,
      label: reference.label,
      renderMode: 'inline',
    })
    if (!applied?.applied) {
      setStatusMessage('未能插入引用，请先选中文本或定位光标')
      setStatusTone('err')
      return
    }
    setEditorState((prev) => ({
      ...updateEditableStateFromHtml(prev, applied.html),
      selectedSectionId: applied.affectedSectionId || prev.selectedSectionId,
      dirty: true,
    }))
    setStatusMessage(`已插入引用：${reference.label}`)
    setStatusTone('ok')
  }, [editorState.selectedBlockId])

  /**
   * handleCommandSubmit — routes natural-language instructions through the
   * DocumentCommandEngine before falling back to the legacy AI submit path.
   *
   * Returns true if the command was handled (caller should NOT fall through).
   * Returns false if the command engine didn't recognise the instruction.
   */
  const handleCommandSubmit = useCallback(async (instruction: string): Promise<boolean> => {
    const parsed = parseDocumentCommand(instruction)

    // Unknown intent or very low confidence — let the caller handle it
    if (parsed.intent === 'unknown' && parsed.confidence < 0.4) return false

    const canonicalData = editorState.documentArtifact?.canonicalData || null
    const resolved = resolveCommandTarget({
      descriptor: parsed.target,
      canonicalData,
      selectedBlockId: editorState.selectedBlockId,
      selectedSectionId: editorState.selectedSectionId,
    })

    if (resolved.ambiguous) {
      setStatusMessage(`目标不明确：${resolved.label}。请先选中文字或点击目标段落。`)
      setStatusTone('err')
      appendHistory(
        activeHistoryKey.startsWith('section:') ? 'section' : 'document',
        editorState.selectedSectionId,
        { role: 'assistant', text: `⚠️ 目标不明确：${resolved.label}` },
      )
      return true
    }

    // Capture a full artifact snapshot before any mutation (reliable undo)
    const previousArtifact = editorState.documentArtifact
      ? { ...editorState.documentArtifact }
      : undefined

    if (isFormatIntent(parsed.intent)) {
      // ── Format operation (no AI) ──────────────────────────────────────────
      const formatOp = buildFormatOp(parsed.intent, resolved.blockIds)
      const result = canvasRef.current?.applyFormatOp(formatOp)
      if (!result?.applied) {
        setStatusMessage(`格式操作未能应用，目标块未找到（${resolved.label}）`)
        setStatusTone('err')
        return true
      }
      const op = buildOperationRecord({
        operationClass: 'format',
        intent: parsed.intent,
        instruction,
        blockIds: result.affectedBlockIds,
        aiCalled: false,
        summary: `已对「${resolved.label}」执行：${parsed.intent}`,
        previousTexts: result.previousTexts,
        previousArtifact,
      })
      setCommandUndoStack((prev) => [op, ...prev.slice(0, 19)])
      setLastCommandOp(op)
      setEditorState((prev) => ({ ...updateEditableStateFromHtml(prev, result.html), dirty: true }))
      const histScope = parsed.target.kind.startsWith('section') ? 'section' : 'document'
      appendHistory(histScope, editorState.selectedSectionId, {
        role: 'assistant',
        text: `✅ 格式操作「${parsed.intent}」已应用至 ${resolved.label}（${result.affectedBlockIds.length} 个块）。无需 AI 调用。`,
      })
      setStatusMessage(`格式已更新：${resolved.label}`)
      setStatusTone('ok')
      return true
    }

    // ── Citation insertion (no AI text rewrite; DOM append) ──────────────────
    if (parsed.intent === 'add_citation') {
      const targetBlock = resolved.blocks[0]
      if (!targetBlock) {
        setStatusMessage('找不到目标段落，请点击要添加引用的段落后重试')
        setStatusTone('err')
        return true
      }

      // Prefer server-side knowledge retrieval; fall back to already-bound refs or a manual placeholder.
      const availableRefs = editorState.documentArtifact?.references || []
      const knowledgeRefs = editorState.documentArtifact?.knowledgeRefs || []
      let citationKnowledgeRef: DocumentKnowledgeRef | null = null
      let refSource = availableRefs[0] || (knowledgeRefs[0]
        ? {
            id: `ref-${knowledgeRefs[0].provider || 'unknown'}-${knowledgeRefs[0].kind}-${knowledgeRefs[0].sourceId || knowledgeRefs[0].id}`,
            label: knowledgeRefs[0].label || '知识库引用',
            kind: knowledgeRefs[0].kind,
            sourceId: knowledgeRefs[0].sourceId || knowledgeRefs[0].id || 'kb-unknown',
            provider: knowledgeRefs[0].provider,
            sourceType: knowledgeRefs[0].sourceType || knowledgeRefs[0].kind,
            chunkId: knowledgeRefs[0].chunkId,
            trustLevel: knowledgeRefs[0].trustLevel || knowledgeRefs[0].citationStatus,
            metadata: knowledgeRefs[0].metadata,
          }
        : null)
      const retrievalSourceIds = [...workspaceKbIds, ...attachments.map((item) => item.id)]

      if (retrievalSourceIds.length > 0) {
        try {
          const retrieval = await queryKnowledgeCitationChunks({
            query: `${instruction}\n${'text' in targetBlock ? targetBlock.text : ''}`.trim(),
            workspaceId: activeWorkspacePath,
            selectedSourceIds: retrievalSourceIds,
            topK: 1,
          })
          const chunk = retrieval.chunks[0]
          if (chunk) {
            const sourceKind = chunk.provider === 'workspace' ? 'file' : 'knowledge_base'
            citationKnowledgeRef = {
              kind: sourceKind,
              id: chunk.sourceId,
              label: chunk.title,
              excerpt: chunk.excerpt,
              provider: chunk.provider,
              sourceType: chunk.sourceType,
              sourceId: chunk.sourceId,
              chunkId: chunk.chunkId,
              trustLevel: chunk.trustLevel,
              metadata: chunk.metadata,
              citationStatus: chunk.trustLevel === 'verified' ? 'verified' : chunk.trustLevel === 'unverified' ? 'unverified' : 'partial',
            }
            refSource = {
              id: `ref-${chunk.provider}-${sourceKind}-${chunk.sourceId}`,
              label: chunk.title,
              kind: sourceKind,
              sourceId: chunk.sourceId,
              provider: chunk.provider,
              sourceType: chunk.sourceType,
              chunkId: chunk.chunkId,
              trustLevel: chunk.trustLevel,
              excerpt: chunk.excerpt,
              metadata: chunk.metadata,
            }
          }
        } catch (error) {
          setStatusMessage(error instanceof Error ? `知识库检索失败，已使用已有来源：${error.message}` : '知识库检索失败，已使用已有来源')
          setStatusTone('err')
        }
      }

      if (!refSource) {
        refSource = {
          id: `ref-placeholder-${Date.now()}`,
          label: '待补充依据',
          kind: 'manual_note' as const,
          sourceId: 'manual',
          sourceType: 'manual_note',
          trustLevel: 'unverified',
        }
      }

      const citationId = `citation-cmd-${Date.now()}`
      const result = canvasRef.current?.appendCitationToBlock({
        blockId: targetBlock.id,
        citationId,
        refId: refSource.id,
        label: refSource.label,
        refLabel: refSource.label,
        sourceId: refSource.sourceId,
        provider: refSource.provider,
        sourceType: refSource.sourceType,
        chunkId: refSource.chunkId,
        trustLevel: refSource.trustLevel,
      })

      if (!result?.applied) {
        setStatusMessage('未能插入引用，目标块未找到')
        setStatusTone('err')
        return true
      }

      const op = buildOperationRecord({
        operationClass: 'semantic',
        intent: 'add_citation',
        instruction,
        blockIds: [targetBlock.id],
        aiCalled: false,
        summary: `已在「${resolved.label}」插入引用：${refSource.label}`,
        previousTexts: { [targetBlock.id]: 'text' in targetBlock ? (targetBlock.text || '') : '' },
        previousArtifact,
      })
      setCommandUndoStack((prev) => [op, ...prev.slice(0, 19)])
      setLastCommandOp(op)
      setEditorState((prev) => {
        const nextDraft = citationKnowledgeRef && prev.documentDraft
          ? {
              ...prev.documentDraft,
              metadata: {
                ...prev.documentDraft.metadata,
                knowledgeRefs: [
                  ...(prev.documentDraft.metadata.knowledgeRefs || []).filter((ref) => ref.chunkId !== citationKnowledgeRef?.chunkId),
                  citationKnowledgeRef,
                ],
              },
            }
          : prev.documentDraft
        const next = updateEditableStateFromHtml({ ...prev, documentDraft: nextDraft }, result.html)
        return {
          ...next,
          selectedSectionId: result.affectedSectionId || prev.selectedSectionId,
          dirty: true,
        }
      })
      appendHistory(
        parsed.target.kind.startsWith('section') ? 'section' : 'document',
        editorState.selectedSectionId,
        { role: 'assistant', text: `✅ 已在「${resolved.label}」末尾插入引用：${refSource.label}` },
      )
      setStatusMessage(`已插入引用：${refSource.label}`)
      setStatusTone('ok')
      return true
    }

    if (isSemanticIntent(parsed.intent)) {
      // ── Semantic operation (AI needed) ────────────────────────────────────
      // Get the text of the first resolved block as the selection text
      const targetBlock = resolved.blocks[0]
      if (!targetBlock || !('text' in targetBlock) || !targetBlock.text?.trim()) {
        // Fall through to the normal AI path with the full instruction
        return false
      }

      const aiInstruction = parsed.aiInstruction || instruction
      setBusy(true)
      const histScope = parsed.target.kind.startsWith('section') ? 'section' : 'selection'
      appendHistory(histScope, editorState.selectedSectionId, { role: 'user', text: instruction })
      captureAiSnapshot(histScope, editorState.selectedSectionId)
      try {
        // Use stateless endpoint when no documentId (blank new document)
        const response = editorState.documentId
          ? await editDocumentSelection({
              documentId: editorState.documentId,
              instruction: aiInstruction,
              selectedText: targetBlock.text.trim(),
              selectionContext: {
                sectionId: targetBlock.sectionId ?? undefined,
                documentTitle: editorState.title,
                sectionTitle: targetBlock.sectionTitle,
              },
              document: editorState.documentDraft,
              html: editorState.html,
            })
          : await editDocumentText({
              instruction: aiInstruction,
              selectedText: targetBlock.text.trim(),
              selectionContext: {
                sectionId: targetBlock.sectionId ?? undefined,
                documentTitle: editorState.title,
                sectionTitle: targetBlock.sectionTitle,
              },
            })

        // Apply as replace_block_text for the primary block
        const applied = canvasRef.current?.applyPatch({
          type: 'replace_block_text',
          blockId: targetBlock.id,
          replacementText: response.updatedText,
        })
        if (!applied?.applied) {
          throw new Error('块级补丁未能应用，请重新定位光标后再试。')
        }

        const previousTexts: Record<string, string> = { [targetBlock.id]: targetBlock.text }
        const op = buildOperationRecord({
          operationClass: 'semantic',
          intent: parsed.intent,
          instruction,
          blockIds: [targetBlock.id],
          aiCalled: true,
          summary: `已对「${resolved.label}」执行：${parsed.intent}（AI）`,
          previousTexts,
          previousArtifact,
        })
        setCommandUndoStack((prev) => [op, ...prev.slice(0, 19)])
        setLastCommandOp(op)
        setEditorState((prev) => ({
          ...updateEditableStateFromHtml(prev, applied.html),
          selectedSectionId: applied.affectedSectionId || prev.selectedSectionId,
          selectedBlockId: prev.selectedBlockId,
          selectedBlockRole: prev.selectedBlockRole,
          selectedBlockText: response.updatedText,
          dirty: true,
        }))
        markSectionModified(applied.affectedSectionId || editorState.selectedSectionId)
        setRecentAiChange({ token: Date.now(), scope: histScope, sectionId: applied.affectedSectionId || editorState.selectedSectionId })
        appendHistory(histScope, editorState.selectedSectionId, {
          role: 'assistant',
          text: `✅ ${parsed.intent} 已完成（AI 调用）。作用范围：${resolved.label}。\n${response.message || ''}`,
        })
        setStatusMessage(`已执行：${parsed.intent} — ${resolved.label}`)
        setStatusTone('ok')
      } catch (error) {
        const message = error instanceof Error ? error.message : `${parsed.intent} 操作失败`
        appendHistory(histScope, editorState.selectedSectionId, { role: 'assistant', text: message })
        setStatusMessage(message)
        setStatusTone('err')
      } finally {
        setBusy(false)
      }
      return true
    }

    return false
  }, [activeHistoryKey, appendHistory, captureAiSnapshot, editorState, markSectionModified])

  /** Undo the most recent command-engine operation */
  const handleUndoLastCommand = useCallback(() => {
    const op = commandUndoStack[0]
    if (!op) return
    const root = canvasRef.current
    if (!root) return

    if (op.previousArtifact) {
      // Restore from full artifact snapshot — most reliable path.
      // Correctly restores html, canonicalData.blocks, citations, and references.
      const restoredHtml = op.previousArtifact.html
      const applied = canvasRef.current?.applyPatch({ type: 'replace_document', html: restoredHtml })
      if (applied?.applied) {
        setEditorState((prev) => {
          const restoredState = updateEditableStateFromHtml(prev, op.previousArtifact!.html)
          return {
            ...restoredState,
            documentArtifact: op.previousArtifact,
            dirty: true,
            saving: false,
          }
        })
      }
    } else if (op.operationClass === 'format' && op.previousTexts && Object.keys(op.previousTexts).length > 0) {
      // Fallback: restore per-block innerHTML and remove applied styles
      const currentHtml = canvasRef.current?.getHtml() || editorState.html
      const tmp = document.createElement('div')
      tmp.innerHTML = currentHtml
      const restoredHtml = undoFormatOp(tmp, op.previousTexts)
      const applied = canvasRef.current?.applyPatch({ type: 'replace_document', html: restoredHtml })
      if (applied?.applied) {
        setEditorState((prev) => ({ ...updateEditableStateFromHtml(prev, applied.html), dirty: true }))
      }
    } else if (op.operationClass === 'semantic' && op.previousTexts) {
      // Fallback: restore each block's previous text content
      for (const [blockId, text] of Object.entries(op.previousTexts)) {
        canvasRef.current?.applyPatch({ type: 'replace_block_text', blockId, replacementText: text })
      }
      const restored = canvasRef.current?.getHtml() || editorState.html
      setEditorState((prev) => ({ ...updateEditableStateFromHtml(prev, restored), dirty: true }))
    }

    setCommandUndoStack((prev) => prev.slice(1))
    setLastCommandOp(commandUndoStack[1] || null)
    setStatusMessage('已撤销上一次指令操作')
    setStatusTone('ok')
  }, [commandUndoStack, editorState.html])

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

    const canRewriteCurrentBlock = Boolean(
      selectedSection
      && editorState.selectedBlockId
      && editorState.selectedBlockText?.trim()
      && ['paragraph', 'quote', 'list-item'].includes(editorState.selectedBlockRole || ''),
    )
    if (canRewriteCurrentBlock && selectedSection) {
      appendHistory('section', selectedSection.id, { role: 'user', text: instruction })
      setActiveHistoryKey(documentHistoryKey('section', selectedSection.id))
      captureAiSnapshot('section', selectedSection.id)
      setBusy(true)
      try {
        const response = await editDocumentSelection({
          documentId: editorState.documentId,
          instruction,
          selectedText: editorState.selectedBlockText!.trim(),
          selectionContext: {
            sectionId: selectedSection.id,
            documentTitle: editorState.title,
            sectionTitle: selectedSection.title,
          },
          document: editorState.documentDraft,
          html: editorState.html,
        })
        const applied = canvasRef.current?.applyPatch({
          type: 'replace_block_text',
          blockId: editorState.selectedBlockId!,
          replacementText: response.updatedText,
        })
        if (!applied?.applied) {
          throw new Error('未能把块级补丁应用到当前文稿，请重新定位光标后再试。')
        }
        setEditorState((prev) => ({
          ...updateEditableStateFromHtml(prev, applied.html),
          selectedSectionId: applied.affectedSectionId || prev.selectedSectionId,
          selectedBlockId: prev.selectedBlockId,
          selectedBlockRole: prev.selectedBlockRole,
          selectedBlockText: response.updatedText,
          selectedText: '',
          selectionRange: undefined,
          dirty: true,
        }))
        markSectionModified(applied.affectedSectionId || selectedSection.id)
        setRecentAiChange({
          token: Date.now(),
          scope: 'section',
          sectionId: applied.affectedSectionId || selectedSection.id,
        })
        appendHistory('section', selectedSection.id, { role: 'assistant', text: '已按当前 block 更新内容。' })
        setStatusMessage('已按当前 block 更新内容')
        setStatusTone('ok')
      } catch (error) {
        const message = error instanceof Error ? error.message : '块级改写失败'
        appendHistory('section', selectedSection.id, { role: 'assistant', text: message })
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
        knowledgeRefs: buildKnowledgeRefsFromSelection(workspaceKbIds, attachments, knowledgeSourceMap),
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
        html: response.html,
        documentArtifact: response.documentArtifact,
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

  const handleAiSubmit = useCallback(runAiSubmit, [appendHistory, attachments, captureAiSnapshot, editorState, handleDocumentRewrite, knowledgeSourceMap, markSectionModified, selectedSection, syncEditorStateFromTaskResult, template, workspaceKbIds])

  const handleDownloadDocx = useCallback(async () => {
    if (!hasActiveDocument) return
    setBusy(true)
    try {
      const latestHtml = stripTransientAiMarkup(canvasRef.current?.getHtml() || editorState.html)
      const latestState = latestHtml !== editorState.html
        ? updateEditableStateFromHtml(editorState, latestHtml)
        : editorState

      // Server-side export: higher-quality output when documentId is available
      if (latestState.documentId) {
        const exported = await exportDocumentArtifact({
          documentId: latestState.documentId,
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
        return
      }

      // Client-side fallback: convert canonicalData.blocks → DOCX via html-docx-js
      if (!latestState.documentArtifact) {
        throw new Error('文稿尚未保存，无法导出 DOCX。请先保存文稿。')
      }
      const filename = `${(latestState.title || '文稿').replace(/[/\\?%*:|"<>]/g, '-')}.docx`
      await downloadDocxFromArtifact(latestState.documentArtifact, { filename })
      setStatusMessage('DOCX 已下载（浏览器本地导出）')
      setStatusTone('ok')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'DOCX 下载失败'
      setExportError(message)
      setStatusMessage(message)
      setStatusTone('err')
    } finally {
      setBusy(false)
    }
  }, [artifactFilename, editorState, hasActiveDocument])

  const handleExportPdf = useCallback(() => {
    const latestHtml = stripTransientAiMarkup(canvasRef.current?.getHtml() || editorState.html)
    const latestState = latestHtml !== editorState.html
      ? updateEditableStateFromHtml(editorState, latestHtml)
      : editorState
    const printableHtml = buildPdfPrintHtml({
      title: latestState.title || '未命名文稿',
      html: latestState.html,
    })
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      setStatusMessage('浏览器拦截了打印窗口，请允许弹窗后重试导出 PDF')
      setStatusTone('err')
      return
    }
    printWindow.document.open()
    printWindow.document.write(printableHtml)
    printWindow.document.close()
    setEditorState((prev) => (
      latestHtml !== prev.html
        ? { ...latestState, dirty: prev.dirty }
        : prev
    ))
    setStatusMessage('已打开打印预览，请在系统对话框中选择“另存为 PDF”')
    setStatusTone('ok')
    setExportError(null)
  }, [editorState])

  const handleNewDocument = useCallback(() => {
    if (editorState.dirty) {
      const confirmed = typeof window !== 'undefined'
        ? window.confirm('当前文稿尚未保存，确定新建空白文稿吗？')
        : true
      if (!confirmed) return
    }
    setEditorState(createEmptyEditorState(defaultEngine))
    setGenerationPrompt('')
    setAttachments([])
    setSectionHistory({})
    setModifiedSectionIds([])
    setArtifactFilename(null)
    setExportError(null)
    setStatusMessage('已新建空白文稿，可直接在中间编辑区开始写作')
    setStatusTone('ok')
  }, [defaultEngine, editorState.dirty])

  useEffect(() => {
    const handler = () => handleNewDocument()
    window.addEventListener('workspace-new-document', handler)
    return () => window.removeEventListener('workspace-new-document', handler)
  }, [handleNewDocument])

  const handleOpenCodeInvoke = useCallback(async (instruction: string, tool: WebDocToolId = 'chat') => {
    const trimmed = instruction.trim()
    if (!trimmed) return

    const latestHtml = stripTransientAiMarkup(canvasRef.current?.getHtml() || editorState.html)
    const historyForApi = chatMessages.map((item) => ({ role: item.role, text: item.text }))
    const userTurn: WebDocChatMessage = { id: `user-${Date.now()}`, role: 'user', text: trimmed }
    const wantsImage = shouldGenerateImageForInstruction(trimmed)

    setBusy(true)
    setStatusTone(undefined)
    setStatusMessage(tool === 'chat' ? '正在生成…' : '正在处理…')
    setChatMessages((prev) => [...prev, userTurn])

    try {
      const payload = {
        instruction: trimmed,
        html: latestHtml,
        title: editorState.title,
        selectedText: editorState.selectedText,
        selectedBlockId: editorState.selectedBlockId,
        selectedSectionId: editorState.selectedSectionId,
        chatHistory: historyForApi,
      }

      let result
      if (tool === 'chat') {
        setStatusMessage('正在写入正文…')
        result = await chatWebDocOpenCodeStream(payload, {
          onDelta: () => {
            setStatusMessage('正在写入正文…')
          },
        })
      } else {
        setStatusMessage('正在处理…')
        result = await invokeWebDocOpenCode({ ...payload, tool })
      }

      const assistantText = result.assistantMessage || '已完成。'
      setChatMessages((prev) => [
        ...prev,
        { id: `assistant-${Date.now()}`, role: 'assistant', text: assistantText },
      ])

      const mappedPatch = mapWebDocPatchToDocumentPatch(result.patch, editorState.selectedText)
      let patchApplied = false
      if (mappedPatch) {
        const applied = canvasRef.current?.applyPatch(mappedPatch)
        if (applied?.applied) {
          patchApplied = true
          setEditorState((prev) => ({
            ...updateEditableStateFromHtml(prev, applied.html),
            dirty: true,
            selectedText: mappedPatch.type === 'replace_selection' ? '' : prev.selectedText,
            selectionRange: mappedPatch.type === 'replace_selection' ? undefined : prev.selectionRange,
          }))
          markSectionModified(applied.affectedSectionId || editorState.selectedSectionId)
        }
      }

      if (!patchApplied && assistantText.length > 80 && /写|生成|撰写|续写|介绍|描述|正文/.test(trimmed)) {
        const bodyHtml = plainTextToDocumentBodyHtml(assistantText)
        const fullHtml = wrapDocumentBodyHtml(editorState.title || '未命名文稿', bodyHtml)
        const applied = canvasRef.current?.applyPatch({ type: 'replace_document', html: fullHtml })
        if (applied?.applied) {
          patchApplied = true
          setEditorState((prev) => ({
            ...updateEditableStateFromHtml(prev, applied.html),
            dirty: true,
          }))
        }
      }

      if (wantsImage && activeWorkspacePath) {
        setStatusMessage('正在生成配图…')
        const figureHtml = await generateDocumentFigureHtml(trimmed, activeWorkspacePath)
        if (figureHtml) {
          const imageApplied = canvasRef.current?.applyPatch({ type: 'insert_at_cursor', html: figureHtml })
          if (imageApplied?.applied) {
            patchApplied = true
            setEditorState((prev) => ({
              ...updateEditableStateFromHtml(prev, imageApplied.html),
              dirty: true,
            }))
          }
        }
      }

      if (!result.success) {
        setStatusMessage(result.error || assistantText)
        setStatusTone('err')
      } else if (patchApplied) {
        setStatusMessage(wantsImage ? '已更新正文并插入配图' : '已写入正文')
        setStatusTone('ok')
      } else {
        setStatusMessage('已完成')
        setStatusTone('ok')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '请求失败'
      setChatMessages((prev) => [...prev, { id: `err-${Date.now()}`, role: 'assistant', text: message }])
      setStatusMessage(message)
      setStatusTone('err')
    } finally {
      setBusy(false)
    }
  }, [activeWorkspacePath, chatMessages, editorState, markSectionModified])

  const handleCanvasContextMenu = useCallback((event: MouseEvent) => {
    const selection = window.getSelection()
    const selectedText = selection?.toString().trim() || editorState.selectedText.trim()
    setCtxMenu({
      x: event.clientX,
      y: event.clientY,
      hasSelection: selectedText.length > 0,
      selectedText,
    })
  }, [editorState.selectedText])

  const handleInsertImageClick = useCallback(() => {
    insertImageInputRef.current?.click()
  }, [])

  const handleInsertImageFile = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !activeWorkspacePath) return
    setBusy(true)
    setStatusMessage('正在插入图片…')
    try {
      const entry = await platformApi.files.upload(file)
      const token = platformApi.auth.getToken()
      const downloadRes = await fetch(resolveWebApiUrl(`/api/files/${encodeURIComponent(entry.id)}/download`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!downloadRes.ok) throw new Error('图片上传成功但无法读取预览')
      const blob = await downloadRes.blob()
      const url = URL.createObjectURL(blob)
      const figureHtml = `<figure class="ai-inserted-figure" contenteditable="false"><img src="${url}" alt="${file.name}" style="max-width:100%;height:auto;display:block;margin:12px auto;border-radius:8px;" /><figcaption contenteditable="true">${file.name}</figcaption></figure>`
      const applied = canvasRef.current?.applyPatch({ type: 'insert_at_cursor', html: figureHtml })
      if (applied?.applied) {
        setEditorState((prev) => ({ ...updateEditableStateFromHtml(prev, applied.html), dirty: true }))
        setStatusMessage('已插入图片')
        setStatusTone('ok')
      } else {
        setStatusMessage('插入图片失败')
        setStatusTone('err')
      }
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : '插入图片失败')
      setStatusTone('err')
    } finally {
      setBusy(false)
    }
  }, [activeWorkspacePath])

  const handleInsertAiImage = useCallback(async () => {
    const prompt = window.prompt('描述要生成的配图（将插入到光标处）', editorState.title || '配图')
    if (!prompt?.trim() || !activeWorkspacePath) return
    setBusy(true)
    setStatusMessage('正在生成配图…')
    try {
      const figureHtml = await generateDocumentFigureHtml(prompt.trim(), activeWorkspacePath)
      if (!figureHtml) {
        setStatusMessage('图片生成失败，请稍后重试')
        setStatusTone('err')
        return
      }
      const applied = canvasRef.current?.applyPatch({ type: 'insert_at_cursor', html: figureHtml })
      if (applied?.applied) {
        setEditorState((prev) => ({ ...updateEditableStateFromHtml(prev, applied.html), dirty: true }))
        setStatusMessage('已插入配图')
        setStatusTone('ok')
      }
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : '配图生成失败')
      setStatusTone('err')
    } finally {
      setBusy(false)
    }
  }, [activeWorkspacePath, editorState.title])

  const handleConvertToReport = useCallback(async () => {
    if (!activeWorkspacePath) {
      setStatusMessage('请先打开工作区')
      setStatusTone('err')
      return
    }
    const latestHtml = stripTransientAiMarkup(canvasRef.current?.getHtml() || editorState.html)
    if (!latestHtml.trim() || latestHtml.includes('从这里开始写作')) {
      setStatusMessage('请先撰写或生成文稿正文，再转为汇报')
      setStatusTone('err')
      return
    }
    setBusy(true)
    setStatusMessage('正在准备汇报材料…')
    try {
      await prepareReportFromDocument({
        title: editorState.title || '未命名文稿',
        html: latestHtml,
        workspacePath: activeWorkspacePath,
      })
      window.dispatchEvent(new CustomEvent('ai-office-open-report'))
      setStatusMessage('正在打开汇报生成…')
      setStatusTone('ok')
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : '转为汇报失败')
      setStatusTone('err')
    } finally {
      setBusy(false)
    }
  }, [activeWorkspacePath, editorState.html, editorState.title])

  return (
    <Shell data-testid="document-workbench">
      <DocumentTopToolbar
        onImportDocx={handleImportDocx}
        onDownloadDocx={() => void handleDownloadDocx()}
        onExportPdf={handleExportPdf}
        onSave={() => void saveCurrentDocument()}
        onConvertToReport={() => void handleConvertToReport()}
        onInsertImage={() => {
          const mode = window.confirm('确定：使用 AI 根据描述生成配图？\n点击「取消」改为从本地上传图片。')
          if (mode) void handleInsertAiImage()
          else handleInsertImageClick()
        }}
        busy={busy}
        docxDisabled={!hasActiveDocument}
      />

      <Body>
        <EditorArea>
          <DocumentEditorCanvas
            ref={canvasRef}
            compact
            state={editorState}
            modifiedSectionIds={modifiedSectionIds}
            recentAiChange={recentAiChange}
            onContextMenu={handleCanvasContextMenu}
            onHtmlChange={handleCanvasHtmlChange}
            onSelectionChange={handleCanvasSelectionChange}
          />
        </EditorArea>

        <WebDocChatPanel
          busy={busy}
          onSend={(instruction) => handleOpenCodeInvoke(instruction, 'chat')}
        />
      </Body>

      <DocumentHtmlContextMenu
        menu={ctxMenu}
        busy={busy}
        onRequestTool={(tool, label, placeholder, selectedText) => {
          setToolPrompt({ tool, label, placeholder, selectedText })
        }}
        onClose={() => setCtxMenu(null)}
      />

      <WebDocToolPromptDialog
        state={toolPrompt}
        busy={busy}
        onClose={() => setToolPrompt(null)}
        onConfirm={(userRequirement) => {
          if (!toolPrompt) return
          const instruction = buildToolInstruction(toolPrompt.tool, userRequirement)
          setToolPrompt(null)
          void handleOpenCodeInvoke(instruction, toolPrompt.tool)
        }}
      />

      {statusMessage ? <StatusBar $tone={statusTone}>{statusMessage}</StatusBar> : null}

      {kbPickerOpen && (
        <DocumentKnowledgeSourcePicker
          sources={knowledgeSources}
          selectedIds={workspaceKbIds}
          loading={knowledgeSourcesLoading}
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
      <input
        ref={insertImageInputRef}
        data-testid="document-insert-image-input"
        style={hiddenInputStyles}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={(event) => void handleInsertImageFile(event)}
      />
    </Shell>
  )
}
