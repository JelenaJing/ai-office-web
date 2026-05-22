import { isWebShim } from '../../../platform/detect'
import type { CalendarEvent } from './types'
import * as calendarRuntime from './calendarRuntime'

const CALENDAR_EVENTS_STORAGE_KEY = 'aioffice.calendar.events.v1'

function now(): string {
  return new Date().toISOString()
}

function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `cal-${crypto.randomUUID()}`
  }
  return `cal-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function compareByStartTime(a: CalendarEvent, b: CalendarEvent): number {
  return a.startTime.localeCompare(b.startTime)
}

function loadEvents(): CalendarEvent[] {
  try {
    const raw = localStorage.getItem(CALENDAR_EVENTS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CalendarEvent[]
    return Array.isArray(parsed) ? parsed.sort(compareByStartTime) : []
  } catch {
    return []
  }
}

function saveEvents(events: CalendarEvent[]): void {
  localStorage.setItem(CALENDAR_EVENTS_STORAGE_KEY, JSON.stringify([...events].sort(compareByStartTime)))
}

async function listCalendarEventsLocal(): Promise<CalendarEvent[]> {
  return loadEvents()
}

async function getCalendarEventByIdLocal(id: string): Promise<CalendarEvent | null> {
  return loadEvents().find((event) => event.id === id) ?? null
}

async function createCalendarEventLocal(
  input: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<CalendarEvent> {
  const ts = now()
  const event: CalendarEvent = {
    ...input,
    id: makeId(),
    createdAt: ts,
    updatedAt: ts,
  }
  const events = [...loadEvents(), event].sort(compareByStartTime)
  saveEvents(events)
  return event
}

async function updateCalendarEventLocal(
  id: string,
  patch: Partial<Omit<CalendarEvent, 'id' | 'createdAt'>>,
): Promise<CalendarEvent | null> {
  const events = loadEvents()
  const index = events.findIndex((event) => event.id === id)
  if (index < 0) return null

  const updated: CalendarEvent = {
    ...events[index],
    ...patch,
    id,
    createdAt: events[index].createdAt,
    updatedAt: now(),
  }
  const nextEvents = [...events.slice(0, index), updated, ...events.slice(index + 1)].sort(compareByStartTime)
  saveEvents(nextEvents)
  return updated
}

async function deleteCalendarEventLocal(id: string): Promise<boolean> {
  const events = loadEvents()
  const nextEvents = events.filter((event) => event.id !== id)
  if (nextEvents.length === events.length) return false
  saveEvents(nextEvents)
  return true
}

async function listCalendarEventsByRangeLocal(
  startTime: string,
  endTime: string,
): Promise<CalendarEvent[]> {
  const start = new Date(startTime).getTime()
  const end = new Date(endTime).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end)) return []
  return loadEvents().filter((event) => {
    const eventStart = new Date(event.startTime).getTime()
    if (!Number.isFinite(eventStart)) return false
    return eventStart >= start && eventStart <= end
  })
}

export async function listCalendarEvents(): Promise<CalendarEvent[]> {
  return isWebShim() ? calendarRuntime.listCalendarEvents() : listCalendarEventsLocal()
}

export async function getCalendarEventById(id: string): Promise<CalendarEvent | null> {
  return isWebShim() ? calendarRuntime.getCalendarEventById(id) : getCalendarEventByIdLocal(id)
}

export async function createCalendarEvent(
  input: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<CalendarEvent> {
  return isWebShim() ? calendarRuntime.createCalendarEvent(input) : createCalendarEventLocal(input)
}

export async function updateCalendarEvent(
  id: string,
  patch: Partial<Omit<CalendarEvent, 'id' | 'createdAt'>>,
): Promise<CalendarEvent | null> {
  return isWebShim() ? calendarRuntime.updateCalendarEvent(id, patch) : updateCalendarEventLocal(id, patch)
}

export async function deleteCalendarEvent(id: string): Promise<boolean> {
  return isWebShim() ? calendarRuntime.deleteCalendarEvent(id) : deleteCalendarEventLocal(id)
}

export async function listCalendarEventsByRange(
  startTime: string,
  endTime: string,
): Promise<CalendarEvent[]> {
  return isWebShim()
    ? calendarRuntime.listCalendarEventsByRange(startTime, endTime)
    : listCalendarEventsByRangeLocal(startTime, endTime)
}
