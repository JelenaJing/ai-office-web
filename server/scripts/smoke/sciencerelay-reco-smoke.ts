/**
 * Smoke: Science Relay data source + ranker (no BFF auth / no LLM).
 *
 * Usage (from server/):
 *   npm run smoke:sciencerelay-reco
 */

import path from 'path'

const fixtureDir = path.join(__dirname, '../../dev/test-fixtures/sciencerelay-mini')
process.env.SCIENCERELAY_DATA_DIR = process.env.SCIENCERELAY_DATA_DIR ?? fixtureDir
process.env.SCIENCERELAY_DATA_SOURCE_MODE = 'local'

async function main() {
  let failed = 0
  const { listScienceRelayTopics, listScienceRelayCandidates } = await import(
    '../../src/features/sciencerelay/services/sciencerelayDataSource'
  )
  const { rankScienceRelayArticles } = await import(
    '../../src/features/sciencerelay/services/sciencerelayRanker'
  )

  console.info('[smoke] listScienceRelayTopics')
  try {
    const topics = await listScienceRelayTopics()
    if (topics.length < 1) throw new Error('empty topics')
    console.info('  OK', topics.map((t) => `${t.topic}:${t.count}`).join(', '))
  } catch (e) {
    console.error('  FAIL', e)
    failed++
  }

  console.info('[smoke] listScienceRelayCandidates topic=物理')
  let rows: Awaited<ReturnType<typeof listScienceRelayCandidates>>['rows'] = []
  try {
    const out = await listScienceRelayCandidates({
      topic: '物理',
      limit: 10,
      includeDetails: true,
    })
    if (out.rows.length < 1) throw new Error('empty rows')
    rows = out.rows
    console.info('  OK', rows[0]?.id, rows[0]?.doi)
  } catch (e) {
    console.error('  FAIL', e)
    failed++
  }

  if (rows.length > 0) {
    console.info('[smoke] rankScienceRelayArticles')
    try {
      const ranked = rankScienceRelayArticles(rows, {
        topic: '物理',
        subscriptionQueries: ['perovskite'],
        servedArticleIds: [],
        topK: 3,
        dedupeMode: 'none',
        servedPenaltyStrength: 0.08,
      })
      if (ranked.length < 1 || ranked[0].rankBreakdown === undefined) {
        throw new Error('missing rank output')
      }
      console.info('  OK top', ranked[0].id, ranked[0].rankScore.toFixed(3))
    } catch (e) {
      console.error('  FAIL', e)
      failed++
    }
  }

  if (failed > 0) {
    console.error(`\n${failed} check(s) failed`)
    process.exit(1)
  }
  console.info('\nAll sciencerelay smoke checks passed')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
