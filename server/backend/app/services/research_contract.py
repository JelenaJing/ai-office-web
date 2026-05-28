"""
Map paper-remake idea/plot payloads to main-frontend research contract shapes (v2).
"""

from __future__ import annotations

import re
import uuid
from typing import Any, Dict, List, Optional


def _split_innovation(innovation: str) -> tuple[str, str]:
    """Legacy fallback when LLM only returns a single innovation string."""
    text = (innovation or "").strip()
    if not text:
        return "待补充", "待补充"
    parts = re.split(r"[。；;\n]+", text, maxsplit=1)
    if len(parts) == 2 and parts[1].strip():
        head = parts[0].strip()
        tail = parts[1].strip()
        if head and head[-1] not in "。；;":
            head = f"{head}。"
        return head, tail
    # Never split mid-sentence (avoids breaking words like 食品 across cells).
    return text, "待结合实验进一步验证。"


def _parse_unit_score(value: Any, default: float) -> float:
    """Accept 0–1 or 0–100 from LLM."""
    try:
        v = float(value)
    except (TypeError, ValueError):
        return default
    if v > 1.0:
        v = v / 100.0
    return max(0.0, min(1.0, v))


def _parse_risk_level(value: Any) -> str:
    raw = str(value or "medium").strip().lower()
    if raw in ("low", "medium", "high"):
        return raw
    return "medium"


def _estimate_scores(
    *,
    title: str,
    gap: str,
    hypothesis: str,
    method: str,
    required_data: List[str],
    required_experiment: List[str],
    ref_count: int,
) -> tuple[float, float, str]:
    """Rule-based fallback when LLM omits scores — varies per idea."""
    feas = 0.42
    nov = 0.48
    if gap and gap not in ("待补充",):
        nov += 0.12
        feas += 0.06
    if hypothesis and "待结合实验" not in hypothesis:
        nov += 0.1
        feas += 0.05
    if method and method != "待细化":
        feas += 0.18
    feas += 0.04 * min(len(required_data), 3)
    feas += 0.04 * min(len(required_experiment), 3)
    feas += 0.06 * min(ref_count, 3) / 3.0
    nov += 0.08 * min(ref_count, 3) / 3.0
    # Small stable spread from title so siblings are not identical.
    bucket = sum(ord(c) for c in (title or "")) % 9
    feas += bucket * 0.012
    nov += (8 - bucket) * 0.011
    feas = max(0.35, min(0.92, feas))
    nov = max(0.4, min(0.95, nov))
    risk = "high" if nov >= 0.82 and feas < 0.55 else "low" if feas >= 0.78 and nov < 0.65 else "medium"
    return feas, nov, risk


def _as_str_list(value: Any) -> List[str]:
    if not value:
        return []
    if isinstance(value, list):
        return [str(v).strip() for v in value if str(v).strip()]
    if isinstance(value, str):
        return [p.strip() for p in re.split(r"[；;\n]", value) if p.strip()]
    return []


def _reference_to_paper(ref: Any, index: int) -> Dict[str, Any]:
    if isinstance(ref, dict):
        title = str(ref.get("title") or "").strip() or f"Reference {index + 1}"
        authors = ref.get("authors") if isinstance(ref.get("authors"), list) else []
        authors = [str(a).strip() for a in authors if str(a).strip()]
        try:
            year = int(ref.get("year") or 0)
        except (TypeError, ValueError):
            year = 0
        citation = str(ref.get("citation") or "").strip()
        if not citation and title:
            author_s = ", ".join(authors[:3]) if authors else "Anonymous"
            venue = str(ref.get("venue") or "").strip()
            year_s = str(year) if year else "n.d."
            citation = f"{author_s} ({year_s}). {title}."
            if venue:
                citation += f" {venue}."
            doi = str(ref.get("doi") or "").strip()
            if doi:
                citation += f" {doi}"
        return {
            "id": str(ref.get("openalex_id") or f"ref-{index}"),
            "title": title,
            "authors": authors,
            "venue": str(ref.get("venue") or "").strip(),
            "year": year,
            "abstract": str(ref.get("abstract") or "").strip(),
            "tags": [],
            "relevanceScore": float(ref.get("relevanceScore") or 0.5),
            "citation": citation,
            "doi": str(ref.get("doi") or "").strip(),
        }
    title = str(ref or "").strip() or f"Reference {index + 1}"
    return {
        "id": f"ref-{index}",
        "title": title,
        "authors": [],
        "venue": "",
        "year": 0,
        "abstract": "",
        "tags": [],
        "relevanceScore": 0.5,
        "citation": title,
        "doi": "",
    }


def map_raw_ideas_to_cards(
    raw_ideas: List[Dict[str, Any]],
    *,
    field: str = "未分类",
) -> List[Dict[str, Any]]:
    cards: List[Dict[str, Any]] = []
    for item in raw_ideas or []:
        if not isinstance(item, dict):
            continue
        title = str(item.get("title") or "未命名 Idea").strip()
        description = str(item.get("description") or item.get("coreObservation") or "").strip()
        innovation = str(item.get("innovation") or "").strip()
        gap = str(item.get("researchGap") or item.get("research_gap") or "").strip()
        hypothesis = str(item.get("hypothesis") or "").strip()
        method = str(
            item.get("possibleMethod") or item.get("method") or item.get("feasible_method") or ""
        ).strip()
        if not gap and not hypothesis and innovation:
            gap, hypothesis = _split_innovation(innovation)
        elif not gap:
            gap = innovation or "待补充"
        elif not hypothesis:
            hypothesis = innovation or "待结合实验进一步验证。"
        if not method:
            method = "待细化"
        required_data = _as_str_list(item.get("requiredData") or item.get("required_data"))
        required_experiment = _as_str_list(
            item.get("requiredExperiment") or item.get("required_experiment")
        )
        refs = item.get("references") or []
        if not isinstance(refs, list):
            refs = []
        source_papers = [_reference_to_paper(str(r), i) for i, r in enumerate(refs[:8])]
        ref_count = len(source_papers)
        has_llm_scores = (
            item.get("feasibilityScore") is not None
            or item.get("feasibility_score") is not None
            or item.get("noveltyScore") is not None
            or item.get("novelty_score") is not None
        )
        if has_llm_scores:
            feas = _parse_unit_score(
                item.get("feasibilityScore", item.get("feasibility_score")), 0.7
            )
            nov = _parse_unit_score(item.get("noveltyScore", item.get("novelty_score")), 0.8)
            risk = _parse_risk_level(item.get("riskLevel", item.get("risk_level")))
        else:
            feas, nov, risk = _estimate_scores(
                title=title,
                gap=gap,
                hypothesis=hypothesis,
                method=method,
                required_data=required_data,
                required_experiment=required_experiment,
                ref_count=ref_count,
            )
        cards.append(
            {
                "id": f"idea-{uuid.uuid4().hex[:12]}",
                "title": title,
                "field": field,
                "sourcePapers": source_papers,
                "coreObservation": description or title,
                "researchGap": gap,
                "hypothesis": hypothesis,
                "possibleMethod": method,
                "requiredData": required_data,
                "requiredExperiment": required_experiment,
                "feasibilityScore": feas,
                "noveltyScore": nov,
                "riskLevel": risk,
                "nextAction": "read_more",
            }
        )
    return cards


def map_plot_response_v1_to_generate(
    v1: Dict[str, Any],
) -> Dict[str, Any]:
    metadata = v1.get("metadata") if isinstance(v1.get("metadata"), dict) else {}
    chart_type = str(metadata.get("chart_type") or v1.get("chart_type") or "unknown")
    rec_text = str(metadata.get("recommendation_text") or "")
    recommendation = {
        "recommended_chart": chart_type,
        "confidence": float(metadata.get("confidence") or 0.75),
        "reasoning": rec_text or "Plot generated",
        "alternative_charts": [],
        "suggested_parameters": {},
        "resolved_data_type": metadata.get("resolved_data_type"),
        "resolved_template_id": metadata.get("resolved_template_id"),
        "template_match_reason": metadata.get("template_match_reason"),
    }
    return {
        "success": v1.get("status") == "success",
        "chart_type": chart_type,
        "image": v1.get("plot_base64"),
        "file_path": v1.get("plot_path"),
        "message": str(v1.get("message") or "Plot generation completed"),
        "recommendation": recommendation,
    }


def map_recommend_v1_to_frontend(v1: Dict[str, Any]) -> Dict[str, Any]:
    options = v1.get("options") if isinstance(v1.get("options"), list) else []
    alt = [str(o.get("chart_type")) for o in options if isinstance(o, dict) and o.get("chart_type")]
    suggested = {}
    if options and isinstance(options[0], dict):
        suggested = options[0].get("suggested_parameters") or {}
        if not isinstance(suggested, dict):
            suggested = {}
    return {
        "recommended_chart": str(v1.get("recommended_chart") or "line"),
        "confidence": float(v1.get("confidence") or 0.5),
        "reasoning": str(v1.get("reasoning") or ""),
        "alternative_charts": alt[1:] if len(alt) > 1 else alt,
        "suggested_parameters": suggested,
        "resolved_data_type": v1.get("resolved_data_type"),
        "resolved_template_id": v1.get("resolved_template_id"),
        "template_match_reason": v1.get("template_match_reason"),
        "options": options,
    }
