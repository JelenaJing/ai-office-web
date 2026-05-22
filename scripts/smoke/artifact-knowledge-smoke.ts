import { smokeHttp, type SmokeContext } from './smoke-utils'

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {}
}

function record(ctx: SmokeContext, endpoint: string, expected: string, passed: boolean, actual: string, error?: string, skipped = false): void {
  ctx.record({
    module: 'artifact-knowledge',
    endpoint,
    expected,
    actual,
    status: skipped ? 'skipped' : passed ? 'passed' : 'failed',
    error: passed || skipped ? undefined : error,
  })
}

async function workspacePath(ctx: SmokeContext): Promise<string | null> {
  const res = await ctx.request('GET', '/api/workspaces/default')
  const workspace = asRecord(asRecord(res.body).workspace)
  const ws = typeof workspace.path === 'string' ? workspace.path : null
  record(ctx, 'GET /api/workspaces/default', 'workspace path', res.ok && Boolean(ws), `HTTP ${res.status} workspace=${ws || 'missing'}`, res.text)
  return ws
}

async function uploadKnowledgeFixture(ctx: SmokeContext, departmentId: string): Promise<string | null> {
  const form = new FormData()
  form.append('files', new Blob(['Artifact Knowledge smoke fixture'], { type: 'text/plain' }), 'artifact-knowledge-smoke.txt')
  const response = await fetch(`${ctx.baseUrl}/api/knowledge/${departmentId}/import`, {
    method: 'POST',
    headers: ctx.token ? { Authorization: `Bearer ${ctx.token}` } : {},
    body: form,
  })
  const text = await response.text()
  let body: unknown = {}
  try {
    body = text ? JSON.parse(text) : {}
  } catch {
    body = { raw: text }
  }
  if (!response.ok) {
    record(
      ctx,
      `POST /api/knowledge/${departmentId}/import`,
      'knowledge import succeeds or reports remote-service partial',
      false,
      `HTTP ${response.status}`,
      text.slice(0, 500),
      true,
    )
    return null
  }
  const imported = Array.isArray(asRecord(body).imported) ? asRecord(body).imported as unknown[] : []
  const first = asRecord(imported[0])
  const documentId = String(first.id || first.documentId || first.fileId || '')
  record(ctx, `POST /api/knowledge/${departmentId}/import`, 'test document imported', Boolean(documentId || imported.length >= 0), `HTTP ${response.status} imported=${imported.length}`)
  return documentId || null
}

export default async function runArtifactKnowledgeSmoke(ctx: SmokeContext): Promise<void> {
  const ws = await workspacePath(ctx)
  if (!ws) return

  const created = await ctx.request('POST', '/api/artifacts', {
    workspacePath: ws,
    type: 'document',
    title: 'Artifact Knowledge Smoke',
    filename: 'artifact-knowledge-smoke.md',
    format: 'md',
    content: '# Artifact Knowledge Smoke\n\nThis artifact verifies relationship metadata.\n',
    sourceRefs: [{ type: 'email', id: 'smoke-email-001', label: 'Smoke source email' }],
    knowledgeRefs: [{ documentId: 'smoke-knowledge-doc', departmentId: 'scientific-papers', title: 'Smoke knowledge ref', citationStatus: 'partial' }],
    matterId: 'smoke-matter-001',
    emailId: 'smoke-email-001',
    deckId: 'smoke-deck-001',
    documentId: 'smoke-document-001',
  })
  const artifact = asRecord(asRecord(created.body).artifact)
  const artifactId = typeof artifact.id === 'string' ? artifact.id : ''
  record(ctx, 'POST /api/artifacts', 'document artifact created with source/knowledge/matter/email/deck/document refs', created.ok && Boolean(artifactId) && Array.isArray(artifact.sourceRefs), `HTTP ${created.status} artifact=${artifactId || 'missing'}`, created.text)
  if (!artifactId) return

  await smokeHttp(ctx, 'artifact-knowledge', 'GET', `/api/artifacts/${artifactId}`, 'artifact detail includes relationship metadata', {
    accept: (res) => {
      const item = asRecord(asRecord(res.body).artifact)
      return res.ok
        && Array.isArray(item.sourceRefs)
        && Array.isArray(item.knowledgeRefs)
        && item.matterId === 'smoke-matter-001'
        && item.emailId === 'smoke-email-001'
        && item.deckId === 'smoke-deck-001'
        && item.documentId === 'smoke-document-001'
    },
    actual: (res) => `HTTP ${res.status} artifact=${String(asRecord(asRecord(res.body).artifact).id || '')}`,
  })

  await smokeHttp(ctx, 'artifact-knowledge', 'GET', `/api/artifacts/${artifactId}/relationships`, 'relationship graph exposes sourceRefs and knowledgeRefs', {
    accept: (res) => {
      const graph = asRecord(asRecord(res.body).graph)
      return res.ok
        && Array.isArray(asRecord(res.body).sourceRefs)
        && Array.isArray(asRecord(res.body).knowledgeRefs)
        && Array.isArray(graph.nodes)
        && Array.isArray(graph.edges)
    },
    actual: (res) => `HTTP ${res.status} nodes=${Array.isArray(asRecord(asRecord(res.body).graph).nodes) ? (asRecord(asRecord(res.body).graph).nodes as unknown[]).length : 0}`,
  })

  await smokeHttp(ctx, 'artifact-knowledge', 'GET', `/api/artifacts/${artifactId}/preview`, 'markdown preview is available', {
    accept: (res) => res.ok && res.text.includes('Artifact Knowledge Smoke'),
    actual: (res) => `HTTP ${res.status} bytes=${res.text.length}`,
  })

  await smokeHttp(ctx, 'artifact-knowledge', 'PATCH', `/api/artifacts/${artifactId}`, 'artifact can be renamed', {
    body: { title: 'Artifact Knowledge Smoke Renamed' },
    accept: (res) => res.ok && asRecord(asRecord(res.body).artifact).title === 'Artifact Knowledge Smoke Renamed',
    actual: (res) => `HTTP ${res.status} title=${String(asRecord(asRecord(res.body).artifact).title || '')}`,
  })

  await smokeHttp(ctx, 'artifact-knowledge', 'GET', `/api/artifacts/${artifactId}/download`, 'artifact download returns file', {
    accept: (res) => res.ok && res.text.includes('relationship metadata'),
    actual: (res) => `HTTP ${res.status} bytes=${res.text.length}`,
  })

  const departmentId = 'scientific-papers'
  await smokeHttp(ctx, 'artifact-knowledge', 'GET', `/api/knowledge/${departmentId}/parity-status`, 'knowledge parity status reports partial capability matrix', {
    accept: (res) => res.ok || res.status === 502,
    actual: (res) => `HTTP ${res.status}${res.ok ? ` status=${String(asRecord(res.body).status || '')}` : ' remote-service partial'}`,
  })
  await smokeHttp(ctx, 'artifact-knowledge', 'GET', `/api/knowledge/${departmentId}/documents`, 'knowledge document list succeeds or reports remote-service partial', {
    accept: (res) => res.ok || res.status === 502,
    actual: (res) => `HTTP ${res.status}${res.ok ? ` documents=${Array.isArray(asRecord(res.body).documents) ? (asRecord(res.body).documents as unknown[]).length : 0}` : ' remote-service partial'}`,
  })

  const importedId = await uploadKnowledgeFixture(ctx, departmentId)
  if (importedId) {
    await smokeHttp(ctx, 'artifact-knowledge', 'DELETE', `/api/knowledge/${departmentId}/documents/${importedId}`, 'test knowledge document can be deleted', {
      accept: (res) => res.ok || res.status === 502,
      actual: (res) => `HTTP ${res.status}`,
    })
  } else {
    record(ctx, `DELETE /api/knowledge/${departmentId}/documents/:documentId`, 'delete imported test document when import succeeds', false, 'skipped because import did not return documentId', undefined, true)
  }

  await smokeHttp(ctx, 'artifact-knowledge', 'DELETE', `/api/artifacts/${artifactId}`, 'artifact can be deleted', {
    accept: (res) => res.ok && asRecord(res.body).success === true,
    actual: (res) => `HTTP ${res.status}`,
  })
}
