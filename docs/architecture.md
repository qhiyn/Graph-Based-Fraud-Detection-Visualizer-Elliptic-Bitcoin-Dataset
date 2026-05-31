# Architecture

The project has two clearly separated halves: an **offline Python ML pipeline** (`/ml`) and a **frontend-only Next.js dashboard** deployed to Vercel. They are connected only by precomputed JSON files in `public/data/`.

## Data flow

```txt
Elliptic CSV files
      ↓
Offline Python ML pipeline   (/ml)
      ↓
Precomputed JSON exports     (public/data/*.json)
      ↓
Next.js API routes           (/api/*)
      ↓
TanStack Query
      ↓
Cytoscape dashboard
      ↓
Vercel deployment
```

## Frontend architecture

- **Next.js App Router** with TypeScript and Tailwind CSS.
- Pages: `/` (landing), `/dashboard` (interactive graph analytics), `/methodology` (technical explanation).
- **Cytoscape.js** renders the transaction graph (client-only, loaded via `next/dynamic` with `ssr: false`).
- **TanStack Query** hooks (`useGraphData`, `useMetrics`, `useNodeDetail`, `useSuspiciousTransactions`) fetch from the API routes with loading / error / empty states.
- Graph transforms (`buildGraphView`, `buildCytoscapeElements`, `filterGraph`, `getNodeNeighborhood`, `getDisagreement`) live in `lib/graph`.

## API route architecture

Route handlers under `app/api/` return a consistent envelope:

```ts
{ success: true, data: T } | { success: false, error: { message, code } }
```

- `GET /api/graph` — sampled nodes + edges.
- `GET /api/node/[id]` — node detail + explanation (404 if missing).
- `GET /api/metrics` — baseline and GraphSAGE metrics.
- `GET /api/suspicious` — top transactions ranked by GraphSAGE probability.
- `POST /api/simulate` — heuristic what-if score (no ML inference).

Routes read JSON via a server-only helper (`lib/data/readJsonFile.ts`) from `public/data/`. `next.config.ts` uses `outputFileTracingIncludes` so the JSON ships with the route bundles on Vercel.

## Static JSON data flow

`public/data/` is the single contract between ML and UI:

```txt
nodes.json         predictions.json
edges.json         explanations.json
metrics.json
```

The frontend never imports `/ml` and never reads CSVs. To refresh the dashboard, re-run the `/ml` pipeline, which overwrites these JSON files.

## ML offline pipeline

`/ml` contains preprocessing, the Logistic Regression baseline, the GraphSAGE GNN, evaluation, and the dashboard exporters. It uses pandas / scikit-learn / PyTorch / PyTorch Geometric. Heavy artifacts (raw CSVs, `.pt`/`.pkl` models, `ml/outputs/`) are git-ignored.

## Why Python does not run in production

PyTorch and PyTorch Geometric are large and slow to cold-start, and the predictions are static for a fixed dataset. Running inference per request would add cost and latency for no benefit. Instead, the model runs once offline and the dashboard serves precomputed predictions.

## Why Vercel hosts only the dashboard

Vercel is ideal for the Next.js frontend and lightweight JSON-reading API routes. The deployed app needs only static JSON, Node-runtime API routes, and client-side graph rendering — no Python, GPU, database, or background jobs.
