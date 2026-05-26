import { resolveWebApiUrl } from '../../../runtime/apiBase'
import { platformApi } from '../../../platform'
import { peekPendingReportFromDocument, setPendingReportFromDocument } from '../../../services/pendingReportFromDocument'
import { htmlToMarkdownForReport } from './documentContentApply'

export interface StartReportFromDocumentInput {
  title: string
  html: string
  workspacePath?: string
}

export async function prepareReportFromDocument(input: StartReportFromDocumentInput): Promise<void> {
  const title = input.title.trim() || '未命名文稿'
  const markdown = htmlToMarkdownForReport(input.html, title)
  const prompt = [
    `请根据以下文稿生成一份适合口头汇报的 HTML 汇报材料（幻灯片式页面）。`,
    `标题：${title}`,
    `要求：结构清晰、要点分明、适合投影展示；保留原文核心信息，可适当提炼小标题。`,
  ].join('\n')

  setPendingReportFromDocument({
    title,
    inputMarkdown: markdown,
    prompt,
  })
}

export async function startReportJobFromDocument(input: StartReportFromDocumentInput): Promise<{
  jobId: string
  artifactId?: string
}> {
  await prepareReportFromDocument(input)
  const pending = peekPendingReportFromDocument()
  if (!pending) throw new Error('未能准备汇报生成内容')

  const token = platformApi.auth.getToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(resolveWebApiUrl('/api/artifact-jobs'), {
    method: 'POST',
    headers,
    body: JSON.stringify({
      type: 'html_presentation',
      skillId: 'html-ppt-beautiful',
      prompt: pending.prompt,
      inputMarkdown: pending.inputMarkdown,
      qualityMode: 'fast',
      enableImages: false,
      maxImages: 0,
      workspacePath: input.workspacePath,
    }),
  })
  const body = await response.json().catch(() => ({})) as {
    success?: boolean
    jobId?: string
    error?: string
  }
  if (!response.ok || !body.jobId) {
    throw new Error(body.error || `启动汇报生成失败 (${response.status})`)
  }
  return { jobId: body.jobId }
}
