"""
Heatmap plotter (ported from merged-plot-agent).
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Union

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns

from .base_plotter import BasePlotter

logger = logging.getLogger(__name__)


class HeatmapPlotter(BasePlotter):
    def plot(
        self,
        data: Union[pd.DataFrame, Dict[str, Any], List, np.ndarray],
        title: Optional[str] = None,
        xlabel: Optional[str] = None,
        ylabel: Optional[str] = None,
        cmap: str = "viridis",
        annot: bool = False,
        fmt: str = ".2f",
        vmin: Optional[float] = None,
        vmax: Optional[float] = None,
        center: Optional[float] = None,
        cbar_kws: Optional[Dict] = None,
        **kwargs,
    ) -> plt.Figure:
        if isinstance(data, np.ndarray):
            df = pd.DataFrame(data)
        elif isinstance(data, dict):
            df = pd.DataFrame(data)
        elif isinstance(data, list):
            df = pd.DataFrame(data)
        else:
            df = data.copy()

        numeric_df = df.select_dtypes(include=[np.number])
        if len(numeric_df.columns) == 0:
            raise ValueError("No numeric columns found for heatmap")

        if len(numeric_df.columns) > 1 and numeric_df.shape[0] != numeric_df.shape[1]:
            plot_data = numeric_df.corr()
        else:
            plot_data = numeric_df

        fig, ax = self.create_figure()
        sns.heatmap(
            plot_data,
            cmap=cmap,
            annot=annot,
            fmt=fmt,
            vmin=vmin,
            vmax=vmax,
            center=center,
            cbar_kws=cbar_kws or {},
            ax=ax,
            **kwargs,
        )
        self.set_labels(ax, title, xlabel, ylabel, auto_generate=True, chart_type="heatmap")
        plt.tight_layout()
        return fig

