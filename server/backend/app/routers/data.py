"""
数据上传和绘图路由
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Optional, Any, Dict
from app.models import PlotResponse
from app.project_manager import ProjectManager
from app.services.plot import PlotService
from app.services.plot.recommendation_formatter import format_recommendation_text
from app.services.plot.template_previewer import generate_template_previews
import tempfile
import os
from pathlib import Path
import logging
from fastapi import Body, Form

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/data", tags=["data"])


@router.post("/plot", response_model=PlotResponse)
async def generate_plot_route(
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
):
    """生成图表"""
    try:
        plot_service = PlotService()
        project_manager = ProjectManager()
        
        # 如果有上传文件，保存到项目文件夹
        file_path = None
        if file:
            if project_id:
                file_content = await file.read()
                filename = file.filename or "data_file"
                saved_path = project_manager.save_data_file(
                    project_id=project_id,
                    file_content=file_content,
                    filename=filename,
                    file_type="raw"
                )
                file_path = saved_path
            else:
                # 临时保存
                suffix = Path(file.filename).suffix if file.filename else '.tmp'
                with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                    file_content = await file.read()
                    tmp.write(file_content)
                    file_path = tmp.name
        
        # 内部生成图表（替代外部 plot-agent）
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
        
        # 如果成功，保存图表到项目文件夹
        plot_path = None
        recommendation_text = format_recommendation_text(plot_result.recommendation, plot_result.chart_type)
        if project_id and plot_result.image_base64:
            # decode data:image/png;base64,...
            b64 = plot_result.image_base64.split(",", 1)[1] if "," in plot_result.image_base64 else plot_result.image_base64
            import base64
            plot_data = base64.b64decode(b64)
            plot_path = project_manager.save_plot(
                project_id=project_id,
                plot_data=plot_data,
                plot_format="png",
                metadata={
                    "chart_type": plot_result.chart_type,
                    "recommendation_raw": plot_result.recommendation,
                    "recommendation_text": recommendation_text,
                }
            )
        
        # 清理临时文件
        if file_path and not project_id and os.path.exists(file_path):
            os.unlink(file_path)
        
        return PlotResponse(
            status="success",
            message="Plot generation completed",
            plot_base64=plot_result.image_base64,
            plot_path=plot_path,
            # Only return human-readable text to frontend (raw is saved on disk)
            metadata={
                "recommendation_text": recommendation_text,
                "chart_type": plot_result.chart_type,
                "resolved_data_type": (plot_result.recommendation or {}).get("resolved_data_type"),
                "resolved_template_id": (plot_result.recommendation or {}).get("resolved_template_id"),
                "template_match_reason": (plot_result.recommendation or {}).get("template_match_reason"),
            },
        )
    except Exception as e:
        logger.error(f"Plot generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/collage")
async def save_collage_route(
    project_id: str = Form(...),
    file: UploadFile = File(...),
):
    """保存前端多图拼合 PNG 到项目目录 data/plots（与自动作图同级）。"""
    try:
        project_manager = ProjectManager()
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="空文件")
        if len(content) > 40 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="文件过大（>40MB）")
        path = project_manager.save_collage(project_id, content)
        return {
            "status": "success",
            "plot_path": path,
            "filename": Path(path).name,
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Collage save failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/plot/json", response_model=PlotResponse)
async def generate_plot_from_json_route(
    project_id: Optional[str] = Body(default=None),
    data: Optional[Dict[str, Any]] = Body(default=None),
    raw_text: Optional[str] = Body(default=None),
    chart_type: Optional[str] = Body(default=None),
    data_type: Optional[str] = Body(default=None),
    template_id: Optional[str] = Body(default=None),
    use_llm_type_detection: bool = Body(default=True),
    auto_recommend: bool = Body(default=True),
    style: Optional[str] = Body(default=None),
    title: Optional[str] = Body(default=None),
    xlabel: Optional[str] = Body(default=None),
    ylabel: Optional[str] = Body(default=None),
    x: Optional[str] = Body(default=None),
    y: Optional[str] = Body(default=None),
    hue: Optional[str] = Body(default=None),
    # chart-specific
    pvalue_threshold: Optional[float] = Body(default=None),
    foldchange_threshold: Optional[float] = Body(default=None),
):
    """JSON/粘贴数据绘图（无需文件上传）"""
    try:
        plot_service = PlotService()
        project_manager = ProjectManager()

        plot_result = plot_service.generate_plot(
            data=data,
            raw_text=raw_text,
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
            pvalue_threshold=pvalue_threshold,
            foldchange_threshold=foldchange_threshold,
        )

        plot_path = None
        recommendation_text = format_recommendation_text(plot_result.recommendation, plot_result.chart_type)
        if project_id and plot_result.image_base64:
            b64 = plot_result.image_base64.split(",", 1)[1] if "," in plot_result.image_base64 else plot_result.image_base64
            import base64

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

        return PlotResponse(
            status="success",
            message="Plot generation completed",
            plot_base64=plot_result.image_base64,
            plot_path=plot_path,
            metadata={
                "recommendation_text": recommendation_text,
                "chart_type": plot_result.chart_type,
                "resolved_data_type": (plot_result.recommendation or {}).get("resolved_data_type"),
                "resolved_template_id": (plot_result.recommendation or {}).get("resolved_template_id"),
                "template_match_reason": (plot_result.recommendation or {}).get("template_match_reason"),
            },
        )
    except Exception as e:
        logger.error("Plot generation (json) failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/plot/recommend")
async def recommend_plot_route(
    project_id: Optional[str] = Body(default=None),
    data: Optional[Dict[str, Any]] = Body(default=None),
    raw_text: Optional[str] = Body(default=None),
    top_n: int = Body(default=5),
    data_type: Optional[str] = Body(default=None),
    template_id: Optional[str] = Body(default=None),
    use_llm_type_detection: bool = Body(default=True),
):
    """
    返回 topN 推荐（用于前端渲染 5 个按钮）。
    不生成图像，仅返回结构化推荐信息（不包含大段 analysis）。
    """
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

        # Keep it frontend-friendly & small
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

        return {
            "recommended_chart": rec.get("recommended_chart"),
            "confidence": rec.get("confidence"),
            "reasoning": rec.get("reasoning"),
            "resolved_data_type": rec.get("resolved_data_type"),
            "resolved_template_id": rec.get("resolved_template_id"),
            "template_match_reason": rec.get("template_match_reason"),
            "options": options,
        }
    except Exception as e:
        logger.error("Plot recommendation failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/plot/templates/preview")
async def plot_template_preview_route(
    style: str = Body(default="all"),
    use_llm: bool = Body(default=False),
):
    """
    返回模板预览图（使用本地预置样例数据）：
    - style = all: 返回全部模板（图类型 × 样式）
    - style = publication/default/colorful: 返回指定样式模板
    """
    try:
        return generate_template_previews(style=style, use_llm=use_llm)
    except Exception as e:
        logger.error("Template preview generation failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/spectral/generate")
async def generate_spectral_data(
    start_nm: float = Body(default=400),
    end_nm: float = Body(default=700),
    step: float = Body(default=10),
    peak_nm: float = Body(default=550),
    width: float = Body(default=50),
    noise: float = Body(default=0.05),
):
    """
    生成光谱示例数据（wavelength/intensity）
    - 高斯峰 + 少量噪声
    """
    try:
        if step <= 0:
            raise ValueError("step must be > 0")
        if end_nm <= start_nm:
            raise ValueError("end_nm must be > start_nm")
        if width <= 0:
            raise ValueError("width must be > 0")
        if noise < 0:
            raise ValueError("noise must be >= 0")

        import math
        import random

        wavelength = []
        intensity = []

        wl = start_nm
        # include end point
        while wl <= end_nm + 1e-9:
            base = 0.1
            peak = 0.9 * math.exp(-(((wl - peak_nm) / width) ** 2))
            jitter = (random.random() - 0.5) * noise
            val = max(0.0, base + peak + jitter)
            wavelength.append(round(float(wl), 6))
            intensity.append(round(float(val), 6))
            wl += step

        return {"wavelength": wavelength, "intensity": intensity}
    except Exception as e:
        logger.error("Spectral data generation failed: %s", e)
        raise HTTPException(status_code=400, detail=str(e))
