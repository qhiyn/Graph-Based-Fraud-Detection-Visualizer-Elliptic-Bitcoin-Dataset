// Shared API response envelope

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    message: string;
    code: string;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// Node detail response (extended with explanation)
export interface NodeDetailData {
  id: string;
  trueLabel: "licit" | "illicit" | "unknown";
  predictedLabel: "licit" | "illicit";
  fraudProbability: number;
  riskLevel: "low" | "medium" | "high";
  timeStep: number;
  degree: number;
  inDegree: number;
  outDegree: number;
  knownLabel: boolean;
  explanation: string[];
  baselineProbability?: number;
  gnnProbability?: number;
}
