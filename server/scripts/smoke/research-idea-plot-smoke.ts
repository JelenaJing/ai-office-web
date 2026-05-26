/**
 * Smoke: FastAPI health + plot sample (no LLM) + optional idea (needs LLM + network).
 *
 * Usage (from server/):
 *   npm run smoke:research-idea-plot
 *
 * Env:
 *   PAPER_REMAKE_BASE_URL (default http://127.0.0.1:8020)
 *   RESEARCH_SMOKE_SKIP_IDEA=1  — skip idea LLM call
 */

import fs from 'fs'
import path from 'path'

const PAPER_BASE = (process.env.PAPER_REMAKE_BASE_URL ?? 'http://127.0.0.1:8020').replace(/\/$/, '')
const BFF_BASE = (process.env.RESEARCH_SMOKE_BFF_BASE ?? 'http://127.0.0.1:3001').replace(/\/$/, '')
const SKIP_IDEA = process.env.RESEARCH_SMOKE_SKIP_IDEA === '1'

async function postJson<T>(base: string, route: string, body: unknown): Promise<T> {
  const res = await fetch(`${base}${route}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${route} HTTP ${res.status}: ${text}`)
  return JSON.parse(text) as T
}

async function postMultipart<T>(base: string, route: string, form: FormData): Promise<T> {
  const res = await fetch(`${base}${route}`, { method: 'POST', body: form })
  const text = await res.text()
  if (!res.ok) throw new Error(`${route} HTTP ${res.status}: ${text}`)
  return JSON.parse(text) as T
}

async function main() {
  let failed = 0

  console.info('[smoke] FastAPI health')
  const health = await fetch(`${PAPER_BASE}/health`)
  if (!health.ok) {
    console.error('  FAIL health', health.status)
    failed++
  } else {
    console.info('  OK', await health.json())
  }

  console.info('[smoke] Plot v2 (sample CSV, LLM off)')
  const csv = 'wavelength,intensity\n400,0.1\n550,0.9\n700,0.2\n'
  const form = new FormData()
  form.append('file', new Blob([csv], { type: 'text/csv' }), 'sample.csv')
  form.append('use_llm_type_detection', 'false')
  form.append('auto_recommend', 'true')
  try {
    const plot = await postMultipart<{ success: boolean; image?: string }>(
      PAPER_BASE,
      '/api/v1/data/plot/v2',
      form,
    )
    if (!plot.success || !plot.image) {
      console.error('  FAIL plot v2 missing image')
      failed++
    } else {
      console.info('  OK chart image length', plot.image.length)
    }
  } catch (e) {
    console.error('  FAIL', e)
    failed++
  }

  if (!SKIP_IDEA) {
    console.info('[smoke] Idea v2 (short text, needs LLM)')
    try {
      const idea = await postJson<{ success: boolean; ideas?: unknown[] }>(
        PAPER_BASE,
        '/api/v1/remake/idea/v2?strict_errors=true',
        {
          project_id: 'smoke-lab',
          selected_text: 'Perovskite solar cells need better interface passivation.',
          field: 'materials',
        },
      )
      if (!idea.success || !Array.isArray(idea.ideas) || idea.ideas.length === 0) {
        console.error('  FAIL idea v2 empty')
        failed++
      } else {
        console.info('  OK ideas', idea.ideas.length)
      }
    } catch (e) {
      console.error('  FAIL', e)
      failed++
    }
  } else {
    console.info('[smoke] SKIP idea (RESEARCH_SMOKE_SKIP_IDEA=1)')
  }

  console.info('[smoke] BFF parity (optional, needs Express on 3001)')
  try {
    const parity = await fetch(`${BFF_BASE}/api/research/parity`)
    if (parity.ok) {
      console.info('  OK', await parity.json())
    } else {
      console.warn('  WARN parity HTTP', parity.status, '(Express not running?)')
    }
  } catch {
    console.warn('  WARN BFF not reachable')
  }

  if (failed > 0) {
    console.error(`\n${failed} check(s) failed`)
    process.exit(1)
  }
  console.info('\nAll smoke checks passed')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
