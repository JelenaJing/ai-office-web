"""Turn experiment_design JSON + optional extract summary into a Methods section."""
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


def _methods_messages(
    *,
    experiment_design: Dict[str, Any],
    recipe_markdown: str,
    extract_summary: str = "",
) -> List[Dict[str, str]]:
    design_json = json.dumps(experiment_design, ensure_ascii=False, indent=2)[:12000]
    recipe = (recipe_markdown or "")[:12000]
    summary = (extract_summary or "")[:6000]
    prompt = f"""You are writing the Methods (or Experimental) section of a scientific paper.

Use the following structured experiment redesign and recipe. Expand into formal prose suitable for a journal article.

Requirements:
- Subsections with ## headings inside this section only (e.g. ## Materials, ## Synthesis / Sample preparation, ## Characterization, ## Statistical analysis) — adjust titles to fit the domain.
- Include not only procedural steps but also planned characterization / tests (e.g. spectroscopy, microscopy, mechanical tests) that will be reported in Results later.
- Explicitly state controls, calibration, or quality checks where appropriate.
- Do not invent brand names unless given.
- No figures; describe measurements in words.
- Keep numbering of steps clear.

Structured design (JSON):
{design_json}

Recipe (markdown):
{recipe}

Optional notes from original paper extraction:
{summary}

Output ONLY the Methods section body in Markdown (start with a single top-level idea: you may begin with ### subsections but do NOT use a single # heading).
"""
    return [
        {"role": "system", "content": "You write precise, reproducible academic Methods sections."},
        {"role": "user", "content": prompt},
    ]


def iter_format_methods_from_design_stream(
    *,
    experiment_design: Dict[str, Any],
    recipe_markdown: str,
    extract_summary: str = "",
) -> Iterator[str]:
    yield from iter_chat_stream_deltas(
        _client(),
        DEEPSEEK_MODEL,
        _methods_messages(
            experiment_design=experiment_design,
            recipe_markdown=recipe_markdown,
            extract_summary=extract_summary,
        ),
        max_tokens=4500,
        temperature=0.35,
    )


def format_methods_from_design(
    *,
    experiment_design: Dict[str, Any],
    recipe_markdown: str,
    extract_summary: str = "",
) -> str:
    """Generate journal-style Methods (materials, procedures, characterization plan, QC/statistics)."""
    return "".join(
        iter_format_methods_from_design_stream(
            experiment_design=experiment_design,
            recipe_markdown=recipe_markdown,
            extract_summary=extract_summary,
        )
    ).strip()


def iter_fallback_methods_stream(cleaned_excerpt: str, error_note: str = "") -> Iterator[str]:
    excerpt = (cleaned_excerpt or "")[:8000]
    prompt = f"""The automated experiment redesign pipeline failed ({error_note[:500]}). 
Write a plausible generic Methods section in Markdown (subsections with ##) consistent with this excerpt from a scientific paper. 
Clearly mark uncertainty where details are missing. Do not claim specific proprietary protocols.

Excerpt:
{excerpt}
"""
    yield from iter_chat_stream_deltas(
        _client(),
        DEEPSEEK_MODEL,
        [
            {"role": "system", "content": "You write conservative, honest Methods sections."},
            {"role": "user", "content": prompt},
        ],
        max_tokens=3500,
        temperature=0.4,
    )


def fallback_methods_from_topic(cleaned_excerpt: str, error_note: str = "") -> str:
    """Degraded Methods when experiment design failed."""
    return "".join(iter_fallback_methods_stream(cleaned_excerpt, error_note)).strip()
