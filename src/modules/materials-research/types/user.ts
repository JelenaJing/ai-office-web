export type UserRole = "admin" | "teacher" | "student" | "print_rd";

export type ResearchDirection = "polymer" | "battery" | "polymer_battery" | "other";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  researchDirection?: ResearchDirection;
  advisorId?: string;
  groupId: string;
  keywords: string[];
  createdAt: string;
  lastLoginAt: string;
}

export interface StudentProfile {
  userId: string;
  studentNo: string;
  advisorId: string;
  researchDirection: ResearchDirection;
  projectTitle: string;
  focusMetrics: string[];
  uploadedPaperCount: number;
  experimentRecordCount: number;
  pendingReviewCount: number;
  dataCompletenessScore: number;
}
