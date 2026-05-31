"""Layer real GraphSAGE probabilities onto the existing dashboard sample.

Reuses the Phase 4 sample in public/data/nodes.json (keeps baselineProbability),
attaches gnnProbability from the GraphSAGE predictions CSV, and makes the GNN
the primary fraudProbability. True/unknown labels are never overwritten.

Usage:  python export/export_gnn_dashboard.py [threshold]
"""

from __future__ import annotations

import json
import os
import sys

import pandas as pd

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "preprocessing"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "training"))

import load_elliptic as le  # noqa: E402
import graphsage_config as cfg  # noqa: E402
import baseline_config as bcfg  # noqa: E402
from build_graph import build_node_table  # noqa: E402

HERE = os.path.dirname(__file__)
PUBLIC_DIR = os.path.join(HERE, "..", "..", "public", "data")
BACKUP_DIR = os.path.join(HERE, "..", "outputs", "dashboard")
THRESHOLD = float(sys.argv[1]) if len(sys.argv) > 1 else cfg.THRESHOLD
NOTE = "Primary score is GraphSAGE (GNN). Baseline = Logistic Regression. Both evaluated on known test labels."


def _risk_level(p: float) -> str:
    return "high" if p >= 0.75 else "medium" if p >= 0.40 else "low"


def _read(name: str):
    with open(os.path.join(PUBLIC_DIR, name)) as f:
        return json.load(f)


def _write(name: str, data) -> None:
    payload = json.dumps(data, indent=2) + "\n"
    for d in (PUBLIC_DIR, BACKUP_DIR):
        os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, name), "w") as f:
            f.write(payload)


def _model_block(path: str, name: str) -> dict:
    with open(path) as f:
        t = json.load(f)["test"]
    pak = t.get("precisionAtK", {})
    return {
        "name": name,
        "rocAuc": t["rocAuc"], "averagePrecision": t.get("averagePrecision", 0.0),
        "f1": t["f1"], "precision": t["precision"], "recall": t["recall"],
        "precisionAtK": {"k50": pak.get("k50", 0.0), "k100": pak.get("k100", 0.0), "k500": pak.get("k500", 0.0)},
        "confusionMatrix": t["confusionMatrix"],
    }


def _explanation(node, gnn: float, baseline: float, illicit_neighbors: int) -> list[str]:
    bullets = [
        f"GraphSAGE assigned {_risk_level(gnn)} risk (p={gnn:.2f}) after aggregating information "
        f"from neighbouring transaction nodes."
    ]
    if illicit_neighbors > 0:
        bullets.append(f"It is connected to {illicit_neighbors} known illicit-labeled neighbour(s).")
    if node["knownLabel"]:
        bullets.append(f"True class is known: {node['classLabel']}.")
    else:
        bullets.append("True class is unknown — this is a risk prediction, not a confirmed illicit label.")
    if abs(gnn - baseline) >= 0.2:
        bullets.append(f"Baseline ({baseline:.2f}) and GraphSAGE ({gnn:.2f}) disagree — this node may warrant analyst review.")
    bullets.append(f"Appears in time step {int(node['timeStep'])}.")
    return bullets


def main() -> None:
    nodes = _read("nodes.json")
    edges = _read("edges.json")

    preds = pd.read_csv(cfg.PREDICTIONS_PATH, dtype={"id": str})
    gnn_of = dict(zip(preds["id"], preds["gnnProbability"]))

    # neighbour info for explanations (cheap; no big features load)
    node_table = build_node_table()
    illicit_nb = node_table["knownIllicitNeighbors"].to_dict()

    risk = {"low": 0, "medium": 0, "high": 0}
    explanation_records = []
    for n in nodes:
        gnn = float(round(gnn_of.get(n["id"], 0.0), 4))
        baseline = float(n.get("baselineProbability", 0.0))
        n["gnnProbability"] = gnn
        n["baselineProbability"] = baseline
        n["fraudProbability"] = gnn
        n["riskLevel"] = _risk_level(gnn)
        n["predictedLabel"] = "illicit" if gnn >= THRESHOLD else "licit"
        risk[n["riskLevel"]] += 1
        explanation_records.append({"nodeId": n["id"], "bullets": _explanation(n, gnn, baseline, int(illicit_nb.get(n["id"], 0)))})
    nodes.sort(key=lambda r: r["id"])
    explanation_records.sort(key=lambda r: r["nodeId"])

    predictions = [{
        "nodeId": n["id"], "trueLabel": n["trueLabel"], "predictedLabel": n["predictedLabel"],
        "fraudProbability": n["fraudProbability"], "riskLevel": n["riskLevel"], "timeStep": n["timeStep"],
        "knownLabel": n["knownLabel"], "baselineProbability": n["baselineProbability"], "gnnProbability": n["gnnProbability"],
    } for n in nodes]

    metrics = {
        "stage": "comparison",
        "note": NOTE,
        "baseline": _model_block(bcfg.METRICS_PATH, "Logistic Regression"),
        "gnn": _model_block(cfg.METRICS_OUTPUT_PATH, "GraphSAGE"),
    }

    _write("nodes.json", nodes)
    _write("edges.json", edges)
    _write("predictions.json", predictions)
    _write("metrics.json", metrics)
    _write("explanations.json", explanation_records)

    dist = {}
    for n in nodes:
        dist[n["classLabel"]] = dist.get(n["classLabel"], 0) + 1
    print("-" * 48)
    print(f"Exported {len(nodes)} nodes, {len(edges)} edges (threshold={THRESHOLD})")
    print(f"Label distribution: {dist}")
    print(f"Risk distribution : {risk}")
    print(f"GNN test ROC-AUC={metrics['gnn']['rocAuc']}  baseline={metrics['baseline']['rocAuc']}")
    print("Files written to public/data/ and ml/outputs/dashboard/")


if __name__ == "__main__":
    main()
