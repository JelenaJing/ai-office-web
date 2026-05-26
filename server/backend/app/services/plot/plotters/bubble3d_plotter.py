"""
3D Bubble Chart plotter.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Union

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from .base_plotter import BasePlotter

logger = logging.getLogger(__name__)


class Bubble3DPlotter(BasePlotter):
    def plot(
        self,
        data: Union[pd.DataFrame, Dict[str, Any], List],
        x: Optional[str] = None,
        y: Optional[str] = None,
        z: Optional[str] = None,
        size: Optional[str] = None,
        hue: Optional[str] = None,
        title: Optional[str] = None,
        xlabel: Optional[str] = None,
        ylabel: Optional[str] = None,
        zlabel: Optional[str] = None,
        alpha: float = 0.7,
        **kwargs,
    ) -> plt.Figure:
        if isinstance(data, (dict, list)):
            df = pd.DataFrame(data)
        else:
            df = data.copy()

        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        if len(numeric_cols) < 2:
            raise ValueError("Need at least 2 numeric columns for 3D Bubble Chart")

        x = x or numeric_cols[0]
        y = y or (numeric_cols[1] if len(numeric_cols) > 1 else numeric_cols[0])
        z = z or (numeric_cols[2] if len(numeric_cols) > 2 else None)
        size_col = size or (numeric_cols[3] if len(numeric_cols) > 3 else None)

        fig = plt.figure(figsize=self.style_config["figure_size"], dpi=self.style_config["dpi"])
        ax = fig.add_subplot(111, projection="3d")

        x_vals = df[x].values
        y_vals = df[y].values
        z_vals = df[z].values if z and z in df.columns else np.zeros(len(df))
        sizes = df[size_col].values * 100 if size_col and size_col in df.columns else 80

        if hue and hue in df.columns:
            categories = df[hue].unique()
            cmap = plt.cm.tab10
            for i, cat in enumerate(categories):
                mask = df[hue] == cat
                ax.scatter(
                    x_vals[mask], y_vals[mask], z_vals[mask],
                    s=sizes[mask] if hasattr(sizes, "__len__") else sizes,
                    c=[cmap(i / max(len(categories) - 1, 1))],
                    alpha=alpha, label=str(cat)
                )
            ax.legend()
        else:
            sc = ax.scatter(x_vals, y_vals, z_vals, s=sizes, c=z_vals, cmap="viridis", alpha=alpha)
            fig.colorbar(sc, ax=ax, shrink=0.5, label=z or "Z")

        ax.set_xlabel(xlabel or x)
        ax.set_ylabel(ylabel or y)
        ax.set_zlabel(zlabel or (z or "Z"))
        ax.set_title(title or "3D Bubble Chart")
        plt.tight_layout()
        return fig
