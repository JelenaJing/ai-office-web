import express, { type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import authRouter from './routes/auth'
import accountCenterRouter from './routes/accountCenter'
import skillsRouter from './routes/skills'
import artifactsRouter from './routes/artifacts'
import workspacesRouter from './routes/workspaces'
import filesRouter from './routes/files'
import departmentsRouter from './routes/departments'
import knowledgeRouter from './routes/knowledge'
import emailRouter from './routes/email'
import calendarRouter from './routes/calendar'
import settingsRouter from './routes/settings'
import storeRouter from './routes/store'
import { aiosRouter } from './features/aios'
import documentRouter from './features/document/routes'
import documentWorkbenchRouter from './features/document/routes/documents'
import pptRouter from './features/ppt/routes'
import imageRouter from './features/image/routes'
import dataAnalysisRouter from './features/data-analysis/routes'
import reportRouter from './features/report/routes'
import chatRouter from './features/chat/routes'
import communicationRouter from './features/communication/routes'
import skillCenterRouter from './features/skill-center/routes'
import artifactJobsRouter from './features/artifact-jobs/routes'
import aiosSkillsRouter from './features/skills/routes'
import integrationsRouter from './features/integrations/routes/contentHandoff'
import {
  globalRateLimit,
  authRateLimit,
  handoffRateLimit,
} from './middleware/rateLimit'
import {
  ACCOUNT_CENTER_UNREACHABLE_CODE,
  ACCOUNT_CENTER_UNREACHABLE_MESSAGE,
  buildAccountCenterUrl,
  getAccountCenterBaseUrl,
  logAccountCenterIssue,
} from './lib/accountCenter'
import { requireAccountIdentity } from './lib/authUser'
import { bootstrapWorkspaceForUser } from './lib/workspaceAccess'
import { purgeExpiredArtifacts } from './artifacts/ArtifactStore'
import { purgeExpiredHtmlArtifacts } from './features/artifact-jobs/services/htmlArtifactStore'
import { getEmailAccount, maskAccount } from './features/email/services/emailStore'

const app = express()
const PORT = Number(process.env.PORT ?? 3001)

// ── Request timeout ────────────────────────────────────────────────────────────
// Long-running skill runs (AI generation) may take up to 90 s; everything else
// should respond within 30 s. Clients should also have their own timeout.
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS ?? 30_000)
const SKILL_TIMEOUT_MS   = Number(process.env.SKILL_TIMEOUT_MS   ?? 90_000)

function timeoutMiddleware(ms: number) {
  return (_req: Request, res: Response, next: NextFunction) => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        res.status(503).json({ message: '请求超时，请重试。' })
      }
    }, ms)
    res.on('finish', () => clearTimeout(timer))
    res.on('close',  () => clearTimeout(timer))
    next()
  }
}

// ── Body size limit ────────────────────────────────────────────────────────────
// Multipart uploads are handled by multer (50 MB limit set there).
// JSON payloads should be small; cap at 2 MB to prevent abuse.
app.use(express.json({ limit: '2mb' }))

// ── CORS ───────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:4173',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:4173',
      ...(process.env.WEB_ORIGIN ? [process.env.WEB_ORIGIN] : []),
    ],
  }),
)

// ── Global middleware ──────────────────────────────────────────────────────────
app.use('/api', globalRateLimit)

// Skill runs first — must not pass through the 30s /api timeout below
app.use('/api/skills/store', storeRouter)
app.use('/api/skills', timeoutMiddleware(SKILL_TIMEOUT_MS), skillsRouter)

// Document routes include LLM-heavy operations (paper workflow) — give them
// the same long timeout as skills.  Must be registered BEFORE the 30 s catch-all.
app.use('/api/document', timeoutMiddleware(SKILL_TIMEOUT_MS), documentRouter)
app.use('/api/documents', timeoutMiddleware(SKILL_TIMEOUT_MS), documentWorkbenchRouter)
app.use('/api/ppt', timeoutMiddleware(SKILL_TIMEOUT_MS), pptRouter)
app.use('/api/image', timeoutMiddleware(SKILL_TIMEOUT_MS), imageRouter)
app.use('/api/data-analysis', timeoutMiddleware(SKILL_TIMEOUT_MS), dataAnalysisRouter)
app.use('/api/work-report', timeoutMiddleware(SKILL_TIMEOUT_MS), reportRouter)
app.use('/api/chat', timeoutMiddleware(SKILL_TIMEOUT_MS), chatRouter)
app.use('/api/skill-center', timeoutMiddleware(SKILL_TIMEOUT_MS), skillCenterRouter)
app.use('/api', timeoutMiddleware(SKILL_TIMEOUT_MS), communicationRouter)

app.use('/api', timeoutMiddleware(REQUEST_TIMEOUT_MS))

app.use('/api/account-center', accountCenterRouter)
app.use('/api/auth', authRateLimit, authRouter)
app.use('/api/artifact-jobs', artifactJobsRouter)
app.use('/api/aios-skills', aiosSkillsRouter)
app.use('/api/artifacts', artifactsRouter)
app.use('/api/workspaces', workspacesRouter)
app.use('/api/files', filesRouter)
app.use('/api/departments', departmentsRouter)
app.use('/api/knowledge', knowledgeRouter)
app.use('/api/email', emailRouter)
app.use('/api/calendar', calendarRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/aios', aiosRouter)
app.use('/api/integrations', handoffRateLimit, integrationsRouter)

app.get('/api/me/context', async (req, res) => {
  const user = await requireAccountIdentity(req, res)
  if (!user) return
  const context = bootstrapWorkspaceForUser(user.id)
  const emailAccount = getEmailAccount(user.id)
  const connectedMailbox = emailAccount?.verified ? maskAccount(emailAccount) : null
  res.json({
    userId: context.currentUserId,
    username: user.username,
    displayName: user.displayName ?? user.username,
    currentTenantId: context.currentTenantId,
    currentWorkspaceId: context.currentWorkspaceId,
    currentWorkspacePath: context.currentWorkspacePath,
    currentWorkspaceRole: context.role,
    connectedMailbox,
  })
})

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

/**
 * Generic AccountCenter proxy — catch-all for any /api/* route not handled
 * above (e.g. /api/contacts, /api/people, /api/org-units, /api/users/:id/bindings).
 *
 * The browser never talks to AccountCenter directly; it always goes through here.
 */
const AC_URL = getAccountCenterBaseUrl()

app.use('/api', async (req, res) => {
  const target = buildAccountCenterUrl(req.originalUrl)
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const auth = req.headers['authorization']
  if (auth) headers['Authorization'] = String(auth)

  try {
    const isBodyMethod = !['GET', 'HEAD', 'OPTIONS'].includes(req.method)
    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body: isBodyMethod && Object.keys(req.body ?? {}).length > 0
        ? JSON.stringify(req.body)
        : undefined,
      signal: AbortSignal.timeout(15000),
    })

    if (upstream.status >= 500) {
      logAccountCenterIssue({
        scope: 'ac-proxy',
        method: req.method,
        path: req.originalUrl,
        baseUrl: AC_URL,
        status: upstream.status,
      })
    }

    const ct = upstream.headers.get('content-type') ?? ''
    res.status(upstream.status)
    if (ct.includes('application/json')) {
      res.json(await upstream.json())
    } else {
      res.send(await upstream.text())
    }
  } catch (err) {
    logAccountCenterIssue({
      scope: 'ac-proxy',
      method: req.method,
      path: req.originalUrl,
      baseUrl: AC_URL,
      error: err,
    })
    res.status(502).json({
      code: ACCOUNT_CENTER_UNREACHABLE_CODE,
      message: ACCOUNT_CENTER_UNREACHABLE_MESSAGE,
    })
  }
})

function runArtifactRetentionCleanup(): void {
  try {
    const workspacePurged = purgeExpiredArtifacts()
    const htmlPurged = purgeExpiredHtmlArtifacts()
    if (workspacePurged > 0 || htmlPurged > 0) {
      console.info(`[artifact-retention] purged workspace=${workspacePurged} html=${htmlPurged}`)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`[artifact-retention] cleanup failed: ${message}`)
  }
}

const ARTIFACT_RETENTION_INTERVAL_MS = 6 * 60 * 60 * 1000

app.listen(PORT, '0.0.0.0', () => {
  runArtifactRetentionCleanup()
  setInterval(runArtifactRetentionCleanup, ARTIFACT_RETENTION_INTERVAL_MS)
  console.log(`\n🚀 AIOS server running on http://0.0.0.0:${PORT}`)
  console.log(`   AccountCenter proxy → ${AC_URL}\n`)
  const pptEngine = process.env.PPT_ENGINE === 'builtin' ? 'builtin' : 'minimax_pptx_generator'
  const pptFallback = process.env.PPT_ENGINE_FALLBACK === 'none' ? 'none' : 'builtin'
  const documentEngine = process.env.DOCUMENT_ENGINE === 'builtin' ? 'builtin' : 'minimax_docx'
  const documentFallback = process.env.DOCUMENT_ENGINE_FALLBACK === 'none' ? 'none' : 'builtin'
  console.info(`[document-runtime] defaultEngine=${documentEngine}`)
  console.info(`[document-runtime] fallback=${documentFallback}`)
  console.info(`[document-runtime] env.DOCUMENT_ENGINE=${process.env.DOCUMENT_ENGINE ?? '(not set, defaults to minimax_docx)'}`)
  console.info(`[document-runtime] env.DOCUMENT_ENGINE_FALLBACK=${process.env.DOCUMENT_ENGINE_FALLBACK ?? '(not set, defaults to builtin)'}`)
  console.info(`[ppt-runtime] defaultEngine=${pptEngine}`)
  console.info(`[ppt-runtime] fallback=${pptFallback}`)
  console.info(`[ppt-runtime] env.PPT_ENGINE=${process.env.PPT_ENGINE ?? '(not set, defaults to minimax_pptx_generator)'}`)
  console.info(`[ppt-runtime] env.PPT_ENGINE_FALLBACK=${process.env.PPT_ENGINE_FALLBACK ?? '(not set, defaults to builtin)'}`)
})
