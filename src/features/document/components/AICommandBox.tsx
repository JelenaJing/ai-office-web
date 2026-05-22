/**
 * AICommandBox — Word-like 文稿 AI 助手（含流式初稿、快捷操作、撤销）
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import { Download, Sparkles, Square, Undo2 } from 'lucide-react'
import type { A4EditorHandle } from './A4RichTextEditor'
import {
  AI_MODE_HINT_LABELS,
  inferDocumentEditMode,
} from '../services/documentEditSkills'
import { type DocumentExportFormat } from '../services/docxWebGeneration'
import { sessionFromSkillResult } from '../services/docxWebGeneration'
import { createDocumentTypewriter, type TypewriterController } from '../services/typewriterDocument'
import type { WebDocumentSkillManifest } from '../webDocumentSkillTypes'
import type { WebDocumentSession } from '../webDocumentTypes'
import type { DocumentEditMode } from '../webDocumentPatchTypes'
import type { UseDocumentPatchActionsReturn } from '../hooks/useDocumentPatchActions'
import {
  getWorkflow,
  getWorkflowQuickActions,
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
  gap: 12px;
  height: 100%;
  min-height: 0;
`

const AssistantCard = styled.div`
  padding: 12px;
  border-radius: 12px;
  background: linear-gradient(180deg, #eff6ff 0%, #f8fafc 100%);
  border: 1px solid #bfdbfe;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const AssistantHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`

const AssistantTitle = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
`

const AssistantBadge = styled.span`
  padding: 3px 8px;
  border-radius: 999px;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 11px;
  font-weight: 700;
`

const AssistantHint = styled.div`
  font-size: 12px;
  color: #334155;
  line-height: 1.55;
`

const ModeHint = styled.div`
  font-size: 12px;
  color: #475569;
  padding: 8px 10px;
  background: #f1f5f9;
  border-radius: 8px;
  line-height: 1.45;
`

const SectionTitle = styled.div`
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #64748b;
  text-transform: uppercase;
`

const QuickGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
`

const QuickBtn = styled.button`
  min-height: 38px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #1e293b;
  font-size: 12px;
  font-weight: 600;
  text-align: left;
  cursor: pointer;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`

const PromptArea = styled.textarea`
  width: 100%;
  min-height: 120px;
  flex: 1;
  box-sizing: border-box;
  padding: 12px 14px;
  border: 1px solid #c8d8e8;
  border-radius: 10px;
  font-size: 14px;
  resize: none;
  font-family: inherit;
  line-height: 1.6;
  background: #fff;
`

const BtnRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

const CmdBtn = styled.button<{ $primary?: boolean; $danger?: boolean }>`
  height: 34px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid ${(p) => (p.$danger ? '#dc2626' : p.$primary ? '#2563eb' : '#94a3b8')};
  background: ${(p) => (p.$danger ? '#fff1f2' : p.$primary ? '#2563eb' : '#fff')};
  color: ${(p) => (p.$danger ? '#b91c1c' : p.$primary ? '#fff' : '#334155')};
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`

const ResultBox = styled.div<{ $tone: 'ok' | 'err' | 'info' }>`
  font-size: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  line-height: 1.5;
  background: ${(p) => (
    p.$tone === 'err' ? '#fef2f2' : p.$tone === 'ok' ? '#ecfdf5' : '#eff6ff'
  )};
  color: ${(p) => (
    p.$tone === 'err' ? '#b91c1c' : p.$tone === 'ok' ? '#166534' : '#1d4ed8'
  )};
  border: 1px solid ${(p) => (
    p.$tone === 'err' ? '#fecaca' : p.$tone === 'ok' ? '#bbf7d0' : '#bfdbfe'
  )};
`

const ActionCard = styled.div`
  padding: 12px;
  border-radius: 12px;
  border: 1px solid #c7f9cc;
  background: #f0fdf4;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const ActionTitle = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: #166534;
`

const ActionBody = styled.div`
  font-size: 12px;
  color: #166534;
  line-height: 1.55;
`

const ActionButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

const ActionBtn = styled.button`
  height: 32px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid #86efac;
  background: #fff;
  color: #166534;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

type ResultTone = 'ok' | 'err' | 'info'

const KbContextNote = styled.div<{ $tone: 'ok' | 'warn' }>`
  font-size: 11px;
  padding: 6px 10px;
  border-radius: 6px;
  background: ${({ $tone }) => $tone === 'warn' ? '#fef9c3' : '#f0fdf4'};
  color: ${({ $tone }) => $tone === 'warn' ? '#92400e' : '#166534'};
  border: 1px solid ${({ $tone }) => $tone === 'warn' ? '#fde68a' : '#bbf7d0'};
  line-height: 1.5;
`

interface AssistantState {
  badge: string
  hint: string
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
  /** 当前文档导出并立即下载 (顶部工具栏) */
  onExportCurrentDocument: (format: DocumentExportFormat) => Promise<void>
  /**
   * 可选别名 —— 生成完成卡片里的下载按钮使用此回调；
   * 未传时自动降级到 onExportCurrentDocument。
   */
  onExportRequest?: (format: DocumentExportFormat) => void | Promise<void>
  exportBusyFormat?: DocumentExportFormat | null
  disabled?: boolean
  generationMode?: 'default' | 'knowledge-template-document'
  templateDocument?: import('../services/documentEditSkills').TemplateDocumentPayload | null
  documentTypePreset?: import('../services/documentEditSkills').DocumentTypePresetPayload | null
  patchActions: UseDocumentPatchActionsReturn
  /** Current document workflow type; controls which quick actions are shown */
  workflowId?: DocumentWorkflowId
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
  // 生成完成卡片的下载按钮优先使用 onExportRequest，否则降级到 onExportCurrentDocument
  const handleCardExport = useCallback(
    (format: DocumentExportFormat) => {
      if (onExportRequest) return void onExportRequest(format)
      return void onExportCurrentDocument(format)
    },
    [onExportRequest, onExportCurrentDocument],
  )
  const [instruction, setInstruction] = useState('')
  const [busy, setBusy] = useState(false)
  const [selectionTick, setSelectionTick] = useState(0)
  const [resultMsg, setResultMsg] = useState('')
  const [resultTone, setResultTone] = useState<ResultTone>('info')
  const [resultCard, setResultCard] = useState<{ title: string; body: string } | null>(null)
  const [streaming, setStreaming] = useState(false)
  const [lastKbContext, setLastKbContext] = useState<{
    kbCount: number; fileCount: number; hasContext: boolean; isRagEnabled: boolean
  } | null>(null)
  const [formalTemplatePresetId, setFormalTemplatePresetId] = useState<string>('visit_letter')
  const [formalTemplatePresets, setFormalTemplatePresets] = useState<FormalTemplatePreset[]>([])
  const [formalTemplatePresetError, setFormalTemplatePresetError] = useState<string>('')
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const streamControllerRef = useRef<TypewriterController | null>(null)

  const readEditor = () => editorRef.current

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

  useEffect(() => {
    if (workflowId !== 'formal_template') return
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
  }, [workflowId])

  const editorState = useMemo(() => {
    void selectionTick
    const ed = readEditor()
    return {
      hasSelection: ed?.hasSelection() ?? false,
      isBodyEmpty: ed?.isEmpty() ?? true,
    }
  }, [selectionTick, session.html])

  const modeHint = useMemo(() => {
    const hint = inferDocumentEditMode(
      instruction,
      editorState.hasSelection,
      editorState.isBodyEmpty,
    )
    return AI_MODE_HINT_LABELS[hint === 'generate' ? 'generate_document' : hint]
  }, [instruction, editorState.hasSelection, editorState.isBodyEmpty])

  const assistantState = useMemo<AssistantState>(() => {
    if (editorState.isBodyEmpty) {
      return {
        badge: '空文稿',
        hint: '建议先生成初稿，AI 会把正文逐段写入编辑器，你可以随时停止并保留已生成内容。',
      }
    }
    if (editorState.hasSelection) {
      return {
        badge: '已选中内容',
        hint: '当前更适合优化选中内容或改写这部分表达，修改后可继续全文润色。',
      }
    }
    return {
      badge: '已有正文',
      hint: '可以继续写、优化全文、改成正式语气，或在文末生成摘要和大纲。',
    }
  }, [editorState.hasSelection, editorState.isBodyEmpty])

  const setInfo = useCallback((message: string, tone: ResultTone = 'info') => {
    setResultMsg(message)
    setResultTone(tone)
  }, [])

  const showSuccessCard = useCallback((titleText: string, body: string) => {
    setResultCard({ title: titleText, body })
    setInfo(body, 'ok')
  }, [setInfo])

  const handleUndo = useCallback(() => {
    patchActions.undoLastPatch()
    setResultCard(null)
    setInfo('已撤销上一次 AI 修改', 'ok')
  }, [patchActions, setInfo])

  const stopStreaming = useCallback(() => {
    streamControllerRef.current?.cancel()
  }, [])

  const finishStreamingDraft = useCallback((
    base: WebDocumentSession,
    body: string,
    cancelled: boolean,
    options?: {
      successTitle?: string
      successBody?: string
      successStatus?: string
    },
  ) => {
    onSessionUpdate(buildSessionSnapshot({
      base,
      title,
      templateId: template.id,
      knowledgeBaseIds,
      fileIds,
      html: body,
      markdown: base.markdown,
    }))

    if (cancelled) {
      showSuccessCard('已完成：停止生成', '已停止生成，当前已写入内容已保留，可继续修改或下载。')
      onStatus?.('已停止生成，已写入内容已保留', 'ok')
      return
    }

    showSuccessCard(
      options?.successTitle ?? '初稿已生成',
      options?.successBody ?? '你可以继续修改，或直接下载当前文稿。',
    )
    onStatus?.(options?.successStatus ?? '初稿已生成，可继续修改或下载', 'ok')
  }, [fileIds, knowledgeBaseIds, onSessionUpdate, onStatus, showSuccessCard, template.id, title])

  const handleGenerateDraft = useCallback(async (
    promptOverride?: string,
    options?: { paperMode?: PaperWorkflowMode; formalTemplatePresetId?: string },
  ) => {
    const ed = readEditor()
    if (!workspacePath) {
      setInfo('请先打开工作区', 'err')
      onStatus?.('请先打开工作区', 'err')
      return
    }

    const prompt = (promptOverride ?? instruction).trim()
    if (!prompt) {
      setInfo('请输入生成要求', 'err')
      return
    }

    setBusy(true)
    setStreaming(false)
    setResultCard(null)
    const isPaperWorkflow = workflowId === 'academic_paper' || workflowId === 'literature_review'
    const isFormalTemplate = workflowId === 'formal_template'
    setInfo(
      isPaperWorkflow
        ? workflowId === 'academic_paper'
          ? '正在启动研究文章链路（paper workflow / research）…'
          : '正在启动综述文章链路（paper workflow / review）…'
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
        workflowId,
        workflowLabel: getWorkflow(workflowId).label,
        outlineSections: getWorkflow(workflowId).outlineSections,
        documentKind: workflowId,
        paperMode: options?.paperMode,
        formalTemplatePresetId: isFormalTemplate ? (options?.formalTemplatePresetId ?? formalTemplatePresetId) : undefined,
        onStatus: (message) => {
          setInfo(message)
          onStatus?.(message)
        },
        onProgress: ({ message }) => {
          setInfo(message)
          onStatus?.(message)
        },
      })

      let streamTargetHtml = workflowResult.html
      let nextSession = session
      let successTitle = '初稿已生成'
      let successBody = '你可以继续修改，或直接下载当前文稿。'
      let successStatus = '初稿已生成，可继续修改或下载'

      if (workflowResult.mode === 'document') {
        const result = workflowResult.documentResult
        if (!result?.success) {
          const msg = result?.error || '生成失败'
          setInfo(msg, 'err')
          onStatus?.(msg, 'err')
          return
        }

        if (result.data?.knowledgeContext) {
          setLastKbContext(result.data.knowledgeContext)
        }

        const patch = result.data?.patch
        nextSession = sessionFromSkillResult(result, template, knowledgeBaseIds, fileIds) ?? session
        streamTargetHtml = patch?.type === 'replace_document' ? patch.html : nextSession.html

        if (patch && patch.type !== 'replace_document') {
          patchActions.applyPatchWithUndo(patch)
          setInstruction('')
          showSuccessCard('已完成：生成初稿', '初稿已生成，可继续修改或下载。')
          onStatus?.('初稿已生成，可继续修改或下载', 'ok')
          refreshSelectionState()
          return
        }
      } else {
        nextSession = buildSessionSnapshot({
          base: {
            ...session,
            markdown: workflowResult.markdown ?? session.markdown,
          },
          title,
          templateId: template.id,
          knowledgeBaseIds,
          fileIds,
          html: workflowResult.html ?? session.html,
          markdown: workflowResult.markdown ?? session.markdown,
        })
        if (workflowResult.mode === 'formal_template') {
          successTitle = '正式模板链路已完成'
          successBody = `${selectedFormalTemplatePreset?.label || '正式模板'}已生成，结果已写入当前编辑器，可继续修改或下载。`
          successStatus = `当前使用：${workflowResult.diagnostics?.chain || selectedFormalTemplatePreset?.runtimeLabel || '正式模板链路'}`
        } else {
          successTitle = workflowId === 'literature_review' ? '文献综述链路已完成' : '研究文章链路已完成'
          successBody = workflowId === 'literature_review'
            ? '综述文章链路已完成，结果已写入当前编辑器，可继续修改或下载。'
            : '研究文章链路已完成，结果已写入当前编辑器，可继续修改或下载。'
          successStatus = workflowId === 'literature_review'
            ? '当前使用：paper workflow / review'
            : '当前使用：paper workflow / research'
        }
      }

      if (!streamTargetHtml || !ed) {
        setInfo('生成完成但未返回正文', 'err')
        return
      }

      patchActions.captureUndoSnapshot()
      setStreaming(true)
      if (workflowResult.mode === 'paper') {
        setInfo(
          workflowId === 'literature_review'
            ? '正在生成综述正文…'
            : '正在生成论文正文…',
        )
      } else if (workflowResult.mode === 'formal_template') {
        setInfo('正在把正式模板结果写入编辑器…')
        onStatus?.('正在把正式模板结果写入编辑器…')
      } else {
        setInfo('AI 正在构思…')
        onStatus?.('AI 正在构思…')
      }

      const controller = createDocumentTypewriter({
        editorRef,
        html: streamTargetHtml,
        mode: 'replace',
        onStart: () => {
          setInfo('AI 正在写入正文…')
          onStatus?.('AI 正在写入正文…')
        },
        onProgress: (state) => {
          setInfo(state.message)
          onStatus?.(state.message)
        },
        onError: (error) => {
          setInfo(error.message, 'err')
          onStatus?.(error.message, 'err')
        },
      })
      streamControllerRef.current = controller

      const twResult = await controller.promise
      streamControllerRef.current = null
      setStreaming(false)
      setInstruction('')
      finishStreamingDraft(
        twResult.cancelled ? session : nextSession,
        ed.getHtml(),
        twResult.cancelled,
        {
          successTitle,
          successBody,
          successStatus,
        },
      )
      refreshSelectionState()
    } catch (error) {
      const msg = error instanceof Error ? error.message : '生成失败'
      setStreaming(false)
      setInfo(msg, 'err')
      onStatus?.(msg, 'err')
    } finally {
      streamControllerRef.current = null
      setBusy(false)
    }
  }, [
    documentTypePreset,
    editorRef,
    fileIds,
    finishStreamingDraft,
    instruction,
    knowledgeBaseIds,
    onStatus,
    patchActions,
    refreshSelectionState,
    session,
    setInfo,
    showSuccessCard,
    template,
    templateDocument,
    title,
    workflowId,
    workspacePath,
    formalTemplatePresetId,
    selectedFormalTemplatePreset,
  ])

  const executeEdit = useCallback(async (
    command: string,
    modeOverride?: DocumentEditMode,
    successTitle = '已完成：AI 修改',
    successBody = '文稿已更新，可继续修改或下载。',
  ) => {
    const ed = readEditor()
    if (!workspacePath) {
      setInfo('请先打开工作区', 'err')
      onStatus?.('请先打开工作区', 'err')
      return
    }

    const cmd = command.trim()
    if (!cmd) {
      setInfo('请输入 AI 指令', 'err')
      return
    }

    const inferred = inferDocumentEditMode(cmd, ed?.hasSelection() ?? false, ed?.isEmpty() ?? true)
    if (inferred === 'generate') {
      await handleGenerateDraft(cmd)
      return
    }

    setBusy(true)
    setResultCard(null)
    setInfo('AI 正在修改文稿…')

    try {
      const ok = await patchActions.runAiEditAction(cmd, modeOverride ?? inferred)
      if (ok) {
        setInstruction('')
        showSuccessCard(successTitle, successBody)
        refreshSelectionState()
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : '编辑失败'
      setInfo(msg, 'err')
      onStatus?.(msg, 'err')
    } finally {
      setBusy(false)
    }
  }, [
    handleGenerateDraft,
    onStatus,
    patchActions,
    refreshSelectionState,
    setInfo,
    showSuccessCard,
    workspacePath,
  ])

  const handleQuickAction = useCallback(async (
    kind: 'formal_notice' | 'continue' | 'polish' | 'formal_tone' | 'outline' | 'summary',
  ) => {
    if (busy || disabled) return

    if (kind !== 'formal_notice' && editorState.isBodyEmpty) {
      setInfo('正文为空，请先生成初稿', 'err')
      return
    }

    switch (kind) {
      case 'formal_notice':
        await handleGenerateDraft('请生成一份正式通知，包含标题、背景、工作要求、时间安排和结尾。')
        break
      case 'continue':
        await executeEdit(
          '请延续当前文稿的结构和语气继续写下去，补完整体内容。',
          'insert_at_cursor',
          '已完成：继续写',
          'AI 已续写当前文稿，可继续修改或下载。',
        )
        break
      case 'polish':
        await executeEdit(
          '请优化全文结构和语言，让表达更清晰、更像正式办公文稿。',
          'polish_document',
          '已完成：优化全文',
          '全文已优化，可继续修改或下载。',
        )
        break
      case 'formal_tone':
        await executeEdit(
          '请把全文改成正式、稳妥、适合办公场景的语气。',
          'polish_document',
          '已完成：改成正式语气',
          '文稿语气已调整为更正式的表达。',
        )
        break
      case 'outline':
        await executeEdit(
          '请在文末提取这篇文稿的大纲，使用清晰的小标题和要点列表。',
          'insert_at_cursor',
          '已完成：提取大纲',
          '大纲已插入当前文稿，可继续整理或下载。',
        )
        break
      case 'summary':
        await executeEdit(
          '请在文末补充一段简明摘要，概括全文重点和结论。',
          'insert_at_cursor',
          '已完成：生成摘要',
          '摘要已插入当前文稿，可继续修改或下载。',
        )
        break
      default:
        break
    }
  }, [busy, disabled, editorState.isBodyEmpty, executeEdit, handleGenerateDraft, setInfo])

  const handleWorkflowAction = useCallback(async (qa: WorkflowQuickAction) => {
    if (busy || disabled) return
    if (qa.requiresContent && editorState.isBodyEmpty) {
      setInfo('正文为空，请先生成初稿', 'err')
      return
    }
    if (qa.action === 'generate') {
      if (qa.formalTemplatePresetId) {
        setFormalTemplatePresetId(qa.formalTemplatePresetId)
      }
      await handleGenerateDraft(qa.prompt, {
        paperMode: qa.paperMode,
        formalTemplatePresetId: qa.formalTemplatePresetId,
      })
    } else {
      await executeEdit(
        qa.prompt,
        qa.mode,
        qa.successTitle ?? '已完成：AI 修改',
        qa.successBody ?? '文稿已更新，可继续修改或下载。',
      )
    }
  }, [busy, disabled, editorState.isBodyEmpty, executeEdit, handleGenerateDraft, setInfo])

  // Derive workflow-specific quick actions
  const workflowActions = useMemo(() => getWorkflowQuickActions(workflowId), [workflowId])
  const currentWorkflow = useMemo(() => getWorkflow(workflowId), [workflowId])
  const selectedFormalTemplatePreset = useMemo(
    () => formalTemplatePresets.find((preset) => preset.id === formalTemplatePresetId) ?? null,
    [formalTemplatePresetId, formalTemplatePresets],
  )
  const supportedFormalTemplatePresets = useMemo(
    () => formalTemplatePresets.filter((preset) => preset.supported),
    [formalTemplatePresets],
  )
  const unsupportedFormalTemplatePresets = useMemo(
    () => formalTemplatePresets.filter((preset) => !preset.supported),
    [formalTemplatePresets],
  )

  const handleSend = useCallback(async () => {
    await executeEdit(
      instruction,
      undefined,
      '已完成：执行 AI 修改',
      '文稿已按你的要求更新，可继续修改或下载。',
    )
  }, [executeEdit, instruction])

  return (
    <Panel data-testid="ai-command-box">
      <AssistantCard>
        <AssistantHeader>
          <AssistantTitle>AI 文稿助手</AssistantTitle>
          <AssistantBadge>{assistantState.badge}</AssistantBadge>
        </AssistantHeader>
        <AssistantHint>{assistantState.hint}</AssistantHint>
        {workflowId !== 'general' && (
          <div style={{ fontSize: 12, color: '#6366f1', fontWeight: 600, marginTop: 2 }}>
            📄 {currentWorkflow.label}
            {workflowId === 'academic_paper' ? ' · 当前使用：研究文章链路' : ''}
            {workflowId === 'literature_review' ? ' · 当前使用：综述文章链路' : ''}
            {workflowId === 'formal_template' && (
              <span style={{ fontWeight: 600, color: '#6366f1', marginLeft: 6 }}>
                · 当前使用：
                {selectedFormalTemplatePreset?.runtimeKind === 'schema-first'
                  ? ' schema-first 正式模板链路'
                  : ' template document rewrite 链路'}
              </span>
            )}
          </div>
        )}
      </AssistantCard>

      <ModeHint>{modeHint}</ModeHint>

      {workflowId === 'formal_template' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <SectionTitle>选择模板类型</SectionTitle>
          <select
            value={formalTemplatePresetId}
            onChange={(e) => setFormalTemplatePresetId(e.target.value)}
            disabled={busy || disabled}
            style={{
              fontSize: 13,
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid #d1d5db',
              background: '#fff',
              color: '#1e293b',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {(formalTemplatePresets.length > 0 ? formalTemplatePresets : [
              {
                id: 'visit_letter',
                label: '拜访函',
                description: '',
                category: 'letter',
                templateKind: 'visit-letter',
                runtimeKind: 'schema-first',
                runtimeLabel: 'schema-first / visit-letter / base-replace',
                supported: true,
              } as FormalTemplatePreset,
            ]).map((preset) => (
              <option key={preset.id} value={preset.id} disabled={!preset.supported}>
                {preset.label}{preset.supported ? '' : '（未接入）'}
              </option>
            ))}
          </select>
          <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.6 }}>
            {selectedFormalTemplatePreset
              ? `当前模板运行时：${selectedFormalTemplatePreset.runtimeLabel}`
              : '正在加载正式模板列表…'}
          </div>
          {formalTemplatePresetError && (
            <div style={{ fontSize: 11, color: '#b91c1c', lineHeight: 1.6 }}>
              模板列表加载失败：{formalTemplatePresetError}
            </div>
          )}
          {supportedFormalTemplatePresets.length > 0 && (
            <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.6 }}>
              可用模板：
              {supportedFormalTemplatePresets.map((preset) => `${preset.label}（${preset.runtimeLabel}）`).join('、')}
            </div>
          )}
          {unsupportedFormalTemplatePresets.length > 0 && (
            <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.6 }}>
              暂不可用：
              {unsupportedFormalTemplatePresets
                .map((preset) => `${preset.label}（${preset.unavailableReason || '未接入'}）`)
                .join('；')}
            </div>
          )}
        </div>
      )}

      <div>
        <SectionTitle>快捷操作</SectionTitle>
        <QuickGrid style={{ marginTop: 8 }}>
          {workflowActions.map((qa, idx) => (
            <QuickBtn
              key={idx}
              type="button"
              disabled={busy || disabled || (!!qa.requiresContent && editorState.isBodyEmpty)}
              onClick={() => void handleWorkflowAction(qa)}
            >
              {qa.label}
            </QuickBtn>
          ))}
        </QuickGrid>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0, flex: 1 }}>
        <SectionTitle>对话式指令</SectionTitle>
        <PromptArea
          ref={inputRef}
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="告诉我你想怎么改这篇文稿，例如：改得更正式、补充背景、生成结尾。"
          disabled={busy || disabled}
        />
      </div>

      <BtnRow>
        <CmdBtn $primary type="button" disabled={busy || disabled} onClick={() => void handleSend()}>
          <Sparkles size={14} />
          {busy && !streaming ? '执行中…' : '发送给 AI 助手'}
        </CmdBtn>
        {streaming ? (
          <CmdBtn $danger type="button" disabled={disabled} onClick={stopStreaming}>
            <Square size={14} />
            停止生成
          </CmdBtn>
        ) : (
          <CmdBtn type="button" disabled={busy || disabled} onClick={() => void handleGenerateDraft()}>
            {busy ? '生成中…' : '生成初稿'}
          </CmdBtn>
        )}
        <CmdBtn type="button" disabled={!patchActions.canUndo || busy || disabled} onClick={handleUndo}>
          <Undo2 size={14} />
          撤销
        </CmdBtn>
      </BtnRow>

      {resultMsg ? <ResultBox $tone={resultTone}>{resultMsg}</ResultBox> : null}

      {resultCard ? (
        <ActionCard>
          <ActionTitle>{resultCard.title}</ActionTitle>
          <ActionBody>{resultCard.body}</ActionBody>
          <ActionButtons>
            <ActionBtn
              type="button"
              disabled={busy || disabled || Boolean(exportBusyFormat)}
              onClick={() => handleCardExport('docx')}
            >
              <Download size={14} />
              {exportBusyFormat === 'docx' ? '正在生成 Word…' : '下载 Word'}
            </ActionBtn>
            <ActionBtn
              type="button"
              disabled={busy || disabled || Boolean(exportBusyFormat)}
              onClick={() => handleCardExport('markdown')}
            >
              <Download size={14} />
              {exportBusyFormat === 'markdown' ? '正在生成 Markdown…' : '下载 Markdown'}
            </ActionBtn>
            <ActionBtn
              type="button"
              disabled={busy || disabled || Boolean(exportBusyFormat)}
              onClick={() => handleCardExport('html')}
            >
              <Download size={14} />
              {exportBusyFormat === 'html' ? '正在生成 HTML…' : '下载 HTML'}
            </ActionBtn>
            <ActionBtn
              type="button"
              disabled={busy || disabled}
              onClick={() => void handleQuickAction('polish')}
            >
              优化全文
            </ActionBtn>
            <ActionBtn
              type="button"
              disabled={busy || disabled}
              onClick={() => {
                inputRef.current?.focus()
                setResultMsg('可以继续修改当前文稿。')
                setResultTone('info')
              }}
            >
              继续修改
            </ActionBtn>
          </ActionButtons>
        </ActionCard>
      ) : null}

      {lastKbContext && knowledgeBaseIds.length > 0 ? (
        lastKbContext.hasContext && lastKbContext.kbCount > 0 ? (
          <KbContextNote $tone="ok">
            📚 已列入知识库上下文：{lastKbContext.kbCount} 个知识库
            {lastKbContext.fileCount > 0 ? `，共 ${lastKbContext.fileCount} 个文件` : ''}
            {!lastKbContext.isRagEnabled ? '（目录引用，非语义检索）' : ''}
          </KbContextNote>
        ) : (
          <KbContextNote $tone="warn">
            ⚠️ 当前知识库未参与本次生成
            {lastKbContext.fileCount === 0 ? '（知识库暂无文件）' : ''}
          </KbContextNote>
        )
      ) : null}
    </Panel>
  )
}
