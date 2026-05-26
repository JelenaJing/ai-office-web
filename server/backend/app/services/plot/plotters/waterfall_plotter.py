"""
Waterfall Chart plotter.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Union

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from .base_plotter import BasePlotter

logger = logging.getLogger(__name__)


class WaterfallPlotter(BasePlotter):
    def plot(
        self,
        data: Union[pd.DataFrame, Dict[str, Any], List],
        x: Optional[str] = None,
        y: Optional[str] = None,
        title: Optional[str] = None,
        xlabel: Optional[str] = None,
        ylabel: Optional[str] = None,
        show_total: bool = True,
        **kwargs,
    ) -> plt.Figure:
        if isinstance(data, (dict, list)):
            df = pd.DataFrame(data)
        else:
            df = data.copy()

        num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        cat_cols = df.select_dtypes(exclude=[np.number]).columns.tolist()

        if not num_cols:
            raise ValueError("Need at least 1 numeric column for Waterfall Chart")

        x_col = x or (cat_cols[0] if cat_cols else None)
        y_col = y or num_cols[0]

        if x_col and x_col in df.columns:
            labels = df[x_col].astype(str).tolist()
        else:
            labels = [str(i) for i in range(len(df))]

        values = df[y_col].values.astype(float)

        if show_total:
            labels = labels + ["Total"]
            values = np.append(values, values.sum())

        running = np.zeros(len(values))
        bottoms = np.zeros(len(values))
        for i, v in enumerate(values):
            if i == 0 or (show_total and i == len(values) - 1):
                bottoms[i] = 0
            else:
                bottoms[i] = running[i - 1]
            running[i] = bottoms[i] + v

        colors = ["#2ecc71" if v >= 0 else "#e74c3c" for v in values]
        if show_total:
            colors[-1] = "#3498db"

        fig, ax = self.create_figure()
        bars = ax.bar(labels, values, bottom=bottoms, color=colors, alpha=0.85, width=0.6)

        # Add value labels on bars
        for bar, val in zip(bars, values):
            ypos = bar.get_y() + bar.get_height() / 2
            ax.text(bar.get_x() + bar.get_width() / 2, ypos, f"{val:+.2g}",
                    ha="center", va="center", fontsize=9, color="white", fontweight="bold")

        ax.axhline(0, color="black", linewidth=0.8)
        if len(labels) > 6:
            plt.setp(ax.get_xticklabels(), rotation=45, ha="right")

        self.set_labels(ax, title or "Waterfall Chart", xlabel or (x_col or ""), ylabel or y_col,
                        auto_generate=False)
        plt.tight_layout()
        return fig
