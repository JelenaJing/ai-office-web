"""
Idea Generator Agent
结合最新科研成果，生成新科研idea
"""
import json
import re
from typing import List, Dict, Any, Optional
from app.services.openalex_client import OpenAlexClient
from app.services import unified_llm
import logging

logger = logging.getLogger(__name__)

def get_openalex_client():
    """获取OpenAlex客户端（延迟初始化）"""
    return OpenAlexClient()


def generate_ideas(
    project_id: str,
    selected_text: str,
    context: str = None,
    *,
    strict_errors: bool = False,
) -> List[Dict[str, Any]]:
    """
    生成新科研idea
    
    Args:
        project_id: 项目ID
        selected_text: 选中的文本
        context: 上下文信息
    
    Returns:
        Idea列表
    """
    try:
        # 注意: selected_text 已经由调用方通过 _read_full_text() 进行了清洗和缓存
        # 无需再次调用 extract_clean_text，避免重复的 LLM 清洗调用
        logger.info("[Idea Generation] Using pre-cleaned text, skipping redundant cleaning")
        
        # 1. 从选中文本提取关键词，搜索最新论文
        # 简化版：使用LLM提取关键词
        keywords_prompt = f"""
        从以下文本中提取3-5个核心科研关键词，用于搜索最新相关论文：
        
        文本：{selected_text}
        
        只返回关键词，用逗号分隔。
        """
        
        keywords = unified_llm.chat_completion(
            [
                {"role": "system", "content": "你是一个科研关键词提取专家。"},
                {"role": "user", "content": keywords_prompt},
            ],
            max_tokens=100,
            temperature=0.3,
        )
        
        # 2. 搜索最新论文
        openalex_client = get_openalex_client()
        latest_papers = openalex_client.search_latest_papers(keywords, max_results=10)
        
        # 3. 使用LLM生成新idea
        papers_summary = "\n".join([
            f"- {p.get('title', 'N/A')} ({p.get('publication_year', 'N/A')})"
            for p in latest_papers[:5]
        ])
        
        idea_prompt = f"""
        基于以下文本和最新相关研究，生成3-5个新的科研idea。
        
        原始文本：
        {selected_text}
        
        最新相关研究：
        {papers_summary}
        
        请为每个idea提供：
        1. Idea标题
        2. 简要描述
        3. 创新点
        4. 相关参考文献
        
        以JSON格式返回，格式：
        {{
            "ideas": [
                {{
                    "title": "Idea标题",
                    "description": "描述",
                    "innovation": "创新点",
                    "references": ["参考文献1", "参考文献2"]
                }}
            ]
        }}
        """
        
        response_text = unified_llm.chat_completion(
            [
                {"role": "system", "content": "你是一个科研创新专家，擅长基于现有研究提出新idea。"},
                {"role": "user", "content": idea_prompt},
            ],
            max_tokens=2000,
            temperature=0.7,
        )

        if response_text.startswith("```"):
            response_text = re.sub(r"^```(?:json)?\n?", "", response_text)
            response_text = re.sub(r"\n?```$", "", response_text)

        result = json.loads(response_text)
        ideas = result.get("ideas", [])

        logger.info(f"Generated {len(ideas)} new ideas")
        return ideas

    except Exception as e:
        logger.error(f"Idea generation failed: {e}")
        if strict_errors:
            raise
        return [{
            "title": "基于现有研究的扩展",
            "description": "基于选中文本的研究方向，可以进一步探索...",
            "innovation": "结合最新技术和方法",
            "references": [],
        }]
