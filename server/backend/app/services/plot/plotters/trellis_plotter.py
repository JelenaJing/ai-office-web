"""
Trellis / FacetGrid Plot plotter.
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


class TrellisPlotter(BasePlotter):
    def plot(
        self,
        data: Union[pd.DataFrame, Dict[str, Any], List],
        x: Optional[str] = None,
        y: Optional[str] = None,
        col: Optional[str] = None,
        row: Optional[str] = None,
        hue: Optional[str] = None,
        title: Optional[str] = None,
        xlabel: Optional[str] = None,
        ylabel: Optional[str] = None,
        kind: str = "scatter",
        **kwargs,
    ) -> plt.Figure:
        if isinstance(data, (dict, list)):
            df = pd.DataFrame(data)
        else:
            df = data.copy()

        num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        cat_cols = df.select_dtypes(exclude=[np.number]).columns.tolist()

        if not num_cols:
            raise ValueError("Need at least 1 numeric column for Trellis Plot")

        x_col = x or num_cols[0]
        y_col = y or (num_cols[1] if len(num_cols) > 1 else num_cols[0])
        col_col = col or (cat_cols[0] if cat_cols else None)
        row_col = row or (cat_cols[1] if len(cat_cols) > 1 else None)

        facet_kwargs = {}
        if col_col:
            facet_kwargs["col"] = col_col
        if row_col:
            facet_kwargs["row"] = row_col

        g = sns.FacetGrid(df, **facet_kwargs, height=3.5, aspect=1.2,
                          palette="tab10", margin_titles=True)

        if kind == "scatter":
            g.map(plt.scatter, x_col, y_col, alpha=0.6, s=30)
        elif kind == "line":
            g.map(sns.lineplot, x_col, y_col)
        elif kind == "bar":
            g.map(sns.barplot, x_col, y_col)
        else:
            g.map(plt.scatter, x_col, y_col, alpha=0.6, s=30)

        g.set_axis_labels(xlabel or x_col, ylabel or y_col)
        if title:
            g.figure.suptitle(title, y=1.02, fontsize=12)

        plt.tight_layout()
        return g.figure
