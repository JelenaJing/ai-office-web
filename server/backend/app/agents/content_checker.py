"""
Content & Reference Checker Agent
检查内容和reference，更新过时内容
参考NFTCORE的reference比对逻辑实现
"""
import os
import re
import json
from typing import Dict, Any, List, Iterator
from openai import OpenAI
from app.config import DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL, DEEPSEEK_MODEL
from app.services.openalex_client import OpenAlexClient
from app.services.text_cleaner import extract_clean_text
from app.services.llm_stream import format_sse, format_sse_json, iter_chat_stream_deltas
import logging

logger = logging.getLogger(__name__)

def get_client():
    """获取OpenAI客户端（延迟初始化）"""
    return OpenAI(
        api_key=DEEPSEEK_API_KEY,
        base_url=DEEPSEEK_BASE_URL,
    )

def get_openalex_client():
    """获取OpenAlex客户端（延迟初始化）"""
    return OpenAlexClient()


def extract_topic_from_text(selected_text: str) -> str:
    """
    步骤1: LLM处理被选中文字，整理成topic
    参考NFTCORE的_extract_topic_and_persons逻辑
    
    Args:
        selected_text: 选中的文本
    
    Returns:
        整理后的topic字符串
    """
    client = get_client()
    
    prompt = f"""你是一个学术研究主题分析专家。从以下文本中提取核心研究主题（用于搜索相关文献）。

文本：
{selected_text}

请提取：
1. 核心研究主题关键词（1-3个词，最重要的研究概念）
2. 如果提到人物，提取人物姓名
3. 学科分类（从以下5个中选择一个）：
   - "Biological sciences" (生物学、遗传学、神经科学等)
   - "Chemistry" (化学、材料化学、纳米材料等)
   - "Earth & environmental sciences" (地质学、气候、环境科学等)
   - "Health sciences" (医学、临床研究、流行病学等)
   - "Physical sciences" (物理学、天文学、凝聚态物理等)

返回JSON格式：
{{
    "topic": "核心主题关键词",
    "persons": ["人物姓名1", "人物姓名2"],
    "category": "Chemistry"
}}

如果没有提到人物，persons使用空数组。
必须从5个学科中选择一个。

示例：
- 输入: "聚集诱导发光和唐本忠的工作"
  输出: {{"topic": "aggregation-induced emission", "persons": ["Ben Zhong Tang"], "category": "Chemistry"}}
- 输入: "钙钛矿太阳能电池效率提升"
  输出: {{"topic": "perovskite solar cells", "persons": [], "category": "Chemistry"}}
"""
    
    try:
        response = client.chat.completions.create(
            model=DEEPSEEK_MODEL,
            messages=[
                {"role": "system", "content": "你是一个学术研究主题分析专家。总是输出有效的JSON格式。"},
                {"role": "user", "content": prompt}
            ],
            max_tokens=300,
            temperature=0.3
        )
        
        response_text = response.choices[0].message.content.strip()
        
        # 清理可能的markdown代码块标记
        if response_text.startswith("```"):
            response_text = re.sub(r'^```(?:json)?\n?', '', response_text)
            response_text = re.sub(r'\n?```$', '', response_text)
        response_text = response_text.strip()
        
        parsed = json.loads(response_text)
        search_topic = parsed.get("topic", "")
        persons = parsed.get("persons", [])
        category = parsed.get("category", "")
        
        # 如果有多个信息，组合成完整的搜索主题
        topic_parts = []
        if search_topic:
            topic_parts.append(search_topic)
        if persons:
            topic_parts.extend(persons)
        
        final_topic = " ".join(topic_parts) if topic_parts else selected_text[:100]
        
        logger.info(f"[Topic Extraction] Original text -> Topic: '{final_topic}', Category: {category}")
        return final_topic
        
    except Exception as e:
        logger.warning(f"[Topic Extraction] Extraction failed: {e}, using first 100 characters of original text")
        return selected_text[:100]


def search_reference_pool(topic: str, max_results: int = 50) -> List[Dict]:
    """
    步骤2: 根据topic去搜文献，搜出来一个文献池
    参考NFTCORE的search_and_understand_references逻辑
    
    Args:
        topic: 搜索主题
        max_results: 最大结果数
    
    Returns:
        文献数据列表，每个元素包含citation, abstract, doi等
    """
    logger.info(f"[Reference Search] Starting search for topic: {topic}")
    
    openalex_client = get_openalex_client()
    papers = openalex_client.search_latest_papers(topic, max_results=max_results)
    
    # 转换为references格式
    references_data = []
    for i, paper in enumerate(papers, 1):
        # 提取标题
        title = paper.get('title', '')
        if not title or title == 'Untitled':
            continue
        
        # 提取作者信息
        authorships = paper.get('authorships', [])
        authors_list = []
        for authorship in authorships[:5]:
            author_info = authorship.get('author', {})
            display_name = author_info.get('display_name', '')
            if display_name:
                authors_list.append(display_name)
        authors_str = ', '.join(authors_list) if authors_list else 'Unknown Author'
        if len(authorships) > 5:
            authors_str += ' et al.'
        
        # 提取年份
        publication_year = paper.get('publication_year')
        if not publication_year:
            publication_date = paper.get('publication_date', '')
            if publication_date:
                try:
                    from datetime import datetime
                    publication_year = datetime.strptime(publication_date, '%Y-%m-%d').year
                except:
                    pass
        year_str = str(publication_year) if publication_year else 'N/A'
        
        # 提取DOI
        doi = paper.get('doi', '')
        if doi and doi.startswith('https://doi.org/'):
            doi = doi.replace('https://doi.org/', '')
        elif doi and doi.startswith('http://doi.org/'):
            doi = doi.replace('http://doi.org/', '')
        
        # 提取摘要（完整摘要，不截取）
        abstract = ''
        if paper.get('abstract'):
            abstract = paper.get('abstract', '')
        elif paper.get('abstract_inverted_index'):
            try:
                inverted_index = paper.get('abstract_inverted_index', {})
                if isinstance(inverted_index, dict):
                    words = []
                    for word, positions in inverted_index.items():
                        for pos in positions:
                            words.append((pos, word))
                    words.sort()
                    abstract = ' '.join([w[1] for w in words])
            except:
                pass
        
        # 构建APA格式引用（简化版）
        citation = f"{authors_str} ({year_str}). {title}."
        if doi:
            citation += f" https://doi.org/{doi}"
        
        references_data.append({
            'index': i,
            'citation': citation,
            'title': title,
            'authors': authors_str,
            'year': year_str,
            'doi': doi,
            'abstract': abstract,
            'has_abstract': bool(abstract),
            'publication_year': publication_year
        })
    
    logger.info(f"[Reference Search] Found {len(references_data)} references")
    return references_data


def analyze_sentences_with_references(selected_text: str, references_data: List[Dict]) -> List[Dict]:
    """
    步骤3和4: 遍历abstract了解文献内容，然后逐句分析文本，与文献比对
    参考NFTCORE的analyze_paragraphs_for_citations逻辑
    
    Args:
        selected_text: 选中的文本
        references_data: 文献数据列表
    
    Returns:
        匹配结果列表，每个元素包含：
        - sentence_text: 需要引用的句子
        - reference_index: 匹配的文献索引
        - relevance_reason: 相关性说明
    """
    logger.info(f"[Sentence Analysis] Starting text analysis, reference pool size: {len(references_data)}")
    
    if not references_data:
        return []
    
    # 构建references摘要信息（包含所有abstract）
    references_summary = []
    for ref in references_data:
        ref_info = f"[{ref['index']}] {ref['citation']}"
        if ref.get('abstract'):
            ref_info += f"\n   Abstract: {ref['abstract']}"
        references_summary.append(ref_info)
    
    references_text = "\n".join(references_summary)
    
    # 将文本分割成句子
    sentences = re.split(r'([.!?]\s+)', selected_text)
    # 重新组合句子和标点
    sentence_list = []
    for i in range(0, len(sentences), 2):
        if i < len(sentences):
            sentence = sentences[i]
            if i + 1 < len(sentences):
                sentence += sentences[i + 1]
            sentence = sentence.strip()
            if sentence and len(sentence) > 20:  # 过滤过短的句子
                sentence_list.append(sentence)
    
    if not sentence_list:
        sentence_list = [selected_text]  # 如果没有分割出句子，使用整个文本
    
    logger.info(f"[Sentence Analysis] Split into {len(sentence_list)} sentences")
    
    # 批量分析句子（每次分析5个句子，避免prompt过长）
    batch_size = 5
    all_matches = []
    
    for batch_start in range(0, len(sentence_list), batch_size):
        batch_sentences = sentence_list[batch_start:batch_start + batch_size]
        batch_num = batch_start // batch_size + 1
        total_batches = (len(sentence_list) + batch_size - 1) // batch_size
        
        logger.info(f"[Sentence Analysis] Processing batch {batch_num}/{total_batches} (sentences {batch_start+1}-{min(batch_start+batch_size, len(sentence_list))})")
        
        sentences_text = "\n".join([f"句子{i+1}:\n{s}" for i, s in enumerate(batch_sentences)])
        
        prompt = f"""你是一个学术论文引用专家。分析以下句子，找出哪些句子需要引用，以及应该引用哪些文献。

可用文献列表：
{references_text}

待分析句子：
{sentences_text}

对于每个句子，判断：
1. 该句子是否需要引用（关键声明、方法、结果、比较等需要引用）
2. 如果需要引用，从文献列表中选择最相关的文献（基于abstract内容匹配）
3. 说明为什么这个文献相关

返回JSON格式：
{{
    "sentences": [
        {{
            "sentence_index": 0,
            "sentence_text": "完整的句子文本",
            "needs_citation": true,
            "reference_index": 1,
            "relevance_reason": "为什么这个文献相关"
        }}
    ]
}}

重要：
- 只为事实性声明、方法、结果或比较建议引用
- 基于abstract内容匹配文献
- 只返回需要引用的句子（needs_citation为true的）
- 返回有效的JSON，不要添加其他内容
"""
        
        client = get_client()
        try:
            response = client.chat.completions.create(
                model=DEEPSEEK_MODEL,
                messages=[
                    {"role": "system", "content": "你是一个学术论文引用专家。分析文本并建议合适的引用。总是返回有效的JSON。"},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=3000,
                temperature=0.3
            )
            
            response_text = response.choices[0].message.content.strip()
            
            # 提取JSON
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                analysis_data = json.loads(json_match.group())
                
                for sent_analysis in analysis_data.get('sentences', []):
                    if sent_analysis.get('needs_citation', False):
                        sent_idx = sent_analysis.get('sentence_index', 0)
                        actual_idx = batch_start + sent_idx
                        
                        if actual_idx < len(sentence_list):
                            ref_idx = sent_analysis.get('reference_index', 1)
                            if 1 <= ref_idx <= len(references_data):
                                all_matches.append({
                                    'sentence_text': sent_analysis.get('sentence_text', ''),
                                    'reference_index': ref_idx,
                                    'reference_data': references_data[ref_idx - 1],
                                    'relevance_reason': sent_analysis.get('relevance_reason', '')
                                })
                
                logger.info(f"[Sentence Analysis] Batch {batch_num} completed, found {len([s for s in analysis_data.get('sentences', []) if s.get('needs_citation')])} sentences needing citation")
        
        except Exception as e:
            logger.error(f"[Sentence Analysis] Error analyzing batch {batch_num}: {e}")
            continue
    
    logger.info(f"[Sentence Analysis] Analysis completed, found {len(all_matches)} insertable references")
    return all_matches


def _check_content_pipeline(selected_text: str) -> Dict[str, Any]:
    """
    Steps 0–4 without final updated_text LLM. Adds _need_stream_update when stream path should run.
    """
    logger.info("[Content Check] Step 0: Starting text cleaning")
    cleaned_text = extract_clean_text(selected_text)
    if cleaned_text != selected_text:
        logger.info(
            f"[Content Check] Text cleaned, original length: {len(selected_text)}, cleaned length: {len(cleaned_text)}"
        )
    else:
        logger.info("[Content Check] Text does not need cleaning or unchanged after cleaning")

    selected_text = cleaned_text

    check_prompt = f"""
        检查以下学术文本的内容，识别以下问题：
        1. 逻辑错误
        2. 事实错误
        3. 表达不清
        4. 数据不一致
        
        文本：
        {selected_text}
        
        以JSON格式返回：
        {{
            "issues": [
                {{
                    "type": "问题类型",
                    "description": "问题描述",
                    "severity": "high/medium/low",
                    "suggestion": "修正建议"
                }}
            ]
        }}
        """

    client = get_client()
    check_response = client.chat.completions.create(
        model=DEEPSEEK_MODEL,
        messages=[
            {"role": "system", "content": "你是一个学术内容审查专家。"},
            {"role": "user", "content": check_prompt},
        ],
        max_tokens=1500,
        temperature=0.3,
    )

    check_text = check_response.choices[0].message.content.strip()
    if check_text.startswith("```"):
        check_text = re.sub(r"^```(?:json)?\n?", "", check_text)
        check_text = re.sub(r"\n?```$", "", check_text)

    check_result = json.loads(check_text)
    issues = check_result.get("issues", [])

    topic = extract_topic_from_text(selected_text)
    references_data = search_reference_pool(topic, max_results=50)
    matched_references = analyze_sentences_with_references(selected_text, references_data)

    updated_references = []
    for match in matched_references:
        ref_data = match["reference_data"]
        updated_references.append(
            {
                "title": ref_data.get("title", ""),
                "authors": ref_data.get("authors", ""),
                "year": ref_data.get("year", ""),
                "doi": ref_data.get("doi", ""),
                "url": f"https://doi.org/{ref_data.get('doi', '')}" if ref_data.get("doi") else "",
                "abstract": ref_data.get("abstract", "")[:300],
                "sentence_text": match.get("sentence_text", ""),
                "relevance_reason": match.get("relevance_reason", ""),
            }
        )

    seen_titles = set()
    unique_references = []
    for ref in updated_references:
        if ref["title"] and ref["title"] not in seen_titles:
            seen_titles.add(ref["title"])
            unique_references.append(ref)

    outdated = any(
        ref.get("publication_year", 0) and ref.get("publication_year", 0) > 2020
        for ref in references_data
    )

    recommended_references = []
    for ref in references_data[:10]:
        recommended_references.append(
            {
                "title": ref.get("title", ""),
                "authors": ref.get("authors", ""),
                "year": ref.get("year", ""),
                "doi": ref.get("doi", ""),
                "url": f"https://doi.org/{ref.get('doi', '')}" if ref.get("doi") else "",
                "abstract": ref.get("abstract", "")[:300],
            }
        )

    need_stream = bool(outdated and unique_references)

    return {
        "original_text": selected_text,
        "issues": issues,
        "updated_references": unique_references,
        "recommended_references": recommended_references,
        "is_outdated": outdated,
        "latest_papers_count": len(references_data),
        "matched_count": len(unique_references),
        "_need_stream_update": need_stream,
        "_unique_for_prompt": unique_references,
    }


def _sync_apply_text_update(selected_text: str, unique_references: List[Dict]) -> str:
    """JSON response path (legacy sync)."""
    update_prompt = f"""
            以下文本可能包含过时内容，请基于最新研究更新：
            
            原文：
            {selected_text}
            
            找到的相关最新研究：
            {chr(10).join([f"- {ref.get('title', 'N/A')} ({ref.get('year', 'N/A')})" for ref in unique_references[:5]])}
            
            请：
            1. 更新过时的内容
            2. 保持原文风格和结构
            
            返回JSON格式：
            {{
                "updated_text": "更新后的文本"
            }}
            """
    client = get_client()
    update_response = client.chat.completions.create(
        model=DEEPSEEK_MODEL,
        messages=[
            {"role": "system", "content": "你是一个学术内容更新专家。"},
            {"role": "user", "content": update_prompt},
        ],
        max_tokens=2000,
        temperature=0.5,
    )
    update_text = update_response.choices[0].message.content.strip()
    if update_text.startswith("```"):
        update_text = re.sub(r"^```(?:json)?\n?", "", update_text)
        update_text = re.sub(r"\n?```$", "", update_text)
    update_result = json.loads(update_text)
    return update_result.get("updated_text", selected_text)


def _iter_updated_text_plain_stream(selected_text: str, unique_references: List[Dict]) -> Iterator[str]:
    """Stream plain updated full text (no JSON)."""
    update_prompt = f"""
以下文本可能包含过时内容，请基于最新研究更新全文。

原文：
{selected_text}

找到的相关最新研究：
{chr(10).join([f"- {ref.get('title', 'N/A')} ({ref.get('year', 'N/A')})" for ref in unique_references[:5]])}

要求：
1. 更新过时的表述，融入与上述研究一致的方向
2. 保持原文整体风格与段落结构
3. 直接输出更新后的完整正文，不要使用 JSON、不要使用 markdown 代码块包裹全文
"""
    client = get_client()
    yield from iter_chat_stream_deltas(
        client,
        DEEPSEEK_MODEL,
        [
            {"role": "system", "content": "你是学术内容更新专家，只输出更新后的正文。"},
            {"role": "user", "content": update_prompt},
        ],
        max_tokens=4000,
        temperature=0.5,
    )


def stream_check_content_sse(project_id: str, selected_text: str) -> Iterator[bytes]:
    """SSE: meta (partial) -> delta* -> done (full check payload)."""
    try:
        base = _check_content_pipeline(selected_text)
        meta_public = {
            "job": "content_check",
            "project_id": project_id,
            "original_text": base["original_text"],
            "issues": base["issues"],
            "updated_references": base["updated_references"],
            "recommended_references": base["recommended_references"],
            "is_outdated": base["is_outdated"],
            "latest_papers_count": base["latest_papers_count"],
            "matched_count": base["matched_count"],
            "stage": "streaming_updated_text" if base["_need_stream_update"] else "skip_update",
        }
        yield format_sse_json("meta", meta_public)

        if base["_need_stream_update"]:
            parts: List[str] = []
            for frag in _iter_updated_text_plain_stream(
                base["original_text"], base["_unique_for_prompt"]
            ):
                parts.append(frag)
                yield format_sse("delta", frag)
            updated_text = "".join(parts).strip() or base["original_text"]
        else:
            updated_text = base["original_text"]

        save_blob = {
            "original_text": base["original_text"],
            "updated_text": updated_text,
            "updated_references": base["updated_references"],
            "recommended_references": base["recommended_references"],
            "issues": base["issues"],
            "is_outdated": base["is_outdated"],
            "latest_papers_count": base["latest_papers_count"],
            "matched_count": base["matched_count"],
        }
        from app.project_manager import ProjectManager

        ProjectManager().save_remake_result(project_id, "content_update", save_blob)

        done_payload = {
            "status": "success",
            "message": "Content check completed",
            **save_blob,
            "data": {
                "is_outdated": base["is_outdated"],
                "latest_papers_count": base["latest_papers_count"],
                "recommended_references": base["recommended_references"],
            },
        }
        yield format_sse_json("done", done_payload)
    except Exception as e:
        logger.error(f"[Content Check] Stream failed: {e}", exc_info=True)
        yield format_sse("error", str(e))


def check_content(
    project_id: str,
    selected_text: str
) -> Dict[str, Any]:
    """
    检查内容和reference的主函数
    实现NFTCORE的reference比对逻辑：
    0. 文本清理：从格式杂乱的PDF文本中提取真实原文
    1. LLM处理被选中文字，整理成topic
    2. 根据topic去搜文献，搜出来一个文献池
    3. 遍历abstract，了解所有有abstract/正文的文献究竟在讲什么
    4. 将框中的目标文字一句一句分析，和上一步的所有文献做比对，找出可以被插入作为新reference的文献条目
    
    Args:
        project_id: 项目ID
        selected_text: 选中的文本（可能是从PDF提取的杂乱文本）
    
    Returns:
        检查结果
    """
    try:
        base = _check_content_pipeline(selected_text)
        if base["_need_stream_update"]:
            updated_text = _sync_apply_text_update(
                base["original_text"], base["_unique_for_prompt"]
            )
        else:
            updated_text = base["original_text"]

        return {
            "original_text": base["original_text"],
            "updated_text": updated_text,
            "updated_references": base["updated_references"],
            "recommended_references": base["recommended_references"],
            "issues": base["issues"],
            "is_outdated": base["is_outdated"],
            "latest_papers_count": base["latest_papers_count"],
            "matched_count": base["matched_count"],
        }

    except Exception as e:
        logger.error(f"Content check failed: {e}", exc_info=True)
        return {
            "original_text": selected_text,
            "updated_text": selected_text,
            "updated_references": [],
            "recommended_references": [],
            "issues": [],
            "is_outdated": False,
            "latest_papers_count": 0,
            "matched_count": 0,
            "error": str(e)
        }
