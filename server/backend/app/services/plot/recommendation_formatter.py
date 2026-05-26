"""
Human-readable recommendation formatter for plot results.
"""

from __future__ import annotations

from typing import Any, Dict, Optional


def format_recommendation_text(recommendation: Optional[Dict[str, Any]], chart_type: str) -> str:
    """
    Convert the raw recommendation dict into a short, human-readable Chinese paragraph.
    This is intentionally rule-based (no extra LLM calls) for speed & stability.
    """
    if not recommendation:
        return f"已生成图表：推荐/使用图表类型为 {chart_type}。"

    rec_chart = recommendation.get("recommended_chart", chart_type)
    confidence = recommendation.get("confidence", None)
    reasoning = recommendation.get("reasoning", None)
    suggested = recommendation.get("suggested_parameters", {}) or {}
    resolved_dt = recommendation.get("resolved_data_type")
    resolved_tid = recommendation.get("resolved_template_id")

    parts = []
    if resolved_dt:
        parts.append(f"识别数据类型：{resolved_dt}")
    if resolved_tid:
        parts.append(f"选用模板：{resolved_tid}")
    if confidence is not None:
        try:
            conf_pct = round(float(confidence) * 100, 1) if float(confidence) <= 1 else round(float(confidence), 1)
            parts.append(f"推荐图表类型：{rec_chart}（置信度 {conf_pct}%）")
        except Exception:
            parts.append(f"推荐图表类型：{rec_chart}")
    else:
        parts.append(f"推荐图表类型：{rec_chart}")

    if reasoning:
        parts.append(f"原因：{reasoning}")

    x = suggested.get("x")
    y = suggested.get("y")
    hue = suggested.get("hue")
    if x or y or hue:
        mapping = []
        if x:
            mapping.append(f"x={x}" if not isinstance(x, list) else f"x={', '.join(map(str, x))}")
        if y:
            if isinstance(y, list):
                mapping.append("y=" + ", ".join(map(str, y)))
            else:
                mapping.append(f"y={y}")
        if hue:
            mapping.append(f"hue={hue}")
        parts.append("建议字段映射：" + "，".join(mapping))

    alternatives = recommendation.get("alternative_charts") or []
    if alternatives:
        parts.append("备选图表：" + "，".join([str(a) for a in alternatives[:3]]))

    return "；".join(parts) + "。"

