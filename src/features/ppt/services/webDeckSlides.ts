import type { PptSlidePreview } from '../../../contexts/GenerationWorkbenchContext'

function pickString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function pickStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const items = value.map((item) => pickString(item)).filter((item): item is string => Boolean(item))
  return items.length > 0 ? items : undefined
}

function pickObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function pickTimeline(value: unknown): PptSlidePreview['timeline'] | undefined {
  if (!Array.isArray(value)) return undefined
  const timeline = value
    .map((entry) => {
      const raw = pickObject(entry)
      if (!raw) return null
      const title = pickString(raw.title)
      const detail = pickString(raw.detail)
      if (!title && !detail) return null
      return {
        title: title || detail || '',
        detail,
      }
    })
    .filter((item): item is NonNullable<PptSlidePreview['timeline']>[number] => Boolean(item))
  return timeline.length > 0 ? timeline : undefined
}

function pickPreviewImages(value: unknown): Array<{ slideId?: string; index: number; previewImageUrl?: string; previewHtmlUrl?: string }> {
  if (!Array.isArray(value)) return []
  return value
    .map((entry, index) => {
      const raw = pickObject(entry)
      if (!raw) return null
      const previewImageUrl = pickString(raw.previewImageUrl)
      const previewHtmlUrl = pickString(raw.previewHtmlUrl)
      if (!previewImageUrl && !previewHtmlUrl) return null
      return {
        slideId: pickString(raw.slideId),
        index: typeof raw.index === 'number' ? raw.index : index,
        previewImageUrl,
        previewHtmlUrl,
      }
    })
    .filter((item): item is { slideId?: string; index: number; previewImageUrl?: string; previewHtmlUrl?: string } => Boolean(item))
}

function pickTable(value: unknown): PptSlidePreview['table'] | undefined {
  const raw = pickObject(value)
  if (!raw) return undefined
  const headers = pickStringArray(raw.headers) || []
  const rows = Array.isArray(raw.rows)
    ? raw.rows
        .map((row) => Array.isArray(row) ? row.map((cell) => pickString(cell)).filter((cell): cell is string => Boolean(cell)) : [])
        .filter((row) => row.length > 0)
    : []
  return headers.length > 0 || rows.length > 0 ? { headers, rows } : undefined
}

function pickColumns(value: unknown): PptSlidePreview['columns'] | undefined {
  if (!Array.isArray(value)) return undefined
  const columns = value
    .map((entry, index) => {
      const raw = pickObject(entry)
      if (!raw) return null
      return {
        title: pickString(raw.title) || `栏目 ${index + 1}`,
        items: pickStringArray(raw.items) || [],
      }
    })
    .filter((item): item is NonNullable<PptSlidePreview['columns']>[number] => Boolean(item))
  return columns.length > 0 ? columns : undefined
}

function pickQuote(value: unknown): PptSlidePreview['quote'] | undefined {
  const raw = pickObject(value)
  if (!raw) return undefined
  const text = pickString(raw.text)
  if (!text) return undefined
  return {
    text,
    author: pickString(raw.author),
  }
}

export function toPptSlidePreview(slide: Record<string, unknown>, index: number, current?: PptSlidePreview): PptSlidePreview {
  const slots = pickObject(slide.slots)
  const raw = pickObject(slide.raw)
  const bullets = pickStringArray(slide.bullets)
    ?? pickStringArray(slide.items)
    ?? pickStringArray(slots?.body)
    ?? current?.bullets
    ?? current?.items
    ?? []
  const title = pickString(slide.title)
    ?? pickString(slide.heading)
    ?? pickString(slots?.title)
    ?? current?.title
    ?? current?.heading
    ?? `第 ${index + 1} 页`
  const subtitle = pickString(slide.subtitle)
    ?? pickString(slots?.subtitle)
    ?? pickString(raw?.subtitle)
    ?? current?.subtitle
  const layout = pickString(slide.layout)
    ?? pickString(slide.layoutId)
    ?? pickString(raw?.layout)
    ?? current?.layout
    ?? 'content'
  return {
    id: pickString(slide.id) ?? current?.id ?? `slide-${index + 1}`,
    index: typeof slide.index === 'number' ? slide.index : index,
    type: pickString(slide.type) ?? pickString(slide.intent) ?? current?.type ?? 'content',
    title,
    subtitle,
    heading: pickString(slide.heading) ?? title,
    body: pickString(slide.body) ?? pickString(slide.summary) ?? current?.body,
    items: bullets,
    bullets,
    summary: pickString(slide.summary) ?? current?.summary,
    speakerNotes: pickString(slide.speakerNotes) ?? pickString(slide.notes) ?? current?.speakerNotes,
    notes: pickString(slide.notes) ?? pickString(slide.speakerNotes) ?? current?.notes,
    visualBrief: pickString(slide.visualBrief) ?? current?.visualBrief,
    metrics: Array.isArray(slide.metrics) ? slide.metrics as PptSlidePreview['metrics'] : current?.metrics,
    timeline: pickTimeline(slide.timeline ?? raw?.timeline) ?? current?.timeline,
    table: pickTable(slide.table ?? raw?.table) ?? current?.table,
    columns: pickColumns(slide.columns ?? raw?.columns) ?? current?.columns,
    quote: pickQuote(slide.quote ?? raw?.quote) ?? current?.quote,
    layout,
    previewImageUrl: pickString(slide.previewImageUrl) ?? pickString(raw?.previewImageUrl) ?? current?.previewImageUrl ?? current?.imagePath ?? null,
    raw: { ...(current?.raw || {}), ...(raw || {}), ...slide },
    modified: typeof slide.modified === 'boolean' ? slide.modified : current?.modified,
    modifiedAt: pickString(slide.modifiedAt) ?? current?.modifiedAt,
    imagePath: pickString(slide.imagePath) ?? current?.imagePath ?? null,
    imageLoading: false,
    isGenerating: false,
    leftTitle: pickString(slide.leftTitle) ?? current?.leftTitle,
    leftItems: pickStringArray(slide.leftItems) ?? current?.leftItems,
    rightTitle: pickString(slide.rightTitle) ?? current?.rightTitle,
    rightItems: pickStringArray(slide.rightItems) ?? current?.rightItems,
  }
}

export function mergeDeckIntoLiveSlides(deck: unknown, previousSlides: PptSlidePreview[]): PptSlidePreview[] {
  const rawDeck = pickObject(deck)
  const nestedDeck = pickObject(rawDeck?.deck)
  const previewImages = pickPreviewImages(rawDeck?.previewImages ?? nestedDeck?.previewImages)
  const previewBySlideId = new Map<string, { previewImageUrl?: string; previewHtmlUrl?: string }>()
  const previewByIndex = new Map<number, { previewImageUrl?: string; previewHtmlUrl?: string }>()
  previewImages.forEach((preview) => {
    if (preview.slideId) previewBySlideId.set(preview.slideId, preview)
    previewByIndex.set(preview.index, preview)
  })
  const rawSlides = Array.isArray(rawDeck?.slides)
    ? rawDeck.slides as Array<Record<string, unknown>>
    : Array.isArray(nestedDeck?.slides)
      ? nestedDeck.slides as Array<Record<string, unknown>>
    : []
  if (rawSlides.length === 0) return previousSlides
  return rawSlides.map((slide, index) => {
    const slideId = pickString(slide.id)
    const preview = (slideId ? previewBySlideId.get(slideId) : null) || previewByIndex.get(index)
    const nextSlide = preview
      ? {
          ...slide,
          previewImageUrl: pickString(slide.previewImageUrl) || preview.previewImageUrl,
          previewHtmlUrl: pickString(slide.previewHtmlUrl) || preview.previewHtmlUrl,
        }
      : slide
    return toPptSlidePreview(nextSlide, index, previousSlides[index])
  })
}

export function replaceSlideInPreviews(slides: PptSlidePreview[], updatedSlide: unknown): PptSlidePreview[] {
  if (!updatedSlide || typeof updatedSlide !== 'object') return slides
  const raw = updatedSlide as Record<string, unknown>
  const slideId = pickString(raw.id)
  const slideIndex = typeof raw.index === 'number' ? raw.index : null
  const index = slideId
    ? slides.findIndex((slide) => slide.id === slideId)
    : (slideIndex != null ? slides.findIndex((slide) => slide.index === slideIndex) : -1)
  if (index < 0) return slides
  return slides.map((slide, currentIndex) => (
    currentIndex === index ? toPptSlidePreview(raw, index, slide) : slide
  ))
}

export function buildNearbySlidesContext(slides: PptSlidePreview[], activeIndex: number): Array<Record<string, unknown>> {
  return slides
    .filter((_, index) => Math.abs(index - activeIndex) <= 1 && index !== activeIndex)
    .map((slide) => ({
      id: slide.id,
      index: slide.index,
      title: slide.title,
      subtitle: slide.subtitle,
      bullets: slide.bullets || slide.items || [],
      layout: slide.layout,
    }))
}

export function createMinimalPptLiveSlides(title: string, message?: string): PptSlidePreview[] {
  const text = message || 'PPT 已生成，可下载查看完整文件。'
  return [
    {
      id: 'slide-1',
      index: 0,
      type: 'cover',
      title: title || '演示文稿',
      subtitle: text,
      heading: title || '演示文稿',
      body: text,
      items: [text],
      bullets: [text],
      layout: 'cover',
      previewImageUrl: null,
      raw: { layout: 'cover' },
      imagePath: null,
      imageLoading: false,
      isGenerating: false,
    },
  ]
}
