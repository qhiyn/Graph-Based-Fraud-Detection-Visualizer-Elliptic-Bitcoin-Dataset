import { RiskLevel } from "@/lib/types/graph";

// Risk-level color encoding. Always paired with text labels in the UI —
// color is never the only signal (accessibility).
export const RISK_COLORS: Record<RiskLevel | "unknown", string> = {
  high: "#ef4444", // red — strong warning
  medium: "#f59e0b", // amber — caution
  low: "#22c55e", // green — calm
  unknown: "#94a3b8", // slate — fallback only
};

export function getRiskColor(level: RiskLevel | "unknown"): string {
  return RISK_COLORS[level] ?? RISK_COLORS.unknown;
}

// Risk-level mapping from fraud probability (per ml-data.md).
export function getRiskLevel(probability: number): RiskLevel {
  if (probability >= 0.75) return "high";
  if (probability >= 0.4) return "medium";
  return "low";
}
