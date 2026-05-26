"""
Data type classifier for template-driven plotting.

Flow:
1) Try explicit hint from request
2) Try LLM classification (optional)
3) Fallback to rule-based classification
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from typing import Any, Dict, Optional

import pandas as pd
from openai import OpenAI

from app.services import unified_llm

logger = logging.getLogger(__name__)


SUPPORTED_DATA_TYPES = {
    "raman_spectrum",
    "pl_spectrum",
    "mass_spectrum",
    "uv_vis_spectrum",
    "ftir_spectrum",
    "xrd_pattern",
    "volcano_analysis",
    "time_series",
    "categorical_comparison",
    "distribution",
    "correlation_matrix",
    "generic_tabular",
    # Extended types matching new plotters
    "ohlc_data",
    "vector_field_data",
    "directional_data",
    "edge_list_data",
    "high_dimensional_data",
    "three_dimensional_data",
}


@dataclass
class DataTypeResult:
    data_type: str
    confidence: float
    reason: str
    source: str


class DataTypeClassifier:
    def __init__(self, llm_client: Any = None):
        self.llm_client = llm_client

    def classify(
        self,
        *,
        df: pd.DataFrame,
        analysis: Dict[str, Any],
        data_type_hint: Optional[str] = None,
        use_llm: bool = True,
    ) -> DataTypeResult:
        normalized_hint = self._normalize_data_type(data_type_hint)
        if normalized_hint:
            return DataTypeResult(
                data_type=normalized_hint,
                confidence=1.0,
                reason="Using user-provided data_type hint",
                source="hint",
            )

        if use_llm:
            llm_result = self._classify_with_llm(df=df, analysis=analysis)
            if llm_result is not None:
                return llm_result

        return self._classify_with_rules(df=df, analysis=analysis)

    def _classify_with_llm(self, *, df: pd.DataFrame, analysis: Dict[str, Any]) -> Optional[DataTypeResult]:
        try:
            client = self.llm_client or self._build_client()
            if client is None:
                return None

            messages = [
                {
                    "role": "system",
                    "content": (
                        "You are a scientific data-type classifier for plotting. "
                        "Return strict JSON with keys: data_type, confidence, reason. "
                        "Allowed data_type values: "
                        + ", ".join(sorted(SUPPORTED_DATA_TYPES))
                        + "."
                    ),
                },
                {
                    "role": "user",
                    "content": self._build_llm_prompt(df=df, analysis=analysis),
                },
            ]

            resp = client.chat.completions.create(
                model=unified_llm.get_model(),
                messages=messages,
                temperature=0.1,
                max_tokens=300,
            )
            content = (resp.choices[0].message.content or "").strip()
            parsed = self._safe_json_load(content)
            if not parsed:
                return None

            data_type = self._normalize_data_type(parsed.get("data_type"))
            if not data_type:
                return None

            confidence = self._safe_float(parsed.get("confidence"), default=0.6)
            reason = str(parsed.get("reason") or "Classified by LLM")
            return DataTypeResult(
                data_type=data_type,
                confidence=max(0.0, min(confidence, 1.0)),
                reason=reason,
                source="llm",
            )
        except Exception as exc:
            logger.info("LLM data type classification failed, fallback to rules: %s", exc)
            return None

    def _classify_with_rules(self, *, df: pd.DataFrame, analysis: Dict[str, Any]) -> DataTypeResult:
        columns = [str(c).lower() for c in df.columns]
        characteristics = set(analysis.get("data_characteristics", []))
        numeric_cols = analysis.get("numeric_columns", [])

        text = " ".join(columns)
        if "differential_expression_data" in characteristics:
            return DataTypeResult("volcano_analysis", 0.95, "Detected fold-change and p-value columns", "rules")
        if self._columns_suggest_mass_spectrum(columns) and len(numeric_cols) >= 2:
            return DataTypeResult("mass_spectrum", 0.8, "Columns indicate m/z (mass-to-charge) axis", "rules")
        if any(k in text for k in ["raman", "wavenumber", "cm-1", "cm^-1", "shift"]) and len(numeric_cols) >= 2:
            return DataTypeResult("raman_spectrum", 0.82, "Columns indicate Raman shift and intensity", "rules")
        if any(k in text for k in ["photoluminescence", "pl", "emission", "wavelength"]) and len(numeric_cols) >= 2:
            return DataTypeResult("pl_spectrum", 0.75, "Columns indicate PL wavelength-intensity data", "rules")
        if any(k in text for k in ["absorbance", "transmittance", "uv", "vis"]) and len(numeric_cols) >= 2:
            return DataTypeResult("uv_vis_spectrum", 0.72, "Columns indicate UV-Vis spectral data", "rules")
        if any(k in text for k in ["ftir", "infrared"]) and len(numeric_cols) >= 2:
            return DataTypeResult("ftir_spectrum", 0.72, "Columns indicate FTIR spectrum", "rules")
        if any(k in text for k in ["2theta", "2-theta", "theta", "xrd"]) and len(numeric_cols) >= 2:
            return DataTypeResult("xrd_pattern", 0.74, "Columns indicate XRD pattern", "rules")
        # OHLC / candlestick
        ohlc_kws = {"open", "high", "low", "close", "ohlc", "candlestick"}
        if len(ohlc_kws.intersection(set(columns))) >= 3 and len(numeric_cols) >= 4:
            return DataTypeResult("ohlc_data", 0.92, "Detected OHLC columns (Open/High/Low/Close)", "rules")
        # Vector / flow field
        if any(k in text for k in ["velocity", "u_vel", "v_vel", "u_wind", "v_wind", "ux", "uy", "vx", "vy"]) and len(numeric_cols) >= 4:
            return DataTypeResult("vector_field_data", 0.8, "Detected velocity/vector field columns", "rules")
        # Directional / angular data
        if any(k in text for k in ["direction", "angle", "bearing", "azimuth", "heading", "theta", "phi"]) and len(numeric_cols) >= 2:
            return DataTypeResult("directional_data", 0.78, "Detected directional/angular columns", "rules")
        # Edge list (network graph)
        if any(k in text for k in ["source", "target", "from", "to", "src", "dst", "node1", "node2"]):
            return DataTypeResult("edge_list_data", 0.82, "Detected source-target (edge list) columns", "rules")
        # High-dimensional
        if len(numeric_cols) >= 5 and len(df.columns) >= 5:
            return DataTypeResult("high_dimensional_data", 0.6, "Many numeric columns → high-dimensional", "rules")
        # 3D numeric data
        if len(numeric_cols) >= 3:
            return DataTypeResult("three_dimensional_data", 0.55, "Three or more numeric columns detected", "rules")
        # Standard types
        if "has_time_series" in characteristics:
            return DataTypeResult("time_series", 0.7, "Detected time-like columns", "rules")
        if "has_categorical_data" in characteristics and len(numeric_cols) >= 1:
            return DataTypeResult("categorical_comparison", 0.65, "Categorical + numeric structure", "rules")
        if "single_numeric_column" in characteristics:
            return DataTypeResult("distribution", 0.62, "Single numeric distribution", "rules")
        if "square_matrix" in characteristics and len(numeric_cols) >= 2:
            return DataTypeResult("correlation_matrix", 0.68, "Square numeric matrix structure", "rules")
        if "spectral_data" in characteristics:
            return DataTypeResult("pl_spectrum", 0.6, "Generic spectral structure detected", "rules")
        return DataTypeResult("generic_tabular", 0.5, "Fallback generic tabular classification", "rules")

    @staticmethod
    def _columns_suggest_mass_spectrum(columns: list[str]) -> bool:
        """Require explicit m/z-style column names; 'intensity' alone must not imply MS."""
        for raw in columns:
            n = raw.lower().strip().replace(" ", "")
            if "m/z" in raw.lower() or "m/z" in n:
                return True
            if "mass_to_charge" in n or "masstocharge" in n:
                return True
            if n in {"mz", "mass", "masscharge", "mass_charge"}:
                return True
            if n.endswith("_mz") or n.startswith("mz_"):
                return True
        return False

    @staticmethod
    def _build_client() -> Optional[OpenAI]:
        if not unified_llm.is_llm_configured():
            return None
        try:
            return unified_llm.get_openai_client()
        except RuntimeError:
            return None

    @staticmethod
    def _build_llm_prompt(*, df: pd.DataFrame, analysis: Dict[str, Any]) -> str:
        sample_rows = []
        preview_df = df.head(5)
        for _, row in preview_df.iterrows():
            sample_rows.append({k: (None if pd.isna(v) else v) for k, v in row.to_dict().items()})

        payload = {
            "columns": list(df.columns),
            "n_rows": int(len(df)),
            "numeric_columns": analysis.get("numeric_columns", []),
            "categorical_columns": analysis.get("categorical_columns", []),
            "data_characteristics": analysis.get("data_characteristics", []),
            "sample_rows": sample_rows,
        }
        return json.dumps(payload, ensure_ascii=False)

    @staticmethod
    def _safe_json_load(content: str) -> Optional[Dict[str, Any]]:
        try:
            return json.loads(content)
        except Exception:
            if content.startswith("```"):
                stripped = content.strip().strip("`")
                first_brace = stripped.find("{")
                last_brace = stripped.rfind("}")
                if first_brace >= 0 and last_brace > first_brace:
                    try:
                        return json.loads(stripped[first_brace : last_brace + 1])
                    except Exception:
                        return None
            return None

    @staticmethod
    def _normalize_data_type(value: Any) -> Optional[str]:
        if not value:
            return None
        normalized = str(value).strip().lower().replace("-", "_").replace(" ", "_")
        aliases = {
            "raman": "raman_spectrum",
            "pl": "pl_spectrum",
            "photoluminescence": "pl_spectrum",
            "mass": "mass_spectrum",
            "ms": "mass_spectrum",
            "uvvis": "uv_vis_spectrum",
            "uv_vis": "uv_vis_spectrum",
            "ftir": "ftir_spectrum",
            "xrd": "xrd_pattern",
            "volcano": "volcano_analysis",
            # Extended aliases
            "ohlc": "ohlc_data",
            "candlestick": "ohlc_data",
            "financial": "ohlc_data",
            "vector_field": "vector_field_data",
            "flow": "vector_field_data",
            "directional": "directional_data",
            "angular": "directional_data",
            "wind": "directional_data",
            "network": "edge_list_data",
            "graph": "edge_list_data",
            "edge_list": "edge_list_data",
            "high_dimensional": "high_dimensional_data",
            "multivariate": "high_dimensional_data",
            "3d": "three_dimensional_data",
            "3d_data": "three_dimensional_data",
            "surface": "three_dimensional_data",
        }
        normalized = aliases.get(normalized, normalized)
        return normalized if normalized in SUPPORTED_DATA_TYPES else None

    @staticmethod
    def _safe_float(value: Any, default: float) -> float:
        try:
            return float(value)
        except Exception:
            return default
