import fs from 'fs'
import path from 'path'
import {
  rebuildHtmlPresentationFromContentModel,
  injectSharedStyles,
  injectEditRuntime,
  type ContentModelRecord,
} from './htmlPresentationPostProcess.js'
import {
  resolveTemplateSelection,
  type HtmlPresentationJobOptions,
  type TemplateProfileRecord,
} from './htmlPresentationTemplates.js'

export interface RetemplateResult {
  outputPath: string
  templateSlug: string
  tokenUsed: false
  sidecars: {
    contentModel: boolean
    templateProfile: boolean
  }
}

export function retemplateHtmlPresentationFromContentModel(input: {
  contentModelPath: string
  outputHtmlPath: string
  nextTemplateSlug: string
  /** artifactDir is needed to persist updated content-model.json / template-profile.json in place */
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
    } satisfies HtmlPresentationJobOptions,
  })

  const nextContentModel: ContentModelRecord = {
    ...contentModel,
    templateSlug: selection.selectedTemplateSlug,
    theme: selection.templateProfile.colorScheme,
    updatedAt: new Date().toISOString(),
  }

  let html = rebuildHtmlPresentationFromContentModel({
    contentModel: nextContentModel,
    templateProfile: selection.templateProfile,
  })

  // Inject shared styles and edit runtime (use deckId = contentModel.deckId for localStorage continuity)
  html = injectSharedStyles(html)
  html = injectEditRuntime(html, contentModel.deckId || contentModel.title || 'deck')

  fs.mkdirSync(path.dirname(input.outputHtmlPath), { recursive: true })
  fs.writeFileSync(input.outputHtmlPath, html, 'utf-8')

  // Persist updated sidecars in artifact dir
  let contentModelSaved = false
  let templateProfileSaved = false
  try {
    fs.writeFileSync(
      path.join(input.artifactDir, 'content-model.json'),
      JSON.stringify(nextContentModel, null, 2),
      'utf-8',
    )
    contentModelSaved = true
  } catch { /* non-fatal */ }

  try {
    const profile: TemplateProfileRecord = selection.templateProfile
    fs.writeFileSync(
      path.join(input.artifactDir, 'template-profile.json'),
      JSON.stringify(profile, null, 2),
      'utf-8',
    )
    templateProfileSaved = true
  } catch { /* non-fatal */ }

  return {
    outputPath: input.outputHtmlPath,
    templateSlug: selection.selectedTemplateSlug,
    tokenUsed: false,
    sidecars: {
      contentModel: contentModelSaved,
      templateProfile: templateProfileSaved,
    },
  }
}


