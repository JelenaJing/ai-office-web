/**
 * MailTriageContext — user-triggered AI email classification.
 *
 * Responsibilities:
 *  • Loads cached triage results from localStorage on mount / account change
 *  • triggerAnalysis() — user-facing "AI邮件分析" action:
 *    1. Starts a server-side per-email analysis task
 *    2. Polls independent mail job states (pending/running/done/failed/skipped)
 *    3. Persists successful/skipped results to local cache for rendering
 *    4. Preserves previously successful results when a later retry fails
 *    5. After task completion, generates local AI pre-reply drafts for qualifying mails
 *  • Exposes triage results, analysis status, and progress counters to consumers
 *
 * Does NOT auto-send, auto-delete, or auto-move emails.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { MailItem } from '../../../types/email'
import type {
  AiEmailTodo,
  AiMailTriageResult,
  AiMailReplyDraft,
  AiMailSkipReason,
  EmailAnalysisJobSnapshot,
  EmailAnalysisTaskSnapshot,
  EmailActionType,
  EmailAnalysisBatchSummary,
  EmailAnalysisRequestItem,
  EmailAnalysisResult,
  EmailImportance,
  MailAnalysisProgress,
} from '../../../types/mailTriage'
import { useWorkspace } from '../../../contexts/WorkspaceContext'
import { useInternalAccount } from '../../../contexts/InternalAccountContext'
import { logActivity } from '../../../services/workActivityLog'
import {
  computeBodyHash,
  getAllCachedTriagesForAccount,
  MAIL_ANALYSIS_PROMPT_VERSION,
  setCachedTriage,
} from '../services/mailTriageCache'
import {
  stripThinkTags,
} from '../services/mailTriageClassifier'
import { getAiDraft, hasAiDraft, setAiDraft, updateAiDraftStatus } from '../services/mailDraftStore'
import { getMailTodos, mergeAnalysisTodos } from '../services/mailTodoStore'
import { buildEmailAnalysisBatchSummary } from '../services/emailAnalysisBatchSummary'
import { useEmail } from './EmailContext'
import { ensureTentativeCalendarEventFromEmail } from '../../../calendar/emailCalendarBridge'
import { listCalendarEvents } from '../../../calendar/calendarService'
import { detectCalendarConflicts } from '../../../calendar/calendarConflict'
import type { CalendarEventType } from '../../../calendar/types'
import { isWebShim } from '../../../platform/detect'
import {
  emailRuntimeGetTriageTask,
  emailRuntimeStartTriage,
} from '../services/emailRuntime'
import {
  formatMailDebugEntry,
  getMailKey,
  getMailTimestamp,
  normalizeMailBase,
} from '../utils/mailIdentity'

/* ------------------------------------------------------------------ */
/*  Context shape                                                      */
/* ------------------------------------------------------------------ */

/** Status driven by the user-initiated "AI邮件分析" button */
export type AnalysisStatus = 'idle' | 'running' | 'done' | 'failed'

interface MailTriageContextValue {
  /** Triage results keyed by mail.id */
  triageResults: Record<string, AiMailTriageResult>
  /** AI pre-reply drafts keyed by mail.id */
  aiDrafts: Record<string, AiMailReplyDraft>
  mailTodos: AiEmailTodo[]
  /**
   * User-facing "AI邮件分析" action.
   * Scans unread inbox mails, classifies those without cached success results,
   * and generates local AI pre-reply drafts for qualifying mails.
   * Only unread mails of the current account are processed.
   */
  triggerAnalysis: () => void
  /** Re-classify a single mail (regardless of current state) */
  enqueueMail: (mailId: string) => void
  /** Retry only the failed mails from the current batch */
  retryFailedAnalysis: () => void
  /** Re-generate AI draft for a specific mail */
  regenerateDraft: (mailId: string) => Promise<void>
  /** Discard an AI draft */
  discardDraft: (mailId: string) => void
  /** Status for the "AI邮件分析" button */
  analysisStatus: AnalysisStatus
  /** Detailed progress counters for the current/last run */
  analysisProgress: MailAnalysisProgress
  analysisError: string | null
  currentAnalysisBatchId: string | null
  currentBatchResults: EmailAnalysisResult[]
  currentBatchSummary: EmailAnalysisBatchSummary | null
  isAnalyzingEmails: boolean
  isWorkerRunning: boolean
}

const MailTriageContext = createContext<MailTriageContextValue | null>(null)

export function useMailTriage(): MailTriageContextValue {
  const ctx = useContext(MailTriageContext)
  if (!ctx) throw new Error('useMailTriage must be used inside MailTriageProvider')
  return ctx
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const now = () => new Date().toISOString()
const ACTIVE_POLL_MS = 1_000

function emptyAnalysisProgress(): MailAnalysisProgress {
  return {
    total: 0,
    cached: 0,
    enqueued: 0,
    running: 0,
    skipped: 0,
    done: 0,
    drafts: 0,
    failed: 0,
    status: 'idle',
  }
}

/** Build a lightweight triage result for mails that should bypass LLM analysis. */
function buildSkippedResult(mail: MailItem, accountId: string, reason: AiMailSkipReason): AiMailTriageResult {
  const isSystemNotice = reason === 'system_delivery_notice'
  return {
    mailId: mail.id,
    messageId: mail.messageId,
    sourceMailKey: resolveMailStorageKey(mail),
    mailKey: resolveMailStorageKey(mail),
    threadId: mail.threadId,
    accountId,
    bodyHash: computeBodyHash(mail.body),
    category: isSystemNotice ? 'read_only' : 'read_only',
    priority: 'low',
    needsReply: false,
    needsUserAction: false,
    canAutoArchive: true,
    riskLevel: 'none',
    summary: isSystemNotice
      ? (mail.subject.trim() || '系统退信通知').slice(0, 30)
      : (mail.subject.trim() || '附件邮件').slice(0, 20),
    reason: isSystemNotice ? '系统退信通知，无需 AI 分析' : '单纯附件邮件，无需 AI 分析',
    suggestedAction: isSystemNotice ? '检查收件人地址或域名 SPF/DKIM 配置' : '查看附件',
    status: 'skipped',
    skipReason: reason,
    createdAt: now(),
    updatedAt: now(),
  }
}

function resolveAccountId(accountConfig: ReturnType<typeof useEmail>['accountConfig']): string {
  if (!accountConfig) return 'local-account'
  return accountConfig.user || accountConfig.email || 'local-account'
}

function resolveWorkspaceId(activeWorkspacePath: string | null): string {
  if (!activeWorkspacePath) return 'no-workspace'
  return `ws-${computeBodyHash(activeWorkspacePath)}`
}

function logMailOrder(label: string, mails: MailItem[]) {
  console.debug(label, mails.slice(0, 10).map((mail) => ({
    ...formatMailDebugEntry(mail),
    timestamp: getMailTimestamp(mail),
  })))
}

function resolveMailStorageKey(mail: MailItem): string {
  return mail.mailKey || getMailKey(mail)
}

function resolveJobMailId(job: Pick<EmailAnalysisJobSnapshot, 'mailId' | 'messageId' | 'messageUid'>): string {
  return job.mailId || job.messageId || job.messageUid
}

function resolveJobMailKey(
  job: Pick<EmailAnalysisJobSnapshot, 'accountId' | 'folder' | 'mailId' | 'messageId' | 'messageUid' | 'sourceMailKey'>,
  mail?: MailItem,
): string {
  if (mail) return resolveMailStorageKey(mail)
  if (job.sourceMailKey) return job.sourceMailKey
  const mailId = resolveJobMailId(job)
  return getMailKey(normalizeMailBase({
    id: mailId,
    accountId: job.accountId,
    from: '',
    fromName: '',
    to: '',
    toName: '',
    subject: '',
    body: '',
    timestamp: '',
    unread: false,
    replied: false,
    folder: job.folder?.toLowerCase() === 'sent' ? 'sent' : job.folder?.toLowerCase() === 'trash' ? 'trash' : 'inbox',
    uid: job.messageUid || mailId,
  }, job.accountId))
}

/**
 * Whether a triage result qualifies for AI pre-reply draft generation.
 * Security: risk mails and non-reply-intent mails never get a draft.
 */
function qualifiesForDraft(result: AiMailTriageResult): boolean {
  if (result.status !== 'success') return false
  if (result.riskLevel === 'medium' || result.riskLevel === 'high') return false
  if (result.category === 'risk') return false
  if (result.category === 'promotion') return false
  if (result.category === 'archive_candidate') return false
  if (result.category === 'read_only') return false
  if (result.category === 'unknown') return false
  // reply_required always qualifies
  if (result.category === 'reply_required') return result.priority !== 'low'
  // action_required qualifies only if needsReply=true
  if (result.category === 'action_required') return result.needsReply && result.priority !== 'low'
  return false
}

function mapImportance(result: AiMailTriageResult): EmailImportance {
  if ((result.importance || result.priority) === 'high') return 'important'
  if ((result.importance || result.priority) === 'low') return 'low'
  return 'normal'
}

function mapActionType(result: AiMailTriageResult): EmailActionType {
  const intentType = result.actionPlan?.intentType
  if (result.needsReply || result.requiresReply || result.category === 'reply_required') return 'need_reply'
  if (result.replyIntent === 'forward_to_others') return 'need_forward'
  if (intentType === 'meeting' || result.emailCategory === 'meeting_invitation') return 'need_schedule'
  if (intentType === 'attachment_review' || result.emailCategory === 'document_review') return 'need_review'
  if (result.category === 'risk' || result.emailCategory === 'spam' || result.emailCategory === 'promotion') return 'spam_or_noise'
  if (result.needsUserAction || result.requiresAction || result.category === 'action_required') return 'need_review'
  if (result.category === 'read_only' || result.emailCategory === 'system_notice' || result.emailCategory === 'internal_notice') return 'notification'
  return 'no_action'
}

function calendarEventTypeFromIntent(type: NonNullable<AiMailTriageResult['timeIntent']>['type']): CalendarEventType {
  if (type === 'interview') return 'interview'
  if (type === 'deadline') return 'deadline'
  if (type === 'reminder') return 'reminder'
  return 'meeting'
}

async function buildCalendarAwareDraftBody(mail: MailItem, responder: string, sender: string, triage: AiMailTriageResult): Promise<string | null> {
  const intent = triage.timeIntent
  if (!intent?.hasTimeRequirement) return null

  const events = await listCalendarEvents()
  const candidates = intent.candidateTimes ?? []
  if (intent.type === 'candidate_times' && candidates.length > 0) {
    const checked = candidates.map((candidate) => {
      const conflicts = detectCalendarConflicts({
        id: '',
        startTime: candidate.startTime,
        endTime: candidate.endTime,
        eventType: 'meeting',
      }, events)
      return { candidate, conflicts }
    })
    const recommended = checked.find((item) => item.conflicts.length === 0) ?? checked[0]
    const timeText = new Date(recommended.candidate.startTime).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    return `English:\n\nDear ${sender},\n\nThank you for sharing the available time options. The time that works best for me is ${timeText}. Please let me know if this works for you.\n\nBest regards,\n${responder}\n\n中文：\n\n${sender}您好：\n\n感谢您提供候选时间。我更方便的时间是 ${timeText}，请您确认是否合适。\n\n祝好！\n${responder}`
  }

  const startTime = intent.type === 'deadline' ? intent.deadlineTime : intent.startTime
  if (!startTime || intent.type === 'follow_up') {
    return `English:\n\nDear ${sender},\n\nThank you for your email. Could you please share a specific time or a few available time options so that I can confirm the arrangement?\n\nBest regards,\n${responder}\n\n中文：\n\n${sender}您好：\n\n感谢您的来信。能否请您提供一个具体时间或几个候选时间，以便我确认安排？\n\n祝好！\n${responder}`
  }

  const conflicts = detectCalendarConflicts({
    id: '',
    startTime,
    endTime: intent.endTime,
    eventType: calendarEventTypeFromIntent(intent.type),
  }, events)
  if (conflicts.length > 0) {
    return `English:\n\nDear ${sender},\n\nThank you for the arrangement regarding "${intent.title || mail.subject}". I am sorry, but I already have a commitment during that time. Would it be possible to adjust to another suitable time?\n\nBest regards,\n${responder}\n\n中文：\n\n${sender}您好：\n\n感谢您关于“${intent.title || mail.subject}”的安排。抱歉，我该时间段已有安排，是否可以调整到其他合适时间？\n\n祝好！\n${responder}`
  }

  return `English:\n\nDear ${sender},\n\nThank you for the arrangement regarding "${intent.title || mail.subject}". I am available at that time and can attend as scheduled.\n\nBest regards,\n${responder}\n\n中文：\n\n${sender}您好：\n\n感谢您关于“${intent.title || mail.subject}”的安排。可以，我这个时间有空参加。\n\n祝好！\n${responder}`
}

function buildStructuredAnalysisResult(
  mail: MailItem,
  triage: AiMailTriageResult,
  batchId: string,
  draft?: AiMailReplyDraft | null,
  job?: Pick<EmailAnalysisJobSnapshot, 'status' | 'stage' | 'errorCode' | 'retryCount' | 'bodyLength' | 'truncated' | 'cacheHit'>,
): EmailAnalysisResult {
  const failed = triage.status === 'failed'
  return {
    mailId: mail.id,
    messageId: mail.messageId || triage.messageId,
    sourceMailKey: mail.mailKey || triage.sourceMailKey || triage.mailKey || getMailKey(mail),
    mailKey: mail.mailKey || triage.mailKey || getMailKey(mail),
    threadId: mail.threadId,
    status: triage.status === 'success' ? 'done' : triage.status === 'skipped' ? 'skipped' : job?.status,
    fromName: mail.fromName,
    fromEmail: mail.from,
    subject: mail.subject,
    receivedAt: mail.receivedAt || mail.internalDate || mail.date || mail.sentAt || mail.createdAt || mail.timestamp,
    importance: mapImportance(triage),
    category: triage.emailCategory || triage.category,
    actionType: mapActionType(triage),
    summary: triage.summary || mail.subject || '（无摘要）',
    reason: triage.reason || triage.suggestedAction || '',
    suggestedReply: triage.draftReply,
    hasDraftReply: Boolean(draft),
    draftId: draft?.id,
    deadlineText: triage.deadline,
    timeIntent: triage.timeIntent,
    calendarEventId: triage.calendarEventId,
    calendarConflictCount: triage.calendarConflictCount,
    relatedPeople: [mail.fromName, mail.toName].filter((name): name is string => Boolean(name?.trim())),
    batchId,
    stage: triage.analysisStage || job?.stage,
    errorCode: triage.errorCode || job?.errorCode,
    retryCount: triage.retryCount ?? job?.retryCount,
    bodyLength: triage.bodyLength ?? job?.bodyLength,
    truncated: triage.truncated ?? job?.truncated,
    cacheHit: job?.cacheHit,
    error: failed ? (triage.errorMessage || '分析失败') : undefined,
  }
}

function buildFallbackFailedAnalysisResult(
  mail: MailItem,
  batchId: string,
  error: string,
): EmailAnalysisResult {
  const errorCode = error.startsWith('INVALID_ANALYSIS_PAYLOAD')
    ? 'INVALID_ANALYSIS_PAYLOAD'
    : error.startsWith('MISSING_MAIL_ID')
      ? 'MISSING_MAIL_ID'
      : undefined
  return {
    mailId: mail.id,
    messageId: mail.messageId,
    sourceMailKey: mail.mailKey || getMailKey(mail),
    mailKey: mail.mailKey || getMailKey(mail),
    threadId: mail.threadId,
    status: 'failed',
    fromName: mail.fromName,
    fromEmail: mail.from,
    subject: mail.subject,
    receivedAt: mail.receivedAt || mail.internalDate || mail.date || mail.sentAt || mail.createdAt || mail.timestamp,
    importance: 'normal',
    category: 'unknown',
    actionType: 'no_action',
    summary: mail.subject || '（无摘要）',
    reason: '',
    hasDraftReply: false,
    batchId,
    errorCode,
    error,
  }
}

/** Generate an AI pre-reply draft (non-streaming LLM call). */
async function generateDraftForMail(
  mail: MailItem,
  accountId: string,
  bodyHash: string,
  triage: AiMailTriageResult,
): Promise<AiMailReplyDraft | null> {
  if (isWebShim() || !window.electronAPI?.writingAssistant) return null
  const responder = (mail.toName || mail.to || '收件人').trim()
  const sender = (mail.fromName || mail.from || '发件人').trim()
  const bodySnippet = mail.body.slice(0, 800)
  const calendarAwareDraftBody = await buildCalendarAwareDraftBody(mail, responder, sender, triage)
  if (calendarAwareDraftBody) {
    const draft: AiMailReplyDraft = {
      id: `draft-${accountId}-${mail.id}-${Date.now()}`,
      accountId,
      messageId: mail.id,
      mailKey: mail.mailKey || getMailKey(mail),
      bodyHash,
      triageResultId: `${accountId}:${mail.id}:${bodyHash}`,
      subject: `Re: ${mail.subject}`,
      to: [mail.from || ''],
      draftBody: calendarAwareDraftBody + '\n\n（本条回复由 AI 自动生成，请确认后再发送。）',
      tone: 'polite',
      status: 'generated',
      createdAt: now(),
      updatedAt: now(),
    }
    setAiDraft(draft)
    return draft
  }
  const actionPlan = triage.actionPlan
  const externalBasisGuard = triage.requiresKnowledgeBase
    ? '\nThis email may require external policy or procedural basis. If no clear basis is available in the email or analysis result, do NOT fabricate policies, deadlines, procedures, or approval requirements — state "pending further confirmation" in both languages.'
    : ''
  const intentType = actionPlan?.intentType || triage.detectedIntent || triage.emailCategory || triage.category
  const prompt = [
    `You are a professional email reply expert. Write an editable pre-reply draft from the perspective of the recipient "${responder}".`,
    `Requirements:\n1. Output the reply body directly — do NOT include a subject line.\n2. Automatically determine tone and structure from the email and AI analysis result.\n3. Task: confirm todos and deadlines; Request: respond to each item; Inquiry: answer step by step; Notification: brief acknowledgment only if needed; Attachment review: state the attachment handling plan; Approval: be formal, cautious, and flag items needing manual confirmation.\n4. Sign with "${responder}" at the end of the Chinese section.\n5. IMPORTANT — You MUST generate the reply in bilingual format. Use EXACTLY these two section headings:\n\nEnglish:\n\n<English reply body here>\n\n中文：\n\n<Chinese reply body here>\n\nThe English version must appear first. The Chinese version must follow. Do NOT omit either section.${externalBasisGuard}`,
    `AI-detected type: ${intentType}`,
    `Action plan: ${actionPlan?.brief || triage.suggestedAction || ''}`,
    `Reply strategy: ${actionPlan?.replyStrategy.reason || triage.reason || ''}`,
    `\nTo: ${responder} (${mail.to || ''})\nFrom: ${sender} (${mail.from || ''})\nSubject: ${mail.subject}\nBody:\n${bodySnippet}`,
  ].join('\n\n')

  try {
    const raw = await window.electronAPI.writingAssistant({ instruction: prompt, language: 'zh' })
    const draftBody = stripThinkTags(raw).trim()
    if (!draftBody) return null
      const draft: AiMailReplyDraft = {
        id: `draft-${accountId}-${mail.id}-${Date.now()}`,
        accountId,
        messageId: mail.id,
        mailKey: mail.mailKey || getMailKey(mail),
        bodyHash,
        triageResultId: `${accountId}:${mail.id}:${bodyHash}`,
      subject: `Re: ${mail.subject}`,
      to: [mail.from || ''],
      draftBody: draftBody + '\n\n（本条回复由 AI 自动生成，请确认后再发送。）',
      tone: 'polite',
      status: 'generated',
      createdAt: now(),
      updatedAt: now(),
    }
    setAiDraft(draft)
    return draft
  } catch {
    return null
  }
}

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

export function MailTriageProvider({ children }: { children: ReactNode }) {
  const { mails, accountConfig, refreshMails } = useEmail()
  const { activeWorkspacePath } = useWorkspace()
  const { state: internalAccountState } = useInternalAccount()
  const accountId = resolveAccountId(accountConfig)
  const workspaceId = resolveWorkspaceId(activeWorkspacePath)
  const currentUserId = internalAccountState.phase === 'logged_in' ? internalAccountState.session.user.id : null

  const [triageResults, setTriageResults] = useState<Record<string, AiMailTriageResult>>(() =>
    getAllCachedTriagesForAccount(accountId),
  )
  const [aiDrafts, setAiDrafts] = useState<Record<string, AiMailReplyDraft>>({})
  const [mailTodos, setMailTodos] = useState<AiEmailTodo[]>(() => getMailTodos(accountId, workspaceId))
  const [isWorkerRunning, setIsWorkerRunning] = useState(false)
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>('idle')
  const [analysisProgress, setAnalysisProgress] = useState<MailAnalysisProgress>(() => emptyAnalysisProgress())
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [currentAnalysisBatchId, setCurrentAnalysisBatchId] = useState<string | null>(null)
  const [currentBatchResults, setCurrentBatchResults] = useState<EmailAnalysisResult[]>([])
  const [currentBatchSummary, setCurrentBatchSummary] = useState<EmailAnalysisBatchSummary | null>(null)
  const [isAnalyzingEmails, setIsAnalyzingEmails] = useState(false)

  const batchMailIdsRef = useRef<Set<string>>(new Set())
  const pollingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeTaskIdRef = useRef<string | null>(null)
  const latestTaskRef = useRef<EmailAnalysisTaskSnapshot | null>(null)
  const latestTriageResultsRef = useRef(triageResults)
  const latestAiDraftsRef = useRef(aiDrafts)
  const batchForceRef = useRef(false)
  const finalizedTaskIdRef = useRef<string | null>(null)
  const preflightResultsRef = useRef<EmailAnalysisResult[]>([])

  useEffect(() => { latestTriageResultsRef.current = triageResults }, [triageResults])
  useEffect(() => { latestAiDraftsRef.current = aiDrafts }, [aiDrafts])

  const clearPolling = useCallback(() => {
    if (pollingTimerRef.current !== null) {
      clearTimeout(pollingTimerRef.current)
      pollingTimerRef.current = null
    }
  }, [])

  useEffect(() => {
    setTriageResults(getAllCachedTriagesForAccount(accountId))
    setAiDrafts({})
    setMailTodos(getMailTodos(accountId, workspaceId))
    batchMailIdsRef.current = new Set()
    clearPolling()
    activeTaskIdRef.current = null
    latestTaskRef.current = null
    finalizedTaskIdRef.current = null
    setCurrentAnalysisBatchId(null)
    setCurrentBatchResults([])
    setCurrentBatchSummary(null)
    preflightResultsRef.current = []
    setAnalysisProgress(emptyAnalysisProgress())
    setAnalysisError(null)
    setAnalysisStatus('idle')
    setIsAnalyzingEmails(false)
    setIsWorkerRunning(false)
  }, [accountId, workspaceId, clearPolling])

  useEffect(() => () => clearPolling(), [clearPolling])

  const publishResult = useCallback((result: AiMailTriageResult, mail?: MailItem) => {
    const mergedTodos = mergeAnalysisTodos(accountId, workspaceId, result.todos ?? [])
    const mailKey = result.sourceMailKey || result.mailKey || (mail ? resolveMailStorageKey(mail) : resolveJobMailKey({
      accountId: result.accountId,
      folder: result.folder || 'INBOX',
      mailId: result.mailId,
      messageId: result.messageId,
      messageUid: result.mailId,
      sourceMailKey: result.sourceMailKey,
    }))
    const nextResult = {
      ...result,
      sourceMailKey: mailKey,
      mailKey,
      folder: result.folder || 'INBOX',
      promptVersion: result.promptVersion || MAIL_ANALYSIS_PROMPT_VERSION,
      todos: mergedTodos,
      updatedAt: now(),
    }
    setCachedTriage(nextResult)
    setTriageResults((prev) => ({ ...prev, [mailKey]: nextResult }))
    setMailTodos(getMailTodos(accountId, workspaceId))
  }, [accountId, workspaceId])

  const applyTransientResult = useCallback((result: AiMailTriageResult, mail?: MailItem) => {
    const mailKey = result.sourceMailKey || result.mailKey || (mail ? resolveMailStorageKey(mail) : resolveJobMailKey({
      accountId: result.accountId,
      folder: result.folder || 'INBOX',
      mailId: result.mailId,
      messageId: result.messageId,
      messageUid: result.mailId,
      sourceMailKey: result.sourceMailKey,
    }))
    setTriageResults((prev) => ({ ...prev, [mailKey]: { ...result, sourceMailKey: mailKey, mailKey } }))
  }, [])

  const rebuildBatchResults = useCallback((
    snapshot: EmailAnalysisTaskSnapshot | null,
    draftOverrides: Record<string, AiMailReplyDraft> = {},
  ) => {
    const batchId = snapshot?.taskId || activeTaskIdRef.current
    if (!batchId) {
      setCurrentBatchResults([])
      setCurrentBatchSummary(null)
      return
    }
    const mailMap = new Map(mails.map((mail) => [mail.id, mail]))
    const jobMap = new Map((snapshot?.jobs ?? latestTaskRef.current?.jobs ?? []).map((job) => [resolveJobMailId(job), job]))
    const drafts = { ...latestAiDraftsRef.current, ...draftOverrides }
    const ids = batchMailIdsRef.current.size > 0
      ? [...batchMailIdsRef.current]
      : [...jobMap.keys()]
    const nextResults: EmailAnalysisResult[] = ids.map((mailId) => {
      const job = jobMap.get(mailId)
      const existingMail = mailMap.get(mailId)
      const triage = jobToTriageResult(job, existingMail)
      const mail = existingMail ?? buildSyntheticMail(mailId, job, triage)
      const mailKey = resolveMailStorageKey(mail)
      const resolvedTriage = triage ?? latestTriageResultsRef.current[mailKey]
      if (job?.status === 'failed') {
        return buildJobFailedAnalysisResult(mail, batchId, job)
      }
      if (job?.status === 'pending' || job?.status === 'running') {
        return buildJobPendingAnalysisResult(mail, batchId, job)
      }
      if (!job && snapshot && (snapshot.status === 'queued' || snapshot.status === 'running')) {
        return buildLocalPendingAnalysisResult(mail, batchId)
      }
      if (resolvedTriage) {
        const draft = drafts[mailKey] ?? getAiDraft(accountId, mailKey, computeBodyHash(mail.body), [mail.id, mail.messageId || ''])
        return buildStructuredAnalysisResult(mail, resolvedTriage, batchId, draft, job)
      }
      console.warn('[MailTriage] missing analysis result payload', {
        mailId,
        sourceMailKey: mailKey,
        status: job?.status,
        error: job?.error,
        hasResult: Boolean(job?.result),
      })
      return buildFallbackFailedAnalysisResult(mail, batchId, job?.error || 'INVALID_ANALYSIS_PAYLOAD: 未获得分析结果')
    })
    const combinedResults = [...nextResults, ...preflightResultsRef.current]
    console.debug('[MailTriage] analyzed results order', combinedResults.map((result) => ({
      mailId: result.mailId,
      sourceMailKey: result.sourceMailKey || result.mailKey,
      subject: result.subject,
      success: !result.error && result.status !== 'failed',
      error: result.error,
      hasResult: !result.error,
      mailKey: result.mailKey,
      priority: result.importance,
      timestamp: result.receivedAt ? new Date(result.receivedAt).getTime() : 0,
    })))
    setCurrentBatchResults(combinedResults)
    setCurrentBatchSummary(buildEmailAnalysisBatchSummary(batchId, combinedResults))
  }, [accountId, mails])

  const mergeJobIntoTriageState = useCallback((job: EmailAnalysisJobSnapshot) => {
    const mail = mails.find((item) => item.id === resolveJobMailId(job))
    const mailKey = resolveJobMailKey(job, mail)
    const existing = latestTriageResultsRef.current[mailKey]
    const triage = jobToTriageResult(job, mail)
    if (job.status === 'done' && triage) {
      publishResult(triage, mail)
      return
    }
    if (job.status === 'done' && !triage) {
      applyTransientResult(buildFailedResult(job, mail, job.error || 'INVALID_ANALYSIS_PAYLOAD: 未获得分析结果'), mail)
      return
    }
    if (job.status === 'skipped' && triage) {
      if (triage.status === 'success') {
        publishResult(triage, mail)
        return
      }
      if (existing?.status !== 'success') {
        publishResult(triage, mail)
      }
      return
    }
    if (job.status === 'failed') {
      if (existing?.status === 'success' && !batchForceRef.current) return
      applyTransientResult(buildFailedResult(job, mail, job.error || '分析失败'), mail)
      return
    }
    if ((job.status === 'pending' || job.status === 'running') && !(existing?.status === 'success' && !batchForceRef.current)) {
      applyTransientResult(buildPendingResult(job, mail), mail)
    }
  }, [applyTransientResult, mails, publishResult])

  const maybeGenerateDrafts = useCallback(async (
    snapshot: EmailAnalysisTaskSnapshot,
  ): Promise<void> => {
    const mailMap = new Map(mails.map((mail) => [mail.id, mail]))
    const generatedDrafts: Record<string, AiMailReplyDraft> = {}
    let draftsGenerated = 0
    for (const job of snapshot.jobs) {
      const mail = mailMap.get(resolveJobMailId(job))
      const mailKey = mail ? resolveMailStorageKey(mail) : resolveJobMailKey(job)
      const triage = jobToTriageResult(job, mail) ?? latestTriageResultsRef.current[mailKey]
      if (!triage || triage.status !== 'success') continue
      if (!qualifiesForDraft(triage)) continue
      if (!mail) continue
      const bodyHash = computeBodyHash(mail.body)
      if (hasAiDraft(accountId, mailKey, bodyHash, [mail.id, mail.messageId || ''])) {
        const existing = getAiDraft(accountId, mailKey, bodyHash, [mail.id, mail.messageId || ''])
        if (existing) generatedDrafts[mailKey] = existing
        continue
      }
      const draft = await generateDraftForMail(mail, accountId, bodyHash, triage)
      if (!draft) continue
      generatedDrafts[mailKey] = draft
      draftsGenerated += 1
    }
    if (Object.keys(generatedDrafts).length > 0) {
      setAiDrafts((prev) => ({ ...prev, ...generatedDrafts }))
      setAnalysisProgress((prev) => ({ ...prev, drafts: prev.drafts + draftsGenerated }))
      rebuildBatchResults(snapshot, generatedDrafts)
    }
    if (currentUserId && draftsGenerated > 0) {
      logActivity(currentUserId, 'mail', 'ai_reply_draft_generated', {
        workspaceId,
        summary: `生成了 ${draftsGenerated} 封邮件预回复`,
        metadata: { draftCount: draftsGenerated },
      })
    }
  }, [accountId, currentUserId, mails, rebuildBatchResults, workspaceId])

  const applyTaskSnapshot = useCallback((snapshot: EmailAnalysisTaskSnapshot) => {
    latestTaskRef.current = snapshot
    setCurrentAnalysisBatchId(snapshot.taskId)
    setAnalysisError(snapshot.error || null)
    if (snapshot.jobs.length > 0) {
      batchMailIdsRef.current = new Set(snapshot.jobs.map((job) => resolveJobMailId(job)))
    }
    snapshot.jobs.forEach(mergeJobIntoTriageState)
    const preflightSkipped = preflightResultsRef.current.filter((result) => result.status === 'skipped').length
    const total = snapshot.summary.total + preflightResultsRef.current.length
    const skipped = snapshot.summary.skipped + preflightSkipped
    setAnalysisProgress((prev) => ({
      batchId: snapshot.taskId,
      total,
      cached: snapshot.summary.cached,
      enqueued: Math.max(0, snapshot.summary.total - snapshot.summary.cached),
      running: snapshot.summary.running,
      skipped,
      done: snapshot.summary.done,
      drafts: prev.drafts,
      failed: snapshot.summary.failed,
      status:
        snapshot.status === 'completed'
          ? 'completed'
          : snapshot.status === 'failed' || snapshot.status === 'cancelled'
            ? 'failed'
            : 'running',
      startedAt: prev.startedAt,
      updatedAt: now(),
    }))
    rebuildBatchResults(snapshot)
    console.info('[mail-triage] poll progress', {
      batchId: snapshot.taskId,
      total,
      completed: snapshot.summary.done + snapshot.summary.failed + skipped,
      failed: snapshot.summary.failed,
      skipped,
      running: snapshot.summary.running,
    })
    logMailOrder('[MailTriage] after analysis top10', mails)
    const terminal = snapshot.status === 'completed' || snapshot.status === 'failed' || snapshot.status === 'cancelled'
    setIsAnalyzingEmails(!terminal)
    setIsWorkerRunning(!terminal)
    if (!terminal) {
      setAnalysisStatus('running')
      return
    }
    const hasFailed = snapshot.summary.failed > 0 || snapshot.modelUnavailable
    setAnalysisStatus(hasFailed ? 'failed' : 'done')
    if (finalizedTaskIdRef.current === snapshot.taskId) return
    finalizedTaskIdRef.current = snapshot.taskId
    void maybeGenerateDrafts(snapshot)
    if (currentUserId) {
      logActivity(currentUserId, 'mail', 'ai_mail_analysis_completed', {
        workspaceId,
        summary: hasFailed
          ? `AI 邮件分析完成：成功 ${snapshot.summary.done}，失败 ${snapshot.summary.failed}，跳过 ${snapshot.summary.skipped}`
          : `AI 邮件分析完成：成功 ${snapshot.summary.done}，跳过 ${snapshot.summary.skipped}`,
        metadata: {
          batchId: snapshot.taskId,
          total: snapshot.summary.total,
          done: snapshot.summary.done,
          failed: snapshot.summary.failed,
          skipped: snapshot.summary.skipped,
          cached: snapshot.summary.cached,
          modelUnavailable: snapshot.modelUnavailable,
        },
      })
    }
  }, [currentUserId, maybeGenerateDrafts, mergeJobIntoTriageState, rebuildBatchResults, workspaceId])

  const pollTask = useCallback((taskId: string) => {
    clearPolling()
    void emailRuntimeGetTriageTask(taskId)
      .then((snapshot) => {
        if (activeTaskIdRef.current !== taskId) return
        applyTaskSnapshot(snapshot)
        if (snapshot.status === 'running' || snapshot.status === 'queued') {
          pollingTimerRef.current = setTimeout(() => pollTask(taskId), ACTIVE_POLL_MS)
        }
      })
      .catch((error) => {
        if (activeTaskIdRef.current !== taskId) return
        setAnalysisStatus('failed')
        setAnalysisError(error instanceof Error ? error.message : String(error))
        setIsAnalyzingEmails(false)
        setIsWorkerRunning(false)
        setAnalysisProgress((prev) => ({ ...prev, running: 0, status: 'failed', updatedAt: now() }))
        if (currentUserId) {
          logActivity(currentUserId, 'mail', 'ai_mail_analysis_failed', {
            workspaceId,
            summary: error instanceof Error ? error.message : String(error),
          })
        }
      })
  }, [applyTaskSnapshot, clearPolling, currentUserId, workspaceId])

  const startAnalysis = useCallback(async (options?: { messageIds?: string[]; force?: boolean }) => {
    clearPolling()
    finalizedTaskIdRef.current = null
    latestTaskRef.current = null
    activeTaskIdRef.current = null
    batchForceRef.current = Boolean(options?.force)
    preflightResultsRef.current = []
    setCurrentBatchResults([])
    setCurrentBatchSummary(null)
    setCurrentAnalysisBatchId(null)
    setAnalysisError(null)
    const inboxMails = mails.filter((mail) => (mail.accountId || accountId) === accountId && mail.folder === 'inbox')
    const unreadMails = inboxMails.filter((mail) => mail.unread || mail.isRead === false)
    const selectedIds = options?.messageIds?.length ? new Set(options.messageIds) : null
    const candidateMails = selectedIds
      ? mails.filter((mail) => selectedIds.has(mail.id))
      : unreadMails
    const validTargetMails = candidateMails.filter((mail) => typeof mail.id === 'string' && mail.id.trim().length > 0)
    const invalidTargetMails = candidateMails.filter((mail) => !(typeof mail.id === 'string' && mail.id.trim().length > 0))
    console.info('[mail-triage] start clicked', {
      accountId,
      folder: 'inbox',
      totalMails: inboxMails.length,
      unreadMails: unreadMails.length,
      targetMails: validTargetMails.length,
      invalidTargets: invalidTargetMails.length,
      sample: validTargetMails.slice(0, 5).map((mail) => ({
        subject: mail.subject,
        id: mail.id,
        messageId: mail.messageId,
        sourceMailKey: getMailKey(mail),
        isRead: mail.isRead,
        unread: mail.unread,
        flags: mail.flags,
      })),
    })
    if (candidateMails.length === 0) {
      batchMailIdsRef.current = new Set()
      setAnalysisStatus('idle')
      setIsAnalyzingEmails(false)
      setIsWorkerRunning(false)
      setAnalysisProgress(emptyAnalysisProgress())
      setAnalysisError('当前没有未读邮件需要分析')
      return
    }
    batchMailIdsRef.current = new Set(validTargetMails.map((mail) => mail.id))
    const localBatchId = `starting-${Date.now()}`
    preflightResultsRef.current = invalidTargetMails.map((mail) => {
      console.warn('[mail-triage] skipped mail before start', {
        subject: mail.subject,
        mailId: mail.id,
        messageId: mail.messageId,
        sourceMailKey: getMailKey(mail),
        error: 'MISSING_MAIL_ID',
      })
      return buildPreflightSkippedAnalysisResult(mail, localBatchId, 'MISSING_MAIL_ID')
    })
    const requestedMails: EmailAnalysisRequestItem[] = validTargetMails
      .map((mail) => ({
        mailId: mail.id,
        messageId: mail.messageId,
        sourceMailKey: resolveMailStorageKey(mail),
        accountId: mail.accountId,
        folder: mail.folder,
        uid: mail.uid,
        uidValidity: mail.uidValidity,
        subject: mail.subject,
      }))
    const initialResults = [
      ...validTargetMails.map((mail) => buildLocalPendingAnalysisResult(mail, localBatchId)),
      ...preflightResultsRef.current,
    ]
    setCurrentBatchResults(initialResults)
    setCurrentBatchSummary(buildEmailAnalysisBatchSummary(localBatchId, initialResults))
    setAnalysisProgress({
      batchId: undefined,
      total: candidateMails.length,
      cached: 0,
      enqueued: validTargetMails.length,
      running: validTargetMails.length,
      skipped: preflightResultsRef.current.length,
      done: 0,
      drafts: 0,
      failed: 0,
      status: validTargetMails.length > 0 ? 'starting' : 'failed',
      startedAt: now(),
      updatedAt: now(),
    })
    logMailOrder('[MailTriage] before analysis top10', mails)
    console.debug('[MailTriage] start request', requestedMails.map((mail) => ({
      subject: mail.subject,
      mailId: mail.mailId,
      messageId: mail.messageId,
      sourceMailKey: mail.sourceMailKey,
      accountId: mail.accountId,
      folder: mail.folder,
      uid: mail.uid,
    })))
    if (requestedMails.length === 0) {
      setAnalysisStatus('failed')
      setIsAnalyzingEmails(false)
      setIsWorkerRunning(false)
      setAnalysisError('EMPTY_ANALYSIS_TARGETS: No emails selected for triage')
      return
    }
    setAnalysisStatus('running')
    setIsAnalyzingEmails(true)
    setIsWorkerRunning(true)
    refreshMails()
    const limit = Math.min(Math.max(batchMailIdsRef.current.size || 30, 1), 30)
    try {
      const response = await emailRuntimeStartTriage({
        limit,
        messageIds: requestedMails.length > 0 ? requestedMails.map((mail) => mail.mailId) : options?.messageIds,
        requestedMails,
        force: options?.force,
      })
      const taskId = response.batchId || response.taskId || response.id
      if (!taskId) {
        throw new Error('MISSING_BATCH_ID')
      }
      activeTaskIdRef.current = taskId
      setCurrentAnalysisBatchId(taskId)
      setAnalysisProgress((prev) => ({
        ...prev,
        batchId: taskId,
        total: response.total && response.total > 0 ? Math.max(prev.total, response.total) : prev.total,
        running: typeof response.accepted === 'number' ? response.accepted : prev.running,
        status: 'running',
        updatedAt: now(),
      }))
      setCurrentBatchResults((prev) => {
        const next = prev.map((result) => ({ ...result, batchId: taskId }))
        setCurrentBatchSummary(buildEmailAnalysisBatchSummary(taskId, next))
        return next
      })
      console.info('[mail-triage] batch created', {
        batchId: taskId,
        total: requestedMails.length + preflightResultsRef.current.length,
      })
      if (currentUserId) {
        logActivity(currentUserId, 'mail', 'ai_mail_analysis_started', {
          workspaceId,
          summary: options?.messageIds?.length
            ? `开始 AI 邮件分析：${options.messageIds.length} 封指定邮件`
            : '开始 AI 邮件分析',
          metadata: {
            batchId: taskId,
            requestedMessageIds: requestedMails.map((mail) => mail.mailId),
            force: Boolean(options?.force),
          },
        })
      }
      pollTask(taskId)
    } catch (error) {
      setAnalysisStatus('failed')
      setAnalysisError(error instanceof Error ? error.message : String(error))
      setIsAnalyzingEmails(false)
      setIsWorkerRunning(false)
      setCurrentAnalysisBatchId(null)
      setAnalysisProgress((prev) => ({ ...prev, running: 0, status: 'failed', updatedAt: now() }))
      if (currentUserId) {
        logActivity(currentUserId, 'mail', 'ai_mail_analysis_failed', {
          workspaceId,
          summary: error instanceof Error ? error.message : String(error),
        })
      }
    }
  }, [clearPolling, currentUserId, mails, pollTask, refreshMails, workspaceId])

  const triggerAnalysis = useCallback(() => {
    void startAnalysis()
  }, [startAnalysis])

  const enqueueMail = useCallback((mailId: string) => {
    void startAnalysis({ messageIds: [mailId], force: true })
  }, [startAnalysis])

  const retryFailedAnalysis = useCallback(() => {
    const failedIds = (latestTaskRef.current?.jobs ?? [])
      .filter((job) => job.status === 'failed')
      .map((job) => resolveJobMailId(job))
    if (failedIds.length === 0) return
    void startAnalysis({ messageIds: failedIds, force: true })
  }, [startAnalysis])

  /* ---- Public API: re-generate draft for a mail ---- */
  const regenerateDraft = useCallback(
    async (mailId: string) => {
      const mail = mails.find((m) => m.id === mailId)
      if (!mail) return
      const mailKey = resolveMailStorageKey(mail)
      const bodyHash = computeBodyHash(mail.body)
      const triage = triageResults[mailKey]
      if (!triage) return
      const draft = await generateDraftForMail(mail, accountId, bodyHash, triage)
      if (draft) setAiDrafts((prev) => ({ ...prev, [mailKey]: draft }))
    },
    [mails, triageResults, accountId],
  )

  /* ---- Public API: discard draft ---- */
  const discardDraft = useCallback(
    (mailId: string) => {
      const mail = mails.find((item) => item.id === mailId)
      const mailKey = mail ? resolveMailStorageKey(mail) : mailId
      setAiDrafts((prev) => {
        if (!prev[mailKey]) return prev
        updateAiDraftStatus(accountId, mailKey, prev[mailKey].bodyHash, 'discarded')
        const next = { ...prev }
        delete next[mailKey]
        return next
      })
    },
    [accountId, mails],
  )

  const value = useMemo<MailTriageContextValue>(
    () => ({
      triageResults,
      aiDrafts,
      mailTodos,
      triggerAnalysis,
      enqueueMail,
      retryFailedAnalysis,
      regenerateDraft,
      discardDraft,
      analysisStatus,
      analysisProgress,
      analysisError,
      currentAnalysisBatchId,
      currentBatchResults,
      currentBatchSummary,
      isAnalyzingEmails,
      isWorkerRunning,
    }),
    [triageResults, aiDrafts, mailTodos, triggerAnalysis, enqueueMail, retryFailedAnalysis, regenerateDraft, discardDraft, analysisStatus, analysisProgress, analysisError, currentAnalysisBatchId, currentBatchResults, currentBatchSummary, isAnalyzingEmails, isWorkerRunning],
  )

  return <MailTriageContext.Provider value={value}>{children}</MailTriageContext.Provider>
}

/* ------------------------------------------------------------------ */
/*  Internal placeholder result builders                              */
/* ------------------------------------------------------------------ */

function buildPendingResult(
  job: Pick<EmailAnalysisJobSnapshot, 'mailId' | 'messageId' | 'sourceMailKey' | 'accountId' | 'bodyHash' | 'status' | 'createdAt' | 'updatedAt' | 'messageUid'>,
  mail: MailItem | undefined,
): AiMailTriageResult {
  return {
    mailId: resolveJobMailId(job),
    messageId: mail?.messageId || job.messageId,
    sourceMailKey: mail ? resolveMailStorageKey(mail) : resolveJobMailKey({ accountId: job.accountId, folder: 'INBOX', mailId: resolveJobMailId(job), messageId: job.messageId, messageUid: job.messageUid, sourceMailKey: job.sourceMailKey }),
    mailKey: mail ? resolveMailStorageKey(mail) : resolveJobMailKey({ accountId: job.accountId, folder: 'INBOX', mailId: resolveJobMailId(job), messageId: job.messageId, messageUid: job.messageUid, sourceMailKey: job.sourceMailKey }),
    accountId: job.accountId,
    bodyHash: job.bodyHash || '',
    category: 'unknown',
    priority: 'medium',
    needsReply: false,
    needsUserAction: false,
    canAutoArchive: false,
    riskLevel: 'none',
    summary: mail?.subject?.slice(0, 20) ?? '',
    reason: '',
    suggestedAction: '',
    status: job.status === 'running' ? 'running' : 'pending',
    folder: mail?.folder?.toUpperCase() || 'INBOX',
    promptVersion: MAIL_ANALYSIS_PROMPT_VERSION,
    createdAt: job.createdAt,
    updatedAt: now(),
  }
}

function buildFailedResult(
  job: Pick<EmailAnalysisJobSnapshot, 'mailId' | 'messageId' | 'sourceMailKey' | 'accountId' | 'bodyHash' | 'createdAt' | 'updatedAt' | 'stage' | 'errorCode' | 'retryCount' | 'durationMs' | 'bodyLength' | 'truncated' | 'messageUid'>,
  mail: MailItem | undefined,
  errorMessage: string,
): AiMailTriageResult {
  return {
    mailId: resolveJobMailId(job),
    messageId: mail?.messageId || job.messageId,
    sourceMailKey: mail ? resolveMailStorageKey(mail) : resolveJobMailKey({ accountId: job.accountId, folder: 'INBOX', mailId: resolveJobMailId(job), messageId: job.messageId, messageUid: job.messageUid, sourceMailKey: job.sourceMailKey }),
    mailKey: mail ? resolveMailStorageKey(mail) : resolveJobMailKey({ accountId: job.accountId, folder: 'INBOX', mailId: resolveJobMailId(job), messageId: job.messageId, messageUid: job.messageUid, sourceMailKey: job.sourceMailKey }),
    accountId: job.accountId,
    bodyHash: job.bodyHash || '',
    category: 'unknown',
    priority: 'medium',
    needsReply: false,
    needsUserAction: false,
    canAutoArchive: false,
    riskLevel: 'none',
    summary: mail?.subject.slice(0, 20) || '邮件分析失败',
    reason: '',
    suggestedAction: '',
    status: 'failed',
    errorMessage,
    analysisStage: job.stage,
    errorCode: job.errorCode,
    retryCount: job.retryCount,
    durationMs: job.durationMs,
    bodyLength: job.bodyLength,
    truncated: job.truncated,
    folder: mail?.folder?.toUpperCase() || 'INBOX',
    promptVersion: MAIL_ANALYSIS_PROMPT_VERSION,
    createdAt: job.createdAt,
    updatedAt: now(),
  }
}

function jobToTriageResult(job: EmailAnalysisJobSnapshot | undefined, mail?: MailItem): AiMailTriageResult | null {
  if (!job?.result) return null
  const mailId = resolveJobMailId(job)
  const mailKey = job.result.sourceMailKey || job.result.mailKey || (mail ? resolveMailStorageKey(mail) : resolveJobMailKey(job))
  return {
    ...job.result,
    mailId: job.result.mailId || mailId,
    messageId: job.result.messageId || mail?.messageId || job.messageId,
    sourceMailKey: mailKey,
    mailKey,
    accountId: job.result.accountId || job.accountId,
    folder: job.result.folder || job.folder,
    promptVersion: job.result.promptVersion || MAIL_ANALYSIS_PROMPT_VERSION,
    bodyHash: job.result.bodyHash || job.bodyHash || '',
    status:
      job.result.status === 'success' || job.result.status === 'failed' || job.result.status === 'skipped'
        ? job.result.status
        : job.status === 'done'
          ? 'success'
          : job.status === 'failed'
            ? 'failed'
            : 'skipped',
    analysisStage: job.result.analysisStage || job.stage,
    errorCode: job.result.errorCode || job.errorCode,
    retryCount: job.result.retryCount ?? job.retryCount,
    durationMs: job.result.durationMs ?? job.durationMs,
    bodyLength: job.result.bodyLength ?? job.bodyLength,
    truncated: job.result.truncated ?? job.truncated,
    createdAt: job.result.createdAt || job.createdAt,
    updatedAt: job.result.updatedAt || job.updatedAt,
  }
}

function buildSyntheticMail(
  mailId: string,
  job?: EmailAnalysisJobSnapshot,
  triage?: AiMailTriageResult | null,
): MailItem {
  return normalizeMailBase({
    id: mailId,
    accountId: job?.accountId || triage?.accountId,
    from: '',
    fromName: '',
    to: '',
    toName: '',
    subject: job?.subject || triage?.summary || '邮件分析结果',
    body: '',
    receivedAt: job?.finishedAt || job?.updatedAt || now(),
    internalDate: job?.updatedAt || now(),
    date: job?.updatedAt || now(),
    createdAt: job?.createdAt || now(),
    timestamp: job?.finishedAt || job?.updatedAt || now(),
    unread: false,
    replied: false,
    folder: 'inbox',
    uid: job?.messageUid || mailId,
    uidValidity: '',
    messageId: triage?.messageId || job?.messageId,
  }, job?.accountId || triage?.accountId)
}

function buildJobPendingAnalysisResult(
  mail: MailItem,
  batchId: string,
  job: EmailAnalysisJobSnapshot,
): EmailAnalysisResult {
  return {
    mailId: mail.id,
    messageId: mail.messageId || job.messageId,
    sourceMailKey: mail.mailKey || job.sourceMailKey || getMailKey(mail),
    mailKey: mail.mailKey || getMailKey(mail),
    threadId: mail.threadId,
    status: job.status,
    fromName: mail.fromName,
    fromEmail: mail.from,
    subject: mail.subject,
    receivedAt: mail.receivedAt || mail.internalDate || mail.date || mail.sentAt || mail.createdAt || mail.timestamp,
    importance: 'normal',
    category: 'unknown',
    actionType: 'no_action',
    summary: mail.subject || '邮件分析进行中',
    reason: '',
    hasDraftReply: false,
    batchId,
    retryCount: job.retryCount,
    bodyLength: job.bodyLength,
    truncated: job.truncated,
  }
}

function buildLocalPendingAnalysisResult(
  mail: MailItem,
  batchId: string,
): EmailAnalysisResult {
  return {
    mailId: mail.id,
    messageId: mail.messageId,
    sourceMailKey: mail.mailKey || getMailKey(mail),
    mailKey: mail.mailKey || getMailKey(mail),
    threadId: mail.threadId,
    status: 'pending',
    fromName: mail.fromName,
    fromEmail: mail.from,
    subject: mail.subject,
    receivedAt: mail.receivedAt || mail.internalDate || mail.date || mail.sentAt || mail.createdAt || mail.timestamp,
    importance: 'normal',
    category: 'unknown',
    actionType: 'no_action',
    summary: mail.subject || '邮件分析进行中',
    reason: '',
    hasDraftReply: false,
    batchId,
  }
}

function buildPreflightSkippedAnalysisResult(
  mail: MailItem,
  batchId: string,
  reason: string,
): EmailAnalysisResult {
  return {
    mailId: mail.id || getMailKey(mail),
    messageId: mail.messageId,
    sourceMailKey: mail.mailKey || getMailKey(mail),
    mailKey: mail.mailKey || getMailKey(mail),
    threadId: mail.threadId,
    status: 'skipped',
    fromName: mail.fromName,
    fromEmail: mail.from,
    subject: mail.subject,
    receivedAt: mail.receivedAt || mail.internalDate || mail.date || mail.sentAt || mail.createdAt || mail.timestamp,
    importance: 'normal',
    category: 'unknown',
    actionType: 'no_action',
    summary: mail.subject || '邮件已跳过',
    reason,
    hasDraftReply: false,
    batchId,
    errorCode: 'MISSING_MAIL_ID',
  }
}

function buildJobFailedAnalysisResult(
  mail: MailItem,
  batchId: string,
  job: EmailAnalysisJobSnapshot,
): EmailAnalysisResult {
  return {
    mailId: mail.id,
    messageId: mail.messageId || job.messageId,
    sourceMailKey: mail.mailKey || job.sourceMailKey || getMailKey(mail),
    mailKey: mail.mailKey || getMailKey(mail),
    threadId: mail.threadId,
    status: 'failed',
    fromName: mail.fromName,
    fromEmail: mail.from,
    subject: mail.subject,
    receivedAt: mail.receivedAt || mail.internalDate || mail.date || mail.sentAt || mail.createdAt || mail.timestamp,
    importance: 'normal',
    category: 'unknown',
    actionType: 'no_action',
    summary: mail.subject || '邮件分析失败',
    reason: job.error || '',
    hasDraftReply: false,
    batchId,
    stage: job.stage,
    errorCode: job.errorCode,
    retryCount: job.retryCount,
    bodyLength: job.bodyLength,
    truncated: job.truncated,
    error: job.error || '分析失败',
  }
}
