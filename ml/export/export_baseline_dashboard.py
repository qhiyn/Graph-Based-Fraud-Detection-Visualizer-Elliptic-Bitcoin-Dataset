"""Re-export the dashboard JSON using the trained Logistic Regression baseline.

Reuses the Phase 3 fraud-focused sample selection, then replaces the heuristic
score with the real model probability. Keeps the exact frontend JSON contract.

  fraudProbability = baselineProbability = LogReg P(illicit)
  predictedLabel   = illicit if probability >= THRESHOLD else licit
  gnnProbability   = null            (GNN trained in Phase 5)
  classLabel/trueLabel are NEVER overwritten by predictions.

Usage:  python export/export_baseline_dashboard.py [threshold]
"""

from __future__ import annotations

import json
import os
import sys

import joblib
import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "preprocessing"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "training"))

import load_elliptic as le  # noqa: E402
import baseline_config as cfg  # noqa: E402
from build_graph import build_node_table  # noqa: E402
from export_dashboard_sample import _select_sample  # noqa: E402

HERE = os.path.dirname(__file__)
PUBLIC_DIR = os.path.join(HERE, "..", "..", "public", "data")
BACKUP_DIR = os.path.join(HERE, "..", "outputs", "dashboard")
THRESHOLD = float(sys.argv[1]) if len(sys.argv) > 1 else cfg.THRESHOLD
NOTE = "Baseline = Logistic Regression on 165 anonymized features (known labels only). GNN not trained yet (Phase 5)."


def _risk_level(p: float) -> str:
    return "high" if p >= 0.75 else "medium" if p >= 0.40 else "low"


def _explanation(row, prob: float) -> list[str]:
    level = _risk_level(prob)
    bullets = [
        f"The Logistic Regression baseline assigned a {level} illicit probability "
        f"({prob:.2f}) from the anonymized transaction features."
    ]
    if int(row["knownIllicitNeighbors"]) > 0:
        bullets.append(f"It is connected to {int(row['knownIllicitNeighbors'])} known illicit-labeled neighbour(s).")
    if row["knownLabel"]:
        bullets.append(f"True class is known: {row['classLabel']}.")
    else:
        bullets.append("True class is unknown — this is a risk prediction, not a confirmed label.")
    if int(row["highDegreeFlag"]) == 1:
        bullets.append(f"High-connectivity node (in {int(row['inDegree'])}, out {int(row['outDegree'])}).")
    bullets.append(f"Appears in time step {int(row['timeStep'])}.")
    return bullets


def _write(name: str, data) -> int:
    payload = json.dumps(data, indent=2) + "\n"
    for d in (PUBLIC_DIR, BACKUP_DIR):
        os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, name), "w") as f:
            f.write(payload)
    return len(payload)


def _dashboard_metrics() -> dict:
    """Shape the saved baseline test metrics into the frontend MetricsData contract."""
    with open(cfg.METRICS_PATH) as f:
        report = json.load(f)
    t = report["test"]
    pak = t.get("precisionAtK", {})
    return {
        "stage": "baseline",
        "note": NOTE,
        "baseline": {
            "name": "Logistic Regression",
            "rocAuc": t["rocAuc"], "f1": t["f1"], "precision": t["precision"], "recall": t["recall"],
            "precisionAtK": {"k50": pak.get("k50", 0.0), "k100": pak.get("k100", 0.0), "k500": pak.get("k500", 0.0)},
            "confusionMatrix": t["confusionMatrix"],
        },
        "gnn": {
            "name": "GraphSAGE (not trained yet)",
            "rocAuc": 0.0, "f1": 0.0, "precision": 0.0, "recall": 0.0,
            "precisionAtK": {"k50": 0.0, "k100": 0.0, "k500": 0.0},
            "confusionMatrix": {"truePositive": 0, "falsePositive": 0, "trueNegative": 0, "falseNegative": 0},
        },
    }


def main() -> None:
    print("Building node table + selecting fraud-focused sample…")
    nodes = build_node_table()
    edges = le.load_edges()
    sample_ids = _select_sample(nodes, edges)
    sample = nodes.loc[nodes.index.isin(sample_ids)].copy()
    print(f"  sampled nodes: {len(sample)}")

    print("Loading model + features for sample…")
    bundle = joblib.load(cfg.MODEL_PATH)
    model, feature_cols = bundle["model"], bundle["feature_cols"]
    feats = le.load_features_for(set(sample.index))
    n_features = len(feature_cols)
    local_n = min(94, n_features)

    ids = [i for i in sample.index if i in feats]
    X = np.array([feats[i] for i in ids], dtype="float32")
    proba = model.predict_proba(X)[:, 1]
    prob_of = {i: float(round(p, 4)) for i, p in zip(ids, proba)}

    node_records, explanation_records = [], []
    for node_id, row in sample.iterrows():
        p = prob_of.get(node_id, 0.0)
        vec = feats.get(node_id, [])
        summary = {
            "numFeatures": n_features,
            "localMean": round(float(np.mean(vec[:local_n])), 4) if vec else 0.0,
            "aggregatedMean": round(float(np.mean(vec[local_n:])), 4) if len(vec) > local_n else 0.0,
        }
        node_records.append({
            "id": node_id, "originalTxId": row["originalTxId"], "label": f"Transaction {row['originalTxId']}",
            "timeStep": int(row["timeStep"]), "classLabel": row["classLabel"], "trueLabel": row["classLabel"],
            "knownLabel": bool(row["knownLabel"]),
            "predictedLabel": "illicit" if p >= THRESHOLD else "licit",
            "fraudProbability": p, "riskLevel": _risk_level(p),
            "baselineProbability": p, "gnnProbability": None,
            "degree": int(row["totalDegree"]), "inDegree": int(row["inDegree"]), "outDegree": int(row["outDegree"]),
            "featureSummary": summary,
        })
        explanation_records.append({"nodeId": node_id, "bullets": _explanation(row, p)})
    node_records.sort(key=lambda r: r["id"])
    explanation_records.sort(key=lambda r: r["nodeId"])

    in_sample = set(sample_ids)
    edge_records, eid = [], 0
    for s, t in zip(edges["source"], edges["target"]):
        if s in in_sample and t in in_sample:
            eid += 1
            edge_records.append({"id": f"edge_{eid:05d}", "source": s, "target": t, "type": "transaction_flow", "directed": True})

    prediction_records = [{
        "nodeId": r["id"], "trueLabel": r["trueLabel"], "predictedLabel": r["predictedLabel"],
        "fraudProbability": r["fraudProbability"], "riskLevel": r["riskLevel"], "timeStep": r["timeStep"],
        "knownLabel": r["knownLabel"], "baselineProbability": r["baselineProbability"], "gnnProbability": None,
    } for r in node_records]

    _write("nodes.json", node_records)
    _write("edges.json", edge_records)
    _write("predictions.json", prediction_records)
    _write("metrics.json", _dashboard_metrics())
    _write("explanations.json", explanation_records)

    risk = {}
    for r in node_records:
        risk[r["riskLevel"]] = risk.get(r["riskLevel"], 0) + 1
    dist = sample["classLabel"].value_counts().to_dict()
    print("-" * 48)
    print(f"Exported {len(node_records)} nodes, {len(edge_records)} edges (threshold={THRESHOLD})")
    print(f"Label distribution: {dist}")
    print(f"Risk distribution : {risk}")
    print("Files written to public/data/ and ml/outputs/dashboard/")


if __name__ == "__main__":
    main()
