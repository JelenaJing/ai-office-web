// calendar module — Web feature boundary
export { default as WebCalendarPanel } from './components/WebCalendarPanel' // temporary
export * from './services/calendarService'
// Note: calendarRuntime re-exports are omitted to avoid name conflicts with calendarService
