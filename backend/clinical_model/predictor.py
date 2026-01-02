from catboost import CatBoostClassifier
from clinical_model.features import build_features

MODEL_PATH = r"D:\SEM 8\multimodal-heart-disease-prediction\backend\clinical_model\cardio_catboost_model.cbm"

class CardioPredictor:
    def __init__(self):
        self.model = CatBoostClassifier()
        self.model.load_model(MODEL_PATH)

    def predict(self, raw_input: dict):
        X = build_features(raw_input)

        pred = int(self.model.predict(X)[0])
        prob = float(self.model.predict_proba(X)[0][1])

        return {
            "prediction": pred,
            "label": "Cardio Disease" if pred == 1 else "Healthy",
            "probability": round(prob, 4)
        }
