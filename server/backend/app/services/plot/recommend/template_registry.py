"""
Template registry for mapping resolved data types to plotting templates.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional


class TemplateRegistry:
    def __init__(self, registry_path: Optional[str] = None):
        if registry_path:
            self.registry_path = Path(registry_path)
        else:
            self.registry_path = Path(__file__).resolve().parents[1] / "templates" / "template_registry.json"
        self._templates = self._load_templates()

    def _load_templates(self) -> List[Dict[str, Any]]:
        payload = json.loads(self.registry_path.read_text(encoding="utf-8"))
        templates = payload.get("templates", [])
        if not isinstance(templates, list):
            raise ValueError("template_registry.json: templates must be a list")
        return templates

    def list_templates(self) -> List[Dict[str, Any]]:
        return list(self._templates)

    def get_by_id(self, template_id: str) -> Optional[Dict[str, Any]]:
        if not template_id:
            return None
        for t in self._templates:
            if t.get("template_id") == template_id:
                return t
        return None

    def match_template(
        self,
        *,
        data_type: str,
        analysis: Dict[str, Any],
        preferred_template_id: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        if preferred_template_id:
            explicit = self.get_by_id(preferred_template_id)
            if explicit:
                return explicit

        candidates = [t for t in self._templates if data_type in (t.get("data_types") or [])]
        if not candidates:
            candidates = [t for t in self._templates if "generic_tabular" in (t.get("data_types") or [])]
            if not candidates:
                return None

        scored = [(self._score_template(t, analysis), t) for t in candidates]
        scored.sort(key=lambda x: x[0], reverse=True)
        return scored[0][1]

    @staticmethod
    def _score_template(template: Dict[str, Any], analysis: Dict[str, Any]) -> float:
        characteristics = set(analysis.get("data_characteristics", []))
        required = set(template.get("required_characteristics", []))
        score = 0.0
        score += 2.0 * len(required.intersection(characteristics))

        chart_type = template.get("chart_type")
        numeric_cols = analysis.get("numeric_columns", [])
        if chart_type in {"scatter", "line", "volcano"} and len(numeric_cols) >= 2:
            score += 1.0
        if chart_type == "histogram" and len(numeric_cols) >= 1:
            score += 1.0
        if chart_type == "bar" and "has_categorical_data" in characteristics:
            score += 1.0
        if chart_type == "heatmap" and len(numeric_cols) >= 2:
            score += 1.0
        return score
