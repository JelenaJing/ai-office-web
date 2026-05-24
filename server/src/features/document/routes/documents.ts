import { Router } from 'express'
import { requireAccountUser } from '../../../lib/authUser'
import { getDocumentRecord, getDocumentTask, saveDocumentRecord, updateDocumentTask, createDocumentTask } from '../services/documentTaskStore'
import { resolveDocumentKnowledgeRefs } from '../services/documentKnowledgeRefs'
import {
  editDocumentSectionWithBuiltin,
  editDocumentSelectionWithBuiltin,
  runBuiltinDocumentEngine,
} from '../services/documentBuiltinEngine'
import { buildDocumentOutline } from '../services/documentDraft'
import { saveDocumentDraftDocxArtifact } from '../services/documentArtifactService'
import {
  editDocumentSectionWithMinimax,
  editDocumentSelectionWithMinimax,
  runMinimaxDocxWithFallback,
} from '../services/minimaxDocxRunner'
import { resolveDocumentDraftFromPayload } from '../services/documentEditablePayload'
import { listDocumentTemplates } from '../services/documentTemplateCatalog'
import type { DocumentEngine, DocumentFallbackMode, DocumentKnowledgeRefInput, DocumentLanguage, DocumentType } from '../types'

const router = Router()

function resolveDocumentEngine(): { engine: DocumentEngine; fallback: DocumentFallbackMode } {
  const engine = process.env.DOCUMENT_ENGINE === 'builtin' ? 'builtin' : 'minimax_docx'
  const fallback = process.env.DOCUMENT_ENGINE_FALLBACK === 'none' ? 'none' : 'builtin'
  return { engine, fallback }
}

function normalizeDocumentType(value: unknown): DocumentType {
  switch (value) {
    case 'notice':
    case 'memo':
    case 'proposal':
    case 'summary':
    case 'official_letter':
      return value
    case 'report':
    default:
      return 'report'
  }
}

function updateRecordFromRequest(record: NonNullable<ReturnType<typeof getDocumentRecord>>, body: Record<string, unknown>) {
  const draft = resolveDocumentDraftFromPayload({
    record,
    title: body.title,
    html: body.html,
    documentDraft: body.documentDraft || body.document,
    outline: body.outline,
  })
  return {
    ...record,
    title: draft.title,
    draft,
    updatedAt: new Date().toISOString(),
  }
}

router.post('/start', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return

  const workspacePath = String(req.body?.workspacePath || '').trim()
  const prompt = String(req.body?.prompt || '').trim()
  const title = String(req.body?.title || '').trim()
  const templateId = typeof req.body?.templateId === 'string' ? req.body.templateId : undefined
  const knowledgeRefs = Array.isArray(req.body?.knowledgeRefs)
    ? req.body.knowledgeRefs as DocumentKnowledgeRefInput[]
    : []
  const documentType = normalizeDocumentType(req.body?.documentType)
  const language = req.body?.language === 'en-US' ? 'en-US' : (req.body?.language === 'zh-CN' ? 'zh-CN' : undefined)

  if (!workspacePath) {
    res.status(400).json({ success: false, error: 'workspacePath 不能为空' })
    return
  }
  if (!prompt) {
    res.status(400).json({ success: false, error: 'prompt 不能为空' })
    return
  }

  const task = createDocumentTask()
  const engineConfig = resolveDocumentEngine()
  updateDocumentTask(task.taskId, {
    status: 'running',
    progress: 5,
    message: engineConfig.engine === 'minimax_docx' ? '正在启动 MiniMax DOCX Skill…' : '正在启动内置文稿引擎…',
  })

  void (async () => {
    try {
      const refs = await resolveDocumentKnowledgeRefs({
        workspacePath,
        knowledgeRefs,
      })
      const runResult = engineConfig.engine === 'builtin'
        ? await runBuiltinDocumentEngine({
            userId,
            prompt,
            title,
            workspacePath,
            templateId,
            knowledgeRefs: refs,
            documentType,
            language: language === 'en-US' ? 'en-US' : 'zh-CN',
          })
        : await runMinimaxDocxWithFallback({
            userId,
            prompt,
            title,
            workspacePath,
            templateId,
            knowledgeRefs: refs,
            documentType,
            language,
            fallback: engineConfig.fallback,
          })
      saveDocumentRecord(runResult.record)
      updateDocumentTask(task.taskId, {
        documentId: runResult.record.documentId,
        status: 'completed',
        progress: 100,
        message: runResult.result.engine === 'minimax_docx' ? 'MiniMax DOCX Skill 任务已完成' : '内置文稿引擎任务已完成',
        result: runResult.result,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      updateDocumentTask(task.taskId, {
        status: 'failed',
        progress: 100,
        message,
        error: message,
      })
    }
  })()

  res.json({ success: true, taskId: task.taskId, status: 'running' })
})

router.get('/tasks/:taskId', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return

  const task = getDocumentTask(req.params.taskId)
  if (!task) {
    res.status(404).json({ success: false, error: '任务不存在或已过期' })
    return
  }
  if (task.documentId) {
    const record = getDocumentRecord(task.documentId)
    if (record && record.userId !== userId) {
      res.status(403).json({ success: false, error: '无权访问该任务' })
      return
    }
  }
  res.json({
    success: true,
    taskId: task.taskId,
    documentId: task.documentId,
    status: task.status,
    progress: task.progress,
    message: task.message,
    result: task.result,
    error: task.error,
  })
})

router.post('/:documentId/sections/:sectionId/edit', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return

  const record = getDocumentRecord(req.params.documentId)
  if (!record || record.userId !== userId) {
    res.status(404).json({ success: false, error: '文稿不存在或无权限访问' })
    return
  }

  const instruction = String(req.body?.instruction || '').trim()
  if (!instruction) {
    res.status(400).json({ success: false, error: 'instruction 不能为空' })
    return
  }

  try {
    const requestRecord = updateRecordFromRequest(record, (req.body || {}) as Record<string, unknown>)
    const nextRecord = requestRecord.engine === 'builtin'
      ? await editDocumentSectionWithBuiltin({
          record: requestRecord,
          sectionId: req.params.sectionId,
          instruction,
        })
      : await editDocumentSectionWithMinimax({
          record: requestRecord,
          sectionId: req.params.sectionId,
          instruction,
        })
    saveDocumentRecord(nextRecord)
    const sectionIndex = nextRecord.draft.sections.findIndex((section) => section.id === req.params.sectionId)
    res.json({
      success: true,
      engine: nextRecord.engine,
      skillId: nextRecord.skillId,
      documentId: nextRecord.documentId,
      artifactId: nextRecord.artifactId,
      exportUrl: nextRecord.exportUrl,
      filename: nextRecord.filename,
      document: nextRecord.draft,
      outline: buildDocumentOutline(nextRecord.draft),
      updatedSectionId: req.params.sectionId,
      updatedSectionIndex: sectionIndex >= 0 ? sectionIndex + 1 : null,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    })
  }
})

router.post('/:documentId/edit-selection', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return

  const record = getDocumentRecord(req.params.documentId)
  if (!record || record.userId !== userId) {
    res.status(404).json({ success: false, error: '文稿不存在或无权限访问' })
    return
  }

  const instruction = String(req.body?.instruction || '').trim()
  const selectedText = String(req.body?.selectedText || '').trim()
  if (!instruction) {
    res.status(400).json({ success: false, error: 'instruction 不能为空' })
    return
  }
  if (!selectedText) {
    res.status(400).json({ success: false, error: 'selectedText 不能为空' })
    return
  }

  try {
    const requestRecord = updateRecordFromRequest(record, (req.body || {}) as Record<string, unknown>)
    const replacementText = requestRecord.engine === 'builtin'
      ? await editDocumentSelectionWithBuiltin({
          record: requestRecord,
          instruction,
          selectedText,
          selectionContext: req.body?.selectionContext,
        })
      : await editDocumentSelectionWithMinimax({
          record: requestRecord,
          instruction,
          selectedText,
          selectionContext: req.body?.selectionContext,
        })

    res.json({
      success: true,
      documentId: requestRecord.documentId,
      sectionId: typeof req.body?.selectionContext?.sectionId === 'string' ? req.body.selectionContext.sectionId : undefined,
      updatedText: replacementText,
      patch: {
        type: 'replace_selection',
        selectedText,
        replacementText,
      },
      message: '已生成选中文本替换补丁，请前端应用到当前选区。',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    })
  }
})

router.post('/:documentId/save', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return

  const record = getDocumentRecord(req.params.documentId)
  if (!record || record.userId !== userId) {
    res.status(404).json({ success: false, error: '文稿不存在或无权限访问' })
    return
  }

  try {
    const requestRecord = updateRecordFromRequest(record, (req.body || {}) as Record<string, unknown>)
    const exported = await saveDocumentDraftDocxArtifact({
      userId,
      workspacePath: requestRecord.workspacePath,
      skillId: requestRecord.skillId,
      documentId: requestRecord.documentId,
      draft: requestRecord.draft,
      knowledgeRefs: requestRecord.knowledgeRefs,
    })
    const savedAt = new Date().toISOString()
    const nextRecord = {
      ...requestRecord,
      artifactId: exported.artifact.id,
      exportUrl: exported.exportUrl,
      filename: exported.filename,
      sourceRefs: exported.artifact.sourceRefs ?? [],
      artifactKnowledgeRefs: exported.artifact.knowledgeRefs ?? [],
      artifact: exported.artifact,
      updatedAt: savedAt,
    }
    saveDocumentRecord(nextRecord)
    res.json({
      success: true,
      documentId: nextRecord.documentId,
      savedAt,
      artifact: nextRecord.artifact,
      artifactId: nextRecord.artifactId,
      exportUrl: nextRecord.exportUrl,
      filename: nextRecord.filename,
      document: nextRecord.draft,
      outline: buildDocumentOutline(nextRecord.draft),
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) })
  }
})

router.post('/:documentId/export', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return

  const record = getDocumentRecord(req.params.documentId)
  if (!record || record.userId !== userId) {
    res.status(404).json({ success: false, error: '文稿不存在或无权限访问' })
    return
  }

  const format = String(req.body?.format || 'docx').trim().toLowerCase()
  if (format !== 'docx') {
    res.status(501).json({ success: false, error: '当前仅支持 DOCX 导出；PDF 导出服务未配置。' })
    return
  }

  try {
    const requestRecord = updateRecordFromRequest(record, (req.body || {}) as Record<string, unknown>)
    const exported = await saveDocumentDraftDocxArtifact({
      userId,
      workspacePath: requestRecord.workspacePath,
      skillId: requestRecord.skillId,
      documentId: requestRecord.documentId,
      draft: requestRecord.draft,
      knowledgeRefs: requestRecord.knowledgeRefs,
    })
    const nextRecord = {
      ...requestRecord,
      artifactId: exported.artifact.id,
      exportUrl: exported.exportUrl,
      filename: exported.filename,
      sourceRefs: exported.artifact.sourceRefs ?? [],
      artifactKnowledgeRefs: exported.artifact.knowledgeRefs ?? [],
      artifact: exported.artifact,
      updatedAt: new Date().toISOString(),
    }
    saveDocumentRecord(nextRecord)
    res.json({
      success: true,
      engine: nextRecord.engine,
      documentId: nextRecord.documentId,
      artifactId: nextRecord.artifactId,
      exportUrl: nextRecord.exportUrl,
      filename: nextRecord.filename,
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) })
  }
})

router.get('/templates/list', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  res.json({
    success: true,
    templates: listDocumentTemplates(),
    engine: resolveDocumentEngine().engine,
    fallback: resolveDocumentEngine().fallback,
  })
})

export default router
