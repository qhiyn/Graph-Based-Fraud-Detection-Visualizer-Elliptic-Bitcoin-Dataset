# Kiro Steering Bundle: Elliptic Bitcoin Fraud Graph Visualizer

This ZIP contains Kiro steering files for building a portfolio project:

**Graph-Based Fraud Detection Visualizer using the Elliptic Bitcoin Dataset**

## Important

The actual Kiro steering files are inside:

```txt
.kiro/steering/
```

Some operating systems hide folders starting with a dot, such as `.kiro`. To make the files easy to inspect, this ZIP also includes a visible duplicate folder:

```txt
visible-steering-copy/
```

Use `.kiro/steering/` in your real project.

## Project Direction

The project uses the Elliptic Bitcoin benchmark dataset.

- Nodes are Bitcoin transactions.
- Edges are transaction-flow relationships.
- Labels are licit, illicit, and unknown.
- The ML task is graph node classification.
- The dashboard visualizes precomputed model predictions.
- The frontend is deployed on Vercel.
- PyTorch Geometric runs offline, not inside Vercel.

## Recommended Usage

Copy `.kiro/steering/` into your project root.

Then use Kiro CLI step by step with the prompts in:

```txt
.kiro/steering/implementation-prompts.md
```

Do not ask Kiro to build the full project in one prompt. Build the MVP phase by phase.

## Files Included

```txt
.kiro/steering/
├── api-frontend.md
├── critical-rules.md
├── implementation-prompts.md
├── ml-data.md
├── mvp-roadmap.md
├── product.md
├── references.md
├── structure.md
└── tech.md
```
