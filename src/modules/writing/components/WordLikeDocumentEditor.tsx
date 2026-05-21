/**
 * WordLikeDocumentEditor — Web 类 Word AI 文稿编辑器
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import { Download, FileUp, BookOpen } from 'lucide-react'
import type { Editor } from '@tiptap/react'
import { useWorkspace } from '../../../contexts/WorkspaceContext'
import { useDocumentWorkspaceKnowledge } from '../../../contexts/DocumentWorkspaceContext'
import { useDepartment } from '../../../contexts/DepartmentContext'
import { KnowledgeTreePicker } from '../../../components/knowledge/KnowledgeTreePicker'
import { platformApi } from '../../../platform'
import type { FileEntry } from '../../../platform'
import {
  artifactDownloadFilename,
  artifactHasExport,
} from '../../../utils/artifactDisplay'
import { useWebDocumentSkills } from '../useWebDocumentSkills'
import { getBuiltinDocumentSkill } from '../webDocumentBuiltInSkills'
import {
  applyTemplateManifestToSession,
  exportFormatFromManifest,
  runWebDocumentExport,
  webDocxSuccessMessage,
} from '../services/docxWebGeneration'
import {
  createEmptyWebDocumentSession,
  recordExportArtifact,
  type WebDocumentSession,
} from '../webDocumentTypes'
import { A4RichTextEditor, type A4EditorHandle } from './A4RichTextEditor'
import { AICommandBox } from './AICommandBox'

const Shell = styled.div`
  flex: 1;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: #e2e8f0;
`

const TopBar = styled.div`
  flex-shrink: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #1e293b;
  color: #f1f5f9;
  border-bottom: 1px solid #0f172a;
`

const TopField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 110px;
`

const TopLabel = styled.span`
  font-size: 10px;
  opacity: 0.7;
  letter-spacing: 0.04em;
`

const TopInput = styled.input`
  height: 30px;
  padding: 0 8px;
  border-radius: 6px;
  border: 1px solid #475569;
  background: #334155;
  color: #fff;
  font-size: 13px;
  min-width: 140px;
`

const TopSelect = styled.select`
  height: 30px;
  padding: 0 8px;
  border-radius: 6px;
  border: 1px solid #475569;
  background: #334155;
  color: #fff;
  font-size: 12px;
  max-width: 160px;
`

const TopBtn = styled.button`
  height: 30px;
  padding: 0 10px;
  border-radius: 6px;
  border: 1px solid #64748b;
  background: #334155;
  color: #f8fafc;
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

const FormatBtn = styled.button<{ $active?: boolean }>`
  height: 30px;
  min-width: 36px;
  padding: 0 8px;
  border-radius: 6px;
  border: 1px solid ${(p) => (p.$active ? '#3b82f6' : '#64748b')};
  background: ${(p) => (p.$active ? '#1d4ed8' : '#334155')};
  color: #f8fafc;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
`

const Body = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  overflow: hidden;
`

const EditorColumn = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
`

const AiSidebar = styled.aside`
  flex-shrink: 0;
  width: min(360px, 38vw);
  min-width: 280px;
  border-left: 1px solid #cbd5e1;
  background: #f8fafc;
  padding: 14px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
`

const AiTitle = styled.h3`
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
`

const ChipRow = styled.div`
  flex-shrink: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 12px 0;
  font-size: 11px;
`

const Chip = styled.span`
  padding: 2px 8px;
  background: #e2e8f0;
  border-radius: 999px;
  color: #475569;
`

const StatusBanner = styled.div<{ $tone?: 'ok' | 'err' }>`
  flex-shrink: 0;
  padding: 6px 14px;
  font-size: 12px;
  color: ${(p) => (p.$tone === 'err' ? '#b91c1c' : p.$tone === 'ok' ? '#15803d' : '#475569')};
  background: #f1f5f9;
`

const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
`

const ModalCard = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  max-width: 420px;
  width: 90%;
`

function DocumentFormatToolbar({
  editor,
  onFormatChange,
}: {
  editor: Editor | null
  onFormatChange: () => void
}) {
  if (!editor) return null
  const run = (fn: () => void) => {
    fn()
    onFormatChange()
  }
  return (
    <>
      <FormatBtn
        type="button"
        $active={editor.isActive('heading', { level: 1 })}
        onClick={() => run(() => editor.chain().focus().toggleHeading({ level: 1 }).run())}
      >
        标题
      </FormatBtn>
      <FormatBtn
        type="button"
        $active={editor.isActive('heading', { level: 2 })}
        onClick={() => run(() => editor.chain().focus().toggleHeading({ level: 2 }).run())}
      >
        小标题
      </FormatBtn>
      <FormatBtn
        type="button"
        $active={editor.isActive('paragraph')}
        onClick={() => run(() => editor.chain().focus().setParagraph().run())}
      >
        正文
      </FormatBtn>
      <FormatBtn
        type="button"
        $active={editor.isActive('bold')}
        onClick={() => run(() => editor.chain().focus().toggleBold().run())}
      >
        加粗
      </FormatBtn>
      <FormatBtn
        type="button"
        $active={editor.isActive('bulletList')}
        onClick={() => run(() => editor.chain().focus().toggleBulletList().run())}
      >
        列表
      </FormatBtn>
      <FormatBtn type="button" onClick={() => run(() => editor.chain().focus().clearNodes().unsetAllMarks().run())}>
        清除格式
      </FormatBtn>
    </>
  )
}

export default function WordLikeDocumentEditor() {
  const { activeWorkspacePath } = useWorkspace()
  const { workspaceKbIds, setWorkspaceKbIds } = useDocumentWorkspaceKnowledge()
  const { departments, loading: deptLoading } = useDepartment()
  const skills = useWebDocumentSkills()

  const [session, setSession] = useState<WebDocumentSession>(() => createEmptyWebDocumentSession())
  const [title, setTitle] = useState(session.title)
  const [templateId, setTemplateId] = useState(session.templateSkillId)
  const [status, setStatus] = useState('')
  const [statusTone, setStatusTone] = useState<'ok' | 'err' | undefined>()
  const [exportBusy, setExportBusy] = useState(false)
  const [kbPickerOpen, setKbPickerOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<FileEntry[]>([])
  const [formatTick, setFormatTick] = useState(0)
  const editorRef = useRef<A4EditorHandle>(null)

  const template = useMemo(
    () => skills.templateSkills.find((s) => s.id === templateId)
      ?? getBuiltinDocumentSkill(templateId),
    [templateId, skills.templateSkills],
  )

  useEffect(() => {
    if (!template) return
    setSession((prev) => applyTemplateManifestToSession(prev, template))
  }, [template, templateId])

  useEffect(() => {
    setSession((prev) => (prev.title === title ? prev : { ...prev, title, updatedAt: new Date().toISOString() }))
  }, [title])

  useEffect(() => {
    setSession((prev) => {
      if (
        prev.knowledgeBaseIds.length === workspaceKbIds.length
        && prev.knowledgeBaseIds.every((id, i) => id === workspaceKbIds[i])
      ) {
        return prev
      }
      return { ...prev, knowledgeBaseIds: workspaceKbIds, updatedAt: new Date().toISOString() }
    })
  }, [workspaceKbIds])

  const refreshUploadedFiles = useCallback(async () => {
    try {
      const list = await platformApi.files.list()
      setUploadedFiles(list.filter((f) => session.fileIds.includes(f.id)))
    } catch {
      setUploadedFiles([])
    }
  }, [session.fileIds])

  useEffect(() => {
    void refreshUploadedFiles()
  }, [refreshUploadedFiles])

  const syncHtmlFromEditor = useCallback((): string => {
    const html = editorRef.current?.getHtml() ?? session.html
    setSession((prev) => ({
      ...prev,
      title,
      html,
      updatedAt: new Date().toISOString(),
    }))
    return html
  }, [title, session.html])

  const tipTapEditor = editorRef.current?.getTipTapEditor() ?? null
  void formatTick

  const handleExport = async (exporterId: string) => {
    if (!activeWorkspacePath || !template) return
    const exporter = skills.exporterSkills.find((s) => s.id === exporterId)
      ?? getBuiltinDocumentSkill(exporterId)
    if (!exporter) return

    setExportBusy(true)
    setStatus(`正在导出（${exporter.name}）…`)
    setStatusTone(undefined)
    const html = syncHtmlFromEditor()
    const exportSession = { ...session, title, html }

    try {
      const result = await runWebDocumentExport(exporter, activeWorkspacePath, exportSession, html)
      if (!result.success) {
        const err = result.error || '导出失败'
        setStatus(
          exporterId === 'document.export.pdf' && /未配置|not configured/i.test(err)
            ? 'PDF 导出服务未配置，请先下载 Word。'
            : err,
        )
        setStatusTone('err')
        return
      }
      if (result.artifact?.id) {
        const fmt = exportFormatFromManifest(exporter)
        setSession((prev) => recordExportArtifact({ ...prev, title, html }, fmt, result.artifact!.id))
        setStatus(webDocxSuccessMessage(result.artifact))
        setStatusTone('ok')
      }
    } catch (e) {
      setStatus(e instanceof Error ? e.message : '导出失败')
      setStatusTone('err')
    } finally {
      setExportBusy(false)
    }
  }

  const handleDownloadLast = async () => {
    const id =
      session.artifacts.docxArtifactId
      ?? session.artifacts.markdownArtifactId
      ?? session.artifacts.pdfArtifactId
    if (!id) return
    try {
      const list = await platformApi.artifacts.list()
      const artifact = list.find((a) => a.id === id)
      if (!artifact || !artifactHasExport(artifact)) {
        setStatus('暂无可下载文件')
        setStatusTone('err')
        return
      }
      await platformApi.artifacts.download(id, artifactDownloadFilename(artifact)!)
      setStatus('已下载')
      setStatusTone('ok')
    } catch (e) {
      setStatus(e instanceof Error ? e.message : '下载失败')
      setStatusTone('err')
    }
  }

  const confirmImportAsReference = async () => {
    if (!pendingImportFile) return
    setImportModalOpen(false)
    setStatus('正在上传资料…')
    try {
      const entry = await platformApi.files.upload(pendingImportFile)
      setSession((prev) => ({
        ...prev,
        fileIds: [...new Set([...prev.fileIds, entry.id])],
        updatedAt: new Date().toISOString(),
      }))
      setStatus(`已添加资料：${entry.name}`)
      setStatusTone('ok')
      setPendingImportFile(null)
      void refreshUploadedFiles()
    } catch (e) {
      setStatus(e instanceof Error ? e.message : '上传失败')
      setStatusTone('err')
    }
  }

  if (!template) {
    return (
      <Shell data-testid="word-like-document-editor">
        <StatusBanner $tone="err">模板技能未加载</StatusBanner>
      </Shell>
    )
  }

  const hasArtifact = Boolean(
    session.artifacts.docxArtifactId
    || session.artifacts.pdfArtifactId
    || session.artifacts.markdownArtifactId,
  )

  return (
    <Shell data-testid="word-like-document-editor">
      <TopBar>
        <TopField style={{ flex: 1, minWidth: 160 }}>
          <TopLabel>文稿标题</TopLabel>
          <TopInput value={title} onChange={(e) => setTitle(e.target.value)} />
        </TopField>
        <TopField>
          <TopLabel>模板</TopLabel>
          <TopSelect value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
            {skills.templateSkills.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </TopSelect>
        </TopField>
        <DocumentFormatToolbar editor={tipTapEditor} onFormatChange={() => setFormatTick((n) => n + 1)} />
        <TopBtn type="button" onClick={() => setKbPickerOpen(true)}>
          <BookOpen size={14} /> 知识库 ({workspaceKbIds.length})
        </TopBtn>
        <TopBtn
          type="button"
          onClick={() => {
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = '.docx,.pdf'
            input.onchange = () => {
              const f = input.files?.[0]
              if (f) {
                setPendingImportFile(f)
                setImportModalOpen(true)
              }
            }
            input.click()
          }}
        >
          <FileUp size={14} /> 资料
        </TopBtn>
        <TopBtn type="button" disabled={exportBusy} onClick={() => void handleExport('document.export.docx')}>
          <Download size={14} /> Word
        </TopBtn>
        <TopBtn type="button" disabled={exportBusy} onClick={() => void handleExport('document.export.pdf')}>
          PDF
        </TopBtn>
        <TopBtn type="button" disabled={exportBusy} onClick={() => void handleExport('document.export.markdown')}>
          MD
        </TopBtn>
        {hasArtifact ? (
          <TopBtn type="button" onClick={() => void handleDownloadLast()}>下载最近</TopBtn>
        ) : null}
      </TopBar>

      {(uploadedFiles.length > 0 || workspaceKbIds.length > 0) && (
        <ChipRow>
          {workspaceKbIds.map((id) => (
            <Chip key={id}>KB: {departments.find((d) => d.id === id)?.name ?? id}</Chip>
          ))}
          {uploadedFiles.map((f) => (
            <Chip key={f.id}>{f.name}</Chip>
          ))}
        </ChipRow>
      )}

      <Body>
        <EditorColumn>
          <A4RichTextEditor
            ref={editorRef}
            initialHtml={session.html}
            pageSpec={session.pageSpec}
            headerFooter={session.headerFooter}
            onChange={(html) => {
              setSession((prev) => ({
                ...prev,
                html,
                updatedAt: new Date().toISOString(),
              }))
            }}
          />
        </EditorColumn>

        <AiSidebar>
          <AiTitle>AI 文稿助手</AiTitle>
          <AICommandBox
            editorRef={editorRef}
            workspacePath={activeWorkspacePath}
            title={title}
            template={template}
            knowledgeBaseIds={workspaceKbIds}
            fileIds={session.fileIds}
            session={session}
            onSessionUpdate={setSession}
            onStatus={(msg, tone) => {
              setStatus(msg)
              setStatusTone(tone)
            }}
            disabled={exportBusy}
          />
        </AiSidebar>
      </Body>

      {status ? <StatusBanner $tone={statusTone}>{status}</StatusBanner> : null}

      {kbPickerOpen && (
        <KnowledgeTreePicker
          departments={departments}
          selectedIds={workspaceKbIds}
          loading={deptLoading}
          onApply={(ids) => {
            setWorkspaceKbIds(ids)
            setSession((prev) => ({
              ...prev,
              knowledgeBaseIds: ids,
              updatedAt: new Date().toISOString(),
            }))
            setKbPickerOpen(false)
          }}
          onClose={() => setKbPickerOpen(false)}
          title="选择文稿知识库"
        />
      )}

      {importModalOpen && pendingImportFile && (
        <ModalBackdrop onClick={() => setImportModalOpen(false)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>导入 {pendingImportFile.name}</h3>
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
              第一版仅支持作为参考资料上传，供 AI 生成与编辑引用。<br />
              Word 作为模板 / 可编辑文稿、PDF 版式背景：后续接入。
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <TopBtn type="button" onClick={() => void confirmImportAsReference()}>作为资料</TopBtn>
              <TopBtn type="button" onClick={() => setImportModalOpen(false)}>取消</TopBtn>
            </div>
          </ModalCard>
        </ModalBackdrop>
      )}
    </Shell>
  )
}
