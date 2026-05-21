/**
 * routes/skills.ts — Skills API
 *
 * GET  /api/skills              — 返回内置 skill 列表
 * GET  /api/skills/:skillId     — 返回单个 skill 信息
 * POST /api/skills/:skillId/run — 执行指定 skill
 */

import { Router } from 'express'
import { resolveUserId } from '../lib/authUser'
import { runCreateDocxSkill } from '../skills/docx/createDocxSkill'
import { runAnalyzeXlsxSkill } from '../skills/excel/analyzeXlsxSkill'
import { runCreateImageSkill } from '../skills/image/createImageSkill'
import { runCreatePptxSkill } from '../skills/ppt/createPptxSkill'
import { runDailyReportSkill } from '../skills/report/dailyReportSkill'
import { skillRunRateLimit } from '../middleware/rateLimit'

const router = Router()

const BUILTIN_SKILLS = [
  {
    id: 'web.docx.create',
    name: '正式文稿生成',
    description: '根据提示词生成 Word 文稿，第一版输出 docx 文件。',
    category: 'document',
    outputArtifactType: 'document',
    version: '1.0.0',
    enabled: true,
  },
  {
    id: 'web.xlsx.analyze',
    name: '表格数据分析',
    description: '对已上传的 xlsx/csv 生成 Markdown 分析报告。',
    category: 'analysis',
    outputArtifactType: 'excel_analysis',
    version: '1.0.0',
    enabled: true,
  },
  {
    id: 'web.image.generate',
    name: '图片生成',
    description: '根据描述生成图片 artifact。',
    category: 'image',
    outputArtifactType: 'image',
    version: '1.0.0',
    enabled: true,
  },
  {
    id: 'web.pptx.create',
    name: 'PPT 生成',
    description: '根据主题生成 pptx 演示文稿。',
    category: 'presentation',
    outputArtifactType: 'presentation',
    version: '1.0.0',
    enabled: true,
  },
  {
    id: 'web.daily.report',
    name: '工作日报',
    description: '汇总文件与生成记录，输出日报 Markdown。',
    category: 'report',
    outputArtifactType: 'report',
    version: '1.0.0',
    enabled: true,
  },
  {
    id: 'paper-generation',
    name: '论文生成',
    description: '基于知识库生成学术论文草稿',
    category: 'writing',
    version: '1.0.0',
    enabled: false,
  },
  {
    id: 'ppt-generation',
    name: 'PPT 生成',
    description: '根据主题和参考材料生成 PPT 文稿',
    category: 'presentation',
    version: '1.0.0',
    enabled: false,
  },
  {
    id: 'email-writing',
    name: '邮件撰写',
    description: '智能辅助撰写工作邮件',
    category: 'communication',
    version: '1.0.0',
    enabled: false,
  },
  {
    id: 'data-analysis',
    name: '数据分析',
    description: '上传 Excel/CSV 执行智能分析',
    category: 'analysis',
    version: '1.0.0',
    enabled: false,
  },
]

// GET /api/skills
router.get('/', (_req, res) => {
  res.json({ skills: BUILTIN_SKILLS })
})

// GET /api/skills/:skillId
router.get('/:skillId', (req, res) => {
  const skill = BUILTIN_SKILLS.find((s) => s.id === req.params.skillId)
  if (!skill) {
    return res.status(404).json({ message: 'Skill not found' })
  }
  return res.json({ skill })
})

// POST /api/skills/:skillId/run
router.post('/:skillId/run', skillRunRateLimit, async (req, res) => {
  const { skillId } = req.params

  if (skillId === 'web.docx.create') {
    const { prompt, workspacePath, params } = req.body as {
      prompt?: string
      workspacePath?: string
      params?: { title?: string; workspacePath?: string }
    }
    const resolvedWorkspacePath = workspacePath ?? params?.workspacePath ?? ''
    if (!resolvedWorkspacePath) {
      return res.status(400).json({ success: false, error: '请先选择工作区（缺少 workspacePath）' })
    }
    const result = await runCreateDocxSkill({
      prompt,
      title: params?.title,
      workspacePath: resolvedWorkspacePath,
    })
    if (result.success) {
      return res.json(result)
    }
    return res.status(500).json({ success: false, error: result.error })
  }

  if (skillId === 'web.xlsx.analyze') {
    const userId = await resolveUserId(req)
    const body = req.body as {
      fileId?: string
      prompt?: string
      options?: Record<string, unknown>
      workspacePath?: string
      params?: {
        fileId?: string
        prompt?: string
        options?: Record<string, unknown>
        workspacePath?: string
      }
    }
    const fileId = body.fileId ?? body.params?.fileId ?? ''
    const prompt = body.prompt ?? body.params?.prompt
    const options = body.options ?? body.params?.options
    const workspacePath =
      body.workspacePath ?? body.params?.workspacePath ?? ''
    if (!workspacePath) {
      return res.status(400).json({
        success: false,
        error: '请先选择工作区（缺少 workspacePath）',
      })
    }
    const result = await runAnalyzeXlsxSkill({
      userId,
      fileId: String(fileId),
      workspacePath,
      prompt,
      options,
    })
    if (result.success) {
      return res.json({
        success: true,
        artifactId: result.artifactId,
        artifact: result.artifact,
      })
    }
    const status = result.status ?? 500
    return res.status(status).json({ success: false, error: result.error })
  }

  const userId = await resolveUserId(req)
  const body = req.body as {
    prompt?: string
    workspacePath?: string
    params?: Record<string, unknown>
  }
  const workspacePath = String(
    body.workspacePath ?? body.params?.workspacePath ?? '',
  )
  const params = (body.params ?? body) as Record<string, unknown>

  if (skillId === 'web.image.generate') {
    if (!workspacePath) {
      return res.status(400).json({ success: false, error: '缺少 workspacePath' })
    }
    const result = await runCreateImageSkill({
      userId,
      workspacePath,
      prompt: String(body.prompt ?? params.prompt ?? ''),
    })
    if (result.success) {
      return res.json({ success: true, artifactId: result.artifactId, artifact: result.artifact })
    }
    return res.status(result.status ?? 500).json({ success: false, error: result.error })
  }

  if (skillId === 'web.pptx.create') {
    if (!workspacePath) {
      return res.status(400).json({ success: false, error: '缺少 workspacePath' })
    }
    const result = await runCreatePptxSkill({
      userId,
      workspacePath,
      title: String(params.title ?? ''),
      prompt: String(body.prompt ?? params.prompt ?? ''),
      templateId: String(params.templateId ?? ''),
    })
    if (result.success) {
      return res.json({ success: true, artifactId: result.artifactId, artifact: result.artifact })
    }
    return res.status(result.status ?? 500).json({ success: false, error: result.error })
  }

  if (skillId === 'web.daily.report') {
    if (!workspacePath) {
      return res.status(400).json({ success: false, error: '缺少 workspacePath' })
    }
    const result = await runDailyReportSkill({
      userId,
      workspacePath,
      date: String(params.date ?? ''),
    })
    if (result.success) {
      return res.json({ success: true, artifactId: result.artifactId, artifact: result.artifact })
    }
    return res.status(result.status ?? 500).json({ success: false, error: result.error })
  }

  const skill = BUILTIN_SKILLS.find((s) => s.id === skillId)
  if (!skill) {
    return res.status(404).json({ message: 'Skill not found' })
  }
  // Other skills: placeholder
  const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  return res.status(202).json({
    taskId,
    skillId: skill.id,
    status: 'queued',
    message: '任务已排队（当前 skill 暂未实现）',
  })
})

export default router
