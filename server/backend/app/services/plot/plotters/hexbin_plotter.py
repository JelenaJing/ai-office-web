"""
Hexbin Plot plotter.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Union

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from .base_plotter import BasePlotter

logger = logging.getLogger(__name__)


class HexbinPlotter(BasePlotter):
    def plot(
        self,
        data: Union[pd.DataFrame, Dict[str, Any], List],
        x: Optional[str] = None,
        y: Optional[str] = None,
        title: Optional[str] = None,
        xlabel: Optional[str] = None,
        ylabel: Optional[str] = None,
        gridsize: int = 20,
        cmap: str = "Blues",
        **kwargs,
    ) -> plt.Figure:
        if isinstance(data, (dict, list)):
            df = pd.DataFrame(data)
        else:
            df = data.copy()

        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        if len(numeric_cols) < 2:
            raise ValueError("Need at least 2 numeric columns for Hexbin Plot")

        x_col = x or numeric_cols[0]
        y_col = y or numeric_cols[1]

        fig, ax = self.create_figure()
        hb = ax.hexbin(df[x_col], df[y_col], gridsize=gridsize, cmap=cmap, mincnt=1)
        fig.colorbar(hb, ax=ax, label="Count")

        self.set_labels(ax, title, xlabel, ylabel, auto_generate=True, x_col=x_col, y_col=y_col, chart_type="hexbin")
        plt.tight_layout()
        return fig
