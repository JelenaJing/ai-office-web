"""
论文上传和处理路由
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from app.models import ProjectInfo, ProjectFileList, ProjectFileContent
from app.project_manager import ProjectManager
from app.services.pdf_parser import extract_text_from_pdf_file
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/paper", tags=["paper"])


@router.post("/upload", response_model=ProjectInfo)
async def upload_paper(file: UploadFile = File(...)):
    """
    上传论文并创建项目文件夹
    
    - 支持PDF和文本文件
    - 自动创建项目文件夹
    - 保存原始文件
    - 提取文本内容（如果是PDF）
    """
    try:
        # 读取文件内容
        file_content = await file.read()
        
        if len(file_content) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")
        
        # 创建项目
        project_manager = ProjectManager()
        project_meta = project_manager.create_project(
            paper_filename=file.filename,
            paper_content=file_content
        )
        
        # 解析PDF（如果上传的是PDF）
        extracted_text = None
        if file.filename and file.filename.endswith('.pdf'):
            try:
                extracted_text = extract_text_from_pdf_file(file_content, file.filename)
                # 保存提取的文本
                project_dir = Path(project_meta['project_dir'])
                text_path = project_dir / "original" / "extracted_text.txt"
                with open(text_path, 'w', encoding='utf-8') as f:
                    f.write(extracted_text)
            except Exception as e:
                logger.warning(f"PDF parsing failed: {e}")
        
        return ProjectInfo(**project_meta)
        
    except Exception as e:
        logger.error(f"Paper upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/{project_id}", response_model=ProjectInfo)
async def get_paper(project_id: str):
    """获取论文项目信息"""
    project_manager = ProjectManager()
    project_meta = project_manager.get_project_meta(project_id)
    
    if not project_meta:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return ProjectInfo(**project_meta)


@router.get("/{project_id}/content")
async def get_paper_content(project_id: str):
    """获取论文内容"""
    project_manager = ProjectManager()
    project_dir = project_manager.get_project_dir(project_id)
    
    if not project_dir:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # 尝试读取提取的文本
    text_path = project_dir / "original" / "extracted_text.txt"
    if text_path.exists():
        with open(text_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return {"content": content, "format": "text"}
    
    # 如果没有提取的文本，返回PDF路径
    pdf_path = project_dir / "paper.pdf"
    if pdf_path.exists():
        return {"content": None, "format": "pdf", "pdf_path": str(pdf_path)}
    
    raise HTTPException(status_code=404, detail="Paper content not found")


@router.get("/")
async def list_projects():
    """列出所有项目"""
    project_manager = ProjectManager()
    projects = project_manager.list_projects()
    return {"projects": projects, "count": len(projects)}


@router.get("/{project_id}/pdf")
async def get_pdf_file(project_id: str):
    """获取PDF文件（用于前端预览）"""
    project_manager = ProjectManager()
    project_dir = project_manager.get_project_dir(project_id)
    
    if not project_dir:
        raise HTTPException(status_code=404, detail="Project not found")
    
    pdf_path = project_dir / "paper.pdf"
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="PDF file not found")
    
    return FileResponse(
        path=str(pdf_path),
        media_type="application/pdf",
        filename=project_manager.get_project_meta(project_id).get("paper_filename", "paper.pdf")
    )


@router.get("/{project_id}/files", response_model=ProjectFileList)
async def list_project_files(project_id: str, path: str = ""):
    """列出项目文件"""
    project_manager = ProjectManager()
    try:
        files = project_manager.list_project_files(project_id, path)
        return ProjectFileList(
            project_id=project_id,
            path=path,
            files=files
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to list project files: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list files: {str(e)}")


@router.get("/{project_id}/files/{file_path:path}/download")
async def download_project_file(project_id: str, file_path: str):
    """下载项目文件"""
    project_manager = ProjectManager()
    project_dir = project_manager.get_project_dir(project_id)
    
    if not project_dir:
        raise HTTPException(status_code=404, detail="Project not found")
    
    file_full_path = project_dir / file_path
    if not file_full_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    # 安全校验
    try:
        file_full_path.resolve().relative_to(project_dir.resolve())
    except ValueError:
        raise HTTPException(status_code=403, detail="Invalid file path")
    
    # 确定媒体类型
    media_type = "application/octet-stream"
    if file_path.endswith('.pdf'):
        media_type = "application/pdf"
    elif file_path.endswith('.png'):
        media_type = "image/png"
    elif file_path.endswith('.jpg') or file_path.endswith('.jpeg'):
        media_type = "image/jpeg"
    elif file_path.endswith('.json'):
        media_type = "application/json"
    elif file_path.endswith('.txt') or file_path.endswith('.md'):
        media_type = "text/plain"
    
    return FileResponse(
        path=str(file_full_path),
        media_type=media_type,
        filename=file_full_path.name
    )


@router.get("/{project_id}/files/{file_path:path}", response_model=ProjectFileContent)
async def get_project_file(project_id: str, file_path: str):
    """获取项目文件内容"""
    project_manager = ProjectManager()
    try:
        file_info = project_manager.get_file_content(project_id, file_path)
        return ProjectFileContent(**file_info)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to get file content: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get file: {str(e)}")
