import { randomUUID } from 'crypto'

export interface EmailTriageResult {
  messageId: string
  subject: string
  from: string
  priority: 'low' | 'normal' | 'high'
  urgency: 'low' | 'normal' | 'urgent'
  category: 'reply_required' | 'action_required' | 'read_only' | 'risk' | 'unknown'
  summary: string
  needsReply: boolean
  riskLevel: 'none' | 'low' | 'medium' | 'high'
  tasks: string[]
  replyDraft?: string
  status: 'success' | 'skipped' | 'failed'
  partialMissing: string[]
}

export interface EmailTriageTaskRecord {
  taskId: string
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: number
  message: string
  results: EmailTriageResult[]
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

export function createEmailTriageTask(): EmailTriageTaskRecord {
  const now = Date.now()
  const task: EmailTriageTaskRecord = {
    taskId: randomUUID(),
    status: 'queued',
    progress: 0,
    message: '任务已排队',
    results: [],
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
