"""Reusable evaluation metrics for binary fraud classification (illicit=1).

All functions operate on known-labeled data only. Precision@K reflects how many
of the highest-risk ranked transactions are actually illicit — the metric an
analyst cares about when reviewing the top suspicious nodes first.
"""

from __future__ import annotations

import numpy as np
from sklearn.metrics import (
    average_precision_score,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)


def precision_at_k(y_true: np.ndarray, y_score: np.ndarray, k: int) -> float:
    """Fraction of illicit labels among the top-k highest-scored items."""
    k = min(k, len(y_score))
    if k <= 0:
        return 0.0
    top = np.argsort(-y_score)[:k]
    return round(float(np.asarray(y_true)[top].mean()), 4)


def confusion_counts(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    y_true, y_pred = np.asarray(y_true), np.asarray(y_pred)
    return {
        "truePositive": int(((y_pred == 1) & (y_true == 1)).sum()),
        "falsePositive": int(((y_pred == 1) & (y_true == 0)).sum()),
        "trueNegative": int(((y_pred == 0) & (y_true == 0)).sum()),
        "falseNegative": int(((y_pred == 0) & (y_true == 1)).sum()),
    }


def compute_metrics(y_true, y_score, threshold: float, k_values: list[int]) -> dict:
    """Return the full metric set for one split."""
    y_true = np.asarray(y_true)
    y_score = np.asarray(y_score)
    y_pred = (y_score >= threshold).astype(int)

    both = len(np.unique(y_true)) == 2

    def safe(fn, *a, **kw):
        try:
            return round(float(fn(*a, **kw)), 4)
        except Exception:
            return 0.0

    return {
        "rocAuc": safe(roc_auc_score, y_true, y_score) if both else 0.0,
        "averagePrecision": safe(average_precision_score, y_true, y_score) if both else 0.0,
        "precision": safe(precision_score, y_true, y_pred, zero_division=0),
        "recall": safe(recall_score, y_true, y_pred, zero_division=0),
        "f1": safe(f1_score, y_true, y_pred, zero_division=0),
        "confusionMatrix": confusion_counts(y_true, y_pred),
        "precisionAtK": {f"k{k}": precision_at_k(y_true, y_score, k) for k in k_values if k <= len(y_score)},
    }
