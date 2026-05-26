"""
Pareto Chart plotter (bar + cumulative line).
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Union

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from .base_plotter import BasePlotter

logger = logging.getLogger(__name__)


class ParetoPlotter(BasePlotter):
    def plot(
        self,
        data: Union[pd.DataFrame, Dict[str, Any], List],
        x: Optional[str] = None,
        y: Optional[str] = None,
        title: Optional[str] = None,
        xlabel: Optional[str] = None,
        ylabel: Optional[str] = None,
        **kwargs,
    ) -> plt.Figure:
        if isinstance(data, (dict, list)):
            df = pd.DataFrame(data)
        else:
            df = data.copy()

        # Detect columns
        cat_cols = df.select_dtypes(exclude=[np.number]).columns.tolist()
        num_cols = df.select_dtypes(include=[np.number]).columns.tolist()

        if not num_cols:
            raise ValueError("Need at least 1 numeric column for Pareto Chart")

        x_col = x or (cat_cols[0] if cat_cols else df.columns[0])
        y_col = y or num_cols[0]

        df_sorted = df[[x_col, y_col]].sort_values(y_col, ascending=False).reset_index(drop=True)
        cumulative_pct = (df_sorted[y_col].cumsum() / df_sorted[y_col].sum()) * 100

        fig, ax1 = self.create_figure()
        palette = plt.rcParams.get("axes.prop_cycle", plt.cycler(color=["steelblue"])).by_key()["color"]

        ax1.bar(df_sorted[x_col], df_sorted[y_col], color=palette[0], alpha=0.85)
        ax1.set_xlabel(xlabel or x_col)
        ax1.set_ylabel(ylabel or y_col, color=palette[0])
        ax1.tick_params("y", colors=palette[0])

        ax2 = ax1.twinx()
        ax2.plot(df_sorted[x_col], cumulative_pct, color="crimson", marker="o", linewidth=2, markersize=5)
        ax2.set_ylabel("Cumulative %", color="crimson")
        ax2.tick_params("y", colors="crimson")
        ax2.set_ylim(0, 110)
        ax2.axhline(y=80, color="gray", linestyle="--", linewidth=1, alpha=0.6)

        if len(df_sorted[x_col]) > 5:
            plt.setp(ax1.get_xticklabels(), rotation=45, ha="right")

        ax1.set_title(title or "Pareto Chart")
        plt.tight_layout()
        return fig
