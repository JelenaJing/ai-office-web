"""
Backend orchestration for full-text multi-round analysis.

Goals:
- Ensure ALL paper content is analyzed (no truncation)
- Chunk -> per-chunk processing -> final synthesis
"""

from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from app.services import unified_llm

logger = logging.getLogger(__name__)


@dataclass
class ChunkingConfig:
    target_chars: int = 6000
    overlap_chars: int = 300


def split_into_chunks(text: str, cfg: ChunkingConfig) -> List[str]:
    t = (text or "").replace("\r\n", "\n").replace("\r", "\n").strip()
    if not t:
        return []
    paras = [p.strip() for p in re.split(r"\n{2,}", t) if p and p.strip()]
    if not paras:
        return [t]
    chunks: List[str] = []
    buf = ""
    for p in paras:
        if not buf:
            buf = p
            continue
        if len(buf) + 2 + len(p) <= cfg.target_chars:
            buf += "\n\n" + p
        else:
            chunks.append(buf)
            overlap = buf[max(0, len(buf) - cfg.overlap_chars) :] if cfg.overlap_chars > 0 else ""
            buf = (overlap + "\n\n" + p).strip() if overlap else p
    if buf:
        chunks.append(buf)
    return chunks


def synthesize_json(
    *,
    system: str,
    user: str,
    max_tokens: int = 2500,
    temperature: float = 0.2,
) -> Dict[str, Any]:
    """Ask model to return JSON via unified_llm (same rules as Express ai-gateway)."""
    return unified_llm.synthesize_json(
        system=system,
        user=user,
        max_tokens=max_tokens,
        temperature=temperature,
    )


def synthesize_ideas(all_chunk_ideas: List[List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
    flattened: List[Dict[str, Any]] = []
    for ideas in all_chunk_ideas:
        if isinstance(ideas, list):
            for it in ideas:
                if isinstance(it, dict):
                    flattened.append(it)
    payload = json.dumps(flattened, ensure_ascii=False)
    out = unified_llm.synthesize_json(
        system="You are a scientific editor. Output ONLY valid JSON.",
        user=(
            "Given a list of idea objects extracted from different chunks of ONE paper, "
            "merge/deduplicate them into a final shortlist.\n\n"
            "Rules:\n"
            "- MUST consider ideas from ALL chunks (do not ignore any)\n"
            "- Deduplicate near-duplicates\n"
            "- Prefer specific, actionable ideas\n"
            "- Output JSON: {\"ideas\": [ {\"title\":..., \"description\":..., \"innovation\":..., \"references\": [...]}, ... ] }\n\n"
            f"Idea objects:\n{payload}\n"
        ),
        max_tokens=8000,
        temperature=0.25,
    )
    ideas = out.get("ideas")
    if isinstance(ideas, list):
        return [i for i in ideas if isinstance(i, dict)]
    # Fallback: 尝试从 raw 文本解析截断的 JSON
    raw = out.get("raw", "")
    if raw:
        try:
            # 尝试修复截断的 JSON
            import re as _re
            # 找到最后一个完整的 } 对象
            fixed = raw.rsplit('}', 1)[0] + '}]}'
            parsed = json.loads(fixed)
            if isinstance(parsed.get("ideas"), list):
                return [i for i in parsed["ideas"] if isinstance(i, dict)]
        except Exception:
            pass
    return [{"title": "Synthesis failed", "description": raw, "innovation": "", "references": []}]


def synthesize_experiment_design(chunk_results: List[Dict[str, Any]]) -> Dict[str, Any]:
    payload = json.dumps(chunk_results, ensure_ascii=False)
    out = synthesize_json(
        system="You are an experimental design expert. Output ONLY valid JSON.",
        user=(
            "You are given multiple experiment design drafts from different chunks of ONE paper. "
            "Merge them into ONE consistent experiment_design and ONE recipe markdown.\n\n"
            "Rules:\n"
            "- MUST consider ALL chunks\n"
            "- Deduplicate repeated steps/materials\n"
            "- Keep parameters explicit (temperature/time/concentration)\n"
            "Output JSON:\n"
            "{\n"
            "  \"experiment_design\": {\"purpose\":..., \"principle\":..., \"method\":..., \"expected_results\":...},\n"
            "  \"recipe\": \"# ... markdown ...\"\n"
            "}\n\n"
            f"Chunk drafts:\n{payload}\n"
        ),
        max_tokens=2500,
        temperature=0.25,
    )
    if isinstance(out.get("experiment_design"), dict) and isinstance(out.get("recipe"), str):
        return {"experiment_design": out["experiment_design"], "recipe": out["recipe"]}
    return {"experiment_design": {}, "recipe": out.get("raw", "")}


def synthesize_content_check(chunk_results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Conservative synthesis: merge issues/references; do not attempt to produce full updated_text.
    """
    issues: List[Dict[str, Any]] = []
    refs: List[Dict[str, Any]] = []
    recommended: List[Dict[str, Any]] = []
    for r in chunk_results:
        if isinstance(r.get("issues"), list):
            issues.extend([x for x in r["issues"] if isinstance(x, dict)])
        if isinstance(r.get("updated_references"), list):
            refs.extend([x for x in r["updated_references"] if isinstance(x, dict)])
        if isinstance(r.get("recommended_references"), list):
            recommended.extend([x for x in r["recommended_references"] if isinstance(x, dict)])
    return {
        "original_text": "",
        "updated_text": "",
        "updated_references": refs,
        "recommended_references": recommended,
        "issues": issues,
        "is_outdated": any(bool(r.get("is_outdated")) for r in chunk_results),
        "latest_papers_count": max([int(r.get("latest_papers_count") or 0) for r in chunk_results] or [0]),
        "matched_count": max([int(r.get("matched_count") or 0) for r in chunk_results] or [0]),
    }

