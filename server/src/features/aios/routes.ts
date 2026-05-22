import { Router } from 'express'
import { requireAccountUser } from '../../lib/authUser'
import {
  listMatters,
  getMatter,
  createMatter,
  updateMatter,
  deleteMatter,
  getEvidence,
  addEvidence,
  deleteEvidence,
  createMatterFromEmail,
  type EmailInput,
} from './services/matterService'
import { generateDecisionPackage } from './services/decisionPackageService'
import {
  generateReplyDraft,
  generateDocumentArtifact,
  generatePptArtifact,
} from './services/generationService'
import { getAuditTrail } from './services/auditTrailService'
import type { MatterStatus, MatterPriority, MatterSourceType, EvidenceType, MatterRouteType } from './types'

const router = Router()

const AIOS_PARTIAL_MISSING = [
  'approval workflow is not connected to an OA engine',
  'knowledge-base verification is partial',
  'audit replay is deterministic event listing, not full Electron replay',
  'cross-module artifact relationship graph is partial',
]

router.get('/parity-status', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  res.json({
    success: true,
    status: 'partial',
    capabilities: {
      matter: true,
      evidence: true,
      decisionPackage: true,
      auditTrail: true,
      emailToMatter: true,
      artifactGeneration: true,
      approvalWorkflow: false,
      auditReplay: 'partial',
      routeTypes: ['point_to_point', 'point_to_many'],
    },
    partialMissing: AIOS_PARTIAL_MISSING,
  })
})

// ── Matters ───────────────────────────────────────────────────────────────────

router.get('/matters', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const status = req.query.status as MatterStatus | undefined
  res.json({ matters: listMatters(userId, status) })
})

router.post('/matters', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const { title, goal, sourceType, status, priority, workspacePath, routeType } = req.body as {
    title?: string
    goal?: string
    sourceType?: MatterSourceType
    status?: MatterStatus
    priority?: MatterPriority
    workspacePath?: string
    routeType?: MatterRouteType
  }
  if (!title?.trim()) {
    return res.status(400).json({ message: '事项标题必填' })
  }
  const matter = createMatter(userId, { title, goal, sourceType, status, priority, workspacePath, routeType })
  res.status(201).json({ matter })
})

router.get('/matters/:id', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const matter = getMatter(userId, req.params.id)
  if (!matter) return res.status(404).json({ message: '事项不存在' })
  const evidence = getEvidence(userId, req.params.id)
  res.json({ matter, evidence })
})

router.patch('/matters/:id', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const { title, goal, status, priority, workspacePath, routeType } = req.body as {
    title?: string
    goal?: string
    status?: MatterStatus
    priority?: MatterPriority
    workspacePath?: string
    routeType?: MatterRouteType
  }
  const updated = updateMatter(userId, req.params.id, { title, goal, status, priority, workspacePath, routeType })
  if (!updated) return res.status(404).json({ message: '事项不存在' })
  res.json({ matter: updated })
})

router.delete('/matters/:id', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  if (!deleteMatter(userId, req.params.id)) {
    return res.status(404).json({ message: '事项不存在' })
  }
  res.json({ success: true })
})

// ── Evidence ──────────────────────────────────────────────────────────────────

router.get('/matters/:id/evidence', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  res.json({ evidence: getEvidence(userId, req.params.id) })
})

router.post('/matters/:id/evidence', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const { type, title, content, sourceRef, artifactId, knowledgeVerificationStatus } = req.body as {
    type?: EvidenceType
    title?: string
    content?: string
    sourceRef?: string
    artifactId?: string
    knowledgeVerificationStatus?: 'verified' | 'partial' | 'unverified'
  }
  if (!type || !title?.trim()) {
    return res.status(400).json({ message: '证据类型和标题必填' })
  }
  const ev = addEvidence(userId, req.params.id, { type, title, content, sourceRef, artifactId, knowledgeVerificationStatus })
  if (!ev) return res.status(404).json({ message: '事项不存在' })
  res.status(201).json({ evidence: ev })
})

router.delete('/matters/:id/evidence/:evidenceId', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  if (!deleteEvidence(userId, req.params.id, req.params.evidenceId)) {
    return res.status(404).json({ message: '证据不存在' })
  }
  res.json({ success: true })
})

// ── Email → Matter (convenience endpoint) ────────────────────────────────────

router.post('/matters/from-email', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return

  const { workspacePath, email, priority } = req.body as {
    workspacePath?: string
    email?: EmailInput
    priority?: MatterPriority
  }

  if (!email?.id || !email?.subject) {
    return res.status(400).json({ message: '邮件 id 和 subject 必填' })
  }

  const result = createMatterFromEmail(userId, { workspacePath, email, priority })
  res.status(201).json(result)
})

// ── Decision Package ──────────────────────────────────────────────────────────

router.post('/matters/:id/decision-package', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const pkg = generateDecisionPackage(userId, req.params.id)
  if (!pkg) return res.status(404).json({ message: '事项不存在' })
  res.json({ decisionPackage: pkg })
})

// ── Audit Trail ───────────────────────────────────────────────────────────────

router.get('/matters/:id/audit', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  res.json({ events: getAuditTrail(userId, req.params.id) })
})

router.get('/matters/:id/audit/replay', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const events = getAuditTrail(userId, req.params.id)
  res.json({
    success: true,
    replay: events.map((event, index) => ({
      step: index + 1,
      eventId: event.id,
      matterId: event.matterId,
      action: event.action,
      actorId: event.actorId,
      createdAt: event.createdAt,
      detail: event.detail,
      fullEvent: event,
    })),
    partialMissing: AIOS_PARTIAL_MISSING,
  })
})

// ── Artifact Generation ────────────────────────────────────────────────────────

router.post('/matters/:id/generate-reply', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  try {
    const result = await generateReplyDraft(userId, req.params.id)
    if (!result.success) return res.status(404).json({ message: result.error })
    res.json({ artifact: result.artifact })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ message: `生成回复草稿失败：${msg}` })
  }
})

router.post('/matters/:id/generate-document', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  try {
    const result = await generateDocumentArtifact(userId, req.params.id)
    if (!result.success) return res.status(404).json({ message: result.error })
    res.json({ artifact: result.artifact })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ message: `生成文稿失败：${msg}` })
  }
})

router.post('/matters/:id/generate-ppt', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  try {
    const result = await generatePptArtifact(userId, req.params.id)
    if (!result.success) return res.status(404).json({ message: result.error })
    res.json({ artifact: result.artifact })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ message: `生成 PPT 失败：${msg}` })
  }
})

export default router
