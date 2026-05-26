import fs from 'fs'
import type {
  CandidateTemplateRecord,
  HtmlPresentationJobOptions,
  TemplateProfileRecord,
} from './htmlPresentationTemplates'

export interface ContentModelBlock {
  id: string
  type: 'text' | 'image' | 'chart' | 'diagram' | 'card'
  role: 'title' | 'subtitle' | 'body' | 'visual' | 'caption'
  text: string
  assetPath: string
  imagePrompt: string
  placement?: 'hero' | 'right' | 'left' | 'background' | 'full' | 'inline' | 'card'
  placeholderUsed?: boolean
}

export interface ContentModelSlide {
  id: string
  index: number
  role: 'cover' | 'agenda' | 'section' | 'content' | 'image' | 'comparison' | 'timeline' | 'closing'
  title: string
  subtitle: string
  bullets: string[]
  layoutHint: string
  blocks: ContentModelBlock[]
  visual: {
    type: 'none' | 'image' | 'svg' | 'diagram'
    prompt: string
    assetPath: string
    placement: 'hero' | 'right' | 'left' | 'background' | 'full' | 'inline' | 'card'
  }
}

export interface ContentModelRecord {
  deckId: string
  title: string
  subtitle: string
  templateSlug: string
  theme: string
  slides: ContentModelSlide[]
  assets: Array<{
    blockId: string
    slideId: string
    assetPath: string
    imagePrompt: string
    placeholderUsed?: boolean
  }>
  createdAt: string
  updatedAt: string
}

export interface HtmlPresentationPostProcessResult {
  contentModelPath: string
  templateProfilePath: string
  candidateTemplatesPath: string
  selectedTemplateSlug: string
  candidateTemplateSlugs: string[]
  fallbackUsed: boolean
  imagePlanningEnabled: boolean
  plannedImageCount: number
  generatedImageCount: number
  placeholderCount: number
  contentModel: ContentModelRecord
}

interface SlideWorkItem {
  matchIndex: number
  start: number
  end: number
  original: string
  updated: string
  model: ContentModelSlide
}

function pad(value: number, size = 3): string {
  return String(value).padStart(size, '0')
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value
  return `${value.slice(0, Math.max(0, maxLength - 1)).trim()}…`
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/\n/g, '&#10;')
}

export function createPlaceholderDataUri(title: string, prompt: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(createPlaceholderSvgMarkup(title, prompt))}`
}

export function createPlaceholderSvgMarkup(title: string, prompt: string): string {
  const safeTitle = truncate(title || 'Image Placeholder', 48)
  const safePrompt = truncate(prompt || 'Visual planned for this slide', 96)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540" role="img" aria-label="${escapeAttribute(safeTitle)}"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#eaf1fb"/><stop offset="100%" stop-color="#d6e4f6"/></linearGradient></defs><rect width="960" height="540" rx="28" fill="url(#g)"/><rect x="40" y="40" width="880" height="460" rx="24" fill="none" stroke="#9fb7d8" stroke-dasharray="14 10" stroke-width="3"/><text x="60" y="106" fill="#244367" font-family="Arial, sans-serif" font-size="34" font-weight="700">${escapeHtml(safeTitle)}</text><text x="60" y="156" fill="#55728f" font-family="Arial, sans-serif" font-size="20">${escapeHtml(safePrompt)}</text><g transform="translate(60 220)" fill="none" stroke="#87a6ca" stroke-width="10"><rect width="320" height="190" rx="18"/><path d="M18 164l68-72 58 48 52-68 124 92"/><circle cx="242" cy="54" r="26"/></g><text x="60" y="468" fill="#6d88a3" font-family="Arial, sans-serif" font-size="18">SVG placeholder · phase 2 fallback</text></svg>`
}

function stripTags(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function stripManagedDataAttrs(value: string): string {
  return value
    .replace(/\sdata-slide-id=(["']).*?\1/gi, '')
    .replace(/\sdata-block-id=(["']).*?\1/gi, '')
    .replace(/\sdata-block-type=(["']).*?\1/gi, '')
    .replace(/\sdata-block-role=(["']).*?\1/gi, '')
    .replace(/\sdata-image-prompt=(["']).*?\1/gi, '')
    .replace(/\sdata-placeholder-used=(["']).*?\1/gi, '')
    .replace(/\sdata-aios-[a-z-]+=(["']).*?\1/gi, '')
}

function stripNonCanonicalManagedAttrs(html: string): string {
  return html.replace(/<([a-z][\w:-]*)\b([^>]*)>/gi, (full, tagName: string, attrs: string) => {
    let cleanedAttrs = attrs
    const currentSlideId = attrs.match(/\sdata-slide-id=(["'])(.*?)\1/i)?.[2]
    const currentBlockId = attrs.match(/\sdata-block-id=(["'])(.*?)\1/i)?.[2]

    if (currentSlideId && !/^slide-\d{3}$/.test(currentSlideId)) {
      cleanedAttrs = cleanedAttrs.replace(/\sdata-slide-id=(["']).*?\1/gi, '')
    }

    if (currentBlockId && !/^block-\d{3}-\d{3}$/.test(currentBlockId)) {
      cleanedAttrs = cleanedAttrs
        .replace(/\sdata-block-id=(["']).*?\1/gi, '')
        .replace(/\sdata-block-type=(["']).*?\1/gi, '')
        .replace(/\sdata-block-role=(["']).*?\1/gi, '')
        .replace(/\sdata-image-prompt=(["']).*?\1/gi, '')
    }

    return `<${tagName}${cleanedAttrs}>`
  })
}

function ensureOutputAssetsDir(outputDir: string): void {
  fs.mkdirSync(outputDir, { recursive: true })
  fs.mkdirSync(`${outputDir}/assets`, { recursive: true })
}

function normalizeVisualPlacement(
  placement: ContentModelSlide['visual']['placement'] | undefined,
): ContentModelSlide['visual']['placement'] {
  if (placement) return placement
  return 'right'
}

export function isPlaceholderAssetPath(assetPath: string): boolean {
  return assetPath.startsWith('data:image/svg+xml') || /placeholder/i.test(assetPath)
}

export function resolveHtmlPresentationAssetUrl(assetPath: string, artifactId?: string): string {
  if (!assetPath) return ''
  if (/^(data:|https?:|\/api\/artifacts\/)/i.test(assetPath)) return assetPath
  if (artifactId && assetPath.startsWith('assets/')) {
    const filename = assetPath.replace(/^assets\//, '')
    return `/api/artifacts/${artifactId}/assets/${filename}`
  }
  return assetPath
}

function writePlaceholderAsset(outputDir: string, slide: ContentModelSlide, block: ContentModelBlock, prompt: string): string {
  ensureOutputAssetsDir(outputDir)
  const filename = `${slide.id}-${block.id}-placeholder.svg`
  fs.writeFileSync(`${outputDir}/assets/${filename}`, createPlaceholderSvgMarkup(slide.title || 'Slide visual', prompt), 'utf-8')
  return `assets/${filename}`
}

function renderManagedImageMarkup(input: {
  block: ContentModelBlock
  slide: ContentModelSlide
  artifactId?: string
}): string {
  const placement = normalizeVisualPlacement(input.block.placement ?? input.slide.visual?.placement)
  const resolvedSrc = resolveHtmlPresentationAssetUrl(input.block.assetPath, input.artifactId)
  const placeholderUsed = input.block.placeholderUsed ?? isPlaceholderAssetPath(input.block.assetPath)
  const fit = placement === 'background' || placement === 'full' ? 'cover' : placement === 'inline' ? 'contain' : 'cover'
  return `<div class="aios-visual-slot aios-visual-slot--${placement}" data-aios-visual-placement="${placement}" data-placeholder-used="${placeholderUsed ? 'true' : 'false'}"><img src="${escapeAttribute(resolvedSrc)}" alt="${escapeAttribute(input.slide.title || 'Slide visual')}" style="object-fit:${fit};" data-block-id="${input.block.id}" data-block-type="image" data-block-role="visual" data-image-prompt="${escapeAttribute(input.block.imagePrompt)}" data-placeholder-used="${placeholderUsed ? 'true' : 'false'}"></div>`
}

function ensureSlideSections(html: string): string {
  const slidePattern = /<section\b[^>]*class=(["'])[^"']*\bslide\b[^"']*\1[^>]*>[\s\S]*?<\/section>/gi
  if (slidePattern.test(html)) return html
  const bodyMatch = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)
  const bodyContent = bodyMatch ? bodyMatch[1].trim() : html
  const wrapped = `<main class="deck">\n<section class="slide">\n${bodyContent}\n</section>\n</main>`
  if (bodyMatch) {
    return html.replace(bodyMatch[0], `<body>\n${wrapped}\n</body>`)
  }
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>HTML PPT</title></head><body>\n${wrapped}\n</body></html>`
}

function inferSlideRole(index: number, total: number, title: string, bullets: string[], hasImage: boolean): ContentModelSlide['role'] {
  const normalized = title.toLowerCase()
  if (index === 0) return 'cover'
  if (index === total - 1 || /(thanks|thank you|谢谢|结束|结语|q&a|questions)/i.test(normalized)) return 'closing'
  if (/(agenda|目录|议程|contents)/i.test(normalized)) return 'agenda'
  if (/(timeline|roadmap|实施路径|路线图|里程碑)/i.test(normalized)) return 'timeline'
  if (/(compare|comparison|对比|vs|差异)/i.test(normalized)) return 'comparison'
  if (/(section|章节|part)/i.test(normalized)) return 'section'
  if (hasImage) return 'image'
  if (bullets.length >= 3) return 'content'
  return 'content'
}

function inferLayoutHint(role: ContentModelSlide['role'], hasImage: boolean): string {
  if (role === 'cover') return hasImage ? 'cover-hero-image' : 'cover-centered'
  if (role === 'agenda') return 'agenda-list'
  if (role === 'comparison') return 'two-column-compare'
  if (role === 'timeline') return 'timeline-steps'
  if (role === 'image') return 'content-visual-split'
  if (role === 'closing') return 'closing-statement'
  return hasImage ? 'content-visual-split' : 'content-stack'
}

function determineTextRole(tagName: string, text: string, seenTitle: boolean, seenSubtitle: boolean): ContentModelBlock['role'] {
  if (/^h[1-2]$/i.test(tagName) && !seenTitle) return 'title'
  if ((/^h[3-6]$/i.test(tagName) || /^p$/i.test(tagName)) && !seenSubtitle && text.length <= 140) return 'subtitle'
  if (/^(small|figcaption|blockquote)$/i.test(tagName)) return 'caption'
  return 'body'
}

function buildVisualPrompt(templateProfile: TemplateProfileRecord, slide: ContentModelSlide): string {
  const titlePart = slide.title || 'presentation visual'
  const schemePart = templateProfile.colorScheme || 'light'
  return [
    `${titlePart} illustration for a PPT slide`,
    'no text',
    'no watermark',
    'no logo',
    'suitable for PPT',
    'match the selected template style',
    `scheme: ${schemePart}`,
    `tone: ${templateProfile.visualRules.join(', ') || 'clean and modern'}`,
  ].join(', ')
}

function appendBeforeClosingTag(html: string, closingTag: string, fragment: string): string {
  const marker = new RegExp(`</${closingTag}>\\s*$`, 'i')
  if (marker.test(html)) return html.replace(marker, `${fragment}\n</${closingTag}>`)
  return `${html}\n${fragment}`
}

function replaceManagedImageBlock(html: string, blockIdValue: string, markup: string): { replaced: boolean; html: string } {
  const safeBlockId = blockIdValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const wrapperPattern = new RegExp(
    `<(?:div|figure|section|picture)\\b[^>]*data-block-id="${safeBlockId}"[^>]*>[\\s\\S]*?<\\/(?:div|figure|section|picture)>`,
    'i',
  )
  if (wrapperPattern.test(html)) {
    return { replaced: true, html: html.replace(wrapperPattern, markup) }
  }
  const imgPattern = new RegExp(`<img\\b[^>]*data-block-id="${safeBlockId}"[^>]*\\/?>`, 'i')
  if (imgPattern.test(html)) {
    return { replaced: true, html: html.replace(imgPattern, markup) }
  }
  return { replaced: false, html }
}

function insertManagedImageBlock(html: string, markup: string): string {
  const containers = ['slide-content', 'content-shell', 'summary-inner', 'hero-title-group', 'hero-tagline', 'rm-inner']
  for (const className of containers) {
    const openPattern = new RegExp(`<div\\b[^>]*class=(["'])[^"']*\\b${className}\\b[^"']*\\1[^>]*>`, 'i')
    const openMatch = openPattern.exec(html)
    if (!openMatch || openMatch.index == null) continue
    const openEnd = openMatch.index + openMatch[0].length
    const tokenPattern = /<\/?div\b[^>]*>/gi
    tokenPattern.lastIndex = openEnd
    let depth = 1
    let tokenMatch: RegExpExecArray | null
    while ((tokenMatch = tokenPattern.exec(html))) {
      if (/^<div\b/i.test(tokenMatch[0])) depth += 1
      else depth -= 1
      if (depth === 0) {
        return `${html.slice(0, tokenMatch.index)}${markup}${html.slice(tokenMatch.index)}`
      }
    }
  }
  return appendBeforeClosingTag(html, 'section', markup)
}

export function injectSharedStyles(html: string): string {
  const styleBlock = `
<style id="aios-html-ppt-enhancements">
  .slide[data-slide-id] { position: relative; overflow: hidden; contain: layout paint; isolation: isolate; }
  .slide[data-slide-id] > * { position: relative; z-index: 3; }
  .slide[data-slide-id] [class*="decoration"],
  .slide[data-slide-id] [class*="dots"],
  .slide[data-slide-id] .cover-decoration,
  .slide[data-slide-id] .quote-decoration,
  .slide[data-slide-id] .quote-decoration-2,
  .slide[data-slide-id] .closing-decoration,
  .slide[data-slide-id] .closing-decoration-2 { z-index: 1; pointer-events: none; max-width: 100%; max-height: 100%; }
  .slide[data-slide-id] .slide-content,
  .slide[data-slide-id] .slide-header,
  .slide[data-slide-id] .summary-inner,
  .slide[data-slide-id] .summary-columns,
  .slide[data-slide-id] .summary-highlights,
  .slide[data-slide-id] .fin-grid,
  .slide[data-slide-id] .split-body,
  .slide[data-slide-id] .content-shell,
  .slide[data-slide-id] .detail-body,
  .slide[data-slide-id] .rm-inner,
  .slide[data-slide-id] .global-inner { position: relative; z-index: 3; }
  [data-block-id][data-block-type="text"] { cursor: text; transition: outline-color 160ms ease, box-shadow 160ms ease; }
  [data-block-id][data-block-type="text"]:hover { outline: 2px dashed rgba(37, 99, 235, 0.25); outline-offset: 4px; }
  [data-block-id][data-block-type="text"].aios-edit-selected { outline: 2px solid rgba(37, 99, 235, 0.85); outline-offset: 4px; box-shadow: 0 0 0 6px rgba(37, 99, 235, 0.12); }
  [data-block-id][data-block-type="image"] { cursor: pointer; transition: outline-color 160ms ease, box-shadow 160ms ease; }
  [data-block-id][data-block-type="image"]:hover { outline: 2px dashed rgba(245, 158, 11, 0.35); outline-offset: 4px; }
  [data-block-id][data-block-type="image"].aios-image-selected { outline: 2px solid rgba(245, 158, 11, 0.9); outline-offset: 4px; box-shadow: 0 0 0 6px rgba(245, 158, 11, 0.12); }
  .slide[data-aios-visual-placement="right"] .slide-content,
  .slide[data-aios-visual-placement="right"] .content-shell,
  .slide[data-aios-visual-placement="right"] .summary-inner,
  .slide[data-aios-visual-placement="right"] .split-body,
  .slide[data-aios-visual-placement="right"] .detail-body { padding-right: min(34vw, 380px); }
  .slide[data-aios-visual-placement="left"] .slide-content,
  .slide[data-aios-visual-placement="left"] .content-shell,
  .slide[data-aios-visual-placement="left"] .summary-inner,
  .slide[data-aios-visual-placement="left"] .split-body,
  .slide[data-aios-visual-placement="left"] .detail-body { padding-left: min(34vw, 380px); }
  .aios-visual-slot { position: absolute; overflow: hidden; display: flex; align-items: stretch; justify-content: stretch; width: min(30vw, 360px); height: min(40vh, 300px); max-width: min(34vw, 420px); max-height: min(44vh, 340px); border-radius: 20px; box-shadow: 0 18px 44px rgba(15, 23, 42, 0.16); background: rgba(255,255,255,0.68); z-index: 2; }
  .aios-visual-slot--right { right: clamp(18px, 2.5vw, 40px); top: 50%; transform: translateY(-50%); }
  .aios-visual-slot--left { left: clamp(18px, 2.5vw, 40px); top: 50%; transform: translateY(-50%); }
  .aios-visual-slot--hero { right: clamp(18px, 3vw, 48px); top: clamp(18px, 7vh, 72px); width: min(32vw, 420px); height: min(44vh, 320px); }
  .aios-visual-slot--card { right: clamp(18px, 2.5vw, 40px); bottom: clamp(18px, 2.5vw, 40px); width: min(28vw, 320px); height: min(30vh, 220px); }
  .aios-visual-slot--inline { position: relative; inset: auto; width: 100%; height: clamp(220px, 30vh, 320px); max-width: none; max-height: none; margin-top: 1.2rem; transform: none; }
  .aios-visual-slot--background,
  .aios-visual-slot--full { inset: 0; width: auto; height: auto; max-width: none; max-height: none; border-radius: 0; box-shadow: none; }
  .aios-visual-slot--background { opacity: 0.2; z-index: 1; }
  .aios-visual-slot img,
  .aios-visual-slot svg { width: 100%; height: 100%; display: block; object-fit: cover; }
  .aios-visual-slot [data-placeholder-used="true"] { background: rgba(255,255,255,0.72); }
  .aios-inline-editor { position: fixed; right: 20px; bottom: 20px; width: min(420px, calc(100vw - 32px)); background: rgba(15, 23, 42, 0.96); color: #fff; border-radius: 16px; box-shadow: 0 22px 60px rgba(15, 23, 42, 0.35); padding: 14px; z-index: 99999; display: none; font-family: system-ui, -apple-system, sans-serif; }
  .aios-inline-editor.open { display: block; }
  .aios-inline-editor__title { font-size: 13px; font-weight: 700; letter-spacing: 0.04em; margin: 0 0 8px; color: rgba(255,255,255,0.78); }
  .aios-inline-editor textarea { width: 100%; min-height: 108px; resize: vertical; box-sizing: border-box; padding: 12px; border-radius: 12px; border: 1px solid rgba(148, 163, 184, 0.36); background: rgba(255,255,255,0.08); color: #fff; font: inherit; line-height: 1.55; }
  .aios-inline-editor__actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 12px; }
  .aios-inline-editor button { height: 38px; padding: 0 14px; border-radius: 10px; border: none; cursor: pointer; font: inherit; font-weight: 700; }
  .aios-inline-editor__cancel { background: rgba(255,255,255,0.16); color: #fff; }
  .aios-inline-editor__apply { background: #3b82f6; color: #fff; }
  .aios-image-editor { position: fixed; right: 20px; bottom: 88px; width: min(420px, calc(100vw - 32px)); background: rgba(15, 23, 42, 0.96); color: #fff; border-radius: 16px; box-shadow: 0 22px 60px rgba(15, 23, 42, 0.35); padding: 14px; z-index: 99998; display: none; font-family: system-ui, -apple-system, sans-serif; }
  .aios-image-editor.open { display: block; }
  .aios-image-editor__title { font-size: 13px; font-weight: 700; letter-spacing: 0.04em; margin: 0 0 8px; color: rgba(255,255,255,0.78); }
  .aios-image-editor__prompt-row { display: flex; gap: 8px; }
  .aios-image-editor__prompt-row input { flex: 1; height: 38px; padding: 0 12px; border-radius: 10px; border: 1px solid rgba(148, 163, 184, 0.36); background: rgba(255,255,255,0.08); color: #fff; font: inherit; }
  .aios-image-editor__actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 12px; }
  .aios-image-editor button { height: 38px; padding: 0 14px; border-radius: 10px; border: none; cursor: pointer; font: inherit; font-weight: 700; }
  .aios-image-editor__cancel { background: rgba(255,255,255,0.16); color: #fff; }
  .aios-image-editor__regen { background: #f59e0b; color: #000; }
  .aios-image-editor__status { font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 6px; min-height: 18px; }
  @media (max-width: 960px) {
    .slide[data-aios-visual-placement="right"] .slide-content,
    .slide[data-aios-visual-placement="right"] .content-shell,
    .slide[data-aios-visual-placement="right"] .summary-inner,
    .slide[data-aios-visual-placement="right"] .split-body,
    .slide[data-aios-visual-placement="right"] .detail-body,
    .slide[data-aios-visual-placement="left"] .slide-content,
    .slide[data-aios-visual-placement="left"] .content-shell,
    .slide[data-aios-visual-placement="left"] .summary-inner,
    .slide[data-aios-visual-placement="left"] .split-body,
    .slide[data-aios-visual-placement="left"] .detail-body { padding-left: 0; padding-right: 0; }
    .aios-visual-slot,
    .aios-visual-slot--right,
    .aios-visual-slot--left,
    .aios-visual-slot--hero,
    .aios-visual-slot--card { position: relative; inset: auto; width: 100%; height: clamp(220px, 30vh, 320px); max-width: none; max-height: none; margin-top: 1rem; transform: none; }
  }
</style>`

  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `${styleBlock}\n</head>`)
  }
  return html.replace(/<body/i, `${styleBlock}\n<body`)
}

export function injectEditRuntime(html: string, deckId: string): string {
  const scriptBlock = `
<script id="aios-html-ppt-edit-runtime">
  (function () {
    const deckId = ${JSON.stringify(deckId)};
    const storageKey = 'aios-html-ppt-patches:' + deckId;

    // Detect artifactId from URL so runtime can POST patches to server.
    // Pattern: /api/artifacts/<artifactId>/file
    function detectArtifactId() {
      try {
        const m = window.location.pathname.match(/\\/api\\/artifacts\\/([^/]+)\\/file/);
        return m ? m[1] : null;
      } catch { return null; }
    }
    const artifactId = detectArtifactId();

    function getBaseUrl() {
      return window.location.origin;
    }

    // ── localStorage helpers ──
    function loadPatches() {
      try { return JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch { return []; }
    }
    function savePatches(next) {
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
    }
    function applySavedPatches() {
      loadPatches().forEach(function(p) {
        const sel = '[data-slide-id="' + p.slideId + '"] [data-block-id="' + p.blockId + '"]';
        const el = document.querySelector(sel);
        if (el && typeof p.text === 'string') el.textContent = p.text;
      });
    }

    // ── server writeback helpers ──
    const pendingImageRequests = Object.create(null);

    function postToParent(message) {
      if (window.parent && window.parent !== window) {
        try {
          window.parent.postMessage(message, '*');
          return true;
        } catch {}
      }
      return false;
    }

    function postTextPatch(patch) {
      if (!artifactId) return;
      if (postToParent({ type: 'aios-html-ppt:patch', artifactId: artifactId, storageKey: storageKey, patch: patch })) {
        return;
      }
      try {
        fetch(getBaseUrl() + '/api/artifacts/' + artifactId + '/html-presentation/patch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ op: 'replace_text', slideId: patch.slideId, blockId: patch.blockId, text: patch.text }),
        }).catch(function(){});
      } catch {}
    }

    function postImageRegen(slideId, blockId, imagePrompt, imgEl, statusEl, blockEl) {
      if (!artifactId) {
        if (statusEl) statusEl.textContent = '未检测到 artifactId，跳过服务端更新';
        return;
      }
      if (statusEl) statusEl.textContent = '正在生成图片…';

      const requestId = 'img-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
      pendingImageRequests[requestId] = { imgEl: imgEl, statusEl: statusEl, imagePrompt: imagePrompt, blockEl: blockEl };
      if (postToParent({
        type: 'aios-html-ppt:image',
        artifactId: artifactId,
        requestId: requestId,
        payload: { slideId: slideId, blockId: blockId, imagePrompt: imagePrompt },
      })) {
        return;
      }

      fetch(getBaseUrl() + '/api/artifacts/' + artifactId + '/html-presentation/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ slideId, blockId, imagePrompt }),
      })
        .then(function(r) { return r.ok ? r.json() : Promise.reject(r.status); })
        .then(function(data) {
          const nextSrc = data && (data.assetUrl || data.assetDataUri || data.assetPath);
          if (data && nextSrc) {
            if (imgEl) {
              imgEl.src = nextSrc;
              if (imgEl.hasAttribute('data-image-prompt')) imgEl.setAttribute('data-image-prompt', imagePrompt);
              imgEl.setAttribute('data-placeholder-used', data && data.placeholderUsed ? 'true' : 'false');
            }
            if (blockEl && blockEl.hasAttribute && blockEl.hasAttribute('data-image-prompt')) {
              blockEl.setAttribute('data-image-prompt', imagePrompt);
              blockEl.setAttribute('data-placeholder-used', data && data.placeholderUsed ? 'true' : 'false');
            }
          }
          if (statusEl) statusEl.textContent = data && data.placeholderUsed ? '已使用 SVG 占位图' : '图片已更新';
        })
        .catch(function(err) { if (statusEl) statusEl.textContent = '图片生成失败: ' + err; });
    }

    window.addEventListener('message', function(event) {
      const data = event.data || {};
      if (data.type !== 'aios-html-ppt:image-result' || !data.requestId) return;
      const pending = pendingImageRequests[data.requestId];
      if (!pending) return;
      delete pendingImageRequests[data.requestId];
      if (!data.success) {
        if (pending.statusEl) pending.statusEl.textContent = '图片生成失败: ' + (data.error || 'unknown error');
        return;
      }
      const nextSrc = data.assetUrl || data.assetDataUri || data.assetPath;
      if (nextSrc) {
        if (pending.imgEl) {
          pending.imgEl.src = nextSrc;
          if (pending.imgEl.hasAttribute('data-image-prompt')) pending.imgEl.setAttribute('data-image-prompt', pending.imagePrompt);
          pending.imgEl.setAttribute('data-placeholder-used', data.placeholderUsed ? 'true' : 'false');
        }
        if (pending.blockEl && pending.blockEl.hasAttribute && pending.blockEl.hasAttribute('data-image-prompt')) {
          pending.blockEl.setAttribute('data-image-prompt', pending.imagePrompt);
          pending.blockEl.setAttribute('data-placeholder-used', data.placeholderUsed ? 'true' : 'false');
        }
      }
      if (pending.statusEl) pending.statusEl.textContent = data.placeholderUsed ? '已使用 SVG 占位图' : '图片已更新';
    });

    // ── Text editor ──
    const textEditor = document.createElement('div');
    textEditor.className = 'aios-inline-editor';
    textEditor.innerHTML = '<div class="aios-inline-editor__title">局部替换文本</div><textarea aria-label="Edit slide text"></textarea><div class="aios-inline-editor__actions"><button type="button" class="aios-inline-editor__cancel">取消</button><button type="button" class="aios-inline-editor__apply">确认替换</button></div>';
    document.body.appendChild(textEditor);
    const textarea = textEditor.querySelector('textarea');
    const cancelTextBtn = textEditor.querySelector('.aios-inline-editor__cancel');
    const applyTextBtn = textEditor.querySelector('.aios-inline-editor__apply');
    let activeTextEl = null;

    function clearTextEditor() {
      if (activeTextEl) activeTextEl.classList.remove('aios-edit-selected');
      activeTextEl = null;
      textEditor.classList.remove('open');
    }
    function openTextEditor(target) {
      clearImageEditor();
      if (activeTextEl) activeTextEl.classList.remove('aios-edit-selected');
      activeTextEl = target;
      activeTextEl.classList.add('aios-edit-selected');
      textarea.value = target.textContent || '';
      textEditor.classList.add('open');
      setTimeout(function() { textarea.focus(); }, 0);
    }
    function commitTextEdit() {
      if (!activeTextEl) return;
      const slide = activeTextEl.closest('[data-slide-id]');
      const patch = {
        op: 'replace_text',
        slideId: slide ? slide.getAttribute('data-slide-id') : '',
        blockId: activeTextEl.getAttribute('data-block-id') || '',
        text: textarea.value,
        createdAt: new Date().toISOString(),
      };
      activeTextEl.textContent = textarea.value;
      const patches = loadPatches();
      const idx = patches.findIndex(function(p) { return p.slideId === patch.slideId && p.blockId === patch.blockId; });
      if (idx >= 0) patches[idx] = patch; else patches.push(patch);
      savePatches(patches);
      postTextPatch(patch);
      clearTextEditor();
    }

    cancelTextBtn.addEventListener('click', function() { clearTextEditor(); });
    applyTextBtn.addEventListener('click', function() { commitTextEdit(); });
    textarea.addEventListener('keydown', function(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); commitTextEdit(); }
      if (e.key === 'Escape') { e.preventDefault(); clearTextEditor(); }
    });

    // ── Image editor ──
    const imageEditor = document.createElement('div');
    imageEditor.className = 'aios-image-editor';
    imageEditor.innerHTML = '<div class="aios-image-editor__title">替换 / 重新生成图片</div><div class="aios-image-editor__prompt-row"><input type="text" placeholder="图片描述 (image prompt)…" class="aios-image-editor__prompt-input"></div><div class="aios-image-editor__status"></div><div class="aios-image-editor__actions"><button type="button" class="aios-image-editor__cancel">取消</button><button type="button" class="aios-image-editor__regen">重新生成</button></div>';
    document.body.appendChild(imageEditor);
    const imgPromptInput = imageEditor.querySelector('.aios-image-editor__prompt-input');
    const imgStatus = imageEditor.querySelector('.aios-image-editor__status');
    const cancelImgBtn = imageEditor.querySelector('.aios-image-editor__cancel');
    const regenImgBtn = imageEditor.querySelector('.aios-image-editor__regen');
    let activeImgEl = null;
    let activeImgBlock = null;

    function clearImageEditor() {
      if (activeImgBlock) activeImgBlock.classList.remove('aios-image-selected');
      activeImgEl = null;
      activeImgBlock = null;
      imageEditor.classList.remove('open');
    }
    function openImageEditor(block) {
      clearTextEditor();
      if (activeImgBlock) activeImgBlock.classList.remove('aios-image-selected');
      activeImgBlock = block;
      activeImgBlock.classList.add('aios-image-selected');
      activeImgEl = block.tagName.toLowerCase() === 'img' ? block : block.querySelector('img');
      const existingPrompt = block.getAttribute('data-image-prompt') || (activeImgEl && activeImgEl.getAttribute('data-image-prompt')) || '';
      imgPromptInput.value = existingPrompt;
      imgStatus.textContent = '';
      imageEditor.classList.add('open');
      setTimeout(function() { imgPromptInput.focus(); }, 0);
    }
    function commitImageRegen() {
      if (!activeImgBlock) return;
      const slide = activeImgBlock.closest('[data-slide-id]');
      const slideId = slide ? slide.getAttribute('data-slide-id') : '';
      const blockId = activeImgBlock.getAttribute('data-block-id') || '';
      const prompt = imgPromptInput.value.trim();
      if (!prompt) { imgStatus.textContent = '请输入图片描述'; return; }
      postImageRegen(slideId, blockId, prompt, activeImgEl, imgStatus, activeImgBlock);
    }

    cancelImgBtn.addEventListener('click', function() { clearImageEditor(); });
    regenImgBtn.addEventListener('click', function() { commitImageRegen(); });
    imgPromptInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { e.preventDefault(); commitImageRegen(); }
      if (e.key === 'Escape') { e.preventDefault(); clearImageEditor(); }
    });

    // ── Unified click dispatcher ──
    document.addEventListener('click', function(event) {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      const imgBlock = target.closest('[data-block-id][data-block-type="image"]');
      if (imgBlock instanceof HTMLElement) {
        event.preventDefault();
        event.stopPropagation();
        openImageEditor(imgBlock);
        return;
      }
      const textBlock = target.closest('[data-block-id][data-block-type="text"]');
      if (textBlock instanceof HTMLElement) {
        event.preventDefault();
        event.stopPropagation();
        openTextEditor(textBlock);
        return;
      }
      if (!textEditor.contains(event.target)) clearTextEditor();
      if (!imageEditor.contains(event.target)) clearImageEditor();
    }, true);

    applySavedPatches();
  })();
</script>`

  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${scriptBlock}\n</body>`)
  return `${html}\n${scriptBlock}`
}

function serializeCandidateTemplates(selectedTemplateSlug: string, fallbackUsed: boolean, candidates: CandidateTemplateRecord[]): string {
  return JSON.stringify({
    selectedTemplateSlug,
    fallbackUsed,
    candidates,
  }, null, 2)
}

function blockId(slideIndex: number, itemIndex: number): string {
  return `block-${pad(slideIndex + 1)}-${pad(itemIndex + 1)}`
}

function slideId(index: number): string {
  return `slide-${pad(index + 1)}`
}

function findImageSrc(tagMarkup: string): string {
  const match = tagMarkup.match(/\ssrc=(["'])(.*?)\1/i)
  return match?.[2] ?? ''
}

function applyImagePlanning(
  slides: ContentModelSlide[],
  templateProfile: TemplateProfileRecord,
  options: HtmlPresentationJobOptions,
  outputDir: string,
): {
  plannedSlideIds: Set<string>
  placeholderBySlideId: Map<string, { block: ContentModelBlock; placement: ContentModelSlide['visual']['placement'] }>
  plannedImageCount: number
  generatedImageCount: number
  placeholderCount: number
} {
  if (!options.enableImages || options.maxImages <= 0) {
    return {
      plannedSlideIds: new Set(),
      placeholderBySlideId: new Map(),
      plannedImageCount: 0,
      generatedImageCount: 0,
      placeholderCount: 0,
    }
  }

  const eligibleSlides = slides
    .map((slide) => {
      let priority = 0
      if (slide.role === 'cover') priority += 100
      if (slide.role === 'image' || slide.role === 'section') priority += 70
      if (slide.role === 'content') priority += 40
      if (slide.role === 'agenda' || slide.role === 'comparison' || slide.role === 'timeline') priority -= 60
      if (/(场景|scene|vision|概念|concept|hero|封面)/i.test(`${slide.title} ${slide.subtitle}`)) priority += 30
      return { slide, priority }
    })
    .filter((item) => item.priority > -20)
    .sort((left, right) => right.priority - left.priority)
    .slice(0, options.maxImages)

  const plannedSlideIds = new Set<string>()
  const placeholderBySlideId = new Map<string, { block: ContentModelBlock; placement: ContentModelSlide['visual']['placement'] }>()
  let placeholderCount = 0
  let generatedImageCount = 0

  eligibleSlides.forEach(({ slide }) => {
    plannedSlideIds.add(slide.id)
    const prompt = buildVisualPrompt(templateProfile, slide)
    const existingImageBlock = slide.blocks.find((block) => block.type === 'image')
    const placement: ContentModelSlide['visual']['placement'] =
      slide.role === 'cover'
        ? 'hero'
        : slide.role === 'image'
          ? 'right'
          : slide.role === 'content'
            ? 'card'
            : 'inline'
    if (existingImageBlock) {
      existingImageBlock.imagePrompt = existingImageBlock.imagePrompt || prompt
      existingImageBlock.placement = placement
      if (!existingImageBlock.assetPath || isPlaceholderAssetPath(existingImageBlock.assetPath)) {
        existingImageBlock.assetPath = writePlaceholderAsset(outputDir, slide, existingImageBlock, prompt)
        existingImageBlock.placeholderUsed = true
        placeholderBySlideId.set(slide.id, { block: existingImageBlock, placement })
        placeholderCount += 1
      } else {
        existingImageBlock.placeholderUsed = false
      }
      slide.visual = {
        type: 'image',
        prompt,
        assetPath: existingImageBlock.assetPath,
        placement,
      }
      generatedImageCount += existingImageBlock.placeholderUsed ? 0 : 1
      return
    }

    const nextBlock: ContentModelBlock = {
      id: blockId(slide.index, slide.blocks.length),
      type: 'image',
      role: 'visual',
      text: '',
      assetPath: '',
      imagePrompt: prompt,
      placement,
      placeholderUsed: true,
    }
    nextBlock.assetPath = writePlaceholderAsset(outputDir, slide, nextBlock, prompt)
    slide.blocks.push(nextBlock)
    slide.visual = {
      type: 'image',
      prompt,
      assetPath: nextBlock.assetPath,
      placement,
    }
    placeholderBySlideId.set(slide.id, { block: nextBlock, placement })
    placeholderCount += 1
  })

  return {
    plannedSlideIds,
    placeholderBySlideId,
    plannedImageCount: eligibleSlides.length,
    generatedImageCount,
    placeholderCount,
  }
}

export function postProcessHtmlPresentationOutput(input: {
  jobId: string
  outputDir: string
  htmlPath: string
  title: string
  templateProfile: TemplateProfileRecord
  candidateTemplates: CandidateTemplateRecord[]
  selectedTemplateSlug: string
  fallbackUsed: boolean
  options: HtmlPresentationJobOptions
}): HtmlPresentationPostProcessResult {
  ensureOutputAssetsDir(input.outputDir)
  const contentModelPath = `${input.outputDir}/content-model.json`
  const templateProfilePath = `${input.outputDir}/template-profile.json`
  const candidateTemplatesPath = `${input.outputDir}/candidate-templates.json`
  const now = new Date().toISOString()

  let html = ensureSlideSections(fs.readFileSync(input.htmlPath, 'utf-8'))
  const slidePattern = /<section\b[^>]*class=(["'])[^"']*\bslide\b[^"']*\1[^>]*>[\s\S]*?<\/section>/gi
  const slideMatches = Array.from(html.matchAll(slidePattern))

  const slides: SlideWorkItem[] = slideMatches.map((match, index, allMatches) => {
    const original = match[0]
    const openingTagMatch = original.match(/^<section\b([^>]*)>/i)
    const inner = original.replace(/^<section\b[^>]*>/i, '').replace(/<\/section>\s*$/i, '')
    const currentSlideId = slideId(index)
    const cleanedSlideAttrs = stripManagedDataAttrs(openingTagMatch?.[1] ?? '')
    const updatedOpenTag = openingTagMatch
      ? `<section${cleanedSlideAttrs} data-slide-id="${currentSlideId}">`
      : `<section class="slide" data-slide-id="${currentSlideId}">`

    let blockIndex = 0
    let seenTitle = false
    let seenSubtitle = false
    const blocks: ContentModelBlock[] = []
    const bullets: string[] = []
    let slideInner = inner

    slideInner = slideInner.replace(/<(h[1-6]|p|li|figcaption|blockquote|small)\b([^>]*)>([\s\S]*?)<\/\1>/gi, (full, tagName: string, attrs: string, body: string) => {
      const text = stripTags(body)
      if (!text) return full
      const role = determineTextRole(tagName, text, seenTitle, seenSubtitle)
      if (role === 'title') seenTitle = true
      if (role === 'subtitle') seenSubtitle = true
      const currentBlockId = blockId(index, blockIndex)
      blockIndex += 1
      const cleanedAttrs = stripManagedDataAttrs(attrs)
      blocks.push({
        id: currentBlockId,
        type: 'text',
        role,
        text,
        assetPath: '',
        imagePrompt: '',
      })
      if (tagName.toLowerCase() === 'li') bullets.push(text)
      return `<${tagName}${cleanedAttrs} data-block-id="${currentBlockId}" data-block-type="text" data-block-role="${role}">${body}</${tagName}>`
    })

    slideInner = slideInner.replace(/<(div|figure)\b([^>]*?(?:data-block-type=(["'])image\3|placeholder-svg|image-placeholder|visual-placeholder)[^>]*)>/gi, (full, tagName: string, attrs: string) => {
      const currentBlockId = blockId(index, blockIndex)
      blockIndex += 1
      const cleanedAttrs = stripManagedDataAttrs(attrs)
      blocks.push({
        id: currentBlockId,
        type: 'image',
        role: 'visual',
        text: '',
        assetPath: '',
        imagePrompt: '',
        placement: 'right',
        placeholderUsed: true,
      })
      return `<${tagName}${cleanedAttrs} data-block-id="${currentBlockId}" data-block-type="image" data-block-role="visual" data-image-prompt="">`
    })

    slideInner = slideInner.replace(/<img\b([^>]*?)\/?>/gi, (full, attrs: string) => {
      const currentBlockId = blockId(index, blockIndex)
      blockIndex += 1
      const cleanedAttrs = stripManagedDataAttrs(attrs)
      const src = findImageSrc(full)
      blocks.push({
        id: currentBlockId,
        type: 'image',
        role: 'visual',
        text: '',
        assetPath: src,
        imagePrompt: '',
        placement: 'right',
        placeholderUsed: isPlaceholderAssetPath(src),
      })
      return `<img${cleanedAttrs} data-block-id="${currentBlockId}" data-block-type="image" data-block-role="visual" data-image-prompt="">`
    })

    const titleBlock = blocks.find((block) => block.role === 'title')
    const subtitleBlock = blocks.find((block) => block.role === 'subtitle')
    const hasImage = blocks.some((block) => block.type === 'image')
    const role = inferSlideRole(index, allMatches.length, titleBlock?.text ?? '', bullets, hasImage)

    const model: ContentModelSlide = {
      id: currentSlideId,
      index,
      role,
      title: titleBlock?.text ?? '',
      subtitle: subtitleBlock?.text ?? '',
      bullets,
      layoutHint: inferLayoutHint(role, hasImage),
      blocks,
      visual: {
        type: hasImage ? 'image' : 'none',
        prompt: '',
        assetPath: blocks.find((block) => block.type === 'image')?.assetPath ?? '',
        placement: role === 'cover' ? 'hero' : 'right',
      },
    }

    return {
      matchIndex: index,
      start: match.index ?? 0,
      end: (match.index ?? 0) + original.length,
      original,
      updated: `${updatedOpenTag}${slideInner}</section>`,
      model,
    }
  })

  const planning = applyImagePlanning(
    slides.map((item) => item.model),
    input.templateProfile,
    input.options,
    input.outputDir,
  )

  slides.forEach((item) => {
    const imageBlock = item.model.blocks.find((block) => block.type === 'image')
    const visualPlacement = normalizeVisualPlacement(item.model.visual?.placement ?? imageBlock?.placement)
    item.updated = item.updated.replace(
      /^<section\b([^>]*)>/i,
      (_full, attrs: string) => `<section${attrs} data-aios-has-visual="${imageBlock ? 'true' : 'false'}" data-aios-visual-placement="${visualPlacement}">`,
    )
    if (!imageBlock) return
    imageBlock.placement = visualPlacement
    imageBlock.placeholderUsed = imageBlock.placeholderUsed ?? isPlaceholderAssetPath(imageBlock.assetPath)
    const managedMarkup = renderManagedImageMarkup({ block: imageBlock, slide: item.model })
    const replaced = replaceManagedImageBlock(item.updated, imageBlock.id, managedMarkup)
    item.updated = replaced.replaced ? replaced.html : insertManagedImageBlock(item.updated, managedMarkup)
  })

  slides.forEach((item) => {
    item.updated = stripNonCanonicalManagedAttrs(item.updated)
  })

  let rebuiltHtml = ''
  let cursor = 0
  for (const item of slides) {
    rebuiltHtml += html.slice(cursor, item.start)
    rebuiltHtml += item.updated
    cursor = item.end
  }
  rebuiltHtml += html.slice(cursor)
  rebuiltHtml = injectSharedStyles(rebuiltHtml)
  rebuiltHtml = injectEditRuntime(rebuiltHtml, input.jobId)
  fs.writeFileSync(input.htmlPath, rebuiltHtml, 'utf-8')

  const contentModel: ContentModelRecord = {
    deckId: input.jobId,
    title: slides[0]?.model.title || input.title,
    subtitle: slides[0]?.model.subtitle || '',
    templateSlug: input.selectedTemplateSlug,
    theme: input.templateProfile.colorScheme,
    slides: slides.map((item) => item.model),
    assets: slides.flatMap((item) => item.model.blocks)
      .filter((block) => block.type === 'image' && block.assetPath)
      .map((block) => ({
        blockId: block.id,
        slideId: slides.find((slide) => slide.model.blocks.some((candidate) => candidate.id === block.id))?.model.id ?? '',
        assetPath: block.assetPath,
        imagePrompt: block.imagePrompt,
        placeholderUsed: block.placeholderUsed,
      })),
    createdAt: now,
    updatedAt: now,
  }

  const layoutHints = Array.from(new Set(contentModel.slides.map((slide) => slide.layoutHint)))
  const templateProfile: TemplateProfileRecord = {
    ...input.templateProfile,
    availableLayouts: layoutHints,
  }

  fs.writeFileSync(contentModelPath, JSON.stringify(contentModel, null, 2), 'utf-8')
  fs.writeFileSync(templateProfilePath, JSON.stringify(templateProfile, null, 2), 'utf-8')
  fs.writeFileSync(
    candidateTemplatesPath,
    serializeCandidateTemplates(input.selectedTemplateSlug, input.fallbackUsed, input.candidateTemplates),
    'utf-8',
  )

  return {
    contentModelPath,
    templateProfilePath,
    candidateTemplatesPath,
    selectedTemplateSlug: input.selectedTemplateSlug,
    candidateTemplateSlugs: input.candidateTemplates.map((candidate) => candidate.slug),
    fallbackUsed: input.fallbackUsed,
    imagePlanningEnabled: input.options.enableImages,
    plannedImageCount: planning.plannedImageCount,
    generatedImageCount: planning.generatedImageCount,
    placeholderCount: planning.placeholderCount,
    contentModel,
  }
}

function renderBlocksForTemplate(slide: ContentModelSlide): string {
  const textBlocks = slide.blocks.filter((block) => block.type === 'text')
  const imageBlock = slide.blocks.find((block) => block.type === 'image')
  const bullets = slide.bullets.length > 0
    ? `<ul>${slide.bullets.map((item, index) => `<li data-block-id="${slide.blocks.find((block) => block.role === 'body' && block.text === item)?.id ?? blockId(slide.index, index)}" data-block-type="text" data-block-role="body">${escapeHtml(item)}</li>`).join('')}</ul>`
    : ''
  const paragraphs = textBlocks
    .filter((block) => !['title', 'subtitle'].includes(block.role))
    .map((block) => `<p data-block-id="${block.id}" data-block-type="text" data-block-role="${block.role}">${escapeHtml(block.text)}</p>`)
    .join('')
  return `
    <div class="content-shell">
      ${textBlocks.find((block) => block.role === 'title') ? `<h1 data-block-id="${textBlocks.find((block) => block.role === 'title')?.id}" data-block-type="text" data-block-role="title">${escapeHtml(textBlocks.find((block) => block.role === 'title')?.text ?? '')}</h1>` : ''}
      ${textBlocks.find((block) => block.role === 'subtitle') ? `<p class="subtitle" data-block-id="${textBlocks.find((block) => block.role === 'subtitle')?.id}" data-block-type="text" data-block-role="subtitle">${escapeHtml(textBlocks.find((block) => block.role === 'subtitle')?.text ?? '')}</p>` : ''}
      ${bullets || paragraphs}
      ${imageBlock ? renderManagedImageMarkup({ block: imageBlock, slide }) : ''}
    </div>
  `
}

export function rebuildHtmlPresentationFromContentModel(input: {
  contentModel: ContentModelRecord
  templateProfile: TemplateProfileRecord
  artifactId?: string
}): string {
  const slidesHtml = input.contentModel.slides
    .map((slide) => {
      const imageBlock = slide.blocks.find((block) => block.type === 'image')
      const rendered = renderBlocksForTemplate({
        ...slide,
        blocks: slide.blocks.map((block) => (
          block.type === 'image'
            ? { ...block, assetPath: resolveHtmlPresentationAssetUrl(block.assetPath, input.artifactId) }
            : block
        )),
      })
      return `<section class="slide" data-slide-id="${slide.id}" data-aios-has-visual="${imageBlock ? 'true' : 'false'}" data-aios-visual-placement="${normalizeVisualPlacement(slide.visual?.placement ?? imageBlock?.placement)}">${rendered}</section>`
    })
    .join('\n')
  return `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(input.contentModel.title || 'HTML PPT')}</title>
    <style>
      :root { color-scheme: ${input.templateProfile.colorScheme === 'dark' ? 'dark' : 'light'}; }
      * { box-sizing: border-box; }
      body { margin: 0; font-family: system-ui, -apple-system, sans-serif; background: ${input.templateProfile.colorScheme === 'dark' ? '#0f172a' : '#f8fbff'}; color: ${input.templateProfile.colorScheme === 'dark' ? '#f8fafc' : '#10213a'}; }
      .deck { width: 100%; }
      .slide { width: 100vw; height: 100vh; padding: 56px; display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 32px; align-items: center; position: relative; overflow: hidden; border-bottom: 1px solid rgba(148, 163, 184, 0.18); }
      .content-shell h1 { font-size: clamp(2.2rem, 4vw, 4rem); margin: 0 0 16px; line-height: 1.12; }
      .content-shell .subtitle { font-size: clamp(1rem, 1.8vw, 1.35rem); opacity: 0.72; margin: 0 0 18px; }
      .content-shell p, .content-shell li { font-size: clamp(0.98rem, 1.25vw, 1.15rem); line-height: 1.7; }
      .content-shell ul { margin: 18px 0 0; padding-left: 1.25rem; }
      .visual-shell { display: flex; justify-content: center; align-items: center; }
      .visual-shell img { width: 100%; max-width: 520px; max-height: 52vh; object-fit: contain; border-radius: 18px; box-shadow: 0 18px 50px rgba(15, 23, 42, 0.18); }
      @media (max-width: 900px) { .slide { grid-template-columns: 1fr; padding: 28px; } }
    </style>
  </head>
  <body>
    <main class="deck">
      ${slidesHtml}
    </main>
  </body>
</html>`
}
