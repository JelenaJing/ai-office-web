import { Router } from 'express'
import { getAiSettingsView, testAiConnection } from '../modules/settings'

const router = Router()

router.get('/ai', (_req, res) => {
  res.json(getAiSettingsView())
})

router.post('/ai/test', async (_req, res) => {
  const result = await testAiConnection()
  res.status(result.ok ? 200 : 502).json(result)
})

export default router
