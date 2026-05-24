import type { WebDeckDocument, WebDeckSlide } from '../types'

function escapeYamlValue(value: string): string {
  return value.replace(/'/g, "''")
}

function escapeMarkdown(value: string): string {
  // Avoid breaking Slidev frontmatter or injecting HTML
  return String(value || '')
    .replace(/---/g, '—')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function em(value: string): string {
  return escapeMarkdown(value)
}

function buildSlideMarkdown(slide: WebDeckSlide, index: number): string {
  const lines: string[] = []

  if (index === 0) {
    // Cover: use class: center
    lines.push(`layout: cover`)
    lines.push(`class: text-center`)
    lines.push(`---`)
    lines.push(``)
    lines.push(`# ${em(slide.title)}`)
    if (slide.subtitle) {
      lines.push(``)
      lines.push(em(slide.subtitle))
    }
    if (slide.speakerNotes || slide.notes) {
      lines.push(``)
      lines.push(`<!--`)
      lines.push(em(slide.speakerNotes || slide.notes || ''))
      lines.push(`-->`)
    }
    return lines.join('\n')
  }

  // All other slides
  if (slide.layout === 'comparison' || slide.table) {
    lines.push(`---`)
    lines.push(``)
    lines.push(`# ${em(slide.title)}`)
    lines.push(``)
    if (slide.table) {
      const { headers, rows } = slide.table
      lines.push(`| ${headers.map(em).join(' | ')} |`)
      lines.push(`| ${headers.map(() => '---').join(' | ')} |`)
      for (const row of rows) {
        lines.push(`| ${row.map(em).join(' | ')} |`)
      }
    }
  } else if (slide.layout === 'timeline' && slide.timeline && slide.timeline.length > 0) {
    lines.push(`---`)
    lines.push(``)
    lines.push(`# ${em(slide.title)}`)
    lines.push(``)
    for (const item of slide.timeline) {
      lines.push(`- **${em(item.title)}**${item.detail ? `: ${em(item.detail)}` : ''}`)
    }
  } else if (slide.layout === 'two-column' && slide.columns && slide.columns.length > 0) {
    lines.push(`---`)
    lines.push(`layout: two-cols`)
    lines.push(`---`)
    lines.push(``)
    lines.push(`# ${em(slide.title)}`)
    lines.push(``)
    const [left, right] = slide.columns
    if (left) {
      lines.push(`## ${em(left.title)}`)
      for (const item of (left.items || [])) {
        lines.push(`- ${em(item)}`)
      }
    }
    lines.push(``)
    lines.push(`::right::`)
    lines.push(``)
    if (right) {
      lines.push(`## ${em(right.title)}`)
      for (const item of (right.items || [])) {
        lines.push(`- ${em(item)}`)
      }
    }
  } else if (slide.quote) {
    lines.push(`---`)
    lines.push(``)
    lines.push(`# ${em(slide.title)}`)
    lines.push(``)
    lines.push(`> ${em(slide.quote.text)}`)
    if (slide.quote.author) {
      lines.push(`>`)
      lines.push(`> — ${em(slide.quote.author)}`)
    }
  } else if (slide.type === 'toc') {
    lines.push(`---`)
    lines.push(``)
    lines.push(`# ${em(slide.title)}`)
    lines.push(``)
    for (const item of (slide.items || [])) {
      lines.push(`- ${em(item)}`)
    }
  } else {
    // Default: title + bullets
    lines.push(`---`)
    lines.push(``)
    lines.push(`# ${em(slide.title)}`)
    if (slide.subtitle) {
      lines.push(``)
      lines.push(`### ${em(slide.subtitle)}`)
    }
    lines.push(``)
    for (const item of (slide.items || [])) {
      lines.push(`- ${em(item)}`)
    }
  }

  if (slide.speakerNotes || slide.notes) {
    lines.push(``)
    lines.push(`<!--`)
    lines.push(em(slide.speakerNotes || slide.notes || ''))
    lines.push(`-->`)
  }

  return lines.join('\n')
}

/**
 * Compiles a WebDeckDocument into a Slidev Markdown string.
 * Does not call any external services or execute user code.
 */
export function compileDeckToSlidevMarkdown(deck: WebDeckDocument): string {
  const title = escapeYamlValue(deck.title || '演示文稿')
  const parts: string[] = []

  // Global frontmatter
  parts.push([
    `---`,
    `theme: default`,
    `title: '${title}'`,
    `drawings:`,
    `  persist: false`,
    `mdc: true`,
    `---`,
  ].join('\n'))

  for (let i = 0; i < deck.slides.length; i++) {
    const slide = deck.slides[i]
    parts.push(buildSlideMarkdown(slide, i))
  }

  return parts.join('\n\n')
}
