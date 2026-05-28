import { create } from "zustand";
import { persist } from "zustand/middleware";
import { mockApi } from "../services/mockApi";
import type { StudentProfile, User } from "../types/user";

interface SessionState {
  user: User | null;
  studentProfile: StudentProfile | null;
  onboardingDone: boolean;
  login: (username: string) => Promise<boolean>;
  logout: () => void;
  setOnboardingDone: (done: boolean) => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      studentProfile: null,
      onboardingDone: true,
      login: async (username) => {
        try {
          const res = await mockApi.login(username);
          set({
            user: res.user,
            studentProfile: res.studentProfile ?? null,
            onboardingDone: true,
          });
          return true;
        } catch {
          return false;
        }
      },
      logout: () => set({ user: null, studentProfile: null }),
      setOnboardingDone: (onboardingDone) => set({ onboardingDone }),
    }),
    { name: "amp-session-v2" }
  )
);
