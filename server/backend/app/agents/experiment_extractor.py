"""
Experiment Extractor Agent
从论文中提取实验内容部分
"""
import os
from typing import Dict, Any, Optional
from openai import OpenAI
from app.config import DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL, DEEPSEEK_MODEL
from app.services.paper_processor import PaperProcessor
import logging

logger = logging.getLogger(__name__)

def get_client():
    """获取OpenAI客户端（延迟初始化）"""
    return OpenAI(
        api_key=DEEPSEEK_API_KEY,
        base_url=DEEPSEEK_BASE_URL,
    )


def extract_experiment_sections(
    project_id: str,
    selected_text: Optional[str] = None
) -> Dict[str, Any]:
    """
    从论文中提取实验内容部分
    
    Args:
        project_id: 项目ID
        selected_text: 选中的文本段落（可选，如果提供则只处理选中部分）
    
    Returns:
        提取的实验内容，包括：
        - experiment_text: 格式化的实验步骤文本
        - sections: 识别的实验章节信息
        - confidence: 提取置信度
    """
    try:
        paper_processor = PaperProcessor()
        # Use cached cleaned fulltext for full-paper extraction
        paper_text = paper_processor.get_paper_text(project_id, variant="cleaned")
        
        # 如果提供了选中文本，优先使用选中文本
        if selected_text and selected_text.strip():
            text_to_analyze = selected_text.strip()
            logger.info(f"Using selected text paragraph for experiment extraction (length: {len(text_to_analyze)})")
        else:
            text_to_analyze = paper_text
            logger.info(f"Using full paper text for experiment extraction (length: {len(text_to_analyze)})")
        
        # 如果文本过长，分块分析然后合并结果
        max_chunk_length = 25000  # 每块最大长度（留一些余量）
        overlap_length = 1000  # 块之间的重叠长度，确保不丢失边界信息
        
        if len(text_to_analyze) <= max_chunk_length:
            # 文本不长，直接分析
            chunks = [text_to_analyze]
        else:
            # 文本过长，分块处理
            logger.info(f"Text too long ({len(text_to_analyze)} characters), will analyze in chunks")
            chunks = []
            start = 0
            while start < len(text_to_analyze):
                end = start + max_chunk_length
                # 尝试在句号、换行符等自然边界处分割
                if end < len(text_to_analyze):
                    # 向后查找合适的分割点（句号、换行符）
                    for i in range(end, max(start + max_chunk_length - 2000, start), -1):
                        if text_to_analyze[i] in ['\n', '。', '.', '\n\n']:
                            end = i + 1
                            break
                chunk = text_to_analyze[start:end]
                chunks.append(chunk)
                logger.info(f"Chunk {len(chunks)}: position {start}-{end}, length {len(chunk)}")
                # 下一块的开始位置考虑重叠
                start = end - overlap_length if end < len(text_to_analyze) else end
        
        # 对每个块进行分析
        all_sections = []
        all_formatted_steps = []
        all_summaries = []
        
        extract_prompt_template = """
请从以下论文文本中识别和提取实验内容部分。实验内容通常包括：
1. 实验方法（Methods/Experimental/Materials and Methods）
2. 实验步骤（Experimental Procedures/Protocol）
3. 实验条件（温度、时间、浓度等参数）
4. 材料制备和合成过程
5. 实验操作流程

请提取所有与实验操作相关的文本，并整理成清晰的实验步骤格式。

论文文本：
{chunk_text}

请返回JSON格式：
{{
    "experiment_sections": [
        {{
            "section_name": "章节名称（如：Materials and Methods）",
            "content": "该章节的实验内容",
            "confidence": "high/medium/low"
        }}
    ],
    "formatted_steps": "整理后的实验步骤文本（按步骤编号，每步一行）",
    "summary": "实验内容摘要"
}}

注意：
- 如果文本中没有明确的实验内容，请返回空数组和说明
- formatted_steps应该是可以直接用于后续处理的格式
- 保持实验步骤的原始信息，不要添加或修改内容
- 这是文本的一部分，如果实验内容跨越多个部分，请提取当前部分的内容
"""
        
        client = get_client()
        
        for i, chunk in enumerate(chunks):
            logger.info(f"Analyzing chunk {i+1}/{len(chunks)} (length: {len(chunk)})")
            extract_prompt = extract_prompt_template.format(chunk_text=chunk)
            
            try:
                response = client.chat.completions.create(
                    model=DEEPSEEK_MODEL,
                    messages=[
                        {"role": "system", "content": "你是一个专业的科学论文分析专家，擅长从论文中识别和提取实验内容。"},
                        {"role": "user", "content": extract_prompt}
                    ],
                    max_tokens=8192,
                    temperature=0.3
                )
                
                import json
                import re
                response_text = response.choices[0].message.content.strip()
                
                # 清理JSON代码块标记
                if response_text.startswith('```'):
                    response_text = re.sub(r'^```(?:json)?\n?', '', response_text)
                    response_text = re.sub(r'\n?```$', '', response_text)
                
                chunk_result = json.loads(response_text)
                
                # 收集结果
                if chunk_result.get("experiment_sections"):
                    all_sections.extend(chunk_result.get("experiment_sections", []))
                if chunk_result.get("formatted_steps"):
                    all_formatted_steps.append(chunk_result.get("formatted_steps"))
                if chunk_result.get("summary"):
                    all_summaries.append(chunk_result.get("summary"))
                    
            except Exception as e:
                logger.warning(f"Chunk {i+1} analysis failed: {e}")
                continue
        
        # 合并所有结果
        # 去重sections（基于section_name）
        seen_sections = {}
        for section in all_sections:
            section_name = section.get("section_name", "")
            if section_name not in seen_sections:
                seen_sections[section_name] = section
            else:
                # 如果已存在，合并内容（保留更详细的那个）
                existing = seen_sections[section_name]
                if len(section.get("content", "")) > len(existing.get("content", "")):
                    seen_sections[section_name] = section
        
        merged_sections = list(seen_sections.values())

        section_blob = "\n\n".join([
            f"=== {section.get('section_name', '实验部分')} ===\n{section.get('content', '')}"
            for section in merged_sections
        ])

        # 合并 formatted_steps
        merged_formatted_steps = "\n\n".join(filter(None, all_formatted_steps))
        if not merged_formatted_steps.strip() and merged_sections:
            merged_formatted_steps = section_blob
        elif merged_sections and merged_formatted_steps.strip():
            # 模型返回的 formatted_steps 往往很短；若章节原文明显更长，附上原文以免「有方法但喂给设计器的上下文过短」
            sec_len = len(section_blob)
            if sec_len > len(merged_formatted_steps) + 800:
                cap = 14000
                extra = section_blob if sec_len <= cap else section_blob[:cap] + "\n…"
                merged_formatted_steps = (
                    merged_formatted_steps.strip()
                    + "\n\n---\n【以下为识别到的实验相关章节原文（供后续步骤使用）】\n\n"
                    + extra
                )
        
        # 合并summary
        merged_summary = " ".join(filter(None, all_summaries))
        if len(merged_summary) > 500:
            merged_summary = merged_summary[:500] + "..."
        
        logger.info(f"Analysis completed: {len(chunks)} chunks processed, extracted {len(merged_sections)} sections")
        
        return {
            "experiment_text": merged_formatted_steps,
            "sections": merged_sections,
            "summary": merged_summary,
            "confidence": "high" if merged_sections else "low"
        }
        
    except json.JSONDecodeError as e:
        logger.error(f"JSON parsing failed: {e}")
        logger.error(f"Response text: {response_text[:500]}")
        return {
            "experiment_text": "",
            "sections": [],
            "summary": f"提取失败：JSON解析错误 - {str(e)}",
            "confidence": "low"
        }
    except Exception as e:
        logger.error(f"Experiment extraction failed: {e}")
        import traceback
        traceback.print_exc()
        return {
            "experiment_text": "",
            "sections": [],
            "summary": f"提取失败：{str(e)}",
            "confidence": "low"
        }


def format_experiment_steps(experiment_text: str) -> str:
    """
    格式化实验步骤文本，使其更适合后续处理
    
    Args:
        experiment_text: 原始实验步骤文本
    
    Returns:
        格式化后的实验步骤文本
    """
    if not experiment_text:
        return ""
    
    # 基本清理：移除多余空行，统一格式
    lines = experiment_text.split('\n')
    formatted_lines = []
    
    for line in lines:
        line = line.strip()
        if line:
            formatted_lines.append(line)
        elif formatted_lines and formatted_lines[-1]:  # 保留段落间的空行
            formatted_lines.append("")
    
    return '\n'.join(formatted_lines).strip()
