import { useEffect, useState } from 'react'
import { useWorkspace } from '../../../contexts/WorkspaceContext'
import { platformApi } from '../../../platform'
import type { Artifact, FileEntry } from '../../../platform'
import {
  artifactDownloadFilename,
  artifactHasExport,
} from '../../../utils/artifactDisplay'
import {
  MvpBtn, MvpCard, MvpError, MvpHint, MvpLabel, MvpPage, MvpSelect, MvpTextArea, MvpTitle,
} from '../../../components/web/WebMvpLayout'

export default function WebImageGenerationPanel() {
  const { activeWorkspacePath } = useWorkspace()
  const [prompt, setPrompt] = useState('')
  const [refFileId, setRefFileId] = useState('')
  const [imageFiles, setImageFiles] = useState<FileEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [artifact, setArtifact] = useState<Artifact | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    void platformApi.files.list().then((list) => {
      setImageFiles(list.filter((f) => ['png', 'jpg', 'jpeg', 'webp'].includes(f.ext.toLowerCase())))
    }).catch(() => setImageFiles([]))
  }, [])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const handleGenerate = async () => {
    if (!activeWorkspacePath || !prompt.trim()) return
    setLoading(true)
    setError(null)
    setArtifact(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    try {
      const result = await platformApi.skills.run('web.image.generate', {
        prompt: prompt.trim(),
        workspacePath: activeWorkspacePath,
      })
      if (!result.success || !result.artifact) {
        setError(result.error ?? '生成失败')
        return
      }
      setArtifact(result.artifact)
      if (artifactHasExport(result.artifact)) {
        const fn = artifactDownloadFilename(result.artifact)!
        const res = await fetch(`/api/artifacts/${result.artifact.id}/download`, {
          headers: { Authorization: `Bearer ${platformApi.auth.getToken() ?? ''}` },
        })
        if (res.ok) {
          const blob = await res.blob()
          setPreviewUrl(URL.createObjectURL(blob))
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MvpPage>
      <MvpCard>
        <MvpTitle>图片生成</MvpTitle>
        <MvpHint>由服务器调用图片 API 生成，结果保存到生成记录。</MvpHint>
        {error && <MvpError>{error}</MvpError>}
        <div>
          <MvpLabel>描述 *</MvpLabel>
          <MvpTextArea value={prompt} onChange={(e) => setPrompt(e.target.value)} disabled={loading} />
        </div>
        <div>
          <MvpLabel>参考图（可选，来自我的文件）</MvpLabel>
          <MvpSelect value={refFileId} onChange={(e) => setRefFileId(e.target.value)} disabled={loading}>
            <option value="">不选择</option>
            {imageFiles.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </MvpSelect>
        </div>
        <MvpBtn disabled={loading || !prompt.trim()} onClick={() => void handleGenerate()}>
          {loading ? '生成中…' : '生成图片'}
        </MvpBtn>
        {previewUrl && (
          <div>
            <img src={previewUrl} alt="生成结果" style={{ maxWidth: '100%', borderRadius: 8 }} />
            {artifact && artifactHasExport(artifact) && (
              <MvpBtn
                style={{ marginTop: 10 }}
                onClick={() => void platformApi.artifacts.download(
                  artifact.id,
                  artifactDownloadFilename(artifact)!,
                )}
              >
                下载图片
              </MvpBtn>
            )}
            <MvpHint>可在资源中心 › 生成记录查看</MvpHint>
          </div>
        )}
      </MvpCard>
    </MvpPage>
  )
}
