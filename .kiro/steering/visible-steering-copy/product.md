---
inclusion: always
---

# Product Steering: Graph-Based Fraud Detection Visualizer

## Project Name

**Graph-Based Fraud Detection Visualizer using the Elliptic Bitcoin Dataset**

## Product Summary

Build a portfolio-grade, interactive web dashboard that visualizes the Elliptic Bitcoin transaction graph, displays precomputed Graph Neural Network fraud-risk predictions, and allows users to explore suspicious transaction neighborhoods through filters, node inspection, and lightweight simulation.

## Core Product Direction

This project uses the **Elliptic Bitcoin benchmark dataset**. The graph should be understood like this:

- **Nodes** are Bitcoin transactions.
- **Edges** are directed relationships between transactions.
- **Labels** are `licit`, `illicit`, or `unknown`.
- **Model task** is node classification.
- **Dashboard task** is visual explanation and interactive exploration.

The project should not be framed as a production fraud enforcement tool. It is a portfolio project demonstrating graph machine learning, data processing, model evaluation, and modern dashboard engineering.

## Important Dataset Interpretation

Elliptic Bitcoin is different from an account-device-IP fraud graph.

Do not model this project as:

```txt
account -> device -> IP -> merchant
```

Model it as:

```txt
transaction node -> transaction-flow edge -> transaction node
```

A reviewer should immediately understand that the dashboard is analyzing suspicious transaction behavior in a Bitcoin transaction graph.

## Main Portfolio Value

The project should communicate this message:

> I can build a full-stack machine learning product that combines graph data, GNN-based risk scoring, interactive visualization, model evaluation, and clean Vercel deployment.

## Target Viewer

The primary viewer is a technical recruiter, ML engineer, data scientist, lecturer, or interviewer.

The dashboard should be understandable by someone who is not a blockchain expert. It must include plain explanations of:

- what each node means,
- what each edge means,
- what licit, illicit, and unknown mean,
- how the model predicts risk,
- why graph relationships matter.

## MVP Product Goals

The MVP must include:

1. A deployed Next.js dashboard on Vercel.
2. A landing page explaining the project.
3. A main dashboard with an interactive Cytoscape.js graph.
4. Risk-based node coloring.
5. Node detail inspection.
6. Filters for risk level, label type, prediction confidence, and time step.
7. Model metrics panel.
8. Baseline-vs-GNN comparison.
9. Top suspicious transactions table.
10. Local neighborhood exploration.
11. Lightweight transaction injection simulation.
12. Methodology page explaining data, model, evaluation, and limitations.

## MVP Non-Goals

Do not build these for the first version:

- real-time blockchain ingestion,
- real Bitcoin wallet investigation,
- real financial enforcement workflow,
- authentication,
- paid database dependency,
- live PyTorch Geometric inference inside Vercel,
- full Neo4j graph database integration,
- WebSockets,
- model retraining from the UI,
- large-scale full graph rendering in the browser.

## Product Positioning

Use this title for the README and landing page:

**Interactive Graph-Based Bitcoin Fraud Detection Dashboard with GNN Risk Scoring**

Alternative shorter title:

**Elliptic Bitcoin Fraud Graph Visualizer**

## User Journey

1. User opens the landing page.
2. User reads that the app detects suspicious Bitcoin transactions using graph ML.
3. User opens the dashboard.
4. User sees a graph of transaction nodes and directed transaction-flow edges.
5. User filters for high-risk or illicit transactions.
6. User clicks a suspicious node.
7. Side panel explains the node label, predicted risk, probability, time step, and graph neighborhood information.
8. User compares rule-based or classical baseline performance against the GNN model.
9. User opens local neighborhood mode to inspect nearby transaction flow.
10. User uses simulation mode to add a hypothetical transaction connected to risky neighbors.
11. Dashboard returns a heuristic simulated risk score.
12. User understands the purpose and limitations of the model.

## Product Language Rules

Use careful language:

Good wording:

- suspicious transaction
- high-risk transaction
- predicted illicit probability
- model risk score
- graph-based signal
- unlabeled transaction

Avoid wording:

- criminal transaction
- guaranteed fraud
- confirmed illegal
- guilty account
- safe unknown transaction

The model predicts risk. It does not prove criminal behavior.

## Success Criteria

The MVP is successful when:

- The graph renders clearly and quickly.
- A reviewer can understand the project within 60 seconds.
- The dashboard works from precomputed JSON files.
- The UI looks like a serious analytics product.
- The model evaluation is visible and honest.
- Unknown labels are handled correctly.
- The project deploys cleanly to Vercel.

## Critical Product Constraint

The deployed Vercel dashboard must work without Python, PyTorch, or PyTorch Geometric at runtime.

The ML pipeline runs offline. The dashboard consumes exported JSON.
