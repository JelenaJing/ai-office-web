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
} from './services/matterService'
import { generateDecisionPackage } from './services/decisionPackageService'
import { getAuditTrail } from './services/auditTrailService'
import type { MatterStatus, MatterPriority, MatterSourceType, EvidenceType } from './types'

const router = Router()

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
  const { title, goal, sourceType, status, priority, workspacePath } = req.body as {
    title?: string
    goal?: string
    sourceType?: MatterSourceType
    status?: MatterStatus
    priority?: MatterPriority
    workspacePath?: string
  }
  if (!title?.trim()) {
    return res.status(400).json({ message: '事项标题必填' })
  }
  const matter = createMatter(userId, { title, goal, sourceType, status, priority, workspacePath })
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
  const { title, goal, status, priority, workspacePath } = req.body as {
    title?: string
    goal?: string
    status?: MatterStatus
    priority?: MatterPriority
    workspacePath?: string
  }
  const updated = updateMatter(userId, req.params.id, { title, goal, status, priority, workspacePath })
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
  const { type, title, content, sourceRef } = req.body as {
    type?: EvidenceType
    title?: string
    content?: string
    sourceRef?: string
  }
  if (!type || !title?.trim()) {
    return res.status(400).json({ message: '证据类型和标题必填' })
  }
  const ev = addEvidence(userId, req.params.id, { type, title, content, sourceRef })
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

export default router
