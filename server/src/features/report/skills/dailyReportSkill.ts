import { listArtifactsByUser } from '../../../artifacts/ArtifactStore'
import { saveSkillArtifact } from '../../../lib/skillArtifact'
import { readFilesIndex } from '../../../lib/userFiles'
import { parseWorkspacePath } from '../../../artifacts/ArtifactStore'
import { getOrCreateDefaultWorkspace } from '../../../lib/workspaceStore'

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

  const dayStart = `${dateLabel}T00:00:00.000Z`
  const dayEnd = `${dateLabel}T23:59:59.999Z`
  const dayArtifacts = artifacts.filter(
    (a) => a.createdAt >= dayStart && a.createdAt <= dayEnd,
  )

  const lines: string[] = [
    `# 工作日报`,
    ``,
    `**日期：** ${dateLabel}`,
    `**生成时间：** ${new Date().toLocaleString('zh-CN')}`,
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
    `> 本报告为 Web MVP 自动汇总，后续将接入完整活动日志。`,
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
  })

  return { success: true, artifactId: artifact.id, artifact }
}
