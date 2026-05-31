# ML Pipeline — Elliptic Bitcoin Fraud Detection

This folder contains the **offline** machine-learning pipeline. It is fully
separate from the Next.js app. The deployed Vercel dashboard never runs Python —
it only consumes the exported JSON in `public/data/`.

## Phase 3 scope (current)

Real preprocessing of the Elliptic Bitcoin dataset and export of a
dashboard-ready graph sample using a **pre-GNN baseline heuristic**. No model is
trained yet — GraphSAGE training is Phase 5.

## Raw data

Place the three Elliptic CSV files here (not committed — see `.gitignore`):

```
ml/data/raw/elliptic/
├── elliptic_txs_features.csv    # no header: col0=txId, col1=timeStep, rest=features
├── elliptic_txs_edgelist.csv    # header: txId1,txId2 (directed flow)
└── elliptic_txs_classes.csv     # header: txId,class  (1=illicit, 2=licit, unknown)
```

## Setup

```bash
cd ml
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## Usage

Run scripts from the `ml/` directory (the `preprocessing/` modules import each other):

```bash
python preprocessing/inspect_dataset.py        # audit the raw dataset
python preprocessing/export_dashboard_sample.py # build + export the graph sample
python preprocessing/validate_exports.py        # validate the exported JSON
```

## Scripts

| Script | Purpose |
|---|---|
| `load_elliptic.py` | Load CSVs, map labels, normalize ids to `tx_<id>`, stream features memory-consciously. |
| `inspect_dataset.py` | Print a dataset audit (counts, time steps, label distribution, integrity). |
| `build_graph.py` | Directed degrees, neighbour label counts, and a transparent baseline risk heuristic. |
| `export_dashboard_sample.py` | Export a 300–1,500 node fraud-focused sample to the frontend JSON contract. |
| `validate_exports.py` | Verify the exported JSON satisfies the dashboard contract. |
| `training/train_baseline.py` | Train + save the Logistic Regression baseline (Phase 4). |
| `evaluation/evaluate_baseline.py` | Evaluate the baseline on val/test (known labels only). |
| `export/export_baseline_dashboard.py` | Re-export dashboard JSON with real baseline probabilities. |
| `training/models.py` · `training/train_graphsage.py` | GraphSAGE model + training (Phase 5). |
| `evaluation/evaluate_graphsage.py` | Evaluate GraphSAGE on val/test (known labels only). |
| `export/export_gnn_dashboard.py` | Re-export dashboard JSON with real GNN probabilities. |

## Generated files

Written to `public/data/` (committed, served by Vercel) and mirrored to
`ml/outputs/dashboard/` (backup, git-ignored):

```
nodes.json  edges.json  predictions.json  metrics.json  explanations.json
```

`fraudProbability` / `predictedLabel` come from the baseline heuristic for now.
`gnnProbability` is `null` until the GNN is trained. `metrics.json` reports the
**real** baseline-heuristic metrics on known-labeled sample nodes and marks the
GNN as not-yet-trained.

## Label rule (important)

```
1       -> illicit
2       -> licit
unknown -> unknown   # unlabeled — NEVER treated as licit or "safe"
```

Unknown transactions are kept in the graph for structure/visualization but are
never relabeled as licit. `validate_exports.py` enforces this.

## Why raw CSVs are not committed

`elliptic_txs_features.csv` is ~690 MB. Raw CSVs (`ml/data/raw/`, `*.csv`) and
`ml/outputs/` are git-ignored. Only the small exported JSON in `public/data/` is
committed, which is all the deployed dashboard needs.

## Phase 4 — Logistic Regression baseline

Trains a real classical baseline on the 165 anonymized node features (known
labels only) and re-exports the dashboard JSON with real model probabilities.

```bash
cd ml
source .venv/bin/activate
pip install -r requirements.txt
python training/train_baseline.py          # train + save model
python evaluation/evaluate_baseline.py      # eval val/test -> baseline_metrics.json
python export/export_baseline_dashboard.py  # real probs -> public/data/*.json
python preprocessing/validate_exports.py    # validate the export
```

Notes:

- **Logistic Regression is a baseline**, not the final model. It uses node
  features only and ignores graph structure.
- **Unknown labels are excluded** from supervised training and evaluation.
  Metrics are reported on known labels only.
- Unknown nodes still receive a prediction probability for visualization, but
  their `trueLabel` stays `unknown` — predictions never overwrite true labels.
- The train/validation/test split is **time-aware** (early steps train, later
  steps test) with a documented stratified fallback if a split is single-class.
- `gnnProbability` remains `null` until **GraphSAGE is trained in Phase 5**.

Artifacts:

```
ml/outputs/models/baseline_logistic_regression.joblib   # trained pipeline
ml/outputs/metrics/baseline_metrics.json                # full val/test metrics
```

## Phase 5 — GraphSAGE GNN

Trains a 2-layer GraphSAGE GNN (PyTorch Geometric) on the full transaction
graph and re-exports the dashboard JSON with real GNN probabilities, enabling a
baseline-vs-GNN comparison.

> **Mac M1 note:** this pipeline is **CPU-first**. MPS acceleration may be
> available on Apple Silicon but is **not required** — the default device is
> `cpu` and the code runs correctly without MPS or CUDA.

```bash
cd ml
source .venv/bin/activate
pip install -r requirements.txt
python training/train_graphsage.py          # train + save model + per-node probs
python evaluation/evaluate_graphsage.py      # eval val/test -> graphsage_metrics.json
python export/export_gnn_dashboard.py        # GNN probs -> public/data/*.json
python preprocessing/validate_exports.py     # validate the export
```

Notes:

- Known labels only in the loss (illicit=1, licit=0). Unknown nodes (y=-1) still
  pass messages through the graph but never contribute to the loss or metrics.
- Same time-aware split as Phase 4 for a fair baseline-vs-GNN comparison.
- Message passing uses an undirected view of the directed edges (reverse edges
  added) so risk signal can propagate both ways.
- Class imbalance handled with class-weighted cross-entropy; early stopping on
  validation average precision.
- After export, `gnnProbability` is the primary `fraudProbability`;
  `baselineProbability` from Phase 4 is preserved for comparison. True/unknown
  labels are never overwritten.

Artifacts:

```
ml/outputs/models/graphsage_best.pt                       # best checkpoint
ml/outputs/processed/graphsage_node_predictions.csv       # per-node GNN probs
ml/outputs/metrics/graphsage_metrics.json                 # full val/test metrics
```

## Next phase

**Phase 6** — wire the Next.js API routes (`/api/graph`, `/api/node/[id]`,
`/api/metrics`, `/api/suspicious`) to serve the exported JSON, replacing direct
client fetches.


