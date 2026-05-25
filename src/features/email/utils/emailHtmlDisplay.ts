export interface SanitizedEmailHtml {
  html: string
  blockedRemoteImages: number
}

const SAFE_TAGS = new Set([
  'a',
  'b',
  'blockquote',
  'br',
  'div',
  'em',
  'i',
  'img',
  'li',
  'ol',
  'p',
  'span',
  'strong',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'u',
  'ul',
])

const DROP_TAGS = new Set([
  'base',
  'embed',
  'form',
  'frame',
  'frameset',
  'iframe',
  'input',
  'link',
  'meta',
  'object',
  'script',
  'select',
  'style',
  'textarea',
  'title',
])

const SAFE_STYLE_PROPS = new Set([
  'background-color',
  'border',
  'border-bottom',
  'border-collapse',
  'border-color',
  'border-left',
  'border-right',
  'border-spacing',
  'border-style',
  'border-top',
  'border-width',
  'color',
  'font-family',
  'font-size',
  'font-style',
  'font-weight',
  'height',
  'line-height',
  'margin',
  'margin-bottom',
  'margin-left',
  'margin-right',
  'margin-top',
  'padding',
  'padding-bottom',
  'padding-left',
  'padding-right',
  'padding-top',
  'text-align',
  'text-decoration',
  'vertical-align',
  'white-space',
  'width',
])

function escapeHtml(text: string): string {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function unwrapElement(element: Element): void {
  const parent = element.parentNode
  if (!parent) return
  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element)
  }
  parent.removeChild(element)
}

function sanitizeStyle(styleValue: string): string {
  return styleValue
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const separator = entry.indexOf(':')
      if (separator === -1) return null
      const property = entry.slice(0, separator).trim().toLowerCase()
      const value = entry.slice(separator + 1).trim()
      if (!SAFE_STYLE_PROPS.has(property)) return null
      if (!value || /expression\s*\(|javascript:|behavior:|url\s*\(/i.test(value)) return null
      return `${property}: ${value}`
    })
    .filter((entry): entry is string => Boolean(entry))
    .join('; ')
}

function sanitizeHref(href: string): string | null {
  const value = href.trim()
  return /^(https?:|mailto:)/i.test(value) ? value : null
}

function sanitizeImgSrc(src: string, allowRemoteImages: boolean): { src: string | null; blocked: boolean } {
  const value = src.trim()
  if (!value) return { src: null, blocked: false }
  if (/^data:image\//i.test(value)) return { src: value, blocked: false }
  if (/^https?:\/\//i.test(value)) {
    return allowRemoteImages ? { src: value, blocked: false } : { src: null, blocked: true }
  }
  return { src: null, blocked: false }
}

export function sanitizeHtmlForDisplay(
  html: string,
  options: { allowRemoteImages?: boolean } = {},
): SanitizedEmailHtml {
  if (typeof DOMParser === 'undefined') {
    return {
      html: `<html><body><pre>${escapeHtml(html)}</pre></body></html>`,
      blockedRemoteImages: 0,
    }
  }

  const allowRemoteImages = options.allowRemoteImages === true
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const body = doc.body || doc.createElement('body')
  let blockedRemoteImages = 0

  const visit = (node: Node): void => {
    if (!(node instanceof Element)) return
    const tagName = node.tagName.toLowerCase()
    if (tagName.includes(':')) {
      node.remove()
      return
    }
    if (DROP_TAGS.has(tagName)) {
      node.remove()
      return
    }
    if (!SAFE_TAGS.has(tagName)) {
      for (const child of [...node.childNodes]) {
        visit(child)
      }
      unwrapElement(node)
      return
    }

    for (const attribute of [...node.attributes]) {
      const name = attribute.name.toLowerCase()
      const value = attribute.value
      if (name.startsWith('on')) {
        node.removeAttribute(attribute.name)
        continue
      }
      if (name === 'style') {
        const safeStyle = sanitizeStyle(value)
        if (safeStyle) node.setAttribute('style', safeStyle)
        else node.removeAttribute(attribute.name)
        continue
      }
      if (name === 'href' && tagName === 'a') {
        const safeHref = sanitizeHref(value)
        if (!safeHref) {
          node.removeAttribute(attribute.name)
        } else {
          node.setAttribute('href', safeHref)
          node.setAttribute('target', '_blank')
          node.setAttribute('rel', 'noopener noreferrer')
        }
        continue
      }
      if (name === 'src' && tagName === 'img') {
        const result = sanitizeImgSrc(value, allowRemoteImages)
        if (result.blocked) {
          blockedRemoteImages += 1
          const placeholder = doc.createElement('div')
          placeholder.setAttribute('class', 'email-remote-image-blocked')
          placeholder.textContent = '已屏蔽远程图片'
          node.replaceWith(placeholder)
          return
        }
        if (!result.src) {
          node.remove()
          return
        }
        node.setAttribute('src', result.src)
        continue
      }
      if (name === 'srcset') {
        node.removeAttribute(attribute.name)
        continue
      }
      if (
        ![
          'align',
          'alt',
          'cellpadding',
          'cellspacing',
          'colspan',
          'height',
          'rel',
          'rowspan',
          'target',
          'title',
          'valign',
          'width',
        ].includes(name)
      ) {
        node.removeAttribute(attribute.name)
      }
    }

    if (tagName === 'a') {
      node.setAttribute('target', '_blank')
      node.setAttribute('rel', 'noopener noreferrer')
    }

    for (const child of [...node.childNodes]) {
      visit(child)
    }
  }

  for (const child of [...body.childNodes]) {
    visit(child)
  }

  const sanitizedBody = body.innerHTML.trim() || '<p style="color:#718096;">（HTML 邮件正文为空）</p>'
  return {
    html: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { margin: 0; padding: 16px; color: #1a202c; font: 14px/1.7 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; word-break: break-word; }
      table { max-width: 100%; border-collapse: collapse; }
      td, th { vertical-align: top; }
      img { max-width: 100%; height: auto; }
      blockquote { margin: 12px 0; padding-left: 12px; border-left: 3px solid #e2e8f0; color: #4a5568; }
      .email-remote-image-blocked { display: inline-block; margin: 8px 0; padding: 6px 10px; border: 1px dashed #cbd5e0; border-radius: 8px; color: #718096; background: #f7fafc; }
    </style>
  </head>
  <body>${sanitizedBody}</body>
</html>`,
    blockedRemoteImages,
  }
}
