// Baseline-vs-GNN disagreement signal. When the two models strongly disagree
// the node is worth an analyst's attention.
export const DISAGREEMENT_THRESHOLD = 0.35;

export interface Disagreement {
  disagree: boolean;
  direction: "baseline-high" | "gnn-high" | null;
  label: string | null;
}

export function getDisagreement(
  baseline: number | null | undefined,
  gnn: number | null | undefined
): Disagreement {
  if (baseline == null || gnn == null) return { disagree: false, direction: null, label: null };
  const diff = gnn - baseline;
  if (Math.abs(diff) < DISAGREEMENT_THRESHOLD) return { disagree: false, direction: null, label: null };
  return diff > 0
    ? { disagree: true, direction: "gnn-high", label: "Baseline low / GNN high" }
    : { disagree: true, direction: "baseline-high", label: "Baseline high / GNN low" };
}
