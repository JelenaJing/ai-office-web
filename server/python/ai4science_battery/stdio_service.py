from __future__ import annotations

import json
import math
import os
import sys
import traceback
from typing import Any, Dict, Optional

import numpy as np

from backend_app import (
    DegradationModel,
    ENABLE_FEC_INPUT,
    EXTRA_ADDITIVES,
    FEC_FIXED_DEFAULT,
    INPUT_FILE,
    calculate_n80,
    initial_guess_and_bounds,
    predict_with_extra,
    _get_model_pack,
)


def _clean_float(v: Any) -> Optional[float]:
    try:
        f = float(v)
    except Exception:
        return None
    if math.isnan(f) or math.isinf(f):
        return None
    return f


def handle_meta(_: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "input_file": INPUT_FILE,
        "available_components": ["PF6", "FSI", "VC", "FEC", "MMDS", "TMSP", "DDSI"],
        "extra_additives": list(EXTRA_ADDITIVES.keys()),
        "enable_fec_input": ENABLE_FEC_INPUT,
    }


def handle_life_raw(_: Dict[str, Any]) -> Dict[str, Any]:
    try:
        _, _, curves = _get_model_pack()
    except FileNotFoundError:
        return {"temperatures": ["25C", "45C"], "curves": {"25C": {}, "45C": {}}}
    out: Dict[str, Dict[str, Any]] = {"25C": {}, "45C": {}}
    for temp_key in ["25C", "45C"]:
        for fid, samples in curves.get(temp_key, {}).items():
            out[temp_key][fid] = []
            for sname, ser in samples.items():
                out[temp_key][fid].append(
                    {
                        "name": sname,
                        "x": ser.index.values.astype(float).tolist(),
                        "y": ser.values.astype(float).tolist(),
                    }
                )
    return {"temperatures": ["25C", "45C"], "curves": out}


def handle_predict(payload: Dict[str, Any]) -> Dict[str, Any]:
    if os.getenv("AI4SCIENCE_ENABLE_GLOBAL_FIT", "0") == "1":
        try:
            model, p_opt, _ = _get_model_pack()
        except Exception:
            model = DegradationModel()
            p_opt, _, _ = initial_guess_and_bounds(model)
    else:
        # Keep UI interaction responsive by default; callers can opt into full
        # global fit by setting AI4SCIENCE_ENABLE_GLOBAL_FIT=1.
        model = DegradationModel()
        p_opt, _, _ = initial_guess_and_bounds(model)

    n_max = int(payload.get("n_max") or 1500)
    n_max = max(10, min(10000, n_max))
    n_grid = np.arange(0, n_max + 1, 1, dtype=float)

    formulation = payload.get("formulation") or {}
    x = {str(k): float(v) for k, v in formulation.items()}
    if "FEC" not in x:
        x["FEC"] = float(FEC_FIXED_DEFAULT)

    extra_name = str(payload.get("extra_additive_name") or "None")
    extra_amount = float(payload.get("extra_additive_amount") or 0.0)

    q25 = predict_with_extra(model, n_grid, 25.0, x, p_opt, extra_name, extra_amount)
    q45 = predict_with_extra(model, n_grid, 45.0, x, p_opt, extra_name, extra_amount)
    n80_25 = calculate_n80(n_grid, q25, threshold=0.8)
    n80_45 = calculate_n80(n_grid, q45, threshold=0.8)

    return {
        "n": n_grid.tolist(),
        "q25": q25.astype(float).tolist(),
        "q45": q45.astype(float).tolist(),
        "n80_25": _clean_float(n80_25),
        "n80_45": _clean_float(n80_45),
    }


def handle(req: Dict[str, Any]) -> Dict[str, Any]:
    action = str(req.get("action") or "")
    payload = req.get("payload") or {}
    if action == "meta":
        return handle_meta(payload)
    if action == "life_raw":
        return handle_life_raw(payload)
    if action == "predict":
        return handle_predict(payload)
    raise ValueError(f"unknown action: {action}")


def main() -> None:
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
            req_id = req.get("id")
            result = handle(req)
            print(json.dumps({"id": req_id, "ok": True, "result": result}, ensure_ascii=False), flush=True)
        except Exception as exc:
            print(
                json.dumps(
                    {
                        "id": (locals().get("req") or {}).get("id"),
                        "ok": False,
                        "error": str(exc),
                        "trace": traceback.format_exc(limit=6),
                    },
                    ensure_ascii=False,
                ),
                flush=True,
            )


if __name__ == "__main__":
    main()

