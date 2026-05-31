import { SuspiciousNode } from "@/lib/types/metrics";
import { readJsonFile } from "./readJsonFile";

interface RawNode {
  id: string;
  classLabel: SuspiciousNode["trueLabel"];
  trueLabel?: SuspiciousNode["trueLabel"];
  riskLevel: SuspiciousNode["riskLevel"];
  timeStep: number;
  fraudProbability: number;
  baselineProbability?: number;
  gnnProbability?: number | null;
}

// Top suspicious transactions ranked by GraphSAGE probability (falls back to
// the primary fraudProbability when a GNN score is absent).
export async function getSuspiciousTransactions(limit = 15): Promise<SuspiciousNode[]> {
  const nodes = await readJsonFile<RawNode[]>("nodes.json");
  const score = (n: RawNode) => (n.gnnProbability ?? n.fraudProbability ?? 0);
  return [...nodes]
    .sort((a, b) => score(b) - score(a))
    .slice(0, limit)
    .map((n) => ({
      nodeId: n.id,
      fraudProbability: n.fraudProbability,
      riskLevel: n.riskLevel,
      trueLabel: n.trueLabel ?? n.classLabel,
      timeStep: n.timeStep,
      baselineProbability: n.baselineProbability,
      gnnProbability: n.gnnProbability ?? undefined,
    }));
}
