import React from "react";
import { formatCriticalDisplay, type CycleCapacityAnalysis } from "../lib/degradationAnalysis";

function fmt(v: number | null | undefined) {
  if (v == null || !Number.isFinite(v)) return "—";
  return v >= 100 ? v.toFixed(0) : v.toFixed(1);
}

export type ExperimentTableRowModel = {
  id: string;
  tempC: number;
  pointColorHex: string;
  fileName: string;
  analysis: CycleCapacityAnalysis | null;
  maxCycle: number | null;
  capAtMax: number | null;
  onRemove: () => void;
};

type Props = {
  pred25: CycleCapacityAnalysis | null;
  pred45: CycleCapacityAnalysis | null;
  predN80_25?: number | null;
  predN80_45?: number | null;
  predMaxCycle?: number | null;
  predCapAtMax25?: number | null;
  predCapAtMax45?: number | null;
  experimentRows: ExperimentTableRowModel[];
};

export function LifeAnalysisPanel(props: Props) {
  const {
    pred25,
    pred45,
    predN80_25,
    predN80_45,
    predMaxCycle,
    predCapAtMax25,
    predCapAtMax45,
    experimentRows
  } = props;

  const pred25Critical =
    pred25 != null
      ? formatCriticalDisplay(pred25, { maxCycle: predMaxCycle, capacityAtMaxCycle: predCapAtMax25 })
      : predN80_25 != null && Number.isFinite(predN80_25)
        ? `≤0.80：${fmt(predN80_25)}`
        : "—";

  const pred45Critical =
    pred45 != null
      ? formatCriticalDisplay(pred45, { maxCycle: predMaxCycle, capacityAtMaxCycle: predCapAtMax45 })
      : predN80_45 != null && Number.isFinite(predN80_45)
        ? `≤0.80：${fmt(predN80_45)}`
        : "—";

  return (
    <div className="card">
      <div className="cardHeader">
        <div className="cardTitle">衰减分析 · Knee & 80% 临界点</div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          gap: 0,
          alignItems: "start"
        }}
      >
        {/* 预测表 */}
        <div style={{ overflowX: "auto", paddingRight: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>预测曲线</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "#6b7280" }}>
                <th style={{ padding: "6px 8px" }}>温度</th>
                <th style={{ padding: "6px 8px" }}>曲线颜色</th>
                <th style={{ padding: "6px 8px" }}>knee cycle</th>
                <th style={{ padding: "6px 8px" }}>knee 处容量</th>
                <th style={{ padding: "6px 8px" }}>80% 临界</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "6px 8px", fontWeight: 600 }}>25℃</td>
                <td style={{ padding: "6px 8px" }}>
                  <span style={{ color: "#ef4444", fontWeight: 700 }}>■</span>
                </td>
                <td style={{ padding: "6px 8px" }}>{fmt(pred25?.kneeCycle ?? null)}</td>
                <td style={{ padding: "6px 8px" }}>{pred25?.capacityAtKnee != null ? pred25.capacityAtKnee.toFixed(4) : "—"}</td>
                <td style={{ padding: "6px 8px" }}>{pred25Critical}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "6px 8px", fontWeight: 600 }}>45℃</td>
                <td style={{ padding: "6px 8px" }}>
                  <span style={{ color: "#111827", fontWeight: 700 }}>■</span>
                </td>
                <td style={{ padding: "6px 8px" }}>{fmt(pred45?.kneeCycle ?? null)}</td>
                <td style={{ padding: "6px 8px" }}>{pred45?.capacityAtKnee != null ? pred45.capacityAtKnee.toFixed(4) : "—"}</td>
                <td style={{ padding: "6px 8px" }}>{pred45Critical}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          style={{
            width: 2,
            minHeight: 120,
            background: "#e5e7eb",
            marginTop: 28,
            borderRadius: 1
          }}
          aria-hidden
        />

        {/* 实验表 */}
        <div style={{ overflowX: "auto", paddingLeft: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>实验散点</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "#6b7280" }}>
                <th style={{ padding: "6px 8px" }}>温度 ℃</th>
                <th style={{ padding: "6px 8px" }}>点颜色</th>
                <th style={{ padding: "6px 8px" }}>文件名</th>
                <th style={{ padding: "6px 8px" }}>knee cycle</th>
                <th style={{ padding: "6px 8px" }}>knee 处容量</th>
                <th style={{ padding: "6px 8px" }}>80% 临界</th>
                <th style={{ padding: "6px 8px" }} />
              </tr>
            </thead>
            <tbody>
              {experimentRows.length === 0 ? (
                <tr>
                  <td style={{ padding: "6px 8px", color: "#9ca3af" }} colSpan={7}>
                    —
                  </td>
                </tr>
              ) : (
                experimentRows.map((row) => (
                  <tr key={row.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "6px 8px", fontWeight: 600 }}>
                      {Number.isFinite(row.tempC) ? row.tempC : "—"}
                    </td>
                    <td style={{ padding: "6px 8px" }}>
                      <span style={{ color: row.pointColorHex, fontWeight: 700 }}>■</span>
                    </td>
                    <td style={{ padding: "6px 8px", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis" }} title={row.fileName}>
                      {row.fileName}
                    </td>
                    <td style={{ padding: "6px 8px" }}>{fmt(row.analysis?.kneeCycle ?? null)}</td>
                    <td style={{ padding: "6px 8px" }}>
                      {row.analysis?.capacityAtKnee != null ? row.analysis.capacityAtKnee.toFixed(4) : "—"}
                    </td>
                    <td style={{ padding: "6px 8px" }}>
                      {formatCriticalDisplay(row.analysis, { maxCycle: row.maxCycle, capacityAtMaxCycle: row.capAtMax })}
                    </td>
                    <td style={{ padding: "6px 8px" }}>
                      <button type="button" className="btn btnDanger" style={{ padding: "2px 8px", fontSize: 11 }} onClick={row.onRemove}>
                        移除
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
