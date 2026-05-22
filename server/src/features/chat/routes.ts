import { Router } from 'express'
import { requireAccountUser } from '../../lib/authUser'
import { appendMessage, listMessages, listRooms } from './services/chatStore'

const router = Router()

const CHAT_PARTIAL_MISSING = [
  'Matrix/IM provider bridge is not fully ported',
  'attachments are linked by Artifact id only',
  'chat-to-Matter and chat-to-daily-report automation are partial',
]

router.get('/rooms', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  res.json({ success: true, rooms: listRooms(userId), partialMissing: CHAT_PARTIAL_MISSING })
})

router.get('/rooms/:roomId/messages', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const rooms = listRooms(userId)
  if (!rooms.some((room) => room.id === req.params.roomId)) {
    res.status(404).json({ success: false, error: '会话不存在或无权访问' })
    return
  }
  res.json({ success: true, messages: listMessages(req.params.roomId), partialMissing: CHAT_PARTIAL_MISSING })
})

router.post('/rooms/:roomId/messages', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const body = String(req.body?.body || req.body?.text || '').trim()
  if (!body) {
    res.status(400).json({ success: false, error: '消息内容不能为空' })
    return
  }
  try {
    const message = appendMessage({
      roomId: req.params.roomId,
      senderId: userId,
      body,
      attachmentIds: Array.isArray(req.body?.attachmentIds)
        ? req.body.attachmentIds.map((item: unknown) => String(item)).filter(Boolean)
        : undefined,
    })
    res.json({ success: true, message, partialMissing: CHAT_PARTIAL_MISSING })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    res.status(404).json({ success: false, error: message })
  }
})

router.post('/rooms/:roomId/attachments', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const artifactId = String(req.body?.artifactId || '').trim()
  if (!artifactId) {
    res.status(400).json({ success: false, error: 'artifactId 不能为空' })
    return
  }
  try {
    const message = appendMessage({
      roomId: req.params.roomId,
      senderId: userId,
      body: req.body?.caption ? String(req.body.caption) : '附件',
      attachmentIds: [artifactId],
    })
    res.json({ success: true, message, partialMissing: CHAT_PARTIAL_MISSING })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    res.status(404).json({ success: false, error: message })
  }
})

export default router
