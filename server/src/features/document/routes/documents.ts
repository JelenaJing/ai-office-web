import fs from 'fs'
import path from 'path'
import { Router } from 'express'
import multer from 'multer'
import { requireAccountUser } from '../../../lib/authUser'
import { getArtifact, getArtifactFilePath } from '../../../artifacts/ArtifactStore'
import { resolveUserFileInWorkspace } from '../../../lib/userFiles'
import { assertWorkspaceAccess, WorkspaceAccessError } from '../../../lib/workspaceAccess'
import { getDocumentRecord, getDocumentTask, saveDocumentRecord, updateDocumentTask, createDocumentTask } from '../services/documentTaskStore'
import { resolveDocumentKnowledgeRefs } from '../services/documentKnowledgeRefs'
import {
  editDocumentSectionWithBuiltin,
  editDocumentSelectionWithBuiltin,
  runBuiltinDocumentEngine,
} from '../services/documentBuiltinEngine'
import { buildDocumentOutline, normalizeDocumentDraft } from '../services/documentDraft'
import { saveDocumentDraftDocxArtifact } from '../services/documentArtifactService'
import {
  editDocumentSectionWithMinimax,
  editDocumentSelectionWithMinimax,
  runAcceptanceModeDocument,
  runMinimaxDocx,
} from '../services/minimaxDocxRunner'
import { resolveDocumentDraftFromPayload } from '../services/documentEditablePayload'
import { listDocumentTemplates } from '../services/documentTemplateCatalog'
import { routeDocumentTask } from '../services/documentTaskRouter'
import { continueDocumentAtCursor } from '../services/documentContinuationService'
import { extractDocxContent } from '../services/docxExtractService'
import { buildWorkbenchDraftFromHtml, persistWorkbenchDocument } from '../services/documentWorkbenchBridge'
import { buildWorkbenchDocumentArtifact } from '../services/documentWorkbenchArtifact'
import type { DocumentEngine, DocumentFallbackMode, DocumentKnowledgeRefInput, DocumentLanguage, DocumentRecord, DocumentType } from '../types'

const router = Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
})
const DOCUMENT_TASK_TIMEOUT_MS = 90_000
const MINIMAX_ATTEMPT_TIMEOUT_MS = 60_000
const BUILTIN_ATTEMPT_TIMEOUT_MS = 30_000

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
  const workbenchArtifact = buildWorkbenchDocumentArtifact({
    documentId: record.documentId,
    draft,
    html: typeof body.html === 'string' ? body.html : record.html,
    knowledgeRefs: record.knowledgeRefs,
  })
  return {
    ...record,
    title: draft.title,
    draft,
    html: workbenchArtifact.html,
    documentArtifact: workbenchArtifact,
    updatedAt: new Date().toISOString(),
  }
}

function resolveWorkspacePath(userId: string, value: unknown): string {
  return assertWorkspaceAccess(
    userId,
    typeof value === 'string' ? value : undefined,
    'editor',
  ).workspacePath
}

function normalizeAttachments(value: unknown): Array<{ id?: string; name?: string }> {
  if (!Array.isArray(value)) return []
  const normalized: Array<{ id?: string; name?: string }> = []
  value.forEach((entry) => {
    if (typeof entry === 'string') {
      normalized.push({ id: entry })
      return
    }
    if (!entry || typeof entry !== 'object') return
    const record = entry as Record<string, unknown>
    normalized.push({
      id: typeof record.id === 'string' ? record.id : undefined,
      name: typeof record.name === 'string' ? record.name : undefined,
    })
  })
  return normalized
}

function isDocumentAcceptanceMode(): boolean {
  return process.env.DOCUMENT_ACCEPTANCE_MODE === '1'
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms)
    timer.unref?.()
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
}

async function runDocumentGeneration(input: {
  userId: string
  prompt: string
  title: string
  workspacePath: string
  templateId?: string
  knowledgeRefs: Awaited<ReturnType<typeof resolveDocumentKnowledgeRefs>>
  documentType: DocumentType
  language?: DocumentLanguage
  engineConfig: ReturnType<typeof resolveDocumentEngine>
}): Promise<Awaited<ReturnType<typeof runBuiltinDocumentEngine>>> {
  if (isDocumentAcceptanceMode()) {
    return runAcceptanceModeDocument(input)
  }
  if (input.engineConfig.engine === 'builtin') {
    return withTimeout(
      runBuiltinDocumentEngine({
        userId: input.userId,
        prompt: input.prompt,
        title: input.title,
        workspacePath: input.workspacePath,
        templateId: input.templateId,
        knowledgeRefs: input.knowledgeRefs,
        documentType: input.documentType,
        language: input.language === 'en-US' ? 'en-US' : 'zh-CN',
      }),
      DOCUMENT_TASK_TIMEOUT_MS,
      `内置文稿引擎生成超时（${Math.floor(DOCUMENT_TASK_TIMEOUT_MS / 1000)} 秒）`,
    )
  }

  try {
    return await withTimeout(
      runMinimaxDocx({
        userId: input.userId,
        prompt: input.prompt,
        title: input.title,
        workspacePath: input.workspacePath,
        templateId: input.templateId,
        knowledgeRefs: input.knowledgeRefs,
        documentType: input.documentType,
        language: input.language,
      }),
      MINIMAX_ATTEMPT_TIMEOUT_MS,
      `MiniMax DOCX Skill 超时（${Math.floor(MINIMAX_ATTEMPT_TIMEOUT_MS / 1000)} 秒）`,
    )
  } catch (error) {
    if (input.engineConfig.fallback !== 'builtin') {
      throw error
    }
    const fallbackReason = error instanceof Error ? error.message : String(error)
    const builtin = await withTimeout(
      runBuiltinDocumentEngine({
        userId: input.userId,
        prompt: input.prompt,
        title: input.title,
        workspacePath: input.workspacePath,
        templateId: input.templateId,
        knowledgeRefs: input.knowledgeRefs,
        documentType: input.documentType,
        language: input.language === 'en-US' ? 'en-US' : 'zh-CN',
      }),
      BUILTIN_ATTEMPT_TIMEOUT_MS,
      `内置文稿引擎回退后仍超时（${Math.floor(BUILTIN_ATTEMPT_TIMEOUT_MS / 1000)} 秒）`,
    )
    builtin.record.fallbackFrom = 'minimax_docx'
    builtin.record.fallbackReason = fallbackReason
    builtin.result.fallbackFrom = 'minimax_docx'
    builtin.result.fallbackReason = fallbackReason
    return builtin
  }
}

router.post('/task-router', async (req, res) => {
  if (!await requireAccountUser(req, res)) return

  const result = routeDocumentTask({
    prompt: req.body?.prompt,
    currentDocument: req.body?.currentDocument,
    selectedText: req.body?.selectedText,
    selectedSectionId: req.body?.selectedSectionId,
    attachments: normalizeAttachments(req.body?.attachments),
    templateId: req.body?.templateId,
    knowledgeRefs: Array.isArray(req.body?.knowledgeRefs) ? req.body.knowledgeRefs as DocumentKnowledgeRefInput[] : [],
  })

  if (result.confidence < 0.75) {
    res.json({
      ...result,
      success: true,
      defaultLanguage: 'zh-CN',
    })
    return
  }

  res.json({
    ...result,
    success: true,
    defaultLanguage: 'zh-CN',
  })
})

router.post('/start', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return

  let workspacePath: string
  try {
    workspacePath = resolveWorkspacePath(userId, req.body?.workspacePath)
  } catch (error) {
    const workspaceError = error instanceof WorkspaceAccessError ? error : null
    res.status(workspaceError?.status ?? 500).json({
      success: false,
      error: workspaceError?.message || (error instanceof Error ? error.message : String(error)),
      code: workspaceError?.code,
      bootstrap: workspaceError?.bootstrap,
    })
    return
  }
  const prompt = String(req.body?.prompt || '').trim()
  const title = String(req.body?.title || '').trim()
  const templateId = typeof req.body?.templateId === 'string' ? req.body.templateId : undefined
  const knowledgeRefs = Array.isArray(req.body?.knowledgeRefs)
    ? req.body.knowledgeRefs as DocumentKnowledgeRefInput[]
    : []
  const documentType = normalizeDocumentType(req.body?.documentType)
  const language = req.body?.language === 'en-US' ? 'en-US' : (req.body?.language === 'zh-CN' ? 'zh-CN' : undefined)

  if (!prompt) {
    res.status(400).json({ success: false, error: 'prompt 不能为空' })
    return
  }

  const task = createDocumentTask()
  const engineConfig = resolveDocumentEngine()
  updateDocumentTask(task.taskId, {
    status: 'running',
    progress: 5,
    engine: engineConfig.engine,
    message: engineConfig.engine === 'minimax_docx' ? '正在启动 MiniMax DOCX Skill…' : '正在启动内置文稿引擎…',
    startedAt: new Date().toISOString(),
  })

  void (async () => {
    let finalized = false
    const watchdog = setTimeout(() => {
      if (finalized) return
      finalized = true
      updateDocumentTask(task.taskId, {
        status: 'failed',
        progress: 100,
        message: `文稿生成超时（${Math.floor(DOCUMENT_TASK_TIMEOUT_MS / 1000)} 秒），请重试或检查当前引擎配置`,
        error: `文稿生成超时（${Math.floor(DOCUMENT_TASK_TIMEOUT_MS / 1000)} 秒）`,
        failedAt: new Date().toISOString(),
      })
    }, DOCUMENT_TASK_TIMEOUT_MS + 5_000)
    watchdog.unref?.()

    try {
      updateDocumentTask(task.taskId, {
        progress: 12,
        message: '正在整理知识库与附件引用…',
      })
      const refs = await resolveDocumentKnowledgeRefs({
        workspacePath,
        knowledgeRefs,
      })
      if (finalized) return
      updateDocumentTask(task.taskId, {
        progress: 28,
        message: isDocumentAcceptanceMode()
          ? 'DOCUMENT_ACCEPTANCE_MODE 已启用，正在生成稳定验收文稿…'
          : engineConfig.engine === 'minimax_docx'
            ? '正在生成文稿并准备 DOCX artifact…'
            : '正在使用内置文稿引擎生成文稿…',
      })
      const runResult = await runDocumentGeneration({
        userId,
        prompt,
        title,
        workspacePath,
        templateId,
        knowledgeRefs: refs,
        documentType,
        language,
        engineConfig,
      })
      if (finalized) return
      saveDocumentRecord(runResult.record)
      finalized = true
      clearTimeout(watchdog)
      updateDocumentTask(task.taskId, {
        documentId: runResult.record.documentId,
        status: 'completed',
        progress: 100,
        message: runResult.result.engine === 'minimax_docx' ? 'MiniMax DOCX Skill 任务已完成' : '内置文稿引擎任务已完成',
        engine: runResult.result.engine,
        fallbackFrom: runResult.result.fallbackFrom,
        fallbackReason: runResult.result.fallbackReason,
        result: runResult.result,
        completedAt: new Date().toISOString(),
      })
    } catch (error) {
      if (finalized) return
      finalized = true
      clearTimeout(watchdog)
      const message = error instanceof Error ? error.message : String(error)
      updateDocumentTask(task.taskId, {
        status: 'failed',
        progress: 100,
        message,
        error: message,
        failedAt: new Date().toISOString(),
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
    engine: task.engine,
    fallbackFrom: task.fallbackFrom,
    fallbackReason: task.fallbackReason,
    startedAt: task.startedAt,
    completedAt: task.completedAt,
    failedAt: task.failedAt,
    lastProgressMessage: task.lastProgressMessage,
    result: task.result,
    error: task.error,
  })
})

/**
 * POST /api/documents/edit-text
 *
 * Stateless text-level AI edit that does NOT require an existing document
 * record.  Intended for blank new documents where documentId is null.
 * Takes instruction + selectedText and returns updatedText.
 */
router.post('/edit-text', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return

  const instruction = String(req.body?.instruction || '').trim()
  const selectedText = String(req.body?.selectedText || '').trim()
  const context = (req.body?.selectionContext || {}) as Record<string, string>

  if (!instruction) {
    res.status(400).json({ success: false, error: 'instruction 不能为空' })
    return
  }
  if (!selectedText) {
    res.status(400).json({ success: false, error: 'selectedText 不能为空' })
    return
  }

  // Determine effective language from context or default to zh-CN
  const language = (context.language as DocumentLanguage | undefined) || 'zh-CN'
  const engine: DocumentEngine = 'minimax_docx'

  // Build a minimal stub record — only the fields used by the edit functions
  const stubDraft = {
    id: 'edit-text-stub',
    title: context.documentTitle || '文稿',
    type: 'report' as const,
    language,
    outline: [],
    sections: [],
    metadata: { engine },
  }
  const stubRecord = {
    documentId: 'edit-text-stub',
    userId,
    workspacePath: '/',
    engine,
    skillId: 'document',
    title: context.documentTitle || '文稿',
    language,
    documentType: 'report' as const,
    knowledgeRefs: [],
    draft: stubDraft,
    html: '',
    documentArtifact: {} as DocumentRecord['documentArtifact'],
    artifactId: '',
    exportUrl: '',
    filename: '',
    sourceRefs: [],
    artifactKnowledgeRefs: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } satisfies DocumentRecord

  try {
    const replacementText = await editDocumentSelectionWithMinimax({
      record: stubRecord,
      instruction,
      selectedText,
      selectionContext: context,
    })
    res.json({
      success: true,
      updatedText: replacementText,
      message: '已完成文本级 AI 编辑。',
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) })
  }
})

router.post('/:documentId/sections/:sectionId/edit', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return

  const record = getDocumentRecord(req.params.documentId, userId)
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
      html: nextRecord.html,
      documentArtifact: nextRecord.documentArtifact,
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

  const record = getDocumentRecord(req.params.documentId, userId)
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

router.post('/:documentId/continue', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return

  const record = getDocumentRecord(req.params.documentId, userId)
  if (!record || record.userId !== userId) {
    res.status(404).json({ success: false, error: '文稿不存在或无权限访问' })
    return
  }

  try {
    const requestRecord = updateRecordFromRequest(record, (req.body || {}) as Record<string, unknown>)
    const text = await continueDocumentAtCursor({
      record: requestRecord,
      instruction: typeof req.body?.instruction === 'string' ? req.body.instruction : undefined,
      cursorContext: req.body?.cursorContext,
    })
    res.json({
      success: true,
      documentId: requestRecord.documentId,
      sectionId: typeof req.body?.cursorContext?.sectionId === 'string' ? req.body.cursorContext.sectionId : undefined,
      patch: {
        type: 'insert_at_cursor',
        text,
      },
      message: '已生成续写补丁，请前端插入到当前光标位置。',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    })
  }
})

router.post('/save-initial', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return

  const workspacePath = resolveWorkspacePath(userId, req.body?.workspacePath)
  const body = (req.body || {}) as Record<string, unknown>
  const html = typeof body.html === 'string' ? body.html : ''
  if (!html.trim()) {
    res.status(400).json({ success: false, error: 'html 不能为空' })
    return
  }

  try {
    const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim() : '未命名文稿'
    const rawDraft = body.document || body.documentDraft
    const draft = rawDraft && typeof rawDraft === 'object'
      ? normalizeDocumentDraft({
        raw: rawDraft as Record<string, unknown>,
        title,
        type: 'report',
        language: 'zh-CN',
        engine: 'builtin',
        knowledgeRefs: [],
        preferredOutline: [],
      })
      : buildWorkbenchDraftFromHtml({
        html,
        title,
        documentType: 'report',
        language: 'zh-CN',
        engine: 'builtin',
        knowledgeRefs: [],
      })
    const userFileId = typeof body.userFileId === 'string' ? body.userFileId.trim() : ''
    const persisted = await persistWorkbenchDocument({
      userId,
      workspacePath,
      skillId: 'web.document.save-initial',
      engine: 'builtin',
      title: draft.title,
      documentType: 'report',
      language: 'zh-CN',
      knowledgeRefs: [],
      draft,
      html,
      userFileId: userFileId || undefined,
    })
    res.json({
      success: true,
      savedAt: persisted.record.updatedAt,
      userFileId: persisted.result.userFileId,
      ...persisted.result,
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

  const record = getDocumentRecord(req.params.documentId, userId)
  if (!record || record.userId !== userId) {
    res.status(404).json({ success: false, error: '文稿不存在或无权限访问' })
    return
  }

  const userFileId = typeof req.body?.userFileId === 'string' ? req.body.userFileId.trim() : ''

  try {
    const requestRecord = updateRecordFromRequest(record, (req.body || {}) as Record<string, unknown>)
    const exported = await saveDocumentDraftDocxArtifact({
      userId,
      workspacePath: requestRecord.workspacePath,
      skillId: requestRecord.skillId,
      documentId: requestRecord.documentId,
      draft: requestRecord.draft,
      knowledgeRefs: requestRecord.knowledgeRefs,
      html: requestRecord.html,
      documentArtifact: requestRecord.documentArtifact,
      userFileId: userFileId || undefined,
    })
    const savedAt = new Date().toISOString()
    const nextRecord = {
      ...requestRecord,
      html: exported.html,
      documentArtifact: exported.documentArtifact,
      artifactId: exported.artifact.id,
      exportUrl: exported.exportUrl,
      filename: exported.filename,
      sourceRefs: exported.artifact.sourceRefs ?? [],
      artifactKnowledgeRefs: exported.artifact.knowledgeRefs ?? [],
      artifact: exported.artifact,
      updatedAt: savedAt,
    }
    saveDocumentRecord(nextRecord)
    const mirroredFileId = userFileId || exported.userFileId
    res.json({
      success: true,
      documentId: nextRecord.documentId,
      savedAt,
      userFileId: mirroredFileId,
      artifact: nextRecord.artifact,
      artifactId: nextRecord.artifactId,
      exportUrl: nextRecord.exportUrl,
      filename: nextRecord.filename,
      document: nextRecord.draft,
      html: nextRecord.html,
      documentArtifact: nextRecord.documentArtifact,
      outline: buildDocumentOutline(nextRecord.draft),
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) })
  }
})

router.post('/:documentId/export', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return

  const record = getDocumentRecord(req.params.documentId, userId)
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
      html: requestRecord.html,
      documentArtifact: requestRecord.documentArtifact,
    })
    const nextRecord = {
      ...requestRecord,
      html: exported.html,
      documentArtifact: exported.documentArtifact,
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

router.post('/import-docx', upload.single('file'), async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return

  const workspacePath = resolveWorkspacePath(userId, req.body?.workspacePath)
  const artifactId = typeof req.body?.artifactId === 'string' ? req.body.artifactId.trim() : ''
  const fileId = typeof req.body?.fileId === 'string' ? req.body.fileId.trim() : ''
  let buffer: Buffer | null = req.file?.buffer ?? null
  let originalName = req.file?.originalname || ''

  if (!buffer && fileId) {
    const resolved = resolveUserFileInWorkspace(userId, fileId, workspacePath)
    if (!resolved) {
      res.status(404).json({ success: false, error: 'fileId 对应的文件不存在' })
      return
    }
    buffer = fs.readFileSync(resolved.absolutePath)
    originalName = resolved.entry.name
  }

  if (!buffer && artifactId) {
    const artifact = getArtifact(artifactId)
    const exportedFile = artifact?.exports?.[0]
    if (!artifact || !exportedFile) {
      res.status(404).json({ success: false, error: 'artifactId 对应的文件不存在' })
      return
    }
    const filePath = getArtifactFilePath(artifactId, exportedFile.filename)
    if (!filePath || !fs.existsSync(filePath)) {
      res.status(404).json({ success: false, error: 'artifactId 对应的输出文件不存在' })
      return
    }
    buffer = fs.readFileSync(filePath)
    originalName = exportedFile.filename
  }

  if (!buffer) {
    res.status(400).json({ success: false, error: '请上传文件，或提供 artifactId / fileId' })
    return
  }

  const ext = path.extname(originalName).slice(1).toLowerCase() || 'docx'

  if (fileId) {
    const resolvedFile = resolveUserFileInWorkspace(userId, fileId, workspacePath)
    const linkedDocId = resolvedFile?.entry.documentId
    if (linkedDocId) {
      const existing = getDocumentRecord(linkedDocId, userId)
      if (existing) {
        saveDocumentRecord(existing)
        return res.json({
          success: true,
          source: 'record',
          text: '',
          title: existing.title,
          wordCount: 0,
          userFileId: fileId,
          engine: existing.engine,
          skillId: existing.skillId,
          documentId: existing.documentId,
          artifactId: existing.artifactId,
          exportUrl: existing.exportUrl,
          filename: existing.filename,
          document: existing.draft,
          html: existing.html,
          documentArtifact: existing.documentArtifact,
          outline: buildDocumentOutline(existing.draft),
        })
      }
    }
  }

  try {
    let html = ''
    let text = ''
    let wordCount = 0
    let title = originalName.replace(/\.[^.]+$/, '') || '未命名文稿'

    if (ext === 'docx') {
      const extracted = await extractDocxContent(buffer)
      html = extracted.html
      text = extracted.text
      wordCount = extracted.wordCount
      title = extracted.title || title
    } else if (ext === 'html' || ext === 'md' || ext === 'txt') {
      const raw = buffer.toString('utf-8')
      text = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      wordCount = text.length
      if (ext === 'html') {
        html = raw
      } else if (ext === 'md') {
        html = raw
          .split(/\n{2,}/)
          .map((block) => block.trim())
          .filter(Boolean)
          .map((block) => `<p>${block.replace(/\n/g, '<br/>')}</p>`)
          .join('\n')
      } else {
        html = raw
          .split(/\n{2,}/)
          .map((block) => block.trim())
          .filter(Boolean)
          .map((block) => `<p>${block.replace(/\n/g, '<br/>')}</p>`)
          .join('\n')
      }
      if (!html.trim()) html = '<p></p>'
    } else {
      res.status(400).json({ success: false, error: '仅支持 .docx / .html / .md / .txt 格式' })
      return
    }

    const draft = buildWorkbenchDraftFromHtml({
      html,
      title,
      documentType: 'report',
      language: 'zh-CN',
      engine: 'builtin',
      knowledgeRefs: [],
    })
    const persisted = await persistWorkbenchDocument({
      userId,
      workspacePath,
      skillId: fileId ? 'web.document.import-file' : artifactId ? 'web.document.import-artifact' : 'web.document.import-docx',
      engine: 'builtin',
      title: draft.title,
      documentType: 'report',
      language: 'zh-CN',
      knowledgeRefs: [],
      draft,
      html,
      userFileId: fileId || undefined,
    })
    res.json({
      success: true,
      source: fileId ? 'file' : artifactId ? 'artifact' : 'upload',
      text,
      title: draft.title,
      wordCount,
      userFileId: persisted.result.userFileId || fileId || undefined,
      ...persisted.result,
    })
  } catch (error) {
    res.status(422).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    })
  }
})

export default router
