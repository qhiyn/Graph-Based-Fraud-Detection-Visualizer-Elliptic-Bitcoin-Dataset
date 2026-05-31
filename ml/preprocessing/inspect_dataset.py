"""Print a dataset audit of the raw Elliptic Bitcoin files.

Usage:  python preprocessing/inspect_dataset.py
"""

from __future__ import annotations

import load_elliptic as le


def main() -> None:
    classes = le.load_classes()
    edges = le.load_edges()
    feat_index = le.load_feature_index()

    label_counts = classes["classLabel"].value_counts().to_dict()
    licit = label_counts.get(le.LABEL_LICIT, 0)
    illicit = label_counts.get(le.LABEL_ILLICIT, 0)
    unknown = label_counts.get(le.LABEL_UNKNOWN, 0)

    node_ids = set(feat_index["id"])
    missing_src = (~edges["source"].isin(node_ids)).sum()
    missing_tgt = (~edges["target"].isin(node_ids)).sum()

    print("=" * 56)
    print("Elliptic Bitcoin dataset audit")
    print("=" * 56)
    print(f"transaction nodes (features)    : {len(feat_index):,}")
    print(f"labeled rows (classes)          : {len(classes):,}")
    print(f"edges                           : {len(edges):,}")
    print(f"  licit   (class=2)             : {licit:,}")
    print(f"  illicit (class=1)             : {illicit:,}")
    print(f"  unknown (unlabeled)           : {unknown:,}")
    print(f"time steps                      : {feat_index['timeStep'].nunique()}")
    print(f"  min / max time step           : {feat_index['timeStep'].min()} / {feat_index['timeStep'].max()}")
    print(f"feature columns (anonymized)    : {le.feature_column_count()}")
    print(f"edges with missing source node  : {missing_src:,}")
    print(f"edges with missing target node  : {missing_tgt:,}")

    # Sanity check: unknown must not be mapped to licit.
    if le.LABEL_MAP.get("unknown") != le.LABEL_UNKNOWN:
        print("\n[WARNING] 'unknown' is NOT mapped to 'unknown' — unlabeled data may be mistreated!")
    elif le.LABEL_MAP.get("2") == le.LABEL_LICIT and le.LABEL_MAP.get("unknown") == le.LABEL_UNKNOWN:
        print("\n[OK] Label mapping is correct — unknown is kept separate from licit.")
    print("=" * 56)


if __name__ == "__main__":
    main()
