// Core domain types for the Elliptic Bitcoin transaction graph

export type TransactionLabel = "licit" | "illicit" | "unknown";
export type RiskLevel = "low" | "medium" | "high";
export type PredictionLabel = "licit" | "illicit";

export interface FeatureSummary {
  numFeatures: number;
  localMean: number;
  aggregatedMean: number;
}

export interface TransactionNode {
  id: string;
  label: string; // display label e.g. "Transaction 12345"
  trueLabel: TransactionLabel;
  predictedLabel?: PredictionLabel;
  riskLevel: RiskLevel;
  fraudProbability: number; // 0–1
  timeStep?: number;
  degree?: number;
  inDegree?: number;
  outDegree?: number;
  knownLabel: boolean;
  baselineProbability?: number;
  gnnProbability?: number;
  featureSummary?: FeatureSummary;
}

export interface TransactionEdge {
  id: string;
  source: string;
  target: string;
  type: "transaction_flow";
  directed: boolean;
}

export interface GraphData {
  nodes: TransactionNode[];
  edges: TransactionEdge[];
  metadata: {
    sampleName: string;
    nodeCount: number;
    edgeCount: number;
  };
}

export interface GraphFilters {
  riskLevels: RiskLevel[];
  trueLabels: TransactionLabel[];
  predictedLabels: PredictionLabel[];
  minFraudProbability: number;
  maxFraudProbability: number;
  timeStep: number | null;
  neighborhoodDepth: 1 | 2;
  showOnlySuspicious: boolean;
}

export interface NodeExplanation {
  nodeId: string;
  bullets: string[];
}
