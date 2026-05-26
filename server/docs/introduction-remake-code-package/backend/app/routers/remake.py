"""
Remake功能API路由
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.models import (
    IdeaRequest, IdeaResponse,
    ContentCheckRequest, ContentCheckResponse,
    ExperimentRequest, ExperimentResponse,
    TheoryRequest, TheoryResponse,
    OverallCheckRequest, OverallCheckResponse,
    ExperimentExtractRequest, ExperimentExtractResponse,
    ExperimentVisualizeRequest, ExperimentVisualizeResponse,
    ExperimentRecipeRequest, ExperimentRecipeResponse,
    IntroductionRemakeRequest, IntroductionRemakeResponse,
)
from app.project_manager import ProjectManager
from app.agents import idea_generator
from app.agents import content_checker
from app.agents import experiment_designer
from app.agents import theory_analyzer
from app.agents import overall_checker
from app.agents import experiment_extractor
from app.agents import introduction_remaker
from app.services.deepsyn_client import DeepSynClient
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/remake", tags=["remake"])


@router.post("/idea", response_model=IdeaResponse)
async def generate_idea(request: IdeaRequest):
    """生成新科研idea"""
    try:
        project_manager = ProjectManager()
        
        # 调用Idea Generator Agent
        ideas = idea_generator.generate_ideas(
            project_id=request.project_id,
            selected_text=request.selected_text,
            context=request.context
        )
        
        # 保存结果到项目文件夹
        result_data = {
            "selected_text": request.selected_text,
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
