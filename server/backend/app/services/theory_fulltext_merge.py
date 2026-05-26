"""
Full-text theory analysis: chunk -> per-chunk analyze_theory -> deterministic merge.
Shared by /remake/theory/fulltext and full-paper CoRemake orchestrator.
"""
from __future__ import annotations

import re
from typing import Any, Dict, List

from app.agents import theory_analyzer
from app.project_manager import ProjectManager
from app.services.fulltext_multiround import ChunkingConfig, split_into_chunks

SECTION_ORDER: List[tuple[str, str]] = [
    ("principle_model", "1. 原理与模型构建"),
    ("assumptions", "2. 关键假设"),
    ("derivations_results", "3. 核心推导与结果"),
    ("scope", "4. 适用范围"),
    ("limitations", "5. 局限与不足"),
]
SECTION_KEYWORDS: Dict[str, List[str]] = {
    "principle_model": ["原理", "模型构建", "理论基础", "核心方程"],
    "assumptions": ["关键假设", "假设与近似", "近似"],
    "derivations_results": ["核心推导", "推导与结果", "激子能带", "有效质量"],
    "scope": ["适用范围", "适用系统", "参数空间"],
    "limitations": ["局限", "不足", "未明确", "限制"],
}


def _append_unique(dst: List[str], src: List[Any]) -> None:
    for x in src:
        s = str(x).strip()
        if not s:
            continue
        if s not in dst:
            dst.append(s)


def _normalize_analysis(text: str) -> str:
    t = (text or "").replace("\r\n", "\n").replace("\r", "\n").strip()
    t = "\n".join([ln for ln in t.split("\n") if not ln.strip().lower().startswith("chunk ")])
    return t.strip()


def _section_from_line(line: str) -> str | None:
    raw = (line or "").strip()
    if not raw:
        return None
    normalized = re.sub(r"^[#*\-\s>]+", "", raw)
    normalized = re.sub(r"^\d+[.)、]\s*", "", normalized)
    if normalized in ("理论分析", "理论内容分析"):
        return None
    lower = normalized.lower()
    for key, words in SECTION_KEYWORDS.items():
        for w in words:
            if w.lower() in lower:
                return key
    return None


def _split_into_sections(text: str) -> Dict[str, List[str]]:
    sec_map: Dict[str, List[str]] = {k: [] for k, _ in SECTION_ORDER}
    sec_map["misc"] = []
    current = "misc"
    buffer: List[str] = []
    lines = (text or "").split("\n")

    def flush_block() -> None:
        if not buffer:
            return
        block = "\n".join(buffer).strip()
        buffer.clear()
        if not block:
            return
        block = re.sub(r"\n{3,}", "\n\n", block).strip()
        sec_map[current].append(block)

    for ln in lines:
        maybe = _section_from_line(ln)
        if maybe:
            flush_block()
            current = maybe
            continue
        buffer.append(ln)
    flush_block()
    return sec_map


def _normalize_dedupe_key(text: str) -> str:
    t = (text or "").strip().lower()
    t = re.sub(r"\s+", " ", t)
    t = re.sub(r"^[#*\-\s>]+", "", t)
    t = re.sub(r"^\d+[.)、]\s*", "", t)
    return t


def _renumber_within_section(text: str) -> str:
    lines = (text or "").split("\n")
    out: List[str] = []
    idx = 0
    pat = re.compile(r"^\s*(\d{1,2})\s*([.)、])\s+")
    for ln in lines:
        m = pat.match(ln)
        if not m:
            out.append(ln)
            continue
        body = ln[m.end() :].strip()
        if not body:
            continue
        idx += 1
        out.append(f"{idx}. {body}")
    return re.sub(r"\n{3,}", "\n\n", "\n".join(out)).strip()


def _build_unified_analysis(texts: List[str]) -> str:
    aggregated: Dict[str, List[str]] = {k: [] for k, _ in SECTION_ORDER}
    aggregated["misc"] = []
    for t in texts:
        sec = _split_into_sections(t)
        for k, chunks_i in sec.items():
            aggregated.setdefault(k, [])
            aggregated[k].extend(chunks_i)

    out_parts: List[str] = ["## 理论分析"]
    for key, title in SECTION_ORDER:
        raw_blocks = aggregated.get(key, [])
        if key == "principle_model" and aggregated.get("misc"):
            raw_blocks = [*raw_blocks, *aggregated["misc"]]
        seen: set[str] = set()
        unique_blocks: List[str] = []
        for b in raw_blocks:
            nk = _normalize_dedupe_key(b)
            if not nk or nk in seen:
                continue
            seen.add(nk)
            unique_blocks.append(_renumber_within_section(b))
        if not unique_blocks:
            continue
        out_parts.append(f"### {title}")
        out_parts.append("\n\n".join(unique_blocks).strip())
    final_text = "\n\n".join([p for p in out_parts if str(p).strip()]).strip()
    return final_text or "未获得可用的理论分析结果（所有分段均失败）。"


def run_analyze_theory_fulltext(
    project_id: str,
    full_text: str,
    cfg: ChunkingConfig,
    *,
    save_result: bool = True,
) -> Dict[str, Any]:
    """
    Returns dict with keys: analysis, formulas, derivation_steps, warnings,
    chunks_total, chunks_success, chunks_failed, failed_chunk_indices, degraded.
    """
    full_text = (full_text or "").strip()
    if not full_text:
        raise ValueError("Paper content is empty")
    chunks = split_into_chunks(full_text, cfg)
    if not chunks:
        raise ValueError("No chunk generated from paper content")

    analyses: List[str] = []
    merged_formulas: List[str] = []
    merged_steps: List[str] = []
    warnings: List[str] = []
    failed_chunks: List[int] = []

    for i, ch in enumerate(chunks):
        r = theory_analyzer.analyze_theory(project_id=project_id, selected_text=ch)
        ok = bool(r.get("ok", True))
        analysis_i = str(r.get("analysis", "")).strip()
        if analysis_i and not analysis_i.startswith("理论分析失败"):
            analyses.append(_normalize_analysis(analysis_i))
        else:
            ok = False
        _append_unique(merged_formulas, r.get("formulas") or [])
        _append_unique(merged_steps, r.get("derivation_steps") or [])
        if r.get("warnings"):
            warnings.extend([str(w) for w in (r.get("warnings") or []) if str(w).strip()])
        if not ok:
            failed_chunks.append(i + 1)

    success_chunks = len(chunks) - len(failed_chunks)
    if analyses:
        final_analysis = _build_unified_analysis(analyses)
    else:
        final_analysis = "未获得可用的理论分析结果（所有分段均失败）。"

    final = {
        "analysis": final_analysis,
        "formulas": merged_formulas,
        "derivation_steps": merged_steps,
        "warnings": warnings,
        "chunks_total": len(chunks),
        "chunks_success": success_chunks,
        "chunks_failed": len(failed_chunks),
        "failed_chunk_indices": failed_chunks,
        "degraded": success_chunks < len(chunks),
    }
    if save_result:
        ProjectManager().save_remake_result(
            project_id,
            "theory",
            {
                "analysis": final["analysis"],
                "formulas": final["formulas"],
                "derivation_steps": final["derivation_steps"],
                "warnings": final["warnings"],
            },
        )
    return final
