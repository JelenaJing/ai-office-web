/**
 * Slidev HTML Preview Shell
 *
 * Generates a self-contained HTML file that renders Slidev Markdown
 * as a simple slide-by-slide web presentation.
 *
 * Does NOT call the real Slidev CLI. This is a deterministic MVP preview shell
 * that parses the Markdown and renders slides as styled 16:9 cards.
 *
 * No external CDN, no user script execution, safe for iframe embedding.
 */

interface ParsedSlide {
  frontmatter: Record<string, string>
  content: string
  notes: string
}

function parseSlidesFromMarkdown(markdown: string): ParsedSlide[] {
  const raw = String(markdown || '')

  // Split on slide separators (lines that are exactly ---)
  const chunks = raw.split(/\n---\n/)

  const slides: ParsedSlide[] = []

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i].trim()
    if (!chunk) continue

    const frontmatter: Record<string, string> = {}
    let content = chunk
    let notes = ''

    // Parse optional YAML-like frontmatter block at top of each chunk
    // A chunk starting with key: value lines (before a blank line or heading)
    const fmLines: string[] = []
    const bodyLines: string[] = []
    let inFm = false
    let fmDone = false

    // First chunk might start with theme/title frontmatter (already handled by global split)
    // For all chunks: if first lines are YAML key:value, treat as frontmatter
    for (const line of chunk.split('\n')) {
      if (!fmDone) {
        const fm = line.match(/^([a-zA-Z_]+):\s*(.*)$/)
        if (fm && !line.startsWith('#') && !line.startsWith('-') && !line.startsWith('>')) {
          frontmatter[fm[1]] = fm[2].replace(/^['"]|['"]$/g, '')
          inFm = true
          fmLines.push(line)
          continue
        } else if (inFm && line.trim() === '') {
          fmDone = true
          continue
        } else {
          fmDone = true
        }
      }
      bodyLines.push(line)
    }

    content = bodyLines.join('\n').trim()

    // Extract speaker notes from <!-- ... -->
    const notesMatch = content.match(/<!--([\s\S]*?)-->/)
    if (notesMatch) {
      notes = notesMatch[1].trim()
      content = content.replace(/<!--[\s\S]*?-->/g, '').trim()
    }

    if (content || Object.keys(frontmatter).length > 0) {
      slides.push({ frontmatter, content, notes })
    }
  }

  // Ensure at least one slide
  if (slides.length === 0) {
    slides.push({ frontmatter: {}, content: '# 演示文稿', notes: '' })
  }

  return slides
}

function markdownToHtml(md: string): string {
  let html = escapeHtml(md)

  // Headings
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')

  // Bold/italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // Tables
  html = html.replace(/(\|.+\|\n\|[-| :]+\|\n(?:\|.+\|\n?)+)/g, (table) => {
    const rows = table.trim().split('\n').filter((r) => r.trim())
    let result = '<table><thead><tr>'
    const headers = rows[0].split('|').filter((c) => c.trim())
    result += headers.map((h) => `<th>${h.trim()}</th>`).join('')
    result += '</tr></thead><tbody>'
    for (let i = 2; i < rows.length; i++) {
      const cells = rows[i].split('|').filter((c) => c.trim())
      result += '<tr>' + cells.map((c) => `<td>${c.trim()}</td>`).join('') + '</tr>'
    }
    result += '</tbody></table>'
    return result
  })

  // Code blocks (show as pre/code, don't execute)
  html = html.replace(/```[\w]*\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>')

  // Blockquote
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')

  // Lists
  html = html.replace(/((?:^- .+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map((line) => `<li>${line.replace(/^- /, '')}</li>`).join('')
    return `<ul>${items}</ul>`
  })
  html = html.replace(/((?:^\d+\. .+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map((line) => `<li>${line.replace(/^\d+\. /, '')}</li>`).join('')
    return `<ol>${items}</ol>`
  })

  // Paragraphs
  html = html.replace(/\n\n+/g, '</p><p>')
  html = `<p>${html}</p>`

  // Clean empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '')
  html = html.replace(/<p>(<[hou][^>]*>)/g, '$1')
  html = html.replace(/(<\/[hou][^>]*>)<\/p>/g, '$1')

  return html
}

function escapeHtml(text: string): string {
  return text
    .replace(/&(?!lt;|gt;|amp;|quot;)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderSlideHtml(slide: ParsedSlide, index: number, total: number): string {
  const isCenter = slide.frontmatter.class === 'text-center' || slide.frontmatter.layout === 'cover'
  const contentHtml = markdownToHtml(slide.content)

  return `
  <div class="slide${isCenter ? ' slide-center' : ''}" id="slide-${index + 1}" data-slide="${index + 1}">
    <div class="slide-inner">
      ${contentHtml}
    </div>
    <div class="slide-footer">
      <span class="slide-num">${index + 1} / ${total}</span>
      ${slide.notes ? `<span class="slide-notes-icon" title="${escapeHtml(slide.notes)}">💬</span>` : ''}
    </div>
  </div>`
}

export function generateSlidevHtmlPreview(input: {
  title: string
  slidevMarkdown: string
}): string {
  const { title, slidevMarkdown } = input
  const slides = parseSlidesFromMarkdown(slidevMarkdown)
  const total = slides.length

  const slidesHtml = slides.map((slide, i) => renderSlideHtml(slide, i, total)).join('\n')

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(title || '演示文稿')} — Slidev Preview</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif;
    background: #1a1a2e;
    color: #e8f0fe;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24px 16px 40px;
    gap: 0;
  }
  .deck-title {
    font-size: 15px;
    font-weight: 700;
    color: #8bbbf8;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 24px;
    opacity: 0.8;
  }
  .slides-container {
    display: flex;
    flex-direction: column;
    gap: 24px;
    width: 100%;
    max-width: 960px;
  }
  .slide {
    width: 100%;
    aspect-ratio: 16 / 9;
    background: linear-gradient(135deg, #ffffff 0%, #f0f4ff 100%);
    border-radius: 12px;
    overflow: hidden;
    position: relative;
    box-shadow: 0 12px 40px rgba(0,0,0,0.45);
    color: #1e2d3d;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  .slide:hover {
    transform: translateY(-2px);
    box-shadow: 0 20px 50px rgba(0,0,0,0.55);
  }
  .slide.slide-active {
    outline: 3px solid #3b82f6;
    outline-offset: 2px;
  }
  .slide-center .slide-inner {
    text-align: center;
    justify-content: center;
    align-items: center;
  }
  .slide-inner {
    flex: 1;
    padding: 6% 7%;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow: hidden;
  }
  .slide-inner h1 {
    font-size: clamp(20px, 3.5vw, 36px);
    font-weight: 900;
    color: #0f2847;
    line-height: 1.2;
  }
  .slide-inner h2 {
    font-size: clamp(16px, 2.5vw, 26px);
    font-weight: 700;
    color: #1e3a5f;
  }
  .slide-inner h3 {
    font-size: clamp(14px, 2vw, 20px);
    font-weight: 600;
    color: #2c4a6e;
  }
  .slide-inner p {
    font-size: clamp(12px, 1.6vw, 16px);
    line-height: 1.65;
    color: #3a4d5c;
  }
  .slide-inner ul, .slide-inner ol {
    padding-left: 1.4em;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .slide-inner li {
    font-size: clamp(12px, 1.5vw, 15px);
    line-height: 1.6;
    color: #364555;
  }
  .slide-inner blockquote {
    border-left: 4px solid #3b82f6;
    padding-left: 16px;
    font-style: italic;
    color: #4a6580;
    font-size: clamp(13px, 1.8vw, 17px);
  }
  .slide-inner table {
    width: 100%;
    border-collapse: collapse;
    font-size: clamp(11px, 1.3vw, 14px);
  }
  .slide-inner th {
    background: #e8f0fe;
    color: #1a3a5c;
    font-weight: 700;
    padding: 6px 10px;
    text-align: left;
    border: 1px solid #c5d8ef;
  }
  .slide-inner td {
    padding: 5px 10px;
    border: 1px solid #dce8f5;
    color: #3a4d5c;
  }
  .slide-inner pre {
    background: #0f2847;
    color: #a8d8ea;
    padding: 12px;
    border-radius: 8px;
    font-size: clamp(10px, 1.2vw, 13px);
    overflow: auto;
    max-height: 180px;
  }
  .slide-inner strong { color: #0f2847; }
  .slide-footer {
    padding: 6px 16px;
    background: rgba(0,0,0,0.04);
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid rgba(0,0,0,0.06);
    flex-shrink: 0;
  }
  .slide-num {
    font-size: 11px;
    color: #7a98b4;
    font-weight: 600;
  }
  .slide-notes-icon { font-size: 14px; cursor: help; }

  /* Navigation bar */
  .nav-bar {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(10, 20, 40, 0.88);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 99px;
    padding: 8px 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    backdrop-filter: blur(8px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    z-index: 100;
  }
  .nav-btn {
    background: none;
    border: none;
    color: #8bbcf8;
    font-size: 18px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 8px;
    transition: background 0.1s;
  }
  .nav-btn:hover { background: rgba(255,255,255,0.1); }
  .nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
  .nav-counter {
    color: #a0c4f8;
    font-size: 13px;
    font-weight: 600;
    min-width: 60px;
    text-align: center;
  }
  .slidev-badge {
    position: fixed;
    top: 12px;
    right: 16px;
    background: rgba(10, 20, 40, 0.85);
    border: 1px solid rgba(100,150,220,0.4);
    border-radius: 8px;
    padding: 4px 12px;
    font-size: 11px;
    color: #8bbcf8;
    font-weight: 700;
    letter-spacing: 0.06em;
    z-index: 100;
  }
</style>
</head>
<body>
<div class="slidev-badge">⚡ Slidev Preview</div>
<div class="deck-title">${escapeHtml(title || '演示文稿')}</div>
<div class="slides-container" id="slides-container">
${slidesHtml}
</div>
<nav class="nav-bar">
  <button class="nav-btn" id="btn-prev" onclick="navSlide(-1)" title="上一页">◀</button>
  <span class="nav-counter" id="nav-counter">1 / ${total}</span>
  <button class="nav-btn" id="btn-next" onclick="navSlide(1)" title="下一页">▶</button>
</nav>
<script>
(function() {
  var current = 0;
  var total = ${total};
  var slides = document.querySelectorAll('.slide');
  function updateNav() {
    document.getElementById('nav-counter').textContent = (current + 1) + ' / ' + total;
    document.getElementById('btn-prev').disabled = current === 0;
    document.getElementById('btn-next').disabled = current === total - 1;
    slides.forEach(function(s, i) {
      s.classList.toggle('slide-active', i === current);
    });
    slides[current].scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  window.navSlide = function(delta) {
    current = Math.max(0, Math.min(total - 1, current + delta));
    updateNav();
  };
  slides.forEach(function(s, i) {
    s.addEventListener('click', function() { current = i; updateNav(); });
  });
  updateNav();
  document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') navSlide(1);
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') navSlide(-1);
  });
})();
</script>
</body>
</html>`
}
