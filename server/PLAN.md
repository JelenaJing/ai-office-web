# 论文Remake系统实现计划（更新版）

## 一、系统架构

### 1.1 整体架构
- **后端**：独立的FastAPI服务（类似experiment-plot-agent）
- **前端**：React + Vite + TypeScript独立应用
- **集成**：复用NFTCORE的PDF解析、OpenAlex集成；调用experiment-plot-agent的绘图API
- **项目文件夹管理**：类似Cursor IDE，每个论文创建一个项目文件夹，所有内容保存在其中

### 1.2 目录结构
```
paper-remake-service/
├── backend/                    # FastAPI后端
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # FastAPI应用入口
│   │   ├── config.py          # 配置管理
│   │   ├── models.py          # 数据模型
│   │   ├── project_manager.py # 项目文件夹管理器（新增）
│   │   ├── agents/            # 6个功能Agent模块
│   │   │   ├── __init__.py
│   │   │   ├── idea_generator.py      # 1. 生成新科研idea
│   │   │   ├── content_checker.py     # 2. 检查内容和reference
│   │   │   ├── experiment_designer.py  # 3. 重新设计实验
│   │   │   ├── data_plotter.py         # 4. 数据接收和绘图
│   │   │   ├── theory_analyzer.py      # 5. 理论分析和公式推导
│   │   │   └── overall_checker.py     # 6. 全文整体检查
│   │   ├── services/          # 服务层
│   │   │   ├── __init__.py
│   │   │   ├── pdf_parser.py          # PDF解析（复用NFTCORE）
│   │   │   ├── openalex_client.py     # OpenAlex集成（复用NFTCORE）
│   │   │   ├── plot_agent_client.py   # experiment-plot-agent客户端
│   │   │   └── paper_processor.py     # 论文处理核心逻辑
│   │   └── routers/           # API路由
│   │       ├── __init__.py
│   │       ├── paper.py       # 论文上传和处理
│   │       ├── remake.py      # Remake功能API
│   │       └── data.py         # 数据上传和绘图
│   ├── requirements.txt
│   └── .env.example
├── frontend/                   # React前端
│   ├── src/
│   │   ├── components/
│   │   │   ├── Editor/               # Monaco编辑器组件
│   │   │   │   ├── MonacoEditor.tsx
│   │   │   │   └── EditorToolbar.tsx
│   │   │   ├── PDFViewer/            # PDF预览组件
│   │   │   │   ├── PDFViewer.tsx
│   │   │   │   └── PDFControls.tsx
│   │   │   ├── Sidebar/              # 功能侧边栏
│   │   │   │   ├── FunctionPanel.tsx
│   │   │   │   └── FunctionButton.tsx
│   │   │   ├── TextSelector/        # 文本选择器
│   │   │   │   ├── TextHighlighter.tsx
│   │   │   │   └── SelectionMenu.tsx
│   │   │   ├── ProjectExplorer/      # 项目文件浏览器（新增）
│   │   │   │   ├── FileTree.tsx
│   │   │   │   └── FileViewer.tsx
│   │   │   └── Layout/               # 布局组件
│   │   │       ├── MainLayout.tsx
│   │   │       └── SplitPane.tsx
│   │   ├── services/
│   │   │   ├── api.ts                # API客户端
│   │   │   └── remakeService.ts     # Remake服务封装
│   │   ├── hooks/
│   │   │   ├── useTextSelection.ts   # 文本选择hook
│   │   │   └── useRemake.ts          # Remake功能hook
│   │   ├── types/
│   │   │   └── index.ts              # TypeScript类型定义
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── shared/                     # 共享代码（可选）
│   └── types.py                # Python/TypeScript共享类型
└── README.md

```

## 二、项目文件夹管理（IDE式）

### 2.1 项目文件夹结构

当用户上传一篇论文时，系统立即创建一个项目文件夹，结构如下：

```
projects/
└── {timestamp}_{paper_id}/          # 项目根目录
    ├── paper.pdf                    # 原始PDF文件
    ├── paper.txt                    # 提取的文本（如果上传的是文本）
    ├── paper_meta.json              # 论文元数据
    ├── original/                    # 原始内容备份
    │   ├── extracted_text.txt
    │   └── pdf_pages/              # PDF页面图片（可选）
    ├── remakes/                     # Remake结果
    │   ├── ideas/                  # Idea生成结果
    │   │   ├── idea_001.json
    │   │   └── idea_002.json
    │   ├── content_updates/         # 内容更新记录
    │   │   ├── update_001.json     # 包含原文本、新文本、更新的references
    │   │   └── update_002.json
    │   ├── experiments/             # 实验设计
    │   │   ├── experiment_design_001.json
    │   │   └── recipe_001.md
    │   ├── theory/                 # 理论分析
    │   │   ├── theory_analysis_001.md
    │   │   └── formulas_001.tex
    │   └── overall_check/          # 全文检查结果
    │       └── check_report.json
    ├── data/                       # 实验数据
    │   ├── raw/                    # 原始数据文件
    │   │   ├── data_001.csv
    │   │   └── data_002.json
    │   ├── processed/              # 处理后的数据
    │   │   └── processed_001.csv
    │   └── plots/                  # 生成的图表
    │       ├── plot_001.png
    │       ├── plot_001.pdf
    │       └── plot_metadata.json
    ├── references/                 # 参考文献
    │   ├── original_refs.bib       # 原始参考文献
    │   ├── updated_refs.bib        # 更新后的参考文献
    │   └── openalex_cache/        # OpenAlex搜索结果缓存
    │       └── search_001.json
    ├── drafts/                     # 草稿版本
    │   ├── draft_v1.md
    │   ├── draft_v2.md
    │   └── draft_v3.md
    ├── final/                      # 最终版本
    │   ├── remade_paper.md
    │   ├── remade_paper.pdf
    │   └── remade_paper.tex
    ├── history.jsonl               # 操作历史（JSONL格式）
    └── project_config.json         # 项目配置
```

### 2.2 项目管理器实现

**`backend/app/project_manager.py`**

```python
"""
项目文件夹管理器
类似Cursor IDE的项目管理，每个论文创建一个项目文件夹
"""
import os
import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any
from log_config import get_logger

logger = get_logger('project_manager')

class ProjectManager:
    """项目文件夹管理器"""
    
    def __init__(self, projects_root: str = "projects"):
        self.projects_root = Path(projects_root)
        self.projects_root.mkdir(parents=True, exist_ok=True)
    
    def create_project(self, paper_filename: str, paper_content: bytes = None) -> Dict[str, Any]:
        """
        创建新项目文件夹
        
        Args:
            paper_filename: 论文文件名
            paper_content: 论文文件内容（字节）
        
        Returns:
            项目信息字典
        """
        # 生成项目ID和时间戳
        paper_id = str(uuid.uuid4())[:8]
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        project_dir = self.projects_root / f"{timestamp}_{paper_id}"
        
        # 创建目录结构
        project_dir.mkdir(parents=True, exist_ok=True)
        (project_dir / "original").mkdir(exist_ok=True)
        (project_dir / "remakes" / "ideas").mkdir(parents=True, exist_ok=True)
        (project_dir / "remakes" / "content_updates").mkdir(parents=True, exist_ok=True)
        (project_dir / "remakes" / "experiments").mkdir(parents=True, exist_ok=True)
        (project_dir / "remakes" / "theory").mkdir(parents=True, exist_ok=True)
        (project_dir / "remakes" / "overall_check").mkdir(parents=True, exist_ok=True)
        (project_dir / "data" / "raw").mkdir(parents=True, exist_ok=True)
        (project_dir / "data" / "processed").mkdir(parents=True, exist_ok=True)
        (project_dir / "data" / "plots").mkdir(parents=True, exist_ok=True)
        (project_dir / "references").mkdir(parents=True, exist_ok=True)
        (project_dir / "references" / "openalex_cache").mkdir(parents=True, exist_ok=True)
        (project_dir / "drafts").mkdir(exist_ok=True)
        (project_dir / "final").mkdir(exist_ok=True)
        
        # 保存原始PDF文件
        if paper_content:
            paper_path = project_dir / "paper.pdf"
            with open(paper_path, 'wb') as f:
                f.write(paper_content)
        
        # 创建项目元数据
        project_meta = {
            "project_id": paper_id,
            "project_dir": str(project_dir),
            "paper_filename": paper_filename,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "status": "created"
        }
        
        meta_path = project_dir / "paper_meta.json"
        self._atomic_write_json(meta_path, project_meta)
        
        # 创建项目配置
        project_config = {
            "project_id": paper_id,
            "created_at": datetime.now().isoformat(),
            "settings": {
                "auto_save": True,
                "version_control": True
            }
        }
        config_path = project_dir / "project_config.json"
        self._atomic_write_json(config_path, project_config)
        
        # 记录创建事件
        self._append_history(project_dir, {
            "type": "project_created",
            "timestamp": datetime.now().isoformat(),
            "paper_filename": paper_filename
        })
        
        logger.info(f"项目已创建: {project_dir}")
        return project_meta
    
    def save_remake_result(self, project_id: str, remake_type: str, result: Dict[str, Any]) -> str:
        """
        保存Remake结果到项目文件夹
        
        Args:
            project_id: 项目ID
            remake_type: Remake类型（idea/content_update/experiment/theory/overall_check）
            result: Remake结果数据
        
        Returns:
            保存的文件路径
        """
        project_dir = self.get_project_dir(project_id)
        if not project_dir:
            raise ValueError(f"项目不存在: {project_id}")
        
        # 根据类型保存到不同目录
        if remake_type == "idea":
            save_dir = project_dir / "remakes" / "ideas"
            filename = f"idea_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        elif remake_type == "content_update":
            save_dir = project_dir / "remakes" / "content_updates"
            filename = f"update_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        elif remake_type == "experiment":
            save_dir = project_dir / "remakes" / "experiments"
            filename = f"experiment_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        elif remake_type == "theory":
            save_dir = project_dir / "remakes" / "theory"
            filename = f"theory_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
        elif remake_type == "overall_check":
            save_dir = project_dir / "remakes" / "overall_check"
            filename = f"check_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        else:
            raise ValueError(f"未知的remake类型: {remake_type}")
        
        save_path = save_dir / filename
        
        # 保存文件
        if filename.endswith('.json'):
            self._atomic_write_json(save_path, result)
        else:
            with open(save_path, 'w', encoding='utf-8') as f:
                f.write(result if isinstance(result, str) else json.dumps(result, ensure_ascii=False, indent=2))
        
        # 记录历史
        self._append_history(project_dir, {
            "type": "remake_saved",
            "remake_type": remake_type,
            "filename": filename,
            "timestamp": datetime.now().isoformat()
        })
        
        logger.info(f"Remake结果已保存: {save_path}")
        return str(save_path)
    
    def save_data_file(self, project_id: str, file_content: bytes, filename: str, file_type: str = "raw") -> str:
        """
        保存数据文件到项目文件夹
        
        Args:
            project_id: 项目ID
            file_content: 文件内容
            filename: 文件名
            file_type: 文件类型（raw/processed）
        
        Returns:
            保存的文件路径
        """
        project_dir = self.get_project_dir(project_id)
        if not project_dir:
            raise ValueError(f"项目不存在: {project_id}")
        
        if file_type == "raw":
            save_dir = project_dir / "data" / "raw"
        elif file_type == "processed":
            save_dir = project_dir / "data" / "processed"
        else:
            save_dir = project_dir / "data" / "raw"
        
        save_path = save_dir / filename
        with open(save_path, 'wb') as f:
            f.write(file_content)
        
        # 记录历史
        self._append_history(project_dir, {
            "type": "data_file_saved",
            "filename": filename,
            "file_type": file_type,
            "timestamp": datetime.now().isoformat()
        })
        
        return str(save_path)
    
    def save_plot(self, project_id: str, plot_data: bytes, plot_format: str = "png", metadata: Dict = None) -> str:
        """
        保存图表到项目文件夹
        
        Args:
            project_id: 项目ID
            plot_data: 图表数据（字节）
            plot_format: 图表格式（png/pdf/svg）
            metadata: 图表元数据
        
        Returns:
            保存的文件路径
        """
        project_dir = self.get_project_dir(project_id)
        if not project_dir:
            raise ValueError(f"项目不存在: {project_id}")
        
        save_dir = project_dir / "data" / "plots"
        filename = f"plot_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{plot_format}"
        save_path = save_dir / filename
        
        with open(save_path, 'wb') as f:
            f.write(plot_data)
        
        # 保存元数据
        if metadata:
            metadata_path = save_dir / f"{filename}.metadata.json"
            self._atomic_write_json(metadata_path, metadata)
        
        # 记录历史
        self._append_history(project_dir, {
            "type": "plot_saved",
            "filename": filename,
            "format": plot_format,
            "timestamp": datetime.now().isoformat()
        })
        
        return str(save_path)
    
    def save_draft(self, project_id: str, content: str, version: Optional[int] = None) -> str:
        """
        保存草稿版本
        
        Args:
            project_id: 项目ID
            content: 草稿内容
            version: 版本号（如果为None，自动递增）
        
        Returns:
            保存的文件路径
        """
        project_dir = self.get_project_dir(project_id)
        if not project_dir:
            raise ValueError(f"项目不存在: {project_id}")
        
        save_dir = project_dir / "drafts"
        
        # 如果没有指定版本，自动递增
        if version is None:
            existing_drafts = list(save_dir.glob("draft_v*.md"))
            if existing_drafts:
                versions = [int(f.stem.split('_v')[1]) for f in existing_drafts]
                version = max(versions) + 1
            else:
                version = 1
        
        filename = f"draft_v{version}.md"
        save_path = save_dir / filename
        
        with open(save_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        # 记录历史
        self._append_history(project_dir, {
            "type": "draft_saved",
            "version": version,
            "filename": filename,
            "timestamp": datetime.now().isoformat()
        })
        
        return str(save_path)
    
    def save_final(self, project_id: str, content: str, format: str = "md") -> str:
        """
        保存最终版本
        
        Args:
            project_id: 项目ID
            content: 最终内容
            format: 格式（md/pdf/tex）
        
        Returns:
            保存的文件路径
        """
        project_dir = self.get_project_dir(project_id)
        if not project_dir:
            raise ValueError(f"项目不存在: {project_id}")
        
        save_dir = project_dir / "final"
        filename = f"remade_paper.{format}"
        save_path = save_dir / filename
        
        if format in ["md", "tex"]:
            with open(save_path, 'w', encoding='utf-8') as f:
                f.write(content)
        else:
            # PDF需要特殊处理
            with open(save_path, 'wb') as f:
                f.write(content)
        
        # 记录历史
        self._append_history(project_dir, {
            "type": "final_saved",
            "format": format,
            "filename": filename,
            "timestamp": datetime.now().isoformat()
        })
        
        return str(save_path)
    
    def get_project_dir(self, project_id: str) -> Optional[Path]:
        """获取项目目录"""
        # 搜索匹配的项目文件夹
        for project_dir in self.projects_root.iterdir():
            if project_dir.is_dir() and project_dir.name.endswith(f"_{project_id}"):
                return project_dir
        return None
    
    def get_project_meta(self, project_id: str) -> Optional[Dict[str, Any]]:
        """获取项目元数据"""
        project_dir = self.get_project_dir(project_id)
        if not project_dir:
            return None
        
        meta_path = project_dir / "paper_meta.json"
        if meta_path.exists():
            with open(meta_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return None
    
    def list_projects(self) -> List[Dict[str, Any]]:
        """列出所有项目"""
        projects = []
        for project_dir in self.projects_root.iterdir():
            if project_dir.is_dir():
                meta_path = project_dir / "paper_meta.json"
                if meta_path.exists():
                    with open(meta_path, 'r', encoding='utf-8') as f:
                        projects.append(json.load(f))
        return sorted(projects, key=lambda x: x.get('created_at', ''), reverse=True)
    
    def _atomic_write_json(self, path: Path, data: Any):
        """原子写入JSON文件"""
        tmp_path = path.with_suffix('.tmp')
        with open(tmp_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        tmp_path.replace(path)
    
    def _append_history(self, project_dir: Path, record: Dict[str, Any]):
        """追加操作历史"""
        history_path = project_dir / "history.jsonl"
        with open(history_path, 'a', encoding='utf-8') as f:
            f.write(json.dumps(record, ensure_ascii=False) + '\n')
```

### 2.3 API集成

在论文上传API中集成项目管理器：

**`backend/app/routers/paper.py`**

```python
@router.post("/upload")
async def upload_paper(file: UploadFile = File(...)):
    """上传论文并创建项目文件夹"""
    # 读取文件内容
    file_content = await file.read()
    
    # 创建项目
    project_manager = ProjectManager()
    project_meta = project_manager.create_project(
        paper_filename=file.filename,
        paper_content=file_content
    )
    
    # 解析PDF（如果上传的是PDF）
    if file.filename.endswith('.pdf'):
        pdf_text = extract_text_from_pdf_file(file_content)
        # 保存提取的文本
        project_dir = Path(project_meta['project_dir'])
        text_path = project_dir / "original" / "extracted_text.txt"
        with open(text_path, 'w', encoding='utf-8') as f:
            f.write(pdf_text)
    
    return {
        "status": "success",
        "project_id": project_meta['project_id'],
        "project_dir": project_meta['project_dir']
    }
```

### 2.4 前端项目浏览器

**`frontend/src/components/ProjectExplorer/FileTree.tsx`**

- 显示项目文件夹结构
- 支持文件浏览和预览
- 支持文件下载

## 三、后端实现（更新）

### 3.1 所有Agent保存结果到项目文件夹

每个Agent在处理完成后，都通过ProjectManager保存结果：

```python
# 示例：Content Checker Agent
result = content_checker.check(selected_text)
project_manager.save_remake_result(
    project_id=project_id,
    remake_type="content_update",
    result={
        "original_text": selected_text,
        "updated_text": result['updated_text'],
        "updated_references": result['references'],
        "check_issues": result['issues']
    }
)
```

### 3.2 数据文件保存

```python
# 保存上传的数据文件
project_manager.save_data_file(
    project_id=project_id,
    file_content=file_content,
    filename=filename,
    file_type="raw"
)

# 保存生成的图表
project_manager.save_plot(
    project_id=project_id,
    plot_data=plot_image_bytes,
    plot_format="png",
    metadata={"chart_type": "scatter", "data_source": "data_001.csv"}
)
```

## 四、前端实现（更新）

### 4.1 项目浏览器组件

在侧边栏添加项目文件浏览器，显示：
- 项目文件夹结构
- 文件列表
- 文件预览
- 文件下载

### 4.2 项目列表页面

添加项目列表页面，显示：
- 所有项目
- 项目创建时间
- 项目状态
- 快速打开项目

## 五、开发步骤（更新）

### Phase 1: 后端基础框架 + 项目管理器
1. 创建FastAPI项目结构
2. **实现ProjectManager项目文件夹管理器**
3. 实现PDF解析服务（复用NFTCORE代码）
4. 实现基础API路由（上传、创建项目、获取项目信息）
5. 配置CORS和异常处理

### Phase 2: 前端基础框架 + 项目浏览器
1. 创建React + Vite项目
2. 集成Monaco Editor
3. 集成PDF预览组件
4. **实现项目浏览器组件**
5. 实现基础布局（编辑器 + PDF + 侧边栏 + 项目浏览器）

### Phase 3: 文本选择功能
1. 实现编辑器文本选择监听
2. 实现PDF文本选择监听
3. 实现选择同步和高亮
4. 实现功能侧边栏UI

### Phase 4: 功能Agent实现（逐个实现，每个都保存到项目文件夹）
1. **Idea Generator Agent** - 保存到 `remakes/ideas/`
2. **Content & Reference Checker Agent** - 保存到 `remakes/content_updates/`
3. **Experiment Designer Agent** - 保存到 `remakes/experiments/`
4. **Data Plotter Agent** - 保存到 `data/plots/`
5. **Theory Analyzer Agent** - 保存到 `remakes/theory/`
6. **Overall Checker Agent** - 保存到 `remakes/overall_check/`

### Phase 5: 前端功能集成
1. 实现API调用封装
2. 实现各功能的UI交互
3. 实现结果预览和应用
4. **实现项目文件浏览和下载**
5. 实现保存和导出功能

### Phase 6: 优化和测试
1. 性能优化（大文件处理、流式响应）
2. 错误处理完善
3. 单元测试和集成测试
4. 文档编写

## 六、关键实现细节（更新）

### 6.1 项目文件夹命名规则
- 格式：`{timestamp}_{paper_id}`
- 示例：`20250115_143022_a1b2c3d4`
- 便于按时间排序和查找

### 6.2 文件保存策略
- 所有操作都保存到项目文件夹
- 使用JSONL格式保存操作历史
- 支持版本管理（草稿版本）

### 6.3 项目恢复
- 通过project_id查找项目文件夹
- 加载项目元数据和配置
- 恢复项目状态

## 七、注意事项（更新）

1. **项目文件夹权限**：确保有读写权限
2. **磁盘空间管理**：大文件可能占用大量空间，考虑清理策略
3. **项目备份**：重要项目需要备份机制
4. **并发访问**：多个用户同时操作同一项目时的文件锁机制
5. **项目导出**：支持将整个项目文件夹打包下载
