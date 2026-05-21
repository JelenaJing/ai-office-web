import { Router } from 'express'
import { requireAuth } from '../middleware/authMiddleware'
import {
  applyPresetHierarchy,
  listKnowledgeBases,
} from '../modules/knowledge'

const router = Router()

router.use(requireAuth)

/** GET /api/departments — remote knowledge base partitions as departments */
router.get('/', async (_req, res) => {
  try {
    const list = await listKnowledgeBases()
    const departments = applyPresetHierarchy(
      list.map((d) => ({
        id: d.id,
        name: d.name,
        nameEn: d.nameEn,
        preset: d.preset,
        createdAt: d.createdAt,
        parentId: d.parentId,
      })),
    )
    res.json({ departments })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[departments] list failed:', msg)
    res.status(502).json({ message: `远程知识库不可用：${msg}` })
  }
})

export default router
