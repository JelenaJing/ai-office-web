import { useState } from 'react'
import { useWorkspace } from '../../../contexts/WorkspaceContext'
import { platformApi } from '../../../platform'
import type { Artifact } from '../../../platform'
import {
  artifactDownloadFilename,
  artifactHasExport,
} from '../../../utils/artifactDisplay'
import {
  MvpBtn, MvpCard, MvpError, MvpHint, MvpInput, MvpLabel, MvpPage, MvpTitle,
} from '../../../components/web/WebMvpLayout'

export default function WebDailyReportPanel() {
  const { activeWorkspacePath } = useWorkspace()
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [artifact, setArtifact] = useState<Artifact | null>(null)

  const handleGenerate = async () => {
    if (!activeWorkspacePath) return
    setLoading(true)
    setError(null)
    setArtifact(null)
    try {
      const result = await platformApi.skills.run('web.daily.report', {
        workspacePath: activeWorkspacePath,
        params: { date },
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
        <MvpTitle>工作日报</MvpTitle>
        <MvpHint>基于我的文件与生成记录汇总，输出 Markdown 报告。</MvpHint>
        {error && <MvpError>{error}</MvpError>}
        <MvpLabel>日期</MvpLabel>
        <MvpInput type="date" value={date} onChange={e => setDate(e.target.value)} disabled={loading} />
        <MvpBtn disabled={loading} onClick={() => void handleGenerate()}>
          {loading ? '生成中…' : '生成日报'}
        </MvpBtn>
        {artifact && artifactHasExport(artifact) && (
          <MvpBtn
            onClick={() => void platformApi.artifacts.download(
              artifact.id,
              artifactDownloadFilename(artifact)!,
            )}
          >
            下载报告
          </MvpBtn>
        )}
      </MvpCard>
    </MvpPage>
  )
}
