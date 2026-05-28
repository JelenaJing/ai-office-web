import React, { useMemo } from "react";
import type { PredictResponse } from "../lib/api";
import { Plot } from "../lib/plot";
import type { UserLifeEntry } from "./lifeCurveTypes";
import { PlotDropZone, UploadCsvExcelButton } from "./PlotDropZone";

const COLOR_25 = "#ef4444";
const COLOR_45 = "#111827";

const LIFE_ACCEPT =
  ".csv,.txt,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

type Props = {
  pred: PredictResponse | null;
  userEntries: UserLifeEntry[];
  draftTempC: number;
  onDraftTempChange: (t: number) => void;
  onUploadFile: (file: File) => void;
  onClearAllUser: () => void;
};

export function CombinedLifeCurveChart(props: Props) {
  const { pred, userEntries, draftTempC, onDraftTempChange, onUploadFile, onClearAllUser } = props;

  const traces = useMemo(() => {
    const out: object[] = [];
    if (pred?.n?.length) {
      out.push({
        x: pred.n,
        y: pred.q25,
        type: "scatter",
        mode: "lines",
        line: { color: COLOR_25, width: 2 },
        hovertemplate: "25℃ cycle=%{x}<br>Q=%{y:.4f}<extra></extra>",
        showlegend: false
      });
      out.push({
        x: pred.n,
        y: pred.q45,
        type: "scatter",
        mode: "lines",
        line: { color: COLOR_45, width: 2 },
        hovertemplate: "45℃ cycle=%{x}<br>Q=%{y:.4f}<extra></extra>",
        showlegend: false
      });
    }
    for (const e of userEntries) {
      if (!e.scatter.x.length) continue;
      out.push({
        x: e.scatter.x,
        y: e.scatter.y,
        type: "scatter",
        mode: "markers",
        marker: { size: 7, color: e.color, opacity: 0.85, line: { color: "#ffffff", width: 0.5 } },
        text: e.scatter.x.map(
          (xv, i) =>
            `${e.tempC}℃ · ${e.fileName}<br>cycle=${xv}<br>Q=${Number(e.scatter.y[i]).toFixed(4)}`
        ),
        hovertemplate: "%{text}<extra></extra>",
        showlegend: false
      });
    }
    return out;
  }, [pred, userEntries]);

  const ymax = useMemo(() => {
    let mx = 1.06;
    if (pred) {
      for (const v of [...pred.q25, ...pred.q45]) if (Number.isFinite(v)) mx = Math.max(mx, v + 0.02);
    }
    for (const e of userEntries) {
      for (const v of e.scatter.y) if (Number.isFinite(v)) mx = Math.max(mx, v + 0.02);
    }
    return mx;
  }, [pred, userEntries]);

  const plotRevision = useMemo(() => {
    if (!pred?.n?.length) return 0;
    const last = pred.n.length - 1;
    return [
      pred.n80_25,
      pred.n80_45,
      pred.n[last],
      pred.q25[last],
      pred.q45[last],
      pred.n.length
    ].join("|");
  }, [pred]);

  const xrange = useMemo<[number, number] | undefined>(() => {
    const xs: number[] = [];
    if (pred?.n?.length) xs.push(pred.n[0]!, pred.n[pred.n.length - 1]!);
    for (const e of userEntries) {
      if (!e.scatter.x.length) continue;
      xs.push(e.scatter.x[0]!, e.scatter.x[e.scatter.x.length - 1]!);
    }
    if (xs.length < 2) return undefined;
    const lo = Math.min(...xs);
    const hi = Math.max(...xs);
    const pad = Math.max((hi - lo) * 0.02, 1);
    return [lo - pad, hi + pad];
  }, [pred?.n, userEntries]);

  return (
    <div className="card">
      <div className="cardHeader">
        <div className="cardTitle">Cycle · Capacity</div>
        <UploadCsvExcelButton accept={LIFE_ACCEPT} onFile={onUploadFile} />
      </div>
      <div className="row" style={{ marginBottom: 10 }}>
        <label style={{ alignItems: "center", gap: 6, display: "inline-flex", flexWrap: "wrap" }}>
          <span>测试温度</span>
          <input
            className="input"
            style={{ width: 100 }}
            type="number"
            step={0.1}
            value={Number.isFinite(draftTempC) ? draftTempC : ""}
            onChange={(ev) => {
              const v = ev.target.value;
              onDraftTempChange(v === "" ? NaN : Number(v));
            }}
          />
          <span style={{ marginLeft: 2 }}>℃</span>
        </label>
      </div>
      <PlotDropZone className="plotWrapTall" style={{ minHeight: 380 }} onFile={onUploadFile} accept={LIFE_ACCEPT}>
        <Plot
          data={traces}
          layout={{
            datarevision: plotRevision,
            autosize: true,
            margin: { l: 52, r: 20, t: 10, b: 44 },
            xaxis: { title: "Cycle", showgrid: true, gridcolor: "#f3f4f6", range: xrange },
            yaxis: {
              title: "Capacity (normalized)",
              range: [0.8, ymax],
              autorange: false,
              showgrid: true,
              gridcolor: "#f3f4f6"
            },
            shapes:
              xrange != null
                ? [
                    {
                      type: "line",
                      xref: "x",
                      yref: "y",
                      x0: xrange[0],
                      x1: xrange[1],
                      y0: 0.8,
                      y1: 0.8,
                      line: { color: "#94a3b8", width: 1, dash: "dash" }
                    }
                  ]
                : [],
            showlegend: false
          }}
          config={{ responsive: true, displaylogo: false }}
          style={{ width: "100%", height: "100%" }}
        />
      </PlotDropZone>
    </div>
  );
}
