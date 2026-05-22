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
  exportAndDownloadCurrentDocument,
  importDocxAsContent,
  type DocumentExportFormat,
} from '../services/docxWebGeneration'
import {
  createEmptyWebDocumentSession,
  normalizeWebDocumentSession,
  type WebDocumentSession,
} from '../webDocumentTypes'
import { A4RichTextEditor, type A4EditorHandle } from './A4RichTextEditor'
import { AICommandBox } from './AICommandBox'
import { DocumentContextMenu } from './DocumentContextMenu'
import { useDocumentPatchActions } from '../hooks/useDocumentPatchActions'
import {
  getWorkflowsByCategory,
  type DocumentWorkflowId,
} from '../workflows/documentWorkflowRegistry'

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

const SaveBadge = styled.div<{ $state: 'saved' | 'saving' | 'restored' | 'error' }>`
  height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: ${(p) => (
    p.$state === 'error' ? '#fecaca'
      : p.$state === 'saving' ? '#fde68a'
        : '#bbf7d0'
  )};
  background: ${(p) => (
    p.$state === 'error' ? '#7f1d1d'
      : p.$state === 'saving' ? '#78350f'
        : '#14532d'
  )};
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

type DraftSaveState = 'saved' | 'saving' | 'restored' | 'error'

function draftStorageKey(workspacePath: string | null): string | null {
  return workspacePath ? `web-document-draft:${workspacePath}` : null
}

function loadDraftSession(workspacePath: string | null): WebDocumentSession | null {
  const key = draftStorageKey(workspacePath)
  if (!key || typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(key)
  if (!raw) return null
  try {
    return normalizeWebDocumentSession(JSON.parse(raw))
  } catch {
    return null
  }
}

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
        $active={editor.isActive('heading', { level: 3 })}
        onClick={() => run(() => editor.chain().focus().toggleHeading({ level: 3 }).run())}
      >
        三级
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
        $active={editor.isActive('underline')}
        onClick={() => run(() => editor.chain().focus().toggleUnderline().run())}
      >
        下划线
      </FormatBtn>
      <FormatBtn
        type="button"
        $active={editor.isActive('bulletList')}
        onClick={() => run(() => editor.chain().focus().toggleBulletList().run())}
      >
        无序
      </FormatBtn>
      <FormatBtn
        type="button"
        $active={editor.isActive('orderedList')}
        onClick={() => run(() => editor.chain().focus().toggleOrderedList().run())}
      >
        有序
      </FormatBtn>
      <FormatBtn
        type="button"
        $active={editor.isActive({ textAlign: 'left' })}
        onClick={() => run(() => editor.chain().focus().setTextAlign('left').run())}
      >
        左
      </FormatBtn>
      <FormatBtn
        type="button"
        $active={editor.isActive({ textAlign: 'center' })}
        onClick={() => run(() => editor.chain().focus().setTextAlign('center').run())}
      >
        居中
      </FormatBtn>
      <FormatBtn
        type="button"
        $active={editor.isActive({ textAlign: 'right' })}
        onClick={() => run(() => editor.chain().focus().setTextAlign('right').run())}
      >
        右
      </FormatBtn>
      <FormatBtn
        type="button"
        $active={editor.isActive('highlight')}
        onClick={() => run(() => editor.chain().focus().toggleHighlight().run())}
      >
        高亮
      </FormatBtn>
      <FormatBtn
        type="button"
        onClick={() => run(() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run())}
      >
        表格
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

  const [session, setSession] = useState<WebDocumentSession>(() => (
    loadDraftSession(activeWorkspacePath) ?? createEmptyWebDocumentSession()
  ))
  const [title, setTitle] = useState(session.title)
  const [templateId, setTemplateId] = useState(session.templateSkillId)
  const [workflowId, setWorkflowId] = useState<DocumentWorkflowId>('general')
  const [status, setStatus] = useState('')
  const [statusTone, setStatusTone] = useState<'ok' | 'err' | undefined>()
  const [exportBusyFormat, setExportBusyFormat] = useState<DocumentExportFormat | null>(null)
  const [saveState, setSaveState] = useState<DraftSaveState>('saved')
  const [kbPickerOpen, setKbPickerOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<FileEntry[]>([])
  const [formatTick, setFormatTick] = useState(0)
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; hasSelection: boolean } | null>(null)
  const editorRef = useRef<A4EditorHandle>(null)
  const lastPersistedDraftRef = useRef<string | null>(null)

  const defaultTemplate =
    getBuiltinDocumentSkill('document.template.general')
    ?? skills.templateSkills[0]
    ?? null

  const template = useMemo(() => {
    return (
      skills.templateSkills.find((s) => s.id === templateId)
      ?? getBuiltinDocumentSkill(templateId)
      ?? defaultTemplate
      ?? null
    )
  }, [templateId, skills.templateSkills, defaultTemplate])

  const templateOptions = skills.templateSkills.length
    ? skills.templateSkills
    : defaultTemplate
      ? [defaultTemplate]
      : []

  useEffect(() => {
    if (!template) return
    if (templateId !== template.id) setTemplateId(template.id)
  }, [template, templateId])

  useEffect(() => {
    if (!template) return
    setSession((prev) => applyTemplateManifestToSession(prev, template))
  }, [template])

  useEffect(() => {
    const restored = loadDraftSession(activeWorkspacePath)
    if (!restored) return
    setSession(restored)
    setTitle(restored.title)
    setTemplateId(restored.templateSkillId)
    setWorkspaceKbIds(restored.knowledgeBaseIds)
    try {
      lastPersistedDraftRef.current = JSON.stringify(restored)
    } catch {
      lastPersistedDraftRef.current = null
    }
    setSaveState('restored')
    setStatus('草稿已恢复')
    setStatusTone('ok')
  }, [activeWorkspacePath, setWorkspaceKbIds])

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

  useEffect(() => {
    const key = draftStorageKey(activeWorkspacePath)
    if (!key || typeof window === 'undefined') return undefined

    let serialized = ''
    try {
      serialized = JSON.stringify(session)
    } catch {
      setSaveState('error')
      setStatus('草稿保存失败')
      setStatusTone('err')
      return undefined
    }

    if (serialized === lastPersistedDraftRef.current) {
      return undefined
    }

    setSaveState('saving')
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(key, serialized)
        lastPersistedDraftRef.current = serialized
        setSaveState('saved')
      } catch (error) {
        setSaveState('error')
        const msg = error instanceof Error ? error.message : '草稿保存失败'
        setStatus(msg)
        setStatusTone('err')
      }
    }, 180)

    return () => window.clearTimeout(timer)
  }, [activeWorkspacePath, session])

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

  const patchActions = useDocumentPatchActions({
    editorRef,
    session,
    workspacePath: activeWorkspacePath,
    title,
    template: template ?? ({ id: '', name: '' } as import('../webDocumentSkillTypes').WebDocumentSkillManifest),
    knowledgeBaseIds: workspaceKbIds,
    fileIds: session.fileIds,
    onSessionUpdate: setSession,
    onStatus: (msg, tone) => {
      setStatus(msg)
      setStatusTone(tone)
    },
  })

  const handleClipboard = useCallback((action: 'copy' | 'cut' | 'paste' | 'selectAll') => {
    const ed = editorRef.current
    if (action === 'selectAll') {
      ed?.focus()
      document.execCommand('selectAll')
      return
    }
    const ok = document.execCommand(action)
    if (!ok) {
      setStatus(`浏览器限制了剪贴板访问，请使用快捷键 Ctrl+${action === 'copy' ? 'C' : action === 'cut' ? 'X' : 'V'}`)
      setStatusTone('err')
    }
  }, [])

  const exportAndDownloadCurrent = useCallback(async (format: DocumentExportFormat) => {
    if (!activeWorkspacePath || !template) {
      setStatus('请先打开工作区')
      setStatusTone('err')
      return
    }

    if (format === 'html' && typeof document === 'undefined') {
      setStatus('当前环境不支持 HTML 下载')
      setStatusTone('err')
      return
    }

    setExportBusyFormat(format)
    setStatus(`正在生成${format === 'docx' ? ' Word' : format === 'markdown' ? ' Markdown' : ' HTML'}…`)
    setStatusTone(undefined)
    const html = syncHtmlFromEditor()
    const exportSession = { ...session, title, html }

    try {
      const result = await exportAndDownloadCurrentDocument({
        format,
        workspacePath: activeWorkspacePath,
        session: exportSession,
        bodyHtml: html,
        exporters: skills.exporterSkills,
      })
      setSession(result.session)
      setStatus(result.message)
      setStatusTone('ok')
    } catch (error) {
      const msg = error instanceof Error ? error.message : '导出失败'
      setStatus(msg)
      setStatusTone('err')
    } finally {
      setExportBusyFormat(null)
    }
  }, [activeWorkspacePath, session, skills.exporterSkills, syncHtmlFromEditor, template, title])

  const handlePdfExport = useCallback(() => {
    setStatus('Web 版 PDF 导出暂未开放，请先下载 Word。')
    setStatusTone('err')
  }, [])

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

  const confirmImportAsDocxContent = async () => {
    if (!pendingImportFile) return
    setImportModalOpen(false)
    setStatus('正在解析 Word 文档…')
    try {
      const result = await importDocxAsContent(pendingImportFile)
      editorRef.current?.replaceDocument(result.html)
      setSession((prev) => ({
        ...prev,
        html: result.html,
        title: result.title ?? prev.title,
        updatedAt: new Date().toISOString(),
      }))
      if (result.title && !title) setTitle(result.title)
      setStatus(`已导入正文（约 ${result.wordCount} 字）`)
      setStatusTone('ok')
      setPendingImportFile(null)
    } catch (e) {
      setStatus(e instanceof Error ? e.message : '导入失败，请确认文件是有效的 .docx 格式')
      setStatusTone('err')
    }
  }

  if (!template || templateOptions.length === 0) {
    return (
      <Shell data-testid="word-like-document-editor">
        <StatusBanner $tone="err">
          文稿模板技能未加载，请刷新或检查 skills 配置。
        </StatusBanner>
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
          <TopLabel>文稿类型</TopLabel>
          <TopSelect value={workflowId} onChange={(e) => setWorkflowId(e.target.value as DocumentWorkflowId)}>
            {getWorkflowsByCategory().map((group) => (
              <optgroup key={group.category} label={group.label}>
                {group.workflows.map((w) => (
                  <option key={w.id} value={w.id}>{w.label}</option>
                ))}
              </optgroup>
            ))}
          </TopSelect>
        </TopField>
        <TopField>
          <TopLabel>模板</TopLabel>
          <TopSelect value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
            {templateOptions.map((s) => (
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
        <TopBtn
          type="button"
          disabled={Boolean(exportBusyFormat)}
          onClick={() => void exportAndDownloadCurrent('docx')}
        >
          <Download size={14} />
          {exportBusyFormat === 'docx' ? '正在生成 Word…' : '下载 Word'}
        </TopBtn>
        <TopBtn
          type="button"
          disabled={Boolean(exportBusyFormat)}
          onClick={() => void exportAndDownloadCurrent('markdown')}
        >
          <Download size={14} />
          {exportBusyFormat === 'markdown' ? '正在生成 Markdown…' : '下载 Markdown'}
        </TopBtn>
        <TopBtn
          type="button"
          disabled={Boolean(exportBusyFormat)}
          onClick={() => void exportAndDownloadCurrent('html')}
        >
          <Download size={14} />
          {exportBusyFormat === 'html' ? '正在生成 HTML…' : '下载 HTML'}
        </TopBtn>
        <TopBtn type="button" disabled={Boolean(exportBusyFormat)} onClick={handlePdfExport}>
          PDF（暂未开放）
        </TopBtn>
        {hasArtifact ? (
          <TopBtn type="button" onClick={() => void handleDownloadLast()}>下载最近</TopBtn>
        ) : null}
        <SaveBadge $state={saveState}>
          {saveState === 'saving' ? '保存中' : saveState === 'restored' ? '草稿已恢复' : saveState === 'error' ? '保存失败' : '已保存'}
        </SaveBadge>
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
            onContextMenu={(x, y, hasSelection) => setCtxMenu({ x, y, hasSelection })}
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
            onExportCurrentDocument={exportAndDownloadCurrent}
            exportBusyFormat={exportBusyFormat}
            onStatus={(msg, tone) => {
              setStatus(msg)
              setStatusTone(tone)
            }}
            disabled={Boolean(exportBusyFormat)}
            patchActions={patchActions}
            workflowId={workflowId}
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
            {pendingImportFile.name.toLowerCase().endsWith('.docx') ? (
              <>
                <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.6, margin: '0 0 4px' }}>
                  <strong>导入为正文</strong>：将 Word 文档内容提取并填入编辑器，可直接编辑。
                </p>
                <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.6, margin: '0 0 16px' }}>
                  <strong>作为参考资料</strong>：上传供 AI 生成时引用，不填入编辑器。
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <TopBtn type="button" onClick={() => void confirmImportAsDocxContent()}>
                    导入为正文
                  </TopBtn>
                  <TopBtn type="button" onClick={() => void confirmImportAsReference()}>
                    作为参考资料
                  </TopBtn>
                  <TopBtn type="button" onClick={() => setImportModalOpen(false)}>取消</TopBtn>
                </div>
              </>
            ) : (
              <>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
                  当前仅 .docx 文件支持导入为正文。此文件将作为参考资料上传，供 AI 生成时引用。
                </p>
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <TopBtn type="button" onClick={() => void confirmImportAsReference()}>作为参考资料上传</TopBtn>
                  <TopBtn type="button" onClick={() => setImportModalOpen(false)}>取消</TopBtn>
                </div>
              </>
            )}
          </ModalCard>
        </ModalBackdrop>
      )}

      {ctxMenu && (
        <DocumentContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          hasSelection={ctxMenu.hasSelection}
          running={patchActions.running}
          onAiAction={(instruction, mode) => {
            setCtxMenu(null)
            void patchActions.runAiEditAction(instruction, mode)
          }}
          onHeading={(level) => {
            editorRef.current?.setHeading(level)
            setCtxMenu(null)
          }}
          onFormat={(action) => {
            editorRef.current?.[action]?.()
            setCtxMenu(null)
            setFormatTick((n) => n + 1)
          }}
          onTextAlign={(align) => {
            editorRef.current?.setTextAlign(align)
            setCtxMenu(null)
            setFormatTick((n) => n + 1)
          }}
          onClipboard={handleClipboard}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </Shell>
  )
}
