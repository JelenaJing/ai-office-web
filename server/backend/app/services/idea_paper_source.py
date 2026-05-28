"""
Idea 生成用论文文本：可选仅取 PDF 原文前 N 字（跳过 LLM 清洗与全文分段）。

环境变量 IDEA_PAPER_MAX_CHARS：
  - 0 或未设：沿用 cleaned 全文 + 多段 fulltext（原行为）
  - >0：仅 raw 提取前 N 字，单次 Idea 生成
"""

from __future__ import annotations

import os
from typing import Any, Dict, Optional, Tuple

from app.services.paper_processor import PaperProcessor

import logging

logger = logging.getLogger(__name__)


def get_idea_paper_char_limit() -> int:
    raw = (os.getenv("IDEA_PAPER_MAX_CHARS") or "0").strip()
    try:
        return max(0, int(raw))
    except ValueError:
        return 0


def read_paper_text_for_idea(
    project_id: str,
    override_text: Optional[str] = None,
) -> Tuple[str, Dict[str, Any]]:
    """
    Returns (text, meta) for idea / idea-fulltext handlers.
    """
    if override_text and str(override_text).strip():
        text = str(override_text).strip()
        return text, {"mode": "override", "chars_used": len(text), "chunks_expected": 1}

    limit = get_idea_paper_char_limit()
    processor = PaperProcessor()

    if limit > 0:
        raw = processor.get_paper_text(project_id, variant="raw") or ""
        text = raw[:limit].strip()
        meta = {
            "mode": "raw_preview",
            "idea_paper_max_chars": limit,
            "raw_length": len(raw),
            "chars_used": len(text),
            "truncated": len(raw) > limit,
            "chunks_expected": 1,
        }
        logger.info(
            "[Idea paper] preview mode: using first %s chars of raw PDF (total raw=%s)",
            limit,
            len(raw),
        )
        return text, meta

    text = (processor.get_paper_text(project_id, variant="cleaned") or "").strip()
    meta = {
        "mode": "cleaned_full",
        "chars_used": len(text),
        "chunks_expected": None,
    }
    return text, meta


def should_use_single_pass_idea(meta: Dict[str, Any], full_text: str, target_chars: int) -> bool:
    if meta.get("chunks_expected") == 1:
        return True
    if not full_text.strip():
        return True
    return len(full_text) <= max(1, int(target_chars))
