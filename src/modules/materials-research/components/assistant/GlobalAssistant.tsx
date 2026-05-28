import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, X, Send, Trash2 } from "lucide-react";
import clsx from "clsx";
import { useAssistantStore } from "../../store/assistantStore";
import { AssistantMarkdown } from "./AssistantMarkdown";
import {
  assistantChatStream,
  clearAssistantHistory,
  fetchAssistantHistory,
  type FormulationToolPayload,
  type PropertyToolPayload,
} from "../../services/assistantApi";
import { useSessionStore } from "../../store/sessionStore";
import { useToolBridgeStore } from "../../store/toolBridgeStore";

const STUDENT_QUICK = ["配方推荐", "性能预测", "检索单体库", "硬碳首效分析"];
const TEACHER_QUICK = ["课题组数据概况", "待审核实验", "文献趋势", "训练集质量"];
const PRINT_RD_QUICK = [
  "配方相似召回",
  "检索聚氨酯文献",
  "原料代号 S4 用途",
  "实验 20241118-13 工艺",
  "拉伸强度与交联密度关系",
];

function welcomeMessage(role: string) {
  if (role === "print_rd") {
    return "你好，我是**先进材料智能研发助手**（3D 打印材料方向）。配方推荐与原料/实验数据均从本地配方库读取；可检索文献、解读实验与性能关联规则。";
  }
  if (role === "teacher" || role === "admin") {
    return "你好，我是**先进材料智能研发助手**。可帮你汇总课题组数据、检索数据库，或解答实验与文献管理相关问题。";
  }
  return "你好，我是**先进材料智能研发助手**。可帮你检索数据库、打开相关工具页，或根据计算服务返回配方与预测结果。";
}

/** 无真实对话时仅在前端展示欢迎语，不写入数据库 */
function withWelcomeIfEmpty(msgs: { id: string; role: "user" | "assistant"; content: string }[], userRole: string) {
  if (msgs.length > 0) return msgs;
  return [{ id: "welcome", role: "assistant" as const, content: welcomeMessage(userRole) }];
}

export function GlobalAssistant() {
  const user = useSessionStore((s) => s.user);
  const navigate = useNavigate();
  const {
    open,
    messages,
    loading,
    historyLoaded,
    minimize,
    expand,
    setUser,
    setMessages,
    addMessage,
    appendToMessage,
    patchMessage,
    setLoading,
    clear,
    setHistoryLoaded,
  } = useAssistantStore();
  const [input, setInput] = useState("");
  const [lastTool, setLastTool] = useState<string | null>(null);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const userRole = user?.role ?? "student";
  const isTeacher = userRole === "teacher" || userRole === "admin";
  const quickPrompts =
    userRole === "print_rd" ? PRINT_RD_QUICK : isTeacher ? TEACHER_QUICK : STUDENT_QUICK;

  useEffect(() => {
    if (!user?.id) {
      setUser(null);
      return;
    }
    setUser(user.id);
    let cancelled = false;
    fetchAssistantHistory()
      .then((msgs) => {
        if (!cancelled) {
          setMessages(withWelcomeIfEmpty(msgs, userRole));
          setHistoryLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMessages(withWelcomeIfEmpty([], userRole));
          setHistoryLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, userRole, setUser, setMessages, setHistoryLoaded]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingId, loading]);

  if (!user) return null;

  const handleAction = (action: { label: string; href?: string; actionType?: string }) => {
    if (!action.href) return;
    const formulationPayload = useToolBridgeStore.getState().formulation;
    const propertyPayload = useToolBridgeStore.getState().property;

    if (action.actionType === "open_formulation" && formulationPayload) {
      navigate(action.href, { state: { fromChat: true } });
      return;
    }
    if (action.actionType === "open_property" && propertyPayload) {
      navigate(action.href, { state: { fromChat: true } });
      return;
    }
    navigate(action.href);
  };

  const handleClear = async () => {
    setLastTool(null);
    try {
      await clearAssistantHistory();
    } catch {
      /* 清空失败时仍重置本地展示 */
    }
    clear();
    setMessages(withWelcomeIfEmpty([], userRole));
    setHistoryLoaded(true);
  };

  const applyToolResult = (res: {
    tool?: string;
    toolPayload?: FormulationToolPayload | PropertyToolPayload;
  }) => {
    if (res.tool) setLastTool(res.tool);
    if (res.tool === "formulation" && res.toolPayload) {
      const p = res.toolPayload as FormulationToolPayload;
      useToolBridgeStore.getState().setFormulationFromChat({
        recommendations: p.recommendations,
        selectedTargets: p.selectedTargets,
        extraGoal: p.extraGoal,
      });
    }
    if (res.tool === "property" && res.toolPayload) {
      const p = res.toolPayload as PropertyToolPayload;
      useToolBridgeStore.getState().setPropertyFromChat({
        polymerName: p.polymerName,
        monomers: p.monomers,
        result: p.result,
      });
    }
  };

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;
    if (!open) expand();
    addMessage({ role: "user", content: q });
    setInput("");
    setLoading(true);

    const history = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .filter((m) => m.id !== "welcome" && m.id !== streamingId)
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));

    const assistantId = addMessage({ role: "assistant", content: "" });
    setStreamingId(assistantId);

    try {
      const res = await assistantChatStream({ question: q, history, lastTool }, (ev) => {
        if (ev.type === "delta" && ev.content) {
          appendToMessage(assistantId, ev.content);
        }
        if (ev.type === "done") {
          patchMessage(assistantId, {
            content: ev.answer,
            actions: ev.actions?.map((a) => ({
              label: a.label,
              href: a.href,
              actionType: a.actionType,
            })),
          });
          applyToolResult(ev);
        }
      });
      if (!res.answer) {
        patchMessage(assistantId, { content: "未收到回复，请重试。" });
      }
    } catch {
      patchMessage(assistantId, {
        content: "AI 服务暂时不可用，请稍后重试；若持续失败请联系平台管理员。",
      });
    } finally {
      setStreamingId(null);
      setLoading(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={expand}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-white shadow-lg ring-4 ring-white transition hover:scale-105"
          title="AI"
          aria-label="打开 AI"
        >
          <Sparkles className="h-6 w-6" />
        </button>
      )}

      {open && (
        <aside className="fixed right-0 top-0 z-50 flex h-screen w-[33vw] min-w-[320px] max-w-[480px] flex-col border-l border-slate-200 bg-white shadow-xl">
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-100 px-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-slate-800">材料研发助手</span>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={handleClear}
                className="rounded-lg p-2 text-muted hover:bg-slate-100"
                title="清空"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button type="button" onClick={minimize} className="rounded-lg p-2 text-muted hover:bg-slate-100" title="关闭">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {!historyLoaded && <p className="text-xs text-muted">加载对话记录…</p>}
            {messages.map((m) => (
              <div
                key={m.id}
                className={clsx(
                  "rounded-2xl px-3 py-2 text-sm",
                  m.role === "user" ? "ml-6 bg-primary text-white" : "mr-2 bg-slate-100 text-slate-800"
                )}
              >
                {m.role === "user" ? (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                ) : m.content ? (
                  <AssistantMarkdown content={m.content} />
                ) : (
                  <span className="inline-flex items-center gap-1 text-muted">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                    正在生成…
                  </span>
                )}
                {m.id === streamingId && m.content && (
                  <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-primary align-middle" />
                )}
                {m.actions && m.actions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {m.actions.map((a) =>
                      a.href ? (
                        <button
                          key={a.label}
                          type="button"
                          onClick={() => handleAction(a)}
                          className="rounded-lg bg-white/90 px-2 py-0.5 text-xs text-primary hover:bg-white"
                        >
                          {a.label}
                        </button>
                      ) : null
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="shrink-0 border-t border-slate-100 p-4">
            <div className="mb-2 flex flex-wrap gap-1">
              {quickPrompts.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => send(p)}
                  className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 hover:bg-slate-200"
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send(input))}
                placeholder="输入问题…"
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => send(input)}
                disabled={loading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>
      )}
    </>
  );
}
