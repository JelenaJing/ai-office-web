import { Router } from 'express'
import { resolveUserId } from '../lib/authUser'
import {
  applyPresetHierarchy,
  listKnowledgeBases,
} from '../modules/knowledge'

const router = Router()

/** GET /api/departments — remote knowledge base partitions as departments */
router.get('/', async (req, res) => {
  const userId = await resolveUserId(req)

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
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[departments] list ok user=${userId} count=${departments.length}`)
    }
    res.json({ departments })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[departments] list failed user=${userId}:`, msg)
    res.status(502).json({ message: `远程知识库不可用：${msg}` })
  }
})

export default router
