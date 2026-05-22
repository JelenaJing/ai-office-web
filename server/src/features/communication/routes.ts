import { Router } from 'express'
import { requireAccountUser } from '../../lib/authUser'

const router = Router()

router.get('/directory', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  res.json({
    success: true,
    people: [
      {
        id: userId,
        name: '当前用户',
        role: 'user',
        source: 'account-token',
      },
    ],
    departments: [],
    partialMissing: [
      'organization directory provider is not connected',
      'AccountCenter role hierarchy is not fully exposed',
      'recipient resolver is partial',
    ],
  })
})

export default router
