import { platformApi } from "../../../platform";
import { useSessionStore } from "../store/sessionStore";

const API_BASE = "/api";

let tenantIdGetter: () => string = () => "generic";

function sessionHeaders(): HeadersInit {
  const user = useSessionStore.getState().user;
  const headers: Record<string, string> = {};
  const token = platformApi.auth.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (user) headers["X-Demo-User"] = user.id;
  return headers;
}

/** 绑定当前租户 ID，所有 API 请求自动附带 tenantId */
export function bindTenantId(getter: () => string) {
  tenantIdGetter = getter;
}

function withTenantQuery(url: string): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}tenantId=${encodeURIComponent(tenantIdGetter())}`;
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${withTenantQuery(url)}`, {
    headers: { "Content-Type": "application/json", ...sessionHeaders(), ...(options?.headers as Record<string, string>) },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${url}`);
  return res.json();
}

export const api = {
  dashboard: {
    full: () => fetchJson<DashboardFull>("/dashboard/full"),
    metrics: () => fetchJson<DashboardMetrics>("/dashboard/metrics"),
    suggestions: () => fetchJson<SmartSuggestion[]>("/dashboard/suggestions"),
  },
  polymer: {
    monomers: () => fetchJson<Monomer[]>("/polymer/monomers"),
    polymers: () => fetchJson<Record<string, unknown>[]>("/polymer/polymers"),
    reactions: () => fetchJson<Record<string, unknown>[]>("/polymer/reactions"),
    monomer: (id: string) => fetchJson<Monomer>(`/polymer/monomers/${id}`),
    recommendations: () => fetchJson<PolymerRecommendation[]>("/polymer/recommendations"),
    searchRecommendations: (body: { targets: string[]; extraGoal?: string }) =>
      fetchJson<{ success: boolean; message: string; recommendations: PolymerRecommendation[] }>(
        "/polymer/recommendations",
        { method: "POST", body: JSON.stringify(body) }
      ),
    createEln: (id: string) =>
      fetchJson<{ elnId: string; redirect: string; prefill: Record<string, unknown> }>(
        `/polymer/recommendations/${id}/create-eln`,
        { method: "POST" }
      ),
  },
  eln: {
    records: () => fetchJson<ExperimentRecord[]>("/eln/records"),
    templates: () => fetchJson<string[]>("/eln/templates/names"),
    templatesFull: () => fetchJson<ElnTemplate[]>("/eln/templates"),
    check: (id: string) => fetchJson<ElnCheckResult>(`/eln/records/${id}/check`, { method: "POST" }),
    create: (body: {
      templateId: string;
      title?: string;
      prefill?: Record<string, unknown>;
      fieldValues?: Record<string, string>;
    }) =>
      fetchJson<{ success: boolean; message: string; recordId: string; record?: ExperimentRecord }>(
        "/eln/records/create",
        { method: "POST", body: JSON.stringify(body) }
      ),
    attachments: (recordId: string) =>
      fetchJson<ElnAttachment[]>(`/eln/records/${recordId}/attachments`),
    update: (id: string, body: { title?: string; fieldValues?: Record<string, string>; status?: string }) =>
      fetchJson<ExperimentRecord>(`/eln/records/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    delete: (id: string) =>
      fetchJson<{ success: boolean; message: string }>(`/eln/records/${id}`, { method: "DELETE" }),
  },
  battery: {
    hardCarbon: () => fetchJson<HardCarbonMaterial[]>("/battery/hard-carbon"),
    hardCarbonDetail: (id: string) => fetchJson<HardCarbonMaterial>(`/battery/hard-carbon/${id}`),
    hardCarbonExperimentPlan: (id: string) =>
      fetchJson<{ success: boolean; message: string; planId: string; tests: string[]; redirect?: string }>(
        `/battery/hard-carbon/${id}/experiment-plan`,
        { method: "POST" }
      ),
    reviewAnomaly: (id: string) =>
      fetchJson<{ success: boolean; message: string; reviewId: string }>(
        `/battery/testing/anomalies/${id}/review`,
        { method: "POST" }
      ),
    testingFull: () => fetchJson<BatteryFull>("/battery/testing/full"),
    anomalies: () => fetchJson<BatteryAnomaly[]>("/battery/testing/anomalies"),
  },
  innovation: {
    opportunities: () => fetchJson<InnovationOpportunity[]>("/innovation/opportunities"),
    graph: () => fetchJson<InnovationGraph>("/innovation/graph"),
    projectSummary: () =>
      fetchJson<{ success: boolean; message: string; summary: string }>(
        "/innovation/project-summary",
        { method: "POST" }
      ),
  },
  settings: {
    get: () => fetchJson<PlatformSettings>("/settings"),
    update: (body: Partial<PlatformSettings>) =>
      fetchJson<{ success: boolean; message: string; settings: PlatformSettings }>("/settings", {
        method: "PUT",
        body: JSON.stringify(body),
      }),
  },
  library: {
    documents: (category?: string) => {
      const q = category ? `?category=${encodeURIComponent(category)}` : "";
      return fetchJson<UploadedDocument[]>(`/library/documents${q}`);
    },
    deleteDocument: (id: string) =>
      fetchJson<{ success: boolean; message: string }>(`/library/documents/${id}`, { method: "DELETE" }),
  },
  data: {
    sync: () => fetchJson<{ success: boolean; message: string; syncedAt: string; documentCount: number }>("/data/sync", { method: "POST" }),
    storageStats: () =>
      fetchJson<{ totalSizeMB: number; documentCount: number; totalFiles: number; storagePath: string }>("/data/storage"),
  },
  outputs: {
    templates: () => fetchJson<OutputTemplate[]>("/outputs/templates"),
    generate: (templateId: string, dataSources: string[] = []) =>
      fetchJson<GeneratedReport & { success: boolean; message: string }>("/outputs/generate", {
        method: "POST",
        body: JSON.stringify({ templateId, dataSources }),
      }),
  },
  teacher: {
    recommendationInsights: () => fetchJson<TeacherRecommendationInsights>("/teacher/recommendation-insights"),
  },
  actions: {
    createExperiment: (body?: { templateId?: string; prefill?: Record<string, unknown> }) =>
      fetchJson<{ success: boolean; message: string; recordId: string }>("/eln/records/create", {
        method: "POST",
        body: JSON.stringify(body || { templateId: "tpl-polymer" }),
      }),
    getEvidence: (contextType: string, contextId: string) =>
      fetchJson<{ title: string; items: import("../store/uiStore").EvidenceItem[] }>(
        `/evidence/${contextType}/${contextId}`
      ),
    executeSuggestion: (id: string) =>
      fetchJson<{ success: boolean; message: string; redirect?: string; recordId?: string }>(
        `/suggestions/${id}/execute`,
        { method: "POST" }
      ),
    generateRoutes: (monomerId: string) =>
      fetchJson<{ success: boolean; message: string; routes: { id: string; description: string }[] }>(
        `/polymer/monomers/${monomerId}/generate-routes`,
        { method: "POST" }
      ),
    addToCandidates: (monomerId: string) =>
      fetchJson<{ success: boolean; message: string }>(`/polymer/monomers/${monomerId}/add-to-candidates`, {
        method: "POST",
      }),
    elnFillFields: (recordId: string) =>
      fetchJson<{ success: boolean; message: string; record?: ExperimentRecord }>(
        `/eln/records/${recordId}/fill-fields`,
        { method: "POST" }
      ),
    elnGenerateSop: (recordId: string) =>
      fetchJson<{ success: boolean; message: string; sopId: string; sopText?: string }>(
        `/eln/records/${recordId}/generate-sop`,
        { method: "POST" }
      ),
    elnSubmitReview: (recordId: string) =>
      fetchJson<{ success: boolean; message: string }>(`/eln/records/${recordId}/submit-review`, { method: "POST" }),
    exportReport: (templateId: string, format: string) =>
      fetchJson<{ success: boolean; message: string; fileName: string; downloadUrl: string }>("/outputs/export", {
        method: "POST",
        body: JSON.stringify({ templateId, format }),
      }),
  },
};

export interface PlatformSettings {
  projectName: string;
  organization: string;
  currentUser: string;
  userRole: string;
  email: string;
  autoSync: boolean;
  syncIntervalHours: number;
  lastSyncAt: string;
  defaultElnTemplate: string;
  notifyOnReview: boolean;
  notifyOnAnomaly: boolean;
  dataRetentionDays: number;
  language: string;
}

export interface UploadedDocument {
  id: string;
  fileName: string;
  category: string;
  sourceType?: string;
  title?: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface DashboardMetrics {
  literatureCount: number;
  materialObjectCount: number;
  experimentCount: number;
  reproducibilityRate: number;
  batteryDataCount: number;
  recommendationCount: number;
}

export interface SmartSuggestion {
  id: string;
  title: string;
  description: string;
  action: string;
}

export interface DashboardFull {
  metrics: DashboardMetrics;
  metricCards: { label: string; value: string; change: string }[];
  suggestions: SmartSuggestion[];
  reproducibilityTrend: { month: string; score: number }[];
  assetComposition: { name: string; value: number }[];
  recentOutputs: { title: string; date: string; type: string }[];
}

export interface Monomer {
  id: string;
  name: string;
  alias: string[];
  formula: string;
  molecularWeight: number;
  smiles: string;
  functionalGroups: string[];
  polymerizationMethods: string[];
  monomerType?: string;
  source?: string;
  bioBased: boolean;
  sustainability?: string[];
  typicalUses: string[];
  evidenceCount: number;
  internalExperimentCount: number;
  confidence: number;
  riskLevel: "low" | "medium" | "high";
  performanceRecords?: number;
  routes?: string[];
  aiAnalysis?: string;
}

export interface ExperimentPlan {
  id: string;
  monomerA: string;
  monomerB: string;
  ratio: string;
  catalyst: string;
  temperature: string;
  time: string;
  atmosphere: string;
  tests: string;
  priority: string;
}

export interface PolymerRecommendation {
  id: string;
  title: string;
  target: string[];
  monomers: string[];
  method: string;
  temperatureRange: string;
  timeRange: string;
  catalyst: string;
  expectedProperties: string[];
  risks: string[];
  evidenceCount: number;
  confidence: number;
  priority: "high" | "medium" | "low";
  evidenceSummary?: string;
  experimentMatrix: ExperimentPlan[];
}

export interface ElnTemplateField {
  key: string;
  label: string;
  type: "text" | "textarea";
  required?: boolean;
  section?: "results";
}

export interface ElnTemplate {
  id: string;
  name: string;
  domain: string;
  description?: string;
  fields: ElnTemplateField[];
}

export interface ExperimentRecord {
  id: string;
  title: string;
  domain: "polymer" | "battery";
  type: string;
  sampleId: string;
  owner: string;
  date: string;
  status: "draft" | "running" | "completed" | "review" | "returned" | "approved" | "archived";
  reproducibilityScore: number;
  completeness: number;
  missingFields: string[];
  hasRawData: boolean;
  project?: string;
  templateId?: string;
  fieldValues?: Record<string, string>;
  sopText?: string;
}

export interface ElnAttachment {
  id: string;
  fileName: string;
  sizeBytes: number;
  uploadedAt: string;
  downloadUrl: string;
}

export interface ElnCheckResult {
  reproducibilityScore: number;
  completeness: number;
  missingFields: string[];
  alerts: string[];
}

export interface HardCarbonMaterial {
  id: string;
  name: string;
  sourceType: string;
  precursor: string;
  pretreatment: string;
  carbonizationTemperature: number;
  surfaceArea: number;
  d002: number;
  idIg: number;
  initialCoulombicEfficiency: number;
  reversibleCapacity: number;
  retention: number;
  evidenceType: string;
  reliability: number;
  recommendationLevel: "high" | "medium" | "low";
  advantages?: string;
  risks?: string;
  suggestedProcess?: string;
}

export interface BatteryFull {
  overview: {
    totalRecords: number;
    validRecords: number;
    missingConditions: number;
    anomalyRecords: number;
    averageReliability: number;
    modelReadyCount: number;
  };
  reliabilityDistribution: { range: string; label: string; count: number }[];
  cycleCurves: { name: string; data: { cycle: number; capacity: number }[] }[];
  iceDistribution: { material: string; min: number; q1: number; median: number; q3: number; max: number }[];
  coinPouch: { coinCapacity: number; pouchRetention: number; reliability: number; system: string }[];
  anomalies: BatteryAnomaly[];
}

export interface BatteryAnomaly {
  id: string;
  sampleId: string;
  anomalyType: string;
  description: string;
  possibleCause: string;
  suggestion: string;
}

export interface InnovationOpportunity {
  id: string;
  title: string;
  description: string;
  value: string;
  suggestedExperiments: string[];
  maturity: string;
  evidenceCount: number;
  patentRisk: string;
  relatedNodes: string[];
}

export interface InnovationGraph {
  nodes: { id: string; label: string; type: string }[];
  edges: { source: string; target: string; relation: string }[];
}

export interface OutputTemplate {
  id: string;
  title: string;
  description: string;
  inputs: string[];
  outputs: string[];
  category: string;
}

export interface GeneratedReport {
  templateId: string;
  sections: string[];
  content: Record<string, string | string[]>;
}

export interface TeacherRecommendationInsights {
  summary: {
    studentCount: number;
    totalRecords: number;
    pendingReviews: number;
    avgCompleteness: number;
    highPriorityActions: number;
  };
  literatureTrends: {
    direction: string;
    label: string;
    paperCount: number;
    topKeywords: string[];
    insight: string;
  }[];
  paperIngestSuggestions: {
    studentId: string;
    studentName: string;
    direction: string;
    uploadedCount: number;
    reason: string;
    priority: string;
  }[];
  elnFieldGaps: { field: string; count: number; suggestion: string }[];
  lowCompletenessRecords: {
    recordId: string;
    title: string;
    owner: string;
    completeness: number;
    missingCount: number;
  }[];
  polymerRoutes: { title: string; evidence: string; priority: string; link: string }[];
  hardcarbonRoutes: { title: string; evidence: string; priority: string; link: string }[];
  trainingDataWarnings: { recordId: string; title: string; owner: string; reason: string }[];
}
