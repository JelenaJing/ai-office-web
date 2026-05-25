/**
 * External content handoff API — import text/markdown into Word (DocumentWorkbench).
 */

import { Router } from 'express'
import type { Request } from 'express'
import { requireAccountIdentity } from '../../../lib/authUser'
import { assertWorkspaceAccess, WorkspaceAccessError } from '../../../lib/workspaceAccess'
import type { DocumentLanguage, DocumentType } from '../../document/types'
import {
  buildHandoffOpenUrl,
  importExternalContentToDocument,
} from '../services/contentHandoffImport'
import {
  findContentHandoffByExternalId,
  getContentHandoff,
  saveContentHandoff,
  toPublicHandoffPayload,
} from '../services/contentHandoffStore'

const router = Router()

function sendWorkspaceError(res: import('express').Response, error: unknown): void {
  const workspaceError = error instanceof WorkspaceAccessError ? error : null
  if (workspaceError) {
    res.status(workspaceError.status).json({
      success: false,
      code: workspaceError.code,
      error: workspaceError.message,
      bootstrap: workspaceError.bootstrap,
    })
    return
  }
  const message = error instanceof Error ? error.message : String(error)
  res.status(500).json({ success: false, error: message })
}

function bearerToken(req: Request): string | null {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return null
  const token = auth.slice(7).trim()
  return token || null
}

function normalizeTargetPage(value: unknown): 'word' | null {
  const page = String(value || '').trim().toLowerCase()
  if (page === 'word' || page === 'document') return 'word'
  return null
}

function normalizeContentFormat(value: unknown): 'text' | 'markdown' {
  return String(value || '').trim().toLowerCase() === 'text' ? 'text' : 'markdown'
}

function normalizeDocumentType(value: unknown): DocumentType | undefined {
  const raw = String(value || '').trim()
  if (!raw) return undefined
  const allowed: DocumentType[] = ['report', 'notice', 'memo', 'proposal', 'summary', 'official_letter']
  return allowed.includes(raw as DocumentType) ? raw as DocumentType : undefined
}

function normalizeLanguage(value: unknown): DocumentLanguage | undefined {
  if (value === 'en-US' || value === 'zh-CN') return value
  return undefined
}

function normalizeWebOrigin(value: unknown): string | undefined {
  const raw = String(value || '').trim()
  if (!raw) return undefined
  try {
    const url = raw.includes('://') ? new URL(raw) : new URL(`https://${raw}`)
    return url.origin
  } catch {
    return undefined
  }
}

function requestOrigin(req: Request): string | undefined {
  const forwardedHost = req.headers['x-forwarded-host']
  const forwardedProto = req.headers['x-forwarded-proto'] || 'https'
  if (typeof forwardedHost === 'string' && forwardedHost.trim()) {
    return `${forwardedProto}://${forwardedHost.split(',')[0].trim()}`
  }
  const origin = req.headers.origin
  if (typeof origin === 'string' && origin) return origin
  const referer = req.headers.referer
  if (typeof referer === 'string' && referer) {
    try {
      return new URL(referer).origin
    } catch {
      return undefined
    }
  }
  return undefined
}

function buildOpenUrl(handoffId: string, req: Request): string {
  return buildHandoffOpenUrl(handoffId, {
    webOrigin: normalizeWebOrigin(req.body?.webOrigin || req.body?.returnBaseUrl),
    reqOrigin: requestOrigin(req),
  })
}

function buildHandoffResponseData(record: ReturnType<typeof saveContentHandoff>, req: Request) {
  return {
    handoffId: record.handoffId,
    targetPage: record.targetPage,
    userId: record.userId,
    workspacePath: record.workspacePath,
    documentId: record.documentId,
    artifactId: record.artifactId,
    exportUrl: record.exportUrl,
    filename: record.filename,
    openUrl: buildOpenUrl(record.handoffId, req),
    createdAt: record.createdAt,
  }
}

router.post('/content-handoff', async (req, res) => {
  const identity = await requireAccountIdentity(req, res)
  if (!identity) return
  const accessToken = bearerToken(req)
  if (!accessToken) {
    res.status(401).json({ success: false, error: '缺少 Authorization Bearer token，无法生成免登录跳转' })
    return
  }

  const targetPage = normalizeTargetPage(req.body?.targetPage)
  if (!targetPage) {
    res.status(400).json({ success: false, error: 'targetPage 仅支持 word' })
    return
  }

  const content = String(req.body?.content || '').trim()
  if (!content) {
    res.status(400).json({ success: false, error: 'content 不能为空' })
    return
  }

  const sourceApp = typeof req.body?.sourceApp === 'string' ? req.body.sourceApp.trim() : undefined
  const externalId = typeof req.body?.externalId === 'string' ? req.body.externalId.trim() : undefined
  if (sourceApp && externalId) {
    const existing = findContentHandoffByExternalId({ userId: identity.id, sourceApp, externalId })
    if (existing && existing.status === 'ready') {
      res.json({
        success: true,
        data: {
          ...buildHandoffResponseData(existing, req),
          reused: true,
        },
      })
      return
    }
  }

  let workspaceResolution
  try {
    workspaceResolution = assertWorkspaceAccess(
      identity.id,
      typeof req.body?.workspacePath === 'string' ? req.body.workspacePath : undefined,
      'editor',
    )
  } catch (error) {
    sendWorkspaceError(res, error)
    return
  }

  try {
    const imported = await importExternalContentToDocument({
      userId: identity.id,
      workspacePath: workspaceResolution.workspacePath,
      title: String(req.body?.title || '').trim() || '外部导入文稿',
      content,
      contentFormat: normalizeContentFormat(req.body?.contentFormat),
      language: normalizeLanguage(req.body?.language),
      documentType: normalizeDocumentType(req.body?.documentType),
    })

    const metadata = req.body?.metadata && typeof req.body.metadata === 'object'
      ? req.body.metadata as Record<string, unknown>
      : undefined

    const handoff = saveContentHandoff({
      userId: identity.id,
      user: {
        id: identity.id,
        username: identity.username,
        displayName: identity.displayName,
        email: identity.email,
      },
      accessToken,
      targetPage,
      workspacePath: workspaceResolution.workspacePath,
      documentId: imported.record.documentId,
      artifactId: imported.record.artifactId,
      exportUrl: imported.record.exportUrl,
      filename: imported.record.filename,
      title: imported.record.title,
      sourceApp,
      externalId,
      metadata,
      result: imported.result,
    })

    res.json({
      success: true,
      data: {
        ...buildHandoffResponseData(handoff, req),
        workspaceResolution: {
          switchedFrom: typeof req.body?.workspacePath === 'string' ? req.body.workspacePath : null,
          switchedTo: workspaceResolution.workspacePath,
          reason: 'assertWorkspaceAccess allowed import',
        },
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '导入失败',
    })
  }
})

router.post('/content-handoff/:handoffId/claim', async (req, res) => {
  const handoff = getContentHandoff(req.params.handoffId)
  if (!handoff) {
    res.status(404).json({ success: false, error: 'handoff 不存在或已过期' })
    return
  }
  if (handoff.status === 'expired') {
    res.status(410).json({ success: false, error: 'handoff 已过期' })
    return
  }

  res.json({
    success: true,
    data: {
      token: handoff.accessToken,
      user: handoff.user,
      handoff: toPublicHandoffPayload(handoff),
    },
  })
})

router.get('/content-handoff/:handoffId', async (req, res) => {
  const handoff = getContentHandoff(req.params.handoffId)
  if (!handoff) {
    res.status(404).json({ success: false, error: 'handoff 不存在或已过期' })
    return
  }
  if (handoff.status === 'expired') {
    res.status(410).json({
      success: false,
      error: 'handoff 已过期',
      data: {
        handoffId: handoff.handoffId,
        status: handoff.status,
      },
    })
    return
  }

  res.json({
    success: true,
    data: toPublicHandoffPayload(handoff),
  })
})

export default router
