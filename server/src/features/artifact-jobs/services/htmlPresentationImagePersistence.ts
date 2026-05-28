import fs from 'fs'
import path from 'path'

import {
  createPlaceholderSvgMarkup,
  sanitizePresentationHtmlImages,
  type ContentModelRecord,
} from './htmlPresentationPostProcess'
import { assertArtifactJobNotCanceled, isArtifactJobCanceledError } from './artifactJobStore'
import type { HtmlPresentationJobOptions } from './htmlPresentationTemplates'
import {
  collectImageSlots,
  resolveImageBudget,
  type ImageBudget,
} from './htmlPresentationImageBudget'

export interface PersistHtmlPresentationImageParams {
  baseDir: string
  slideId: string
  blockId: string
  prompt: string
  alt?: string
}

export interface PersistHtmlPresentationImageResult {
  assetPath: string
  fileName: string
  mimeType: string
  placeholderUsed: boolean
}

let _imageServiceFns: {
  isImageServiceConfigured: () => boolean
  generateImagePng: (input: { prompt: string }) => Promise<{ png: Buffer }>
} | null = null

async function loadImageService() {
  if (_imageServiceFns !== null) return _imageServiceFns
  try {
    const mod = await import('../../image/services')
    _imageServiceFns = {
      isImageServiceConfigured: mod.isImageServiceConfigured as () => boolean,
      generateImagePng: mod.generateImagePng as (input: { prompt: string }) => Promise<{ png: Buffer }>,
    }
  } catch {
    _imageServiceFns = {
      isImageServiceConfigured: () => false,
      generateImagePng: async () => ({ png: Buffer.alloc(0) }),
    }
  }
  return _imageServiceFns
}

export async function isHtmlPresentationImageProviderConfigured(): Promise<boolean> {
  const imgSvc = await loadImageService()
  return imgSvc.isImageServiceConfigured()
}

/**
 * Write a slide image under baseDir/assets/. Returns relative assetPath on success.
 * Throws when the provider is missing or returns empty output (caller may fall back to SVG).
 */
export async function persistHtmlPresentationImage(
  params: PersistHtmlPresentationImageParams,
): Promise<PersistHtmlPresentationImageResult> {
  const { baseDir, slideId, blockId, prompt } = params
  const assetsDir = path.join(baseDir, 'assets')
  fs.mkdirSync(assetsDir, { recursive: true })

  const imgSvc = await loadImageService()
  if (!imgSvc.isImageServiceConfigured()) {
    throw new Error('image service not configured')
  }

  const result = await imgSvc.generateImagePng({ prompt })
  const pngBuffer = result.png
  if (!pngBuffer || pngBuffer.length === 0) {
    throw new Error('empty image buffer from provider')
  }

  const fileName = `${slideId}-${blockId}.png`
  fs.writeFileSync(path.join(assetsDir, fileName), pngBuffer)
  return {
    assetPath: `assets/${fileName}`,
    fileName,
    mimeType: 'image/png',
    placeholderUsed: false,
  }
}

export function writeHtmlPresentationPlaceholderImage(params: {
  baseDir: string
  slideId: string
  blockId: string
  title: string
  prompt: string
}): PersistHtmlPresentationImageResult {
  const assetsDir = path.join(params.baseDir, 'assets')
  fs.mkdirSync(assetsDir, { recursive: true })
  const fileName = `${params.slideId}-${params.blockId}-placeholder.svg`
  fs.writeFileSync(
    path.join(assetsDir, fileName),
    createPlaceholderSvgMarkup(params.title, params.prompt),
    'utf-8',
  )
  return {
    assetPath: `assets/${fileName}`,
    fileName,
    mimeType: 'image/svg+xml',
    placeholderUsed: true,
  }
}

function upsertContentModelAsset(
  assets: ContentModelRecord['assets'],
  entry: ContentModelRecord['assets'][number],
): ContentModelRecord['assets'] {
  const nextAssets = assets.map((asset) => (
    asset.blockId === entry.blockId && asset.slideId === entry.slideId
      ? { ...asset, ...entry }
      : asset
  ))
  const exists = nextAssets.some((asset) => asset.blockId === entry.blockId && asset.slideId === entry.slideId)
  return exists ? nextAssets : [...nextAssets, entry]
}

function patchContentModelImageBlock(
  model: ContentModelRecord,
  slideId: string,
  blockId: string,
  imagePrompt: string,
  assetPath: string,
  placeholderUsed: boolean,
): ContentModelRecord {
  const nextAssetEntry = {
    blockId,
    slideId,
    assetPath,
    imagePrompt,
    placeholderUsed,
  }
  return {
    ...model,
    updatedAt: new Date().toISOString(),
    assets: upsertContentModelAsset(model.assets, nextAssetEntry),
    slides: model.slides.map((slide) => {
      if (slide.id !== slideId) return slide
      const updatedBlocks = slide.blocks.map((block) => {
        if (block.id !== blockId) return block
        return { ...block, imagePrompt, assetPath, placeholderUsed }
      })
      const updatedVisual =
        slide.visual && slide.visual.type !== 'none'
          ? { ...slide.visual, prompt: imagePrompt, assetPath, type: 'image' as const }
          : slide.visual
      return { ...slide, blocks: updatedBlocks, visual: updatedVisual }
    }),
  }
}

export async function syncHtmlPresentationImagesFromContentModel(input: {
  htmlPath: string
  contentModel: ContentModelRecord
}): Promise<void> {
  if (!fs.existsSync(input.htmlPath)) return
  const { patchImgTagInHtml } = await import('./htmlPresentationPatchService')
  let html = fs.readFileSync(input.htmlPath, 'utf-8')
  for (const slide of input.contentModel.slides) {
    for (const block of slide.blocks) {
      if (block.type !== 'image' || !block.assetPath) continue
      html = patchImgTagInHtml(
        html,
        block.id,
        block.assetPath,
        block.imagePrompt || slide.title || 'Slide visual',
        block.placeholderUsed ?? false,
      )
    }
  }
  fs.writeFileSync(input.htmlPath, html, 'utf-8')
}

export interface FulfillPlannedImagesParams {
  jobId: string
  outputDir: string
  htmlPath: string
  contentModelPath: string
  contentModel: ContentModelRecord
  options: HtmlPresentationJobOptions
  plannedBudget?: ImageBudget
  logAppend?: (line: string) => void
}

export interface FulfillPlannedImagesResult {
  contentModel: ContentModelRecord
  imageBudget: ImageBudget
  planned: number
  required: number
  optional: number
  unfilled: number
  generatedImageCount: number
  placeholderCount: number
}

export async function fulfillPlannedImages(
  params: FulfillPlannedImagesParams,
): Promise<FulfillPlannedImagesResult> {
  const { options, outputDir, htmlPath, contentModelPath } = params
  let contentModel = params.contentModel

  if (options.qualityMode !== 'high' || !options.enableImages || options.maxImages <= 0) {
    const imageBudget = resolveImageBudget({
      qualityMode: options.qualityMode,
      enableImages: options.enableImages,
      contentModel,
    })
    return {
      contentModel,
      imageBudget,
      planned: 0,
      required: 0,
      optional: 0,
      unfilled: 0,
      generatedImageCount: 0,
      placeholderCount: contentModel.assets.filter((asset) => asset.placeholderUsed !== false).length,
    }
  }

  const providerConfigured = await isHtmlPresentationImageProviderConfigured()
  params.logAppend?.(`imageProviderConfigured=${String(providerConfigured)}`)

  const slots = collectImageSlots(contentModel)
  const imageBudget = params.plannedBudget ?? resolveImageBudget({
    qualityMode: options.qualityMode,
    enableImages: options.enableImages,
    userMaxImages: options.maxImages > 0 && options.maxImages !== 4 ? options.maxImages : undefined,
    contentModel,
  })
  params.logAppend?.(
    `imageBudget qualityMode=${options.qualityMode} requiredImageCount=${imageBudget.requiredImageCount} optionalImageCount=${imageBudget.optionalImageCount} resolvedMaxImages=${imageBudget.maxImages} source=${imageBudget.source}`,
  )

  const requiredSlots = slots
    .filter((slot) => slot.required)
    .sort((a, b) => a.priority - b.priority)
  const optionalSlots = slots
    .filter((slot) => !slot.required)
    .sort((a, b) => a.priority - b.priority)
  const selectedSlots = [...requiredSlots, ...optionalSlots].slice(0, imageBudget.maxImages)
  const selectedSlotKey = new Set(selectedSlots.map((slot) => `${slot.slideId}:${slot.blockId}`))

  const toProcess: Array<{
    slideId: string
    blockId: string
    imagePrompt: string
    title: string
    required: boolean
  }> = []
  for (const slide of contentModel.slides) {
    for (const block of slide.blocks) {
      if (block.type !== 'image') continue
      const key = `${slide.id}:${block.id}`
      const slot = slots.find((candidate) => candidate.slideId === slide.id && candidate.blockId === block.id)
      const required = Boolean(slot?.required)
      if (!selectedSlotKey.has(key)) {
        if (!required) {
          contentModel = patchContentModelImageBlock(contentModel, slide.id, block.id, block.imagePrompt || '', '', false)
          params.logAppend?.(`imageUnfilled slideId=${slide.id} blockId=${block.id} required=false reason=over-budget`)
        }
        continue
      }
      if (!block.imagePrompt?.trim()) continue
      if (block.placeholderUsed === false && block.assetPath && !/placeholder/i.test(block.assetPath)) continue
      toProcess.push({
        slideId: slide.id,
        blockId: block.id,
        imagePrompt: block.imagePrompt.trim(),
        title: slide.title || 'Slide visual',
        required,
      })
    }
  }
  let generatedImageCount = 0

  for (const item of toProcess) {
    assertArtifactJobNotCanceled(params.jobId, 'image-fulfillment')
    try {
      const persisted = await persistHtmlPresentationImage({
        baseDir: outputDir,
        slideId: item.slideId,
        blockId: item.blockId,
        prompt: item.imagePrompt,
        alt: item.title,
      })
      contentModel = patchContentModelImageBlock(
        contentModel,
        item.slideId,
        item.blockId,
        item.imagePrompt,
        persisted.assetPath,
        false,
      )
      assertArtifactJobNotCanceled(params.jobId, 'image-fulfillment-after-provider')
      generatedImageCount += 1
      params.logAppend?.(
        `imageFulfilled slideId=${item.slideId} blockId=${item.blockId} required=${String(item.required)} assetPath=${persisted.assetPath}`,
      )
    } catch (error) {
      if (isArtifactJobCanceledError(error)) throw error
      const message = error instanceof Error ? error.message : String(error)
      const safeMessage = message.replace(/key|token|secret|password/gi, '[redacted]')
      const placeholder = writeHtmlPresentationPlaceholderImage({
        baseDir: outputDir,
        slideId: item.slideId,
        blockId: item.blockId,
        title: item.title,
        prompt: item.imagePrompt,
      })
      contentModel = patchContentModelImageBlock(
        contentModel,
        item.slideId,
        item.blockId,
        item.imagePrompt,
        placeholder.assetPath,
        true,
      )
      params.logAppend?.(
        `imageUnfilled slideId=${item.slideId} blockId=${item.blockId} required=${String(item.required)} reason=${safeMessage} fallback=${placeholder.assetPath}`,
      )
    }
  }

  const placeholderCount = contentModel.assets.filter((asset) => asset.placeholderUsed !== false).length
  const unfilled = Math.max(0, selectedSlots.length - generatedImageCount)

  fs.writeFileSync(contentModelPath, JSON.stringify(contentModel, null, 2), 'utf-8')
  await syncHtmlPresentationImagesFromContentModel({ htmlPath, contentModel })
  const sanitizedHtml = sanitizePresentationHtmlImages({
    html: fs.readFileSync(htmlPath, 'utf-8'),
    contentModel,
    assetsBaseDir: outputDir,
  })
  fs.writeFileSync(htmlPath, sanitizedHtml, 'utf-8')

  return {
    contentModel,
    imageBudget,
    planned: slots.length,
    required: requiredSlots.length,
    optional: optionalSlots.length,
    unfilled,
    generatedImageCount,
    placeholderCount,
  }
}
