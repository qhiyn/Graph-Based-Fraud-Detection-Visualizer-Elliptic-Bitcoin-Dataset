import { RiskLevel } from "@/lib/types/graph";

export const SIMULATION_DISCLAIMER =
  "This is a heuristic what-if score, not retrained GraphSAGE inference.";

const clamp = (n: number) => Math.max(0, Math.min(1, n));

function riskLevel(p: number): RiskLevel {
  return p >= 0.75 ? "high" : p >= 0.4 ? "medium" : "low";
}

interface SimInput {
  neighborProbabilities: number[]; // GNN risk of connected targets
  illicitLabeledNeighbors: number;
  unknownNeighbors: number;
  disagreeingNeighbors: number; // targets where baseline vs GNN disagree
  timeStepRiskFactor: number; // 0–1
  amountGrowthFactor: number; // 0–1
  degreeGrowthFactor: number; // 0–1
}

// Lightweight what-if heuristic — NOT a retrained GNN. Documented weighted blend.
export function calculateSimulatedRisk(input: SimInput): {
  simulatedRiskScore: number;
  riskLevel: RiskLevel;
  explanation: string[];
  disclaimer: string;
} {
  const p = input.neighborProbabilities;
  const n = p.length;

  const averageNeighborRisk = n ? p.reduce((a, b) => a + b, 0) / n : 0;
  const highRisk = p.filter((v) => v >= 0.75).length;
  const highRiskNeighborRatio = n ? highRisk / n : 0;
  const predictedIllicitNeighborRatio = n ? p.filter((v) => v >= 0.5).length / n : 0;
  const growth = clamp(0.5 * input.degreeGrowthFactor + 0.5 * input.amountGrowthFactor);

  const score = clamp(
    0.45 * averageNeighborRisk +
      0.25 * highRiskNeighborRatio +
      0.15 * predictedIllicitNeighborRatio +
      0.1 * input.timeStepRiskFactor +
      0.05 * growth
  );
  const level = riskLevel(score);

  const explanation = [
    `Average neighbour GraphSAGE risk across ${n} target${n === 1 ? "" : "s"} is ${(averageNeighborRisk * 100).toFixed(0)}%.`,
    `${highRisk} connected target${highRisk === 1 ? " is" : "s are"} high-risk.`,
    `${input.illicitLabeledNeighbors} connected target(s) are known illicit-labeled.`,
    `${input.unknownNeighbors} connected target(s) are unlabeled (unknown — not confirmed safe).`,
  ];
  if (input.disagreeingNeighbors > 0)
    explanation.push(`${input.disagreeingNeighbors} target(s) show baseline/GraphSAGE disagreement nearby — may need review.`);
  explanation.push(`Resulting simulated risk is ${level} (${(score * 100).toFixed(0)}%).`);
  explanation.push(SIMULATION_DISCLAIMER);

  return { simulatedRiskScore: Number(score.toFixed(4)), riskLevel: level, explanation, disclaimer: SIMULATION_DISCLAIMER };
}
