"""
Histogram plotter (ported from merged-plot-agent).
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Union

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns

from .base_plotter import BasePlotter
from .label_generator import LabelGenerator

logger = logging.getLogger(__name__)


class HistogramPlotter(BasePlotter):
    def plot(
        self,
        data: Union[pd.DataFrame, Dict[str, Any], List],
        x: Optional[Union[str, List[str]]] = None,
        y: Optional[str] = None,
        title: Optional[str] = None,
        xlabel: Optional[str] = None,
        ylabel: Optional[str] = None,
        bins: int = 30,
        **kwargs,
    ) -> plt.Figure:
        if isinstance(data, dict):
            df = pd.DataFrame(data)
        elif isinstance(data, list):
            df = pd.DataFrame(data)
        else:
            df = data.copy()

        fig, ax = self.create_figure()

        if x is None:
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            if len(numeric_cols) > 0:
                x = numeric_cols[0]
            else:
                raise ValueError("Need at least one numeric column for histogram")

        if isinstance(x, list):
            cols = [c for c in x if c in df.columns]
            if not cols:
                raise ValueError("No valid columns for multi-series histogram")
            if not title and len(cols) > 1:
                title = LabelGenerator.generate_title_multi_series("histogram", None, cols, legend_caption="distributions")
            palette = plt.cm.tab10(np.linspace(0, 1, max(len(cols), 1)))
            hist_kw = {k: v for k, v in kwargs.items() if k not in ("label", "color", "alpha")}
            for i, col in enumerate(cols):
                sns.histplot(
                    data=df,
                    x=col,
                    bins=bins,
                    ax=ax,
                    label=str(col),
                    color=palette[i % len(palette)],
                    alpha=0.55,
                    element="step",
                    **hist_kw,
                )
            ax.legend(title="Series", frameon=True, fontsize=10)
        else:
            sns.histplot(data=df, x=x, bins=bins, ax=ax, **kwargs)

        if not ylabel:
            ylabel = "Frequency"

        x_for_label = x[0] if isinstance(x, list) and x else x
        self.set_labels(ax, title, xlabel, ylabel, auto_generate=True, x_col=x_for_label, y_col=None, chart_type="histogram")
        plt.tight_layout()
        return fig

