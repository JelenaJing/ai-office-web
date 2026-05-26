"""
PlotService: load data -> recommend chart -> render plot -> return base64 + metadata.
"""

from __future__ import annotations

import io
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

import pandas as pd

from .loaders import CSVLoader, ExcelLoader, JSONLoader
from .plotters import (
    BarPlotter,
    BoxPlotter,
    HeatmapPlotter,
    HistogramPlotter,
    LinePlotter,
    PiePlotter,
    ScatterPlotter,
    ViolinPlotter,
    VolcanoPlotter,
    # Extended plotters
    Bubble3DPlotter,
    Scatter3DPlotter,
    Surface3DPlotter,
    ContourPlotter,
    ErrorbarPlotter,
    HexbinPlotter,
    ParetoPlotter,
    RadarPlotter,
    WaterfallPlotter,
    WindRosePlotter,
    ParallelCoordinatesPlotter,
    TrellisPlotter,
    NetworkGraphPlotter,
    CircularBarPlotter,
    PolarPlotter,
    StreamPlotter,
    CandlestickPlotter,
)
from .recommend import ChartRecommender

logger = logging.getLogger(__name__)


SUPPORTED_CHART_TYPES = {
    # Original 9
    "bar", "scatter", "line", "heatmap", "histogram", "box", "violin", "pie", "volcano",
    # Extended 18
    "3d_bubble", "3d_scatter", "3d_surface",
    "contour", "errorbar", "hexbin",
    "pareto", "radar", "waterfall",
    "wind_rose", "parallel_coordinates", "trellis",
    "network_graph", "circular_bar", "polar",
    "stream", "candlestick",
}


def _guess_delimiter(text: str) -> str:
    # Heuristic: prefer tab if many tabs, otherwise comma if many commas, else whitespace.
    tab = text.count("\t")
    comma = text.count(",")
    if tab >= comma and tab > 0:
        return "\t"
    if comma > 0:
        return ","
    return r"\s+"


def _load_from_raw_text(raw_text: str) -> pd.DataFrame:
    raw_text = raw_text.strip()
    if not raw_text:
        raise ValueError("raw_text is empty")
    sep = _guess_delimiter(raw_text)
    # engine='python' allows regex separators
    return pd.read_csv(io.StringIO(raw_text), sep=sep, engine="python")


def _load_from_file_path(file_path: str) -> pd.DataFrame:
    path = Path(file_path)
    suffix = path.suffix.lower()
    if suffix == ".csv":
        return CSVLoader().load(str(path))
    if suffix == ".json":
        return JSONLoader().load(str(path))
    if suffix in [".xlsx", ".xls"]:
        return ExcelLoader().load(str(path))
    if suffix in [".txt"]:
        # treat as delimited text
        return _load_from_raw_text(path.read_text(encoding="utf-8", errors="ignore"))
    raise ValueError(f"Unsupported file format: {suffix}")


def _load_data(
    *,
    data: Optional[Union[Dict[str, Any], List[Dict[str, Any]]]] = None,
    file_path: Optional[str] = None,
    raw_text: Optional[str] = None,
) -> pd.DataFrame:
    if data is not None:
        return JSONLoader().load_from_dict(data)
    if raw_text is not None:
        return _load_from_raw_text(raw_text)
    if file_path:
        return _load_from_file_path(file_path)
    raise ValueError("One of data, raw_text, or file_path must be provided")


def _get_plotter(chart_type: str, style: str):
    if chart_type == "bar":
        return BarPlotter(style=style)
    if chart_type == "scatter":
        return ScatterPlotter(style=style)
    if chart_type == "line":
        return LinePlotter(style=style)
    if chart_type == "heatmap":
        return HeatmapPlotter(style=style)
    if chart_type == "histogram":
        return HistogramPlotter(style=style)
    if chart_type == "box":
        return BoxPlotter(style=style)
    if chart_type == "violin":
        return ViolinPlotter(style=style)
    if chart_type == "pie":
        return PiePlotter(style=style)
    if chart_type == "volcano":
        return VolcanoPlotter(style=style)
    # Extended chart types
    if chart_type == "3d_bubble":
        return Bubble3DPlotter(style=style)
    if chart_type == "3d_scatter":
        return Scatter3DPlotter(style=style)
    if chart_type == "3d_surface":
        return Surface3DPlotter(style=style)
    if chart_type == "contour":
        return ContourPlotter(style=style)
    if chart_type == "errorbar":
        return ErrorbarPlotter(style=style)
    if chart_type == "hexbin":
        return HexbinPlotter(style=style)
    if chart_type == "pareto":
        return ParetoPlotter(style=style)
    if chart_type == "radar":
        return RadarPlotter(style=style)
    if chart_type == "waterfall":
        return WaterfallPlotter(style=style)
    if chart_type == "wind_rose":
        return WindRosePlotter(style=style)
    if chart_type == "parallel_coordinates":
        return ParallelCoordinatesPlotter(style=style)
    if chart_type == "trellis":
        return TrellisPlotter(style=style)
    if chart_type == "network_graph":
        return NetworkGraphPlotter(style=style)
    if chart_type == "circular_bar":
        return CircularBarPlotter(style=style)
    if chart_type == "polar":
        return PolarPlotter(style=style)
    if chart_type == "stream":
        return StreamPlotter(style=style)
    if chart_type == "candlestick":
        return CandlestickPlotter(style=style)
    raise ValueError(f"Unsupported chart_type: {chart_type}")


@dataclass
class PlotResult:
    chart_type: str
    image_base64: str
    recommendation: Optional[Dict[str, Any]]


class PlotService:
    def __init__(self):
        self.recommender = ChartRecommender(use_llm=True)

    def recommend(
        self,
        *,
        data: Optional[Union[Dict[str, Any], List[Dict[str, Any]]]] = None,
        file_path: Optional[str] = None,
        raw_text: Optional[str] = None,
        top_n: int = 5,
        data_type: Optional[str] = None,
        template_id: Optional[str] = None,
        use_llm_type_detection: bool = True,
    ) -> Dict[str, Any]:
        df = _load_data(data=data, file_path=file_path, raw_text=raw_text)
        if df is None or df.empty:
            raise ValueError("Data is empty")
        return self.recommender.recommend(
            df,
            top_n=top_n,
            use_llm=use_llm_type_detection,
            data_type_hint=data_type,
            template_id=template_id,
        )

    def generate_plot(
        self,
        *,
        data: Optional[Union[Dict[str, Any], List[Dict[str, Any]]]] = None,
        file_path: Optional[str] = None,
        raw_text: Optional[str] = None,
        chart_type: Optional[str] = None,
        data_type: Optional[str] = None,
        template_id: Optional[str] = None,
        use_llm_type_detection: bool = True,
        auto_recommend: bool = True,
        style: Optional[str] = None,
        title: Optional[str] = None,
        xlabel: Optional[str] = None,
        ylabel: Optional[str] = None,
        x: Optional[str] = None,
        y: Optional[str] = None,
        hue: Optional[str] = None,
        # chart-specific parameters
        pvalue_threshold: Optional[float] = None,
        foldchange_threshold: Optional[float] = None,
    ) -> PlotResult:
        df = _load_data(data=data, file_path=file_path, raw_text=raw_text)
        if df is None or df.empty:
            raise ValueError("Data is empty")

        recommendation: Optional[Dict[str, Any]] = None

        if (chart_type is None) and auto_recommend:
            rec = self.recommender.recommend(
                df,
                top_n=5,
                use_llm=use_llm_type_detection,
                data_type_hint=data_type,
                template_id=template_id,
            )
            chart_type = rec["recommended_chart"]
            recommendation = rec
        elif chart_type is None:
            raise ValueError("chart_type must be specified or auto_recommend must be True")

        if chart_type not in SUPPORTED_CHART_TYPES:
            logger.info("chart_type '%s' not supported; falling back to 'scatter'", chart_type)
            chart_type = "scatter"

        suggested: Dict[str, Any] = (recommendation or {}).get("suggested_parameters") or {}
        if (not title) and suggested.get("title"):
            title = suggested.get("title")
        if (not xlabel) and suggested.get("xlabel"):
            xlabel = suggested.get("xlabel")
        if (not ylabel) and suggested.get("ylabel"):
            ylabel = suggested.get("ylabel")
        if (x is None) and suggested.get("x"):
            x = suggested.get("x")
        if (y is None) and suggested.get("y"):
            y = suggested.get("y")
        if (hue is None) and suggested.get("hue"):
            hue = suggested.get("hue")

        # precedence: explicit user style > template default style > global default
        style = style or suggested.get("style") or "publication"
        plotter = _get_plotter(chart_type, style=style)
        plot_kwargs: Dict[str, Any] = {}
        # Common params
        if x is not None:
            plot_kwargs["x"] = x
        if y is not None:
            plot_kwargs["y"] = y
        if hue is not None:
            plot_kwargs["hue"] = hue

        # Chart-specific params
        if chart_type == "volcano":
            if pvalue_threshold is not None:
                plot_kwargs["pvalue_threshold"] = pvalue_threshold
            elif suggested.get("pvalue_threshold") is not None:
                plot_kwargs["pvalue_threshold"] = suggested["pvalue_threshold"]
            if foldchange_threshold is not None:
                plot_kwargs["foldchange_threshold"] = foldchange_threshold
            elif suggested.get("foldchange_threshold") is not None:
                plot_kwargs["foldchange_threshold"] = suggested["foldchange_threshold"]

        fig = plotter.plot(data=df, title=title, xlabel=xlabel, ylabel=ylabel, **plot_kwargs)
        image_base64 = plotter.figure_to_base64(fig)
        plotter.close_figure(fig)

        return PlotResult(chart_type=chart_type, image_base64=image_base64, recommendation=recommendation)

