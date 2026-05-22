import { Router } from 'express'
import { getAiSettingsView, testAiConnection } from './services/aiSettings'
import { requireAccountUser } from '../../lib/authUser'

const router = Router()

router.get('/ai', (_req, res) => {
  res.json(getAiSettingsView())
})

router.post('/ai/test', async (_req, res) => {
  const result = await testAiConnection()
  res.status(result.ok ? 200 : 502).json(result)
})

router.get('/parity-status', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  res.json({
    success: true,
    status: 'partial',
    accountCenter: {
      tokenUnified: true,
      rolePermissions: 'partial',
    },
    ai: getAiSettingsView(),
    emailConfig: {
      available: true,
      route: '/api/email/account',
    },
    partialMissing: [
      'model/provider settings are server-env read-only',
      'role and permission matrix is not fully exposed',
      'workspace configuration persistence is partial',
      'Electron settings store is not fully ported to Web server settings',
    ],
  })
})

export default router
