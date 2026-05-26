"""Degraded Introduction and References when the primary intro pipeline fails."""
from __future__ import annotations

import logging
from typing import Any, Dict, Iterator, List

from openai import OpenAI

from app.agents.content_checker import extract_topic_from_text, search_reference_pool
from app.config import DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL, DEEPSEEK_MODEL
from app.services.llm_stream import iter_chat_stream_deltas

logger = logging.getLogger(__name__)


def _client() -> OpenAI:
    return OpenAI(api_key=DEEPSEEK_API_KEY, base_url=DEEPSEEK_BASE_URL)


def iter_fallback_introduction_stream(
    *,
    cleaned_excerpt: str,
    remade_abstract: str,
    error_note: str = "",
) -> Iterator[str]:
    excerpt = (cleaned_excerpt or "")[:12000]
    abstract = (remade_abstract or "")[:4000]
    note = (error_note or "")[:800]
    prompt = f"""The journal-based introduction rewrite pipeline failed ({note}).
Write a standalone Introduction section for an academic paper in Markdown (use ## subsections as appropriate).

Use ONLY the following excerpt and abstract as evidence. Do not fabricate specific citations or author names.
If citations are needed, use placeholders like [n] and a short note that references are listed separately.

Abstract:
{abstract}

Paper excerpt:
{excerpt}
"""
    yield from iter_chat_stream_deltas(
        _client(),
        DEEPSEEK_MODEL,
        [
            {"role": "system", "content": "You write careful academic introductions without fake citations."},
            {"role": "user", "content": prompt},
        ],
        max_tokens=4500,
        temperature=0.4,
    )


def fallback_introduction_text(
    *,
    cleaned_excerpt: str,
    remade_abstract: str,
    error_note: str = "",
) -> str:
    return "".join(
        iter_fallback_introduction_stream(
            cleaned_excerpt=cleaned_excerpt,
            remade_abstract=remade_abstract,
            error_note=error_note,
        )
    ).strip()


def fallback_reference_lines(cleaned_excerpt: str, max_results: int = 18) -> List[str]:
    """OpenAlex-backed APA-like lines when intro references are missing."""
    excerpt = (cleaned_excerpt or "")[:8000]
    try:
        topic = extract_topic_from_text(excerpt)
        pool = search_reference_pool(topic, max_results=max_results)
        return [str(p.get("citation") or "").strip() for p in pool if p.get("citation")]
    except Exception as e:
        logger.warning("[fallbacks] reference pool failed: %s", e)
        return []
