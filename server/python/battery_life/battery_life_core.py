from __future__ import annotations

import json
import math
from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

import numpy as np


def aggressive_clean(
    cycles: Sequence[float],
    capacities: Sequence[float],
) -> Tuple[np.ndarray, np.ndarray, Dict[str, Any]]:
    """
    清洗异常点（简化版）。

    - 去掉 NaN / 非数值
    - 按 cycle 排序
    - 基于容量分布 IQR 做 3 倍范围截断（去掉极端离群点）
    - 去掉容量 <= 0 的点
    """
    c = np.asarray(cycles, dtype=float)
    y = np.asarray(capacities, dtype=float)
    mask = np.isfinite(c) & np.isfinite(y)
    c = c[mask]
    y = y[mask]
    if c.size == 0:
        return c, y, {"removed": 0, "reason": "empty"}

    order = np.argsort(c)
    c = c[order]
    y = y[order]

    removed = int(len(mask) - mask.sum())
    mask2 = y > 0
    c = c[mask2]
    y = y[mask2]
    removed += int(mask2.size - mask2.sum())

    if y.size < 5:
        return c, y, {"removed": removed, "reason": "too_few_points"}

    q1 = float(np.quantile(y, 0.25))
    q3 = float(np.quantile(y, 0.75))
    iqr = q3 - q1
    if iqr <= 0:
        return c, y, {"removed": removed, "reason": "zero_iqr"}

    lo = q1 - 3.0 * iqr
    hi = q3 + 3.0 * iqr
    mask3 = (y >= lo) & (y <= hi)
    c = c[mask3]
    y = y[mask3]
    removed += int(mask3.size - mask3.sum())
    return c, y, {"removed": removed, "reason": "iqr_filtered"}


def calculate_n80(
    cycles: Sequence[float],
    capacities: Sequence[float],
    threshold_ratio: float = 0.8,
) -> Optional[float]:
    """
    计算 N80：容量衰减至 (threshold_ratio * c0) 之时对应的 cycle。
    这里取 c0 为观测容量的最大值（通常对应初始容量/最大容量）。
    """
    c = np.asarray(cycles, dtype=float)
    y = np.asarray(capacities, dtype=float)
    mask = np.isfinite(c) & np.isfinite(y)
    c = c[mask]
    y = y[mask]
    if c.size == 0:
        return None
    order = np.argsort(c)
    c = c[order]
    y = y[order]

    c0 = float(np.max(y))
    if c0 <= 0:
        return None

    target = threshold_ratio * c0
    # 找到第一次跌破阈值的位置
    idx = np.where(y <= target)[0]
    if idx.size == 0:
        return None
    first = int(idx[0])
    return float(c[first])


def load_all_sample_curves(
    input_path: str,
    ext: str,
) -> Dict[float, Dict[str, Tuple[np.ndarray, np.ndarray]]]:
    """
    读取输入并加载样本曲线。

    返回结构：
      { temperature: { sample_id: (cycles, capacities) } }
    """
    import pandas as pd  # lazy import for speed

    ext_norm = ext.lower().lstrip(".")
    if ext_norm == "csv":
        df = pd.read_csv(input_path)
        cols = {str(c).strip().lower(): c for c in df.columns}
        required = ["temperature", "cycle", "sample_id", "capacity"]
        missing = [r for r in required if r not in cols]
        if missing:
            raise ValueError("CSV 缺少 temperature/cycle/sample_id/capacity 四列")

        temp_col = cols["temperature"]
        cyc_col = cols["cycle"]
        sid_col = cols["sample_id"]
        cap_col = cols["capacity"]

        df = df[[temp_col, cyc_col, sid_col, cap_col]].copy()
        df.columns = ["temperature", "cycle", "sample_id", "capacity"]

        # Normalize sample id
        df["sample_id"] = df["sample_id"].astype(str).str.strip()
        bad_ids = df["sample_id"].unique().tolist()
        # Validate ids with requirement pattern E0039 / E0040...
        import re
        ok_re = re.compile(r"^E\d{4}$", re.IGNORECASE)
        invalid = [x for x in bad_ids if not ok_re.match(x)]
        if invalid:
            raise ValueError("样本 ID 无法匹配 E0039 等格式")

        out: Dict[float, Dict[str, Tuple[np.ndarray, np.ndarray]]] = {}
        for (temp, sid), g in df.groupby(["temperature", "sample_id"]):
            temp_f = float(temp)
            cycles = g["cycle"].astype(float).to_numpy()
            caps = g["capacity"].astype(float).to_numpy()
            out.setdefault(temp_f, {})[sid] = (cycles, caps)
        return out

    if ext_norm in ("xlsx", "xls"):
        # Excel: 两个 sheet，第一列 Cycle，其余列为样本容量（E0039...）
        import pandas as pd  # noqa: F811

        book = pd.ExcelFile(input_path)
        sheet_names = list(book.sheet_names)

        def norm_sheet(s: str) -> str:
            t = str(s).strip().replace("℃", "C").replace("°C", "C").replace("°c", "C")
            t = t.replace(" ", "")
            return t

        wanted = {"25": "25℃", "45": "45℃"}
        sheet_norm_map = {norm_sheet(s): s for s in sheet_names}

        # strict-ish: accept any sheet that normalizes to 25C / 45C
        sheet25 = sheet_norm_map.get("25C") or sheet_norm_map.get("25")
        sheet45 = sheet_norm_map.get("45C") or sheet_norm_map.get("45")
        if not sheet25 or not sheet45:
            raise ValueError("Excel 缺少 25℃ / 45℃ sheet")

        out: Dict[float, Dict[str, Tuple[np.ndarray, np.ndarray]]] = {}
        for target_sheet, temp_value in [(sheet25, 25.0), (sheet45, 45.0)]:
            df = pd.read_excel(input_path, sheet_name=target_sheet, header=0)
            if df.shape[1] < 2:
                raise ValueError("Excel sheet 数据列数不足")

            cycle_col = df.columns[0]
            # sample columns
            sample_cols = [str(c).strip() for c in df.columns[1:]]
            import re
            ok_re = re.compile(r"^E\d{4}$", re.IGNORECASE)
            invalid = [x for x in sample_cols if not ok_re.match(x)]
            if invalid:
                raise ValueError("样本 ID 无法匹配 E0039 等格式")

            temp_map = out.setdefault(temp_value, {})
            for sid, col in zip(sample_cols, df.columns[1:]):
                cycles = df[cycle_col].astype(float).to_numpy()
                caps = df[col].astype(float).to_numpy()
                temp_map[sid] = (cycles, caps)

        return out

    raise ValueError(f"文件格式不支持：.{ext}")


@dataclass
class DegradationModel:
    c_inf: float
    k: float

    def capacity(self, cycle: np.ndarray, c0: float) -> np.ndarray:
        cycle = np.asarray(cycle, dtype=float)
        # C(t) = c_inf + (c0 - c_inf) * exp(-k * t)
        return self.c_inf + (c0 - self.c_inf) * np.exp(-self.k * cycle)


def optimization_objective(
    params: Sequence[float],
    samples: Sequence[Tuple[str, np.ndarray, np.ndarray]],
) -> float:
    """
    SSE: Σ || C_obs - C_pred ||^2
    params = [c_inf, k]
    c0 is per-sample (use max capacity of that sample).
    """
    c_inf = float(params[0])
    k = float(params[1])
    model = DegradationModel(c_inf=c_inf, k=k)

    sse = 0.0
    for _sid, cycles, caps in samples:
        if cycles.size == 0:
            continue
        c0 = float(np.max(caps))
        pred = model.capacity(cycles, c0)
        resid = caps - pred
        sse += float(np.sum(resid * resid))
    return sse


def fit_global_model_for_prediction(
    samples: Sequence[Tuple[str, np.ndarray, np.ndarray]],
) -> Dict[str, Any]:
    """
    拟合全局衰减模型参数（c_inf, k）。
    """
    from scipy.optimize import minimize

    # Initial guess
    all_caps = []
    all_cycles = []
    for _sid, cycles, caps in samples:
        if cycles.size == 0:
            continue
        all_caps.append(float(np.max(caps)))
        all_cycles.append(float(np.max(cycles)))
    if not all_caps:
        raise ValueError("没有可用于拟合的样本数据")

    c0_max = max(all_caps)
    c_inf0 = max(1.0, min(all_caps) * 0.5)
    k0 = 1.0 / (max(all_cycles) + 1.0)

    bounds = [
        (0.0, c0_max * 2.0),   # c_inf
        (1e-8, 1.0),          # k
    ]

    def obj(x: np.ndarray) -> float:
        return optimization_objective(x, samples)

    res = minimize(
        obj,
        x0=np.array([c_inf0, k0], dtype=float),
        method="L-BFGS-B",
        bounds=bounds,
        options={"maxiter": 300},
    )

    c_inf = float(res.x[0])
    k = float(res.x[1])
    model = DegradationModel(c_inf=c_inf, k=k)

    # RMSE on all points
    sq = 0.0
    n = 0
    for _sid, cycles, caps in samples:
        if cycles.size == 0:
            continue
        c0 = float(np.max(caps))
        pred = model.capacity(cycles, c0)
        resid = caps - pred
        sq += float(np.sum(resid * resid))
        n += int(cycles.size)
    rmse = math.sqrt(sq / n) if n > 0 else None

    return {"model": model, "c_inf": c_inf, "k": k, "rmse": rmse, "opt_result": {"success": bool(res.success)}}


def predict_with_extra(
    model: DegradationModel,
    cycles: np.ndarray,
    c0: float,
) -> Dict[str, Any]:
    """
    预测曲线与 N80（给定样本初始容量 c0）。
    """
    cycles = np.asarray(cycles, dtype=float)
    pred = model.capacity(cycles, c0)
    n80 = None
    c0_thr = 0.8 * c0
    # solve using analytic threshold
    denom = (c0 - model.c_inf)
    if denom != 0 and c0 > 0:
        r = (c0_thr - model.c_inf) / denom
        if r > 0 and r < 1:
            n80 = -math.log(r) / model.k
    return {"pred_capacity": pred, "n80": n80}

