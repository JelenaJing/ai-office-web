"""
Bar chart plotter (ported from merged-plot-agent).
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


class BarPlotter(BasePlotter):
    def plot(
        self,
        data: Union[pd.DataFrame, Dict[str, Any], List],
        x: Optional[str] = None,
        y: Optional[Union[str, List[str]]] = None,
        title: Optional[str] = None,
        xlabel: Optional[str] = None,
        ylabel: Optional[str] = None,
        hue: Optional[str] = None,
        orientation: str = "vertical",
        **kwargs,
    ) -> plt.Figure:
        if isinstance(data, dict):
            df = pd.DataFrame(data)
        elif isinstance(data, list):
            df = pd.DataFrame(data)
        else:
            df = data.copy()

        fig, ax = self.create_figure()

        if isinstance(y, list) and x is not None and len(y) >= 1:
            value_vars = [c for c in y if c in df.columns]
            if not value_vars:
                raise ValueError("No valid y columns for grouped bar chart")
            if not title and len(value_vars) > 1:
                title = LabelGenerator.generate_title_multi_series("bar", x, value_vars, legend_caption="metrics")
            melted = df[[x] + value_vars].melt(id_vars=[x], var_name="_series_", value_name="_value_")
            if orientation == "horizontal":
                sns.barplot(data=melted, y=x, x="_value_", hue="_series_", ax=ax, **kwargs)
            else:
                sns.barplot(data=melted, x=x, y="_value_", hue="_series_", ax=ax, **kwargs)
            ax.legend(title="Series", frameon=True, fancybox=True, fontsize=10)
            try:
                if orientation == "vertical" and x in melted.columns and melted[x].nunique() > 5:
                    plt.setp(ax.get_xticklabels(), rotation=45, ha="right")
            except Exception:
                pass
            self.set_labels(ax, title, xlabel, ylabel, auto_generate=True, x_col=x, y_col=value_vars[0], chart_type="bar")
            plt.tight_layout()
            return fig

        if x is None and y is None:
            if len(df.columns) >= 2:
                x, y = df.columns[0], df.columns[1]
            else:
                raise ValueError("Need at least 2 columns for bar chart")
        elif x is None:
            x = df.index.name or "index"
            df = df.reset_index()
        elif y is None:
            y = "count"
            df = df[x].value_counts().reset_index()
            df.columns = [x, y]

        if orientation == "horizontal":
            if hue:
                sns.barplot(data=df, y=x, x=y, hue=hue, ax=ax, **kwargs)
            else:
                sns.barplot(data=df, y=x, x=y, ax=ax, **kwargs)
        else:
            if hue:
                sns.barplot(data=df, x=x, y=y, hue=hue, ax=ax, **kwargs)
            else:
                sns.barplot(data=df, x=x, y=y, ax=ax, **kwargs)

        self.set_labels(ax, title, xlabel, ylabel, auto_generate=True, x_col=x, y_col=y, chart_type="bar")

        try:
            if orientation == "vertical" and x in df.columns and len(df[x].unique()) > 5:
                plt.setp(ax.get_xticklabels(), rotation=45, ha="right")
        except Exception:
            pass

        plt.tight_layout()
        return fig

