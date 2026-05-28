"""
Idea Generator Agent
结合最新科研成果，生成新科研idea
"""
import json
import logging
import os
import re
from typing import Any, Dict, List, Optional

from app.services import unified_llm
from app.services.openalex_client import OpenAlexClient, clamp_openalex_search_query, normalize_openalex_search_query
from app.services.openalex_citation import (
    build_reference_pool,
    format_pool_for_prompt,
    resolve_reference_indices,
)

logger = logging.getLogger(__name__)

IDEA_GENERATION_COUNT = int(os.getenv("IDEA_GENERATION_COUNT", "10"))
OPENALEX_IDEA_POOL_SIZE = int(os.getenv("OPENALEX_IDEA_POOL_SIZE", "25"))


def get_openalex_client():
    """获取OpenAlex客户端（延迟初始化）"""
    return OpenAlexClient()


def _fallback_openalex_query(text: str) -> str:
    latin = re.findall(r"[A-Za-z][A-Za-z0-9\-]{2,}", text or "")
    if latin:
        return clamp_openalex_search_query(" ".join(latin[:5]), max_words=5)
    return "biotechnology"


def extract_openalex_search_query(selected_text: str) -> str:
    """
    Short English keyword phrase for OpenAlex (2–5 words).
    Avoids long Chinese lists, journal names, and publication years.
    """
    snippet = (selected_text or "").strip()[:8000]
    if not snippet:
        return _fallback_openalex_query(snippet)

    data = unified_llm.chat_completion_json(
        [
            {
                "role": "system",
                "content": (
                    "You output only valid JSON. "
                    "openalex_search must be 2 to 5 English content words only."
                ),
            },
            {
                "role": "user",
                "content": f"""Extract OpenAlex literature search keywords from the research text.

Return JSON:
{{"openalex_search": "2 to 5 English words"}}

Rules:
- Core scientific concepts only (e.g. "microbial monoterpene biosynthesis")
- NO journal names, NO years, NO author names, NO paper titles, NO full sentences
- Translate concepts to English; do not output Chinese in openalex_search

Text:
{snippet}
""",
            },
        ],
        max_tokens=120,
        temperature=0.2,
    )

    core = (
        (data.get("openalex_search") or data.get("topic") or data.get("keywords") or "")
        if isinstance(data, dict)
        else ""
    )
    core = str(core).strip()
    if not core:
        core = _fallback_openalex_query(snippet)

    query = normalize_openalex_search_query(core)
    if not query:
        query = _fallback_openalex_query(snippet)
    logger.info("[Idea Generation] OpenAlex search query=%r", query)
    return query


def _parse_ideas_payload(data: Any) -> List[Dict[str, Any]]:
    if not isinstance(data, dict):
        return []
    ideas = data.get("ideas")
    if isinstance(ideas, list) and ideas:
        return [i for i in ideas if isinstance(i, dict)]
    return []


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
        logger.info("[Idea Generation] Using pre-cleaned text, skipping redundant cleaning")

        search_query = extract_openalex_search_query(selected_text)

        openalex_client = get_openalex_client()
        latest_papers = openalex_client.search_latest_papers(
            search_query, max_results=OPENALEX_IDEA_POOL_SIZE
        )
        ref_pool = build_reference_pool(latest_papers)
        bibliography = format_pool_for_prompt(ref_pool)

        ctx_block = f"\n额外上下文：{context}\n" if context else ""
        n_ideas = max(1, min(IDEA_GENERATION_COUNT, 15))
        idea_prompt = f"""基于以下文本与文献库，生成 {n_ideas} 个互不重复、角度多样的科研 idea。

原始文本：
{selected_text[:6000]}
{ctx_block}
文献库（只能引用下列编号，不要编造未列出的文献）：
{bibliography}

只返回 JSON，每个 idea 必须包含以下字段（均为完整句子，不要半句拆到不同字段）：
{{
  "ideas": [
    {{
      "title": "Idea 标题（一句话）",
      "description": "核心观察：2-3 句，说明现状与机会",
      "researchGap": "研究空白：1-2 句，指出尚未解决的问题",
      "hypothesis": "研究假设：1-2 句，可检验的科学猜想",
      "possibleMethod": "可行方法：1-2 句，建议的技术路线",
      "requiredData": ["所需数据 1", "所需数据 2"],
      "requiredExperiment": ["所需实验 1", "所需实验 2"],
      "feasibilityScore": 0.0到1.0之间的小数（可落地性，越高越易做）,
      "noveltyScore": 0.0到1.0之间的小数（新颖性，越高越新）,
      "riskLevel": "low 或 medium 或 high",
      "referenceIndices": [1, 2, 3]
    }}
  ]
}}

referenceIndices：从文献库中选 2–4 个最相关条目的编号（整数，对应 [1]、[2]…）。
"""

        result = unified_llm.chat_completion_json(
            [
                {
                    "role": "system",
                    "content": "你是科研创新专家。只输出合法 JSON，不要 markdown 代码块或解释文字。",
                },
                {"role": "user", "content": idea_prompt},
            ],
            max_tokens=8000,
            temperature=0.7,
        )

        ideas = _parse_ideas_payload(result)
        for idea in ideas:
            idea["references"] = resolve_reference_indices(idea, ref_pool, max_refs=4)
        if not ideas and isinstance(result, dict) and result.get("raw"):
            logger.warning(
                "[Idea Generation] JSON parse miss, raw prefix=%r",
                str(result.get("raw"))[:200],
            )
            raise ValueError("LLM did not return parseable ideas JSON")

        logger.info("Generated %s new ideas", len(ideas))
        return ideas

    except Exception as e:
        logger.error("Idea generation failed: %s", e)
        if strict_errors:
            raise
        return [
            {
                "title": "基于现有研究的扩展",
                "description": "基于选中文本的研究方向，可以进一步探索...",
                "innovation": "结合最新技术和方法",
                "references": [],
            }
        ]
