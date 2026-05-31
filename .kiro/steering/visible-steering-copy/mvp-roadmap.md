---
inclusion: manual
---

# MVP Roadmap: Elliptic Bitcoin Fraud Graph Visualizer

Use this file when asking Kiro to generate the project step by step.

## Phase 0: Project Initialization

Goal: create a clean Next.js project structure and Kiro steering context.

Tasks:

1. Create Next.js app with TypeScript and App Router.
2. Install Tailwind CSS.
3. Install shadcn/ui.
4. Install Cytoscape.js and dashboard dependencies.
5. Create `/app`, `/components`, `/lib`, `/ml`, `/docs`, and `/public/data` folders.
6. Add this `.kiro/steering` bundle.
7. Create README skeleton.

Completion criteria:

- `npm run dev` works.
- Landing page exists.
- Dashboard route exists.
- Folder structure matches `structure.md`.

## Phase 1: Dashboard UI Shell with Mock Data

Goal: build a professional dashboard before ML is connected.

Tasks:

1. Create dashboard layout.
2. Add graph panel placeholder.
3. Add metric cards.
4. Add filter controls.
5. Add node detail panel placeholder.
6. Add top suspicious table placeholder.
7. Add model comparison placeholder.
8. Add simulation panel placeholder.

Completion criteria:

- Dashboard looks like an analytics product.
- No real dataset required yet.
- Mock data can be used.

## Phase 2: Static Graph Visualization

Goal: render a small sample transaction graph using Cytoscape.js.

Tasks:

1. Create mock `nodes.json` and `edges.json`.
2. Convert nodes and edges to Cytoscape elements.
3. Render graph in `FraudGraph`.
4. Style by risk level.
5. Add graph legend.
6. Add node selection interaction.
7. Update side panel on node click.

Completion criteria:

- Graph renders.
- User can click nodes.
- Risk color is visible.
- Unknown labels are visually distinct.

## Phase 3: Elliptic Dataset Preprocessing

Goal: prepare the real benchmark dataset for ML and dashboard export.

Tasks:

1. Add `/ml/preprocessing/load_elliptic.py`.
2. Load features, edges, labels, and time-step information.
3. Map raw transaction IDs to frontend-safe IDs.
4. Build label mapping: licit, illicit, unknown.
5. Build PyTorch Geometric `Data` object.
6. Create train/validation/test masks using known labels.
7. Preserve unknown nodes in graph structure.
8. Export a small graph sample for the frontend.

Completion criteria:

- Preprocessing script runs.
- Known/unknown labels are handled correctly.
- Sample JSON appears in `public/data`.

## Phase 4: Baseline Model

Goal: create a non-GNN baseline for comparison.

Tasks:

1. Train Logistic Regression or Random Forest on node features.
2. Use only known labels for supervised training.
3. Evaluate on validation/test split.
4. Export baseline probabilities.
5. Save baseline metrics.

Completion criteria:

- Baseline metrics are available.
- Dashboard can compare baseline vs GNN later.

## Phase 5: GraphSAGE Model

Goal: train a GNN node classifier.

Tasks:

1. Implement GraphSAGE model.
2. Train with cross-entropy loss on known training labels.
3. Validate on known validation labels.
4. Evaluate on known test labels.
5. Export predicted probabilities for all nodes or dashboard sample nodes.
6. Export model metrics.
7. Export top suspicious nodes.

Completion criteria:

- GraphSAGE model produces predictions.
- Evaluation metrics are stored.
- JSON export is frontend-readable.

## Phase 6: Connect Real Data to Dashboard

Goal: replace mock data with exported Elliptic JSON.

Tasks:

1. Implement `/api/graph`.
2. Implement `/api/node/[id]`.
3. Implement `/api/metrics`.
4. Implement `/api/suspicious`.
5. Load graph from exported JSON.
6. Add filters for label, risk, probability, and time step.
7. Display real model metrics.
8. Display real top suspicious transactions.

Completion criteria:

- Dashboard uses real exported model output.
- User can inspect predictions.
- UI remains fast.

## Phase 7: Neighborhood Explorer

Goal: make graph exploration more useful.

Tasks:

1. Add 1-hop neighborhood view.
2. Add 2-hop neighborhood view.
3. Add selected time-step view.
4. Add reset graph view.
5. Add selected suspicious region view.

Completion criteria:

- User can explore local graph context.
- Graph does not become unreadable.

## Phase 8: Simulation Mode

Goal: add lightweight transaction injection simulation.

Tasks:

1. Create transaction injection form.
2. Allow user to connect simulated transaction to selected nodes.
3. Calculate simulated risk score using neighbor-risk heuristic.
4. Add simulated node to graph.
5. Highlight affected neighborhood.
6. Show simulation explanation.

Completion criteria:

- Simulation works without retraining GNN.
- User understands it is heuristic.
- Simulated node is visually distinct.

## Phase 9: Documentation

Goal: make the project portfolio-ready.

Tasks:

1. Write README.
2. Write `docs/architecture.md`.
3. Write `docs/dataset.md`.
4. Write `docs/model-card.md`.
5. Write `docs/limitations.md`.
6. Write `docs/demo-script.md`.
7. Add screenshots.
8. Add architecture diagram.

Completion criteria:

- Project can be understood without reading code.
- Dataset and limitation explanation are honest.

## Phase 10: Deployment

Goal: deploy the dashboard to Vercel.

Tasks:

1. Ensure app builds locally.
2. Ensure Python is not required at runtime.
3. Ensure exported JSON files are included.
4. Deploy to Vercel.
5. Add live demo link to README.
6. Test dashboard after deploy.

Completion criteria:

- Public demo works.
- Graph renders online.
- No server crash from missing ML dependencies.

## Phase 11: Optional Upgrades

Only after MVP works:

1. Add Hugging Face Spaces ML inference backend.
2. Add Neo4j AuraDB for graph queries.
3. Add GAT explanation experiment.
4. Add temporal graph animation.
5. Add graph embedding projection.
6. Add more model comparison experiments.
7. Add Dockerized ML pipeline.

Do not start upgrades before deployment.
