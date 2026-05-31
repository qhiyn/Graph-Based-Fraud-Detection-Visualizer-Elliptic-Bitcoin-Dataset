import {
  TransactionNode,
  TransactionEdge,
  RiskLevel,
  TransactionLabel,
} from "@/lib/types/graph";

export interface DashboardFilters {
  riskLevels: RiskLevel[]; // node passes if its risk is included
  classLabels: TransactionLabel[]; // node passes if its true label is included
  minFraudProbability: number; // 0–1
  timeStep: number | null; // null = all time steps
}

export const ALL_RISK_LEVELS: RiskLevel[] = ["low", "medium", "high"];
export const ALL_CLASS_LABELS: TransactionLabel[] = ["licit", "illicit", "unknown"];

export const DEFAULT_FILTERS: DashboardFilters = {
  riskLevels: [...ALL_RISK_LEVELS],
  classLabels: [...ALL_CLASS_LABELS],
  minFraudProbability: 0,
  timeStep: null,
};

export function normalizeDashboardFilters(
  filters?: Partial<DashboardFilters> | null
): DashboardFilters {
  return {
    ...DEFAULT_FILTERS,
    ...filters,
    riskLevels: Array.isArray(filters?.riskLevels)
      ? filters.riskLevels.filter((value): value is RiskLevel => ALL_RISK_LEVELS.includes(value))
      : DEFAULT_FILTERS.riskLevels,
    classLabels: Array.isArray(filters?.classLabels)
      ? filters.classLabels.filter((value): value is TransactionLabel => ALL_CLASS_LABELS.includes(value))
      : DEFAULT_FILTERS.classLabels,
    minFraudProbability:
      typeof filters?.minFraudProbability === "number" &&
      Number.isFinite(filters.minFraudProbability)
        ? filters.minFraudProbability
        : DEFAULT_FILTERS.minFraudProbability,
    timeStep:
      typeof filters?.timeStep === "number" && Number.isFinite(filters.timeStep)
        ? filters.timeStep
        : DEFAULT_FILTERS.timeStep,
  };
}

// Apply filters to nodes, then drop edges that lost an endpoint.
export function filterGraph(
  nodes: TransactionNode[],
  edges: TransactionEdge[],
  filters: DashboardFilters
): { nodes: TransactionNode[]; edges: TransactionEdge[] } {
  const normalizedFilters = normalizeDashboardFilters(filters);

  const filteredNodes = nodes.filter(
    (n) =>
      normalizedFilters.riskLevels.includes(n.riskLevel) &&
      normalizedFilters.classLabels.includes(n.trueLabel) &&
      n.fraudProbability >= normalizedFilters.minFraudProbability &&
      (normalizedFilters.timeStep === null || n.timeStep === normalizedFilters.timeStep)
  );

  const kept = new Set(filteredNodes.map((n) => n.id));
  const filteredEdges = edges.filter(
    (e) => kept.has(e.source) && kept.has(e.target)
  );

  return { nodes: filteredNodes, edges: filteredEdges };
}
