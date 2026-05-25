import { Router } from 'express'
import { requireAccountUser } from '../../lib/authUser'
import { listSkills, getSkill } from './skillRegistry'

const router = Router()

router.get('/', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  res.json({ success: true, skills: listSkills() })
})

router.get('/:id', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const skill = getSkill(req.params.id)
  if (!skill) {
    res.status(404).json({ success: false, error: `Skill ${req.params.id} not found` })
    return
  }
  res.json({ success: true, skill })
})

export default router
