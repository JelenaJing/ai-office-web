import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { api, type MetaResponse, type PredictRequest, type PredictResponse } from "../lib/api";
import { CsvCycleViewer } from "../components/CsvCycleViewer";
import { CombinedLifeCurveChart } from "../components/CombinedLifeCurveChart";
import { CustomFormulation } from "../components/CustomFormulation";
import { ExperimentFormulationPanel } from "../components/ExperimentFormulationPanel";
import { LifeAnalysisPanel, type ExperimentTableRowModel } from "../components/LifeAnalysisPanel";
import { analyzeCycleCapacityRobust, sanitizeSeries } from "../lib/degradationAnalysis";
import { experimentScatterColor } from "../lib/experimentScatterPalette";
import { parseCycleCapacityCsv, parseCycleCapacityExcel } from "../lib/parseCycleCapacityFile";
import type { UserLifeEntry, UserScatterSeries } from "../components/lifeCurveTypes";
import "../styles.css";

function rowId() {
  return `u-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 9)}`;
}

type FormulationPayload = {
  formulation: Record<string, number>;
  extraAdditiveName: string;
  extraAdditiveAmount: number;
  nMax: number;
};

const DEFAULT_FORMULATION: FormulationPayload = {
  formulation: {},
  extraAdditiveName: "None",
  extraAdditiveAmount: 0,
  nMax: 1500
};

export default function Ai4scienceBatteryPage() {
  const [meta, setMeta] = useState<MetaResponse | null>(null);
  const [pred, setPred] = useState<PredictResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [predicting, setPredicting] = useState(false);
  const [userEntries, setUserEntries] = useState<UserLifeEntry[]>([]);
  const scatterPaletteIdx = useRef(0);
  const [draftTempC, setDraftTempC] = useState(25);
  const [, setExperimentRecipe] = useState<Record<string, number>>({});
  const [formulationPayload, setFormulationPayload] = useState<FormulationPayload>(DEFAULT_FORMULATION);
  const [reportMarkdown, setReportMarkdown] = useState<string>("");
  const [reportLoading, setReportLoading] = useState(false);
  const [llmConfigured, setLlmConfigured] = useState<boolean | null>(null);

  const predictSeq = useRef(0);
  const analyzeSeq = useRef(0);
  const predictDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const analyzeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runPredict = useCallback((req: PredictRequest) => {
    const seq = ++predictSeq.current;
    setPredicting(true);
    return api
      .predict(req)
      .then((pRes) => {
        if (seq !== predictSeq.current) return;
        setErr(null);
        setPred(pRes);
      })
      .catch((e) => {
        if (seq !== predictSeq.current) return;
        setErr(String(e?.message || e));
      })
      .finally(() => {
        if (seq === predictSeq.current) setPredicting(false);
      });
  }, []);

  const schedulePredict = useCallback(
    (payload: FormulationPayload, debounceMs = 0) => {
      setFormulationPayload(payload);
      if (predictDebounceRef.current) clearTimeout(predictDebounceRef.current);
      predictDebounceRef.current = setTimeout(() => {
        void runPredict({
          n_max: payload.nMax,
          formulation: payload.formulation,
          extra_additive_name: payload.extraAdditiveName,
          extra_additive_amount: payload.extraAdditiveAmount
        });
      }, debounceMs);
    },
    [runPredict]
  );

  useEffect(() => {
    let cancelled = false;
    api
      .meta()
      .then((m) => {
        if (cancelled) return;
        setMeta(m);
      })
      .catch((e) => {
        if (cancelled) return;
        setErr(String(e?.message || e));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!meta) return;
    schedulePredict(DEFAULT_FORMULATION, 0);
    return () => {
      if (predictDebounceRef.current) clearTimeout(predictDebounceRef.current);
    };
  }, [meta, schedulePredict]);

  const analysisPred25 = useMemo(() => {
    if (!pred?.n?.length || pred.q25.length !== pred.n.length) return null;
    return analyzeCycleCapacityRobust(pred.n, pred.q25, 0.8);
  }, [pred]);

  const analysisPred45 = useMemo(() => {
    if (!pred?.n?.length || pred.q45.length !== pred.n.length) return null;
    return analyzeCycleCapacityRobust(pred.n, pred.q45, 0.8);
  }, [pred]);

  const hasUserLife = userEntries.length > 0;

  const predMaxCycle = useMemo(() => {
    if (!pred?.n?.length) return null;
    return pred.n[pred.n.length - 1]!;
  }, [pred]);

  const predCapAtMax25 = useMemo(() => {
    if (!pred?.q25?.length) return null;
    return pred.q25[pred.q25.length - 1]!;
  }, [pred]);

  const predCapAtMax45 = useMemo(() => {
    if (!pred?.q45?.length) return null;
    return pred.q45[pred.q45.length - 1]!;
  }, [pred]);

  const experimentTableRows = useMemo((): ExperimentTableRowModel[] => {
    return userEntries.map((e) => {
      const ax = e.scatter.x;
      const ay = e.scatter.y;
      const maxC = ax.length ? ax[ax.length - 1]! : null;
      const capM = ay.length ? ay[ay.length - 1]! : null;
      const analysis = ax.length >= 3 ? analyzeCycleCapacityRobust(ax, ay, 0.8) : null;
      return {
        id: e.id,
        tempC: e.tempC,
        pointColorHex: e.color,
        fileName: e.fileName,
        analysis,
        maxCycle: maxC,
        capAtMax: capM,
        onRemove: () => setUserEntries((prev) => prev.filter((x) => x.id !== e.id))
      };
    });
  }, [userEntries]);

  const topSummary = useMemo(() => {
    const p25 = analysisPred25;
    const p45 = analysisPred45;
    if (!pred) return "加载中…";
    const n80a = pred.n80_25 == null ? "N/A" : Math.round(pred.n80_25).toString();
    const n80b = pred.n80_45 == null ? "N/A" : Math.round(pred.n80_45).toString();
    const k25 = p25?.kneeCycle == null ? "—" : p25.kneeCycle.toFixed(1);
    const k45 = p45?.kneeCycle == null ? "—" : p45.kneeCycle.toFixed(1);
    const busy = predicting ? " ｜ 曲线更新中…" : "";
    return `预测 N80：25℃=${n80a}，45℃=${n80b} ｜ knee cycle：25℃=${k25}，45℃=${k45}${busy}`;
  }, [pred, analysisPred25, analysisPred45, predicting]);

  useEffect(() => {
    if (!pred) return;
    if (analyzeDebounceRef.current) clearTimeout(analyzeDebounceRef.current);
    const seq = ++analyzeSeq.current;
    setReportLoading(true);

    analyzeDebounceRef.current = setTimeout(() => {
      void api
        .analyze({
          n80_25: pred.n80_25,
          n80_45: pred.n80_45,
          knee25: analysisPred25?.kneeCycle ?? null,
          knee45: analysisPred45?.kneeCycle ?? null,
          capAtKnee25: analysisPred25?.capacityAtKnee ?? null,
          capAtKnee45: analysisPred45?.capacityAtKnee ?? null,
          critical25: analysisPred25?.criticalCycleBelow ?? null,
          critical45: analysisPred45?.criticalCycleBelow ?? null,
          maxCycle: predMaxCycle,
          capAtMax25: predCapAtMax25,
          capAtMax45: predCapAtMax45,
          formulation: formulationPayload.formulation,
          extraAdditiveName: formulationPayload.extraAdditiveName,
          extraAdditiveAmount: formulationPayload.extraAdditiveAmount,
          userEntryCount: userEntries.length,
          experimentRows: experimentTableRows.map((row) => ({
            fileName: row.fileName,
            tempC: row.tempC,
            kneeCycle: row.analysis?.kneeCycle ?? null,
            capAtKnee: row.analysis?.capacityAtKnee ?? null,
            criticalCycle: row.analysis?.criticalCycleBelow ?? null
          }))
        })
        .then((res) => {
          if (seq !== analyzeSeq.current) return;
          setReportMarkdown(res.markdown);
          setLlmConfigured(res.llmConfigured);
          setErr(null);
        })
        .catch((e) => {
          if (seq !== analyzeSeq.current) return;
          setReportMarkdown("");
          setErr(String(e?.message || e));
        })
        .finally(() => {
          if (seq === analyzeSeq.current) setReportLoading(false);
        });
    }, 600);

    return () => {
      if (analyzeDebounceRef.current) clearTimeout(analyzeDebounceRef.current);
    };
  }, [
    pred,
    analysisPred25,
    analysisPred45,
    predMaxCycle,
    predCapAtMax25,
    predCapAtMax45,
    formulationPayload,
    userEntries.length,
    experimentTableRows
  ]);

  const handleLifeFile = useCallback(
    async (file: File) => {
      setErr(null);
      if (!Number.isFinite(draftTempC)) {
        setErr("请输入合法测试温度（℃）");
        return;
      }
      const name = file.name.toLowerCase();
      try {
        let cycles: number[] = [];
        let capacities: number[] = [];
        if (name.endsWith(".csv") || name.endsWith(".txt")) {
          const text = await file.text();
          ({ cycles, capacities } = parseCycleCapacityCsv(text));
        } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
          const buf = await file.arrayBuffer();
          ({ cycles, capacities } = parseCycleCapacityExcel(buf));
        } else {
          setErr("仅支持 .csv / .txt / .xlsx / .xls");
          return;
        }
        if (cycles.length < 2) {
          setErr("上传文件：第 1 列为 cycle、第 2 列为 capacity（首行为表头），且至少 2 个有效数据点");
          return;
        }
        const { n, y } = sanitizeSeries(cycles, capacities);
        const scatter: UserScatterSeries = { x: n, y, label: file.name };
        const color = experimentScatterColor(scatterPaletteIdx.current++);
        setUserEntries((prev) => [
          ...prev,
          { id: rowId(), scatter, fileName: file.name, tempC: draftTempC, color }
        ]);
      } catch (e) {
        setErr(String(e));
      }
    },
    [draftTempC]
  );

  const reportTitle = !pred ? "模型加载中" : reportLoading ? "AI 分析生成中…" : "AI 分析报告";

  return (
    <div className="ai4scienceBattery">
      <div className="topBar">
        <div>
          <div className="title">ai4science · Battery UI（React）</div>
        </div>
        <div className="subtitle">{topSummary}</div>
      </div>

      {err ? (
        <div className="card" style={{ borderColor: "#ef4444", color: "#991b1b" }}>
          提示：{err}
          <div className="cardHint" style={{ marginTop: 6 }}>
            若接口失败，请检查 ai-office-web 服务端日志；本页面不再启动 ai4science 的 8081/8082 端口。
          </div>
        </div>
      ) : null}

      <div className="layout">
        <div className="col">
          <CsvCycleViewer />
          <div className="card">
            <div className="cardHeader">
              <div className="cardTitle">{reportTitle}</div>
              {llmConfigured === false ? (
                <div className="cardHint">LLM 未配置，显示规则化摘要</div>
              ) : null}
            </div>
            <div className="reportBody reportMarkdown">
              {!pred ? (
                <p>正在从服务端加载电池寿命降解模型…</p>
              ) : reportLoading && !reportMarkdown ? (
                <p>正在根据当前预测曲线、配方与实验数据生成分析报告…</p>
              ) : reportMarkdown ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{reportMarkdown}</ReactMarkdown>
              ) : (
                <p>分析报告暂不可用，请稍后重试或检查服务端 LLM 配置。</p>
              )}
              <div style={{ marginTop: 10, fontSize: 12, color: "#64748b" }}>
                knee cycle 基于首末点弦线的最大垂距估计；80% 临界点按容量阈值 0.8 计算。
              </div>
            </div>
          </div>
        </div>

        <div className="col">
          <CombinedLifeCurveChart
            pred={pred}
            userEntries={userEntries}
            draftTempC={draftTempC}
            onDraftTempChange={setDraftTempC}
            onUploadFile={(f) => void handleLifeFile(f)}
            onClearAllUser={() => setUserEntries([])}
          />

          <LifeAnalysisPanel
            pred25={analysisPred25}
            pred45={analysisPred45}
            predN80_25={pred?.n80_25 ?? null}
            predN80_45={pred?.n80_45 ?? null}
            predMaxCycle={predMaxCycle}
            predCapAtMax25={predCapAtMax25}
            predCapAtMax45={predCapAtMax45}
            experimentRows={experimentTableRows}
          />

          <div
            className="formulationRow"
            style={{
              display: "grid",
              gridTemplateColumns: hasUserLife ? "1fr 1fr" : "1fr",
              gap: 12,
              alignItems: "start"
            }}
          >
            <CustomFormulation
              availableComponents={meta?.available_components ?? ["PF6", "FSI", "VC", "FEC", "MMDS", "TMSP", "DDSI"]}
              extraAdditives={meta?.extra_additives ?? ["None"]}
              onChange={(p) => schedulePredict(p, 280)}
            />
            {hasUserLife ? (
              <ExperimentFormulationPanel
                availableComponents={meta?.available_components ?? ["PF6", "FSI", "VC", "FEC", "MMDS", "TMSP", "DDSI"]}
                onFormulationChange={setExperimentRecipe}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
