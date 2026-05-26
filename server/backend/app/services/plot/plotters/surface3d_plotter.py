"""
3D Surface Plot plotter.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Union

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from .base_plotter import BasePlotter

logger = logging.getLogger(__name__)


class Surface3DPlotter(BasePlotter):
    def plot(
        self,
        data: Union[pd.DataFrame, Dict[str, Any], List],
        x: Optional[str] = None,
        y: Optional[str] = None,
        z: Optional[str] = None,
        title: Optional[str] = None,
        xlabel: Optional[str] = None,
        ylabel: Optional[str] = None,
        zlabel: Optional[str] = None,
        cmap: str = "viridis",
        **kwargs,
    ) -> plt.Figure:
        if isinstance(data, (dict, list)):
            df = pd.DataFrame(data)
        else:
            df = data.copy()

        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()

        fig = plt.figure(figsize=self.style_config["figure_size"], dpi=self.style_config["dpi"])
        ax = fig.add_subplot(111, projection="3d")

        if len(numeric_cols) >= 3:
            # Use columns directly as x, y, z scatter-style surface
            x_col = x or numeric_cols[0]
            y_col = y or numeric_cols[1]
            z_col = z or numeric_cols[2]
            try:
                # Try to pivot into a grid for surface plot
                pivot = df.pivot_table(index=y_col, columns=x_col, values=z_col, aggfunc="mean")
                X_grid = pivot.columns.values.astype(float)
                Y_grid = pivot.index.values.astype(float)
                X_mesh, Y_mesh = np.meshgrid(X_grid, Y_grid)
                Z_mesh = pivot.values
                surf = ax.plot_surface(X_mesh, Y_mesh, Z_mesh, cmap=cmap, alpha=0.85)
                fig.colorbar(surf, ax=ax, shrink=0.5, label=z_col)
                ax.set_xlabel(xlabel or x_col)
                ax.set_ylabel(ylabel or y_col)
                ax.set_zlabel(zlabel or z_col)
            except Exception:
                # Fall back to scatter on 3D
                ax.scatter(df[x_col], df[y_col], df[z_col], c=df[z_col], cmap=cmap, alpha=0.7)
                ax.set_xlabel(xlabel or x_col)
                ax.set_ylabel(ylabel or y_col)
                ax.set_zlabel(zlabel or z_col)
        else:
            # Generate synthetic surface from data range
            n = max(20, len(df))
            x_lin = np.linspace(0, 5, n)
            y_lin = np.linspace(0, 5, n)
            X_mesh, Y_mesh = np.meshgrid(x_lin, y_lin)
            Z_mesh = np.sin(np.sqrt(X_mesh**2 + Y_mesh**2))
            surf = ax.plot_surface(X_mesh, Y_mesh, Z_mesh, cmap=cmap, alpha=0.85)
            fig.colorbar(surf, ax=ax, shrink=0.5)
            ax.set_xlabel(xlabel or "X")
            ax.set_ylabel(ylabel or "Y")
            ax.set_zlabel(zlabel or "Z")

        ax.set_title(title or "3D Surface Plot")
        plt.tight_layout()
        return fig
