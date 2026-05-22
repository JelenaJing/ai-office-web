import { listArtifactsByUser } from '../../../artifacts/ArtifactStore'
import { saveSkillArtifact } from '../../../lib/skillArtifact'
import { readFilesIndex } from '../../../lib/userFiles'
import { parseWorkspacePath } from '../../../artifacts/ArtifactStore'
import { getOrCreateDefaultWorkspace } from '../../../lib/workspaceStore'
import { listMatters } from '../../aios/services/matterService'

export interface DailyReportInput {
  userId: string
  workspacePath: string
  date?: string
}

export type DailyReportResult =
  | { success: true; artifactId: string; artifact: ReturnType<typeof saveSkillArtifact> }
  | { success: false; error: string; status?: number }

export async function runDailyReportSkill(
  input: DailyReportInput,
): Promise<DailyReportResult> {
  if (!parseWorkspacePath(input.workspacePath)) {
    return { success: false, error: 'workspacePath 无效', status: 400 }
  }

  const dateLabel = input.date?.trim() || new Date().toISOString().slice(0, 10)
  const ws = getOrCreateDefaultWorkspace(input.userId)
  const files = readFilesIndex(input.userId, ws.id).files
  const artifacts = listArtifactsByUser(input.userId)
  const matters = listMatters(input.userId)

  const dayStart = `${dateLabel}T00:00:00.000Z`
  const dayEnd = `${dateLabel}T23:59:59.999Z`
  const dayArtifacts = artifacts.filter(
    (a) => a.createdAt >= dayStart && a.createdAt <= dayEnd,
  )
  const activeMattersList = matters.filter(m =>
    m.status !== 'done' && m.status !== 'archived',
  )
  const dayMattersList = matters.filter(
    m => m.createdAt >= dayStart && m.createdAt <= dayEnd,
  )

  const lines: string[] = [
    `# 工作日报`,
    ``,
    `**日期：** ${dateLabel}`,
    `**生成时间：** ${new Date().toLocaleString('zh-CN')}`,
    ``,
    `## 今日事项（当日新增）`,
    dayMattersList.length === 0
      ? '- （今日无新建事项）'
      : dayMattersList.map((m) => `- [${m.priority}] ${m.title}（状态：${m.status}）`).join('\n'),
    ``,
    `## 进行中事项`,
    activeMattersList.length === 0
      ? '- （暂无进行中事项）'
      : activeMattersList.slice(0, 10).map((m) => `- [${m.status}] ${m.title}`).join('\n'),
    ``,
    `## 我的文件`,
    files.length === 0 ? '- （无上传文件）' : files.map((f) => `- ${f.name}（${f.uploadedAt}）`).join('\n'),
    ``,
    `## 生成记录（当日）`,
    dayArtifacts.length === 0
      ? '- （当日无生成记录）'
      : dayArtifacts.map((a) => `- [${a.type}] ${a.title}（${a.createdAt}）`).join('\n'),
    ``,
    `## 全部生成记录摘要`,
    artifacts.length === 0
      ? '- （暂无）'
      : artifacts.slice(0, 20).map((a) => `- [${a.type}] ${a.title}`).join('\n'),
    ``,
    `> 本报告为 Web MVP 自动汇总，包含 AIOS 事项数据。`,
  ]

  const markdown = lines.join('\n')
  const artifact = saveSkillArtifact({
    userId: input.userId,
    workspacePath: input.workspacePath,
    skillId: 'web.daily.report',
    type: 'report',
    title: `工作日报 ${dateLabel}`,
    filename: 'daily-report.md',
    format: 'md',
    content: markdown,
    sourceRefs: [
      ...matters.slice(0, 20).map((matter) => ({ type: 'matter', id: matter.id, label: matter.title })),
      ...dayArtifacts.slice(0, 20).map((artifact) => ({ type: 'artifact', id: artifact.id, label: artifact.title })),
    ],
  })

  return { success: true, artifactId: artifact.id, artifact }
}
