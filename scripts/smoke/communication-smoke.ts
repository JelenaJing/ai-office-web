import { smokeHttp, type SmokeContext } from './smoke-utils'

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {}
}

function record(ctx: SmokeContext, endpoint: string, expected: string, passed: boolean, actual: string, error?: string): void {
  ctx.record({
    module: 'communication',
    endpoint,
    expected,
    actual,
    status: passed ? 'passed' : 'failed',
    error: passed ? undefined : error,
  })
}

async function workspacePath(ctx: SmokeContext): Promise<string | null> {
  const res = await ctx.request('GET', '/api/workspaces/default')
  const workspace = asRecord(asRecord(res.body).workspace)
  const ws = typeof workspace.path === 'string' ? workspace.path : null
  record(ctx, 'GET /api/workspaces/default', 'workspace path', res.ok && Boolean(ws), `HTTP ${res.status} workspace=${ws || 'missing'}`, res.text)
  return ws
}

export default async function runCommunicationSmoke(ctx: SmokeContext): Promise<void> {
  const ws = await workspacePath(ctx)
  if (!ws) return

  const roomsRes = await ctx.request('GET', '/api/chat/rooms')
  const rooms = Array.isArray(asRecord(roomsRes.body).rooms) ? asRecord(roomsRes.body).rooms as unknown[] : []
  const roomId = String(asRecord(rooms[0]).id || '')
  record(ctx, 'GET /api/chat/rooms', 'rooms list returns at least one room', roomsRes.ok && Boolean(roomId), `HTTP ${roomsRes.status} roomId=${roomId || 'missing'}`, roomsRes.text)
  if (!roomId) return

  await smokeHttp(ctx, 'communication', 'POST', `/api/chat/rooms/${roomId}/messages`, 'send chat message', {
    body: { body: 'Communication smoke message' },
    accept: (res) => res.ok && typeof asRecord(asRecord(res.body).message).id === 'string',
    actual: (res) => `HTTP ${res.status} message=${String(asRecord(asRecord(res.body).message).id || '')}`,
  })

  await smokeHttp(ctx, 'communication', 'GET', `/api/chat/rooms/${roomId}/messages`, 'list chat messages includes smoke message', {
    accept: (res) => {
      const messages = Array.isArray(asRecord(res.body).messages) ? asRecord(res.body).messages as unknown[] : []
      return res.ok && messages.some((message) => String(asRecord(message).body).includes('Communication smoke message'))
    },
    actual: (res) => `HTTP ${res.status} messages=${Array.isArray(asRecord(res.body).messages) ? (asRecord(res.body).messages as unknown[]).length : 0}`,
  })

  await smokeHttp(ctx, 'communication', 'GET', '/api/directory', 'directory endpoint returns partial provider status', {
    accept: (res) => res.ok && Array.isArray(asRecord(res.body).people) && Array.isArray(asRecord(res.body).partialMissing),
    actual: (res) => `HTTP ${res.status} people=${Array.isArray(asRecord(res.body).people) ? (asRecord(res.body).people as unknown[]).length : 0}`,
  })

  await smokeHttp(ctx, 'communication', 'POST', `/api/chat/rooms/${roomId}/matter`, 'chat-to-Matter creates real Matter with evidence', {
    body: {
      workspacePath: ws,
      title: 'Communication smoke Matter',
      goal: 'Turn chat smoke into AIOS Matter',
    },
    accept: (res) => res.status === 201 && typeof asRecord(asRecord(res.body).matter).id === 'string' && typeof asRecord(asRecord(res.body).evidence).id === 'string',
    actual: (res) => `HTTP ${res.status} matter=${String(asRecord(asRecord(res.body).matter).id || '')}`,
  })
}
