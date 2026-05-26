"""
Full-paper CoRemake orchestration: cleaned text -> parallel workers -> sequential assembly.
"""
from __future__ import annotations

import asyncio
import logging
from typing import Any, AsyncIterator, Dict, List, Optional, Tuple

from app.agents import experiment_designer, experiment_extractor
from app.agents.introduction_remaker import extract_introduction_from_full_text, remake_introduction
from app.project_manager import ProjectManager
from app.services.fulltext_multiround import ChunkingConfig
from app.services.full_paper_remake.conclusion_writer import iter_write_conclusion_stream, write_conclusion
from app.services.full_paper_remake.fallbacks import (
    fallback_introduction_text,
    fallback_reference_lines,
    iter_fallback_introduction_stream,
)
from app.services.full_paper_remake.methods_prose import (
    fallback_methods_from_topic,
    format_methods_from_design,
    iter_fallback_methods_stream,
    iter_format_methods_from_design_stream,
)
from app.services.full_paper_remake.paper_assembler import assemble_paper_markdown, format_references_block
from app.services.full_paper_remake.parallel import run_in_thread
from app.services.full_paper_remake.results_synthetic import (
    fallback_results,
    generate_results_for_methods,
    iter_fallback_results_stream,
    iter_generate_results_stream,
)
from app.services.full_paper_remake.streaming_utils import forward_llm_token_stream, yield_text_in_chunks
from app.services.full_paper_remake.theory_prose import (
    fallback_theory,
    format_theory_section,
    iter_fallback_theory_stream,
    iter_format_theory_section_stream,
)
from app.services.full_paper_remake.title_abstract import (
    generate_coremake_abstract,
    heuristic_title_abstract_bundle,
    iter_generate_coremake_abstract_stream,
    run_title_extract_only,
)
from app.services.llm_stream import format_sse, format_sse_json
from app.services.paper_processor import PaperProcessor
from app.services.theory_fulltext_merge import run_analyze_theory_fulltext

logger = logging.getLogger(__name__)


def _sync_intro_remake(
    project_id: str,
    cleaned_full: str,
    context: Optional[str],
    max_papers_for_llm: int,
) -> Dict[str, Any]:
    intro_raw = extract_introduction_from_full_text(cleaned_full)
    return remake_introduction(
        project_id=project_id,
        selected_text=intro_raw,
        context=context,
        auto_extract_intro=False,
        max_papers_for_llm=max_papers_for_llm,
    )


def _sync_experiment_chain(project_id: str, cleaned_full: str) -> Dict[str, Any]:
    ext = experiment_extractor.extract_experiment_sections(project_id, None)
    text = (ext.get("experiment_text") or "").strip()
    skip_clean = bool(text)
    if not text:
        text = (cleaned_full or "")[:25000]
    design = experiment_designer.design_experiment(project_id, text, skip_clean=skip_clean)
    recipe = str(design.get("recipe") or "")
    ed = design.get("experiment_design") or {}
    ok = bool(ed) and "失败" not in recipe[:80]
    return {"extract": ext, "design": design, "ok": ok}


def _resolve_title_extract(
    by_name: Dict[str, Dict[str, Any]],
    cleaned: str,
    errors: List[Dict[str, str]],
) -> Tuple[str, str]:
    te = by_name.get("title_extract") or {}
    if te.get("ok") and isinstance(te.get("data"), dict):
        d = te["data"]
        ot = str(d.get("original_title") or "").strip()
        oa = str(d.get("original_abstract") or "").strip()
        if ot and oa:
            return ot, oa
    bundle = heuristic_title_abstract_bundle(cleaned)
    errors.append(
        {
            "stage": "title_extract_fallback",
            "error": str(te.get("error") or "used_heuristic"),
        }
    )
    return str(bundle.get("original_title") or ""), str(bundle.get("original_abstract") or "")


def _resolve_intro_and_refs(
    by_name: Dict[str, Dict[str, Any]],
    cleaned: str,
    remade_abstract: str,
    errors: List[Dict[str, str]],
) -> Tuple[str, List[Dict[str, Any]], Optional[List[str]]]:
    intro_body = ""
    ref_entries: List[Dict[str, Any]] = []
    intro_pl = by_name.get("introduction") or {}
    if intro_pl.get("ok") and isinstance(intro_pl.get("data"), dict):
        idata = intro_pl["data"]
        intro_body = str(idata.get("remade_introduction") or "").strip()
        ref_entries = list(idata.get("references") or [])
    if not intro_body:
        err_note = str(intro_pl.get("error") or "introduction_failed")
        intro_body = fallback_introduction_text(
            cleaned_excerpt=cleaned,
            remade_abstract=remade_abstract,
            error_note=err_note,
        )
        errors.append({"stage": "introduction_degraded", "error": err_note})

    fallback_refs: Optional[List[str]] = None
    if not ref_entries:
        fallback_refs = fallback_reference_lines(cleaned)
        if not fallback_refs:
            errors.append({"stage": "references", "error": "no_references_available"})
    return intro_body, ref_entries, fallback_refs


def _build_methods_results_theory_conclusion(
    *,
    by_name: Dict[str, Dict[str, Any]],
    cleaned: str,
    remade_abstract: str,
    intro_body: str,
    errors: List[Dict[str, str]],
) -> Tuple[str, str, str, str]:
    """Sequential LLM sections after parallel phase (sync)."""
    exp_pl = by_name.get("experiment") or {}
    methods_md = ""
    extract_summary = ""
    if exp_pl.get("ok") and isinstance(exp_pl.get("data"), dict):
        edata = exp_pl["data"]
        extract_summary = str((edata.get("extract") or {}).get("summary") or "")
        design = edata.get("design") or {}
        try:
            methods_md = format_methods_from_design(
                experiment_design=design.get("experiment_design") or {},
                recipe_markdown=str(design.get("recipe") or ""),
                extract_summary=extract_summary,
            )
        except Exception as e:
            errors.append({"stage": "methods_format", "error": str(e)})
            methods_md = fallback_methods_from_topic(cleaned, str(e))
    else:
        err_note = str(exp_pl.get("error") or "experiment_chain_failed")
        methods_md = fallback_methods_from_topic(cleaned, err_note)
        errors.append({"stage": "methods_degraded", "error": err_note})

    try:
        results_md = generate_results_for_methods(
            methods_section=methods_md,
            abstract_hint=remade_abstract,
        )
    except Exception as e:
        errors.append({"stage": "results", "error": str(e)})
        results_md = fallback_results(methods_md, str(e))

    theory_pl = by_name.get("theory") or {}
    theory_raw: Dict[str, Any] = {}
    if theory_pl.get("ok") and isinstance(theory_pl.get("data"), dict):
        theory_raw = theory_pl["data"]
    analysis = str(theory_raw.get("analysis") or "").strip()
    if analysis and not analysis.startswith("未获得可用的理论分析"):
        try:
            theory_md = format_theory_section(
                analysis_markdown=analysis,
                formulas=list(theory_raw.get("formulas") or []),
                derivation_steps=list(theory_raw.get("derivation_steps") or []),
            )
        except Exception as e:
            errors.append({"stage": "theory_format", "error": str(e)})
            theory_md = fallback_theory(cleaned, str(e))
    else:
        err_t = str(theory_pl.get("error") or theory_raw.get("warnings") or "theory_failed")
        theory_md = fallback_theory(cleaned, err_t)
        errors.append({"stage": "theory_degraded", "error": err_t})

    try:
        conclusion_md = write_conclusion(
            introduction=intro_body,
            methods=methods_md,
            results=results_md,
            theory=theory_md,
            abstract=remade_abstract,
        )
    except Exception as e:
        errors.append({"stage": "conclusion", "error": str(e)})
        conclusion_md = "## Summary\n\n*(Conclusion generation failed; please revise manually.)*\n"

    return methods_md, results_md, theory_md, conclusion_md


async def _run_parallel_jobs(
    project_id: str,
    cleaned: str,
    cfg: ChunkingConfig,
    context: Optional[str],
    max_papers_for_llm: int,
) -> Tuple[Dict[str, Dict[str, Any]], List[Dict[str, str]]]:
    errors: List[Dict[str, str]] = []

    async def job_title_extract() -> Tuple[str, Dict[str, Any], str]:
        o, data, err = await run_in_thread(lambda: run_title_extract_only(cleaned))
        return "title_extract", {"ok": o, "data": data, "error": err}, err

    async def job_intro() -> Tuple[str, Dict[str, Any], str]:
        o, data, err = await run_in_thread(
            lambda: _sync_intro_remake(project_id, cleaned, context, max_papers_for_llm)
        )
        return "introduction", {"ok": o, "data": data, "error": err}, err

    async def job_theory() -> Tuple[str, Dict[str, Any], str]:
        def _run():
            return run_analyze_theory_fulltext(project_id, cleaned, cfg, save_result=True)

        o, data, err = await run_in_thread(_run)
        return "theory", {"ok": o, "data": data, "error": err}, err

    async def job_experiment() -> Tuple[str, Dict[str, Any], str]:
        o, data, err = await run_in_thread(lambda: _sync_experiment_chain(project_id, cleaned))
        inner_ok = bool(o and isinstance(data, dict) and data.get("ok"))
        emsg = err if not o else ("" if inner_ok else "experiment_design_weak_or_empty")
        return "experiment", {"ok": inner_ok, "data": data, "error": emsg}, emsg

    gathered = await asyncio.gather(
        job_title_extract(),
        job_intro(),
        job_theory(),
        job_experiment(),
    )
    by_name: Dict[str, Dict[str, Any]] = {}
    for name, payload, err in gathered:
        by_name[name] = payload
        if not payload.get("ok"):
            errors.append({"stage": name, "error": payload.get("error") or err or "unknown"})
    return by_name, errors


async def execute_full_paper_coremake(
    project_id: str,
    *,
    force_reclean: bool = False,
    max_papers_for_llm: int = 72,
    context: Optional[str] = None,
    target_chars: int = 6000,
    overlap_chars: int = 300,
) -> Dict[str, Any]:
    """
    Run full pipeline. Returns dict with markdown, errors, sections (raw payloads for debugging).
    """
    errors: List[Dict[str, str]] = []
    proc = PaperProcessor()

    ok_clean, cleaned, clean_err = await run_in_thread(
        lambda: proc.get_paper_text(project_id, variant="cleaned", force_reclean=force_reclean)
    )
    if not ok_clean or not (cleaned or "").strip():
        msg = clean_err or "empty_cleaned_text"
        errors.append({"stage": "cleaning", "error": msg})
        md = assemble_paper_markdown(
            original_title="",
            remade_abstract="",
            introduction="",
            methods="",
            results="",
            theory="",
            conclusion="",
            reference_entries=[],
            fallback_reference_lines=[],
        )
        return {
            "status": "error",
            "markdown": md,
            "errors": errors,
            "sections": {},
        }

    cleaned = cleaned.strip()
    cfg = ChunkingConfig(target_chars=target_chars, overlap_chars=overlap_chars)
    by_name, p_errors = await _run_parallel_jobs(
        project_id, cleaned, cfg, context, max_papers_for_llm
    )
    errors.extend(p_errors)

    original_title, original_abstract = _resolve_title_extract(by_name, cleaned, errors)
    remade_abstract = generate_coremake_abstract(
        original_title=original_title,
        original_abstract=original_abstract,
        topic_hint=cleaned[:4000],
    )

    intro_body, ref_entries, fallback_refs = _resolve_intro_and_refs(
        by_name, cleaned, remade_abstract, errors
    )

    methods_md, results_md, theory_md, conclusion_md = _build_methods_results_theory_conclusion(
        by_name=by_name,
        cleaned=cleaned,
        remade_abstract=remade_abstract,
        intro_body=intro_body,
        errors=errors,
    )

    markdown = assemble_paper_markdown(
        original_title=original_title,
        remade_abstract=remade_abstract,
        introduction=intro_body,
        methods=methods_md,
        results=results_md,
        theory=theory_md,
        conclusion=conclusion_md,
        reference_entries=ref_entries if ref_entries else None,
        fallback_reference_lines=fallback_refs,
    )

    save_payload = {
        "markdown": markdown,
        "errors": errors,
        "original_title": original_title,
        "parallel_jobs": {k: {"ok": v.get("ok"), "error": v.get("error")} for k, v in by_name.items()},
    }
    try:
        ProjectManager().save_remake_result(project_id, "full_paper_remake", save_payload)
    except Exception as e:
        logger.error("[full_paper_remake] save failed: %s", e)
        errors.append({"stage": "save", "error": str(e)})

    degraded = bool(errors)
    return {
        "status": "degraded" if degraded else "success",
        "markdown": markdown,
        "errors": errors,
        "sections": {
            "title": original_title,
            "abstract": remade_abstract,
            "introduction": intro_body,
            "methods": methods_md,
            "results": results_md,
            "theory": theory_md,
            "conclusion": conclusion_md,
        },
        "parallel_jobs": save_payload["parallel_jobs"],
    }


async def stream_full_paper_remake_sse(
    project_id: str,
    *,
    force_reclean: bool = False,
    max_papers_for_llm: int = 72,
    context: Optional[str] = None,
    target_chars: int = 6000,
    overlap_chars: int = 300,
) -> AsyncIterator[bytes]:
    yield format_sse_json(
        "meta",
        {"stage": "cleaning", "project_id": project_id, "message": "Ensuring cleaned full text"},
    )

    errors: List[Dict[str, str]] = []
    proc = PaperProcessor()
    ok_clean, cleaned, clean_err = await run_in_thread(
        lambda: proc.get_paper_text(project_id, variant="cleaned", force_reclean=force_reclean)
    )
    if not ok_clean or not (cleaned or "").strip():
        msg = clean_err or "empty_cleaned_text"
        errors.append({"stage": "cleaning", "error": msg})
        md = assemble_paper_markdown(
            original_title="",
            remade_abstract="",
            introduction="",
            methods="",
            results="",
            theory="",
            conclusion="",
            reference_entries=[],
            fallback_reference_lines=[],
        )
        yield format_sse_json(
            "meta",
            {"stage": "error", "errors": errors, "parallel_jobs": {}},
        )
        yield format_sse_json(
            "done",
            {
                "status": "error",
                "message": "Cleaning failed",
                "markdown": md,
                "errors": errors,
                "sections": {},
                "parallel_jobs": {},
            },
        )
        return

    cleaned = cleaned.strip()
    cfg = ChunkingConfig(target_chars=target_chars, overlap_chars=overlap_chars)

    yield format_sse_json(
        "meta",
        {"stage": "parallel_start", "message": "Running introduction, theory, experiment, title extract in parallel"},
    )
    by_name, p_errors = await _run_parallel_jobs(
        project_id, cleaned, cfg, context, max_papers_for_llm
    )
    errors.extend(p_errors)

    yield format_sse_json(
        "meta",
        {
            "stage": "parallel_complete",
            "errors": list(errors),
            "parallel_jobs": {k: {"ok": v.get("ok"), "error": v.get("error")} for k, v in by_name.items()},
        },
    )

    original_title, original_abstract = _resolve_title_extract(by_name, cleaned, errors)
    title_line = f"# [CoRemake] {(original_title or 'Untitled study').strip()}\n\n"

    yield format_sse_json("meta", {"stage": "streaming_section", "section": "title"})
    yield format_sse("delta", title_line)

    yield format_sse_json("meta", {"stage": "streaming_section", "section": "abstract"})
    yield format_sse("delta", "## Abstract\n\n")
    acc_abstract: List[str] = []
    try:
        async for chunk in forward_llm_token_stream(
            section="abstract_body",
            token_iterator=iter_generate_coremake_abstract_stream(
                original_title=original_title,
                original_abstract=original_abstract,
                topic_hint=cleaned[:4000],
            ),
            emit_section_meta=False,
            acc=acc_abstract,
        ):
            yield chunk
    except Exception as e:
        errors.append({"stage": "abstract_stream", "error": str(e)})
    remade_abstract = "".join(acc_abstract).strip()
    if not remade_abstract:
        remade_abstract = generate_coremake_abstract(
            original_title=original_title,
            original_abstract=original_abstract,
            topic_hint=cleaned[:4000],
        )
        yield format_sse("delta", remade_abstract)
    yield format_sse("delta", "\n\n")

    intro_pl = by_name.get("introduction") or {}
    ref_entries: List[Dict[str, Any]] = []
    intro_body = ""
    if intro_pl.get("ok") and isinstance(intro_pl.get("data"), dict):
        idata = intro_pl["data"]
        intro_body = str(idata.get("remade_introduction") or "").strip()
        ref_entries = list(idata.get("references") or [])

    yield format_sse_json("meta", {"stage": "streaming_section", "section": "introduction"})
    yield format_sse("delta", "## Introduction\n\n")
    if intro_body:
        async for chunk in yield_text_in_chunks(
            section="introduction_body",
            text=intro_body,
            chunk_size=480,
            emit_meta=False,
        ):
            yield chunk
    else:
        err_note = str(intro_pl.get("error") or "introduction_failed")
        errors.append({"stage": "introduction_degraded", "error": err_note})
        acc_intro: List[str] = []
        try:
            async for chunk in forward_llm_token_stream(
                section="introduction_fallback",
                token_iterator=iter_fallback_introduction_stream(
                    cleaned_excerpt=cleaned,
                    remade_abstract=remade_abstract,
                    error_note=err_note,
                ),
                emit_section_meta=False,
                acc=acc_intro,
            ):
                yield chunk
            intro_body = "".join(acc_intro).strip()
        except Exception as e:
            errors.append({"stage": "introduction_stream", "error": str(e)})
            intro_body = fallback_introduction_text(
                cleaned_excerpt=cleaned,
                remade_abstract=remade_abstract,
                error_note=str(e),
            )
            yield format_sse("delta", intro_body)
        if not intro_body:
            intro_body = fallback_introduction_text(
                cleaned_excerpt=cleaned,
                remade_abstract=remade_abstract,
                error_note=err_note,
            )
            yield format_sse("delta", intro_body)
    yield format_sse("delta", "\n\n")

    fallback_refs: Optional[List[str]] = None
    if not ref_entries:
        fallback_refs = fallback_reference_lines(cleaned)
        if not fallback_refs:
            errors.append({"stage": "references", "error": "no_references_available"})

    exp_pl = by_name.get("experiment") or {}
    extract_summary = ""
    if exp_pl.get("ok") and isinstance(exp_pl.get("data"), dict):
        extract_summary = str((exp_pl["data"].get("extract") or {}).get("summary") or "")

    yield format_sse_json("meta", {"stage": "streaming_section", "section": "methods"})
    yield format_sse("delta", "## Methods\n\n")
    methods_acc: List[str] = []
    if exp_pl.get("ok") and isinstance(exp_pl.get("data"), dict):
        edata = exp_pl["data"]
        design = edata.get("design") or {}
        try:
            async for chunk in forward_llm_token_stream(
                section="methods",
                token_iterator=iter_format_methods_from_design_stream(
                    experiment_design=design.get("experiment_design") or {},
                    recipe_markdown=str(design.get("recipe") or ""),
                    extract_summary=extract_summary,
                ),
                emit_section_meta=False,
                acc=methods_acc,
            ):
                yield chunk
        except Exception as e:
            errors.append({"stage": "methods_format", "error": str(e)})
            methods_acc.clear()
            async for chunk in forward_llm_token_stream(
                section="methods_fallback",
                token_iterator=iter_fallback_methods_stream(cleaned, str(e)),
                emit_section_meta=False,
                acc=methods_acc,
            ):
                yield chunk
    else:
        err_note = str(exp_pl.get("error") or "experiment_chain_failed")
        errors.append({"stage": "methods_degraded", "error": err_note})
        async for chunk in forward_llm_token_stream(
            section="methods_fallback",
            token_iterator=iter_fallback_methods_stream(cleaned, err_note),
            emit_section_meta=False,
            acc=methods_acc,
        ):
            yield chunk
    yield format_sse("delta", "\n\n")
    methods_md = "".join(methods_acc).strip() or fallback_methods_from_topic(
        cleaned, str(exp_pl.get("error") or "empty_methods_stream")
    )

    yield format_sse_json("meta", {"stage": "streaming_section", "section": "results"})
    yield format_sse("delta", "## Results\n\n")
    results_acc: List[str] = []
    try:
        async for chunk in forward_llm_token_stream(
            section="results",
            token_iterator=iter_generate_results_stream(
                methods_section=methods_md,
                abstract_hint=remade_abstract,
            ),
            emit_section_meta=False,
            acc=results_acc,
        ):
            yield chunk
    except Exception as e:
        errors.append({"stage": "results", "error": str(e)})
        results_acc.clear()
        async for chunk in forward_llm_token_stream(
            section="results_fallback",
            token_iterator=iter_fallback_results_stream(methods_md, str(e)),
            emit_section_meta=False,
            acc=results_acc,
        ):
            yield chunk
    yield format_sse("delta", "\n\n")
    results_md = "".join(results_acc).strip() or fallback_results(methods_md, "empty_results_stream")

    theory_pl = by_name.get("theory") or {}
    theory_raw: Dict[str, Any] = {}
    if theory_pl.get("ok") and isinstance(theory_pl.get("data"), dict):
        theory_raw = theory_pl["data"]
    analysis = str(theory_raw.get("analysis") or "").strip()

    yield format_sse_json("meta", {"stage": "streaming_section", "section": "theory"})
    yield format_sse("delta", "## Theory\n\n")
    theory_acc: List[str] = []
    if analysis and not analysis.startswith("未获得可用的理论分析"):
        try:
            async for chunk in forward_llm_token_stream(
                section="theory",
                token_iterator=iter_format_theory_section_stream(
                    analysis_markdown=analysis,
                    formulas=list(theory_raw.get("formulas") or []),
                    derivation_steps=list(theory_raw.get("derivation_steps") or []),
                ),
                emit_section_meta=False,
                acc=theory_acc,
            ):
                yield chunk
        except Exception as e:
            errors.append({"stage": "theory_format", "error": str(e)})
            theory_acc.clear()
            async for chunk in forward_llm_token_stream(
                section="theory_fallback",
                token_iterator=iter_fallback_theory_stream(cleaned, str(e)),
                emit_section_meta=False,
                acc=theory_acc,
            ):
                yield chunk
    else:
        err_t = str(theory_pl.get("error") or theory_raw.get("warnings") or "theory_failed")
        errors.append({"stage": "theory_degraded", "error": err_t})
        async for chunk in forward_llm_token_stream(
            section="theory_fallback",
            token_iterator=iter_fallback_theory_stream(cleaned, err_t),
            emit_section_meta=False,
            acc=theory_acc,
        ):
            yield chunk
    yield format_sse("delta", "\n\n")
    theory_md = "".join(theory_acc).strip() or fallback_theory(cleaned, "empty_theory_stream")

    yield format_sse_json("meta", {"stage": "streaming_section", "section": "conclusion"})
    yield format_sse("delta", "## Conclusion\n\n")
    concl_acc: List[str] = []
    conclusion_md = ""
    try:
        async for chunk in forward_llm_token_stream(
            section="conclusion",
            token_iterator=iter_write_conclusion_stream(
                introduction=intro_body,
                methods=methods_md,
                results=results_md,
                theory=theory_md,
                abstract=remade_abstract,
            ),
            emit_section_meta=False,
            acc=concl_acc,
        ):
            yield chunk
        conclusion_md = "".join(concl_acc).strip()
    except Exception as e:
        errors.append({"stage": "conclusion", "error": str(e)})
        conclusion_md = "## Summary\n\n*(Conclusion generation failed; please revise manually.)*\n"
        yield format_sse("delta", conclusion_md)
    yield format_sse("delta", "\n\n")
    if not conclusion_md.strip():
        conclusion_md = write_conclusion(
            introduction=intro_body,
            methods=methods_md,
            results=results_md,
            theory=theory_md,
            abstract=remade_abstract,
        )

    ref_block = format_references_block(
        reference_entries=ref_entries if ref_entries else None,
        fallback_reference_lines=fallback_refs,
    )
    async for chunk in yield_text_in_chunks(
        section="references",
        text=f"## References\n\n{ref_block}\n",
        chunk_size=500,
    ):
        yield chunk

    markdown = assemble_paper_markdown(
        original_title=original_title,
        remade_abstract=remade_abstract,
        introduction=intro_body,
        methods=methods_md,
        results=results_md,
        theory=theory_md,
        conclusion=conclusion_md,
        reference_entries=ref_entries if ref_entries else None,
        fallback_reference_lines=fallback_refs,
    )

    save_payload = {
        "markdown": markdown,
        "errors": errors,
        "original_title": original_title,
        "parallel_jobs": {k: {"ok": v.get("ok"), "error": v.get("error")} for k, v in by_name.items()},
    }
    try:
        ProjectManager().save_remake_result(project_id, "full_paper_remake", save_payload)
    except Exception as e:
        logger.error("[full_paper_remake] save failed: %s", e)
        errors.append({"stage": "save", "error": str(e)})

    degraded = bool(errors)
    yield format_sse_json(
        "meta",
        {
            "stage": "assembly_complete",
            "errors": errors,
            "parallel_jobs": save_payload["parallel_jobs"],
        },
    )
    yield format_sse_json(
        "done",
        {
            "status": "degraded" if degraded else "success",
            "message": "Full-paper CoRemake completed",
            "markdown": markdown,
            "errors": errors,
            "sections": {
                "title": original_title,
                "abstract": remade_abstract,
                "introduction": intro_body,
                "methods": methods_md,
                "results": results_md,
                "theory": theory_md,
                "conclusion": conclusion_md,
            },
            "parallel_jobs": save_payload["parallel_jobs"],
        },
    )


def run_full_paper_remake_sync(project_id: str, **kwargs: Any) -> Dict[str, Any]:
    """Synchronous entry for tests; prefer async execute in FastAPI routes."""
    return asyncio.run(execute_full_paper_coremake(project_id, **kwargs))
