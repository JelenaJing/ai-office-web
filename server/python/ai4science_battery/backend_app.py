import os
import re
import math
from functools import lru_cache
from typing import Any, Dict, List, Literal, Optional

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from scipy.optimize import least_squares
from scipy.interpolate import interp1d


INPUT_FILE = os.environ.get("CYCLE_LIFE_XLSX", "cycle_life.xlsx")
SHEET_NAMES = {"25C": "25℃", "45C": "45℃"}
ENABLE_FEC_INPUT = True
FEC_FIXED_DEFAULT = 0.5

R = 8.314462618
T_REF = 298.15

FORMULATION_DATA = {
    "ID": ["E0039", "E0040", "E0041", "E0042", "E0043", "E0044", "E0045"],
    "PF6": [0.5, 0.5, 0.5, 0.2, 0.5, 0.5, 0.5],
    "FSI": [0.5, 0.5, 0.5, 0.8, 0.5, 0.5, 0.5],
    "VC": [2.5, 4.0, 4.5, 2.5, 2.5, 2.5, 2.5],
    "MMDS": [0.3, 0.3, 0.3, 0.3, 0.0, 0.5, 0.0],
    "TMSP": [0.0, 0.0, 0.0, 0.0, 0.3, 0.0, 0.0],
    "DDSI": [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.5],
}

EXTRA_ADDITIVES: Dict[str, Dict[str, float]] = {
    "None": {},
    "PS (1,3-Propane Sultone)": {"ksei": -2.8, "kox": 0.5, "nk": 2.5, "sigma": -1.5, "Lknee": 1.0},
    "DTD (Ethylene Sulfate)": {"ksei": -3.0, "kox": -0.2, "nk": 2.8, "sigma": -2.0, "Lknee": 0.5},
    "LiBOB": {"ksei": -1.5, "kox": -1.5, "nk": 3.2, "sigma": 0.5, "Lknee": 2.5},
    "LiDFOB": {"ksei": -2.9, "kox": -1.0, "nk": 3.0, "sigma": -1.0, "Lknee": 1.2},
    "SN (Succinitrile)": {"ksei": -0.5, "kox": -2.5, "nk": 1.5, "sigma": -0.5, "Lknee": 0.0},
    "ADN (Adiponitrile)": {"ksei": -0.6, "kox": -2.6, "nk": 1.6, "sigma": -0.5, "Lknee": 0.0},
    "LiPO2F2": {"ksei": -2.5, "kox": 0.0, "nk": 2.2, "sigma": -2.5, "Lknee": 0.8},
    "PST (Prop-1-ene-1,3-sultone)": {"ksei": -3.2, "kox": 0.8, "nk": 3.1, "sigma": -1.8, "Lknee": 1.5},
    "VEC (Vinyl Ethylene Carbonate)": {"ksei": -2.6, "kox": 0.3, "nk": 2.7, "sigma": 1.5, "Lknee": 1.8},
    "TMSB (Tris(trimethylsilyl) borate)": {"ksei": -1.2, "kox": -1.8, "nk": 1.9, "sigma": -0.8, "Lknee": 0.5},
}


def arrhenius_factor(TK: float, E: float) -> float:
    return float(np.exp((-E / R) * (1.0 / TK - 1.0 / T_REF)))


def aggressive_clean(
    series: pd.Series, window: int = 5, spike_threshold: float = 0.10, early_keep_cycles: int = 80
) -> pd.Series:
    s = series.copy()
    s[s < 0.1] = np.nan
    if s.dropna().empty:
        return pd.Series(dtype=float)

    last_valid = s.last_valid_index()
    s = s.loc[:last_valid]

    med = s.rolling(window=window, center=True, min_periods=1).median()
    dev = np.abs(s - med) / np.maximum(np.abs(med), 1e-12)
    is_spike = dev > spike_threshold
    idx = s.index.values.astype(float)
    is_spike &= idx > early_keep_cycles
    s[is_spike] = np.nan
    return s.dropna()


def calculate_n80(cycle, capacity, threshold=0.8) -> float:
    df_temp = pd.DataFrame({"Cycle": cycle, "Cap": capacity}).dropna()
    df_temp = df_temp[df_temp["Cap"] > 0.1]
    if df_temp.empty:
        return float("nan")

    x = df_temp["Cycle"].values.astype(float)
    y = df_temp["Cap"].values.astype(float)
    if y.min() > threshold:
        return float(x.max())

    try:
        f = interp1d(y, x, kind="linear", fill_value="extrapolate", bounds_error=False)
        n80 = float(f(threshold))
        return n80 if n80 > 0 else 0.0
    except Exception:
        return 0.0


def load_all_sample_curves(file_path: str):
    if not os.path.exists(file_path):
        return {"curves": None, "n80s": None}

    fdf = pd.DataFrame(FORMULATION_DATA)
    ids = set(fdf["ID"].values)

    curves: Dict[str, Dict[str, Dict[str, pd.Series]]] = {"25C": {}, "45C": {}}
    n80s: Dict[str, Dict[str, float]] = {"25C": {}, "45C": {}}

    clean_kwargs = dict(window=5, spike_threshold=0.10, early_keep_cycles=80)

    xl = pd.ExcelFile(file_path)
    for temp_key, sheet_name in SHEET_NAMES.items():
        df = pd.read_excel(xl, sheet_name=sheet_name)
        df = df.rename(columns={df.columns[0]: "Cycle"}).set_index("Cycle")
        df.index = pd.to_numeric(df.index, errors="coerce")
        df = df[~df.index.isna()]
        df.index = df.index.astype(int)

        for col in df.columns:
            m = re.match(r"(E\d+)", str(col))
            if not m:
                continue
            fid = m.group(1)
            if fid not in ids:
                continue

            ser = aggressive_clean(df[col], **clean_kwargs)
            if ser.empty:
                continue

            curves[temp_key].setdefault(fid, {})[str(col)] = ser
            n80s[temp_key][str(col)] = calculate_n80(ser.index.values, ser.values, threshold=0.8)

    return {"curves": curves, "n80s": n80s}


def get_representative_curve(samples_dict):
    if not samples_dict:
        return None
    lengths = {k: len(v) for k, v in samples_dict.items()}
    mx = max(lengths.values())
    top = [k for k, L in lengths.items() if L == mx]
    if len(top) == 1:
        return samples_dict[top[0]]
    aligned = pd.concat([samples_dict[k].rename(k) for k in top], axis=1)
    return aligned.mean(axis=1, skipna=True).dropna()


class DegradationModel:
    def __init__(self):
        self.comps = ["PF6", "FSI", "VC", "FEC", "MMDS", "TMSP", "DDSI"]
        self.dep_vars = ["ksei", "kox", "nk", "sigma", "Lknee"]

        self.pnames: List[str] = []
        self.pnames += ["A_act0", "E_act", "tau_rise", "tau_decay"]
        for var in self.dep_vars:
            self.pnames.append(f"log_{var}0")
            self.pnames.append(f"E_{var}")
            for comp in self.comps:
                self.pnames.append(f"a_{comp}_{var}")

        self.idx_map = {name: i for i, name in enumerate(self.pnames)}

    def unpack(self, p: np.ndarray) -> dict:
        return {k: float(v) for k, v in zip(self.pnames, p)}

    def _get_dep_val(self, var_name: str, TK: float, x: dict, par: dict) -> float:
        log_y0 = par[f"log_{var_name}0"]
        E = par[f"E_{var_name}"]

        exponent = 0.0
        for comp in self.comps:
            val = x.get(comp, 0.0)
            a = par[f"a_{comp}_{var_name}"]
            exponent += a * val

        log_arr = (-E / R) * (1.0 / TK - 1.0 / T_REF)
        total_log = log_y0 + log_arr + exponent
        total_log = np.clip(total_log, -20, 20)
        return float(np.exp(total_log))

    def predict_q_custom(self, n: np.ndarray, T_C: float, x: dict, p: np.ndarray) -> np.ndarray:
        TK = T_C + 273.15
        par = self.unpack(p)
        n = np.asarray(n, dtype=float)

        A_act = par["A_act0"] * arrhenius_factor(TK, par["E_act"])
        tau_rise = max(1e-3, par["tau_rise"])
        tau_decay = max(1e-3, par["tau_decay"])
        u_act = A_act * (1.0 - np.exp(-n / tau_rise)) * np.exp(-n / tau_decay)

        k_sei = self._get_dep_val("ksei", TK, x, par)
        k_ox = self._get_dep_val("kox", TK, x, par)
        nk = self._get_dep_val("nk", TK, x, par)
        sigma = self._get_dep_val("sigma", TK, x, par)
        L_knee = self._get_dep_val("Lknee", TK, x, par)

        sigma = max(1.0, sigma)
        n_pos = np.maximum(n, 0.0)

        loss_base = k_sei * np.sqrt(n_pos) + k_ox * n_pos
        z = (n_pos - nk) / sigma
        z = np.clip(z, -50, 50)
        sigmoid_current = L_knee / (1.0 + np.exp(-z))

        z_zero = nk / sigma
        z_zero = np.clip(z_zero, -50, 50)
        offset = L_knee / (1.0 + np.exp(z_zero))
        loss_knee = sigmoid_current - offset

        q = 1.0 + u_act - loss_base - loss_knee
        return q


def predict_with_extra(model_instance, n_arr, T_C, x_dict, p_arr, extra_name, extra_amount):
    if extra_name == "None" or extra_amount <= 1e-6:
        return model_instance.predict_q_custom(n_arr, T_C, x_dict, p_arr)
    coeffs = EXTRA_ADDITIVES.get(extra_name, {})
    if not coeffs:
        return model_instance.predict_q_custom(n_arr, T_C, x_dict, p_arr)

    TK = T_C + 273.15
    par = model_instance.unpack(p_arr)
    n = np.asarray(n_arr, dtype=float)

    A_act = par["A_act0"] * arrhenius_factor(TK, par["E_act"])
    tau_rise = max(1e-3, par["tau_rise"])
    tau_decay = max(1e-3, par["tau_decay"])
    u_act = A_act * (1.0 - np.exp(-n / tau_rise)) * np.exp(-n / tau_decay)

    vars_vals = {}
    for var_name in model_instance.dep_vars:
        log_y0 = par[f"log_{var_name}0"]
        E = par[f"E_{var_name}"]
        exponent = 0.0
        for comp in model_instance.comps:
            val = x_dict.get(comp, 0.0)
            a = par[f"a_{comp}_{var_name}"]
            exponent += a * val

        exponent += coeffs.get(var_name, 0.0) * extra_amount
        log_arr = (-E / R) * (1.0 / TK - 1.0 / T_REF)
        total_log = log_y0 + log_arr + exponent
        total_log = np.clip(total_log, -20, 20)
        vars_vals[var_name] = float(np.exp(total_log))

    k_sei = vars_vals["ksei"]
    k_ox = vars_vals["kox"]
    nk = vars_vals["nk"]
    sigma = max(1.0, vars_vals["sigma"])
    L_knee = vars_vals["Lknee"]

    n_pos = np.maximum(n, 0.0)
    loss_base = k_sei * np.sqrt(n_pos) + k_ox * n_pos
    z = (n_pos - nk) / sigma
    z = np.clip(z, -50, 50)
    sigmoid_current = L_knee / (1.0 + np.exp(-z))

    z_zero = nk / sigma
    z_zero = np.clip(z_zero, -50, 50)
    offset = L_knee / (1.0 + np.exp(z_zero))
    loss_knee = sigmoid_current - offset

    q = 1.0 + u_act - loss_base - loss_knee
    return q


def initial_guess_and_bounds(model: DegradationModel):
    x0_dict: Dict[str, float] = {}
    lb_dict: Dict[str, float] = {}
    ub_dict: Dict[str, float] = {}

    x0_dict["A_act0"] = 0.03
    lb_dict["A_act0"] = 0.0
    ub_dict["A_act0"] = 0.15

    x0_dict["E_act"] = 15000
    lb_dict["E_act"] = -1e5
    ub_dict["E_act"] = 1e5

    x0_dict["tau_rise"] = 20.0
    lb_dict["tau_rise"] = 1.0
    ub_dict["tau_rise"] = 100.0

    x0_dict["tau_decay"] = 200.0
    lb_dict["tau_decay"] = 10.0
    ub_dict["tau_decay"] = 2000.0

    base_logs = {
        "ksei": np.log(1e-3),
        "kox": np.log(5e-5),
        "nk": np.log(1000.0),
        "sigma": np.log(150.0),
        "Lknee": np.log(0.2),
    }

    default_component_bias: Dict[str, Dict[str, float]] = {
        "PF6": {"ksei": 0.35, "kox": 0.20, "nk": -0.10, "sigma": 0.00, "Lknee": 0.12},
        "FSI": {"ksei": -0.25, "kox": -0.10, "nk": 0.08, "sigma": 0.00, "Lknee": -0.08},
        "VC": {"ksei": -0.20, "kox": -0.08, "nk": 0.06, "sigma": 0.05, "Lknee": -0.06},
        "FEC": {"ksei": -0.28, "kox": -0.06, "nk": 0.10, "sigma": 0.04, "Lknee": -0.09},
        "MMDS": {"ksei": -0.10, "kox": -0.04, "nk": 0.04, "sigma": 0.02, "Lknee": -0.03},
        "TMSP": {"ksei": -0.08, "kox": -0.03, "nk": 0.03, "sigma": 0.02, "Lknee": -0.03},
        "DDSI": {"ksei": -0.12, "kox": -0.05, "nk": 0.05, "sigma": 0.03, "Lknee": -0.04},
    }

    for var in model.dep_vars:
        x0_dict[f"log_{var}0"] = float(base_logs[var])
        lb_dict[f"log_{var}0"] = float(base_logs[var] - 6.0)
        ub_dict[f"log_{var}0"] = float(base_logs[var] + 6.0)

        x0_dict[f"E_{var}"] = 30000.0
        lb_dict[f"E_{var}"] = -1e5
        ub_dict[f"E_{var}"] = 1e5

        for comp in model.comps:
            x0_dict[f"a_{comp}_{var}"] = float(default_component_bias.get(comp, {}).get(var, 0.0))
            lb_dict[f"a_{comp}_{var}"] = -3.0
            ub_dict[f"a_{comp}_{var}"] = 3.0

    x0 = np.array([x0_dict[k] for k in model.pnames])
    lb = np.array([lb_dict[k] for k in model.pnames])
    ub = np.array([ub_dict[k] for k in model.pnames])
    return x0, lb, ub


def _fit_global_model_for_prediction(file_path: str):
    pack = load_all_sample_curves(file_path)
    curves = pack["curves"]
    if curves is None:
        raise FileNotFoundError(file_path)

    fdf = pd.DataFrame(FORMULATION_DATA).set_index("ID")
    fdf_dict = fdf.to_dict("index")

    dataset = []
    for temp_key, T_C in [("25C", 25.0), ("45C", 45.0)]:
        for fid in curves[temp_key].keys():
            ser = get_representative_curve(curves[temp_key][fid])
            if ser is None or ser.empty:
                continue
            n = ser.index.values.astype(float)
            y = ser.values.astype(float)
            w_curve = 1.0 / math.sqrt(len(y))
            dataset.append((fid, T_C, n, y, w_curve))

    model = DegradationModel()
    if not dataset:
        return model, np.zeros(len(model.pnames), dtype=float), curves

    x0, lb, ub = initial_guess_and_bounds(model)

    def comp_of(fid: str):
        row = fdf_dict[fid]
        return dict(
            PF6=float(row["PF6"]),
            FSI=float(row["FSI"]),
            VC=float(row["VC"]),
            FEC=float(FEC_FIXED_DEFAULT),
            MMDS=float(row["MMDS"]),
            TMSP=float(row["TMSP"]),
            DDSI=float(row["DDSI"]),
        )

    def residuals(p):
        res_all = []
        for fid, T_C, n, y, w_curve in dataset:
            x = comp_of(fid)
            yhat = model.predict_q_custom(n, T_C, x, p)
            r = yhat - y
            nmax = max(1.0, float(np.max(n)))
            w_point = 1.0 + 3.0 * (n / nmax) ** 2
            res_all.append(r * (w_curve * w_point))
        return np.concatenate(res_all)

    out = least_squares(
        residuals,
        x0=x0,
        bounds=(lb, ub),
        method="trf",
        loss="huber",
        f_scale=0.01,
        max_nfev=5000,
        verbose=0,
    )
    return model, out.x, curves


@lru_cache(maxsize=4)
def get_model_pack(file_path: str, mtime: float):
    model, p_opt, curves = _fit_global_model_for_prediction(file_path)
    return model, p_opt, curves


def _get_model_pack():
    if not os.path.exists(INPUT_FILE):
        raise FileNotFoundError(INPUT_FILE)
    mtime = os.path.getmtime(INPUT_FILE)
    return get_model_pack(INPUT_FILE, mtime)


def _http_error_from_model_pack(exc: BaseException) -> HTTPException:
    if isinstance(exc, FileNotFoundError):
        return HTTPException(status_code=404, detail=f"未找到 `{INPUT_FILE}`，请放在 ai4science 目录下。")
    if isinstance(exc, ImportError) and "openpyxl" in str(exc).lower():
        return HTTPException(
            status_code=503,
            detail="读取 cycle_life.xlsx 需要 openpyxl。请在 ai4science 环境中执行：pip install openpyxl",
        )
    return HTTPException(status_code=500, detail=str(exc))


class LifeRawResponse(BaseModel):
    temperatures: List[Literal["25C", "45C"]]
    curves: Dict[str, Dict[str, List[Dict[str, Any]]]] = Field(
        ..., description="curves[tempKey][fid] = list of samples {name,x,y}"
    )


class PredictRequest(BaseModel):
    n_max: int = Field(1500, ge=10, le=10000)
    formulation: Dict[str, float] = Field(default_factory=dict)
    extra_additive_name: str = Field("None")
    extra_additive_amount: float = Field(0.0, ge=0.0)


class PredictResponse(BaseModel):
    n: List[float]
    q25: List[float]
    q45: List[float]
    n80_25: Optional[float]
    n80_45: Optional[float]


app = FastAPI(title="ai4science battery ui api")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/meta")
def meta():
    return {
        "input_file": INPUT_FILE,
        "available_components": ["PF6", "FSI", "VC", "FEC", "MMDS", "TMSP", "DDSI"],
        "extra_additives": list(EXTRA_ADDITIVES.keys()),
        "enable_fec_input": ENABLE_FEC_INPUT,
    }


@app.get("/api/life/raw", response_model=LifeRawResponse)
def life_raw():
    try:
        _, _, curves = _get_model_pack()
    except (FileNotFoundError, ImportError) as exc:
        raise _http_error_from_model_pack(exc) from exc

    out: Dict[str, Dict[str, List[Dict[str, Any]]]] = {"25C": {}, "45C": {}}
    for temp_key in ["25C", "45C"]:
        for fid, samples in curves.get(temp_key, {}).items():
            out[temp_key][fid] = []
            for sname, ser in samples.items():
                out[temp_key][fid].append(
                    {"name": sname, "x": ser.index.values.astype(float).tolist(), "y": ser.values.astype(float).tolist()}
                )

    return LifeRawResponse(temperatures=["25C", "45C"], curves=out)


@app.post("/api/life/predict", response_model=PredictResponse)
def life_predict(req: PredictRequest):
    try:
        model, p_opt, _ = _get_model_pack()
    except (FileNotFoundError, ImportError) as exc:
        raise _http_error_from_model_pack(exc) from exc

    n_max = int(req.n_max)
    n_grid = np.arange(0, n_max + 1, 1, dtype=float)

    x = {k: float(v) for k, v in (req.formulation or {}).items()}
    if "FEC" not in x:
        x["FEC"] = float(FEC_FIXED_DEFAULT)

    q25 = predict_with_extra(model, n_grid, 25.0, x, p_opt, req.extra_additive_name, req.extra_additive_amount)
    q45 = predict_with_extra(model, n_grid, 45.0, x, p_opt, req.extra_additive_name, req.extra_additive_amount)

    n80_25 = calculate_n80(n_grid, q25, threshold=0.8)
    n80_45 = calculate_n80(n_grid, q45, threshold=0.8)

    def _clean(v: float) -> Optional[float]:
        if v is None or (isinstance(v, float) and (math.isnan(v) or math.isinf(v))):
            return None
        return float(v)

    return PredictResponse(
        n=n_grid.tolist(),
        q25=q25.astype(float).tolist(),
        q45=q45.astype(float).tolist(),
        n80_25=_clean(float(n80_25)),
        n80_45=_clean(float(n80_45)),
    )

