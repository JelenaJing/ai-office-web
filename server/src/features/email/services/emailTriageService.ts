import type { StoredEmailAccount } from './emailStore'
import { fetchInbox, fetchMessage, fetchMessageAttachment } from './emailMvp'
import type { EmailTriageResult } from './emailTriageTaskStore'
import {
  buildSalutation,
  createEmailAttachmentArtifact,
  createEmailDraftArtifact,
} from './emailArtifacts'

export const EMAIL_TRIAGE_PARTIAL_MISSING = [
  'Electron/public-review LLM batch triage prompt is not yet ported to Web server',
  'bulk send execution remains manual approval only on Web',
] as const

export interface RunEmailTriageInput {
  account: StoredEmailAccount
  userId?: string
  workspacePath?: string
  limit?: number
  isCancelled?: () => boolean
  onStep?: (
    message: string,
    progress: number,
    results: EmailTriageResult[],
    metadata?: { cacheKey?: string; sourceMessageCount?: number },
  ) => void
}

function assertNotCancelled(input: Pick<RunEmailTriageInput, 'isCancelled'>): void {
  if (input.isCancelled?.()) {
    const error = new Error('邮件整理任务已取消')
    error.name = 'EmailTriageCancelledError'
    throw error
  }
}

function inferTasks(text: string): string[] {
  const tasks: string[] = []
  if (/回复|reply|respond/i.test(text)) tasks.push('回复邮件')
  if (/会议|meeting|schedule|安排|时间/i.test(text)) tasks.push('确认日程安排')
  if (/附件|attachment|review|审阅|材料/i.test(text)) tasks.push('审阅附件或材料')
  if (/截止|deadline|urgent|尽快|今天|明天/i.test(text)) tasks.push('跟进截止事项')
  return tasks
}

function classifyMessage(input: {
  id: string
  from: string
  subject: string
  body: string
}): EmailTriageResult {
  const text = `${input.subject}\n${input.body}`.trim()
  const risk = /钓鱼|密码|verify.*account|suspended|phishing/i.test(text)
  const urgent = /紧急|尽快|今天|明天|urgent|asap|deadline/i.test(text)
  const needsReply = /请回复|回复|确认|reply|confirm|could you|please/i.test(text)
  const tasks = inferTasks(text)
  const category: EmailTriageResult['category'] = risk
    ? 'risk'
    : needsReply
    ? 'reply_required'
    : tasks.length > 0
    ? 'action_required'
    : 'read_only'
  const summarySource = input.body || input.subject
  const summary = summarySource.replace(/\s+/g, ' ').slice(0, 120) || '（无摘要）'
  const replyDraft = needsReply && !risk
    ? `您好：\n\n已收到您的邮件。关于“${input.subject || '相关事项'}”，我会尽快确认并回复进一步信息。\n\n祝好！`
    : undefined
  const salutation = replyDraft ? buildSalutation(input.from) : undefined

  return {
    messageId: input.id,
    subject: input.subject,
    from: input.from,
    priority: urgent || risk ? 'high' : tasks.length > 0 || needsReply ? 'normal' : 'low',
    urgency: urgent ? 'urgent' : 'normal',
    category,
    summary,
    needsReply,
    riskLevel: risk ? 'high' : 'none',
    tasks,
    replyDraft,
    salutation,
    attachmentArtifacts: [],
    relationships: [],
    status: 'success',
    partialMissing: [...EMAIL_TRIAGE_PARTIAL_MISSING],
  }
}

export async function runEmailUnreadTriage(input: RunEmailTriageInput): Promise<EmailTriageResult[]> {
  assertNotCancelled(input)
  const cacheKey = `email-triage:${Date.now()}`
  input.onStep?.('正在拉取未读邮件…', 10, [], { cacheKey, sourceMessageCount: 0 })
  const inbox = await fetchInbox(input.account, input.limit ?? 20)
  const unread = inbox.filter((mail) => mail.unread)
  const results: EmailTriageResult[] = []

  for (let i = 0; i < unread.length; i++) {
    assertNotCancelled(input)
    const summary = unread[i]
    input.onStep?.(`正在分析邮件：${summary.subject}`, 15 + Math.round((i / Math.max(unread.length, 1)) * 75), results, {
      cacheKey,
      sourceMessageCount: unread.length,
    })
    const detail = await fetchMessage(input.account, summary.id)
    const result = classifyMessage({
      id: detail.id,
      from: detail.from,
      subject: detail.subject,
      body: detail.body,
    })
    if (input.userId && input.workspacePath && result.replyDraft) {
      const saved = createEmailDraftArtifact({
        userId: input.userId,
        workspacePath: input.workspacePath,
        emailId: detail.id,
        to: detail.from,
        subject: `Re: ${detail.subject || '邮件回复'}`,
        body: result.replyDraft,
      })
      result.draftArtifactId = saved.artifact.id
      result.relationships.push(saved.relationship)
    }
    if (input.userId && input.workspacePath && detail.attachments.length > 0) {
      for (const attachment of detail.attachments) {
        try {
          const content = await fetchMessageAttachment(input.account, detail.id, attachment.id)
          const saved = createEmailAttachmentArtifact({
            userId: input.userId,
            workspacePath: input.workspacePath,
            emailId: detail.id,
            filename: content.filename,
            contentType: content.contentType,
            content: content.content,
          })
          result.attachmentArtifacts.push({
            attachmentId: attachment.id,
            filename: content.filename,
            artifactId: saved.artifact.id,
            status: 'saved',
          })
          result.relationships.push(saved.relationship)
        } catch (error) {
          result.attachmentArtifacts.push({
            attachmentId: attachment.id,
            filename: attachment.filename,
            status: 'failed',
            error: error instanceof Error ? error.message : String(error),
          })
        }
      }
    }
    results.push(result)
  }

  input.onStep?.('未读邮件整理完成', 100, results, { cacheKey, sourceMessageCount: unread.length })
  return results
}
