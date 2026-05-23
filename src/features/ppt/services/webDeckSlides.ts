import type { PptSlidePreview } from '../../../contexts/GenerationWorkbenchContext'

function pickString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function pickStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const items = value
    .map((item) => pickString(item))
    .filter((item): item is string => Boolean(item))
  return items.length > 0 ? items : undefined
}

function pickSlots(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

export function mergeDeckIntoLiveSlides(deck: unknown, previousSlides: PptSlidePreview[]): PptSlidePreview[] {
  const rawSlides = deck && typeof deck === 'object' && Array.isArray((deck as { slides?: unknown[] }).slides)
    ? (deck as { slides: Array<Record<string, unknown>> }).slides
    : []
  if (rawSlides.length === 0) return previousSlides

  return rawSlides.map((slide, index) => {
    const current = previousSlides[index]
    const slots = pickSlots(slide.slots)
    const items = pickStringArray(slide.items)
      ?? pickStringArray(slots?.body)
      ?? current?.items
      ?? []
    const type = pickString(slide.type) ?? pickString(slide.intent) ?? current?.type ?? 'content'
    const title = pickString(slide.title)
      ?? pickString(slide.heading)
      ?? pickString(slots?.title)
      ?? current?.title
      ?? current?.heading
      ?? `第 ${index + 1} 页`
    const subtitle = pickString(slide.subtitle) ?? pickString(slots?.subtitle) ?? current?.subtitle
    const summary = pickString(slide.summary) ?? current?.summary
    const body = pickString(slide.body)
      ?? (type === 'cover' ? undefined : summary)
      ?? current?.body

    return {
      index: typeof slide.index === 'number' ? slide.index : index,
      type,
      title,
      subtitle,
      heading: pickString(slide.heading) ?? title,
      body,
      items,
      summary,
      speakerNotes: pickString(slide.speakerNotes) ?? pickString(slide.notes) ?? current?.speakerNotes,
      notes: pickString(slide.notes) ?? pickString(slide.speakerNotes) ?? current?.notes,
      visualBrief: pickString(slide.visualBrief) ?? current?.visualBrief,
      imagePath: current?.imagePath ?? null,
      imageLoading: false,
      isGenerating: false,
      leftTitle: pickString(slide.leftTitle) ?? current?.leftTitle,
      leftItems: pickStringArray(slide.leftItems) ?? current?.leftItems,
      rightTitle: pickString(slide.rightTitle) ?? current?.rightTitle,
      rightItems: pickStringArray(slide.rightItems) ?? current?.rightItems,
      metrics: Array.isArray(slide.metrics) ? slide.metrics as PptSlidePreview['metrics'] : current?.metrics,
      timeline: Array.isArray(slide.timeline) ? slide.timeline as PptSlidePreview['timeline'] : current?.timeline,
    }
  })
}
