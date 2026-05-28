import { useCallback, useRef, useState, type MouseEvent } from 'react'
import styled from 'styled-components'
import { ArrowLeft, Download, FileDown, Save } from 'lucide-react'
import {
  DocumentEditorCanvas,
  type DocumentEditorCanvasHandle,
} from '../../document/components/DocumentEditorCanvas'
import type { EditableDocumentState } from '../../document/services/documentWorkbenchApi'
import { updateEditableStateFromHtml } from '../services/workbenchState'
import DocumentStudioAiPanel, { type StudioChatMessage } from './DocumentStudioAiPanel'
import type { DocumentTaskTemplate } from '../services/documentTaskTemplates'

const Shell = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
`

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  height: 48px;
  border-bottom: 1px solid #e2e8f0;
  background: #fff;
  flex-shrink: 0;
`

const ToolBtn = styled.button`
  height: 34px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid #d4deea;
  background: #fff;
  color: #2c4b67;
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`

const TaskChip = styled.span`
  font-size: 12px;
  color: #64748b;
  margin-left: 4px;
  strong {
    color: #0f172a;
  }
`

const Spacer = styled.div`
  flex: 1;
`

const Body = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
`

const CanvasWrap = styled.div`
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
`

const StatusBar = styled.div<{ $tone?: 'err' | 'ok' }>`
  padding: 8px 16px;
  border-top: 1px solid #e2e8f0;
  background: #fff;
  font-size: 12px;
  color: ${({ $tone }) => ($tone === 'err' ? '#b91c1c' : $tone === 'ok' ? '#15803d' : '#64748b')};
`

const BLOCK_AI_ACTIONS: Array<{
  label: string
  instruction: string
  needsSelection: boolean
}> = [
  { label: '改正式', instruction: '请将选中内容改为更正式的行政办公语气，保持原意。', needsSelection: true },
  { label: '缩短', instruction: '请压缩选中内容，删除冗余，保留核心信息。', needsSelection: true },
  { label: '扩写', instruction: '请扩写选中内容，补充必要说明，不要编造事实。', needsSelection: true },
  { label: '润色', instruction: '请润色选中内容，使表达更流畅规范。', needsSelection: true },
]

interface Props {
  editorState: EditableDocumentState
  taskTemplate: DocumentTaskTemplate | null
  messages: StudioChatMessage[]
  busy?: boolean
  statusMessage?: string
  statusTone?: 'ok' | 'err'
  onGoHome: () => void
  onSave: () => void
  onEditorStateChange: (state: EditableDocumentState) => void
  onExportDocx: () => void
  onExportHtml: () => void
  onAiInstruction: (instruction: string, options?: { selectedText?: string }) => Promise<void>
  onSendChat: (instruction: string) => void
}

export default function DocumentStudioEditorView({
  editorState,
  taskTemplate,
  messages,
  busy,
  statusMessage,
  statusTone,
  onGoHome,
  onSave,
  onEditorStateChange,
  onExportDocx,
  onExportHtml,
  onAiInstruction,
  onSendChat,
}: Props) {
  const canvasRef = useRef<DocumentEditorCanvasHandle | null>(null)
  const [ctxMenu, setCtxMenu] = useState<{
    x: number
    y: number
    hasSelection: boolean
    selectedText?: string
  } | null>(null)
  const handleHtmlChange = useCallback(
    (html: string) => {
      onEditorStateChange({
        ...updateEditableStateFromHtml(editorState, html),
        dirty: true,
      })
    },
    [editorState, onEditorStateChange],
  )

  const handleSelectionChange = useCallback(
    (payload: {
      selectedSectionId: string | null
      selectedBlockId: string | null
      selectedBlockRole?: string
      selectedBlockText?: string
      selectedText: string
    }) => {
      onEditorStateChange({
        ...editorState,
        selectedSectionId: payload.selectedSectionId,
        selectedBlockId: payload.selectedBlockId,
        selectedBlockRole: payload.selectedBlockRole,
        selectedBlockText: payload.selectedBlockText,
        selectedText: payload.selectedText,
      })
    },
    [editorState, onEditorStateChange],
  )

  const handleContextMenu = useCallback(
    (event: MouseEvent) => {
      const selection = window.getSelection()
      const selectedText = selection?.toString().trim() || editorState.selectedText.trim()
      setCtxMenu({
        x: event.clientX,
        y: event.clientY,
        hasSelection: selectedText.length > 0,
        selectedText,
      })
    },
    [editorState.selectedText],
  )

  const runBlockAi = useCallback(
    async (instruction: string, selectedText?: string) => {
      const text = (selectedText || editorState.selectedText || '').trim()
      if (!text) return
      await onAiInstruction(instruction, { selectedText: text })
    },
    [editorState.selectedText, onAiInstruction],
  )

  return (
    <Shell>
      <Toolbar>
        <ToolBtn type="button" onClick={onGoHome}>
          <ArrowLeft size={14} />
          返回首页
        </ToolBtn>
        <TaskChip>
          当前任务：<strong>{taskTemplate?.name || '文稿'}</strong>
        </TaskChip>
        <Spacer />
        <ToolBtn type="button" disabled={busy} onClick={onSave}>
          <Save size={14} />
          保存
        </ToolBtn>
        <ToolBtn type="button" disabled={busy} onClick={onExportDocx}>
          <FileDown size={14} />
          导出 Word
        </ToolBtn>
        <ToolBtn type="button" disabled={busy} onClick={onExportHtml}>
          <Download size={14} />
          下载 HTML
        </ToolBtn>
      </Toolbar>

      <Body>
        <DocumentStudioAiPanel
          taskTemplate={taskTemplate}
          messages={messages}
          busy={busy}
          onSend={onSendChat}
        />

        <CanvasWrap>
          <DocumentEditorCanvas
            ref={canvasRef}
            compact
            state={editorState}
            modifiedSectionIds={[]}
            onContextMenu={handleContextMenu}
            onHtmlChange={handleHtmlChange}
            onSelectionChange={handleSelectionChange}
          />
        </CanvasWrap>
      </Body>

      {statusMessage ? <StatusBar $tone={statusTone}>{statusMessage}</StatusBar> : null}

      {ctxMenu ? (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
            onClick={() => setCtxMenu(null)}
          />
          <div
            style={{
              position: 'fixed',
              left: ctxMenu.x,
              top: ctxMenu.y,
              zIndex: 9999,
              minWidth: 168,
              padding: '4px 0',
              background: '#fff',
              border: '1px solid #d0dce9',
              borderRadius: 8,
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
              fontSize: 13,
            }}
          >
            {BLOCK_AI_ACTIONS.map((action) => (
              <button
                key={action.label}
                type="button"
                disabled={busy || (action.needsSelection && !ctxMenu.hasSelection)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px 14px',
                  border: 'none',
                  background: 'none',
                  textAlign: 'left',
                  cursor: action.needsSelection && !ctxMenu.hasSelection ? 'not-allowed' : 'pointer',
                  color: action.needsSelection && !ctxMenu.hasSelection ? '#b8c5d2' : '#2a4055',
                }}
                onClick={() => {
                  setCtxMenu(null)
                  void runBlockAi(action.instruction, ctxMenu.selectedText)
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        </>
      ) : null}

    </Shell>
  )
}
