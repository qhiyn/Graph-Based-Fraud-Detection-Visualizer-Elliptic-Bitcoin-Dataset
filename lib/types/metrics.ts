// Model evaluation metric types

export interface ModelMetrics {
  name: string;
  rocAuc: number;
  averagePrecision?: number;
  f1: number;
  precision: number;
  recall: number;
  precisionAtK?: {
    k50: number;
    k100: number;
    k500: number;
  };
  confusionMatrix?: {
    truePositive: number;
    falsePositive: number;
    trueNegative: number;
    falseNegative: number;
  };
}

export interface MetricsData {
  baseline: ModelMetrics;
  gnn: ModelMetrics;
  stage?: string;
  note?: string;
}

export interface SuspiciousNode {
  nodeId: string;
  fraudProbability: number;
  riskLevel: "low" | "medium" | "high";
  trueLabel: "licit" | "illicit" | "unknown";
  timeStep: number;
  baselineProbability?: number;
  gnnProbability?: number | null;
}

export interface RiskDistributionEntry {
  riskLevel: "low" | "medium" | "high";
  count: number;
  percentage: number;
}

export interface LabelDistributionEntry {
  label: "licit" | "illicit" | "unknown";
  count: number;
  percentage: number;
}
