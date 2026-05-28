"""
Format OpenAlex works as structured references for Idea cards.
"""

from __future__ import annotations

import re
from typing import Any, Dict, List, Optional


def _author_list(work: Dict[str, Any], max_authors: int = 3) -> List[str]:
    names: List[str] = []
    for item in work.get("authorships") or []:
        if not isinstance(item, dict):
            continue
        author = item.get("author") if isinstance(item.get("author"), dict) else {}
        name = str(author.get("display_name") or "").strip()
        if name:
            names.append(name)
        if len(names) >= max_authors:
            break
    return names


def _venue_name(work: Dict[str, Any]) -> str:
    loc = work.get("primary_location") if isinstance(work.get("primary_location"), dict) else {}
    source = loc.get("source") if isinstance(loc.get("source"), dict) else {}
    venue = str(source.get("display_name") or "").strip()
    if venue:
        return venue
    return str(work.get("host_venue_name") or "").strip()


def _doi_url(work: Dict[str, Any]) -> str:
    doi = str(work.get("doi") or "").strip()
    if not doi:
        return ""
    if doi.startswith("http"):
        return doi
    return f"https://doi.org/{doi.replace('https://doi.org/', '')}"


def format_author_label(authors: List[str]) -> str:
    if not authors:
        return "Anonymous"
    if len(authors) == 1:
        return authors[0]
    if len(authors) == 2:
        return f"{authors[0]} & {authors[1]}"
    return f"{authors[0]} et al."


def format_openalex_work_citation(work: Dict[str, Any]) -> str:
    """APA-like one-line citation for UI display."""
    title = str(work.get("title") or "Untitled").strip().rstrip(".")
    year = work.get("publication_year")
    year_s = str(year) if year else "n.d."
    authors = _author_list(work)
    author_s = format_author_label(authors)
    venue = _venue_name(work)
    doi = _doi_url(work)
    parts = [f"{author_s} ({year_s}). {title}."]
    if venue:
        parts.append(f" {venue}.")
    if doi:
        parts.append(f" {doi}")
    return "".join(parts).strip()


def work_to_reference_record(work: Dict[str, Any], index: int) -> Dict[str, Any]:
    authors = _author_list(work, max_authors=8)
    year = work.get("publication_year")
    try:
        year_int = int(year) if year is not None else 0
    except (TypeError, ValueError):
        year_int = 0
    wid = str(work.get("id") or f"ref-{index}")
    return {
        "openalex_id": wid,
        "title": str(work.get("title") or "").strip(),
        "authors": authors,
        "venue": _venue_name(work),
        "year": year_int,
        "doi": _doi_url(work),
        "citation": format_openalex_work_citation(work),
    }


def build_reference_pool(works: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    pool: List[Dict[str, Any]] = []
    seen_titles: set[str] = set()
    for i, work in enumerate(works):
        if not isinstance(work, dict):
            continue
        title_key = re.sub(r"\s+", " ", str(work.get("title") or "").lower().strip())
        if not title_key or title_key in seen_titles:
            continue
        seen_titles.add(title_key)
        pool.append(work_to_reference_record(work, len(pool)))
    return pool


def format_pool_for_prompt(pool: List[Dict[str, Any]]) -> str:
    lines: List[str] = []
    for i, ref in enumerate(pool, start=1):
        lines.append(f"[{i}] {ref.get('citation', ref.get('title', ''))}")
    return "\n".join(lines) if lines else "(empty)"


def resolve_reference_indices(
    idea: Dict[str, Any],
    pool: List[Dict[str, Any]],
    *,
    max_refs: int = 4,
) -> List[Dict[str, Any]]:
    """Map 1-based pool indices from LLM to structured reference records."""
    raw = idea.get("referenceIndices") or idea.get("reference_indices") or []
    resolved: List[Dict[str, Any]] = []
    if isinstance(raw, list):
        for item in raw:
            try:
                idx = int(item)
            except (TypeError, ValueError):
                continue
            if idx >= 1:
                idx -= 1
            if 0 <= idx < len(pool):
                resolved.append(pool[idx])
            if len(resolved) >= max_refs:
                break
    if resolved:
        return resolved

    # Legacy: plain title strings — keep as minimal records
    legacy = idea.get("references") or []
    if not isinstance(legacy, list):
        return []
    out: List[Dict[str, Any]] = []
    for j, ref in enumerate(legacy[:max_refs]):
        if isinstance(ref, dict) and ref.get("citation"):
            out.append(ref)
        elif isinstance(ref, str) and ref.strip():
            title = ref.strip()
            out.append(
                {
                    "openalex_id": f"legacy-{j}",
                    "title": title,
                    "authors": [],
                    "venue": "",
                    "year": 0,
                    "doi": "",
                    "citation": title,
                }
            )
    return out
