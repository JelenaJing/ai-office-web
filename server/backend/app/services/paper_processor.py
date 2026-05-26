"""
论文处理核心逻辑
"""
from __future__ import annotations

import os
import time
from typing import Any, Dict, Optional
from pathlib import Path
from app.project_manager import ProjectManager
from app.services.pdf_parser import extract_text_from_pdf
from app.services.text_cleaner import extract_clean_text
import logging

logger = logging.getLogger(__name__)


class PaperProcessor:
    """论文处理器"""
    
    def __init__(self):
        self.project_manager = ProjectManager()

    @staticmethod
    def _atomic_write_text(path: Path, content: str) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        tmp = path.with_suffix(path.suffix + ".tmp")
        tmp.write_text(content, encoding="utf-8")
        tmp.replace(path)

    @staticmethod
    def _acquire_lock(lock_path: Path, *, timeout_seconds: int = 300) -> bool:
        """
        Best-effort file lock using O_EXCL.
        Returns True if acquired, False otherwise.
        """
        deadline = time.time() + max(1, int(timeout_seconds))
        while time.time() < deadline:
            try:
                fd = os.open(str(lock_path), os.O_CREAT | os.O_EXCL | os.O_WRONLY)
                os.close(fd)
                return True
            except FileExistsError:
                time.sleep(0.2)
            except Exception:
                time.sleep(0.5)
        return False

    @staticmethod
    def _release_lock(lock_path: Path) -> None:
        try:
            lock_path.unlink(missing_ok=True)
        except Exception:
            pass
    
    def process_paper(self, project_id: str) -> Dict[str, Any]:
        """
        处理论文
        
        Args:
            project_id: 项目ID
        
        Returns:
            处理结果
        """
        project_dir = self.project_manager.get_project_dir(project_id)
        if not project_dir:
            raise ValueError(f"项目不存在: {project_id}")
        
        # 读取论文内容
        text_path = project_dir / "original" / "extracted_text.txt"
        pdf_path = project_dir / "paper.pdf"
        
        if text_path.exists():
            with open(text_path, 'r', encoding='utf-8') as f:
                content = f.read()
        elif pdf_path.exists():
            content = extract_text_from_pdf(str(pdf_path))
            # 保存提取的文本
            with open(text_path, 'w', encoding='utf-8') as f:
                f.write(content)
        else:
            raise ValueError("无法找到论文内容")
        
        return {
            "project_id": project_id,
            "content": content,
            "content_length": len(content)
        }

    def get_paper_text(self, project_id: str, *, variant: str = "cleaned", force_reclean: bool = False) -> str:
        """
        Get paper text for downstream processing.

        variant:
        - "raw": extracted text (from pdf) without LLM cleaning
        - "cleaned": cleaned text cached on disk; generated once per project
        """
        project_dir = self.project_manager.get_project_dir(project_id)
        if not project_dir:
            raise ValueError(f"项目不存在: {project_id}")

        raw_path = project_dir / "original" / "extracted_text.txt"
        cleaned_path = project_dir / "original" / "cleaned_text.txt"
        lock_path = project_dir / "original" / ".cleaned_text.lock"

        if variant == "raw":
            if raw_path.exists():
                return raw_path.read_text(encoding="utf-8", errors="ignore")
            # fallback: trigger extraction
            return self.process_paper(project_id).get("content", "") or ""

        if variant != "cleaned":
            raise ValueError(f"Unknown variant: {variant}")

        if cleaned_path.exists() and (not force_reclean):
            txt = cleaned_path.read_text(encoding="utf-8", errors="ignore").strip()
            if txt:
                return txt

        acquired = self._acquire_lock(lock_path, timeout_seconds=300)
        try:
            # Re-check after lock (maybe another request just created it)
            if cleaned_path.exists() and (not force_reclean):
                txt = cleaned_path.read_text(encoding="utf-8", errors="ignore").strip()
                if txt:
                    return txt

            raw_text = self.get_paper_text(project_id, variant="raw")
            cleaned = extract_clean_text(raw_text)
            cleaned = (cleaned or "").strip()
            if not cleaned:
                # Avoid caching empty result; return raw as last resort
                return raw_text
            self._atomic_write_text(cleaned_path, cleaned)
            return cleaned
        finally:
            if acquired:
                self._release_lock(lock_path)
