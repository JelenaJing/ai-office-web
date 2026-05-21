import React, { useCallback, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import {
  ChevronDown,
  ChevronRight,
  File,
  FileText,
  Folder,
  FolderOpen,
  Plus,
  RefreshCw,
  Search,
  Upload,
  X,
  Sparkles,
  Download,
} from 'lucide-react'
import { useWorkspace, type FileTreeNode } from '../contexts/WorkspaceContext'
import { useDocument } from '../contexts/DocumentContext'
import { useDocumentEngineHostCommands } from '../engines/documentEngine/hostCommands'
import { platformApi } from '../platform'
import type { Artifact } from '../platform'
import { isWebShim as detectWebShim } from '../platform/detect'

// ─── Document-file filter ─────────────────────────────────────────────────

/**
 * .aidoc.json files are AI Office internal auto-save/draft files, not user documents.
 * Hide them from the document panel by default.  Set to true only in debug builds.
 */
const SHOW_INTERNAL_AIDOC_FILES = false

const DOCUMENT_EXTS = new Set(['.docx', '.doc', '.md', '.txt', '.pdf'])
/** Folders whose contents are exclusively non-document assets */
const IMAGE_FOLDER_NAMES = new Set([
  'images', 'imgs', 'assets', 'pictures', 'image', 'figures', 'fig', 'media',
])

function isDocumentFile(name: string): boolean {
  // .aidoc.json is internal-only; only show if debug flag is on
  if (name.endsWith('.aidoc.json')) return SHOW_INTERNAL_AIDOC_FILES
  if (name.endsWith('.references.json') || name.endsWith('.out')) return false
  const lower = name.toLowerCase()
  const dot = lower.lastIndexOf('.')
  if (dot < 0) return false
  return DOCUMENT_EXTS.has(lower.slice(dot))
}

function filterDocumentTree(nodes: FileTreeNode[]): FileTreeNode[] {
  const result: FileTreeNode[] = []
  for (const node of nodes) {
    if (node.type === 'file') {
      if (isDocumentFile(node.name)) result.push(node)
    } else {
      if (IMAGE_FOLDER_NAMES.has(node.name.toLowerCase())) continue
      const children = filterDocumentTree(node.children ?? [])
      if (children.length > 0) result.push({ ...node, children })
    }
  }
  return result
}

function filterBySearch(nodes: FileTreeNode[], lower: string): FileTreeNode[] {
  if (!lower) return nodes
  const result: FileTreeNode[] = []
  for (const node of nodes) {
    if (node.type === 'file') {
      if (node.name.toLowerCase().includes(lower)) result.push(node)
    } else {
      const children = filterBySearch(node.children ?? [], lower)
      if (children.length > 0) result.push({ ...node, children })
    }
  }
  return result
}

function getDisplayName(name: string): string {
  if (name.endsWith('.aidoc.json')) return name.slice(0, -'.aidoc.json'.length)
  return name
}

function getFileIconColor(name: string): string {
  const lower = name.toLowerCase()
  if (lower.endsWith('.aidoc.json') || lower.endsWith('.docx') || lower.endsWith('.doc')) return '#519aba'
  if (lower.endsWith('.pdf')) return '#e44d26'
  if (lower.endsWith('.md')) return '#42a86c'
  return '#8094a8'
}

// ─── Styled components ────────────────────────────────────────────────────

const PanelWrap = styled.div`
  width: 252px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-right: 1px solid #e2e8f2;
  overflow: hidden;
  min-height: 0;
`

const PanelHeader = styled.div`
  height: 36px;
  display: flex;
  align-items: center;
  padding: 0 8px 0 12px;
  gap: 4px;
  border-bottom: 1px solid #e2e8f2;
  background: #f8fafd;
  flex-shrink: 0;
`

const PanelTitle = styled.span`
  flex: 1;
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: #2c3e52;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const IconBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #6b7f94;
  cursor: pointer;
  flex-shrink: 0;
  padding: 0;
  &:hover { background: #e8edf5; color: #1a2f47; }
`

const SearchBox = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-bottom: 1px solid #e8edf5;
  background: #f8fafd;
  flex-shrink: 0;
`

const SearchInput = styled.input`
  flex: 1;
  border: none;
  background: transparent;
  font-size: var(--font-size-xs);
  color: #1a2f47;
  outline: none;
  &::placeholder { color: #a0aebb; }
`

const NewNameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 8px;
  border-bottom: 1px solid #e2e8f2;
  background: #f8fafd;
  flex-shrink: 0;
`

const NewNameInput = styled.input`
  flex: 1;
  height: 26px;
  border: 1px solid #1f6fd6;
  border-radius: 4px;
  padding: 0 6px;
  font-size: var(--font-size-xs);
  outline: none;
  color: #1a2f47;
  background: #fff;
`

const NewNameConfirm = styled.button`
  height: 26px;
  padding: 0 8px;
  border: 1px solid #1f6fd6;
  border-radius: 4px;
  background: #1f6fd6;
  color: #fff;
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  &:disabled { opacity: 0.5; cursor: default; }
`

const TreeScroll = styled.div`
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: 4px 0;
`

const TreeItem = styled.div<{ $depth: number }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px 4px ${p => 8 + p.$depth * 14}px;
  font-size: var(--font-size-xs);
  color: #2c3e52;
  cursor: pointer;
  user-select: none;
  &:hover { background: #f0f5fb; }
  &:active { background: #e5eef8; }
`

const TreeIcon = styled.span<{ $color?: string }>`
  display: inline-flex;
  flex-shrink: 0;
  color: ${p => p.$color || '#888'};
`

const TreeLabel = styled.span`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const EmptyWrap = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  gap: 8px;
  color: #8094a8;
  text-align: center;
`

const EmptyTitle = styled.div`
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: #304255;
`

const EmptyDesc = styled.p`
  margin: 0;
  font-size: var(--font-size-xs);
  color: #8094a8;
  line-height: 1.6;
`

// ─── Recursive tree node component ────────────────────────────────────────

interface TreeNodeProps {
  node: FileTreeNode
  depth: number
  expandedFolders: Set<string>
  toggleFolder: (path: string) => void
  onFileOpen: (node: FileTreeNode) => void
}

function TreeNode({ node, depth, expandedFolders, toggleFolder, onFileOpen }: TreeNodeProps) {
  if (node.type === 'folder') {
    const expanded = expandedFolders.has(node.path)
    return (
      <>
        <TreeItem $depth={depth} onClick={() => toggleFolder(node.path)}>
          <TreeIcon>
            {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          </TreeIcon>
          <TreeIcon $color="#dcb67a">
            {expanded ? <FolderOpen size={13} /> : <Folder size={13} />}
          </TreeIcon>
          <TreeLabel title={node.name}>{node.name}</TreeLabel>
        </TreeItem>
        {expanded && (node.children ?? []).map(child => (
          <TreeNode
            key={child.path}
            node={child}
            depth={depth + 1}
            expandedFolders={expandedFolders}
            toggleFolder={toggleFolder}
            onFileOpen={onFileOpen}
          />
        ))}
      </>
    )
  }

  const iconColor = getFileIconColor(node.name)
  return (
    <TreeItem $depth={depth} onClick={() => onFileOpen(node)}>
      <TreeIcon style={{ width: 10 }} />
      <TreeIcon $color={iconColor}>
        <FileText size={13} />
      </TreeIcon>
      <TreeLabel title={node.name}>{getDisplayName(node.name)}</TreeLabel>
    </TreeItem>
  )
}

// ─── Web mode detection ───────────────────────────────────────────────────

function isWebShim(): boolean {
  return detectWebShim()
}

// ─── Web: Generate Word doc modal ─────────────────────────────────────────

interface WebDocxCreateModalProps {
  activeWorkspacePath: string
  onClose: () => void
}

function WebDocxCreateModal({ activeWorkspacePath, onClose }: WebDocxCreateModalProps) {
  const [title, setTitle] = useState('AI Office 文稿')
  const [prompt, setPrompt] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Artifact | null>(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) { setError('请输入生成提示词'); return }
    if (!platformApi.system.isFeatureAvailable('web.docx.create')) {
      setError('Web 版即将开放：生成 Word 文稿')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const data = await platformApi.skills.run('web.docx.create', {
        prompt: prompt.trim(),
        workspacePath: activeWorkspacePath,
        params: { title: title.trim() || 'AI Office 文稿' },
      })
      if (!data.success || !data.artifact) {
        setError(data.error ?? '生成失败')
        return
      }
      setResult(data.artifact)
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败，请重试')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1100,
        background: 'rgba(15, 30, 55, 0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#fff', borderRadius: 14,
        boxShadow: '0 12px 48px rgba(20,40,80,0.18)',
        width: 520, maxWidth: 'calc(100vw - 40px)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px 14px',
          borderBottom: '1px solid #e8eef5',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1a2f47', display: 'flex', alignItems: 'center', gap: 7 }}>
              <Sparkles size={16} color="#1a5fb4" />
              生成 Word 文稿
            </div>
            <div style={{ fontSize: 12, color: '#8094a8', marginTop: 3 }}>
              AI 将根据你的提示生成 DOCX 文档，保存到生成记录
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 30, height: 30, border: 'none', background: '#f0f4f8',
            borderRadius: 8, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={14} color="#627385" />
          </button>
        </div>

        {/* Body */}
        {result ? (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1a2f47' }}>{result.title}</div>
              <div style={{ fontSize: 12, color: '#8094a8', marginTop: 4 }}>
                已保存到资源中心 › 生成记录
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={() => void platformApi.artifacts.download(result.id, `${result.title}.docx`)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '10px 20px', background: '#1a5fb4', color: '#fff',
                  border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                <Download size={14} /> 下载 DOCX
              </button>
              <button onClick={onClose} style={{
                padding: '10px 20px', background: '#f0f4f8', color: '#304255',
                border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer',
              }}>关闭</button>
            </div>
          </div>
        ) : (
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {error && (
              <div style={{
                padding: '9px 12px', borderRadius: 8,
                background: '#fff0f0', color: '#c0392b', fontSize: 13,
              }}>{error}</div>
            )}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#4a5f73', display: 'block', marginBottom: 5 }}>
                文稿标题
              </label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="例如：Q2 汇报文稿"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '8px 12px', border: '1px solid #c8d8e8',
                  borderRadius: 8, fontSize: 14, color: '#1a2f47', outline: 'none',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#4a5f73', display: 'block', marginBottom: 5 }}>
                提示词 <span style={{ fontWeight: 400, color: '#aab8c8' }}>（描述你想要的内容）</span>
              </label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="例如：写一份关于 Q2 销售业绩的汇报，包括数据摘要、亮点分析和下季度建议..."
                rows={4}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '8px 12px', border: '1px solid #c8d8e8',
                  borderRadius: 8, fontSize: 13, color: '#1a2f47',
                  resize: 'vertical', outline: 'none', lineHeight: 1.6,
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{
                padding: '9px 18px', background: '#f0f4f8', color: '#304255',
                border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer',
              }}>取消</button>
              <button
                disabled={busy || !prompt.trim()}
                onClick={() => void handleGenerate()}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '9px 18px', background: '#1a5fb4', color: '#fff',
                  border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  cursor: busy || !prompt.trim() ? 'not-allowed' : 'pointer',
                  opacity: busy || !prompt.trim() ? 0.65 : 1,
                }}
              >
                <Sparkles size={13} />
                {busy ? '生成中…' : '生成文稿'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────

export default function DocumentFilePanel() {
  const { fileTreeData, activeWorkspacePath, activeWorkspaceName, refreshTree } = useWorkspace()
  const { openDocumentPath } = useDocumentEngineHostCommands()
  const { setStatusMessage } = useDocument()

  const webMode = isWebShim()

  const [showSearch, setShowSearch] = useState(false)
  const [search, setSearch] = useState('')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [creating, setCreating] = useState(false)
  const [newDocName, setNewDocName] = useState('')
  const [showWebModal, setShowWebModal] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const filteredTree = useMemo(() => {
    const docTree = filterDocumentTree(fileTreeData)
    return search.trim()
      ? filterBySearch(docTree, search.trim().toLowerCase())
      : docTree
  }, [fileTreeData, search])

  const toggleFolder = useCallback((path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }, [])

  const handleFileOpen = useCallback(async (node: FileTreeNode) => {
    if (node.type === 'folder') return
    try {
      await openDocumentPath(node.path)
    } catch (err: any) {
      setStatusMessage(`打开失败: ${err?.message || ''}`)
    }
  }, [openDocumentPath, setStatusMessage])

  // Electron-only: create blank .aidoc.json
  const handleCreateDoc = useCallback(async () => {
    if (!activeWorkspacePath || !newDocName.trim()) return
    const safeName = newDocName.trim()
    const docName = safeName.endsWith('.aidoc.json') ? safeName : `${safeName}.aidoc.json`
    const relPath = `documents/${docName}`
    try {
      const result = await window.electronAPI.createBlankDocument(activeWorkspacePath, relPath)
      await refreshTree()
      await openDocumentPath(result.path, { isInternalOpen: true })
      setStatusMessage(`已创建: ${safeName}`)
    } catch (err: any) {
      setStatusMessage(`创建失败: ${err?.message || ''}`)
    }
    setCreating(false)
    setNewDocName('')
  }, [activeWorkspacePath, newDocName, openDocumentPath, refreshTree, setStatusMessage])

  // Electron-only: import files into workspace
  const handleImport = useCallback(async () => {
    if (!activeWorkspacePath) return
    try {
      const result = await window.electronAPI.importFilesToWorkspace(activeWorkspacePath, 'documents')
      if (result?.imported?.length) {
        await refreshTree()
        setStatusMessage(`已导入 ${result.imported.length} 个文件`)
      }
    } catch (err: any) {
      setStatusMessage(`导入失败: ${err?.message || ''}`)
    }
  }, [activeWorkspacePath, refreshTree, setStatusMessage])

  const toggleSearch = useCallback(() => {
    setShowSearch(v => !v)
    if (!showSearch) {
      setSearch('')
      setTimeout(() => searchInputRef.current?.focus(), 50)
    }
  }, [showSearch])

  const startCreating = useCallback(() => {
    if (webMode) {
      setShowWebModal(true)
    } else {
      setCreating(true)
      setNewDocName('')
    }
  }, [webMode])

  const cancelCreating = useCallback(() => {
    setCreating(false)
    setNewDocName('')
  }, [])

  if (!activeWorkspacePath) {
    return (
      <PanelWrap>
        <PanelHeader>
          <PanelTitle>文稿</PanelTitle>
        </PanelHeader>
        <EmptyWrap>
          <TreeIcon $color="#c8d6e6"><File size={28} /></TreeIcon>
          <EmptyTitle>{webMode ? '正在初始化工作区…' : '未打开工作区'}</EmptyTitle>
          <EmptyDesc>
            {webMode
              ? '请稍等片刻，工作区初始化后即可使用。'
              : '请先在资源中心选择工作区，以管理文稿文件。'}
          </EmptyDesc>
        </EmptyWrap>
      </PanelWrap>
    )
  }

  return (
    <>
      {/* Web mode: docx generate modal */}
      {webMode && showWebModal && (
        <WebDocxCreateModal
          activeWorkspacePath={activeWorkspacePath}
          onClose={() => setShowWebModal(false)}
        />
      )}

      <PanelWrap>
        <PanelHeader>
          {/* Web mode: show plain "文稿" title; Electron: show workspace name */}
          <PanelTitle title={webMode ? undefined : activeWorkspacePath}>
            {webMode ? '文稿' : (activeWorkspaceName ?? '文稿')}
          </PanelTitle>
          <IconBtn
            title={webMode ? '生成 Word 文稿' : '新建文稿'}
            onClick={startCreating}
          >
            <Plus size={13} />
          </IconBtn>
          {!webMode && (
            <IconBtn title="导入文件" onClick={() => void handleImport()}>
              <Upload size={12} />
            </IconBtn>
          )}
          <IconBtn title="搜索" onClick={toggleSearch}>
            <Search size={12} />
          </IconBtn>
          {!webMode && (
            <IconBtn title="刷新" onClick={() => void refreshTree()}>
              <RefreshCw size={12} />
            </IconBtn>
          )}
        </PanelHeader>

        {/* Electron-only: inline name input row */}
        {!webMode && creating && (
          <NewNameRow>
            <NewNameInput
              autoFocus
              value={newDocName}
              onChange={e => setNewDocName(e.target.value)}
              placeholder="新文稿名称..."
              onKeyDown={e => {
                if (e.key === 'Enter') void handleCreateDoc()
                if (e.key === 'Escape') cancelCreating()
              }}
            />
            <NewNameConfirm
              disabled={!newDocName.trim()}
              onClick={() => void handleCreateDoc()}
            >
              创建
            </NewNameConfirm>
            <IconBtn onClick={cancelCreating} title="取消">
              <X size={11} />
            </IconBtn>
          </NewNameRow>
        )}

        {showSearch && (
          <SearchBox>
            <Search size={12} color="#8094a8" />
            <SearchInput
              ref={searchInputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索文稿..."
              onKeyDown={e => {
                if (e.key === 'Escape') { setShowSearch(false); setSearch('') }
              }}
            />
            {search && (
              <IconBtn onClick={() => setSearch('')} title="清除">
                <X size={10} />
              </IconBtn>
            )}
          </SearchBox>
        )}

        <TreeScroll>
          {filteredTree.length === 0 ? (
            <EmptyWrap>
              <TreeIcon $color="#c8d6e6"><FileText size={28} /></TreeIcon>
              <EmptyTitle>{search ? '未找到匹配文稿' : '暂无文稿'}</EmptyTitle>
              <EmptyDesc>
                {search
                  ? '请尝试其他关键词。'
                  : webMode
                    ? '点击上方 + 生成 Word 文稿，生成结果会保存到资源中心的生成记录。'
                    : '点击上方 + 新建文稿，或点击 ↑ 导入已有文件。'}
              </EmptyDesc>
            </EmptyWrap>
          ) : (
            filteredTree.map(node => (
              <TreeNode
                key={node.path}
                node={node}
                depth={0}
                expandedFolders={expandedFolders}
                toggleFolder={toggleFolder}
                onFileOpen={handleFileOpen}
              />
            ))
          )}
        </TreeScroll>
      </PanelWrap>
    </>
  )
}
