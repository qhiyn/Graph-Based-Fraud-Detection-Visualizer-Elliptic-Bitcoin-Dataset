---
inclusion: manual
---

# References and Research Notes

Use this file when documenting the project or checking terminology.

## Main Dataset

### Elliptic Bitcoin Dataset

Use the Elliptic Bitcoin dataset as the benchmark dataset for this project.

Important interpretation:

- Nodes are Bitcoin transactions.
- Edges represent transaction-flow relationships.
- Labels include licit, illicit, and unknown transactions.
- The task is node classification.

## PyTorch Geometric

Use PyTorch Geometric for the GNN pipeline.

Recommended model order:

1. GraphSAGE
2. GCN
3. GAT as optional upgrade

## Cytoscape.js

Use Cytoscape.js for the interactive graph visualization.

It is suitable for:

- graph rendering,
- node styling,
- edge styling,
- node selection,
- layout algorithms,
- local neighborhood interaction.

## Vercel

Use Vercel for the Next.js dashboard only.

Do not run heavy ML training or PyTorch Geometric inside Vercel.

## Documentation Notes

The final README and methodology page should explain:

- what the Elliptic dataset represents,
- why GNNs are suitable for graph fraud detection,
- why unknown labels are handled carefully,
- why the deployed demo uses precomputed predictions,
- why dashboard visualization uses subgraphs.

## Suggested README Wording

Use wording like:

> This project uses the Elliptic Bitcoin benchmark dataset to build a graph-based fraud detection dashboard. Each node represents a Bitcoin transaction and each edge represents a transaction-flow relationship. A Graph Neural Network model is trained offline to estimate the probability that a transaction is illicit. The deployed dashboard visualizes precomputed model outputs and allows interactive exploration of suspicious transaction neighborhoods.

## Ethical Disclaimer

Include this in the README or methodology page:

> This dashboard is for educational and portfolio demonstration purposes only. Model predictions indicate risk patterns in benchmark data and should not be interpreted as proof of illegal activity.
