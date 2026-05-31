"""Configuration for the GraphSAGE GNN. Defaults are conservative for Mac M1 CPU.

The time-aware split matches Phase 4 (train ts<=34, val 35-41, test >=42) so
baseline and GNN are evaluated on identical partitions.
"""

from __future__ import annotations

import os

_ML_ROOT = os.path.join(os.path.dirname(__file__), "..")

RANDOM_SEED = 42
HIDDEN_CHANNELS = 64
NUM_LAYERS = 2
DROPOUT = 0.4
LEARNING_RATE = 0.005
WEIGHT_DECAY = 0.0005
EPOCHS = 100
PATIENCE = 15

TRAIN_TIME_MAX = 34
VAL_TIME_RANGE = (35, 41)
TEST_TIME_MIN = 42

# CPU-first. MPS/CUDA are used only if available; CPU is always the safe default.
DEVICE_PREFERENCE = "cpu"
UNDIRECTED_MESSAGE_PASSING = True  # add reverse edges so signal flows both ways

THRESHOLD = 0.5
K_VALUES = [50, 100, 250, 500, 1000]

MODEL_OUTPUT_PATH = os.path.join(_ML_ROOT, "outputs", "models", "graphsage_best.pt")
METRICS_OUTPUT_PATH = os.path.join(_ML_ROOT, "outputs", "metrics", "graphsage_metrics.json")
PREDICTIONS_PATH = os.path.join(_ML_ROOT, "outputs", "processed", "graphsage_node_predictions.csv")


def get_device(preference: str = DEVICE_PREFERENCE):
    """Return a torch device, defaulting safely to CPU."""
    import torch

    if preference == "cuda" and torch.cuda.is_available():
        return torch.device("cuda")
    if preference == "mps" and getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")
