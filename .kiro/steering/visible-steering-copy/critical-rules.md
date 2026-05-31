---
inclusion: always
---

# Critical Rules for the AI Agent

## Highest Priority

Build a working, polished, deployable MVP first.

Do not over-engineer.

Do not start with database complexity.

Do not start with live ML inference.

## Dataset Rules

1. The chosen dataset is Elliptic Bitcoin.
2. Nodes are Bitcoin transactions.
3. Edges are directed transaction-flow relationships.
4. Labels are licit, illicit, and unknown.
5. Unknown is not the same as licit.
6. Unknown labels must not be used as normal class labels during supervised training.
7. Unknown nodes may remain in the graph for message passing and visualization.
8. The dashboard must explain what unknown means.

## Architecture Rules

1. Vercel hosts the Next.js dashboard.
2. PyTorch and PyTorch Geometric run offline in `/ml`.
3. The deployed Vercel app must not require Python runtime.
4. The web app consumes exported JSON.
5. Do not put raw large datasets into the client bundle.
6. Use graph samples for dashboard visualization.
7. Add external ML backend only after the MVP is already working.

## ML Rules

1. Train on known labels only unless explicitly implementing semi-supervised learning.
2. Evaluate only on known labels.
3. Report metrics honestly.
4. Include baseline-vs-GNN comparison.
5. Use Precision@K because fraud investigation often reviews top-ranked risky nodes.
6. Do not claim production readiness.
7. Do not claim a prediction proves illegal activity.
8. Export predictions and metrics to JSON.

## Frontend Rules

1. Use TypeScript types.
2. Use Cytoscape.js for graph rendering.
3. Use filters to prevent graph clutter.
4. Render subgraphs, not the entire raw dataset by default.
5. Show risk using both color and text.
6. Make selected node details clear.
7. Distinguish true label from predicted label.
8. Distinguish unknown labels from known labels.
9. Add loading and error states.
10. Keep the UI professional and portfolio-ready.

## Simulation Rules

1. Simulation is heuristic.
2. Simulation does not retrain the GNN.
3. Simulation injects a hypothetical transaction node.
4. Simulation connects that node to selected existing transaction nodes.
5. Simulation calculates risk based on neighbor predictions.
6. Simulation must be labeled clearly as what-if analysis.

## Language Rules

Use:

- suspicious transaction,
- high-risk node,
- predicted illicit probability,
- model risk score,
- unlabeled transaction,
- graph-based signal.

Avoid:

- criminal,
- guilty,
- definitely illegal,
- confirmed fraud,
- safe unknown.

## Implementation Order

Follow this order:

1. UI shell.
2. Mock graph visualization.
3. Dataset preprocessing.
4. Baseline model.
5. GraphSAGE model.
6. JSON export.
7. Dashboard integration.
8. Filters and node details.
9. Simulation mode.
10. Documentation.
11. Vercel deployment.

Do not reverse this order unless there is a clear reason.

## Database Rule

Start with static JSON files.

Do not add Neon or Neo4j for the first MVP unless explicitly requested later.

Reason: database integration adds complexity but does not improve the first portfolio demo as much as a polished graph and clear ML story.

## README Required Sections

The README must include:

1. Project title.
2. Live demo link.
3. Screenshot.
4. Problem statement.
5. Dataset explanation.
6. Tech stack.
7. Architecture.
8. ML pipeline.
9. Model evaluation.
10. Dashboard features.
11. Simulation mode.
12. Limitations.
13. Local setup.
14. Deployment notes.

## Final Quality Bar

The final project should look and feel like a serious ML product, not a classroom notebook.
