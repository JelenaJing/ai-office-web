import { useSessionStore } from "../store/sessionStore";

function headers(): HeadersInit {
  const user = useSessionStore.getState().user;
  return user ? { "X-Demo-User": user.id } : {};
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`/api/print3d${path}`, { headers: headers() });
  if (!res.ok) throw new Error(`Print3D API ${res.status}`);
  return res.json();
}

async function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`/api/print3d${path}`, {
    method: "POST",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Print3D API ${res.status}`);
  return res.json();
}

export interface FormulationLibraryEntry {
  id: string;
  recordId?: string;
  sourceType: string;
  ingredients: { seq: number; code: string; amountG: string; remark?: string }[];
  metricsDisplay?: Record<string, number>;
  similarityScore?: number;
}

export interface FormulationRecommendResult {
  targets: Record<string, number | null>;
  recommendations: FormulationLibraryEntry[];
  answer: string;
  librarySize: number;
  verifiedExperimentCount: number;
  error?: string;
}

export interface Print3dDocument {
  id: string;
  fileName: string;
  title: string;
  category: string;
  categoryLabel: string;
  ext: string;
  sizeBytes: number;
  preview: string;
  tags: string[];
}

export interface Print3dMaterial {
  code: string;
  name: string;
  category: string;
  subCategory: string;
  structure: string;
  source: string;
  supplier: string;
  sourceDocId?: string;
}

export interface PerformanceRule {
  metric: string;
  correlation: string;
  direction?: string;
  sourceDocId?: string;
}

export interface FormulaIngredient {
  seq: number;
  code: string;
  ratio?: number | null;
  amountG: string;
  remark?: string;
}

export interface FormulaBatch {
  id: string;
  sourceDocId: string;
  batchIndex: number;
  reactionDate?: string;
  ingredients: FormulaIngredient[];
  process: { param: string; value: string }[];
  totalMassG?: number;
}

export interface ExperimentGroup {
  recordId: string;
  sourceDocId?: string;
  sourceFileName?: string;
  materials: { code: string; amount: string; stage: string; remark?: string }[];
  stages: { stage: string; process: string }[];
  metrics: { metric: string; value: string; unit?: string }[];
  postProcess?: { type: string; param: string; value: string }[];
}

export interface ExperimentComparisonRow {
  recordId: string;
  tensileStrength?: number | null;
  elongation?: number | null;
  tearStrength?: number | null;
  hardness?: number | null;
  viscosity?: string;
  mainDiluent?: string;
  materialCount?: number;
}

export interface Print3dAnalysis {
  experiments?: {
    comparisonTable: ExperimentComparisonRow[];
    bestTensileRecordId?: string;
    insights: string[];
    recordCount: number;
  };
  performanceSummary?: string[];
  formulaOverview?: { batchCount: number; uniqueReactionDates: string[] };
}

export interface Print3dDashboard {
  greeting: string;
  roleLabel: string;
  projectTitle: string;
  focusAreas: string[];
  stats: Record<string, number>;
  quickStats?: Record<string, number>;
  categoryBreakdown: { category: string; label: string; count: number }[];
  recentLiterature: { id: string; title: string; fileName: string }[];
  recentExperiments: { recordId: string; metrics: { name: string; value: string }[]; materialCount: number }[];
  analysisInsights?: string[];
  bestTensileRecordId?: string;
  suggestions: string[];
}

export const print3dApi = {
  dashboard: () => get<Print3dDashboard>("/dashboard"),
  documents: (params?: { q?: string; category?: string; limit?: number; offset?: number }) => {
    const sp = new URLSearchParams();
    if (params?.q) sp.set("q", params.q);
    if (params?.category) sp.set("category", params.category);
    if (params?.limit) sp.set("limit", String(params.limit));
    if (params?.offset) sp.set("offset", String(params.offset));
    const q = sp.toString();
    return get<{ total: number; items: Print3dDocument[]; categories: { id: string; label: string }[] }>(
      `/documents${q ? `?${q}` : ""}`
    );
  },
  materials: (q = "") => get<{ total: number; items: Print3dMaterial[] }>(`/materials?q=${encodeURIComponent(q)}`),
  experiments: (q = "", recordId?: string) => {
    const sp = new URLSearchParams({ q });
    if (recordId) sp.set("recordId", recordId);
    return get<{
      total: number;
      groups: ExperimentGroup[];
      comparisonTable: ExperimentComparisonRow[];
      batchLabel?: string;
    }>(`/experiments?${sp}`);
  },
  performanceRules: () =>
    get<{ rules: PerformanceRule[]; summary: string[] }>("/performance-rules"),
  analysis: () => get<Print3dAnalysis>("/analysis"),
  formulas: () => get<FormulaBatch[]>("/formulas"),
  search: (q: string) =>
    get<{
      query: string;
      documents: Print3dDocument[];
      materials: Print3dMaterial[];
      experiments: ExperimentGroup[];
    }>(`/search?q=${encodeURIComponent(q)}`),
  downloadUrl: (docId: string) => `/api/print3d/documents/${docId}/download`,
  formulaLibrary: () =>
    get<{
      entries: FormulationLibraryEntry[];
      validMaterialCodes: string[];
      verifiedCount: number;
    }>("/formulation/library"),
  recommendFormulation: (params: {
    question?: string;
    tensile?: number;
    elongation?: number;
    tear?: number;
    hardness?: number;
    viscosity?: number;
    topK?: number;
  }) => post<FormulationRecommendResult>("/formulation/recommend", params),
  recallTest: (referenceRecordId: string, topK = 5) =>
    post<FormulationRecommendResult>("/formulation/recall-test", {
      referenceRecordId,
      topK,
    }),
  materialDetail: (code: string) =>
    get<{
      code: string;
      catalog: Print3dMaterial | null;
      inCatalog: boolean;
      inValidSet: boolean;
      usages: { recordId?: string; amountG?: string; remark?: string }[];
      usageCount: number;
    }>(`/materials/${encodeURIComponent(code)}/detail`),
};
