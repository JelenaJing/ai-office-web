"""
Automatic label generation from column names (ported from merged-plot-agent).
"""

from __future__ import annotations

import re
from typing import Optional


class LabelGenerator:
    COLUMN_MAPPINGS = {
        "wavelength": "Wavelength",
        "wavenumber": "Wavenumber",
        "raman_shift": "Raman Shift",
        "intensity": "Intensity",
        "pl_intensity": "PL Intensity",
        "mz": "m/z",
        "mass_to_charge": "m/z",
        "absorbance": "Absorbance",
        "transmittance": "Transmittance",
        "reflectance": "Reflectance",
        "frequency": "Frequency",
        "time": "Time",
        "temperature": "Temperature",
        "pressure": "Pressure",
        "concentration": "Concentration",
        "value": "Value",
        "count": "Count",
        "category": "Category",
        "sample": "Sample",
        "gene": "Gene",
        "protein": "Protein",
        "foldchange": "Fold Change",
        "log2foldchange": "Log2 Fold Change",
        "pvalue": "P-value",
        "padj": "Adjusted P-value",
        "fdr": "FDR",
        "x": "X",
        "y": "Y",
        "z": "Z",
    }

    UNIT_PATTERNS = {
        r"nm$": " (nm)",
        r"cm\^-1|cm-1|wavenumber|raman": " (cm^-1)",
        r"m/z|mz|mass_to_charge": "",
        r"pl|photoluminescence": " (a.u.)",
        r"wavelength": " (nm)",
        r"frequency": " (Hz)",
        r"time": " (s)",
        r"temperature": " (°C)",
        r"pressure": " (Pa)",
        r"concentration": " (M)",
    }

    @classmethod
    def generate_label(cls, column_name: str, chart_type: str | None = None) -> str:
        if not column_name:
            return ""
        col_lower = column_name.lower().strip()
        if col_lower in cls.COLUMN_MAPPINGS:
            label = cls.COLUMN_MAPPINGS[col_lower]
        else:
            label = None
            for key, value in cls.COLUMN_MAPPINGS.items():
                if key in col_lower:
                    label = value
                    break
            if label is None:
                label = column_name.replace("_", " ").title()

        unit = cls._detect_unit(column_name)
        if unit:
            label += unit
        return label

    @classmethod
    def _detect_unit(cls, column_name: str) -> Optional[str]:
        col_lower = column_name.lower()
        for pattern, unit in cls.UNIT_PATTERNS.items():
            if re.search(pattern, col_lower):
                return unit
        return None

    @classmethod
    def generate_title(
        cls, chart_type: str, x_col: Optional[str] = None, y_col: Optional[str] = None, n_samples: Optional[int] = None
    ) -> str:
        chart_names = {
            "bar": "Bar Chart",
            "scatter": "Scatter Plot",
            "line": "Line Plot",
            "volcano": "Volcano Plot",
            "heatmap": "Heatmap",
            "box": "Box Plot",
            "histogram": "Histogram",
        }
        chart_name = chart_names.get(chart_type, chart_type.title())
        if x_col and y_col:
            title = f"{cls.generate_label(x_col)} vs {cls.generate_label(y_col)}"
        elif y_col:
            title = f"{chart_name}: {cls.generate_label(y_col)}"
        else:
            title = chart_name
        if n_samples:
            title += f" (n={n_samples})"
        return title

    @classmethod
    def generate_title_multi_series(
        cls,
        chart_type: str,
        x_col: Optional[str],
        y_cols: list[str],
        *,
        legend_caption: str = "Series",
    ) -> str:
        """Title when multiple y columns share one x (legend shows each series name)."""
        chart_names = {
            "bar": "Bar Chart",
            "scatter": "Scatter Plot",
            "line": "Line Plot",
            "histogram": "Histogram",
            "errorbar": "Errorbar Plot",
        }
        base = chart_names.get(chart_type, chart_type.title())
        if x_col and y_cols:
            y_part = ", ".join(cls.generate_label(c) for c in y_cols[:4])
            if len(y_cols) > 4:
                y_part += ", …"
            return f"{cls.generate_label(x_col)} vs {y_part} ({legend_caption})"
        if y_cols:
            y_part = ", ".join(cls.generate_label(c) for c in y_cols[:4])
            if len(y_cols) > 4:
                y_part += ", …"
            return f"{base}: {y_part}"
        return base

