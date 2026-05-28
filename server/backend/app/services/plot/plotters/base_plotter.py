"""
Base plotter class with unified interface and style management (ported from merged-plot-agent).
"""

from __future__ import annotations

import base64
import io
import logging
from pathlib import Path
from typing import Optional, Tuple

import matplotlib.pyplot as plt
import seaborn as sns

logger = logging.getLogger(__name__)

# Font support (avoid CJK font requirements on servers)
plt.rcParams["font.sans-serif"] = ["DejaVu Sans", "Arial", "Helvetica", "sans-serif"]
plt.rcParams["axes.unicode_minus"] = False


class BasePlotter:
    STYLES = {
        "publication": {
            "figure_size": (10, 6),
            "dpi": 300,
            "font_family": "DejaVu Sans",
            "font_size": 12,
            "style": "whitegrid",
            "palette": "Set2",
            "rc_params": {
                "font.family": "sans-serif",
                "font.sans-serif": ["DejaVu Sans"],
                "font.size": 12,
                "axes.labelsize": 12,
                "axes.titlesize": 14,
                "xtick.labelsize": 10,
                "ytick.labelsize": 10,
                "legend.fontsize": 10,
                "figure.titlesize": 16,
                "axes.linewidth": 1.5,
                "grid.linewidth": 0.5,
                "lines.linewidth": 2,
                "lines.markersize": 3,
            },
        },
        "default": {
            "figure_size": (10, 6),
            "dpi": 150,
            "font_family": "DejaVu Sans",
            "font_size": 11,
            "style": "whitegrid",
            "palette": "deep",
            "rc_params": {},
        },
        "colorful": {
            "figure_size": (10, 6),
            "dpi": 150,
            "font_family": "DejaVu Sans",
            "font_size": 11,
            "style": "darkgrid",
            "palette": "husl",
            "rc_params": {},
        },
    }

    def __init__(
        self,
        style: str = "publication",
        figure_size: Optional[Tuple[float, float]] = None,
        dpi: Optional[int] = None,
        font_family: Optional[str] = None,
        font_size: Optional[int] = None,
    ):
        self.style = style
        self.style_config = self.STYLES.get(style, self.STYLES["default"]).copy()

        if figure_size:
            self.style_config["figure_size"] = figure_size
        if dpi:
            self.style_config["dpi"] = dpi
        if font_family:
            self.style_config["font_family"] = font_family
        if font_size:
            self.style_config["font_size"] = font_size

        self._apply_style()

    def _apply_style(self):
        sns.set_style(self.style_config["style"])
        sns.set_palette(self.style_config["palette"])
        rc_params = self.style_config.get("rc_params", {})
        if rc_params:
            plt.rcParams.update(rc_params)
        if "font_family" in self.style_config:
            plt.rcParams["font.family"] = self.style_config["font_family"]
        if "font_size" in self.style_config:
            plt.rcParams["font.size"] = self.style_config["font_size"]

    def create_figure(self, figsize: Optional[Tuple[float, float]] = None, dpi: Optional[int] = None, **kwargs):
        if figsize is None:
            figsize = self.style_config["figure_size"]
        if dpi is None:
            dpi = self.style_config["dpi"]
        fig, ax = plt.subplots(figsize=figsize, dpi=dpi, **kwargs)
        return fig, ax

    def save_figure(
        self,
        fig: plt.Figure,
        file_path: str,
        format: str = "png",
        dpi: Optional[int] = None,
        bbox_inches: str = "tight",
        **kwargs,
    ) -> str:
        if dpi is None:
            dpi = self.style_config["dpi"]
        path = Path(file_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        fig.savefig(path, format=format, dpi=dpi, bbox_inches=bbox_inches, **kwargs)
        logger.info("Figure saved to: %s", path)
        return str(path)

    def figure_to_base64(self, fig: plt.Figure, format: str = "png", dpi: Optional[int] = None) -> str:
        if dpi is None:
            dpi = self.style_config["dpi"]
        buffer = io.BytesIO()
        fig.savefig(buffer, format=format, dpi=dpi, bbox_inches="tight")
        buffer.seek(0)
        image_base64 = base64.b64encode(buffer.read()).decode("utf-8")
        mime_type = f"image/{format}" if format != "svg" else "image/svg+xml"
        return f"data:{mime_type};base64,{image_base64}"

    def close_figure(self, fig: plt.Figure):
        plt.close(fig)

    def set_labels(
        self,
        ax: plt.Axes,
        title: Optional[str] = None,
        xlabel: Optional[str] = None,
        ylabel: Optional[str] = None,
        auto_generate: bool = True,
        x_col: Optional[str] = None,
        y_col: Optional[str] = None,
        chart_type: Optional[str] = None,
    ):
        from .label_generator import LabelGenerator

        if auto_generate:
            if not xlabel and x_col:
                xlabel = LabelGenerator.generate_label(x_col, chart_type)
            if not ylabel and y_col:
                ylabel = LabelGenerator.generate_label(y_col, chart_type)
            if not title and chart_type:
                title = LabelGenerator.generate_title(chart_type, x_col, y_col)

        if title:
            ax.set_title(title, fontsize=self.style_config.get("font_size", 12) + 2)
        if xlabel:
            ax.set_xlabel(xlabel, fontsize=self.style_config.get("font_size", 12))
        if ylabel:
            ax.set_ylabel(ylabel, fontsize=self.style_config.get("font_size", 12))

