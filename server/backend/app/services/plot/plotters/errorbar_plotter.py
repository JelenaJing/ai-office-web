"""
Errorbar Plot plotter.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Union

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from .base_plotter import BasePlotter

logger = logging.getLogger(__name__)


class ErrorbarPlotter(BasePlotter):
    def plot(
        self,
        data: Union[pd.DataFrame, Dict[str, Any], List],
        x: Optional[str] = None,
        y: Optional[str] = None,
        yerr: Optional[str] = None,
        xerr: Optional[str] = None,
        hue: Optional[str] = None,
        title: Optional[str] = None,
        xlabel: Optional[str] = None,
        ylabel: Optional[str] = None,
        fmt: str = "o-",
        capsize: int = 4,
        **kwargs,
    ) -> plt.Figure:
        if isinstance(data, (dict, list)):
            df = pd.DataFrame(data)
        else:
            df = data.copy()

        fig, ax = self.create_figure()
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()

        if len(numeric_cols) < 1:
            raise ValueError("Need at least 1 numeric column for Errorbar Plot")

        x_col = x or (df.columns[0] if df.columns[0] not in numeric_cols else None)
        if x_col is None or x_col not in df.columns:
            # use integer index as x
            df = df.copy()
            df["_index"] = np.arange(len(df))
            x_col = "_index"

        y_col = y or numeric_cols[0]
        yerr_vals = df[yerr].values if yerr and yerr in df.columns else None

        palette = plt.rcParams.get("axes.prop_cycle", plt.cycler(color=["steelblue"])).by_key()["color"]

        if hue and hue in df.columns:
            groups = df[hue].unique()
            for i, grp in enumerate(groups):
                mask = df[hue] == grp
                sub = df[mask]
                ye = sub[yerr].values if yerr and yerr in sub.columns else None
                xe = sub[xerr].values if xerr and xerr in sub.columns else None
                ax.errorbar(
                    sub[x_col], sub[y_col],
                    yerr=ye, xerr=xe,
                    fmt=fmt, capsize=capsize,
                    color=palette[i % len(palette)],
                    label=str(grp), linewidth=1.5
                )
            ax.legend()
        else:
            xe = df[xerr].values if xerr and xerr in df.columns else None
            ax.errorbar(
                df[x_col], df[y_col],
                yerr=yerr_vals, xerr=xe,
                fmt=fmt, capsize=capsize,
                color=palette[0], linewidth=1.5
            )

        self.set_labels(ax, title, xlabel, ylabel, auto_generate=True, x_col=x_col, y_col=y_col, chart_type="errorbar")
        plt.tight_layout()
        return fig
