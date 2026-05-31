import { TransactionNode, TransactionEdge, GraphData } from "@/lib/types/graph";
import { readJsonFile } from "./readJsonFile";

// Raw node as stored in public/data/nodes.json (has both classLabel + trueLabel).
interface RawNode {
  id: string;
  label: string;
  timeStep: number;
  classLabel: TransactionNode["trueLabel"];
  trueLabel?: TransactionNode["trueLabel"];
  predictedLabel?: TransactionNode["predictedLabel"];
  fraudProbability: number;
  riskLevel: TransactionNode["riskLevel"];
  knownLabel: boolean;
  baselineProbability?: number;
  gnnProbability?: number | null;
  degree?: number;
  inDegree?: number;
  outDegree?: number;
  featureSummary?: TransactionNode["featureSummary"];
}

export function normalizeNode(raw: RawNode): TransactionNode {
  return {
    id: raw.id,
    label: raw.label,
    trueLabel: raw.trueLabel ?? raw.classLabel,
    predictedLabel: raw.predictedLabel,
    riskLevel: raw.riskLevel,
    fraudProbability: raw.fraudProbability,
    timeStep: raw.timeStep,
    degree: raw.degree,
    inDegree: raw.inDegree,
    outDegree: raw.outDegree,
    knownLabel: raw.knownLabel,
    baselineProbability: raw.baselineProbability,
    gnnProbability: raw.gnnProbability ?? undefined,
    featureSummary: raw.featureSummary,
  };
}

export async function getGraphData(): Promise<GraphData> {
  const [rawNodes, edges] = await Promise.all([
    readJsonFile<RawNode[]>("nodes.json"),
    readJsonFile<TransactionEdge[]>("edges.json"),
  ]);
  const nodes = rawNodes.map(normalizeNode);
  return {
    nodes,
    edges,
    metadata: { sampleName: "top_suspicious_graphsage", nodeCount: nodes.length, edgeCount: edges.length },
  };
}
