import express from 'express'
import cors from 'cors'
import authRouter from './routes/auth'
import skillsRouter from './routes/skills'
import artifactsRouter from './routes/artifacts'

const app = express()
const PORT = Number(process.env.PORT ?? 3001)

// Allow requests from Vite dev server and production web origin
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:4173',
      ...(process.env.WEB_ORIGIN ? [process.env.WEB_ORIGIN] : []),
    ],
  }),
)
app.use(express.json())

app.use('/api/auth', authRouter)
app.use('/api/skills', skillsRouter)
app.use('/api/artifacts', artifactsRouter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

/**
 * Generic AccountCenter proxy — catch-all for any /api/* route not handled
 * above (e.g. /api/contacts, /api/people, /api/org-units, /api/users/:id/bindings).
 *
 * The browser never talks to AccountCenter directly; it always goes through here.
 */
const AC_URL = process.env.ACCOUNT_CENTER_URL ?? 'http://10.20.5.61:13100'

app.use('/api', async (req, res) => {
  const target = `${AC_URL}${req.originalUrl}`
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

    const ct = upstream.headers.get('content-type') ?? ''
    res.status(upstream.status)
    if (ct.includes('application/json')) {
      res.json(await upstream.json())
    } else {
      res.send(await upstream.text())
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[ac-proxy] ${req.method} ${req.originalUrl} →`, msg)
    res.status(502).json({ message: `AccountCenter 代理失败：${msg}` })
  }
})

app.listen(PORT, () => {
  console.log(`\n🚀 AIOS server running on http://localhost:${PORT}`)
  console.log(`   AccountCenter proxy → ${AC_URL}\n`)
})
