/**
 * Web 日程：platformApi.calendar ↔ calendar/types 字段映射
 */
import { platformApi } from '../../../platform'
import type { CalendarEvent as PlatformCalendarEvent } from '../../../platform/types'
import type { CalendarEvent } from './types'

function compareByStartTime(a: CalendarEvent, b: CalendarEvent): number {
  return a.startTime.localeCompare(b.startTime)
}

function mapFromServer(ev: PlatformCalendarEvent): CalendarEvent {
  const ts = new Date().toISOString()
  return {
    id: ev.id,
    title: ev.title,
    description: ev.notes,
    startTime: ev.startAt,
    endTime: ev.endAt,
    status: 'confirmed',
    eventType: 'meeting',
    source: 'manual',
    createdAt: ts,
    updatedAt: ts,
  }
}

function toServerPayload(
  input: Partial<CalendarEvent> & Pick<CalendarEvent, 'title' | 'startTime'>,
): Partial<PlatformCalendarEvent> & Pick<PlatformCalendarEvent, 'title' | 'startAt' | 'endAt'> {
  const startAt = input.startTime
  const endAt = input.endTime || input.startTime
  return {
    title: input.title,
    startAt,
    endAt,
    notes: input.description,
  }
}

export async function listCalendarEvents(): Promise<CalendarEvent[]> {
  const events = await platformApi.calendar.listEvents()
  return events.map(mapFromServer).sort(compareByStartTime)
}

export async function getCalendarEventById(id: string): Promise<CalendarEvent | null> {
  return (await listCalendarEvents()).find((event) => event.id === id) ?? null
}

export async function createCalendarEvent(
  input: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<CalendarEvent> {
  const payload = toServerPayload(input)
  const created = await platformApi.calendar.createEvent({
    title: payload.title,
    startAt: payload.startAt,
    endAt: payload.endAt,
    notes: payload.notes,
  })
  return mapFromServer(created)
}

export async function updateCalendarEvent(
  id: string,
  patch: Partial<Omit<CalendarEvent, 'id' | 'createdAt'>>,
): Promise<CalendarEvent | null> {
  const existing = await getCalendarEventById(id)
  if (!existing) return null

  const merged: CalendarEvent = {
    ...existing,
    ...patch,
    id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  }

  const payload = toServerPayload(merged)
  const updated = await platformApi.calendar.updateEvent(id, {
    title: payload.title,
    startAt: payload.startAt,
    endAt: payload.endAt,
    notes: payload.notes,
  })
  return mapFromServer(updated)
}

export async function deleteCalendarEvent(id: string): Promise<boolean> {
  try {
    await platformApi.calendar.deleteEvent(id)
    return true
  } catch {
    return false
  }
}

export async function listCalendarEventsByRange(
  startTime: string,
  endTime: string,
): Promise<CalendarEvent[]> {
  const start = new Date(startTime).getTime()
  const end = new Date(endTime).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end)) return []
  return (await listCalendarEvents()).filter((event) => {
    const eventStart = new Date(event.startTime).getTime()
    if (!Number.isFinite(eventStart)) return false
    return eventStart >= start && eventStart <= end
  })
}
