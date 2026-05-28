"""
CSV file loader (ported from merged-plot-agent).
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

import pandas as pd

from .data_validator import DataValidator
from .tabular_io import decode_bytes, read_csv_from_path, read_csv_from_text, sanitize_csv_text

logger = logging.getLogger(__name__)


class CSVLoader:
    """CSV loader class."""

    def __init__(self, validator: Optional[DataValidator] = None):
        self.validator = validator or DataValidator()

    def load(self, file_path: str, encoding: Optional[str] = None, **kwargs) -> pd.DataFrame:
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"CSV file not found: {path}")

        sep = kwargs.get("sep")
        if encoding or sep is not None:
            raw = path.read_bytes()
            text = sanitize_csv_text(
                raw.decode(encoding, errors="replace") if encoding else decode_bytes(raw)
            )
            df = read_csv_from_text(text, sep=sep)
        else:
            df = read_csv_from_path(path)

        ok, msg = self.validator.validate(df)
        if not ok:
            raise ValueError(f"Data validation failed: {msg}")
        df = self.validator.preprocess(df)
        logger.info("Loaded CSV: %s (shape=%s)", path, df.shape)
        return df
