"""Load the raw Elliptic Bitcoin CSV files into clean, reusable structures.

Dataset layout (verified):
  elliptic_txs_classes.csv  : header "txId,class"; class in {1, 2, unknown}
  elliptic_txs_edgelist.csv : header "txId1,txId2"; directed transaction flow
  elliptic_txs_features.csv : NO header; col0=txId, col1=timeStep, rest=features

Label mapping (critical):
  1       -> illicit
  2       -> licit
  unknown -> unknown   (unlabeled — NEVER treated as licit)
"""

from __future__ import annotations

import os
from typing import Iterator

import pandas as pd

RAW_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "raw", "elliptic")
FEATURES_CSV = os.path.join(RAW_DIR, "elliptic_txs_features.csv")
CLASSES_CSV = os.path.join(RAW_DIR, "elliptic_txs_classes.csv")
EDGES_CSV = os.path.join(RAW_DIR, "elliptic_txs_edgelist.csv")

LABEL_MAP = {"1": "illicit", "2": "licit", "unknown": "unknown"}
LABEL_LICIT, LABEL_ILLICIT, LABEL_UNKNOWN = "licit", "illicit", "unknown"


def tx_id(raw_id: int | str) -> str:
    """Stable frontend-safe id, e.g. 12345 -> 'tx_12345'."""
    return f"tx_{raw_id}"


def _has_header(path: str) -> bool:
    """A file has a header if the first cell is not an integer."""
    with open(path, "r") as f:
        first_cell = f.readline().split(",")[0].strip()
    try:
        int(first_cell)
        return False
    except ValueError:
        return True


def load_classes() -> pd.DataFrame:
    """Return DataFrame[originalTxId, id, classLabel]. Unknown stays unknown."""
    if _has_header(CLASSES_CSV):
        df = pd.read_csv(CLASSES_CSV, dtype=str)
        df.columns = ["originalTxId", "rawClass"]
    else:
        df = pd.read_csv(CLASSES_CSV, header=None, names=["originalTxId", "rawClass"], dtype=str)
    df["classLabel"] = df["rawClass"].map(LABEL_MAP)
    unmapped = df["classLabel"].isna().sum()
    if unmapped:
        raise ValueError(f"{unmapped} class values could not be mapped: {df.loc[df['classLabel'].isna(), 'rawClass'].unique()}")
    df["id"] = df["originalTxId"].map(tx_id)
    return df[["originalTxId", "id", "classLabel"]]


def load_edges() -> pd.DataFrame:
    """Return DataFrame[source, target] of directed tx-flow edges (string ids)."""
    if _has_header(EDGES_CSV):
        df = pd.read_csv(EDGES_CSV, dtype=str)
        df.columns = ["src", "tgt"]
    else:
        df = pd.read_csv(EDGES_CSV, header=None, names=["src", "tgt"], dtype=str)
    df["source"] = df["src"].map(tx_id)
    df["target"] = df["tgt"].map(tx_id)
    return df[["source", "target"]]


def load_feature_index() -> pd.DataFrame:
    """Lightweight load of only id + timeStep for every node (memory-conscious)."""
    df = pd.read_csv(FEATURES_CSV, header=None, usecols=[0, 1], names=["originalTxId", "timeStep"],
                     dtype={0: str, 1: "int16"})
    df["id"] = df["originalTxId"].map(tx_id)
    return df[["originalTxId", "id", "timeStep"]]


def feature_column_count() -> int:
    """Number of anonymized feature columns (excludes txId and timeStep)."""
    first = pd.read_csv(FEATURES_CSV, header=None, nrows=1)
    return first.shape[1] - 2


def iter_feature_chunks(chunksize: int = 50000) -> Iterator[pd.DataFrame]:
    """Stream the large features CSV in chunks to limit memory use.

    Column 0 (txId) is kept as a string to avoid float precision loss on large
    ids; the remaining columns are parsed as numeric.
    """
    for chunk in pd.read_csv(FEATURES_CSV, header=None, chunksize=chunksize, dtype={0: str}):
        yield chunk


def feature_columns(n_features: int) -> list[str]:
    return [f"f{i}" for i in range(n_features)]


def load_labeled_matrix() -> pd.DataFrame:
    """Stream the features CSV and return ONLY known-labeled rows.

    Returns a DataFrame with columns: id, timeStep, y (illicit=1, licit=0),
    and feature columns f0..f{n-1}. Unknown nodes are excluded entirely — they
    must never enter supervised training/evaluation.
    """
    classes = load_classes()
    known = classes[classes["classLabel"].isin([LABEL_ILLICIT, LABEL_LICIT])]
    y_map = dict(zip(known["id"], (known["classLabel"] == LABEL_ILLICIT).astype(int)))
    known_ids = set(known["id"])

    parts: list[pd.DataFrame] = []
    for chunk in iter_feature_chunks():
        ids = chunk.iloc[:, 0].map(tx_id)
        mask = ids.isin(known_ids)
        if not mask.any():
            continue
        sub = chunk.loc[mask].copy()
        sub_ids = ids.loc[mask]
        n_features = sub.shape[1] - 2
        out = pd.DataFrame(sub.iloc[:, 2:].to_numpy(dtype="float32"), columns=feature_columns(n_features))
        out.insert(0, "timeStep", sub.iloc[:, 1].to_numpy(dtype="int16"))
        out.insert(0, "id", sub_ids.to_numpy())
        out["y"] = out["id"].map(y_map).astype(int)
        parts.append(out)

    df = pd.concat(parts, ignore_index=True)
    return df


def load_features_for(node_ids: set[str]) -> dict[str, list[float]]:
    """Stream features and return {id: feature_vector} for the requested ids."""
    out: dict[str, list[float]] = {}
    for chunk in iter_feature_chunks():
        ids = chunk.iloc[:, 0].map(tx_id)
        mask = ids.isin(node_ids)
        if not mask.any():
            continue
        sub = chunk.loc[mask]
        sub_ids = ids.loc[mask]
        feats = sub.iloc[:, 2:].to_numpy(dtype="float32")
        for i, node_id in enumerate(sub_ids):
            out[node_id] = feats[i].tolist()
        if len(out) >= len(node_ids):
            break
    return out


def load_full_node_matrix() -> tuple[pd.DataFrame, "np.ndarray"]:
    """Stream the features CSV for ALL nodes (needed to build the full graph).

    Returns (meta, X) where meta has columns [originalTxId, id, timeStep] in the
    CSV row order, and X is a float32 array of the 165 anonymized features.
    """
    import numpy as np

    metas: list[pd.DataFrame] = []
    parts: list[np.ndarray] = []
    for chunk in iter_feature_chunks():
        orig = chunk.iloc[:, 0].astype(str)
        metas.append(pd.DataFrame({
            "originalTxId": orig.to_numpy(),
            "id": orig.map(tx_id).to_numpy(),
            "timeStep": chunk.iloc[:, 1].to_numpy(dtype="int16"),
        }))
        parts.append(chunk.iloc[:, 2:].to_numpy(dtype="float32"))
    meta = pd.concat(metas, ignore_index=True)
    X = np.vstack(parts)
    return meta, X


if __name__ == "__main__":
    classes = load_classes()
    edges = load_edges()
    print(f"classes: {len(classes)} rows, labels={classes['classLabel'].value_counts().to_dict()}")
    print(f"edges:   {len(edges)} rows")
    print(f"feature columns: {feature_column_count()}")
