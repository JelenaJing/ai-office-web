export type LifeRawResponse = {
  temperatures: Array<"25C" | "45C">;
  curves: Record<"25C" | "45C", Record<string, Array<{ name: string; x: number[]; y: number[] }>>>;
};

export type PredictRequest = {
  n_max: number;
  formulation: Record<string, number>;
  extra_additive_name: string;
  extra_additive_amount: number;
};

export type PredictResponse = {
  n: number[];
  q25: number[];
  q45: number[];
  n80_25: number | null;
  n80_45: number | null;
};

export type MetaResponse = {
  input_file: string;
  available_components: string[];
  extra_additives: string[];
  enable_fec_input: boolean;
};

export type AnalyzeRequest = {
  n80_25: number | null;
  n80_45: number | null;
  knee25: number | null;
  knee45: number | null;
  capAtKnee25: number | null;
  capAtKnee45: number | null;
  critical25: number | null;
  critical45: number | null;
  maxCycle: number | null;
  capAtMax25: number | null;
  capAtMax45: number | null;
  formulation: Record<string, number>;
  extraAdditiveName: string;
  extraAdditiveAmount: number;
  userEntryCount: number;
  experimentRows: Array<{
    fileName: string;
    tempC: number;
    kneeCycle: number | null;
    capAtKnee: number | null;
    criticalCycle: number | null;
  }>;
};

export type AnalyzeResponse = {
  markdown: string;
  llmConfigured: boolean;
};

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

export const api = {
  meta: () => jsonFetch<MetaResponse>("/api/ai4science/battery/meta"),
  lifeRaw: () => jsonFetch<LifeRawResponse>("/api/ai4science/battery/life/raw"),
  predict: (req: PredictRequest) =>
    jsonFetch<PredictResponse>("/api/ai4science/battery/life/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req)
    }),
  analyze: (req: AnalyzeRequest) =>
    jsonFetch<AnalyzeResponse>("/api/ai4science/battery/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req)
    })
};

