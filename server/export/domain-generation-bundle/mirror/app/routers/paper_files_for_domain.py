"""
若目标项目尚无 paper 路由中的文件接口，可 include 本模块以支持 image_file_url。

在 main.py:
    from app.routers.paper_files_for_domain import router as paper_files_domain_router
    app.include_router(paper_files_domain_router)

与主仓库 paper.py 中 /files 相关路由等价（子集）。
"""
import logging

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.models import ProjectFileContent, ProjectFileList
from app.project_manager import ProjectManager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/paper", tags=["paper-files-domain"])


@router.get("/{project_id}/files", response_model=ProjectFileList)
async def list_project_files(project_id: str, path: str = ""):
    project_manager = ProjectManager()
    try:
        files = project_manager.list_project_files(project_id, path)
        return ProjectFileList(project_id=project_id, path=path, files=files)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to list project files: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list files: {str(e)}")


@router.get("/{project_id}/files/{file_path:path}", response_model=ProjectFileContent)
async def get_project_file(project_id: str, file_path: str):
    project_manager = ProjectManager()
    try:
        file_info = project_manager.get_file_content(project_id, file_path)
        return ProjectFileContent(**file_info)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to get file content: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get file: {str(e)}")


@router.get("/{project_id}/files/{file_path:path}/download")
async def download_project_file(project_id: str, file_path: str):
    project_manager = ProjectManager()
    project_dir = project_manager.get_project_dir(project_id)
    if not project_dir:
        raise HTTPException(status_code=404, detail="Project not found")
    file_full_path = project_dir / file_path
    if not file_full_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    try:
        file_full_path.resolve().relative_to(project_dir.resolve())
    except ValueError:
        raise HTTPException(status_code=403, detail="Invalid file path")

    media_type = "application/octet-stream"
    if file_path.endswith(".pdf"):
        media_type = "application/pdf"
    elif file_path.endswith(".png"):
        media_type = "image/png"
    elif file_path.endswith(".jpg") or file_path.endswith(".jpeg"):
        media_type = "image/jpeg"
    elif file_path.endswith(".json"):
        media_type = "application/json"
    elif file_path.endswith(".txt") or file_path.endswith(".md"):
        media_type = "text/plain"

    return FileResponse(
        path=str(file_full_path),
        media_type=media_type,
        filename=file_full_path.name,
    )
