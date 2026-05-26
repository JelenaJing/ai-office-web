"""
Excel file loader (ported from merged-plot-agent).
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

import pandas as pd

from .data_validator import DataValidator

logger = logging.getLogger(__name__)


class ExcelLoader:
    """Excel loader class."""

    def __init__(self, validator: Optional[DataValidator] = None):
        self.validator = validator or DataValidator()

    def load(self, file_path: str, sheet_name: int | str | None = 0, **kwargs) -> pd.DataFrame:
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"Excel file not found: {path}")

        df = pd.read_excel(path, sheet_name=sheet_name, **kwargs)
        ok, msg = self.validator.validate(df)
        if not ok:
            raise ValueError(f"Data validation failed: {msg}")
        df = self.validator.preprocess(df)
        logger.info("Loaded Excel: %s (shape=%s)", path, df.shape)
        return df

