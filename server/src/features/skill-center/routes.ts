import { Router } from 'express'
import { requireAccountUser } from '../../lib/authUser'
import { runCreateImageSkill } from '../../skills/image/createImageSkill'
import { runAnalyzeXlsxSkill } from '../../skills/excel/analyzeXlsxSkill'
import { runDailyReportSkill } from '../../skills/report/dailyReportSkill'
import {
  cancelSkillJob,
  createSkillJob,
  getSkillJob,
  updateSkillJob,
} from './services/skillJobStore'

const router = Router()

const SKILL_PARTIAL_MISSING = [
  'remote skill store installation is not fully ported',
  'AOSKIN package execution is not implemented in Web runtime',
  'job API currently wraps selected Web built-in skills only',
]

async function runKnownSkill(userId: string, skillId: string, input: Record<string, unknown>) {
  const workspacePath = String(input.workspacePath || '').trim()
  if (skillId === 'web.image.generate') {
    return runCreateImageSkill({ userId, workspacePath, prompt: String(input.prompt || input.title || '') })
  }
  if (skillId === 'web.xlsx.analyze') {
    return runAnalyzeXlsxSkill({
      userId,
      workspacePath,
      fileId: String(input.fileId || ''),
      prompt: typeof input.prompt === 'string' ? input.prompt : undefined,
      options: input.options && typeof input.options === 'object' ? input.options as Record<string, unknown> : undefined,
    })
  }
  if (skillId === 'web.daily.report') {
    const params = input.params && typeof input.params === 'object' ? input.params as Record<string, unknown> : {}
    return runDailyReportSkill({
      userId,
      workspacePath,
      date: String(input.date || params.date || ''),
    })
  }
  return {
    success: false as const,
    error: `Skill job runtime 尚未支持 ${skillId}，请继续使用 /api/skills/${encodeURIComponent(skillId)}/run`,
    status: 501,
  }
}

router.get('/status', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  res.json({
    success: true,
    status: 'partial',
    remoteStoreUrl: process.env.SKILL_STORE_URL || null,
    capabilities: {
      listBuiltinSkills: true,
      runBuiltinSkills: true,
      asyncSkillJobs: 'selected-builtins',
      installRemoteSkills: false,
      artifactOutput: 'skill-dependent',
    },
    partialMissing: SKILL_PARTIAL_MISSING,
  })
})

router.post('/jobs/start', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const skillId = String(req.body?.skillId || '').trim()
  if (!skillId) {
    res.status(400).json({ success: false, error: 'skillId 不能为空' })
    return
  }
  const input = req.body?.input && typeof req.body.input === 'object'
    ? req.body.input as Record<string, unknown>
    : req.body as Record<string, unknown>
  const job = createSkillJob(skillId)
  updateSkillJob(job.jobId, { status: 'running', progress: 10, message: '正在执行 Skill…' })

  void runKnownSkill(userId, skillId, input)
    .then((result) => {
      if (getSkillJob(job.jobId)?.cancelRequested) return
      if (!result.success) {
        updateSkillJob(job.jobId, {
          status: 'failed',
          progress: 100,
          message: result.error,
          error: result.error,
          result,
        })
        return
      }
      updateSkillJob(job.jobId, { status: 'completed', progress: 100, message: 'Skill 执行完成', result })
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : String(error)
      updateSkillJob(job.jobId, { status: 'failed', progress: 100, message, error: message })
    })

  res.json({ success: true, jobId: job.jobId, status: 'running', partialMissing: SKILL_PARTIAL_MISSING })
})

router.get('/jobs/:jobId', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const job = getSkillJob(req.params.jobId)
  if (!job) {
    res.status(404).json({ success: false, error: '任务不存在或已过期' })
    return
  }
  res.json({ success: true, ...job, partialMissing: SKILL_PARTIAL_MISSING })
})

router.post('/jobs/:jobId/cancel', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const job = cancelSkillJob(req.params.jobId)
  if (!job) {
    res.status(404).json({ success: false, error: '任务不存在或已过期' })
    return
  }
  res.json({ success: true, jobId: job.jobId, status: job.status })
})

export default router
