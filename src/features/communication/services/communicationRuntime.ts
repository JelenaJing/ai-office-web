export interface ChatRoom {
  id: string
  title: string
  memberIds: string[]
  createdAt: string
  unreadCount: number
}

export interface ChatMessage {
  id: string
  roomId: string
  senderId: string
  body: string
  createdAt: string
  attachmentIds?: string[]
}

function token(): string | null {
  if (typeof window === 'undefined') return null
  return (
    window.localStorage.getItem('aios_auth_token')
    ?? window.localStorage.getItem('aios_itoken')
    ?? window.localStorage.getItem('ai_office_internal_token')
  )
}

function headers(json = false): Record<string, string> {
  const t = token()
  const h: Record<string, string> = json ? { 'Content-Type': 'application/json' } : {}
  if (t) h.Authorization = `Bearer ${t}`
  return h
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      ...headers(init?.body != null),
      ...(init?.headers as Record<string, string> | undefined),
    },
  })
  const body = await response.json().catch(() => ({ error: `HTTP ${response.status}` })) as T & { error?: string; message?: string }
  if (!response.ok) throw new Error(body.error || body.message || `请求失败 (${response.status})`)
  return body
}

export async function listChatRooms(): Promise<ChatRoom[]> {
  const body = await api<{ rooms: ChatRoom[] }>('/api/chat/rooms')
  return body.rooms ?? []
}

export async function listChatMessages(roomId: string): Promise<ChatMessage[]> {
  const body = await api<{ messages: ChatMessage[] }>(`/api/chat/rooms/${roomId}/messages`)
  return body.messages ?? []
}

export async function sendChatMessage(roomId: string, body: string, attachmentIds?: string[]): Promise<ChatMessage> {
  const result = await api<{ message: ChatMessage }>(`/api/chat/rooms/${roomId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body, attachmentIds }),
  })
  return result.message
}
