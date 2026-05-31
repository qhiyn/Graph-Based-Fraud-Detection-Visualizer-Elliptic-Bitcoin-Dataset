"""Build a directed graph view of the Elliptic data and compute lightweight
per-node graph statistics plus a simple, pre-GNN baseline risk heuristic.

No model is trained here. The baseline is a transparent graph-neighborhood
heuristic used only so the dashboard has meaningful values before the GNN
(Phase 5) is built.

Usage:  python preprocessing/build_graph.py   (prints a small preview)
"""

from __future__ import annotations

import numpy as np
import pandas as pd

import load_elliptic as le


def _risk_level(prob: float) -> str:
    if prob >= 0.75:
        return "high"
    if prob >= 0.40:
        return "medium"
    return "low"


def build_node_table() -> pd.DataFrame:
    """Return a per-node DataFrame indexed by id with graph stats + baseline risk."""
    feat = le.load_feature_index()            # originalTxId, id, timeStep
    classes = le.load_classes()[["id", "classLabel"]]
    edges = le.load_edges()                   # source, target (string ids)

    nodes = feat.merge(classes, on="id", how="left")
    nodes["classLabel"] = nodes["classLabel"].fillna(le.LABEL_UNKNOWN)
    nodes["knownLabel"] = nodes["classLabel"].isin([le.LABEL_LICIT, le.LABEL_ILLICIT])

    label_of = dict(zip(nodes["id"], nodes["classLabel"]))

    # ── Directed degrees ──
    out_deg = edges.groupby("source").size()
    in_deg = edges.groupby("target").size()
    nodes["outDegree"] = nodes["id"].map(out_deg).fillna(0).astype(int)
    nodes["inDegree"] = nodes["id"].map(in_deg).fillna(0).astype(int)
    nodes["totalDegree"] = nodes["inDegree"] + nodes["outDegree"]

    # ── Undirected neighbour label counts (vectorized) ──
    und = pd.concat([
        edges.rename(columns={"source": "node", "target": "neighbor"}),
        edges.rename(columns={"target": "node", "source": "neighbor"}),
    ], ignore_index=True).drop_duplicates(["node", "neighbor"])
    und["neighborLabel"] = und["neighbor"].map(label_of).fillna(le.LABEL_UNKNOWN)

    neighbor_count = und.groupby("node")["neighbor"].nunique()
    by_label = und.groupby(["node", "neighborLabel"]).size().unstack(fill_value=0)
    for col in (le.LABEL_ILLICIT, le.LABEL_LICIT, le.LABEL_UNKNOWN):
        if col not in by_label.columns:
            by_label[col] = 0

    nodes["neighborCount"] = nodes["id"].map(neighbor_count).fillna(0).astype(int)
    nodes["knownIllicitNeighbors"] = nodes["id"].map(by_label[le.LABEL_ILLICIT]).fillna(0).astype(int)
    nodes["knownLicitNeighbors"] = nodes["id"].map(by_label[le.LABEL_LICIT]).fillna(0).astype(int)
    nodes["unknownNeighbors"] = nodes["id"].map(by_label[le.LABEL_UNKNOWN]).fillna(0).astype(int)

    # ── Baseline risk features ──
    known_neighbors = nodes["knownIllicitNeighbors"] + nodes["knownLicitNeighbors"]
    nodes["illicitNeighborRatio"] = (nodes["knownIllicitNeighbors"] / known_neighbors.where(known_neighbors > 0, np.nan)).fillna(0.0)
    deg_threshold = nodes["totalDegree"].quantile(0.90)
    nodes["highDegreeFlag"] = (nodes["totalDegree"] >= deg_threshold).astype(int)
    nodes["graphExposureScore"] = np.clip(
        0.6 * nodes["illicitNeighborRatio"]
        + 0.4 * (nodes["knownIllicitNeighbors"] / (1 + nodes["neighborCount"])),
        0.0, 1.0,
    )

    # ── Baseline probability (pre-GNN heuristic) ──
    nodes["baselineProbability"] = np.clip(
        0.65 * nodes["illicitNeighborRatio"]
        + 0.20 * nodes["highDegreeFlag"]
        + 0.15 * nodes["graphExposureScore"],
        0.0, 1.0,
    ).round(4)
    nodes["predictedLabel"] = np.where(nodes["baselineProbability"] >= 0.5, le.LABEL_ILLICIT, le.LABEL_LICIT)
    nodes["riskLevel"] = nodes["baselineProbability"].map(_risk_level)

    return nodes.set_index("id")


if __name__ == "__main__":
    df = build_node_table()
    print(f"nodes: {len(df):,}")
    print(f"risk levels: {df['riskLevel'].value_counts().to_dict()}")
    print(f"mean baselineProbability by class:")
    print(df.groupby("classLabel")["baselineProbability"].mean().round(3))
