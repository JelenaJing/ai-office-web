"""域生成接口 + 项目文件读取所需的最小模型。"""
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class RemakeResponse(BaseModel):
    status: str = "success"
    message: str = ""
    data: Optional[Dict[str, Any]] = None


class DomainGenerateRequest(BaseModel):
    project_id: Optional[str] = None
    topic: Optional[str] = None
    paragraph: Optional[str] = None
    word_count: int = Field(default=500, ge=200, le=1200)
    context: Optional[str] = None
    stream: bool = False
    aspect_ratio: str = "16:9"
    draw_model: str = "nano-banana-pro"
    image_size: str = "1K"
    timeout_seconds: int = Field(default=300, ge=30, le=1800)
    poll_interval_seconds: int = Field(default=3, ge=1, le=30)


class DomainGenerateResponse(RemakeResponse):
    project_id: str
    english_text: str
    image_prompt: str
    image_path: Optional[str] = None
    image_file_url: Optional[str] = None
    draw_task_id: Optional[str] = None


class ProjectFile(BaseModel):
    name: str
    path: str
    is_directory: bool
    size: int
    modified: str


class ProjectFileList(BaseModel):
    project_id: str
    path: str
    files: List[ProjectFile]


class ProjectFileContent(BaseModel):
    name: str
    path: str
    size: int
    modified: str
    type: str
    content: Optional[Any] = None
    url: Optional[str] = None
