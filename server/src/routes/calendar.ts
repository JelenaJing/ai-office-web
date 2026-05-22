import { Router } from 'express'
import { requireAccountUser } from '../lib/authUser'
import {
  createEvent,
  deleteEvent,
  listEvents,
  updateEvent,
} from '../modules/calendar'

const router = Router()

router.get('/events', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  res.json({ events: listEvents(userId) })
})

router.post('/events', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const { title, startAt, endAt, notes } = req.body as {
    title?: string
    startAt?: string
    endAt?: string
    notes?: string
  }
  if (!title?.trim() || !startAt || !endAt) {
    return res.status(400).json({ message: '标题、开始时间、结束时间必填' })
  }
  const event = createEvent(userId, {
    title: title.trim(),
    startAt,
    endAt,
    notes: notes?.trim(),
  })
  res.status(201).json({ event })
})

router.patch('/events/:id', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const updated = updateEvent(userId, req.params.id, req.body)
  if (!updated) return res.status(404).json({ message: '事件不存在' })
  res.json({ event: updated })
})

router.delete('/events/:id', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  if (!deleteEvent(userId, req.params.id)) {
    return res.status(404).json({ message: '事件不存在' })
  }
  res.json({ success: true })
})

export default router
