/** Slidev HTML iframe ↔ 父页面 postMessage 协议 */

export type SlidevPreviewOutboundMessage =
  | { type: 'ppt-slide-active'; slideIndex: number; slideId?: string }
  | { type: 'ppt-element-selected'; slideIndex: number; slideId?: string; selector: string; tagName: string; textPreview: string }
  | { type: 'ppt-preview-ready'; slideCount: number }

export type SlidevPreviewInboundMessage =
  | { type: 'ppt-set-slide'; slideIndex: number }
  | { type: 'ppt-selection-mode'; enabled: boolean }
  | { type: 'ppt-scroll-to-slide'; slideIndex: number }

const BRIDGE_SOURCE = 'aioffice-slidev-preview'

export function isSlidevPreviewMessage(data: unknown): data is SlidevPreviewOutboundMessage & { source?: string } {
  if (!data || typeof data !== 'object') return false
  const record = data as Record<string, unknown>
  if (record.source !== BRIDGE_SOURCE) return false
  const type = record.type
  return type === 'ppt-slide-active'
    || type === 'ppt-element-selected'
    || type === 'ppt-preview-ready'
}

export function postToSlidevPreview(
  iframe: HTMLIFrameElement | null,
  message: SlidevPreviewInboundMessage,
): void {
  iframe?.contentWindow?.postMessage({ ...message, source: 'aioffice-slidev-parent' }, '*')
}

export function subscribeSlidevPreview(
  handler: (message: SlidevPreviewOutboundMessage) => void,
): () => void {
  const listener = (event: MessageEvent) => {
    if (!isSlidevPreviewMessage(event.data)) return
    const { source: _source, ...payload } = event.data as SlidevPreviewOutboundMessage & { source?: string }
    handler(payload)
  }
  window.addEventListener('message', listener)
  return () => window.removeEventListener('message', listener)
}

export function buildSlidevPreviewBridgeScript(): string {
  return `<script>
(function () {
  var SOURCE = '${BRIDGE_SOURCE}';
  function post(payload) {
    try { window.parent.postMessage(Object.assign({ source: SOURCE }, payload), '*'); } catch (e) {}
  }
  var slides = Array.prototype.slice.call(document.querySelectorAll('section.slide[data-slide-index]'));
  var activeIndex = 0;
  var selectionEnabled = false;
  var highlightEl = null;

  function clearHighlight() {
    if (highlightEl) {
      highlightEl.classList.remove('ppt-select-highlight');
      highlightEl = null;
    }
  }

  function showSlide(index) {
    if (!slides.length) return;
    activeIndex = Math.max(0, Math.min(index, slides.length - 1));
    slides.forEach(function (slide, i) {
      slide.style.display = i === activeIndex ? 'flex' : 'none';
    });
    var current = slides[activeIndex];
    post({
      type: 'ppt-slide-active',
      slideIndex: activeIndex,
      slideId: current ? current.getAttribute('data-slide-id') || undefined : undefined,
    });
  }

  function buildSelector(el) {
    var parts = [];
    var node = el;
    while (node && node !== document.body && parts.length < 6) {
      var tag = node.tagName ? node.tagName.toLowerCase() : 'div';
      var id = node.id ? '#' + node.id : '';
      var cls = node.classList && node.classList.length
        ? '.' + Array.prototype.slice.call(node.classList).slice(0, 2).join('.')
        : '';
      parts.unshift(tag + id + cls);
      node = node.parentElement;
    }
    return parts.join(' > ');
  }

  function onPointerMove(event) {
    if (!selectionEnabled) return;
    var target = event.target;
    if (!(target instanceof Element)) return;
    var slide = target.closest('section.slide');
    if (!slide || Number(slide.getAttribute('data-slide-index')) !== activeIndex) return;
    if (target.closest('.slide-footer, .speaker-notes')) return;
    clearHighlight();
    highlightEl = target;
    target.classList.add('ppt-select-highlight');
  }

  function onClick(event) {
    if (!selectionEnabled) return;
    var target = event.target;
    if (!(target instanceof Element)) return;
    var slide = target.closest('section.slide');
    if (!slide) return;
    event.preventDefault();
    event.stopPropagation();
    var slideIndex = Number(slide.getAttribute('data-slide-index'));
    var text = (target.textContent || '').trim().slice(0, 240);
    post({
      type: 'ppt-element-selected',
      slideIndex: slideIndex,
      slideId: slide.getAttribute('data-slide-id') || undefined,
      selector: buildSelector(target),
      tagName: target.tagName.toLowerCase(),
      textPreview: text,
    });
  }

  window.addEventListener('message', function (event) {
    var data = event.data;
    if (!data || data.source !== 'aioffice-slidev-parent') return;
    if (data.type === 'ppt-set-slide' || data.type === 'ppt-scroll-to-slide') {
      showSlide(Number(data.slideIndex) || 0);
    }
    if (data.type === 'ppt-selection-mode') {
      selectionEnabled = Boolean(data.enabled);
      document.body.classList.toggle('ppt-selection-active', selectionEnabled);
      if (!selectionEnabled) clearHighlight();
    }
  });

  document.addEventListener('pointermove', onPointerMove, true);
  document.addEventListener('click', onClick, true);
  showSlide(0);
  post({ type: 'ppt-preview-ready', slideCount: slides.length });
})();
</script>`
}
