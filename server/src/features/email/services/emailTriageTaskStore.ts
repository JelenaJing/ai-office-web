import { randomUUID } from 'crypto'

export type EmailAnalysisTaskStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
export type EmailAnalysisJobStatus = 'pending' | 'running' | 'done' | 'failed' | 'skipped'
export type EmailAnalysisFailureStage =
  | 'fetch_body'
  | 'normalize'
  | 'llm_request'
  | 'llm_response'
  | 'json_parse'
  | 'save_result'
export type EmailAnalysisErrorCode =
  | 'BODY_INCOMPLETE'
  | 'FETCH_BODY_FAILED'
  | 'MESSAGE_NOT_FOUND'
  | 'BODY_EMPTY'
  | 'EMPTY_BODY'
  | 'HTML_CLEAN_FAILED'
  | 'BODY_TOO_LONG'
  | 'LLM_TIMEOUT'
  | 'TIMEOUT'
  | 'MODEL_UNAVAILABLE'
  | 'AI_MODEL_ERROR'
  | 'LLM_REQUEST_FAILED'
  | 'LLM_NON_JSON'
  | 'JSON_PARSE_FAILED'
  | 'RESPONSE_PARSE_FAILED'
  | 'SAVE_FAILED'
  | 'ALREADY_ANALYZED'
  | 'ATTACHMENT_ONLY'
  | 'SYSTEM_DELIVERY_NOTICE'
  | 'MISSING_MAIL_ID'
  | 'MISSING_SOURCE_MAIL_KEY'
  | 'INVALID_ANALYSIS_PAYLOAD'

export interface EmailAnalysisReasonCount {
  key: string
  label: string
  count: number
}

export interface EmailAnalysisTaskSummary {
  total: number
  pending: number
  running: number
  done: number
  failed: number
  skipped: number
  cached: number
  failureReasons: EmailAnalysisReasonCount[]
}

export interface EmailAnalysisJobRecord {
  jobId: string
  accountId: string
  folder: string
  mailId: string
  /** RFC 2822 Message-ID header value. */
  messageId?: string
  sourceMailKey?: string
  messageUid: string
  status: EmailAnalysisJobStatus
  subject?: string
  subjectHash?: string
  cacheKey?: string
  cacheHit?: boolean
  bodyHash?: string
  bodyLength?: number
  truncated?: boolean
  retryCount: number
  stage?: EmailAnalysisFailureStage
  errorCode?: EmailAnalysisErrorCode
  error?: string
  rawOutputPreview?: string
  durationMs?: number
  startedAt?: string
  finishedAt?: string
  result?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface EmailTriageTaskRecord {
  taskId: string
  status: EmailAnalysisTaskStatus
  progress: number
  message: string
  jobs: EmailAnalysisJobRecord[]
  summary: EmailAnalysisTaskSummary
  unreadOnly: boolean
  sourceMessageCount: number
  promptVersion?: string
  modelUnavailable: boolean
  error?: string
  cancelRequested: boolean
  createdAt: number
  updatedAt: number
}

const tasks = new Map<string, EmailTriageTaskRecord>()
const TASK_TTL_MS = 60 * 60 * 1000

setInterval(() => {
  const cutoff = Date.now() - TASK_TTL_MS
  for (const [taskId, task] of tasks.entries()) {
    if (task.createdAt < cutoff) tasks.delete(taskId)
  }
}, 5 * 60 * 1000).unref()

export function emptyEmailAnalysisSummary(): EmailAnalysisTaskSummary {
  return {
    total: 0,
    pending: 0,
    running: 0,
    done: 0,
    failed: 0,
    skipped: 0,
    cached: 0,
    failureReasons: [],
  }
}

export function createEmailTriageTask(): EmailTriageTaskRecord {
  const now = Date.now()
  const task: EmailTriageTaskRecord = {
    taskId: randomUUID(),
    status: 'queued',
    progress: 0,
    message: '任务已排队',
    jobs: [],
    summary: emptyEmailAnalysisSummary(),
    unreadOnly: true,
    sourceMessageCount: 0,
    modelUnavailable: false,
    cancelRequested: false,
    createdAt: now,
    updatedAt: now,
  }
  tasks.set(task.taskId, task)
  return task
}

export function getEmailTriageTask(taskId: string): EmailTriageTaskRecord | undefined {
  return tasks.get(taskId)
}

export function updateEmailTriageTask(taskId: string, patch: Partial<EmailTriageTaskRecord>): void {
  const task = tasks.get(taskId)
  if (!task) return
  Object.assign(task, patch, { updatedAt: Date.now() })
}

export function requestEmailTriageCancel(taskId: string): EmailTriageTaskRecord | undefined {
  const task = tasks.get(taskId)
  if (!task) return undefined
  task.cancelRequested = true
  task.status = 'cancelled'
  task.message = '任务已取消'
  task.updatedAt = Date.now()
  return task
}
