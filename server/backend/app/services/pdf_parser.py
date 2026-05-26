"""
PDF解析服务
复用NFTCORE的PDF解析功能
"""
import os
import tempfile
from typing import Optional
from pathlib import Path


def extract_text_from_pdf(pdf_path: str) -> str:
    """
    从PDF文件中提取文本内容
    
    Args:
        pdf_path: PDF文件路径
    
    Returns:
        str: 提取的文本内容
    
    Raises:
        FileNotFoundError: 文件不存在
        ValueError: 文件格式错误或无法解析
    """
    try:
        # 检查文件是否存在
        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"PDF文件不存在: {pdf_path}")
        
        # 尝试使用pdfplumber（优先）
        try:
            import pdfplumber
            
            text_content = []
            with pdfplumber.open(pdf_path) as pdf:
                for i, page in enumerate(pdf.pages, 1):
                    text = page.extract_text()
                    if text:
                        text_content.append(f"=== 第 {i} 页 ===\n{text}\n")
            
            full_text = "\n".join(text_content)
            return full_text
            
        except ImportError:
            # 如果pdfplumber不可用，尝试PyPDF2
            import PyPDF2
            
            text_content = []
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                total_pages = len(pdf_reader.pages)
                
                for i, page in enumerate(pdf_reader.pages, 1):
                    text = page.extract_text()
                    if text:
                        text_content.append(f"=== 第 {i} 页 ===\n{text}\n")
            
            full_text = "\n".join(text_content)
            return full_text
            
    except ImportError as e:
        error_msg = "PDF解析库未安装。请安装 pdfplumber 或 PyPDF2: pip install pdfplumber 或 pip install PyPDF2"
        raise ImportError(error_msg) from e
    except Exception as e:
        error_msg = f"PDF解析失败: {str(e)}"
        raise ValueError(error_msg) from e


def extract_text_from_pdf_file(file_content: bytes, filename: Optional[str] = None) -> str:
    """
    从上传的PDF文件内容中提取文本
    
    Args:
        file_content: PDF文件的二进制内容
        filename: 文件名（可选，用于日志）
    
    Returns:
        str: 提取的文本内容
    """
    try:
        # 创建临时文件
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
            tmp_file.write(file_content)
            tmp_path = tmp_file.name
        
        try:
            # 使用临时文件路径提取文本
            text = extract_text_from_pdf(tmp_path)
            return text
        finally:
            # 清理临时文件
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
                
    except Exception as e:
        error_msg = f"从文件内容提取文本失败: {str(e)}"
        raise ValueError(error_msg) from e
