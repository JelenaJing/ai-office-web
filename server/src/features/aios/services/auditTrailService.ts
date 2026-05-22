/**
 * auditTrailService.ts — Append audit events for all AIOS actions
 */

import { randomUUID } from 'crypto'
import { appendAudit, readAudit } from './matterStore'
import type { AuditEvent } from '../types'

export function logAudit(
  userId: string,
  matterId: string,
  action: AuditEvent['action'],
  detail: Record<string, unknown> = {},
): AuditEvent {
  const event: AuditEvent = {
    id: randomUUID(),
    matterId,
    actorId: userId,
    action,
    detail,
    createdAt: new Date().toISOString(),
  }
  appendAudit(userId, event)
  return event
}

export function getAuditTrail(userId: string, matterId: string): AuditEvent[] {
  return readAudit(userId, matterId)
}
