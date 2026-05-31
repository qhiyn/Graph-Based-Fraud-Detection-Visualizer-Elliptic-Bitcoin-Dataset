---
inclusion: auto
name: api-frontend
description: Use this when building the Next.js dashboard, graph visualization, API routes, filters, node detail panel, charts, or simulation mode.
---

# API and Frontend Steering

## Dashboard Purpose

The dashboard should turn Elliptic Bitcoin model output into an understandable visual product.

The user should quickly understand:

- each node is a Bitcoin transaction,
- each edge is a transaction-flow relationship,
- red/high-risk nodes are predicted suspicious,
- unknown labels are unlabeled, not safe,
- the GNN uses graph relationships to improve risk prediction.

## Dashboard Layout

Use a professional analytics layout:

```txt
┌─────────────────────────────────────────────────────────────┐
│ Header: title, dataset badge, model badge, deploy badge      │
├──────────────────┬──────────────────────────────────────────┤
│ Filters + Metrics│ Interactive Graph Canvas                  │
│                  │                                          │
│                  │                                          │
├──────────────────┼──────────────────────────────────────────┤
│ Model Comparison │ Selected Node Details + Explanation        │
├──────────────────┴──────────────────────────────────────────┤
│ Top Suspicious Transactions + Simulation Panel               │
└─────────────────────────────────────────────────────────────┘
```

## Required Frontend Components

Create these components:

- `FraudGraph`
- `GraphFilters`
- `GraphLegend`
- `GraphToolbar`
- `NodeDetailPanel`
- `TimeStepSelector`
- `NeighborhoodExplorer`
- `ModelComparisonCard`
- `RiskDistributionChart`
- `LabelDistributionChart`
- `TopSuspiciousTable`
- `SimulationPanel`
- `TransactionInjectionForm`

## API Routes

### `GET /api/graph`

Returns dashboard graph sample.

Response:

```json
{
  "success": true,
  "data": {
    "nodes": [],
    "edges": [],
    "metadata": {
      "sampleName": "top_suspicious_2hop",
      "nodeCount": 1000,
      "edgeCount": 2500
    }
  }
}
```

### `GET /api/node/[id]`

Returns full node detail.

Response:

```json
{
  "success": true,
  "data": {
    "id": "tx_12345",
    "trueLabel": "unknown",
    "predictedLabel": "illicit",
    "fraudProbability": 0.84,
    "riskLevel": "high",
    "timeStep": 32,
    "degree": 16,
    "inDegree": 7,
    "outDegree": 9,
    "knownLabel": false,
    "explanation": [
      "The transaction is unlabeled in the original dataset.",
      "The model predicts high illicit probability.",
      "The local neighborhood contains several high-risk transactions."
    ]
  }
}
```

### `GET /api/metrics`

Returns model and baseline metrics.

Response:

```json
{
  "success": true,
  "data": {
    "baseline": {
      "name": "Logistic Regression",
      "rocAuc": 0.0,
      "f1": 0.0,
      "precision": 0.0,
      "recall": 0.0
    },
    "gnn": {
      "name": "GraphSAGE",
      "rocAuc": 0.0,
      "f1": 0.0,
      "precision": 0.0,
      "recall": 0.0
    }
  }
}
```

### `GET /api/suspicious`

Returns top suspicious transaction nodes.

Response:

```json
{
  "success": true,
  "data": [
    {
      "nodeId": "tx_12345",
      "fraudProbability": 0.91,
      "riskLevel": "high",
      "trueLabel": "illicit",
      "timeStep": 32
    }
  ]
}
```

### `POST /api/simulate`

Runs lightweight transaction injection simulation.

Request:

```json
{
  "connectToNodeIds": ["tx_12345", "tx_67890"],
  "timeStep": 33,
  "amountCategory": "high"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "simulatedNodeId": "sim_tx_001",
    "simulatedRiskScore": 0.87,
    "riskLevel": "high",
    "explanation": [
      "Connected to high-risk transaction tx_12345.",
      "Average neighbor risk is high.",
      "The simulated transaction appears in a risky local neighborhood."
    ]
  }
}
```

## Simulation Rules

Simulation must be described as a heuristic, not a retrained GNN.

Use a lightweight formula:

```txt
simulatedRisk =
  0.45 * averageNeighborRisk
+ 0.25 * highRiskNeighborRatio
+ 0.15 * predictedIllicitNeighborRatio
+ 0.10 * timeStepRiskFactor
+ 0.05 * degreeGrowthFactor
```

Clamp the score between 0 and 1.

## Cytoscape Styling Rules

Node visual encoding:

- high risk: strong warning color,
- medium risk: caution color,
- low risk: calm color,
- unknown true label: distinct border or pattern,
- selected node: thick outline,
- simulated node: dashed border.

Do not rely only on color. Always show text labels or badges in the side panel.

Edge visual encoding:

- directed edge style,
- subtle arrows,
- low visual weight unless selected.

## Filter Requirements

Dashboard filters:

- risk level,
- true label: licit, illicit, unknown,
- predicted label,
- fraud probability threshold,
- time step,
- neighborhood depth: 1-hop or 2-hop,
- show only selected suspicious region.

## Node Detail Panel

When user clicks a node, show:

- transaction ID,
- true label,
- predicted label,
- fraud probability,
- risk level,
- time step,
- in-degree,
- out-degree,
- known/unknown label status,
- explanation bullets,
- baseline probability if available,
- GNN probability if available.

## UX Rules

The dashboard must not feel like a raw academic notebook.

Make it feel like a product:

- clear empty states,
- loading states,
- error states,
- responsive layout,
- dashboard cards,
- badges,
- tooltips,
- short explanations.

## Error Response Shape

All API errors should follow:

```json
{
  "success": false,
  "error": {
    "message": "Graph data could not be loaded.",
    "code": "GRAPH_LOAD_ERROR"
  }
}
```

## Frontend Critical Rule

The frontend must work using static exported JSON. Do not make the dashboard dependent on a live Python backend.
