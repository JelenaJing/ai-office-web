export type EmailBodyFormat = 'text' | 'html' | 'mixed'

export interface NormalizedEmailBody {
  bodyText: string
  bodyHtml: string | null
  bodyPreview: string
  bodyFormat: EmailBodyFormat
  cleanText: string
  hasHtml: boolean
  hasText: boolean
  htmlConverted: boolean
}

const HTML_ENTITY_MAP: Record<string, string> = {
  nbsp: ' ',
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  ndash: '-',
  mdash: '—',
  hellip: '...',
  middot: '·',
  bull: '•',
  copy: '©',
  reg: '®',
  trade: '™',
  lsquo: "'",
  rsquo: "'",
  ldquo: '"',
  rdquo: '"',
}

function decodeHtmlEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity) => {
    const normalized = String(entity || '').toLowerCase()
    if (normalized.startsWith('#x')) {
      const value = Number.parseInt(normalized.slice(2), 16)
      return Number.isFinite(value) ? String.fromCodePoint(value) : match
    }
    if (normalized.startsWith('#')) {
      const value = Number.parseInt(normalized.slice(1), 10)
      return Number.isFinite(value) ? String.fromCodePoint(value) : match
    }
    return HTML_ENTITY_MAP[normalized] ?? match
  })
}

function looksLikeHtml(text: string): boolean {
  const sample = String(text || '').trim()
  if (!sample) return false
  if (/^<(?:!doctype|html|body)\b/i.test(sample)) return true
  const tags = sample.match(/<\/?[a-z][\w:-]*[^>]*>/gi) ?? []
  return tags.length >= 3
}

function collapseEmailText(text: string): string {
  return decodeHtmlEntities(String(text || ''))
    .replace(/\u00a0/g, ' ')
    .replace(/\r/g, '')
    .replace(/[ \t\f\v]+\n/g, '\n')
    .replace(/\n[ \t\f\v]+/g, '\n')
    .replace(/[ \t\f\v]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function cutQuotedHistory(text: string): string {
  const markers = [
    /^On .+ wrote:$/im,
    /^From[:：].*$/im,
    /^Sent[:：].*$/im,
    /^To[:：].*$/im,
    /^Subject[:：].*$/im,
    /^-{2,}\s*Original Message\s*-{2,}$/im,
    /^发件人[:：].*$/m,
    /^发送时间[:：].*$/m,
    /^收件人[:：].*$/m,
    /^主题[:：].*$/m,
    /^在.+写道[:：]?$/m,
    /^_{5,}$/m,
  ]
  let out = text
  for (const marker of markers) {
    const match = marker.exec(out)
    if (match && typeof match.index === 'number') {
      out = out.slice(0, match.index)
      break
    }
  }
  return out
}

function trimSignatureAndDisclaimer(text: string): string {
  const lines = text.split('\n').map((line) => line.trimRight())
  const stopPatterns = [
    /^best regards[,!]?$/i,
    /^kind regards[,!]?$/i,
    /^thanks[,!]?$/i,
    /^cheers[,!]?$/i,
    /^此致$/i,
    /^敬礼$/i,
    /^sent from my /i,
    /^this email and any attachments/i,
    /^confidentiality notice/i,
    /^免责声明[:：]?$/i,
    /^保密提示[:：]?$/i,
  ]
  let cutIndex = lines.length
  for (let i = 0; i < lines.length; i += 1) {
    if (stopPatterns.some((pattern) => pattern.test(lines[i]))) {
      cutIndex = i
      break
    }
  }
  return lines.slice(0, cutIndex).join('\n')
}

function buildPreview(text: string, maxLength: number): string {
  const normalized = collapseEmailText(text).replace(/\n+/g, ' ').trim()
  if (!normalized) return ''
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trim()}…`
}

export function htmlToCleanText(html: string): string {
  const stripped = String(html || '')
    .replace(/<\?xml[\s\S]*?\?>/gi, ' ')
    .replace(/<!DOCTYPE[\s\S]*?>/gi, ' ')
    .replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, ' ')
    .replace(/<!\[if[\s\S]*?<!\[endif\]>/gi, ' ')
    .replace(/<head[\s\S]*?<\/head>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<meta[\s\S]*?>/gi, ' ')
    .replace(/<xml[\s\S]*?<\/xml>/gi, ' ')
    .replace(/<v:[\w-]+[\s\S]*?<\/v:[\w-]+>/gi, ' ')
    .replace(/<\/?(?:o|w|v|st1|office):[\w-]+[^>]*>/gi, ' ')
    .replace(/\s+xmlns(?::[\w-]+)?="[^"]*"/gi, '')
    .replace(/\s+mso-[\w-]+:[^;"']*;?/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|section|article|header|footer|blockquote|h[1-6])>/gi, '\n')
    .replace(/<(p|div|section|article|header|footer|blockquote|h[1-6])[^>]*>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n- ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<(td|th)[^>]*>/gi, ' ')
    .replace(/<\/(td|th)>/gi, ' | ')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/table>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
  return collapseEmailText(stripped)
}

export function normalizeEmailBody(input: {
  text?: string | null
  html?: string | null
  previewLength?: number
}): NormalizedEmailBody {
  const rawText = String(input.text || '').trim()
  const rawHtml = String(input.html || '').trim()
  const textIsHtml = !rawHtml && looksLikeHtml(rawText)
  const bodyHtml = rawHtml || (textIsHtml ? rawText : '')
  const hasHtml = Boolean(bodyHtml)
  const hasText = Boolean(rawText && !textIsHtml)
  const bodyText = hasText
    ? collapseEmailText(rawText)
    : bodyHtml
      ? htmlToCleanText(bodyHtml)
      : ''
  const cleanText = collapseEmailText(trimSignatureAndDisclaimer(cutQuotedHistory(bodyText)))
  const bodyPreview = buildPreview(cleanText || bodyText, Math.max(100, Math.min(200, input.previewLength ?? 160)))
  const bodyFormat: EmailBodyFormat = hasHtml ? (hasText ? 'mixed' : 'html') : 'text'

  return {
    bodyText,
    bodyHtml: bodyHtml || null,
    bodyPreview,
    bodyFormat,
    cleanText,
    hasHtml,
    hasText,
    htmlConverted: Boolean(bodyHtml && !hasText),
  }
}
