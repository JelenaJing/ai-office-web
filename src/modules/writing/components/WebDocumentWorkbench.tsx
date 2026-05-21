/**
 * WebDocumentWorkbench — Web 文稿工作台壳；生成/模板/导入/导出由 document skills 驱动。
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import { Download, FileUp, Sparkles, BookOpen } from 'lucide-react'
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
  resolveMapsToSkillId,
  runWebDocumentExport,
  runWebDocxCreate,
  sessionFromSkillResult,
  webDocxSuccessMessage,
} from '../services/docxWebGeneration'
import {
  createEmptyWebDocumentSession,
  type WebDocumentSession,
} from '../webDocumentTypes'

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
  max-width: 160px;
`

const TopBtn = styled.button<{ $primary?: boolean }>`
  height: 30px;
  padding: 0 12px;
  border-radius: 6px;
  border: 1px solid ${(p) => (p.$primary ? '#3b82f6' : '#4a6278')};
  background: ${(p) => (p.$primary ? '#2563eb' : '#2d4158')};
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

const PreviewScroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  justify-content: center;
`

const A4Page = styled.div<{ $widthMm: number; $heightMm: number }>`
  width: min(100%, ${(p) => p.widthMm * 3.2}px);
  min-height: ${(p) => p.heightMm * 3.2}px;
  background: #fff;
  box-shadow: 0 4px 24px rgba(15, 23, 42, 0.12);
  border: 1px solid #d1dae6;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
`

const PageHeader = styled.div<{ $align: string }>`
  flex-shrink: 0;
  padding: 14px 24px 8px;
  font-size: 11px;
  color: #64748b;
  text-align: ${(p) => p.$align};
  border-bottom: 1px dashed #e2e8f0;
`

const PageBody = styled.div`
  flex: 1;
  padding: 20px 28px;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 14px;
  line-height: 1.65;
  color: #1e293b;
  outline: none;
  min-height: 320px;
  h1 { font-size: 22px; margin: 0 0 12px; }
  h2 { font-size: 16px; margin: 18px 0 8px; color: #2e74b5; }
  p { margin: 0 0 10px; }
`

const PageFooter = styled.div<{ $align: string }>`
  flex-shrink: 0;
  padding: 10px 24px 14px;
  font-size: 11px;
  color: #94a3b8;
  text-align: ${(p) => p.$align};
  border-top: 1px dashed #e2e8f0;
`

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

const StatusLine = styled.div<{ $tone?: 'ok' | 'err' }>`
  font-size: 12px;
  color: ${(p) => (p.$tone === 'err' ? '#b91c1c' : p.$tone === 'ok' ? '#15803d' : '#475569')};
`

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 11px;
  color: #64748b;
`

const Chip = styled.span`
  padding: 2px 8px;
  background: #e8eef5;
  border-radius: 999px;
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
  const [generatorId, setGeneratorId] = useState('document.generator.office_draft')
  const [templateId, setTemplateId] = useState('document.template.general')
  const [prompt, setPrompt] = useState('')
  const [status, setStatus] = useState('')
  const [statusTone, setStatusTone] = useState<'ok' | 'err' | undefined>()
  const [busy, setBusy] = useState<'generate' | 'export' | null>(null)
  const [kbPickerOpen, setKbPickerOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<FileEntry[]>([])
  const bodyRef = useRef<HTMLDivElement>(null)

  const generator = useMemo(
    () => skills.generatorSkills.find((s) => s.id === generatorId)
      ?? getBuiltinDocumentSkill(generatorId),
    [generatorId, skills.generatorSkills],
  )

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

  useEffect(() => {
    if (bodyRef.current && session.content.html) {
      bodyRef.current.innerHTML = session.content.html
    }
  }, [session.id, session.content.html])

  const syncBodyToSession = useCallback(() => {
    const html = bodyRef.current?.innerHTML ?? ''
    setSession((prev) => ({
      ...prev,
      title,
      content: { ...prev.content, html },
      updatedAt: new Date().toISOString(),
    }))
    return html
  }, [title])

  const handleGenerate = async () => {
    if (!activeWorkspacePath) {
      setStatus('请先打开工作区')
      setStatusTone('err')
      return
    }
    if (!prompt.trim()) {
      setStatus('请输入生成要求')
      setStatusTone('err')
      return
    }
    if (!generator || !template) {
      setStatus('请选择生成技能与模板')
      setStatusTone('err')
      return
    }

    setBusy('generate')
    setStatus('正在生成文稿…')
    setStatusTone(undefined)
    const html = syncBodyToSession()
    const plain = bodyRef.current?.innerText?.trim() ?? ''

    try {
      const skillId = resolveMapsToSkillId(generator)
      const result = await runWebDocxCreate(prompt, activeWorkspacePath, {
        title,
        templateSkillId: template.id,
        templateManifest: template,
        knowledgeBaseIds: workspaceKbIds,
        fileIds: session.sourceRefs.fileIds,
        currentDocumentText: plain || html.replace(/<[^>]+>/g, ' ').slice(0, 2000),
      })

      if (result.success === false) {
        setStatus(result.error || '生成失败')
        setStatusTone('err')
        return
      }
      if (!result.artifact && !result.data?.documentSession) {
        setStatus(result.error || '生成失败')
        setStatusTone('err')
        return
      }

      const next = sessionFromSkillResult(
        result,
        template,
        generator.id,
        { knowledgeBaseIds: workspaceKbIds, fileIds: session.sourceRefs.fileIds },
      )

      if (next) {
        setSession(next)
        setTitle(next.title)
        if (bodyRef.current && next.content.html) {
          bodyRef.current.innerHTML = next.content.html
        }
        setStatus(
          result.artifact
            ? webDocxSuccessMessage(result.artifact)
            : '文稿已生成，可继续编辑',
        )
        setStatusTone('ok')
      } else {
        setStatus('生成完成但未返回正文，请查看生成记录')
        setStatusTone('err')
      }
    } catch (e) {
      setStatus(e instanceof Error ? e.message : '生成失败')
      setStatusTone('err')
    } finally {
      setBusy(null)
    }
  }

  const handleExport = async (exporterId: string) => {
    if (!activeWorkspacePath) return
    const exporter = skills.exporterSkills.find((s) => s.id === exporterId)
      ?? getBuiltinDocumentSkill(exporterId)
    if (!exporter) return

    setBusy('export')
    setStatus(`正在导出（${exporter.name}）…`)
    setStatusTone(undefined)
    const html = syncBodyToSession()
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
      setBusy(null)
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

  const headerText = session.headerFooter.headerText?.trim() || ''
  const footerText = (session.headerFooter.footerText || '').replace('{page}', '1')
  const headerAlign = session.headerFooter.headerAlign || 'center'
  const footerAlign = session.headerFooter.footerAlign || 'center'

  return (
    <Shell data-testid="web-document-workbench">
      <TopBar>
        <TopField style={{ flex: 1, minWidth: 180 }}>
          <TopLabel>文稿标题</TopLabel>
          <TopInput value={title} onChange={(e) => setTitle(e.target.value)} />
        </TopField>
        <TopField>
          <TopLabel>生成技能</TopLabel>
          <TopSelect
            value={generatorId}
            onChange={(e) => setGeneratorId(e.target.value)}
            disabled={skills.loading}
          >
            {skills.generatorSkills.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </TopSelect>
        </TopField>
        <TopField>
          <TopLabel>模板技能</TopLabel>
          <TopSelect
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
          >
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
          <FileUp size={14} /> 导入资料
        </TopBtn>
        <TopBtn type="button" onClick={() => void handleExport('document.export.docx')} disabled={busy !== null}>
          <Download size={14} /> Word
        </TopBtn>
        <TopBtn type="button" onClick={() => void handleExport('document.export.pdf')} disabled={busy !== null}>
          PDF
        </TopBtn>
        <TopBtn type="button" onClick={() => void handleExport('document.export.markdown')} disabled={busy !== null}>
          MD
        </TopBtn>
        {session.lastArtifactId ? (
          <TopBtn type="button" onClick={() => void handleDownloadLast()}>下载最近</TopBtn>
        ) : null}
      </TopBar>

      <Main>
        <PreviewScroll>
          <A4Page $widthMm={session.pageSpec.widthMm} $heightMm={session.pageSpec.heightMm}>
            {headerText ? <PageHeader $align={headerAlign}>{headerText}</PageHeader> : null}
            <PageBody
              ref={bodyRef}
              contentEditable
              suppressContentEditableWarning
              onInput={syncBodyToSession}
            />
            {footerText ? <PageFooter $align={footerAlign}>{footerText}</PageFooter> : null}
          </A4Page>
        </PreviewScroll>

        <BottomBar>
          {uploadedFiles.length > 0 || workspaceKbIds.length > 0 ? (
            <ChipRow>
              {workspaceKbIds.map((id) => (
                <Chip key={id}>KB: {departments.find((d) => d.id === id)?.name ?? id}</Chip>
              ))}
              {uploadedFiles.map((f) => (
                <Chip key={f.id}>{f.name}</Chip>
              ))}
            </ChipRow>
          ) : null}
          <PromptArea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="描述文稿目的、结构、语气与必须包含的要点…"
            disabled={busy === 'generate'}
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <TopBtn
              $primary
              type="button"
              disabled={busy !== null}
              onClick={() => void handleGenerate()}
            >
              <Sparkles size={14} />
              {busy === 'generate' ? '生成中…' : '生成文稿'}
            </TopBtn>
            <TopBtn type="button" disabled title="后续接入 document-transformer skill">
              优化正文（即将开放）
            </TopBtn>
          </div>
          {status ? <StatusLine $tone={statusTone}>{status}</StatusLine> : null}
          <StatusLine>导出与生成均通过 skills.run 执行；结果保存在资源中心 › 生成记录。</StatusLine>
        </BottomBar>
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
              Word：作为资料（可用）、作为模板 / 可编辑文稿（下一版）。<br />
              PDF：作为资料（可用）、版式背景 / 完整可编辑（暂不支持）。
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <TopBtn $primary type="button" onClick={() => void confirmImportAsReference()}>
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
