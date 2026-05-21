/**
 * aiInvocationLog.ts — Append-only JSONL logs (not committed to git).
 */

import fs from 'fs'
import path from 'path'
import { randomUUID, createHash } from 'crypto'

const LOG_ROOT = path.resolve(__dirname, '../../../data/ai-invocations')

export interface AiInvocationRecord {
  id: string
  userId: string
  workspaceId: string
  skillId: string
  model: string
  promptHash: string
  promptLength: number
  outputLength: number
  fallback: boolean
  createdAt: string
}

export function hashPrompt(prompt: string): string {
  return createHash('sha256').update(prompt).digest('hex').slice(0, 16)
}

export function appendAiInvocationLog(record: Omit<AiInvocationRecord, 'id' | 'createdAt'>): void {
  try {
    const day = new Date().toISOString().slice(0, 10)
    fs.mkdirSync(LOG_ROOT, { recursive: true })
    const line = JSON.stringify({
      ...record,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    })
    fs.appendFileSync(path.join(LOG_ROOT, `${day}.jsonl`), `${line}\n`, 'utf-8')
  } catch (err) {
    console.warn('[ai-gateway] failed to write invocation log:', err)
  }
}
