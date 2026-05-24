/**
 * useDocumentPatchActions — shared patch/undo logic for AICommandBox and DocumentContextMenu
 */
import { useCallback, useState } from 'react'
import {
  applyWebDocumentPatch,
  patchResultMessage,
} from '../services/documentEditSkills'
import type { DocumentTypePresetPayload } from '../services/documentEditSkills'
import type { A4EditorHandle } from '../components/A4RichTextEditor'
import type { WebDocumentSkillManifest } from '../webDocumentSkillTypes'
import type { WebDocumentSession } from '../webDocumentTypes'
import type { DocumentEditMode, WebDocumentPatch } from '../webDocumentPatchTypes'
import { runDocumentSkill } from '../services/documentSkillAdapter'

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
  captureUndoSnapshot: () => void
  applyPatchWithUndo: (patch: WebDocumentPatch, statusOverride?: string) => void
  undoLastPatch: () => void
  runAiEditAction: (
    instruction: string,
    mode: DocumentEditMode,
    statusWhileRunning?: string,
  ) => Promise<boolean>
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

  const toPatch = useCallback((value: unknown): WebDocumentPatch | null => {
    if (!value || typeof value !== 'object') return null
    const record = value as Record<string, unknown>
    const type = record.type
    if (typeof type !== 'string') return null
    if (type === 'replace_document' && typeof record.html === 'string') {
      return {
        type: 'replace_document',
        html: record.html,
        markdown: typeof record.markdown === 'string' ? record.markdown : undefined,
      }
    }
    if (type === 'replace_selection' && typeof record.html === 'string') {
      return {
        type: 'replace_selection',
        html: record.html,
        markdown: typeof record.markdown === 'string' ? record.markdown : undefined,
      }
    }
    if (type === 'insert_at_cursor' && typeof record.html === 'string') {
      return {
        type: 'insert_at_cursor',
        html: record.html,
        markdown: typeof record.markdown === 'string' ? record.markdown : undefined,
      }
    }
    if (type === 'append_section' && typeof record.html === 'string') {
      return {
        type: 'append_section',
        title: typeof record.title === 'string' ? record.title : undefined,
        html: record.html,
        markdown: typeof record.markdown === 'string' ? record.markdown : undefined,
      }
    }
    return null
  }, [])

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

  const captureUndoSnapshot = useCallback(() => {
    const html = editorRef.current?.getHtml()
    if (typeof html === 'string') {
      setUndoHtml(html)
    }
  }, [editorRef])

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
    ): Promise<boolean> => {
      const ed = editorRef.current
      if (!workspacePath) {
        const msg = '请先打开工作区'
        setLastMessage(msg)
        setLastMessageTone('err')
        onStatus?.(msg, 'err')
        return false
      }

      setRunning(true)
      setLastMessage(statusWhileRunning)
      setLastMessageTone(undefined)

      try {
        const output = await runDocumentSkill({
          instruction,
          currentHtml: ed?.getHtml() ?? '',
          currentText: ed?.getText() ?? '',
          selectedText: ed?.getSelectionText(),
          workflowId: documentTypePreset?.id || 'general',
          knowledgeBaseIds,
          fileIds,
          workspacePath,
        }, {
          operation: 'edit',
          editMode: mode,
          title,
          documentTypePreset: documentTypePreset ?? undefined,
          templateSkillId: template.id,
          templateManifest: template as unknown as Record<string, unknown>,
        })
        const patch = output.mode === 'replace_document'
          ? {
            type: 'replace_document',
            html: output.html ?? '',
            markdown: output.markdown,
          } satisfies WebDocumentPatch
          : toPatch(output.patch)
        if (!patch) {
          const msg = '未返回文稿补丁'
          setLastMessage(msg)
          setLastMessageTone('err')
          onStatus?.(msg, 'err')
          return false
        }
        applyPatchWithUndo(patch, output.message ?? patchResultMessage(patch))
        return true
      } catch (e) {
        const msg = e instanceof Error ? e.message : '编辑失败'
        setLastMessage(msg)
        setLastMessageTone('err')
        onStatus?.(msg, 'err')
        return false
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
      toPatch,
    ],
  )

  return {
    running,
    canUndo: Boolean(undoHtml),
    lastMessage,
    lastMessageTone,
    captureUndoSnapshot,
    applyPatchWithUndo,
    undoLastPatch,
    runAiEditAction,
  }
}
