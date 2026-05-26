"""
Wind Rose / Polar Bar plotter.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Union

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from .base_plotter import BasePlotter

logger = logging.getLogger(__name__)


class WindRosePlotter(BasePlotter):
    def plot(
        self,
        data: Union[pd.DataFrame, Dict[str, Any], List],
        direction: Optional[str] = None,
        speed: Optional[str] = None,
        title: Optional[str] = None,
        xlabel: Optional[str] = None,
        ylabel: Optional[str] = None,
        bins: int = 16,
        **kwargs,
    ) -> plt.Figure:
        if isinstance(data, (dict, list)):
            df = pd.DataFrame(data)
        else:
            df = data.copy()

        num_cols = df.select_dtypes(include=[np.number]).columns.tolist()

        fig, ax = plt.subplots(
            figsize=self.style_config["figure_size"],
            dpi=self.style_config["dpi"],
            subplot_kw={"projection": "polar"}
        )

        if direction and direction in df.columns and speed and speed in df.columns:
            dir_vals = np.deg2rad(df[direction].values)
            spd_vals = df[speed].values
        elif len(num_cols) >= 2:
            dir_vals = np.deg2rad(df[num_cols[0]].values)
            spd_vals = df[num_cols[1]].values
        else:
            # Generate demo data
            dir_vals = np.deg2rad(np.arange(0, 360, 360 // bins))
            spd_vals = np.random.uniform(2, 15, len(dir_vals))

        # Bin directions for bar plot
        bar_dirs = np.linspace(0, 2 * np.pi, bins, endpoint=False)
        bar_widths = [2 * np.pi / bins] * bins
        # Bin the data
        bin_indices = np.digitize(dir_vals % (2 * np.pi), bar_dirs) - 1
        bar_heights = np.zeros(bins)
        for i, bi in enumerate(bin_indices):
            bar_heights[bi % bins] += spd_vals[i]
        bar_heights = bar_heights / max(bar_heights.max(), 1)

        ax.set_theta_offset(np.pi / 2)
        ax.set_theta_direction(-1)
        cmap = plt.cm.Blues
        colors = cmap(bar_heights)
        ax.bar(bar_dirs, bar_heights, width=bar_widths, color=colors, alpha=0.85)

        direction_labels = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
        ax.set_xticks(np.linspace(0, 2 * np.pi, 8, endpoint=False))
        ax.set_xticklabels(direction_labels[:bins] if bins <= 8 else direction_labels)
        ax.set_yticklabels([])

        ax.set_title(title or "Wind Rose Plot", pad=20)
        plt.tight_layout()
        return fig
