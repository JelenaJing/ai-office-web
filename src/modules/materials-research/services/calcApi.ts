const CALC_BASE = "/calc";

export interface CalcFormulationResponse {
  success: boolean;
  message: string;
  recommendations: Array<Record<string, unknown>>;
  engine?: string;
}

export interface CalcPropertyResponse {
  success: boolean;
  polymerName: string;
  predictions: Record<string, [number, number]>;
  confidence: number;
  similarCount: number;
  notes: string[];
  engine?: string;
  matchedRecordId?: string;
}

export interface CalcBatteryResponse {
  success: boolean;
  message?: string;
  reversibleCapacityRange?: [number, number];
  initialCoulombicEfficiencyRange?: [number, number];
  cycleRetentionAfter100Cycles?: number;
  impedanceGrowthRisk?: string;
  pouchScaleRisk?: string;
  confidenceScore?: number;
  recommendations?: string[];
  missingFields?: string[];
  engine?: string;
}

async function calcPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${CALC_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || `计算服务错误 (${res.status})`);
  }
  return res.json();
}

export async function calcFormulationRecommend(body: {
  targets: string[];
  extraGoal?: string;
  constraints?: Record<string, unknown>;
}): Promise<CalcFormulationResponse> {
  return calcPost("/api/v1/formulation/recommend", body);
}

export async function calcPropertyPredict(body: {
  polymerName: string;
  monomers: string[];
}): Promise<CalcPropertyResponse> {
  return calcPost("/api/v1/property/predict", body);
}

export async function calcBatteryPredict(body: {
  materialType?: string;
  rawMaterial?: string;
  carbonizationTemperature?: number;
  surfaceArea?: number;
  cellType?: string;
}): Promise<CalcBatteryResponse> {
  return calcPost("/api/v1/battery/predict", body);
}

export async function calcHealth(): Promise<Record<string, unknown>> {
  const res = await fetch(`${CALC_BASE}/health`);
  if (!res.ok) throw new Error("计算服务未启动（端口 8030）");
  return res.json();
}
