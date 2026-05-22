import { Router } from 'express'
import { requireAccountUser } from '../../lib/authUser'
import { appendMessage, listMessages, listRooms } from './services/chatStore'
import { addEvidence, createMatter } from '../aios/services/matterService'

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

router.post('/rooms/:roomId/matter', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const rooms = listRooms(userId)
  const room = rooms.find((item) => item.id === req.params.roomId)
  if (!room) {
    res.status(404).json({ success: false, error: '会话不存在或无权访问' })
    return
  }
  const title = String(req.body?.title || `聊天事项：${room.title}`).trim()
  const workspacePath = String(req.body?.workspacePath || '').trim()
  if (!workspacePath) {
    res.status(400).json({ success: false, error: 'workspacePath 不能为空' })
    return
  }
  const recentMessages = listMessages(room.id).slice(-5)
  const matter = createMatter(userId, {
    title,
    goal: String(req.body?.goal || '根据聊天上下文形成事项').trim(),
    sourceType: 'manual',
    status: 'draft',
    workspacePath,
    routeType: 'point_to_many',
  })
  const evidence = addEvidence(userId, matter.id, {
    type: 'note',
    title: `聊天记录：${room.title}`,
    content: recentMessages.map((message) => `${message.senderId}: ${message.body}`).join('\n'),
    sourceRef: room.id,
  })
  res.status(201).json({
    success: true,
    matter,
    evidence,
    partialMissing: CHAT_PARTIAL_MISSING,
  })
})

export default router
