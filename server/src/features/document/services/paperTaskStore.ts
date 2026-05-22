import { randomUUID } from 'crypto'
import type { PaperWorkflowPaperType, PaperWorkflowGenerateResult } from './paperWorkflowService'

export type PaperTaskStatus = 'queued' | 'running' | 'completed' | 'failed'

export interface PaperTaskRecord {
  taskId: string
  paperType: PaperWorkflowPaperType
  status: PaperTaskStatus
  progress: number
  message: string
  partialMarkdown?: string
  result?: Omit<PaperWorkflowGenerateResult, 'success'>
  error?: string
  createdAt: number
  updatedAt: number
}

const tasks = new Map<string, PaperTaskRecord>()

// Evict tasks older than 1 hour to prevent unbounded memory growth
const TASK_TTL_MS = 60 * 60 * 1000
setInterval(() => {
  const cutoff = Date.now() - TASK_TTL_MS
  for (const [id, task] of tasks.entries()) {
    if (task.createdAt < cutoff) tasks.delete(id)
  }
}, 5 * 60 * 1000).unref()

export function createPaperTask(paperType: PaperWorkflowPaperType): PaperTaskRecord {
  const taskId = randomUUID()
  const now = Date.now()
  const task: PaperTaskRecord = {
    taskId,
    paperType,
    status: 'queued',
    progress: 0,
    message: '任务已排队',
    createdAt: now,
    updatedAt: now,
  }
  tasks.set(taskId, task)
  return task
}

export function getPaperTask(taskId: string): PaperTaskRecord | undefined {
  return tasks.get(taskId)
}

export function updatePaperTask(taskId: string, patch: Partial<PaperTaskRecord>): void {
  const task = tasks.get(taskId)
  if (!task) return
  Object.assign(task, patch, { updatedAt: Date.now() })
}
