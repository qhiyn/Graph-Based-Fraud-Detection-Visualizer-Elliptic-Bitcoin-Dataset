# Dataset

This project uses the **Elliptic Bitcoin dataset**, a public graph-based financial-fraud benchmark.

## Interpretation

- **Nodes** are Bitcoin transactions.
- **Edges** are directed transaction-flow relationships (one transaction funding another).
- **Features** are 165 anonymized transaction features (local + aggregated neighborhood statistics).
- **Labels** are `licit`, `illicit`, or `unknown`.

## Dataset audit

```txt
203,769 nodes
234,355 edges
4,545 illicit
42,019 licit
157,205 unknown
49 time steps
165 anonymized features
```

(Produced by `ml/preprocessing/inspect_dataset.py`.)

## Label mapping

```txt
1        -> illicit
2        -> licit
unknown  -> unknown   (unlabeled)
```

For supervised training the target is `illicit = 1`, `licit = 0`, and `unknown` is excluded entirely.

## Unknown means unlabeled, not safe

`unknown` transactions are simply not labeled in the benchmark. They are **not** confirmed licit and must never be treated as a "safe" or negative class. In this project they:

- are excluded from supervised training and evaluation,
- still participate in the graph (message passing and visualization),
- can receive a model risk prediction, but keep `unknown` as their true label,
- are shown with a distinct dashed gray border and an explicit warning in the UI.

## Time steps

The dataset spans **49 time steps**. The project uses a time-aware split: train on time steps ≤ 34, validate on 35–41, and test on ≥ 42. This avoids temporal leakage and mirrors how a model would be used on future transactions.

## Sampled dashboard graph

The full graph (203k nodes) is too large for a browser. The exporter selects a **fraud-focused sample of ~1,000 nodes and ~918 edges**: the highest-degree illicit-labeled transactions as seeds, expanded through their 1-hop / 2-hop neighborhoods, plus surrounding licit and unknown nodes. Sampling is deterministic so exports are reproducible.

## What is and isn't committed

- **Not committed (git-ignored):** raw CSVs (`ml/data/raw/`, ~690 MB for features), trained model artifacts (`*.pt`, `*.pkl`), and `ml/outputs/`.
- **Committed:** the exported dashboard JSON in `public/data/` — the only data the deployed app needs.

To obtain the raw data, download the Elliptic Bitcoin dataset and place the three CSV files in `ml/data/raw/elliptic/` (see `ml/README.md`).
