"""
文本清理服务
从PDF提取的杂乱文本中提取真实原文，并在全文范围内保留逻辑段落（\\n\\n）。
"""
import json
import logging
import re
from typing import List

from openai import OpenAI

from app.config import (
    DEEPSEEK_API_KEY,
    DEEPSEEK_BASE_URL,
    DEEPSEEK_MAX_OUTPUT_TOKENS,
    DEEPSEEK_MODEL,
)

logger = logging.getLogger(__name__)

# 单批送入模型的最大字符数（控制上下文与输出上限）
_CLEAN_BATCH_MAX_CHARS = 48_000


def _strip_json_fence(text: str) -> str:
    t = text.strip()
    if t.startswith("```"):
        t = re.sub(r"^```(?:json)?\n?", "", t)
        t = re.sub(r"\n?```$", "", t)
    return t.strip()


def get_client():
    """获取OpenAI客户端（延迟初始化）"""
    return OpenAI(
        api_key=DEEPSEEK_API_KEY,
        base_url=DEEPSEEK_BASE_URL,
    )


def _split_paragraph_blocks(text: str) -> List[str]:
    return [p.strip() for p in re.split(r"\n\s*\n", (text or "").strip()) if p.strip()]


def _split_pdf_text_into_batches(raw_text: str, max_chars: int = _CLEAN_BATCH_MAX_CHARS) -> List[str]:
    """
    若有「=== 第 N 页 ===」则按页切分，再合并为不超过 max_chars 的批次，减少调用次数。
    否则整段作为一批；超长则硬切。
    """
    text = raw_text.strip()
    if not text:
        return []
    if re.search(r"^=== 第 \d+ 页 ===\s*$", text, re.MULTILINE):
        parts = re.split(r"(?=^=== 第 \d+ 页 ===\s*$)", text, flags=re.MULTILINE)
        pages = [p.strip() for p in parts if p.strip()]
    else:
        pages = [text]

    batches: List[str] = []
    buf = ""
    for p in pages:
        if not p:
            continue
        addon = p if not buf else "\n\n" + p
        if len(buf) + len(addon) <= max_chars:
            buf = (buf + addon).strip() if buf else p
        else:
            if buf:
                batches.append(buf)
            if len(p) <= max_chars:
                buf = p
            else:
                start = 0
                while start < len(p):
                    batches.append(p[start : start + max_chars])
                    start += max_chars
                buf = ""
    if buf:
        batches.append(buf)
    return batches


def _structured_clean_batch(body: str) -> List[str]:
    """
    单批：JSON paragraphs。适用于全文任意片段（摘要、各节、参考文献等）。
    """
    client = get_client()
    prompt = f"""You clean academic text extracted from a PDF (may be a fragment of the full paper).

Goals:
1. Remove page headers/footers, line numbers, PDF artifacts, and spurious "page X" navigation; do NOT change meaning.
2. Merge hyphenation and hard line wraps into normal sentences and blocks.
3. Split into **logical paragraphs** throughout: abstract, section bodies, lists, reference entries—each natural block is one paragraph element. Prefer multiple paragraphs when the source is long; do not collapse the whole batch into one paragraph unless it is genuinely a single short block.
4. Each array element is one paragraph: one continuous string (no line breaks inside except where a formula truly needs them).
5. Preserve section flow; you may keep short standalone lines (e.g. "Abstract", "1. Introduction") as their own paragraph when they appear as headings in the source.

Return **JSON only** (no markdown fences), schema:
{{"paragraphs": ["...", "...", ...]}}

Do not invent scientific claims or citations.

Input:
{body}
"""

    response = client.chat.completions.create(
        model=DEEPSEEK_MODEL,
        messages=[
            {
                "role": "system",
                "content": 'You output only valid JSON: {"paragraphs": ["..."]}. No markdown.',
            },
            {"role": "user", "content": prompt},
        ],
        max_tokens=min(DEEPSEEK_MAX_OUTPUT_TOKENS, 16384),
        temperature=0.12,
    )
    raw = response.choices[0].message.content or ""
    data = json.loads(_strip_json_fence(raw))
    paras = data.get("paragraphs")
    if not isinstance(paras, list):
        raise ValueError("missing paragraphs array")
    out: List[str] = []
    for p in paras:
        s = str(p).strip()
        if s:
            out.append(s)
    if not out:
        raise ValueError("empty paragraphs")
    return out


def _legacy_plain_clean_batch(chunk: str) -> str:
    """单批旧版纯文本清理（JSON 失败时回退）。"""
    client = get_client()
    prompt = f"""你是一个文本提取专家。从以下从PDF提取的文本中，提取出真实的原文内容。

要求：
1. **只提取真实原文**，不要添加、修改或发挥任何内容
2. **移除所有格式标记**：如页码、页眉、页脚、目录标记等
3. **移除重复内容**：如重复的标题、重复的段落
4. **保留原文结构**：保持段落、句子结构；段落之间用空行分隔（两个换行）
5. **移除无关内容**：如"第X页"、"共X页"、"返回目录"等导航信息
6. **保留学术内容**：保留所有正文、标题、引用等学术内容
7. **不要改写**：只做提取，不要改变原文意思或表达方式

输入文本：
{chunk}

请直接返回清理后的文本，不要添加任何说明或标记。只返回提取出的真实原文内容。"""

    response = client.chat.completions.create(
        model=DEEPSEEK_MODEL,
        messages=[
            {
                "role": "system",
                "content": "你是一个文本提取专家。你的任务是从格式混乱的PDF提取文本中提取真实原文，只做提取不做改写。直接返回清理后的文本，不要添加任何说明。",
            },
            {"role": "user", "content": prompt},
        ],
        max_tokens=min(DEEPSEEK_MAX_OUTPUT_TOKENS, 16384),
        temperature=0.1,
    )
    cleaned_text = (response.choices[0].message.content or "").strip()
    if cleaned_text.startswith("```"):
        lines = cleaned_text.split("\n")
        if lines[0].strip().startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        cleaned_text = "\n".join(lines).strip()
    return cleaned_text


def extract_clean_text(raw_text: str) -> str:
    """
    从格式杂乱的 PDF 提取文本中恢复可读全文，并在**整篇**范围内保留逻辑段落（段间 \\n\\n）。

    长文按页/批次切分，每批走同一套结构化段落 JSON；失败时对该批回退到纯文本清理。
    """
    if not raw_text or not raw_text.strip():
        logger.warning("[Text Cleaning] Input text is empty")
        return raw_text

    logger.info(
        "[Text Cleaning] Structured clean start, length=%s chars, batch_max=%s",
        len(raw_text),
        _CLEAN_BATCH_MAX_CHARS,
    )

    batches = _split_pdf_text_into_batches(raw_text)
    if not batches:
        return raw_text

    all_paragraphs: List[str] = []
    for bi, batch in enumerate(batches):
        try:
            paras = _structured_clean_batch(batch)
            all_paragraphs.extend(paras)
            logger.info(
                "[Text Cleaning] Batch %s/%s: structured ok, %s paragraphs",
                bi + 1,
                len(batches),
                len(paras),
            )
        except Exception as e:
            logger.warning(
                "[Text Cleaning] Batch %s/%s structured clean failed (%s), legacy fallback",
                bi + 1,
                len(batches),
                e,
            )
            try:
                legacy = _legacy_plain_clean_batch(batch)
                blocks = _split_paragraph_blocks(legacy)
                all_paragraphs.extend(blocks if blocks else ([legacy.strip()] if legacy.strip() else []))
            except Exception as e2:
                logger.error("[Text Cleaning] Legacy clean failed: %s", e2, exc_info=True)
                all_paragraphs.append(batch)

    if not all_paragraphs:
        return raw_text

    joined = "\n\n".join(all_paragraphs)
    logger.info(
        "[Text Cleaning] Done: %s batches -> %s paragraphs, %s chars",
        len(batches),
        len(all_paragraphs),
        len(joined),
    )
    return joined


def extract_clean_text_for_introduction(raw_text: str) -> str:
    """与 extract_clean_text 相同：Introduction 与全文共用一套段落保留清理。"""
    return extract_clean_text(raw_text)
