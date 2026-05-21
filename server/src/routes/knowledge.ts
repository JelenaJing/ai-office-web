import { Router } from 'express'
import multer from 'multer'
import { requireAuth } from '../middleware/authMiddleware'
import {
  deleteFile,
  getBaseInfo,
  getKnowledgeBase,
  ingestFilesFromBuffers,
  listFiles,
  resolveRemoteKnowledgePartitionId,
} from '../modules/knowledge'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } })

router.use(requireAuth)

async function resolvePartition(departmentId: string): Promise<string> {
  const deptId = String(departmentId || '').trim()
  const remote = await getKnowledgeBase(deptId)
  const nameEn = remote?.nameEn ?? deptId
  return resolveRemoteKnowledgePartitionId(deptId, nameEn)
}

/** GET /api/knowledge/:departmentId/info */
router.get('/:departmentId/info', async (req, res) => {
  try {
    const partition = await resolvePartition(req.params.departmentId)
    const info = await getBaseInfo(partition)
    res.json(info)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(502).json({ message: `获取知识库信息失败：${msg}` })
  }
})

/** GET /api/knowledge/:departmentId/documents */
router.get('/:departmentId/documents', async (req, res) => {
  try {
    const partition = await resolvePartition(req.params.departmentId)
    const documents = await listFiles(partition)
    const query = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : ''
    const filtered = query
      ? documents.filter(
          (d) =>
            d.title.toLowerCase().includes(query) ||
            d.originalName.toLowerCase().includes(query),
        )
      : documents
    res.json({ documents: filtered })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(502).json({ message: `获取文档列表失败：${msg}` })
  }
})

/** POST /api/knowledge/:departmentId/import — multipart upload (Web) or 501 without files */
router.post('/:departmentId/import', upload.array('files', 20), async (req, res) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? []
  if (files.length === 0) {
    res.status(501).json({
      message: 'Web 版知识库上传需要使用浏览器文件上传，将在下一步接入',
      imported: [],
      duplicates: [],
      failed: [],
      canceled: false,
    })
    return
  }

  try {
    const partition = await resolvePartition(req.params.departmentId)
    const { imported, failed } = await ingestFilesFromBuffers(
      partition,
      files.map((f) => ({ name: f.originalname, buffer: f.buffer })),
    )
    res.json({
      imported,
      duplicates: [],
      failed: failed.map((error) => ({ filePath: '', fileName: '', error })),
      canceled: false,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(502).json({ message: `上传失败：${msg}` })
  }
})

/** DELETE /api/knowledge/:departmentId/documents/:documentId */
router.delete('/:departmentId/documents/:documentId', async (req, res) => {
  try {
    const partition = await resolvePartition(req.params.departmentId)
    await deleteFile(partition, String(req.params.documentId || '').trim())
    res.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(502).json({ message: `删除文档失败：${msg}` })
  }
})

export default router
