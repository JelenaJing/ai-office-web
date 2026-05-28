import {
  injectEditRuntime,
  injectHtmlSlidesTemplateMarkers,
  injectSharedStyles,
  rebuildHtmlPresentationFromContentModel,
  sanitizePresentationHtmlImages,
  type ContentModelRecord,
} from './htmlPresentationPostProcess'
import type { TemplateProfileRecord } from './htmlPresentationTemplates'
import { validateFinalHtmlSlides } from './htmlPresentationSlideValidation'

/** Templates with explicit per-slide slot mapping may use adapter-fast; none enabled yet. */
export const BEAUTIFUL_TEMPLATE_ADAPTER_FAST_SLUGS = new Set<string>([])

export function hasBeautifulTemplateAdapterFastMapping(templateSlug: string): boolean {
  return BEAUTIFUL_TEMPLATE_ADAPTER_FAST_SLUGS.has(templateSlug.trim().toLowerCase())
}

export function renderSafeFastPresentationHtml(input: {
  contentModel: ContentModelRecord
  templateProfile: TemplateProfileRecord
  artifactId?: string
  assetsBaseDir?: string
}): string {
  const html = rebuildHtmlPresentationFromContentModel({
    contentModel: input.contentModel,
    templateProfile: input.templateProfile,
    artifactId: input.artifactId,
  })
  return injectEditRuntime(
    injectSharedStyles(html),
    input.contentModel.deckId || input.contentModel.title || 'deck',
  )
}

export function finalizeSafeFastPresentationHtml(input: {
  contentModel: ContentModelRecord
  templateProfile: TemplateProfileRecord
  appliedTemplateSlug: string
  artifactId?: string
  assetsBaseDir?: string
}): {
  html: string
  validation: ReturnType<typeof validateFinalHtmlSlides>
} {
  let html = renderSafeFastPresentationHtml({
    contentModel: input.contentModel,
    templateProfile: input.templateProfile,
    artifactId: input.artifactId,
    assetsBaseDir: input.assetsBaseDir,
  })
  html = sanitizePresentationHtmlImages({
    html,
    contentModel: input.contentModel,
    assetsBaseDir: input.assetsBaseDir,
    artifactId: input.artifactId,
  })
  html = injectHtmlSlidesTemplateMarkers(html, input.appliedTemplateSlug)
  const validation = validateFinalHtmlSlides(html, { minSlides: Math.min(2, input.contentModel.slides.length) })
  return { html, validation }
}
