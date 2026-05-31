---
inclusion: always
---

# Project Structure Steering

## Required Root Structure

Create the project with this structure:

```txt
.
├── .kiro/
│   └── steering/
├── app/
│   ├── page.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   ├── methodology/
│   │   └── page.tsx
│   └── api/
│       ├── graph/
│       │   └── route.ts
│       ├── node/
│       │   └── [id]/
│       │       └── route.ts
│       ├── metrics/
│       │   └── route.ts
│       ├── suspicious/
│       │   └── route.ts
│       └── simulate/
│           └── route.ts
├── components/
│   ├── dashboard/
│   ├── graph/
│   ├── layout/
│   ├── metrics/
│   ├── simulation/
│   └── ui/
├── lib/
│   ├── data/
│   ├── graph/
│   ├── simulation/
│   ├── types/
│   └── utils/
├── ml/
│   ├── data/
│   ├── preprocessing/
│   ├── training/
│   ├── evaluation/
│   ├── export/
│   └── notebooks/
├── public/
│   └── data/
├── docs/
│   ├── architecture.md
│   ├── dataset.md
│   ├── model-card.md
│   ├── limitations.md
│   └── demo-script.md
└── README.md
```

## Page Responsibilities

### `/`

Landing page.

Must include:

- project title,
- one-sentence summary,
- dashboard preview section,
- explanation of Elliptic Bitcoin graph,
- call-to-action link to dashboard,
- tech stack badges,
- short limitations note.

### `/dashboard`

Main graph analytics page.

Must include:

- metric cards,
- graph canvas,
- graph filters,
- node detail panel,
- top suspicious transaction table,
- baseline-vs-GNN comparison,
- simulation panel.

### `/methodology`

Technical explanation page.

Must include:

- dataset explanation,
- graph modeling explanation,
- model architecture,
- preprocessing steps,
- evaluation metrics,
- dashboard export strategy,
- ethical limitations.

## Components

### `components/graph`

Use this folder for graph visualization:

```txt
components/graph/
├── FraudGraph.tsx
├── GraphLegend.tsx
├── GraphToolbar.tsx
├── GraphFilters.tsx
├── NodeDetailPanel.tsx
├── NeighborhoodExplorer.tsx
└── TimeStepSelector.tsx
```

### `components/metrics`

Use this folder for charts and KPI cards:

```txt
components/metrics/
├── MetricCard.tsx
├── ModelComparisonCard.tsx
├── RiskDistributionChart.tsx
├── LabelDistributionChart.tsx
├── PrecisionAtKChart.tsx
└── ConfusionMatrixCard.tsx
```

### `components/simulation`

Use this folder for simulation UI:

```txt
components/simulation/
├── SimulationPanel.tsx
├── TransactionInjectionForm.tsx
├── ConnectionSelector.tsx
└── SimulationResultCard.tsx
```

## Library Files

### `lib/types`

Use for domain types:

```txt
lib/types/
├── graph.ts
├── metrics.ts
├── simulation.ts
└── api.ts
```

### `lib/data`

Use for JSON data loading:

```txt
lib/data/
├── loadGraphData.ts
├── loadMetrics.ts
├── loadPredictions.ts
├── loadSuspiciousNodes.ts
└── validateData.ts
```

### `lib/graph`

Use for graph transformations:

```txt
lib/graph/
├── buildCytoscapeElements.ts
├── filterGraph.ts
├── getNodeNeighborhood.ts
├── getRiskColor.ts
├── getTimeStepSubgraph.ts
└── summarizeGraph.ts
```

### `lib/simulation`

Use for lightweight dashboard simulation:

```txt
lib/simulation/
├── calculateSimulatedRisk.ts
├── injectTransactionNode.ts
├── buildSimulatedEdges.ts
└── explainSimulation.ts
```

## ML Folder

The `/ml` folder is separate from the deployed web app.

Suggested files:

```txt
ml/
├── README.md
├── data/
│   └── .gitkeep
├── preprocessing/
│   ├── load_elliptic.py
│   ├── build_features.py
│   ├── build_splits.py
│   └── export_graph_sample.py
├── training/
│   ├── train_baseline.py
│   ├── train_graphsage.py
│   └── models.py
├── evaluation/
│   ├── evaluate.py
│   └── metrics.py
├── export/
│   ├── export_predictions.py
│   ├── export_dashboard_json.py
│   └── export_explanations.py
└── notebooks/
    └── exploratory_analysis.ipynb
```

## Naming Rules

Use clear names tied to Bitcoin transaction graph analysis.

Good names:

- `TransactionNode`
- `TransactionEdge`
- `FraudGraph`
- `TimeStepSelector`
- `SuspiciousTransactionTable`
- `GraphSageMetricsCard`

Avoid misleading names:

- `AccountNode`
- `DeviceNode`
- `IPNode`
- `MerchantNode`

Those do not match the Elliptic Bitcoin dataset.

## Important Structure Rule

Do not mix Python ML scripts into the Next.js runtime folders.

The deployed Vercel app should work even if `/ml` is removed.
