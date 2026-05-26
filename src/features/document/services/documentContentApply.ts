/** 将 AI 纯文本回复转为可写入文稿编辑区的 HTML 片段。 */
export function plainTextToDocumentBodyHtml(text: string): string {
  const trimmed = String(text || '').trim()
  if (!trimmed) return '<p data-block-id="body-p1" data-role="paragraph"><br /></p>'

  const blocks = trimmed.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean)
  return blocks
    .map((block, index) => {
      const id = `body-ai-${index + 1}`
      const escaped = block
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br/>')
      return `<p data-block-id="${id}" data-role="paragraph">${escaped}</p>`
    })
    .join('\n')
}

export function wrapDocumentBodyHtml(title: string, bodyHtml: string): string {
  const safeTitle = (title || '未命名文稿')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  const body = bodyHtml.trim() || '<p data-block-id="body-p1" data-role="paragraph"><br /></p>'
  return [
    '<article data-document-root="true" data-document-mode="draft">',
    `<h1 data-document-title="true" data-block-id="document-title" data-role="title">${safeTitle}</h1>`,
    '<section data-section-id="section-body" data-section-title="正文" data-section-level="1" data-document-body="true">',
    body,
    '</section>',
    '</article>',
  ].join('\n')
}

export function htmlToMarkdownForReport(html: string, title: string): string {
  const container = typeof document !== 'undefined' ? document.createElement('div') : null
  if (!container) {
    return `# ${title}\n\n${String(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}`
  }
  container.innerHTML = html
  const lines: string[] = [`# ${title || '未命名文稿'}`, '']
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = node.textContent?.trim()
      if (t) lines.push(t)
      return
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return
    const el = node as HTMLElement
    const tag = el.tagName.toLowerCase()
    if (tag === 'h1' || tag === 'h2') {
      lines.push('', `## ${el.textContent?.trim() || ''}`, '')
      return
    }
    if (tag === 'h3' || tag === 'h4') {
      lines.push('', `### ${el.textContent?.trim() || ''}`, '')
      return
    }
    if (tag === 'p' || tag === 'li' || tag === 'blockquote') {
      const t = el.textContent?.trim()
      if (t) lines.push(t, '')
      return
    }
    if (tag === 'img') {
      const alt = el.getAttribute('alt') || '配图'
      const src = el.getAttribute('src') || ''
      if (src) lines.push(`![${alt}](${src})`, '')
      return
    }
    el.childNodes.forEach(walk)
  }
  container.childNodes.forEach(walk)
  return lines.join('\n').trim()
}
