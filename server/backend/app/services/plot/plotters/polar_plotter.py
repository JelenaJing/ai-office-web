"""
Polar Plot plotter.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Union

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from .base_plotter import BasePlotter

logger = logging.getLogger(__name__)


class PolarPlotter(BasePlotter):
    def plot(
        self,
        data: Union[pd.DataFrame, Dict[str, Any], List],
        theta: Optional[str] = None,
        r: Optional[str] = None,
        hue: Optional[str] = None,
        title: Optional[str] = None,
        xlabel: Optional[str] = None,
        ylabel: Optional[str] = None,
        **kwargs,
    ) -> plt.Figure:
        if isinstance(data, (dict, list)):
            df = pd.DataFrame(data)
        else:
            df = data.copy()

        num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        cat_cols = df.select_dtypes(exclude=[np.number]).columns.tolist()

        fig, ax = plt.subplots(
            figsize=self.style_config["figure_size"],
            dpi=self.style_config["dpi"],
            subplot_kw={"projection": "polar"}
        )
        palette = plt.rcParams.get("axes.prop_cycle", plt.cycler(color=plt.cm.tab10.colors)).by_key()["color"]

        if theta and theta in df.columns and r and r in df.columns:
            theta_col, r_col = theta, r
        elif len(num_cols) >= 2:
            theta_col, r_col = num_cols[0], num_cols[1]
        else:
            t = np.linspace(0, 2 * np.pi, 200)
            ax.plot(t, 2 + np.sin(6 * t), linewidth=2, color=palette[0])
            ax.set_title(title or "Polar Plot")
            plt.tight_layout()
            return fig

        if hue and hue in df.columns:
            groups = df[hue].unique()
            for i, grp in enumerate(groups):
                sub = df[df[hue] == grp]
                theta_vals = np.deg2rad(sub[theta_col].values)
                ax.plot(theta_vals, sub[r_col].values,
                        color=palette[i % len(palette)], linewidth=2, label=str(grp))
            ax.legend(loc="upper right", bbox_to_anchor=(1.3, 1.1))
        else:
            theta_vals = np.deg2rad(df[theta_col].values)
            ax.plot(theta_vals, df[r_col].values, color=palette[0], linewidth=2)

        ax.set_title(title or "Polar Plot", pad=20)
        plt.tight_layout()
        return fig
