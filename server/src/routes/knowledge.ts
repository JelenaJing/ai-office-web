import { Router } from 'express'
import multer from 'multer'
import { requireAccountUser } from '../lib/authUser'
import {
  deleteFile,
  getBaseInfo,
  getKnowledgeBase,
  listRemoteKnowledgeSources,
  listWorkspaceKnowledgeSources,
  ingestFilesFromBuffers,
  listFiles,
  resolveRemoteKnowledgePartitionId,
} from '../modules/knowledge'
import { searchKnowledgeCitation } from '../features/knowledge/services/knowledgeSearchService'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } })

async function resolvePartition(departmentId: string): Promise<string> {
  const deptId = String(departmentId || '').trim()
  const remote = await getKnowledgeBase(deptId)
  const nameEn = remote?.nameEn ?? deptId
  return resolveRemoteKnowledgePartitionId(deptId, nameEn)
}

router.get('/sources', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return

  const workspaceId = typeof req.query.workspaceId === 'string'
    ? req.query.workspaceId.trim()
    : ''

  const [remoteResult, workspaceResult] = await Promise.allSettled([
    listRemoteKnowledgeSources(),
    listWorkspaceKnowledgeSources({ userId, workspaceId }),
  ])

  const warnings: string[] = []
  const sources = [
    ...(workspaceResult.status === 'fulfilled'
      ? workspaceResult.value
      : (() => {
          const message = workspaceResult.reason instanceof Error ? workspaceResult.reason.message : String(workspaceResult.reason)
          warnings.push(`工作区附件列表读取失败：${message}`)
          console.warn(`[knowledge] list workspace sources failed user=${userId}:`, message)
          return []
        })()),
    ...(remoteResult.status === 'fulfilled'
      ? remoteResult.value
      : (() => {
          const message = remoteResult.reason instanceof Error ? remoteResult.reason.message : String(remoteResult.reason)
          warnings.push(`远端知识库列表读取失败：${message}`)
          console.warn(`[knowledge] list remote sources failed user=${userId}:`, message)
          return []
        })()),
  ]

  res.json({ sources, warnings })
})

/** GET /api/knowledge/:departmentId/info */
router.get('/:departmentId/info', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const departmentId = String(req.params.departmentId || '').trim()

  try {
    const partition = await resolvePartition(departmentId)
    const info = await getBaseInfo(partition)
    res.json(info)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[knowledge] getBaseInfo failed user=${userId} dept=${departmentId}:`, msg)
    res.status(502).json({ message: `获取知识库信息失败：${msg}` })
  }
})

router.get('/:departmentId/parity-status', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const departmentId = String(req.params.departmentId || '').trim()
  try {
    const partition = await resolvePartition(departmentId)
    const info = await getBaseInfo(partition)
    res.json({
      status: 'partial',
      departmentId,
      partition,
      documentCount: info.documentCount,
      capabilities: {
        upload: true,
        textExtraction: 'remote-service',
        chunking: 'remote-service',
        embedding: 'remote-service-if-configured',
        vectorSearch: 'remote-service-if-configured',
        citationSourceDisplay: 'partial',
        permissions: 'account-token-only',
      },
      partialMissing: [
        'local Electron knowledgeService parity is not fully ported',
        'citation source propagation across document/ppt/email is partial',
        'permission and trust-level metadata are not fully exposed',
      ],
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(502).json({ message: `知识库状态检测失败：${msg}` })
  }
})

/** POST /api/knowledge/search — unified remote + workspace citation retrieval. */
router.post('/search', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return

  const query = String(req.body?.query || '').trim()
  const workspaceId = String(req.body?.workspaceId || '').trim()
  const selectedSourceIds = Array.isArray(req.body?.selectedSourceIds)
    ? req.body.selectedSourceIds.map((id: unknown) => String(id || '').trim()).filter(Boolean)
    : []
  const topK = Math.max(1, Math.min(Number(req.body?.topK) || 5, 10))

  const searchResult = await searchKnowledgeCitation({
    userId,
    query,
    workspaceId,
    selectedSourceIds,
    topK,
  })

  res.json({
    success: true,
    query,
    workspaceId,
    selectedSourceIds,
    topK,
    chunks: searchResult.chunks.slice(0, topK),
    mockable: searchResult.mockable,
    warnings: searchResult.warnings ?? [],
  })
})

/** GET /api/knowledge/:departmentId/documents */
router.get('/:departmentId/documents', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const departmentId = String(req.params.departmentId || '').trim()

  try {
    const partition = await resolvePartition(departmentId)
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
    console.error(`[knowledge] listDocuments failed user=${userId} dept=${departmentId}:`, msg)
    res.status(502).json({ message: `获取文档列表失败：${msg}` })
  }
})

/** POST /api/knowledge/:departmentId/import — multipart upload (Web) or 501 without files */
router.post('/:departmentId/import', upload.array('files', 20), async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const departmentId = String(req.params.departmentId || '').trim()
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
    const partition = await resolvePartition(departmentId)
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
    console.error(`[knowledge] importDocuments failed user=${userId} dept=${departmentId}:`, msg)
    res.status(502).json({ message: `上传失败：${msg}` })
  }
})

/** DELETE /api/knowledge/:departmentId/documents/:documentId */
router.delete('/:departmentId/documents/:documentId', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const departmentId = String(req.params.departmentId || '').trim()
  const documentId = String(req.params.documentId || '').trim()

  try {
    const partition = await resolvePartition(departmentId)
    await deleteFile(partition, documentId)
    res.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(
      `[knowledge] deleteDocument failed user=${userId} dept=${departmentId} doc=${documentId}:`,
      msg,
    )
    res.status(502).json({ message: `删除文档失败：${msg}` })
  }
})

export default router
