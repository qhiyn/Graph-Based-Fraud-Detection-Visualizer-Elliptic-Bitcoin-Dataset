"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FlaskConical } from "lucide-react";
import { TransactionNode } from "@/lib/types/graph";
import { ApiResponse } from "@/lib/types/api";
import { ClientSimulation, SimulationResult } from "@/lib/types/simulation";
import { ConnectionSelector } from "./ConnectionSelector";
import { TransactionInjectionForm, InjectionFormValues } from "./TransactionInjectionForm";
import { SimulationResultCard } from "./SimulationResultCard";

interface SimulationPanelProps {
  nodes: TransactionNode[];
  timeSteps: number[];
  selectedNodeId: string | null;
  visibleHighRiskIds: string[];
  suspiciousIds: string[];
  onSimulationChange: (sim: ClientSimulation | null) => void;
  onFocus: () => void;
}

const score = (n?: TransactionNode) => (n ? n.gnnProbability ?? n.fraudProbability : 0);

export function SimulationPanel({
  nodes, timeSteps, selectedNodeId, visibleHighRiskIds, suspiciousIds, onSimulationChange, onFocus,
}: SimulationPanelProps) {
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const [targets, setTargets] = useState<string[]>([]);
  const [form, setForm] = useState<InjectionFormValues>({ label: "", timeStep: null, amountGrowthFactor: 0.5, degreeGrowthFactor: 0.5 });
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const addAll = (ids: string[]) => setTargets((t) => Array.from(new Set([...t, ...ids])));

  const stats = useMemo(() => {
    const ns = targets.map((id) => byId.get(id)).filter(Boolean) as TransactionNode[];
    const avgRisk = ns.length ? ns.reduce((a, n) => a + score(n), 0) / ns.length : 0;
    return {
      avgRisk,
      highRisk: ns.filter((n) => n.riskLevel === "high").length,
      unknown: ns.filter((n) => n.trueLabel === "unknown").length,
    };
  }, [targets, byId]);

  const clearAll = () => {
    setTargets([]);
    setResult(null);
    setError(null);
    onSimulationChange(null);
  };

  const run = async () => {
    setRunning(true); setError(null);
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          simulatedNode: { label: form.label || undefined, timeStep: form.timeStep ?? undefined, amountGrowthFactor: form.amountGrowthFactor, degreeGrowthFactor: form.degreeGrowthFactor },
          connectToNodeIds: targets,
        }),
      });
      const body = (await res.json()) as ApiResponse<SimulationResult>;
      if (!body.success) throw new Error(body.error.message);
      const r = body.data;
      setResult(r);
      onSimulationChange({
        node: { id: r.simulatedNodeId, label: form.label || "Simulated tx", riskLevel: r.riskLevel, fraudProbability: r.simulatedRiskScore, isSimulated: true },
        edges: r.connectedNodeIds.map((t) => ({ id: `sim_edge_${t}`, source: r.simulatedNodeId, target: t, isSimulated: true })),
        result: r,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Simulation failed.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <FlaskConical className="h-4 w-4" />
          Simulation Mode
          <Badge variant="outline" className="text-xs ml-auto">What-if · heuristic</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        <p className="text-muted-foreground">
          Inject a hypothetical transaction connected to selected transactions. The score is a
          heuristic over neighbour risk — it does <strong>not</strong> retrain GraphSAGE.
        </p>

        <ConnectionSelector
          targets={targets}
          stats={stats}
          canAddSelected={Boolean(selectedNodeId) && !targets.includes(selectedNodeId ?? "")}
          canAddHighRisk={visibleHighRiskIds.length > 0}
          canAddSuspicious={suspiciousIds.length > 0}
          onAddSelected={() => selectedNodeId && addAll([selectedNodeId])}
          onAddHighRisk={() => addAll(visibleHighRiskIds.slice(0, 8))}
          onAddSuspicious={() => addAll(suspiciousIds.slice(0, 8))}
          onRemove={(id) => setTargets((t) => t.filter((x) => x !== id))}
          onClear={clearAll}
        />

        <TransactionInjectionForm
          values={form}
          onChange={setForm}
          timeSteps={timeSteps}
          running={running}
          canRun={targets.length > 0}
          hasResult={Boolean(result)}
          onRun={run}
          onClear={clearAll}
          onFocus={onFocus}
        />

        {error && <p className="text-xs text-amber-500">{error}</p>}
        {result && <SimulationResultCard result={result} />}
      </CardContent>
    </Card>
  );
}
