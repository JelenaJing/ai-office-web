"""
Pie chart plotter (ported from merged-plot-agent).
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Union

import matplotlib.pyplot as plt
import pandas as pd

from .base_plotter import BasePlotter
from .label_generator import LabelGenerator

logger = logging.getLogger(__name__)


class PiePlotter(BasePlotter):
    def plot(
        self,
        data: Union[pd.DataFrame, Dict[str, Any], List],
        x: Optional[str] = None,
        y: Optional[str] = None,
        title: Optional[str] = None,
        xlabel: Optional[str] = None,
        ylabel: Optional[str] = None,
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
            if len(df.columns) >= 2:
                x, y = df.columns[0], df.columns[1]
            else:
                x = df.index.name or "labels"
                y = df.columns[0]
                df = df.reset_index()
        elif x is None:
            x = df.index.name or "labels"
            df = df.reset_index()
        elif y is None:
            y = "count"
            df = df[x].value_counts().reset_index()
            df.columns = [x, y]

        labels = df[x].values if x in df.columns else df.index
        sizes = df[y].values if y in df.columns else df.iloc[:, 0].values

        pie_kwargs = {"autopct": "%1.1f%%", "startangle": 90}
        pie_kwargs.update(kwargs)

        ax.pie(sizes, labels=labels, **pie_kwargs)
        ax.axis("equal")

        if title:
            ax.set_title(title, fontsize=self.style_config.get("font_size", 12) + 2)
        else:
            ax.set_title(LabelGenerator.generate_title("pie", x, y), fontsize=self.style_config.get("font_size", 12) + 2)

        plt.tight_layout()
        return fig

