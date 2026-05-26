"""
Overall Checker Agent
全文整体检查
"""
import os
from typing import Dict, Any, List
from openai import OpenAI
from app.config import DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL, DEEPSEEK_MODEL
from app.project_manager import ProjectManager
from app.services.paper_processor import PaperProcessor
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

def get_client():
    """获取OpenAI客户端（延迟初始化）"""
    return OpenAI(
        api_key=DEEPSEEK_API_KEY,
        base_url=DEEPSEEK_BASE_URL,
    )


def check_overall(
    project_id: str
) -> Dict[str, Any]:
    """
    全文整体检查
    
    Args:
        project_id: 项目ID
    
    Returns:
        检查报告
    """
    try:
        # Use cached cleaned fulltext (created once per project)
        paper_text = PaperProcessor().get_paper_text(project_id, variant="cleaned")
        
        # 限制文本长度（避免token过多）
        if len(paper_text) > 30000:
            paper_text = paper_text[:30000] + "\n\n[文本已截断]"
        
        check_prompt = f"""
        对以下学术论文进行全文整体检查，识别以下问题：
        1. 结构完整性（是否有缺失的章节）
        2. 逻辑连贯性（章节之间是否连贯）
        3. 引用格式一致性（引用格式是否统一）
        4. 语言和表达（是否有语法错误、表达不清）
        5. 数据一致性（数据是否前后一致）
        
        论文内容：
        {paper_text}
        
        返回JSON格式：
        {{
            "issues": [
                {{
                    "type": "问题类型",
                    "location": "问题位置（章节/段落）",
                    "description": "问题描述",
                    "severity": "high/medium/low",
                    "suggestion": "修正建议"
                }}
            ],
            "suggestions": [
                "整体改进建议1",
                "整体改进建议2"
            ]
        }}
        """
        
        client = get_client()
        response = client.chat.completions.create(
            model=DEEPSEEK_MODEL,
            messages=[
                {"role": "system", "content": "你是一个学术论文审查专家，擅长发现论文中的各种问题。"},
                {"role": "user", "content": check_prompt}
            ],
            max_tokens=2000,
            temperature=0.3
        )
        
        import json
        import re
        response_text = response.choices[0].message.content.strip()
        
        if response_text.startswith('```'):
            response_text = re.sub(r'^```(?:json)?\n?', '', response_text)
            response_text = re.sub(r'\n?```$', '', response_text)
        
        result = json.loads(response_text)
        
        return {
            "issues": result.get("issues", []),
            "suggestions": result.get("suggestions", [])
        }
        
    except Exception as e:
        logger.error(f"Overall check failed: {e}")
        return {
            "issues": [],
            "suggestions": [f"检查过程出错: {str(e)}"]
        }
