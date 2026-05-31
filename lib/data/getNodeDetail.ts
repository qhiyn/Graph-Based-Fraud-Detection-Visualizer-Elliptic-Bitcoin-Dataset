import { NodeDetailData } from "@/lib/types/api";
import { NodeExplanation } from "@/lib/types/graph";
import { readJsonFile } from "./readJsonFile";

interface RawNode {
  id: string;
  classLabel: NodeDetailData["trueLabel"];
  trueLabel?: NodeDetailData["trueLabel"];
  predictedLabel?: NodeDetailData["predictedLabel"];
  fraudProbability: number;
  riskLevel: NodeDetailData["riskLevel"];
  timeStep: number;
  degree?: number;
  inDegree?: number;
  outDegree?: number;
  knownLabel: boolean;
  baselineProbability?: number;
  gnnProbability?: number | null;
}

export async function getNodeDetail(id: string): Promise<NodeDetailData | null> {
  const [nodes, explanations] = await Promise.all([
    readJsonFile<RawNode[]>("nodes.json"),
    readJsonFile<NodeExplanation[]>("explanations.json"),
  ]);
  const raw = nodes.find((n) => n.id === id);
  if (!raw) return null;
  const explanation = explanations.find((e) => e.nodeId === id)?.bullets ?? [];

  return {
    id: raw.id,
    trueLabel: raw.trueLabel ?? raw.classLabel,
    predictedLabel: raw.predictedLabel ?? "licit",
    fraudProbability: raw.fraudProbability,
    riskLevel: raw.riskLevel,
    timeStep: raw.timeStep,
    degree: raw.degree ?? 0,
    inDegree: raw.inDegree ?? 0,
    outDegree: raw.outDegree ?? 0,
    knownLabel: raw.knownLabel,
    explanation,
    baselineProbability: raw.baselineProbability,
    gnnProbability: raw.gnnProbability ?? undefined,
  };
}
