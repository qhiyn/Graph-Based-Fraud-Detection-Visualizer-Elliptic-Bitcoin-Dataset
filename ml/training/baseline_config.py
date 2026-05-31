"""Shared configuration and data-split logic for the baseline model.

Both train_baseline.py and evaluate_baseline.py import make_splits so the
train/validation/test partitions are reproduced identically.
"""

from __future__ import annotations

import os

import numpy as np
import pandas as pd

_ML_ROOT = os.path.join(os.path.dirname(__file__), "..")
MODEL_PATH = os.path.join(_ML_ROOT, "outputs", "models", "baseline_logistic_regression.joblib")
METRICS_PATH = os.path.join(_ML_ROOT, "outputs", "metrics", "baseline_metrics.json")

# Time-aware split over the 49 Elliptic time steps (documented, configurable).
TRAIN_MAX_TS = 34          # train:      timeStep <= 34
VAL_MAX_TS = 41            # validation: 35–41
# test: timeStep >= 42

THRESHOLD = 0.5            # illicit if probability >= THRESHOLD
K_VALUES = [50, 100, 250, 500, 1000]
RANDOM_STATE = 42


def make_splits(df: pd.DataFrame) -> tuple[np.ndarray, np.ndarray, np.ndarray, str]:
    """Return boolean masks (train, val, test) + a strategy description.

    Falls back to a stratified random split if the time-aware split leaves any
    partition with only one class (so ROC-AUC / training stay valid).
    """
    ts = df["timeStep"].to_numpy()
    train = ts <= TRAIN_MAX_TS
    val = (ts > TRAIN_MAX_TS) & (ts <= VAL_MAX_TS)
    test = ts > VAL_MAX_TS
    strategy = (
        f"time-aware (train ts<={TRAIN_MAX_TS}, val {TRAIN_MAX_TS + 1}-{VAL_MAX_TS}, "
        f"test {VAL_MAX_TS + 1}+)"
    )

    y = df["y"].to_numpy()
    both_classes = lambda m: m.sum() > 0 and len(np.unique(y[m])) == 2
    if both_classes(train) and both_classes(val) and both_classes(test):
        return train, val, test, strategy

    # Fallback: stratified 60/20/20
    from sklearn.model_selection import train_test_split

    idx = np.arange(len(df))
    tr, tmp = train_test_split(idx, test_size=0.4, stratify=y, random_state=RANDOM_STATE)
    va, te = train_test_split(tmp, test_size=0.5, stratify=y[tmp], random_state=RANDOM_STATE)
    train = np.zeros(len(df), bool); train[tr] = True
    val = np.zeros(len(df), bool); val[va] = True
    test = np.zeros(len(df), bool); test[te] = True
    strategy = "stratified random 60/20/20 (time-aware split lacked both classes in a partition)"
    return train, val, test, strategy
