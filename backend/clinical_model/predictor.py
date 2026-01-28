import shap
import pandas as pd
from pathlib import Path
from catboost import CatBoostClassifier
from clinical_model.features import build_features

BASE_DIR = Path(__file__).resolve().parent.parent.parent
MODEL_PATH = BASE_DIR / "backend" / "clinical_model" / "cardio_catboost_model.cbm"

class CardioPredictor:
    def __init__(self):
        self.model = CatBoostClassifier()
        self.model.load_model(str(MODEL_PATH))
        self.explainer = shap.TreeExplainer(self.model)

    def _format_explanations(self, shap_values, feature_names):
        raw = [
            {
                "feature": name,
                "impact": round(float(val), 4),
                "influence": "Increases Risk" if val > 0 else "Decreases Risk"
            }
            for name, val in zip(feature_names, shap_values[0])
        ]

        raw_sorted = sorted(raw, key=lambda x: abs(x["impact"]), reverse=True)

        return {
            "top_risk_factors": [e for e in raw_sorted if e["impact"] > 0][:3],
            "top_protective_factors": [e for e in raw_sorted if e["impact"] < 0][:3],
            "all_features_sorted": raw_sorted
        }

    def predict(self, raw_input: dict):
        X = build_features(raw_input)

        pred = int(self.model.predict(X)[0])
        prob = float(self.model.predict_proba(X)[0][1])

        shap_values = self.explainer.shap_values(X)
        explanations = self._format_explanations(shap_values, X.columns)

        return {
            "prediction": pred,
            "label": "Cardio Disease" if pred == 1 else "Healthy",
            "probability": round(prob, 4),
            "explanations": explanations
        }
