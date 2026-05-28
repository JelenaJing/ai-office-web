import { useSessionStore } from "../store/sessionStore";
import type { ExtendedRecommendation } from "../store/toolBridgeStore";
import type { CalcPropertyResponse } from "./calcApi";
import type { AssistantMessage } from "../store/assistantStore";

export interface AssistantHistoryItem {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantChatRequest {
  question: string;
  history?: AssistantHistoryItem[];
  lastTool?: string | null;
  context?: { page?: string };
}

export interface AssistantAction {
  label: string;
  actionType: string;
  href?: string;
}

export interface FormulationToolPayload {
  recommendations: ExtendedRecommendation[];
  selectedTargets: string[];
  extraGoal: string;
}

export interface PropertyToolPayload {
  polymerName: string;
  monomers: string;
  result: CalcPropertyResponse | null;
}

export interface AssistantChatResponse {
  answer: string;
  actions?: AssistantAction[];
  tool?: string;
  toolPayload?: FormulationToolPayload | PropertyToolPayload;
  evidence?: { title: string; snippet: string }[];
}

function authHeaders(): HeadersInit {
  const user = useSessionStore.getState().user;
  return {
    "Content-Type": "application/json",
    ...(user ? { "X-Demo-User": user.id } : {}),
  };
}

export async function assistantChat(body: AssistantChatRequest): Promise<AssistantChatResponse> {
  const res = await fetch("/api/assistant/chat", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("assistant chat failed");
  return res.json();
}

export type AssistantStreamEvent =
  | { type: "delta"; content: string }
  | {
      type: "done";
      answer: string;
      actions?: AssistantAction[];
      tool?: string;
      toolPayload?: FormulationToolPayload | PropertyToolPayload;
    };

/** 流式对话（SSE），通过 onEvent 逐块回调 */
export async function assistantChatStream(
  body: AssistantChatRequest,
  onEvent: (ev: AssistantStreamEvent) => void
): Promise<AssistantChatResponse> {
  const res = await fetch("/api/assistant/chat/stream", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("assistant stream failed");
  if (!res.body) throw new Error("assistant stream: no body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let final: AssistantChatResponse = { answer: "" };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const jsonStr = trimmed.slice(5).trim();
      if (!jsonStr) continue;
      try {
        const ev = JSON.parse(jsonStr) as AssistantStreamEvent;
        onEvent(ev);
        if (ev.type === "done") {
          final = {
            answer: ev.answer,
            actions: ev.actions,
            tool: ev.tool,
            toolPayload: ev.toolPayload,
          };
        }
      } catch {
        /* 忽略不完整 JSON 行 */
      }
    }
  }
  return final;
}

export async function fetchAssistantHistory(): Promise<AssistantMessage[]> {
  const res = await fetch("/api/assistant/history", { headers: authHeaders() });
  if (!res.ok) throw new Error("assistant history failed");
  const data = await res.json();
  return (data.messages || []).map(
    (m: { id: string; role: string; content: string; actions?: AssistantMessage["actions"] }) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
      actions: m.actions,
    })
  );
}

export async function clearAssistantHistory(): Promise<AssistantMessage[]> {
  const res = await fetch("/api/assistant/history", { method: "DELETE", headers: authHeaders() });
  if (!res.ok) throw new Error("assistant clear failed");
  const data = await res.json();
  return (data.messages || []).map(
    (m: { id: string; role: string; content: string; actions?: AssistantMessage["actions"] }) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
      actions: m.actions,
    })
  );
}
