import styled from 'styled-components'
import TiptapDocumentEditor, { type TiptapDocumentEditorHandle } from './TiptapDocumentEditor'
import DocumentOutlinePanel from './DocumentOutlinePanel'
import DocumentAiAssistantPanel from './DocumentAiAssistantPanel'
import DocumentStudioToolbar from './DocumentStudioToolbar'
import DocumentStudioStepIndicator from './DocumentStudioStepIndicator'
import type { OutlineHeading } from '../services/editorContentBridge'
import type { DocumentSelectionState } from '../hooks/useDocumentSelection'
import type { Editor } from '@tiptap/react'

const Workspace = styled.div`
  --studio-chrome-height: 120px;
  --studio-canvas-pad-y: 72px;
  --studio-paper-pad-y: 112px;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #e2e8f0;
`

const Main = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
`

const Canvas = styled.div`
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  background: #e8eef5;
  padding: 24px 0 48px;
`

const Paper = styled.div`
  width: 100%;
  max-width: 820px;
  margin: 0 auto;
  min-height: calc(100vh - var(--studio-chrome-height) - var(--studio-canvas-pad-y));
  height: auto;
  background: #fff;
  border-radius: 4px;
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.06),
    0 12px 40px rgba(15, 23, 42, 0.08);
  padding: 56px 72px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
`

const StateBox = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  text-align: center;
  min-height: calc(100vh - var(--studio-chrome-height) - var(--studio-canvas-pad-y) - var(--studio-paper-pad-y));
  box-sizing: border-box;
`

const StateTitle = styled.h3`
  margin: 0 0 8px;
  font-size: 18px;
  color: #0f172a;
`

const StateText = styled.p`
  margin: 0 0 20px;
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
  max-width: 360px;
`

const StateActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
`

const StateBtn = styled.button<{ $primary?: boolean }>`
  height: 38px;
  padding: 0 16px;
  border-radius: 8px;
  border: ${p => (p.$primary ? 'none' : '1px solid #cbd5e1')};
  background: ${p => (p.$primary ? '#2563eb' : '#fff')};
  color: ${p => (p.$primary ? '#fff' : '#334155')};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
`

const Spinner = styled.div`
  width: 36px;
  height: 36px;
  border: 3px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
  margin-bottom: 16px;
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`

interface Props {
  title: string
  onTitleChange: (title: string) => void
  editorRef: React.RefObject<TiptapDocumentEditorHandle | null>
  documentId: string | null
  contentVersion: string
  editorJson: Record<string, unknown> | null
  loading: boolean
  loadError: string | null
  outlineHeadings: OutlineHeading[]
  outlineOpen: boolean
  panelOpen: boolean
  onToggleOutline: () => void
  onTogglePanel: () => void
  selection: DocumentSelectionState | null
  patchLoading?: boolean
  patchError?: string | null
  lastTextResult?: string | null
  documentType?: string
  fullText?: string
  statusMsg?: string
  onBack: () => void
  onNewDocument: () => void
  onGoHome: () => void
  onFullDocumentHumanize?: () => void
  onSave: () => void
  onExport: (format: 'markdown' | 'html' | 'docx') => void
  onEditorChange: (json: Record<string, unknown>) => void
  onSelectionChange: (editor: Editor) => void
  onReload: () => void
  onRegenerate: () => void
  onBackToForm: () => void
  onRunCapability: (id: string, instruction?: string) => void
  onFreeformSend: (instruction: string) => void
  onInsertAiText: (text: string) => void
  onRegenerateAiResult: () => void
  onOutlineJump: (blockId: string) => void
}

export default function DocumentEditorWorkspace({
  title,
  onTitleChange,
  editorRef,
  documentId,
  contentVersion,
  editorJson,
  loading,
  loadError,
  outlineHeadings,
  outlineOpen,
  panelOpen,
  onToggleOutline,
  onTogglePanel,
  selection,
  patchLoading,
  patchError,
  lastTextResult,
  documentType,
  fullText,
  statusMsg,
  onBack,
  onNewDocument,
  onGoHome,
  onFullDocumentHumanize,
  onSave,
  onExport,
  onEditorChange,
  onSelectionChange,
  onReload,
  onRegenerate,
  onBackToForm,
  onRunCapability,
  onFreeformSend,
  onInsertAiText,
  onRegenerateAiResult,
  onOutlineJump,
}: Props) {
  const hasEditorContent = Boolean(documentId && editorJson && !loadError)
  const showBlockingLoader = loading && !hasEditorContent

  return (
    <Workspace>
      <DocumentStudioStepIndicator step="editor" />
      <DocumentStudioToolbar
        title={title}
        onTitleChange={onTitleChange}
        onBack={onBack}
        onNewDocument={onNewDocument}
        onGoHome={onGoHome}
        onFullDocumentHumanize={onFullDocumentHumanize}
        onSave={onSave}
        onExport={onExport}
        outlineOpen={outlineOpen}
        onToggleOutline={onToggleOutline}
        panelOpen={panelOpen}
        onTogglePanel={onTogglePanel}
        statusMsg={statusMsg}
      />
      <Main>
        <DocumentOutlinePanel headings={outlineHeadings} collapsed={!outlineOpen} onJump={onOutlineJump} />
        <Canvas>
          <Paper>
            {showBlockingLoader ? (
              <StateBox>
                <Spinner />
                <StateTitle>正在加载文稿…</StateTitle>
                <StateText>正在同步服务器上的正文，请稍候</StateText>
              </StateBox>
            ) : null}
            {!showBlockingLoader && loadError ? (
              <StateBox>
                <StateTitle>加载失败</StateTitle>
                <StateText>{loadError}</StateText>
                <StateActions>
                  <StateBtn type="button" $primary onClick={onNewDocument}>
                    新建文稿
                  </StateBtn>
                  <StateBtn type="button" onClick={onReload}>
                    重新加载
                  </StateBtn>
                  <StateBtn type="button" onClick={onBackToForm}>
                    返回填写需求
                  </StateBtn>
                </StateActions>
              </StateBox>
            ) : null}
            {!showBlockingLoader && !loadError && documentId && !editorJson ? (
              <StateBox>
                <StateTitle>文稿正文为空</StateTitle>
                <StateText>
                  {title
                    ? `「${title}」暂无正文内容。可新建文稿、重新加载，或返回需求页重新生成。`
                    : '当前文稿暂无正文内容。可新建文稿、重新加载，或返回需求页重新生成。'}
                </StateText>
                <StateActions>
                  <StateBtn type="button" $primary onClick={onNewDocument}>
                    新建文稿
                  </StateBtn>
                  <StateBtn type="button" onClick={onReload}>
                    重新加载
                  </StateBtn>
                  <StateBtn type="button" onClick={onBackToForm}>
                    返回填写需求
                  </StateBtn>
                  <StateBtn type="button" onClick={onRegenerate}>
                    重新生成
                  </StateBtn>
                </StateActions>
              </StateBox>
            ) : null}
            {hasEditorContent && editorJson ? (
              <TiptapDocumentEditor
                key={`${documentId}:${contentVersion}`}
                documentId={documentId}
                contentVersion={contentVersion}
                ref={editorRef}
                editorJson={editorJson}
                onChange={onEditorChange}
                onSelectionChange={onSelectionChange}
              />
            ) : null}
          </Paper>
        </Canvas>
        {panelOpen ? (
          <DocumentAiAssistantPanel
            documentId={documentId}
            documentType={documentType}
            title={title}
            fullText={fullText}
            hasSelection={Boolean(selection?.text)}
            selection={selection}
            loading={patchLoading}
            error={patchError}
            lastTextResult={lastTextResult}
            onRun={onRunCapability}
            onFreeformSend={onFreeformSend}
            onInsertText={onInsertAiText}
            onRegenerate={onRegenerateAiResult}
            onFullDocumentHumanize={onFullDocumentHumanize}
          />
        ) : null}
      </Main>
    </Workspace>
  )
}
