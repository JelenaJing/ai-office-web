function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** 将写作助手输出的 Markdown 转为编辑器 HTML（第一版启发式） */
export function markdownToHtml(md: string): string {
  const lines = String(md || '').split('\n')
  const parts: string[] = []
  let inList = false

  const closeList = () => {
    if (inList) {
      parts.push('</ul>')
      inList = false
    }
  }

  for (const raw of lines) {
    const line = raw.trimEnd()
    const t = line.trim()
    if (!t) {
      closeList()
      continue
    }
    if (t.startsWith('### ')) {
      closeList()
      parts.push(`<h3>${escapeHtml(t.slice(4))}</h3>`)
    } else if (t.startsWith('## ')) {
      closeList()
      parts.push(`<h2>${escapeHtml(t.slice(3))}</h2>`)
    } else if (t.startsWith('# ')) {
      closeList()
      parts.push(`<h1>${escapeHtml(t.slice(2))}</h1>`)
    } else if (/^[-*]\s+/.test(t)) {
      if (!inList) {
        parts.push('<ul>')
        inList = true
      }
      parts.push(`<li>${escapeHtml(t.replace(/^[-*]\s+/, ''))}</li>`)
    } else if (/^\d+\.\s+/.test(t)) {
      closeList()
      parts.push(`<p>${escapeHtml(t.replace(/^\d+\.\s+/, ''))}</p>`)
    } else {
      closeList()
      const withBold = escapeHtml(t)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      parts.push(`<p>${withBold}</p>`)
    }
  }
  closeList()
  return parts.join('') || '<p></p>'
}

export function markdownFragmentToHtml(md: string): string {
  const html = markdownToHtml(md)
  return html.replace(/^<h1[^>]*>[\s\S]*?<\/h1>/i, '').trim() || html
}

export interface ParsedMarkdownDoc {
  title: string
  sections: Array<{ heading: string; paragraphs: string[] }>
}

export function parseMarkdownToDocxContent(markdown: string, fallbackTitle: string): ParsedMarkdownDoc {
  const lines = String(markdown || '').split('\n')
  let title = fallbackTitle.trim() || '办公文稿'
  const sections: ParsedMarkdownDoc['sections'] = []
  let current: { heading: string; paragraphs: string[] } | null = null

  const pushCurrent = () => {
    if (current && current.paragraphs.length) sections.push(current)
    current = null
  }

  for (const raw of lines) {
    const t = raw.trim()
    if (!t) continue
    if (t.startsWith('# ')) {
      title = t.slice(2).trim() || title
      continue
    }
    if (t.startsWith('## ')) {
      pushCurrent()
      current = { heading: t.slice(3).trim() || '章节', paragraphs: [] }
      continue
    }
    if (t.startsWith('### ')) {
      pushCurrent()
      current = { heading: t.slice(4).trim() || '小节', paragraphs: [] }
      continue
    }
    if (!current) current = { heading: '正文', paragraphs: [] }
    current.paragraphs.push(t.replace(/^[-*]\s+/, '').replace(/\*\*/g, ''))
  }
  pushCurrent()

  if (!sections.length) {
    const plain = markdown.replace(/^#+\s+/gm, '').trim()
    sections.push({
      heading: '正文',
      paragraphs: plain ? plain.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).slice(0, 20) : [' '],
    })
  }

  return { title, sections }
}
