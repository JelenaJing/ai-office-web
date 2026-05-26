"""
Internal plotting service (embedded from merged-plot-agent).

This replaces the external plot-agent dependency and provides:
- data loading (csv/json/excel/raw text/dict)
- chart recommendation (rule-based; optional LLM later)
- plot generation (base64 png)
"""

from .plot_service import PlotService

__all__ = ["PlotService"]

