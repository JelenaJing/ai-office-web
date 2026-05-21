import React, { useRef, useState } from 'react'
import styled from 'styled-components'
import { FileText, Mail, BarChart2, Presentation, CalendarClock, FolderOpen, Upload } from 'lucide-react'
import { useWorkspaceMode } from '../contexts/WorkspaceModeContext'
import { SceneFeatureRow } from '../components/scene/SceneFeatureRow'
import type { PrimarySection } from '../components/nav/PrimaryNav'
import MyFilesPanel from './MyFilesPanel'
import { platformApi } from '../platform'

interface WorkWorkspaceProps {
  onGoToWorkspace: () => void
  onNavigate: (section: PrimarySection) => void
}

const Page = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  background: #f4f7fc;
  padding: 40px 56px;
`

const PageHeader = styled.div`
  margin-bottom: 28px;
  flex-shrink: 0;
`

const PageTitle = styled.h1`
  margin: 0 0 6px;
  font-size: 28px;
  font-weight: 800;
  color: #1a2f47;
`

const PageSubtitle = styled.p`
  margin: 0;
  font-size: 14px;
  color: #6b7f94;
`

const FeatureList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
`

export default function WorkWorkspace({ onGoToWorkspace, onNavigate }: WorkWorkspaceProps) {
  const {
    enterFreeMode,
    enterEmailMode,
    enterDataMode,
    enterPptGenerationMode,
  } = useWorkspaceMode()

  const [showFiles, setShowFiles] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const uploadRef = useRef<HTMLInputElement>(null)

  const go = (fn: () => void) => { fn(); onGoToWorkspace() }

  const handleQuickUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!platformApi.system.isFeatureAvailable('file.upload')) {
      setUploadMessage({ type: 'err', text: 'Web 版即将开放：文件上传' })
      return
    }
    setUploading(true)
    setUploadMessage(null)
    try {
      await platformApi.files.upload(file)
      setUploadMessage({ type: 'ok', text: `已上传：${file.name}` })
      setShowFiles(true)
    } catch (err) {
      setUploadMessage({
        type: 'err',
        text: err instanceof Error ? err.message : '上传失败，请重试',
      })
    } finally {
      setUploading(false)
      if (uploadRef.current) uploadRef.current.value = ''
    }
  }

  return (
    <>
      {showFiles && <MyFilesPanel onClose={() => setShowFiles(false)} />}
      <input
        ref={uploadRef}
        type="file"
        accept=".docx,.pdf,.pptx,.xlsx,.csv,.txt,.md,.png,.jpg,.jpeg"
        style={{ display: 'none' }}
        onChange={(e) => void handleQuickUpload(e)}
      />
      <Page>
        <PageHeader>
          <PageTitle>工作场景</PageTitle>
          <PageSubtitle>文稿编辑、邮件收发、日程管理、数据分析与 PPT 生成</PageSubtitle>
          {uploadMessage && (
            <p style={{
              margin: '10px 0 0',
              fontSize: 13,
              color: uploadMessage.type === 'ok' ? '#1a7f4b' : '#c0392b',
            }}>
              {uploadMessage.text}
            </p>
          )}
        </PageHeader>

        <FeatureList>
          <SceneFeatureRow
            icon={<FileText size={24} />}
            title="文稿编辑"
            description="新建、编辑、生成和导出文稿 / PPT / 模板材料"
            accent="blue"
            actionLabel="进入"
            onClick={() => go(enterFreeMode)}
          />
          <SceneFeatureRow
            icon={<Mail size={24} />}
            title="邮件收发"
            description="收发邮件、新建邮件、AI 预回复和附件管理"
            accent="purple"
            actionLabel="进入"
            onClick={() => go(enterEmailMode)}
          />
          <SceneFeatureRow
            icon={<CalendarClock size={24} />}
            title="日程管理"
            description="AI识别邮件中的会议、截止事项和候选时间，自动生成日程并检测时间冲突"
            accent="indigo"
            actionLabel="进入"
            onClick={() => onNavigate('calendar')}
          />
          <SceneFeatureRow
            icon={<BarChart2 size={24} />}
            title="数据分析"
            description="分析表格、生成图表、整理数据结论"
            accent="teal"
            actionLabel="进入"
            onClick={() => go(enterDataMode)}
          />
          <SceneFeatureRow
            icon={<Presentation size={24} />}
            title="PPT 生成"
            description="根据主题、资料和模板生成演示文稿，支持 Skill 模板"
            accent="orange"
            actionLabel="进入"
            onClick={() => go(enterPptGenerationMode)}
          />
          <SceneFeatureRow
            icon={<FolderOpen size={24} />}
            title="我的文件"
            description="查看、下载、删除已上传的文件；后续文稿和 PPT 可从这里选取资料"
            accent="green"
            actionLabel="查看"
            onClick={() => setShowFiles(true)}
          />
          <SceneFeatureRow
            icon={<Upload size={24} />}
            title="上传文件"
            description="将 docx、pdf、pptx、xlsx、csv、txt、图片等文件上传到工作区"
            accent="teal"
            actionLabel={uploading ? '上传中…' : '选择文件'}
            onClick={() => {
              if (uploading) return
              uploadRef.current?.click()
            }}
          />
        </FeatureList>
      </Page>
    </>
  )
}

