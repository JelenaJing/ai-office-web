import fs from 'fs'
import {
  escapeAttribute,
  escapeHtml,
  renderManagedImageMarkup,
  type ContentModelBlock,
  type ContentModelRecord,
  type ContentModelSlide,
} from './htmlPresentationPostProcess'
import { resolveBeautifulTemplateFile } from './htmlPresentationTemplates'
import { validateRenderedSlides } from './htmlPresentationSlideValidation'

export type BeautifulSlideShellRole =
  | 'cover'
  | 'section'
  | 'content'
  | 'image'
  | 'timeline'
  | 'closing'
  | 'default'

export interface BeautifulSlideShell {
  index: number
  role: BeautifulSlideShellRole
  html: string
  className: string
  tagName: 'div' | 'section'
  selectors: {
    title?: string
    subtitle?: string
    body?: string
    bullets?: string
    image?: string
  }
}

export interface BeautifulHtmlTemplateDefinition {
  slug: string
  rootDir: string
  templateHtmlPath: string
  slideShells: BeautifulSlideShell[]
  prefixHtml: string
  suffixHtml: string
  bodyClass?: string
}

export interface BeautifulTemplateAdapterRenderResult {
  ok: boolean
  html?: string
  rendererMode: 'beautiful-template-adapter' | 'beautiful-template'
  fallbackReason?: string
  slideShellCount?: number
  renderedSlideCount?: number
}

const DEMO_TEXT_PATTERNS = [
  /\bSlide\s+\d+\b/gi,
  /\bIdentify the required skill name\b/gi,
  /\bQUARTERLY\s+STRATEGY\s+SESSION\b/gi,
  /\bREDEFINING THE BOUNDARIES\b/gi,
  /\bEditorial Deck\b/gi,
  /\bAlexandra Chen\b/gi,
  /\bChief Strategy Officer\b/gi,
  /\bVENTURE\b/g,
  /\b7TH FLOOR\b/g,
]

const TITLE_CLASS_HINTS = [
  'main-title',
  'hero-title',
  'big-statement',
  'slide-title',
  'col-title',
  'close-big',
  'red-quote',
  'quote-text',
  'display',
  'rm-title',
  'card-title',
  't-phase',
  'step-title',
  'fin-title',
  'summary-header',
]

const SUBTITLE_CLASS_HINTS = [
  'subtitle',
  'slide-subtitle',
  'hero-meta',
  'section-label',
  'body-text',
  'red-cite',
  'quote-author',
  'rm-body',
  'step-desc',
  'meta-value',
  'tag-body',
]

const BODY_CLASS_HINTS = [
  'body-text',
  'item-text',
  'card-text',
  't-desc',
  'rm-body',
  'quote-role',
  'col-text',
  'summary-col',
]

function findElementCloseIndex(html: string, openIndex: number, tagName: string): number {
  const tokenPattern = new RegExp(`</?${tagName}\\b[^>]*>`, 'gi')
  tokenPattern.lastIndex = openIndex
  let depth = 0
  let tokenMatch: RegExpExecArray | null
  while ((tokenMatch = tokenPattern.exec(html))) {
    if (new RegExp(`^<${tagName}\\b`, 'i').test(tokenMatch[0])) depth += 1
    else depth -= 1
    if (depth === 0) return tokenMatch.index + tokenMatch[0].length
  }
  return -1
}

function isSlideRootClass(className: string): boolean {
  const tokens = className.toLowerCase().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return false
  if (tokens.some((token) => token === 'slides' || token === 'slide-counter' || token === 'slides-container')) {
    return false
  }
  if (!tokens.includes('slide')) return false
  return tokens.some((token) => (
    /^slide-\d+$/.test(token)
    || /^slide--[a-z0-9-]+$/.test(token)
    || /^slide-[a-z][a-z0-9-]*$/.test(token)
  ))
}

function inferShellRole(className: string, shellHtml: string): BeautifulSlideShellRole {
  const c = className.toLowerCase()
  const h = shellHtml.toLowerCase()
  if (/\bslide--cover\b|\blayout-cover\b|\bslide-hero\b|\bslide-1\b/.test(c)) return 'cover'
  if (/\bslide--end\b|\bslide-close\b|\bslide-10\b|\bclosing\b/.test(c) || /\bclose-big\b/.test(h)) return 'closing'
  if (/\bslide--chapter\b|\bslide-red\b|\blayout-quote\b|\bquote-text\b/.test(c) || /\bquote-text\b/.test(h)) return 'section'
  if (/\btimeline\b|\broadmap\b|\bslide-8\b|\bvtimeline\b|\bslide-roadmap\b/.test(c)) return 'timeline'
  if (/\bslide--split\b|\bslide--chart\b|\bslide-4\b|\bchart-container\b/.test(c) || /<canvas\b/i.test(shellHtml)) return 'image'
  return 'content'
}

function formatTitleHtml(text: string): string {
  const escaped = escapeHtml(text.trim())
  if (!escaped) return ''
  return escaped.replace(/\n/g, '<br>')
}

function joinText(items: string[], fallback = ''): string {
  const value = items.map((item) => item.trim()).filter(Boolean).join(' ')
  return value || fallback
}

function bodyTexts(slide: ContentModelSlide): string[] {
  return slide.blocks
    .filter((block) => block.type === 'text' && !['title', 'subtitle'].includes(block.role))
    .map((block) => block.text)
    .filter(Boolean)
}

function visualBlock(slide: ContentModelSlide): ContentModelBlock | undefined {
  return slide.blocks.find((block) => block.type === 'image')
}

function replaceTagInnerByClass(html: string, tagName: string, classHint: string, innerHtml: string): string {
  if (!innerHtml.trim()) return html
  const pattern = new RegExp(
    `<${tagName}\\b([^>]*class=(["'])[^"']*\\b${classHint}\\b[^"']*\\2[^>]*)>([\\s\\S]*?)<\\/${tagName}>`,
    'i',
  )
  let replaced = false
  const next = html.replace(pattern, (match, attrs) => {
    if (replaced) return match
    replaced = true
    return `<${tagName}${attrs}>${innerHtml}</${tagName}>`
  })
  return replaced ? next : html
}

function replaceFirstTagInner(html: string, tagName: string, innerHtml: string): string {
  if (!innerHtml.trim()) return html
  const pattern = new RegExp(`<${tagName}\\b([^>]*)>([\\s\\S]*?)<\\/${tagName}>`, 'i')
  let replaced = false
  return html.replace(pattern, (match, attrs, _content) => {
    if (replaced) return match
    replaced = true
    return `<${tagName}${attrs}>${innerHtml}</${tagName}>`
  })
}

function replaceListItems(html: string, items: string[], blockIdPrefix: string): string {
  if (items.length === 0) return html
  let itemIndex = 0
  return html.replace(/<li\b([^>]*)>([\s\S]*?)<\/li>/gi, (match, attrs) => {
    if (itemIndex >= items.length) return match
    const blockId = `${blockIdPrefix}-li-${itemIndex + 1}`
    const text = escapeHtml(items[itemIndex])
    itemIndex += 1
    const nextAttrs = /\bdata-block-id=/.test(attrs)
      ? attrs
      : `${attrs} data-block-id="${blockId}" data-block-type="text" data-block-role="body"`
    return `<li${nextAttrs}>${text}</li>`
  })
}

function replaceItemBlocks(html: string, items: string[], slideId: string): string {
  if (items.length === 0) return html
  let itemIndex = 0
  return html.replace(
    /<div class="item">\s*<div class="item-label">([\s\S]*?)<\/div>\s*<div class="item-text">([\s\S]*?)<\/div>\s*<\/div>/gi,
    (match) => {
      if (itemIndex >= items.length) return match
      const label = items[itemIndex]
      itemIndex += 1
      const parts = label.split(/[：:]\s*/, 2)
      const itemLabel = parts.length > 1 ? parts[0] : `Point ${itemIndex}`
      const itemText = parts.length > 1 ? parts[1] : label
      return `<div class="item"><div class="item-label" data-block-id="${slideId}-item-label-${itemIndex}" data-block-type="text" data-block-role="body">${escapeHtml(itemLabel)}</div><div class="item-text" data-block-id="${slideId}-item-text-${itemIndex}" data-block-type="text" data-block-role="body">${escapeHtml(itemText)}</div></div>`
    },
  )
}

function replaceColumnCards(html: string, items: string[], slideId: string): string {
  if (items.length === 0) return html
  let itemIndex = 0
  return html.replace(
    /<div class="column-card">\s*<div class="card-icon">[\s\S]*?<\/div>\s*<div class="card-title">([\s\S]*?)<\/div>\s*<div class="card-text">([\s\S]*?)<\/div>[\s\S]*?<\/div>/gi,
    (match) => {
      if (itemIndex >= items.length) return match
      const text = items[itemIndex]
      itemIndex += 1
      const title = text.slice(0, 48)
      const body = text
      return `<div class="column-card"><div class="card-icon">${String.fromCharCode(64 + itemIndex)}</div><div class="card-title" data-block-id="${slideId}-card-title-${itemIndex}" data-block-type="text" data-block-role="body">${escapeHtml(title)}</div><div class="card-text" data-block-id="${slideId}-card-text-${itemIndex}" data-block-type="text" data-block-role="body">${escapeHtml(body)}</div><div class="card-stat"></div></div>`
    },
  )
}

function replaceTimelinePoints(html: string, items: string[], slideId: string): string {
  if (items.length === 0) return html
  let itemIndex = 0
  return html.replace(
    /<div class="t-point">([\s\S]*?)<\/div>\s*(?=<div class="t-point">|<\/div>\s*<\/div>\s*<\/div>|$)/gi,
    (match) => {
      if (itemIndex >= items.length) return match
      const text = items[itemIndex]
      itemIndex += 1
      const phase = text.slice(0, 40)
      const desc = text
      return `<div class="t-point"><div class="t-bubble">${String(itemIndex).padStart(2, '0')}</div><div class="t-info"><div class="t-phase" data-block-id="${slideId}-phase-${itemIndex}" data-block-type="text" data-block-role="body">${escapeHtml(phase)}</div><div class="t-desc" data-block-id="${slideId}-phase-desc-${itemIndex}" data-block-type="text" data-block-role="body">${escapeHtml(desc)}</div></div></div>`
    },
  )
}

function setSlideRootAttributes(html: string, slide: ContentModelSlide, index: number, total: number): string {
  const active = index === 0
  let next = html.replace(
    /<(div|section)\b([^>]*class=(["'])[^"']*\bslide\b[^"']*\3[^>]*)>/i,
    (match, tag, attrs) => {
      let updated = attrs
        .replace(/\sdata-slide-id=(["'])[^"']*\1/gi, '')
        .replace(/\sdata-index=(["'])[^"']*\1/gi, '')
        .replace(/\sdata-aios-has-visual=(["'])[^"']*\1/gi, '')
        .replace(/\sdata-aios-visual-placement=(["'])[^"']*\1/gi, '')
      updated = `${updated} data-slide-id="${escapeAttribute(slide.id)}" data-index="${index}" data-aios-has-visual="${visualBlock(slide) ? 'true' : 'false'}" data-aios-visual-placement="${escapeAttribute(slide.visual?.placement ?? visualBlock(slide)?.placement ?? 'right')}"`
      updated = updated.replace(/\sclass=(["'])([^"']*)\1/i, (_classMatch: string, quote: string, classValue: string) => {
        const withoutActive = classValue.replace(/\b(?:is-)?active\b/g, '').replace(/\s+/g, ' ').trim()
        const withActive = active ? `${withoutActive} active`.trim() : withoutActive
        return ` class=${quote}${withActive}${quote}`
      })
      return `<${tag}${updated}>`
    },
  )
  return next
}

function fillTitleRegions(html: string, slide: ContentModelSlide, shell: BeautifulSlideShell): string {
  const title = slide.title?.trim()
  if (!title) return html
  const titleHtml = formatTitleHtml(title)
  const textBlocks = slide.blocks.filter((block) => block.type === 'text')
  const titleBlockId = textBlocks.find((block) => block.role === 'title')?.id ?? `${slide.id}-title`

  if (/\bslide-hero\b/i.test(shell.className) || /\bhero-title-group\b/i.test(shell.html)) {
    const words = title.split(/\s+/).filter(Boolean)
    let heroIndex = 0
    return html.replace(/<div class="hero-title(?:\s+[^"]*)?">[\s\S]*?<\/div>/gi, (match) => {
      const word = words[heroIndex] ?? (heroIndex === 0 ? title : '')
      heroIndex += 1
      const classMatch = match.match(/class=(["'])([^"']*)\1/i)
      const className = classMatch?.[2] ?? 'hero-title'
      return `<div class="${className}" data-block-id="${titleBlockId}" data-block-type="text" data-block-role="title">${escapeHtml(word)}</div>`
    })
  }

  let next = html
  for (const hint of TITLE_CLASS_HINTS) {
    const replaced = replaceTagInnerByClass(next, 'div', hint, titleHtml)
    if (replaced !== next) return replaced
    next = replaced
  }
  next = replaceFirstTagInner(next, 'h1', titleHtml)
  if (!/<h1\b/i.test(next)) {
    next = replaceFirstTagInner(next, 'h2', titleHtml)
  }
  if (!/data-block-id=/.test(next.split('</')[0] || '')) {
    next = next.replace(
      /<(h1|h2)\b([^>]*)>([\s\S]*?)<\/\1>/i,
      `<$1$2 data-block-id="${titleBlockId}" data-block-type="text" data-block-role="title">${titleHtml}</$1>`,
    )
  }
  return next
}

function fillSubtitleRegions(html: string, slide: ContentModelSlide): string {
  const subtitle = slide.subtitle?.trim() || joinText(bodyTexts(slide).slice(0, 1))
  if (!subtitle) return html
  const subtitleHtml = escapeHtml(subtitle)
  const textBlocks = slide.blocks.filter((block) => block.type === 'text')
  const subtitleBlockId = textBlocks.find((block) => block.role === 'subtitle')?.id ?? `${slide.id}-subtitle`

  let next = html
  for (const hint of SUBTITLE_CLASS_HINTS) {
    const replaced = replaceTagInnerByClass(next, 'div', hint, subtitleHtml)
    if (replaced !== next) {
      next = replaced
      break
    }
    next = replaceTagInnerByClass(next, 'p', hint, subtitleHtml)
  }
  return next.replace(
    /<p class="subtitle"([^>]*)>[\s\S]*?<\/p>/i,
    `<p class="subtitle"$1 data-block-id="${subtitleBlockId}" data-block-type="text" data-block-role="subtitle">${subtitleHtml}</p>`,
  )
}

function fillBodyAndBullets(html: string, slide: ContentModelSlide): string {
  const bullets = (slide.bullets.length > 0 ? slide.bullets : bodyTexts(slide)).map((item) => item.trim()).filter(Boolean)
  let next = html
  if (bullets.length > 0) {
    next = replaceItemBlocks(next, bullets, slide.id)
    next = replaceColumnCards(next, bullets, slide.id)
    next = replaceTimelinePoints(next, bullets, slide.id)
    next = replaceListItems(next, bullets.slice(0, 8), slide.id)
  }

  const paragraphs = bodyTexts(slide).slice(0, 3)
  if (paragraphs.length > 0) {
    let paragraphIndex = 0
    for (const hint of BODY_CLASS_HINTS) {
      next = next.replace(
        new RegExp(`<([a-z]+)\\b([^>]*class=(["'])[^"']*\\b${hint}\\b[^"']*\\3[^>]*)>[\\s\\S]*?<\\/\\1>`, 'i'),
        (match, tag, attrs) => {
          if (paragraphIndex >= paragraphs.length) return match
          const text = escapeHtml(paragraphs[paragraphIndex])
          paragraphIndex += 1
          return `<${tag}${attrs} data-block-id="${slide.id}-body-${paragraphIndex}" data-block-type="text" data-block-role="body">${text}</${tag}>`
        },
      )
    }
  }
  return next
}

function injectVisualIntoShell(html: string, slide: ContentModelSlide, artifactId: string): string {
  const block = visualBlock(slide)
  if (!block) return html
  const markup = renderManagedImageMarkup({ block, slide, artifactId })
  if (!markup.trim()) return html

  if (/<img\b/i.test(html)) {
    let replaced = false
    return html.replace(/<img\b([^>]*)>/i, (match, attrs) => {
      if (replaced) return match
      replaced = true
      const srcMatch = markup.match(/\ssrc=(["'])([^"']+)\1/i)
      if (!srcMatch) return match
      const blockAttrs = ` data-block-id="${escapeAttribute(block.id)}" data-block-type="image" data-block-role="visual"`
      const cleaned = attrs.replace(/\ssrc=(["'])[^"']*\1/i, '').replace(/\sdata-block-id=(["'])[^"']*\1/i, '')
      return `<img${cleaned}${blockAttrs} src=${srcMatch[1]}${srcMatch[2]}${srcMatch[1]} style="width:100%;height:100%;object-fit:cover;display:block;">`
    })
  }

  const nativeHosts = [
    'chart-container',
    'right-col',
    'split-right',
    'visual-panel',
    'hero-tagline',
    'photo-frame',
    'media-slot',
    'slide-content',
  ]
  for (const hostClass of nativeHosts) {
    if (!new RegExp(`class=(["'])[^"']*\\b${hostClass}\\b`, 'i').test(html)) continue
    const hostPattern = new RegExp(
      `(<div\\b[^>]*class=(["'])[^"']*\\b${hostClass}\\b[^"']*\\2[^>]*>)([\\s\\S]*?)(<\\/div>)`,
      'i',
    )
    if (hostPattern.test(html)) {
      return html.replace(hostPattern, `$1<div class="aios-template-native-visual" style="position:relative;overflow:hidden;min-height:180px;">${markup}</div>$4`)
    }
  }

  const slideClosePattern = /(<\/(?:div|section)>)\s*$/i
  if (slideClosePattern.test(html)) {
    return html.replace(slideClosePattern, `<div class="aios-template-native-visual" style="position:relative;overflow:hidden;margin-top:1rem;min-height:200px;">${markup}</div>$1`)
  }
  return `${html}\n${markup}`
}

function stripResidualDemoText(html: string): string {
  let next = html
  next = next.replace(/<!--[\s\S]*?-->/g, '')
  for (const pattern of DEMO_TEXT_PATTERNS) {
    next = next.replace(pattern, '')
  }
  return next
}

export function extractSlideShellsFromTemplate(templateHtml: string): BeautifulSlideShell[] {
  const slidePattern = /<(?:div|section)\b[^>]*class=(["'])([^"']*\bslide\b[^"']*)\1[^>]*>/gi
  const starts: Array<{ index: number; tagName: 'div' | 'section'; className: string }> = []
  let match: RegExpExecArray | null
  while ((match = slidePattern.exec(templateHtml))) {
    const className = match[2].trim()
    if (!isSlideRootClass(className)) continue
    const tagName = /^<section\b/i.test(match[0]) ? 'section' : 'div'
    if (typeof match.index === 'number') starts.push({ index: match.index, tagName, className })
  }

  return starts.map((entry, index) => {
    const end = findElementCloseIndex(templateHtml, entry.index, entry.tagName)
    const shellHtml = end > entry.index ? templateHtml.slice(entry.index, end) : ''
    const role = inferShellRole(entry.className, shellHtml)
    return {
      index,
      role,
      html: shellHtml,
      className: entry.className,
      tagName: entry.tagName,
      selectors: {
        title: TITLE_CLASS_HINTS.find((hint) => new RegExp(`\\b${hint}\\b`).test(shellHtml)) ?? 'h1',
        subtitle: SUBTITLE_CLASS_HINTS.find((hint) => new RegExp(`\\b${hint}\\b`).test(shellHtml)),
        bullets: /\.item-label\b/.test(shellHtml) ? '.item' : 'ul li',
        image: /<img\b/i.test(shellHtml) ? 'img' : undefined,
      },
    }
  }).filter((shell) => shell.html.trim().length > 0)
}

export function loadBeautifulHtmlTemplateDefinition(slug: string): BeautifulHtmlTemplateDefinition | null {
  const templateHtmlPath = resolveBeautifulTemplateFile(slug)
  if (!templateHtmlPath) return null
  const templateHtml = fs.readFileSync(templateHtmlPath, 'utf-8')
  const slideShells = extractSlideShellsFromTemplate(templateHtml)
  if (slideShells.length === 0) return null
  const firstStart = templateHtml.indexOf(slideShells[0].html)
  const lastShell = slideShells[slideShells.length - 1]
  const lastEnd = firstStart >= 0
    ? templateHtml.indexOf(lastShell.html, firstStart) + lastShell.html.length
    : -1
  if (firstStart < 0 || lastEnd < 0) return null
  const bodyClass = templateHtml.match(/<body\b[^>]*class=(["'])([^"']+)\1/i)?.[2]
  return {
    slug,
    rootDir: pathDirname(templateHtmlPath),
    templateHtmlPath,
    slideShells,
    prefixHtml: templateHtml.slice(0, firstStart),
    suffixHtml: templateHtml.slice(lastEnd),
    bodyClass,
  }
}

function pathDirname(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/')
  const index = normalized.lastIndexOf('/')
  return index >= 0 ? normalized.slice(0, index) : ''
}

export function pickSlideShell(
  shells: BeautifulSlideShell[],
  slide: ContentModelSlide,
  index: number,
  total: number,
): BeautifulSlideShell {
  const role = slide.role ?? 'content'
  const roleMatches = shells.filter((shell) => shell.role === role)
  if (roleMatches.length > 0) return roleMatches[index % roleMatches.length]
  if (index === 0) {
    const cover = shells.find((shell) => shell.role === 'cover')
    if (cover) return cover
  }
  if (index === total - 1) {
    const closing = shells.find((shell) => shell.role === 'closing')
    if (closing) return closing
  }
  if (visualBlock(slide)) {
    const imageShell = shells.find((shell) => shell.role === 'image')
    if (imageShell) return imageShell
  }
  return shells[index % shells.length]
}

export function fillBeautifulTemplateShell(
  shell: BeautifulSlideShell,
  slide: ContentModelSlide,
  context: { index: number; total: number; artifactId: string },
): string {
  let html = shell.html
  html = setSlideRootAttributes(html, slide, context.index, context.total)
  html = fillTitleRegions(html, slide, shell)
  html = fillSubtitleRegions(html, slide)
  html = fillBodyAndBullets(html, slide)
  html = injectVisualIntoShell(html, slide, context.artifactId)
  html = stripResidualDemoText(html)
  return html
}

export function renderBeautifulHtmlWithTemplateAdapter(input: {
  templateSlug: string
  templateFile?: string
  contentModel: ContentModelRecord
  artifactId: string
}): BeautifulTemplateAdapterRenderResult {
  const templateFile = input.templateFile || resolveBeautifulTemplateFile(input.templateSlug)
  if (!templateFile) {
    return { ok: false, rendererMode: 'beautiful-template', fallbackReason: 'template-file-missing' }
  }

  const definition = loadBeautifulHtmlTemplateDefinition(input.templateSlug)
  if (!definition || definition.slideShells.length === 0) {
    return { ok: false, rendererMode: 'beautiful-template', fallbackReason: 'slide-shell-parse-failed' }
  }

  const slides = input.contentModel.slides
  if (slides.length === 0) {
    return { ok: false, rendererMode: 'beautiful-template', fallbackReason: 'content-model-empty' }
  }

  const renderedSlides = slides.map((slide, index) => {
    const shell = pickSlideShell(definition.slideShells, slide, index, slides.length)
    return fillBeautifulTemplateShell(shell, slide, {
      index,
      total: slides.length,
      artifactId: input.artifactId,
    })
  })

  let html = `${definition.prefixHtml}\n${renderedSlides.join('\n')}\n${definition.suffixHtml}`
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(input.contentModel.title || 'HTML PPT')}</title>`)

  const validation = validateRenderedSlides(html)
  if (!validation.ok) {
    return {
      ok: false,
      rendererMode: 'beautiful-template',
      fallbackReason: `adapter-produced-blank-slides:${validation.blankSlideCount}`,
      slideShellCount: definition.slideShells.length,
      renderedSlideCount: renderedSlides.length,
    }
  }

  return {
    ok: true,
    html,
    rendererMode: 'beautiful-template-adapter',
    slideShellCount: definition.slideShells.length,
    renderedSlideCount: renderedSlides.length,
  }
}
