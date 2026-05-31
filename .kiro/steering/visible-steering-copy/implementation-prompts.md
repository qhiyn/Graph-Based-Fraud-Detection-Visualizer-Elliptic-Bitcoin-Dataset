---
inclusion: manual
---

# Implementation Prompts for Kiro CLI

Use these prompts step by step. Do not ask Kiro to build the entire project in one prompt.

## Prompt 1: Initialize Project Structure

Create the project structure for a Next.js App Router project called Graph-Based Fraud Detection Visualizer. Follow `.kiro/steering/structure.md`. Add folders for app routes, components, lib types, public data, docs, and ml pipeline. Create placeholder pages for `/`, `/dashboard`, and `/methodology`. Do not implement ML yet.

## Prompt 2: Build Dashboard Shell

Build the dashboard UI shell using Next.js, TypeScript, Tailwind, and shadcn/ui. The dashboard should include placeholder sections for graph canvas, filters, node detail panel, model metrics, top suspicious transaction table, and simulation panel. Use professional fraud analytics styling.

## Prompt 3: Add Mock Graph Data

Create mock Elliptic-style transaction graph data in `public/data`. Nodes should represent Bitcoin transactions and edges should represent transaction-flow relationships. Include licit, illicit, and unknown labels. Add risk levels and fraud probabilities. Do not use account/device/IP terminology.

## Prompt 4: Render Cytoscape Graph

Create `FraudGraph.tsx` using Cytoscape.js or react-cytoscapejs. Load mock transaction nodes and edges, convert them to Cytoscape elements, style nodes by risk level, style unknown labels distinctly, and update the node detail panel when a node is clicked.

## Prompt 5: Add Filters and Node Details

Implement graph filters for risk level, true label, predicted label, fraud probability threshold, and time step. Add a `NodeDetailPanel` that displays transaction ID, true label, predicted label, fraud probability, risk level, time step, degree, in-degree, out-degree, and explanation bullets.

## Prompt 6: Create ML Preprocessing Scripts

Inside `/ml`, create Python scripts to load the Elliptic Bitcoin dataset, map labels to licit/illicit/unknown, build PyTorch Geometric data objects, create train/validation/test masks using known labels only, and export dashboard-friendly JSON samples.

## Prompt 7: Train Baseline Model

Create a baseline model training script using Logistic Regression or Random Forest on node features. Evaluate using ROC-AUC, precision, recall, F1-score, and Precision@K. Export baseline probabilities and metrics to JSON.

## Prompt 8: Train GraphSAGE Model

Create a PyTorch Geometric GraphSAGE training script for node classification. Train using only known labels. Preserve unknown nodes in the graph. Evaluate on known test labels. Export GNN probabilities, predicted labels, risk levels, metrics, and top suspicious nodes.

## Prompt 9: Connect Real Exported Data

Replace mock dashboard data with exported JSON from the ML pipeline. Implement API routes `/api/graph`, `/api/node/[id]`, `/api/metrics`, and `/api/suspicious`. Make the frontend consume these APIs with loading and error states.

## Prompt 10: Add Simulation Mode

Implement transaction injection simulation. The user can create a simulated transaction node and connect it to selected existing transaction nodes. Calculate simulated risk using a heuristic based on average neighbor risk, high-risk neighbor ratio, predicted illicit neighbor ratio, time-step risk, and degree growth. Clearly label simulation as heuristic.

## Prompt 11: Write Documentation

Write README and docs files explaining project overview, dataset, architecture, ML pipeline, evaluation, simulation mode, limitations, and deployment. Include an ethical disclaimer and explain that unknown labels are not considered safe.

## Prompt 12: Prepare Vercel Deployment

Ensure the Next.js app builds without Python. Ensure exported JSON files exist in `public/data`. Remove any runtime dependency on PyTorch. Add deployment notes for Vercel. Confirm the app can run with `npm run build`.
