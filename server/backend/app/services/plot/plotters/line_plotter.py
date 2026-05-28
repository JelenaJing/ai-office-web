"""
Line plot plotter (ported from merged-plot-agent).
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Union

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns

from .base_plotter import BasePlotter
from .label_generator import LabelGenerator

logger = logging.getLogger(__name__)

# High-contrast palette for multi-series (publication-style, distinguishable on screen/print)
_MULTI_LINE_COLORS: tuple[str, ...] = (
    "#000000",  # black
    "#d62728",  # red
    "#2ca02c",  # green
    "#1f77b4",  # blue
    "#ff7f0e",  # orange
    "#9467bd",  # purple
    "#8c564b",  # brown
    "#e377c2",  # pink
    "#7f7f7f",  # gray
    "#bcbd22",  # yellow-green
)


def _series_color_cycle(n: int) -> list[str]:
    if n <= 0:
        return []
    out: list[str] = []
    for i in range(n):
        out.append(_MULTI_LINE_COLORS[i % len(_MULTI_LINE_COLORS)])
    return out


def _series_label_display(raw: str) -> str:
    """Legend text: use column name, tidy underscores; pass through for mathtext e.g. $TiO_2$."""
    t = str(raw).strip()
    if t.startswith("$") and t.endswith("$"):
        return t
    return t.replace("_", " ")


def _apply_publication_legend(
    ax: plt.Axes, *, loc: str = "upper right", fontsize: Optional[float] = None
) -> None:
    """Line segment + label, framed box (journal-style), default upper-right."""
    handles, labels = ax.get_legend_handles_labels()
    if not labels:
        return
    fs = float(fontsize) if fontsize is not None else float(plt.rcParams.get("legend.fontsize", 10.0))
    ax.legend(
        handles,
        labels,
        loc=loc,
        frameon=True,
        fancybox=False,
        shadow=False,
        edgecolor="0.2",
        facecolor="white",
        framealpha=1.0,
        handlelength=2.6,
        handletextpad=0.65,
        borderpad=0.45,
        fontsize=fs,
    )


class LinePlotter(BasePlotter):
    def plot(
        self,
        data: Union[pd.DataFrame, Dict[str, Any], List],
        x: Optional[str] = None,
        y: Optional[Union[str, List[str]]] = None,
        title: Optional[str] = None,
        xlabel: Optional[str] = None,
        ylabel: Optional[str] = None,
        hue: Optional[str] = None,
        style: Optional[str] = None,
        markers: bool = False,
        multiple_series: Optional[List[Dict[str, Any]]] = None,
        stack_spectra: bool = False,
        legend_loc: str = "upper right",
        **kwargs,
    ) -> plt.Figure:
        if isinstance(data, dict):
            df = pd.DataFrame(data)
        elif isinstance(data, list):
            df = pd.DataFrame(data)
        else:
            df = data.copy()

        stack_spectra = bool(stack_spectra) or bool(kwargs.pop("stack_spectra", False))
        legend_loc = str(kwargs.pop("legend_loc", legend_loc) or "upper right")

        fig, ax = self.create_figure()

        if multiple_series:
            colors = _series_color_cycle(len(multiple_series))
            for idx, series in enumerate(multiple_series):
                series_x = series.get("x")
                series_y = series.get("y")
                series_label = series.get("label", f"Series {idx+1}")
                series_data = series.get("data")

                if series_data is not None:
                    series_df = pd.DataFrame(series_data) if isinstance(series_data, (dict, list)) else series_data
                    plot_x = series_x if series_x and isinstance(series_x, str) else series_df.columns[0]
                    plot_y = series_y if series_y and isinstance(series_y, str) else series_df.columns[1]
                else:
                    if isinstance(series_x, (list, np.ndarray)) and isinstance(series_y, (list, np.ndarray)):
                        series_df = pd.DataFrame({"x": series_x, "y": series_y})
                        plot_x, plot_y = "x", "y"
                    elif isinstance(series_x, str) and isinstance(series_y, str) and series_x in df.columns and series_y in df.columns:
                        series_df = df[[series_x, series_y]]
                        plot_x, plot_y = series_x, series_y
                    else:
                        continue

                x_plot = series_df[plot_x].to_numpy()
                y_plot = series_df[plot_y].to_numpy(dtype=float)
                if markers:
                    ax.plot(
                        x_plot,
                        y_plot,
                        marker="o",
                        markersize=2.5,
                        markevery=max(1, len(x_plot) // 40),
                        linestyle="-",
                        label=str(series_label),
                        color=colors[idx],
                        linewidth=2,
                        clip_on=True,
                    )
                else:
                    ax.plot(
                        x_plot,
                        y_plot,
                        linestyle="-",
                        label=str(series_label),
                        color=colors[idx],
                        linewidth=2,
                        clip_on=True,
                    )
        else:
            if x is None:
                if df.index.name:
                    x = df.index.name
                    df = df.reset_index()
                else:
                    x = df.columns[0]

            if y is None:
                numeric_cols = df.select_dtypes(include=[np.number]).columns
                y_cols = [col for col in numeric_cols if col != x]
                if not y_cols:
                    raise ValueError("Need at least one numeric column for y-axis")
                y = y_cols[0] if len(y_cols) == 1 else y_cols

            if isinstance(y, list):
                y = [c for c in y if c in df.columns]
                if not y:
                    raise ValueError("No valid y columns for multi-series line plot")
                if not title and len(y) > 1:
                    title = LabelGenerator.generate_title_multi_series("line", x, y)
                colors = _series_color_cycle(len(y))
                xvals = df[x].to_numpy()
                step = 0.0
                if stack_spectra and len(y) > 1:
                    spans: list[float] = []
                    for c in y:
                        s = df[c].astype(float)
                        spans.append(float(np.nanmax(s.to_numpy()) - np.nanmin(s.to_numpy())))
                    margin = max(spans) * 0.06 if spans and max(spans) > 1e-12 else 0.1
                    step = (max(spans) if spans else 1.0) + margin
                for idx, y_col in enumerate(y):
                    yvals = df[y_col].astype(float).to_numpy()
                    if stack_spectra and len(y) > 1:
                        yvals = yvals + idx * step
                    lbl = _series_label_display(str(y_col))
                    if markers:
                        ax.plot(
                            xvals,
                            yvals,
                            marker="o",
                            markersize=2.5,
                            markevery=max(1, len(xvals) // 40),
                            linestyle="-",
                            label=lbl,
                            color=colors[idx],
                            linewidth=2,
                            clip_on=True,
                        )
                    else:
                        ax.plot(
                            xvals,
                            yvals,
                            linestyle="-",
                            label=lbl,
                            color=colors[idx],
                            linewidth=2,
                            clip_on=True,
                        )
            else:
                n_pts = len(df)
                sns.lineplot(
                    data=df,
                    x=x,
                    y=y,
                    hue=hue,
                    style=style,
                    marker="o" if markers else None,
                    markersize=2.5 if markers else None,
                    markevery=max(1, n_pts // 40) if markers else None,
                    linewidth=2,
                    ax=ax,
                    **kwargs,
                )

        if multiple_series:
            first_series = multiple_series[0]
            x_col = first_series.get("x") if isinstance(first_series.get("x"), str) else None
            y_col = first_series.get("y") if isinstance(first_series.get("y"), str) else None
        else:
            x_col = x
            y_col = y if isinstance(y, str) else (y[0] if isinstance(y, list) and len(y) > 0 else None)

        self.set_labels(ax, title, xlabel, ylabel, auto_generate=True, x_col=x_col, y_col=y_col, chart_type="line")
        ax.grid(True, alpha=0.3)
        leg_fs = float(self.style_config.get("font_size", 12))
        if multiple_series or isinstance(y, list):
            _apply_publication_legend(ax, loc=legend_loc, fontsize=leg_fs)
        elif hue:
            _apply_publication_legend(ax, loc=legend_loc, fontsize=leg_fs)
        plt.tight_layout()
        return fig

