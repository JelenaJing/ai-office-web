import { create } from "zustand";

export interface AssistantMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: { label: string; href?: string; actionType?: string }[];
}

interface AssistantState {
  minimized: boolean;
  open: boolean;
  currentUserId: string | null;
  messages: AssistantMessage[];
  loading: boolean;
  historyLoaded: boolean;
  toggle: () => void;
  minimize: () => void;
  expand: () => void;
  setUser: (userId: string | null) => void;
  setMessages: (messages: AssistantMessage[]) => void;
  addMessage: (msg: Omit<AssistantMessage, "id"> & { id?: string }) => string;
  appendToMessage: (id: string, chunk: string) => void;
  patchMessage: (id: string, patch: Partial<Omit<AssistantMessage, "id">>) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
  setHistoryLoaded: (loaded: boolean) => void;
}

export const useAssistantStore = create<AssistantState>((set, get) => ({
  minimized: true,
  open: false,
  currentUserId: null,
  messages: [],
  loading: false,
  historyLoaded: false,
  toggle: () =>
    set((s) => {
      if (s.open) return { open: false, minimized: true };
      return { open: true, minimized: false };
    }),
  minimize: () => set({ open: false, minimized: true }),
  expand: () => set({ open: true, minimized: false }),
  setUser: (userId) => {
    if (get().currentUserId === userId) return;
    set({
      currentUserId: userId,
      messages: [],
      historyLoaded: false,
      loading: false,
    });
  },
  setMessages: (messages) => set({ messages, historyLoaded: true }),
  addMessage: (msg) => {
    const id = msg.id ?? `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set((s) => {
      const base =
        msg.role === "user" ? s.messages.filter((m) => m.id !== "welcome") : s.messages;
      const { id: _omit, ...rest } = msg;
      return { messages: [...base, { ...rest, id }] };
    });
    return id;
  },
  appendToMessage: (id, chunk) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, content: m.content + chunk } : m)),
    })),
  patchMessage: (id, patch) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    })),
  setLoading: (loading) => set({ loading }),
  clear: () => set({ messages: [], historyLoaded: false }),
  setHistoryLoaded: (historyLoaded) => set({ historyLoaded }),
}));
