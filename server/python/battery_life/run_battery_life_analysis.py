from __future__ import annotations

import argparse
import json
import os
import sys
from dataclasses import asdict
from typing import Any, Dict, List, Optional, Sequence, Tuple

import numpy as np

from battery_life_core import (
    DegradationModel,
    aggressive_clean,
    calculate_n80,
    fit_global_model_for_prediction,
    load_all_sample_curves,
    predict_with_extra,
)


PROGRESS_PREFIX = "DATA_ANALYSIS_PROGRESS:"


def report_progress(stage: str, message: str) -> None:
    payload = {"stage": stage, "message": message}
    print(PROGRESS_PREFIX + json.dumps(payload, ensure_ascii=False), flush=True)


def infer_ext(input_path: str) -> str:
    p = str(input_path or "").strip().lower()
    if p.endswith(".csv"):
        return "csv"
    if p.endswith(".xlsx"):
        return "xlsx"
    if p.endswith(".xls"):
        return "xls"
    return ""


def ensure_dir(p: str) -> None:
    os.makedirs(p, exist_ok=True)


def normalize_float(x: Any) -> float:
    try:
        return float(x)
    except Exception:
        return float("nan")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    input_path = str(args.input).strip()
    output_root = str(args.output).strip()

    try:
        ext = infer_ext(input_path)
        if not ext:
            raise ValueError("文件格式不支持：仅支持 .csv / .xlsx / .xls")
        if not os.path.isfile(input_path):
            raise ValueError("输入文件不存在")

        ensure_dir(output_root)
        charts_dir = os.path.join(output_root, "charts")
        files_dir = os.path.join(output_root, "files")
        ensure_dir(charts_dir)
        ensure_dir(files_dir)

        report_progress("读取数据", "正在读取输入文件并解析样本曲线…")
        curves_by_temp = load_all_sample_curves(input_path, ext)

        # We require 25 and 45
        if 25.0 not in curves_by_temp or 45.0 not in curves_by_temp:
            raise ValueError("Excel 缺少 25℃ / 45℃ sheet")

        # Clean anomalies per sample
        report_progress("清洗异常点", "正在清洗异常容量点…")
        cleaned: Dict[float, List[Tuple[str, np.ndarray, np.ndarray]]] = {}
        for temp in [25.0, 45.0]:
            temp_samples = curves_by_temp.get(temp, {})
            temp_list: List[Tuple[str, np.ndarray, np.ndarray]] = []
            for sample_id, (cycles, caps) in temp_samples.items():
                c, y, _info = aggressive_clean(cycles, caps)
                if c.size < 3:
                    continue
                temp_list.append((sample_id, c, y))
            cleaned[temp] = temp_list

        for temp in [25.0, 45.0]:
            if len(cleaned[temp]) == 0:
                raise ValueError(f"{int(temp)}℃ 数据清洗后无有效样本")

        # Fit model per temperature
        report_progress("拟合衰减模型", "正在拟合衰减模型参数（全局拟合）…")
        fitted: Dict[float, Dict[str, Any]] = {}
        for temp in [25.0, 45.0]:
            params = fit_global_model_for_prediction(cleaned[temp])
            fitted[temp] = params

        # Generate predictions
        report_progress("生成预测曲线", "正在生成预测曲线与 N80 指标…")
        results_by_temp: Dict[float, Dict[str, Any]] = {}

        # Prepare cycles grid
        for temp in [25.0, 45.0]:
            temp_list = cleaned[temp]
            cycles_max = 0.0
            for _sid, c, _y in temp_list:
                cycles_max = max(cycles_max, float(np.max(c)))

            # extend grid a bit beyond observed
            grid = np.linspace(0, cycles_max * 1.2, 300)

            c0s: Dict[str, float] = {}
            per_sample_n80: Dict[str, Optional[float]] = {}
            per_sample_rmse = {}
            pred_curves = {}

            model: DegradationModel = fitted[temp]["model"]
            for sample_id, cycles, caps in temp_list:
                c0 = float(np.max(caps))
                c0s[sample_id] = c0
                pred = predict_with_extra(model, grid, c0)
                pred_curves[sample_id] = pred["pred_capacity"].tolist()
                per_sample_n80[sample_id] = pred["n80"]

                # rmse on observed points
                obs_pred = model.capacity(cycles, c0)
                resid = caps - obs_pred
                rmse = float(np.sqrt(np.mean(resid * resid))) if resid.size else None
                per_sample_rmse[sample_id] = rmse

            avg_c0 = float(np.mean(list(c0s.values()))) if c0s else 0.0
            avg_pred = model.capacity(grid, avg_c0)

            # average n80 from average c0
            thr = 0.8 * avg_c0
            denom = (avg_c0 - model.c_inf)
            avg_n80 = None
            if denom != 0 and avg_c0 > 0:
                r = (thr - model.c_inf) / denom
                if 0 < r < 1 and model.k > 0:
                    avg_n80 = float(-np.log(r) / model.k)

            results_by_temp[temp] = {
                "model": asdict(model),
                "c_inf": fitted[temp]["c_inf"],
                "k": fitted[temp]["k"],
                "rmse": fitted[temp]["rmse"],
                "grid_cycles": grid.tolist(),
                "avg_c0": avg_c0,
                "avg_pred_capacity": avg_pred.tolist(),
                "avg_n80": avg_n80,
                "per_sample_n80": per_sample_n80,
                "per_sample_c0": c0s,
            }

        # Charts (png)
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt

        for temp in [25.0, 45.0]:
            temp_list = cleaned[temp]
            model_dict = results_by_temp[temp]
            c_inf = float(model_dict["c_inf"])
            k = float(model_dict["k"])
            model = DegradationModel(c_inf=c_inf, k=k)

            grid = np.asarray(model_dict["grid_cycles"], dtype=float)
            avg_pred = np.asarray(model_dict["avg_pred_capacity"], dtype=float)

            plt.figure(figsize=(9, 5))
            plt.title(f"容量衰减（{int(temp)}℃）与全局拟合曲线")
            plt.xlabel("Cycle")
            plt.ylabel("Capacity")

            for sample_id, cycles, caps in temp_list:
                plt.scatter(cycles, caps, s=12, alpha=0.5, label=None)
                # show one predicted curve per sample lightly
                c0 = float(np.max(caps))
                pred = model.capacity(cycles, c0)
                plt.plot(cycles, pred, linewidth=1.0, alpha=0.35)

            plt.plot(grid, avg_pred, color="#d97706", linewidth=3, label="Fitted (avg)")
            plt.axhline(0.8 * float(model_dict["avg_c0"]), color="#ef4444", linestyle="--", linewidth=1)

            out_png = os.path.join(charts_dir, f"capacity_decay_{int(temp)}C.png")
            plt.tight_layout()
            plt.savefig(out_png, dpi=160)
            plt.close()

        # n80 summary chart
        report_progress("生成报告", "正在生成 PNG 图表与交互式曲线…")
        import plotly.graph_objects as go

        n80_summary = {
            str(int(temp)): results_by_temp[temp]["avg_n80"] for temp in [25.0, 45.0]
        }

        # Plotly interactive viewer
        fig = go.Figure()
        temps = [25.0, 45.0]
        grid = results_by_temp[temps[0]]["grid_cycles"]

        # Build traces with visibility toggles
        for temp_i, temp in enumerate(temps):
            temp_list = cleaned[temp]
            # average actual points: use scatter of all samples pooled
            for _sid, cycles, caps in temp_list:
                fig.add_trace(
                    go.Scatter(
                        x=cycles.tolist(),
                        y=caps.tolist(),
                        mode="markers",
                        name=f"{int(temp)}℃ 实测",
                        legendgroup=f"t{int(temp)}",
                        visible=(temp_i == 0),
                        marker={"size": 4, "opacity": 0.45},
                    )
                )
            fig.add_trace(
                go.Scatter(
                    x=grid,
                    y=results_by_temp[temp]["avg_pred_capacity"],
                    mode="lines",
                    name=f"{int(temp)}℃ 拟合预测",
                    legendgroup=f"t{int(temp)}",
                    visible=(temp_i == 0),
                    line={"width": 4},
                )
            )

        # dropdown: simply set visibility by temperature
        # We need to know trace index ranges; easiest: recompute per temp
        vis_matrix: List[List[bool]] = []
        trace_total = len(fig.data)
        traces_by_temp: Dict[int, List[int]] = {25: [], 45: []}
        for idx, tr in enumerate(fig.data):
            name = tr.name or ""
            if "25℃" in name:
                traces_by_temp[25].append(idx)
            elif "45℃" in name:
                traces_by_temp[45].append(idx)

        for temp in [25, 45]:
            vis = [False] * trace_total
            for idx in traces_by_temp[temp]:
                vis[idx] = True
            vis_matrix.append(vis)

        steps = []
        for i, temp in enumerate([25, 45]):
            steps.append(
                {
                    "method": "update",
                    "label": f"{temp}℃",
                    "args": [{"visible": vis_matrix[i]}],
                }
            )

        fig.update_layout(
            title="电池寿命预测 · 交互式衰减曲线",
            xaxis_title="Cycle",
            yaxis_title="Capacity",
            updatemenus=[
                {
                    "buttons": steps,
                    "direction": "down",
                    "x": 1.02,
                    "y": 1.15,
                }
            ],
            template="plotly_white",
            legend={"orientation": "h"},
            height=520,
        )

        viewer_path = os.path.join(charts_dir, "prediction_viewer.html")
        fig.write_html(viewer_path, include_plotlyjs="cdn")

        # Generate report.md
        report_lines: List[str] = []
        report_lines.append("# 模型A：电池寿命预测报告\n")
        report_lines.append("## 数据说明\n")
        report_lines.append(f"- 输入文件：{os.path.basename(input_path)}\n")
        report_lines.append("- 温度：25℃ / 45℃\n")

        for temp in [25.0, 45.0]:
            n_samples = len(cleaned[temp])
            report_lines.append(f"## {int(temp)}℃ 结果\n")
            report_lines.append(f"- 有效样本数：{n_samples}\n")
            report_lines.append(f"- 拟合参数：c_inf={results_by_temp[temp]['c_inf']:.6g}，k={results_by_temp[temp]['k']:.6g}\n")
            report_lines.append(f"- 拟合 RMSE：{results_by_temp[temp]['rmse']}\n")
            report_lines.append("### N80（预测）\n")
            report_lines.append(f"- 平均 N80：{results_by_temp[temp]['avg_n80']}\n")
            report_lines.append("- 每个样本 N80：\n")
            report_lines.append("```json\n" + json.dumps(results_by_temp[temp]["per_sample_n80"], ensure_ascii=False, indent=2) + "\n```\n")

        report_lines.append("## 交互式曲线\n")
        report_lines.append("- charts/prediction_viewer.html\n")

        report_md = "\n".join(report_lines).strip() + "\n"
        report_path = os.path.join(output_root, "report.md")
        with open(report_path, "w", encoding="utf-8") as f:
            f.write(report_md)

        # result.json and model_parameters.csv
        result_n80 = {
            "25℃": {
                "avg": results_by_temp[25.0]["avg_n80"],
                "per_sample": results_by_temp[25.0]["per_sample_n80"],
            },
            "45℃": {
                "avg": results_by_temp[45.0]["avg_n80"],
                "per_sample": results_by_temp[45.0]["per_sample_n80"],
            },
        }

        model_parameters_rows: List[List[Any]] = []
        for temp in [25.0, 45.0]:
            model_parameters_rows.append(
                [
                    int(temp),
                    results_by_temp[temp]["c_inf"],
                    results_by_temp[temp]["k"],
                    results_by_temp[temp]["rmse"],
                ]
            )

        model_csv_path = os.path.join(files_dir, "model_parameters.csv")
        with open(model_csv_path, "w", encoding="utf-8") as f:
            f.write("temperature,c_inf,k,rmse\n")
            for row in model_parameters_rows:
                f.write(",".join("" if v is None else str(v) for v in row) + "\n")

        # Write result.json
        summary = "已生成 25℃ / 45℃ 容量衰减曲线，并预测各样本 N80 指标。"
        result_json: Dict[str, Any] = {
            "summary": summary,
            "n80": result_n80,
            "model_parameters": {
                "25℃": {"c_inf": results_by_temp[25.0]["c_inf"], "k": results_by_temp[25.0]["k"], "rmse": results_by_temp[25.0]["rmse"]},
                "45℃": {"c_inf": results_by_temp[45.0]["c_inf"], "k": results_by_temp[45.0]["k"], "rmse": results_by_temp[45.0]["rmse"]},
            },
            "threshold_ratio": 0.8,
        }

        result_path = os.path.join(output_root, "result.json")
        with open(result_path, "w", encoding="utf-8") as f:
            json.dump(result_json, f, ensure_ascii=False, indent=2)

    except Exception as e:
        msg = str(e)
        err_path = None
        try:
            err_path = os.path.join(str(args.output).strip(), "error.json")
            ensure_dir(str(args.output).strip())
            with open(err_path, "w", encoding="utf-8") as f:
                json.dump({"error": msg}, f, ensure_ascii=False, indent=2)
        except Exception:
            pass
        print(msg, file=sys.stderr, flush=True)
        sys.exit(1)


if __name__ == "__main__":
    main()

