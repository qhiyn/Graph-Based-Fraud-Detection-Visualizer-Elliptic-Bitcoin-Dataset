"""Evaluate GraphSAGE on known validation/test labels (same split as Phase 4).

Reads the per-node predictions CSV produced by train_graphsage.py — no need to
reload the model/graph. Writes ml/outputs/metrics/graphsage_metrics.json in the
same shape as the baseline so the dashboard can compare them.

Usage:  python evaluation/evaluate_graphsage.py
"""

from __future__ import annotations

import json
import os
import sys

import pandas as pd

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "preprocessing"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "training"))
sys.path.insert(0, os.path.dirname(__file__))

import load_elliptic as le  # noqa: E402
import graphsage_config as cfg  # noqa: E402
from metrics import compute_metrics  # noqa: E402


def main() -> None:
    df = pd.read_csv(cfg.PREDICTIONS_PATH, dtype={"originalTxId": str, "id": str})
    known = df[df["knownLabel"]].copy()
    known["y"] = (known["classLabel"] == le.LABEL_ILLICIT).astype(int)

    ts = known["timeStep"]
    val = known[(ts >= cfg.VAL_TIME_RANGE[0]) & (ts <= cfg.VAL_TIME_RANGE[1])]
    test = known[ts >= cfg.TEST_TIME_MIN]
    train_n = int((ts <= cfg.TRAIN_TIME_MAX).sum())

    val_metrics = compute_metrics(val["y"], val["gnnProbability"], cfg.THRESHOLD, cfg.K_VALUES)
    test_metrics = compute_metrics(test["y"], test["gnnProbability"], cfg.THRESHOLD, cfg.K_VALUES)

    label_counts = df["classLabel"].value_counts().to_dict()
    report = {
        "stage": "gnn",
        "modelName": "GraphSAGE",
        "splitStrategy": f"time-aware (train ts<={cfg.TRAIN_TIME_MAX}, val "
                         f"{cfg.VAL_TIME_RANGE[0]}-{cfg.VAL_TIME_RANGE[1]}, test {cfg.TEST_TIME_MIN}+)",
        "trainSize": train_n,
        "validationSize": int(len(val)),
        "testSize": int(len(test)),
        "knownLabelCount": int(len(known)),
        "unknownLabelCount": int(label_counts.get(le.LABEL_UNKNOWN, 0)),
        "classDistribution": {
            "illicit": int((known["y"] == 1).sum()),
            "licit": int((known["y"] == 0).sum()),
            "unknown": int(label_counts.get(le.LABEL_UNKNOWN, 0)),
        },
        "validation": val_metrics,
        "test": test_metrics,
        "notes": [
            "GraphSAGE (2-layer SAGEConv) trained on the full transaction graph.",
            "Known labels only in loss/evaluation; unknown nodes pass messages but are excluded.",
            "Same time-aware split as the Logistic Regression baseline for fair comparison.",
        ],
    }

    os.makedirs(os.path.dirname(cfg.METRICS_OUTPUT_PATH), exist_ok=True)
    with open(cfg.METRICS_OUTPUT_PATH, "w") as f:
        json.dump(report, f, indent=2)

    print(f"Sizes: train={train_n} val={len(val)} test={len(test)}")
    print(f"TEST  rocAuc={test_metrics['rocAuc']} ap={test_metrics['averagePrecision']} "
          f"f1={test_metrics['f1']} precision={test_metrics['precision']} recall={test_metrics['recall']}")
    print(f"TEST  precision@K={test_metrics['precisionAtK']}")
    print(f"Saved metrics -> {os.path.relpath(cfg.METRICS_OUTPUT_PATH)}")


if __name__ == "__main__":
    main()
