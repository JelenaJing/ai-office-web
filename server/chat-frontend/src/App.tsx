import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  uploadPDF,
  streamIntroductionRemake,
  generateIdeaFulltext,
  type SSEHandlers,
} from './services/api';

/** 将后端返回的 ideas 对象数组格式化为 Markdown 文本 */
function formatIdeas(ideas: unknown): string {
  if (typeof ideas === 'string') return ideas;
  if (!Array.isArray(ideas) || ideas.length === 0) return '未生成有效内容。';

  // 如果只有一个 "Synthesis failed" 条目，尝试从 description 中解析真实 ideas
  if (ideas.length === 1 && ideas[0]?.title === 'Synthesis failed' && typeof ideas[0]?.description === 'string') {
    const raw = ideas[0].description as string;
    try {
      const parsed = JSON.parse(raw);
      const realIdeas = parsed?.ideas ?? parsed;
      if (Array.isArray(realIdeas) && realIdeas.length > 0) {
        return formatIdeas(realIdeas);
      }
    } catch {
      // 尝试修复截断的 JSON
      try {
        const fixed = raw.substring(0, raw.lastIndexOf('}') + 1) + ']}';
        const parsed2 = JSON.parse(fixed);
        const realIdeas2 = parsed2?.ideas ?? parsed2;
        if (Array.isArray(realIdeas2) && realIdeas2.length > 0) {
          return formatIdeas(realIdeas2);
        }
      } catch { /* give up */ }
    }
    // 实在解析不了，把 raw 显示为代码块
    if (raw.length > 100) return `> ⚠️ Idea 合成步骤异常，以下为原始输出：\n\n${raw}`;
  }

  return ideas.map((idea: Record<string, unknown>, i: number) => {
    const title = idea.title || `Idea ${i + 1}`;
    const desc = idea.description || '';
    const innov = idea.innovation || '';
    const refs = Array.isArray(idea.references) ? idea.references : [];
    let md = `### 💡 ${i + 1}. ${title}\n\n${desc}`;
    if (innov) md += `\n\n**🔬 创新点：** ${innov}`;
    if (refs.length > 0) {
      md += '\n\n**📚 相关文献：**\n';
      refs.forEach((r: unknown) => { md += `- ${r}\n`; });
    }
    return md;
  }).join('\n\n---\n\n');
}

/* ==================== Types ==================== */
type MessageRole = 'user' | 'assistant' | 'system';

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  file?: { name: string; size: number };
  status?: 'uploading' | 'processing' | 'streaming' | 'success' | 'error';
  actions?: ('remake' | 'intro' | 'idea')[];
  /** meta from SSE */
  meta?: Record<string, unknown>;
  /** pipeline step label */
  pipelineStep?: 'intro' | 'idea';
}

interface Session {
  id: string;
  name: string;
  projectId: string | null;
  fileName: string | null;
  messages: ChatMessage[];
  createdAt: number;
}

/* ==================== Icons (inline SVG) ==================== */
const Icon = {
  Plus: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
  ),
  Send: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
  ),
  Paperclip: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
  ),
  FileText: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
  ),
  X: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
  ),
  Trash: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
  ),
  Copy: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
  ),
  Bot: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>
  ),
  BookOpen: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
  ),
  Lightbulb: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>
  ),
  MessageSquare: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  ),
  Check: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
  ),
  Rocket: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>
  ),
};

/* ==================== Helpers ==================== */
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const fmtTime = (ts: number) => new Date(ts).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
const fmtSize = (b: number) => b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;

/* ==================== App ==================== */
export default function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const activeSession = sessions.find((s) => s.id === activeId) ?? null;

  /* auto scroll */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages]);

  /* auto-resize textarea */
  useEffect(() => {
    const el = textareaRef.current;
    if (el) { el.style.height = '24px'; el.style.height = Math.min(el.scrollHeight, 120) + 'px'; }
  }, [inputText]);

  /* ---- session CRUD ---- */
  const createSession = useCallback(() => {
    const s: Session = { id: uid(), name: '新对话', projectId: null, fileName: null, messages: [], createdAt: Date.now() };
    setSessions((prev) => [s, ...prev]);
    setActiveId(s.id);
    setInputText('');
    setPendingFile(null);
    return s;
  }, []);

  const updateSession = useCallback((id: string, patch: Partial<Session>) => {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  const pushMessage = useCallback((sessionId: string, msg: ChatMessage) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, messages: [...s.messages, msg] } : s)),
    );
  }, []);

  const updateLastAssistantMsg = useCallback((sessionId: string, patch: Partial<ChatMessage>) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== sessionId) return s;
        const msgs = [...s.messages];
        for (let i = msgs.length - 1; i >= 0; i--) {
          if (msgs[i].role === 'assistant') {
            msgs[i] = { ...msgs[i], ...patch };
            break;
          }
        }
        return { ...s, messages: msgs };
      }),
    );
  }, []);

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeId === id) setActiveId(null);
  }, [activeId]);

  /* ---- file pick ---- */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && f.type === 'application/pdf') setPendingFile(f);
    e.target.value = '';
  };

  /* ---- send message / upload ---- */
  const handleSend = async () => {
    if (busy) return;
    const text = inputText.trim();
    const file = pendingFile;
    if (!text && !file) return;

    let session = activeSession;
    if (!session) session = createSession();
    const sid = session!.id;

    setInputText('');
    setPendingFile(null);

    /* user message */
    const userMsg: ChatMessage = {
      id: uid(),
      role: 'user',
      content: text || (file ? `上传文件: ${file.name}` : ''),
      timestamp: Date.now(),
      file: file ? { name: file.name, size: file.size } : undefined,
    };
    pushMessage(sid, userMsg);

    /* If there's a file, upload it */
    if (file) {
      setBusy(true);
      const assistId = uid();
      pushMessage(sid, {
        id: assistId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        status: 'uploading',
      });

      try {
        updateLastAssistantMsg(sid, { content: `⏳ 正在上传 **${file.name}** ...`, status: 'uploading' });
        const res = await uploadPDF(file);
        const pid = res.project_id;
        updateSession(sid, { projectId: pid, fileName: file.name, name: file.name.replace('.pdf', '').slice(0, 30) });
        updateLastAssistantMsg(sid, {
          content: `✅ 文件 **${file.name}** 上传成功！项目 ID: \`${pid}\`\n\n正在自动启动 Remake 流程 ...`,
          status: 'success',
        });
        // 上传成功后直接启动 Remake 流程
        setBusy(false);
        // 使用 setTimeout 确保 state 更新后再执行
        setTimeout(() => handleRemake(sid, pid), 100);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        updateLastAssistantMsg(sid, { content: `❌ 上传失败: ${msg}`, status: 'error' });
        setBusy(false);
      }
      return;
    }

    /* Text-only: if project exists, treat as context / instruction */
    if (!session!.projectId) {
      pushMessage(sid, {
        id: uid(),
        role: 'assistant',
        content: '请先上传一篇 PDF 论文，我才能为您进行 Introduction 重写或生成新科研 Idea。\n\n点击左下角 📎 按钮选择 PDF 文件。',
        timestamp: Date.now(),
      });
      return;
    }

    /* If user typed text with existing project – run idea with context */
    setBusy(true);
    pushMessage(sid, {
      id: uid(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      status: 'processing',
    });

    try {
      updateLastAssistantMsg(sid, { content: '🧠 正在根据您的描述生成科研 Idea ...', status: 'processing' });
      const res = await generateIdeaFulltext(session!.projectId);
      updateLastAssistantMsg(sid, {
        content: formatIdeas(res.ideas),
        status: 'success',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      updateLastAssistantMsg(sid, { content: `❌ 生成失败: ${msg}`, status: 'error' });
    } finally {
      setBusy(false);
    }
  };

  /* ---- Action: Introduction Remake (stream) ---- */
  const handleIntroRemake = async () => {
    if (busy || !activeSession?.projectId) return;
    const sid = activeSession.id;
    const pid = activeSession.projectId;

    pushMessage(sid, { id: uid(), role: 'user', content: '� 单独执行：Introduction 重写', timestamp: Date.now() });

    const assistId = uid();
    pushMessage(sid, { id: assistId, role: 'assistant', content: '', timestamp: Date.now(), status: 'streaming' });

    setBusy(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    let accumulated = '';

    const handlers: SSEHandlers = {
      onMeta: (data) => {
        const metaMsg = data.message || data.stage || JSON.stringify(data);
        // 保留已积累的正文，meta 信息追加在后面
        const prefix = accumulated || '';
        updateLastAssistantMsg(sid, {
          content: prefix + (prefix ? '\n\n' : '') + `⏳ ${metaMsg}\n\n`,
          status: 'streaming',
          meta: data,
        });
      },
      onDelta: (text) => {
        accumulated += text;
        updateLastAssistantMsg(sid, { content: accumulated, status: 'streaming' });
      },
      onDone: (data) => {
        // 如果 done 事件中有 remade_introduction，使用它
        const remade = data.remade_introduction as string | undefined;
        const references = data.references as Array<Record<string, unknown>> | undefined;
        const timelineFig = data.timeline_figure as Record<string, unknown> | undefined;
        let finalContent = remade || accumulated;
        if (references && references.length > 0) {
          finalContent += '\n\n---\n\n**参考文献：**\n\n';
          references.forEach((ref, i) => {
            const n = ref.reference_number ?? i + 1;
            const title = ref.title || ref.Title || '';
            const authors = ref.authors || ref.Authors || '';
            const year = ref.year || ref.Year || '';
            const venue = ref.venue || ref.journal || ref.Journal || '';
            const doi = ref.doi || '';
            const note = ref.relevance_reason || ref.note || '';
            finalContent += `**[${n}]** ${authors}${authors ? '. ' : ''}${title}${venue ? '. *' + venue + '*' : ''}${year ? ' (' + year + ')' : ''}${doi ? '. DOI: ' + doi : ''}`;
            if (note) finalContent += `\n   > 📌 ${note}`;
            finalContent += '\n\n';
          });
        }
        if (timelineFig && timelineFig.image_file_url) {
          finalContent += '\n\n---\n\n';
          finalContent += `**Figure.** ${timelineFig.overall_description || 'Field development timeline'}\n\n`;
          finalContent += `![Timeline](${timelineFig.image_file_url})\n\n`;
          if (timelineFig.detail_description) {
            finalContent += `*${timelineFig.detail_description}*\n`;
          }
        }
        updateLastAssistantMsg(sid, { content: finalContent, status: 'success' });
      },
      onError: (msg) => {
        updateLastAssistantMsg(sid, { content: `❌ Introduction 重写失败: ${msg}`, status: 'error' });
      },
    };

    try {
      await streamIntroductionRemake(pid, handlers, { autoExtractIntro: true }, ctrl.signal);
      // 如果 onDone 没有触发，确保最终状态正确
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== sid) return s;
          const msgs = [...s.messages];
          for (let i = msgs.length - 1; i >= 0; i--) {
            if (msgs[i].role === 'assistant' && msgs[i].status === 'streaming') {
              msgs[i] = { ...msgs[i], status: 'success' };
              break;
            }
          }
          return { ...s, messages: msgs };
        }),
      );
    } catch (err: unknown) {
      if ((err as { name?: string })?.name !== 'AbortError') {
        const msg = err instanceof Error ? err.message : String(err);
        updateLastAssistantMsg(sid, { content: `❌ 请求失败: ${msg}`, status: 'error' });
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  };

  /* ---- Action: Idea Generation ---- */
  const handleIdeaGeneration = async () => {
    if (busy || !activeSession?.projectId) return;
    const sid = activeSession.id;
    const pid = activeSession.projectId;

    pushMessage(sid, { id: uid(), role: 'user', content: '💡 单独执行：生成新科研 Idea', timestamp: Date.now() });
    pushMessage(sid, { id: uid(), role: 'assistant', content: '🧠 正在分析全文并生成创新性科研 Idea ...', timestamp: Date.now(), status: 'processing' });

    setBusy(true);
    try {
      const res = await generateIdeaFulltext(pid);
      updateLastAssistantMsg(sid, { content: formatIdeas(res.ideas), status: 'success' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      updateLastAssistantMsg(sid, { content: `❌ Idea 生成失败: ${msg}`, status: 'error' });
    } finally {
      setBusy(false);
    }
  };

  /* ---- Action: Full Remake Pipeline (Intro → Idea) ---- */
  const handleRemake = async (overrideSid?: string, overridePid?: string) => {
    const sid = overrideSid || activeSession?.id;
    const pid = overridePid || activeSession?.projectId;
    if (busy || !sid || !pid) return;

    // User message
    pushMessage(sid, { id: uid(), role: 'user', content: '🚀 开始完整 Remake（Introduction 重写 → 新科研 Idea 生成）', timestamp: Date.now() });

    /* ===== Step 1: Introduction Remake (stream) ===== */
    pushMessage(sid, {
      id: uid(), role: 'assistant', content: '', timestamp: Date.now(),
      status: 'streaming', pipelineStep: 'intro',
    });

    setBusy(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    let accumulated = '';
    let introFailed = false;

    const introHandlers: SSEHandlers = {
      onMeta: (data) => {
        const metaMsg = data.message || data.stage || JSON.stringify(data);
        const prefix = accumulated ? `**📖 Step 1/2 — Introduction 重写**\n\n${accumulated}` : `**📖 Step 1/2 — Introduction 重写**`;
        updateLastAssistantMsg(sid, {
          content: prefix + `\n\n⏳ ${metaMsg}\n\n`,
          status: 'streaming',
          meta: data,
        });
      },
      onDelta: (text) => {
        accumulated += text;
        updateLastAssistantMsg(sid, {
          content: `**📖 Step 1/2 — Introduction 重写**\n\n${accumulated}`,
          status: 'streaming',
        });
      },
      onDone: (data) => {
        const remade = data.remade_introduction as string | undefined;
        const references = data.references as Array<Record<string, unknown>> | undefined;
        let finalContent = `**📖 Step 1/2 — Introduction 重写 ✅**\n\n${remade || accumulated}`;
        if (references && references.length > 0) {
          finalContent += '\n\n---\n\n**参考文献：**\n\n';
          references.forEach((ref, i) => {
            const n = ref.reference_number ?? i + 1;
            const title = ref.title || ref.Title || '';
            const authors = ref.authors || ref.Authors || '';
            const year = ref.year || ref.Year || '';
            const venue = ref.venue || ref.journal || ref.Journal || '';
            const doi = ref.doi || '';
            const note = ref.relevance_reason || ref.note || '';
            finalContent += `**[${n}]** ${authors}${authors ? '. ' : ''}${title}${venue ? '. *' + venue + '*' : ''}${year ? ' (' + year + ')' : ''}${doi ? '. DOI: ' + doi : ''}`;
            if (note) finalContent += `\n   > 📌 ${note}`;
            finalContent += '\n\n';
          });
        }
        const timelineFig = data.timeline_figure as Record<string, unknown> | undefined;
        if (timelineFig && timelineFig.image_file_url) {
          finalContent += '\n\n---\n\n';
          finalContent += `**Figure.** ${timelineFig.overall_description || 'Field development timeline'}\n\n`;
          finalContent += `![Timeline](${timelineFig.image_file_url})\n\n`;
          if (timelineFig.detail_description) {
            finalContent += `*${timelineFig.detail_description}*\n`;
          }
        }
        updateLastAssistantMsg(sid, { content: finalContent, status: 'success' });
      },
      onError: (msg) => {
        introFailed = true;
        updateLastAssistantMsg(sid, {
          content: `**📖 Step 1/2 — Introduction 重写 ❌**\n\n失败: ${msg}`,
          status: 'error',
        });
      },
    };

    try {
      await streamIntroductionRemake(pid, introHandlers, { autoExtractIntro: true }, ctrl.signal);
      // ensure streaming → success
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== sid) return s;
          const msgs = [...s.messages];
          for (let i = msgs.length - 1; i >= 0; i--) {
            if (msgs[i].role === 'assistant' && msgs[i].status === 'streaming') {
              msgs[i] = { ...msgs[i], status: 'success' };
              break;
            }
          }
          return { ...s, messages: msgs };
        }),
      );
    } catch (err: unknown) {
      if ((err as { name?: string })?.name !== 'AbortError') {
        introFailed = true;
        updateLastAssistantMsg(sid, {
          content: `**📖 Step 1/2 — Introduction 重写 ❌**\n\n请求失败: ${(err as Error)?.message || String(err)}`,
          status: 'error',
        });
      }
    }
    abortRef.current = null;

    /* ===== Step 2: Idea Generation ===== */
    if (!introFailed) {
      pushMessage(sid, {
        id: uid(), role: 'assistant',
        content: '**💡 Step 2/2 — 新科研 Idea 生成**\n\n🧠 正在分析全文并生成创新性科研 Idea ...',
        timestamp: Date.now(), status: 'processing', pipelineStep: 'idea',
      });

      try {
        const res = await generateIdeaFulltext(pid);
        updateLastAssistantMsg(sid, {
          content: `**💡 Step 2/2 — 新科研 Idea 生成 ✅**\n\n${formatIdeas(res.ideas)}`,
          status: 'success',
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        updateLastAssistantMsg(sid, {
          content: `**💡 Step 2/2 — 新科研 Idea 生成 ❌**\n\n失败: ${msg}`,
          status: 'error',
        });
      }
    } else {
      // Intro failed but still try idea
      pushMessage(sid, {
        id: uid(), role: 'assistant',
        content: '**💡 Step 2/2 — 新科研 Idea 生成**\n\n⚠️ Introduction 重写出现问题，但仍尝试生成 Idea ...',
        timestamp: Date.now(), status: 'processing', pipelineStep: 'idea',
      });
      try {
        const res = await generateIdeaFulltext(pid);
        updateLastAssistantMsg(sid, {
          content: `**💡 Step 2/2 — 新科研 Idea 生成 ✅**\n\n${formatIdeas(res.ideas)}`,
          status: 'success',
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        updateLastAssistantMsg(sid, {
          content: `**💡 Step 2/2 — 新科研 Idea 生成 ❌**\n\n失败: ${msg}`,
          status: 'error',
        });
      }
    }

    // Pipeline complete message
    pushMessage(sid, {
      id: uid(), role: 'assistant',
      content: '🎉 **Remake 流程已完成！**\n\n您可以向上滚动查看 Introduction 重写和新科研 Idea 的结果。如需重新执行，可再次点击 Remake 按钮。',
      timestamp: Date.now(), status: 'success',
      actions: ['remake', 'intro', 'idea'],
    });

    setBusy(false);
  };

  /* ---- Copy ---- */
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  /* ---- Keyboard ---- */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* ==================== Render ==================== */
  return (
    <div className="app-container">
      {/* -------- Sidebar -------- */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <Icon.Bot />
            <h1>Paper Remake</h1>
          </div>
          <button className="new-chat-btn" onClick={createSession}>
            <Icon.Plus /> 新对话
          </button>
        </div>

        <div className="sidebar-sessions">
          {sessions.map((s) => (
            <div
              key={s.id}
              className={`session-item ${s.id === activeId ? 'active' : ''}`}
              onClick={() => setActiveId(s.id)}
            >
              <div
                className="session-icon"
                style={{ background: s.projectId ? 'rgba(124,108,240,0.15)' : 'var(--bg-tertiary)', color: s.projectId ? 'var(--accent)' : 'var(--text-muted)' }}
              >
                <Icon.MessageSquare />
              </div>
              <div className="session-info">
                <div className="session-name">{s.name}</div>
                <div className="session-meta">
                  {s.projectId ? '已上传PDF' : '未上传'} · {fmtTime(s.createdAt)}
                </div>
              </div>
              <button
                className="session-delete"
                onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
              >
                <Icon.Trash />
              </button>
            </div>
          ))}
          {sessions.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginTop: 40 }}>
              暂无对话记录
            </div>
          )}
        </div>

        <div className="sidebar-footer">
          Paper Remake Assistant v1.0
        </div>
      </aside>

      {/* -------- Main Area -------- */}
      <main className="main-area">
        {/* Top bar */}
        <div className="top-bar">
          <div className="top-bar-left">
            <span className="top-bar-title">
              {activeSession ? activeSession.name : 'Paper Remake Assistant'}
            </span>
            {activeSession?.projectId && (
              <span className="project-badge">Project: {activeSession.projectId.slice(0, 8)}</span>
            )}
          </div>
          <div className="top-bar-right">
            {busy && (
              <span className="status-badge processing">
                <span className="spinner" />
                处理中
              </span>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="chat-area">
          {!activeSession ? (
            /* Welcome screen */
            <div className="welcome-screen">
              <div className="welcome-icon">
                <Icon.Bot />
              </div>
              <h2>Paper Remake Assistant</h2>
              <p>上传您的论文 PDF，一键 Remake：自动完成 Introduction 重写 + 新科研 Idea 生成</p>
              <div className="welcome-actions">
                <div className="welcome-card remake-card" onClick={createSession}>
                  <div className="welcome-card-icon" style={{ background: 'linear-gradient(135deg, rgba(124,108,240,0.2), rgba(156,39,176,0.2))', color: 'var(--accent)' }}>
                    <Icon.Rocket />
                  </div>
                  <h3>一键 Remake</h3>
                  <p>上传 PDF 后自动执行 Introduction 重写 → 新科研 Idea 生成完整流程</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="chat-messages">
              {activeSession.messages.length === 0 && (
                <div className="welcome-screen" style={{ height: 'auto', paddingTop: 60 }}>
                  <div className="welcome-icon">
                    <Icon.Bot />
                  </div>
                  <h2>开始新对话</h2>
                  <p>请上传一篇 PDF 论文开始</p>
                </div>
              )}
              {activeSession.messages.map((msg) => (
                <div key={msg.id} className="message">
                  <div className={`message-avatar ${msg.role}`}>
                    {msg.role === 'user' ? 'U' : <Icon.Bot />}
                  </div>
                  <div className="message-body">
                    <div className="message-header">
                      <span className="message-sender">
                        {msg.role === 'user' ? '你' : 'AI 助手'}
                      </span>
                      <span className="message-time">{fmtTime(msg.timestamp)}</span>
                    </div>

                    {/* File attachment */}
                    {msg.file && (
                      <div className="message-file">
                        <Icon.FileText />
                        <span>{msg.file.name} ({fmtSize(msg.file.size)})</span>
                      </div>
                    )}

                    {/* Status */}
                    {msg.status === 'uploading' && (
                      <div className="status-badge uploading"><span className="spinner" /> 上传中</div>
                    )}
                    {msg.status === 'processing' && (
                      <div className="status-badge processing"><span className="spinner" /> 处理中</div>
                    )}
                    {msg.status === 'streaming' && (
                      <div className="status-badge processing"><span className="spinner" /> 生成中</div>
                    )}

                    {/* Content */}
                    <div className="message-content">
                      {msg.content ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      ) : msg.status === 'streaming' || msg.status === 'processing' || msg.status === 'uploading' ? (
                        <div className="loading-dots"><span /><span /><span /></div>
                      ) : null}
                    </div>

                    {/* Copy button for long content */}
                    {msg.role === 'assistant' && msg.content && msg.content.length > 100 && msg.status === 'success' && (
                      <button className="copy-btn" onClick={() => handleCopy(msg.content)}>
                        <Icon.Copy /> 复制内容
                      </button>
                    )}

                    {/* Action buttons */}
                    {msg.actions && msg.status === 'success' && (
                      <div className="action-buttons">
                        {msg.actions.includes('remake') && (
                          <button
                            className="action-btn remake"
                            onClick={() => handleRemake()}
                            disabled={busy}
                          >
                            <Icon.Rocket /> Remake
                          </button>
                        )}
                        {msg.actions.includes('intro') && (
                          <button
                            className="action-btn-small intro"
                            onClick={handleIntroRemake}
                            disabled={busy}
                            title="仅 Introduction 重写"
                          >
                            <Icon.BookOpen />
                            <span>Intro</span>
                          </button>
                        )}
                        {msg.actions.includes('idea') && (
                          <button
                            className="action-btn-small idea"
                            onClick={handleIdeaGeneration}
                            disabled={busy}
                            title="仅生成科研 Idea"
                          >
                            <Icon.Lightbulb />
                            <span>Idea</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="input-area">
          <div className="input-container">
            {/* File preview */}
            {pendingFile && (
              <div className="upload-preview">
                <span className="file-icon"><Icon.FileText /></span>
                <span className="file-name">{pendingFile.name} ({fmtSize(pendingFile.size)})</span>
                <button className="remove-file" onClick={() => setPendingFile(null)}><Icon.X /></button>
              </div>
            )}

            <div className={`input-box ${pendingFile ? 'has-file' : ''}`}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
              <button className="input-btn" onClick={() => fileInputRef.current?.click()} title="上传 PDF">
                <Icon.Paperclip />
              </button>
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  activeSession?.projectId
                    ? '输入问题或点击上方按钮执行操作...'
                    : '上传 PDF 开始对话，或输入消息...'
                }
                rows={1}
                disabled={busy}
              />
              <div className="input-actions">
                {activeSession?.projectId && (
                  <>
                    <button
                      className="input-btn remake-quick"
                      onClick={() => handleRemake()}
                      disabled={busy}
                      title="一键 Remake（Intro + Idea）"
                    >
                      <Icon.Rocket />
                    </button>
                    <span className="input-divider" />
                    <button
                      className="input-btn-mini"
                      onClick={handleIntroRemake}
                      disabled={busy}
                      title="仅 Introduction 重写"
                    >
                      <Icon.BookOpen />
                    </button>
                    <button
                      className="input-btn-mini"
                      onClick={handleIdeaGeneration}
                      disabled={busy}
                      title="仅生成科研 Idea"
                    >
                      <Icon.Lightbulb />
                    </button>
                  </>
                )}
                <button
                  className="input-btn send"
                  onClick={handleSend}
                  disabled={busy && !pendingFile && !inputText.trim()}
                  title="发送"
                >
                  <Icon.Send />
                </button>
              </div>
            </div>

            <div className="input-hint">
              上传 PDF 后点击 🚀 一键 Remake · 也可单独执行 Intro 或 Idea · Shift+Enter 换行
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
