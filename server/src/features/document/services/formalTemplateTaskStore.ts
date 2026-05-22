import { randomUUID } from 'crypto'
import type {
  FormalTemplateGenerateResult,
  FormalTemplateWorkflowStep,
} from './formalTemplateService'

export type FormalTemplateTaskStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface FormalTemplateTaskRecord {
  taskId: string
  presetId: string
  status: FormalTemplateTaskStatus
  progress: number
  step: string
  message: string
  partialMarkdown?: string
  partialHtml?: string
  result?: Omit<FormalTemplateGenerateResult, 'success'>
  error?: string
  cancelRequested: boolean
  createdAt: number
  updatedAt: number
}

const tasks = new Map<string, FormalTemplateTaskRecord>()

const TASK_TTL_MS = 60 * 60 * 1000
setInterval(() => {
  const cutoff = Date.now() - TASK_TTL_MS
  for (const [taskId, task] of tasks.entries()) {
    if (task.createdAt < cutoff) tasks.delete(taskId)
  }
}, 5 * 60 * 1000).unref()

export function createFormalTemplateTask(presetId: string): FormalTemplateTaskRecord {
  const taskId = randomUUID()
  const now = Date.now()
  const record: FormalTemplateTaskRecord = {
    taskId,
    presetId,
    status: 'queued',
    progress: 0,
    step: 'queued',
    message: '任务已排队',
    cancelRequested: false,
    createdAt: now,
    updatedAt: now,
  }
  tasks.set(taskId, record)
  return record
}

export function getFormalTemplateTask(taskId: string): FormalTemplateTaskRecord | undefined {
  return tasks.get(taskId)
}

export function updateFormalTemplateTask(
  taskId: string,
  patch: Partial<FormalTemplateTaskRecord> | FormalTemplateWorkflowStep,
): void {
  const record = tasks.get(taskId)
  if (!record) return
  Object.assign(record, patch, { updatedAt: Date.now() })
}

export function requestFormalTemplateTaskCancel(taskId: string): FormalTemplateTaskRecord | undefined {
  const record = tasks.get(taskId)
  if (!record) return undefined
  record.cancelRequested = true
  record.status = 'cancelled'
  record.step = 'cancelled'
  record.message = '任务已取消'
  record.updatedAt = Date.now()
  return record
}
