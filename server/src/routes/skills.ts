/**
 * routes/skills.ts — Skills API (Phase 1 stubs)
 *
 * GET  /api/skills            — 返回内置 skill 列表
 * POST /api/skills/:skillId/run — 执行指定 skill（暂返回 202 占位）
 */

import { Router } from 'express'

const router = Router()

const BUILTIN_SKILLS = [
  {
    id: 'paper-generation',
    name: '论文生成',
    description: '基于知识库生成学术论文草稿',
    category: 'writing',
    version: '1.0.0',
    enabled: true,
  },
  {
    id: 'ppt-generation',
    name: 'PPT 生成',
    description: '根据主题和参考材料生成 PPT 文稿',
    category: 'presentation',
    version: '1.0.0',
    enabled: true,
  },
  {
    id: 'email-writing',
    name: '邮件撰写',
    description: '智能辅助撰写工作邮件',
    category: 'communication',
    version: '1.0.0',
    enabled: true,
  },
  {
    id: 'data-analysis',
    name: '数据分析',
    description: '上传 Excel/CSV 执行智能分析',
    category: 'analysis',
    version: '1.0.0',
    enabled: true,
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
router.post('/:skillId/run', (req, res) => {
  const skill = BUILTIN_SKILLS.find((s) => s.id === req.params.skillId)
  if (!skill) {
    return res.status(404).json({ message: 'Skill not found' })
  }
  // Phase 1: 返回占位任务 ID
  const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  return res.status(202).json({
    taskId,
    skillId: skill.id,
    status: 'queued',
    message: '任务已排队（Phase 1 占位响应）',
  })
})

export default router
