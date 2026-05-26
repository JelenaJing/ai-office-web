"""
V2 API contract for Idea + template plot (aligned with main-frontend research module types).
V1 routes remain unchanged for legacy server/frontend.
"""

from __future__ import annotations

import base64
import logging
import os
import tempfile
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Body, File, Form, HTTPException, Query, UploadFile
from pydantic import BaseModel, Field

from app.agents import idea_generator
from app.models import FullTextMultiRoundRequest, IdeaRequest
from app.project_manager import ProjectManager
from app.services.fulltext_multiround import ChunkingConfig, split_into_chunks, synthesize_ideas
from app.services.plot import PlotService
from app.services.plot.recommendation_formatter import format_recommendation_text
from app.services.plot.template_previewer import generate_template_previews
from app.services.research_contract import (
    map_plot_response_v1_to_generate,
    map_raw_ideas_to_cards,
    map_recommend_v1_to_frontend,
)
from app.services.paper_processor import PaperProcessor

logger = logging.getLogger(__name__)

router = APIRouter(tags=["research-v2"])


class IdeaV2Request(IdeaRequest):
    field: Optional[str] = Field(default="未分类", description="Research field label for UI cards")


class IdeaFulltextV2Request(FullTextMultiRoundRequest):
    field: Optional[str] = Field(default="未分类")


def _read_full_text(project_id: str, override_text: str | None = None) -> str:
    if override_text and str(override_text).strip():
        return str(override_text).strip()
    return PaperProcessor().get_paper_text(project_id, variant="cleaned") or ""


def _chunk_cfg(request: FullTextMultiRoundRequest) -> ChunkingConfig:
    return ChunkingConfig(target_chars=int(request.target_chars), overlap_chars=int(request.overlap_chars))


@router.post("/api/v1/remake/idea/v2")
async def generate_idea_v2(
    request: IdeaV2Request,
    strict_errors: bool = Query(default=False),
):
    try:
        selected_text = (request.selected_text or "").strip()
        if not selected_text:
            selected_text = _read_full_text(request.project_id, None)
        if not selected_text.strip():
            raise ValueError("selected_text and project full text are both empty")

        ideas = idea_generator.generate_ideas(
            project_id=request.project_id,
            selected_text=selected_text,
            context=request.context,
            strict_errors=strict_errors,
        )
        project_manager = ProjectManager()
        try:
            project_manager.save_remake_result(
                project_id=request.project_id,
                remake_type="idea",
                result={"selected_text": selected_text, "context": request.context, "ideas": ideas, "contract": "v2"},
            )
        except ValueError:
            logger.warning("Idea v2: skip save, project not found: %s", request.project_id)
        cards = map_raw_ideas_to_cards(ideas, field=request.field or "未分类")
        return {"success": True, "ideas": cards, "partialMissing": [], "data": None}
    except Exception as e:
        logger.error("Idea v2 failed: %s", e)
        if strict_errors:
            raise HTTPException(status_code=500, detail=str(e)) from e
        return {"success": False, "error": str(e), "ideas": [], "partialMissing": []}


@router.post("/api/v1/remake/idea/fulltext/v2")
async def generate_idea_fulltext_v2(
    request: IdeaFulltextV2Request,
    strict_errors: bool = Query(default=False),
):
    try:
        full_text = _read_full_text(request.project_id, request.full_text)
        if not full_text.strip():
            raise ValueError("Paper content is empty")
        chunks = split_into_chunks(full_text, _chunk_cfg(request))
        all_ideas: List[List[Dict[str, Any]]] = []
        for i, ch in enumerate(chunks):
            ideas = idea_generator.generate_ideas(
                project_id=request.project_id,
                selected_text=ch,
                context=f"Fulltext pass1 chunk {i+1}/{len(chunks)}",
                strict_errors=strict_errors,
            )
            all_ideas.append(ideas)
        merged = synthesize_ideas(all_ideas)
        try:
            ProjectManager().save_remake_result(
                project_id=request.project_id,
                remake_type="idea",
                result={"mode": "fulltext_multiround", "chunks": len(chunks), "ideas": merged, "contract": "v2"},
            )
        except ValueError:
            logger.warning("Idea fulltext v2: skip save, project not found: %s", request.project_id)
        cards = map_raw_ideas_to_cards(merged, field=request.field or "未分类")
        return {
            "success": True,
            "ideas": cards,
            "partialMissing": [],
            "data": {"chunks": len(chunks)},
        }
    except Exception as e:
        logger.error("Idea fulltext v2 failed: %s", e)
        if strict_errors:
            raise HTTPException(status_code=500, detail=str(e)) from e
        return {"success": False, "error": str(e), "ideas": [], "partialMissing": []}


@router.post("/api/v1/data/plot/v2")
async def generate_plot_v2(
    project_id: Optional[str] = None,
    file: UploadFile = File(None),
    chart_type: str = None,
    data_type: Optional[str] = Form(default=None),
    template_id: Optional[str] = Form(default=None),
    use_llm_type_detection: bool = Form(default=True),
    auto_recommend: bool = True,
    style: Optional[str] = Form(default=None),
    title: Optional[str] = Form(default=None),
    xlabel: Optional[str] = Form(default=None),
    ylabel: Optional[str] = Form(default=None),
    x: Optional[str] = Form(default=None),
    y: Optional[str] = Form(default=None),
    hue: Optional[str] = Form(default=None),
    strict_errors: bool = Query(default=False),
):
    try:
        plot_service = PlotService()
        project_manager = ProjectManager()
        file_path = None
        if file:
            if project_id:
                file_content = await file.read()
                filename = file.filename or "data_file"
                file_path = project_manager.save_data_file(
                    project_id=project_id,
                    file_content=file_content,
                    filename=filename,
                    file_type="raw",
                )
            else:
                suffix = Path(file.filename).suffix if file.filename else ".tmp"
                with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                    file_content = await file.read()
                    tmp.write(file_content)
                    file_path = tmp.name

        plot_result = plot_service.generate_plot(
            file_path=file_path,
            chart_type=chart_type,
            data_type=data_type,
            template_id=template_id,
            use_llm_type_detection=use_llm_type_detection,
            auto_recommend=auto_recommend,
            style=style or "publication",
            title=title,
            xlabel=xlabel,
            ylabel=ylabel,
            x=x,
            y=y,
            hue=hue,
        )

        plot_path = None
        recommendation_text = format_recommendation_text(plot_result.recommendation, plot_result.chart_type)
        if project_id and plot_result.image_base64:
            b64 = plot_result.image_base64.split(",", 1)[1] if "," in plot_result.image_base64 else plot_result.image_base64
            plot_data = base64.b64decode(b64)
            plot_path = project_manager.save_plot(
                project_id=project_id,
                plot_data=plot_data,
                plot_format="png",
                metadata={
                    "chart_type": plot_result.chart_type,
                    "recommendation_raw": plot_result.recommendation,
                    "recommendation_text": recommendation_text,
                },
            )

        if file_path and not project_id and os.path.exists(file_path):
            os.unlink(file_path)

        v1 = {
            "status": "success",
            "message": "Plot generation completed",
            "plot_base64": plot_result.image_base64,
            "plot_path": plot_path,
            "metadata": {
                "recommendation_text": recommendation_text,
                "chart_type": plot_result.chart_type,
                "resolved_data_type": (plot_result.recommendation or {}).get("resolved_data_type"),
                "resolved_template_id": (plot_result.recommendation or {}).get("resolved_template_id"),
                "template_match_reason": (plot_result.recommendation or {}).get("template_match_reason"),
            },
        }
        out = map_plot_response_v1_to_generate(v1)
        out["partialMissing"] = []
        return out
    except Exception as e:
        logger.error("Plot v2 failed: %s", e)
        if strict_errors:
            raise HTTPException(status_code=500, detail=str(e)) from e
        return {"success": False, "error": str(e), "message": str(e)}


@router.post("/api/v1/data/plot/recommend/v2")
async def recommend_plot_v2(
    project_id: Optional[str] = Body(default=None),
    data: Optional[Dict[str, Any]] = Body(default=None),
    raw_text: Optional[str] = Body(default=None),
    top_n: int = Body(default=5),
    data_type: Optional[str] = Body(default=None),
    template_id: Optional[str] = Body(default=None),
    use_llm_type_detection: bool = Body(default=True),
    strict_errors: bool = Query(default=False),
):
    try:
        plot_service = PlotService()
        rec = plot_service.recommend(
            data=data,
            raw_text=raw_text,
            top_n=top_n,
            data_type=data_type,
            template_id=template_id,
            use_llm_type_detection=use_llm_type_detection,
        )
        options = []
        for item in (rec.get("recommendations") or [])[:top_n]:
            options.append(
                {
                    "chart_type": item.get("chart_type"),
                    "template_id": item.get("template_id"),
                    "data_type": item.get("data_type"),
                    "confidence": item.get("confidence"),
                    "reasoning": item.get("reasoning"),
                    "suggested_parameters": item.get("suggested_parameters") or {},
                }
            )
        v1 = {
            "recommended_chart": rec.get("recommended_chart"),
            "confidence": rec.get("confidence"),
            "reasoning": rec.get("reasoning"),
            "resolved_data_type": rec.get("resolved_data_type"),
            "resolved_template_id": rec.get("resolved_template_id"),
            "template_match_reason": rec.get("template_match_reason"),
            "options": options,
        }
        return {"success": True, **map_recommend_v1_to_frontend(v1), "partialMissing": []}
    except Exception as e:
        logger.error("Plot recommend v2 failed: %s", e)
        if strict_errors:
            raise HTTPException(status_code=500, detail=str(e)) from e
        return {"success": False, "error": str(e)}


@router.post("/api/v1/data/plot/templates/preview/v2")
async def plot_template_preview_v2(
    style: str = Body(default="all"),
    use_llm: bool = Body(default=False),
):
    try:
        payload = generate_template_previews(style=style, use_llm=use_llm)
        return {"success": True, **payload, "partialMissing": []}
    except Exception as e:
        logger.error("Template preview v2 failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e)) from e
