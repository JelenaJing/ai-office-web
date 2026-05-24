import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import { ArrowUp, Sparkles, Square } from 'lucide-react'
import type { A4EditorHandle } from './A4RichTextEditor'
import { type DocumentExportFormat } from '../services/docxWebGeneration'
import { createDocumentTypewriter, type TypewriterController } from '../services/typewriterDocument'
import type { WebDocumentSkillManifest } from '../webDocumentSkillTypes'
import type { WebDocumentSession } from '../webDocumentTypes'
import type { DocumentEditMode, WebDocumentPatch } from '../webDocumentPatchTypes'
import type { UseDocumentPatchActionsReturn } from '../hooks/useDocumentPatchActions'
import {
  getWorkflow,
  getWorkflowQuickActions,
  resolveFormalTemplatePresetFromInstruction,
  shouldPromptFormalTemplateChoice,
  type DocumentWorkflowId,
  type WorkflowQuickAction,
} from '../workflows/documentWorkflowRegistry'
import { runWorkflowGenerate } from '../services/documentWorkflowGenerateRouter'
import type { PaperWorkflowMode } from '../services/paperWorkflowAdapter'
import {
  listFormalTemplatePresets,
  type FormalTemplatePreset,
} from '../services/formalTemplateAdapter'

const Panel = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  border: 1px solid #dce5ef;
  border-radius: 16px;
  background: linear-gradient(180deg, #f9fbfe 0%, #f4f8fc 100%);
  overflow: hidden;
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid #dce5ef;
  background: rgba(255, 255, 255, 0.82);
`

const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 800;
  color: #1e3a5f;
`

const HeaderMeta = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: #607487;
  background: #eef4fb;
  border: 1px solid #d6e0ea;
  border-radius: 999px;
  padding: 4px 10px;
`

const MessagesScroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 16px;
  display: grid;
  gap: 10px;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(110, 140, 175, 0.38);
    border-radius: 999px;
  }
`

const MessageBubble = styled.div<{ $role: ChatMessage['role']; $pending?: boolean }>`
  max-width: 88%;
  justify-self: ${({ $role }) => ($role === 'user' ? 'end' : 'start')};
  border-radius: 16px;
  padding: 11px 14px;
  background: ${({ $role }) => {
    if ($role === 'user') return 'linear-gradient(180deg, #4a8cd6 0%, #3570b8 100%)'
    if ($role === 'assistant') return '#ffffff'
    return '#fff8ed'
  }};
  color: ${({ $role }) => ($role === 'user' ? '#ffffff' : $role === 'assistant' ? '#24384d' : '#8a5f1f')};
  border: 1px solid ${({ $role }) => ($role === 'assistant' ? '#dce5ef' : $role === 'system' ? '#edd4a6' : 'transparent')};
  box-shadow: ${({ $role }) => ($role === 'assistant' ? '0 6px 18px rgba(30, 58, 95, 0.06)' : 'none')};
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 13px;
  line-height: 1.65;
  opacity: ${({ $pending }) => ($pending ? 0.72 : 1)};
`

const MessageMeta = styled.div<{ $role: ChatMessage['role'] }>`
  margin-bottom: 6px;
  font-size: 11px;
  font-weight: 700;
  color: ${({ $role }) => ($role === 'user' ? 'rgba(255,255,255,0.78)' : $role === 'assistant' ? '#607487' : '#9a6a1f')};
`

const MessageActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
`

const MessageActionButton = styled.button<{ $role: ChatMessage['role'] }>`
  min-height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid ${({ $role }) => ($role === 'assistant' ? '#c7d7ea' : '#e7c98d')};
  background: #ffffff;
  color: ${({ $role }) => ($role === 'assistant' ? '#2c5a8b' : '#8a5f1f')};
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`

const Composer = styled.div`
  padding: 12px 16px 16px;
  border-top: 1px solid #dce5ef;
  background: rgba(255, 255, 255, 0.9);
  display: grid;
  gap: 10px;
`

const QuickChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

const QuickChip = styled.button`
  min-height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid #d6e0ea;
  background: #ffffff;
  color: #4b6278;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`

const InputShell = styled.div`
  border: 1px solid #d6e0ea;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 6px 18px rgba(30, 58, 95, 0.05);
  padding: 12px 14px 10px;
`

const Input = styled.textarea`
  width: 100%;
  min-height: 74px;
  max-height: 140px;
  resize: vertical;
  border: none;
  background: transparent;
  color: #304255;
  padding: 0;
  font-size: 14px;
  line-height: 1.6;
  font-family: inherit;
  outline: none;

  &::placeholder {
    color: #9aa9b7;
  }
`

const ComposerFooter = styled.div`
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`

const FooterHint = styled.div`
  font-size: 12px;
  color: #607487;
  line-height: 1.5;
`

const SendButton = styled.button<{ $stop?: boolean }>`
  width: 38px;
  height: 38px;
  border-radius: 999px;
  border: 1px solid ${({ $stop }) => ($stop ? '#d9ba77' : '#7aa8dc')};
  background: ${({ $stop }) => ($stop ? '#fff7e5' : 'linear-gradient(180deg, #6ba3e0 0%, #4a8cd6 100%)')};
  color: ${({ $stop }) => ($stop ? '#8a601f' : '#ffffff')};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: ${({ $stop }) => ($stop ? 'none' : '0 6px 16px rgba(74, 140, 214, 0.2)')};
  cursor: pointer;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`

type ChatActionId =
  | 'export_docx'
  | 'export_md'
  | 'export_html'
  | 'polish'
  | 'continue'
  | 'undo'
  | 'select_visit_letter'
  | 'select_congratulation_letter'
  | 'select_generic_template'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant' | 'system'
  text: string
  createdAt: string
  pending?: boolean
  actions?: Array<{
    label: string
    action: ChatActionId
  }>
}

export interface AICommandBoxProps {
  editorRef: React.RefObject<A4EditorHandle | null>
  workspacePath: string | null
  title: string
  template: WebDocumentSkillManifest
  knowledgeBaseIds: string[]
  fileIds: string[]
  session: WebDocumentSession
  onSessionUpdate: (session: WebDocumentSession) => void
  onStatus?: (message: string, tone?: 'ok' | 'err') => void
  onExportCurrentDocument: (format: DocumentExportFormat) => Promise<void>
  onExportRequest?: (format: DocumentExportFormat) => void | Promise<void>
  exportBusyFormat?: DocumentExportFormat | null
  disabled?: boolean
  generationMode?: 'default' | 'knowledge-template-document'
  templateDocument?: import('../services/documentEditSkills').TemplateDocumentPayload | null
  documentTypePreset?: import('../services/documentEditSkills').DocumentTypePresetPayload | null
  patchActions: UseDocumentPatchActionsReturn
  workflowId?: DocumentWorkflowId
}

function createMessage(
  role: ChatMessage['role'],
  text: string,
  actions?: ChatMessage['actions'],
  pending = false,
): ChatMessage {
  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    text,
    createdAt: new Date().toISOString(),
    pending,
    actions,
  }
}

function buildSessionSnapshot(input: {
  base: WebDocumentSession
  title: string
  templateId: string
  knowledgeBaseIds: string[]
  fileIds: string[]
  html: string
  markdown?: string
}): WebDocumentSession {
  return {
    ...input.base,
    title: input.title,
    templateSkillId: input.templateId,
    knowledgeBaseIds: input.knowledgeBaseIds,
    fileIds: input.fileIds,
    html: input.html,
    markdown: input.markdown ?? input.base.markdown,
    updatedAt: new Date().toISOString(),
  }
}

function toPatch(value: unknown): WebDocumentPatch | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  if (record.type === 'replace_document' && typeof record.html === 'string') {
    return {
      type: 'replace_document',
      html: record.html,
      markdown: typeof record.markdown === 'string' ? record.markdown : undefined,
    }
  }
  if (record.type === 'replace_selection' && typeof record.html === 'string') {
    return {
      type: 'replace_selection',
      html: record.html,
      markdown: typeof record.markdown === 'string' ? record.markdown : undefined,
    }
  }
  if (record.type === 'insert_at_cursor' && typeof record.html === 'string') {
    return {
      type: 'insert_at_cursor',
      html: record.html,
      markdown: typeof record.markdown === 'string' ? record.markdown : undefined,
    }
  }
  if (record.type === 'append_section' && typeof record.html === 'string') {
    return {
      type: 'append_section',
      title: typeof record.title === 'string' ? record.title : undefined,
      html: record.html,
      markdown: typeof record.markdown === 'string' ? record.markdown : undefined,
    }
  }
  return null
}

export function AICommandBox({
  editorRef,
  workspacePath,
  title,
  template,
  knowledgeBaseIds,
  fileIds,
  session,
  onSessionUpdate,
  onStatus,
  onExportCurrentDocument,
  onExportRequest,
  exportBusyFormat,
  disabled,
  templateDocument,
  documentTypePreset,
  patchActions,
  workflowId = 'general',
}: AICommandBoxProps) {
  const currentWorkflow = useMemo(() => getWorkflow(workflowId), [workflowId])
  const workflowActions = useMemo(() => getWorkflowQuickActions(workflowId), [workflowId])

  const [instruction, setInstruction] = useState('')
  const [busy, setBusy] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [selectionTick, setSelectionTick] = useState(0)
  const [messages, setMessages] = useState<ChatMessage[]>([
    createMessage('assistant', `我是 AI 文稿助手。当前工作流：${currentWorkflow.label}。你可以直接让我生成初稿、优化全文、继续写，或导出 Word。`),
  ])
  const [formalTemplatePresetId, setFormalTemplatePresetId] = useState<string>('visit_letter')
  const [formalTemplatePresets, setFormalTemplatePresets] = useState<FormalTemplatePreset[]>([])
  const [formalTemplatePresetError, setFormalTemplatePresetError] = useState('')

  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const messagesRef = useRef<HTMLDivElement | null>(null)
  const pendingMessageIdRef = useRef<string | null>(null)
  const streamControllerRef = useRef<TypewriterController | null>(null)
  const contextSignatureRef = useRef<string>('')
  const workflowSignatureRef = useRef<string>('')
  const formalPromptSignatureRef = useRef<string>('')

  const readEditor = () => editorRef.current

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const refreshSelectionState = useCallback(() => {
    setSelectionTick((tick) => tick + 1)
  }, [])

  useEffect(() => {
    const onSelectionChange = () => refreshSelectionState()
    document.addEventListener('selectionchange', onSelectionChange)
    return () => {
      document.removeEventListener('selectionchange', onSelectionChange)
      streamControllerRef.current?.cancel()
      streamControllerRef.current = null
    }
  }, [refreshSelectionState])

  const appendMessage = useCallback((role: ChatMessage['role'], text: string, actions?: ChatMessage['actions']) => {
    setMessages((prev) => [...prev, createMessage(role, text, actions)])
  }, [])

  const upsertPendingAssistant = useCallback((text: string) => {
    setMessages((prev) => {
      if (pendingMessageIdRef.current) {
        return prev.map((message) => (
          message.id === pendingMessageIdRef.current
            ? { ...message, text, pending: true }
            : message
        ))
      }
      const next = createMessage('assistant', text, undefined, true)
      pendingMessageIdRef.current = next.id
      return [...prev, next]
    })
  }, [])

  const resolvePendingAssistant = useCallback((text: string, actions?: ChatMessage['actions']) => {
    setMessages((prev) => {
      if (!pendingMessageIdRef.current) {
        return [...prev, createMessage('assistant', text, actions)]
      }
      const pendingId = pendingMessageIdRef.current
      pendingMessageIdRef.current = null
      return prev.map((message) => (
        message.id === pendingId
          ? { ...message, text, actions, pending: false }
          : message
      ))
    })
  }, [])

  const clearPendingAssistant = useCallback(() => {
    setMessages((prev) => prev.filter((message) => message.id !== pendingMessageIdRef.current))
    pendingMessageIdRef.current = null
  }, [])

  const announceContext = useCallback(() => {
    if (knowledgeBaseIds.length === 0 && fileIds.length === 0) return
    const signature = `${knowledgeBaseIds.length}:${fileIds.length}`
    if (contextSignatureRef.current === signature) return
    contextSignatureRef.current = signature
    appendMessage(
      'system',
      `已使用 ${knowledgeBaseIds.length} 个知识库、${fileIds.length} 个文件作为上下文。`,
    )
  }, [appendMessage, fileIds.length, knowledgeBaseIds.length])

  const buildFollowUpActions = useCallback((): ChatMessage['actions'] => ([
    { label: '导出 Word', action: 'export_docx' },
    { label: '导出 Markdown', action: 'export_md' },
    { label: '导出 HTML', action: 'export_html' },
    { label: '继续写', action: 'continue' },
    { label: '优化全文', action: 'polish' },
    { label: '撤销上一次修改', action: 'undo' },
  ]), [])

  const selectedFormalTemplatePreset = useMemo(
    () => formalTemplatePresets.find((preset) => preset.id === formalTemplatePresetId) ?? null,
    [formalTemplatePresetId, formalTemplatePresets],
  )

  const formalPromptNeeded = shouldPromptFormalTemplateChoice(workflowId, instruction)

  useEffect(() => {
    const signature = `${workflowId}:${currentWorkflow.label}`
    if (workflowSignatureRef.current === signature) return
    workflowSignatureRef.current = signature
    appendMessage(
      'system',
      workflowId === 'general'
        ? '当前处于普通文稿模式。正文为空时会优先生成初稿；已有正文时会优先按全文编辑理解你的指令。'
        : `当前处于「${currentWorkflow.label}」模式。你仍然可以直接对话生成、修改或导出当前文稿。`,
    )
  }, [appendMessage, currentWorkflow.label, workflowId])

  useEffect(() => {
    if (!formalPromptNeeded) return
    let disposed = false
    void listFormalTemplatePresets()
      .then((presets) => {
        if (disposed) return
        setFormalTemplatePresets(presets)
        setFormalTemplatePresetError('')
        const current = presets.find((preset) => preset.id === formalTemplatePresetId)
        if (!current || !current.supported) {
          const firstSupported = presets.find((preset) => preset.supported)
          if (firstSupported) setFormalTemplatePresetId(firstSupported.id)
        }
      })
      .catch((error) => {
        if (disposed) return
        setFormalTemplatePresetError(error instanceof Error ? error.message : '获取正式模板列表失败')
      })
    return () => {
      disposed = true
    }
  }, [formalPromptNeeded, formalTemplatePresetId])

  useEffect(() => {
    if (!formalPromptNeeded) return
    const supportedPresets = formalTemplatePresets.filter((preset) => preset.supported)
    const signature = [
      workflowId,
      instruction.trim(),
      selectedFormalTemplatePreset?.id || formalTemplatePresetId,
      supportedPresets.map((preset) => preset.id).join(','),
      formalTemplatePresetError,
    ].join('|')
    if (formalPromptSignatureRef.current === signature) return
    formalPromptSignatureRef.current = signature

    if (formalTemplatePresetError) {
      appendMessage('system', `正式模板列表加载失败：${formalTemplatePresetError}`)
      return
    }

    if (supportedPresets.length === 0) {
      appendMessage('system', '正在准备正式模板选项…')
      return
    }

    appendMessage(
      'assistant',
      `当前正式模板：${selectedFormalTemplatePreset?.label || '未选择'}。如需正式模板，请先确认模板类型。`,
      [
        { label: '使用拜访函', action: 'select_visit_letter' },
        { label: '使用贺信', action: 'select_congratulation_letter' },
        { label: '使用通用模板', action: 'select_generic_template' },
      ],
    )
  }, [
    appendMessage,
    formalPromptNeeded,
    formalTemplatePresetError,
    formalTemplatePresetId,
    formalTemplatePresets,
    instruction,
    selectedFormalTemplatePreset,
    workflowId,
  ])

  const editorState = useMemo(() => {
    void selectionTick
    const ed = readEditor()
    return {
      hasSelection: ed?.hasSelection() ?? false,
      isBodyEmpty: ed?.isEmpty() ?? true,
    }
  }, [selectionTick, session.html])

  const footerHint = useMemo(() => {
    if (streaming) return '正在写入正文，可点击右侧按钮停止。'
    if (editorState.hasSelection) return '当前有选区，AI 会优先修改选中内容。'
    if (editorState.isBodyEmpty) return '正文为空，发送生成型指令时会优先生成初稿。'
    return '已有正文且无选区时，会优先按全文编辑理解你的指令。'
  }, [editorState.hasSelection, editorState.isBodyEmpty, streaming])

  const handleExport = useCallback(async (format: DocumentExportFormat) => {
    const labelMap: Record<DocumentExportFormat, string> = {
      docx: 'Word',
      markdown: 'Markdown',
      html: 'HTML',
    }
    try {
      await Promise.resolve(onExportRequest ? onExportRequest(format) : onExportCurrentDocument(format))
      appendMessage('assistant', `已导出 ${labelMap[format]}，你可以继续修改或再次导出。`, buildFollowUpActions())
    } catch (error) {
      appendMessage('system', `导出 ${labelMap[format]} 失败：${error instanceof Error ? error.message : '未知错误'}`)
    }
  }, [appendMessage, buildFollowUpActions, onExportCurrentDocument, onExportRequest])

  const handleUndo = useCallback(() => {
    if (!patchActions.canUndo) return
    patchActions.undoLastPatch()
    appendMessage('assistant', '已撤销上一次 AI 修改。', buildFollowUpActions())
  }, [appendMessage, buildFollowUpActions, patchActions])

  const stopStreaming = useCallback(() => {
    upsertPendingAssistant('正在停止生成…')
    streamControllerRef.current?.cancel()
  }, [upsertPendingAssistant])

  const finishStreamingDraft = useCallback((
    base: WebDocumentSession,
    body: string,
    cancelled: boolean,
    message: string,
    markdown?: string,
  ) => {
    onSessionUpdate(buildSessionSnapshot({
      base,
      title,
      templateId: template.id,
      knowledgeBaseIds,
      fileIds,
      html: body,
      markdown,
    }))
    resolvePendingAssistant(
      cancelled
        ? '已停止生成，当前已写入内容已保留，可继续修改或导出 Word。'
        : message,
      buildFollowUpActions(),
    )
    onStatus?.(
      cancelled ? '已停止生成，已写入内容已保留' : message,
      'ok',
    )
  }, [
    buildFollowUpActions,
    fileIds,
    knowledgeBaseIds,
    onSessionUpdate,
    onStatus,
    resolvePendingAssistant,
    template.id,
    title,
  ])

  const handleGenerateDraft = useCallback(async (
    promptOverride?: string,
    options?: {
      paperMode?: PaperWorkflowMode
      formalTemplatePresetId?: string
      workflowIdOverride?: DocumentWorkflowId
    },
  ) => {
    const ed = readEditor()
    if (!workspacePath) {
      appendMessage('system', '请先打开工作区。')
      onStatus?.('请先打开工作区', 'err')
      return
    }

    const prompt = (promptOverride ?? instruction).trim()
    if (!prompt) {
      appendMessage('system', '请输入生成要求。')
      return
    }

    const activeWorkflowId = options?.workflowIdOverride ?? workflowId
    const activeWorkflow = getWorkflow(activeWorkflowId)
    const isPaperWorkflow = activeWorkflowId === 'academic_paper' || activeWorkflowId === 'literature_review'
    const isFormalTemplate = activeWorkflowId === 'formal_template'

    announceContext()
    setBusy(true)
    setStreaming(false)
    upsertPendingAssistant(
      isPaperWorkflow
        ? activeWorkflowId === 'literature_review'
          ? '正在启动文献综述链路…'
          : '正在启动论文链路…'
        : isFormalTemplate
        ? '正在启动正式模板链路…'
        : '正在生成初稿…',
    )

    try {
      const workflowResult = await runWorkflowGenerate({
        instruction: prompt,
        workspacePath,
        title,
        documentText: ed?.getText() ?? '',
        currentDocumentText: ed?.getText() ?? '',
        templateSkillId: template.id,
        templateManifest: template as unknown as Record<string, unknown>,
        knowledgeBaseIds,
        fileIds,
        generationMode: templateDocument ? 'knowledge-template-document' : 'default',
        templateDocument: templateDocument ?? undefined,
        documentTypePreset: documentTypePreset ?? undefined,
        workflowId: activeWorkflowId,
        workflowLabel: activeWorkflow.label,
        outlineSections: activeWorkflow.outlineSections,
        documentKind: activeWorkflowId,
        paperMode: options?.paperMode,
        formalTemplatePresetId: isFormalTemplate
          ? (options?.formalTemplatePresetId ?? formalTemplatePresetId)
          : undefined,
        onStatus: (message) => {
          upsertPendingAssistant(message)
          onStatus?.(message)
        },
        onProgress: ({ message }) => {
          upsertPendingAssistant(message)
          onStatus?.(message)
        },
      })

      const patch = toPatch(workflowResult.patch)
      if (patch && patch.type !== 'replace_document') {
        patchActions.applyPatchWithUndo(patch)
        setInstruction('')
        resolvePendingAssistant(
          workflowResult.message || '已生成初稿，你可以继续修改或导出 Word。',
          buildFollowUpActions(),
        )
        refreshSelectionState()
        return
      }

      const targetHtml = patch?.type === 'replace_document'
        ? patch.html
        : workflowResult.html
      const targetMarkdown = patch?.type === 'replace_document'
        ? patch.markdown
        : workflowResult.markdown

      if (!targetHtml || !ed) {
        clearPendingAssistant()
        appendMessage('system', '生成完成但未返回正文。')
        return
      }

      patchActions.captureUndoSnapshot()
      setStreaming(true)
      upsertPendingAssistant('AI 正在写入正文…')

      const controller = createDocumentTypewriter({
        editorRef,
        html: targetHtml,
        mode: 'replace',
        onStart: () => {
          upsertPendingAssistant('AI 正在写入正文…')
          onStatus?.('AI 正在写入正文…')
        },
        onProgress: (state) => {
          upsertPendingAssistant(state.message)
          onStatus?.(state.message)
        },
        onError: (error) => {
          clearPendingAssistant()
          appendMessage('system', error.message)
          onStatus?.(error.message, 'err')
        },
      })
      streamControllerRef.current = controller

      const typewriterResult = await controller.promise
      streamControllerRef.current = null
      setStreaming(false)
      setInstruction('')

      const successMessage = workflowResult.mode === 'formal_template'
        ? `${selectedFormalTemplatePreset?.label || '正式模板'}已生成，你可以继续修改或导出 Word。`
        : workflowResult.mode === 'paper'
        ? (activeWorkflowId === 'literature_review'
          ? '文献综述已生成，你可以继续修改或导出 Word。'
          : '论文初稿已生成，你可以继续修改或导出 Word。')
        : (workflowResult.message || '已生成初稿，你可以继续修改或导出 Word。')

      finishStreamingDraft(
        buildSessionSnapshot({
          base: {
            ...session,
            markdown: targetMarkdown ?? session.markdown,
          },
          title,
          templateId: template.id,
          knowledgeBaseIds,
          fileIds,
          html: targetHtml,
          markdown: targetMarkdown ?? session.markdown,
        }),
        ed.getHtml(),
        typewriterResult.cancelled,
        successMessage,
        targetMarkdown ?? session.markdown,
      )
      refreshSelectionState()
    } catch (error) {
      clearPendingAssistant()
      appendMessage('system', error instanceof Error ? error.message : '生成失败')
      onStatus?.(error instanceof Error ? error.message : '生成失败', 'err')
    } finally {
      streamControllerRef.current = null
      setStreaming(false)
      setBusy(false)
    }
  }, [
    announceContext,
    appendMessage,
    buildFollowUpActions,
    clearPendingAssistant,
    documentTypePreset,
    editorRef,
    fileIds,
    finishStreamingDraft,
    formalTemplatePresetId,
    instruction,
    knowledgeBaseIds,
    onStatus,
    patchActions,
    refreshSelectionState,
    resolvePendingAssistant,
    selectedFormalTemplatePreset,
    session,
    template,
    templateDocument,
    title,
    upsertPendingAssistant,
    workflowId,
    workspacePath,
  ])

  const executeEdit = useCallback(async (
    command: string,
    modeOverride?: DocumentEditMode,
    successMessage = '文稿已按你的要求更新，可继续修改或导出 Word。',
  ) => {
    if (!workspacePath) {
      appendMessage('system', '请先打开工作区。')
      onStatus?.('请先打开工作区', 'err')
      return
    }

    const cmd = command.trim()
    if (!cmd) {
      appendMessage('system', '请输入 AI 指令。')
      return
    }

    announceContext()
    setBusy(true)
    upsertPendingAssistant('AI 正在修改文稿…')

    try {
      const ok = await patchActions.runAiEditAction(cmd, modeOverride ?? 'polish_document')
      if (ok) {
        setInstruction('')
        resolvePendingAssistant(successMessage, buildFollowUpActions())
        refreshSelectionState()
      } else {
        clearPendingAssistant()
      }
    } catch (error) {
      clearPendingAssistant()
      appendMessage('system', error instanceof Error ? error.message : '编辑失败')
      onStatus?.(error instanceof Error ? error.message : '编辑失败', 'err')
    } finally {
      setBusy(false)
    }
  }, [
    announceContext,
    appendMessage,
    buildFollowUpActions,
    clearPendingAssistant,
    onStatus,
    patchActions,
    refreshSelectionState,
    resolvePendingAssistant,
    workspacePath,
  ])

  const handleWorkflowAction = useCallback(async (qa: WorkflowQuickAction) => {
    if (busy || disabled) return
    if (qa.requiresContent && editorState.isBodyEmpty) {
      appendMessage('system', '正文为空，请先生成初稿。')
      return
    }
    if (qa.action === 'generate') {
      if (qa.formalTemplatePresetId) {
        setFormalTemplatePresetId(qa.formalTemplatePresetId)
      }
      await handleGenerateDraft(qa.prompt, {
        paperMode: qa.paperMode as PaperWorkflowMode | undefined,
        formalTemplatePresetId: qa.formalTemplatePresetId,
        workflowIdOverride: workflowId,
      })
      return
    }
    await executeEdit(
      qa.prompt,
      editorState.hasSelection ? undefined : qa.mode,
      qa.successBody ?? '文稿已更新，可继续修改或导出 Word。',
    )
  }, [
    appendMessage,
    busy,
    disabled,
    editorState.hasSelection,
    editorState.isBodyEmpty,
    executeEdit,
    handleGenerateDraft,
    workflowId,
  ])

  const findWorkflowAction = useCallback((label: string) => {
    return workflowActions.find((action) => action.label === label)
  }, [workflowActions])

  const runQuickChip = useCallback(async (kind: 'generate' | 'polish' | 'formal_tone' | 'export_docx') => {
    if (busy || disabled) return
    if (kind === 'export_docx') {
      appendMessage('user', '导出 Word')
      await handleExport('docx')
      return
    }
    if (kind === 'generate') {
      appendMessage('user', '生成初稿')
      await handleGenerateDraft(instruction.trim() || currentWorkflow.defaultPrompt)
      return
    }
    if (kind === 'polish') {
      appendMessage('user', '优化全文')
      const workflowAction = findWorkflowAction('优化全文')
      if (workflowAction) {
        await handleWorkflowAction(workflowAction)
      } else {
        await executeEdit(
          '请优化全文结构和语言，让表达更清晰、更像正式办公文稿。',
          editorState.hasSelection ? undefined : 'polish_document',
          '全文已优化，可继续修改或导出 Word。',
        )
      }
      return
    }
    appendMessage('user', '改成正式语气')
    await executeEdit(
      '请把全文改成正式、稳妥、适合办公场景的语气。',
      editorState.hasSelection ? undefined : 'polish_document',
      '文稿语气已调整为更正式的表达，可继续修改或导出 Word。',
    )
  }, [
    appendMessage,
    busy,
    currentWorkflow.defaultPrompt,
    disabled,
    editorState.hasSelection,
    executeEdit,
    findWorkflowAction,
    handleExport,
    handleGenerateDraft,
    handleWorkflowAction,
    instruction,
  ])

  const handleMessageAction = useCallback(async (action: ChatActionId) => {
    if (busy && !streaming) return
    switch (action) {
      case 'export_docx':
        await handleExport('docx')
        break
      case 'export_md':
        await handleExport('markdown')
        break
      case 'export_html':
        await handleExport('html')
        break
      case 'polish':
        await runQuickChip('polish')
        break
      case 'continue':
        appendMessage('user', '继续写')
        await executeEdit(
          '请延续当前文稿的结构和语气继续写下去，补完整体内容。',
          editorState.hasSelection ? undefined : 'insert_at_cursor',
          '已续写当前文稿，可继续修改或导出 Word。',
        )
        break
      case 'undo':
        handleUndo()
        break
      case 'select_visit_letter':
        setFormalTemplatePresetId('visit_letter')
        appendMessage('system', '已选择正式模板：拜访函。')
        break
      case 'select_congratulation_letter':
        setFormalTemplatePresetId('congratulation_letter')
        appendMessage('system', '已选择正式模板：贺信。')
        break
      case 'select_generic_template':
        setFormalTemplatePresetId('generic_template_rewrite')
        appendMessage('system', '已选择正式模板：通用模板改写。')
        break
      default:
        break
    }
  }, [
    appendMessage,
    busy,
    editorState.hasSelection,
    executeEdit,
    handleExport,
    handleUndo,
    runQuickChip,
    streaming,
  ])

  const dispatchInstruction = useCallback(async (rawInstruction: string) => {
    const text = rawInstruction.trim()
    if (!text || busy || disabled) return

    appendMessage('user', text)
    setInstruction('')

    if (/导出\s*(word|docx)|下载\s*word/i.test(text)) {
      await handleExport('docx')
      return
    }
    if (/导出\s*(markdown|md)/i.test(text)) {
      await handleExport('markdown')
      return
    }
    if (/导出\s*html/i.test(text)) {
      await handleExport('html')
      return
    }

    const formalTemplatePreset = resolveFormalTemplatePresetFromInstruction(text)
    if (shouldPromptFormalTemplateChoice(workflowId, text)) {
      if (formalTemplatePreset) {
        setFormalTemplatePresetId(formalTemplatePreset)
        await handleGenerateDraft(text, {
          workflowIdOverride: 'formal_template',
          formalTemplatePresetId: formalTemplatePreset,
        })
        return
      }
      if (workflowId === 'formal_template') {
        await handleGenerateDraft(text, { workflowIdOverride: 'formal_template' })
        return
      }
      appendMessage('assistant', '这是正式模板需求。请先确认模板类型，然后我会按正式模板链路生成文稿。', [
        { label: '使用拜访函', action: 'select_visit_letter' },
        { label: '使用贺信', action: 'select_congratulation_letter' },
        { label: '使用通用模板', action: 'select_generic_template' },
      ])
      return
    }

    const exactWorkflowAction = workflowActions.find((action) => text.includes(action.label))
    if (exactWorkflowAction) {
      await handleWorkflowAction(exactWorkflowAction)
      return
    }

    if (/优化全文|全文优化|润色全文/.test(text)) {
      await executeEdit(
        text,
        editorState.hasSelection ? undefined : 'polish_document',
        '全文已优化，可继续修改或导出 Word。',
      )
      return
    }

    if (/继续写|续写/.test(text)) {
      await executeEdit(
        text,
        editorState.hasSelection ? undefined : 'insert_at_cursor',
        '已续写当前文稿，可继续修改或导出 Word。',
      )
      return
    }

    if (/正式语气|改成正式|正式一点/.test(text)) {
      await executeEdit(
        text,
        editorState.hasSelection ? undefined : 'polish_document',
        '文稿语气已调整为更正式的表达，可继续修改或导出 Word。',
      )
      return
    }

    if (/生成|起草|写一份|写一篇|请写|请生成/.test(text)) {
      await handleGenerateDraft(text)
      return
    }

    if (editorState.isBodyEmpty) {
      await handleGenerateDraft(text)
      return
    }

    await executeEdit(
      text,
      editorState.hasSelection ? undefined : 'polish_document',
      '文稿已按你的要求更新，可继续修改或导出 Word。',
    )
  }, [
    appendMessage,
    busy,
    disabled,
    editorState.hasSelection,
    editorState.isBodyEmpty,
    executeEdit,
    handleExport,
    handleGenerateDraft,
    handleWorkflowAction,
    workflowActions,
    workflowId,
  ])

  const handleSend = useCallback(async () => {
    await dispatchInstruction(instruction)
  }, [dispatchInstruction, instruction])

  return (
    <Panel data-testid="ai-command-box">
      <Header>
        <HeaderTitle>
          <Sparkles size={16} />
          AI 文稿助手
        </HeaderTitle>
        <HeaderMeta>{currentWorkflow.label}</HeaderMeta>
      </Header>

      <MessagesScroll ref={messagesRef}>
        {messages.map((message) => (
          <MessageBubble key={message.id} $role={message.role} $pending={message.pending}>
            <MessageMeta $role={message.role}>
              {message.role === 'user' ? '你' : message.role === 'assistant' ? 'AI 助手' : '系统'}
            </MessageMeta>
            {message.text}
            {message.actions?.length ? (
              <MessageActionRow>
                {message.actions.map((action) => (
                  <MessageActionButton
                    key={`${message.id}-${action.action}-${action.label}`}
                    type="button"
                    $role={message.role}
                    disabled={disabled || Boolean(exportBusyFormat)}
                    onClick={() => void handleMessageAction(action.action)}
                  >
                    {action.label}
                  </MessageActionButton>
                ))}
              </MessageActionRow>
            ) : null}
          </MessageBubble>
        ))}
      </MessagesScroll>

      <Composer>
        <QuickChipRow>
          <QuickChip
            type="button"
            disabled={busy || disabled}
            onClick={() => void runQuickChip('generate')}
          >
            生成初稿
          </QuickChip>
          <QuickChip
            type="button"
            disabled={busy || disabled || (editorState.isBodyEmpty && !instruction.trim())}
            onClick={() => void runQuickChip('polish')}
          >
            优化全文
          </QuickChip>
          <QuickChip
            type="button"
            disabled={busy || disabled || (editorState.isBodyEmpty && !instruction.trim())}
            onClick={() => void runQuickChip('formal_tone')}
          >
            改成正式语气
          </QuickChip>
          <QuickChip
            type="button"
            disabled={busy || disabled || Boolean(exportBusyFormat)}
            onClick={() => void runQuickChip('export_docx')}
          >
            导出 Word
          </QuickChip>
        </QuickChipRow>

        <InputShell>
          <Input
            ref={inputRef}
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                void handleSend()
              }
            }}
            placeholder="直接对话，例如：生成一份正式通知、优化全文、继续写、导出 Word。"
            disabled={busy || disabled}
          />
          <ComposerFooter>
            <FooterHint>{footerHint}</FooterHint>
            <SendButton
              type="button"
              $stop={streaming}
              disabled={disabled || (!streaming && !instruction.trim())}
              onClick={() => {
                if (streaming) {
                  stopStreaming()
                } else {
                  void handleSend()
                }
              }}
            >
              {streaming ? <Square size={15} /> : <ArrowUp size={16} />}
            </SendButton>
          </ComposerFooter>
        </InputShell>
      </Composer>
    </Panel>
  )
}
