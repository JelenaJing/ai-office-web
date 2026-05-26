"""Conclusion from prior section texts."""
from __future__ import annotations

import logging
from typing import Dict, Iterator, List

from openai import OpenAI

from app.config import DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL, DEEPSEEK_MODEL
from app.services.llm_stream import iter_chat_stream_deltas

logger = logging.getLogger(__name__)


def _client() -> OpenAI:
    return OpenAI(api_key=DEEPSEEK_API_KEY, base_url=DEEPSEEK_BASE_URL)


def _conclusion_messages(
    *,
    introduction: str,
    methods: str,
    results: str,
    theory: str,
    abstract: str = "",
) -> List[Dict[str, str]]:
    intro = (introduction or "")[:6000]
    meth = (methods or "")[:4000]
    res = (results or "")[:6000]
    the = (theory or "")[:6000]
    abs_ = (abstract or "")[:2000]
    prompt = f"""Write a Conclusion section for the same paper, consistent with the following sections (may be partial).

Abstract:
{abs_}

Introduction (excerpt):
{intro}

Methods (excerpt):
{meth}

Results (excerpt):
{res}

Theory (excerpt):
{the}

Requirements:
- 2–4 short paragraphs or use ## subsections sparingly.
- Summarize achievements, limitations, and outlook.
- Do not add new experiments or citations.
- Match dominant language of the Introduction.
- Output ONLY the Conclusion body (no # top-level heading; you may use ##).
"""
    return [
        {"role": "system", "content": "You write balanced academic conclusions."},
        {"role": "user", "content": prompt},
    ]


def iter_write_conclusion_stream(
    *,
    introduction: str,
    methods: str,
    results: str,
    theory: str,
    abstract: str = "",
) -> Iterator[str]:
    yield from iter_chat_stream_deltas(
        _client(),
        DEEPSEEK_MODEL,
        _conclusion_messages(
            introduction=introduction,
            methods=methods,
            results=results,
            theory=theory,
            abstract=abstract,
        ),
        max_tokens=2000,
        temperature=0.35,
    )


def write_conclusion(
    *,
    introduction: str,
    methods: str,
    results: str,
    theory: str,
    abstract: str = "",
) -> str:
    return "".join(
        iter_write_conclusion_stream(
            introduction=introduction,
            methods=methods,
            results=results,
            theory=theory,
            abstract=abstract,
        )
    ).strip()
