import { useState } from 'react'
import { useWorkspace } from '../../../contexts/WorkspaceContext'
import { platformApi } from '../../../platform'
import type { Artifact } from '../../../platform'
import {
  artifactDownloadFilename,
  artifactHasExport,
} from '../../../utils/artifactDisplay'
import {
  MvpBtn, MvpCard, MvpError, MvpHint, MvpInput, MvpLabel, MvpPage, MvpTextArea, MvpTitle,
} from '../../../components/web/WebMvpLayout'

export default function WebPptGenerationPanel() {
  const { activeWorkspacePath } = useWorkspace()
  const [title, setTitle] = useState('演示文稿')
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [artifact, setArtifact] = useState<Artifact | null>(null)

  const handleGenerate = async () => {
    if (!activeWorkspacePath) return
    setLoading(true)
    setError(null)
    setArtifact(null)
    try {
      const result = await platformApi.skills.run('web.pptx.create', {
        prompt: prompt.trim() || title,
        workspacePath: activeWorkspacePath,
        params: { title: title.trim() || '演示文稿' },
      })
      if (!result.success || !result.artifact) {
        setError(result.error ?? '生成失败')
        return
      }
      setArtifact(result.artifact)
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MvpPage>
      <MvpCard>
        <MvpTitle>PPT 生成</MvpTitle>
        <MvpHint>生成可下载的 pptx，保存到生成记录。模板替换后续优化。</MvpHint>
        {error && <MvpError>{error}</MvpError>}
        <div>
          <MvpLabel>标题</MvpLabel>
          <MvpInput value={title} onChange={(e) => setTitle(e.target.value)} disabled={loading} />
        </div>
        <div>
          <MvpLabel>主题 / 内容要求</MvpLabel>
          <MvpTextArea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="例如：介绍 AI Office Web 版能力与路线图"
            disabled={loading}
          />
        </div>
        <MvpBtn disabled={loading} onClick={() => void handleGenerate()}>生成 PPT</MvpBtn>
        {artifact && artifactHasExport(artifact) && (
          <div>
            <MvpHint>✅ {artifact.title}</MvpHint>
            <MvpBtn
              onClick={() => void platformApi.artifacts.download(
                artifact.id,
                artifactDownloadFilename(artifact)!,
              )}
            >
              下载 PPTX
            </MvpBtn>
          </div>
        )}
      </MvpCard>
    </MvpPage>
  )
}
