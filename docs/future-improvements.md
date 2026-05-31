# Future Improvements

Realistic next steps, roughly ordered from quick wins to larger efforts.

- **Threshold tuning.** The current 0.5 decision threshold over-flags; tuning per the operating point (or per Precision@K target) would improve precision/recall balance.
- **Graph Attention Network (GAT).** Attention weights could improve performance and provide per-neighbor explanation.
- **Temporal GNN.** Model the 49 time steps explicitly (e.g., EvolveGCN / temporal message passing) to capture how risk evolves over time.
- **Neighbor sampling.** Use mini-batch neighbor sampling (GraphSAGE-style loaders) so training scales to graphs larger than full-batch memory allows.
- **Graph embedding visualization.** Project learned node embeddings (UMAP / t-SNE) to show clustering of illicit vs licit transactions.
- **Analyst feedback loop.** Let reviewers confirm/dismiss flagged transactions and feed corrections back into training.
- **Neo4j integration.** Back the graph with a graph database for richer neighborhood queries beyond the sampled subgraph.
- **External FastAPI inference service.** Optionally serve live model inference from a separate Python service (kept out of Vercel) for on-demand scoring.
- **Richer explainability.** Add a formal method (e.g., GNNExplainer / integrated gradients) instead of the current practical bullet summaries.
- **Multiple dashboard samples.** Export several focused subgraphs (per time step, per illicit cluster) and let users switch between them.
- **Performance optimization.** Diff Cytoscape elements in place instead of remounting the component on every view change, preserving zoom/pan.
