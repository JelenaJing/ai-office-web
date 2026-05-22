import { smokeHttp, type SmokeContext } from './smoke-utils'

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {}
}

function record(ctx: SmokeContext, endpoint: string, expected: string, passed: boolean, actual: string, error?: string): void {
  ctx.record({
    module: 'aios',
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

async function createEvidenceArtifact(ctx: SmokeContext, workspacePath: string): Promise<string> {
  const res = await ctx.request('POST', '/api/artifacts', {
    workspacePath,
    type: 'document',
    title: 'AIOS Evidence Attachment Smoke',
    filename: 'aios-evidence-attachment.txt',
    format: 'txt',
    content: 'AIOS evidence attachment smoke',
    sourceRefs: [{ type: 'manual', id: 'aios-smoke', label: 'AIOS smoke' }],
  })
  const artifactId = String(asRecord(asRecord(res.body).artifact).id || '')
  record(ctx, 'POST /api/artifacts (evidence)', 'evidence attachment Artifact created', res.ok && Boolean(artifactId), `HTTP ${res.status} artifact=${artifactId || 'missing'}`, res.text)
  return artifactId
}

async function assertArtifactRelationship(ctx: SmokeContext, artifactId: string, matterId: string, label: string): Promise<void> {
  await smokeHttp(ctx, 'aios', 'GET', `/api/artifacts/${artifactId}/relationships`, `${label} Artifact carries matter/source relationship`, {
    accept: (res) => {
      const body = asRecord(res.body)
      return res.ok && body.matterId === matterId && Array.isArray(body.sourceRefs)
    },
    actual: (res) => `HTTP ${res.status} matterId=${String(asRecord(res.body).matterId || '')}`,
  })
}

export default async function runAiosSmoke(ctx: SmokeContext): Promise<void> {
  const ws = await workspacePath(ctx)
  if (!ws) return

  const created = await ctx.request('POST', '/api/aios/matters', {
    workspacePath: ws,
    title: 'AIOS E2E Smoke Matter',
    goal: '验证 Matter → Evidence → DecisionPackage → Artifact → Audit 闭环',
    sourceType: 'manual',
    status: 'draft',
    priority: 'normal',
    routeType: 'point_to_many',
  })
  const matter = asRecord(asRecord(created.body).matter)
  const matterId = String(matter.id || '')
  record(ctx, 'POST /api/aios/matters', 'Matter created as draft with point_to_many route type', created.ok && Boolean(matterId) && matter.status === 'draft' && matter.routeType === 'point_to_many', `HTTP ${created.status} matterId=${matterId || 'missing'} status=${String(matter.status || '')}`, created.text)
  if (!matterId) return

  const evidenceArtifactId = await createEvidenceArtifact(ctx, ws)
  await smokeHttp(ctx, 'aios', 'POST', `/api/aios/matters/${matterId}/evidence`, 'email evidence added', {
    body: {
      type: 'email',
      title: '来源邮件',
      content: '请基于该事项形成处理方案，必要时生成文稿、PPT 和回复。',
      sourceRef: 'smoke-email-001',
    },
    accept: (res) => res.ok && typeof asRecord(asRecord(res.body).evidence).id === 'string',
    actual: (res) => `HTTP ${res.status} evidence=${String(asRecord(asRecord(res.body).evidence).id || '')}`,
  })
  await smokeHttp(ctx, 'aios', 'POST', `/api/aios/matters/${matterId}/evidence`, 'attachment evidence links an Artifact', {
    body: {
      type: 'attachment',
      title: '附件证据',
      content: '附件已经进入 Artifact',
      sourceRef: evidenceArtifactId,
      artifactId: evidenceArtifactId,
    },
    accept: (res) => res.ok && asRecord(asRecord(res.body).evidence).artifactId === evidenceArtifactId,
    actual: (res) => `HTTP ${res.status} artifactId=${String(asRecord(asRecord(res.body).evidence).artifactId || '')}`,
  })
  await smokeHttp(ctx, 'aios', 'POST', `/api/aios/matters/${matterId}/evidence`, 'knowledge evidence carries verification status', {
    body: {
      type: 'knowledge',
      title: '知识库依据',
      content: '知识库检索结果用于说明该事项仍需人工确认。',
      sourceRef: 'knowledge-smoke-doc',
      knowledgeVerificationStatus: 'partial',
    },
    accept: (res) => res.ok && asRecord(asRecord(res.body).evidence).knowledgeVerificationStatus === 'partial',
    actual: (res) => `HTTP ${res.status} verification=${String(asRecord(asRecord(res.body).evidence).knowledgeVerificationStatus || '')}`,
  })

  await smokeHttp(ctx, 'aios', 'GET', `/api/aios/matters/${matterId}`, 'Matter lifecycle moved to collecting_evidence after evidence', {
    accept: (res) => res.ok && asRecord(asRecord(res.body).matter).status === 'collecting_evidence',
    actual: (res) => `HTTP ${res.status} status=${String(asRecord(asRecord(res.body).matter).status || '')}`,
  })

  await smokeHttp(ctx, 'aios', 'POST', `/api/aios/matters/${matterId}/decision-package`, 'DecisionPackage includes source references and knowledge verification status', {
    accept: (res) => {
      const pkg = asRecord(asRecord(res.body).decisionPackage)
      return res.ok
        && Array.isArray(pkg.sourceReferences)
        && (pkg.sourceReferences as unknown[]).length >= 3
        && pkg.knowledgeVerificationStatus === 'partial'
    },
    actual: (res) => {
      const pkg = asRecord(asRecord(res.body).decisionPackage)
      return `HTTP ${res.status} refs=${Array.isArray(pkg.sourceReferences) ? (pkg.sourceReferences as unknown[]).length : 0}`
    },
  })

  await smokeHttp(ctx, 'aios', 'GET', `/api/aios/matters/${matterId}`, 'Matter lifecycle moved to decision_package_ready', {
    accept: (res) => res.ok && asRecord(asRecord(res.body).matter).status === 'decision_package_ready',
    actual: (res) => `HTTP ${res.status} status=${String(asRecord(asRecord(res.body).matter).status || '')}`,
  })

  const reply = await ctx.request('POST', `/api/aios/matters/${matterId}/generate-reply`)
  const replyArtifactId = String(asRecord(asRecord(reply.body).artifact).id || '')
  record(ctx, `POST /api/aios/matters/${matterId}/generate-reply`, 'reply draft Artifact generated with matter relationship', reply.ok && Boolean(replyArtifactId) && asRecord(asRecord(reply.body).artifact).matterId === matterId, `HTTP ${reply.status} artifact=${replyArtifactId || 'missing'}`, reply.text)
  if (replyArtifactId) await assertArtifactRelationship(ctx, replyArtifactId, matterId, 'reply')

  const doc = await ctx.request('POST', `/api/aios/matters/${matterId}/generate-document`)
  const docArtifactId = String(asRecord(asRecord(doc.body).artifact).id || '')
  record(ctx, `POST /api/aios/matters/${matterId}/generate-document`, 'document Artifact generated with matter relationship', doc.ok && Boolean(docArtifactId) && asRecord(asRecord(doc.body).artifact).matterId === matterId, `HTTP ${doc.status} artifact=${docArtifactId || 'missing'}`, doc.text)
  if (docArtifactId) await assertArtifactRelationship(ctx, docArtifactId, matterId, 'document')

  const ppt = await ctx.request('POST', `/api/aios/matters/${matterId}/generate-ppt`)
  const pptArtifactId = String(asRecord(asRecord(ppt.body).artifact).id || '')
  record(ctx, `POST /api/aios/matters/${matterId}/generate-ppt`, 'PPT Artifact generated with matter relationship', ppt.ok && Boolean(pptArtifactId) && asRecord(asRecord(ppt.body).artifact).matterId === matterId, `HTTP ${ppt.status} artifact=${pptArtifactId || 'missing'}`, ppt.text)
  if (pptArtifactId) await assertArtifactRelationship(ctx, pptArtifactId, matterId, 'ppt')

  await smokeHttp(ctx, 'aios', 'GET', `/api/aios/matters/${matterId}/audit`, 'audit contains lifecycle and generation events', {
    accept: (res) => {
      const events = Array.isArray(asRecord(res.body).events) ? asRecord(res.body).events as unknown[] : []
      const actions = events.map((event) => String(asRecord(event).action))
      return res.ok
        && actions.includes('create_matter')
        && actions.includes('add_evidence')
        && actions.includes('generate_decision_package')
        && actions.includes('generate_document_artifact')
        && actions.includes('generate_ppt_artifact')
    },
    actual: (res) => `HTTP ${res.status} events=${Array.isArray(asRecord(res.body).events) ? (asRecord(res.body).events as unknown[]).length : 0}`,
  })

  await smokeHttp(ctx, 'aios', 'GET', `/api/aios/matters/${matterId}/audit/replay`, 'audit replay returns full events', {
    accept: (res) => {
      const replay = Array.isArray(asRecord(res.body).replay) ? asRecord(res.body).replay as unknown[] : []
      return res.ok && replay.length > 0 && Boolean(asRecord(replay[0]).fullEvent)
    },
    actual: (res) => `HTTP ${res.status} replay=${Array.isArray(asRecord(res.body).replay) ? (asRecord(res.body).replay as unknown[]).length : 0}`,
  })

  await smokeHttp(ctx, 'aios', 'PATCH', `/api/aios/matters/${matterId}`, 'Matter lifecycle can complete', {
    body: { status: 'completed' },
    accept: (res) => res.ok && asRecord(asRecord(res.body).matter).status === 'completed',
    actual: (res) => `HTTP ${res.status} status=${String(asRecord(asRecord(res.body).matter).status || '')}`,
  })
}
