import { TransactionNode, TransactionEdge } from "@/lib/types/graph";
import { filterGraph, DashboardFilters } from "./filterGraph";
import { getNodeNeighborhood } from "./getNodeNeighborhood";

export type GraphViewMode =
  | "all"
  | "high-risk"
  | "selected-node-neighborhood"
  | "selected-time-step"
  | "suspicious-region"
  | "simulated-region";

export const MAX_VIEW_NODES = 600;
const SUSPICIOUS_SEEDS = 20;

interface ViewOptions {
  mode: GraphViewMode;
  filters: DashboardFilters;
  selectedNodeId: string | null;
  hop: 1 | 2;
  timeStep: number | null;
  simulationIds?: Set<string>; // connected + affected node ids for simulated-region
}

export interface GraphView {
  nodes: TransactionNode[];
  edges: TransactionEdge[];
  truncated: boolean;
  note: string | null; // contextual empty/edge-case message
}

const score = (n: TransactionNode) => n.gnnProbability ?? n.fraudProbability ?? 0;

// Keep only edges whose endpoints are both present.
function subset(nodes: TransactionNode[], edges: TransactionEdge[], ids: Set<string>) {
  const keptNodes = nodes.filter((n) => ids.has(n.id));
  const keptEdges = edges.filter((e) => ids.has(e.source) && ids.has(e.target));
  return { nodes: keptNodes, edges: keptEdges };
}

// Cap node count for readability, always keeping `mustKeep`, then highest-risk.
function cap(nodes: TransactionNode[], edges: TransactionEdge[], mustKeep: Set<string>) {
  if (nodes.length <= MAX_VIEW_NODES) return { nodes, edges, truncated: false };
  const ranked = [...nodes].sort((a, b) => {
    const am = mustKeep.has(a.id) ? 1 : 0;
    const bm = mustKeep.has(b.id) ? 1 : 0;
    return bm - am || score(b) - score(a);
  });
  const keep = new Set(ranked.slice(0, MAX_VIEW_NODES).map((n) => n.id));
  return { ...subset(nodes, edges, keep), truncated: true };
}

export function buildGraphView(
  allNodes: TransactionNode[],
  allEdges: TransactionEdge[],
  opts: ViewOptions
): GraphView {
  const { mode, filters, selectedNodeId, hop, timeStep, simulationIds } = opts;

  if (mode === "simulated-region") {
    if (!simulationIds || simulationIds.size === 0) {
      return { nodes: [], edges: [], truncated: false, note: "Run a simulation to focus its neighborhood." };
    }
    const { nodes, edges } = subset(allNodes, allEdges, simulationIds);
    const capped = cap(nodes, edges, new Set());
    return { ...capped, note: capped.truncated ? `Simulated region capped at ${MAX_VIEW_NODES} nodes.` : null };
  }

  if (mode === "all" || mode === "high-risk") {
    const f = filterGraph(allNodes, allEdges, filters);
    const nodes = mode === "high-risk" ? f.nodes.filter((n) => n.riskLevel === "high") : f.nodes;
    const ids = new Set(nodes.map((n) => n.id));
    const capped = cap(nodes, f.edges.filter((e) => ids.has(e.source) && ids.has(e.target)), new Set());
    return {
      ...capped,
      note: nodes.length === 0
        ? mode === "high-risk" ? "No high-risk transactions in the current filters." : "No transactions match the filters."
        : capped.truncated ? `Showing ${MAX_VIEW_NODES} of ${nodes.length} for readability.` : null,
    };
  }

  if (mode === "selected-node-neighborhood") {
    if (!selectedNodeId) return { nodes: [], edges: [], truncated: false, note: "Select a node to focus its neighborhood." };
    const ids = getNodeNeighborhood(selectedNodeId, allEdges, hop);
    const { nodes, edges } = subset(allNodes, allEdges, ids);
    const capped = cap(nodes, edges, new Set([selectedNodeId]));
    return { ...capped, note: capped.truncated ? `Neighborhood capped at ${MAX_VIEW_NODES} nodes.` : null };
  }

  if (mode === "selected-time-step") {
    if (timeStep == null) return { nodes: [], edges: [], truncated: false, note: "Choose a time step to focus." };
    const ids = new Set(allNodes.filter((n) => n.timeStep === timeStep).map((n) => n.id));
    const { nodes, edges } = subset(allNodes, allEdges, ids);
    const capped = cap(nodes, edges, new Set());
    return {
      ...capped,
      note: nodes.length === 0 ? `No transactions in time step ${timeStep}.` : capped.truncated ? `Time step capped at ${MAX_VIEW_NODES} nodes.` : null,
    };
  }

  // suspicious-region: top-N by GraphSAGE prob + their 1-hop neighbours
  const seeds = [...allNodes].sort((a, b) => score(b) - score(a)).slice(0, SUSPICIOUS_SEEDS).map((n) => n.id);
  if (seeds.length === 0) return { nodes: [], edges: [], truncated: false, note: "No suspicious transactions available." };
  const ids = new Set<string>(seeds);
  for (const s of seeds) for (const n of getNodeNeighborhood(s, allEdges, 1)) ids.add(n);
  const { nodes, edges } = subset(allNodes, allEdges, ids);
  const capped = cap(nodes, edges, new Set(seeds));
  return { ...capped, note: capped.truncated ? `Suspicious region capped at ${MAX_VIEW_NODES} nodes.` : null };
}
