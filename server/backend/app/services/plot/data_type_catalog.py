"""
Human-readable catalog of data-type → plotting template mappings (template_registry.json).
"""

from __future__ import annotations

from typing import Any, Dict, List

from .recommend.template_registry import TemplateRegistry

# data_type → (中文名, 简短说明)
DATA_TYPE_LABELS: Dict[str, tuple[str, str]] = {
    "raman_spectrum": ("拉曼光谱", "Raman shift – 强度折线"),
    "pl_spectrum": ("光致发光 PL", "波长 – PL 强度"),
    "mass_spectrum": ("质谱", "m/z – 相对强度（茎叶/散点）"),
    "uv_vis_spectrum": ("UV-Vis 吸收谱", "波长 – 吸光度"),
    "ftir_spectrum": ("红外 FTIR", "波数 – 透射率"),
    "xrd_pattern": ("XRD 衍射谱", "2θ – 强度"),
    "volcano_analysis": ("差异表达火山图", "log2FC – -log10(p)"),
    "time_series": ("时间序列", "时间 – 数值"),
    "categorical_comparison": ("分类对比", "类别 – 数值柱状"),
    "distribution": ("分布", "数值直方图"),
    "correlation_matrix": ("相关矩阵", "特征热图"),
    "generic_tabular": ("通用表格", "两列数值散点"),
    "ohlc_data": ("OHLC / K 线", "开高低收"),
    "vector_field_data": ("矢量场", "流线图"),
    "directional_data": ("方向数据", "风向玫瑰图"),
    "edge_list_data": ("边列表网络", "关系网络图"),
    "high_dimensional_data": ("高维数据", "平行坐标"),
    "three_dimensional_data": ("三维数据", "3D 散点"),
}

# Preferred display order (spectra first for lab users)
_DATA_TYPE_ORDER: List[str] = [
    "xrd_pattern",
    "pl_spectrum",
    "raman_spectrum",
    "uv_vis_spectrum",
    "ftir_spectrum",
    "mass_spectrum",
    "volcano_analysis",
    "time_series",
    "categorical_comparison",
    "distribution",
    "correlation_matrix",
    "three_dimensional_data",
    "high_dimensional_data",
    "vector_field_data",
    "directional_data",
    "edge_list_data",
    "ohlc_data",
    "generic_tabular",
]


def _axis_summary(template: Dict[str, Any]) -> str:
    axis = template.get("axis_spec") or {}
    x = axis.get("x") or {}
    y = axis.get("y") or {}
    xn = x.get("name") or "X"
    yn = y.get("name") or "Y"
    xu = x.get("unit")
    yu = y.get("unit")
    xs = f"{xn} ({xu})" if xu else str(xn)
    ys = f"{yn} ({yu})" if yu else str(yn)
    return f"{xs} – {ys}"


def list_data_type_templates() -> List[Dict[str, Any]]:
    registry = TemplateRegistry()
    by_type: Dict[str, Dict[str, Any]] = {}
    for template in registry.list_templates():
        data_types = template.get("data_types") or []
        if not data_types:
            continue
        primary = str(data_types[0])
        if primary in by_type:
            continue
        label, blurb = DATA_TYPE_LABELS.get(primary, (primary, ""))
        chart_type = str(template.get("chart_type") or "line")
        by_type[primary] = {
            "data_type": primary,
            "label": label,
            "description": blurb or _axis_summary(template),
            "template_id": template.get("template_id"),
            "chart_type": chart_type,
            "chart_type_label": _chart_type_label(chart_type),
            "axis_summary": _axis_summary(template),
        }

    ordered: List[Dict[str, Any]] = []
    seen = set()
    for dt in _DATA_TYPE_ORDER:
        if dt in by_type:
            ordered.append(by_type[dt])
            seen.add(dt)
    for dt, item in sorted(by_type.items()):
        if dt not in seen:
            ordered.append(item)
    return ordered


def _chart_type_label(chart_type: str) -> str:
    mapping = {
        "line": "折线图",
        "scatter": "散点图",
        "bar": "柱状图",
        "histogram": "直方图",
        "heatmap": "热图",
        "volcano": "火山图",
        "box": "箱线图",
        "violin": "小提琴图",
        "pie": "饼图",
        "stream": "流线图",
        "wind_rose": "玫瑰图",
        "network_graph": "网络图",
        "parallel_coordinates": "平行坐标",
        "3d_scatter": "3D 散点",
        "candlestick": "K 线图",
    }
    return mapping.get(chart_type, chart_type)
