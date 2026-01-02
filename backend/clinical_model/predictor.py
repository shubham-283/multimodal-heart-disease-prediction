import shap
import pandas as pd
from catboost import CatBoostClassifier
from clinical_model.features import build_features

# Path to your saved CatBoost model
MODEL_PATH = r"D:\SEM 8\multimodal-heart-disease-prediction\backend\clinical_model\cardio_catboost_model.cbm"

class CardioPredictor:
    def __init__(self):
        # 1. Load the pre-trained CatBoost model
        self.model = CatBoostClassifier()
        self.model.load_model(MODEL_PATH)
        
        # 2. Initialize the SHAP TreeExplainer once during startup
        # TreeExplainer is optimized for CatBoost and very fast
        self.explainer = shap.TreeExplainer(self.model)

    def _format_explanations(self, shap_values, feature_names):
        """
        Internal helper to process raw SHAP values into a sorted, 
        UI-friendly dictionary.
        """
        # Create a list of dictionaries for each feature
        raw_list = []
        # shap_values[0] refers to the first (and only) row of input
        for name, val in zip(feature_names, shap_values[0]):
            raw_list.append({
                "feature": name,
                "impact": round(float(val), 4),
                "influence": "Increases Risk" if val > 0 else "Decreases Risk"
            })

        # Sort all features by their absolute impact (magnitude)
        # This brings the most influential factors to the top
        sorted_list = sorted(raw_list, key=lambda x: abs(x['impact']), reverse=True)
        
        # Filter top 3 contributors for each direction
        top_risk = [e for e in sorted_list if e['impact'] > 0][:3]
        top_protective = [e for e in sorted_list if e['impact'] < 0][:3]

        return {
            "top_risk_factors": top_risk,
            "top_protective_factors": top_protective,
            "all_features_sorted": sorted_list
        }

    def predict(self, raw_input: dict):
        """
        Takes raw dictionary input, builds features, predicts, 
        and explains the result.
        """
        # 1. Transform raw input into the feature format expected by the model
        # build_features should return a pandas DataFrame
        X = build_features(raw_input)

        # 2. Perform the prediction
        pred = int(self.model.predict(X)[0])
        prob = float(self.model.predict_proba(X)[0][1])

        # 3. Calculate SHAP values for this specific patient
        shap_values = self.explainer.shap_values(X)

        # 4. Format the raw SHAP numbers into readable summaries
        explanations = self._format_explanations(shap_values, X.columns)

        return {
            "prediction": pred,
            "label": "Cardio Disease" if pred == 1 else "Healthy",
            "probability": round(prob, 4),
            "explanations": explanations
        }