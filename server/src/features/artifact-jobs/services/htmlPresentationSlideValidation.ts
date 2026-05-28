const DEMO_TEXT_PATTERNS = [
  /\bSlide\s+\d+\b/i,
  /\bIdentify the required skill name\b/i,
  /\bQUARTERLY\s+STRATEGY\s+SESSION\b/i,
  /\bREDEFINING THE BOUNDARIES\b/i,
  /\bpresentation visual illustration\b/i,
  /配图未生成/,
  /\bLorem ipsum\b/i,
]

const IMAGE_PROMPT_VISIBLE_PATTERNS = [
  /presentation visual illustration/i,
  /配图未生成/,
  /\bimagePrompt\b/i,
]

export interface SlideValidationEntry {
  index: number
  slideId?: string
  visibleTextLength: number
  hasTitleOrBody: boolean
  isBlank: boolean
  hasDemoText: boolean
}

export interface RenderedSlidesValidationResult {
  ok: boolean
  slideCount: number
  blankSlideCount: number
  blankSlideIndices: number[]
  blankSlideFallbackCount: number
  hasImagePromptText: boolean
  hasDemoText: boolean
  slides: SlideValidationEntry[]
}

function stripHtmlToVisibleText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractSlideHtmlChunks(html: string): string[] {
  const pattern = /<(section|div)\b[^>]*class=(["'])[^"']*\bslide\b[^"']*\2[^>]*>[\s\S]*?<\/\1>/gi
  return Array.from(html.matchAll(pattern)).map((match) => match[0])
}

function isSlideRootToken(className: string): boolean {
  const tokens = className.toLowerCase().split(/\s+/).filter(Boolean)
  if (!tokens.includes('slide')) return false
  if (tokens.some((token) => token === 'slides' || token === 'slide-counter')) return false
  return tokens.some((token) => (
    /^slide-\d+$/.test(token)
    || /^slide--[a-z0-9-]+$/.test(token)
    || /^slide-[a-z][a-z0-9-]*$/.test(token)
  ))
}

function extractSlideHtmlChunksStrict(html: string): string[] {
  const pattern = /<(section|div)\b[^>]*class=(["'])([^"']*)\2[^>]*>/gi
  const chunks: string[] = []
  let match: RegExpExecArray | null
  while ((match = pattern.exec(html))) {
    const className = match[3]?.trim() ?? ''
    if (!isSlideRootToken(className)) continue
    const openIndex = match.index ?? -1
    if (openIndex < 0) continue
    const tagName = match[1].toLowerCase()
    const closePattern = new RegExp(`</${tagName}>`, 'gi')
    closePattern.lastIndex = openIndex + match[0].length
    let depth = 1
    let token: RegExpExecArray | null
    const tokenPattern = new RegExp(`</?${tagName}\\b[^>]*>`, 'gi')
    tokenPattern.lastIndex = openIndex
    while ((token = tokenPattern.exec(html))) {
      if (new RegExp(`^<${tagName}\\b`, 'i').test(token[0])) depth += 1
      else depth -= 1
      if (depth === 0) {
        chunks.push(html.slice(openIndex, token.index + token[0].length))
        break
      }
    }
  }
  return chunks.length > 0 ? chunks : extractSlideHtmlChunks(html)
}

export function validateRenderedSlides(html: string): RenderedSlidesValidationResult {
  const bodyHtml = html.replace(/<head[\s\S]*?<\/head>/i, '')
  const visibleBody = stripHtmlToVisibleText(bodyHtml)
  const hasImagePromptText = IMAGE_PROMPT_VISIBLE_PATTERNS.some((pattern) => pattern.test(visibleBody))
  const hasDemoText = DEMO_TEXT_PATTERNS.some((pattern) => pattern.test(visibleBody))

  const slideChunks = extractSlideHtmlChunksStrict(html)
  const slides: SlideValidationEntry[] = slideChunks.map((chunk, index) => {
    const visibleText = stripHtmlToVisibleText(chunk)
    const slideId = chunk.match(/\bdata-slide-id=(["'])([^"']+)\1/i)?.[2]
    const hasHeading = /<h[1-6]\b/i.test(chunk) && stripHtmlToVisibleText(chunk.match(/<h[1-6]\b[\s\S]*?<\/h[1-6]>/i)?.[0] ?? '').length > 0
    const hasTitleClass = /\b(main-title|hero-title|big-statement|slide-title|col-title|display|quote-text|close-big)\b/i.test(chunk)
      && visibleText.length > 12
    const hasBodyClass = /\b(body-text|item-text|card-text|slide-subtitle)\b/i.test(chunk) && visibleText.length > 20
    const hasList = /<li\b/i.test(chunk) && stripHtmlToVisibleText(chunk.match(/<li\b[\s\S]*?<\/li>/i)?.[0] ?? '').length > 2
    const hasTitleOrBody = hasHeading || hasTitleClass || hasBodyClass || hasList || visibleText.length >= 24
    const isBlank = visibleText.length < 8 || (!hasTitleOrBody && visibleText.length < 32)
    const slideHasDemo = DEMO_TEXT_PATTERNS.some((pattern) => pattern.test(visibleText))
    return {
      index,
      slideId,
      visibleTextLength: visibleText.length,
      hasTitleOrBody,
      isBlank,
      hasDemoText: slideHasDemo,
    }
  })

  const blankSlideIndices = slides.filter((slide) => slide.isBlank).map((slide) => slide.index)
  const blankSlideCount = blankSlideIndices.length
  return {
    ok: slideChunks.length > 0 && blankSlideCount === 0 && !hasImagePromptText,
    slideCount: slideChunks.length,
    blankSlideCount,
    blankSlideIndices,
    blankSlideFallbackCount: blankSlideCount,
    hasImagePromptText,
    hasDemoText: hasDemoText || slides.some((slide) => slide.hasDemoText),
    slides,
  }
}

export function validateFinalHtmlSlides(
  html: string,
  options?: { minSlides?: number },
): RenderedSlidesValidationResult {
  const base = validateRenderedSlides(html)
  const minSlides = options?.minSlides ?? 2
  if (base.slideCount < minSlides) {
    return {
      ...base,
      ok: false,
      blankSlideFallbackCount: base.blankSlideFallbackCount + Math.max(0, minSlides - base.slideCount),
    }
  }
  return base
}
