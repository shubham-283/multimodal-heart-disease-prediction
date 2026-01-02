import pandas as pd

FEATURE_ORDER = [
    'gender',
    'height',
    'weight',
    'ap_hi',
    'ap_lo',
    'cholesterol',
    'gluc',
    'smoke',
    'alco',
    'active',
    'age_years',
    'bmi',
    'is_high_bp',
    'pulse_pressure'
]

def build_features(raw_input: dict) -> pd.DataFrame:
    df = pd.DataFrame([raw_input])

    df["age_years"] = df.pop("age")
    height_m = df["height"] / 100
    df["bmi"] = df["weight"] / (height_m ** 2)

    df["is_high_bp"] = ((df["ap_hi"] >= 140) | (df["ap_lo"] >= 90)).astype(int)
    df["pulse_pressure"] = df["ap_hi"] - df["ap_lo"]

    return df[FEATURE_ORDER]
