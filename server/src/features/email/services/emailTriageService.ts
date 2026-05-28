import { createHash } from 'crypto'
import { getLlmModel, invokeLlmText, isLlmConfigured } from '../../../modules/ai-gateway'
import { getCachedEmailAnalysis, setCachedEmailAnalysis } from './emailAnalysisCacheStore'
import { stringifyJsonSafe } from '../../../lib/jsonSafe'
import type { StoredEmailAccount } from './emailStore'
import { normalizeEmailBody } from './emailBodyNormalization'
import { fetchInbox, fetchMessage } from './emailMvp'
import { searchKnowledgeCitation } from '../../knowledge/services/knowledgeSearchService'
import {
  emptyEmailAnalysisSummary,
  getEmailTriageTask,
  type EmailAnalysisErrorCode,
  type EmailAnalysisFailureStage,
  type EmailAnalysisJobRecord,
  type EmailAnalysisReasonCount,
  updateEmailTriageTask,
} from './emailTriageTaskStore'

export const MAIL_ANALYSIS_PROMPT_VERSION = 'email-analysis-v2'

const MAX_CONCURRENCY = Math.max(1, Math.min(3, Number(process.env.EMAIL_ANALYSIS_CONCURRENCY ?? 2)))
const MAX_BODY_LENGTH = Math.max(1200, Number(process.env.EMAIL_ANALYSIS_MAX_BODY_LENGTH ?? 6000))
const RETRY_BODY_LENGTH = Math.max(800, Number(process.env.EMAIL_ANALYSIS_RETRY_BODY_LENGTH ?? 3200))
const LLM_TIMEOUT_MS = Math.max(5_000, Number(process.env.EMAIL_ANALYSIS_LLM_TIMEOUT_MS ?? 25_000))
const LLM_RETRY_TIMEOUT_MS = Math.max(5_000, Number(process.env.EMAIL_ANALYSIS_LLM_RETRY_TIMEOUT_MS ?? 18_000))

interface RunEmailTriageInput {
  taskId: string
  account: StoredEmailAccount
  userId: string
  limit?: number
  messageIds?: string[]
  requestedMails?: RequestedMailRef[]
  force?: boolean
  isCancelled?: () => boolean
}

interface RequestedMailRef {
  mailId: string
  messageId?: string
  sourceMailKey?: string
  accountId?: string
  folder?: string
  uid?: string
  uidValidity?: string
  subject?: string
}

interface NormalizedEmailForAnalysis {
  subject: string
  from: string
  to: string
  date: string
  cleanText: string
  attachmentsSummary: Array<{ fileName: string; contentType: string; size: number }>
  bodyLength: number
  truncated: boolean
  bodyHash: string
}

interface AnalysisCoreResult {
  category: 'action_required' | 'reply_required' | 'read_only' | 'archive_candidate' | 'promotion' | 'risk' | 'unknown'
  priority: 'high' | 'medium' | 'low'
  urgency: 'urgent' | 'soon' | 'normal' | 'none'
  needsReply: boolean
  needsUserAction: boolean
  canAutoArchive: boolean
  riskLevel: 'none' | 'low' | 'medium' | 'high'
  summary: string
  reason: string
  suggestedAction: string
  emailCategory:
    | 'spam'
    | 'promotion'
    | 'system_notice'
    | 'internal_notice'
    | 'student_request'
    | 'colleague_collaboration'
    | 'task_assignment'
    | 'approval_request'
    | 'meeting_invitation'
    | 'document_review'
    | 'data_report_request'
    | 'project_update'
    | 'urgent_issue'
    | 'ordinary'
  suggestedTasks: string[]
}

interface ReplyGenerationInput {
  userId: string
  account: StoredEmailAccount
  mailId: string
  sourceMailKey?: string
  accountId?: string
  folder?: string
  userInstruction?: string
  replyTone?: 'formal' | 'friendly' | 'concise'
  replyGoal?: string
  replyGoalPreset?: string
  languageMode?: 'bilingual' | 'english_first' | 'chinese_first'
  useKnowledgeBase?: boolean
  selectedKnowledgeBaseIds?: string[]
  includeAttachments?: boolean
  existingDraftId?: string
  workspaceId?: string
  triageContext?: Record<string, unknown>
}

class EmailAnalysisStageError extends Error {
  readonly stage: EmailAnalysisFailureStage
  readonly code: EmailAnalysisErrorCode
  readonly status: 'failed' | 'skipped'
  readonly rawOutputPreview?: string
  readonly modelUnavailable: boolean

  constructor(input: {
    stage: EmailAnalysisFailureStage
    code: EmailAnalysisErrorCode
    message: string
    status?: 'failed' | 'skipped'
    rawOutputPreview?: string
    modelUnavailable?: boolean
  }) {
    super(input.message)
    this.name = 'EmailAnalysisStageError'
    this.stage = input.stage
    this.code = input.code
    this.status = input.status ?? 'failed'
    this.rawOutputPreview = input.rawOutputPreview
    this.modelUnavailable = Boolean(input.modelUnavailable)
  }
}

function nowIso(): string {
  return new Date().toISOString()
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function shortHash(value: string): string {
  return sha256(value).slice(0, 16)
}

function toSafeString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function buildSourceMailKey(input: {
  accountId?: string
  folder?: string
  uidValidity?: string
  uid?: string
  mailId?: string
  messageId?: string
}): string {
  return [
    toSafeString(input.accountId),
    toSafeString(input.folder).toLowerCase(),
    toSafeString(input.uidValidity),
    toSafeString(input.uid || input.mailId || input.messageId),
  ].join(':')
}

function resolveRequestedSourceMailKey(mail: RequestedMailRef, accountId: string): string {
  return mail.sourceMailKey || buildSourceMailKey({
    accountId: mail.accountId || accountId,
    folder: mail.folder || 'inbox',
    uidValidity: mail.uidValidity,
    uid: mail.uid,
    mailId: mail.mailId,
    messageId: mail.messageId,
  })
}

function previewText(value: string, max = 500): string {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max)
}

function assertNotCancelled(input: Pick<RunEmailTriageInput, 'isCancelled'>): void {
  if (input.isCancelled?.()) {
    const error = new Error('邮件分析任务已取消')
    error.name = 'EmailTriageCancelledError'
    throw error
  }
}

function reasonLabel(code: EmailAnalysisErrorCode): string {
  switch (code) {
    case 'FETCH_BODY_FAILED':
    case 'BODY_INCOMPLETE':
    case 'MESSAGE_NOT_FOUND':
      return '正文获取失败'
    case 'BODY_EMPTY':
    case 'EMPTY_BODY':
      return '正文为空'
    case 'HTML_CLEAN_FAILED':
      return 'HTML 清洗失败'
    case 'BODY_TOO_LONG':
      return '正文过长'
    case 'LLM_TIMEOUT':
    case 'TIMEOUT':
      return '模型超时'
    case 'MODEL_UNAVAILABLE':
    case 'AI_MODEL_ERROR':
      return '模型服务不可用'
    case 'LLM_NON_JSON':
      return '模型返回非 JSON'
    case 'JSON_PARSE_FAILED':
    case 'RESPONSE_PARSE_FAILED':
      return 'JSON 解析失败'
    case 'SAVE_FAILED':
      return '保存失败'
    case 'ALREADY_ANALYZED':
      return '已存在分析结果'
    case 'ATTACHMENT_ONLY':
      return '附件邮件已跳过'
    case 'SYSTEM_DELIVERY_NOTICE':
      return '系统退信已跳过'
    case 'MISSING_MAIL_ID':
      return '缺少 mailId'
    case 'MISSING_SOURCE_MAIL_KEY':
      return '缺少 sourceMailKey'
    case 'INVALID_ANALYSIS_PAYLOAD':
      return '分析结果格式错误'
    default:
      return '分析失败'
  }
}

function summarizeJobs(jobs: EmailAnalysisJobRecord[]): {
  total: number
  pending: number
  running: number
  done: number
  failed: number
  skipped: number
  cached: number
  failureReasons: EmailAnalysisReasonCount[]
} {
  const summary = emptyEmailAnalysisSummary()
  summary.total = jobs.length
  const reasonMap = new Map<string, EmailAnalysisReasonCount>()
  for (const job of jobs) {
    if (job.status === 'pending') summary.pending += 1
    if (job.status === 'running') summary.running += 1
    if (job.status === 'done') summary.done += 1
    if (job.status === 'failed') summary.failed += 1
    if (job.status === 'skipped') {
      summary.skipped += 1
      if (job.cacheHit) summary.cached += 1
    }
    if (job.status === 'failed' && job.errorCode) {
      const key = job.errorCode
      const current = reasonMap.get(key) ?? { key, label: reasonLabel(job.errorCode), count: 0 }
      current.count += 1
      reasonMap.set(key, current)
    }
  }
  summary.failureReasons = [...reasonMap.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
  return summary
}

function taskMessage(summary: ReturnType<typeof summarizeJobs>, modelUnavailable: boolean): string {
  if (modelUnavailable) return '模型服务暂不可用'
  if (summary.total === 0) return '没有可分析的邮件'
  if (summary.running > 0) return `正在分析 ${summary.done + summary.failed + summary.skipped}/${summary.total}`
  if (summary.failed > 0) return `分析完成：成功 ${summary.done}，失败 ${summary.failed}，跳过 ${summary.skipped}`
  return `分析完成：成功 ${summary.done}，跳过 ${summary.skipped}`
}

function syncTask(taskId: string, message?: string): void {
  const task = getEmailTriageTask(taskId)
  if (!task) return
  const summary = summarizeJobs(task.jobs)
  const finished = summary.done + summary.failed + summary.skipped
  const progress = summary.total > 0 ? Math.min(100, Math.round((finished / summary.total) * 100)) : 100
  updateEmailTriageTask(taskId, {
    jobs: [...task.jobs],
    summary,
    progress,
    message: message ?? taskMessage(summary, task.modelUnavailable),
  })
}

function stripMarkdownFence(text: string): string {
  return text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
}

function extractFirstJsonObject(text: string): string | null {
  const start = text.indexOf('{')
  if (start < 0) return null
  let depth = 0
  let inString = false
  let escaped = false
  for (let i = start; i < text.length; i += 1) {
    const ch = text[i]
    if (inString) {
      if (escaped) {
        escaped = false
      } else if (ch === '\\') {
        escaped = true
      } else if (ch === '"') {
        inString = false
      }
      continue
    }
    if (ch === '"') {
      inString = true
      continue
    }
    if (ch === '{') depth += 1
    if (ch === '}') {
      depth -= 1
      if (depth === 0) return text.slice(start, i + 1)
    }
  }
  return null
}

function repairJson(text: string): string {
  return text
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/,\s*([}\]])/g, '$1')
    .replace(/[\u0000-\u0019]+/g, ' ')
    .trim()
}

function safeParseJson(raw: string): Record<string, unknown> {
  const cleaned = stripMarkdownFence(raw)
  try {
    return JSON.parse(cleaned) as Record<string, unknown>
  } catch {
    const first = extractFirstJsonObject(cleaned)
    if (!first) {
      throw new EmailAnalysisStageError({
        stage: 'llm_response',
        code: 'LLM_NON_JSON',
        message: '模型返回内容不是 JSON 对象',
        rawOutputPreview: previewText(cleaned),
      })
    }
    try {
      return JSON.parse(first) as Record<string, unknown>
    } catch {
      try {
        return JSON.parse(repairJson(first)) as Record<string, unknown>
      } catch {
        throw new EmailAnalysisStageError({
          stage: 'json_parse',
          code: 'JSON_PARSE_FAILED',
          message: '模型返回 JSON 解析失败',
          rawOutputPreview: previewText(cleaned),
        })
      }
    }
  }
}

function decodeQuotedPrintable(text: string): string {
  return text
    .replace(/=\r?\n/g, '')
    .replace(/=([A-Fa-f0-9]{2})/g, (_match, hex) => {
      try {
        return Buffer.from(hex, 'hex').toString('utf-8')
      } catch {
        return ''
      }
    })
}

function looksLikeBase64(text: string): boolean {
  const compact = text.replace(/\s+/g, '')
  return compact.length > 40 && compact.length % 4 === 0 && /^[A-Za-z0-9+/=]+$/.test(compact)
}

function decodeTransferEncoding(text: string): string {
  const trimmed = String(text || '').trim()
  if (!trimmed) return ''
  const quotedPrintableDecoded = decodeQuotedPrintable(trimmed)
  if (quotedPrintableDecoded && quotedPrintableDecoded !== trimmed && /[^\x20-\x7E]/.test(quotedPrintableDecoded)) {
    return quotedPrintableDecoded
  }
  if (looksLikeBase64(trimmed)) {
    try {
      const decoded = Buffer.from(trimmed.replace(/\s+/g, ''), 'base64').toString('utf-8')
      if (/[A-Za-z\u4e00-\u9fff]/.test(decoded)) return decoded
    } catch {
      // ignore
    }
  }
  return trimmed
}

function normalizeEmailForAnalysis(input: {
  subject: string
  from: string
  to: string
  date: string
  body: string
  htmlBody?: string
  attachments: Array<{ filename: string; contentType: string; size: number }>
}): NormalizedEmailForAnalysis {
  const decodedBody = decodeTransferEncoding(input.body)
  const decodedHtml = decodeTransferEncoding(input.htmlBody || '')
  const normalizedBody = normalizeEmailBody({
    text: decodedBody,
    html: decodedHtml,
    previewLength: Math.min(MAX_BODY_LENGTH, 200),
  })
  if (!normalizedBody.cleanText && (input.body || input.htmlBody)) {
    throw new EmailAnalysisStageError({
      stage: 'normalize',
      code: 'HTML_CLEAN_FAILED',
      message: 'HTML 邮件转换纯文本失败',
    })
  }
  const cleaned = normalizedBody.cleanText
  if (!cleaned) {
    throw new EmailAnalysisStageError({
      stage: 'normalize',
      code: 'BODY_EMPTY',
      message: '邮件正文为空',
      status: 'skipped',
    })
  }
  const bodyLength = cleaned.length
  const truncated = bodyLength > MAX_BODY_LENGTH
  return {
    subject: input.subject,
    from: input.from,
    to: input.to,
    date: input.date,
    cleanText: truncated ? cleaned.slice(0, MAX_BODY_LENGTH).trim() : cleaned,
    attachmentsSummary: input.attachments.map((attachment) => ({
      fileName: attachment.filename,
      contentType: attachment.contentType,
      size: attachment.size,
    })),
    bodyLength,
    truncated,
    bodyHash: shortHash(cleaned),
  }
}

function asTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item || '').trim()).filter(Boolean) : []
}

function summarizeAttachments(attachments: Array<{ filename: string; contentType: string; size: number }>): string {
  if (attachments.length === 0) return ''
  return attachments
    .slice(0, 6)
    .map((attachment) => `${attachment.filename}（${attachment.contentType || '未知类型'}，${Math.max(1, Math.round(attachment.size / 1024))} KB）`)
    .join('；')
}

function resolveCachedReplyTriage(input: {
  userId: string
  accountId: string
  folder: string
  mailId: string
  messageUid: string
  bodyHash: string
}): Record<string, unknown> | null {
  const cacheKey = `${input.accountId}:${input.folder}:${input.messageUid}:${input.bodyHash}:${MAIL_ANALYSIS_PROMPT_VERSION}`
  return getCachedEmailAnalysis(input.userId, cacheKey)?.result ?? null
}

function buildReplyTriageBlock(triage: Record<string, unknown> | null | undefined): string {
  if (!triage) return ''
  const lines = [
    asTrimmedString(triage.summary) ? `摘要：${asTrimmedString(triage.summary)}` : '',
    asTrimmedString(triage.reason) ? `判断原因：${asTrimmedString(triage.reason)}` : '',
    asTrimmedString(triage.suggestedAction) ? `建议动作：${asTrimmedString(triage.suggestedAction)}` : '',
    asTrimmedString(triage.category) ? `分类：${asTrimmedString(triage.category)}` : '',
    asTrimmedString(triage.emailCategory) ? `邮件类型：${asTrimmedString(triage.emailCategory)}` : '',
    asTrimmedString(triage.urgency) ? `紧急度：${asTrimmedString(triage.urgency)}` : '',
    asTrimmedString(triage.deadline) ? `截止信息：${asTrimmedString(triage.deadline)}` : '',
  ].filter(Boolean)
  return lines.length > 0 ? `邮件 AI 分析结果：\n${lines.join('\n')}` : ''
}

function buildKnowledgeSummary(chunks: Awaited<ReturnType<typeof searchKnowledgeCitation>>['chunks']): string {
  if (chunks.length === 0) return ''
  return chunks
    .slice(0, 5)
    .map((chunk, index) => `[资料 ${index + 1}] ${chunk.title}\n${chunk.excerpt}`)
    .join('\n\n')
}

function languageModeInstruction(mode: ReplyGenerationInput['languageMode']): string {
  if (mode === 'chinese_first') {
    return [
      '请输出中英双语草稿，并将中文版本放在前面，英文版本放在后面。',
      '使用如下结构：',
      '中文：',
      '<中文草稿>',
      '',
      'English:',
      '<English draft>',
    ].join('\n')
  }
  return [
    '请输出中英双语草稿，并将英文版本放在前面，中文版本放在后面。',
    '使用如下结构：',
    'English:',
    '<English draft>',
    '',
    '中文：',
    '<中文草稿>',
  ].join('\n')
}

function buildReplyFallback(input: {
  fromName: string
  subject: string
  userInstruction: string
  languageMode: NonNullable<ReplyGenerationInput['languageMode']>
}): string {
  const english = [
    `Dear ${input.fromName || 'there'},`,
    '',
    `Thank you for your email regarding "${input.subject || 'the matter'}". I have received your message and will handle it carefully.`,
    input.userInstruction ? `I will also take into account the following note: ${input.userInstruction}` : 'If any key information is still missing, I will follow up for clarification before making a commitment.',
    '',
    'Best regards,',
    'AI Office User',
  ].join('\n')
  const chinese = [
    `${input.fromName || '您好'}：`,
    '',
    `感谢您的来信，关于“${input.subject || '相关事项'}”我已收到并会谨慎处理。`,
    input.userInstruction ? `我会结合以下补充要求起草正式回复：${input.userInstruction}` : '如仍有信息不足之处，我会先礼貌说明并请对方补充，再作进一步确认。',
    '',
    '祝好！',
    'AI Office User',
  ].join('\n')
  return input.languageMode === 'chinese_first'
    ? `中文：\n\n${chinese}\n\nEnglish:\n\n${english}`
    : `English:\n\n${english}\n\n中文：\n\n${chinese}`
}

export async function generateEmailReplyDraft(input: ReplyGenerationInput): Promise<{
  draftId: string
  draftBody: string
  subject: string
  requirements: {
    userInstruction: string
    replyTone: 'formal' | 'friendly' | 'concise'
    replyGoal: string
    replyGoalPreset: string
    languageMode: 'bilingual' | 'english_first' | 'chinese_first'
    useKnowledgeBase: boolean
    selectedKnowledgeBaseIds: string[]
    includeAttachments: boolean
    knowledgeMode: 'workspace' | 'manual' | 'none'
    mergeMode: 'replace' | 'append'
  }
  knowledgeSummary?: string
  attachmentSummary?: string
  warnings: string[]
  sourceRefs: Array<{ id: string; title: string; kind: 'knowledge' | 'attachment' }>
}> {
  const detail = await fetchMessage(input.account, input.mailId)
  const folder = asTrimmedString(input.folder).toUpperCase() || 'INBOX'
  const normalized = normalizeEmailForAnalysis({
    subject: detail.subject,
    from: detail.from,
    to: detail.to,
    date: detail.receivedAt || detail.internalDate || detail.timestamp,
    body: detail.bodyText || detail.body || '',
    htmlBody: detail.bodyHtml || detail.htmlBody || '',
    attachments: detail.attachments.map((attachment) => ({
      filename: attachment.filename,
      contentType: attachment.contentType,
      size: attachment.size,
    })),
  })

  const warnings: string[] = []
  const selectedKnowledgeBaseIds = asStringArray(input.selectedKnowledgeBaseIds)
  const useKnowledgeBase = Boolean(input.useKnowledgeBase)
  const includeAttachments = input.includeAttachments !== false
  const replyTone: 'formal' | 'friendly' | 'concise' =
    input.replyTone === 'friendly' || input.replyTone === 'concise' ? input.replyTone : 'formal'
  const languageMode: 'bilingual' | 'english_first' | 'chinese_first' =
    input.languageMode === 'chinese_first' || input.languageMode === 'english_first' ? input.languageMode : 'bilingual'
  const replyGoal = asTrimmedString(input.replyGoal) || '礼貌回复并基于事实说明情况'
  const replyGoalPreset = asTrimmedString(input.replyGoalPreset) || 'custom'
  const userInstruction = asTrimmedString(input.userInstruction)
  const knowledgeMode: 'workspace' | 'manual' | 'none' =
    useKnowledgeBase ? (selectedKnowledgeBaseIds.length > 0 ? 'manual' : 'workspace') : 'none'
  const requirements: {
    userInstruction: string
    replyTone: 'formal' | 'friendly' | 'concise'
    replyGoal: string
    replyGoalPreset: string
    languageMode: 'bilingual' | 'english_first' | 'chinese_first'
    useKnowledgeBase: boolean
    selectedKnowledgeBaseIds: string[]
    includeAttachments: boolean
    knowledgeMode: 'workspace' | 'manual' | 'none'
    mergeMode: 'replace' | 'append'
  } = {
    userInstruction,
    replyTone,
    replyGoal,
    replyGoalPreset,
    languageMode,
    useKnowledgeBase,
    selectedKnowledgeBaseIds,
    includeAttachments,
    knowledgeMode,
    mergeMode: 'replace' as const,
  }

  const sourceMailKey = asTrimmedString(input.sourceMailKey) || buildSourceMailKey({
    accountId: input.account.user,
    folder,
    uidValidity: detail.uidValidity,
    uid: detail.uid,
    mailId: input.mailId,
    messageId: detail.messageId,
  })

  const triage =
    (input.triageContext && typeof input.triageContext === 'object' ? input.triageContext : null)
    || resolveCachedReplyTriage({
      userId: input.userId,
      accountId: input.account.user,
      folder,
      mailId: input.mailId,
      messageUid: detail.uid || input.mailId,
      bodyHash: normalized.bodyHash,
    })

  let knowledgeChunks: Awaited<ReturnType<typeof searchKnowledgeCitation>>['chunks'] = []
  if (useKnowledgeBase) {
    try {
      const knowledgeResult = await searchKnowledgeCitation({
        userId: input.userId,
        query: [detail.subject, normalized.cleanText.slice(0, 800), userInstruction, asTrimmedString(triage?.summary)]
          .filter(Boolean)
          .join('\n'),
        workspaceId: asTrimmedString(input.workspaceId),
        selectedSourceIds: selectedKnowledgeBaseIds,
        topK: 5,
      })
      knowledgeChunks = knowledgeResult.chunks
      if (knowledgeResult.warnings?.length) warnings.push(...knowledgeResult.warnings)
      if (knowledgeChunks.length === 0) warnings.push('未找到高度相关的知识库内容，已仅根据邮件内容生成。')
    } catch (error) {
      warnings.push('知识库暂不可用，已仅根据邮件内容生成。')
      console.warn('[EmailReplyDraft] knowledge search failed:', error instanceof Error ? error.message : String(error))
    }
  }

  const attachmentSummary = includeAttachments ? summarizeAttachments(detail.attachments.map((attachment) => ({
    filename: attachment.filename,
    contentType: attachment.contentType,
    size: attachment.size,
  }))) : ''

  const promptBlocks = [
    '你是 AI Office 的邮件预回复助手。请基于真实邮件内容生成一份“可编辑草稿”，不能自动发送。',
    `回复语气：${replyTone}`,
    `回复目标：${replyGoal}`,
    languageModeInstruction(languageMode),
    '生成要求：',
    '1. 必须优先依据原邮件事实、邮件 AI 分析结果、用户补充说明、知识库材料和附件摘要。',
    '2. 不要编造事实，不要替用户承诺无法确认的时间、结果、审批意见或资源安排。',
    '3. 如果信息不足，请委婉说明当前无法确认，并请求对方补充必要信息。',
    '4. 涉及制度、金额、审批、采购、会议安排、材料提交时必须谨慎表述。',
    '5. 如果使用了知识库，仅内部保留引用依据，不要把 sourceRefs、chunkId、技术字段写进邮件正文。',
    '',
    `原邮件主题：${detail.subject || '（无主题）'}`,
    `发件人：${detail.from || '未知发件人'}`,
    `收件人：${detail.to || input.account.user}`,
    `原邮件正文：\n${normalized.cleanText}`,
    buildReplyTriageBlock(triage),
    userInstruction ? `用户补充说明：\n${userInstruction}` : '',
    knowledgeChunks.length > 0 ? `可用知识库材料：\n${buildKnowledgeSummary(knowledgeChunks)}` : '',
    attachmentSummary ? `可用附件摘要：\n${attachmentSummary}` : '',
  ].filter(Boolean)

  const draftBody = isLlmConfigured()
    ? (await invokeLlmText(
        [
          { role: 'system', content: promptBlocks.slice(0, 10).join('\n') },
          { role: 'user', content: promptBlocks.slice(10).join('\n\n') },
        ],
        { temperature: replyTone === 'friendly' ? 0.45 : 0.3, maxTokens: 1600 },
      )).trim()
    : buildReplyFallback({
        fromName: detail.from || 'there',
        subject: detail.subject,
        userInstruction,
        languageMode,
      })

  if (!isLlmConfigured()) {
    warnings.push('模型暂不可用，已返回保守版预回复草稿。')
  }

  return {
    draftId: `reply-${shortHash(`${input.account.user}:${sourceMailKey}:${normalized.bodyHash}:${Date.now()}`)}`,
    draftBody: draftBody || buildReplyFallback({
      fromName: detail.from || 'there',
      subject: detail.subject,
      userInstruction,
      languageMode,
    }),
    subject: detail.subject,
    requirements,
    knowledgeSummary: knowledgeChunks.length > 0 ? `${knowledgeChunks.length} 条知识库材料已参考。` : undefined,
    attachmentSummary: attachmentSummary || undefined,
    warnings,
    sourceRefs: [
      ...knowledgeChunks.map((chunk) => ({ id: chunk.sourceId, title: chunk.title, kind: 'knowledge' as const })),
      ...detail.attachments.map((attachment) => ({ id: attachment.id, title: attachment.filename, kind: 'attachment' as const })),
    ],
  }
}

function hasAttachmentOnlyContent(
  normalized: NormalizedEmailForAnalysis,
  attachments: Array<{ filename: string }>,
): boolean {
  if (attachments.length === 0) return false
  return normalized.cleanText.length <= 40 && !/(请|review|回复|确认|处理|审批|签署|deadline|urgent|尽快)/i.test(normalized.cleanText)
}

function isSystemDeliveryNotice(subject: string, from: string, text: string): boolean {
  return /mailer-daemon|postmaster|delivery status notification|undelivered|退信|无法投递/i.test(`${subject}\n${from}\n${text}`)
}

function inferEmailCategory(core: AnalysisCoreResult, text: string, attachments: Array<{ fileName: string }>): AnalysisCoreResult['emailCategory'] {
  if (core.category === 'risk') return 'spam'
  if (core.category === 'promotion') return 'promotion'
  if (/meeting|面试|会议|安排时间|候选时间|available/i.test(text)) return 'meeting_invitation'
  if (/审批|approve|approval|签署|sign/i.test(text)) return 'approval_request'
  if (attachments.length > 0 && /\.(docx?|pdf|pptx?|xlsx?|csv)$/i.test(attachments.map((attachment) => attachment.fileName).join(' '))) {
    return 'document_review'
  }
  if (/学生|course|late drop|研究生|导师/i.test(text)) return 'student_request'
  if (/报告|统计|xlsx|csv|excel|报表/i.test(text)) return 'data_report_request'
  if (/通知|系统|提醒/i.test(text) || core.category === 'read_only') return 'system_notice'
  if (core.category === 'action_required') return 'task_assignment'
  if (core.category === 'reply_required') return 'colleague_collaboration'
  return 'ordinary'
}

function createSuggestedTasks(core: Pick<AnalysisCoreResult, 'category' | 'needsReply' | 'needsUserAction'>, attachments: Array<{ fileName: string }>): string[] {
  if (core.category === 'action_required') {
    const tasks = ['阅读邮件要求', '整理待办事项']
    if (attachments.length > 0) tasks.push('查看并处理附件')
    if (core.needsReply) tasks.push('回复确认处理进展')
    return tasks.slice(0, 4)
  }
  if (attachments.length > 0 && core.needsUserAction) {
    return ['查看附件内容', '确认后续处理方式']
  }
  if (core.needsReply) return ['整理回复要点', '发送邮件回复']
  return []
}

function ruleBasedAnalyze(normalized: NormalizedEmailForAnalysis): AnalysisCoreResult {
  const text = `${normalized.subject}\n${normalized.cleanText}`.toLowerCase()
  const urgent = /urgent|asap|today|tonight|立刻|紧急|今天|截止/.test(text)
  const soon = urgent || /tomorrow|尽快|明天|本周|下周|deadline/.test(text)
  const risk = /verify|password|账户异常|钓鱼|phishing|suspended/i.test(text)
  const promotion = /newsletter|unsubscribe|促销|营销|广告/i.test(text)
  const action = /请|please|安排|准备|整理|处理|跟进|review|submit|approve|confirm|reply|回复|确认/.test(text)
  const question = /\?|请问|能否|是否|could you|would you/i.test(text)
  const needsReply = question || /reply|回复|确认回信|please respond|请确认/.test(text)
  const category: AnalysisCoreResult['category'] =
    risk
      ? 'risk'
      : promotion
        ? 'promotion'
        : action
          ? 'action_required'
          : needsReply
            ? 'reply_required'
            : /notice|通知|提醒|FYI/i.test(text)
              ? 'read_only'
              : 'unknown'
  const priority: AnalysisCoreResult['priority'] =
    risk || urgent ? 'high' : category === 'read_only' || category === 'promotion' ? 'low' : 'medium'
  const urgency: AnalysisCoreResult['urgency'] = urgent ? 'urgent' : soon ? 'soon' : category === 'read_only' ? 'none' : 'normal'
  const summarySource = previewText(normalized.cleanText, 120) || normalized.subject || '邮件分析'
  const summary = previewText(summarySource.split(/[。.!?\n]/)[0] || summarySource, 80) || '邮件分析'
  return {
    category,
    priority,
    urgency,
    needsReply,
    needsUserAction: category === 'action_required',
    canAutoArchive: category === 'read_only' || category === 'promotion',
    riskLevel: risk ? 'high' : 'none',
    summary,
    reason:
      category === 'risk'
        ? '含有风险关键词'
        : category === 'promotion'
          ? '营销或订阅内容'
          : category === 'action_required'
            ? '正文包含明确处理要求'
            : category === 'reply_required'
              ? '需要回复或确认'
              : category === 'read_only'
                ? '偏通知类内容'
                : '内容较模糊，已规则降级判断',
    suggestedAction:
      category === 'risk'
        ? '谨慎核验来源，不直接点击链接'
        : category === 'promotion'
          ? '可忽略或归档'
          : category === 'action_required'
            ? '优先阅读并处理邮件要求'
            : category === 'reply_required'
              ? '整理要点后回复'
              : category === 'read_only'
                ? '阅读后视情况归档'
                : '建议人工确认',
    emailCategory: 'ordinary',
    suggestedTasks: [],
  }
}

function validateModelOutput(
  parsed: Record<string, unknown>,
  normalized: NormalizedEmailForAnalysis,
): AnalysisCoreResult {
  const fallback = ruleBasedAnalyze(normalized)
  const allowedCategory: AnalysisCoreResult['category'][] = ['action_required', 'reply_required', 'read_only', 'archive_candidate', 'promotion', 'risk', 'unknown']
  const allowedPriority: AnalysisCoreResult['priority'][] = ['high', 'medium', 'low']
  const allowedUrgency: AnalysisCoreResult['urgency'][] = ['urgent', 'soon', 'normal', 'none']
  const allowedRisk: AnalysisCoreResult['riskLevel'][] = ['none', 'low', 'medium', 'high']
  const category = allowedCategory.includes(parsed.category as AnalysisCoreResult['category'])
    ? (parsed.category as AnalysisCoreResult['category'])
    : fallback.category
  const priority = allowedPriority.includes(parsed.priority as AnalysisCoreResult['priority'])
    ? (parsed.priority as AnalysisCoreResult['priority'])
    : fallback.priority
  const urgency = allowedUrgency.includes(parsed.urgency as AnalysisCoreResult['urgency'])
    ? (parsed.urgency as AnalysisCoreResult['urgency'])
    : fallback.urgency
  const riskLevel = allowedRisk.includes(parsed.riskLevel as AnalysisCoreResult['riskLevel'])
    ? (parsed.riskLevel as AnalysisCoreResult['riskLevel'])
    : fallback.riskLevel
  const text = `${normalized.subject}\n${normalized.cleanText}`
  const emailCategory = typeof parsed.emailCategory === 'string' && parsed.emailCategory.trim()
    ? (parsed.emailCategory.trim() as AnalysisCoreResult['emailCategory'])
    : inferEmailCategory({ ...fallback, category, priority, urgency, riskLevel }, text, normalized.attachmentsSummary)
  const suggestedTasks = Array.isArray(parsed.suggestedTasks)
    ? parsed.suggestedTasks.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).slice(0, 5)
    : createSuggestedTasks({ category, needsReply: Boolean(parsed.needsReply ?? fallback.needsReply), needsUserAction: Boolean(parsed.needsUserAction ?? fallback.needsUserAction) }, normalized.attachmentsSummary)
  return {
    category,
    priority,
    urgency,
    needsReply: Boolean(parsed.needsReply ?? fallback.needsReply ?? category === 'reply_required'),
    needsUserAction: Boolean(parsed.needsUserAction ?? fallback.needsUserAction ?? category === 'action_required'),
    canAutoArchive: Boolean(parsed.canAutoArchive ?? fallback.canAutoArchive),
    riskLevel,
    summary: previewText(typeof parsed.summary === 'string' ? parsed.summary : fallback.summary, 80) || fallback.summary,
    reason: previewText(typeof parsed.reason === 'string' ? parsed.reason : fallback.reason, 80) || fallback.reason,
    suggestedAction: previewText(typeof parsed.suggestedAction === 'string' ? parsed.suggestedAction : fallback.suggestedAction, 80) || fallback.suggestedAction,
    emailCategory,
    suggestedTasks,
  }
}

function buildActionPlan(core: AnalysisCoreResult): Record<string, unknown> {
  const intentType =
    core.category === 'risk' || core.emailCategory === 'spam'
      ? 'spam'
      : core.emailCategory === 'document_review'
        ? 'attachment_review'
        : core.needsUserAction
          ? 'task'
          : core.needsReply
            ? 'question'
            : 'ordinary'
  return {
    intentType,
    title: core.summary,
    brief: core.suggestedAction,
    replyStrategy: {
      shouldReply: core.needsReply,
      tone: core.category === 'risk' ? 'neutral' : 'formal',
      reason: core.reason,
    },
    ...(intentType === 'task'
      ? {
          taskChecklist: core.suggestedTasks.map((text, index) => ({
            id: shortHash(`${index}:${text}`),
            text,
            done: false,
            deadline: null,
          })),
        }
      : {}),
  }
}

function buildTodos(
  messageId: string,
  accountId: string,
  core: AnalysisCoreResult,
): Array<Record<string, unknown>> {
  return core.suggestedTasks.map((title, index) => ({
    id: `${messageId}:${shortHash(`${index}:${title}`)}`,
    title,
    type: core.emailCategory === 'document_review' ? 'review_attachment' : core.needsReply ? 'reply_email' : 'prepare_material',
    priority: core.priority,
    deadline: null,
    sourceEmailId: messageId,
    targetWorkspace: core.emailCategory === 'document_review' ? 'document' : core.needsReply ? 'mail' : 'none',
    status: 'pending',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    accountId,
  }))
}

function buildSuccessResult(input: {
  accountId: string
  mailId: string
  messageId?: string
  sourceMailKey?: string
  folder: string
  normalized: NormalizedEmailForAnalysis
  core: AnalysisCoreResult
  modelName: string
}): Record<string, unknown> {
  const createdAt = nowIso()
  return {
    mailId: input.mailId,
    messageId: input.messageId,
    sourceMailKey: input.sourceMailKey,
    mailKey: input.sourceMailKey,
    accountId: input.accountId,
    folder: input.folder,
    promptVersion: MAIL_ANALYSIS_PROMPT_VERSION,
    bodyHash: input.normalized.bodyHash,
    category: input.core.category,
    priority: input.core.priority,
    needsReply: input.core.needsReply,
    needsUserAction: input.core.needsUserAction,
    canAutoArchive: input.core.canAutoArchive,
    riskLevel: input.core.riskLevel,
    summary: input.core.summary,
    reason: input.core.reason,
    suggestedAction: input.core.suggestedAction,
    emailCategory: input.core.emailCategory,
    importance: input.core.priority,
    urgency: input.core.urgency,
    requiresReply: input.core.needsReply,
    requiresAction: input.core.needsUserAction || input.normalized.attachmentsSummary.length > 0,
    requiresKnowledgeBase: false,
    requiresAttachment: input.normalized.attachmentsSummary.length > 0,
    requiresOpenAttachment: input.normalized.attachmentsSummary.some((attachment) =>
      /\.(docx?|pdf|pptx?|xlsx?|csv)$/i.test(attachment.fileName),
    ),
    suggestedKnowledgeQueries: [],
    todos: buildTodos(input.mailId, input.accountId, input.core),
    replyIntent: input.core.needsReply ? (input.normalized.attachmentsSummary.length > 0 ? 'send_attachment' : 'direct_answer') : 'none',
    draftReply: undefined,
    riskFlags: input.core.riskLevel !== 'none' ? [`风险等级：${input.core.riskLevel}`] : [],
    analyzedAt: createdAt,
    actionPlan: buildActionPlan(input.core),
    status: 'success',
    modelName: input.modelName,
    bodyLength: input.normalized.bodyLength,
    truncated: input.normalized.truncated,
    createdAt,
    updatedAt: createdAt,
  }
}

function buildSkippedResult(input: {
  accountId: string
  mailId: string
  messageId?: string
  sourceMailKey?: string
  folder: string
  bodyHash?: string
  code: 'BODY_EMPTY' | 'ATTACHMENT_ONLY' | 'SYSTEM_DELIVERY_NOTICE'
  message: string
  bodyLength?: number
  truncated?: boolean
}): Record<string, unknown> {
  const createdAt = nowIso()
  const skipReason =
    input.code === 'ATTACHMENT_ONLY'
      ? 'attachment_only'
      : input.code === 'SYSTEM_DELIVERY_NOTICE'
        ? 'system_delivery_notice'
        : 'empty_mail'
  return {
    mailId: input.mailId,
    messageId: input.messageId,
    sourceMailKey: input.sourceMailKey,
    mailKey: input.sourceMailKey,
    accountId: input.accountId,
    folder: input.folder,
    promptVersion: MAIL_ANALYSIS_PROMPT_VERSION,
    bodyHash: input.bodyHash ?? '',
    category: 'read_only',
    priority: 'low',
    needsReply: false,
    needsUserAction: false,
    canAutoArchive: true,
    riskLevel: 'none',
    summary: input.message,
    reason: input.message,
    suggestedAction: input.message,
    emailCategory: input.code === 'SYSTEM_DELIVERY_NOTICE' ? 'system_notice' : 'ordinary',
    importance: 'low',
    urgency: 'none',
    requiresReply: false,
    requiresAction: false,
    requiresKnowledgeBase: false,
    requiresAttachment: false,
    requiresOpenAttachment: false,
    suggestedKnowledgeQueries: [],
    todos: [],
    replyIntent: 'none',
    riskFlags: [],
    analyzedAt: createdAt,
    status: 'skipped',
    skipReason,
    errorMessage: input.message,
    bodyLength: input.bodyLength,
    truncated: input.truncated,
    createdAt,
    updatedAt: createdAt,
  }
}

function buildFailedResult(input: {
  accountId: string
  mailId: string
  messageId?: string
  sourceMailKey?: string
  folder: string
  bodyHash?: string
  message: string
  code: EmailAnalysisErrorCode
  stage: EmailAnalysisFailureStage
  bodyLength?: number
  truncated?: boolean
}): Record<string, unknown> {
  const createdAt = nowIso()
  return {
    mailId: input.mailId,
    messageId: input.messageId,
    sourceMailKey: input.sourceMailKey,
    mailKey: input.sourceMailKey,
    accountId: input.accountId,
    folder: input.folder,
    promptVersion: MAIL_ANALYSIS_PROMPT_VERSION,
    bodyHash: input.bodyHash ?? '',
    category: 'unknown',
    priority: 'medium',
    needsReply: false,
    needsUserAction: false,
    canAutoArchive: false,
    riskLevel: 'none',
    summary: '邮件分析失败',
    reason: input.message,
    suggestedAction: '稍后重试分析',
    emailCategory: 'ordinary',
    importance: 'medium',
    urgency: 'none',
    requiresReply: false,
    requiresAction: false,
    requiresKnowledgeBase: false,
    requiresAttachment: false,
    requiresOpenAttachment: false,
    suggestedKnowledgeQueries: [],
    todos: [],
    replyIntent: 'none',
    riskFlags: [],
    analyzedAt: createdAt,
    status: 'failed',
    errorMessage: input.message,
    analysisStage: input.stage,
    errorCode: input.code,
    bodyLength: input.bodyLength,
    truncated: input.truncated,
    createdAt,
    updatedAt: createdAt,
  }
}

function buildPrompt(normalized: NormalizedEmailForAnalysis, mode: 'normal' | 'strict'): string {
  return [
    '你是邮件分析助手。只允许输出一个 JSON 对象，不要输出 Markdown、代码块、解释、前后缀文字。',
    '如果无法确定字段，请使用默认值，不要省略字段。',
    '字段必须包含：category, priority, urgency, needsReply, needsUserAction, canAutoArchive, riskLevel, summary, reason, suggestedAction, emailCategory, suggestedTasks。',
    'category 只能是 action_required/reply_required/read_only/archive_candidate/promotion/risk/unknown。',
    'priority 只能是 high/medium/low。',
    'urgency 只能是 urgent/soon/normal/none。',
    'riskLevel 只能是 none/low/medium/high。',
    'summary 不超过 80 字；reason 和 suggestedAction 尽量简洁；suggestedTasks 返回字符串数组。',
    mode === 'strict'
      ? '严格要求：除了 JSON 对象本身，任何多余字符都不要输出。'
      : '请结合邮件正文判断是否需要回复、是否需要用户操作、是否可以归档。',
    '',
    `邮件主题：${normalized.subject}`,
    `发件人：${normalized.from}`,
    `收件人：${normalized.to}`,
    `时间：${normalized.date}`,
    `附件摘要：${normalized.attachmentsSummary.length > 0 ? stringifyJsonSafe(normalized.attachmentsSummary) : '[]'}`,
    '邮件正文：',
    mode === 'strict' ? normalized.cleanText.slice(0, RETRY_BODY_LENGTH) : normalized.cleanText,
  ].join('\n')
}

function isModelUnavailableError(error: Error): boolean {
  return /LLM 未配置|401|403|429|500|502|503|504|ECONNREFUSED|ENOTFOUND|network|baseUrl/i.test(error.message)
}

async function analyzeWithRetries(normalized: NormalizedEmailForAnalysis): Promise<{
  core: AnalysisCoreResult
  modelName: string
  retryCount: number
}> {
  const modelName = getLlmModel()
  if (!isLlmConfigured()) {
    throw new EmailAnalysisStageError({
      stage: 'llm_request',
      code: 'MODEL_UNAVAILABLE',
      message: '模型服务暂不可用',
      modelUnavailable: true,
    })
  }
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    if (attempt === 3) {
      return { core: ruleBasedAnalyze(normalized), modelName: 'rule-fallback', retryCount: 2 }
    }
    try {
      const raw = await invokeLlmText(
        [
          {
            role: 'system',
            content: '你是稳定的邮件分析服务，请严格输出 JSON 对象。',
          },
          {
            role: 'user',
            content: buildPrompt(normalized, attempt === 2 ? 'strict' : 'normal'),
          },
        ],
        {
          temperature: attempt === 2 ? 0 : 0.2,
          maxTokens: 800,
          timeoutMs: attempt === 2 ? LLM_RETRY_TIMEOUT_MS : LLM_TIMEOUT_MS,
        },
      )
      const parsed = safeParseJson(raw)
      return {
        core: validateModelOutput(parsed, normalized),
        modelName,
        retryCount: attempt - 1,
      }
    } catch (error) {
      if (error instanceof EmailAnalysisStageError) {
        if (error.code === 'LLM_NON_JSON' || error.code === 'JSON_PARSE_FAILED') {
          if (attempt < 2) continue
          return { core: ruleBasedAnalyze(normalized), modelName: 'rule-fallback', retryCount: 2 }
        }
        throw error
      }
      const err = error instanceof Error ? error : new Error(String(error))
      if (/超时/.test(err.message)) {
        if (attempt < 2) continue
        return { core: ruleBasedAnalyze(normalized), modelName: 'rule-fallback', retryCount: 2 }
      }
      if (isModelUnavailableError(err)) {
        throw new EmailAnalysisStageError({
          stage: 'llm_request',
          code: 'MODEL_UNAVAILABLE',
          message: '模型服务暂不可用',
          modelUnavailable: true,
        })
      }
      if (attempt < 2) continue
      return { core: ruleBasedAnalyze(normalized), modelName: 'rule-fallback', retryCount: 2 }
    }
  }
  return { core: ruleBasedAnalyze(normalized), modelName: 'rule-fallback', retryCount: 2 }
}

function logJobEvent(input: {
  accountId: string
  mailbox: string
  folder: string
  mailId: string
  messageId?: string
  sourceMailKey?: string
  messageUid: string
  subject?: string
  bodyLength?: number
  truncated?: boolean
  status: string
  stage?: string
  errorCode?: string
  retryCount: number
  durationMs?: number
}): void {
  console.info(
    '[EmailAnalysis]',
    stringifyJsonSafe({
      accountId: input.accountId,
      mailbox: input.mailbox,
      folder: input.folder,
      mailId: input.mailId,
      messageId: input.messageId,
      sourceMailKey: input.sourceMailKey,
      messageUid: input.messageUid,
      subjectHash: input.subject ? shortHash(input.subject) : undefined,
      subjectPreview: input.subject ? previewText(input.subject, 50) : undefined,
      bodyLength: input.bodyLength,
      truncated: input.truncated,
      analysisStatus: input.status,
      failedStage: input.stage,
      errorCode: input.errorCode,
      retryCount: input.retryCount,
      durationMs: input.durationMs,
    }),
  )
}

function classifyUnexpectedFetchError(error: unknown): EmailAnalysisStageError {
  const message = error instanceof Error ? error.message : String(error)
  if (/邮件不存在|not found|does not exist/i.test(message)) {
    return new EmailAnalysisStageError({
      stage: 'fetch_body',
      code: 'MESSAGE_NOT_FOUND',
      message: `MESSAGE_NOT_FOUND: ${message}`,
    })
  }
  return new EmailAnalysisStageError({
    stage: 'fetch_body',
    code: 'FETCH_BODY_FAILED',
    message,
  })
}

async function processJob(
  input: RunEmailTriageInput,
  job: EmailAnalysisJobRecord,
): Promise<{ modelUnavailable: boolean }> {
  const startedAtMs = Date.now()
  job.status = 'running'
  job.startedAt = nowIso()
  job.updatedAt = job.startedAt
  syncTask(input.taskId)
  try {
    console.info('[EmailTriage] analyze request', stringifyJsonSafe({
      taskId: input.taskId,
      mailId: job.mailId,
      messageId: job.messageId,
      sourceMailKey: job.sourceMailKey,
      accountId: job.accountId,
      folder: job.folder,
      messageUid: job.messageUid,
    }))
    const detail = await fetchMessage(input.account, job.messageUid || job.mailId)
    if (!detail.body && !detail.bodyText && !detail.bodyHtml && !detail.htmlBody) {
      throw new EmailAnalysisStageError({
        stage: 'fetch_body',
        code: 'BODY_INCOMPLETE',
        message: '未获取到完整邮件正文',
      })
    }
    job.subject = detail.subject || job.subject
    job.messageId = job.messageId || detail.messageId
    job.subjectHash = detail.subject ? shortHash(detail.subject) : job.subjectHash
    const normalized = normalizeEmailForAnalysis({
      subject: detail.subject || '',
      from: detail.from || '',
      to: detail.to || input.account.user,
      date: detail.timestamp,
      body: detail.bodyText || detail.body || '',
      htmlBody: detail.bodyHtml || detail.htmlBody,
      attachments: detail.attachments.map((attachment) => ({
        filename: attachment.filename,
        contentType: attachment.contentType,
        size: attachment.size,
      })),
    })
    console.log('[EmailTriage] normalize:', stringifyJsonSafe({
      accountId: job.accountId,
      folder: job.folder,
      messageUid: job.messageUid,
      hasHtml: Boolean(detail.bodyHtml || detail.htmlBody),
      hasText: Boolean(detail.bodyText || detail.body),
      cleanTextLength: normalized.cleanText.length,
      htmlConverted: Boolean((detail.bodyHtml || detail.htmlBody) && !(detail.bodyText || detail.body)),
      truncated: normalized.truncated,
    }))
    job.bodyHash = normalized.bodyHash
    job.bodyLength = normalized.bodyLength
    job.truncated = normalized.truncated
    job.cacheKey = `${job.accountId}:${job.folder}:${job.messageUid}:${normalized.bodyHash}:${MAIL_ANALYSIS_PROMPT_VERSION}`
    if (!input.force && job.cacheKey) {
      const cached = getCachedEmailAnalysis(input.userId, job.cacheKey)
      if (cached) {
        job.status = 'skipped'
        job.cacheHit = true
        job.errorCode = 'ALREADY_ANALYZED'
        job.result = {
          ...cached.result,
          mailId: job.mailId,
          messageId: job.messageId ?? (typeof cached.result.messageId === 'string' ? cached.result.messageId : undefined),
          sourceMailKey: job.sourceMailKey || (typeof cached.result.sourceMailKey === 'string' ? cached.result.sourceMailKey : undefined),
          mailKey: job.sourceMailKey || (typeof cached.result.mailKey === 'string' ? cached.result.mailKey : undefined),
        }
        job.retryCount = 0
        job.finishedAt = nowIso()
        job.durationMs = Date.now() - startedAtMs
        job.updatedAt = job.finishedAt
        logJobEvent({
          accountId: job.accountId,
          mailbox: input.account.user,
          folder: job.folder,
          mailId: job.mailId,
          messageId: job.messageId,
          sourceMailKey: job.sourceMailKey,
          messageUid: job.messageUid,
          subject: job.subject,
          bodyLength: job.bodyLength,
          truncated: job.truncated,
          status: job.status,
          errorCode: job.errorCode,
          retryCount: job.retryCount,
          durationMs: job.durationMs,
        })
        return { modelUnavailable: false }
      }
    }

    if (hasAttachmentOnlyContent(normalized, detail.attachments)) {
      job.status = 'skipped'
      job.errorCode = 'ATTACHMENT_ONLY'
      job.result = buildSkippedResult({
        accountId: job.accountId,
        mailId: job.mailId,
        messageId: job.messageId,
        sourceMailKey: job.sourceMailKey,
        folder: job.folder,
        bodyHash: normalized.bodyHash,
        code: 'ATTACHMENT_ONLY',
        message: '附件邮件，已跳过模型分析',
        bodyLength: normalized.bodyLength,
        truncated: normalized.truncated,
      })
      job.finishedAt = nowIso()
      job.durationMs = Date.now() - startedAtMs
      job.updatedAt = job.finishedAt
        logJobEvent({
          accountId: job.accountId,
          mailbox: input.account.user,
          folder: job.folder,
          mailId: job.mailId,
          messageId: job.messageId,
          sourceMailKey: job.sourceMailKey,
          messageUid: job.messageUid,
          subject: job.subject,
        bodyLength: job.bodyLength,
        truncated: job.truncated,
        status: job.status,
        errorCode: job.errorCode,
        retryCount: 0,
        durationMs: job.durationMs,
      })
      return { modelUnavailable: false }
    }

    if (isSystemDeliveryNotice(normalized.subject, normalized.from, normalized.cleanText)) {
      job.status = 'skipped'
      job.errorCode = 'SYSTEM_DELIVERY_NOTICE'
      job.result = buildSkippedResult({
        accountId: job.accountId,
        mailId: job.mailId,
        messageId: job.messageId,
        sourceMailKey: job.sourceMailKey,
        folder: job.folder,
        bodyHash: normalized.bodyHash,
        code: 'SYSTEM_DELIVERY_NOTICE',
        message: '系统退信或自动通知，已跳过模型分析',
        bodyLength: normalized.bodyLength,
        truncated: normalized.truncated,
      })
      job.finishedAt = nowIso()
      job.durationMs = Date.now() - startedAtMs
      job.updatedAt = job.finishedAt
        logJobEvent({
          accountId: job.accountId,
          mailbox: input.account.user,
          folder: job.folder,
          mailId: job.mailId,
          messageId: job.messageId,
          sourceMailKey: job.sourceMailKey,
          messageUid: job.messageUid,
          subject: job.subject,
        bodyLength: job.bodyLength,
        truncated: job.truncated,
        status: job.status,
        errorCode: job.errorCode,
        retryCount: 0,
        durationMs: job.durationMs,
      })
      return { modelUnavailable: false }
    }

    const analyzed = await analyzeWithRetries(normalized)
    const result = buildSuccessResult({
      accountId: job.accountId,
      mailId: job.mailId,
      messageId: job.messageId,
      sourceMailKey: job.sourceMailKey,
      folder: job.folder,
      normalized,
      core: analyzed.core,
      modelName: analyzed.modelName,
    })
    try {
      if (!job.cacheKey) {
        throw new Error('cacheKey 缺失')
      }
      setCachedEmailAnalysis(input.userId, {
        cacheKey: job.cacheKey,
        accountId: job.accountId,
        folder: job.folder,
        messageUid: job.messageUid,
        bodyHash: normalized.bodyHash,
        promptVersion: MAIL_ANALYSIS_PROMPT_VERSION,
        result,
        bodyLength: normalized.bodyLength,
        truncated: normalized.truncated,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new EmailAnalysisStageError({
        stage: 'save_result',
        code: 'SAVE_FAILED',
        message: `保存分析结果失败：${message}`,
      })
    }
    job.status = 'done'
    job.retryCount = analyzed.retryCount
    job.result = result
    job.finishedAt = nowIso()
    job.durationMs = Date.now() - startedAtMs
    job.updatedAt = job.finishedAt
      logJobEvent({
        accountId: job.accountId,
        mailbox: input.account.user,
        folder: job.folder,
        mailId: job.mailId,
        messageId: job.messageId,
        sourceMailKey: job.sourceMailKey,
        messageUid: job.messageUid,
        subject: job.subject,
      bodyLength: job.bodyLength,
      truncated: job.truncated,
      status: job.status,
      retryCount: job.retryCount,
      durationMs: job.durationMs,
    })
    return { modelUnavailable: false }
  } catch (error) {
    const stageError = error instanceof EmailAnalysisStageError
      ? error
      : classifyUnexpectedFetchError(error)
    job.status = stageError.status
    job.stage = stageError.stage
    job.errorCode = stageError.code
    job.error = stageError.message
    job.rawOutputPreview = stageError.rawOutputPreview
    console.warn('[EmailTriage] analyze failed', stringifyJsonSafe({
      taskId: input.taskId,
      requestedMailId: job.mailId,
      requestedSourceMailKey: job.sourceMailKey,
      requestedMessageId: job.messageId,
      messageUid: job.messageUid,
      reason: stageError.message,
      errorCode: stageError.code,
      stage: stageError.stage,
    }))
    job.result = stageError.status === 'skipped'
      ? buildSkippedResult({
          accountId: job.accountId,
          mailId: job.mailId,
          messageId: job.messageId,
          sourceMailKey: job.sourceMailKey,
          folder: job.folder,
          bodyHash: job.bodyHash,
          code:
            stageError.code === 'BODY_EMPTY' || stageError.code === 'EMPTY_BODY'
              ? 'BODY_EMPTY'
              : stageError.code === 'SYSTEM_DELIVERY_NOTICE'
                ? 'SYSTEM_DELIVERY_NOTICE'
                : 'ATTACHMENT_ONLY',
          message: stageError.message,
          bodyLength: job.bodyLength,
          truncated: job.truncated,
        })
      : buildFailedResult({
          accountId: job.accountId,
          mailId: job.mailId,
          messageId: job.messageId,
          sourceMailKey: job.sourceMailKey,
          folder: job.folder,
          bodyHash: job.bodyHash,
          message: stageError.message,
          code: stageError.code,
          stage: stageError.stage,
          bodyLength: job.bodyLength,
          truncated: job.truncated,
        })
    job.finishedAt = nowIso()
    job.durationMs = Date.now() - startedAtMs
    job.updatedAt = job.finishedAt
    logJobEvent({
      accountId: job.accountId,
      mailbox: input.account.user,
      folder: job.folder,
      mailId: job.mailId,
      messageId: job.messageId,
      sourceMailKey: job.sourceMailKey,
      messageUid: job.messageUid,
      subject: job.subject,
      bodyLength: job.bodyLength,
      truncated: job.truncated,
      status: job.status,
      stage: job.stage,
      errorCode: job.errorCode,
      retryCount: job.retryCount,
      durationMs: job.durationMs,
    })
    return { modelUnavailable: stageError.modelUnavailable }
  } finally {
    syncTask(input.taskId)
  }
}

function markRemainingJobsModelUnavailable(input: RunEmailTriageInput): void {
  const task = getEmailTriageTask(input.taskId)
  if (!task) return
  for (const job of task.jobs) {
    if (job.status !== 'pending') continue
    job.status = 'failed'
    job.stage = 'llm_request'
    job.errorCode = 'MODEL_UNAVAILABLE'
    job.error = '模型服务暂不可用'
    job.result = buildFailedResult({
      accountId: job.accountId,
      mailId: job.mailId,
      messageId: job.messageId,
      sourceMailKey: job.sourceMailKey,
      folder: job.folder,
      bodyHash: job.bodyHash,
      message: '模型服务暂不可用',
      code: 'MODEL_UNAVAILABLE',
      stage: 'llm_request',
      bodyLength: job.bodyLength,
      truncated: job.truncated,
    })
    job.finishedAt = nowIso()
    job.updatedAt = job.finishedAt
  }
  updateEmailTriageTask(input.taskId, { modelUnavailable: true })
  syncTask(input.taskId, '模型服务暂不可用')
}

export async function runEmailUnreadTriage(input: RunEmailTriageInput): Promise<void> {
  assertNotCancelled(input)
  const task = getEmailTriageTask(input.taskId)
  if (!task) {
    throw new Error('邮件分析任务不存在')
  }
  updateEmailTriageTask(input.taskId, {
    status: 'running',
    message: '正在同步并创建邮件分析任务…',
    promptVersion: MAIL_ANALYSIS_PROMPT_VERSION,
  })

  let selectedJobs: EmailAnalysisJobRecord[] = []
  if (Array.isArray(input.requestedMails) && input.requestedMails.length > 0) {
    selectedJobs = input.requestedMails.map((mail) => {
      const mailId = String(mail.mailId || '').trim()
      const sourceMailKey = resolveRequestedSourceMailKey(mail, input.account.user)
      if (!mailId) {
        const createdAt = nowIso()
        return {
          jobId: `invalid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          accountId: input.account.user,
          folder: (mail.folder || 'INBOX').toUpperCase(),
          mailId: '',
          messageId: mail.messageId,
          sourceMailKey,
          messageUid: String(mail.uid || ''),
          status: 'failed',
          subject: mail.subject,
          retryCount: 0,
          errorCode: 'MISSING_MAIL_ID',
          error: 'MISSING_MAIL_ID: 分析请求缺少 mailId',
          result: buildFailedResult({
            accountId: input.account.user,
            mailId: '',
            messageId: mail.messageId,
            sourceMailKey,
            folder: (mail.folder || 'INBOX').toUpperCase(),
            message: 'MISSING_MAIL_ID: 分析请求缺少 mailId',
            code: 'MISSING_MAIL_ID',
            stage: 'fetch_body',
          }),
          createdAt,
          updatedAt: createdAt,
          finishedAt: createdAt,
        }
      }
      if (!mail.sourceMailKey) {
        console.warn('[EmailTriage] request missing sourceMailKey', stringifyJsonSafe({
          taskId: input.taskId,
          mailId,
          messageId: mail.messageId,
          accountId: input.account.user,
          folder: mail.folder || 'inbox',
        }))
      }
      return {
        jobId: `${mailId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        accountId: input.account.user,
        folder: (mail.folder || 'INBOX').toUpperCase(),
        mailId,
        messageId: mail.messageId,
        sourceMailKey,
        messageUid: String(mail.uid || mailId),
        status: 'pending',
        subject: mail.subject,
        subjectHash: mail.subject ? shortHash(mail.subject) : undefined,
        retryCount: 0,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }
    })
  } else {
    const inbox = await fetchInbox(input.account, input.limit ?? 30)
    assertNotCancelled(input)
    const targetIds = Array.isArray(input.messageIds) && input.messageIds.length > 0
      ? new Set(input.messageIds.map((id) => String(id)))
      : null
    const selected = targetIds
      ? inbox.filter((mail) => targetIds.has(mail.id))
      : inbox.filter((mail) => mail.unread)

    selectedJobs = selected.map((mail) => ({
      jobId: `${mail.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      accountId: input.account.user,
      folder: 'INBOX',
      mailId: mail.id,
      messageId: mail.messageId,
      sourceMailKey: buildSourceMailKey({
        accountId: input.account.user,
        folder: 'inbox',
        uidValidity: mail.uidValidity,
        uid: mail.uid,
        mailId: mail.id,
        messageId: mail.messageId,
      }),
      messageUid: mail.uid || mail.id,
      status: 'pending',
      subject: mail.subject,
      subjectHash: mail.subject ? shortHash(mail.subject) : undefined,
      retryCount: 0,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }))
  }

  task.jobs = selectedJobs
  task.sourceMessageCount = selectedJobs.length
  syncTask(input.taskId, selectedJobs.length > 0 ? '正在分析邮件…' : '没有需要分析的未读邮件')

  if (selectedJobs.length === 0) {
    updateEmailTriageTask(input.taskId, {
      status: 'completed',
      progress: 100,
      message: '没有需要分析的未读邮件',
    })
    return
  }

  let stopForModelUnavailable = false
  let cursor = 0
  const workers = Array.from({ length: Math.min(MAX_CONCURRENCY, selectedJobs.length) }, async () => {
    while (true) {
      assertNotCancelled(input)
      if (stopForModelUnavailable) return
      const taskState = getEmailTriageTask(input.taskId)
      if (!taskState) return
      const current = taskState.jobs[cursor]
      cursor += 1
      if (!current) return
      if (current.status !== 'pending') continue
      const { modelUnavailable } = await processJob(input, current)
      if (modelUnavailable) {
        stopForModelUnavailable = true
        return
      }
    }
  })

  try {
    await Promise.all(workers)
  } catch (error) {
    const cancelled = error instanceof Error && error.name === 'EmailTriageCancelledError'
    updateEmailTriageTask(input.taskId, {
      status: cancelled ? 'cancelled' : 'failed',
      error: cancelled ? undefined : (error instanceof Error ? error.message : String(error)),
      message: cancelled ? '任务已取消' : (error instanceof Error ? error.message : String(error)),
    })
    throw error
  }

  if (stopForModelUnavailable) {
    markRemainingJobsModelUnavailable(input)
  }

  const finalTask = getEmailTriageTask(input.taskId)
  if (!finalTask) return
  const summary = summarizeJobs(finalTask.jobs)
  const finalStatus =
    input.isCancelled?.()
      ? 'cancelled'
      : finalTask.modelUnavailable || summary.failed > 0
        ? 'failed'
        : 'completed'
  updateEmailTriageTask(input.taskId, {
    status: finalStatus,
    progress: 100,
    summary,
    message: taskMessage(summary, finalTask.modelUnavailable),
  })
}
