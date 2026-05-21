/**
 * AICommandBox — Web 文稿底部 AI 指令区
 */
import React, { useState } from 'react'
import styled from 'styled-components'
import { Sparkles } from 'lucide-react'
import type { A4RichEditorHandle } from './A4RichEditor'
import {
  applyWebDocumentPatch,
  inferDocumentEditMode,
  runDocumentEdit,
  runDocumentGenerate,
} from '../services/documentEditSkills'
import type { WebDocumentSkillManifest } from '../webDocumentSkillTypes'
import { sessionFromSkillResult } from '../services/docxWebGeneration'
import type { WebDocumentSession } from '../webDocumentTypes'
import type { WebDocumentPatch } from '../webDocumentPatchTypes'

const BottomBar = styled.div`
  flex-shrink: 0;
  border-top: 1px solid #d1dae6;
  background: #f8fafc;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const PromptArea = styled.textarea`
  width: 100%;
  min-height: 72px;
  box-sizing: border-box;
  padding: 10px 12px;
  border: 1px solid #c8d8e8;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
`

const BtnRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`

const CmdBtn = styled.button<{ $primary?: boolean }>`
  height: 32px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid ${(p) => (p.$primary ? '#2563eb' : '#94a3b8')};
  background: ${(p) => (p.$primary ? '#2563eb' : '#fff')};
  color: ${(p) => (p.$primary ? '#fff' : '#334155')};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`

const StatusLine = styled.div<{ $tone?: 'ok' | 'err' }>`
  font-size: 12px;
  color: ${(p) => (p.$tone === 'err' ? '#b91c1c' : p.$tone === 'ok' ? '#15803d' : '#475569')};
`

export interface AICommandBoxProps {
  editorRef: React.RefObject<A4RichEditorHandle | null>
  workspacePath: string | null
  title: string
  template: WebDocumentSkillManifest
  generatorId: string
  knowledgeBaseIds: string[]
  fileIds: string[]
  session: WebDocumentSession
  onSessionUpdate: (session: WebDocumentSession) => void
  onStatus: (message: string, tone?: 'ok' | 'err') => void
  disabled?: boolean
}

export function AICommandBox({
  editorRef,
  workspacePath,
  title,
  template,
  generatorId,
  knowledgeBaseIds,
  fileIds,
  session,
  onSessionUpdate,
  onStatus,
  disabled,
}: AICommandBoxProps) {
  const [instruction, setInstruction] = useState('')
  const [busy, setBusy] = useState(false)

  const readEditor = () => editorRef.current

  const applyPatchAndSync = (patch: WebDocumentPatch) => {
    const ed = readEditor()
    if (!ed) return
    applyWebDocumentPatch(ed, patch)
    const html = ed.getHtml()
    onSessionUpdate({
      ...session,
      title,
      content: { ...session.content, html, markdown: patch.markdown ?? session.content.markdown },
      updatedAt: new Date().toISOString(),
    })
  }

  const handleGenerateDraft = async (promptOverride?: string) => {
    const ed = readEditor()
    if (!workspacePath) {
      onStatus('请先打开工作区', 'err')
      return
    }
    const prompt = (promptOverride ?? instruction).trim()
    if (!prompt) {
      onStatus('请输入生成要求', 'err')
      return
    }

    setBusy(true)
    onStatus('正在生成初稿…')
    try {
      const result = await runDocumentGenerate({
        instruction: prompt,
        workspacePath,
        title,
        templateSkillId: template.id,
        templateManifest: template as unknown as Record<string, unknown>,
        knowledgeBaseIds,
        fileIds,
        currentDocumentText: ed?.getText() ?? '',
      })

      if (!result.success) {
        onStatus(result.error || '生成失败', 'err')
        return
      }

      const patch = result.data?.patch
      if (patch) {
        applyPatchAndSync(patch)
        onStatus('初稿已写入编辑区', 'ok')
        setInstruction('')
        return
      }

      const next = sessionFromSkillResult(result, template, generatorId, {
        knowledgeBaseIds,
        fileIds,
      })
      if (next?.content.html && ed) {
        ed.replaceDocument(next.content.html)
        onSessionUpdate(next)
        onStatus('初稿已生成', 'ok')
        setInstruction('')
      } else {
        onStatus('生成完成但未返回正文', 'err')
      }
    } catch (e) {
      onStatus(e instanceof Error ? e.message : '生成失败', 'err')
    } finally {
      setBusy(false)
    }
  }

  const handleEdit = async (modeOverride?: import('../webDocumentPatchTypes').DocumentEditMode) => {
    const ed = readEditor()
    if (!workspacePath) {
      onStatus('请先打开工作区', 'err')
      return
    }
    const cmd = instruction.trim()
    if (!cmd) {
      onStatus('请输入 AI 指令', 'err')
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
    onStatus('AI 正在修改文稿…')
    try {
      const result = await runDocumentEdit({
        instruction: cmd,
        mode,
        workspacePath,
        title,
        selectedText: ed?.getSelectionText(),
        selectedHtml: ed?.getSelectionHtml(),
        documentText: ed?.getText(),
        documentHtml: ed?.getHtml(),
        templateSkillId: template.id,
        knowledgeBaseIds,
        fileIds,
      })

      if (!result.success) {
        onStatus(result.error || '编辑失败', 'err')
        return
      }

      const patch = result.data?.patch
      if (!patch) {
        onStatus('未返回文稿补丁', 'err')
        return
      }

      applyPatchAndSync(patch)
      onStatus(
        patch.type === 'replace_selection'
          ? '已更新选中内容'
          : patch.type === 'insert_at_cursor'
            ? '已在光标处插入'
            : '已更新全文',
        'ok',
      )
      setInstruction('')
    } catch (e) {
      onStatus(e instanceof Error ? e.message : '编辑失败', 'err')
    } finally {
      setBusy(false)
    }
  }

  const handlePolish = async () => {
    const ed = readEditor()
    if (!workspacePath) {
      onStatus('请先打开工作区', 'err')
      return
    }
    if (!ed || ed.isEmpty()) {
      onStatus('正文为空，请先生成或输入内容', 'err')
      return
    }
    const cmd = instruction.trim() || '把全文整理成正式汇报语气，结构清晰。'
    setBusy(true)
    onStatus('正在优化全文…')
    try {
      const result = await runDocumentEdit({
        instruction: cmd,
        mode: 'polish_document',
        workspacePath,
        title,
        documentText: ed.getText(),
        documentHtml: ed.getHtml(),
        templateSkillId: template.id,
        knowledgeBaseIds,
        fileIds,
      })
      if (!result.success || !result.data?.patch) {
        onStatus(result.error || '优化失败', 'err')
        return
      }
      applyPatchAndSync(result.data.patch)
      onStatus('全文已优化', 'ok')
      setInstruction('')
    } catch (e) {
      onStatus(e instanceof Error ? e.message : '优化失败', 'err')
    } finally {
      setBusy(false)
    }
  }

  return (
    <BottomBar data-testid="ai-command-box">
      <PromptArea
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        placeholder="输入自然语言：改选中段落、在光标处补充、整理全文，或描述要生成的初稿…"
        disabled={busy || disabled}
      />
      <BtnRow>
        <CmdBtn
          $primary
          type="button"
          disabled={busy || disabled}
          onClick={() => void handleEdit()}
        >
          <Sparkles size={14} />
          {busy ? '执行中…' : '执行'}
        </CmdBtn>
        <CmdBtn
          type="button"
          disabled={busy || disabled}
          onClick={() => void handleGenerateDraft()}
        >
          生成初稿
        </CmdBtn>
        <CmdBtn type="button" disabled={busy || disabled} onClick={() => void handlePolish()}>
          优化当前文稿
        </CmdBtn>
      </BtnRow>
      <StatusLine>有选区时默认改写选区；正文为空时走生成；否则按指令插入或润色全文。</StatusLine>
    </BottomBar>
  )
}
