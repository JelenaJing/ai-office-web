/**
 * API service – 对接 paper-remake-service 后端
 */

const BASE = '';

/* ==================== Upload PDF ==================== */
export async function uploadPDF(file: File): Promise<{
  status: string;
  project_id: string;
  paper_filename: string;
  message?: string;
}> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${BASE}/api/v1/paper/upload`, {
    method: 'POST',
    body: fd,
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Upload failed: ${res.status}`);
  }
  return res.json();
}

/* ==================== Get project info ==================== */
export async function getProject(projectId: string) {
  const res = await fetch(`${BASE}/api/v1/paper/${projectId}`);
  if (!res.ok) throw new Error(`Get project failed: ${res.status}`);
  return res.json();
}

/* ==================== Introduction Remake (SSE) ==================== */
export type SSEHandlers = {
  onMeta?: (data: Record<string, unknown>) => void;
  onDelta?: (text: string) => void;
  onDone?: (data: Record<string, unknown>) => void;
  onError?: (msg: string) => void;
};

function processSseBuffer(buffer: string, handlers: SSEHandlers): string {
  const sep = '\n\n';
  let rest = buffer;
  let idx: number;
  while ((idx = rest.indexOf(sep)) >= 0) {
    const block = rest.slice(0, idx);
    rest = rest.slice(idx + sep.length);
    let event = 'message';
    const dataLines: string[] = [];
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) dataLines.push(line.slice(5));
    }
    const raw = dataLines.join('\n');
    if (event === 'meta') {
      try { handlers.onMeta?.(JSON.parse(raw)); } catch { handlers.onMeta?.({ raw }); }
    } else if (event === 'delta') {
      handlers.onDelta?.(raw);
    } else if (event === 'done') {
      try { handlers.onDone?.(JSON.parse(raw)); } catch { handlers.onDone?.({ raw }); }
    } else if (event === 'error') {
      handlers.onError?.(raw);
    }
  }
  return rest;
}

async function streamSSE(path: string, body: object, handlers: SSEHandlers, signal?: AbortSignal) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) {
    const t = await res.text();
    handlers.onError?.(t || `HTTP ${res.status}`);
    return;
  }
  const reader = res.body?.getReader();
  if (!reader) { handlers.onError?.('No response body'); return; }
  const dec = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    buf = processSseBuffer(buf, handlers);
  }
  if (buf.trim()) processSseBuffer(buf + '\n\n', handlers);
}

export function streamIntroductionRemake(
  projectId: string,
  handlers: SSEHandlers,
  options?: { context?: string; autoExtractIntro?: boolean; maxPapersForLlm?: number },
  signal?: AbortSignal,
) {
  return streamSSE('/api/v1/remake/introduction/stream', {
    project_id: projectId,
    selected_text: '',
    context: options?.context,
    auto_extract_intro: options?.autoExtractIntro ?? true,
    max_papers_for_llm: options?.maxPapersForLlm ?? 100,
  }, handlers, signal);
}

/* ==================== Idea generation (non-stream) ==================== */
export async function generateIdeaFulltext(
  projectId: string,
  options?: { target_chars?: number; overlap_chars?: number },
): Promise<{
  status: string;
  ideas: string;
  message?: string;
  data?: Record<string, unknown>;
}> {
  const res = await fetch(`${BASE}/api/v1/remake/idea/fulltext`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      project_id: projectId,
      target_chars: options?.target_chars ?? 6000,
      overlap_chars: options?.overlap_chars ?? 300,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Idea generation failed: ${res.status}`);
  }
  return res.json();
}

export async function generateIdea(
  projectId: string,
  selectedText: string,
  context?: string,
): Promise<{
  status: string;
  ideas: string;
  message?: string;
}> {
  const res = await fetch(`${BASE}/api/v1/remake/idea`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      project_id: projectId,
      selected_text: selectedText,
      context,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Idea generation failed: ${res.status}`);
  }
  return res.json();
}
