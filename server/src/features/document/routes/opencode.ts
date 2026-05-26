import { Router } from 'express'
import { requireAccountUser } from '../../../lib/authUser'
import {
  WEBDOC_TOOL_IDS,
  invokeWebDocOpenCode,
  listWebDocTools,
  type WebDocToolId,
} from '../services/opencodeWebDocService'

const router = Router()

function normalizeTool(value: unknown): WebDocToolId {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (WEBDOC_TOOL_IDS.includes(raw as WebDocToolId)) {
    return raw as WebDocToolId
  }
  return 'chat'
}

router.get('/tools', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  res.json({
    success: true,
    tools: listWebDocTools(),
  })
})

router.post('/invoke', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return

  const instruction = typeof req.body?.instruction === 'string' ? req.body.instruction.trim() : ''
  const html = typeof req.body?.html === 'string' ? req.body.html : ''
  const tool = normalizeTool(req.body?.tool)

  if (!instruction) {
    res.status(400).json({ success: false, error: 'instruction 不能为空' })
    return
  }
  if (!html.trim()) {
    res.status(400).json({ success: false, error: 'html 不能为空' })
    return
  }

  try {
    const result = await invokeWebDocOpenCode({
      tool,
      instruction,
      html,
      title: typeof req.body?.title === 'string' ? req.body.title : undefined,
      selectedText: typeof req.body?.selectedText === 'string' ? req.body.selectedText : undefined,
      selectedBlockId: typeof req.body?.selectedBlockId === 'string' ? req.body.selectedBlockId : null,
      selectedSectionId: typeof req.body?.selectedSectionId === 'string' ? req.body.selectedSectionId : null,
    })
    res.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    res.status(500).json({ success: false, error: message })
  }
})

/** 对话入口：默认 tool=chat */
router.post('/chat', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return

  const instruction = typeof req.body?.instruction === 'string' ? req.body.instruction.trim() : ''
  const html = typeof req.body?.html === 'string' ? req.body.html : ''
  const tool = normalizeTool(req.body?.tool ?? 'chat')

  if (!instruction) {
    res.status(400).json({ success: false, error: 'instruction 不能为空' })
    return
  }

  try {
    const result = await invokeWebDocOpenCode({
      tool,
      instruction,
      html,
      title: typeof req.body?.title === 'string' ? req.body.title : undefined,
      selectedText: typeof req.body?.selectedText === 'string' ? req.body.selectedText : undefined,
      selectedBlockId: typeof req.body?.selectedBlockId === 'string' ? req.body.selectedBlockId : null,
      selectedSectionId: typeof req.body?.selectedSectionId === 'string' ? req.body.selectedSectionId : null,
    })
    res.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    res.status(500).json({ success: false, error: message })
  }
})

export default router
