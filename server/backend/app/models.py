"""
数据模型定义
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class ProjectCreate(BaseModel):
    """创建项目请求"""
    paper_filename: str
    paper_content: Optional[bytes] = None


class ProjectInfo(BaseModel):
    """项目信息"""
    project_id: str
    project_dir: str
    paper_filename: str
    created_at: str
    updated_at: str
    status: str


class RemakeRequest(BaseModel):
    """Remake请求基类"""
    project_id: str
    selected_text: str
    context: Optional[str] = None


class IdeaRequest(RemakeRequest):
    """生成Idea请求"""
    pass


class ContentCheckRequest(RemakeRequest):
    """检查内容请求"""
    pass


class ExperimentRequest(RemakeRequest):
    """实验设计请求"""
    pass


class TheoryRequest(RemakeRequest):
    """理论分析请求"""
    pass


class PlotRequest(BaseModel):
    """绘图请求"""
    project_id: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    file_path: Optional[str] = None
    chart_type: Optional[str] = None
    data_type: Optional[str] = None
    template_id: Optional[str] = None
    use_llm_type_detection: bool = True
    auto_recommend: bool = True


class OverallCheckRequest(BaseModel):
    """全文检查请求"""
    project_id: str


class IntroductionRemakeRequest(BaseModel):
    """Introduction 顶刊文献重写请求"""
    project_id: str
    selected_text: Optional[str] = ""
    context: Optional[str] = None
    auto_extract_intro: bool = False
    max_papers_for_llm: int = Field(default=100, ge=1, le=200)


class ReferenceInsertRequest(BaseModel):
    """全文 Reference 插入请求"""
    project_id: str
    paper_markdown: str
    topic: Optional[str] = None
    year_from: Optional[int] = None
    year_to: Optional[int] = None


class ExperimentExtractRequest(BaseModel):
    """提取实验内容请求"""
    project_id: str
    selected_text: Optional[str] = None  # 可选：如果提供则只处理选中部分


class ExperimentVisualizeRequest(BaseModel):
    """实验可视化请求"""
    project_id: str
    experiment_steps: str  # 实验步骤文本


class FullTextMultiRoundRequest(BaseModel):
    """全文分段多轮分析请求（后端负责切分与综合）"""
    project_id: str
    # Optional override: when provided, use this text instead of reading from project content
    full_text: Optional[str] = None
    target_chars: int = Field(default=6000, ge=1000, le=20000)
    overlap_chars: int = Field(default=300, ge=0, le=5000)


class FullPaperRemakeRequest(BaseModel):
    """全文 CoRemake：清洗全文后并行子任务并组装论文 Markdown"""
    project_id: str
    force_reclean: bool = False
    max_papers_for_llm: int = Field(default=72, ge=1, le=200)
    context: Optional[str] = None
    target_chars: int = Field(default=6000, ge=1000, le=20000)
    overlap_chars: int = Field(default=300, ge=0, le=5000)


class ExperimentRecipeRequest(BaseModel):
    """实验步骤转写为机器配方（DeepSyn Step5）请求"""
    project_id: str
    operations: List[Dict[str, Any]] = Field(default_factory=list)  # 来自步骤3/4的operations
    formula_name: Optional[str] = None
    device_number: Optional[str] = None
    org_number: Optional[str] = None
    backend_url: Optional[str] = None
    equipment_type: Optional[int] = 6


class DomainGenerateRequest(BaseModel):
    """输入主题/段落，生成约500词英文 + 图片"""
    project_id: Optional[str] = None
    topic: Optional[str] = None
    paragraph: Optional[str] = None
    word_count: int = Field(default=500, ge=200, le=1200)
    context: Optional[str] = None
    # True: SSE（text/event-stream），先推送英文与 image prompt 的增量，最后 done 含完整结果；False: 单次 JSON
    stream: bool = False

    # draw gateway params (grsai-draw-gateway)
    aspect_ratio: str = "16:9"
    draw_model: str = "nano-banana-pro"
    image_size: str = "1K"
    timeout_seconds: int = Field(default=300, ge=30, le=1800)
    poll_interval_seconds: int = Field(default=3, ge=1, le=30)


class RemakeResponse(BaseModel):
    """Remake响应基类"""
    status: str = "success"
    message: str = ""
    data: Optional[Dict[str, Any]] = None


class IdeaResponse(RemakeResponse):
    """Idea生成响应"""
    ideas: List[Dict[str, Any]] = []


class DomainGenerateResponse(RemakeResponse):
    """领域英文生成 + 图片生成响应"""
    project_id: str
    english_text: str
    image_prompt: str
    image_path: Optional[str] = None
    image_file_url: Optional[str] = None
    draw_task_id: Optional[str] = None


class ContentCheckResponse(RemakeResponse):
    """内容检查响应"""
    original_text: str
    updated_text: str
    updated_references: List[Dict[str, Any]] = []
    issues: List[Dict[str, Any]] = []


class ExperimentResponse(RemakeResponse):
    """实验设计响应"""
    experiment_design: Dict[str, Any]
    recipe: str


class TheoryResponse(RemakeResponse):
    """理论分析响应"""
    analysis: str
    formulas: List[str] = []
    derivation_steps: List[str] = []


class PlotResponse(RemakeResponse):
    """绘图响应"""
    plot_url: Optional[str] = None
    plot_path: Optional[str] = None
    plot_base64: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class OverallCheckResponse(RemakeResponse):
    """全文检查响应"""
    issues: List[Dict[str, Any]] = []
    suggestions: List[str] = []


class ExperimentExtractResponse(RemakeResponse):
    """实验提取响应"""
    experiment_text: str = ""  # 格式化的实验步骤文本
    sections: List[Dict[str, Any]] = []  # 识别的实验章节
    summary: str = ""  # 实验内容摘要
    confidence: str = "low"  # 提取置信度：high/medium/low


class ExperimentVisualizeResponse(RemakeResponse):
    """实验可视化响应"""
    operations: List[Dict[str, Any]] = []  # JSON格式的操作列表
    stats: Dict[str, Any] = {}  # 统计信息
    visualization_data: Optional[Dict[str, Any]] = None  # 可视化元数据


class ExperimentPipelineResponse(RemakeResponse):
    """实验链路：提取 -> DeepSyn可视化（合并返回）"""
    extract: ExperimentExtractResponse
    visualize: ExperimentVisualizeResponse


class ExperimentRecipeResponse(RemakeResponse):
    """机器配方转写响应"""
    recipe_export: Dict[str, Any] = Field(default_factory=dict)
    stats: Dict[str, Any] = Field(default_factory=dict)
    saved_path: Optional[str] = None
    operations_in: Optional[List[Dict[str, Any]]] = None  # 输入的操作列表，供前端预览


class FullPaperRemakeResponse(RemakeResponse):
    """全文 CoRemake 响应（非流式）"""
    markdown: str = ""
    errors: List[Dict[str, Any]] = Field(default_factory=list)
    sections: Dict[str, Any] = Field(default_factory=dict)
    parallel_jobs: Dict[str, Any] = Field(default_factory=dict)


class IntroductionRemakeResponse(RemakeResponse):
    """Introduction 重写响应"""
    allowed_journals: List[Dict[str, Any]] = Field(default_factory=list)
    literature_pool: List[Dict[str, Any]] = Field(default_factory=list)
    literature_pool_meta: Dict[str, Any] = Field(default_factory=dict)
    original_introduction: str = ""
    remade_introduction: str = ""
    references: List[Dict[str, Any]] = Field(default_factory=list)
    continuity_notes: str = ""
    original_reference_audit: List[Dict[str, Any]] = Field(default_factory=list)
    search_topic: str = ""
    min_publication_year: int = 0


class ReferenceInsertResponse(RemakeResponse):
    """全文 Reference 插入响应"""
    updated_markdown: str = ""
    reference_list: List[str] = Field(default_factory=list)
    sentence_changes: List[Dict[str, Any]] = Field(default_factory=list)
    year_range: Optional[str] = None


class ProjectFile(BaseModel):
    """项目文件信息"""
    name: str
    path: str
    is_directory: bool
    size: int
    modified: str


class ProjectFileList(BaseModel):
    """项目文件列表响应"""
    project_id: str
    path: str
    files: List[ProjectFile]


class ProjectFileContent(BaseModel):
    """项目文件内容响应"""
    name: str
    path: str
    size: int
    modified: str
    type: str  # json, text, binary
    content: Optional[Any] = None
    url: Optional[str] = None
