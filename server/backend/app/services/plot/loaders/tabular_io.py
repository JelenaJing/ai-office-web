"""
Robust tabular file decoding (GBK/UTF-8) and pandas read helpers.

Fixes common upload issues:
- UTF-8 decode errors on Windows/Excel-exported CSV (GBK)
- NULL bytes in CSV (pandas python engine rejects them; use engine='c' after sanitize)
"""

from __future__ import annotations

import io
import logging
from pathlib import Path
from typing import Optional

import pandas as pd

logger = logging.getLogger(__name__)

# Common encodings for CN scientific data exports
_FALLBACK_ENCODINGS = ("utf-8-sig", "utf-8", "gb18030", "gbk", "cp936", "latin-1")


def decode_bytes(data: bytes) -> str:
    """Decode uploaded file bytes; never raises UnicodeDecodeError."""
    if not data:
        return ""
    # Strip embedded NUL early (breaks pandas csv python engine)
    cleaned = data.replace(b"\x00", b"")
    for enc in _FALLBACK_ENCODINGS:
        try:
            return cleaned.decode(enc)
        except UnicodeDecodeError:
            continue
    return cleaned.decode("utf-8", errors="replace")


def sanitize_csv_text(text: str) -> str:
    return text.replace("\x00", "").strip()


def guess_delimiter(text: str) -> str:
    tab = text.count("\t")
    comma = text.count(",")
    if tab >= comma and tab > 0:
        return "\t"
    if comma > 0:
        return ","
    return r"\s+"


def read_csv_from_text(text: str, *, sep: Optional[str] = None) -> pd.DataFrame:
    text = sanitize_csv_text(text)
    if not text:
        raise ValueError("CSV content is empty")
    sep = sep if sep is not None else guess_delimiter(text)
    is_regex_sep = len(sep) > 1 or sep in (r"\s+", r"\t")

    def _read(engine: str) -> pd.DataFrame:
        read_kwargs: dict = {"sep": sep, "engine": engine}
        try:
            read_kwargs["on_bad_lines"] = "skip"
        except Exception:
            pass
        try:
            return pd.read_csv(io.StringIO(text), **read_kwargs)
        except TypeError:
            read_kwargs.pop("on_bad_lines", None)
            read_kwargs["error_bad_lines"] = False
            return pd.read_csv(io.StringIO(text), **read_kwargs)

    if is_regex_sep:
        return _read("python")

    try:
        return _read("c")
    except Exception as exc:
        logger.warning("read_csv engine=c failed (%s), retrying engine=python", exc)
        return _read("python")


def read_csv_from_path(path: Path, encoding: Optional[str] = None) -> pd.DataFrame:
    raw = path.read_bytes()
    if encoding:
        text = raw.replace(b"\x00", b"").decode(encoding, errors="replace")
    else:
        text = decode_bytes(raw)
    return read_csv_from_text(text)


def read_excel_from_path(path: Path, sheet_name: int | str | None = 0, **kwargs) -> pd.DataFrame:
    suffix = path.suffix.lower()
    engines: list[str | None]
    if suffix == ".xls":
        engines = ["xlrd", None]
    else:
        engines = ["openpyxl", None]

    last_err: Exception | None = None
    for engine in engines:
        try:
            kw = dict(kwargs)
            if engine:
                kw["engine"] = engine
            return pd.read_excel(path, sheet_name=sheet_name, **kw)
        except Exception as exc:
            last_err = exc
            logger.warning("read_excel failed path=%s engine=%s: %s", path, engine, exc)

    # Misnamed CSV/TSV saved as .xlsx/.xls — try text decode
    try:
        logger.info("read_excel fallback to delimited text for %s", path)
        return read_csv_from_path(path)
    except Exception as exc:
        last_err = exc

    raise ValueError(f"无法读取 Excel 文件: {path.name} ({last_err})") from last_err
