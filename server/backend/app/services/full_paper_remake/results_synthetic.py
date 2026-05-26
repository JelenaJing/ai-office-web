"""Synthetic Results aligned with Methods characterizations."""
from __future__ import annotations

import logging
from typing import Dict, Iterator, List

from openai import OpenAI

from app.config import DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL, DEEPSEEK_MODEL
from app.services.llm_stream import iter_chat_stream_deltas

logger = logging.getLogger(__name__)


def _client() -> OpenAI:
    return OpenAI(api_key=DEEPSEEK_API_KEY, base_url=DEEPSEEK_BASE_URL)


def _results_messages(
    *,
    methods_section: str,
    abstract_hint: str = "",
    language_hint: str = "",
) -> List[Dict[str, str]]:
    methods = (methods_section or "")[:14000]
    abs_h = (abstract_hint or "")[:2500]
    lang = (language_hint or "").strip() or "Match the language of the Methods section."
    prompt = f"""Write the Results section of a scientific paper.

Methods section (source of truth for which experiments were done):
{methods}

Abstract (for tone / story only):
{abs_h}

Rules:
- For every major characterization, test, or assay implied in Methods, include a corresponding subsection or paragraph in Results with plausible qualitative trends and example numeric values (clearly as illustrative unless Methods gave exact numbers).
- Use ## and ### headings for organization.
- Do NOT introduce new experimental techniques that were not mentioned in Methods.
- No tables or images; prose only.
- {lang}

Output ONLY the Results body (no top-level # title).
"""
    return [
        {"role": "system", "content": "You write coherent Results sections aligned with stated methods."},
        {"role": "user", "content": prompt},
    ]


def iter_generate_results_stream(
    *,
    methods_section: str,
    abstract_hint: str = "",
    language_hint: str = "",
) -> Iterator[str]:
    yield from iter_chat_stream_deltas(
        _client(),
        DEEPSEEK_MODEL,
        _results_messages(
            methods_section=methods_section,
            abstract_hint=abstract_hint,
            language_hint=language_hint,
        ),
        max_tokens=5000,
        temperature=0.45,
    )


def generate_results_for_methods(
    *,
    methods_section: str,
    abstract_hint: str = "",
    language_hint: str = "",
) -> str:
    """
    Generate a Results section: for each test/technique mentioned in Methods, provide a matching narrative result.
    Uses plausible illustrative numbers; no figures.
    """
    return "".join(
        iter_generate_results_stream(
            methods_section=methods_section,
            abstract_hint=abstract_hint,
            language_hint=language_hint,
        )
    ).strip()


def iter_fallback_results_stream(methods_section: str, error_note: str = "") -> Iterator[str]:
    methods = (methods_section or "")[:6000]
    prompt = f"""Upstream pipeline issue: {error_note[:400]}

Write a short Results section in Markdown that still mirrors the following Methods as closely as possible, using cautious language.

Methods:
{methods}
"""
    yield from iter_chat_stream_deltas(
        _client(),
        DEEPSEEK_MODEL,
        [
            {"role": "system", "content": "You write cautious academic Results."},
            {"role": "user", "content": prompt},
        ],
        max_tokens=3500,
        temperature=0.45,
    )


def fallback_results(methods_section: str, error_note: str = "") -> str:
    return "".join(iter_fallback_results_stream(methods_section, error_note)).strip()
