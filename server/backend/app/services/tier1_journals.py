"""
Load tier-1 journal allowlist (10–15 journal groups → OpenAlex source IDs).
"""
from __future__ import annotations

import json
import re
import logging
from pathlib import Path
from typing import Any, Dict, List, Set, Tuple

logger = logging.getLogger(__name__)

_CONFIG_PATH = Path(__file__).resolve().parent.parent / "data" / "tier1_journals.json"


def _normalize_source_id(url_or_id: str) -> str:
    """Return canonical https://openalex.org/S... form."""
    s = (url_or_id or "").strip()
    if not s:
        return ""
    m = re.search(r"S\d{5,}", s)
    if m:
        return f"https://openalex.org/{m.group(0)}"
    return s


def load_tier1_config(path: Path | None = None) -> Dict[str, Any]:
    p = path or _CONFIG_PATH
    with open(p, "r", encoding="utf-8") as f:
        return json.load(f)


def get_allowed_source_ids(path: Path | None = None) -> Set[str]:
    cfg = load_tier1_config(path)
    ids: Set[str] = set()
    for j in cfg.get("journals", []):
        for sid in j.get("source_ids", []):
            n = _normalize_source_id(sid)
            if n:
                ids.add(n)
    logger.info(f"[Tier1Journals] Loaded {len(ids)} distinct OpenAlex source IDs from config")
    return ids


def allowed_journals_metadata(path: Path | None = None) -> List[Dict[str, Any]]:
    cfg = load_tier1_config(path)
    out: List[Dict[str, Any]] = []
    for j in cfg.get("journals", []):
        label = j.get("label", "")
        raw = j.get("source_ids", [])
        norm = [_normalize_source_id(x) for x in raw if _normalize_source_id(x)]
        out.append({"label": label, "source_ids": norm})
    return out


def work_source_id(work: Dict[str, Any]) -> str | None:
    """OpenAlex work primary_location.source.id"""
    loc = work.get("primary_location") or {}
    src = loc.get("source") or {}
    sid = src.get("id")
    if not sid:
        return None
    return _normalize_source_id(sid)


def work_matches_allowlist(work: Dict[str, Any], allowed: Set[str]) -> bool:
    sid = work_source_id(work)
    if not sid:
        return False
    return sid in allowed


def venue_display_name(work: Dict[str, Any]) -> str:
    loc = work.get("primary_location") or {}
    src = loc.get("source") or {}
    return src.get("display_name") or src.get("display_name_alternatives", [""])[0] or ""
