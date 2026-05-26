"""
Data feature analyzer for intelligent chart recommendation (ported from merged-plot-agent).
"""

from __future__ import annotations

import logging
from typing import Any, Dict

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


class DataAnalyzer:
    """Data feature analyzer class."""

    def analyze(self, df: pd.DataFrame) -> Dict[str, Any]:
        analysis: Dict[str, Any] = {
            "shape": df.shape,
            "n_rows": int(len(df)),
            "n_columns": int(len(df.columns)),
            "columns": list(df.columns),
            "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
            "numeric_columns": list(df.select_dtypes(include=[np.number]).columns),
            "categorical_columns": list(df.select_dtypes(include=["object", "category"]).columns),
            "datetime_columns": list(df.select_dtypes(include=["datetime64"]).columns),
            "missing_values": df.isnull().sum().to_dict(),
            "missing_percentage": (df.isnull().sum() / max(len(df), 1) * 100).to_dict(),
            "has_missing": bool(df.isnull().any().any()),
            "numeric_stats": {},
            "categorical_stats": {},
            "data_characteristics": [],
        }

        # Numeric stats
        if analysis["numeric_columns"]:
            numeric_df = df[analysis["numeric_columns"]]
            analysis["numeric_stats"] = {
                col: {
                    "mean": float(numeric_df[col].mean()),
                    "std": float(numeric_df[col].std()),
                    "min": float(numeric_df[col].min()),
                    "max": float(numeric_df[col].max()),
                    "median": float(numeric_df[col].median()),
                    "q25": float(numeric_df[col].quantile(0.25)),
                    "q75": float(numeric_df[col].quantile(0.75)),
                    "skewness": float(numeric_df[col].skew()),
                    "kurtosis": float(numeric_df[col].kurtosis()),
                    "unique_count": int(numeric_df[col].nunique()),
                    "zero_count": int((numeric_df[col] == 0).sum()),
                    "negative_count": int((numeric_df[col] < 0).sum()),
                    "positive_count": int((numeric_df[col] > 0).sum()),
                }
                for col in analysis["numeric_columns"]
            }

        # Categorical stats
        if analysis["categorical_columns"]:
            analysis["categorical_stats"] = {
                col: {
                    "unique_count": int(df[col].nunique()),
                    "most_frequent": str(df[col].mode().iloc[0]) if len(df[col].mode()) > 0 else None,
                    "value_counts": df[col].value_counts().head(10).to_dict(),
                }
                for col in analysis["categorical_columns"]
            }

        # Characteristics
        characteristics: list[str] = []

        if analysis["n_rows"] < 10:
            characteristics.append("small_dataset")
        elif analysis["n_rows"] < 100:
            characteristics.append("medium_dataset")
        else:
            characteristics.append("large_dataset")

        n_numeric = len(analysis["numeric_columns"])
        n_categorical = len(analysis["categorical_columns"])

        if n_numeric == 0:
            characteristics.append("no_numeric_data")
        elif n_numeric == 1:
            characteristics.append("single_numeric_column")
        elif n_numeric == 2:
            characteristics.append("two_numeric_columns")
        else:
            characteristics.append("multiple_numeric_columns")

        if n_categorical > 0:
            characteristics.append("has_categorical_data")

        if analysis["datetime_columns"]:
            characteristics.append("has_time_series")

        if n_numeric > 1 and analysis["n_rows"] == n_numeric:
            characteristics.append("square_matrix")

        # Differential expression heuristic
        if n_numeric >= 2:
            fc_cols = [
                col
                for col in analysis["numeric_columns"]
                if any(term in col.lower() for term in ["foldchange", "fold_change", "log2fc", "logfc", "fc"])
            ]
            pval_cols = [
                col
                for col in analysis["numeric_columns"]
                if any(term in col.lower() for term in ["pvalue", "p_value", "pval", "padj", "adj_pvalue", "fdr"])
            ]
            if fc_cols and pval_cols:
                characteristics.append("differential_expression_data")

        # Spectral data heuristic: 2 numeric columns, first mostly increasing in sane range
        if n_numeric == 2:
            col1 = analysis["numeric_columns"][0]
            col1_data = df[col1].dropna()
            if len(col1_data) > 10:
                diffs = col1_data.diff().dropna()
                is_increasing = float((diffs > 0).sum()) / max(len(diffs), 1) > 0.8
                reasonable_range = float(col1_data.min()) >= 0 and float(col1_data.max()) < 10000
                if is_increasing and reasonable_range:
                    characteristics.append("spectral_data")

        analysis["data_characteristics"] = characteristics
        return analysis

