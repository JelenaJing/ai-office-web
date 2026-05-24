import fs from 'fs'
import path from 'path'
import PptxGenJS from 'pptxgenjs'
import type { WebDeckDocument, WebDeckPreviewImage, WebDeckSlide } from '../types'

type DeckSlideType = 'cover' | 'toc' | 'content' | 'summary'
type LayoutVariant = 'content' | 'section-divider' | 'cards' | 'timeline' | 'comparison' | 'table' | 'two-column' | 'quote'

interface DeckTemplateTheme {
  id: string
  name: string
  primary: string
  secondary: string
  accent: string
  light: string
  bg: string
  badgeLabel: string
}

interface RenderableSlide {
  id: string
  index: number
  type: DeckSlideType
  title: string
  subtitle?: string
  bullets: string[]
  layoutVariant: LayoutVariant
  table?: { headers: string[]; rows: string[][] }
  timeline?: Array<{ title: string; detail?: string }>
  columns?: Array<{ title: string; items: string[] }>
  quote?: { text: string; author?: string }
}

const PPT_WIDTH = 10
const PPT_HEIGHT = 5.625
const SVG_WIDTH = 1600
const SVG_HEIGHT = 900
const SVG_SCALE_X = SVG_WIDTH / PPT_WIDTH
const SVG_SCALE_Y = SVG_HEIGHT / PPT_HEIGHT
const DEFAULT_FONT_FACE = 'Microsoft YaHei, Arial, sans-serif'

const TEMPLATE_THEMES: DeckTemplateTheme[] = [
  {
    id: 'business_report',
    name: '商务汇报',
    primary: '15324B',
    secondary: '385D7A',
    accent: '2563EB',
    light: 'DBEAFE',
    bg: 'F4F8FC',
    badgeLabel: 'Business',
  },
  {
    id: 'academic_defense',
    name: '学术答辩',
    primary: '1E3A8A',
    secondary: '334155',
    accent: 'F59E0B',
    light: 'DBEAFE',
    bg: 'F8FAFC',
    badgeLabel: 'Defense',
  },
  {
    id: 'chinese_season',
    name: '中国风节气',
    primary: '7C2D12',
    secondary: '9A3412',
    accent: 'EA580C',
    light: 'FED7AA',
    bg: 'FFF7ED',
    badgeLabel: 'Season',
  },
]

function normalizeText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => normalizeText(item)).filter((item): item is string => Boolean(item))
}

function normalizeTimeline(value: unknown): Array<{ title: string; detail?: string }> | undefined {
  if (!Array.isArray(value)) return undefined
  const timeline = value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null
      const raw = entry as Record<string, unknown>
      const title = normalizeText(raw.title) || normalizeText(raw.detail)
      if (!title) return null
      return {
        title,
        detail: normalizeText(raw.detail),
      }
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
  return timeline.length > 0 ? timeline : undefined
}

function normalizeTable(value: unknown): { headers: string[]; rows: string[][] } | undefined {
  if (!value || typeof value !== 'object') return undefined
  const raw = value as Record<string, unknown>
  const headers = normalizeStringArray(raw.headers)
  const rows = Array.isArray(raw.rows)
    ? raw.rows
        .map((row) => Array.isArray(row) ? normalizeStringArray(row) : [])
        .filter((row) => row.length > 0)
    : []
  return headers.length > 0 || rows.length > 0 ? { headers, rows } : undefined
}

function normalizeColumns(value: unknown): Array<{ title: string; items: string[] }> | undefined {
  if (!Array.isArray(value)) return undefined
  const columns = value
    .map((entry, index) => {
      if (!entry || typeof entry !== 'object') return null
      const raw = entry as Record<string, unknown>
      return {
        title: normalizeText(raw.title) || `栏目 ${index + 1}`,
        items: normalizeStringArray(raw.items),
      }
    })
    .filter((item): item is { title: string; items: string[] } => Boolean(item))
  return columns.length > 0 ? columns : undefined
}

function normalizeQuote(value: unknown): { text: string; author?: string } | undefined {
  if (!value || typeof value !== 'object') return undefined
  const raw = value as Record<string, unknown>
  const text = normalizeText(raw.text)
  if (!text) return undefined
  return {
    text,
    author: normalizeText(raw.author),
  }
}

function normalizeSlideType(type: WebDeckSlide['type'], index: number, totalSlides: number): DeckSlideType {
  if (type === 'cover' || index === 0) return 'cover'
  if (type === 'toc') return 'toc'
  if (type === 'summary' || index === totalSlides - 1) return 'summary'
  return 'content'
}

function normalizeLayoutVariant(value: unknown, type: DeckSlideType): LayoutVariant {
  if (typeof value !== 'string') return type === 'cover' ? 'content' : 'content'
  const normalized = value.trim()
  const variants = new Set<LayoutVariant>(['content', 'section-divider', 'cards', 'timeline', 'comparison', 'table', 'two-column', 'quote'])
  return variants.has(normalized as LayoutVariant) ? normalized as LayoutVariant : 'content'
}

function extractDeckSlideItems(slide: WebDeckSlide): string[] {
  const body = Array.isArray(slide.slots?.body) ? normalizeStringArray(slide.slots.body) : []
  return normalizeStringArray(slide.items).length > 0
    ? normalizeStringArray(slide.items)
    : body
}

function toRenderableSlide(slide: WebDeckSlide, index: number, totalSlides: number): RenderableSlide {
  const raw = slide.raw && typeof slide.raw === 'object' ? slide.raw as Record<string, unknown> : {}
  const type = normalizeSlideType(slide.type, index, totalSlides)
  const bullets = extractDeckSlideItems(slide)
  return {
    id: slide.id,
    index,
    type,
    title: slide.title || `第 ${index + 1} 页`,
    subtitle: normalizeText(slide.subtitle) || normalizeText(raw.subtitle),
    bullets,
    layoutVariant: normalizeLayoutVariant(slide.layout || raw.layout || raw.layoutVariant, type),
    table: normalizeTable(slide.table ?? raw.table),
    timeline: normalizeTimeline(slide.timeline ?? raw.timeline),
    columns: normalizeColumns(slide.columns ?? raw.columns),
    quote: normalizeQuote(slide.quote ?? raw.quote),
  }
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function splitText(value: string, lineLength: number, maxLines = 3): string[] {
  const source = value.trim()
  if (!source) return []
  const lines: string[] = []
  let current = ''
  for (const char of source) {
    current += char
    if (current.length >= lineLength) {
      lines.push(current)
      current = ''
      if (lines.length >= maxLines) break
    }
  }
  if (lines.length < maxLines && current) lines.push(current)
  if (lines.length === maxLines && current) {
    lines[maxLines - 1] = `${lines[maxLines - 1].slice(0, Math.max(lines[maxLines - 1].length - 1, 1))}…`
  }
  return lines
}

function pxX(value: number): number {
  return Math.round(value * SVG_SCALE_X)
}

function pxY(value: number): number {
  return Math.round(value * SVG_SCALE_Y)
}

function buildSvgText(input: {
  x: number
  y: number
  lines: string[]
  fontSize: number
  fill: string
  fontWeight?: number
  anchor?: 'start' | 'middle' | 'end'
}): string {
  if (input.lines.length === 0) return ''
  const x = pxX(input.x)
  const y = pxY(input.y)
  const lineHeight = Math.round(input.fontSize * 1.4)
  const anchor = input.anchor || 'start'
  return `<text x="${x}" y="${y}" fill="#${input.fill}" font-family="${DEFAULT_FONT_FACE}" font-size="${input.fontSize}" font-weight="${input.fontWeight || 500}" text-anchor="${anchor}" dominant-baseline="hanging">${input.lines.map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`).join('')}</text>`
}

function buildSvgBulletList(theme: DeckTemplateTheme, slide: RenderableSlide, x: number, y: number, width: number): string {
  return slide.bullets.slice(0, 6).map((item, index) => (
    buildSvgText({
      x,
      y: y + index * 0.46,
      lines: splitText(`• ${item}`, Math.max(Math.floor(width * 4), 18), 2),
      fontSize: 26,
      fill: theme.secondary,
    })
  )).join('')
}

function buildSvgTimeline(theme: DeckTemplateTheme, slide: RenderableSlide): string {
  const timeline = slide.timeline || []
  return [
    `<line x1="${pxX(1.2)}" y1="${pxY(1.6)}" x2="${pxX(1.2)}" y2="${pxY(4.2)}" stroke="#${theme.accent}" stroke-width="6" />`,
    ...timeline.slice(0, 4).flatMap((item, index) => {
      const y = 1.7 + index * 0.7
      return [
        `<circle cx="${pxX(1.12)}" cy="${pxY(y + 0.09)}" r="${pxX(0.06)}" fill="#${theme.accent}" />`,
        buildSvgText({
          x: 1.45,
          y: y - 0.02,
          lines: splitText(item.title || `阶段 ${index + 1}`, 12, 2),
          fontSize: 26,
          fontWeight: 700,
          fill: theme.primary,
        }),
        item.detail
          ? buildSvgText({
              x: 3.15,
              y: y,
              lines: splitText(item.detail, 30, 2),
              fontSize: 22,
              fill: theme.secondary,
            })
          : '',
      ]
    }),
  ].join('')
}

function buildSvgTable(theme: DeckTemplateTheme, slide: RenderableSlide): string {
  const table = slide.table
  if (!table) return ''
  const columns = Math.max(table.headers.length, table.rows[0]?.length || 0, 3)
  const cellWidth = 8 / columns
  const startX = 1
  const startY = 1.55
  const cells: string[] = []
  table.headers.slice(0, columns).forEach((header, index) => {
    cells.push(`<rect x="${pxX(startX + index * cellWidth)}" y="${pxY(startY)}" width="${pxX(cellWidth - 0.02)}" height="${pxY(0.42)}" fill="#${theme.primary}" rx="${pxX(0.04)}" />`)
    cells.push(buildSvgText({
      x: startX + index * cellWidth + cellWidth / 2,
      y: startY + 0.09,
      lines: splitText(header, 10, 2),
      fontSize: 18,
      fontWeight: 700,
      fill: 'FFFFFF',
      anchor: 'middle',
    }))
  })
  table.rows.slice(0, 4).forEach((row, rowIndex) => {
    row.slice(0, columns).forEach((cell, colIndex) => {
      const x = startX + colIndex * cellWidth
      const y = startY + 0.48 + rowIndex * 0.54
      const fill = rowIndex % 2 === 0 ? 'FFFFFF' : theme.light
      cells.push(`<rect x="${pxX(x)}" y="${pxY(y)}" width="${pxX(cellWidth - 0.02)}" height="${pxY(0.46)}" fill="#${fill}" rx="${pxX(0.03)}" />`)
      cells.push(buildSvgText({
        x: x + cellWidth / 2,
        y: y + 0.11,
        lines: splitText(cell, 10, 2),
        fontSize: 16,
        fill: theme.secondary,
        anchor: 'middle',
      }))
    })
  })
  return cells.join('')
}

function buildSvgColumns(theme: DeckTemplateTheme, slide: RenderableSlide): string {
  const columns = slide.columns || []
  return columns.slice(0, 2).flatMap((column, index) => {
    const x = 0.9 + index * 4.25
    return [
      `<rect x="${pxX(x)}" y="${pxY(1.5)}" width="${pxX(3.65)}" height="${pxY(2.55)}" fill="#${index === 0 ? 'FFFFFF' : theme.light}" stroke="#${theme.accent}" stroke-opacity="0.4" stroke-width="2" rx="${pxX(0.12)}" />`,
      buildSvgText({
        x: x + 0.16,
        y: 1.68,
        lines: splitText(column.title || `栏目 ${index + 1}`, 14, 2),
        fontSize: 24,
        fontWeight: 700,
        fill: theme.primary,
      }),
      ...column.items.slice(0, 4).map((item, itemIndex) => buildSvgText({
        x: x + 0.18,
        y: 2.05 + itemIndex * 0.42,
        lines: splitText(`• ${item}`, 16, 2),
        fontSize: 20,
        fill: theme.secondary,
      })),
    ]
  }).join('')
}

function buildSvgQuote(theme: DeckTemplateTheme, slide: RenderableSlide): string {
  if (!slide.quote?.text) return ''
  return [
    `<rect x="${pxX(1)}" y="${pxY(1.5)}" width="${pxX(8)}" height="${pxY(2.55)}" fill="#FFFFFF" stroke="#${theme.light}" stroke-width="2" rx="${pxX(0.18)}" />`,
    buildSvgText({
      x: 1.35,
      y: 1.95,
      lines: splitText(`“${slide.quote.text}”`, 26, 3),
      fontSize: 34,
      fontWeight: 700,
      fill: theme.primary,
      anchor: 'start',
    }),
    slide.quote.author
      ? buildSvgText({
          x: 8.15,
          y: 3.22,
          lines: splitText(`— ${slide.quote.author}`, 18, 1),
          fontSize: 18,
          fill: theme.secondary,
          anchor: 'end',
        })
      : '',
  ].join('')
}

function buildSlideSvg(theme: DeckTemplateTheme, slide: RenderableSlide): string {
  const shapes: string[] = [
    `<rect width="${SVG_WIDTH}" height="${SVG_HEIGHT}" fill="#${theme.bg}" rx="36" />`,
  ]

  if (slide.type === 'cover') {
    shapes.push(`<rect x="${pxX(0.55)}" y="${pxY(0.7)}" width="${pxX(0.18)}" height="${pxY(2.9)}" fill="#${theme.accent}" rx="${pxX(0.06)}" />`)
    shapes.push(buildSvgText({
      x: 0.95,
      y: 1.15,
      lines: splitText(slide.title, 18, 3),
      fontSize: 64,
      fontWeight: 800,
      fill: theme.primary,
    }))
    if (slide.subtitle) {
      shapes.push(buildSvgText({
        x: 0.98,
        y: 2.55,
        lines: splitText(slide.subtitle, 32, 3),
        fontSize: 28,
        fill: theme.secondary,
      }))
    }
    shapes.push(`<rect x="${pxX(7.4)}" y="${pxY(3.85)}" width="${pxX(1.7)}" height="${pxY(0.42)}" fill="#${theme.light}" rx="${pxX(0.1)}" />`)
    shapes.push(buildSvgText({
      x: 8.25,
      y: 3.96,
      lines: [theme.badgeLabel],
      fontSize: 16,
      fontWeight: 700,
      fill: theme.primary,
      anchor: 'middle',
    }))
  } else {
    shapes.push(`<rect width="${SVG_WIDTH}" height="${pxY(0.24)}" fill="#${theme.primary}" />`)
    shapes.push(buildSvgText({
      x: 0.62,
      y: 0.48,
      lines: splitText(slide.title, 28, 2),
      fontSize: 44,
      fontWeight: 800,
      fill: theme.primary,
    }))

    if (slide.layoutVariant === 'section-divider') {
      shapes.push(buildSvgText({
        x: 5,
        y: 1.1,
        lines: [String(slide.index + 1).padStart(2, '0')],
        fontSize: 60,
        fontWeight: 800,
        fill: theme.accent,
        anchor: 'middle',
      }))
      shapes.push(buildSvgText({
        x: 5,
        y: 2.0,
        lines: splitText(slide.subtitle || '', 36, 2),
        fontSize: 26,
        fill: theme.secondary,
        anchor: 'middle',
      }))
    } else {
      if (slide.subtitle) {
        shapes.push(buildSvgText({
          x: 0.7,
          y: 1.04,
          lines: splitText(slide.subtitle, 34, 2),
          fontSize: 22,
          fill: theme.secondary,
        }))
      }

      if (slide.type === 'toc') {
        shapes.push(buildSvgBulletList(theme, slide, 1.0, 1.42, 7.3))
      } else if (slide.layoutVariant === 'cards') {
        slide.bullets.slice(0, 4).forEach((item, cardIndex) => {
          const row = Math.floor(cardIndex / 2)
          const col = cardIndex % 2
          const x = 0.72 + col * 4.45
          const y = 1.38 + row * 1.48
          shapes.push(`<rect x="${pxX(x)}" y="${pxY(y)}" width="${pxX(3.9)}" height="${pxY(1.05)}" fill="#${cardIndex % 2 === 0 ? theme.light : theme.bg}" stroke="#${theme.accent}" stroke-opacity="0.35" stroke-width="2" rx="${pxX(0.12)}" />`)
          shapes.push(buildSvgText({
            x: x + 0.18,
            y: y + 0.18,
            lines: splitText(item, 16, 3),
            fontSize: 26,
            fill: theme.secondary,
          }))
        })
      } else if (slide.layoutVariant === 'timeline' && slide.timeline?.length) {
        shapes.push(buildSvgTimeline(theme, slide))
      } else if ((slide.layoutVariant === 'comparison' || slide.layoutVariant === 'table') && slide.table) {
        shapes.push(buildSvgTable(theme, slide))
      } else if (slide.layoutVariant === 'two-column' && slide.columns?.length) {
        shapes.push(buildSvgColumns(theme, slide))
      } else if (slide.layoutVariant === 'quote' && slide.quote?.text) {
        shapes.push(buildSvgQuote(theme, slide))
      } else {
        shapes.push(`<rect x="${pxX(0.72)}" y="${pxY(1.45)}" width="${pxX(8)}" height="${pxY(3)}" fill="#FFFFFF" stroke="#${theme.light}" stroke-opacity="0.5" stroke-width="2" rx="${pxX(0.12)}" />`)
        shapes.push(buildSvgBulletList(theme, slide, 1.02, 1.8, 7.4))
      }

      if (slide.type === 'summary') {
        shapes.push(`<rect x="${pxX(6.95)}" y="${pxY(1.1)}" width="${pxX(2.1)}" height="${pxY(0.46)}" fill="#${theme.accent}" rx="${pxX(0.12)}" />`)
        shapes.push(buildSvgText({
          x: 8,
          y: 1.22,
          lines: ['感谢聆听'],
          fontSize: 18,
          fontWeight: 700,
          fill: theme.primary,
          anchor: 'middle',
        }))
      }
    }

    shapes.push(`<rect x="${pxX(9.05)}" y="${pxY(5.0)}" width="${pxX(0.55)}" height="${pxY(0.28)}" fill="#${theme.accent}" rx="${pxX(0.08)}" />`)
    shapes.push(buildSvgText({
      x: 9.325,
      y: 5.03,
      lines: [String(slide.index + 1)],
      fontSize: 15,
      fontWeight: 700,
      fill: theme.primary,
      anchor: 'middle',
    }))
  }

  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${SVG_WIDTH}" height="${SVG_HEIGHT}" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}">${shapes.join('')}</svg>`
}

function dataUrlFromSvg(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf-8').toString('base64')}`
}

function addPageBadge(slide: PptxGenJS.Slide, theme: DeckTemplateTheme, renderable: RenderableSlide): void {
  if (renderable.type === 'cover') return
  slide.addShape('roundRect', {
    x: 9.05, y: 5.0, w: 0.55, h: 0.28,
    fill: { color: theme.accent },
    line: { color: theme.accent, transparency: 100 },
  })
  slide.addText(String(renderable.index + 1), {
    x: 9.05, y: 5.02, w: 0.55, h: 0.2,
    fontFace: 'Arial',
    fontSize: 10,
    bold: true,
    color: theme.primary,
    align: 'center',
    margin: 0,
  })
}

function addBulletList(slide: PptxGenJS.Slide, theme: DeckTemplateTheme, renderable: RenderableSlide, x: number, y: number, w: number): void {
  renderable.bullets.slice(0, 6).forEach((item, index) => {
    slide.addText(`• ${item}`, {
      x,
      y: y + index * 0.46,
      w,
      h: 0.34,
      fontFace: 'Microsoft YaHei',
      fontSize: 17,
      color: theme.secondary,
      breakLine: false,
      margin: 0,
      fit: 'shrink',
    })
  })
}

function addTimeline(slide: PptxGenJS.Slide, theme: DeckTemplateTheme, renderable: RenderableSlide): void {
  slide.addShape('line', { x: 1.2, y: 1.6, w: 0, h: 2.6, line: { color: theme.accent, width: 2 } })
  renderable.timeline?.slice(0, 4).forEach((item, index) => {
    const y = 1.7 + index * 0.7
    slide.addShape('ellipse', {
      x: 1.03, y, w: 0.18, h: 0.18,
      fill: { color: theme.accent },
      line: { color: theme.accent, transparency: 100 },
    })
    slide.addText(item.title || `阶段 ${index + 1}`, {
      x: 1.45, y: y - 0.03, w: 2.1, h: 0.22,
      fontFace: 'Microsoft YaHei',
      fontSize: 15,
      bold: true,
      color: theme.primary,
      margin: 0,
    })
    if (item.detail) {
      slide.addText(item.detail, {
        x: 3.15, y: y - 0.02, w: 5.4, h: 0.26,
        fontFace: 'Microsoft YaHei',
        fontSize: 13,
        color: theme.secondary,
        margin: 0,
        fit: 'shrink',
      })
    }
  })
}

function addTable(slide: PptxGenJS.Slide, theme: DeckTemplateTheme, renderable: RenderableSlide): void {
  const table = renderable.table
  if (!table) return
  const columns = Math.max(table.headers.length, table.rows[0]?.length || 0, 3)
  const cellWidth = 8 / columns
  const startX = 1
  const startY = 1.55
  table.headers.slice(0, columns).forEach((header, index) => {
    slide.addShape('rect', {
      x: startX + index * cellWidth, y: startY, w: cellWidth - 0.02, h: 0.42,
      fill: { color: theme.primary },
      line: { color: theme.bg, transparency: 100 },
    })
    slide.addText(header, {
      x: startX + index * cellWidth + 0.08, y: startY + 0.1, w: cellWidth - 0.18, h: 0.18,
      fontFace: 'Microsoft YaHei',
      fontSize: 12,
      bold: true,
      color: 'FFFFFF',
      margin: 0,
      align: 'center',
    })
  })
  table.rows.slice(0, 4).forEach((row, rowIndex) => {
    row.slice(0, columns).forEach((cell, colIndex) => {
      const x = startX + colIndex * cellWidth
      const y = startY + 0.48 + rowIndex * 0.54
      slide.addShape('rect', {
        x, y, w: cellWidth - 0.02, h: 0.46,
        fill: { color: rowIndex % 2 === 0 ? 'FFFFFF' : theme.light, transparency: rowIndex % 2 === 0 ? 0 : 55 },
        line: { color: theme.light, transparency: 10 },
      })
      slide.addText(String(cell || ''), {
        x: x + 0.08, y: y + 0.12, w: cellWidth - 0.18, h: 0.18,
        fontFace: 'Microsoft YaHei',
        fontSize: 11,
        color: theme.secondary,
        margin: 0,
        fit: 'shrink',
        align: 'center',
      })
    })
  })
}

function addColumns(slide: PptxGenJS.Slide, theme: DeckTemplateTheme, renderable: RenderableSlide): void {
  renderable.columns?.slice(0, 2).forEach((column, index) => {
    const x = 0.9 + index * 4.25
    slide.addShape('roundRect', {
      x, y: 1.5, w: 3.65, h: 2.55,
      fill: { color: index === 0 ? 'FFFFFF' : theme.light, transparency: index === 0 ? 0 : 55 },
      line: { color: theme.accent, transparency: 40 },
    })
    slide.addText(column.title || `栏目 ${index + 1}`, {
      x: x + 0.16, y: 1.68, w: 3.2, h: 0.24,
      fontFace: 'Microsoft YaHei',
      fontSize: 15,
      bold: true,
      color: theme.primary,
      margin: 0,
    })
    column.items.slice(0, 4).forEach((item, itemIndex) => {
      slide.addText(`• ${item}`, {
        x: x + 0.18, y: 2.05 + itemIndex * 0.42, w: 3.08, h: 0.24,
        fontFace: 'Microsoft YaHei',
        fontSize: 13,
        color: theme.secondary,
        margin: 0,
        fit: 'shrink',
      })
    })
  })
}

function addQuote(slide: PptxGenJS.Slide, theme: DeckTemplateTheme, renderable: RenderableSlide): void {
  if (!renderable.quote?.text) return
  slide.addShape('roundRect', {
    x: 1.0, y: 1.5, w: 8.0, h: 2.55,
    fill: { color: 'FFFFFF' },
    line: { color: theme.light, transparency: 15 },
  })
  slide.addText(`“${renderable.quote.text}”`, {
    x: 1.35, y: 1.95, w: 7.2, h: 0.9,
    fontFace: 'Microsoft YaHei',
    fontSize: 22,
    bold: true,
    color: theme.primary,
    margin: 0,
    align: 'center',
    fit: 'shrink',
  })
  if (renderable.quote.author) {
    slide.addText(`— ${renderable.quote.author}`, {
      x: 5.95, y: 3.2, w: 2.2, h: 0.22,
      fontFace: 'Microsoft YaHei',
      fontSize: 12,
      color: theme.secondary,
      margin: 0,
      align: 'right',
    })
  }
}

function createPptxSlide(pres: PptxGenJS, theme: DeckTemplateTheme, renderable: RenderableSlide): void {
  const slide = pres.addSlide()
  slide.background = { color: theme.bg }

  if (renderable.type === 'cover') {
    slide.addShape('rect', {
      x: 0, y: 0, w: PPT_WIDTH, h: PPT_HEIGHT,
      fill: { color: theme.bg },
      line: { color: theme.bg, transparency: 100 },
    })
    slide.addShape('rect', {
      x: 0.55, y: 0.7, w: 0.18, h: 2.9,
      fill: { color: theme.accent },
      line: { color: theme.accent, transparency: 100 },
    })
    slide.addText(renderable.title, {
      x: 0.95, y: 1.15, w: 7.8, h: 1.25,
      fontFace: 'Microsoft YaHei',
      fontSize: 28,
      bold: true,
      color: theme.primary,
      fit: 'shrink',
      margin: 0,
    })
    if (renderable.subtitle) {
      slide.addText(renderable.subtitle, {
        x: 0.98, y: 2.55, w: 7.4, h: 0.48,
        fontFace: 'Microsoft YaHei',
        fontSize: 15,
        color: theme.secondary,
        fit: 'shrink',
        margin: 0,
      })
    }
    slide.addShape('roundRect', {
      x: 7.4, y: 3.85, w: 1.7, h: 0.42,
      fill: { color: theme.light },
      line: { color: theme.light, transparency: 100 },
    })
    slide.addText(theme.badgeLabel, {
      x: 7.52, y: 3.95, w: 1.46, h: 0.18,
      fontFace: 'Arial',
      fontSize: 10,
      bold: true,
      color: theme.primary,
      align: 'center',
      margin: 0,
    })
    return
  }

  slide.addShape('rect', {
    x: 0, y: 0, w: PPT_WIDTH, h: 0.24,
    fill: { color: theme.primary },
    line: { color: theme.primary, transparency: 100 },
  })
  slide.addText(renderable.title, {
    x: 0.62, y: 0.48, w: 7.75, h: 0.48,
    fontFace: 'Microsoft YaHei',
    fontSize: 24,
    bold: true,
    color: theme.primary,
    fit: 'shrink',
    margin: 0,
  })

  if (renderable.layoutVariant === 'section-divider') {
    slide.addText(renderable.subtitle || '', {
      x: 1.15, y: 2.05, w: 7.6, h: 0.32,
      fontFace: 'Microsoft YaHei',
      fontSize: 14,
      color: theme.secondary,
      margin: 0,
      align: 'center',
    })
    slide.addText(String(renderable.index + 1).padStart(2, '0'), {
      x: 3.6, y: 1.1, w: 2.8, h: 0.72,
      fontFace: 'Arial',
      fontSize: 34,
      bold: true,
      color: theme.accent,
      margin: 0,
      align: 'center',
    })
    addPageBadge(slide, theme, renderable)
    return
  }

  if (renderable.subtitle) {
    slide.addText(renderable.subtitle, {
      x: 0.7, y: 1.04, w: 7.2, h: 0.3,
      fontFace: 'Microsoft YaHei',
      fontSize: 12,
      color: theme.secondary,
      fit: 'shrink',
      margin: 0,
    })
  }

  if (renderable.type === 'toc') {
    addBulletList(slide, theme, renderable, 1.0, 1.42, 7.3)
  } else if (renderable.layoutVariant === 'cards') {
    renderable.bullets.slice(0, 4).forEach((item, cardIndex) => {
      const row = Math.floor(cardIndex / 2)
      const col = cardIndex % 2
      const x = 0.72 + col * 4.45
      const y = 1.38 + row * 1.48
      slide.addShape('roundRect', {
        x, y, w: 3.9, h: 1.05,
        fill: { color: cardIndex % 2 === 0 ? theme.light : theme.bg },
        line: { color: theme.accent, transparency: 35 },
      })
      slide.addText(item, {
        x: x + 0.18, y: y + 0.18, w: 3.45, h: 0.62,
        fontFace: 'Microsoft YaHei',
        fontSize: 16,
        color: theme.secondary,
        fit: 'shrink',
        margin: 0,
      })
    })
  } else if (renderable.layoutVariant === 'timeline' && renderable.timeline?.length) {
    addTimeline(slide, theme, renderable)
  } else if ((renderable.layoutVariant === 'comparison' || renderable.layoutVariant === 'table') && renderable.table) {
    addTable(slide, theme, renderable)
  } else if (renderable.layoutVariant === 'two-column' && renderable.columns?.length) {
    addColumns(slide, theme, renderable)
  } else if (renderable.layoutVariant === 'quote' && renderable.quote?.text) {
    addQuote(slide, theme, renderable)
  } else {
    slide.addShape('roundRect', {
      x: 0.72, y: 1.45, w: 8.0, h: 3.0,
      fill: { color: 'FFFFFF' },
      line: { color: theme.light, transparency: 50 },
    })
    addBulletList(slide, theme, renderable, 1.02, 1.8, 7.4)
  }

  if (renderable.type === 'summary') {
    slide.addShape('roundRect', {
      x: 6.95, y: 1.1, w: 2.1, h: 0.46,
      fill: { color: theme.accent },
      line: { color: theme.accent, transparency: 100 },
    })
    slide.addText('感谢聆听', {
      x: 7.02, y: 1.22, w: 1.96, h: 0.2,
      fontFace: 'Microsoft YaHei',
      fontSize: 12,
      bold: true,
      color: theme.primary,
      align: 'center',
      margin: 0,
    })
  }

  addPageBadge(slide, theme, renderable)
}

function decorateDeckWithPreviewImages(deck: WebDeckDocument, previewImages: WebDeckPreviewImage[]): WebDeckDocument {
  const bySlideId = new Map<string, WebDeckPreviewImage>()
  const byIndex = new Map<number, WebDeckPreviewImage>()
  previewImages.forEach((preview) => {
    if (preview.slideId) bySlideId.set(preview.slideId, preview)
    byIndex.set(preview.index, preview)
  })
  return {
    ...deck,
    slides: deck.slides.map((slide, index) => {
      const preview = bySlideId.get(slide.id) || byIndex.get(index)
      if (!preview) return slide
      return {
        ...slide,
        previewImageUrl: preview.previewImageUrl || slide.previewImageUrl,
        previewHtmlUrl: preview.previewHtmlUrl || slide.previewHtmlUrl,
      }
    }),
  }
}

export function resolveDeckTemplateTheme(templateId?: string): DeckTemplateTheme {
  const normalized = normalizeText(templateId)?.toLowerCase() || 'business_report'
  const alias = normalized === 'web-default' ? 'business_report' : normalized
  return TEMPLATE_THEMES.find((theme) => theme.id === alias) || TEMPLATE_THEMES[0]
}

export async function writeDeckPptxFile(deck: WebDeckDocument, outputPath: string): Promise<void> {
  try {
    const pres = new PptxGenJS()
    pres.layout = 'LAYOUT_16x9'
    pres.title = deck.title
    pres.author = 'ai-office-web'
    pres.subject = 'Generated by ai-office-web builtin PPT renderer'
    pres.company = 'AI Office'

    const theme = resolveDeckTemplateTheme(deck.templateId)
    deck.slides
      .map((slide, index) => toRenderableSlide(slide, index, deck.slides.length))
      .forEach((slide) => createPptxSlide(pres, theme, slide))

    fs.mkdirSync(path.dirname(outputPath), { recursive: true })
    await pres.writeFile({ fileName: outputPath })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.info(`[ppt-runtime] deckRendererPptxFailed=${message}`)
    throw new Error(`PPTX 写入失败：${message}`)
  }
}

export function buildDeckPreviewImages(deck: WebDeckDocument): WebDeckPreviewImage[] {
  try {
    const theme = resolveDeckTemplateTheme(deck.templateId)
    return deck.slides.map((slide, index) => {
      const renderable = toRenderableSlide(slide, index, deck.slides.length)
      return {
        slideId: slide.id,
        index,
        previewImageUrl: dataUrlFromSvg(buildSlideSvg(theme, renderable)),
      }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.info(`[ppt-runtime] deckRendererPreviewFailed=${message}`)
    throw new Error(`预览图生成失败：${message}`)
  }
}

export function withDeckPreviewImages(deck: WebDeckDocument): { deck: WebDeckDocument; previewImages: WebDeckPreviewImage[] } {
  const previewImages = buildDeckPreviewImages(deck)
  return {
    deck: decorateDeckWithPreviewImages(deck, previewImages),
    previewImages,
  }
}
