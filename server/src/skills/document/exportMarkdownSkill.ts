import { saveSkillArtifact } from '../../lib/skillArtifact'
import {
  sanitizeFilename,
  type WebDocumentSessionJson,
} from '../docx/documentSessionBuilder'

export interface ExportMarkdownInput {
  userId: string
  workspacePath: string
  title?: string
  markdown?: string
  html?: string
  documentSession?: WebDocumentSessionJson
  format?: string
}

export type ExportMarkdownResult =
  | { success: true; artifact: ReturnType<typeof saveSkillArtifact> }
  | { success: false; error: string }

function sessionToMarkdown(session: WebDocumentSessionJson): string {
  if (session.content.markdown?.trim()) return session.content.markdown
  const lines: string[] = [`# ${session.title}`, '']
  const meta = [
    `template: ${session.selectedTemplateSkillId}`,
    `generator: ${session.selectedGeneratorSkillId}`,
    `exportedAt: ${new Date().toISOString()}`,
  ]
  lines.push('<!--', ...meta, '-->', '')
  for (const block of session.content.blocks) {
    if (block.type === 'heading') {
      lines.push(`${'#'.repeat(Math.min(block.level ?? 2, 6))} ${block.text}`, '')
    } else {
      lines.push(block.text, '')
    }
  }
  return lines.join('\n')
}

export async function runExportMarkdownSkill(
  input: ExportMarkdownInput,
): Promise<ExportMarkdownResult> {
  if (!input.workspacePath) {
    return { success: false, error: '缺少 workspacePath' }
  }
  const title = input.title?.trim()
    || input.documentSession?.title
    || '文稿'
  let body = input.markdown?.trim() || ''
  if (!body && input.documentSession) {
    body = sessionToMarkdown(input.documentSession)
  }
  if (!body && input.html) {
    body = input.html.replace(/<[^>]+>/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
  }
  if (!body) {
    return { success: false, error: '没有可导出的正文内容' }
  }

  const templateId = input.documentSession?.selectedTemplateSkillId ?? 'document.template.general'
  const header = `---\ntitle: ${title}\ntemplateSkillId: ${templateId}\n---\n\n`
  const full = header + body

  try {
    const filename = sanitizeFilename(title, 'md')
    const artifact = saveSkillArtifact({
      userId: input.userId,
      workspacePath: input.workspacePath,
      skillId: 'web.markdown.export',
      type: 'document',
      title: `${title} (Markdown)`,
      filename,
      format: 'md',
      content: full,
    })
    return { success: true, artifact }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

/** 供 routes 使用 */
export async function runExportMarkdownSkillFromRequest(
  userId: string,
  body: Record<string, unknown>,
): Promise<ExportMarkdownResult> {
  const workspacePath = String(body.workspacePath ?? (body.params as Record<string, unknown>)?.workspacePath ?? '')
  const params = (body.params ?? body) as Record<string, unknown>
  return runExportMarkdownSkill({
    userId,
    workspacePath,
    title: String(params.title ?? ''),
    markdown: String(params.markdown ?? ''),
    html: String(params.html ?? ''),
    documentSession: params.documentSession as WebDocumentSessionJson | undefined,
    format: String(params.format ?? 'md'),
  })
}
