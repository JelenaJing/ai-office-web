"""
3D Scatter Plot plotter.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Union

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from .base_plotter import BasePlotter

logger = logging.getLogger(__name__)


class Scatter3DPlotter(BasePlotter):
    def plot(
        self,
        data: Union[pd.DataFrame, Dict[str, Any], List],
        x: Optional[str] = None,
        y: Optional[str] = None,
        z: Optional[str] = None,
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
            raise ValueError("Need at least 2 numeric columns for 3D Scatter Plot")

        x = x or numeric_cols[0]
        y = y or (numeric_cols[1] if len(numeric_cols) > 1 else numeric_cols[0])
        z = z or (numeric_cols[2] if len(numeric_cols) > 2 else None)

        fig = plt.figure(figsize=self.style_config["figure_size"], dpi=self.style_config["dpi"])
        ax = fig.add_subplot(111, projection="3d")

        x_vals = df[x].values
        y_vals = df[y].values
        z_vals = df[z].values if z and z in df.columns else np.zeros(len(df))

        if hue and hue in df.columns:
            categories = df[hue].unique()
            cmap = plt.cm.tab10
            for i, cat in enumerate(categories):
                mask = df[hue] == cat
                ax.scatter(x_vals[mask], y_vals[mask], z_vals[mask],
                           c=[cmap(i / max(len(categories) - 1, 1))],
                           alpha=alpha, label=str(cat), s=40)
            ax.legend()
        else:
            ax.scatter(x_vals, y_vals, z_vals, c="steelblue", alpha=alpha, s=40)

        ax.set_xlabel(xlabel or x)
        ax.set_ylabel(ylabel or y)
        ax.set_zlabel(zlabel or (z or "Z"))
        ax.set_title(title or "3D Scatter Plot")
        plt.tight_layout()
        return fig
