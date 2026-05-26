"""POST /api/v1/remake/domain — 与主仓库 remake.py 中域生成逻辑一致。"""
import logging

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.agents import domain_generator
from app.models import DomainGenerateRequest, DomainGenerateResponse
from app.project_manager import ProjectManager
from app.services.draw_gateway_client import DrawGatewayClient

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/remake", tags=["remake-domain"])


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

    try:
        image_prompt = domain_generator.generate_image_prompt_from_text(english_text=english_text)
    except Exception as e:
        logger.error(f"Image prompt generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
