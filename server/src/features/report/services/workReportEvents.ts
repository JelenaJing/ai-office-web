export interface WorkReportEvent {
  id: string
  userId: string
  type: string
  title: string
  summary?: string
  module?: string
  createdAt: string
  metadata?: Record<string, unknown>
}

const events = new Map<string, WorkReportEvent[]>()

export function addWorkReportEvent(event: WorkReportEvent): void {
  const list = events.get(event.userId) ?? []
  list.unshift(event)
  events.set(event.userId, list.slice(0, 500))
}

export function listWorkReportEvents(userId: string, date?: string): WorkReportEvent[] {
  const list = events.get(userId) ?? []
  if (!date) return list
  return list.filter((event) => event.createdAt.slice(0, 10) === date)
}
