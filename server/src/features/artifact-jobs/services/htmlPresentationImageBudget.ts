import type { ContentModelRecord } from './htmlPresentationPostProcess'

export type ImageBudgetSource =
  | 'fast-disabled'
  | 'user'
  | 'template'
  | 'content-model'
  | 'default'

export interface ImageBudget {
  maxImages: number
  requiredImageCount: number
  optionalImageCount: number
  source: ImageBudgetSource
}

export interface ImageSlot {
  slideId: string
  blockId: string
  imagePrompt?: string
  assetPath?: string
  placeholderUsed?: boolean
  required: boolean
  priority: number
}

function inferImageSlotRequired(
  block: ContentModelRecord['slides'][number]['blocks'][number],
  slide: ContentModelRecord['slides'][number],
): boolean {
  void slide
  if (block.type !== 'image') return false
  const imagePrompt = (block.imagePrompt || '').trim()
  if (imagePrompt) return true
  if (block.placeholderUsed && /placeholder/i.test((block.assetPath || '').trim())) return true
  return false
}

function inferImageSlotPriority(
  slide: ContentModelRecord['slides'][number],
): number {
  if (slide.role === 'cover') return 1
  if (slide.role === 'section') return 2
  if (slide.role === 'image') return 3
  if (slide.role === 'timeline') return 4
  if (slide.role === 'content') return 5
  return 9
}

export function collectImageSlots(contentModel: ContentModelRecord): ImageSlot[] {
  const slots: ImageSlot[] = []
  for (const slide of contentModel.slides ?? []) {
    for (const block of slide.blocks ?? []) {
      if (block.type !== 'image') continue
      slots.push({
        slideId: slide.id,
        blockId: block.id,
        imagePrompt: block.imagePrompt,
        assetPath: block.assetPath,
        placeholderUsed: block.placeholderUsed,
        required: inferImageSlotRequired(block, slide),
        priority: inferImageSlotPriority(slide),
      })
    }
  }
  return slots
}

export function resolveImageBudget(params: {
  qualityMode: 'fast' | 'high'
  enableImages: boolean
  userMaxImages?: number
  contentModel?: ContentModelRecord
}): ImageBudget {
  if (params.qualityMode !== 'high' || !params.enableImages) {
    return {
      maxImages: 0,
      requiredImageCount: 0,
      optionalImageCount: 0,
      source: 'fast-disabled',
    }
  }
  const slots = params.contentModel ? collectImageSlots(params.contentModel) : []
  const requiredImageCount = slots.filter((slot) => slot.required).length
  const optionalImageCount = Math.max(0, slots.length - requiredImageCount)
  if (typeof params.userMaxImages === 'number' && Number.isFinite(params.userMaxImages) && params.userMaxImages > 0) {
    return {
      maxImages: Math.max(Math.trunc(params.userMaxImages), requiredImageCount),
      requiredImageCount,
      optionalImageCount,
      source: 'user',
    }
  }
  const requiredFloor = Math.max(requiredImageCount, 4)
  return {
    maxImages: Math.min(requiredFloor, 8),
    requiredImageCount,
    optionalImageCount,
    source: slots.length > 0 ? 'content-model' : 'default',
  }
}
