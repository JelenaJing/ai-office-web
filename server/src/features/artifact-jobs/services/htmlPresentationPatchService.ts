import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

import {
  escapeHtml,
  escapeAttribute,
  createPlaceholderDataUri,
  type ContentModelRecord,
} from './htmlPresentationPostProcess.js'

// ---------------------------------------------------------------------------
// Image service integration (optional — falls back to SVG placeholder)
// ---------------------------------------------------------------------------

let _imageServiceFns: {
  isImageServiceConfigured: () => boolean
  generateImagePng: (input: { prompt: string }) => Promise<{ png: Buffer }>
} | null = null

async function loadImageService() {
  if (_imageServiceFns !== null) return _imageServiceFns
  try {
    // Dynamic import to avoid hard dependency when image service is absent
    const mod = await import('../../image/services/index.js')
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

// ---------------------------------------------------------------------------
// Patch log
// ---------------------------------------------------------------------------

interface PatchLogEntry {
  patchId: string
  op: string
  slideId: string
  blockId: string
  text?: string
  imagePrompt?: string
  assetPath?: string
  placeholderUsed?: boolean
  createdAt: string
}

function loadPatchLog(artifactDir: string): PatchLogEntry[] {
  const logPath = path.join(artifactDir, 'patches.json')
  if (!fs.existsSync(logPath)) return []
  try {
    return JSON.parse(fs.readFileSync(logPath, 'utf-8')) as PatchLogEntry[]
  } catch {
    return []
  }
}

function savePatchLog(artifactDir: string, entries: PatchLogEntry[]): void {
  const logPath = path.join(artifactDir, 'patches.json')
  fs.writeFileSync(logPath, JSON.stringify(entries, null, 2), 'utf-8')
}

function appendPatchEntry(artifactDir: string, entry: PatchLogEntry): void {
  const entries = loadPatchLog(artifactDir)
  entries.push(entry)
  savePatchLog(artifactDir, entries)
}

// ---------------------------------------------------------------------------
// HTML patching helpers
// ---------------------------------------------------------------------------

const TEXT_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li', 'figcaption', 'blockquote', 'small', 'span', 'td', 'th', 'dt', 'dd', 'caption']

/**
 * Replace the textContent of the element whose data-block-id matches `blockId`.
 * Returns updated HTML or original if no match found.
 */
export function patchTextInHtml(html: string, blockId: string, newText: string): string {
  const safeBlockId = blockId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  for (const tag of TEXT_TAGS) {
    const pattern = new RegExp(
      `(<${tag}\\b[^>]*data-block-id="${safeBlockId}"[^>]*>)([\\s\\S]*?)(<\\/${tag}>)`,
      'i',
    )
    const match = html.match(pattern)
    if (match) {
      return html.replace(pattern, `$1${escapeHtml(newText)}$3`)
    }
  }
  return html
}

/**
 * Replace src and data-image-prompt attributes on an img tag whose parent has data-block-id.
 * Also handles replacing a placeholder SVG inline element at the block level.
 */
export function patchImgTagInHtml(html: string, blockId: string, newSrc: string, newPrompt: string): string {
  const safeBlockId = blockId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const safePrompt = escapeAttribute(newPrompt)

  // Case 1: img tag with data-block-id directly
  let updated = html.replace(
    new RegExp(`(<img\\b[^>]*data-block-id="${safeBlockId}"[^>]*)(?:src=(["'])[^"']*\\2)?([^>]*>)`, 'i'),
    (_m, pre, _q, post) => {
      let result = pre
      if (result.includes('src=')) {
        result = result.replace(/\ssrc=(["'])[^"']*\1/, ` src="${escapeAttribute(newSrc)}"`)
      } else {
        result += ` src="${escapeAttribute(newSrc)}"`
      }
      if (result.includes('data-image-prompt=')) {
        result = result.replace(/\sdata-image-prompt=(["'])[^"']*\1/, ` data-image-prompt="${safePrompt}"`)
      } else {
        result += ` data-image-prompt="${safePrompt}"`
      }
      return result + post
    },
  )
  if (updated !== html) return updated

  // Case 2: block wrapper (div/figure/section) with data-block-id contains an img
  updated = html.replace(
    new RegExp(
      `(<(?:div|figure|section|picture)\\b[^>]*data-block-id="${safeBlockId}"[^>]*>[\\s\\S]*?)(<img\\b)([^>]*>)([\\s\\S]*?<\\/(?:div|figure|section|picture)>)`,
      'i',
    ),
    (_m, before, imgOpen, imgAttrs, after) => {
      let patchedAttrs = imgAttrs
      if (patchedAttrs.includes('src=')) {
        patchedAttrs = patchedAttrs.replace(/\ssrc=(["'])[^"']*\1/, ` src="${escapeAttribute(newSrc)}"`)
      } else {
        patchedAttrs = ` src="${escapeAttribute(newSrc)}"` + patchedAttrs
      }
      if (patchedAttrs.includes('data-image-prompt=')) {
        patchedAttrs = patchedAttrs.replace(/\sdata-image-prompt=(["'])[^"']*\1/, ` data-image-prompt="${safePrompt}"`)
      } else {
        patchedAttrs += ` data-image-prompt="${safePrompt}"`
      }
      return before + imgOpen + patchedAttrs + after
    },
  )
  return updated
}

// ---------------------------------------------------------------------------
// content-model.json helpers
// ---------------------------------------------------------------------------

function loadContentModel(artifactDir: string): ContentModelRecord | null {
  const modelPath = path.join(artifactDir, 'content-model.json')
  if (!fs.existsSync(modelPath)) return null
  try {
    return JSON.parse(fs.readFileSync(modelPath, 'utf-8')) as ContentModelRecord
  } catch {
    return null
  }
}

function saveContentModel(artifactDir: string, model: ContentModelRecord): void {
  const modelPath = path.join(artifactDir, 'content-model.json')
  fs.writeFileSync(modelPath, JSON.stringify(model, null, 2), 'utf-8')
}

function patchContentModelText(model: ContentModelRecord, slideId: string, blockId: string, text: string): ContentModelRecord {
  return {
    ...model,
    updatedAt: new Date().toISOString(),
    slides: model.slides.map((slide) => {
      if (slide.id !== slideId) return slide
      return {
        ...slide,
        blocks: slide.blocks.map((block) => {
          if (block.id !== blockId) return block
          return { ...block, text }
        }),
      }
    }),
  }
}

function patchContentModelImage(
  model: ContentModelRecord,
  slideId: string,
  blockId: string,
  imagePrompt: string,
  assetPath: string,
): ContentModelRecord {
  return {
    ...model,
    updatedAt: new Date().toISOString(),
    slides: model.slides.map((slide) => {
      if (slide.id !== slideId) return slide
      const updatedBlocks = slide.blocks.map((block) => {
        if (block.id !== blockId) return block
        return { ...block, imagePrompt, assetPath }
      })
      const updatedVisual =
        slide.visual && (slide.visual.assetPath === '' || slide.visual.type !== 'none')
          ? { ...slide.visual, prompt: imagePrompt, assetPath }
          : slide.visual
      return { ...slide, blocks: updatedBlocks, visual: updatedVisual }
    }),
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface TextPatchParams {
  op: 'replace_text'
  slideId: string
  blockId: string
  text: string
}

export interface TextPatchResult {
  success: boolean
  patchId: string
  updatedAt: string
  tokenUsed: false
}

export async function applyHtmlPresentationPatch(
  artifactDir: string,
  params: TextPatchParams,
): Promise<TextPatchResult> {
  const { slideId, blockId, text } = params
  const htmlPath = path.join(artifactDir, 'index.html')

  // Update HTML
  if (fs.existsSync(htmlPath)) {
    const html = fs.readFileSync(htmlPath, 'utf-8')
    const patched = patchTextInHtml(html, blockId, text)
    fs.writeFileSync(htmlPath, patched, 'utf-8')
  }

  // Update content-model.json
  const model = loadContentModel(artifactDir)
  if (model) {
    saveContentModel(artifactDir, patchContentModelText(model, slideId, blockId, text))
  }

  const patchId = randomUUID()
  const updatedAt = new Date().toISOString()
  appendPatchEntry(artifactDir, { patchId, op: 'replace_text', slideId, blockId, text, createdAt: updatedAt })

  return { success: true, patchId, updatedAt, tokenUsed: false }
}

export interface ImagePatchParams {
  slideId: string
  blockId: string
  imagePrompt: string
}

export interface ImagePatchResult {
  success: boolean
  artifactId?: string
  assetPath: string
  assetDataUri: string
  placeholderUsed: boolean
  tokenUsed: false
}

export async function generateHtmlPresentationImage(
  artifactDir: string,
  params: ImagePatchParams,
): Promise<ImagePatchResult> {
  const { slideId, blockId, imagePrompt } = params
  const assetsDir = path.join(artifactDir, 'assets')
  fs.mkdirSync(assetsDir, { recursive: true })

  let assetPath = ''
  let assetDataUri = ''
  let placeholderUsed = false

  // Try real image generation
  try {
    const imgSvc = await loadImageService()
    if (imgSvc.isImageServiceConfigured()) {
      const result = await imgSvc.generateImagePng({ prompt: imagePrompt })
      const pngBuffer = result.png
      if (pngBuffer && pngBuffer.length > 0) {
        const filename = `${slideId}-${blockId}.png`
        const fullPath = path.join(assetsDir, filename)
        fs.writeFileSync(fullPath, pngBuffer)
        assetPath = `assets/${filename}`
        assetDataUri = `data:image/png;base64,${pngBuffer.toString('base64')}`
      } else {
        throw new Error('empty image buffer')
      }
    } else {
      throw new Error('image service not configured')
    }
  } catch (_err) {
    placeholderUsed = true
    const svgDataUri = createPlaceholderDataUri(imagePrompt, imagePrompt)
    const svgContent = decodeURIComponent(svgDataUri.replace('data:image/svg+xml;charset=utf-8,', ''))
    const filename = `${slideId}-${blockId}-placeholder.svg`
    const fullPath = path.join(assetsDir, filename)
    fs.writeFileSync(fullPath, svgContent, 'utf-8')
    assetPath = `assets/${filename}`
    assetDataUri = svgDataUri
  }

  // Update HTML
  const htmlPath = path.join(artifactDir, 'index.html')
  if (fs.existsSync(htmlPath)) {
    const html = fs.readFileSync(htmlPath, 'utf-8')
    const patched = patchImgTagInHtml(html, blockId, assetDataUri, imagePrompt)
    fs.writeFileSync(htmlPath, patched, 'utf-8')
  }

  // Update content-model.json
  const model = loadContentModel(artifactDir)
  if (model) {
    saveContentModel(artifactDir, patchContentModelImage(model, slideId, blockId, imagePrompt, assetPath))
  }

  const patchId = randomUUID()
  const updatedAt = new Date().toISOString()
  appendPatchEntry(artifactDir, {
    patchId,
    op: 'replace_image',
    slideId,
    blockId,
    imagePrompt,
    assetPath,
    placeholderUsed,
    createdAt: updatedAt,
  })

  return { success: true, assetPath, assetDataUri, placeholderUsed, tokenUsed: false }
}
