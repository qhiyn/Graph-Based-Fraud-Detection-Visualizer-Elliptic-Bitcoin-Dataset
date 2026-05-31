import type { ElementDefinition } from "cytoscape";
import { TransactionNode, TransactionEdge } from "@/lib/types/graph";
import { SimulatedNode, SimulatedEdge } from "@/lib/types/simulation";
import { getRiskColor } from "./getRiskColor";

export interface SimOverlay {
  node: SimulatedNode | null;
  edges: SimulatedEdge[];
  connectedIds: Set<string>;
  affectedIds: Set<string>;
}

// Convert domain nodes/edges into a flat Cytoscape element array, optionally
// overlaying a simulated node + edges and affected/target highlight flags.
export function buildCytoscapeElements(
  nodes: TransactionNode[],
  edges: TransactionEdge[],
  sim?: SimOverlay
): ElementDefinition[] {
  const connected = sim?.connectedIds ?? new Set<string>();
  const affected = sim?.affectedIds ?? new Set<string>();
  const nodeIds = new Set(nodes.map((n) => n.id));

  const nodeEls: ElementDefinition[] = nodes.map((n) => {
    const degree = n.degree ?? 0;
    return {
      data: {
        id: n.id,
        label: n.id.replace(/^tx_/, ""),
        kind: "real",
        riskLevel: n.riskLevel,
        trueLabel: n.trueLabel,
        knownLabel: String(n.knownLabel),
        color: getRiskColor(n.riskLevel),
        size: 18 + Math.min(degree, 12) * 2,
        target: connected.has(n.id) ? "1" : "0",
        affected: !connected.has(n.id) && affected.has(n.id) ? "1" : "0",
      },
    };
  });

  const edgeEls: ElementDefinition[] = edges.map((e) => ({
    data: { id: e.id, source: e.source, target: e.target, kind: "real" },
  }));

  if (sim?.node) {
    nodeEls.push({
      data: {
        id: sim.node.id,
        label: sim.node.label,
        kind: "simulated",
        riskLevel: sim.node.riskLevel,
        color: getRiskColor(sim.node.riskLevel),
        size: 30,
      },
    });
    // Only draw simulated edges whose target is actually rendered.
    for (const e of sim.edges) {
      if (nodeIds.has(e.target)) {
        edgeEls.push({ data: { id: e.id, source: e.source, target: e.target, kind: "simulated" } });
      }
    }
  }

  return [...nodeEls, ...edgeEls];
}
