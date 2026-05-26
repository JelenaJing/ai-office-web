"""Extract original title/abstract from cleaned paper; generate CoRemake abstract."""
from __future__ import annotations

import json
import logging
import re
from typing import Any, Dict, Iterator, List, Tuple

from openai import OpenAI

from app.config import DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL, DEEPSEEK_MODEL
from app.services.llm_stream import iter_chat_stream_deltas

logger = logging.getLogger(__name__)


def _client() -> OpenAI:
    return OpenAI(api_key=DEEPSEEK_API_KEY, base_url=DEEPSEEK_BASE_URL)


def _strip_fence(text: str) -> str:
    t = (text or "").strip()
    if t.startswith("```"):
        t = re.sub(r"^```(?:json)?\n?", "", t)
        t = re.sub(r"\n?```$", "", t)
    return t.strip()


def extract_title_and_abstract(cleaned_full_text: str) -> Tuple[str, str]:
    """
    LLM extracts paper title and original abstract from noisy full text.
    Falls back to heuristics on parse failure.
    """
    cap = min(len(cleaned_full_text), 50_000)
    body = cleaned_full_text[:cap]
    prompt = f"""From the following academic paper text (may contain PDF extraction noise), extract:
1) "title": the main paper title only (no journal name, no authors line).
2) "abstract": the paper's abstract section body only. If there is no clear abstract, use the first 2-3 paragraphs that summarize the work (verbatim as much as possible).

Return JSON only: {{"title": "...", "abstract": "..."}}

Paper text:
{body}
"""
    try:
        resp = _client().chat.completions.create(
            model=DEEPSEEK_MODEL,
            messages=[
                {"role": "system", "content": "You output only valid JSON. Do not invent a title if missing; use a short descriptive phrase from the first lines."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=4000,
            temperature=0.15,
        )
        raw = _strip_fence(resp.choices[0].message.content or "")
        data = json.loads(raw)
        title = str(data.get("title") or "").strip()
        abstract = str(data.get("abstract") or "").strip()
        if not title:
            title = _fallback_title(cleaned_full_text)
        if not abstract:
            abstract = _fallback_abstract(cleaned_full_text)
        return title, abstract
    except Exception as e:
        logger.warning("[title_abstract] extract failed: %s", e)
        return _fallback_title(cleaned_full_text), _fallback_abstract(cleaned_full_text)


def _fallback_title(text: str) -> str:
    lines = [ln.strip() for ln in (text or "").splitlines() if ln.strip()]
    for ln in lines[:15]:
        if len(ln) > 8 and len(ln) < 300 and not ln.lower().startswith("abstract"):
            return ln[:250]
    return "Untitled study"


def _fallback_abstract(text: str) -> str:
    t = re.sub(r"\s+", " ", (text or "").strip())[:3500]
    return t


def _coremake_abstract_messages(
    *,
    original_title: str,
    original_abstract: str,
    topic_hint: str = "",
) -> List[Dict[str, str]]:
    hint = (topic_hint or "").strip()[:2000]
    prompt = f"""You are writing the Abstract section for a remade academic paper titled (original): {original_title}

Original abstract (may be noisy):
{original_abstract[:6000]}

Additional context (optional):
{hint}

Write a polished, self-contained abstract suitable for a journal submission. 
- Do not mention "CoRemake" or that this is AI-generated.
- Preserve the scientific topic and claims that are supported by the original text; do not fabricate specific experimental numbers not implied by the original.
- Typical structure: background, gap, approach, key findings (qualitative if needed), significance.
- Use paragraph form, no bullet lists.
- If the original is not in English, keep the same language as the original abstract.
Output ONLY the abstract body (no heading "Abstract").
"""
    return [
        {"role": "system", "content": "You write rigorous academic abstracts."},
        {"role": "user", "content": prompt},
    ]


def iter_generate_coremake_abstract_stream(
    *,
    original_title: str,
    original_abstract: str,
    topic_hint: str = "",
) -> Iterator[str]:
    msgs = _coremake_abstract_messages(
        original_title=original_title,
        original_abstract=original_abstract,
        topic_hint=topic_hint,
    )
    yield from iter_chat_stream_deltas(
        _client(),
        DEEPSEEK_MODEL,
        msgs,
        max_tokens=2000,
        temperature=0.35,
    )


def generate_coremake_abstract(
    *,
    original_title: str,
    original_abstract: str,
    topic_hint: str = "",
) -> str:
    """Rewrite abstract in formal academic English (or match source language), framed as a remade / reframed study."""
    return "".join(
        iter_generate_coremake_abstract_stream(
            original_title=original_title,
            original_abstract=original_abstract,
            topic_hint=topic_hint,
        )
    ).strip()


def run_title_extract_only(cleaned_full_text: str) -> Dict[str, Any]:
    """Parallel phase: title + verbatim-ish original abstract only (no remade abstract yet)."""
    title, orig_abs = extract_title_and_abstract(cleaned_full_text)
    return {
        "original_title": title,
        "original_abstract": orig_abs,
    }


def run_title_and_abstract_pipeline(cleaned_full_text: str) -> Dict[str, Any]:
    """Full title + remade abstract (sync); used by tests / callers that want one shot."""
    bundle = run_title_extract_only(cleaned_full_text)
    remade = generate_coremake_abstract(
        original_title=bundle["original_title"],
        original_abstract=bundle["original_abstract"],
        topic_hint=cleaned_full_text[:4000],
    )
    return {
        **bundle,
        "remade_abstract": remade,
    }


def heuristic_title_abstract_bundle(cleaned_full_text: str) -> Dict[str, Any]:
    """No-LLM fallback for title/abstract bundle when the main pipeline fails."""
    t = _fallback_title(cleaned_full_text)
    a = _fallback_abstract(cleaned_full_text)
    return {
        "original_title": t,
        "original_abstract": a,
        "remade_abstract": (a[:2800] + "…") if len(a) > 2800 else a,
    }
