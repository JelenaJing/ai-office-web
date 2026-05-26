from __future__ import annotations

import unittest

import matplotlib

matplotlib.use("Agg")

import pandas as pd

from app.services.plot.plot_service import PlotService
from app.services.plot.recommend.chart_recommender import ChartRecommender
from app.services.plot.recommend.data_type_classifier import DataTypeClassifier
from app.services.plot.recommend.template_registry import TemplateRegistry


class PlotTemplateRecommendationTests(unittest.TestCase):
    def test_rule_classifier_detects_raman(self):
        df = pd.DataFrame(
            {
                "raman_shift_cm-1": [100, 200, 300, 400],
                "intensity": [10, 30, 20, 15],
            }
        )
        analysis = {
            "data_characteristics": ["two_numeric_columns", "spectral_data"],
            "numeric_columns": ["raman_shift_cm-1", "intensity"],
            "categorical_columns": [],
        }
        result = DataTypeClassifier().classify(df=df, analysis=analysis, use_llm=False)
        self.assertEqual(result.data_type, "raman_spectrum")

    def test_template_registry_matches_by_data_type(self):
        registry = TemplateRegistry()
        analysis = {
            "data_characteristics": ["two_numeric_columns", "spectral_data"],
            "numeric_columns": ["wavelength", "intensity"],
            "categorical_columns": [],
        }
        template = registry.match_template(data_type="pl_spectrum", analysis=analysis)
        self.assertIsNotNone(template)
        self.assertEqual(template["template_id"], "pl_line")

    def test_recommender_returns_template_fields(self):
        df = pd.DataFrame(
            {
                "mz": [50, 60, 70, 80],
                "intensity": [5, 20, 15, 10],
            }
        )
        recommender = ChartRecommender(use_llm=False)
        rec = recommender.recommend(df, use_llm=False)
        self.assertIn("resolved_data_type", rec)
        self.assertIn("resolved_template_id", rec)
        self.assertEqual(rec["resolved_data_type"], "mass_spectrum")
        self.assertEqual(rec["recommended_chart"], "scatter")

    def test_plot_service_generates_image(self):
        df = {"mz": [50, 60, 70], "intensity": [1, 4, 2]}
        svc = PlotService()
        result = svc.generate_plot(data=df, use_llm_type_detection=False, auto_recommend=True)
        self.assertTrue(result.image_base64.startswith("data:image/png;base64,"))

    def test_multi_y_line_recommendation_and_plot(self):
        df = pd.DataFrame(
            {
                "shift": [100, 200, 300],
                "sample_a": [1.0, 2.0, 1.5],
                "sample_b": [0.5, 1.0, 0.8],
                "sample_c": [0.2, 0.4, 0.3],
            }
        )
        rec = ChartRecommender(use_llm=False).recommend(df, use_llm=False)
        sp = rec.get("suggested_parameters") or {}
        self.assertEqual(sp.get("x"), "shift")
        self.assertIsInstance(sp.get("y"), list)
        self.assertEqual(len(sp["y"]), 3)
        self.assertIsNone(sp.get("hue"))

        svc = PlotService()
        out = svc.generate_plot(data=df, chart_type="line", auto_recommend=False, use_llm_type_detection=False)
        self.assertTrue(out.image_base64.startswith("data:image/png;base64,"))


if __name__ == "__main__":
    unittest.main()
