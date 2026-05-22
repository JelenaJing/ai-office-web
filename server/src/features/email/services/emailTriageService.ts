import type { StoredEmailAccount } from './emailStore'
import { fetchInbox, fetchMessage } from './emailMvp'
import type { EmailTriageResult } from './emailTriageTaskStore'

export const EMAIL_TRIAGE_PARTIAL_MISSING = [
  'Electron/public-review LLM batch triage prompt is not yet ported to Web server',
  'attachment to Artifact conversion is not yet handled by this triage task',
  'bulk recipient resolver and salutation generation are not yet ported',
] as const

export interface RunEmailTriageInput {
  account: StoredEmailAccount
  limit?: number
  isCancelled?: () => boolean
  onStep?: (message: string, progress: number, results: EmailTriageResult[]) => void
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
    status: 'success',
    partialMissing: [...EMAIL_TRIAGE_PARTIAL_MISSING],
  }
}

export async function runEmailUnreadTriage(input: RunEmailTriageInput): Promise<EmailTriageResult[]> {
  assertNotCancelled(input)
  input.onStep?.('正在拉取未读邮件…', 10, [])
  const inbox = await fetchInbox(input.account, input.limit ?? 20)
  const unread = inbox.filter((mail) => mail.unread)
  const results: EmailTriageResult[] = []

  for (let i = 0; i < unread.length; i++) {
    assertNotCancelled(input)
    const summary = unread[i]
    input.onStep?.(`正在分析邮件：${summary.subject}`, 15 + Math.round((i / Math.max(unread.length, 1)) * 75), results)
    const detail = await fetchMessage(input.account, summary.id)
    results.push(classifyMessage({
      id: detail.id,
      from: detail.from,
      subject: detail.subject,
      body: detail.body,
    }))
  }

  input.onStep?.('未读邮件整理完成', 100, results)
  return results
}
