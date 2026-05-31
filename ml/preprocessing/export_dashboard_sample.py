"""Export a fraud-focused graph SAMPLE to the frontend JSON contract.

The full Elliptic graph is far too large for the browser, so this exports a
useful subgraph (~300–1,500 nodes) centred on illicit-labeled transactions and
their neighbourhoods. Probabilities come from the pre-GNN baseline heuristic
(build_graph.py); the GNN is trained later (Phase 5).

Outputs (frontend contract):
  public/data/{nodes,edges,predictions,metrics,explanations}.json
Backups:
  ml/outputs/dashboard/{...}.json

Usage:  python preprocessing/export_dashboard_sample.py
"""

from __future__ import annotations

import json
import os
from collections import defaultdict

import numpy as np
from sklearn.metrics import f1_score, precision_score, recall_score, roc_auc_score

import load_elliptic as le
from build_graph import build_node_table

HERE = os.path.dirname(__file__)
PUBLIC_DIR = os.path.join(HERE, "..", "..", "public", "data")
BACKUP_DIR = os.path.join(HERE, "..", "outputs", "dashboard")

TARGET, MAX_NODES, MIN_NODES = 1000, 1500, 300
SEED_LIMIT = 150
NEIGHBORS_PER_SEED = 15
STAGE_NOTE = "Baseline graph-heuristic output (pre-GNN). GNN training is Phase 5."


def _select_sample(nodes, edges) -> set[str]:
    """Pick illicit seeds (highest degree) and expand their neighbourhoods."""
    adj: dict[str, list[str]] = defaultdict(list)
    for s, t in zip(edges["source"], edges["target"]):
        adj[s].append(t)
        adj[t].append(s)

    illicit = nodes[nodes["classLabel"] == le.LABEL_ILLICIT].sort_values("totalDegree", ascending=False)
    seeds = list(illicit.index[:SEED_LIMIT])
    sample: set[str] = set(seeds)

    # 1-hop expansion (capped per seed)
    for s in seeds:
        for nb in adj[s][:NEIGHBORS_PER_SEED]:
            sample.add(nb)
        if len(sample) >= MAX_NODES:
            break

    # 2-hop if still small (sorted() makes the fill order reproducible)
    if len(sample) < TARGET:
        for n in sorted(sample):
            for nb in adj[n][:8]:
                sample.add(nb)
            if len(sample) >= TARGET:
                break

    # Trim by keeping seeds + highest-degree others (id as deterministic tiebreak)
    if len(sample) > MAX_NODES:
        others = [n for n in sample if n not in set(seeds)]
        others.sort(key=lambda n: (int(nodes["totalDegree"].get(n, 0)), n), reverse=True)
        sample = set(seeds) | set(others[: MAX_NODES - len(seeds)])

    # Guarantee some licit nodes are present for a balanced visualization
    in_sample = nodes.loc[nodes.index.isin(sample)]
    if (in_sample["classLabel"] == le.LABEL_LICIT).sum() == 0:
        extra_licit = nodes[nodes["classLabel"] == le.LABEL_LICIT].sort_values("totalDegree", ascending=False)
        sample.update(extra_licit.index[:25])

    # keep only nodes we actually have rows for
    return {n for n in sample if n in nodes.index}


def _feature_summaries(sample_ids: set[str]) -> dict[str, dict]:
    """Stream the big features CSV; compute per-node feature summaries for sample."""
    out: dict[str, dict] = {}
    n_features = le.feature_column_count()
    local_n = min(94, n_features)  # Elliptic: first 94 = local, rest = aggregated
    for chunk in le.iter_feature_chunks():
        ids = chunk.iloc[:, 0].map(le.tx_id)
        mask = ids.isin(sample_ids)
        if not mask.any():
            continue
        sub = chunk.loc[mask]
        sub_ids = ids.loc[mask]
        feats = sub.iloc[:, 2:].to_numpy(dtype="float64")
        local_mean = feats[:, :local_n].mean(axis=1)
        agg_mean = feats[:, local_n:].mean(axis=1) if feats.shape[1] > local_n else np.zeros(len(sub))
        for i, node_id in enumerate(sub_ids):
            out[node_id] = {
                "numFeatures": n_features,
                "localMean": round(float(local_mean[i]), 4),
                "aggregatedMean": round(float(agg_mean[i]), 4),
            }
        if len(out) >= len(sample_ids):
            break
    return out


def _baseline_metrics(sample_nodes) -> dict:
    """Evaluate the baseline heuristic on KNOWN-labeled sample nodes."""
    known = sample_nodes[sample_nodes["knownLabel"]]
    y_true = (known["classLabel"] == le.LABEL_ILLICIT).astype(int).to_numpy()
    y_score = known["baselineProbability"].to_numpy()
    y_pred = (y_score >= 0.5).astype(int)

    def safe(fn, *a):
        try:
            return round(float(fn(*a)), 4)
        except Exception:
            return 0.0

    roc = safe(roc_auc_score, y_true, y_score) if len(set(y_true)) > 1 else 0.0
    prec_at_k = {}
    order = np.argsort(-y_score)
    for k in (50, 100, 500):
        kk = min(k, len(order))
        prec_at_k[f"k{k}"] = round(float(y_true[order[:kk]].mean()), 4) if kk else 0.0

    tp = int(((y_pred == 1) & (y_true == 1)).sum())
    fp = int(((y_pred == 1) & (y_true == 0)).sum())
    tn = int(((y_pred == 0) & (y_true == 0)).sum())
    fn = int(((y_pred == 0) & (y_true == 1)).sum())

    return {
        "name": "Graph Heuristic Baseline",
        "rocAuc": roc,
        "f1": safe(f1_score, y_true, y_pred, 0),
        "precision": safe(precision_score, y_true, y_pred, 0),
        "recall": safe(recall_score, y_true, y_pred, 0),
        "precisionAtK": prec_at_k,
        "confusionMatrix": {"truePositive": tp, "falsePositive": fp, "trueNegative": tn, "falseNegative": fn},
    }


def _explanation(row) -> list[str]:
    bullets = []
    if row["riskLevel"] == "high":
        bullets.append("The baseline heuristic assigns a high illicit-risk score.")
    elif row["riskLevel"] == "medium":
        bullets.append("The baseline heuristic assigns a moderate illicit-risk score.")
    else:
        bullets.append("The baseline heuristic assigns a low illicit-risk score.")
    if row["knownLabel"]:
        bullets.append(f"This transaction has a known ground-truth label: {row['classLabel']}.")
    else:
        bullets.append("This transaction is unlabeled in the original dataset (unknown — not confirmed safe).")
    if row["knownIllicitNeighbors"] > 0:
        bullets.append(f"It is connected to {int(row['knownIllicitNeighbors'])} known illicit-labeled neighbour(s).")
    if row["highDegreeFlag"]:
        bullets.append(f"It is a high-connectivity node (in {int(row['inDegree'])}, out {int(row['outDegree'])}).")
    bullets.append(f"It appears in time step {int(row['timeStep'])}.")
    bullets.append("Score is a pre-GNN baseline; the GNN model is trained in a later phase.")
    return bullets


def _write(name: str, data) -> int:
    payload = json.dumps(data, indent=2) + "\n"
    for d in (PUBLIC_DIR, BACKUP_DIR):
        os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, name), "w") as f:
            f.write(payload)
    return len(payload)


def main() -> None:
    print("Building node table…")
    nodes = build_node_table()
    edges = le.load_edges()

    print("Selecting fraud-focused sample…")
    sample_ids = _select_sample(nodes, edges)
    sample = nodes.loc[nodes.index.isin(sample_ids)].copy()
    print(f"  sampled nodes: {len(sample)}")

    print("Computing feature summaries (streaming features CSV)…")
    summaries = _feature_summaries(sample_ids)

    # ── nodes.json ──
    node_records = []
    for node_id, row in sample.iterrows():
        node_records.append({
            "id": node_id,
            "originalTxId": row["originalTxId"],
            "label": f"Transaction {row['originalTxId']}",
            "timeStep": int(row["timeStep"]),
            "classLabel": row["classLabel"],
            "trueLabel": row["classLabel"],
            "knownLabel": bool(row["knownLabel"]),
            "predictedLabel": row["predictedLabel"],
            "fraudProbability": float(row["baselineProbability"]),
            "riskLevel": row["riskLevel"],
            "baselineProbability": float(row["baselineProbability"]),
            "gnnProbability": None,
            "degree": int(row["totalDegree"]),
            "inDegree": int(row["inDegree"]),
            "outDegree": int(row["outDegree"]),
            "featureSummary": summaries.get(node_id, {"numFeatures": le.feature_column_count(), "localMean": 0.0, "aggregatedMean": 0.0}),
        })
    node_records.sort(key=lambda r: r["id"])

    # ── edges.json (directed, both endpoints in sample) ──
    in_sample = set(sample_ids)
    edge_records = []
    eid = 0
    for s, t in zip(edges["source"], edges["target"]):
        if s in in_sample and t in in_sample:
            eid += 1
            edge_records.append({"id": f"edge_{eid:05d}", "source": s, "target": t, "type": "transaction_flow", "directed": True})

    # ── predictions.json ──
    prediction_records = [{
        "nodeId": r["id"], "trueLabel": r["trueLabel"], "predictedLabel": r["predictedLabel"],
        "fraudProbability": r["fraudProbability"], "riskLevel": r["riskLevel"], "timeStep": r["timeStep"],
        "knownLabel": r["knownLabel"], "baselineProbability": r["baselineProbability"], "gnnProbability": None,
    } for r in node_records]

    # ── metrics.json (real baseline metrics; GNN placeholder) ──
    metrics = {
        "stage": "baseline-heuristic",
        "note": STAGE_NOTE,
        "baseline": _baseline_metrics(sample),
        "gnn": {
            "name": "GraphSAGE (not trained yet)",
            "rocAuc": 0.0, "f1": 0.0, "precision": 0.0, "recall": 0.0,
            "precisionAtK": {"k50": 0.0, "k100": 0.0, "k500": 0.0},
            "confusionMatrix": {"truePositive": 0, "falsePositive": 0, "trueNegative": 0, "falseNegative": 0},
        },
    }

    # ── explanations.json ──
    explanation_records = [{"nodeId": node_id, "bullets": _explanation(row)} for node_id, row in sample.iterrows()]
    explanation_records.sort(key=lambda r: r["nodeId"])

    sizes = {
        "nodes.json": _write("nodes.json", node_records),
        "edges.json": _write("edges.json", edge_records),
        "predictions.json": _write("predictions.json", prediction_records),
        "metrics.json": _write("metrics.json", metrics),
        "explanations.json": _write("explanations.json", explanation_records),
    }

    dist = sample["classLabel"].value_counts().to_dict()
    print("-" * 48)
    print(f"Exported {len(node_records)} nodes, {len(edge_records)} edges")
    print(f"Label distribution: {dist}")
    print(f"Risk distribution : {sample['riskLevel'].value_counts().to_dict()}")
    print(f"Baseline ROC-AUC (known sample): {metrics['baseline']['rocAuc']}")
    print(f"Files written to public/data/ and ml/outputs/dashboard/")
    for k, v in sizes.items():
        print(f"  {k}: {v/1024:.1f} KB")


if __name__ == "__main__":
    main()
