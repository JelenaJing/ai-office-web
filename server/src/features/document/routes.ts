import { Router } from 'express'
import multer from 'multer'
import { requireAccountUser } from '../../lib/authUser'
import { extractDocxContent } from './services/docxExtractService'
import paperWorkflowRouter from './routes/paperWorkflow'
import formalTemplateRouter from './routes/formalTemplate'
import academicWritingRouter from './routes/academicWriting'
import opencodeRouter from './routes/opencode'

const router = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
})

router.use('/paper-workflow', paperWorkflowRouter)
router.use('/formal-template', formalTemplateRouter)
router.use('/academic-writing', academicWritingRouter)
router.use('/opencode', opencodeRouter)

/**
 * POST /api/document/import-docx
 *
 * Accepts a .docx file upload and returns extracted HTML content.
 * The caller is responsible for inserting the HTML into the editor.
 *
 * Body: multipart/form-data, field "file" (.docx)
 * Returns: { html, text, title, wordCount }
 */
router.post(
  '/import-docx',
  requireAccountUser,
  upload.single('file'),
  async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: '请上传 .docx 文件' })
      return
    }

    const ext = (req.file.originalname ?? '').split('.').pop()?.toLowerCase()
    if (ext !== 'docx') {
      res.status(400).json({ error: '仅支持 .docx 格式文件' })
      return
    }

    try {
      const result = await extractDocxContent(req.file.buffer)
      res.json(result)
    } catch (err) {
      const message = err instanceof Error ? err.message : '解析失败'
      console.error('[document/import-docx]', message)
      res.status(422).json({ error: message })
    }
  },
)

// TODO: migrate more routes from server/src/routes/ to here

export default router
