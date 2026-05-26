"""
Data validation and preprocessing (ported from merged-plot-agent).
"""

from __future__ import annotations

import logging
from typing import Tuple

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


class DataValidator:
    """Validate and preprocess tabular data for plotting."""

    def validate(self, df: pd.DataFrame) -> Tuple[bool, str]:
        if df is None:
            return False, "DataFrame is None"
        if df.empty:
            return False, "DataFrame is empty"
        if df.columns is None or len(df.columns) == 0:
            return False, "No columns found"
        return True, ""

    def preprocess(self, df: pd.DataFrame) -> pd.DataFrame:
        """Light preprocessing: trim column names, try numeric conversion where safe."""
        out = df.copy()
        out.columns = [str(c).strip() for c in out.columns]

        # Try to coerce object columns to numeric where possible (common for pasted CSV)
        for col in out.columns:
            if out[col].dtype == "object":
                # Convert comma decimals? keep simple; pandas will handle most.
                coerced = pd.to_numeric(out[col], errors="ignore")
                out[col] = coerced

        # Replace inf with NaN
        out = out.replace([np.inf, -np.inf], np.nan)
        return out

