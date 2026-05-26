"""
Template preview generator for PythonPlottingExamples:
- Read pre-generated local preview images
- Return the full template list (not limited to 9 internal chart types)
"""

from __future__ import annotations

import logging
import base64
import re
import io
from pathlib import Path
from typing import Any, Dict, List
import matplotlib.pyplot as plt

logger = logging.getLogger(__name__)
_EXAMPLES_ROOT = Path("/home/ywt/w/PythonPlottingExamples")
_EXAMPLES_README = _EXAMPLES_ROOT / "README.md"
_EXAMPLES_IMAGE_DIR = _EXAMPLES_ROOT / "output_images"


def _to_script_stem(plot_name: str) -> str:
    cleaned = plot_name.replace("(", "").replace(")", "")
    cleaned = re.sub(r"[^a-zA-Z0-9]+", " ", cleaned).strip()
    words = [w for w in cleaned.split(" ") if w]
    return "".join(w.capitalize() for w in words)


def _normalize_name(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", name.lower())


def _parse_plot_names_from_readme() -> List[str]:
    if not _EXAMPLES_README.exists():
        return []
    names: List[str] = []
    in_plot_list = False
    with open(_EXAMPLES_README, "r", encoding="utf-8") as f:
        for line in f:
            s = line.strip()
            if s.startswith("## "):
                in_plot_list = s.lower() == "## list of plots"
                continue
            if in_plot_list and s.startswith("- "):
                names.append(s[2:].strip())
    return names


def _png_to_data_url(path: Path) -> str:
    raw = path.read_bytes()
    return "data:image/png;base64," + base64.b64encode(raw).decode("ascii")


def _placeholder_data_url(title: str) -> str:
    fig, ax = plt.subplots(figsize=(8, 4.5), dpi=120)
    ax.axis("off")
    ax.text(0.5, 0.58, title, ha="center", va="center", fontsize=16, weight="bold")
    ax.text(0.5, 0.40, "Preview pending local generation", ha="center", va="center", fontsize=11, color="#666666")
    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight")
    plt.close(fig)
    buf.seek(0)
    return "data:image/png;base64," + base64.b64encode(buf.read()).decode("ascii")


def generate_template_previews(style: str = "all", use_llm: bool = False) -> Dict[str, Any]:
    names = _parse_plot_names_from_readme()
    image_index: Dict[str, Path] = {}
    if _EXAMPLES_IMAGE_DIR.exists():
        for p in _EXAMPLES_IMAGE_DIR.glob("*.png"):
            image_index[_normalize_name(p.stem)] = p
    templates: List[Dict[str, Any]] = []
    for name in names:
        stem = _to_script_stem(name)
        image_path = image_index.get(_normalize_name(stem))
        item: Dict[str, Any] = {
            "template_id": stem,
            "chart_type": stem,
            "style": "python-plotting-examples",
            "title": name,
        }
        if image_path and image_path.exists():
            item["image_base64"] = _png_to_data_url(image_path)
            item["source"] = str(image_path)
        else:
            item["image_base64"] = _placeholder_data_url(name)
            item["error"] = f"Preview image not generated locally: {stem}.png"
        templates.append(item)

    return {
        "style": style,
        "use_llm": use_llm,
        "template_count": len(templates),
        "templates": templates,
    }

