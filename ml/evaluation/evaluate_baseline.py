"""Evaluate the trained Logistic Regression baseline on validation and test.

Metrics are computed on KNOWN labels only. Unknown nodes are never used as
ground truth. Writes ml/outputs/metrics/baseline_metrics.json.

Usage:  python evaluation/evaluate_baseline.py
"""

from __future__ import annotations

import json
import os
import sys

import joblib

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "preprocessing"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "training"))
sys.path.insert(0, os.path.dirname(__file__))

import load_elliptic as le  # noqa: E402
import baseline_config as cfg  # noqa: E402
from metrics import compute_metrics  # noqa: E402


def main() -> None:
    bundle = joblib.load(cfg.MODEL_PATH)
    model, feature_cols = bundle["model"], bundle["feature_cols"]

    df = le.load_labeled_matrix()
    X = df[feature_cols].to_numpy(dtype="float32")
    y = df["y"].to_numpy()
    train, val, test, strategy = cfg.make_splits(df)

    proba = model.predict_proba(X)[:, 1]

    val_metrics = compute_metrics(y[val], proba[val], cfg.THRESHOLD, cfg.K_VALUES)
    test_metrics = compute_metrics(y[test], proba[test], cfg.THRESHOLD, cfg.K_VALUES)

    classes = le.load_classes()
    label_counts = classes["classLabel"].value_counts().to_dict()

    report = {
        "stage": "baseline",
        "modelName": "Logistic Regression",
        "splitStrategy": strategy,
        "trainSize": int(train.sum()),
        "validationSize": int(val.sum()),
        "testSize": int(test.sum()),
        "knownLabelCount": int(len(df)),
        "unknownLabelCount": int(label_counts.get(le.LABEL_UNKNOWN, 0)),
        "classDistribution": {
            "illicit": int((y == 1).sum()),
            "licit": int((y == 0).sum()),
            "unknown": int(label_counts.get(le.LABEL_UNKNOWN, 0)),
        },
        "validation": val_metrics,
        "test": test_metrics,
        "notes": [
            "Logistic Regression baseline trained on 165 anonymized node features.",
            "Metrics computed on known labels only; unknown nodes are excluded.",
            "This is a non-graph baseline. GraphSAGE (GNN) is trained in Phase 5.",
        ],
    }

    os.makedirs(os.path.dirname(cfg.METRICS_PATH), exist_ok=True)
    with open(cfg.METRICS_PATH, "w") as f:
        json.dump(report, f, indent=2)

    print(f"Split: {strategy}")
    print(f"Sizes: train={report['trainSize']} val={report['validationSize']} test={report['testSize']}")
    print(f"TEST  rocAuc={test_metrics['rocAuc']} ap={test_metrics['averagePrecision']} "
          f"f1={test_metrics['f1']} precision={test_metrics['precision']} recall={test_metrics['recall']}")
    print(f"TEST  precision@K={test_metrics['precisionAtK']}")
    print(f"Saved metrics -> {os.path.relpath(cfg.METRICS_PATH)}")


if __name__ == "__main__":
    main()
