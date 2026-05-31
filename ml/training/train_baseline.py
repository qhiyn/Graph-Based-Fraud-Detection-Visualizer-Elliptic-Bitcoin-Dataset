"""Train a Logistic Regression baseline on the 165 anonymized Elliptic features.

Known labels only (illicit=1, licit=0). Unknown nodes are excluded from
supervised training. A time-aware split is used when valid.

Usage:  python training/train_baseline.py
"""

from __future__ import annotations

import os
import sys

import joblib
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "preprocessing"))
sys.path.insert(0, os.path.dirname(__file__))

import load_elliptic as le  # noqa: E402
import baseline_config as cfg  # noqa: E402


def main() -> None:
    print("Loading known-labeled feature matrix (streaming)…")
    df = le.load_labeled_matrix()
    feature_cols = [c for c in df.columns if c.startswith("f")]
    X = df[feature_cols].to_numpy(dtype="float32")
    y = df["y"].to_numpy()

    train, val, test, strategy = cfg.make_splits(df)
    print(f"Split strategy: {strategy}")
    for name, m in (("train", train), ("val", val), ("test", test)):
        n_ill = int(y[m].sum())
        print(f"  {name:5s}: {int(m.sum()):>6} rows  (illicit={n_ill}, licit={int(m.sum()) - n_ill})")

    model = Pipeline([
        ("scaler", StandardScaler()),
        ("clf", LogisticRegression(class_weight="balanced", max_iter=2000, random_state=cfg.RANDOM_STATE)),
    ])
    print("Training Logistic Regression…")
    model.fit(X[train], y[train])

    train_auc = model.score(X[train], y[train])
    print(f"Train accuracy: {train_auc:.4f}")

    os.makedirs(os.path.dirname(cfg.MODEL_PATH), exist_ok=True)
    joblib.dump({"model": model, "feature_cols": feature_cols, "strategy": strategy}, cfg.MODEL_PATH)
    print(f"Saved model -> {os.path.relpath(cfg.MODEL_PATH)}")


if __name__ == "__main__":
    main()
