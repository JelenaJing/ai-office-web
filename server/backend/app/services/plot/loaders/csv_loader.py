"""
CSV file loader (ported from merged-plot-agent).
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

import pandas as pd

from .data_validator import DataValidator

logger = logging.getLogger(__name__)


class CSVLoader:
    """CSV loader class."""

    def __init__(self, validator: Optional[DataValidator] = None):
        self.validator = validator or DataValidator()

    def load(self, file_path: str, encoding: str = "utf-8", **kwargs) -> pd.DataFrame:
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"CSV file not found: {path}")

        df = pd.read_csv(path, encoding=encoding, **kwargs)
        ok, msg = self.validator.validate(df)
        if not ok:
            raise ValueError(f"Data validation failed: {msg}")
        df = self.validator.preprocess(df)
        logger.info("Loaded CSV: %s (shape=%s)", path, df.shape)
        return df

