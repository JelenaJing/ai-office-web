"""
项目文件夹管理器
类似Cursor IDE的项目管理，每个论文创建一个项目文件夹
"""
import os
import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any, List
import logging

logger = logging.getLogger(__name__)


class ProjectManager:
    """项目文件夹管理器"""
    
    def __init__(self, projects_root: str = None):
        if projects_root is None:
            from app.config import PROJECTS_ROOT
            projects_root = PROJECTS_ROOT
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
        (project_dir / "remakes" / "introductions").mkdir(parents=True, exist_ok=True)
        (project_dir / "data" / "raw").mkdir(parents=True, exist_ok=True)
        (project_dir / "data" / "processed").mkdir(parents=True, exist_ok=True)
        (project_dir / "data" / "plots").mkdir(parents=True, exist_ok=True)
        (project_dir / "references").mkdir(parents=True, exist_ok=True)
        (project_dir / "references" / "openalex_cache").mkdir(parents=True, exist_ok=True)
        (project_dir / "drafts").mkdir(exist_ok=True)
        (project_dir / "final").mkdir(exist_ok=True)
        
        # 保存原始PDF文件
        if paper_content:
            if paper_filename.endswith('.pdf'):
                paper_path = project_dir / "paper.pdf"
            else:
                paper_path = project_dir / "paper.txt"
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
        
        logger.info(f"Project created: {project_dir}")
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
        elif remake_type == "experiment_extract":
            save_dir = project_dir / "remakes" / "experiments"
            filename = f"experiment_extract_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        elif remake_type == "experiment_visualize":
            save_dir = project_dir / "remakes" / "experiments"
            filename = f"experiment_visualize_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        elif remake_type == "experiment_recipe":
            save_dir = project_dir / "remakes" / "experiments"
            filename = f"experiment_recipe_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        elif remake_type == "theory":
            save_dir = project_dir / "remakes" / "theory"
            filename = f"theory_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
        elif remake_type == "overall_check":
            save_dir = project_dir / "remakes" / "overall_check"
            filename = f"check_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        elif remake_type == "introduction":
            save_dir = project_dir / "remakes" / "introductions"
            filename = f"intro_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        elif remake_type == "reference_insert":
            save_dir = project_dir / "remakes" / "content_updates"
            filename = f"reference_insert_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        else:
            raise ValueError(f"未知的remake类型: {remake_type}")
        
        save_dir.mkdir(parents=True, exist_ok=True)
        save_path = save_dir / filename
        
        # 特殊处理：experiment_recipe 类型保存为设备可用的格式（直接保存 recipe_export 内容）
        if remake_type == "experiment_recipe" and isinstance(result, dict):
            # 如果result包含recipe_export字段，提取它；否则result本身就是设备格式
            if "recipe_export" in result:
                device_recipe = result["recipe_export"]
            else:
                # result本身就是设备格式（顶层字段：exportedAt, formulaName, recipe等）
                device_recipe = result
            self._atomic_write_json(save_path, device_recipe)
        # 保存文件
        elif filename.endswith('.json'):
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
        
        logger.info(f"Remake result saved: {save_path}")
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

    def save_collage(self, project_id: str, image_data: bytes) -> str:
        """
        保存多图拼合 PNG 到项目 data/plots（与自动作图结果同目录，便于在项目中查看）。
        """
        project_dir = self.get_project_dir(project_id)
        if not project_dir:
            raise ValueError(f"项目不存在: {project_id}")

        save_dir = project_dir / "data" / "plots"
        save_dir.mkdir(parents=True, exist_ok=True)
        filename = f"collage_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
        save_path = save_dir / filename

        with open(save_path, 'wb') as f:
            f.write(image_data)

        self._atomic_write_json(
            save_dir / f"{filename}.metadata.json",
            {
                "kind": "image_collage",
                "filename": filename,
                "saved_at": datetime.now().isoformat(),
            },
        )

        self._append_history(project_dir, {
            "type": "collage_saved",
            "filename": filename,
            "timestamp": datetime.now().isoformat(),
        })

        logger.info(f"Collage saved: {save_path}")
        return str(save_path)

    def save_generated_image(
        self,
        project_id: str,
        *,
        image_data: bytes,
        image_prompt: str,
        task_id: str | None = None,
        filename_prefix: str = "genimg",
    ) -> Dict[str, Any]:
        """
        保存 AI 生成图片 PNG 到项目 data/plots，并写入元数据。

        Returns:
            dict with:
            - abs_path: absolute path on disk
            - rel_path: path relative to project root (for /files/{file_path})
            - filename: basename
            - metadata_path: absolute path of metadata json
        """
        project_dir = self.get_project_dir(project_id)
        if not project_dir:
            raise ValueError(f"项目不存在: {project_id}")

        save_dir = project_dir / "data" / "plots"
        save_dir.mkdir(parents=True, exist_ok=True)
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{filename_prefix}_{ts}.png"
        save_path = save_dir / filename

        with open(save_path, "wb") as f:
            f.write(image_data)

        metadata = {
            "kind": "generated_image",
            "filename": filename,
            "saved_at": datetime.now().isoformat(),
            "image_prompt": image_prompt,
            "draw_task_id": task_id,
        }
        metadata_path = save_dir / f"{filename}.metadata.json"
        self._atomic_write_json(metadata_path, metadata)

        self._append_history(
            project_dir,
            {
                "type": "generated_image_saved",
                "filename": filename,
                "timestamp": datetime.now().isoformat(),
            },
        )

        logger.info(f"Generated image saved: {save_path}")
        return {
            "abs_path": str(save_path),
            "rel_path": str(save_path.relative_to(project_dir)),
            "filename": filename,
            "metadata_path": str(metadata_path),
        }

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
                versions = []
                for f in existing_drafts:
                    try:
                        v = int(f.stem.split('_v')[1])
                        versions.append(v)
                    except:
                        pass
                version = max(versions) + 1 if versions else 1
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
                if isinstance(content, str):
                    content = content.encode('utf-8')
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
                    try:
                        with open(meta_path, 'r', encoding='utf-8') as f:
                            projects.append(json.load(f))
                    except:
                        pass
        return sorted(projects, key=lambda x: x.get('created_at', ''), reverse=True)
    
    def _atomic_write_json(self, path: Path, data: Any):
        """原子写入JSON文件"""
        tmp_path = path.with_suffix('.tmp')
        with open(tmp_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        tmp_path.replace(path)
    
    def list_project_files(self, project_id: str, relative_path: str = "") -> List[Dict[str, Any]]:
        """
        列出项目文件
        
        Args:
            project_id: 项目ID
            relative_path: 相对路径（相对于项目根目录）
        
        Returns:
            文件列表
        """
        project_dir = self.get_project_dir(project_id)
        if not project_dir:
            raise ValueError(f"项目不存在: {project_id}")
        
        target_dir = project_dir / relative_path if relative_path else project_dir
        if not target_dir.exists() or not target_dir.is_dir():
            return []
        
        files = []
        for item in sorted(target_dir.iterdir()):
            # 跳过隐藏文件和特殊文件
            if item.name.startswith('.') or item.name == '__pycache__':
                continue
            
            rel_path = str(item.relative_to(project_dir))
            file_info = {
                "name": item.name,
                "path": rel_path,
                "is_directory": item.is_dir(),
                "size": item.stat().st_size if item.is_file() else 0,
                "modified": datetime.fromtimestamp(item.stat().st_mtime).isoformat(),
            }
            files.append(file_info)
        
        return files
    
    def get_file_content(self, project_id: str, file_path: str) -> Dict[str, Any]:
        """
        获取文件内容
        
        Args:
            project_id: 项目ID
            file_path: 文件相对路径
        
        Returns:
            文件内容字典
        """
        project_dir = self.get_project_dir(project_id)
        if not project_dir:
            raise ValueError(f"项目不存在: {project_id}")
        
        file_full_path = project_dir / file_path
        if not file_full_path.exists():
            raise ValueError(f"文件不存在: {file_path}")
        
        # 确保文件在项目目录内（安全校验）
        try:
            file_full_path.resolve().relative_to(project_dir.resolve())
        except ValueError:
            raise ValueError(f"非法文件路径: {file_path}")
        
        file_info = {
            "name": file_full_path.name,
            "path": file_path,
            "size": file_full_path.stat().st_size,
            "modified": datetime.fromtimestamp(file_full_path.stat().st_mtime).isoformat(),
        }
        
        # 根据文件类型读取内容
        if file_full_path.suffix in ['.json', '.jsonl']:
            with open(file_full_path, 'r', encoding='utf-8') as f:
                if file_full_path.suffix == '.jsonl':
                    content = [json.loads(line) for line in f if line.strip()]
                else:
                    content = json.load(f)
            file_info["content"] = content
            file_info["type"] = "json"
        elif file_full_path.suffix in ['.txt', '.md', '.tex']:
            with open(file_full_path, 'r', encoding='utf-8') as f:
                file_info["content"] = f.read()
            file_info["type"] = "text"
        elif file_full_path.suffix in ['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.svg']:
            # 二进制文件返回URL路径
            file_info["type"] = "binary"
            file_info["url"] = f"/api/v1/paper/{project_id}/files/{file_path}"
        else:
            # 其他文件类型尝试作为文本读取
            try:
                with open(file_full_path, 'r', encoding='utf-8') as f:
                    file_info["content"] = f.read()
                file_info["type"] = "text"
            except:
                file_info["type"] = "binary"
                file_info["url"] = f"/api/v1/paper/{project_id}/files/{file_path}"
        
        return file_info
    
    def _append_history(self, project_dir: Path, record: Dict[str, Any]):
        """追加操作历史"""
        history_path = project_dir / "history.jsonl"
        with open(history_path, 'a', encoding='utf-8') as f:
            f.write(json.dumps(record, ensure_ascii=False) + '\n')
