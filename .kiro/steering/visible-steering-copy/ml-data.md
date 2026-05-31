---
inclusion: auto
name: ml-data
description: Use this when working on Elliptic Bitcoin data loading, preprocessing, model training, evaluation, prediction export, or graph sampling.
---

# ML and Dataset Steering: Elliptic Bitcoin

## Dataset Decision

The project uses the **Elliptic Bitcoin benchmark dataset**.

This dataset is suitable because it is a graph-based financial fraud benchmark. It supports a realistic GNN node-classification experiment and gives the project more credibility than a purely synthetic dataset.

## Dataset Meaning

In this project:

- A node represents a Bitcoin transaction.
- An edge represents a directed transaction-flow relationship.
- A label represents whether a transaction is licit, illicit, or unknown.
- The ML task is predicting suspicious or illicit transaction nodes.

## Critical Label Rule

Do not treat `unknown` as `licit`.

Use:

```txt
licit   = known normal/lawful transaction class
illicit = known suspicious/illicit transaction class
unknown = unlabeled transaction, not safe and not necessarily suspicious
```

During training, train on known labels only unless intentionally doing semi-supervised learning.

During visualization, show unknown labels separately.

## Recommended Label Mapping

Use clear internal label names:

```python
LABEL_LICIT = "licit"
LABEL_ILLICIT = "illicit"
LABEL_UNKNOWN = "unknown"
```

For binary training:

```txt
licit   -> 0
illicit -> 1
unknown -> mask out from supervised loss
```

## Preprocessing Steps

The preprocessing pipeline should:

1. Load raw Elliptic nodes, edges, features, and labels.
2. Map transaction IDs to stable string IDs such as `tx_12345`.
3. Preserve or derive time step information.
4. Build edge index for PyTorch Geometric.
5. Build node feature matrix.
6. Create masks for known labels.
7. Split known labels into train, validation, and test sets.
8. Keep unknown nodes in the graph structure.
9. Train using only known labels in the loss function.
10. Export predictions for all or selected nodes.
11. Export graph samples for dashboard visualization.

## Data Splitting Guidance

Avoid random splitting if it creates leakage across time.

Prefer time-aware splitting if possible:

- early time steps for training,
- middle time steps for validation,
- later time steps for testing.

If using random split for MVP, document it clearly as a limitation.

## Features

Use available Elliptic node features.

If adding graph-derived features for baseline or dashboard explanation, compute:

- degree,
- in-degree,
- out-degree,
- neighbor illicit ratio using known labels only,
- average neighbor risk after prediction,
- time step,
- local clustering if feasible,
- PageRank or centrality for sampled graph only if computationally reasonable.

## Baseline Model

Create at least one baseline before the GNN.

Recommended baseline:

- Logistic Regression using node features.

Alternative baseline:

- Random Forest using node features.

Optional simple heuristic:

- risk score based on graph degree and known suspicious-neighbor ratio.

The dashboard should show baseline performance compared to GNN performance.

## GNN Model

Recommended first GNN:

- GraphSAGE

Alternative simple model:

- GCN

Later upgrade:

- GAT for attention-based explanation.

## Training Objective

Use node classification.

Train the GNN to classify known licit vs illicit transaction nodes.

Use cross-entropy loss on known labeled training nodes.

Unknown nodes may still pass messages through the graph but should not contribute supervised loss.

## Evaluation Metrics

Use:

- ROC-AUC,
- Precision,
- Recall,
- F1-score,
- Precision@K,
- confusion matrix.

Fraud detection is imbalanced. Precision@K is especially important because analysts often inspect the highest-ranked suspicious transactions first.

## Exported Prediction Fields

Each exported prediction should include:

```json
{
  "nodeId": "tx_12345",
  "trueLabel": "illicit",
  "predictedLabel": "illicit",
  "fraudProbability": 0.91,
  "riskLevel": "high",
  "timeStep": 32,
  "knownLabel": true,
  "baselineProbability": 0.68,
  "gnnProbability": 0.91
}
```

## Risk Level Mapping

Use:

```txt
low    = fraudProbability < 0.40
medium = fraudProbability >= 0.40 and < 0.75
high   = fraudProbability >= 0.75
```

Make this configurable in `lib/graph/getRiskLevel.ts` if implemented in frontend.

## Dashboard Graph Sampling

Do not visualize the entire raw graph by default.

Export dashboard-friendly subgraphs:

1. Top suspicious transactions with 1-hop neighbors.
2. Top suspicious transactions with 2-hop neighbors.
3. A selected time-step subgraph.
4. A known illicit neighborhood sample.
5. A mixed sample with licit, illicit, and unknown nodes.

Recommended sample size:

- 300 to 1,500 nodes,
- 500 to 4,000 edges.

## Explanation Strategy

Do not claim full explainability unless a formal explanation method is implemented.

For MVP, use practical explanation fields:

- high predicted illicit probability,
- connected to high-risk neighbors,
- appears in risky time step,
- high in-degree/out-degree,
- baseline and GNN disagreement,
- known label if available,
- local neighborhood risk.

Example explanation:

> This transaction is high risk because the GNN predicts a high illicit probability and the node is connected to several other high-risk transaction nodes in its local neighborhood.

## Unknown Label Visualization

Unknown nodes must be visually separate from licit and illicit nodes.

Examples:

- different border style,
- gray label badge,
- tooltip saying `unknown/unlabeled`,
- never display unknown as safe.

## ML Documentation Requirements

Create `docs/model-card.md` with:

- dataset description,
- label mapping,
- preprocessing steps,
- model architecture,
- evaluation metrics,
- limitations,
- ethical warning,
- deployment strategy.

## ML Limitations to Mention

Always document:

1. The model is trained on benchmark data, not live blockchain monitoring.
2. Unknown labels are not ground-truth normal transactions.
3. Performance depends on dataset split strategy.
4. Dashboard graph is a sampled subgraph.
5. Predictions indicate risk, not proof of wrongdoing.
6. The deployed version uses precomputed predictions.
