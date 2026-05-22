/**
 * openAlexClient.ts — Web server port of electron/main/services/openAlexClient.ts
 *
 * Differences from the Electron version:
 * - Removed `fs`/`path` and AppSettings (no bundled journal file on server)
 * - Topic meta extraction uses invokeLlmText instead of Electron llmClient.completeText
 * - Journal category routing is disabled (no bundled journal DB on server)
 */

import { invokeLlmText } from '../../../modules/ai-gateway'

export interface ReferenceItem {
  id: string
  title: string
  year: number | null
  journal: string
  doi: string
  authors: string[]
  abstract: string
  url: string
}

const OPENALEX_TIMEOUT_MS = 12000
const OPENALEX_MAX_RETRIES = 3
const OPENALEX_MAX_PAGES_PER_ROUTE = 10

interface SearchRouteParams {
  topic: string
  yearFrom?: string
  yearTo?: string
  maxResults: number
  sortBy?: 'relevance' | 'cited_by_count:desc' | 'publication_date:desc'
}

interface SearchTopicMeta {
  searchTopic: string
  persons: string[]
}

function extractFetchReason(error: unknown): string {
  if (error instanceof Error) {
    const cause = (error as Error & { cause?: unknown }).cause
    if (cause instanceof Error && cause.message) return cause.message
    return error.message
  }
  return String(error)
}

function decodeHtmlEntities(input: string): string {
  return String(input || '')
    .replace(/&#(\d+);/g, (_m, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_m, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'").replace(/&amp;/gi, '&')
}

function stripReferenceMarkup(input: string): string {
  return decodeHtmlEntities(String(input || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
}

function reconstructAbstract(index?: Record<string, number[]>): string {
  if (!index) return ''
  const words: string[] = []
  for (const [token, positions] of Object.entries(index)) {
    for (const pos of positions) words[pos] = token
  }
  return words.filter(Boolean).join(' ')
}

function buildFilters(yearFrom?: string, yearTo?: string): string {
  const filters: string[] = []
  if (yearFrom) filters.push(`from_publication_date:${yearFrom}-01-01`)
  if (yearTo) filters.push(`to_publication_date:${yearTo}-12-31`)
  return filters.join(',')
}

function makeReferenceKey(ref: ReferenceItem): string {
  return `${String(ref.doi || '').trim().toLowerCase()}|${String(ref.title || '').trim().toLowerCase()}`
}

function mergeUniqueReferences(...groups: ReferenceItem[][]): ReferenceItem[] {
  const seen = new Set<string>()
  const merged: ReferenceItem[] = []
  for (const group of groups) {
    for (const item of group) {
      const key = makeReferenceKey(item)
      if (seen.has(key)) continue
      seen.add(key)
      merged.push(item)
    }
  }
  return merged
}

function isReferenceStructurallyValid(ref: ReferenceItem): boolean {
  return Boolean(
    String(ref.title || '').trim()
    && String(ref.journal || '').trim()
    && Array.isArray(ref.authors)
    && ref.authors.some((a) => String(a || '').trim())
    && Number.isFinite(ref.year ?? NaN),
  )
}

function isRetryableNetworkError(error: unknown): boolean {
  const msg = extractFetchReason(error).toLowerCase()
  return msg.includes('timeout') || msg.includes('timed out') || msg.includes('econnreset') || msg.includes('socket hang up')
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchOpenAlex(url: URL): Promise<Response> {
  let lastError: unknown
  for (let attempt = 1; attempt <= OPENALEX_MAX_RETRIES; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(new Error(`Connect Timeout (${OPENALEX_TIMEOUT_MS}ms)`)), OPENALEX_TIMEOUT_MS)
    try {
      return await fetch(url, {
        headers: { 'user-agent': 'AI-Office-3.0/1.0' },
        signal: controller.signal,
      })
    } catch (error) {
      lastError = error
      if (attempt >= OPENALEX_MAX_RETRIES || !isRetryableNetworkError(error)) break
      await sleep(600 * attempt)
    } finally {
      clearTimeout(timer)
    }
  }
  throw new Error(`OpenAlex 请求失败: ${extractFetchReason(lastError)}`)
}

function mapOpenAlexResult(item: Record<string, any>): ReferenceItem {
  return {
    id: item.id ?? '',
    title: decodeHtmlEntities(item.title ?? 'Untitled'),
    year: item.publication_year ?? null,
    journal: decodeHtmlEntities(item.primary_location?.source?.display_name ?? ''),
    doi: item.doi ?? '',
    authors: (item.authorships ?? []).map((a: Record<string, any>) => decodeHtmlEntities(a.author?.display_name ?? '')),
    abstract: decodeHtmlEntities(reconstructAbstract(item.abstract_inverted_index)),
    url: item.primary_location?.landing_page_url ?? item.id ?? '',
  }
}

async function searchReferencesByRoute(params: SearchRouteParams): Promise<ReferenceItem[]> {
  const requestedTotal = Math.max(1, Math.min(200, Math.round(params.maxResults || 8)))
  const perPage = Math.min(100, requestedTotal)
  const filter = buildFilters(params.yearFrom, params.yearTo)
  const collected: ReferenceItem[] = []
  const seen = new Set<string>()

  for (let page = 1; collected.length < requestedTotal && page <= OPENALEX_MAX_PAGES_PER_ROUTE; page++) {
    const url = new URL('https://api.openalex.org/works')
    url.searchParams.set('search', params.topic.trim())
    url.searchParams.set('page', String(page))
    url.searchParams.set('per-page', String(Math.min(perPage, requestedTotal - collected.length)))
    if (params.sortBy && params.sortBy !== 'relevance') url.searchParams.set('sort', params.sortBy)
    if (filter) url.searchParams.set('filter', filter)

    const resp = await fetchOpenAlex(url)
    if (!resp.ok) break

    const data = (await resp.json()) as Record<string, any>
    const results = Array.isArray(data.results) ? data.results : []
    if (results.length === 0) break

    for (const item of results) {
      const mapped = mapOpenAlexResult(item)
      const key = makeReferenceKey(mapped)
      if (seen.has(key)) continue
      seen.add(key)
      collected.push(mapped)
      if (collected.length >= requestedTotal) break
    }

    if (results.length < perPage) break
  }

  return collected
}

async function extractSearchTopicMeta(topic: string): Promise<SearchTopicMeta> {
  const trimmed = String(topic || '').trim()
  if (!trimmed) return { searchTopic: trimmed, persons: [] }
  try {
    const response = await invokeLlmText(
      [
        { role: 'system', content: 'You analyze academic topics for OpenAlex retrieval. Output valid JSON only.' },
        {
          role: 'user', content: `Extract an English OpenAlex search phrase (1-6 words) and list of person names from this topic.
Output strict JSON: {"topic": "english phrase", "persons": []}
Topic: ${trimmed}`,
        },
      ],
      { temperature: 0.1, maxTokens: 120 },
    )
    const match = response.match(/\{[\s\S]*\}/)
    if (match) {
      const parsed = JSON.parse(match[0]) as { topic?: string; persons?: unknown[] }
      return {
        searchTopic: String(parsed.topic || '').trim() || trimmed,
        persons: Array.isArray(parsed.persons) ? parsed.persons.map((p) => String(p || '').trim()).filter(Boolean) : [],
      }
    }
  } catch {
    // ignore — fall through to original topic
  }
  return { searchTopic: trimmed, persons: [] }
}

export async function searchReferences(params: {
  topic: string
  yearFrom?: string
  yearTo?: string
  maxResults?: number
}): Promise<ReferenceItem[]> {
  return searchReferencesByRoute({
    topic: params.topic,
    yearFrom: params.yearFrom,
    yearTo: params.yearTo,
    maxResults: params.maxResults ?? 8,
    sortBy: 'relevance',
  })
}

export async function searchReferencesWithNftcoreStrategy(params: {
  topic: string
  yearFrom?: string
  yearTo?: string
  maxResults?: number
}): Promise<ReferenceItem[]> {
  const requestedTotal = Math.max(1, Math.min(200, Math.round(params.maxResults ?? 12)))
  try {
    const meta = await extractSearchTopicMeta(params.topic)
    const searchTopic = [meta.searchTopic, ...meta.persons].filter(Boolean).join(' ')

    const [qualityPapers, recentPapers] = await Promise.all([
      searchReferencesByRoute({ topic: searchTopic || params.topic, yearFrom: params.yearFrom, yearTo: params.yearTo, maxResults: requestedTotal, sortBy: 'cited_by_count:desc' }),
      searchReferencesByRoute({ topic: searchTopic || params.topic, yearFrom: params.yearFrom, yearTo: params.yearTo, maxResults: requestedTotal, sortBy: 'publication_date:desc' }),
    ])

    const structured = mergeUniqueReferences(
      qualityPapers.filter(isReferenceStructurallyValid),
      recentPapers.filter(isReferenceStructurallyValid),
    )
    if (structured.length >= requestedTotal) return structured.slice(0, requestedTotal)

    const fallback = await searchReferences({ topic: params.topic, yearFrom: params.yearFrom, yearTo: params.yearTo, maxResults: requestedTotal })
    return mergeUniqueReferences(structured, fallback).slice(0, requestedTotal)
  } catch {
    return searchReferences(params)
  }
}

export function formatReferenceList(references: ReferenceItem[]): string {
  return references
    .map((item, index) => {
      const authors = stripReferenceMarkup(item.authors.slice(0, 4).join(', ') || 'Unknown Authors')
      const year = String(item.year ?? 'n.d.')
      const title = stripReferenceMarkup(item.title)
      const journal = item.journal ? ` ${stripReferenceMarkup(item.journal)}.` : ''
      const doi = item.doi ? ` DOI: ${stripReferenceMarkup(item.doi)}` : ''
      return `[${index + 1}] ${authors} (${year}). ${title}.${journal}${doi}`.replace(/\s+/g, ' ').trim()
    })
    .join('\n\n')
}
