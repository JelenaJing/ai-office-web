import type { StudentProfile, User } from "../types/user";
import { platformApi } from "../../../platform";
import { useSessionStore } from "../store/sessionStore";

const BASE = "/api/mock";

function authHeaders(): HeadersInit {
  const user = useSessionStore.getState().user;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = platformApi.auth.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (user) headers["X-Demo-User"] = user.id;
  return headers;
}

async function fetchMock<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { ...options, headers: { ...authHeaders(), ...options?.headers } });
  if (!res.ok) throw new Error(`Mock API ${res.status}: ${path}`);
  return res.json();
}

export const mockApi = {
  login: (username: string) =>
    fetchMock<{ success: boolean; user: User; studentProfile?: StudentProfile }>("/login", {
      method: "POST",
      body: JSON.stringify({ username }),
    }),
  me: () => fetchMock<{ user: User; studentProfile?: StudentProfile }>("/me"),
  teacherDashboard: () => fetchMock<TeacherDashboard>("/teacher/dashboard"),
  studentDashboard: () => fetchMock<StudentDashboard>("/student/dashboard"),
  students: () => fetchMock<StudentWithProfile[]>("/students"),
  elnReview: () => fetchMock<ElnReviewItem[]>("/teacher/eln-review"),
  approveReview: (id: string, comment = "") =>
    fetchMock<{ success: boolean; message: string }>(`/teacher/eln-review/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ comment }),
    }),
  returnReview: (id: string, comment: string) =>
    fetchMock<{ success: boolean; message: string }>(`/teacher/eln-review/${id}/return`, {
      method: "POST",
      body: JSON.stringify({ comment }),
    }),
  databasesOverview: () => fetchMock<{ databases: DatabaseCard[] }>("/databases/overview"),
  dbMonomers: () => fetchMock<unknown[]>("/databases/monomers"),
  dbPapers: () => fetchMock<unknown[]>("/databases/papers"),
  dbPolymers: () => fetchMock<unknown[]>("/databases/polymers"),
  dbReactions: () => fetchMock<unknown[]>("/databases/reactions"),
  dbExperiments: () => fetchMock<unknown[]>("/databases/experiments"),
  dbBattery: () => fetchMock<unknown[]>("/databases/battery-materials"),
  readonly: (resource: string) => fetchMock<unknown[]>(`/readonly/${resource}`),
  formulation: (body: Record<string, unknown>) =>
    fetchMock<FormulationResult>("/student/polymer/formulation-recommendation", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  propertyPrediction: (body: Record<string, unknown>) =>
    fetchMock<PropertyResult>("/student/polymer/property-prediction", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  batteryPrediction: (body: Record<string, unknown>) =>
    fetchMock<BatteryResult>("/student/battery/performance-prediction", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  paperRecommendations: () => fetchMock<PaperRec[]>("/student/literature/recommendations"),
  uploadLiterature: () =>
    fetchMock<{ success: boolean; message: string }>("/student/literature/upload", { method: "POST", body: "{}" }),
  myLibrary: () => fetchMock<unknown[]>("/student/literature/my-library"),
  myElnRecords: () => fetchMock<unknown[]>("/eln/my-records"),
};

export interface TeacherDashboard {
  stats: Record<string, number>;
  activities: { id: string; type: string; studentName: string; title: string; time: string }[];
  alerts: { id: string; level: string; message: string }[];
}

export interface StudentDashboard {
  greeting: string;
  directionLabel: string;
  advisorName: string;
  projectTitle: string;
  suggestions: string[];
  quickStats: Record<string, number>;
  recentRecords: { id: string; title: string; status: string; date: string; completeness: number }[];
  paperRecommendations: PaperRec[];
}

export interface PaperRec {
  id: string;
  title: string;
  authors?: string;
  year?: number;
  journal?: string;
  doi?: string;
  abstract?: string;
  url?: string;
  publishedAt?: string;
}

export interface ElnReviewItem {
  id: string;
  title: string;
  studentName: string;
  direction: string;
  type: string;
  submittedAt: string;
  completenessScore: number;
  status: string;
  riskHints: string[];
}

export interface DatabaseCard {
  id: string;
  name: string;
  count: number;
  weeklyNew: number;
  pending: number;
  completeness: number;
  updatedAt: string;
}

export interface StudentWithProfile extends User {
  profile?: StudentProfile;
}

export interface FormulationResult {
  success: boolean;
  summary: string;
  rationale: string;
  monomers: string[];
  matrix: { id: string; temperature: string; ratio: string }[];
  confidence: number;
  risks: string[];
}

export interface PropertyResult {
  success: boolean;
  polymerName: string;
  predictions: Record<string, number[]>;
  confidence: number;
  similarCount: number;
  notes: string[];
}

export interface BatteryResult {
  success: boolean;
  reversibleCapacityRange: number[];
  initialCoulombicEfficiencyRange: number[];
  cycleRetentionAfter100Cycles: number;
  impedanceGrowthRisk: string;
  pouchScaleRisk: string;
  confidenceScore: number;
  recommendations: string[];
  missingFields: string[];
}
