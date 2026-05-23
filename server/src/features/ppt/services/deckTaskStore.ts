import { randomUUID } from 'crypto'
import type { WebDeckDocument, WebDeckRuntimeMeta, WebDeckTaskResult, WebDeckTaskStatus } from '../types'

export interface WebDeckTaskRecord {
  taskId: string
  deckId?: string
  status: WebDeckTaskStatus
  progress: number
  message: string
  result?: WebDeckTaskResult
  error?: string
  cancelRequested: boolean
  createdAt: number
  updatedAt: number
}

const tasks = new Map<string, WebDeckTaskRecord>()
const decks = new Map<string, WebDeckDocument>()
const deckRuntimeMeta = new Map<string, WebDeckRuntimeMeta>()

const TASK_TTL_MS = 60 * 60 * 1000
setInterval(() => {
  const cutoff = Date.now() - TASK_TTL_MS
  for (const [taskId, task] of tasks.entries()) {
    if (task.createdAt < cutoff) tasks.delete(taskId)
  }
}, 5 * 60 * 1000).unref()

export function createDeckTask(): WebDeckTaskRecord {
  const now = Date.now()
  const task: WebDeckTaskRecord = {
    taskId: randomUUID(),
    status: 'queued',
    progress: 0,
    message: '任务已排队',
    cancelRequested: false,
    createdAt: now,
    updatedAt: now,
  }
  tasks.set(task.taskId, task)
  return task
}

export function getDeckTask(taskId: string): WebDeckTaskRecord | undefined {
  return tasks.get(taskId)
}

export function getDeckTaskByDeckId(deckId: string): WebDeckTaskRecord | undefined {
  for (const task of tasks.values()) {
    if (task.deckId === deckId || task.result?.deckId === deckId) return task
  }
  return undefined
}

export function updateDeckTask(taskId: string, patch: Partial<WebDeckTaskRecord>): void {
  const task = tasks.get(taskId)
  if (!task) return
  Object.assign(task, patch, { updatedAt: Date.now() })
  if (patch.result?.deck) {
    decks.set(patch.result.deck.deckId, patch.result.deck)
  }
}

export function requestDeckTaskCancel(taskId: string): WebDeckTaskRecord | undefined {
  const task = tasks.get(taskId)
  if (!task) return undefined
  task.cancelRequested = true
  task.status = 'cancelled'
  task.message = '任务已取消'
  task.updatedAt = Date.now()
  return task
}

export function getDeck(deckId: string): WebDeckDocument | undefined {
  return decks.get(deckId)
}

export function saveDeck(deck: WebDeckDocument): WebDeckDocument {
  decks.set(deck.deckId, deck)
  return deck
}

export function getDeckRuntimeMeta(deckId: string): WebDeckRuntimeMeta | undefined {
  return deckRuntimeMeta.get(deckId)
}

export function saveDeckRuntimeMeta(meta: WebDeckRuntimeMeta): WebDeckRuntimeMeta {
  deckRuntimeMeta.set(meta.deckId, meta)
  return meta
}
