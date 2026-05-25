import fs from 'fs'
import path from 'path'

export interface HtmlPresentationJobOptions {
  templateSlug?: string
  enableImages: boolean
  maxImages: number
}

export interface TemplateIndexEntry {
  slug: string
  name: string
  tagline?: string
  mood?: string[]
  occasion?: string[]
  tone?: string[]
  formality?: string
  density?: string
  scheme?: string
  best_for?: string
  avoid_for?: string
  slide_count?: number
}

export interface CandidateTemplateRecord {
  slug: string
  name: string
  tagline: string
  score: number
  mood: string[]
  occasion: string[]
  tone: string[]
  formality: string
  density: string
  scheme: string
  bestFor: string[]
  avoidFor: string[]
}

export interface TemplateProfileRecord {
  templateSource: string
  templateSlug: string
  templateName: string
  availableLayouts: string[]
  colorScheme: string
  density: string
  bestFor: string[]
  avoidFor: string[]
  visualRules: string[]
  imagePolicy: {
    maxImages: number
    fallback: 'svg-placeholder'
  }
}

export interface TemplateSelectionResult {
  selectedTemplateSlug: string
  candidateTemplateSlugs: string[]
  fallbackUsed: boolean
  selectedTemplate: CandidateTemplateRecord
  candidateTemplates: CandidateTemplateRecord[]
  templateProfile: TemplateProfileRecord
  selectionReason: string
}

interface TemplateIndexPayload {
  template_count?: number
  templates?: TemplateIndexEntry[]
}

const BEAUTIFUL_TEMPLATES_INDEX = '/data/darebug/aios-skills/beautiful-html-templates/index.json'

const FALLBACK_TEMPLATE_LIBRARY: CandidateTemplateRecord[] = [
  {
    slug: 'product-keynote-lite',
    name: 'Product Keynote Lite',
    tagline: 'Stable product-keynote fallback for formal web presentation generation.',
    score: 0,
    mood: ['professional', 'modern', 'confident'],
    occasion: ['product launch', 'business presentation', 'enterprise report'],
    tone: ['clean', 'clear', 'modern'],
    formality: 'medium-high',
    density: 'medium',
    scheme: 'light',
    bestFor: ['product launch', 'business review', 'AI platform briefing'],
    avoidFor: ['highly playful or experimental visual asks'],
  },
  {
    slug: 'academic-report-lite',
    name: 'Academic Report Lite',
    tagline: 'Research-report fallback with restrained layout and calm hierarchy.',
    score: 0,
    mood: ['calm', 'academic', 'trustworthy'],
    occasion: ['education', 'research report', 'university presentation'],
    tone: ['restrained', 'clear', 'neutral'],
    formality: 'high',
    density: 'medium',
    scheme: 'light',
    bestFor: ['education', 'research synthesis', 'university review'],
    avoidFor: ['loud brand marketing decks'],
  },
  {
    slug: 'modern-report-lite',
    name: 'Modern Report Lite',
    tagline: 'Balanced fallback for general office decks when no template index is available.',
    score: 0,
    mood: ['modern', 'balanced', 'approachable'],
    occasion: ['internal presentation', 'team update', 'general office deck'],
    tone: ['polished', 'neutral', 'readable'],
    formality: 'medium',
    density: 'medium',
    scheme: 'light',
    bestFor: ['general office presentations', 'internal reporting', 'multi-topic deck'],
    avoidFor: ['dark neon or extreme editorial aesthetics'],
  },
]

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, ' ')
    .split(/[\s-]+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2)
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

function normalizeStringArray(values: string[] | undefined): string[] {
  return Array.isArray(values) ? values.filter((value) => typeof value === 'string').map((value) => value.trim()).filter(Boolean) : []
}

function splitSentenceList(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split(/[.;；。]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function buildCandidateRecord(entry: TemplateIndexEntry, score: number): CandidateTemplateRecord {
  return {
    slug: entry.slug,
    name: entry.name,
    tagline: entry.tagline?.trim() || entry.name,
    score,
    mood: normalizeStringArray(entry.mood),
    occasion: normalizeStringArray(entry.occasion),
    tone: normalizeStringArray(entry.tone),
    formality: entry.formality?.trim() || 'medium',
    density: entry.density?.trim() || 'medium',
    scheme: entry.scheme?.trim() || 'light',
    bestFor: splitSentenceList(entry.best_for),
    avoidFor: splitSentenceList(entry.avoid_for),
  }
}

function buildPromptSignals(prompt: string, inputMarkdown: string): {
  tokens: string[]
  prefersFormal: boolean
  prefersDark: boolean
  prefersLight: boolean
  wantsBusiness: boolean
  wantsAcademic: boolean
} {
  const combined = `${prompt}\n${inputMarkdown}`.toLowerCase()
  const tokens = uniqueStrings(tokenize(combined))
  return {
    tokens,
    prefersFormal: /(正式|汇报|企业|高校|研究|academic|formal|report|board|investor|enterprise)/i.test(combined),
    prefersDark: /(dark|黑|深色|夜间|cyber|terminal|neon)/i.test(combined),
    prefersLight: /(light|浅色|白底|paper|clean|bright)/i.test(combined),
    wantsBusiness: /(产品|发布会|企业|商业|路演|startup|launch|business|enterprise|ai office|aios)/i.test(combined),
    wantsAcademic: /(高校|学校|科研|教育|研究|academic|education|research|university)/i.test(combined),
  }
}

function scoreTemplate(entry: TemplateIndexEntry, prompt: string, inputMarkdown: string, preferredSlug?: string): number {
  const signals = buildPromptSignals(prompt, inputMarkdown)
  const haystack = [
    entry.slug,
    entry.name,
    entry.tagline ?? '',
    ...normalizeStringArray(entry.mood),
    ...normalizeStringArray(entry.occasion),
    ...normalizeStringArray(entry.tone),
    entry.formality ?? '',
    entry.density ?? '',
    entry.scheme ?? '',
    entry.best_for ?? '',
    entry.avoid_for ?? '',
  ]
    .join(' ')
    .toLowerCase()
  let score = 0

  for (const token of signals.tokens) {
    if (haystack.includes(token)) score += token.length >= 5 ? 8 : 4
  }

  if (preferredSlug && entry.slug === preferredSlug) score += 10_000

  if (signals.prefersFormal) {
    if ((entry.formality ?? '').includes('high')) score += 24
    if ((entry.formality ?? '') === 'medium') score += 12
  }
  if (signals.prefersDark) {
    if (entry.scheme === 'dark') score += 18
    if (entry.scheme === 'mixed') score += 8
  }
  if (signals.prefersLight) {
    if (entry.scheme === 'light') score += 18
    if (entry.scheme === 'mixed') score += 8
  }
  if (signals.wantsBusiness) {
    if (['blue-professional', 'signal', 'emerald-editorial', 'raw-grid'].includes(entry.slug)) score += 28
  }
  if (signals.wantsAcademic) {
    if (['vellum', 'cobalt-grid', 'cartesian', 'blue-professional'].includes(entry.slug)) score += 28
  }

  if ((entry.avoid_for ?? '').toLowerCase().includes('traditional') && signals.prefersFormal) {
    score -= 6
  }
  if ((entry.formality ?? '').startsWith('low') && signals.prefersFormal) {
    score -= 12
  }

  return score
}

function buildFallbackCandidates(
  options: HtmlPresentationJobOptions,
  preferredSlug: string | undefined,
): CandidateTemplateRecord[] {
  return FALLBACK_TEMPLATE_LIBRARY.map((entry) => ({
    ...entry,
    score: entry.slug === preferredSlug ? 10_000 : 100 - FALLBACK_TEMPLATE_LIBRARY.findIndex((item) => item.slug === entry.slug),
  }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
}

export function loadBeautifulTemplateIndex(): TemplateIndexEntry[] {
  const payload = JSON.parse(fs.readFileSync(BEAUTIFUL_TEMPLATES_INDEX, 'utf-8')) as TemplateIndexPayload
  return Array.isArray(payload.templates) ? payload.templates.filter((entry) => entry && typeof entry.slug === 'string' && typeof entry.name === 'string') : []
}

export function listAvailableHtmlPresentationTemplates(): CandidateTemplateRecord[] {
  try {
    return loadBeautifulTemplateIndex()
      .map((entry) => buildCandidateRecord(entry, 0))
      .sort((left, right) => left.name.localeCompare(right.name))
  } catch {
    return FALLBACK_TEMPLATE_LIBRARY
  }
}

function buildTemplateProfile(candidate: CandidateTemplateRecord, options: HtmlPresentationJobOptions, fallbackUsed: boolean): TemplateProfileRecord {
  const bestFor = candidate.bestFor.length > 0 ? candidate.bestFor : uniqueStrings([...candidate.mood, ...candidate.occasion]).slice(0, 4)
  const avoidFor = candidate.avoidFor.length > 0 ? candidate.avoidFor : ['overcrowded slides', 'mismatched tone']
  return {
    templateSource: fallbackUsed ? 'html-ppt-beautiful-fallback' : 'beautiful-html-templates',
    templateSlug: candidate.slug,
    templateName: candidate.name,
    availableLayouts: [],
    colorScheme: candidate.scheme,
    density: candidate.density,
    bestFor,
    avoidFor,
    visualRules: uniqueStrings([
      candidate.tagline,
      `tone: ${candidate.tone.join(', ') || 'balanced'}`,
      `mood: ${candidate.mood.join(', ') || 'professional'}`,
      `density: ${candidate.density}`,
    ]).filter(Boolean),
    imagePolicy: {
      maxImages: options.maxImages,
      fallback: 'svg-placeholder',
    },
  }
}

export function resolveTemplateSelection(input: {
  prompt: string
  inputMarkdown: string
  options: HtmlPresentationJobOptions
}): TemplateSelectionResult {
  const preferredSlug = input.options.templateSlug?.trim() || undefined

  try {
    const entries = loadBeautifulTemplateIndex()
    if (entries.length === 0) throw new Error('Template index empty')
    const candidates = entries
      .map((entry) => buildCandidateRecord(entry, scoreTemplate(entry, input.prompt, input.inputMarkdown, preferredSlug)))
      .sort((left, right) => {
        if (right.score !== left.score) return right.score - left.score
        return left.slug.localeCompare(right.slug)
      })
      .slice(0, 3)

    const selectedTemplate = preferredSlug
      ? (candidates.find((candidate) => candidate.slug === preferredSlug) ?? candidates[0])
      : candidates[0]

    return {
      selectedTemplateSlug: selectedTemplate.slug,
      candidateTemplateSlugs: candidates.map((candidate) => candidate.slug),
      fallbackUsed: false,
      selectedTemplate,
      candidateTemplates: candidates,
      templateProfile: buildTemplateProfile(selectedTemplate, input.options, false),
      selectionReason: preferredSlug
        ? `templateSlug override selected ${selectedTemplate.slug}`
        : `auto-selected ${selectedTemplate.slug} from beautiful-html-templates index`,
    }
  } catch {
    const fallbackCandidates = buildFallbackCandidates(input.options, preferredSlug)
    const selectedTemplate = preferredSlug
      ? (fallbackCandidates.find((candidate) => candidate.slug === preferredSlug) ?? fallbackCandidates[0])
      : fallbackCandidates[0]
    return {
      selectedTemplateSlug: selectedTemplate.slug,
      candidateTemplateSlugs: fallbackCandidates.map((candidate) => candidate.slug),
      fallbackUsed: true,
      selectedTemplate,
      candidateTemplates: fallbackCandidates,
      templateProfile: buildTemplateProfile(selectedTemplate, input.options, true),
      selectionReason: preferredSlug
        ? `templateSlug override matched fallback template ${selectedTemplate.slug}`
        : `beautiful-html-templates unavailable, using fallback template ${selectedTemplate.slug}`,
    }
  }
}

export function normalizeHtmlPresentationJobOptions(value: unknown): HtmlPresentationJobOptions {
  const input = (value && typeof value === 'object') ? (value as Record<string, unknown>) : {}
  const templateSlug = typeof input.templateSlug === 'string' && input.templateSlug.trim()
    ? input.templateSlug.trim()
    : undefined
  const enableImages = typeof input.enableImages === 'boolean' ? input.enableImages : true
  const rawMaxImages = typeof input.maxImages === 'number'
    ? input.maxImages
    : typeof input.maxImages === 'string'
      ? Number.parseInt(input.maxImages, 10)
      : 3
  const maxImages = Number.isFinite(rawMaxImages)
    ? Math.max(0, Math.min(6, Math.trunc(rawMaxImages)))
    : 3
  return {
    templateSlug,
    enableImages,
    maxImages: maxImages || 0,
  }
}
