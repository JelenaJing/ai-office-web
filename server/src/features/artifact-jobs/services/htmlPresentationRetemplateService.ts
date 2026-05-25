import fs from 'fs'
import path from 'path'
import {
  rebuildHtmlPresentationFromContentModel,
  type ContentModelRecord,
} from './htmlPresentationPostProcess'
import {
  resolveTemplateSelection,
  type HtmlPresentationJobOptions,
} from './htmlPresentationTemplates'

export interface RetemplateResult {
  outputPath: string
  templateSlug: string
  tokenUsed: false
}

export function retemplateHtmlPresentationFromContentModel(input: {
  contentModelPath: string
  outputHtmlPath: string
  nextTemplateSlug: string
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

  const html = rebuildHtmlPresentationFromContentModel({
    contentModel: nextContentModel,
    templateProfile: selection.templateProfile,
  })

  fs.mkdirSync(path.dirname(input.outputHtmlPath), { recursive: true })
  fs.writeFileSync(input.outputHtmlPath, html, 'utf-8')

  // TODO(phase-1 follow-up): expose a POST route that accepts artifactId + templateSlug
  // and calls this function so template switching can happen without regenerating content.
  return {
    outputPath: input.outputHtmlPath,
    templateSlug: selection.selectedTemplateSlug,
    tokenUsed: false,
  }
}

