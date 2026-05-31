"""Validate the exported dashboard JSON in public/data/.

Usage:  python preprocessing/validate_exports.py
Exits non-zero if any check fails.
"""

from __future__ import annotations

import json
import os
import sys

HERE = os.path.dirname(__file__)
PUBLIC_DIR = os.path.join(HERE, "..", "..", "public", "data")

REQUIRED_FILES = ["nodes.json", "edges.json", "predictions.json", "metrics.json", "explanations.json"]
REQUIRED_NODE_FIELDS = [
    "id", "originalTxId", "label", "timeStep", "classLabel", "trueLabel", "knownLabel",
    "predictedLabel", "fraudProbability", "riskLevel", "baselineProbability", "gnnProbability",
    "degree", "inDegree", "outDegree", "featureSummary",
]
MAX_TOTAL_MB = 12.0


def _load(name: str):
    with open(os.path.join(PUBLIC_DIR, name)) as f:
        return json.load(f)


def main() -> None:
    errors: list[str] = []
    warnings: list[str] = []

    # 1. files exist
    for f in REQUIRED_FILES:
        if not os.path.exists(os.path.join(PUBLIC_DIR, f)):
            errors.append(f"missing file: {f}")
    if errors:
        print("\n".join("[FAIL] " + e for e in errors))
        sys.exit(1)

    nodes = _load("nodes.json")
    edges = _load("edges.json")

    # 2. unique node ids
    ids = [n["id"] for n in nodes]
    if len(ids) != len(set(ids)):
        errors.append("node ids are not unique")
    id_set = set(ids)

    # 3. required fields present
    missing_fields = {k for n in nodes for k in REQUIRED_NODE_FIELDS if k not in n}
    if missing_fields:
        errors.append(f"nodes missing required fields: {sorted(missing_fields)}")

    # 4. edge endpoints exist
    bad_edges = [e for e in edges if e["source"] not in id_set or e["target"] not in id_set]
    if bad_edges:
        errors.append(f"{len(bad_edges)} edges reference nodes outside the export")

    # 5. unknown labels remain unknown (never silently relabeled to licit)
    for n in nodes:
        if n["classLabel"] == "unknown":
            if n["knownLabel"] is not False:
                errors.append(f"{n['id']}: unknown classLabel but knownLabel != false")
                break
            if n["trueLabel"] != "unknown":
                errors.append(f"{n['id']}: unknown classLabel but trueLabel != unknown")
                break

    # 6. no raw CSV content leaked into public/data
    for fname in os.listdir(PUBLIC_DIR):
        if fname.endswith(".csv"):
            errors.append(f"raw CSV found in public/data: {fname}")

    # 7. reasonable size + node count
    total_mb = sum(os.path.getsize(os.path.join(PUBLIC_DIR, f)) for f in REQUIRED_FILES) / 1e6
    if total_mb > MAX_TOTAL_MB:
        errors.append(f"export too large: {total_mb:.1f} MB > {MAX_TOTAL_MB} MB")
    if not (300 <= len(nodes) <= 1500):
        warnings.append(f"node count {len(nodes)} is outside the recommended 300–1500 range")

    # 8. label + edge coverage
    labels = {n["classLabel"] for n in nodes}
    for required in ("licit", "illicit", "unknown"):
        if required not in labels:
            errors.append(f"export has no '{required}' nodes")
    if not edges:
        errors.append("export has no directed edges")

    # ── report ──
    print("=" * 52)
    print("Export validation")
    print("=" * 52)
    print(f"nodes={len(nodes)} edges={len(edges)} size={total_mb:.2f} MB")
    counts = {l: sum(1 for n in nodes if n["classLabel"] == l) for l in ("illicit", "licit", "unknown")}
    print(f"label distribution: {counts}")
    for w in warnings:
        print(f"[WARN] {w}")
    if errors:
        for e in errors:
            print(f"[FAIL] {e}")
        sys.exit(1)
    print("[OK] All validation checks passed.")


if __name__ == "__main__":
    main()
