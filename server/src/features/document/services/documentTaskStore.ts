import { randomUUID } from 'crypto'
import type { DocumentRecord, DocumentTaskRecord } from '../types'

const tasks = new Map<string, DocumentTaskRecord>()
const documents = new Map<string, DocumentRecord>()

const TASK_TTL_MS = 60 * 60 * 1000
setInterval(() => {
  const cutoff = Date.now() - TASK_TTL_MS
  for (const [taskId, task] of tasks.entries()) {
    if (task.createdAt < cutoff) tasks.delete(taskId)
  }
}, 5 * 60 * 1000).unref()

export function createDocumentTask(): DocumentTaskRecord {
  const now = Date.now()
  const task: DocumentTaskRecord = {
    taskId: randomUUID(),
    status: 'queued',
    progress: 0,
    message: '任务已排队',
    cancelRequested: false,
    lastProgressMessage: '任务已排队',
    createdAt: now,
    updatedAt: now,
  }
  tasks.set(task.taskId, task)
  return task
}

export function getDocumentTask(taskId: string): DocumentTaskRecord | undefined {
  return tasks.get(taskId)
}

export function updateDocumentTask(taskId: string, patch: Partial<DocumentTaskRecord>): void {
  const task = tasks.get(taskId)
  if (!task) return
  Object.assign(task, patch, {
    lastProgressMessage: patch.message ?? task.lastProgressMessage,
    updatedAt: Date.now(),
  })
}

export function saveDocumentRecord(record: DocumentRecord): DocumentRecord {
  documents.set(record.documentId, record)
  return record
}

export function getDocumentRecord(documentId: string): DocumentRecord | undefined {
  return documents.get(documentId)
}
