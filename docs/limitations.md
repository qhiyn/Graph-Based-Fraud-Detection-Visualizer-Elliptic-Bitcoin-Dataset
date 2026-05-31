# Limitations

This is an educational / portfolio project. It is **not** a production fraud-enforcement system, and its outputs should not drive real-world decisions.

- **Not production-ready.** No SLAs, monitoring, retraining, or human review workflow.
- **Dataset labels are limited.** Only ~23% of transactions are labeled; the model learns from a small labeled subset.
- **Unknown labels are not ground-truth negatives.** `unknown` means unlabeled, not licit/safe. It is excluded from training and evaluation and must not be interpreted as "clean."
- **The dashboard uses a sampled graph,** ~1,000 nodes, not the full 203,769-node graph. It is for visualization, not exhaustive analysis.
- **Simulation is heuristic.** The what-if score is a weighted blend of neighbor risk signals; it does **not** run or retrain GraphSAGE inference.
- **GraphSAGE results depend on the temporal split and hyperparameters.** Different splits or settings would shift the precision/recall/ROC-AUC balance.
- **No live transaction stream.** Predictions are precomputed on a fixed benchmark; there is no real-time blockchain ingestion.
- **No human analyst feedback loop.** The model does not learn from analyst review or corrections.
- **No legal or enforcement decision** should be made from this dashboard. Risk scores indicate patterns, not confirmed wrongdoing.
- **Explanations are practical summaries, not full causal explanations.** The bullet-point reasons (neighbor risk, disagreement, time step) are heuristics to aid understanding, not a formal explainability method.

## Language

Throughout the project we use careful wording — "risk", "suspicious", "illicit-labeled", "needs review" — and avoid "criminal", "confirmed fraud", or "safe unknown". A high model score is a risk signal, not proof.
