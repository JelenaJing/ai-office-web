"""
Introduction Remake: extract intro, build tier-1-only literature pool, rewrite with citations.
"""
from __future__ import annotations

import asyncio
import json
import logging
import re
from typing import Any, Dict, Iterator, List, Optional, Tuple

from openai import OpenAI

from app.config import (
    DEEPSEEK_API_KEY,
    DEEPSEEK_BASE_URL,
    DEEPSEEK_MAX_OUTPUT_TOKENS,
    DEEPSEEK_MODEL,
)
from app.services.text_cleaner import extract_clean_text
from app.services.paper_processor import PaperProcessor
from app.services.intro_literature import build_allowlisted_pool
from app.services.tier1_journals import allowed_journals_metadata
from app.agents.content_checker import extract_topic_from_text
from app.services.llm_stream import format_sse, format_sse_json

logger = logging.getLogger(__name__)


def get_client() -> OpenAI:
    return OpenAI(api_key=DEEPSEEK_API_KEY, base_url=DEEPSEEK_BASE_URL)


def _strip_json_fence(text: str) -> str:
    t = text.strip()
    if t.startswith("```"):
        t = re.sub(r"^```(?:json)?\n?", "", t)
        t = re.sub(r"\n?```$", "", t)
    return t.strip()


def _split_paragraph_blocks(text: str) -> List[str]:
    return [p.strip() for p in re.split(r"\n\s*\n", (text or "").strip()) if p.strip()]


def _join_introduction_extract_payload(data: Dict[str, Any]) -> str:
    """Build intro string from LLM JSON (paragraphs[] preferred, introduction string legacy)."""
    paras = data.get("paragraphs")
    if isinstance(paras, list) and paras:
        parts = [str(p).strip() for p in paras if str(p).strip()]
        if parts:
            return "\n\n".join(parts)
    intro = (data.get("introduction") or "").strip()
    if intro:
        blocks = _split_paragraph_blocks(intro)
        return "\n\n".join(blocks) if len(blocks) > 1 else intro
    return ""


def extract_introduction_from_full_text(full_text: str) -> str:
    """LLM: locate Introduction section boundaries; return text with paragraph breaks (\\n\\n)."""
    if not full_text or not full_text.strip():
        raise ValueError("全文为空，无法自动提取 Introduction")
    cap = 120_000
    body = full_text[:cap] if len(full_text) > cap else full_text
    client = get_client()
    prompt = f"""You are assisting with academic paper segmentation.

From the following paper full text (possibly with PDF extraction noise), extract ONLY the Introduction section body.

Rules:
- Start after a heading such as Introduction, INTRODUCTION, 引言, or implicit start if clearly the intro before Methods/Results.
- Stop before the next major section (e.g. Methods, Experimental, Results, Theory, Related Work as a new section after intro — use judgment).
- PDF text often has hard line breaks mid-sentence: merge those into normal paragraphs; do not invent new claims.
- Split the introduction into **logical paragraphs** (multiple elements when the section is substantial—typically 2+ for full papers).
- Return JSON only (no markdown fences), schema:
  {{"paragraphs": ["first paragraph ...", "second paragraph ...", ...]}}
- Legacy fallback allowed: {{"introduction": "..."}} as a single string if splitting is impossible (rare).
- If you cannot find an introduction, return {{"paragraphs": []}} or {{"introduction": ""}}.

Paper text:
{body}
"""
    resp = client.chat.completions.create(
        model=DEEPSEEK_MODEL,
        messages=[
            {"role": "system", "content": 'You output only valid JSON with "paragraphs" preferred.'},
            {"role": "user", "content": prompt},
        ],
        max_tokens=8000,
        temperature=0.2,
    )
    raw = resp.choices[0].message.content or ""
    try:
        data = json.loads(_strip_json_fence(raw))
    except json.JSONDecodeError as e:
        logger.warning(f"[IntroRemake] intro JSON parse failed: {e}")
        raise ValueError("无法解析 Introduction 提取结果，请改用手动选取 Introduction 文本") from e
    intro = _join_introduction_extract_payload(data)
    if not intro:
        raise ValueError("未能从全文中定位 Introduction，请改用手动选取 Introduction 文本")
    return intro


def _clamp_openalex_query(query: str, max_words: int = 6) -> str:
    """Keep a short OpenAlex `search` string (long queries hurt recall under journal filters)."""
    q = " ".join((query or "").split())
    if not q:
        return q
    words = q.split()
    if len(words) <= max_words:
        return q
    return " ".join(words[:max_words])


def _fallback_search_query_from_intro(intro_text: str) -> str:
    """If LLM fails: reuse content_checker topic string, then truncate to a few tokens."""
    raw = (extract_topic_from_text(intro_text) or "").strip()
    if not raw:
        return ""
    return _clamp_openalex_query(raw, max_words=5)


def extract_topic_and_min_year(intro_text: str) -> Tuple[str, int]:
    """
    Produce a **short** English OpenAlex `search` query + minimum publication year.

    Matches NFTCORE openalex.OpenAlexFetcher._extract_topic_and_persons idea: compress user/intro
    text to a few core keywords before search—do not pass long phrases or pseudo-titles.
    """
    client = get_client()
    prompt = f"""You analyze a paper introduction for downstream OpenAlex literature search.

From the text below, extract JSON with:
1) "openalex_search": a VERY SHORT English search string for OpenAlex **works** search.
   - Use ONLY 2 to 5 content words (or one short phrase of at most 6 words total).
   - Pick the single most important research concepts (e.g. "aggregation-induced emission organic room temperature phosphorescence").
   - Do NOT paste the paper title, do NOT copy full sentences, do NOT list every acronym—at most one well-known acronym if essential.
2) "persons": researcher names mentioned (0-3 names), for optional disambiguation in search; use [] if none.
3) "paper_publication_year": best estimate of THIS paper's publication year (integer), or null if unknown.
4) "category": exactly one of: Biological sciences | Chemistry | Earth & environmental sciences | Health sciences | Physical sciences

Return JSON only:
{{"openalex_search": "...", "persons": [], "paper_publication_year": 2020, "category": "Chemistry"}}

Introduction text:
{intro_text[:12000]}
"""
    resp = client.chat.completions.create(
        model=DEEPSEEK_MODEL,
        messages=[
            {
                "role": "system",
                "content": "You output only valid JSON. openalex_search must stay short (few keywords only).",
            },
            {"role": "user", "content": prompt},
        ],
        max_tokens=400,
        temperature=0.2,
    )
    raw = resp.choices[0].message.content or ""
    try:
        data = json.loads(_strip_json_fence(raw))
    except json.JSONDecodeError:
        logger.warning("[IntroRemake] literature meta JSON parse failed, using fallback keywords")
        fq = _fallback_search_query_from_intro(intro_text)
        return (fq if fq else intro_text[:80].strip(), 2015)

    core = (data.get("openalex_search") or data.get("topic") or "").strip()
    persons = data.get("persons") or []
    if not isinstance(persons, list):
        persons = []
    persons = [str(p).strip() for p in persons if str(p).strip()][:3]

    if not core:
        core = _fallback_search_query_from_intro(intro_text)

    combined = core
    if persons:
        combined = f"{core} {' '.join(persons)}".strip()

    combined = _clamp_openalex_query(combined, max_words=8)
    if not combined:
        combined = _fallback_search_query_from_intro(intro_text) or intro_text[:80].strip()

    py = data.get("paper_publication_year")
    try:
        year = int(py) if py is not None else 2015
    except (TypeError, ValueError):
        year = 2015
    year = max(1990, min(year, 2035))

    logger.info(
        f"[IntroRemake] OpenAlex search query (compressed): {combined!r}, year>={year}, persons={persons}"
    )
    return combined, year


def _extract_semantic_citation_map(
    remade_intro: str,
    references: List[Dict[str, Any]],
    pool: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    从第一次生成的 introduction 中提取「引用 ↔ 论点」语义映射。
    用 LLM 分析每个引用服务于哪个论点，返回稳定的语义绑定关系。

    返回:
    [
      {
        "argument": "论点简述",
        "citations": [1, 2],         # sequential reference_number
        "role": "support / contrast / motivate / extend / establish background",
        "ordering_hint": "grouped / spread"
      }, ...
    ]
    """
    ref_block = "\n".join(
        f"[{r['reference_number']}] {r.get('title', '')} ({r.get('year', '')}). {r.get('venue', '')}"
        for r in references
    )
    client = get_client()
    prompt = f"""Analyze the following introduction and extract a semantic citation map.

For each distinct **argument / claim / topic** in the introduction, identify:
1. "argument": A concise description of the argument or topic (1-2 sentences, in English)
2. "citations": The sequential reference numbers [n] that are cited for this argument, in their order of appearance
3. "role": How these citations serve this argument. Use one of: "establish background", "identify gap", "support claim", "contrast with", "motivate approach", "provide evidence", "extend prior work"
4. "ordering_hint": "grouped" if the citations appear together in one place, "spread" if they appear across multiple sentences

IMPORTANT:
- Every citation [n] in the text must appear in EXACTLY ONE argument entry — no duplicates, no omissions.
- Preserve the logical order of arguments as they appear in the introduction.
- The result will be used as a FIXED constraint for future rewrites — be precise and stable.

Return ONLY a valid JSON array, no markdown fences, no explanation.

=== REFERENCES ===
{ref_block}

=== INTRODUCTION ===
{remade_intro}

=== JSON OUTPUT ==="""

    resp = client.chat.completions.create(
        model=DEEPSEEK_MODEL,
        messages=[
            {"role": "system", "content": "You output only valid JSON arrays."},
            {"role": "user", "content": prompt},
        ],
        max_tokens=4000,
        temperature=0.15,
    )
    raw = resp.choices[0].message.content or ""
    cleaned = _strip_json_fence(raw)
    result = json.loads(cleaned)
    if not isinstance(result, list):
        raise ValueError("semantic citation map is not a list")
    return result


def _build_citation_constraint_block(semantic_map: List[Dict[str, Any]]) -> str:
    """将语义映射构建为 prompt 约束文本块。"""
    if not semantic_map:
        return ""
    lines = []
    for i, entry in enumerate(semantic_map, 1):
        refs = ", ".join(str(c) for c in entry.get("citations", []))
        lines.append(
            f"  {i}. Argument: {entry.get('argument', '')}\n"
            f"     Citations: [{refs}]\n"
            f"     Role: {entry.get('role', '')}\n"
            f"     Grouping: {entry.get('ordering_hint', 'grouped')}"
        )
    constraint = "\n".join(lines)
    return f"""
=== SEMANTIC CITATION CONSTRAINT (MUST FOLLOW) ===
Below is the FIXED mapping between ARGUMENTS and CITATIONS from a prior analysis.
Each argument must cite the listed references. Rules:
- Each argument's citations must stay TOGETHER with that argument's discussion.
- The relative order of arguments must be preserved.
- Within each argument, citation order is FIXED — do not reorder.
- Do NOT reassign a citation to a different argument.
- You may freely restructure sentences and paragraphs, but the semantic binding is fixed.

{constraint}
=== END CITATION CONSTRAINT ===
"""


def _pool_prompt_block(pool: List[Dict[str, Any]], abstract_max: int = 900) -> str:
    lines = []
    for p in pool:
        idx = p["pool_index"]
        ab = (p.get("abstract") or "")[:abstract_max]
        lines.append(
            f"[{idx}] {p.get('title', '')}\n"
            f"    Venue: {p.get('venue', '')}\n"
            f"    Authors: {p.get('authors', '')} | Year: {p.get('year', '')} | DOI: {p.get('doi', '')}\n"
            f"    Abstract: {ab}\n"
        )
    return "\n".join(lines)


_ORIG_CITE_TOKEN_RE = re.compile(r"\[(.*?)\]")


def _count_words_rough(text: str) -> int:
    """Rough word count for English-centric intro text."""
    if not text:
        return 0
    return len(re.findall(r"[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*", text))


def _extract_original_reference_indices(text: str) -> List[int]:
    """
    Extract citation indices from original introduction.
    Supports forms like [1], [1,2], [1-3], [1–3], [1—3].
    """
    out: List[int] = []
    for m in _ORIG_CITE_TOKEN_RE.finditer(text or ""):
        inner = m.group(1).strip()
        if not inner:
            continue
        for token in inner.split(","):
            t = token.strip()
            if not t:
                continue
            # normalize various dashes
            t = t.replace("–", "-").replace("—", "-")
            if "-" in t:
                a, b = t.split("-", 1)
                a = a.strip()
                b = b.strip()
                if a.isdigit() and b.isdigit():
                    ia = int(a)
                    ib = int(b)
                    if ia <= ib:
                        out.extend(range(ia, ib + 1))
                    else:
                        out.extend(range(ib, ia + 1))
                continue
            if t.isdigit():
                out.append(int(t))
    return out


def _derive_intro_rewrite_targets(original_intro: str) -> Dict[str, int]:
    """
    Soft targets for rewrite quality:
    - min_output_words: floor(original_words, 100)
    - citation range: original_distinct_refs +/- 5
    - paragraph range: from original \\n\\n blocks, clamped
    """
    original_words = _count_words_rough(original_intro)
    min_output_words = (original_words // 100) * 100
    if original_words > 0 and min_output_words <= 0:
        min_output_words = original_words

    orig_ref_set = sorted(set(_extract_original_reference_indices(original_intro)))
    orig_ref_count = len(orig_ref_set)
    citation_min = max(1, orig_ref_count - 5) if orig_ref_count > 0 else 1
    citation_max = max(citation_min, orig_ref_count + 5) if orig_ref_count > 0 else 8

    para_blocks = _split_paragraph_blocks(original_intro)
    base_p = len(para_blocks) if para_blocks else 1
    min_paragraphs = max(2, min(base_p, 20))
    max_paragraphs = min(max(min_paragraphs + 5, int(min_paragraphs * 1.5) + 1), 24)

    return {
        "original_intro_word_count": original_words,
        "min_output_words": min_output_words,
        "original_ref_count": orig_ref_count,
        "target_citation_min": citation_min,
        "target_citation_max": citation_max,
        "min_paragraphs": min_paragraphs,
        "max_paragraphs": max_paragraphs,
    }


def _remade_intro_from_parsed(parsed: Dict[str, Any]) -> Tuple[str, List[str]]:
    """
    Canonical remade body: join structured paragraphs; fall back to legacy string fields.
    Returns (joined_text, paragraph_list).
    """
    paras = parsed.get("remade_paragraphs")
    if isinstance(paras, list) and paras:
        parts = [str(p).strip() for p in paras if str(p).strip()]
        if parts:
            return "\n\n".join(parts), parts
    legacy = (parsed.get("remade_introduction") or "").strip()
    if legacy:
        blocks = _split_paragraph_blocks(legacy)
        if len(blocks) > 1:
            return "\n\n".join(blocks), blocks
        return legacy, [legacy]
    return "", []


def _iter_chunk_text(text: str, *, chunk_size: int = 80) -> Iterator[str]:
    if not text:
        return
    for i in range(0, len(text), chunk_size):
        yield text[i : i + chunk_size]


def _rewrite_intro_llm(
    original_intro: str,
    pool: List[Dict[str, Any]],
    allowed_labels: List[Dict[str, Any]],
    context: Optional[str],
    rewrite_targets: Optional[Dict[str, int]] = None,
    extra_user_instruction: Optional[str] = None,
    citation_constraint: str = "",
) -> Dict[str, Any]:
    n = len(pool)
    client = get_client()
    journals_lines = "\n".join(
        f"- {j.get('label', '')}: {len(j.get('source_ids', []))} OpenAlex source id(s)"
        for j in allowed_labels
    )
    ctx = f"\nAdditional user context:\n{context}\n" if context else ""
    targets = rewrite_targets or {}
    min_p = int(targets.get("min_paragraphs", 2))
    max_p = int(targets.get("max_paragraphs", max(min_p + 3, 6)))
    target_block = ""
    if targets:
        target_block = (
            "\nSoft output targets (try your best, not strict hard constraints):\n"
            f"- Original introduction word count (approx): {targets.get('original_intro_word_count', 0)}\n"
            f"- Minimum words for rewritten introduction (rounded floor): {targets.get('min_output_words', 0)}\n"
            f"- Distinct in-text citation count target range: {targets.get('target_citation_min', 1)} to {targets.get('target_citation_max', 8)}\n"
            f"- Paragraph count: produce between {min_p} and {max_p} paragraphs in remade_paragraphs (each item one paragraph).\n"
            "- Keep scientific quality first; if conflict occurs, prioritize coherence and factuality from pool abstracts.\n"
        )
    extra = ""
    if extra_user_instruction:
        extra = f"\nAdditional instruction (must satisfy):\n{extra_user_instruction}\n"
    prompt = f"""You are an expert scientific editor.

Task: Rewrite the Introduction so it naturally continues the same scientific narrative, but incorporates recent progress AFTER the original paper's time, using ONLY the provided literature pool. Every in-text citation MUST use square-bracket numbers [k] where k is the pool_index (1..{n}) of a paper listed below. You may use as many distinct citations as needed; all must come from this pool only.

Structure: Output the rewritten introduction as **remade_paragraphs**: an array of strings. Each string is one paragraph (no embedded newlines inside a paragraph). Citations [k] may appear in any paragraph. Use {min_p} to {max_p} paragraphs.

Tier-1 journals policy (already enforced by the pool):
{journals_lines}

Original introduction:
{original_intro[:20000]}
{ctx}

Literature pool (ONLY valid citation targets):
{_pool_prompt_block(pool)}
{target_block}
{extra}

Requirements:
1) Scientific, fluent, coherent with the original motivation and gap framing.
2) Add/update narrative using evidence from the pool abstracts; do not claim specifics absent from abstracts.
3) Fix or remove clearly inappropriate citations from the original (misattributed, irrelevant, redundant) — document in original_reference_audit.
4) Output valid JSON only (no markdown fences), schema:
{{
  "remade_paragraphs": [
    "First paragraph text with [1] style citations ...",
    "Second paragraph ..."
  ],
  "references": [
    {{"pool_index": 1, "note": "optional short note"}}
  ],
  "continuity_notes": "how the rewrite connects to the original",
  "original_reference_audit": [
    {{"issue": "...", "action": "removed|replaced|kept", "detail": "..."}}
  ]
}}

The "references" array should list every pool_index you cited at least once, in order of first appearance across remade_paragraphs (concatenated in array order).
{citation_constraint}
"""
    resp = client.chat.completions.create(
        model=DEEPSEEK_MODEL,
        messages=[
            {"role": "system", "content": "You output only valid JSON. Citations must only use pool indices 1..N."},
            {"role": "user", "content": prompt},
        ],
        max_tokens=DEEPSEEK_MAX_OUTPUT_TOKENS,
        temperature=0.35,
    )
    raw = resp.choices[0].message.content or ""
    try:
        return json.loads(_strip_json_fence(raw))
    except json.JSONDecodeError as e:
        logger.error(f"[IntroRemake] rewrite JSON parse failed: {e}")
        raise ValueError("模型返回的 Introduction 重写结果不是合法 JSON，请重试") from e


# In-text citations like [12] or [14, 53] (pool_index from LLM, before sequential remap)
_IN_TEXT_CITE_RE = re.compile(r"\[((?:\s*\d+\s*,)*\s*\d+)\]")


def _split_bracket_citation_indices(inner: str) -> List[int]:
    out: List[int] = []
    for part in inner.split(","):
        p = part.strip()
        if p.isdigit():
            out.append(int(p))
    return out


def _citation_indices_in_text(text: str) -> List[int]:
    """All integers appearing inside citation brackets (pool or sequential)."""
    out: List[int] = []
    for m in _IN_TEXT_CITE_RE.finditer(text):
        out.extend(_split_bracket_citation_indices(m.group(1)))
    return out


def remap_introduction_citations_pool_to_sequential(
    text: str, pool: List[Dict[str, Any]]
) -> Tuple[str, List[int]]:
    """
    Replace pool_index-style brackets with 1..K by order of first appearance (normal paper style).
    Returns (new_text, pool_indices_in_reference_list_order) where ref [i] = pool_indices_in_reference_list_order[i-1].
    """
    valid_pool = {int(p["pool_index"]) for p in pool if p.get("pool_index") is not None}
    pool_to_seq: Dict[int, int] = {}
    seq_pool_order: List[int] = []

    def seq_for_pool(pi: int) -> int:
        if pi not in valid_pool:
            return pi  # unchanged token; validation may fail later
        if pi not in pool_to_seq:
            pool_to_seq[pi] = len(seq_pool_order) + 1
            seq_pool_order.append(pi)
        return pool_to_seq[pi]

    parts: List[str] = []
    pos = 0
    for m in _IN_TEXT_CITE_RE.finditer(text):
        parts.append(text[pos : m.start()])
        inner = m.group(1)
        pis = _split_bracket_citation_indices(inner)
        if not pis:
            parts.append(m.group(0))
        else:
            mapped: List[str] = []
            for pi in pis:
                s = seq_for_pool(pi)
                mapped.append(str(s))
            parts.append("[" + ", ".join(mapped) + "]")
        pos = m.end()
    parts.append(text[pos:])
    return "".join(parts), seq_pool_order


def _validate_sequential_citations(text: str, k: int) -> Tuple[bool, List[str]]:
    errs: List[str] = []
    if k <= 0:
        return True, []
    for m in _IN_TEXT_CITE_RE.finditer(text):
        for n in _split_bracket_citation_indices(m.group(1)):
            if n < 1 or n > k:
                errs.append(f"citation [{n}] out of sequential range 1..{k}")
    return len(errs) == 0, errs


def _validate_citations(remade: str, pool: List[Dict[str, Any]]) -> Tuple[bool, List[str]]:
    errs: List[str] = []
    n = len(pool)
    if n == 0:
        return False, ["empty pool"]
    for k in _citation_indices_in_text(remade):
        if k < 1 or k > n:
            errs.append(f"citation [{k}] out of range 1..{n}")
    return len(errs) == 0, errs


def _canonicalize_intro_output(
    remade_text: str,
    original_introduction: str,
    pool: List[Dict[str, Any]],
    allowed_meta: List[Dict[str, Any]],
    context: Optional[str],
) -> Tuple[str, List[Dict[str, Any]], str, List[Dict[str, Any]]]:
    """
    Single canonical path for final intro output:
    1) remap pool-index citations -> sequential [1..K]
    2) validate sequential citations
    3) finalize metadata (continuity/audit) with fixed citation mapping
    4) build enriched references list (reference_number + pool_index)
    """
    remade_seq, cite_pool_order = remap_introduction_citations_pool_to_sequential(remade_text, pool)
    ok_seq, errs_seq = _validate_sequential_citations(remade_seq, len(cite_pool_order))
    if not ok_seq:
        raise ValueError(f"引用顺序编号校验失败: {'; '.join(errs_seq)}")

    parsed = _finalize_intro_metadata(
        remade_seq,
        original_introduction,
        pool,
        allowed_meta,
        context,
        citation_pool_order=cite_pool_order,
    )
    refs_raw = parsed.get("references") or []
    if not isinstance(refs_raw, list):
        refs_raw = []
    references = _enrich_references(refs_raw, pool)
    return (
        remade_seq,
        references,
        parsed.get("continuity_notes") or "",
        parsed.get("original_reference_audit") or [],
    )


def _rewrite_intro_resolve_remade(
    original_introduction: str,
    pool: List[Dict[str, Any]],
    allowed_meta: List[Dict[str, Any]],
    context: Optional[str],
    rewrite_targets: Dict[str, int],
    citation_constraint: str = "",
) -> str:
    """
    Call rewrite LLM (up to 2 attempts) until citations validate and paragraph count meets min_paragraphs.
    Returns joined introduction text (pool-index citations).
    """
    min_p = int(rewrite_targets.get("min_paragraphs", 2))
    max_p = int(rewrite_targets.get("max_paragraphs", min_p + 3))
    extra: Optional[str] = None
    last_issue = ""
    for attempt in range(2):
        parsed = _rewrite_intro_llm(
            original_introduction,
            pool,
            allowed_meta,
            context,
            rewrite_targets,
            extra_user_instruction=extra,
            citation_constraint=citation_constraint,
        )
        remade, paras = _remade_intro_from_parsed(parsed)
        if not remade:
            last_issue = "empty remade_paragraphs"
            extra = "Return valid JSON with a non-empty remade_paragraphs array (each element one paragraph string)."
            logger.warning("[IntroRemake] rewrite attempt %s: %s", attempt + 1, last_issue)
            continue
        ok, errs = _validate_citations(remade, pool)
        if not ok:
            last_issue = "; ".join(errs)
            extra = (
                f"Citation errors: {last_issue}. Use only square-bracket integers in 1..{len(pool)} matching the pool."
            )
            logger.warning("[IntroRemake] rewrite attempt %s: citation invalid", attempt + 1)
            continue
        if len(paras) < min_p:
            last_issue = f"got {len(paras)} paragraphs, need at least {min_p}"
            extra = (
                f"You returned {len(paras)} paragraph(s) in remade_paragraphs; you MUST return at least {min_p} "
                f"and at most {max_p} non-empty paragraph strings. Split content logically; do not merge everything."
            )
            logger.warning("[IntroRemake] rewrite attempt %s: %s", attempt + 1, last_issue)
            continue
        return remade
    raise ValueError(
        f"Introduction 重写未满足要求（{last_issue}）。请重试或调整 Introduction / 文献池。"
    )


def _finalize_intro_metadata(
    remade_introduction: str,
    original_introduction: str,
    pool: List[Dict[str, Any]],
    allowed_labels: List[Dict[str, Any]],
    context: Optional[str],
    citation_pool_order: Optional[List[int]] = None,
) -> Dict[str, Any]:
    """Second pass: continuity notes + audit (JSON). References are built deterministically when citation_pool_order is set."""
    n = len(pool)
    client = get_client()
    ctx = f"\nUser context:\n{context}\n" if context else ""
    if citation_pool_order is not None:
        k = len(citation_pool_order)
        mapping_lines = "\n".join(
            f"In-text citation [{i + 1}] refers to literature pool_index {pi}"
            for i, pi in enumerate(citation_pool_order)
        )
        prompt = f"""You are assisting with bibliography metadata for an already-written introduction.

The remade introduction uses SEQUENTIAL in-text citations [1] through [{k}] (like a normal manuscript). They are NOT the raw pool slot numbers.

Mapping (do not change these numbers in your analysis):
{mapping_lines}

Remade introduction:
{remade_introduction[:24000]}

Original introduction (for audit):
{original_introduction[:12000]}
{ctx}

Literature pool (pool_index is internal; the reader sees only [1]..[{k}] above):
{_pool_prompt_block(pool, abstract_max=400)}

Return JSON only (no markdown fences). Do NOT include a "references" key.
{{
  "continuity_notes": "how the rewrite connects to the original",
  "reference_relations": [
    {{"reference_number": 1, "relation": "15-30 words: why this reference is cited in the remade introduction"}}
  ],
  "original_reference_audit": [
    {{"issue": "...", "action": "removed|replaced|kept", "detail": "..."}}
  ]
}}
`reference_number` must match in-text sequential citations [1]..[{k}]. Keep relation concise and specific.
"""
    else:
        prompt = f"""You are assisting with bibliography metadata for an already-written introduction.

Remade introduction (final text, citations [1]..[{n}] pool indices):
{remade_introduction[:24000]}

Original introduction (for audit):
{original_introduction[:12000]}
{ctx}

Literature pool indices 1..{n} correspond to:
{_pool_prompt_block(pool, abstract_max=400)}

Return JSON only (no markdown fences):
{{
  "references": [{{"pool_index": 1, "note": ""}}],
  "continuity_notes": "how the rewrite connects to the original",
  "original_reference_audit": [
    {{"issue": "...", "action": "removed|replaced|kept", "detail": "..."}}
  ]
}}
The references array must include every pool_index cited in the remade introduction, ordered by first appearance.
"""
    resp = client.chat.completions.create(
        model=DEEPSEEK_MODEL,
        messages=[
            {"role": "system", "content": "You output only valid JSON."},
            {"role": "user", "content": prompt},
        ],
        max_tokens=8000,
        temperature=0.25,
    )
    raw = resp.choices[0].message.content or ""
    try:
        data = json.loads(_strip_json_fence(raw))
    except json.JSONDecodeError:
        if citation_pool_order is not None:
            return {
                "references": [{"pool_index": pi, "note": ""} for pi in citation_pool_order],
                "reference_relations": [],
                "continuity_notes": "",
                "original_reference_audit": [],
            }
        seen_order: List[int] = []
        for k in _citation_indices_in_text(remade_introduction):
            if 1 <= k <= n and k not in seen_order:
                seen_order.append(k)
        return {
            "references": [{"pool_index": i, "note": ""} for i in seen_order],
            "reference_relations": [],
            "continuity_notes": "",
            "original_reference_audit": [],
        }
    if citation_pool_order is not None:
        relation_map: Dict[int, str] = {}
        rels = data.get("reference_relations")
        if isinstance(rels, list):
            for r in rels:
                if not isinstance(r, dict):
                    continue
                rn = r.get("reference_number")
                rel = (r.get("relation") or "").strip()
                try:
                    rn = int(rn)
                except (TypeError, ValueError):
                    continue
                if rn >= 1 and rel:
                    relation_map[rn] = rel
        data["references"] = [
            {"pool_index": pi, "note": relation_map.get(i + 1, "")}
            for i, pi in enumerate(citation_pool_order)
        ]
    return data


# ---------------------------------------------------------------------------
# Timeline figure generation for Introduction
# ---------------------------------------------------------------------------

def _generate_timeline_prompt_and_caption(
    remade_introduction: str,
    references: List[Dict[str, Any]],
    pool: List[Dict[str, Any]],
    search_topic: str,
    min_publication_year: int,
) -> Dict[str, Any]:
    """
    Based on the remade introduction, generate:
    1) An image prompt for a field development timeline figure
    2) A figure caption with overall_description and detail_description

    Returns dict with keys: image_prompt, overall_description, detail_description
    """
    # 构建 reference → pool 映射，获取 abstract
    pool_by_idx = {p["pool_index"]: p for p in pool}
    ref_lines = []
    for i, r in enumerate(references):
        pi = r.get("pool_index")
        pool_entry = pool_by_idx.get(pi, {}) if pi else {}
        abstract = (pool_entry.get("abstract") or "")[:400]
        ref_lines.append(
            f"[{r.get('reference_number', i+1)}] {r.get('authors', '')} ({r.get('year', '')}). "
            f"{r.get('title', '')}. {r.get('venue', '')}.\n"
            f"    Abstract: {abstract}"
        )
    ref_block = "\n".join(ref_lines)

    client = get_client()
    prompt = f"""You are an expert at creating academic illustration descriptions for Introduction sections.

Based on the following remade Introduction, its cited references (with abstracts), generate:
1) An **image prompt** for a timeline/development-history figure of the research field "{search_topic}" covering the period from approximately {min_publication_year} to the present.
2) A **figure caption** in two parts: overall_description and detail_description.

CRITICAL: You must base the timeline on ACTUAL research milestones extracted from the references and their abstracts below. Each milestone in the timeline should correspond to a real paper/discovery mentioned in the introduction or references. Do NOT invent milestones that are not supported by the provided content.

The image should depict:
- Timeline progression showing the chronological development based on the ACTUAL papers and discoveries in the references
- Key milestone research contributions (from the reference list) highlighted in a segmented/timeline format
- Different historical periods or research stages clearly distinguished based on the topics covered in the abstracts
- The transition from earlier foundational work to recent advances as described in the introduction

Image prompt constraints (MUST follow):
- Clean white background
- Scientific and academic style, professional journal-figure aesthetic
- Minimal text; if any text is unavoidable, use English only
- No numbers, no symbols, no equations
- No captions, labels, titles, or annotations in the image
- Clear composition with key visual elements (structures, shapes, colors, timeline flow)
- Suitable as an academic paper illustration

Caption requirements:
- overall_description: concise summary (10-20 words) of what the figure shows
- detail_description: 30-60 words providing specific details; may naturally incorporate up to 4 citation numbers [X] from the references where relevant

=== REMADE INTRODUCTION ===
{remade_introduction[:8000]}

=== REFERENCES ===
{ref_block}

Return ONLY valid JSON (no markdown fences):
{{
    "image_prompt": "detailed image generation prompt...",
    "overall_description": "...",
    "detail_description": "..."
}}"""

    resp = client.chat.completions.create(
        model=DEEPSEEK_MODEL,
        messages=[
            {"role": "system", "content": "You output only valid JSON. You are an expert at scientific illustration prompts."},
            {"role": "user", "content": prompt},
        ],
        max_tokens=1000,
        temperature=0.5,
    )
    raw = resp.choices[0].message.content or ""
    try:
        return json.loads(_strip_json_fence(raw))
    except json.JSONDecodeError:
        logger.warning("[IntroRemake] timeline prompt JSON parse failed, using fallback")
        return {
            "image_prompt": (
                f"Scientific timeline illustration showing the chronological development of {search_topic} "
                f"from {min_publication_year} to present. White background, academic style, "
                f"milestone markers, flowing progression, no text no numbers no symbols."
            ),
            "overall_description": f"Timeline of research developments in {search_topic}",
            "detail_description": (
                f"Chronological overview of key milestones and research progress in {search_topic} "
                f"from {min_publication_year} to the present, highlighting major advances and transitions."
            ),
        }


def _generate_timeline_figure(
    project_id: str,
    image_prompt: str,
) -> Optional[Dict[str, Any]]:
    """
    Submit image generation task via DrawGatewayClient. Returns image info or None on failure.
    """
    try:
        from app.services.draw_gateway_client import DrawGatewayClient
        from app.project_manager import ProjectManager as _PM

        async def _pipeline() -> Dict[str, Any]:
            draw_client = DrawGatewayClient()
            task_id = await draw_client.submit_task(
                prompt=image_prompt,
                aspect_ratio="16:9",
                model="nano-banana-pro",
                image_size="1K",
            )
            result = await draw_client.wait_for_image(
                task_id=task_id,
                timeout_seconds=180,
                poll_interval_seconds=3,
            )
            if result.status != "succeeded":
                raise RuntimeError(f"draw task failed: status={result.status}")
            if not result.image_url:
                raise RuntimeError("draw task succeeded but missing image_url")
            image_bytes = await draw_client.download_image_bytes(result.image_url)

            pm = _PM()
            saved = pm.save_generated_image(
                project_id,
                image_data=image_bytes,
                image_prompt=image_prompt,
                task_id=task_id,
                filename_prefix="intro_timeline",
            )
            rel_path = saved.get("rel_path")
            file_url = f"/api/v1/paper/{project_id}/files/{rel_path}/download" if rel_path else None
            return {
                "image_path": saved.get("abs_path"),
                "image_file_url": file_url,
                "draw_task_id": task_id,
            }

        return asyncio.run(_pipeline())
    except Exception as e:
        logger.error(f"[IntroRemake] Timeline figure generation failed: {e}", exc_info=True)
        return None


def stream_introduction_remake_sse(
    project_id: str,
    selected_text: str,
    context: Optional[str] = None,
    auto_extract_intro: bool = False,
    max_papers_for_llm: int = 100,
) -> Iterator[bytes]:
    """SSE: meta -> delta* -> done (full introduction remake payload)."""
    try:
        from app.project_manager import ProjectManager
        pm = ProjectManager()
        project_dir = pm.get_project_dir(project_id)

        allowed_meta = allowed_journals_metadata()

        if auto_extract_intro:
            proc = PaperProcessor()
            paper = proc.process_paper(project_id)
            full_text = paper.get("content") or ""
            intro_raw = extract_introduction_from_full_text(full_text)
        else:
            intro_raw = (selected_text or "").strip()
            if not intro_raw:
                yield format_sse("error", "未提供 Introduction 文本：请选中文本或开启 auto_extract_intro")
                return

        original_introduction = extract_clean_text(intro_raw)
        rewrite_targets = _derive_intro_rewrite_targets(original_introduction)

        # ---- 检查是否有已缓存的 pool + 语义引用映射 ----
        citation_cache_file = (project_dir / "intro_citation_cache.json") if project_dir else None
        cached = None
        if citation_cache_file and citation_cache_file.exists():
            try:
                cached = json.loads(citation_cache_file.read_text(encoding="utf-8"))
                logger.info("[IntroRemake] Loaded cached pool + semantic citation map for project %s", project_id)
            except Exception as e:
                logger.warning("[IntroRemake] Failed to load citation cache: %s", e)
                cached = None

        citation_constraint = ""
        if cached and cached.get("pool") and cached.get("semantic_map"):
            # 后续 remake：复用 pool 和语义映射
            pool = cached["pool"]
            pool_meta = cached.get("pool_meta", {})
            topic = cached.get("search_topic", "")
            min_year = cached.get("min_publication_year", 2015)
            semantic_map = cached["semantic_map"]
            citation_constraint = _build_citation_constraint_block(semantic_map)
            logger.info(
                "[IntroRemake] Reusing cached pool (%d papers) + semantic map (%d arguments)",
                len(pool), len(semantic_map),
            )
        else:
            # 首次 remake：检索 pool
            topic, paper_year = extract_topic_and_min_year(original_introduction)
            min_year = paper_year

            second_q = _clamp_openalex_query(f"{topic} review", max_words=8)
            paper_target = max(1, min(max_papers_for_llm, 200))
            pool, pool_meta = build_allowlisted_pool(
                topic=topic,
                min_publication_year=min_year,
                max_papers_for_llm=paper_target,
                second_pass_topic=second_q,
            )

            if not pool:
                yield format_sse(
                    "error",
                    "顶刊白名单内未检索到任何带摘要的文献，无法重写 Introduction。请调整主题/年份或扩展 tier1_journals.json。",
                )
                return

            if len(pool) < paper_target:
                logger.warning(
                    "[IntroRemake] Partial literature pool: %s/%s — continuing with available references",
                    len(pool),
                    paper_target,
                )

            pool_meta = {
                **pool_meta,
                "pool_requested": paper_target,
                "pool_actual": len(pool),
                "pool_incomplete": len(pool) < paper_target,
            }

        yield format_sse_json(
            "meta",
            {
                "job": "introduction",
                "project_id": project_id,
                "allowed_journals": allowed_meta,
                "literature_pool": pool,
                "literature_pool_meta": pool_meta,
                "original_introduction": original_introduction,
                "search_topic": topic,
                "min_publication_year": min_year,
                "stage": "remade_intro_stream",
            },
        )

        try:
            remade = _rewrite_intro_resolve_remade(
                original_introduction, pool, allowed_meta, context, rewrite_targets,
                citation_constraint=citation_constraint,
            )
        except ValueError as ex:
            yield format_sse("error", str(ex))
            return

        for frag in _iter_chunk_text(remade):
            yield format_sse("delta", frag)

        try:
            remade, references, continuity_notes, original_reference_audit = _canonicalize_intro_output(
                remade, original_introduction, pool, allowed_meta, context
            )
        except ValueError as ex:
            yield format_sse("error", str(ex))
            return

        # ---- 首次 remake 后：提取语义映射并保存缓存 ----
        if cached is None and citation_cache_file and project_dir:
            try:
                semantic_map = _extract_semantic_citation_map(remade, references, pool)
                cache_data = {
                    "pool": pool,
                    "pool_meta": pool_meta,
                    "search_topic": topic,
                    "min_publication_year": min_year,
                    "semantic_map": semantic_map,
                }
                citation_cache_file.write_text(
                    json.dumps(cache_data, ensure_ascii=False, indent=2),
                    encoding="utf-8",
                )
                logger.info(
                    "[IntroRemake] Saved citation cache: pool=%d papers, semantic_map=%d arguments",
                    len(pool), len(semantic_map),
                )
            except Exception as e:
                logger.warning("[IntroRemake] Failed to extract/save semantic citation map: %s", e)

        core = {
            "allowed_journals": allowed_meta,
            "literature_pool": pool,
            "literature_pool_meta": pool_meta,
            "original_introduction": original_introduction,
            "remade_introduction": remade,
            "references": references,
            "continuity_notes": continuity_notes,
            "original_reference_audit": original_reference_audit,
            "search_topic": topic,
            "min_publication_year": min_year,
            "rewrite_targets": rewrite_targets,
            "rewrite_achieved": {
                "output_word_count": _count_words_rough(remade),
                "distinct_citation_count": len(references),
            },
        }

        # ---- Timeline figure generation ----
        figure_info: Optional[Dict[str, Any]] = None
        try:
            yield format_sse_json("meta", {"stage": "timeline_figure", "message": "正在生成领域发展历程图 ..."})
            prompt_and_caption = _generate_timeline_prompt_and_caption(
                remade, references, pool, topic, min_year,
            )
            image_prompt = prompt_and_caption.get("image_prompt", "")
            if image_prompt:
                yield format_sse_json("meta", {"stage": "timeline_figure_draw", "message": "正在绘制图片 ...", "image_prompt": image_prompt})
                draw_result = _generate_timeline_figure(project_id, image_prompt)
                if draw_result:
                    figure_info = {
                        "image_prompt": image_prompt,
                        "overall_description": prompt_and_caption.get("overall_description", ""),
                        "detail_description": prompt_and_caption.get("detail_description", ""),
                        "image_file_url": draw_result.get("image_file_url"),
                        "draw_task_id": draw_result.get("draw_task_id"),
                    }
                    logger.info("[IntroRemake] Timeline figure generated: %s", draw_result.get("image_file_url"))
        except Exception as e:
            logger.warning("[IntroRemake] Timeline figure generation failed (non-fatal): %s", e)

        if figure_info:
            core["timeline_figure"] = figure_info

        from app.project_manager import ProjectManager as _PM
        _PM().save_remake_result(
            project_id,
            "introduction",
            {
                **core,
                "auto_extract_intro": auto_extract_intro,
                "max_papers_for_llm": max_papers_for_llm,
                "context": context,
            },
        )
        done_payload = {
            "status": "success",
            "message": "Introduction remake completed",
            **core,
        }
        yield format_sse_json("done", done_payload)
    except ValueError as e:
        yield format_sse("error", str(e))
    except Exception as e:
        logger.error(f"[IntroRemake] Stream failed: {e}", exc_info=True)
        yield format_sse("error", str(e))


def _enrich_references(
    ref_entries: List[Dict[str, Any]], pool: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    by_idx = {p["pool_index"]: p for p in pool}
    out: List[Dict[str, Any]] = []
    for ord_i, r in enumerate(ref_entries, start=1):
        pi = r.get("pool_index")
        try:
            pi = int(pi)
        except (TypeError, ValueError):
            continue
        if pi not in by_idx:
            continue
        p = by_idx[pi]
        note = (r.get("note") or "").strip()
        out.append(
            {
                "reference_number": ord_i,
                "pool_index": pi,
                "citation": p.get("citation"),
                "relevance_reason": note,
                "title": p.get("title"),
                "authors": p.get("authors"),
                "year": p.get("year"),
                "doi": p.get("doi"),
                "venue": p.get("venue"),
                "openalex_id": p.get("openalex_id"),
            }
        )
    return out


def remake_introduction(
    project_id: str,
    selected_text: str,
    context: Optional[str] = None,
    auto_extract_intro: bool = False,
    max_papers_for_llm: int = 100,
) -> Dict[str, Any]:
    from app.project_manager import ProjectManager as _PM
    pm = _PM()
    project_dir = pm.get_project_dir(project_id)

    allowed_meta = allowed_journals_metadata()

    if auto_extract_intro:
        proc = PaperProcessor()
        paper = proc.process_paper(project_id)
        full_text = paper.get("content") or ""
        intro_raw = extract_introduction_from_full_text(full_text)
    else:
        intro_raw = (selected_text or "").strip()
        if not intro_raw:
            raise ValueError("未提供 Introduction 文本：请选中文本或开启 auto_extract_intro")

    original_introduction = extract_clean_text(intro_raw)
    rewrite_targets = _derive_intro_rewrite_targets(original_introduction)

    # ---- 检查缓存 ----
    citation_cache_file = (project_dir / "intro_citation_cache.json") if project_dir else None
    cached = None
    if citation_cache_file and citation_cache_file.exists():
        try:
            cached = json.loads(citation_cache_file.read_text(encoding="utf-8"))
        except Exception:
            cached = None

    citation_constraint = ""
    if cached and cached.get("pool") and cached.get("semantic_map"):
        pool = cached["pool"]
        pool_meta = cached.get("pool_meta", {})
        topic = cached.get("search_topic", "")
        min_year = cached.get("min_publication_year", 2015)
        semantic_map = cached["semantic_map"]
        citation_constraint = _build_citation_constraint_block(semantic_map)
    else:
        topic, paper_year = extract_topic_and_min_year(original_introduction)
        min_year = paper_year

        second_q = _clamp_openalex_query(f"{topic} review", max_words=8)
        paper_target = max(1, min(max_papers_for_llm, 200))
        pool, pool_meta = build_allowlisted_pool(
            topic=topic,
            min_publication_year=min_year,
            max_papers_for_llm=paper_target,
            second_pass_topic=second_q,
        )

        if not pool:
            raise ValueError(
                "在配置的顶刊白名单内未检索到任何带摘要的文献。请调整 Introduction、补充 context，或扩展 tier1_journals.json。"
            )

        if len(pool) < paper_target:
            logger.warning(
                "[IntroRemake] Partial literature pool: %s/%s — continuing with available references",
                len(pool),
                paper_target,
            )

        pool_meta = {
            **pool_meta,
            "pool_requested": paper_target,
            "pool_actual": len(pool),
            "pool_incomplete": len(pool) < paper_target,
        }

    remade = _rewrite_intro_resolve_remade(
        original_introduction, pool, allowed_meta, context, rewrite_targets,
        citation_constraint=citation_constraint,
    )

    remade, references, continuity_notes, original_reference_audit = _canonicalize_intro_output(
        remade, original_introduction, pool, allowed_meta, context
    )

    # ---- 首次 remake 后保存缓存 ----
    if cached is None and citation_cache_file and project_dir:
        try:
            semantic_map = _extract_semantic_citation_map(remade, references, pool)
            cache_data = {
                "pool": pool,
                "pool_meta": pool_meta,
                "search_topic": topic,
                "min_publication_year": min_year,
                "semantic_map": semantic_map,
            }
            citation_cache_file.write_text(
                json.dumps(cache_data, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
        except Exception as e:
            logger.warning("[IntroRemake] Failed to save citation cache: %s", e)

    return {
        "allowed_journals": allowed_meta,
        "literature_pool": pool,
        "literature_pool_meta": pool_meta,
        "original_introduction": original_introduction,
        "remade_introduction": remade,
        "references": references,
        "continuity_notes": continuity_notes,
        "original_reference_audit": original_reference_audit,
        "search_topic": topic,
        "min_publication_year": min_year,
        "rewrite_targets": rewrite_targets,
        "rewrite_achieved": {
            "output_word_count": _count_words_rough(remade),
            "distinct_citation_count": len(references),
        },
    }
