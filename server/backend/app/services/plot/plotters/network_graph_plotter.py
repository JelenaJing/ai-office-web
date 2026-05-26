"""
Network Graph plotter (requires networkx).
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Union

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from .base_plotter import BasePlotter

logger = logging.getLogger(__name__)


class NetworkGraphPlotter(BasePlotter):
    def plot(
        self,
        data: Union[pd.DataFrame, Dict[str, Any], List],
        source: Optional[str] = None,
        target: Optional[str] = None,
        weight: Optional[str] = None,
        title: Optional[str] = None,
        xlabel: Optional[str] = None,
        ylabel: Optional[str] = None,
        layout: str = "spring",
        **kwargs,
    ) -> plt.Figure:
        try:
            import networkx as nx
        except ImportError:
            raise ImportError("networkx is required for Network Graph: pip install networkx")

        if isinstance(data, (dict, list)):
            df = pd.DataFrame(data)
        else:
            df = data.copy()

        fig, ax = self.create_figure()

        # Build graph from data
        if source and target and source in df.columns and target in df.columns:
            G = nx.from_pandas_edgelist(df, source=source, target=target,
                                        edge_attr=weight if weight else None)
        elif len(df.columns) >= 2:
            # Assume first two columns are source/target
            src_col, tgt_col = df.columns[0], df.columns[1]
            G = nx.from_pandas_edgelist(df, source=src_col, target=tgt_col)
        else:
            # Demo graph
            G = nx.karate_club_graph()

        layouts = {
            "spring": nx.spring_layout,
            "circular": nx.circular_layout,
            "kamada_kawai": nx.kamada_kawai_layout,
            "spectral": nx.spectral_layout,
            "random": nx.random_layout,
        }
        layout_fn = layouts.get(layout, nx.spring_layout)
        try:
            pos = layout_fn(G)
        except Exception:
            pos = nx.spring_layout(G)

        node_sizes = [300 + 100 * d for _, d in G.degree()]
        nx.draw_networkx(
            G, pos, ax=ax,
            node_color="steelblue", node_size=node_sizes,
            font_size=8, font_color="white", font_weight="bold",
            edge_color="gray", alpha=0.85, width=1.5,
            arrows=True
        )

        ax.set_title(title or "Network Graph")
        ax.axis("off")
        plt.tight_layout()
        return fig
