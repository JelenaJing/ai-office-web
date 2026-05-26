import { Router } from 'express'
import { requireAccountUser } from '../../../lib/authUser'
import {
  WEBDOC_TOOL_IDS,
  invokeWebDocOpenCode,
  listWebDocTools,
  streamWebDocChatLlm,
  type WebDocChatTurn,
  type WebDocToolId,
} from '../services/opencodeWebDocService'

const router = Router()

function normalizeChatHistory(value: unknown): WebDocChatTurn[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const role = (item as WebDocChatTurn).role
      const text = typeof (item as WebDocChatTurn).text === 'string' ? (item as WebDocChatTurn).text.trim() : ''
      if ((role !== 'user' && role !== 'assistant') || !text) return null
      return { role, text: text.slice(0, 8000) }
    })
    .filter((item): item is WebDocChatTurn => Boolean(item))
    .slice(-20)
}

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
      chatHistory: normalizeChatHistory(req.body?.chatHistory),
    })
    res.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    res.status(500).json({ success: false, error: message })
  }
})

function writeSse(res: import('express').Response, event: string, data: unknown): void {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
}

/** 对话流式入口（SSE）：首字更快返回，结束时附带 patch */
router.post('/chat/stream', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return

  const instruction = typeof req.body?.instruction === 'string' ? req.body.instruction.trim() : ''
  const html = typeof req.body?.html === 'string' ? req.body.html : ''
  const tool = normalizeTool(req.body?.tool ?? 'chat')

  if (!instruction) {
    res.status(400).json({ success: false, error: 'instruction 不能为空' })
    return
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders?.()

  writeSse(res, 'status', { text: '正在生成…' })

  try {
    const result = await streamWebDocChatLlm(
      {
        tool,
        instruction,
        html,
        title: typeof req.body?.title === 'string' ? req.body.title : undefined,
        selectedText: typeof req.body?.selectedText === 'string' ? req.body.selectedText : undefined,
        selectedBlockId: typeof req.body?.selectedBlockId === 'string' ? req.body.selectedBlockId : null,
        selectedSectionId: typeof req.body?.selectedSectionId === 'string' ? req.body.selectedSectionId : null,
        chatHistory: normalizeChatHistory(req.body?.chatHistory),
      },
      (delta) => {
        writeSse(res, 'delta', { text: delta })
      },
    )
    writeSse(res, 'done', result)
    res.end()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    writeSse(res, 'error', { success: false, error: message })
    res.end()
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
      chatHistory: normalizeChatHistory(req.body?.chatHistory),
    })
    res.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    res.status(500).json({ success: false, error: message })
  }
})

export default router
