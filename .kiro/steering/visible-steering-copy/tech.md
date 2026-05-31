---
inclusion: always
---

# Technical Steering

## Final MVP Architecture

Use this architecture for the first deployable version:

```txt
Browser
  ↓
Vercel-hosted Next.js App
  ↓
Next.js Route Handlers or static JSON fetch
  ↓
Precomputed exported Elliptic graph + predictions
```

Do not require Python at runtime in the Vercel deployment.

## Frontend Stack

Use:

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Cytoscape.js or react-cytoscapejs
- TanStack Query
- Zustand
- Recharts
- Lucide React

## ML Stack

Use Python in `/ml` only:

- Python 3.10+
- PyTorch
- PyTorch Geometric
- scikit-learn
- pandas
- numpy
- NetworkX for preprocessing and graph analysis
- matplotlib only for offline charts

The frontend must not import Python output directly. The ML pipeline must export JSON into `public/data` or another frontend-readable folder.

## Graph Visualization

Use Cytoscape.js as the main graph rendering library.

Reason:

- The project is graph-first.
- Cytoscape.js supports node-link layouts, graph styling, selection, filtering, and local neighborhood exploration.
- It is more suitable than normal chart libraries for this project.

Use Recharts only for metric charts such as:

- risk distribution,
- label distribution,
- model comparison,
- confusion matrix summary,
- Precision@K chart.

## Dataset Source

Use the Elliptic Bitcoin benchmark dataset through either:

1. PyTorch Geometric dataset loader, if available in the implementation environment.
2. Raw Elliptic dataset files, if downloaded manually.

The code should be flexible enough to support both if possible.

## Model Recommendation

Start with one practical baseline and one GNN.

Baseline options:

- Logistic Regression
- Random Forest
- simple rule score based on graph features

GNN options:

- GraphSAGE as recommended first choice
- GCN as simpler alternative
- GAT only as later upgrade

For MVP, prefer GraphSAGE because it is a strong practical default for graph node classification and is easier to explain than a complex attention model.

## Deployment Strategy

Deploy only the dashboard to Vercel.

Do not deploy:

- PyTorch model training,
- PyTorch Geometric runtime,
- long inference jobs,
- dataset preprocessing jobs,
- large raw dataset files.

The deployed app should only need:

- static JSON,
- Next.js APIs,
- client-side graph visualization.

## Optional Backend Later

Only after the MVP is deployed, consider:

- Hugging Face Spaces for live ML inference demo,
- Render for FastAPI backend,
- Railway for experimental backend,
- Neo4j AuraDB for graph-native querying.

These are not part of the first MVP.

## Data Export Contract

The ML pipeline must export these files:

```txt
public/data/
├── graph-sample.json
├── nodes.json
├── edges.json
├── predictions.json
├── metrics.json
├── top-suspicious.json
├── timestep-summary.json
└── explanations.json
```

Recommended `nodes.json` shape:

```json
[
  {
    "id": "tx_12345",
    "label": "Transaction 12345",
    "trueLabel": "illicit",
    "predictedLabel": "illicit",
    "riskLevel": "high",
    "fraudProbability": 0.91,
    "timeStep": 32,
    "degree": 14,
    "inDegree": 5,
    "outDegree": 9,
    "knownLabel": true
  }
]
```

Recommended `edges.json` shape:

```json
[
  {
    "id": "edge_00001",
    "source": "tx_12345",
    "target": "tx_67890",
    "type": "transaction_flow",
    "directed": true
  }
]
```

Recommended `metrics.json` shape:

```json
{
  "modelName": "GraphSAGE",
  "baselineName": "Logistic Regression",
  "rocAuc": 0.0,
  "f1": 0.0,
  "precision": 0.0,
  "recall": 0.0,
  "precisionAtK": {
    "k50": 0.0,
    "k100": 0.0,
    "k500": 0.0
  },
  "confusionMatrix": {
    "truePositive": 0,
    "falsePositive": 0,
    "trueNegative": 0,
    "falseNegative": 0
  }
}
```

## TypeScript Requirements

Create shared types:

```ts
export type TransactionLabel = "licit" | "illicit" | "unknown";
export type RiskLevel = "low" | "medium" | "high";
export type PredictionLabel = "licit" | "illicit";

export interface TransactionNode {
  id: string;
  label: string;
  trueLabel: TransactionLabel;
  predictedLabel?: PredictionLabel;
  riskLevel: RiskLevel;
  fraudProbability: number;
  timeStep?: number;
  degree?: number;
  inDegree?: number;
  outDegree?: number;
  knownLabel: boolean;
}

export interface TransactionEdge {
  id: string;
  source: string;
  target: string;
  type: "transaction_flow";
  directed: boolean;
}
```

## Runtime Performance Target

The browser dashboard should render a graph sample, not necessarily the entire raw dataset.

Recommended dashboard graph size:

- 300 to 1,500 nodes
- 500 to 4,000 edges

If the raw dataset is bigger, export smaller useful subgraphs:

- high-risk neighborhood,
- selected time step,
- top suspicious nodes and their 1-hop/2-hop neighbors,
- known illicit cluster sample.

## Package Installation Suggestion

For frontend:

```bash
npm install cytoscape react-cytoscapejs @tanstack/react-query zustand recharts lucide-react
```

For Python ML:

```bash
pip install torch torch-geometric scikit-learn pandas numpy networkx matplotlib
```

Install PyTorch Geometric according to the user machine's CUDA/CPU environment if needed.
