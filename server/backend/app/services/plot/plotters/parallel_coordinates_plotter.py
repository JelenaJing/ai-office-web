"""
Parallel Coordinates Plot plotter.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Union

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from pandas.plotting import parallel_coordinates

from .base_plotter import BasePlotter

logger = logging.getLogger(__name__)


class ParallelCoordinatesPlotter(BasePlotter):
    def plot(
        self,
        data: Union[pd.DataFrame, Dict[str, Any], List],
        class_column: Optional[str] = None,
        title: Optional[str] = None,
        xlabel: Optional[str] = None,
        ylabel: Optional[str] = None,
        colormap: str = "tab10",
        alpha: float = 0.6,
        **kwargs,
    ) -> plt.Figure:
        if isinstance(data, (dict, list)):
            df = pd.DataFrame(data)
        else:
            df = data.copy()

        cat_cols = df.select_dtypes(exclude=[np.number]).columns.tolist()
        num_cols = df.select_dtypes(include=[np.number]).columns.tolist()

        # Choose class column: prefer categorical, fall back to first column
        if class_column and class_column in df.columns:
            cls_col = class_column
        elif cat_cols:
            cls_col = cat_cols[0]
        else:
            # Discretize first numeric column into bins
            cls_col = "_class"
            df = df.copy()
            df[cls_col] = pd.qcut(df[num_cols[0]], q=min(4, len(df)), labels=False, duplicates="drop").astype(str)

        if not num_cols:
            raise ValueError("Need at least 1 numeric column for Parallel Coordinates")

        fig, ax = self.create_figure()
        parallel_coordinates(df[[cls_col] + num_cols], cls_col, colormap=colormap, alpha=alpha, ax=ax)

        self.set_labels(ax, title or "Parallel Coordinates Plot", xlabel, ylabel, auto_generate=False)
        plt.xticks(rotation=30, ha="right")
        plt.tight_layout()
        return fig
