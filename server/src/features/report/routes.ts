import { Router } from 'express'
import { randomUUID } from 'crypto'
import { requireAccountUser } from '../../lib/authUser'
import { runDailyReportSkill } from './skills/dailyReportSkill'
import { getOrCreateDefaultWorkspace } from '../../lib/workspaceStore'
import { addWorkReportEvent, listWorkReportEvents } from './services/workReportEvents'

const router = Router()

const REPORT_PARTIAL_MISSING = [
  'supervisor/subordinate hierarchy is not connected to AccountCenter roles',
  'admin aggregate report is deterministic and not Electron full parity',
  'activity ingestion is in-memory for Web runtime events only',
]

router.post('/events', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const type = String(req.body?.type || req.body?.action || '').trim()
  const title = String(req.body?.title || '').trim()
  if (!type || !title) {
    res.status(400).json({ success: false, error: 'type 和 title 不能为空' })
    return
  }
  const event = {
    id: randomUUID(),
    userId,
    type,
    title,
    summary: typeof req.body?.summary === 'string' ? req.body.summary : undefined,
    module: typeof req.body?.module === 'string' ? req.body.module : undefined,
    createdAt: typeof req.body?.createdAt === 'string' ? req.body.createdAt : new Date().toISOString(),
    metadata: req.body?.metadata && typeof req.body.metadata === 'object' ? req.body.metadata : undefined,
  }
  addWorkReportEvent(event)
  res.json({ success: true, event })
})

router.get('/daily', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const date = typeof req.query.date === 'string' ? req.query.date : new Date().toISOString().slice(0, 10)
  const workspacePath = typeof req.query.workspacePath === 'string'
    ? req.query.workspacePath
    : getOrCreateDefaultWorkspace(userId).path
  const result = await runDailyReportSkill({ userId, workspacePath, date })
  if (!result.success) {
    res.status(result.status ?? 500).json({ success: false, error: result.error })
    return
  }
  res.json({
    success: true,
    date,
    artifactId: result.artifactId,
    artifact: result.artifact,
    events: listWorkReportEvents(userId, date),
    partialMissing: REPORT_PARTIAL_MISSING,
  })
})

router.get('/subordinates', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  res.json({
    success: true,
    subordinates: [],
    partialMissing: REPORT_PARTIAL_MISSING,
  })
})

router.get('/summary', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const date = typeof req.query.date === 'string' ? req.query.date : undefined
  const events = listWorkReportEvents(userId, date)
  res.json({
    success: true,
    date: date ?? null,
    summary: {
      eventCount: events.length,
      modules: events.reduce<Record<string, number>>((acc, event) => {
        const key = event.module || 'unknown'
        acc[key] = (acc[key] ?? 0) + 1
        return acc
      }, {}),
    },
    partialMissing: REPORT_PARTIAL_MISSING,
  })
})

export default router
