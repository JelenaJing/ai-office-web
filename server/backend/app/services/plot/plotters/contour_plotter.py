"""
Contour Plot plotter.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Union

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from .base_plotter import BasePlotter

logger = logging.getLogger(__name__)


class ContourPlotter(BasePlotter):
    def plot(
        self,
        data: Union[pd.DataFrame, Dict[str, Any], List],
        x: Optional[str] = None,
        y: Optional[str] = None,
        z: Optional[str] = None,
        title: Optional[str] = None,
        xlabel: Optional[str] = None,
        ylabel: Optional[str] = None,
        filled: bool = True,
        levels: int = 10,
        cmap: str = "viridis",
        **kwargs,
    ) -> plt.Figure:
        if isinstance(data, (dict, list)):
            df = pd.DataFrame(data)
        else:
            df = data.copy()

        fig, ax = self.create_figure()
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()

        if len(numeric_cols) >= 3:
            x_col = x or numeric_cols[0]
            y_col = y or numeric_cols[1]
            z_col = z or numeric_cols[2]
            try:
                pivot = df.pivot_table(index=y_col, columns=x_col, values=z_col, aggfunc="mean")
                X_grid = pivot.columns.values.astype(float)
                Y_grid = pivot.index.values.astype(float)
                X_mesh, Y_mesh = np.meshgrid(X_grid, Y_grid)
                Z_mesh = pivot.values
                if filled:
                    cs = ax.contourf(X_mesh, Y_mesh, Z_mesh, levels=levels, cmap=cmap)
                else:
                    cs = ax.contour(X_mesh, Y_mesh, Z_mesh, levels=levels, cmap=cmap)
                fig.colorbar(cs, ax=ax, label=z_col)
                ax.set_xlabel(xlabel or x_col)
                ax.set_ylabel(ylabel or y_col)
            except Exception as e:
                logger.warning(f"Contour pivot failed: {e}, using scatter fallback")
                scatter = ax.scatter(df[x_col], df[y_col], c=df[z_col], cmap=cmap)
                fig.colorbar(scatter, ax=ax, label=z_col)
                ax.set_xlabel(xlabel or x_col)
                ax.set_ylabel(ylabel or y_col)
        else:
            # Synthetic demo
            x_lin = np.linspace(-3, 3, 100)
            y_lin = np.linspace(-3, 3, 100)
            X_mesh, Y_mesh = np.meshgrid(x_lin, y_lin)
            Z_mesh = np.sin(np.sqrt(X_mesh**2 + Y_mesh**2))
            if filled:
                cs = ax.contourf(X_mesh, Y_mesh, Z_mesh, levels=levels, cmap=cmap)
            else:
                cs = ax.contour(X_mesh, Y_mesh, Z_mesh, levels=levels, cmap=cmap)
            fig.colorbar(cs, ax=ax)
            ax.set_xlabel(xlabel or "X")
            ax.set_ylabel(ylabel or "Y")

        ax.set_title(title or "Contour Plot")
        plt.tight_layout()
        return fig
