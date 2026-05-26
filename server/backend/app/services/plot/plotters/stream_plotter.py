"""
Streamplot plotter (vector field visualization).
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Union

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from .base_plotter import BasePlotter

logger = logging.getLogger(__name__)


class StreamPlotter(BasePlotter):
    def plot(
        self,
        data: Union[pd.DataFrame, Dict[str, Any], List],
        x: Optional[str] = None,
        y: Optional[str] = None,
        u: Optional[str] = None,
        v: Optional[str] = None,
        title: Optional[str] = None,
        xlabel: Optional[str] = None,
        ylabel: Optional[str] = None,
        density: float = 1.0,
        cmap: str = "viridis",
        **kwargs,
    ) -> plt.Figure:
        if isinstance(data, (dict, list)):
            df = pd.DataFrame(data)
        else:
            df = data.copy()

        fig, ax = self.create_figure()
        num_cols = df.select_dtypes(include=[np.number]).columns.tolist()

        if len(num_cols) >= 4 and all(c in df.columns for c in [x or "", y or "", u or "", v or ""] if c):
            # Use 4 columns as X grid, Y grid, U velocity, V velocity
            x_col = x or num_cols[0]
            y_col = y or num_cols[1]
            u_col = u or num_cols[2]
            v_col = v or num_cols[3]
            try:
                X = df[x_col].values
                Y = df[y_col].values
                U = df[u_col].values
                V = df[v_col].values
                # Try reshape to grid
                side = int(np.sqrt(len(X)))
                if side * side == len(X):
                    X = X.reshape(side, side)
                    Y = Y.reshape(side, side)
                    U = U.reshape(side, side)
                    V = V.reshape(side, side)
                    speed = np.sqrt(U**2 + V**2)
                    ax.streamplot(X, Y, U, V, density=density, color=speed, cmap=cmap,
                                  linewidth=1.5, arrowsize=1.2)
                    ax.set_xlabel(xlabel or x_col)
                    ax.set_ylabel(ylabel or y_col)
                else:
                    raise ValueError("Cannot reshape to grid")
            except Exception as e:
                logger.warning(f"Streamplot grid setup failed: {e}, using demo")
                self._draw_demo(ax, density, cmap)
                ax.set_xlabel(xlabel or "X")
                ax.set_ylabel(ylabel or "Y")
        else:
            self._draw_demo(ax, density, cmap)
            ax.set_xlabel(xlabel or "X")
            ax.set_ylabel(ylabel or "Y")

        ax.set_title(title or "Stream Plot")
        plt.tight_layout()
        return fig

    @staticmethod
    def _draw_demo(ax, density, cmap):
        x_lin = np.linspace(-3, 3, 60)
        y_lin = np.linspace(-3, 3, 60)
        X, Y = np.meshgrid(x_lin, y_lin)
        U = -1 - X**2 + Y
        V = 1 + X - Y**2
        speed = np.sqrt(U**2 + V**2)
        ax.streamplot(X, Y, U, V, density=density, color=speed, cmap=cmap,
                      linewidth=1.5, arrowsize=1.2)
