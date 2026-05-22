import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

const CALENDAR_ROOT = path.resolve(__dirname, '../../../data/calendar')

export interface CalendarEventRecord {
  id: string
  title: string
  startAt: string
  endAt: string
  notes?: string
}

interface CalendarFile {
  events: CalendarEventRecord[]
}

function filePath(userId: string): string {
  const safe = userId.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 64)
  return path.join(CALENDAR_ROOT, `${safe}.json`)
}

function readFile(userId: string): CalendarFile {
  const p = filePath(userId)
  fs.mkdirSync(CALENDAR_ROOT, { recursive: true })
  if (!fs.existsSync(p)) return { events: [] }
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8')) as CalendarFile
  } catch {
    return { events: [] }
  }
}

function writeStore(userId: string, data: CalendarFile): void {
  fs.mkdirSync(CALENDAR_ROOT, { recursive: true })
  fs.writeFileSync(filePath(userId), JSON.stringify(data, null, 2), 'utf-8')
}

export function listEvents(userId: string): CalendarEventRecord[] {
  return readFile(userId).events.sort((a, b) => a.startAt.localeCompare(b.startAt))
}

export function createEvent(
  userId: string,
  input: Omit<CalendarEventRecord, 'id'>,
): CalendarEventRecord {
  const store = readFile(userId)
  const event: CalendarEventRecord = { ...input, id: randomUUID() }
  store.events.push(event)
  writeStore(userId, store)
  return event
}

export function updateEvent(
  userId: string,
  id: string,
  patch: Partial<Omit<CalendarEventRecord, 'id'>>,
): CalendarEventRecord | null {
  const store = readFile(userId)
  const idx = store.events.findIndex((e) => e.id === id)
  if (idx < 0) return null
  store.events[idx] = { ...store.events[idx], ...patch, id }
  writeStore(userId, store)
  return store.events[idx]
}

export function deleteEvent(userId: string, id: string): boolean {
  const store = readFile(userId)
  const before = store.events.length
  store.events = store.events.filter((e) => e.id !== id)
  if (store.events.length === before) return false
  writeStore(userId, store)
  return true
}
