import { Router } from 'express'
import { requireAccountUser } from '../../../lib/authUser'
import { assertWorkspaceAccess, WorkspaceAccessError } from '../../../lib/workspaceAccess'
import { resolveDocumentKnowledgeRefs } from '../services/documentKnowledgeRefs'
import {
  buildAcademicWritingOutline,
  runAcademicWritingWorkflow,
  type AcademicWritingPaperType,
  type AcademicWritingStyle,
} from '../services/academicWritingService'
import type { DocumentKnowledgeRefInput, DocumentLanguage } from '../types'

const router = Router()

const PAPER_TYPES = new Set<AcademicWritingPaperType>([
  'course_paper',
  'research_report',
  'literature_review',
  'policy_research_report',
  'business_research_report',
])

function normalizePaperType(raw: unknown): AcademicWritingPaperType | null {
  const value = String(raw || '').trim() as AcademicWritingPaperType
  return PAPER_TYPES.has(value) ? value : null
}

function normalizeLanguage(raw: unknown): DocumentLanguage {
  return raw === 'en' || raw === 'en-US' ? 'en-US' : 'zh-CN'
}

function normalizeStyle(raw: unknown): AcademicWritingStyle {
  if (raw === 'academic' || raw === 'formal' || raw === 'report') return raw
  return 'academic'
}

function normalizeOutline(raw: unknown): string[] | undefined {
  if (Array.isArray(raw)) {
    const items = raw.map((item) => String(item || '').trim()).filter(Boolean)
    return items.length > 0 ? items : undefined
  }
  if (typeof raw === 'string') {
    const items = raw
      .split(/\r?\n/)
      .map((item) => item.replace(/^\s*\d+[.)、]\s*/, '').trim())
      .filter(Boolean)
    return items.length > 0 ? items : undefined
  }
  return undefined
}

router.post('/outline', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return

  const topic = String(req.body?.topic || '').trim()
  const paperType = normalizePaperType(req.body?.paperType)
  if (!topic) {
    res.status(400).json({ success: false, error: 'topic 不能为空' })
    return
  }
  if (!paperType) {
    res.status(400).json({ success: false, error: 'paperType 无效' })
    return
  }

  const plan = buildAcademicWritingOutline({
    topic,
    paperType,
    researchGoal: typeof req.body?.researchGoal === 'string' ? req.body.researchGoal : undefined,
    lengthHint: typeof req.body?.lengthHint === 'string' ? req.body.lengthHint : undefined,
    language: normalizeLanguage(req.body?.language),
    style: normalizeStyle(req.body?.style),
  })
  res.json({ success: true, ...plan })
})

router.post('/generate', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return

  const topic = String(req.body?.topic || '').trim()
  const paperType = normalizePaperType(req.body?.paperType)
  if (!topic) {
    res.status(400).json({ success: false, error: 'topic 不能为空' })
    return
  }
  if (!paperType) {
    res.status(400).json({ success: false, error: 'paperType 无效' })
    return
  }
  try {
    const workspacePath = assertWorkspaceAccess(
      userId,
      typeof req.body?.workspacePath === 'string' ? req.body.workspacePath : undefined,
      'editor',
    ).workspacePath
    const knowledgeRefs = await resolveDocumentKnowledgeRefs({
      workspacePath,
      knowledgeRefs: Array.isArray(req.body?.knowledgeRefs)
        ? req.body.knowledgeRefs as DocumentKnowledgeRefInput[]
        : [],
    })
    const result = await runAcademicWritingWorkflow({
      userId,
      workspacePath,
      topic,
      paperType,
      researchGoal: typeof req.body?.researchGoal === 'string' ? req.body.researchGoal : undefined,
      lengthHint: typeof req.body?.lengthHint === 'string' ? req.body.lengthHint : undefined,
      language: normalizeLanguage(req.body?.language),
      style: normalizeStyle(req.body?.style),
      outline: normalizeOutline(req.body?.outline),
      knowledgeRefs,
      })
    res.json(result)
  } catch (error) {
    const workspaceError = error instanceof WorkspaceAccessError ? error : null
    const message = workspaceError?.message || (error instanceof Error ? error.message : '学术写作工作流失败')
    console.error('[document/academic-writing/generate]', message)
    res.status(workspaceError?.status ?? 422).json({
      success: false,
      error: message,
      code: workspaceError?.code,
      bootstrap: workspaceError?.bootstrap,
    })
  }
})

export default router
