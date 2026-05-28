import type { PaperRec } from "./mockApi";
import { useSessionStore } from "../store/sessionStore";

export interface PaperRecommendationsResponse {
  papers: PaperRec[];
  nextRefreshAt?: string;
}

function authHeaders(): HeadersInit {
  const user = useSessionStore.getState().user;
  return user ? { "X-Demo-User": user.id } : {};
}

/** 读取当前账户当日论文推荐（后台每日 5:00 更新，不实时外拉） */
export async function fetchPaperRecommendations(): Promise<PaperRecommendationsResponse> {
  const res = await fetch("/api/mock/student/literature/recommendations", {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`论文推荐加载失败 (${res.status})`);
  const data = await res.json();
  if (Array.isArray(data)) {
    return { papers: data as PaperRec[] };
  }
  return data as PaperRecommendationsResponse;
}

export function formatNextRefresh(iso?: string): string {
  if (!iso) return "每日 05:00";
  try {
    const d = new Date(iso);
    return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch {
    return "每日 05:00";
  }
}
