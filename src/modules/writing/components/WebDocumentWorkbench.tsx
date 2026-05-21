/**
 * WebDocumentWorkbench — 类 Word 的 Web 文稿工作台（A4 编辑 + AI 指令 + skill 导出）
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import { Download, FileUp, BookOpen } from 'lucide-react'
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
  applyTemplateToSession,
  runWebDocumentExport,
  webDocxSuccessMessage,
} from '../services/docxWebGeneration'
import {
  createEmptyWebDocumentSession,
  type WebDocumentSession,
} from '../webDocumentTypes'
import { A4RichEditor, type A4RichEditorHandle } from './A4RichEditor'
import { AICommandBox } from './AICommandBox'

const Shell = styled.div`
  flex: 1;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: #eef2f7;
`

const TopBar = styled.div`
  flex-shrink: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #1a2840;
  color: #e8eef5;
`

const TopField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 120px;
`

const TopLabel = styled.span`
  font-size: 10px;
  opacity: 0.75;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`

const TopInput = styled.input`
  height: 30px;
  padding: 0 8px;
  border-radius: 6px;
  border: 1px solid #3d5270;
  background: #243449;
  color: #fff;
  font-size: 13px;
  min-width: 140px;
`

const TopSelect = styled.select`
  height: 30px;
  padding: 0 8px;
  border-radius: 6px;
  border: 1px solid #3d5270;
  background: #243449;
  color: #fff;
  font-size: 12px;
  max-width: 180px;
`

const TopBtn = styled.button`
  height: 30px;
  padding: 0 12px;
  border-radius: 6px;
  border: 1px solid #4a6278;
  background: #2d4158;
  color: #fff;
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

const Main = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

const ChipRow = styled.div`
  flex-shrink: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 16px 0;
  font-size: 11px;
  color: #64748b;
`

const Chip = styled.span`
  padding: 2px 8px;
  background: #e8eef5;
  border-radius: 999px;
`

const StatusBanner = styled.div<{ $tone?: 'ok' | 'err' }>`
  flex-shrink: 0;
  padding: 6px 16px;
  font-size: 12px;
  color: ${(p) => (p.$tone === 'err' ? '#b91c1c' : p.$tone === 'ok' ? '#15803d' : '#475569')};
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
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
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
`

export default function WebDocumentWorkbench() {
  const { activeWorkspacePath } = useWorkspace()
  const { workspaceKbIds, setWorkspaceKbIds } = useDocumentWorkspaceKnowledge()
  const { departments, loading: deptLoading } = useDepartment()
  const skills = useWebDocumentSkills()

  const [session, setSession] = useState<WebDocumentSession>(() => createEmptyWebDocumentSession())
  const [title, setTitle] = useState('未命名文稿')
  const [templateId, setTemplateId] = useState('document.template.general')
  const [status, setStatus] = useState('')
  const [statusTone, setStatusTone] = useState<'ok' | 'err' | undefined>()
  const [exportBusy, setExportBusy] = useState(false)
  const [kbPickerOpen, setKbPickerOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<FileEntry[]>([])
  const editorRef = useRef<A4RichEditorHandle>(null)

  const generatorId = 'document.generator.office_draft'

  const template = useMemo(
    () => skills.templateSkills.find((s) => s.id === templateId)
      ?? getBuiltinDocumentSkill(templateId),
    [templateId, skills.templateSkills],
  )

  useEffect(() => {
    if (!template) return
    setSession((prev) => applyTemplateToSession({ ...prev, title }, template))
  }, [template, title])

  const refreshUploadedFiles = useCallback(async () => {
    try {
      const list = await platformApi.files.list()
      const ids = session.sourceRefs.fileIds
      setUploadedFiles(list.filter((f) => ids.includes(f.id)))
    } catch {
      setUploadedFiles([])
    }
  }, [session.sourceRefs.fileIds])

  useEffect(() => {
    void refreshUploadedFiles()
  }, [refreshUploadedFiles])

  const syncHtmlFromEditor = useCallback((): string => {
    const html = editorRef.current?.getHtml() ?? session.content.html ?? ''
    setSession((prev) => ({
      ...prev,
      title,
      content: { ...prev.content, html },
      updatedAt: new Date().toISOString(),
    }))
    return html
  }, [title, session.content.html])

  const handleExport = async (exporterId: string) => {
    if (!activeWorkspacePath) return
    const exporter = skills.exporterSkills.find((s) => s.id === exporterId)
      ?? getBuiltinDocumentSkill(exporterId)
    if (!exporter) return

    setExportBusy(true)
    setStatus(`正在导出（${exporter.name}）…`)
    setStatusTone(undefined)
    const html = syncHtmlFromEditor()
    const exportSession = { ...session, title, content: { ...session.content, html } }

    try {
      const result = await runWebDocumentExport(exporter, activeWorkspacePath, exportSession, html)
      if (!result.success) {
        setStatus(result.error || '导出失败')
        setStatusTone('err')
        return
      }
      if (result.artifact) {
        setSession((prev) => ({
          ...prev,
          lastArtifactId: result.artifact!.id,
          artifacts: [...new Set([...prev.artifacts, result.artifact!.id])],
        }))
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
    const id = session.lastArtifactId
    if (!id) return
    try {
      const list = await platformApi.artifacts.list()
      const artifact = list.find((a) => a.id === id)
      if (!artifact || !artifactHasExport(artifact)) {
        setStatus('暂无可下载文件')
        setStatusTone('err')
        return
      }
      const fn = artifactDownloadFilename(artifact)!
      await platformApi.artifacts.download(id, fn)
      setStatus(`已下载 ${fn}`)
      setStatusTone('ok')
    } catch (e) {
      setStatus(e instanceof Error ? e.message : '下载失败')
      setStatusTone('err')
    }
  }

  const handleImportFilePick = (file: File) => {
    setPendingImportFile(file)
    setImportModalOpen(true)
  }

  const confirmImportAsReference = async () => {
    if (!pendingImportFile) return
    setImportModalOpen(false)
    setStatus('正在上传资料…')
    try {
      const entry = await platformApi.files.upload(pendingImportFile)
      setSession((prev) => ({
        ...prev,
        sourceRefs: {
          ...prev.sourceRefs,
          fileIds: [...new Set([...prev.sourceRefs.fileIds, entry.id])],
        },
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
      <Shell data-testid="web-document-workbench">
        <StatusBanner $tone="err">模板技能未加载</StatusBanner>
      </Shell>
    )
  }

  return (
    <Shell data-testid="web-document-workbench">
      <TopBar>
        <TopField style={{ flex: 1, minWidth: 180 }}>
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
        <TopBtn type="button" onClick={() => setKbPickerOpen(true)} title="选择知识库">
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
              if (f) handleImportFilePick(f)
            }
            input.click()
          }}
        >
          <FileUp size={14} /> 资料
        </TopBtn>
        <TopBtn
          type="button"
          disabled={exportBusy}
          onClick={() => void handleExport('document.export.docx')}
        >
          <Download size={14} /> Word
        </TopBtn>
        <TopBtn
          type="button"
          disabled={exportBusy}
          onClick={() => void handleExport('document.export.pdf')}
        >
          PDF
        </TopBtn>
        <TopBtn
          type="button"
          disabled={exportBusy}
          onClick={() => void handleExport('document.export.markdown')}
        >
          MD
        </TopBtn>
        {session.lastArtifactId ? (
          <TopBtn type="button" onClick={() => void handleDownloadLast()}>下载最近</TopBtn>
        ) : null}
      </TopBar>

      <Main>
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

        <A4RichEditor
          ref={editorRef}
          initialHtml={session.content.html}
          pageSpec={session.pageSpec}
          headerFooter={session.headerFooter}
          onChange={(html) => {
            setSession((prev) => ({
              ...prev,
              content: { ...prev.content, html },
              updatedAt: new Date().toISOString(),
            }))
          }}
        />

        <AICommandBox
          editorRef={editorRef}
          workspacePath={activeWorkspacePath}
          title={title}
          template={template}
          generatorId={generatorId}
          knowledgeBaseIds={workspaceKbIds}
          fileIds={session.sourceRefs.fileIds}
          session={session}
          onSessionUpdate={setSession}
          onStatus={(msg, tone) => {
            setStatus(msg)
            setStatusTone(tone)
          }}
          disabled={exportBusy}
        />

        {status ? <StatusBanner $tone={statusTone}>{status}</StatusBanner> : null}
      </Main>

      {kbPickerOpen && (
        <KnowledgeTreePicker
          departments={departments}
          selectedIds={workspaceKbIds}
          loading={deptLoading}
          onApply={(ids) => {
            setWorkspaceKbIds(ids)
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
              作为参考资料上传，供 AI 生成与编辑时引用。
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <TopBtn type="button" onClick={() => void confirmImportAsReference()}>
                作为资料
              </TopBtn>
              <TopBtn type="button" onClick={() => setImportModalOpen(false)}>取消</TopBtn>
            </div>
          </ModalCard>
        </ModalBackdrop>
      )}
    </Shell>
  )
}
