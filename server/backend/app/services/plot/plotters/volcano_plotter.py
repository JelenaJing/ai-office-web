"""
Volcano plot plotter (ported from merged-plot-agent).
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Union

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from .base_plotter import BasePlotter

logger = logging.getLogger(__name__)


class VolcanoPlotter(BasePlotter):
    def plot(
        self,
        data: Union[pd.DataFrame, Dict[str, Any], List],
        x: Optional[str] = None,
        y: Optional[str] = None,
        pvalue_col: Optional[str] = None,
        foldchange_col: Optional[str] = None,
        label_col: Optional[str] = None,
        title: Optional[str] = None,
        xlabel: Optional[str] = None,
        ylabel: Optional[str] = None,
        pvalue_threshold: float = 0.05,
        foldchange_threshold: float = 1.0,
        show_labels: bool = True,
        max_labels: int = 20,
        **kwargs,
    ) -> plt.Figure:
        if isinstance(data, dict):
            df = pd.DataFrame(data)
        elif isinstance(data, list):
            df = pd.DataFrame(data)
        else:
            df = data.copy()

        if x is None and foldchange_col is None:
            fc_cols = [
                col
                for col in df.columns
                if any(term in col.lower() for term in ["foldchange", "fold_change", "log2fc", "logfc", "fc"])
            ]
            if fc_cols:
                x = fc_cols[0]
            else:
                numeric_cols = df.select_dtypes(include=[np.number]).columns
                if len(numeric_cols) >= 1:
                    x = numeric_cols[0]
                else:
                    raise ValueError("Could not auto-detect fold change column")
        elif foldchange_col:
            x = foldchange_col

        if y is None and pvalue_col is None:
            pval_cols = [
                col
                for col in df.columns
                if any(term in col.lower() for term in ["pvalue", "p_value", "pval", "padj", "adj_pvalue", "fdr"])
            ]
            if pval_cols:
                pvalue_col = pval_cols[0]
            else:
                numeric_cols = df.select_dtypes(include=[np.number]).columns
                if len(numeric_cols) >= 2:
                    pvalue_col = numeric_cols[1]
                else:
                    raise ValueError("Could not auto-detect p-value column")
        elif pvalue_col:
            pass

        if pvalue_col:
            df["neg_log10_p"] = -np.log10(df[pvalue_col] + 1e-300)
            y = "neg_log10_p"
        elif y is None:
            raise ValueError("Need to provide either y column or pvalue_col")

        fig, ax = self.create_figure()

        df["significant"] = (df[pvalue_col if pvalue_col else y] < pvalue_threshold) & (np.abs(df[x]) > foldchange_threshold)

        non_sig = df[~df["significant"]]
        if len(non_sig) > 0:
            ax.scatter(non_sig[x], non_sig[y], c="gray", alpha=0.5, s=20, label="Not significant")

        sig = df[df["significant"]]
        if len(sig) > 0:
            up = sig[sig[x] > 0]
            down = sig[sig[x] < 0]
            if len(up) > 0:
                ax.scatter(up[x], up[y], c="red", alpha=0.7, s=30, label="Up-regulated")
            if len(down) > 0:
                ax.scatter(down[x], down[y], c="blue", alpha=0.7, s=30, label="Down-regulated")

        ax.axhline(y=-np.log10(pvalue_threshold), color="black", linestyle="--", linewidth=1, alpha=0.5)
        ax.axvline(x=foldchange_threshold, color="black", linestyle="--", linewidth=1, alpha=0.5)
        ax.axvline(x=-foldchange_threshold, color="black", linestyle="--", linewidth=1, alpha=0.5)

        if show_labels and label_col and len(sig) > 0:
            key = pvalue_col if pvalue_col else y
            sig_sorted = sig.nsmallest(max_labels, key)
            for _, row in sig_sorted.iterrows():
                ax.annotate(
                    str(row[label_col]),
                    (row[x], row[y]),
                    fontsize=8,
                    alpha=0.7,
                    xytext=(5, 5),
                    textcoords="offset points",
                )

        self.set_labels(
            ax,
            title,
            xlabel,
            ylabel,
            auto_generate=True,
            x_col=x,
            y_col=pvalue_col if pvalue_col else y,
            chart_type="volcano",
        )
        ax.legend()
        ax.grid(True, alpha=0.3)
        plt.tight_layout()
        return fig

