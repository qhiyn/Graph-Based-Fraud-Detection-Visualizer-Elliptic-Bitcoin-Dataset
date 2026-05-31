// Simulation mode types — heuristic transaction injection (client-side only).

import { RiskLevel } from "./graph";

export type AmountCategory = "low" | "medium" | "high";

export interface SimulatedNodeConfig {
  label?: string;
  timeStep?: number;
  amountGrowthFactor?: number; // 0–1
  degreeGrowthFactor?: number; // 0–1
}

export interface SimulationRequest {
  simulatedNode?: SimulatedNodeConfig;
  connectToNodeIds: string[];
}

export interface SimulationResult {
  simulatedNodeId: string;
  simulatedRiskScore: number; // 0–1
  riskLevel: RiskLevel;
  connectedNodeIds: string[];
  affectedNodeIds: string[];
  explanation: string[];
  disclaimer: string;
}

// Held only in client state — never written to public/data or API state.
export interface SimulatedNode {
  id: string;
  label: string;
  riskLevel: RiskLevel;
  fraudProbability: number;
  isSimulated: true;
}

export interface SimulatedEdge {
  id: string;
  source: string;
  target: string;
  isSimulated: true;
}

export interface ClientSimulation {
  node: SimulatedNode;
  edges: SimulatedEdge[];
  result: SimulationResult;
}
