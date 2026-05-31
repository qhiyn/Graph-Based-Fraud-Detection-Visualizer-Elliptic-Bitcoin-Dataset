# Deployment

The dashboard deploys to **Vercel as a frontend-only Next.js app**. No Python runs in production.

## What runs in production

- The Next.js app (pages + API route handlers).
- API routes read the committed `public/data/*.json` at request time.
- Client-side Cytoscape graph rendering.

## What does NOT run in production

- Python, pandas, scikit-learn, PyTorch, PyTorch Geometric.
- The `/ml` pipeline (offline only).
- Any database, GPU, or background job.

## Data and artifacts

- **Committed:** `public/data/*.json` (the exported dashboard data). These **must** be present for the app to work.
- **Git-ignored:** raw CSVs (`ml/data/raw/`), model artifacts (`*.pt`, `*.pkl`), and `ml/outputs/`.

## Environment variables

None required for the MVP.

## Deployment checklist

```txt
1. npm run build                         # confirm the build passes
2. git status                            # review changes
3. confirm public/data/*.json exists     # nodes/edges/metrics/predictions/explanations
4. confirm raw CSV not committed          # ml/data/raw/ must be git-ignored
5. deploy to Vercel                       # import the repo or `vercel` CLI
6. add the live link to README.md         # replace "Coming soon"
```

## Notes

- `next.config.ts` sets `outputFileTracingIncludes` so the API route bundles include `public/data/**` on Vercel.
- To update the deployed data, re-run the `/ml` pipeline locally (it overwrites `public/data/*.json`), commit the JSON, and redeploy.
