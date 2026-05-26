"""
Template-aware chart recommender based on data features and data type classification.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional

import pandas as pd

from .data_analyzer import DataAnalyzer
from .data_type_classifier import DataTypeClassifier
from .template_registry import TemplateRegistry

logger = logging.getLogger(__name__)


class ChartRecommender:
    """Template-aware chart recommender class."""

    CHART_TYPES: Dict[str, Dict[str, Any]] = {
        # ── Original 9 ──────────────────────────────────────────────────────
        "bar": {
            "name": "Bar Chart",
            "description": "Categorical vs numeric comparisons",
            "min_numeric": 1,
            "preferred_characteristics": ["has_categorical_data", "small_dataset"],
        },
        "scatter": {
            "name": "Scatter Plot",
            "description": "Two continuous variables relationship",
            "min_numeric": 2,
            "preferred_characteristics": ["two_numeric_columns"],
        },
        "line": {
            "name": "Line Plot",
            "description": "Time series or continuous trends",
            "min_numeric": 1,
            "preferred_characteristics": ["has_time_series", "medium_dataset", "large_dataset"],
        },
        "volcano": {
            "name": "Volcano Plot",
            "description": "Differential expression analysis",
            "min_numeric": 2,
            "preferred_characteristics": ["differential_expression_data"],
        },
        "heatmap": {
            "name": "Heatmap",
            "description": "Correlation matrices or 2D data",
            "min_numeric": 2,
            "preferred_characteristics": ["multiple_numeric_columns", "square_matrix"],
        },
        "box": {
            "name": "Box Plot",
            "description": "Distribution comparisons across groups",
            "min_numeric": 1,
            "preferred_characteristics": ["has_categorical_data", "multiple_numeric_columns"],
        },
        "histogram": {
            "name": "Histogram",
            "description": "Single variable distribution",
            "min_numeric": 1,
            "preferred_characteristics": ["single_numeric_column"],
        },
        "violin": {
            "name": "Violin Plot",
            "description": "Distribution shape comparison",
            "min_numeric": 1,
            "preferred_characteristics": ["has_categorical_data", "large_dataset"],
        },
        "pie": {
            "name": "Pie Chart",
            "description": "Part-to-whole proportions",
            "min_numeric": 1,
            "preferred_characteristics": ["has_categorical_data", "small_dataset"],
        },
        # ── Extended 18 ──────────────────────────────────────────────────────
        "3d_bubble": {
            "name": "3D Bubble Chart",
            "description": "Three numeric axes + bubble size encoding",
            "min_numeric": 3,
            "preferred_characteristics": ["multiple_numeric_columns"],
        },
        "3d_scatter": {
            "name": "3D Scatter Plot",
            "description": "Three continuous variables in 3D space",
            "min_numeric": 3,
            "preferred_characteristics": ["multiple_numeric_columns"],
        },
        "3d_surface": {
            "name": "3D Surface Plot",
            "description": "Continuous function over a 2D grid",
            "min_numeric": 3,
            "preferred_characteristics": ["multiple_numeric_columns", "square_matrix"],
        },
        "contour": {
            "name": "Contour Plot",
            "description": "2D scalar field as level curves",
            "min_numeric": 3,
            "preferred_characteristics": ["multiple_numeric_columns"],
        },
        "errorbar": {
            "name": "Errorbar Plot",
            "description": "Data points with uncertainty/error bars",
            "min_numeric": 2,
            "preferred_characteristics": ["two_numeric_columns", "has_error_columns"],
        },
        "hexbin": {
            "name": "Hexbin Plot",
            "description": "2D density using hexagonal bins",
            "min_numeric": 2,
            "preferred_characteristics": ["two_numeric_columns", "large_dataset"],
        },
        "pareto": {
            "name": "Pareto Chart",
            "description": "Sorted bar + cumulative percentage line",
            "min_numeric": 1,
            "preferred_characteristics": ["has_categorical_data"],
        },
        "radar": {
            "name": "Radar / Spider Chart",
            "description": "Multi-dimensional comparison on polar axes",
            "min_numeric": 3,
            "preferred_characteristics": ["multiple_numeric_columns", "has_categorical_data"],
        },
        "waterfall": {
            "name": "Waterfall Chart",
            "description": "Cumulative effect of sequential positive/negative values",
            "min_numeric": 1,
            "preferred_characteristics": ["has_categorical_data", "small_dataset"],
        },
        "wind_rose": {
            "name": "Wind Rose / Polar Bar",
            "description": "Directional / angular distribution",
            "min_numeric": 2,
            "preferred_characteristics": ["has_directional_data", "two_numeric_columns"],
        },
        "parallel_coordinates": {
            "name": "Parallel Coordinates Plot",
            "description": "High-dimensional data exploration",
            "min_numeric": 3,
            "preferred_characteristics": ["multiple_numeric_columns"],
        },
        "trellis": {
            "name": "Trellis / FacetGrid Plot",
            "description": "Small multiples conditioned on categorical variables",
            "min_numeric": 2,
            "preferred_characteristics": ["has_categorical_data", "multiple_numeric_columns"],
        },
        "network_graph": {
            "name": "Network Graph",
            "description": "Node-link diagram for relational / graph data",
            "min_numeric": 0,
            "preferred_characteristics": ["has_edge_data"],
        },
        "circular_bar": {
            "name": "Circular Bar Plot",
            "description": "Polar bar chart for cyclic categories",
            "min_numeric": 1,
            "preferred_characteristics": ["has_categorical_data", "small_dataset"],
        },
        "polar": {
            "name": "Polar Plot",
            "description": "Data plotted on polar (r, θ) axes",
            "min_numeric": 2,
            "preferred_characteristics": ["has_directional_data", "two_numeric_columns"],
        },
        "stream": {
            "name": "Stream Plot",
            "description": "Vector field / flow visualization",
            "min_numeric": 4,
            "preferred_characteristics": ["vector_field_data"],
        },
        "candlestick": {
            "name": "Candlestick Chart",
            "description": "OHLC financial / time-series price data",
            "min_numeric": 4,
            "preferred_characteristics": ["ohlc_data", "has_time_series"],
        },
    }

    def __init__(self, use_llm: bool = False, llm_client: Any = None):
        self.analyzer = DataAnalyzer()
        self.use_llm = use_llm
        self.llm_client = llm_client
        self.data_type_classifier = DataTypeClassifier(llm_client=llm_client)
        self.template_registry = TemplateRegistry()

    def recommend(
        self,
        df: pd.DataFrame,
        top_n: int = 5,
        use_llm: Optional[bool] = None,
        data_type_hint: Optional[str] = None,
        template_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        analysis = self.analyzer.analyze(df)
        llm_enabled = self.use_llm if use_llm is None else bool(use_llm)
        data_type_result = self.data_type_classifier.classify(
            df=df, analysis=analysis, data_type_hint=data_type_hint, use_llm=llm_enabled
        )
        template = self.template_registry.match_template(
            data_type=data_type_result.data_type,
            analysis=analysis,
            preferred_template_id=template_id,
        )
        template_recommendation = self._build_template_recommendation(
            analysis=analysis, template=template, data_type_result=data_type_result
        )
        if template_recommendation is not None:
            return template_recommendation
        return self._recommend_with_rules(analysis, top_n=top_n, data_type_result=data_type_result)

    def _build_template_recommendation(
        self,
        *,
        analysis: Dict[str, Any],
        template: Optional[Dict[str, Any]],
        data_type_result,
    ) -> Optional[Dict[str, Any]]:
        if not template:
            return None

        chart_type = str(template.get("chart_type") or "scatter")
        suggested = self._suggest_parameters(analysis, chart_type)
        suggested = self._merge_template_axis_labels(suggested, template)
        suggested["template_id"] = template.get("template_id")
        suggested["style"] = (template.get("style_defaults") or {}).get("style")
        suggested["data_type"] = data_type_result.data_type
        for key, value in (template.get("parameter_hints") or {}).items():
            if suggested.get(key) is None:
                suggested[key] = value

        recommendation = {
            "chart_type": chart_type,
            "confidence": min(max(float(data_type_result.confidence), 0.0), 1.0),
            "reasoning": (
                f"{data_type_result.reason}; matched template {template.get('template_id')} "
                f"for data_type={data_type_result.data_type}"
            ),
            "suggested_parameters": suggested,
            "template_id": template.get("template_id"),
            "data_type": data_type_result.data_type,
        }
        return {
            "recommended_chart": chart_type,
            "confidence": recommendation["confidence"],
            "reasoning": recommendation["reasoning"],
            "recommendations": [recommendation],
            "alternative_charts": [],
            "suggested_parameters": suggested,
            "analysis": analysis,
            "resolved_data_type": data_type_result.data_type,
            "resolved_template_id": template.get("template_id"),
            "type_detection": {
                "source": data_type_result.source,
                "reason": data_type_result.reason,
                "confidence": data_type_result.confidence,
            },
            "template_match_reason": f"Matched by data_type={data_type_result.data_type}",
        }

    def _recommend_with_rules(self, analysis: Dict[str, Any], top_n: int = 5, data_type_result=None) -> Dict[str, Any]:
        n_numeric = len(analysis["numeric_columns"])
        n_categorical = len(analysis["categorical_columns"])
        characteristics = analysis["data_characteristics"]

        scores: Dict[str, float] = {}
        for chart_type, chart_info in self.CHART_TYPES.items():
            if n_numeric < chart_info["min_numeric"]:
                continue
            score = 0.0
            for char in characteristics:
                if char in chart_info["preferred_characteristics"]:
                    score += 1.0

            # Special boosts
            if chart_type == "volcano" and "differential_expression_data" in characteristics:
                score += 5.0
            if chart_type == "scatter" and n_numeric == 2 and "spectral_data" in characteristics:
                score += 3.0
            if chart_type == "line" and "has_time_series" in characteristics:
                score += 3.0
            if chart_type == "heatmap" and "square_matrix" in characteristics:
                score += 4.0
            if chart_type == "bar" and n_categorical > 0 and n_numeric >= 1:
                score += 2.0
            if chart_type == "histogram" and n_numeric == 1:
                score += 2.0
            # Extended boosts
            if chart_type in ("3d_bubble", "3d_scatter", "3d_surface") and n_numeric >= 3:
                score += 2.0
            if chart_type == "hexbin" and n_numeric == 2 and "large_dataset" in characteristics:
                score += 3.0
            if chart_type == "radar" and n_numeric >= 3 and n_categorical >= 1:
                score += 2.0
            if chart_type == "parallel_coordinates" and n_numeric >= 4:
                score += 2.0
            if chart_type == "contour" and n_numeric >= 3:
                score += 1.5
            if chart_type == "pareto" and n_categorical > 0:
                score += 1.5
            if chart_type == "waterfall" and n_categorical > 0 and n_numeric == 1:
                score += 1.5
            if chart_type == "candlestick" and n_numeric >= 4 and "has_time_series" in characteristics:
                score += 4.0
            if chart_type in ("wind_rose", "polar", "circular_bar") and "has_directional_data" in characteristics:
                score += 3.0
            if chart_type == "trellis" and n_categorical >= 1 and n_numeric >= 2:
                score += 1.5
            if chart_type == "network_graph" and "has_edge_data" in characteristics:
                score += 4.0
            if chart_type == "stream" and n_numeric >= 4 and "vector_field_data" in characteristics:
                score += 4.0
            if chart_type == "errorbar" and "has_error_columns" in characteristics:
                score += 3.0

            scores[chart_type] = score

        if not scores:
            default = ["scatter", "bar", "line", "heatmap", "box"] if n_numeric >= 2 else ["bar", "histogram", "box"]
            recommendations = [
                {
                    "chart_type": ct,
                    "confidence": 0.5,
                    "reasoning": f"Default recommendation for {self.CHART_TYPES.get(ct, {}).get('name', ct)}",
                    "suggested_parameters": self._suggest_parameters(analysis, ct),
                }
                for ct in default[:top_n]
                if ct in self.CHART_TYPES
            ]
        else:
            sorted_charts = sorted(scores.items(), key=lambda x: x[1], reverse=True)
            max_score = sorted_charts[0][1] if sorted_charts else 1.0
            recommendations = []
            for ct, score in sorted_charts[:top_n]:
                confidence = (score / max_score) if max_score > 0 else 0.5
                recommendations.append(
                    {
                        "chart_type": ct,
                        "confidence": min(float(confidence), 1.0),
                        "reasoning": self._get_reasoning(analysis, ct),
                        "suggested_parameters": self._suggest_parameters(analysis, ct),
                    }
                )

        recommended = recommendations[0]["chart_type"] if recommendations else "scatter"
        resolved_data_type = getattr(data_type_result, "data_type", "generic_tabular")
        type_reason = getattr(data_type_result, "reason", "Rule-based fallback recommendation")
        type_source = getattr(data_type_result, "source", "rules")
        type_conf = getattr(data_type_result, "confidence", 0.5)
        return {
            "recommended_chart": recommended,
            "confidence": recommendations[0]["confidence"] if recommendations else 0.5,
            "reasoning": recommendations[0]["reasoning"] if recommendations else "Default recommendation",
            "recommendations": recommendations,
            "alternative_charts": [r["chart_type"] for r in recommendations[1:]],
            "suggested_parameters": recommendations[0]["suggested_parameters"] if recommendations else {},
            "analysis": analysis,
            "resolved_data_type": resolved_data_type,
            "resolved_template_id": None,
            "type_detection": {"source": type_source, "reason": type_reason, "confidence": type_conf},
            "template_match_reason": "No template matched; used rule-based chart scoring",
        }

    def _suggest_parameters(self, analysis: Dict[str, Any], chart_type: str) -> Dict[str, Any]:
        numeric_cols = analysis["numeric_columns"]
        categorical_cols = analysis["categorical_columns"]

        params: Dict[str, Any] = {"x": None, "y": None, "hue": None, "title": None, "xlabel": None, "ylabel": None}

        if chart_type == "bar":
            if categorical_cols:
                params["x"] = categorical_cols[0]
            if numeric_cols:
                params["y"] = numeric_cols[0]
        elif chart_type in ["scatter", "line"]:
            if len(numeric_cols) >= 2:
                params["x"] = numeric_cols[0]
                params["y"] = numeric_cols[1]
            elif len(numeric_cols) == 1:
                params["y"] = numeric_cols[0]
        elif chart_type == "histogram":
            if numeric_cols:
                params["x"] = numeric_cols[0]
        elif chart_type == "volcano":
            fc_cols = [c for c in numeric_cols if any(t in c.lower() for t in ["foldchange", "fold_change", "log2fc", "logfc", "fc"])]
            pval_cols = [c for c in numeric_cols if any(t in c.lower() for t in ["pvalue", "p_value", "pval", "padj", "adj_pvalue", "fdr"])]
            if fc_cols:
                params["x"] = fc_cols[0]
            if pval_cols:
                params["y"] = pval_cols[0]

        if categorical_cols and chart_type in ["scatter", "line", "bar"]:
            params["hue"] = categorical_cols[0]

        # Titles/labels are generated downstream by plotter label generator
        return params

    @staticmethod
    def _merge_template_axis_labels(params: Dict[str, Any], template: Dict[str, Any]) -> Dict[str, Any]:
        axis_spec = template.get("axis_spec") or {}
        x_axis = axis_spec.get("x") or {}
        y_axis = axis_spec.get("y") or {}

        if x_axis:
            x_name = x_axis.get("name")
            x_unit = x_axis.get("unit")
            if x_name:
                params["xlabel"] = f"{x_name} ({x_unit})" if x_unit else x_name
        if y_axis:
            y_name = y_axis.get("name")
            y_unit = y_axis.get("unit")
            if y_name:
                params["ylabel"] = f"{y_name} ({y_unit})" if y_unit else y_name
        return params

    def _get_reasoning(self, analysis: Dict[str, Any], chart_type: str) -> str:
        characteristics = analysis["data_characteristics"]
        n_numeric = len(analysis["numeric_columns"])
        reasons: list[str] = []

        if "differential_expression_data" in characteristics and chart_type == "volcano":
            reasons.append("Data contains fold change and p-value columns, suitable for volcano plot")
        if "spectral_data" in characteristics and chart_type in ["scatter", "line"]:
            reasons.append("Data appears to be spectral data (wavelength vs intensity)")
        if "has_time_series" in characteristics and chart_type == "line":
            reasons.append("Data contains time series information")
        if n_numeric == 2 and chart_type == "scatter":
            reasons.append("Two numeric columns are ideal for scatter plot")
        if len(analysis["categorical_columns"]) > 0 and chart_type == "bar":
            reasons.append("Categorical data is well-suited for bar charts")

        return "; ".join(reasons) if reasons else f"Data structure matches {chart_type} requirements"

