import { TransactionEdge } from "@/lib/types/graph";

// Return the set of node ids within `depth` hops of `nodeId` (undirected
// traversal), including the node itself. Used by the neighborhood explorer.
export function getNodeNeighborhood(
  nodeId: string,
  edges: TransactionEdge[],
  depth: 1 | 2 = 1
): Set<string> {
  const adjacency = new Map<string, Set<string>>();
  const add = (a: string, b: string) => {
    if (!adjacency.has(a)) adjacency.set(a, new Set());
    adjacency.get(a)!.add(b);
  };
  for (const e of edges) {
    add(e.source, e.target);
    add(e.target, e.source);
  }

  const result = new Set<string>([nodeId]);
  let frontier = new Set<string>([nodeId]);
  for (let d = 0; d < depth; d++) {
    const next = new Set<string>();
    for (const id of frontier) {
      for (const neighbor of adjacency.get(id) ?? []) {
        if (!result.has(neighbor)) {
          result.add(neighbor);
          next.add(neighbor);
        }
      }
    }
    frontier = next;
  }
  return result;
}
