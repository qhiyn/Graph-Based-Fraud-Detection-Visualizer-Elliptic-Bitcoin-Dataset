# Graph-Based Fraud Detection Visualizer

Interactive Graph-Based Fraud Detection Dashboard using **GraphSAGE** and the **Elliptic Bitcoin Dataset**.

## Overview

This project visualizes Bitcoin transaction-graph fraud risk. Each node is a Bitcoin transaction and each edge is a directed transaction-flow relationship. A Graph Neural Network (GraphSAGE) is trained **offline** to estimate the probability that a transaction is illicit, and the dashboard renders the precomputed predictions as an interactive graph with filtering, neighborhood exploration, model comparison, and a heuristic "what-if" simulation mode.

The project demonstrates an end-to-end machine-learning product: graph data preprocessing, a classical baseline, a GNN, honest model evaluation, and a polished, deployable dashboard — with **no Python required at runtime**.

## Live Demo

Live demo: **Coming soon** (Vercel).

## Screenshots

> Screenshot: add a dashboard screenshot after deployment (e.g. `docs/assets/dashboard.png`).

## Key Features

- Interactive Cytoscape.js transaction graph with risk-based coloring
- Logistic Regression baseline vs GraphSAGE GNN comparison
- Top suspicious transactions ranked by GraphSAGE probability
- Selected-node 1-hop / 2-hop neighborhood explorer
- Suspicious-region, high-risk, and time-step focus modes
- Node detail panel with neighborhood summary and model-disagreement signal
- Clear **unknown-label** warnings (unknown ≠ safe)
- Heuristic transaction-injection **simulation mode** (not retrained inference)
- Frontend-only deployment on Vercel

## Why This Project Matters

Fraud analysts can only review a limited number of flagged transactions, so **ranking quality** (which transactions to inspect first) matters more than raw accuracy. This project shows that a graph-aware model can dramatically improve top-ranked prioritization even when a simpler metric like ROC-AUC does not improve — and presents that tradeoff honestly.

## Tech Stack

**Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Cytoscape.js, TanStack Query, Recharts, Lucide.
**ML (offline):** Python, pandas, NumPy, scikit-learn, NetworkX, PyTorch, PyTorch Geometric.
**Deployment:** Vercel (dashboard only).

## System Architecture

```txt
Elliptic CSV files
      ↓
Offline Python ML pipeline   (/ml)
      ↓
Precomputed JSON exports     (public/data/*.json)
      ↓
Next.js API routes           (/api/*)
      ↓
TanStack Query
      ↓
Cytoscape dashboard
      ↓
Vercel deployment
```

See [docs/architecture.md](docs/architecture.md) for details.

## Dataset

The [Elliptic Bitcoin dataset](https://www.kaggle.com/datasets/ellipticco/elliptic-data-set) is a graph-based financial-fraud benchmark.

| Property | Value |
|---|---|
| Nodes (transactions) | 203,769 |
| Edges (directed flow) | 234,355 |
| Illicit (class 1) | 4,545 |
| Licit (class 2) | 42,019 |
| Unknown (unlabeled) | 157,205 |
| Time steps | 49 |
| Anonymized features | 165 |

**Unknown means unlabeled — not safe.** Unknown nodes are excluded from supervised training/evaluation but still participate in the graph. The browser renders a sampled subgraph (~1,000 nodes) for readability; see [docs/dataset.md](docs/dataset.md).

## Machine Learning Pipeline

1. **Preprocessing** — load CSVs, map labels (1→illicit, 2→licit, unknown→unknown), build the graph, derive features.
2. **Logistic Regression baseline** — trained on the 165 node features (known labels only).
3. **GraphSAGE GNN** — 2-layer SAGEConv trained on the full graph with class-weighted loss; unknown nodes pass messages but are excluded from the loss.
4. **Export** — predictions and metrics are written to `public/data/*.json` for the dashboard.

A **time-aware split** is used (train time steps ≤ 34, validation 35–41, test ≥ 42). See [docs/model-card.md](docs/model-card.md).

## Baseline vs GraphSAGE Results

Evaluated on known test labels (illicit = 1, licit = 0):

| Metric | Logistic Regression | GraphSAGE |
|---|---|---|
| ROC-AUC | **0.855** | 0.796 |
| Average Precision | 0.200 | **0.429** |
| Precision@50 | 0.06 | **0.94** |
| Precision@100 | 0.15 | **0.89** |

**Honest interpretation:** Logistic Regression has the higher ROC-AUC, but GraphSAGE is far stronger at the metrics that matter for fraud triage — Average Precision and Precision@K. An analyst reviewing the top 50 flagged transactions would find ~94% truly illicit with GraphSAGE versus ~6% with the baseline. ROC-AUC is a weak signal on heavily imbalanced data, so the ranking improvement is the headline result.

## Interactive Dashboard Features

- **Filters:** risk level, class label, minimum fraud probability, time step.
- **View modes:** all, high-risk, selected-node neighborhood (1/2-hop), time-step focus, suspicious region, simulated region.
- **Node detail panel:** true/predicted label, baseline and GraphSAGE probabilities, risk level, degrees, neighborhood summary, disagreement badge, and explanation bullets.
- **Top suspicious table:** ranked by GraphSAGE, with a "needs review" badge where baseline and GraphSAGE disagree.

## Simulation Mode

A lightweight **heuristic** what-if tool: inject a hypothetical transaction, connect it to selected/high-risk/suspicious transactions, and get an estimated risk score from a weighted blend of neighbor risk signals. The simulated node and edges appear in the graph as a dashed-purple diamond. **This does not run or retrain GraphSAGE** — every result says so.

## Unknown Label Handling

`unknown` is treated as **unlabeled, not safe**:

- excluded from supervised training and from all evaluation metrics;
- visually distinct in the graph (dashed gray border);
- flagged in the detail panel ("unknown is not the same as safe");
- never relabeled as licit.

## Ethical and Practical Limitations

This is an **educational / portfolio** project, not a production fraud-enforcement system. Model predictions indicate risk patterns in benchmark data and are **not** proof of illegal activity. See [docs/limitations.md](docs/limitations.md).

## Local Setup

```bash
npm install
npm run dev      # http://localhost:3000
```

The dashboard runs entirely on the committed JSON in `public/data/` — no Python needed.

## ML Pipeline Setup

The ML pipeline is offline and optional (only needed to regenerate data). See [ml/README.md](ml/README.md):

```bash
cd ml
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python preprocessing/inspect_dataset.py
python training/train_baseline.py
python evaluation/evaluate_baseline.py
python training/train_graphsage.py
python evaluation/evaluate_graphsage.py
python export/export_gnn_dashboard.py
python preprocessing/validate_exports.py
```

## Deployment Notes

Deploy the Next.js app to Vercel. Python never runs in production — API routes read the committed `public/data/*.json`. See [docs/deployment.md](docs/deployment.md).

## Future Improvements

Threshold tuning, GAT / temporal GNNs, neighbor sampling for larger graphs, embedding visualization, an analyst feedback loop, and Cytoscape render optimization. See [docs/future-improvements.md](docs/future-improvements.md).

## Documentation

- [Architecture](docs/architecture.md)
- [Dataset](docs/dataset.md)
- [Model Card](docs/model-card.md)
- [Limitations](docs/limitations.md)
- [Demo Script](docs/demo-script.md)
- [Deployment](docs/deployment.md)
- [Future Improvements](docs/future-improvements.md)
