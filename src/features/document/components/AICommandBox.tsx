/**
 * AICommandBox — Word-like 文稿 AI 指令区（含撤销）
 */
import React, { useCallback, useEffect, useState } from 'react'
import styled from 'styled-components'
import { Sparkles, Undo2 } from 'lucide-react'
import type { A4EditorHandle } from './A4RichTextEditor'
import {
  AI_MODE_HINT_LABELS,
  inferDocumentEditMode,
  patchResultMessage,
  resolveAiCommandModeHint,
  runDocumentGenerate,
} from '../services/documentEditSkills'
import { sessionFromSkillResult } from '../services/docxWebGeneration'
import type { WebDocumentSkillManifest } from '../webDocumentSkillTypes'
import type { WebDocumentSession } from '../webDocumentTypes'
import type { DocumentEditMode, WebDocumentPatch } from '../webDocumentPatchTypes'
import type { UseDocumentPatchActionsReturn } from '../hooks/useDocumentPatchActions'

const Panel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  min-height: 0;
`

const PromptArea = styled.textarea`
  width: 100%;
  min-height: 100px;
  flex: 1;
  box-sizing: border-box;
  padding: 10px 12px;
  border: 1px solid #c8d8e8;
  border-radius: 8px;
  font-size: 14px;
  resize: none;
  font-family: inherit;
`

const ModeHint = styled.div`
  font-size: 12px;
  color: #475569;
  padding: 8px 10px;
  background: #f1f5f9;
  border-radius: 8px;
  line-height: 1.45;
`

const BtnRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

const CmdBtn = styled.button<{ $primary?: boolean }>`
  height: 32px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid ${(p) => (p.$primary ? '#2563eb' : '#94a3b8')};
  background: ${(p) => (p.$primary ? '#2563eb' : '#fff')};
  color: ${(p) => (p.$primary ? '#fff' : '#334155')};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`

const ResultBox = styled.div<{ $tone?: 'ok' | 'err' }>`
  font-size: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  line-height: 1.45;
  background: ${(p) => (p.$tone === 'err' ? '#fef2f2' : '#ecfdf5')};
  color: ${(p) => (p.$tone === 'err' ? '#b91c1c' : '#166534')};
  border: 1px solid ${(p) => (p.$tone === 'err' ? '#fecaca' : '#bbf7d0')};
`

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
  disabled?: boolean
  generationMode?: 'default' | 'knowledge-template-document'
  templateDocument?: import('../services/documentEditSkills').TemplateDocumentPayload | null
  documentTypePreset?: import('../services/documentEditSkills').DocumentTypePresetPayload | null
  /** Shared patch/undo hook instance from parent (WordLikeDocumentEditor) */
  patchActions: UseDocumentPatchActionsReturn
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
  disabled,
  generationMode,
  templateDocument,
  documentTypePreset,
  patchActions,
}: AICommandBoxProps) {
  const [instruction, setInstruction] = useState('')
  const [busy, setBusy] = useState(false)
  const [modeHint, setModeHint] = useState('')
  const [resultMsg, setResultMsg] = useState('')
  const [resultTone, setResultTone] = useState<'ok' | 'err' | undefined>()

  const readEditor = () => editorRef.current

  const refreshModeHint = useCallback(() => {
    const ed = readEditor()
    const hint = resolveAiCommandModeHint(
      instruction,
      ed?.hasSelection() ?? false,
      ed?.isEmpty() ?? true,
    )
    setModeHint(AI_MODE_HINT_LABELS[hint])
  }, [instruction])

  useEffect(() => {
    refreshModeHint()
    const onSel = () => refreshModeHint()
    document.addEventListener('selectionchange', onSel)
    return () => document.removeEventListener('selectionchange', onSel)
  }, [refreshModeHint])

  const applyPatchWithUndo = (patch: WebDocumentPatch) => {
    patchActions.applyPatchWithUndo(patch)
    const msg = patchResultMessage(patch)
    setResultMsg(msg)
    setResultTone('ok')
  }

  const handleUndo = () => {
    patchActions.undoLastPatch()
    setResultMsg('已撤销上一次 AI 修改')
    setResultTone('ok')
  }

  const handleGenerateDraft = async (promptOverride?: string) => {
    const ed = readEditor()
    if (!workspacePath) {
      setResultMsg('请先打开工作区')
      setResultTone('err')
      onStatus?.('请先打开工作区', 'err')
      return
    }
    const prompt = (promptOverride ?? instruction).trim()
    if (!prompt) {
      setResultMsg('请输入生成要求')
      setResultTone('err')
      return
    }

    setBusy(true)
    setResultMsg('正在生成初稿…')
    setResultTone(undefined)
    try {
      const result = await runDocumentGenerate({
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
      })

      if (!result.success) {
        setResultMsg(result.error || '生成失败')
        setResultTone('err')
        onStatus?.(result.error || '生成失败', 'err')
        return
      }

      const patch = result.data?.patch
      if (patch) {
        applyPatchWithUndo(patch)
        setInstruction('')
        return
      }

      const next = sessionFromSkillResult(result, template, knowledgeBaseIds, fileIds)
      if (next?.html && ed) {
        patchActions.applyPatchWithUndo({ type: 'replace_document', html: next.html, markdown: next.markdown ?? undefined })
        onSessionUpdate(next)
        setResultMsg('初稿已生成')
        setResultTone('ok')
        setInstruction('')
        onStatus?.('初稿已生成', 'ok')
      } else {
        setResultMsg('生成完成但未返回正文')
        setResultTone('err')
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '生成失败'
      setResultMsg(msg)
      setResultTone('err')
      onStatus?.(msg, 'err')
    } finally {
      setBusy(false)
    }
  }

  const handleEdit = async (modeOverride?: DocumentEditMode) => {
    const ed = readEditor()
    if (!workspacePath) {
      setResultMsg('请先打开工作区')
      setResultTone('err')
      return
    }
    const cmd = instruction.trim()
    if (!cmd) {
      setResultMsg('请输入 AI 指令')
      setResultTone('err')
      return
    }

    const hasSelection = ed?.hasSelection() ?? false
    const isEmpty = ed?.isEmpty() ?? true
    const inferred = inferDocumentEditMode(cmd, hasSelection, isEmpty)

    if (inferred === 'generate') {
      await handleGenerateDraft(cmd)
      return
    }

    const mode = modeOverride ?? inferred

    setBusy(true)
    setResultMsg('AI 正在修改文稿…')
    setResultTone(undefined)
    try {
      await patchActions.runAiEditAction(cmd, mode)
      setInstruction('')
    } catch (e) {
      const msg = e instanceof Error ? e.message : '编辑失败'
      setResultMsg(msg)
      setResultTone('err')
      onStatus?.(msg, 'err')
    } finally {
      setBusy(false)
    }
  }

  const handlePolish = async () => {
    const ed = readEditor()
    if (!ed || ed.isEmpty()) {
      setResultMsg('正文为空，请先生成或输入内容')
      setResultTone('err')
      return
    }
    const cmd = instruction.trim() || '把全文整理成正式汇报语气，结构清晰。'
    if (!instruction.trim()) setInstruction(cmd)
    await handleEdit('polish_document')
  }

  return (
    <Panel data-testid="ai-command-box">
      <ModeHint>{modeHint || '输入指令后点击执行'}</ModeHint>
      <PromptArea
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        onBlur={refreshModeHint}
        placeholder="例如：把这段改得更正式；在这里补充下一步计划；帮我写一份销售业绩汇报"
        disabled={busy || disabled}
      />
      <BtnRow>
        <CmdBtn $primary type="button" disabled={busy || disabled} onClick={() => void handleEdit()}>
          <Sparkles size={14} />
          {busy ? '执行中…' : '执行 AI 修改'}
        </CmdBtn>
        <CmdBtn type="button" disabled={busy || disabled} onClick={() => void handleGenerateDraft()}>
          生成初稿
        </CmdBtn>
        <CmdBtn type="button" disabled={busy || disabled} onClick={() => void handlePolish()}>
          优化全文
        </CmdBtn>
        <CmdBtn type="button" disabled={!patchActions.canUndo || busy || disabled} onClick={handleUndo}>
          <Undo2 size={14} /> 撤销
        </CmdBtn>
      </BtnRow>
      {resultMsg ? (
        <ResultBox $tone={resultTone}>{resultMsg}</ResultBox>
      ) : null}
    </Panel>
  )
}
