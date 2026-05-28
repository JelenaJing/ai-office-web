import { create } from "zustand";
import { PlatformSettings } from "../services/api";

interface AppState {
  currentProject: string;
  currentUser: string;
  selectedMonomerId: string | null;
  setSelectedMonomerId: (id: string | null) => void;
  applySettings: (s: Partial<PlatformSettings>) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentProject: "呋喃基高分子与电池材料联合研发",
  currentUser: "课题组管理员",
  selectedMonomerId: null,
  setSelectedMonomerId: (selectedMonomerId) => set({ selectedMonomerId }),
  applySettings: (s) =>
    set({
      ...(s.projectName != null ? { currentProject: s.projectName } : {}),
      ...(s.currentUser != null ? { currentUser: s.currentUser } : {}),
    }),
}));
