"""
Theory Analyzer Agent
理论分析和公式推导
"""
import json
import logging
import re
from typing import Any, Dict, Iterator, List, Tuple

from openai import OpenAI

from app.config import DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL, DEEPSEEK_MODEL
from app.services.text_cleaner import extract_clean_text
from app.services.llm_stream import format_sse, format_sse_json, iter_chat_stream_deltas

logger = logging.getLogger(__name__)


def get_client():
    """获取OpenAI客户端（延迟初始化）"""
    return OpenAI(
        api_key=DEEPSEEK_API_KEY,
        base_url=DEEPSEEK_BASE_URL,
    )


def _strip_json_fence(text: str) -> str:
    t = text.strip()
    if t.startswith("```"):
        t = re.sub(r"^```(?:json)?\n?", "", t)
        t = re.sub(r"\n?```$", "", t)
    return t.strip()


def _extract_first_json_object(text: str) -> str:
    """Try to extract the first top-level JSON object from noisy model output."""
    s = text.strip()
    start = s.find("{")
    if start < 0:
        return s
    depth = 0
    in_str = False
    escape = False
    for idx in range(start, len(s)):
        ch = s[idx]
        if in_str:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == '"':
                in_str = False
            continue
        if ch == '"':
            in_str = True
        elif ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return s[start : idx + 1]
    return s[start:]


def _parse_json_best_effort(raw: str) -> Tuple[Dict[str, Any], str]:
    """
    Parse JSON with fallback extraction. Returns (data, warning).
    warning is empty on success.
    """
    text = _strip_json_fence(raw)
    try:
        return json.loads(text), ""
    except Exception:
        pass
    candidate = _extract_first_json_object(text)
    try:
        return json.loads(candidate), "json_recovered_by_object_extraction"
    except Exception as e:
        return {}, f"json_parse_failed: {e}"


def _generate_analysis_text(source_text: str) -> str:
    """
    Generate narrative analysis text only (non-JSON), robust against formatting failures.
    """
    analysis_prompt = f"""
对以下理论内容进行深入分析（原理、关键假设、适用范围与局限）。可使用 Markdown 与行内/块级 LaTeX。

理论内容：
{source_text}

要求：
1) 只输出分析正文（不要输出 JSON，不要输出代码块）。
2) 若原文未出现某结论，请明确标注“不足以支持该结论”，不得臆造。
3) 优先引用输入文本中可证实的信息。
"""
    client = get_client()
    response = client.chat.completions.create(
        model=DEEPSEEK_MODEL,
        messages=[
            {"role": "system", "content": "你是理论物理/数学专家，输出严谨且可追溯的分析正文。"},
            {"role": "user", "content": analysis_prompt},
        ],
        max_tokens=3000,
        temperature=0.2,
    )
    return (response.choices[0].message.content or "").strip()


def extract_formulas_and_steps(source_theory: str, analysis_text: str) -> Dict[str, Any]:
    """Second pass: structured formulas + derivation from completed analysis."""
    client = get_client()
    prompt = f"""You are a theoretical physics/mathematics expert.

Given:
(1) Original theory excerpt:
{source_theory[:12000]}

(2) Completed narrative analysis (may include inline LaTeX):
{analysis_text[:16000]}

Return JSON only (no markdown fences):
{{
  "formulas": ["$$...$$", "..."],
  "derivation_steps": ["step 1 ...", "step 2 ..."]
}}
Rules:
- Do NOT invent formulas absent from source_theory or analysis_text.
- If no reliable formula exists, return empty arrays.
- derivation_steps must strictly align with evidence in inputs.
Use LaTeX in $$...$$ for display formulas where appropriate.
"""
    response = client.chat.completions.create(
        model=DEEPSEEK_MODEL,
        messages=[
            {"role": "system", "content": "You output only valid JSON."},
            {"role": "user", "content": prompt},
        ],
        max_tokens=4000,
        temperature=0.25,
    )
    raw = response.choices[0].message.content or ""
    data, warning = _parse_json_best_effort(raw)
    if not data:
        return {"formulas": [], "derivation_steps": [], "_warning": warning}
    formulas = data.get("formulas") or []
    steps = data.get("derivation_steps") or []
    if not isinstance(formulas, list):
        formulas = []
    if not isinstance(steps, list):
        steps = []
    out: Dict[str, Any] = {"formulas": formulas, "derivation_steps": steps}
    if warning:
        out["_warning"] = warning
    return out


def stream_theory_sse(project_id: str, selected_text: str) -> Iterator[bytes]:
    """
    SSE stream: meta -> delta* -> done (full result JSON).
    """
    try:
        logger.info("[Theory Analysis] Stream: Step 0 text cleaning")
        cleaned_text = extract_clean_text(selected_text)
        yield format_sse_json(
            "meta",
            {"job": "theory", "project_id": project_id, "stage": "analysis_stream"},
        )

        analysis_prompt = f"""
对以下理论内容进行深入分析（原理、假设、适用范围）。可使用 Markdown 与行内/块级 LaTeX。

理论内容：
{cleaned_text}

要求：直接输出分析正文，不要使用 JSON 或代码块包裹全文。后续步骤将单独提取公式列表与推导步骤。
"""
        client = get_client()
        parts: List[str] = []
        for frag in iter_chat_stream_deltas(
            client,
            DEEPSEEK_MODEL,
            [
                {"role": "system", "content": "你是理论物理/数学专家，输出流畅的分析正文。"},
                {"role": "user", "content": analysis_prompt},
            ],
            max_tokens=6000,
            temperature=0.3,
        ):
            parts.append(frag)
            yield format_sse("delta", frag)

        analysis = "".join(parts).strip()
        if not analysis:
            analysis = "（模型未返回分析正文）"

        extra = extract_formulas_and_steps(cleaned_text, analysis)
        formulas = extra.get("formulas", [])
        derivation_steps = extra.get("derivation_steps", [])

        result = {
            "analysis": analysis,
            "formulas": formulas,
            "derivation_steps": derivation_steps,
        }
        from app.project_manager import ProjectManager

        ProjectManager().save_remake_result(project_id, "theory", result)
        yield format_sse_json(
            "done",
            {
                "status": "success",
                "message": "Theory analysis completed",
                **result,
            },
        )
    except Exception as e:
        logger.error(f"[Theory Analysis] Stream failed: {e}", exc_info=True)
        yield format_sse("error", str(e))


def analyze_theory(
    project_id: str,
    selected_text: str
) -> Dict[str, Any]:
    """
    理论分析和公式推导（同步，单次 JSON，保留兼容）
    """
    try:
        logger.info("[Theory Analysis] Step 0: Starting text cleaning")
        cleaned_text = extract_clean_text(selected_text)
        analysis = _generate_analysis_text(cleaned_text)
        if not analysis:
            analysis = "（模型未返回分析正文）"
        extra = extract_formulas_and_steps(cleaned_text, analysis)
        warnings: List[str] = []
        if extra.get("_warning"):
            warnings.append(str(extra.get("_warning")))
        return {
            "analysis": analysis,
            "formulas": extra.get("formulas", []),
            "derivation_steps": extra.get("derivation_steps", []),
            "warnings": warnings,
            "ok": True,
        }
        
    except Exception as e:
        logger.error(f"Theory analysis failed: {e}")
        return {
            "analysis": "理论分析失败，请检查输入文本。",
            "formulas": [],
            "derivation_steps": [],
            "warnings": [str(e)],
            "ok": False,
        }
