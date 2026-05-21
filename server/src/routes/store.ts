import { Router } from 'express'
import { getSkillStoreEmbedUrl } from '../modules/skill-store'

const router = Router()

router.get('/embed-url', (_req, res) => {
  const result = getSkillStoreEmbedUrl()
  if ('error' in result) {
    return res.status(503).json({ message: result.error })
  }
  res.json({ url: result.url })
})

export default router
