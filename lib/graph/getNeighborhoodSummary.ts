import { TransactionNode, TransactionEdge } from "@/lib/types/graph";
import { getNodeNeighborhood } from "./getNodeNeighborhood";

export interface NeighborhoodSummary {
  oneHop: number;
  twoHop: number;
  highRisk: number; // among 1-hop neighbours
  illicit: number; // known illicit, among 1-hop
  unknown: number; // unknown label, among 1-hop
}

// Summarize the local structure around a node (using the visible graph data).
export function getNeighborhoodSummary(
  nodeId: string,
  nodes: TransactionNode[],
  edges: TransactionEdge[]
): NeighborhoodSummary {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const oneHopIds = getNodeNeighborhood(nodeId, edges, 1);
  oneHopIds.delete(nodeId);
  const twoHopIds = getNodeNeighborhood(nodeId, edges, 2);
  twoHopIds.delete(nodeId);

  let highRisk = 0, illicit = 0, unknown = 0;
  for (const id of oneHopIds) {
    const n = byId.get(id);
    if (!n) continue;
    if (n.riskLevel === "high") highRisk++;
    if (n.trueLabel === "illicit") illicit++;
    if (n.trueLabel === "unknown") unknown++;
  }
  return { oneHop: oneHopIds.size, twoHop: twoHopIds.size, highRisk, illicit, unknown };
}
