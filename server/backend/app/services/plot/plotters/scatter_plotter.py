"""
Scatter plot plotter (ported from merged-plot-agent).
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


class ScatterPlotter(BasePlotter):
    def plot(
        self,
        data: Union[pd.DataFrame, Dict[str, Any], List],
        x: Optional[str] = None,
        y: Optional[Union[str, List[str]]] = None,
        title: Optional[str] = None,
        xlabel: Optional[str] = None,
        ylabel: Optional[str] = None,
        hue: Optional[str] = None,
        size: Optional[str] = None,
        alpha: float = 0.6,
        multiple_series: Optional[List[Dict[str, Any]]] = None,
        **kwargs,
    ) -> plt.Figure:
        if isinstance(data, dict):
            df = pd.DataFrame(data)
        elif isinstance(data, list):
            df = pd.DataFrame(data)
        else:
            df = data.copy()

        fig, ax = self.create_figure()

        if multiple_series:
            colors = plt.cm.tab10(np.linspace(0, 1, len(multiple_series)))
            for idx, series in enumerate(multiple_series):
                series_x = series.get("x")
                series_y = series.get("y")
                series_label = series.get("label", f"Series {idx+1}")
                series_data = series.get("data")

                if series_data is not None:
                    series_df = pd.DataFrame(series_data) if isinstance(series_data, (dict, list)) else series_data
                    plot_x = series_x if series_x and isinstance(series_x, str) else series_df.columns[0]
                    plot_y = series_y if series_y and isinstance(series_y, str) else series_df.columns[1]
                else:
                    if isinstance(series_x, (list, np.ndarray)) and isinstance(series_y, (list, np.ndarray)):
                        series_df = pd.DataFrame({"x": series_x, "y": series_y})
                        plot_x, plot_y = "x", "y"
                    elif isinstance(series_x, str) and isinstance(series_y, str) and series_x in df.columns and series_y in df.columns:
                        series_df = df[[series_x, series_y]]
                        plot_x, plot_y = series_x, series_y
                    else:
                        continue

                sns.scatterplot(
                    data=series_df,
                    x=plot_x,
                    y=plot_y,
                    label=series_label,
                    color=colors[idx],
                    alpha=alpha,
                    s=50,
                    ax=ax,
                    **kwargs,
                )
        else:
            if isinstance(y, list):
                if x is None:
                    numeric_cols = df.select_dtypes(include=[np.number]).columns
                    if len(numeric_cols) < 2:
                        raise ValueError("Need at least 2 numeric columns for multi-series scatter")
                    x = numeric_cols[0]
                    y = [c for c in y if c in df.columns]
                if not title and len(y) > 1:
                    title = LabelGenerator.generate_title_multi_series("scatter", x, y)
                colors = plt.cm.tab10(np.linspace(0, 1, max(len(y), 1)))
                scatter_kwargs = {k: v for k, v in kwargs.items() if k not in ["linestyle", "linewidth"]}
                for idx, y_col in enumerate(y):
                    sns.scatterplot(
                        data=df,
                        x=x,
                        y=y_col,
                        hue=None,
                        alpha=alpha,
                        s=scatter_kwargs.get("s", 50),
                        ax=ax,
                        label=str(y_col),
                        color=colors[idx % len(colors)],
                        **scatter_kwargs,
                    )
                x_col = x
                y_col = y[0] if y else None
            else:
                if x is None or y is None:
                    numeric_cols = df.select_dtypes(include=[np.number]).columns
                    if len(numeric_cols) < 2:
                        raise ValueError("Need at least 2 numeric columns for scatter plot")
                    x = numeric_cols[0] if x is None else x
                    y = numeric_cols[1] if y is None else y

                scatter_kwargs = {k: v for k, v in kwargs.items() if k not in ["linestyle", "linewidth"]}
                sns.scatterplot(
                    data=df,
                    x=x,
                    y=y,
                    hue=hue,
                    size=size,
                    alpha=alpha,
                    s=scatter_kwargs.get("s", 50),
                    ax=ax,
                    **scatter_kwargs,
                )
                x_col, y_col = x, y

        if multiple_series:
            first_series = multiple_series[0]
            x_col = first_series.get("x") if isinstance(first_series.get("x"), str) else None
            y_col = first_series.get("y") if isinstance(first_series.get("y"), str) else None
        elif not multiple_series and not isinstance(y, list):
            x_col, y_col = x, y

        self.set_labels(ax, title, xlabel, ylabel, auto_generate=True, x_col=x_col, y_col=y_col, chart_type="scatter")
        ax.grid(True, alpha=0.3)
        if multiple_series or isinstance(y, list):
            ax.legend(frameon=True, fancybox=True, shadow=True, fontsize=10)
        plt.tight_layout()
        return fig

