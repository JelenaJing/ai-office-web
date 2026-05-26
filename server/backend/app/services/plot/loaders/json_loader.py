"""
JSON file loader (ported from merged-plot-agent).
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, Optional, Union

import pandas as pd

from .data_validator import DataValidator

logger = logging.getLogger(__name__)


class JSONLoader:
    """JSON loader class."""

    def __init__(self, validator: Optional[DataValidator] = None):
        self.validator = validator or DataValidator()

    def load(self, file_path: str, encoding: str = "utf-8", orient: str = "records", **kwargs) -> pd.DataFrame:
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"JSON file not found: {path}")

        df = pd.read_json(path, encoding=encoding, orient=orient, **kwargs)
        ok, msg = self.validator.validate(df)
        if not ok:
            raise ValueError(f"Data validation failed: {msg}")
        df = self.validator.preprocess(df)
        logger.info("Loaded JSON: %s (shape=%s)", path, df.shape)
        return df

    def load_from_dict(self, data: Union[Dict[str, Any], list], **kwargs) -> pd.DataFrame:
        df = pd.DataFrame(data, **kwargs)
        ok, msg = self.validator.validate(df)
        if not ok:
            raise ValueError(f"Data validation failed: {msg}")
        return self.validator.preprocess(df)

