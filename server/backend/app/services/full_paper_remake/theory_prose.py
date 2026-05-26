"""Format theory analyzer output as a paper-style Theory / Model section."""
from __future__ import annotations

import json
import logging
from typing import Any, Dict, Iterator, List

from openai import OpenAI

from app.config import DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL, DEEPSEEK_MODEL
from app.services.llm_stream import iter_chat_stream_deltas

logger = logging.getLogger(__name__)


def _client() -> OpenAI:
    return OpenAI(api_key=DEEPSEEK_API_KEY, base_url=DEEPSEEK_BASE_URL)


def _theory_messages(
    *,
    analysis_markdown: str,
    formulas: List[str],
    derivation_steps: List[str],
) -> List[Dict[str, str]]:
    analysis = (analysis_markdown or "")[:16000]
    formulas_json = json.dumps(formulas, ensure_ascii=False)[:8000]
    steps_json = json.dumps(derivation_steps, ensure_ascii=False)[:8000]
    prompt = f"""Convert the following theoretical analysis into a single cohesive "Theory" or "Theoretical framework" section of a journal article.

Inputs:
- Narrative analysis (may contain Markdown and LaTeX):
{analysis}

- Display formulas (LaTeX strings, use as given):
{formulas_json}

- Derivation steps (list of strings):
{steps_json}

Requirements:
- Use ## and ### headings; integrate formulas with $$...$$ blocks where appropriate.
- Maintain logical flow: model setup, assumptions, main results, limitations.
- Do not contradict the given analysis; you may smooth wording.
- No references section here.
- Start content with ### (no single # line).

Output ONLY the Theory section body in Markdown.
"""
    return [
        {"role": "system", "content": "You are a theoretical physicist/mathematician writing for a broad science journal."},
        {"role": "user", "content": prompt},
    ]


def iter_format_theory_section_stream(
    *,
    analysis_markdown: str,
    formulas: List[str],
    derivation_steps: List[str],
) -> Iterator[str]:
    yield from iter_chat_stream_deltas(
        _client(),
        DEEPSEEK_MODEL,
        _theory_messages(
            analysis_markdown=analysis_markdown,
            formulas=formulas,
            derivation_steps=derivation_steps,
        ),
        max_tokens=6000,
        temperature=0.3,
    )


def format_theory_section(
    *,
    analysis_markdown: str,
    formulas: List[str],
    derivation_steps: List[str],
) -> str:
    return "".join(
        iter_format_theory_section_stream(
            analysis_markdown=analysis_markdown,
            formulas=formulas,
            derivation_steps=derivation_steps,
        )
    ).strip()


def iter_fallback_theory_stream(cleaned_excerpt: str, error_note: str = "") -> Iterator[str]:
    excerpt = (cleaned_excerpt or "")[:10000]
    prompt = f"""Theory analysis failed or was empty ({error_note[:300]}). 
Write a concise Theory section in Markdown based only on this paper excerpt. Mark limitations clearly.

Excerpt:
{excerpt}
"""
    yield from iter_chat_stream_deltas(
        _client(),
        DEEPSEEK_MODEL,
        [
            {"role": "system", "content": "You write careful theory sections without overclaiming."},
            {"role": "user", "content": prompt},
        ],
        max_tokens=4000,
        temperature=0.35,
    )


def fallback_theory(cleaned_excerpt: str, error_note: str = "") -> str:
    return "".join(iter_fallback_theory_stream(cleaned_excerpt, error_note)).strip()
