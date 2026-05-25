import type { WebDeckDocument, WebDeckSlide } from '../types'

type RawCodeBlock = { language?: string; code: string; kind?: 'code' | 'mermaid' }

function escapeYamlValue(value: string): string {
  return String(value || '').replace(/'/g, "''").replace(/\r?\n/g, ' ')
}

function escapeMarkdown(value: unknown): string {
  return String(value || '')
    .replace(/\r/g, '')
    .replace(/^---$/gm, '—')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeTableCell(value: unknown): string {
  return escapeMarkdown(value).replace(/\|/g, '\\|').replace(/\n/g, '<br>')
}

function escapeHtml(value: unknown): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function pickRawObject(slide: WebDeckSlide): Record<string, unknown> {
  return slide.raw && typeof slide.raw === 'object' ? slide.raw : {}
}

function pickRawCodeBlocks(slide: WebDeckSlide): RawCodeBlock[] {
  const raw = pickRawObject(slide)
  const blocks: RawCodeBlock[] = []
  const pushBlock = (value: unknown, fallbackLanguage = 'text', kind: RawCodeBlock['kind'] = 'code') => {
    if (typeof value === 'string' && value.trim()) {
      blocks.push({ language: fallbackLanguage, code: value, kind })
      return
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const record = value as Record<string, unknown>
      const code = normalizeString(record.code || record.content || record.source)
      if (code) {
        blocks.push({
          language: normalizeString(record.language) || normalizeString(record.lang) || fallbackLanguage,
          code,
          kind,
        })
      }
    }
  }

  pushBlock(raw.code, normalizeString(raw.language) || 'ts')
  pushBlock(raw.codeBlock, normalizeString(raw.language) || 'ts')
  pushBlock(raw.mermaid, 'mermaid', 'mermaid')

  if (Array.isArray(raw.codeBlocks)) {
    for (const entry of raw.codeBlocks) pushBlock(entry)
  }
  if (Array.isArray(raw.mermaidBlocks)) {
    for (const entry of raw.mermaidBlocks) pushBlock(entry, 'mermaid', 'mermaid')
  }
  return blocks
}

function codeFenceFor(code: string): string {
  const longest = Math.max(2, ...Array.from(code.matchAll(/`+/g)).map((match) => match[0].length))
  return '`'.repeat(longest + 1)
}

function appendCodeBlocks(lines: string[], slide: WebDeckSlide): void {
  const blocks = pickRawCodeBlocks(slide)
  for (const block of blocks) {
    const code = String(block.code || '').replace(/\r/g, '')
    if (!code.trim()) continue
    const language = block.kind === 'mermaid' ? 'mermaid' : (block.language || 'text').replace(/[^\w-]/g, '') || 'text'
    const fence = codeFenceFor(code)
    lines.push('')
    lines.push(`${fence}${language}`)
    lines.push(code)
    lines.push(fence)
  }
}

function appendSpeakerNotes(lines: string[], slide: WebDeckSlide): void {
  const notes = escapeMarkdown(slide.speakerNotes || slide.notes || '').trim()
  if (!notes) return
  lines.push('')
  lines.push('<!--')
  lines.push(notes.replace(/-->/g, '--&gt;'))
  lines.push('-->')
}

function appendBullets(lines: string[], items: unknown[]): void {
  for (const item of items) {
    const text = escapeMarkdown(item).trim()
    if (text) lines.push(`- ${text}`)
  }
}

function appendTable(lines: string[], table: NonNullable<WebDeckSlide['table']>): void {
  const headers = table.headers.length > 0 ? table.headers : ['项目', '说明']
  lines.push(`| ${headers.map(escapeTableCell).join(' | ')} |`)
  lines.push(`| ${headers.map(() => '---').join(' | ')} |`)
  for (const row of table.rows) {
    const cells = headers.map((_, index) => escapeTableCell(row[index] || ''))
    lines.push(`| ${cells.join(' | ')} |`)
  }
}

function sanitizeInlineSvg(svg: string): string {
  return String(svg || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/javascript:/gi, '')
}

function buildCardItems(items: string[]): string {
  return items
    .map((item, index) => `<div class="slidev-card-item"><span class="slidev-card-index">${index + 1}</span><span>${escapeHtml(item)}</span></div>`)
    .join('')
}

function buildVisualBlock(slide: WebDeckSlide): string {
  const visual = slide.visual
  const fallbackTitle = escapeHtml(slide.title || '视觉元素')
  const fallbackDescription = escapeHtml(slide.subtitle || slide.items?.[0] || '')

  if (visual?.imageUrl) {
    const alt = escapeMarkdown(visual.alt || visual.title || slide.title || 'slide image')
    return `![${alt}](${visual.imageUrl})`
  }

  if (slide.type === 'toc') {
    const items = (slide.items || []).filter(Boolean)
    return `<div class="slidev-visual slidev-visual-cards" data-slidev-visual="cards">${buildCardItems(items)}</div>`
  }

  if (slide.layout === 'cards' || slide.type === 'summary') {
    return `<div class="slidev-visual slidev-visual-cards" data-slidev-visual="cards">${buildCardItems((slide.items || []).slice(0, 4))}</div>`
  }

  if (slide.layout === 'timeline' && slide.timeline?.length) {
    return `<div class="slidev-visual slidev-visual-diagram" data-slidev-visual="diagram">${slide.timeline.map((item, index) => `
      <div class="slidev-timeline-node">
        <span class="slidev-timeline-order">${index + 1}</span>
        <div>
          <strong>${escapeHtml(item.title || `阶段 ${index + 1}`)}</strong>
          ${item.detail ? `<span>${escapeHtml(item.detail)}</span>` : ''}
        </div>
      </div>
    `).join('')}</div>`
  }

  if ((slide.layout === 'comparison' || slide.layout === 'table') && slide.table) {
    const headers = slide.table.headers
    const rows = slide.table.rows
    return `<div class="slidev-visual slidev-visual-chart" data-slidev-visual="chart">
      <table>
        <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead>
        <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
    </div>`
  }

  if (slide.quote?.text) {
    return `<div class="slidev-visual slidev-visual-quote" data-slidev-visual="placeholder">
      <div class="slidev-quote-mark">“</div>
      <div class="slidev-quote-text">${escapeHtml(slide.quote.text)}</div>
      ${slide.quote.author ? `<div class="slidev-quote-author">— ${escapeHtml(slide.quote.author)}</div>` : ''}
    </div>`
  }

  if (visual?.svg) {
    return `<div class="slidev-visual slidev-visual-svg" data-slidev-visual="${escapeHtml(visual.type || 'svg')}">
${sanitizeInlineSvg(visual.svg)}
</div>`
  }

  return `<div class="slidev-visual slidev-visual-placeholder" data-slidev-visual="${escapeHtml(visual?.type || 'placeholder')}">
    <strong>${escapeHtml(visual?.title || fallbackTitle)}</strong>
    <span>${escapeHtml(visual?.description || fallbackDescription)}</span>
  </div>`
}

function appendVisual(lines: string[], slide: WebDeckSlide): void {
  lines.push('')
  lines.push(buildVisualBlock(slide))
}

function buildSlideMarkdown(slide: WebDeckSlide): string {
  const lines: string[] = []
  const title = escapeMarkdown(slide.title || '未命名页面').trim() || '未命名页面'
  const layout = slide.layout || slide.layoutId || ''

  lines.push(`# ${title}`)
  if (slide.subtitle) {
    lines.push('')
    lines.push(escapeMarkdown(slide.subtitle))
  }

  if (slide.type === 'toc') {
    lines.push('')
    lines.push('## 本页结构')
    appendBullets(lines, slide.items || [])
  } else if (slide.table) {
    lines.push('')
    appendTable(lines, slide.table)
  } else if (layout === 'timeline' && slide.timeline && slide.timeline.length > 0) {
    lines.push('')
    for (const item of slide.timeline) {
      const itemTitle = escapeMarkdown(item.title).trim()
      const detail = escapeMarkdown(item.detail || '').trim()
      if (itemTitle || detail) lines.push(`- **${itemTitle || '阶段'}**${detail ? `: ${detail}` : ''}`)
    }
  } else if (slide.quote) {
    lines.push('')
    lines.push(`> ${escapeMarkdown(slide.quote.text)}`)
    if (slide.quote.author) {
      lines.push('>')
      lines.push(`> — ${escapeMarkdown(slide.quote.author)}`)
    }
  } else if (layout === 'two-column' && slide.columns && slide.columns.length > 0) {
    for (const column of slide.columns) {
      lines.push('')
      lines.push(`## ${escapeMarkdown(column.title || '栏目')}`)
      appendBullets(lines, column.items || [])
    }
  } else {
    lines.push('')
    appendBullets(lines, slide.items || [])
  }

  appendVisual(lines, slide)
  appendCodeBlocks(lines, slide)
  appendSpeakerNotes(lines, slide)
  return lines.join('\n').trim()
}

function buildSlidevFrontmatter(deck: WebDeckDocument): string {
  return [
    '---',
    'theme: default',
    `title: '${escapeYamlValue(deck.title || '演示文稿')}'`,
    'class: text-center',
    'drawings:',
    '  persist: false',
    '---',
  ].join('\n')
}

/**
 * Compiles a WebDeckDocument into safe Slidev Markdown.
 * It never emits Vue components, never executes user input, and escapes HTML.
 */
export function compileDeckToSlidevMarkdown(deck: WebDeckDocument): string {
  const frontmatter = buildSlidevFrontmatter(deck)
  const slides = deck.slides.length > 0
    ? deck.slides
    : [{
        id: 'slide-1',
        index: 0,
        type: 'cover' as const,
        title: deck.title || '演示文稿',
        items: [],
        layoutId: 'cover-title-subtitle',
        slots: { title: deck.title || '演示文稿', body: [] },
        diagnostics: {
          slotBinding: 'server-bound' as const,
          layoutMatching: 'heuristic' as const,
          contentFit: { status: 'fit' as const, itemCount: 0, maxRecommendedItems: 6 },
          partialMissing: [],
        },
      }]

  const body = slides.map(buildSlideMarkdown).join('\n\n---\n\n')
  return `${frontmatter}\n\n${body}\n`
}
