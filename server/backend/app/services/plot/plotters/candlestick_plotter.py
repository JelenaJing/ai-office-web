"""
Candlestick Chart plotter (OHLC financial data).
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Union

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np
import pandas as pd

from .base_plotter import BasePlotter

logger = logging.getLogger(__name__)


class CandlestickPlotter(BasePlotter):
    def plot(
        self,
        data: Union[pd.DataFrame, Dict[str, Any], List],
        open_col: Optional[str] = None,
        high_col: Optional[str] = None,
        low_col: Optional[str] = None,
        close_col: Optional[str] = None,
        date_col: Optional[str] = None,
        title: Optional[str] = None,
        xlabel: Optional[str] = None,
        ylabel: Optional[str] = None,
        **kwargs,
    ) -> plt.Figure:
        if isinstance(data, (dict, list)):
            df = pd.DataFrame(data)
        else:
            df = data.copy()

        # Auto-detect OHLC columns
        col_lower = {c.lower(): c for c in df.columns}
        open_col = open_col or col_lower.get("open") or col_lower.get("o")
        high_col = high_col or col_lower.get("high") or col_lower.get("h")
        low_col = low_col or col_lower.get("low") or col_lower.get("l")
        close_col = close_col or col_lower.get("close") or col_lower.get("c")
        date_col = date_col or col_lower.get("date") or col_lower.get("time") or col_lower.get("datetime")

        num_cols = df.select_dtypes(include=[np.number]).columns.tolist()

        if open_col and high_col and low_col and close_col:
            opens = df[open_col].values.astype(float)
            highs = df[high_col].values.astype(float)
            lows = df[low_col].values.astype(float)
            closes = df[close_col].values.astype(float)
        elif len(num_cols) >= 4:
            opens = df[num_cols[0]].values.astype(float)
            highs = df[num_cols[1]].values.astype(float)
            lows = df[num_cols[2]].values.astype(float)
            closes = df[num_cols[3]].values.astype(float)
        else:
            # Demo data
            np.random.seed(42)
            n = 20
            opens = np.random.uniform(90, 110, n)
            closes = opens + np.random.randn(n) * 5
            highs = np.maximum(opens, closes) + np.abs(np.random.randn(n) * 2)
            lows = np.minimum(opens, closes) - np.abs(np.random.randn(n) * 2)
            df = pd.DataFrame({"Open": opens, "High": highs, "Low": lows, "Close": closes})

        if date_col and date_col in df.columns:
            x = np.arange(len(df))
            x_labels = df[date_col].astype(str).tolist()
        else:
            x = np.arange(len(opens))
            x_labels = None

        fig, ax = self.create_figure()
        width = 0.6
        for i in range(len(opens)):
            color = "#2ecc71" if closes[i] >= opens[i] else "#e74c3c"
            # Body
            body_bottom = min(opens[i], closes[i])
            body_height = abs(closes[i] - opens[i])
            ax.add_patch(mpatches.Rectangle(
                (x[i] - width / 2, body_bottom), width, body_height,
                color=color, alpha=0.9
            ))
            # Wicks
            ax.plot([x[i], x[i]], [lows[i], highs[i]], color=color, linewidth=1.2)

        ax.set_xlim(-0.5, len(opens) - 0.5)
        ax.set_ylim(lows.min() * 0.99, highs.max() * 1.01)

        if x_labels:
            step = max(1, len(x_labels) // 8)
            ax.set_xticks(x[::step])
            ax.set_xticklabels(x_labels[::step], rotation=30, ha="right")

        up_patch = mpatches.Patch(color="#2ecc71", label="Up")
        down_patch = mpatches.Patch(color="#e74c3c", label="Down")
        ax.legend(handles=[up_patch, down_patch])

        self.set_labels(ax, title or "Candlestick Chart", xlabel or (date_col or "Date"), ylabel or "Price",
                        auto_generate=False)
        plt.tight_layout()
        return fig
