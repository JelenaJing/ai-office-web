import { create } from "zustand";

export interface EvidenceItem {
  source: string;
  title: string;
  year: number;
  excerpt: string;
  reliability: number;
  fields: string[];
}

interface UiState {
  busy: boolean;
  toast: { message: string; type: "success" | "info" } | null;
  evidenceModal: { title: string; items: EvidenceItem[] } | null;
  messageModal: { title: string; message: string; detail?: string } | null;
  setBusy: (busy: boolean) => void;
  showToast: (message: string, type?: "success" | "info") => void;
  clearToast: () => void;
  showEvidence: (title: string, items: EvidenceItem[]) => void;
  showMessage: (title: string, message: string, detail?: string) => void;
  closeModals: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  busy: false,
  toast: null,
  evidenceModal: null,
  messageModal: null,
  setBusy: (busy) => set({ busy }),
  showToast: (message, type = "success") => {
    set({ toast: { message, type } });
    setTimeout(() => set({ toast: null }), 4500);
  },
  showEvidence: (title, items) => set({ evidenceModal: { title, items }, messageModal: null }),
  showMessage: (title, message, detail) => set({ messageModal: { title, message, detail }, evidenceModal: null }),
  closeModals: () => set({ evidenceModal: null, messageModal: null }),
  clearToast: () => set({ toast: null }),
}));
