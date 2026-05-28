"""
Remake功能API路由
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from typing import Any
from app.models import (
    IdeaRequest, IdeaResponse,
    ContentCheckRequest, ContentCheckResponse,
    ExperimentRequest, ExperimentResponse,
    TheoryRequest, TheoryResponse,
    OverallCheckRequest, OverallCheckResponse,
    ExperimentExtractRequest, ExperimentExtractResponse,
    ExperimentVisualizeRequest, ExperimentVisualizeResponse,
    FullTextMultiRoundRequest,
    FullPaperRemakeRequest,
    FullPaperRemakeResponse,
    ExperimentPipelineResponse,
    ExperimentRecipeRequest, ExperimentRecipeResponse,
    IntroductionRemakeRequest, IntroductionRemakeResponse,
    ReferenceInsertRequest, ReferenceInsertResponse,
    DomainGenerateRequest, DomainGenerateResponse,
)
from app.project_manager import ProjectManager
from app.agents import idea_generator
from app.agents import content_checker
from app.agents import experiment_designer
from app.agents import theory_analyzer
from app.agents import overall_checker
from app.agents import experiment_extractor
from app.agents import introduction_remaker
from app.agents import domain_generator
from app.services.deepsyn_client import DeepSynClient
from app.services.paper_processor import PaperProcessor
from app.services.fulltext_multiround import ChunkingConfig, split_into_chunks, synthesize_ideas, synthesize_experiment_design, synthesize_content_check
from app.services.idea_paper_source import read_paper_text_for_idea, should_use_single_pass_idea
from app.services.theory_fulltext_merge import run_analyze_theory_fulltext
from app.services.full_paper_remake.orchestrator import (
    execute_full_paper_coremake,
    stream_full_paper_remake_sse,
)
from app.services.reference_inserter import organize_references, organize_references_stream
from app.services.draw_gateway_client import DrawGatewayClient
from datetime import datetime
import logging
import json

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/remake", tags=["remake"])


def _read_full_text(project_id: str, override_text: str | None = None) -> str:
    text, _meta = read_paper_text_for_idea(project_id, override_text)
    return text


def _chunk_cfg(request: FullTextMultiRoundRequest) -> ChunkingConfig:
    return ChunkingConfig(target_chars=int(request.target_chars), overlap_chars=int(request.overlap_chars))


def _domain_resolve_project_id(request: DomainGenerateRequest, project_manager: ProjectManager) -> str:
    if request.project_id:
        project_dir = project_manager.get_project_dir(request.project_id)
        if not project_dir:
            raise HTTPException(status_code=404, detail="Project not found")
        return request.project_id
    project_meta = project_manager.create_project(paper_filename="domain_generation.txt", paper_content=None)
    return project_meta["project_id"]


@router.post("/domain")
async def generate_domain_content(request: DomainGenerateRequest):
    """输入主题/段落 -> 约500词英文 -> 生成生图prompt -> 生图并保存到项目目录。`stream=true` 时返回 SSE，见 `text/event-stream`。"""
    project_manager = ProjectManager()

    try:
        project_id = _domain_resolve_project_id(request, project_manager)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Project init failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    if request.stream:
        return StreamingResponse(
            domain_generator.stream_domain_sse(request, project_id, project_manager),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    # Step 1: English text
    try:
        english_text = domain_generator.generate_english_text(
            topic=request.topic,
            paragraph=request.paragraph,
            word_count=request.word_count,
            context=request.context,
        )
    except Exception as e:
        logger.error(f"Domain english generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    # Step 2: image prompt derived from text
    try:
        image_prompt = domain_generator.generate_image_prompt_from_text(english_text=english_text)
    except Exception as e:
        logger.error(f"Image prompt generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    # Step 3: draw + download + save
    draw_client = DrawGatewayClient()
    task_id = None
    try:
        task_id = await draw_client.submit_task(
            prompt=image_prompt,
            aspect_ratio=request.aspect_ratio,
            model=request.draw_model,
            image_size=request.image_size,
        )
        result = await draw_client.wait_for_image(
            task_id=task_id,
            timeout_seconds=request.timeout_seconds,
            poll_interval_seconds=request.poll_interval_seconds,
        )
        if result.status != "succeeded":
            raise RuntimeError(f"draw task failed: status={result.status}")
        if not result.image_url:
            raise RuntimeError("draw task succeeded but missing image_url")

        image_bytes = await draw_client.download_image_bytes(result.image_url)
        saved = project_manager.save_generated_image(
            project_id,
            image_data=image_bytes,
            image_prompt=image_prompt,
            task_id=task_id,
        )
        rel_path = saved.get("rel_path")
        file_url = f"/api/v1/paper/{project_id}/files/{rel_path}" if rel_path else None

        return DomainGenerateResponse(
            status="success",
            message="Domain generation completed",
            project_id=project_id,
            english_text=english_text,
            image_prompt=image_prompt,
            image_path=saved.get("abs_path"),
            image_file_url=file_url,
            draw_task_id=task_id,
            data=None,
        )
    except TimeoutError as e:
        detail = {
            "error": str(e),
            "project_id": project_id,
            "english_text": english_text,
            "image_prompt": image_prompt,
            "draw_task_id": task_id,
        }
        raise HTTPException(status_code=504, detail=detail)
    except Exception as e:
        logger.error(f"Draw pipeline failed: {e}")
        detail = {
            "error": str(e),
            "project_id": project_id,
            "english_text": english_text,
            "image_prompt": image_prompt,
            "draw_task_id": task_id,
        }
        raise HTTPException(status_code=502, detail=detail)


@router.post("/full-paper-remake/stream")
async def full_paper_remake_stream(request: FullPaperRemakeRequest):
    """全文 CoRemake SSE：meta（清洗/完成）-> delta（markdown 分块）-> done（完整 JSON）"""
    return StreamingResponse(
        stream_full_paper_remake_sse(
            request.project_id,
            force_reclean=request.force_reclean,
            max_papers_for_llm=request.max_papers_for_llm,
            context=request.context,
            target_chars=request.target_chars,
            overlap_chars=request.overlap_chars,
        ),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/full-paper-remake", response_model=FullPaperRemakeResponse)
async def full_paper_remake(request: FullPaperRemakeRequest):
    """全文 CoRemake 单次 JSON 返回"""
    try:
        out = await execute_full_paper_coremake(
            request.project_id,
            force_reclean=request.force_reclean,
            max_papers_for_llm=request.max_papers_for_llm,
            context=request.context,
            target_chars=request.target_chars,
            overlap_chars=request.overlap_chars,
        )
        return FullPaperRemakeResponse(
            status=out.get("status", "success"),
            message="Full-paper CoRemake completed",
            markdown=out.get("markdown") or "",
            errors=list(out.get("errors") or []),
            sections=dict(out.get("sections") or {}),
            parallel_jobs=dict(out.get("parallel_jobs") or {}),
        )
    except Exception as e:
        logger.error(f"Full-paper CoRemake failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/idea", response_model=IdeaResponse)
async def generate_idea(request: IdeaRequest):
    """生成新科研idea"""
    try:
        project_manager = ProjectManager()
        selected_text = (request.selected_text or "").strip()
        if not selected_text:
            selected_text = _read_full_text(request.project_id, None)

        # 调用Idea Generator Agent
        ideas = idea_generator.generate_ideas(
            project_id=request.project_id,
            selected_text=selected_text,
            context=request.context
        )
        
        # 保存结果到项目文件夹
        result_data = {
            "selected_text": selected_text,
            "context": request.context,
            "ideas": ideas
        }
        project_manager.save_remake_result(
            project_id=request.project_id,
            remake_type="idea",
            result=result_data
        )
        
        # 只返回核心结果，不返回原始文本
        return IdeaResponse(
            status="success",
            message="Idea generation completed",
            ideas=ideas,
            data=None  # 不返回原始数据
        )
    except Exception as e:
        logger.error(f"Idea generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/idea/fulltext", response_model=IdeaResponse)
async def generate_idea_fulltext(request: FullTextMultiRoundRequest):
    """全文分段多轮：Idea（后端负责覆盖全文与综合）"""
    try:
        project_manager = ProjectManager()
        full_text, paper_meta = read_paper_text_for_idea(request.project_id, request.full_text)
        if not full_text.strip():
            raise ValueError("Paper content is empty")
        cfg = _chunk_cfg(request)
        if should_use_single_pass_idea(paper_meta, full_text, cfg.target_chars):
            merged = idea_generator.generate_ideas(
                project_id=request.project_id,
                selected_text=full_text,
                context="Idea from paper preview",
            )
            chunks_n = 1
            mode = paper_meta.get("mode", "single_pass")
        else:
            chunks = split_into_chunks(full_text, cfg)
            all_ideas = []
            for i, ch in enumerate(chunks):
                ideas = idea_generator.generate_ideas(
                    project_id=request.project_id,
                    selected_text=ch,
                    context=f"Fulltext pass1 chunk {i+1}/{len(chunks)}",
                )
                all_ideas.append(ideas)
            merged = synthesize_ideas(all_ideas)
            chunks_n = len(chunks)
            mode = "fulltext_multiround"
        project_manager.save_remake_result(
            project_id=request.project_id,
            remake_type="idea",
            result={"mode": mode, "chunks": chunks_n, "ideas": merged, "paper_meta": paper_meta},
        )
        return IdeaResponse(
            status="success",
            message="Idea(fulltext) completed",
            ideas=merged,
            data={"chunks": chunks_n, "paper_meta": paper_meta},
        )
    except Exception as e:
        logger.error(f"Idea(fulltext) failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/check/stream")
async def check_content_stream(request: ContentCheckRequest):
    """内容检查 SSE：meta -> delta(updated_text)* -> done"""
    return StreamingResponse(
        content_checker.stream_check_content_sse(
            request.project_id, request.selected_text
        ),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/check", response_model=ContentCheckResponse)
async def check_content(request: ContentCheckRequest):
    """检查内容和reference"""
    try:
        project_manager = ProjectManager()
        
        # 调用Content Checker Agent
        result = content_checker.check_content(
            project_id=request.project_id,
            selected_text=request.selected_text
        )
        
        # 保存结果到项目文件夹
        project_manager.save_remake_result(
            project_id=request.project_id,
            remake_type="content_update",
            result=result
        )
        
        # 返回处理结果，包含必要的对比信息
        # 将额外信息放在data字段中
        response_data = {
            "is_outdated": result.get("is_outdated", False),
            "latest_papers_count": result.get("latest_papers_count", 0),
            "recommended_references": result.get("recommended_references", [])
        }
        
        return ContentCheckResponse(
            status="success",
            message="Content check completed",
            original_text=result.get("original_text", ""),  # 返回原始文本用于对比
            updated_text=result.get("updated_text", ""),
            updated_references=result.get("updated_references", []),
            issues=result.get("issues", []),
            data=response_data
        )
    except Exception as e:
        logger.error(f"Content check failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/check/fulltext", response_model=ContentCheckResponse)
async def check_content_fulltext(request: FullTextMultiRoundRequest):
    """全文分段多轮：内容检查（保守合并 issues/references，保证覆盖全文）"""
    try:
        full_text = _read_full_text(request.project_id, request.full_text)
        if not full_text.strip():
            raise ValueError("Paper content is empty")
        chunks = split_into_chunks(full_text, _chunk_cfg(request))
        results = []
        for i, ch in enumerate(chunks):
            r = content_checker.check_content(project_id=request.project_id, selected_text=ch)
            r["_chunk"] = {"index": i + 1, "total": len(chunks)}
            results.append(r)
        merged = synthesize_content_check(results)
        ProjectManager().save_remake_result(request.project_id, "content_update", {"mode": "fulltext_multiround", "chunks": len(chunks), **merged})
        return ContentCheckResponse(
            status="success",
            message="Content check(fulltext) completed",
            original_text="",
            updated_text="",
            updated_references=merged.get("updated_references", []),
            issues=merged.get("issues", []),
            data={"chunks": len(chunks), "recommended_references": merged.get("recommended_references", [])},
        )
    except Exception as e:
        logger.error(f"Content check(fulltext) failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/experiment", response_model=ExperimentResponse)
async def design_experiment(request: ExperimentRequest):
    """重新设计实验"""
    try:
        project_manager = ProjectManager()
        
        # 调用Experiment Designer Agent
        result = experiment_designer.design_experiment(
            project_id=request.project_id,
            selected_text=request.selected_text
        )
        
        # 保存结果到项目文件夹
        project_manager.save_remake_result(
            project_id=request.project_id,
            remake_type="experiment",
            result=result
        )
        
        return ExperimentResponse(
            status="success",
            message="Experiment design completed",
            experiment_design=result.get("experiment_design", {}),
            recipe=result.get("recipe", "")
        )
    except Exception as e:
        logger.error(f"Experiment design failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/experiment/fulltext", response_model=ExperimentResponse)
async def design_experiment_fulltext(request: FullTextMultiRoundRequest):
    """全文分段多轮：实验设计（后端负责覆盖全文与综合）"""
    try:
        full_text = _read_full_text(request.project_id, request.full_text)
        if not full_text.strip():
            raise ValueError("Paper content is empty")
        # 先尽量抽出 Methods / 实验步骤，再按块做「重新设计实验」。
        # 若直接对全文按段落切块，很多块是 Introduction/讨论，模型会回报 “no experimental details”，合并结果很差。
        source_mode = "fulltext_raw"
        source_text = full_text
        try:
            ext = experiment_extractor.extract_experiment_sections(request.project_id, None)
            extracted = experiment_extractor.format_experiment_steps(
                (ext.get("experiment_text") or "").strip()
            )
            if extracted.strip():
                source_text = extracted
                source_mode = "experiment_extract"
                logger.info(
                    "[experiment/fulltext] using extracted experiment text: %d chars",
                    len(source_text),
                )
            else:
                logger.info(
                    "[experiment/fulltext] extract empty, falling back to raw full_text: %d chars",
                    len(full_text),
                )
        except Exception as ex:
            logger.warning(
                "[experiment/fulltext] extract_experiment_sections failed, using raw full_text: %s",
                ex,
            )

        chunks = split_into_chunks(source_text, _chunk_cfg(request))
        if not chunks:
            raise ValueError("No chunks to process")
        skip_clean = source_mode == "experiment_extract"
        drafts: list[dict[str, Any]] = []
        for i, ch in enumerate(chunks):
            d = experiment_designer.design_experiment(
                project_id=request.project_id,
                selected_text=ch,
                skip_clean=skip_clean,
            )
            d["_chunk"] = {"index": i + 1, "total": len(chunks)}
            drafts.append(d)
        merged = synthesize_experiment_design(drafts)
        ProjectManager().save_remake_result(
            request.project_id,
            "experiment",
            {
                "mode": "fulltext_multiround",
                "source": source_mode,
                "chunks": len(chunks),
                **merged,
            },
        )
        return ExperimentResponse(
            status="success",
            message="Experiment(fulltext) completed",
            experiment_design=merged.get("experiment_design", {}) or {},
            recipe=str(merged.get("recipe", "") or ""),
            data={"chunks": len(chunks), "source": source_mode},
        )
    except Exception as e:
        logger.error(f"Experiment(fulltext) failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/theory/stream")
async def analyze_theory_stream(request: TheoryRequest):
    """理论分析 SSE：meta -> delta* -> done（含公式/推导二次补全）"""
    return StreamingResponse(
        theory_analyzer.stream_theory_sse(request.project_id, request.selected_text),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/theory", response_model=TheoryResponse)
async def analyze_theory(request: TheoryRequest):
    """理论分析和公式推导"""
    try:
        project_manager = ProjectManager()
        
        # 调用Theory Analyzer Agent
        result = theory_analyzer.analyze_theory(
            project_id=request.project_id,
            selected_text=request.selected_text
        )
        
        # 保存结果到项目文件夹
        project_manager.save_remake_result(
            project_id=request.project_id,
            remake_type="theory",
            result=result
        )
        
        return TheoryResponse(
            status="success",
            message="Theory analysis completed",
            analysis=result.get("analysis", ""),
            formulas=result.get("formulas", []),
            derivation_steps=result.get("derivation_steps", [])
        )
    except Exception as e:
        logger.error(f"Theory analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/theory/fulltext", response_model=TheoryResponse)
async def analyze_theory_fulltext(request: FullTextMultiRoundRequest):
    """全文分段多轮：理论分析（后端负责覆盖全文与综合）"""
    try:
        full_text = _read_full_text(request.project_id, request.full_text)
        merged = run_analyze_theory_fulltext(
            request.project_id, full_text, _chunk_cfg(request), save_result=True
        )
        return TheoryResponse(
            status="success",
            message="Theory(fulltext) completed with deterministic chunk merge",
            analysis=merged.get("analysis", ""),
            formulas=merged.get("formulas", []),
            derivation_steps=merged.get("derivation_steps", []),
            data={
                "chunks_total": merged.get("chunks_total", 0),
                "chunks_success": merged.get("chunks_success", 0),
                "chunks_failed": merged.get("chunks_failed", 0),
                "failed_chunk_indices": merged.get("failed_chunk_indices", []),
                "warnings": merged.get("warnings", []),
                "degraded": merged.get("degraded", False),
            },
        )
    except Exception as e:
        logger.error(f"Theory(fulltext) failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/introduction/stream")
async def remake_introduction_stream(request: IntroductionRemakeRequest):
    """Introduction 重写 SSE：meta -> delta* -> done"""
    return StreamingResponse(
        introduction_remaker.stream_introduction_remake_sse(
            project_id=request.project_id,
            selected_text=request.selected_text or "",
            context=request.context,
            auto_extract_intro=request.auto_extract_intro,
            max_papers_for_llm=request.max_papers_for_llm,
        ),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/introduction", response_model=IntroductionRemakeResponse)
async def remake_introduction(request: IntroductionRemakeRequest):
    """Introduction 提取 + 顶刊文献池 + 重写与引用（引用仅来自池内）"""
    try:
        project_manager = ProjectManager()
        result = introduction_remaker.remake_introduction(
            project_id=request.project_id,
            selected_text=request.selected_text or "",
            context=request.context,
            auto_extract_intro=request.auto_extract_intro,
            max_papers_for_llm=request.max_papers_for_llm,
        )
        save_payload = {
            **result,
            "auto_extract_intro": request.auto_extract_intro,
            "max_papers_for_llm": request.max_papers_for_llm,
            "context": request.context,
        }
        project_manager.save_remake_result(
            project_id=request.project_id,
            remake_type="introduction",
            result=save_payload,
        )
        return IntroductionRemakeResponse(
            status="success",
            message="Introduction remake completed",
            allowed_journals=result.get("allowed_journals", []),
            literature_pool=result.get("literature_pool", []),
            literature_pool_meta=result.get("literature_pool_meta", {}),
            original_introduction=result.get("original_introduction", ""),
            remade_introduction=result.get("remade_introduction", ""),
            references=result.get("references", []),
            continuity_notes=result.get("continuity_notes", ""),
            original_reference_audit=result.get("original_reference_audit", []),
            search_topic=result.get("search_topic", ""),
            min_publication_year=result.get("min_publication_year", 0),
            data=None,
        )
    except ValueError as e:
        logger.warning(f"Introduction remake validation: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Introduction remake failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/insert-reference", response_model=ReferenceInsertResponse)
async def insert_reference(request: ReferenceInsertRequest):
    """全文 reference 搜索与插入（同步）"""
    try:
        project_manager = ProjectManager()
        result = organize_references(
            topic=request.topic,
            paper_markdown=request.paper_markdown,
            year_from=request.year_from,
            year_to=request.year_to,
        )
        save_payload = {
            **result,
            "topic": request.topic,
            "year_from": request.year_from,
            "year_to": request.year_to,
        }
        project_manager.save_remake_result(
            project_id=request.project_id,
            remake_type="reference_insert",
            result=save_payload,
        )
        return ReferenceInsertResponse(
            status="success",
            message="Reference insertion completed",
            updated_markdown=result.get("updated_markdown", request.paper_markdown),
            reference_list=result.get("reference_list", []),
            sentence_changes=result.get("sentence_changes", []),
            year_range=result.get("year_range"),
        )
    except Exception as e:
        logger.error(f"insert reference failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/insert-reference/stream")
async def insert_reference_stream(request: ReferenceInsertRequest):
    """全文 reference 搜索与插入（SSE）"""
    def _event_generator():
        try:
            for item in organize_references_stream(
                topic=request.topic,
                paper_markdown=request.paper_markdown,
                year_from=request.year_from,
                year_to=request.year_to,
            ):
                tp = item.get("type")
                if tp == "status":
                    payload = {"message": item.get("message"), "progress": item.get("progress")}
                    yield f"event: meta\ndata: {json.dumps(payload, ensure_ascii=False)}\n\n"
                elif tp == "reference_inserted":
                    delta = item.get("updated_paragraph", "")
                    yield f"event: delta\ndata: {delta}\n\n"
                elif tp == "complete":
                    project_manager = ProjectManager()
                    save_payload = {
                        "updated_markdown": item.get("updated_markdown", request.paper_markdown),
                        "reference_list": item.get("reference_list", []),
                        "sentence_changes": item.get("sentence_changes", []),
                        "year_range": item.get("year_range"),
                        "topic": request.topic,
                        "year_from": request.year_from,
                        "year_to": request.year_to,
                    }
                    project_manager.save_remake_result(
                        project_id=request.project_id,
                        remake_type="reference_insert",
                        result=save_payload,
                    )
                    done_payload = {"status": "success", "message": "Reference insertion completed", **save_payload}
                    yield f"event: done\ndata: {json.dumps(done_payload, ensure_ascii=False)}\n\n"
                elif tp == "error":
                    yield f"event: error\ndata: {item.get('error', 'unknown error')}\n\n"
        except Exception as e:
            yield f"event: error\ndata: {str(e)}\n\n"

    return StreamingResponse(
        _event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/overall", response_model=OverallCheckResponse)
async def check_overall(request: OverallCheckRequest):
    """全文整体检查"""
    try:
        project_manager = ProjectManager()
        
        # 调用Overall Checker Agent
        result = overall_checker.check_overall(
            project_id=request.project_id
        )
        
        # 保存结果到项目文件夹
        project_manager.save_remake_result(
            project_id=request.project_id,
            remake_type="overall_check",
            result=result
        )
        
        return OverallCheckResponse(
            status="success",
            message="Overall check completed",
            issues=result.get("issues", []),
            suggestions=result.get("suggestions", [])
        )
    except Exception as e:
        logger.error(f"Overall check failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/extract-experiment", response_model=ExperimentExtractResponse)
async def extract_experiment(request: ExperimentExtractRequest):
    """从论文中提取实验内容"""
    try:
        project_manager = ProjectManager()
        
        # 调用Experiment Extractor Agent
        result = experiment_extractor.extract_experiment_sections(
            project_id=request.project_id,
            selected_text=request.selected_text
        )
        
        # 格式化实验步骤
        formatted_steps = experiment_extractor.format_experiment_steps(
            result.get("experiment_text", "")
        )
        
        # 保存结果到项目文件夹
        save_data = {
            "selected_text": request.selected_text,
            "experiment_text": formatted_steps,
            "sections": result.get("sections", []),
            "summary": result.get("summary", ""),
            "confidence": result.get("confidence", "low"),
            "extracted_at": datetime.now().isoformat()
        }
        project_manager.save_remake_result(
            project_id=request.project_id,
            remake_type="experiment_extract",
            result=save_data
        )
        
        return ExperimentExtractResponse(
            status="success",
            message="Experiment extraction completed",
            experiment_text=formatted_steps,
            sections=result.get("sections", []),
            summary=result.get("summary", ""),
            confidence=result.get("confidence", "low")
        )
    except Exception as e:
        logger.error(f"Experiment extraction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/visualize-experiment", response_model=ExperimentVisualizeResponse)
async def visualize_experiment(request: ExperimentVisualizeRequest):
    """执行实验步骤的可视化（步骤3和步骤4）"""
    try:
        project_manager = ProjectManager()
        
        # 创建DeepSyn客户端
        deepsyn_client = DeepSynClient()
        
        # 调用完整流程：步骤3 + 步骤4
        result = deepsyn_client.visualize_experiment(request.experiment_steps)
        
        if not result.get("success"):
            return ExperimentVisualizeResponse(
                status="error",
                message=result.get("error", "Visualization failed"),
                operations=[],
                stats={},
                visualization_data=None
            )
        
        # 保存结果到项目文件夹
        save_data = {
            "experiment_steps": request.experiment_steps,
            "operations": result.get("operations", []),
            "stats": result.get("stats", {}),
            "step3_result": result.get("step3_result"),
            "step4_result": result.get("step4_result"),
            "visualized_at": datetime.now().isoformat()
        }
        project_manager.save_remake_result(
            project_id=request.project_id,
            remake_type="experiment_visualize",
            result=save_data
        )
        
        return ExperimentVisualizeResponse(
            status="success",
            message="Experiment visualization completed",
            operations=result.get("operations", []),
            stats=result.get("stats", {}),
            visualization_data={
                "step3_result": result.get("step3_result"),
                "step4_result": result.get("step4_result")
            }
        )
    except Exception as e:
        logger.error(f"Experiment visualization failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/experiment/pipeline/extract-visualize", response_model=ExperimentPipelineResponse)
async def experiment_pipeline_extract_visualize(request: ExperimentExtractRequest):
    """实验链路：先提取实验，再做 DeepSyn 可视化，合并返回（后端编排）"""
    try:
        # Extract (agent already supports full paper when selected_text is empty)
        project_manager = ProjectManager()
        result = experiment_extractor.extract_experiment_sections(request.project_id, request.selected_text)
        formatted_steps = experiment_extractor.format_experiment_steps(result.get("experiment_text", ""))
        extract_resp = ExperimentExtractResponse(
            status="success",
            message="Experiment extraction completed",
            experiment_text=formatted_steps,
            sections=result.get("sections", []),
            summary=result.get("summary", ""),
            confidence=result.get("confidence", "low"),
        )
        # Visualize
        deepsyn_client = DeepSynClient()
        viz = deepsyn_client.visualize_experiment(formatted_steps)
        if not viz.get("success"):
            visualize_resp = ExperimentVisualizeResponse(
                status="error",
                message=viz.get("error", "Visualization failed"),
                operations=[],
                stats={},
                visualization_data=None,
            )
        else:
            visualize_resp = ExperimentVisualizeResponse(
                status="success",
                message="Experiment visualization completed",
                operations=viz.get("operations", []),
                stats=viz.get("stats", {}),
                visualization_data={"step3_result": viz.get("step3_result"), "step4_result": viz.get("step4_result")},
            )
        # Save both
        project_manager.save_remake_result(
            project_id=request.project_id,
            remake_type="experiment_extract",
            result={
                "selected_text": request.selected_text,
                "experiment_text": formatted_steps,
                "sections": result.get("sections", []),
                "summary": result.get("summary", ""),
                "confidence": result.get("confidence", "low"),
                "extracted_at": datetime.now().isoformat(),
            },
        )
        project_manager.save_remake_result(
            project_id=request.project_id,
            remake_type="experiment_visualize",
            result={
                "experiment_steps": formatted_steps,
                "operations": visualize_resp.operations,
                "stats": visualize_resp.stats,
                "step3_result": (visualize_resp.visualization_data or {}).get("step3_result"),
                "step4_result": (visualize_resp.visualization_data or {}).get("step4_result"),
                "visualized_at": datetime.now().isoformat(),
            },
        )
        return ExperimentPipelineResponse(
            status="success",
            message="Experiment pipeline completed",
            extract=extract_resp,
            visualize=visualize_resp,
            data={"pipeline": ["extract", "visualize"]},
        )
    except Exception as e:
        logger.error(f"Experiment pipeline failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recipe-experiment", response_model=ExperimentRecipeResponse)
async def recipe_experiment(request: ExperimentRecipeRequest):
    """将operations转写为机器可理解的配方JSON（DeepSyn Step5）"""
    try:
        project_manager = ProjectManager()
        deepsyn_client = DeepSynClient()

        if not request.operations:
            return ExperimentRecipeResponse(
                status="error",
                message="Please provide operations (structured operation list from step 3/4)",
                recipe_export={},
                stats={},
                saved_path=None,
            )

        step5 = deepsyn_client.call_step5_operations_to_recipe(
            request.operations,
            formula_name=request.formula_name or "AI Generated Recipe",
            device_number=request.device_number or "UNKNOWN",
            org_number=request.org_number or "unknown",
            backend_url=request.backend_url or "",
            equipment_type=int(request.equipment_type or 6),
        )

        if not step5.get("success"):
            return ExperimentRecipeResponse(
                status="error",
                message=step5.get("error", "Step5 conversion failed"),
                recipe_export={},
                stats=step5.get("stats", {}) if isinstance(step5.get("stats"), dict) else {},
                saved_path=None,
            )

        # 保存设备格式文件（只包含recipe_export内容，设备可直接使用）
        device_recipe = step5.get("recipe_export", {})
        saved_path = project_manager.save_remake_result(
            project_id=request.project_id,
            remake_type="experiment_recipe",
            result=device_recipe,  # 只保存设备格式
        )

        return ExperimentRecipeResponse(
            status="success",
            message="Machine recipe conversion completed (liquid additions + heating/cooling only; other operations skipped)",
            recipe_export=device_recipe,
            stats=step5.get("stats", {}),
            saved_path=saved_path,
            operations_in=request.operations,  # 返回操作列表供前端预览
        )
    except Exception as e:
        logger.error(f"Machine recipe conversion failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
