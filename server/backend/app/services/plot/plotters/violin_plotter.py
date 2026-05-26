"""
Violin plot plotter (ported from merged-plot-agent).
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


class ViolinPlotter(BasePlotter):
    def plot(
        self,
        data: Union[pd.DataFrame, Dict[str, Any], List],
        x: Optional[str] = None,
        y: Optional[str] = None,
        title: Optional[str] = None,
        xlabel: Optional[str] = None,
        ylabel: Optional[str] = None,
        hue: Optional[str] = None,
        **kwargs,
    ) -> plt.Figure:
        if isinstance(data, dict):
            df = pd.DataFrame(data)
        elif isinstance(data, list):
            df = pd.DataFrame(data)
        else:
            df = data.copy()

        fig, ax = self.create_figure()

        if x is None and y is None:
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            if len(numeric_cols) > 0:
                df = df[numeric_cols].melt(var_name="Features", value_name="Values")
                x, y = "Features", "Values"
            else:
                raise ValueError("Need at least one numeric column for violin plot")
        elif y is None and x is not None:
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            if len(numeric_cols) > 0:
                df = df[[x] + list(numeric_cols)].melt(id_vars=[x], var_name="Features", value_name="Values")
                y = "Values"
            else:
                raise ValueError("Need at least one numeric column for violin plot")

        if hue:
            sns.violinplot(data=df, x=x, y=y, hue=hue, ax=ax, **kwargs)
        else:
            sns.violinplot(data=df, x=x, y=y, ax=ax, **kwargs)

        self.set_labels(ax, title, xlabel, ylabel, auto_generate=True, x_col=x, y_col=y, chart_type="violin")
        plt.tight_layout()
        return fig

