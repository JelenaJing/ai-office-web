"""
Experiment Designer Agent
重新设计实验，生成配方
"""
import json
import re
from typing import Any, Dict

from openai import OpenAI

from app.config import (
    DEEPSEEK_API_KEY,
    DEEPSEEK_BASE_URL,
    DEEPSEEK_MAX_OUTPUT_TOKENS,
    DEEPSEEK_MODEL,
)
from app.services.text_cleaner import extract_clean_text
import logging

logger = logging.getLogger(__name__)

# deepseek-chat 单条回复上限 8192 tokens；实验设计 JSON 较长，原先 2000 易截断导致 Unterminated string
_DESIGN_MAX_TOKENS = min(8192, max(1024, int(DEEPSEEK_MAX_OUTPUT_TOKENS)))


def _strip_code_fence(text: str) -> str:
    t = (text or "").strip()
    if t.startswith("```"):
        t = re.sub(r"^```(?:json)?\n?", "", t)
        t = re.sub(r"\n?```$", "", t)
    return t.strip()


def _parse_design_response(response_text: str) -> Dict[str, Any]:
    """解析模型返回的 JSON；失败则抛出 json.JSONDecodeError。"""
    cleaned = _strip_code_fence(response_text)
    return json.loads(cleaned)

def get_client():
    """获取OpenAI客户端（延迟初始化）"""
    return OpenAI(
        api_key=DEEPSEEK_API_KEY,
        base_url=DEEPSEEK_BASE_URL,
    )


def design_experiment(
    project_id: str,
    selected_text: str,
    *,
    skip_clean: bool = False,
) -> Dict[str, Any]:
    """
    重新设计实验并生成配方
    
    Args:
        project_id: 项目ID
        selected_text: 选中的实验部分文本
    
    Returns:
        实验设计和配方
    """
    try:
        # 步骤0: 文本清理（全文多轮且输入已来自 experiment_extractor 时可跳过，避免每块再打一整套清理 LLM）
        if skip_clean:
            selected_text = (selected_text or "").strip()
            logger.info("[Experiment Design] Step 0: skip_clean=True, len=%s", len(selected_text))
        else:
            logger.info("[Experiment Design] Step 0: Starting text cleaning")
            selected_text = extract_clean_text(selected_text)
        
        design_prompt = f"""
        基于以下实验描述，重新设计一个更完善的实验方案，并提供详细的实验配方。
        
        原始实验描述：
        {selected_text}
        
        请提供：
        1. 实验设计（包括目的、原理、方法）
        2. 详细的实验配方（材料、步骤、参数）

        重要：
        - 若输入中几乎没有可操作的实验/方法/材料/工艺信息（例如只有引言或讨论），请在 experiment_design 的各字段用**中文**简要说明「缺少哪些信息、建议用户选中 Methods/实验部分」；
          recipe 用 Markdown 简短中文说明原因即可。
        - 不要仅用一句英文套话（如 "Unable to determine..."）填充所有字段。
        - **必须输出可被 json.loads 解析的单一 JSON**：字符串内双引号须按 JSON 规范转义；不要用 markdown 代码块包裹整段 JSON。
        - **控制长度以免截断**：materials 不超过 18 条，steps 不超过 18 步；每步 description 不超过 120 字；notes 不超过 200 字。
        
        返回JSON格式：
        {{
            "experiment_design": {{
                "purpose": "实验目的",
                "principle": "实验原理",
                "method": "实验方法",
                "expected_results": "预期结果"
            }},
            "recipe": {{
                "materials": [
                    {{"name": "材料名", "specification": "规格", "amount": "用量"}}
                ],
                "steps": [
                    {{"step": 1, "description": "步骤描述", "parameters": {{"温度": "XX°C", "时间": "XX min"}}}}
                ],
                "notes": "注意事项"
            }}
        }}
        """
        
        client = get_client()
        response = client.chat.completions.create(
            model=DEEPSEEK_MODEL,
            messages=[
                {"role": "system", "content": "你是一个实验设计专家，擅长设计严谨的科学实验。回复必须是合法 JSON。"},
                {"role": "user", "content": design_prompt},
            ],
            max_tokens=_DESIGN_MAX_TOKENS,
            temperature=0.45,
        )
        choice = response.choices[0]
        response_text = (choice.message.content or "").strip()
        finish_reason = getattr(choice, "finish_reason", None)
        if finish_reason == "length":
            logger.warning(
                "[Experiment Design] finish_reason=length (输出可能被截断), chars=%s, max_tokens=%s",
                len(response_text),
                _DESIGN_MAX_TOKENS,
            )

        try:
            result = _parse_design_response(response_text)
        except json.JSONDecodeError as e:
            logger.warning("[Experiment Design] JSON 解析失败，尝试修复重试: %s", e)
            repair_user = (
                "下面是一段本应合法但 json.loads 失败的输出（常见于 max_tokens 截断）。\n"
                "请**只输出一个完整** JSON 对象，不要用 markdown 代码块。\n"
                "要求：\n"
                "- experiment_design：含 purpose, principle, method, expected_results 四个字符串；\n"
                "- recipe：**优先**使用单一 Markdown 字符串（完整实验配方，建议总长度 < 1500 字），"
                "避免深层嵌套数组导致截断；若用对象则 materials≤12、steps≤12、每步 description≤80 字。\n"
                f"解析错误：{e}\n\n"
                f"原始输出：\n{response_text[:9000]}"
            )
            response2 = client.chat.completions.create(
                model=DEEPSEEK_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "你只输出合法 JSON。键：experiment_design（对象）、recipe（字符串或对象）。",
                    },
                    {"role": "user", "content": repair_user},
                ],
                max_tokens=_DESIGN_MAX_TOKENS,
                temperature=0.2,
            )
            response_text2 = (response2.choices[0].message.content or "").strip()
            if getattr(response2.choices[0], "finish_reason", None) == "length":
                logger.warning("[Experiment Design] 修复请求仍被截断, chars=%s", len(response_text2))
            result = _parse_design_response(response_text2)

        ed = result.get("experiment_design") or {}
        raw_recipe = result.get("recipe")

        # 模型常把 recipe 收成 Markdown 字符串（与提示里「简短说明」一致），若仍按 dict 解析会 AttributeError，
        # 整段落入 except，所有分块都变成「实验设计失败，请检查输入文本」，合并后就是用户看到的失败态。
        if isinstance(raw_recipe, str) and raw_recipe.strip():
            recipe_md = raw_recipe.strip()
            if not recipe_md.lstrip().startswith("#"):
                recipe_md = "# 实验配方\n\n" + recipe_md
        elif isinstance(raw_recipe, dict):
            recipe_md = "# 实验配方\n\n"
            recipe_md += "## 材料\n\n"
            for material in raw_recipe.get("materials", []) or []:
                if not isinstance(material, dict):
                    continue
                recipe_md += f"- **{material.get('name', 'N/A')}**: {material.get('specification', 'N/A')}, 用量: {material.get('amount', 'N/A')}\n"

            recipe_md += "\n## 步骤\n\n"
            for step in raw_recipe.get("steps", []) or []:
                if not isinstance(step, dict):
                    continue
                recipe_md += f"### 步骤 {step.get('step', 'N/A')}\n\n"
                recipe_md += f"{step.get('description', 'N/A')}\n\n"
                if step.get("parameters") and isinstance(step["parameters"], dict):
                    recipe_md += "参数：\n"
                    for key, value in step["parameters"].items():
                        recipe_md += f"- {key}: {value}\n"
                recipe_md += "\n"

            if raw_recipe.get("notes"):
                recipe_md += f"\n## 注意事项\n\n{raw_recipe['notes']}\n"
        else:
            recipe_md = "# 实验配方\n\n（模型未返回可解析的 recipe 字段）\n"

        return {
            "experiment_design": ed if isinstance(ed, dict) else {},
            "recipe": recipe_md,
        }
        
    except Exception as e:
        logger.error(f"Experiment design failed: {e}")
        return {
            "experiment_design": {},
            "recipe": "# 实验配方\n\n实验设计失败，请检查输入文本。"
        }
