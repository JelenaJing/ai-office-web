"""
Radar / Spider Chart plotter.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Union

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from .base_plotter import BasePlotter

logger = logging.getLogger(__name__)


class RadarPlotter(BasePlotter):
    def plot(
        self,
        data: Union[pd.DataFrame, Dict[str, Any], List],
        categories: Optional[List[str]] = None,
        values: Optional[str] = None,
        group: Optional[str] = None,
        title: Optional[str] = None,
        xlabel: Optional[str] = None,
        ylabel: Optional[str] = None,
        fill_alpha: float = 0.25,
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

        if group and group in df.columns and num_cols:
            # Multi-group radar
            cats = categories or num_cols
            n = len(cats)
            angles = np.linspace(0, 2 * np.pi, n, endpoint=False).tolist()
            angles += angles[:1]

            groups = df[group].unique()
            for i, grp in enumerate(groups):
                sub = df[df[group] == grp]
                row_vals = sub[cats].mean().tolist()
                row_vals += row_vals[:1]
                ax.plot(angles, row_vals, color=palette[i % len(palette)], linewidth=2, label=str(grp))
                ax.fill(angles, row_vals, color=palette[i % len(palette)], alpha=fill_alpha)

            ax.set_thetagrids(np.degrees(angles[:-1]), cats)
            ax.legend(loc="upper right", bbox_to_anchor=(1.3, 1.1))

        elif num_cols and cat_cols:
            # Single row: category column names on axes, numeric values
            # Each row becomes one series
            cats = categories or num_cols
            n = len(cats)
            angles = np.linspace(0, 2 * np.pi, n, endpoint=False).tolist()
            angles += angles[:1]

            for i, (_, row) in enumerate(df.iterrows()):
                row_vals = [float(row[c]) if c in row.index else 0 for c in cats]
                row_vals += row_vals[:1]
                label = str(row[cat_cols[0]]) if cat_cols else f"Series {i+1}"
                ax.plot(angles, row_vals, color=palette[i % len(palette)], linewidth=2, label=label)
                ax.fill(angles, row_vals, color=palette[i % len(palette)], alpha=fill_alpha)

            ax.set_thetagrids(np.degrees(angles[:-1]), cats)
            if len(df) > 1:
                ax.legend(loc="upper right", bbox_to_anchor=(1.3, 1.1))
        else:
            # Fallback: use numeric columns as axes, first row as values
            cats = categories or num_cols
            n = len(cats)
            angles = np.linspace(0, 2 * np.pi, n, endpoint=False).tolist()
            angles += angles[:1]
            row_vals = df[cats].iloc[0].tolist() if len(df) > 0 else [1] * n
            row_vals += row_vals[:1]
            ax.plot(angles, row_vals, color=palette[0], linewidth=2)
            ax.fill(angles, row_vals, color=palette[0], alpha=fill_alpha)
            ax.set_thetagrids(np.degrees(angles[:-1]), cats)

        ax.set_title(title or "Radar Chart", pad=20)
        plt.tight_layout()
        return fig
