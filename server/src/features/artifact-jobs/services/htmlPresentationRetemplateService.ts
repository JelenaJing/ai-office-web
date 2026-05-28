import fs from 'fs'
import path from 'path'
import {
  escapeAttribute,
  escapeHtml,
  injectEditRuntime,
  injectHtmlSlidesTemplateMarkers,
  injectSharedStyles,
  rebuildHtmlPresentationFromContentModel,
  resolveHtmlPresentationAssetUrl,
  sanitizePresentationHtmlImages,
  type ContentModelBlock,
  type ContentModelRecord,
  type ContentModelSlide,
} from './htmlPresentationPostProcess'
import {
  buildCandidateTemplatesSidecar,
  resolveBeautifulTemplateFile,
  resolveTemplateSelection,
  type HtmlPresentationJobOptions,
  type TemplateProfileRecord,
  type TemplateSelectionResult,
} from './htmlPresentationTemplates'
import { renderBeautifulHtmlWithTemplateAdapter } from './beautifulHtmlTemplateAdapter'
import {
  finalizeSafeFastPresentationHtml,
  hasBeautifulTemplateAdapterFastMapping,
  renderSafeFastPresentationHtml,
} from './htmlPresentationSafeFastRenderer'
import { validateFinalHtmlSlides, validateRenderedSlides } from './htmlPresentationSlideValidation'

export interface RetemplateResult {
  outputPath: string
  templateSlug: string
  tokenUsed: false
  rendererMode: TemplateProfileRecord['rendererMode']
  fallbackUsed: boolean
  warning?: string
  sidecars: {
    contentModel: boolean
    templateProfile: boolean
  }
}

export interface RenderHtmlPresentationResult {
  html: string
  rendererMode: TemplateProfileRecord['rendererMode']
  fallbackUsed: boolean
  warning?: string
}

export interface ApplyLockedTemplateRenderingResult {
  html: string
  templateProfile: TemplateProfileRecord
  rendererMode: TemplateProfileRecord['rendererMode']
  fallbackUsed: boolean
  warning?: string
  candidateTemplatesSidecar: Record<string, unknown>
  appliedTemplateSlug: string | null
  validationOk?: boolean
  blankSlideCount?: number
  repairAttempted?: boolean
  repairSucceeded?: boolean
}

function artifactIdFromDir(artifactDir: string): string {
  return path.basename(artifactDir)
}

function chunks<T>(items: T[], size: number): T[][] {
  const output: T[][] = []
  for (let index = 0; index < items.length; index += size) output.push(items.slice(index, index + size))
  return output
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

function visualPlacement(slide: ContentModelSlide): NonNullable<ContentModelSlide['visual']>['placement'] {
  return slide.visual?.placement ?? visualBlock(slide)?.placement ?? 'right'
}

function templateSlideClassNames(templateHtml: string): string[] {
  const matches = Array.from(templateHtml.matchAll(/<(?:section|div)\b[^>]*class=(["'])([^"']*\bslide\b[^"']*)\1[^>]*>/gi))
  return matches
    .map((match) => match[2].trim())
    .filter((className) => /\bslide\b/.test(className) && !/\bslides\b|\bslide-counter\b|\bslides-container\b/.test(className))
}

function renderVisual(slide: ContentModelSlide, artifactId: string, fallbackPlacement?: ContentModelSlide['visual']['placement']): string {
  const block = visualBlock(slide)
  if (!block?.assetPath) return ''
  const placement = block.placement ?? slide.visual?.placement ?? fallbackPlacement ?? 'right'
  const src = resolveHtmlPresentationAssetUrl(block.assetPath, artifactId)
  const placeholderUsed = block.placeholderUsed ?? /placeholder/i.test(block.assetPath)
  const fit = placement === 'background' || placement === 'full' ? 'cover' : placement === 'inline' ? 'contain' : 'cover'
  return `<div class="aios-visual-slot aios-visual-slot--${placement}" data-aios-visual-placement="${placement}" data-placeholder-used="${placeholderUsed ? 'true' : 'false'}"><img src="${escapeAttribute(src)}" alt="${escapeAttribute(slide.title || 'Slide visual')}" style="object-fit:${fit};" data-block-id="${block.id}" data-block-type="image" data-block-role="visual" data-image-prompt="${escapeAttribute(block.imagePrompt)}" data-placeholder-used="${placeholderUsed ? 'true' : 'false'}"></div>`
}

function renderTextBlock(tag: string, blockId: string, role: string, text: string, className = ''): string {
  const cls = className ? ` class="${className}"` : ''
  return `<${tag}${cls} data-block-id="${blockId}" data-block-type="text" data-block-role="${role}">${escapeHtml(text)}</${tag}>`
}

function renderGenericBeautifulTemplateSlide(
  slide: ContentModelSlide,
  index: number,
  total: number,
  artifactId: string,
  className: string,
): string {
  const title = slide.title || `Slide ${index + 1}`
  const subtitle = slide.subtitle || joinText(bodyTexts(slide).slice(0, 1))
  const textBlocks = slide.blocks.filter((block) => block.type === 'text')
  const bodyBlocks = textBlocks.filter((block) => !['title', 'subtitle'].includes(block.role))
  const titleBlockId = textBlocks.find((block) => block.role === 'title')?.id ?? `${slide.id}-title`
  const subtitleBlockId = textBlocks.find((block) => block.role === 'subtitle')?.id ?? `${slide.id}-subtitle`
  const items = (slide.bullets.length > 0 ? slide.bullets : bodyBlocks.map((block) => block.text)).slice(0, 6)
  const activeClass = index === 0 && !/\b(active|is-active)\b/.test(className) ? ' is-active active' : ''
  const normalizedClassName = `${className || 'slide'}${activeClass}`.trim()
  const leftItems = items.slice(0, Math.max(1, Math.ceil(items.length / 2)))
  const rightItems = items.slice(leftItems.length)
  const fallbackParagraphs = bodyBlocks
    .slice(0, 3)
    .map((block) => `<p data-block-id="${block.id}" data-block-type="text" data-block-role="${block.role}">${escapeHtml(block.text)}</p>`)
    .join('')
  const listMarkup = (list: string[], offset: number) => list.length > 0
    ? `<ul>${list.map((item, itemIndex) => `<li data-block-id="${bodyBlocks[offset + itemIndex]?.id ?? `${slide.id}-item-${offset + itemIndex + 1}`}" data-block-type="text" data-block-role="body">${escapeHtml(item)}</li>`).join('')}</ul>`
    : fallbackParagraphs

  return `<section class="${escapeAttribute(normalizedClassName)}" data-index="${index}" data-slide-id="${slide.id}" data-aios-has-visual="${visualBlock(slide) ? 'true' : 'false'}" data-aios-visual-placement="${visualPlacement(slide)}">
    <div class="aios-template-content">
      <div class="aios-template-kicker">AI OFFICE · ${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}</div>
      ${renderTextBlock(index === 0 ? 'h1' : 'h2', titleBlockId, 'title', title, 'aios-template-title display display-md')}
      ${subtitle ? renderTextBlock('p', subtitleBlockId, 'subtitle', subtitle, 'aios-template-subtitle') : ''}
      <div class="aios-template-grid">
        <div class="aios-template-card"><div class="aios-template-index">${String(index + 1).padStart(2, '0')}</div>${listMarkup(leftItems, 0)}</div>
        <div class="aios-template-card">${listMarkup(rightItems.length > 0 ? rightItems : bodyBlocks.slice(0, 3).map((block) => block.text), leftItems.length)}</div>
      </div>
      ${renderVisual(slide, artifactId, slide.role === 'cover' ? 'hero' : 'card')}
    </div>
  </section>`
}

function renderBlueProfessionalSlide(slide: ContentModelSlide, index: number, total: number, artifactId: string): string {
  const title = slide.title || `Slide ${index + 1}`
  const subtitle = slide.subtitle || joinText(bodyTexts(slide).slice(0, 1))
  const bullets = (slide.bullets.length > 0 ? slide.bullets : bodyTexts(slide)).slice(0, 6)
  const textBlocks = slide.blocks.filter((block) => block.type === 'text')
  const titleBlockId = textBlocks.find((block) => block.role === 'title')?.id ?? `${slide.id}-title`
  const subtitleBlockId = textBlocks.find((block) => block.role === 'subtitle')?.id ?? `${slide.id}-subtitle`
  const contentBlocks = textBlocks.filter((block) => !['title', 'subtitle'].includes(block.role))

  if (slide.role === 'cover') {
    return `<div class="slide layout-cover${index === 0 ? ' active' : ''}" data-index="${index}" data-slide-id="${slide.id}" data-aios-has-visual="${visualBlock(slide) ? 'true' : 'false'}" data-aios-visual-placement="${visualPlacement(slide)}">
      <div class="cover-decoration"></div>
      <div class="cover-dots"><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>
      <div class="accent-line"></div>
      ${renderTextBlock('h1', titleBlockId, 'title', title)}
      ${subtitle ? renderTextBlock('p', subtitleBlockId, 'subtitle', subtitle, 'subtitle') : ''}
      ${renderTextBlock('p', `${slide.id}-meta`, 'caption', `Slide ${String(index + 1).padStart(2, '0')} · ${total}`, 'meta')}
      ${renderVisual(slide, artifactId, 'hero')}
    </div>`
  }

  if (slide.role === 'agenda') {
    const items = (bullets.length > 0 ? bullets : ['Overview', 'Key points', 'Next steps']).slice(0, 6)
    return `<div class="slide layout-agenda" data-index="${index}" data-slide-id="${slide.id}" data-aios-has-visual="${visualBlock(slide) ? 'true' : 'false'}" data-aios-visual-placement="inline">
      <div class="slide-header"><h4 data-block-id="${titleBlockId}" data-block-type="text" data-block-role="title">${escapeHtml(title)}</h4><span class="tag">Overview</span></div>
      <div class="slide-content"><div class="accent-line"></div><div class="agenda-grid">${items.map((item, itemIndex) => `<div class="agenda-item"><span class="agenda-num">${String(itemIndex + 1).padStart(2, '0')}</span><div>${renderTextBlock('h3', contentBlocks[itemIndex]?.id ?? `${slide.id}-agenda-${itemIndex + 1}`, 'body', item)}${renderTextBlock('p', `${slide.id}-agenda-desc-${itemIndex + 1}`, 'caption', subtitle || 'Key topic for this section')}</div></div>`).join('')}</div>${renderVisual(slide, artifactId, 'inline')}</div>
    </div>`
  }

  if (slide.role === 'timeline') {
    const steps = (bullets.length > 0 ? bullets : bodyTexts(slide)).slice(0, 4)
    return `<div class="slide layout-timeline" data-index="${index}" data-slide-id="${slide.id}" data-aios-has-visual="${visualBlock(slide) ? 'true' : 'false'}" data-aios-visual-placement="${visualPlacement(slide)}">
      <div class="slide-header"><h4 data-block-id="${titleBlockId}" data-block-type="text" data-block-role="title">${escapeHtml(title)}</h4><span class="tag">Process</span></div>
      <div class="slide-content"><h2 data-block-id="${subtitleBlockId}" data-block-type="text" data-block-role="subtitle">${escapeHtml(subtitle || title)}</h2><div class="timeline-track">${steps.map((step, stepIndex) => `<div class="timeline-step"><div class="step-circle">${stepIndex + 1}</div><div class="step-title" data-block-id="${contentBlocks[stepIndex]?.id ?? `${slide.id}-step-${stepIndex + 1}`}" data-block-type="text" data-block-role="body">${escapeHtml(step)}</div><div class="step-desc">${escapeHtml(bodyTexts(slide)[stepIndex] || subtitle || 'Planned implementation step')}</div></div>`).join('')}</div>${renderVisual(slide, artifactId, 'card')}</div>
    </div>`
  }

  if (slide.role === 'section') {
    return `<div class="slide layout-quote" data-index="${index}" data-slide-id="${slide.id}" data-aios-has-visual="${visualBlock(slide) ? 'true' : 'false'}" data-aios-visual-placement="${visualPlacement(slide)}">
      <div class="quote-decoration"></div><div class="quote-decoration-2"></div><div class="quote-mark">&ldquo;</div>
      <blockquote data-block-id="${titleBlockId}" data-block-type="text" data-block-role="title">${escapeHtml(title)}</blockquote>
      ${renderTextBlock('p', subtitleBlockId, 'subtitle', subtitle || 'Section transition', 'quote-source')}
      ${renderVisual(slide, artifactId, 'background')}
    </div>`
  }

  if (slide.role === 'closing') {
    return `<div class="slide layout-closing" data-index="${index}" data-slide-id="${slide.id}" data-aios-has-visual="false" data-aios-visual-placement="card">
      <div class="closing-decoration"></div><div class="closing-decoration-2"></div><div class="accent-line" style="margin: 0 auto 1.5rem;"></div>
      ${renderTextBlock('h1', titleBlockId, 'title', title)}
      ${subtitle ? renderTextBlock('p', subtitleBlockId, 'subtitle', subtitle, 'closing-sub') : ''}
      <a href="#" class="cta-btn">Review Next Actions</a>
      ${renderTextBlock('p', `${slide.id}-contact`, 'caption', joinText(bodyTexts(slide).slice(0, 1), 'AI Office · HTML PPT'), 'closing-contact')}
    </div>`
  }

  const leftItems = chunks(bullets.length > 0 ? bullets : bodyTexts(slide), 3)[0] ?? []
  const rightLead = joinText(bodyTexts(slide).slice(0, 2), subtitle || 'Key supporting narrative')
  return `<div class="slide layout-split" data-index="${index}" data-slide-id="${slide.id}" data-aios-has-visual="${visualBlock(slide) ? 'true' : 'false'}" data-aios-visual-placement="${visualPlacement(slide)}">
    <div class="slide-header"><h4 data-block-id="${titleBlockId}" data-block-type="text" data-block-role="title">${escapeHtml(title)}</h4><span class="tag">Analysis</span></div>
    <div class="slide-content">
      <h2 data-block-id="${subtitleBlockId}" data-block-type="text" data-block-role="subtitle">${escapeHtml(subtitle || title)}</h2>
      <div class="split-body">
        <div class="split-left"><ul class="insight-list">${leftItems.map((item, itemIndex) => `<li data-block-id="${contentBlocks[itemIndex]?.id ?? `${slide.id}-insight-${itemIndex + 1}`}" data-block-type="text" data-block-role="body">${escapeHtml(item)}</li>`).join('')}</ul></div>
        <div class="split-right"><div class="split-highlight">${escapeHtml(rightLead)}<cite>${escapeHtml(title)}</cite></div>${bodyTexts(slide).slice(2, 3).map((text, itemIndex) => renderTextBlock('p', contentBlocks[leftItems.length + itemIndex]?.id ?? `${slide.id}-body-${itemIndex + 1}`, 'body', text)).join('')}</div>
      </div>
      ${renderVisual(slide, artifactId, slide.role === 'image' ? 'right' : 'card')}
    </div>
  </div>`
}

function renderBoldPosterSlide(slide: ContentModelSlide, index: number, total: number, artifactId: string): string {
  const title = slide.title || `Slide ${index + 1}`
  const subtitle = slide.subtitle || joinText(bodyTexts(slide).slice(0, 1))
  const bullets = (slide.bullets.length > 0 ? slide.bullets : bodyTexts(slide)).slice(0, 6)
  const textBlocks = slide.blocks.filter((block) => block.type === 'text')
  const titleBlockId = textBlocks.find((block) => block.role === 'title')?.id ?? `${slide.id}-title`
  const subtitleBlockId = textBlocks.find((block) => block.role === 'subtitle')?.id ?? `${slide.id}-subtitle`
  const contentBlocks = textBlocks.filter((block) => !['title', 'subtitle'].includes(block.role))

  if (slide.role === 'cover') {
    const words = (title.split(/\s+/).filter(Boolean).slice(0, 3).concat([''])).slice(0, 3)
    return `<div class="slide slide-hero${index === 0 ? ' active' : ''}" data-index="${index}" data-slide-id="${slide.id}" data-aios-has-visual="${visualBlock(slide) ? 'true' : 'false'}" data-aios-visual-placement="${visualPlacement(slide)}">
      <div class="hero-meta" data-block-id="${subtitleBlockId}" data-block-type="text" data-block-role="subtitle">${escapeHtml(subtitle || `Slide ${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`)}</div>
      <div class="hero-title-group">
        <div class="hero-title" data-block-id="${titleBlockId}" data-block-type="text" data-block-role="title">${escapeHtml(words[0] || title)}</div>
        <div class="hero-title red">${escapeHtml(words[1] || '')}</div>
        <div class="hero-title bottom">${escapeHtml(words[2] || '')}</div>
      </div>
      <div class="hero-tagline"><div class="tag-label">Editorial Deck</div><div class="tag-body">${escapeHtml(joinText(bodyTexts(slide).slice(0, 1), subtitle || title))}</div></div>
      ${renderVisual(slide, artifactId, 'hero')}
    </div>`
  }

  if (slide.role === 'section') {
    return `<div class="slide slide-red" data-index="${index}" data-slide-id="${slide.id}" data-aios-has-visual="${visualBlock(slide) ? 'true' : 'false'}" data-aios-visual-placement="${visualPlacement(slide)}">
      <div class="red-quote" data-block-id="${titleBlockId}" data-block-type="text" data-block-role="title">${escapeHtml(title)}</div>
      <div class="red-cite" data-block-id="${subtitleBlockId}" data-block-type="text" data-block-role="subtitle">${escapeHtml(subtitle || 'Section transition')}</div>
      ${renderVisual(slide, artifactId, 'background')}
    </div>`
  }

  if (slide.role === 'timeline') {
    const phases = chunks(bullets.length > 0 ? bullets : bodyTexts(slide), 4)[0] ?? []
    return `<div class="slide slide-roadmap" data-index="${index}" data-slide-id="${slide.id}" data-aios-has-visual="${visualBlock(slide) ? 'true' : 'false'}" data-aios-visual-placement="${visualPlacement(slide)}">
      <div class="rm-inner">${phases.map((phase, phaseIndex) => `<div class="rm-phase"><div class="rm-label">Phase ${phaseIndex + 1}</div><div class="rm-title" data-block-id="${contentBlocks[phaseIndex]?.id ?? `${slide.id}-phase-${phaseIndex + 1}`}" data-block-type="text" data-block-role="body">${escapeHtml(phase)}</div><div class="rm-body">${escapeHtml(subtitle || 'Key milestone')}</div><ul class="rm-bullets"><li>${escapeHtml(bodyTexts(slide)[phaseIndex] || phase)}</li></ul></div>`).join('')}</div>
      ${renderVisual(slide, artifactId, 'card')}
    </div>`
  }

  if (slide.role === 'closing') {
    return `<div class="slide slide-close" data-index="${index}" data-slide-id="${slide.id}" data-aios-has-visual="false" data-aios-visual-placement="card">
      <div class="close-big" data-block-id="${titleBlockId}" data-block-type="text" data-block-role="title">${escapeHtml(title)}</div>
      <div class="close-sub" data-block-id="${subtitleBlockId}" data-block-type="text" data-block-role="subtitle">${escapeHtml(joinText([subtitle, ...bodyTexts(slide).slice(0, 1)], subtitle || title))}</div>
      <div class="close-links"><a href="#">AI Office</a><a href="#">HTML PPT</a><a href="#">Review</a></div>
    </div>`
  }

  const columns = chunks(bodyTexts(slide).length > 0 ? bodyTexts(slide) : bullets, 2)
  const highlights = bullets.slice(0, 3)
  return `<div class="slide slide-summary" data-index="${index}" data-slide-id="${slide.id}" data-aios-has-visual="${visualBlock(slide) ? 'true' : 'false'}" data-aios-visual-placement="${visualPlacement(slide)}">
    <div class="summary-inner">
      <div class="summary-header" data-block-id="${titleBlockId}" data-block-type="text" data-block-role="title">${escapeHtml(title)}</div>
      <div class="summary-columns">
        <div class="summary-col">${escapeHtml(joinText(columns[0] ?? [], subtitle || title))}</div>
        <div class="summary-col">${escapeHtml(joinText(columns[1] ?? [], joinText(highlights, subtitle || title)))}</div>
      </div>
      <div class="summary-highlights">${highlights.map((item, itemIndex) => `<div class="summary-hl"><div class="hl-num">${String(itemIndex + 1).padStart(2, '0')}</div><div class="hl-label">${escapeHtml(item)}</div><div class="hl-body">${escapeHtml(bodyTexts(slide)[itemIndex] || subtitle || 'Supporting detail')}</div></div>`).join('')}</div>
      ${renderVisual(slide, artifactId, slide.role === 'image' ? 'right' : 'card')}
    </div>
  </div>`
}

function extractSlidesEnvelope(templateHtml: string): { prefix: string; suffix: string } | null {
  const openPattern = /<div\b[^>]*class=(["'])[^"']*\bslides\b[^"']*\1[^>]*>/i
  const openMatch = openPattern.exec(templateHtml)
  if (!openMatch || openMatch.index < 0) return null
  const openIndex = openMatch.index
  const openEnd = openIndex + openMatch[0].length
  const tokenPattern = /<\/?div\b[^>]*>/gi
  tokenPattern.lastIndex = openEnd
  let depth = 1
  let tokenMatch: RegExpExecArray | null
  while ((tokenMatch = tokenPattern.exec(templateHtml))) {
    if (/^<div\b/i.test(tokenMatch[0])) depth += 1
    else depth -= 1
    if (depth === 0) {
      return {
        prefix: templateHtml.slice(0, openEnd),
        suffix: templateHtml.slice(tokenMatch.index),
      }
    }
  }
  return null
}

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

function extractSectionSlidesEnvelope(templateHtml: string): { prefix: string; suffix: string } | null {
  const matches = Array.from(templateHtml.matchAll(/<section\b[^>]*class=(["'])[^"']*\bslide\b[^"']*\1[^>]*>[\s\S]*?<\/section>/gi))
  if (matches.length === 0) return null
  const first = matches[0]
  const last = matches[matches.length - 1]
  const firstIndex = first.index ?? -1
  const lastIndex = last.index ?? -1
  if (firstIndex < 0 || lastIndex < 0) return null
  return {
    prefix: templateHtml.slice(0, firstIndex),
    suffix: templateHtml.slice(lastIndex + last[0].length),
  }
}

function extractDivSlideSiblingsEnvelope(templateHtml: string): { prefix: string; suffix: string } | null {
  const slidePattern = /<div\b[^>]*class=(["'])[^"']*\bslide\b[^"']*\1[^>]*>/gi
  const starts: number[] = []
  let match: RegExpExecArray | null
  while ((match = slidePattern.exec(templateHtml))) {
    if (typeof match.index === 'number') starts.push(match.index)
  }
  if (starts.length === 0) return null
  const firstIndex = starts[0]
  const lastEnd = findElementCloseIndex(templateHtml, starts[starts.length - 1], 'div')
  if (lastEnd < 0) return null
  return {
    prefix: templateHtml.slice(0, firstIndex),
    suffix: templateHtml.slice(lastEnd),
  }
}

export function renderBeautifulTemplateHtml(input: {
  templateSlug: string
  templateFile: string
  contentModel: ContentModelRecord
  artifactId: string
}): string | null {
  const adapterResult = renderBeautifulHtmlWithTemplateAdapter(input)
  if (adapterResult.ok && adapterResult.html) return adapterResult.html
  return renderBeautifulTemplateHtmlLegacy(input)
}

function renderBeautifulTemplateHtmlLegacy(input: {
  templateSlug: string
  templateFile: string
  contentModel: ContentModelRecord
  artifactId: string
}): string | null {
  const templateHtml = fs.readFileSync(input.templateFile, 'utf-8')
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(input.contentModel.title || 'HTML PPT')}</title>`)
  const envelope = extractSlidesEnvelope(templateHtml)
    ?? extractSectionSlidesEnvelope(templateHtml)
    ?? extractDivSlideSiblingsEnvelope(templateHtml)
  if (!envelope) return null
  const classNames = templateSlideClassNames(templateHtml)
  const renderSlide = input.templateSlug === 'bold-poster'
    ? renderBoldPosterSlide
    : input.templateSlug === 'blue-professional'
      ? renderBlueProfessionalSlide
      : null
  const slidesHtml = input.contentModel.slides
    .map((slide, index, allSlides) => {
      if (renderSlide) return renderSlide(slide, index, allSlides.length, input.artifactId)
      return renderGenericBeautifulTemplateSlide(
        slide,
        index,
        allSlides.length,
        input.artifactId,
        classNames[index % Math.max(1, classNames.length)] ?? 'slide',
      )
    })
    .join('\n')
  return `${envelope.prefix}\n${slidesHtml}\n${envelope.suffix}`
}

/** Initial generation (fast/high): keep OpenCode HTML, only markers/images/profile sync. */
export function finalizeOpencodeTemplateDrivenJobOutput(input: {
  outputDir: string
  htmlPath: string
  contentModel: ContentModelRecord
  contentModelPath: string
  templateSelection: TemplateSelectionResult
  artifactId?: string
  qualityMode: 'fast' | 'high'
}): ApplyLockedTemplateRenderingResult {
  const templateFile = resolveBeautifulTemplateFile(input.templateSelection.selectedTemplateSlug)
    || input.templateSelection.templateProfile.templateFile
  const appliedTemplateSlug = input.templateSelection.selectedTemplateSlug
  let html = fs.existsSync(input.htmlPath) ? fs.readFileSync(input.htmlPath, 'utf-8') : ''
  const validation = validateFinalHtmlSlides(html, {
    minSlides: Math.min(2, Math.max(1, input.contentModel.slides.length)),
  })
  const rendererMode: TemplateProfileRecord['rendererMode'] = input.qualityMode === 'high'
    ? 'opencode-template-driven-high'
    : 'opencode-template-driven-fast'

  html = injectHtmlSlidesTemplateMarkers(html, appliedTemplateSlug)
  html = sanitizePresentationHtmlImages({
    html,
    contentModel: { ...input.contentModel, templateSlug: appliedTemplateSlug },
    assetsBaseDir: input.outputDir,
    artifactId: input.artifactId,
  })
  html = injectEditRuntime(injectSharedStyles(html), input.contentModel.deckId || input.contentModel.title || 'deck')

  const nextProfile: TemplateProfileRecord = {
    ...input.templateSelection.templateProfile,
    templateFile,
    templateSlug: appliedTemplateSlug,
    requestedTemplateSlug: input.templateSelection.requestedTemplateSlug || appliedTemplateSlug,
    appliedTemplateSlug,
    templateLocked: input.templateSelection.templateLocked,
    templateSourceKind: input.templateSelection.templateLocked ? 'user-selected' : input.templateSelection.templateProfile.templateSourceKind,
    rendererMode,
    fallbackUsed: false,
    templateStyleApplied: validation.ok ? 'full' : 'not-applied',
    blankSlideFallbackCount: validation.blankSlideFallbackCount,
    warning: validation.ok
      ? undefined
      : input.qualityMode === 'high'
        ? '部分页面内容较少，已保留 OpenCode 模板生成结果。'
        : 'OpenCode 模板页校验未通过，将回退稳定快速渲染。',
  }

  const candidateTemplatesSidecar = buildCandidateTemplatesSidecar(input.templateSelection)
  fs.writeFileSync(input.htmlPath, html, 'utf-8')
  fs.writeFileSync(input.contentModelPath, JSON.stringify({ ...input.contentModel, templateSlug: appliedTemplateSlug }, null, 2), 'utf-8')
  fs.writeFileSync(path.join(input.outputDir, 'template-profile.json'), JSON.stringify(nextProfile, null, 2), 'utf-8')
  fs.writeFileSync(path.join(input.outputDir, 'candidate-templates.json'), JSON.stringify(candidateTemplatesSidecar, null, 2), 'utf-8')

  if (!validation.ok) {
    console.warn(
      `[html-ppt] opencode-template-driven validation slug=${appliedTemplateSlug} blankSlides=${validation.blankSlideCount} hasDemo=${validation.hasDemoText}`,
    )
  }

  return {
    html,
    templateProfile: nextProfile,
    rendererMode,
    fallbackUsed: false,
    warning: nextProfile.warning,
    candidateTemplatesSidecar,
    appliedTemplateSlug,
    validationOk: validation.ok,
    blankSlideCount: validation.blankSlideCount,
  }
}

/** Fast fallback when OpenCode template output fails validation (after optional repair). */
export function finalizeSafeFastJobOutput(input: {
  outputDir: string
  htmlPath: string
  contentModel: ContentModelRecord
  contentModelPath: string
  templateSelection: TemplateSelectionResult
  artifactId?: string
  fallbackReason?: string
  repairAttempted?: boolean
  repairSucceeded?: boolean
}): ApplyLockedTemplateRenderingResult {
  const requestedTemplateSlug = input.templateSelection.requestedTemplateSlug
    || input.templateSelection.selectedTemplateSlug
  const templateFile = resolveBeautifulTemplateFile(input.templateSelection.selectedTemplateSlug)
    || input.templateSelection.templateProfile.templateFile
  const templateProfile: TemplateProfileRecord = {
    ...input.templateSelection.templateProfile,
    templateFile,
    templateSlug: requestedTemplateSlug,
    requestedTemplateSlug,
    appliedTemplateSlug: null,
    templateLocked: input.templateSelection.templateLocked,
    templateSourceKind: input.templateSelection.templateLocked ? 'user-selected' : input.templateSelection.templateProfile.templateSourceKind,
  }

  const useAdapterFast = hasBeautifulTemplateAdapterFastMapping(input.templateSelection.selectedTemplateSlug)
  let rendererMode: TemplateProfileRecord['rendererMode'] = 'safe-fast-renderer'
  let fallbackUsed = true
  let fallbackReason: string | undefined = input.fallbackReason || 'fast-template-validation-failed'
  let blankSlideFallbackCount = 0
  let html = ''
  let appliedTemplateSlug: string | null = null

  if (useAdapterFast) {
    const adapterResult = renderBeautifulHtmlWithTemplateAdapter({
      templateSlug: input.templateSelection.selectedTemplateSlug,
      templateFile,
      contentModel: input.contentModel,
      artifactId: input.artifactId || '',
    })
    const adapterValidation = adapterResult.html ? validateRenderedSlides(adapterResult.html) : { ok: false, blankSlideFallbackCount: input.contentModel.slides.length } as ReturnType<typeof validateRenderedSlides>
    if (adapterResult.ok && adapterResult.html && adapterValidation.ok) {
      html = injectEditRuntime(injectSharedStyles(adapterResult.html), input.contentModel.deckId || input.contentModel.title || 'deck')
      rendererMode = 'beautiful-template-adapter-fast'
      fallbackUsed = false
      fallbackReason = undefined
      appliedTemplateSlug = input.templateSelection.selectedTemplateSlug
    } else {
      blankSlideFallbackCount = adapterValidation.blankSlideFallbackCount
      fallbackReason = adapterResult.fallbackReason || 'adapter-produced-blank-slides'
    }
  }

  if (!html) {
    const safe = finalizeSafeFastPresentationHtml({
      contentModel: input.contentModel,
      templateProfile,
      appliedTemplateSlug: requestedTemplateSlug,
      artifactId: input.artifactId,
      assetsBaseDir: input.outputDir,
    })
    html = safe.html
    blankSlideFallbackCount = safe.validation.blankSlideFallbackCount
    rendererMode = 'safe-fast-renderer'
    fallbackUsed = true
    appliedTemplateSlug = null
  }

  html = injectHtmlSlidesTemplateMarkers(html, requestedTemplateSlug)
  html = sanitizePresentationHtmlImages({
    html,
    contentModel: { ...input.contentModel, templateSlug: requestedTemplateSlug },
    assetsBaseDir: input.outputDir,
    artifactId: input.artifactId,
  })

  const nextProfile: TemplateProfileRecord = {
    ...templateProfile,
    rendererMode,
    fallbackUsed,
    fallbackReason,
    appliedTemplateSlug,
    templateStyleApplied: fallbackUsed ? 'not-applied' : 'full',
    blankSlideFallbackCount,
    repairAttempted: input.repairAttempted,
    repairSucceeded: input.repairSucceeded,
    warning: fallbackUsed
      ? '所选模板未完整应用，当前为快速草稿。可使用高质量重新生成或点击「应用模板」重试。'
      : undefined,
  }

  const candidateTemplatesSidecar = buildCandidateTemplatesSidecar(input.templateSelection)
  fs.writeFileSync(input.htmlPath, html, 'utf-8')
  fs.writeFileSync(
    input.contentModelPath,
    JSON.stringify({ ...input.contentModel, templateSlug: requestedTemplateSlug }, null, 2),
    'utf-8',
  )
  fs.writeFileSync(path.join(input.outputDir, 'template-profile.json'), JSON.stringify(nextProfile, null, 2), 'utf-8')
  fs.writeFileSync(path.join(input.outputDir, 'candidate-templates.json'), JSON.stringify(candidateTemplatesSidecar, null, 2), 'utf-8')

  return {
    html,
    templateProfile: nextProfile,
    rendererMode,
    fallbackUsed,
    warning: nextProfile.warning,
    candidateTemplatesSidecar,
    appliedTemplateSlug,
    repairAttempted: input.repairAttempted,
    repairSucceeded: input.repairSucceeded,
  }
}

/** User-initiated “apply template” — adapter with blank-slide guard. */
export function applyLockedTemplateRenderingToJobOutput(input: {
  outputDir: string
  htmlPath: string
  contentModel: ContentModelRecord
  contentModelPath: string
  templateSelection: TemplateSelectionResult
  artifactId?: string
}): ApplyLockedTemplateRenderingResult {
  const templateFile = resolveBeautifulTemplateFile(input.templateSelection.selectedTemplateSlug)
    || input.templateSelection.templateProfile.templateFile
  const templateProfile: TemplateProfileRecord = {
    ...input.templateSelection.templateProfile,
    templateFile,
    requestedTemplateSlug: input.templateSelection.requestedTemplateSlug || input.templateSelection.selectedTemplateSlug,
    appliedTemplateSlug: input.templateSelection.selectedTemplateSlug,
    templateLocked: input.templateSelection.templateLocked,
    templateSourceKind: input.templateSelection.templateLocked ? 'user-selected' : input.templateSelection.templateProfile.templateSourceKind,
  }
  const currentHtml = fs.existsSync(input.htmlPath) ? fs.readFileSync(input.htmlPath, 'utf-8') : ''
  const renderResult = renderHtmlPresentationFromContentModel({
    contentModel: input.contentModel,
    templateProfile,
    artifactId: input.artifactId || '',
    currentHtml,
    purpose: 'retemplate',
  })
  const appliedTemplateSlug = input.templateSelection.selectedTemplateSlug
  const adapterValidation = renderResult.html ? validateRenderedSlides(renderResult.html) : null
  const blankSlideFallbackCount = adapterValidation?.blankSlideFallbackCount ?? 0
  const useAdapterResult = renderResult.rendererMode === 'beautiful-template-adapter-retemplate'
    && !renderResult.fallbackUsed
    && Boolean(adapterValidation?.ok)

  const nextProfile: TemplateProfileRecord = {
    ...templateProfile,
    templateSlug: appliedTemplateSlug,
    rendererMode: useAdapterResult ? 'beautiful-template-adapter-retemplate' : renderResult.rendererMode,
    appliedTemplateSlug,
    fallbackUsed: renderResult.fallbackUsed || !useAdapterResult,
    fallbackReason: useAdapterResult ? undefined : (renderResult.warning || 'adapter-produced-blank-slides'),
    blankSlideFallbackCount,
    warning: useAdapterResult ? renderResult.warning : (renderResult.warning || '模板应用未完全成功，已保留或回退为稳定版式。'),
  }
  let html = useAdapterResult ? (renderResult.html || currentHtml) : (renderResult.fallbackUsed ? currentHtml : (renderResult.html || currentHtml))
  if (!useAdapterResult && !html.trim()) {
    html = renderSafeFastPresentationHtml({
      contentModel: input.contentModel,
      templateProfile,
      artifactId: input.artifactId,
      assetsBaseDir: input.outputDir,
    })
  }
  html = injectHtmlSlidesTemplateMarkers(html, appliedTemplateSlug)
  html = sanitizePresentationHtmlImages({
    html,
    contentModel: {
      ...input.contentModel,
      templateSlug: appliedTemplateSlug,
    },
    assetsBaseDir: input.outputDir,
    artifactId: input.artifactId,
  })
  const candidateTemplatesSidecar = buildCandidateTemplatesSidecar(input.templateSelection)
  fs.writeFileSync(input.htmlPath, html, 'utf-8')
  fs.writeFileSync(input.contentModelPath, JSON.stringify({
    ...input.contentModel,
    templateSlug: appliedTemplateSlug,
  }, null, 2), 'utf-8')
  fs.writeFileSync(path.join(input.outputDir, 'template-profile.json'), JSON.stringify(nextProfile, null, 2), 'utf-8')
  fs.writeFileSync(path.join(input.outputDir, 'candidate-templates.json'), JSON.stringify(candidateTemplatesSidecar, null, 2), 'utf-8')
  return {
    html,
    templateProfile: nextProfile,
    rendererMode: renderResult.rendererMode,
    fallbackUsed: renderResult.fallbackUsed,
    warning: renderResult.warning,
    candidateTemplatesSidecar,
    appliedTemplateSlug,
  }
}

export function renderHtmlPresentationFromContentModel(input: {
  contentModel: ContentModelRecord
  templateProfile: TemplateProfileRecord
  artifactId: string
  currentHtml?: string
  purpose?: 'retemplate' | 'timeout-fallback'
}): RenderHtmlPresentationResult {
  const purpose = input.purpose ?? 'retemplate'
  const templateFile = resolveBeautifulTemplateFile(input.templateProfile.templateSlug) || input.templateProfile.templateFile
  let html = ''
  let rendererMode: TemplateProfileRecord['rendererMode'] = purpose === 'timeout-fallback'
    ? 'safe-fast-renderer'
    : 'beautiful-template-adapter-retemplate'
  let fallbackUsed = false
  let warning = input.templateProfile.warning?.trim() || ''

  if (purpose === 'timeout-fallback') {
    html = renderSafeFastPresentationHtml({
      contentModel: input.contentModel,
      templateProfile: input.templateProfile,
      artifactId: input.artifactId,
    })
    return { html, rendererMode: 'safe-fast-renderer', fallbackUsed: true, warning: warning || '生成超时，已使用稳定快速渲染。' }
  }

  let adapterFallbackReason: string | undefined
  if (templateFile) {
    const adapterResult = renderBeautifulHtmlWithTemplateAdapter({
      templateSlug: input.templateProfile.templateSlug,
      templateFile,
      contentModel: input.contentModel,
      artifactId: input.artifactId,
    })
    adapterFallbackReason = adapterResult.fallbackReason
    const adapterValidation = adapterResult.html ? validateRenderedSlides(adapterResult.html) : null
    const adapterOk = Boolean(adapterResult.ok && adapterResult.html && adapterValidation?.ok)
    const rendered = adapterOk
      ? adapterResult.html
      : renderBeautifulTemplateHtmlLegacy({
        templateSlug: input.templateProfile.templateSlug,
        templateFile,
        contentModel: input.contentModel,
        artifactId: input.artifactId,
      })
    const legacyValidation = rendered ? validateRenderedSlides(rendered) : null
    const legacyOk = Boolean(rendered && legacyValidation?.ok)
    if (adapterOk && adapterResult.html) {
      rendererMode = 'beautiful-template-adapter-retemplate'
      html = injectEditRuntime(injectSharedStyles(adapterResult.html), input.contentModel.deckId || input.contentModel.title || 'deck')
    } else if (legacyOk && rendered) {
      rendererMode = 'beautiful-template'
      html = injectEditRuntime(injectSharedStyles(rendered), input.contentModel.deckId || input.contentModel.title || 'deck')
    } else if (input.currentHtml) {
      fallbackUsed = true
      rendererMode = 'beautiful-template-adapter-fallback'
      warning = warning || adapterFallbackReason || 'adapter-produced-blank-slides'
      console.warn(
        `[html-ppt] retemplate adapter blank/failed slug=${input.templateProfile.templateSlug} reason=${adapterFallbackReason || 'blank-slides'}`,
      )
      html = input.currentHtml
    }
  }

  if (!html) {
    fallbackUsed = true
    rendererMode = 'safe-fast-renderer'
    warning = warning || '模板换肤失败，已使用稳定版式。'
    html = renderSafeFastPresentationHtml({
      contentModel: input.contentModel,
      templateProfile: input.templateProfile,
      artifactId: input.artifactId,
    })
  }

  return {
    html,
    rendererMode,
    fallbackUsed,
    warning: warning || undefined,
  }
}

export function retemplateHtmlPresentationFromContentModel(input: {
  contentModelPath: string
  outputHtmlPath: string
  nextTemplateSlug: string
  artifactDir: string
}): RetemplateResult {
  const contentModel = JSON.parse(fs.readFileSync(input.contentModelPath, 'utf-8')) as ContentModelRecord
  const selection = resolveTemplateSelection({
    prompt: `${contentModel.title}\n${contentModel.subtitle}`.trim(),
    inputMarkdown: JSON.stringify(contentModel.slides.map((slide) => ({
      title: slide.title,
      subtitle: slide.subtitle,
      bullets: slide.bullets,
    }))),
    options: {
      templateSlug: input.nextTemplateSlug,
      enableImages: true,
      maxImages: 3,
      qualityMode: 'high',
    } satisfies HtmlPresentationJobOptions,
  })
  const artifactId = artifactIdFromDir(input.artifactDir)
  const templateFile = resolveBeautifulTemplateFile(selection.selectedTemplateSlug) || selection.templateProfile.templateFile
  const nextContentModel: ContentModelRecord = {
    ...contentModel,
    templateSlug: selection.selectedTemplateSlug,
    theme: selection.templateProfile.colorScheme,
    updatedAt: new Date().toISOString(),
  }
  const renderResult = renderHtmlPresentationFromContentModel({
    contentModel: nextContentModel,
    templateProfile: {
      ...selection.templateProfile,
      templateFile,
    },
    artifactId,
    currentHtml: fs.existsSync(input.outputHtmlPath) ? fs.readFileSync(input.outputHtmlPath, 'utf-8') : '',
  })

  const profile: TemplateProfileRecord = {
    ...selection.templateProfile,
    templateFile,
    rendererMode: renderResult.rendererMode,
    warning: renderResult.warning,
  }

  fs.mkdirSync(path.dirname(input.outputHtmlPath), { recursive: true })
  fs.writeFileSync(input.outputHtmlPath, renderResult.html, 'utf-8')

  let contentModelSaved = false
  let templateProfileSaved = false
  try {
    fs.writeFileSync(path.join(input.artifactDir, 'content-model.json'), JSON.stringify(nextContentModel, null, 2), 'utf-8')
    contentModelSaved = true
  } catch {}

  try {
    fs.writeFileSync(path.join(input.artifactDir, 'template-profile.json'), JSON.stringify(profile, null, 2), 'utf-8')
    templateProfileSaved = true
  } catch {}

  return {
    outputPath: input.outputHtmlPath,
    templateSlug: selection.selectedTemplateSlug,
    tokenUsed: false,
    rendererMode: renderResult.rendererMode,
    fallbackUsed: renderResult.fallbackUsed,
    warning: renderResult.warning,
    sidecars: {
      contentModel: contentModelSaved,
      templateProfile: templateProfileSaved,
    },
  }
}
