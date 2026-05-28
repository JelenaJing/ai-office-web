import Papa from "papaparse";
import React, { useMemo, useState } from "react";
import { Plot } from "../lib/plot";
import { PlotDropZone, UploadCsvExcelButton } from "./PlotDropZone";

type Row = Record<string, string | number | null | undefined>;

function uniqSorted(nums: number[]) {
  return Array.from(new Set(nums)).sort((a, b) => a - b);
}

export function CsvCycleViewer() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [cycle, setCycle] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cycles = useMemo(() => {
    const ns = rows.map((r) => Number(r["循环号"])).filter((v) => Number.isFinite(v)) as number[];
    return uniqSorted(ns);
  }, [rows]);

  const cycleRows = useMemo(() => {
    if (cycle == null) return [];
    return rows.filter((r) => Number(r["循环号"]) === cycle);
  }, [rows, cycle]);

  const x = useMemo(
    () => cycleRows.map((r) => Number(r["测试时间(min)"])).filter((v) => Number.isFinite(v)) as number[],
    [cycleRows]
  );
  const v = useMemo(
    () => cycleRows.map((r) => Number(r["电压(V)"])).filter((vv) => Number.isFinite(vv)) as number[],
    [cycleRows]
  );
  const i = useMemo(
    () => cycleRows.map((r) => Number(r["电流(A)"])).filter((ii) => Number.isFinite(ii)) as number[],
    [cycleRows]
  );

  function onFile(file: File) {
    setError(null);
    setFileName(file.name);
    Papa.parse<Row>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const data = (result.data || []).filter(Boolean);
        setRows(data);
        const cs = uniqSorted(data.map((r) => Number(r["循环号"])).filter((vv) => Number.isFinite(vv)) as number[]);
        setCycle(cs[0] ?? null);
      },
      error: (err) => {
        setError(String(err));
      }
    });
  }

  const missingColumns = useMemo(() => {
    const required = ["循环号", "测试时间(min)", "电压(V)", "电流(A)"];
    const first = rows[0];
    if (!first) return required;
    return required.filter((k) => !(k in first));
  }, [rows]);

  return (
    <div className="card">
      <div className="cardHeader">
        <div className="cardTitle">Intracycle Current / Voltage</div>
        <UploadCsvExcelButton accept=".csv,text/csv" onFile={onFile} />
      </div>

      {fileName ? <div style={{ fontSize: 12, marginBottom: 8 }}>{fileName}</div> : null}
      {error ? <div style={{ color: "#b91c1c" }}>{error}</div> : null}
      {rows.length > 0 && missingColumns.length > 0 ? (
        <div style={{ color: "#b45309", marginBottom: 8 }}>缺少列：{missingColumns.join("、")}</div>
      ) : null}

      <div className="row" style={{ marginBottom: 8 }}>
        <label>Cycle：</label>
        <select
          className="select"
          value={cycle ?? ""}
          onChange={(e) => setCycle(e.target.value ? Number(e.target.value) : null)}
          disabled={cycles.length === 0}
        >
          {cycles.length === 0 ? <option value="">（无可用 cycle）</option> : null}
          {cycles.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <PlotDropZone className="plotWrap" onFile={onFile} accept=".csv,text/csv">
        <Plot
          data={[
            {
              x,
              y: v,
              type: "scatter",
              mode: "lines",
              name: "Voltage (V)",
              line: { color: "#2563eb", width: 2 },
              yaxis: "y"
            },
            {
              x,
              y: i,
              type: "scatter",
              mode: "lines",
              name: "Current (A)",
              line: { color: "#f97316", width: 2 },
              yaxis: "y2"
            }
          ]}
          layout={{
            autosize: true,
            margin: { l: 50, r: 50, t: 30, b: 40 },
            title: cycle != null ? `Cycle ${cycle}` : undefined,
            xaxis: { title: "Test Time (min)", showgrid: true, gridcolor: "#eef2ff" },
            yaxis: { title: "Voltage (V)", side: "left" },
            yaxis2: { title: "Current (A)", overlaying: "y", side: "right" },
            showlegend: false
          }}
          config={{ responsive: true, displaylogo: false }}
          style={{ width: "100%", height: "100%" }}
        />
      </PlotDropZone>
    </div>
  );
}
