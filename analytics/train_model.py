"""
Train a simple Ridge regression on maintenance_dataset.csv to predict risk_score.
Run: python3 analytics/train_model.py
Writes: analytics/model_weights.json (used by Node /api/predict-risk)
"""
import json
import os
import sys

try:
    import pandas as pd
    from sklearn.linear_model import Ridge
    from sklearn.compose import ColumnTransformer
    from sklearn.pipeline import Pipeline
    from sklearn.preprocessing import OneHotEncoder
except ImportError:
    print("Install: pip install pandas scikit-learn", file=sys.stderr)
    sys.exit(1)

ROOT = os.path.dirname(os.path.abspath(__file__))
CSV = os.path.join(ROOT, "..", "data", "maintenance_dataset.csv")
OUT = os.path.join(ROOT, "model_weights.json")


def main():
    df = pd.read_csv(CSV)
    df = df.dropna(subset=["risk_score"])
    y = df["risk_score"].astype(float)
    features = ["severity", "weather_condition", "asset_area"]
    X = df[features].fillna("Unknown")

    pipe = Pipeline(
        [
            (
                "prep",
                ColumnTransformer(
                    [
                        (
                            "cat",
                            OneHotEncoder(handle_unknown="ignore"),
                            features,
                        ),
                    ]
                ),
            ),
            ("model", Ridge(alpha=2.0)),
        ]
    )
    pipe.fit(X, y)
    preds = pipe.predict(X)
    rmse = float(((preds - y) ** 2).mean() ** 0.5)

    prep = pipe.named_steps["prep"]
    model = pipe.named_steps["model"]
    feature_names = prep.get_feature_names_out()
    coefs = model.coef_.tolist()
    export = {
        "version": 1,
        "kind": "sklearn_ridge_onehot",
        "feature_names": list(feature_names),
        "coefficients": coefs,
        "intercept": float(model.intercept_),
        "rmse": round(rmse, 3),
        "source_csv": "data/maintenance_dataset.csv",
    }
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(export, f, indent=2)
    print("Wrote", OUT, "rmse=", export["rmse"])


if __name__ == "__main__":
    main()
