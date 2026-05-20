/**
 * routes/artifacts.ts — Artifacts 下载 API (Phase 1 stubs)
 *
 * GET /api/artifacts/:artifactId/download — 返回文件内容或占位响应
 */

import { Router } from 'express'

const router = Router()

// GET /api/artifacts/:artifactId/download
router.get('/:artifactId/download', (req, res) => {
  const { artifactId } = req.params
  // Phase 1: 占位实现，后续对接真实文件存储
  res.status(404).json({
    message: `Artifact "${artifactId}" not found (Phase 1 placeholder)`,
    artifactId,
  })
})

export default router
