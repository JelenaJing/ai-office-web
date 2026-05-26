"""
Circular Bar Plot (polar bar chart).
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Union

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from .base_plotter import BasePlotter

logger = logging.getLogger(__name__)


class CircularBarPlotter(BasePlotter):
    def plot(
        self,
        data: Union[pd.DataFrame, Dict[str, Any], List],
        x: Optional[str] = None,
        y: Optional[str] = None,
        title: Optional[str] = None,
        xlabel: Optional[str] = None,
        ylabel: Optional[str] = None,
        inner_radius: float = 0.3,
        **kwargs,
    ) -> plt.Figure:
        if isinstance(data, (dict, list)):
            df = pd.DataFrame(data)
        else:
            df = data.copy()

        num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        cat_cols = df.select_dtypes(exclude=[np.number]).columns.tolist()

        if not num_cols:
            raise ValueError("Need at least 1 numeric column for Circular Bar Plot")

        x_col = x or (cat_cols[0] if cat_cols else None)
        y_col = y or num_cols[0]

        if x_col and x_col in df.columns:
            labels = df[x_col].astype(str).tolist()
        else:
            labels = [str(i) for i in range(len(df))]
        values = df[y_col].values.astype(float)

        n = len(values)
        angles = np.linspace(0, 2 * np.pi, n, endpoint=False)
        width = 2 * np.pi / n * 0.8

        fig, ax = plt.subplots(
            figsize=self.style_config["figure_size"],
            dpi=self.style_config["dpi"],
            subplot_kw={"projection": "polar"}
        )

        # Normalize for bar heights relative to max
        norm_vals = values / max(values.max(), 1e-9)
        cmap = plt.cm.get_cmap("viridis", n)
        colors = [cmap(i / n) for i in range(n)]

        bars = ax.bar(angles, norm_vals, width=width, bottom=inner_radius,
                      color=colors, alpha=0.85, linewidth=0.5)

        # Labels
        for angle, label in zip(angles, labels):
            rotation = np.degrees(angle)
            if np.pi / 2 < angle < 3 * np.pi / 2:
                rotation += 180
            ax.text(angle, inner_radius + 1.05, label,
                    ha="center", va="center", fontsize=8, rotation=rotation,
                    rotation_mode="anchor")

        ax.set_yticklabels([])
        ax.set_xticklabels([])
        ax.spines["polar"].set_visible(False)
        ax.set_title(title or "Circular Bar Plot", pad=20)
        plt.tight_layout()
        return fig
