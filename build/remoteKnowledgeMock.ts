interface MockRemoteDepartment {
  id: string
  name: string
  nameEn?: string
  fileCount?: number
}

interface MockRemoteFile {
  id: string
  title: string
  originalName?: string
  status?: string
  createdAt?: string
  pathCategory?: string
}

interface MockRemoteResponse {
  status?: number
  body: unknown
}

export interface MockFetchCall {
  url: string
  method: string
  headers: Record<string, string>
  body?: unknown
}

export function installMockRemoteKnowledgeFetch(input: {
  baseUrl: string
  departments: MockRemoteDepartment[]
  filesByDepartment: Record<string, MockRemoteFile[]>
  qaByDepartment?: Record<string, unknown>
  qaResponder?: (payload: { partition: string; body: Record<string, unknown>; call: MockFetchCall }) => MockRemoteResponse
}) {
  const baseUrl = input.baseUrl.replace(/\/+$/, '')
  const originalFetch = globalThis.fetch
  const calls: MockFetchCall[] = []

  const jsonResponse = (body: unknown, status = 200) => new Response(
    JSON.stringify(body),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    },
  )

  globalThis.fetch = async (request, init) => {
    const url = typeof request === 'string' ? request : request instanceof URL ? request.toString() : request.url
    const method = (init?.method || (typeof request === 'string' ? 'GET' : request.method) || 'GET').toUpperCase()
    if (!url.startsWith(baseUrl)) {
      throw new Error(`unexpected fetch url: ${url}`)
    }

    const rawHeaders = new Headers(init?.headers || (typeof request === 'string' ? undefined : request.headers))
    const headers = Object.fromEntries(rawHeaders.entries())
    const rawBody = init?.body
    const body = typeof rawBody === 'string' && rawBody ? JSON.parse(rawBody) as Record<string, unknown> : undefined
    const call: MockFetchCall = { url, method, headers, body }
    calls.push(call)

    const pathname = new URL(url).pathname
    if (pathname === '/knowledge-bases' && method === 'GET') {
      return jsonResponse({
        ok: true,
        knowledge_bases: input.departments.map((department) => ({
          kb_id: department.id,
          display_name: department.name,
          description: '',
          parent_kb_id: null,
          file_count: department.fileCount ?? (input.filesByDepartment[department.id]?.length || 0),
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        })),
      })
    }

    const filesMatch = pathname.match(/^\/knowledge-bases\/([^/]+)\/files$/)
    if (filesMatch && method === 'GET') {
      const departmentId = decodeURIComponent(filesMatch[1] || '')
      return jsonResponse({
        ok: true,
        files: (input.filesByDepartment[departmentId] || []).map((file) => ({
          file_id: file.id,
          partition: departmentId,
          display_name: file.title,
          rel_path: file.originalName || file.title,
          path_category: file.pathCategory || 'knowledge',
          status: file.status || 'ready',
          page_count: 1,
          created_at: file.createdAt || '2024-01-01T00:00:00.000Z',
          parser_used: 'mock',
        })),
      })
    }

    const kbMatch = pathname.match(/^\/knowledge-bases\/([^/]+)$/)
    if (kbMatch && method === 'GET') {
      const departmentId = decodeURIComponent(kbMatch[1] || '')
      const department = input.departments.find((item) => item.id === departmentId)
      if (!department) {
        return jsonResponse({ ok: false, message: 'not found' }, 404)
      }
      return jsonResponse({
        ok: true,
        knowledge_base: {
          kb_id: department.id,
          display_name: department.name,
          description: '',
          parent_kb_id: null,
          file_count: department.fileCount ?? (input.filesByDepartment[department.id]?.length || 0),
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        },
      })
    }

    if (pathname === '/qa' && method === 'POST') {
      const partition = String(body?.partition || '')
      if (input.qaResponder) {
        const response = input.qaResponder({ partition, body: body || {}, call })
        return jsonResponse(response.body, response.status)
      }
      return jsonResponse(input.qaByDepartment?.[partition] ?? { ok: true, results: [] })
    }

    throw new Error(`unexpected fetch path: ${method} ${pathname}`)
  }

  return {
    calls,
    restore() {
      globalThis.fetch = originalFetch
    },
  }
}
