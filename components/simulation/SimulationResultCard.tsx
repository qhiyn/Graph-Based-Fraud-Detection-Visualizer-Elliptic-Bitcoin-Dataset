"use client";

import { Badge } from "@/components/ui/badge";
import { SimulationResult } from "@/lib/types/simulation";

const RISK_BADGE: Record<string, "destructive" | "outline" | "secondary"> = {
  high: "destructive",
  medium: "outline",
  low: "secondary",
};

export function SimulationResultCard({ result }: { result: SimulationResult }) {
  return (
    <div className="border border-purple-400/40 rounded-md p-2 bg-purple-500/5 space-y-1.5">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Simulated risk score</span>
        <span className="font-medium">{(result.simulatedRiskScore * 100).toFixed(0)}%</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-muted-foreground">Risk level</span>
        <Badge variant={RISK_BADGE[result.riskLevel]} className="text-xs">{result.riskLevel}</Badge>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Connected / affected</span>
        <span className="font-medium">{result.connectedNodeIds.length} / {result.affectedNodeIds.length}</span>
      </div>
      <ul className="text-muted-foreground/80 space-y-0.5 pt-1">
        {result.explanation.map((b, i) => <li key={i}>• {b}</li>)}
      </ul>
    </div>
  );
}
