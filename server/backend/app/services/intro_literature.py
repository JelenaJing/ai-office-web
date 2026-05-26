"""
Build literature pool for introduction remake: OpenAlex + tier-1 journal allowlist.
Introduction-only: NFTCORE-style mix (70% cited_by_count + 30% publication_date), abstracts required, early-stop pagination.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Set, Tuple

from app.services.openalex_client import OpenAlexClient
from app.services.tier1_journals import (
    get_allowed_source_ids,
    work_matches_allowlist,
    venue_display_name,
    work_source_id,
)

logger = logging.getLogger(__name__)

# Introduction pool tuning (does not affect other OpenAlex callers)
INTRO_PER_PAGE = 200
INTRO_MAX_RAW_PER_ARM = 350
QUALITY_RATIO = 0.7


def _abstract_from_work(paper: Dict[str, Any]) -> str:
    if paper.get("abstract"):
        return str(paper.get("abstract", ""))
    inv = paper.get("abstract_inverted_index")
    if isinstance(inv, dict) and inv:
        try:
            words: List[Tuple[int, str]] = []
            for word, positions in inv.items():
                for pos in positions:
                    words.append((pos, word))
            words.sort()
            return " ".join(w[1] for w in words)
        except Exception:
            pass
    return ""


def work_to_pool_item(paper: Dict[str, Any], pool_index: int) -> Dict[str, Any] | None:
    title = paper.get("title", "")
    if not title or title == "Untitled":
        return None

    authorships = paper.get("authorships", [])
    authors_list = []
    for authorship in authorships[:5]:
        author_info = authorship.get("author", {})
        display_name = author_info.get("display_name", "")
        if display_name:
            authors_list.append(display_name)
    authors_str = ", ".join(authors_list) if authors_list else "Unknown Author"
    if len(authorships) > 5:
        authors_str += " et al."

    publication_year = paper.get("publication_year")
    if not publication_year:
        publication_date = paper.get("publication_date", "")
        if publication_date:
            try:
                from datetime import datetime as dt

                publication_year = dt.strptime(publication_date[:10], "%Y-%m-%d").year
            except Exception:
                pass
    year_str = str(publication_year) if publication_year else "N/A"

    doi = paper.get("doi", "") or ""
    if doi.startswith("https://doi.org/"):
        doi = doi.replace("https://doi.org/", "")
    elif doi.startswith("http://doi.org/"):
        doi = doi.replace("http://doi.org/", "")

    abstract = _abstract_from_work(paper)
    wid = paper.get("id") or ""
    venue = venue_display_name(paper)
    citation = f"{authors_str} ({year_str}). {title}."
    if venue:
        citation += f" {venue}."
    if doi:
        citation += f" https://doi.org/{doi}"

    return {
        "pool_index": pool_index,
        "openalex_id": wid,
        "source_id": work_source_id(paper),
        "venue": venue,
        "citation": citation,
        "title": title,
        "authors": authors_str,
        "year": year_str,
        "publication_year": publication_year,
        "doi": doi,
        "abstract": abstract,
        "has_abstract": bool(abstract),
    }


def _work_id(w: Dict[str, Any]) -> str:
    return (w.get("id") or "").strip()


def _eligible_for_intro_pool(work: Dict[str, Any], allowed: Set[str]) -> bool:
    if not work_matches_allowlist(work, allowed):
        return False
    if not _abstract_from_work(work).strip():
        return False
    t = work.get("title", "")
    if not t or t == "Untitled":
        return False
    return True


def _collect_intro_arm(
    client: OpenAlexClient,
    topic: str,
    min_publication_year: int,
    sort: str,
    allowed: Set[str],
    stop_after_eligible: int,
    max_raw: int,
    per_page: int = INTRO_PER_PAGE,
) -> Tuple[List[Dict[str, Any]], int]:
    """
    Paginate OpenAlex until we have stop_after_eligible eligible works (tier1 + abstract)
    or raw cap / empty page.
    """
    eligible: List[Dict[str, Any]] = []
    seen_in_arm: Set[str] = set()
    raw_scanned = 0
    page = 1

    while raw_scanned < max_raw and len(eligible) < stop_after_eligible:
        results = client.fetch_intro_filtered_page(
            topic=topic,
            page=page,
            min_publication_year=min_publication_year,
            sort=sort,
            per_page=per_page,
        )
        if not results:
            break
        raw_scanned += len(results)
        for w in results:
            wid = _work_id(w)
            if not wid or wid in seen_in_arm:
                continue
            seen_in_arm.add(wid)
            if not _eligible_for_intro_pool(w, allowed):
                continue
            eligible.append(w)
            if len(eligible) >= stop_after_eligible:
                break
        if len(results) < per_page:
            break
        if len(eligible) >= stop_after_eligible:
            break
        page += 1

    logger.info(
        f"[IntroPool] arm sort={sort!r} topic={topic[:80]!r}… eligible={len(eligible)} raw_scanned={raw_scanned}"
    )
    return eligible, raw_scanned


def _merge_quality_recent(
    quality_eligible: List[Dict[str, Any]],
    recent_eligible: List[Dict[str, Any]],
    pool_target: int,
    quality_target: int,
) -> List[Dict[str, Any]]:
    """NFTCORE-style: fill quality quota first, then recent, then overflow from both lists."""
    picked: List[Dict[str, Any]] = []
    ids: Set[str] = set()

    def add(w: Dict[str, Any]) -> None:
        wid = _work_id(w)
        if not wid or wid in ids or len(picked) >= pool_target:
            return
        ids.add(wid)
        picked.append(w)

    for w in quality_eligible:
        if len(picked) >= quality_target:
            break
        add(w)
    for w in recent_eligible:
        if len(picked) >= pool_target:
            break
        add(w)
    for w in quality_eligible:
        if len(picked) >= pool_target:
            break
        add(w)
    for w in recent_eligible:
        if len(picked) >= pool_target:
            break
        add(w)
    return picked


def _dual_arm_for_topic(
    client: OpenAlexClient,
    topic: str,
    min_publication_year: int,
    allowed: Set[str],
    pool_target: int,
    quality_target: int,
    recent_target: int,
    max_raw_per_arm: int,
) -> Tuple[List[Dict[str, Any]], int, int]:
    stop_q = min(quality_target + 20, pool_target + 25)
    stop_r = min(recent_target + 20, pool_target + 25)
    q_el, rq = _collect_intro_arm(
        client,
        topic,
        min_publication_year,
        "cited_by_count:desc",
        allowed,
        stop_q,
        max_raw_per_arm,
    )
    r_el, rr = _collect_intro_arm(
        client,
        topic,
        min_publication_year,
        "publication_date:desc",
        allowed,
        stop_r,
        max_raw_per_arm,
    )
    merged = _merge_quality_recent(q_el, r_el, pool_target, quality_target)
    return merged, rq, rr


def build_allowlisted_pool(
    topic: str,
    min_publication_year: int,
    max_papers_for_llm: int,
    second_pass_topic: str | None = None,
    max_raw_per_arm: int = INTRO_MAX_RAW_PER_ARM,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Fetch OpenAlex with two sorts (highly cited + recent), tier-1 allowlist, require abstract.
    Early-stop per arm; target size = max_papers_for_llm (default 100 from API).
    """
    return _build_allowlisted_pool_impl(
        topic,
        min_publication_year,
        max_papers_for_llm,
        second_pass_topic,
        max_raw_per_arm=max_raw_per_arm,
    )


def _build_allowlisted_pool_impl(
    topic: str,
    min_publication_year: int,
    max_papers_for_llm: int,
    second_pass_topic: str | None,
    *,
    max_raw_per_arm: int,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    pool_target = max(1, min(max_papers_for_llm, 200))
    quality_target = max(1, int(round(pool_target * QUALITY_RATIO)))
    recent_target = pool_target - quality_target

    allowed = get_allowed_source_ids()
    client = OpenAlexClient()
    meta: Dict[str, Any] = {
        "topic_queries": [],
        "min_publication_year": min_publication_year,
        "max_papers_for_llm": pool_target,
        "raw_scanned": 0,
        "allowlisted_hits": 0,
        "quality_ratio_target": QUALITY_RATIO,
        "quality_slot_target": quality_target,
        "recent_slot_target": recent_target,
        "per_topic_stats": [],
    }

    picked: List[Dict[str, Any]] = []
    picked_ids: Set[str] = set()

    def absorb_candidates(candidates: List[Dict[str, Any]]) -> None:
        for w in candidates:
            wid = _work_id(w)
            if not wid or wid in picked_ids or len(picked) >= pool_target:
                continue
            picked_ids.add(wid)
            picked.append(w)

    def run_topic(t: str) -> None:
        t = (t or "").strip()
        if not t:
            return
        if t in meta["topic_queries"]:
            return
        meta["topic_queries"].append(t)
        merged, rq, rr = _dual_arm_for_topic(
            client,
            t,
            min_publication_year,
            allowed,
            pool_target,
            quality_target,
            recent_target,
            max_raw_per_arm,
        )
        meta["raw_scanned"] += rq + rr
        meta["per_topic_stats"].append(
            {"topic": t, "raw_quality_arm": rq, "raw_recent_arm": rr, "merged_candidates": len(merged)}
        )
        absorb_candidates(merged)

    run_topic(topic)

    if len(picked) < pool_target and second_pass_topic and second_pass_topic.strip() != topic.strip():
        run_topic(second_pass_topic.strip())

    if len(picked) < pool_target and topic.strip():
        words = topic.split()
        if len(words) > 2:
            minimal2 = " ".join(words[:2])
            if minimal2 != topic.strip():
                run_topic(minimal2)
        if len(picked) < pool_target and words:
            w0 = words[0]
            if w0 and w0 != topic.strip():
                run_topic(w0)

    pool: List[Dict[str, Any]] = []
    for w in picked[:pool_target]:
        item = work_to_pool_item(w, pool_index=len(pool) + 1)
        if item and item.get("abstract"):
            pool.append(item)

    meta["allowlisted_hits"] = len(pool)

    if len(pool) < pool_target:
        logger.info(
            f"[IntroPool] Partial pool: got {len(pool)}/{pool_target} (tier1+abstract); "
            f"introduction remake will use available papers. topics_tried={meta['topic_queries']!r}"
        )

    return pool, meta
