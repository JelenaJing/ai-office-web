"""
Reference 插入模块（迁移版）
"""
import hashlib
import json
import logging
import os
import re
from typing import Dict, Generator, List, Optional, Tuple

from openai import OpenAI

from app.config import DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL
from .config import get_api_kwargs
from .openalex import OpenAlexFetcher
from .reference_handler import generate_reference_relations_batch

logger = logging.getLogger(__name__)

client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY", DEEPSEEK_API_KEY),
    base_url=os.getenv("DEEPSEEK_BASE_URL", DEEPSEEK_BASE_URL),
)

DOI_PATTERN = re.compile(r"^10\.\d{4,9}/[-._;()/:A-Z0-9]+$|^s\d{4,}-\d{2,}-\d+$", re.IGNORECASE)

_NOISE_LINE_PATTERNS = [
    re.compile(r"^\s*===\s*第\s*\d+\s*页\s*===\s*$"),
    re.compile(r"^\s*ARTICLE\s*$", re.IGNORECASE),
    re.compile(r"^\s*OPEN\s*$", re.IGNORECASE),
    re.compile(r"^\s*DOI\s*:\s*\S+\s*$", re.IGNORECASE),
    re.compile(r"^\s*NATURE\s*COMMUNICATIONS\|", re.IGNORECASE),
    re.compile(r"^\s*www\.\S+\s*$", re.IGNORECASE),
    re.compile(r"^\s*\d+\s*$"),
]


def preprocess_extracted_paper_text(text: str) -> str:
    """
    将 PDF 抽取的“带格式噪声”的全文做初步清洗，尽量得到可读正文：
    - 去页分隔、页眉页脚、水印、孤立页码/DOI 行
    - 合并断行（不破坏段落边界）
    - 尝试截取正文主干：从 Introduction/Results/Background 等开始，到 References 前结束
    """
    if not text:
        return ""

    # 统一换行
    t = text.replace("\r\n", "\n").replace("\r", "\n")

    # 逐行去噪
    cleaned_lines: List[str] = []
    for raw in t.split("\n"):
        line = raw.strip()
        if not line:
            cleaned_lines.append("")
            continue
        if any(p.match(line) for p in _NOISE_LINE_PATTERNS):
            continue
        # 过长的“全大写/无空格”水印行（常见于 PDF 抽取）
        if len(line) > 120 and (" " not in line) and sum(ch.isalpha() for ch in line) / max(1, len(line)) > 0.6:
            continue
        cleaned_lines.append(line)

    # 合并连续空行，保持段落间隔
    normalized: List[str] = []
    prev_empty = False
    for ln in cleaned_lines:
        empty = (ln.strip() == "")
        if empty:
            if not prev_empty:
                normalized.append("")
            prev_empty = True
        else:
            normalized.append(ln)
            prev_empty = False

    # 合并断行：同一段落内的换行 -> 空格；段落空行保留
    paras: List[str] = []
    buf: List[str] = []
    for ln in normalized:
        if ln == "":
            if buf:
                paras.append(" ".join(buf))
                buf = []
            continue
        # 处理断词连字符换行（简单规则：行尾 '-' 且不是 ' - '）
        if buf and buf[-1].endswith("-") and not buf[-1].endswith(" -"):
            buf[-1] = buf[-1][:-1] + ln
        else:
            buf.append(ln)
    if buf:
        paras.append(" ".join(buf))

    t2 = "\n\n".join([re.sub(r"\s+", " ", p).strip() for p in paras if p.strip()])

    # 截断到 References 之前
    m_ref = re.search(r"(?im)^\s*references\s*$", t2)
    if m_ref:
        t2 = t2[: m_ref.start()].strip()

    # 尝试从正文开始（优先 Introduction，其次 Results/Background/Methods）
    start_candidates = ["introduction", "background", "results", "methods", "materials and methods", "discussion"]
    starts: List[int] = []
    low = t2.lower()
    for kw in start_candidates:
        idx = low.find(f"\n\n{kw}\n\n")
        if idx >= 0:
            starts.append(idx)
        else:
            idx2 = low.find(f"{kw}\n\n")
            if 0 <= idx2 < 5000:
                starts.append(idx2)
    if starts:
        t2 = t2[min(starts) :].strip()

    return t2


class ReferenceNumberManager:
    def __init__(self):
        self.citation_to_number: Dict[str, int] = {}
        self.number_to_citation: Dict[int, Dict] = {}
        self.next_number = 1

    def hash_citation(self, citation: str) -> str:
        return hashlib.md5(citation.encode("utf-8")).hexdigest()

    def get_or_assign_number(self, citation: str, citation_data: Optional[Dict] = None) -> int:
        key = self.hash_citation(citation)
        if key in self.citation_to_number:
            return self.citation_to_number[key]
        number = self.next_number
        self.next_number += 1
        self.citation_to_number[key] = number
        self.number_to_citation[number] = {"citation": citation, "data": citation_data or {}}
        return number

    def get_all_references(self) -> List[Tuple[int, str]]:
        return [(num, self.number_to_citation[num]["citation"]) for num in sorted(self.number_to_citation)]


def search_and_understand_references(
    topic: str, year_from: Optional[int] = None, year_to: Optional[int] = None, max_results: int = 500
) -> Tuple[List[Dict], Optional[str]]:
    year_range = None
    if year_from or year_to:
        if year_from and year_to:
            year_range = f"{year_from}-{year_to}"
        elif year_from:
            year_range = str(year_from)
        else:
            year_range = str(year_to)

    fetcher = OpenAlexFetcher(email=None, per_page=25)
    doi_list, apa_citations, abstracts, _search_topic, years, _persons = fetcher.fetch_references(
        topic=topic, max_results=max_results, year_range=year_range
    )
    refs: List[Dict] = []
    for i, (citation, abstract, doi) in enumerate(zip(apa_citations, abstracts, doi_list), 1):
        refs.append(
            {
                "index": i,
                "citation": citation,
                "abstract": abstract or "",
                "has_abstract": bool(abstract),
                "doi": doi,
            }
        )
    calculated = None
    if years:
        calculated = f"{min(years)}-{max(years)}"
    return refs, calculated or year_range


def analyze_paragraphs_for_citations(paragraphs: List[str], references_data: List[Dict], topic: str) -> List[Dict]:
    references_summary = []
    # 控制上下文长度：只给高优先级子集，abstract截断
    max_refs_for_prompt = 80
    for ref in references_data[:max_refs_for_prompt]:
        ref_info = f"[{ref['index']}] {ref['citation']}"
        if ref.get("abstract"):
            ref_info += f"\n   Abstract: {ref['abstract'][:500]}"
        references_summary.append(ref_info)
    references_text = "\n".join(references_summary)
    results: List[Dict] = []
    batch_size = 5
    for batch_start in range(0, len(paragraphs), batch_size):
        batch_paragraphs = paragraphs[batch_start : batch_start + batch_size]
        sentence_blocks = []
        batch_sentences: List[List[str]] = []
        sentence_pattern = r"([^.!?]+[.!?]\s*)"
        for i, para in enumerate(batch_paragraphs):
            sents = [m.group(1).strip() for m in re.finditer(sentence_pattern, para) if m.group(1).strip()]
            if not sents:
                sents = [para.strip()]
            batch_sentences.append(sents)
            numbered = "\n".join([f"  ({idx}) {s}" for idx, s in enumerate(sents)])
            sentence_blocks.append(f"段落{i}:\n{numbered}")
        paragraphs_text = "\n\n".join(sentence_blocks)
        prompt = f"""You are an expert academic paper reviewer. Analyze paragraphs and identify where citations should be added.

Paper Topic: {topic}
Available References:
{references_text}
Paragraphs:
{paragraphs_text}

Return JSON:
{{
  "paragraphs": [
    {{
      "paragraph_index": 0,
      "citations": [
        {{
          "sentence_index": 0,
          "reference_index": 1,
          "relevance_reason": "why"
        }}
      ]
    }}
  ]
}}
"""
        try:
            completion = client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You analyze text and suggest citations. Always return valid JSON.",
                    },
                    {"role": "user", "content": prompt},
                ],
                response_format={"type": "json_object"},
                **get_api_kwargs(max_tokens=4000, temperature=0.3),
            )
            response_text = (completion.choices[0].message.content or "").strip()
            analysis_data = json.loads(response_text)
            for para_analysis in analysis_data.get("paragraphs", []):
                para_idx = para_analysis.get("paragraph_index", 0)
                actual_idx = batch_start + para_idx
                if actual_idx >= len(paragraphs):
                    continue
                suggestions = []
                for cit in para_analysis.get("citations", []):
                    ref_idx = cit.get("reference_index", 1)
                    if 1 <= ref_idx <= len(references_data):
                        ref_data = references_data[ref_idx - 1]
                        sentence_index = int(cit.get("sentence_index", -1))
                        sentence_text = ""
                        if 0 <= para_idx < len(batch_sentences):
                            para_sentences = batch_sentences[para_idx]
                            if 0 <= sentence_index < len(para_sentences):
                                sentence_text = para_sentences[sentence_index]
                        suggestions.append(
                            {
                                "citation": ref_data["citation"],
                                "reference_index": ref_idx,
                                "sentence_text": sentence_text,
                                "sentence_index": sentence_index,
                                "position": "end",
                                "relevance_reason": cit.get("relevance_reason", ""),
                            }
                        )
                results.append(
                    {
                        "paragraph_index": actual_idx,
                        "paragraph_text": paragraphs[actual_idx],
                        "citation_suggestions": suggestions,
                    }
                )
        except Exception as e:
            logger.warning("analyze_paragraphs_for_citations error: %s", e)
            continue
    return results


def infer_topic_from_paper(paper_markdown: str, fallback: str = "research paper topic") -> str:
    """从全文提取标题/摘要并由 LLM 归纳检索 topic。"""
    text = preprocess_extracted_paper_text(paper_markdown or "")
    title = ""
    first_non_empty = next((ln.strip() for ln in text.splitlines() if ln.strip()), "")
    if first_non_empty and len(first_non_empty) <= 220:
        title = first_non_empty.lstrip("#").strip()
    abstract = ""
    m = re.search(r"(?is)\babstract\b[:\s]*\n?(.*?)(?:\n\s*\n|\n#{1,3}\s|\n\d+\.\s|\Z)", text)
    if m:
        abstract = m.group(1).strip()
    if not abstract:
        abstract = re.sub(r"\s+", " ", text[:3000]).strip()
    seed = f"Title: {title}\n\nAbstractOrIntro: {abstract[:2500]}"
    try:
        completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "Extract one concise scholarly search topic (3-12 words). Return plain text only.",
                },
                {"role": "user", "content": seed},
            ],
            **get_api_kwargs(max_tokens=80, temperature=0.1),
        )
        topic = (completion.choices[0].message.content or "").strip().strip('"').strip("'")
        if topic:
            return topic
    except Exception as e:
        logger.warning("infer_topic_from_paper failed, fallback used: %s", e)
    if title and not DOI_PATTERN.match(title):
        return title[:120]
    return fallback


def insert_references_with_numbering(
    paragraphs: List[str], analysis_results: List[Dict], number_manager: ReferenceNumberManager
) -> Tuple[List[str], List[Dict]]:
    updated_paragraphs = paragraphs.copy()
    sentence_changes = []
    analysis_results.sort(key=lambda x: x["paragraph_index"])
    for analysis in analysis_results:
        para_idx = analysis["paragraph_index"]
        if para_idx >= len(updated_paragraphs):
            continue
        original_paragraph = updated_paragraphs[para_idx]
        paragraph_text = original_paragraph
        citations = analysis.get("citation_suggestions", [])
        if not citations:
            continue

        sentence_pattern = r"([^.!?]+[.!?]\s*)"
        sentence_matches = list(re.finditer(sentence_pattern, paragraph_text))
        if not sentence_matches:
            continue
        updated_parts = []
        last_end = 0
        citations_by_sentence: Dict[int, Dict] = {}
        for cit in citations:
            try:
                si = int(cit.get("sentence_index", -1))
            except Exception:
                si = -1
            if si >= 0 and si not in citations_by_sentence:
                citations_by_sentence[si] = cit

        for sent_idx, match in enumerate(sentence_matches):
            if match.start() > last_end:
                updated_parts.append(paragraph_text[last_end : match.start()])
            sentence_with_punct = match.group(1)
            matched_citation = citations_by_sentence.get(sent_idx)
            if matched_citation:
                ref_number = number_manager.get_or_assign_number(matched_citation["citation"])
                punct_match = re.search(r"([.!?])\s*$", sentence_with_punct)
                if punct_match:
                    punct = punct_match.group(1)
                    no_punct = re.sub(r"[.!?]\s*$", "", sentence_with_punct)
                    updated_parts.append(no_punct + punct + f" [{ref_number}] ")
                else:
                    updated_parts.append(sentence_with_punct.rstrip() + f". [{ref_number}] ")
            else:
                updated_parts.append(sentence_with_punct)
            last_end = match.end()
        if last_end < len(paragraph_text):
            updated_parts.append(paragraph_text[last_end:])
        updated = "".join(updated_parts)
        if updated != original_paragraph:
            updated_paragraphs[para_idx] = updated
            sentence_changes.append({"paragraph_index": para_idx, "old_text": original_paragraph, "new_text": updated})

    # renumber to contiguous [1..N]
    if sentence_changes:
        used_ref_numbers = set()
        for change in sentence_changes:
            used_ref_numbers.update(int(x) for x in re.findall(r"\[(\d+)\]", change["new_text"]))
        if used_ref_numbers:
            old_to_new = {old: i for i, old in enumerate(sorted(used_ref_numbers), start=1)}
            for i, change in enumerate(sentence_changes):
                new_text = change["new_text"]
                for old_num, new_num in old_to_new.items():
                    new_text = re.sub(rf"\[{old_num}\]", f"[{new_num}]", new_text)
                sentence_changes[i]["new_text"] = new_text
                updated_paragraphs[change["paragraph_index"]] = new_text
    return updated_paragraphs, sentence_changes


def _clean_and_extract_paragraphs(paper_markdown: str) -> List[str]:
    clean_markdown = re.sub(r"\[\d+(?:\s*[,\-]\s*\d+)*\]", "", paper_markdown)
    abstract_match = re.search(r"\n##\s+Abstract\s*\n", clean_markdown, re.IGNORECASE)
    if abstract_match:
        next_section_match = re.search(r"\n##\s+", clean_markdown[abstract_match.end() :], re.IGNORECASE)
        if next_section_match:
            start = abstract_match.start()
            end = abstract_match.end() + next_section_match.start()
            clean_markdown = clean_markdown[:start] + clean_markdown[end:]
        else:
            clean_markdown = clean_markdown[: abstract_match.start()]
    conclusion_match = re.search(r"\n##\s+Conclusion\s*\n", clean_markdown, re.IGNORECASE)
    if conclusion_match:
        clean_markdown = clean_markdown[: conclusion_match.start()]
    clean_markdown = re.sub(r"<thinking>.*?</thinking>", "", clean_markdown, flags=re.DOTALL | re.IGNORECASE)
    clean_markdown = re.sub(r"<think>.*?</think>", "", clean_markdown, flags=re.DOTALL | re.IGNORECASE)
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", clean_markdown) if p.strip()]
    return [p for p in paragraphs if (not p.startswith("#") and len(p) >= 50 and "<think" not in p.lower())]


def _build_references_section(
    topic: str, references_data: List[Dict], number_manager: ReferenceNumberManager, sentence_changes: List[Dict]
) -> Tuple[str, List[str]]:
    all_references = number_manager.get_all_references()
    used_ref_numbers = set()
    for change in sentence_changes:
        used_ref_numbers.update(int(x) for x in re.findall(r"\[(\d+)\]", change["new_text"]))
    used_references = [(num, citation) for num, citation in all_references if num in used_ref_numbers]
    used_references.sort(key=lambda x: x[0])
    reference_list = [citation for _, citation in used_references]
    reference_relations = {}
    if used_references:
        refs_for_rel = []
        for num, citation in used_references:
            ref_data = next((r for r in references_data if r["citation"] == citation), None)
            if ref_data:
                refs_for_rel.append(
                    {
                        "index": num,
                        "citation": citation,
                        "abstract": ref_data.get("abstract", ""),
                        "has_abstract": ref_data.get("has_abstract", False),
                    }
                )
        if refs_for_rel:
            reference_relations = generate_reference_relations_batch(topic=topic, references=refs_for_rel, batch_size=30)
    references_section = ""
    if used_references:
        references_section = "\n\n## References\n\n"
        for num, citation in used_references:
            references_section += f"[{num}] {citation}\n"
            if num in reference_relations:
                references_section += f"**{reference_relations[num]}**\n"
            references_section += "\n"
    return references_section, reference_list


def organize_references(
    topic: str, paper_markdown: str, year_from: Optional[int] = None, year_to: Optional[int] = None
) -> Dict:
    paper_markdown = preprocess_extracted_paper_text(paper_markdown or "")
    if not topic or DOI_PATTERN.match(topic.strip()):
        topic = infer_topic_from_paper(paper_markdown)
    references_data, year_range = search_and_understand_references(topic=topic, year_from=year_from, year_to=year_to)
    if not references_data:
        return {
            "updated_markdown": paper_markdown,
            "reference_list": [],
            "sentence_changes": [],
            "year_range": year_range,
        }
    paragraphs = _clean_and_extract_paragraphs(paper_markdown)
    analysis_results = analyze_paragraphs_for_citations(paragraphs, references_data, topic)
    number_manager = ReferenceNumberManager()
    _updated_paragraphs, sentence_changes = insert_references_with_numbering(paragraphs, analysis_results, number_manager)

    updated_markdown = paper_markdown
    for change in sentence_changes:
        if change["old_text"] in updated_markdown:
            updated_markdown = updated_markdown.replace(change["old_text"], change["new_text"], 1)
    references_section, reference_list = _build_references_section(topic, references_data, number_manager, sentence_changes)
    if references_section:
        updated_markdown = re.sub(r"\n## References.*$", "", updated_markdown, flags=re.DOTALL)
        updated_markdown += references_section
    return {
        "updated_markdown": updated_markdown,
        "reference_list": reference_list,
        "sentence_changes": sentence_changes,
        "year_range": year_range,
    }


def organize_references_stream(
    topic: str, paper_markdown: str, year_from: Optional[int] = None, year_to: Optional[int] = None
) -> Generator[Dict, None, None]:
    try:
        paper_markdown = preprocess_extracted_paper_text(paper_markdown or "")
        if not topic or DOI_PATTERN.match(topic.strip()):
            topic = infer_topic_from_paper(paper_markdown)
        yield {"type": "status", "message": "正在搜索相关文献...", "progress": 0}
        references_data, year_range = search_and_understand_references(topic=topic, year_from=year_from, year_to=year_to)
        if not references_data:
            yield {
                "type": "complete",
                "status": "success",
                "updated_markdown": paper_markdown,
                "reference_list": [],
                "sentence_changes": [],
                "year_range": year_range,
            }
            return
        yield {"type": "status", "message": f"找到 {len(references_data)} 条相关文献，开始分析段落...", "progress": 10}
        paragraphs = _clean_and_extract_paragraphs(paper_markdown)
        yield {"type": "status", "message": f"开始分析 {len(paragraphs)} 个段落...", "progress": 20}
        analysis_results = analyze_paragraphs_for_citations(paragraphs, references_data, topic)
        yield {"type": "status", "message": "段落分析完成，开始插入引用...", "progress": 55}
        number_manager = ReferenceNumberManager()
        _updated_paragraphs, sentence_changes = insert_references_with_numbering(paragraphs, analysis_results, number_manager)
        updated_markdown = paper_markdown
        for change in sentence_changes:
            if change["old_text"] in updated_markdown:
                updated_markdown = updated_markdown.replace(change["old_text"], change["new_text"], 1)
                yield {
                    "type": "reference_inserted",
                    "paragraph_index": change["paragraph_index"],
                    "updated_paragraph": change["new_text"],
                    "current_markdown": updated_markdown,
                }
        references_section, reference_list = _build_references_section(topic, references_data, number_manager, sentence_changes)
        if references_section:
            updated_markdown = re.sub(r"\n## References.*$", "", updated_markdown, flags=re.DOTALL)
            updated_markdown += references_section
        yield {
            "type": "complete",
            "status": "success",
            "updated_markdown": updated_markdown,
            "reference_list": reference_list,
            "sentence_changes": sentence_changes,
            "year_range": year_range,
        }
    except Exception as e:
        logger.exception("organize_references_stream failed")
        yield {"type": "error", "status": "failed", "error": str(e)}
