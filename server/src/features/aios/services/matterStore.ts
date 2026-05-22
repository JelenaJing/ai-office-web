/**
 * matterStore.ts — File-based storage for AIOS Matters and Evidence
 *
 * Storage layout:
 *   server/data/aios/{userId}/matters.json   — matter index
 *   server/data/aios/{userId}/evidence.json  — evidence index
 *   server/data/aios/{userId}/audit.jsonl    — append-only audit trail
 */

import fs from 'fs'
import path from 'path'
import type { MatterIndex, EvidenceIndex, AuditEvent } from '../types'

const AIOS_ROOT = path.resolve(__dirname, '../../../../data/aios')

function aiosDir(userId: string): string {
  return path.join(AIOS_ROOT, userId)
}

function mattersPath(userId: string): string {
  return path.join(aiosDir(userId), 'matters.json')
}

function evidencePath(userId: string): string {
  return path.join(aiosDir(userId), 'evidence.json')
}

function auditPath(userId: string): string {
  return path.join(aiosDir(userId), 'audit.jsonl')
}

function ensureDir(userId: string): void {
  fs.mkdirSync(aiosDir(userId), { recursive: true })
}

// ── Matters ───────────────────────────────────────────────────────────────────

export function readMatters(userId: string): MatterIndex {
  ensureDir(userId)
  const p = mattersPath(userId)
  if (!fs.existsSync(p)) return { matters: [] }
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8')) as MatterIndex
  } catch {
    return { matters: [] }
  }
}

export function writeMatters(userId: string, index: MatterIndex): void {
  ensureDir(userId)
  fs.writeFileSync(mattersPath(userId), JSON.stringify(index, null, 2), 'utf-8')
}

// ── Evidence ──────────────────────────────────────────────────────────────────

export function readEvidence(userId: string): EvidenceIndex {
  ensureDir(userId)
  const p = evidencePath(userId)
  if (!fs.existsSync(p)) return { evidence: [] }
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8')) as EvidenceIndex
  } catch {
    return { evidence: [] }
  }
}

export function writeEvidence(userId: string, index: EvidenceIndex): void {
  ensureDir(userId)
  fs.writeFileSync(evidencePath(userId), JSON.stringify(index, null, 2), 'utf-8')
}

// ── Audit Trail ───────────────────────────────────────────────────────────────

export function appendAudit(userId: string, event: AuditEvent): void {
  ensureDir(userId)
  fs.appendFileSync(auditPath(userId), JSON.stringify(event) + '\n', 'utf-8')
}

export function readAudit(userId: string, matterId?: string): AuditEvent[] {
  ensureDir(userId)
  const p = auditPath(userId)
  if (!fs.existsSync(p)) return []
  const lines = fs.readFileSync(p, 'utf-8').trim().split('\n').filter(Boolean)
  const events: AuditEvent[] = []
  for (const line of lines) {
    try {
      const ev = JSON.parse(line) as AuditEvent
      if (!matterId || ev.matterId === matterId) events.push(ev)
    } catch {
      // skip malformed lines
    }
  }
  return events
}
