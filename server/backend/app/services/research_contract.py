"""
Map paper-remake idea/plot payloads to main-frontend research contract shapes (v2).
"""

from __future__ import annotations

import re
import uuid
from typing import Any, Dict, List, Optional


def _split_innovation(innovation: str) -> tuple[str, str]:
    text = (innovation or "").strip()
    if not text:
        return "待补充", "待补充"
    parts = re.split(r"[。；;\n]", text, maxsplit=1)
    if len(parts) == 2 and parts[1].strip():
        return parts[0].strip(), parts[1].strip()
    mid = len(text) // 2
    return text[:mid].strip() or text, text[mid:].strip() or text


def _reference_to_paper(ref: str, index: int) -> Dict[str, Any]:
    title = (ref or "").strip() or f"Reference {index + 1}"
    return {
        "id": f"ref-{index}",
        "title": title,
        "authors": [],
        "venue": "",
        "year": 0,
        "abstract": "",
        "tags": [],
        "relevanceScore": 0.5,
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
        description = str(item.get("description") or "").strip()
        innovation = str(item.get("innovation") or "").strip()
        gap, hypothesis = _split_innovation(innovation)
        refs = item.get("references") or []
        if not isinstance(refs, list):
            refs = []
        source_papers = [_reference_to_paper(str(r), i) for i, r in enumerate(refs[:8])]
        cards.append(
            {
                "id": f"idea-{uuid.uuid4().hex[:12]}",
                "title": title,
                "field": field,
                "sourcePapers": source_papers,
                "coreObservation": description or title,
                "researchGap": gap,
                "hypothesis": hypothesis,
                "possibleMethod": "待细化",
                "requiredData": [],
                "requiredExperiment": [],
                "feasibilityScore": 0.7,
                "noveltyScore": 0.8,
                "riskLevel": "medium",
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
