/**
 * formalTemplate.ts — formal template routes
 *
 * Routes:
 *   GET  /api/document/formal-template/presets         — list available presets
 *   POST /api/document/formal-template/analyze          — extract fields from template
 *   POST /api/document/formal-template/generate         — generate filled document
 */

import { Router } from 'express'
import { requireAccountUser } from '../../../lib/authUser'
import {
  analyzeFormalTemplate,
  generateFormalTemplate,
  listPresets,
} from '../services/formalTemplateService'

const router = Router()

/**
 * GET /api/document/formal-template/presets
 * Returns list of available preset formal document templates.
 */
router.get('/presets', requireAccountUser, (_req, res) => {
  res.json({ success: true, presets: listPresets() })
})

/**
 * POST /api/document/formal-template/analyze
 *
 * Analyzes a formal template and returns extracted fields.
 * Body: { presetId?: string, customTemplateText?: string, instruction?: string }
 * Returns: { success, presetId, presetLabel, templateText, fields, defaultSections, diagnostics }
 */
router.post('/analyze', requireAccountUser, async (req, res) => {
  try {
    const result = await analyzeFormalTemplate({
      presetId: req.body.presetId,
      customTemplateText: req.body.customTemplateText,
      instruction: req.body.instruction,
    })

    if (!result.success) {
      res.status(422).json(result)
      return
    }

    res.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[formal-template/analyze]', message)
    res.status(500).json({ success: false, error: `分析失败：${message}` })
  }
})

/**
 * POST /api/document/formal-template/generate
 *
 * Generates a filled formal template document.
 * Body: {
 *   presetId?: string,
 *   customTemplateText?: string,
 *   instruction: string,
 *   language?: 'zh' | 'en',
 *   fieldOverrides?: Record<string, string>,
 *   extraContext?: string,
 *   workspacePath?: string
 * }
 * Returns: { success, title, markdown, html, presetId, presetLabel, resolvedFields, diagnostics }
 */
router.post('/generate', requireAccountUser, async (req, res) => {
  const instruction = String(req.body.instruction ?? '').trim()
  if (!instruction) {
    res.status(400).json({ success: false, error: '必须提供 instruction（文稿要求）' })
    return
  }

  try {
    const result = await generateFormalTemplate({
      presetId: req.body.presetId,
      customTemplateText: req.body.customTemplateText,
      instruction,
      language: req.body.language,
      fieldOverrides: req.body.fieldOverrides,
      extraContext: req.body.extraContext,
      workspacePath: req.body.workspacePath,
    })

    if (!result.success) {
      const statusCode = result.code === 'FT_LLM_NOT_CONFIGURED' ? 503 : 422
      res.status(statusCode).json(result)
      return
    }

    res.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[formal-template/generate]', message)
    res.status(500).json({ success: false, error: `正式模板生成失败：${message}` })
  }
})

export default router
