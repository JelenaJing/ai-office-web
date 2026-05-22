import { randomUUID } from 'crypto'

export interface ChatMessage {
  id: string
  roomId: string
  senderId: string
  body: string
  createdAt: string
  attachmentIds?: string[]
}

export interface ChatRoom {
  id: string
  title: string
  memberIds: string[]
  createdAt: string
  unreadCount: number
}

const rooms = new Map<string, ChatRoom>()
const messages = new Map<string, ChatMessage[]>()

export function listRooms(userId: string): ChatRoom[] {
  if (rooms.size === 0) {
    const room: ChatRoom = {
      id: 'web-internal-general',
      title: '内部消息（Web partial）',
      memberIds: [userId],
      createdAt: new Date().toISOString(),
      unreadCount: 0,
    }
    rooms.set(room.id, room)
    messages.set(room.id, [])
  }
  return Array.from(rooms.values()).filter((room) => room.memberIds.includes(userId))
}

export function listMessages(roomId: string): ChatMessage[] {
  return messages.get(roomId) ?? []
}

export function appendMessage(input: {
  roomId: string
  senderId: string
  body: string
  attachmentIds?: string[]
}): ChatMessage {
  const room = rooms.get(input.roomId)
  if (!room) {
    throw new Error('会话不存在')
  }
  const message: ChatMessage = {
    id: randomUUID(),
    roomId: input.roomId,
    senderId: input.senderId,
    body: input.body,
    attachmentIds: input.attachmentIds,
    createdAt: new Date().toISOString(),
  }
  const list = messages.get(input.roomId) ?? []
  list.push(message)
  messages.set(input.roomId, list.slice(-500))
  return message
}
