import { useCallback, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { useWorkspace } from '../../../contexts/WorkspaceContext'
import { platformApi } from '../../../platform'
import { consumePendingResourceOpen } from '../../../services/pendingResourceOpen'
import {
  buildKnowledgeRefsFromSelection,
  editDocumentSelection,
  editDocumentText,
  exportDocumentArtifact,
  fetchWorkbenchDocument,
  importDocumentDocx,
  listKnowledgeSources,
  saveEditableDocument,
  startDocumentTask,
  waitForDocumentTask,
} from '../../document/services/documentWorkbenchApi'
import type { EditableDocumentState } from '../../document/services/documentWorkbenchApi'
import type { KnowledgeSourceListItem } from '../../../platform'
import { DocumentKnowledgeSourcePicker } from '../../document/components/DocumentKnowledgeSourcePicker'
import {
  buildAttachmentKnowledgeRefs,
  buildAttachmentPromptBlock,
  uploadStudioMaterial,
  type StudioAttachment,
} from '../services/documentStudioMaterials'
import { consumePendingDocumentStudioOpen } from '../../../services/pendingDocumentStudioOpen'
import { plainTextToDocumentBodyHtml } from '../../document/services/documentContentApply'
import DocumentStudioWelcomeView from '../components/DocumentStudioWelcomeView'
import DocumentStudioGeneratingView from '../components/DocumentStudioGeneratingView'
import DocumentStudioEditorView from '../components/DocumentStudioEditorView'
import DocumentStudioTextPreviewModal from '../components/DocumentStudioTextPreviewModal'
import type { StudioChatMessage } from '../components/DocumentStudioAiPanel'
import {
  getDocumentTaskTemplate,
  resolveTaskTemplateGenerationParams,
  buildToneInstruction,
  type DocumentTaskTemplate,
  type DocumentTone,
} from '../services/documentTaskTemplates'
import {
  createTempDraftId,
  hasDocumentStudioContent,
  loadDocumentStudioDraft,
  migrateTempDraftToDocument,
  saveDocumentStudioDraft,
} from '../services/documentStudioPersistence'
import { fetchDocument } from '../services/documentStudioApi'
import { studioContentModelToWorkbenchHtml } from '../services/studioToWorkbenchHtml'
import {
  createEmptyWorkbenchState,
  editableStateFromTaskResult,
  updateEditableStateFromHtml,
  buildDownloadableHtmlDocument,
  downloadHtmlFile,
} from '../services/workbenchState'
import {
  applyDocumentStudioUrl,
  goToDocumentStudioHome,
  persistActiveDocumentId,
  readActiveDocumentIdFromUrl,
  resolveDocumentStudioEntryIntent,
} from '../services/documentStudioSession'

export type DocumentViewMode = 'welcome' | 'generating' | 'editor'

const Shell = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
`

interface Props {
  onBack?: () => void
}

type AiPreviewState = {
  text: string
  instruction: string
  selectedText: string
}

function stripTransientAiMarkup(html: string): string {
  if (typeof document === 'undefined') return html
  const root = document.createElement('div')
  root.innerHTML = html
  root.querySelectorAll('mark[data-ai-change="true"]').forEach((node) => {
    const parent = node.parentNode
    if (!parent) return
    while (node.firstChild) parent.insertBefore(node.firstChild, node)
    parent.removeChild(node)
  })
  return root.innerHTML
}

export default function DocumentStudioPage({ onBack }: Props) {
  const { activeWorkspacePath } = useWorkspace()
  const [viewMode, setViewMode] = useState<DocumentViewMode>('welcome')
  const [prompt, setPrompt] = useState('')
  const [tone, setTone] = useState<DocumentTone>('formal')
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTaskTemplate | null>(
    () => getDocumentTaskTemplate('work-report') || null,
  )
  const [editorState, setEditorState] = useState<EditableDocumentState>(() => createEmptyWorkbenchState())
  const [genProgress, setGenProgress] = useState(0)
  const [genMessage, setGenMessage] = useState('')
  const [genError, setGenError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [statusTone, setStatusTone] = useState<'ok' | 'err' | undefined>()
  const [chatMessages, setChatMessages] = useState<StudioChatMessage[]>([])
  const [aiPreview, setAiPreview] = useState<AiPreviewState | null>(null)
  const bootstrapAttempted = useRef(false)
  const tempDraftIdRef = useRef(createTempDraftId())
  const [knowledgeSourceIds, setKnowledgeSourceIds] = useState<string[]>([])
  const [knowledgeLabels, setKnowledgeLabels] = useState<string[]>([])
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSourceListItem[]>([])
  const [knowledgeSourcesLoading, setKnowledgeSourcesLoading] = useState(false)
  const [kbPickerOpen, setKbPickerOpen] = useState(false)
  const [attachments, setAttachments] = useState<StudioAttachment[]>([])
  const knowledgeSourceMapRef = useRef(new Map<string, KnowledgeSourceListItem>())

  useEffect(() => {
    if (!activeWorkspacePath) return
    let disposed = false
    setKnowledgeSourcesLoading(true)
    void listKnowledgeSources(activeWorkspacePath)
      .then((sources) => {
        if (disposed) return
        setKnowledgeSources(sources)
        const map = new Map<string, KnowledgeSourceListItem>()
        sources.forEach((item) => map.set(item.id, item))
        knowledgeSourceMapRef.current = map
        setKnowledgeLabels((prev) =>
          prev.map((label) => {
            const match = sources.find((s) => s.title === label)
            return match?.title || label
          }),
        )
      })
      .catch(() => {
        if (!disposed) setKnowledgeSources([])
      })
      .finally(() => {
        if (!disposed) setKnowledgeSourcesLoading(false)
      })
    return () => {
      disposed = true
    }
  }, [activeWorkspacePath])

  const syncKnowledgeLabels = useCallback((ids: string[]) => {
    const map = knowledgeSourceMapRef.current
    setKnowledgeLabels(
      ids.map((id) => map.get(id)?.title || id).filter(Boolean),
    )
  }, [])

  const handleKbApply = useCallback(
    (ids: string[]) => {
      setKnowledgeSourceIds(ids)
      syncKnowledgeLabels(ids)
      setKbPickerOpen(false)
    },
    [syncKnowledgeLabels],
  )

  const handleUploadMaterials = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files)
    for (const file of list) {
      const placeholderId = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      setAttachments((prev) => [
        ...prev,
        {
          id: placeholderId,
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'uploading',
        },
      ])
      const uploaded = await uploadStudioMaterial(file)
      setAttachments((prev) => prev.filter((item) => item.id !== placeholderId).concat(uploaded))
      if (uploaded.status === 'failed' && uploaded.error) {
        setStatusMessage(uploaded.error)
        setStatusTone('err')
      }
    }
  }, [])

  const applyStudioOpenHandoff = useCallback(
    async (handoff: ReturnType<typeof consumePendingDocumentStudioOpen>) => {
      if (!handoff) return
      if (handoff.userNotice) {
        setStatusMessage(handoff.userNotice)
        setStatusTone('err')
      }
      if (handoff.emailSubject) {
        setPrompt((prev) =>
          prev.trim()
            ? prev
            : `请根据邮件附件「${handoff.fileName}」撰写文稿。邮件主题：${handoff.emailSubject}`,
        )
      }
      if (handoff.importAsEditor && handoff.artifactId && activeWorkspacePath) {
        setBusy(true)
        try {
          const imported = await importDocumentDocx({
            artifactId: handoff.artifactId,
            workspacePath: activeWorkspacePath,
          })
          const nextState = editableStateFromTaskResult(imported)
          setEditorState(nextState)
          setViewMode('editor')
          setStatusMessage(`已打开邮件附件：${handoff.fileName}`)
          setStatusTone('ok')
        } catch (error) {
          setStatusMessage(error instanceof Error ? error.message : '打开附件失败')
          setStatusTone('err')
          setViewMode('welcome')
        } finally {
          setBusy(false)
        }
        return
      }
      if (handoff.extractedTextPreview) {
        setAttachments([
          {
            id: `handoff-${Date.now()}`,
            name: handoff.fileName,
            size: 0,
            type: handoff.mimeType || 'text/plain',
            status: 'ready',
            fileRef: handoff.fileId,
            extractedTextPreview: handoff.extractedTextPreview,
          },
        ])
      } else if (handoff.fileId) {
        setAttachments([
          {
            id: `handoff-${Date.now()}`,
            name: handoff.fileName,
            size: 0,
            type: handoff.mimeType || 'application/octet-stream',
            status: 'ready',
            fileRef: handoff.fileId,
          },
        ])
      }
      setViewMode('welcome')
    },
    [activeWorkspacePath],
  )

  useEffect(() => {
    if (viewMode !== 'editor') return
    saveDocumentStudioDraft({
      editorState,
      taskTemplateId: selectedTemplate?.id || null,
      tone,
      tempDraftId: tempDraftIdRef.current,
    })
  }, [editorState, selectedTemplate?.id, tone, viewMode])

  const hydrateFromStudioDocument = useCallback(async (documentId: string) => {
    const doc = await fetchDocument(documentId)
    const model = doc.contentModel as {
      title?: string
      blocks?: Array<{
        id: string
        type: 'heading' | 'paragraph' | 'blockquote' | 'list'
        level?: number
        text: string
        items?: string[]
      }>
    }
    const html = studioContentModelToWorkbenchHtml({
      title: doc.title,
      blocks: model?.blocks,
    })
    setEditorState(
      updateEditableStateFromHtml(
        {
          ...createEmptyWorkbenchState(),
          documentId: doc.documentId,
          artifactId: doc.artifactId,
          engine: 'document-studio',
        },
        html,
      ),
    )
    setViewMode('editor')
  }, [])

  const hydrateDocument = useCallback(
    async (documentId: string) => {
      if (documentId.startsWith('dstudio_')) {
        await hydrateFromStudioDocument(documentId)
        return
      }
      const doc = await fetchWorkbenchDocument(documentId)
      const nextState = editableStateFromTaskResult({
        engine: doc.engine || 'minimax_docx',
        skillId: 'web.document.generate',
        documentId: doc.documentId,
        artifactId: doc.artifactId || '',
        exportUrl: '',
        filename: '',
        document: doc.document,
        html: doc.html,
        documentArtifact: doc.documentArtifact,
      })
      setEditorState(nextState)
      const storedTaskType = doc.document.metadata?.taskType
      if (storedTaskType) {
        const template = getDocumentTaskTemplate(storedTaskType)
        if (template) setSelectedTemplate(template)
      }
      setViewMode('editor')
    },
    [hydrateFromStudioDocument],
  )

  useEffect(() => {
    if (bootstrapAttempted.current) return
    bootstrapAttempted.current = true

    const studioHandoff = consumePendingDocumentStudioOpen()
    if (studioHandoff) {
      void applyStudioOpenHandoff(studioHandoff)
      return
    }

    const urlDocId = readActiveDocumentIdFromUrl()
    const pending = consumePendingResourceOpen()
    const docId = pending?.kind === 'document-studio' ? pending.documentId : urlDocId

    if (docId) {
      void hydrateDocument(docId).catch((error) => {
        setStatusMessage(error instanceof Error ? error.message : '文稿加载失败')
        setStatusTone('err')
        setViewMode('welcome')
      })
      return
    }

    const intent = resolveDocumentStudioEntryIntent()
    if (intent.kind === 'doc') {
      void hydrateDocument(intent.documentId).catch(() => setViewMode('welcome'))
      return
    }

    const persisted = loadDocumentStudioDraft({ tempDraftId: tempDraftIdRef.current })
    if (persisted?.editorState?.html) {
      setEditorState(persisted.editorState)
      setTone(persisted.tone)
      const template = getDocumentTaskTemplate(persisted.taskTemplateId)
      if (template) setSelectedTemplate(template)
      if (hasDocumentStudioContent(persisted.editorState)) {
        setViewMode('editor')
      }
    }

    goToDocumentStudioHome()
    if (!persisted) setViewMode('welcome')
  }, [applyStudioOpenHandoff, hydrateDocument])

  const handleGoHome = useCallback(() => {
    setViewMode('welcome')
    setGenError(null)
    setBusy(false)
    setStatusMessage('')
    goToDocumentStudioHome()
    if (onBack) onBack()
  }, [onBack])

  const handleCreateBlank = useCallback(() => {
    tempDraftIdRef.current = createTempDraftId()
    setEditorState(createEmptyWorkbenchState())
    setChatMessages([])
    setViewMode('editor')
    setStatusMessage('已创建空白文稿，可直接在右侧编辑区开始写作')
    setStatusTone('ok')
  }, [])

  const handleGenerate = useCallback(async () => {
    const generationText = prompt.trim()
    if (!generationText) return
    if (!activeWorkspacePath) {
      setStatusMessage('请先打开工作区后再生成文稿')
      setStatusTone('err')
      return
    }

    const template = selectedTemplate || getDocumentTaskTemplate('work-report')!
    const mapped = resolveTaskTemplateGenerationParams(template)
    const toneInstruction = buildToneInstruction(tone)

    setViewMode('generating')
    setGenError(null)
    setGenProgress(5)
    setGenMessage('正在分析写作任务')
    setBusy(true)

    try {
      const readyFiles = attachments
        .filter((item) => item.status === 'ready' && item.fileRef)
        .map((item) => ({
          id: item.fileRef!,
          name: item.name,
          path: item.fileRef!,
          ext: item.name.includes('.') ? item.name.split('.').pop() || '' : '',
          size: item.size,
          updatedAt: new Date().toISOString(),
        }))
      const mergedRefs = [
        ...buildKnowledgeRefsFromSelection(
          knowledgeSourceIds,
          readyFiles,
          knowledgeSourceMapRef.current,
        ),
        ...buildAttachmentKnowledgeRefs(attachments),
      ]
      const seenRef = new Set<string>()
      const knowledgeRefs = mergedRefs.filter((ref) => {
        const key = `${ref.kind}:${ref.id}`
        if (seenRef.has(key)) return false
        seenRef.add(key)
        return true
      })
      const attachmentBlock = buildAttachmentPromptBlock(attachments)
      const fullPrompt = [generationText, toneInstruction, attachmentBlock].filter(Boolean).join('\n\n')

      const task = await startDocumentTask({
        workspacePath: activeWorkspacePath,
        prompt: fullPrompt,
        title: mapped.title,
        templateId: mapped.templateId,
        documentType: mapped.documentType,
        language: 'zh-CN',
        taskType: template.id,
        outline: template.outline,
        tone: toneInstruction,
        knowledgeRefs,
      })

      const result = await waitForDocumentTask(task.taskId, (state) => {
        setGenProgress(state.progress ?? 0)
        setGenMessage(state.message || '正在生成文稿')
      })

      const nextState = editableStateFromTaskResult(result)
      if (tempDraftIdRef.current) {
        migrateTempDraftToDocument(tempDraftIdRef.current, nextState.documentId!)
        tempDraftIdRef.current = createTempDraftId()
      }
      persistActiveDocumentId(nextState.documentId!)
      applyDocumentStudioUrl({ doc: nextState.documentId! })
      if (nextState.documentDraft) {
        nextState.documentDraft.metadata = {
          ...nextState.documentDraft.metadata,
          taskType: template.id,
          tone: toneInstruction,
        }
      }
      setEditorState(nextState)
      setChatMessages([
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: `已根据「${template.name}」生成文稿初稿，你可以在右侧直接编辑，或通过左侧提出修改要求。`,
        },
      ])
      setViewMode('editor')
      setStatusMessage('文稿已生成，可继续编辑或导出')
      setStatusTone('ok')
    } catch (error) {
      const message = error instanceof Error ? error.message : '文稿生成失败'
      setGenError(message)
      setGenMessage(message)
    } finally {
      setBusy(false)
    }
  }, [activeWorkspacePath, attachments, knowledgeSourceIds, prompt, selectedTemplate, tone])

  const getLatestHtml = useCallback(() => {
    return stripTransientAiMarkup(editorState.html)
  }, [editorState.html])

  const handleExportDocx = useCallback(async () => {
    const latestHtml = getLatestHtml()
    const latestState = updateEditableStateFromHtml(editorState, latestHtml)
    setBusy(true)
    try {
      if (latestState.documentId) {
        const exported = await exportDocumentArtifact({
          documentId: latestState.documentId,
          format: 'docx',
          title: latestState.title,
          html: latestState.html,
          documentDraft: latestState.documentDraft,
          outline: latestState.outline,
        })
        await platformApi.artifacts.download(exported.artifactId, exported.filename)
        setEditorState({ ...latestState, dirty: false, artifactId: exported.artifactId })
        setStatusMessage('Word 已导出，内容为当前编辑版本')
        setStatusTone('ok')
        return
      }
      setStatusMessage('请先生成文稿后再导出 Word')
      setStatusTone('err')
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Word 导出失败')
      setStatusTone('err')
    } finally {
      setBusy(false)
    }
  }, [editorState, getLatestHtml])

  const handleSave = useCallback(async () => {
    const latestHtml = getLatestHtml()
    const latestState = updateEditableStateFromHtml(editorState, latestHtml)
    if (!latestState.documentId) {
      setStatusMessage('请先生成文稿后再保存到服务端')
      setStatusTone('err')
      return
    }
    if (!latestState.documentDraft) {
      setStatusMessage('文稿数据不完整，无法保存')
      setStatusTone('err')
      return
    }

    setBusy(true)
    try {
      const draft = {
        ...latestState.documentDraft,
        title: latestState.title,
        metadata: {
          ...latestState.documentDraft.metadata,
          taskType: selectedTemplate?.id || latestState.documentDraft.metadata.taskType,
          tone: buildToneInstruction(tone),
        },
      }
      const saved = await saveEditableDocument({
        documentId: latestState.documentId,
        title: latestState.title,
        html: latestState.html,
        documentDraft: draft,
        outline: latestState.outline,
        taskType: selectedTemplate?.id,
        tone: buildToneInstruction(tone),
      })
      const savedState = {
        ...latestState,
        dirty: false,
        lastSavedAt: saved.savedAt,
        documentDraft: saved.document || draft,
        html: saved.html || latestState.html,
      }
      setEditorState(savedState)
      persistActiveDocumentId(latestState.documentId)
      applyDocumentStudioUrl({ doc: latestState.documentId })
      setStatusMessage(`已保存（${new Date(saved.savedAt).toLocaleString('zh-CN')}）`)
      setStatusTone('ok')
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : '保存失败')
      setStatusTone('err')
    } finally {
      setBusy(false)
    }
  }, [editorState, getLatestHtml, selectedTemplate?.id, tone])

  const handleExportHtml = useCallback(() => {
    const latestHtml = getLatestHtml()
    const filename = `${(editorState.title || '文稿').replace(/[/\\?%*:|"<>]/g, '-')}.html`
    const fullDoc = buildDownloadableHtmlDocument(editorState.title || '文稿', latestHtml)
    downloadHtmlFile(filename, fullDoc)
    setStatusMessage('HTML 已下载')
    setStatusTone('ok')
  }, [editorState.title, getLatestHtml])

  const applyAiText = useCallback(
    (mode: 'replace' | 'insert', preview: AiPreviewState) => {
      const latestHtml = getLatestHtml()
      let nextHtml = latestHtml

      if (mode === 'replace' && preview.selectedText) {
        const applied = latestHtml.includes(preview.selectedText)
          ? latestHtml.replace(preview.selectedText, preview.text)
          : latestHtml
        nextHtml = applied
      } else if (mode === 'insert') {
        const insertHtml = plainTextToDocumentBodyHtml(preview.text)
        const sectionEnd = latestHtml.lastIndexOf('</section>')
        if (sectionEnd >= 0) {
          nextHtml = `${latestHtml.slice(0, sectionEnd)}\n${insertHtml}\n${latestHtml.slice(sectionEnd)}`
        } else {
          nextHtml = `${latestHtml}\n${insertHtml}`
        }
      }

      setEditorState({
        ...updateEditableStateFromHtml(editorState, nextHtml),
        dirty: true,
      })
      setAiPreview(null)
    },
    [editorState, getLatestHtml],
  )

  const runAiInstruction = useCallback(
    async (instruction: string, options?: { selectedText?: string }) => {
      const selectedText = (options?.selectedText || editorState.selectedText || '').trim()
      if (!selectedText) {
        setStatusMessage('请先选中需要修改的文字')
        setStatusTone('err')
        return
      }

      setBusy(true)
      try {
        const response = editorState.documentId
          ? await editDocumentSelection({
              documentId: editorState.documentId,
              instruction,
              selectedText,
              selectionContext: {
                documentTitle: editorState.title,
                sectionId: editorState.selectedSectionId || undefined,
              },
              document: editorState.documentDraft!,
              html: editorState.html,
            })
          : await editDocumentText({
              instruction,
              selectedText,
              selectionContext: { documentTitle: editorState.title },
            })

        setAiPreview({
          text: response.updatedText,
          instruction,
          selectedText,
        })
      } catch (error) {
        setStatusMessage(error instanceof Error ? error.message : 'AI 修改失败')
        setStatusTone('err')
      } finally {
        setBusy(false)
      }
    },
    [editorState],
  )

  const handleChatSend = useCallback(
    async (instruction: string) => {
      const userMsg: StudioChatMessage = { id: `u-${Date.now()}`, role: 'user', text: instruction }
      setChatMessages((prev) => [...prev, userMsg])
      setBusy(true)

      try {
        if (editorState.selectedText.trim()) {
          await runAiInstruction(instruction, { selectedText: editorState.selectedText })
          setChatMessages((prev) => [
            ...prev,
            { id: `a-${Date.now()}`, role: 'assistant', text: '已生成修改预览，请确认是否替换或插入。' },
          ])
          return
        }

        if (!activeWorkspacePath) {
          throw new Error('请先打开工作区')
        }

        const template = selectedTemplate || getDocumentTaskTemplate('work-report')!
        const mapped = resolveTaskTemplateGenerationParams(template)
        const task = await startDocumentTask({
          workspacePath: activeWorkspacePath,
          prompt: `当前文稿标题：${editorState.title}\n修改要求：${instruction}\n请根据要求重新整理并输出完整文稿。`,
          title: editorState.title || mapped.title,
          templateId: mapped.templateId,
          documentType: mapped.documentType,
          language: 'zh-CN',
          taskType: template.id,
          outline: template.outline,
          tone: buildToneInstruction(tone),
        })
        const result = await waitForDocumentTask(task.taskId)
        setEditorState(editableStateFromTaskResult(result))
        setChatMessages((prev) => [
          ...prev,
          { id: `a-${Date.now()}`, role: 'assistant', text: '已根据你的要求重新生成文稿。' },
        ])
        setStatusMessage('文稿已更新')
        setStatusTone('ok')
      } catch (error) {
        const message = error instanceof Error ? error.message : '修改失败'
        setChatMessages((prev) => [...prev, { id: `e-${Date.now()}`, role: 'assistant', text: message }])
        setStatusMessage(message)
        setStatusTone('err')
      } finally {
        setBusy(false)
      }
    },
    [activeWorkspacePath, editorState, runAiInstruction, selectedTemplate, tone],
  )

  return (
    <Shell>
      {viewMode === 'welcome' ? (
        <DocumentStudioWelcomeView
          prompt={prompt}
          tone={tone}
          selectedTemplate={selectedTemplate}
          busy={busy}
          knowledgeLabels={knowledgeLabels}
          attachments={attachments}
          onPromptChange={setPrompt}
          onToneChange={setTone}
          onSelectTemplate={setSelectedTemplate}
          onCreateBlank={handleCreateBlank}
          onSubmit={() => void handleGenerate()}
          onOpenKnowledgePicker={() => setKbPickerOpen(true)}
          onClearKnowledge={() => {
            setKnowledgeSourceIds([])
            setKnowledgeLabels([])
          }}
          onRemoveKnowledge={(label) => {
            const id = [...knowledgeSourceMapRef.current.entries()].find(([, s]) => s.title === label)?.[0]
            if (!id) {
              setKnowledgeLabels((prev) => prev.filter((item) => item !== label))
              return
            }
            setKnowledgeSourceIds((prev) => prev.filter((item) => item !== id))
            setKnowledgeLabels((prev) => prev.filter((item) => item !== label))
          }}
          onUploadMaterials={(files) => void handleUploadMaterials(files)}
          onRemoveAttachment={(id) => setAttachments((prev) => prev.filter((item) => item.id !== id))}
        />
      ) : null}

      {viewMode === 'generating' ? (
        <DocumentStudioGeneratingView
          progress={genProgress}
          message={genMessage}
          error={genError}
          onCancel={() => {
            setViewMode('welcome')
            setGenError(null)
          }}
        />
      ) : null}

      {viewMode === 'editor' ? (
        <DocumentStudioEditorView
          editorState={editorState}
          taskTemplate={selectedTemplate}
          messages={chatMessages}
          busy={busy}
          statusMessage={statusMessage}
          statusTone={statusTone}
          onGoHome={handleGoHome}
          onSave={() => void handleSave()}
          onEditorStateChange={setEditorState}
          onExportDocx={() => void handleExportDocx()}
          onExportHtml={handleExportHtml}
          onAiInstruction={runAiInstruction}
          onSendChat={(text) => void handleChatSend(text)}
        />
      ) : null}

      {kbPickerOpen ? (
        <DocumentKnowledgeSourcePicker
          sources={knowledgeSources}
          selectedIds={knowledgeSourceIds}
          loading={knowledgeSourcesLoading}
          onApply={handleKbApply}
          onClose={() => setKbPickerOpen(false)}
        />
      ) : null}

      {aiPreview ? (
        <DocumentStudioTextPreviewModal
          text={aiPreview.text}
          busy={busy}
          onReplace={() => applyAiText('replace', aiPreview)}
          onInsertBelow={() => applyAiText('insert', aiPreview)}
          onRegenerate={() => void runAiInstruction(aiPreview.instruction, { selectedText: aiPreview.selectedText })}
          onCancel={() => setAiPreview(null)}
        />
      ) : null}
    </Shell>
  )
}
