import fs from 'fs'
import path from 'path'

export interface HtmlPresentationJobOptions {
  templateSlug?: string
  enableImages: boolean
  maxImages: number
  qualityMode: 'fast' | 'high'
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
  description?: string
  thumbnailUrl?: string
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
  templateFile: string
  rendererMode:
    | 'opencode-template-driven-high'
    | 'opencode-template-driven-fast'
    | 'opencode-template-driven'
    | 'safe-fast-renderer'
    | 'beautiful-template-adapter-fast'
    | 'beautiful-template-adapter-retemplate'
    | 'beautiful-template-adapter-fallback'
    | 'beautiful-template-adapter'
    | 'beautiful-template'
    | 'html-ppt-beautiful-fallback'
    | 'generic-fallback'
  fallbackUsed?: boolean
  fallbackReason?: string
  templateStyleApplied?: 'full' | 'basic' | 'not-applied'
  repairAttempted?: boolean
  repairSucceeded?: boolean
  blankSlideFallbackCount?: number
  availableLayouts: string[]
  colorScheme: string
  density: string
  bestFor: string[]
  avoidFor: string[]
  visualRules: string[]
  warning?: string
  requestedTemplateSlug?: string
  appliedTemplateSlug?: string | null
  templateLocked?: boolean
  templateSourceKind?: 'user-selected' | 'auto-selected' | 'fallback'
  imagePolicy: {
    maxImages: number
    fallback: 'svg-placeholder'
  }
}

export interface TemplateSelectionResult {
  selectedTemplateSlug: string
  candidateTemplateSlugs: string[]
  fallbackUsed: boolean
  templateLocked: boolean
  requestedTemplateSlug?: string
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
const BEAUTIFUL_TEMPLATES_ROOT = '/data/darebug/aios-skills/beautiful-html-templates/templates'
const BEAUTIFUL_TEMPLATES_SCREENSHOTS = '/data/darebug/aios-skills/beautiful-html-templates/screenshots'

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

export function resolveBeautifulTemplateFile(slug: string): string {
  const normalized = slug.trim()
  if (!normalized) return ''
  const candidate = path.join(BEAUTIFUL_TEMPLATES_ROOT, normalized, 'template.html')
  return fs.existsSync(candidate) ? candidate : ''
}

export function resolveBeautifulTemplateDir(slug: string): string {
  const normalized = slug.trim()
  if (!normalized) return ''
  const candidate = path.join(BEAUTIFUL_TEMPLATES_ROOT, normalized)
  return fs.existsSync(candidate) && fs.statSync(candidate).isDirectory() ? candidate : ''
}

export function prepareSelectedBeautifulTemplateForJob(input: {
  jobDir: string
  templateSlug: string
  templateName?: string
}): {
  selectedTemplateDir: string
  selectedTemplateDocPath: string
  templateHtmlPath: string
} {
  const normalizedSlug = input.templateSlug.trim()
  const templateDir = resolveBeautifulTemplateDir(normalizedSlug)
  if (!templateDir) {
    throw new Error(`Unknown beautiful-html-templates slug: ${normalizedSlug}`)
  }

  const selectedTemplateDir = path.join(input.jobDir, 'selected-template')
  fs.mkdirSync(selectedTemplateDir, { recursive: true })

  const referenceFiles = listBeautifulTemplateReferenceFiles(normalizedSlug)
  for (const file of referenceFiles) {
    fs.copyFileSync(file.sourcePath, path.join(selectedTemplateDir, file.relativePath))
  }

  const indexPath = path.join(BEAUTIFUL_TEMPLATES_ROOT, 'index.json')
  if (fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()) {
    fs.copyFileSync(indexPath, path.join(selectedTemplateDir, 'templates-index.json'))
  }

  const templateHtmlPath = path.join(selectedTemplateDir, 'template.html')
  const templateJsonPath = path.join(selectedTemplateDir, 'template.json')
  const designMdPath = path.join(selectedTemplateDir, 'design.md')
  const selectedTemplateDocPath = path.join(input.jobDir, 'SELECTED_TEMPLATE.md')
  const displayName = input.templateName?.trim() || normalizedSlug

  fs.writeFileSync(
    selectedTemplateDocPath,
    [
      '# Selected HTML Slide Template',
      '',
      `- templateSlug: ${normalizedSlug}`,
      `- templateName: ${displayName}`,
      `- template.html: selected-template/template.html`,
      `- template.json: ${fs.existsSync(templateJsonPath) ? 'selected-template/template.json' : '(missing)'}`,
      `- design.md: ${fs.existsSync(designMdPath) ? 'selected-template/design.md' : '(missing)'}`,
      `- templates index: ${fs.existsSync(path.join(selectedTemplateDir, 'templates-index.json')) ? 'selected-template/templates-index.json' : '(missing)'}`,
      '',
      'OpenCode must generate the final deck from selected-template/template.html and design.md.',
      'Do not use a generic renderer or beautifulHtmlTemplateAdapter for initial generation.',
    ].join('\n'),
    'utf-8',
  )

  return {
    selectedTemplateDir,
    selectedTemplateDocPath,
    templateHtmlPath,
  }
}

export function listBeautifulTemplateReferenceFiles(slug: string): Array<{ relativePath: string; sourcePath: string }> {
  const templateDir = resolveBeautifulTemplateDir(slug)
  if (!templateDir) return []
  const files: Array<{ relativePath: string; sourcePath: string }> = []
  const candidates = [
    { relativePath: 'template.html', sourcePath: path.join(templateDir, 'template.html') },
    { relativePath: 'template.json', sourcePath: path.join(templateDir, 'template.json') },
    { relativePath: 'design.md', sourcePath: path.join(templateDir, 'design.md') },
  ]
  for (const item of candidates) {
    if (fs.existsSync(item.sourcePath) && fs.statSync(item.sourcePath).isFile()) files.push(item)
  }
  const agentsPath = path.join(BEAUTIFUL_TEMPLATES_ROOT, 'AGENTS.md')
  if (fs.existsSync(agentsPath) && fs.statSync(agentsPath).isFile()) {
    files.push({ relativePath: 'AGENTS.md', sourcePath: agentsPath })
  }
  return files
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

const DIRECT_TEMPLATE_IMAGE_BASENAMES = [
  'thumbnail',
  'preview',
  'cover',
  'screenshot',
]

const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'webp']

function safeSlug(slug: string): string {
  return slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
}

function resolveExistingTemplateThumbnailPath(slug: string): string {
  const normalized = safeSlug(slug)
  if (!normalized) return ''

  // 1) template dir local image files
  const templateDir = path.join(BEAUTIFUL_TEMPLATES_ROOT, normalized)
  for (const base of DIRECT_TEMPLATE_IMAGE_BASENAMES) {
    for (const ext of IMAGE_EXTS) {
      const p = path.join(templateDir, `${base}.${ext}`)
      if (fs.existsSync(p)) return p
    }
  }

  // 2) screenshots dir (prefer -1 as cover)
  for (const ext of IMAGE_EXTS) {
    const first = path.join(BEAUTIFUL_TEMPLATES_SCREENSHOTS, `${normalized}-1.${ext}`)
    if (fs.existsSync(first)) return first
  }
  for (const ext of IMAGE_EXTS) {
    for (const idx of [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
      const alt = path.join(BEAUTIFUL_TEMPLATES_SCREENSHOTS, `${normalized}-${idx}.${ext}`)
      if (fs.existsSync(alt)) return alt
    }
  }
  return ''
}

export function hasTemplateThumbnail(slug: string): boolean {
  return Boolean(resolveExistingTemplateThumbnailPath(slug))
}

export function getTemplateThumbnailFile(slug: string): { path: string; ext: string } | null {
  const p = resolveExistingTemplateThumbnailPath(slug)
  if (!p) return null
  const ext = path.extname(p).slice(1).toLowerCase()
  if (!IMAGE_EXTS.includes(ext)) return null
  return { path: p, ext }
}

function buildTemplateProfile(
  candidate: CandidateTemplateRecord,
  options: HtmlPresentationJobOptions,
  fallbackUsed: boolean,
  lock?: {
    requestedTemplateSlug?: string
    templateLocked?: boolean
    templateSourceKind?: TemplateProfileRecord['templateSourceKind']
  },
): TemplateProfileRecord {
  const bestFor = candidate.bestFor.length > 0 ? candidate.bestFor : uniqueStrings([...candidate.mood, ...candidate.occasion]).slice(0, 4)
  const avoidFor = candidate.avoidFor.length > 0 ? candidate.avoidFor : ['overcrowded slides', 'mismatched tone']
  const templateFile = fallbackUsed ? '' : resolveBeautifulTemplateFile(candidate.slug)
  const requestedTemplateSlug = lock?.requestedTemplateSlug?.trim() || undefined
  const templateLocked = Boolean(lock?.templateLocked)
  const templateSourceKind = lock?.templateSourceKind
    ?? (templateLocked ? 'user-selected' : (fallbackUsed ? 'fallback' : 'auto-selected'))
  return {
    templateSource: fallbackUsed ? 'html-ppt-beautiful-fallback' : 'beautiful-html-templates',
    templateSlug: candidate.slug,
    templateName: candidate.name,
    templateFile,
    rendererMode: fallbackUsed ? 'html-ppt-beautiful-fallback' : 'beautiful-template',
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
    requestedTemplateSlug,
    appliedTemplateSlug: candidate.slug,
    templateLocked,
    templateSourceKind,
    imagePolicy: {
      maxImages: options.maxImages,
      fallback: 'svg-placeholder',
    },
  }
}

export function findHtmlPresentationTemplateBySlug(slug: string): TemplateIndexEntry | undefined {
  const normalized = slug.trim()
  if (!normalized) return undefined
  try {
    return loadBeautifulTemplateIndex().find((entry) => entry.slug === normalized)
  } catch {
    return undefined
  }
}

export function isKnownHtmlPresentationTemplateSlug(slug: string): boolean {
  const normalized = slug.trim()
  if (!normalized) return false
  if (findHtmlPresentationTemplateBySlug(normalized)) return true
  return FALLBACK_TEMPLATE_LIBRARY.some((entry) => entry.slug === normalized)
}

export function buildCandidateTemplatesSidecar(selection: TemplateSelectionResult): Record<string, unknown> {
  if (selection.templateLocked) {
    const requestedTemplateSlug = selection.requestedTemplateSlug || selection.selectedTemplateSlug
    return {
      locked: true,
      requestedTemplateSlug,
      selectedTemplateSlug: selection.selectedTemplateSlug,
      fallbackUsed: selection.fallbackUsed,
      candidates: selection.candidateTemplates.map((candidate) => ({
        ...candidate,
        slug: candidate.slug,
        name: candidate.name,
        source: 'user-selected',
        selected: candidate.slug === selection.selectedTemplateSlug,
      })),
    }
  }
  return {
    locked: false,
    selectedTemplateSlug: selection.selectedTemplateSlug,
    fallbackUsed: selection.fallbackUsed,
    candidates: selection.candidateTemplates,
  }
}

function resolveLockedTemplateSelection(
  preferredSlug: string,
  prompt: string,
  inputMarkdown: string,
  options: HtmlPresentationJobOptions,
): TemplateSelectionResult {
  const entry = findHtmlPresentationTemplateBySlug(preferredSlug)
  if (entry) {
    const selectedTemplate = buildCandidateRecord(entry, scoreTemplate(entry, prompt, inputMarkdown, preferredSlug))
    return {
      selectedTemplateSlug: entry.slug,
      candidateTemplateSlugs: [entry.slug],
      fallbackUsed: false,
      templateLocked: true,
      requestedTemplateSlug: preferredSlug,
      selectedTemplate,
      candidateTemplates: [selectedTemplate],
      templateProfile: buildTemplateProfile(selectedTemplate, options, false, {
        requestedTemplateSlug: preferredSlug,
        templateLocked: true,
        templateSourceKind: 'user-selected',
      }),
      selectionReason: `user-locked template ${entry.slug}`,
    }
  }

  const fallbackCandidates = buildFallbackCandidates(options, preferredSlug)
  const selectedTemplate = fallbackCandidates.find((candidate) => candidate.slug === preferredSlug)
  if (!selectedTemplate) {
    throw new Error(`Unknown HTML Slides template: ${preferredSlug}`)
  }
  return {
    selectedTemplateSlug: selectedTemplate.slug,
    candidateTemplateSlugs: [selectedTemplate.slug],
    fallbackUsed: true,
    templateLocked: true,
    requestedTemplateSlug: preferredSlug,
    selectedTemplate,
    candidateTemplates: [selectedTemplate],
    templateProfile: buildTemplateProfile(selectedTemplate, options, true, {
      requestedTemplateSlug: preferredSlug,
      templateLocked: true,
      templateSourceKind: 'user-selected',
    }),
    selectionReason: `user-locked fallback template ${selectedTemplate.slug}`,
  }
}

export function resolveTemplateSelection(input: {
  prompt: string
  inputMarkdown: string
  options: HtmlPresentationJobOptions
}): TemplateSelectionResult {
  const preferredSlug = input.options.templateSlug?.trim() || undefined
  if (preferredSlug) {
    return resolveLockedTemplateSelection(preferredSlug, input.prompt, input.inputMarkdown, input.options)
  }

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

    const selectedTemplate = candidates[0]
    return {
      selectedTemplateSlug: selectedTemplate.slug,
      candidateTemplateSlugs: candidates.map((candidate) => candidate.slug),
      fallbackUsed: false,
      templateLocked: false,
      selectedTemplate,
      candidateTemplates: candidates,
      templateProfile: buildTemplateProfile(selectedTemplate, input.options, false, {
        templateSourceKind: 'auto-selected',
      }),
      selectionReason: `auto-selected ${selectedTemplate.slug} from beautiful-html-templates index`,
    }
  } catch {
    const fallbackCandidates = buildFallbackCandidates(input.options, preferredSlug)
    const selectedTemplate = fallbackCandidates[0]
    return {
      selectedTemplateSlug: selectedTemplate.slug,
      candidateTemplateSlugs: fallbackCandidates.map((candidate) => candidate.slug),
      fallbackUsed: true,
      templateLocked: false,
      selectedTemplate,
      candidateTemplates: fallbackCandidates,
      templateProfile: buildTemplateProfile(selectedTemplate, input.options, true, {
        templateSourceKind: 'fallback',
      }),
      selectionReason: `beautiful-html-templates unavailable, using fallback template ${selectedTemplate.slug}`,
    }
  }
}

export function normalizeHtmlPresentationJobOptions(value: unknown): HtmlPresentationJobOptions {
  const input = (value && typeof value === 'object') ? (value as Record<string, unknown>) : {}
  const qualityMode = input.qualityMode === 'high' ? 'high' : 'fast'
  const rawTemplateSlug = typeof input.templateSlug === 'string' && input.templateSlug.trim()
    ? input.templateSlug.trim()
    : typeof input.templateId === 'string' && input.templateId.trim()
      ? input.templateId.trim()
      : typeof input.template === 'string' && input.template.trim()
        ? input.template.trim()
        : undefined
  const templateSlug = rawTemplateSlug
  const enableImages = typeof input.enableImages === 'boolean' ? input.enableImages : qualityMode === 'high'
  const hasRawMaxImages = Object.prototype.hasOwnProperty.call(input, 'maxImages')
  const rawMaxImages = typeof input.maxImages === 'number'
    ? input.maxImages
    : typeof input.maxImages === 'string'
      ? Number.parseInt(input.maxImages, 10)
      : undefined
  const normalizedDefaultMaxImages = qualityMode === 'high' ? 4 : 0
  const maxImages = hasRawMaxImages && Number.isFinite(rawMaxImages)
    ? Math.max(0, Math.min(8, Math.trunc(rawMaxImages as number)))
    : normalizedDefaultMaxImages
  return {
    templateSlug,
    enableImages,
    maxImages: enableImages ? maxImages : 0,
    qualityMode,
  }
}
