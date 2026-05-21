/**
 * useDocumentPatchActions — shared patch/undo logic for AICommandBox and DocumentContextMenu
 */
import { useCallback, useState } from 'react'
import {
  applyWebDocumentPatch,
  patchResultMessage,
  runDocumentEdit,
} from '../services/documentEditSkills'
import type { DocumentEditInput, DocumentTypePresetPayload } from '../services/documentEditSkills'
import type { A4EditorHandle } from '../components/A4RichTextEditor'
import type { WebDocumentSkillManifest } from '../webDocumentSkillTypes'
import type { WebDocumentSession } from '../webDocumentTypes'
import type { DocumentEditMode, WebDocumentPatch } from '../webDocumentPatchTypes'

export interface UseDocumentPatchActionsOptions {
  editorRef: React.RefObject<A4EditorHandle | null>
  session: WebDocumentSession
  workspacePath: string | null
  title: string
  template: WebDocumentSkillManifest
  knowledgeBaseIds: string[]
  fileIds: string[]
  documentTypePreset?: DocumentTypePresetPayload | null
  onSessionUpdate: (session: WebDocumentSession) => void
  onStatus?: (message: string, tone?: 'ok' | 'err') => void
}

export interface UseDocumentPatchActionsReturn {
  running: boolean
  canUndo: boolean
  lastMessage: string
  lastMessageTone: 'ok' | 'err' | undefined
  applyPatchWithUndo: (patch: WebDocumentPatch, statusOverride?: string) => void
  undoLastPatch: () => void
  runAiEditAction: (
    instruction: string,
    mode: DocumentEditMode,
    statusWhileRunning?: string,
  ) => Promise<void>
}

export function useDocumentPatchActions(
  opts: UseDocumentPatchActionsOptions,
): UseDocumentPatchActionsReturn {
  const {
    editorRef,
    session,
    workspacePath,
    title,
    template,
    knowledgeBaseIds,
    fileIds,
    documentTypePreset,
    onSessionUpdate,
    onStatus,
  } = opts

  const [running, setRunning] = useState(false)
  const [undoHtml, setUndoHtml] = useState<string | null>(null)
  const [lastMessage, setLastMessage] = useState('')
  const [lastMessageTone, setLastMessageTone] = useState<'ok' | 'err' | undefined>()

  const syncSessionHtml = useCallback(
    (html: string, markdown?: string) => {
      onSessionUpdate({
        ...session,
        title,
        html,
        markdown: markdown ?? session.markdown,
        updatedAt: new Date().toISOString(),
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session.id, session.markdown, title, onSessionUpdate],
  )

  const applyPatchWithUndo = useCallback(
    (patch: WebDocumentPatch, statusOverride?: string) => {
      const ed = editorRef.current
      if (!ed) return
      const prevHtml = ed.getHtml()
      setUndoHtml(prevHtml)
      applyWebDocumentPatch(ed, patch)
      const html = ed.getHtml()
      syncSessionHtml(html, patch.markdown)
      const msg = statusOverride ?? patchResultMessage(patch)
      setLastMessage(msg)
      setLastMessageTone('ok')
      onStatus?.(msg, 'ok')
    },
    [editorRef, syncSessionHtml, onStatus],
  )

  const undoLastPatch = useCallback(() => {
    if (!undoHtml) return
    const ed = editorRef.current
    if (!ed) return
    ed.replaceDocument(undoHtml)
    syncSessionHtml(undoHtml)
    setUndoHtml(null)
    setLastMessage('已撤销上一次 AI 修改')
    setLastMessageTone('ok')
    onStatus?.('已撤销', 'ok')
  }, [undoHtml, editorRef, syncSessionHtml, onStatus])

  const runAiEditAction = useCallback(
    async (
      instruction: string,
      mode: DocumentEditMode,
      statusWhileRunning = 'AI 正在修改文稿…',
    ) => {
      const ed = editorRef.current
      if (!workspacePath) {
        const msg = '请先打开工作区'
        setLastMessage(msg)
        setLastMessageTone('err')
        onStatus?.(msg, 'err')
        return
      }

      setRunning(true)
      setLastMessage(statusWhileRunning)
      setLastMessageTone(undefined)

      const editInput: DocumentEditInput = {
        instruction,
        mode,
        workspacePath,
        title,
        selectedText: ed?.getSelectionText(),
        selectedHtml: ed?.getSelectionHtml(),
        documentText: ed?.getText(),
        documentHtml: ed?.getHtml(),
        templateSkillId: template.id,
        templateManifest: template as unknown as Record<string, unknown>,
        knowledgeBaseIds,
        fileIds,
        documentTypePreset: documentTypePreset ?? undefined,
      }

      try {
        const result = await runDocumentEdit(editInput)
        if (!result.success) {
          const msg = result.error || '编辑失败'
          setLastMessage(msg)
          setLastMessageTone('err')
          onStatus?.(msg, 'err')
          return
        }
        const patch = result.data?.patch
        if (!patch) {
          const msg = '未返回文稿补丁'
          setLastMessage(msg)
          setLastMessageTone('err')
          onStatus?.(msg, 'err')
          return
        }
        applyPatchWithUndo(patch)
      } catch (e) {
        const msg = e instanceof Error ? e.message : '编辑失败'
        setLastMessage(msg)
        setLastMessageTone('err')
        onStatus?.(msg, 'err')
      } finally {
        setRunning(false)
      }
    },
    [
      editorRef,
      workspacePath,
      title,
      template,
      knowledgeBaseIds,
      fileIds,
      documentTypePreset,
      applyPatchWithUndo,
      onStatus,
    ],
  )

  return {
    running,
    canUndo: Boolean(undoHtml),
    lastMessage,
    lastMessageTone,
    applyPatchWithUndo,
    undoLastPatch,
    runAiEditAction,
  }
}
