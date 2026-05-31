"use client";

import { useMemo, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { MetricCard } from "@/components/metrics/MetricCard";
import { ModelComparisonCard } from "@/components/metrics/ModelComparisonCard";
import { RiskDistributionChart } from "@/components/metrics/RiskDistributionChart";
import { ClusterSummaryCard } from "@/components/metrics/ClusterSummaryCard";
import { FraudGraph } from "@/components/graph/FraudGraph";
import { GraphErrorBoundary } from "@/components/graph/GraphErrorBoundary";
import { GraphFilters } from "@/components/graph/GraphFilters";
import { GraphLegend } from "@/components/graph/GraphLegend";
import { GraphToolbar } from "@/components/graph/GraphToolbar";
import { NodeDetailPanel } from "@/components/graph/NodeDetailPanel";
import { SimulationPanel } from "@/components/simulation/SimulationPanel";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Network, Activity, Clock, Loader2, AlertTriangle } from "lucide-react";

import { useGraphData } from "@/lib/data/useGraphData";
import { useMetrics } from "@/lib/data/useMetrics";
import { useNodeDetail } from "@/lib/data/useNodeDetail";
import { useSuspiciousTransactions } from "@/lib/data/useSuspiciousTransactions";
import { buildCytoscapeElements } from "@/lib/graph/buildCytoscapeElements";
import {
  DashboardFilters,
  DEFAULT_FILTERS,
  normalizeDashboardFilters,
} from "@/lib/graph/filterGraph";
import { buildGraphView, GraphViewMode } from "@/lib/graph/buildGraphView";
import { getNeighborhoodSummary } from "@/lib/graph/getNeighborhoodSummary";
import { getDisagreement } from "@/lib/graph/getDisagreement";
import { ClientSimulation } from "@/lib/types/simulation";

const LABEL_VARIANT: Record<string, "destructive" | "secondary" | "outline"> = {
  illicit: "destructive",
  licit: "secondary",
  unknown: "outline",
};
const pct = (v?: number | null) => (v == null ? "—" : `${(v * 100).toFixed(0)}%`);

export default function DashboardPage() {
  const graphQuery = useGraphData();
  const metricsQuery = useMetrics();
  const suspiciousQuery = useSuspiciousTransactions(12);

  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [mode, setMode] = useState<GraphViewMode>("all");
  const [hop, setHop] = useState<1 | 2>(1);
  const [viewTimeStep, setViewTimeStep] = useState<number | null>(null);
  const [simulation, setSimulation] = useState<ClientSimulation | null>(null);

  const normalizedFilters = useMemo(() => normalizeDashboardFilters(filters), [filters]);

  const isSimSelected = Boolean(simulation && selectedNodeId === simulation.node.id);
  const nodeDetailQuery = useNodeDetail(isSimSelected ? null : selectedNodeId);

  const nodes = useMemo(() => graphQuery.data?.nodes ?? [], [graphQuery.data]);
  const edges = useMemo(() => graphQuery.data?.edges ?? [], [graphQuery.data]);
  const metrics = metricsQuery.data;

  const timeSteps = useMemo(
    () => Array.from(new Set(nodes.map((n) => n.timeStep).filter((t): t is number => t !== undefined))).sort((a, b) => a - b),
    [nodes]
  );

  const simIds = useMemo(
    () => (simulation ? new Set<string>([...simulation.result.connectedNodeIds, ...simulation.result.affectedNodeIds]) : undefined),
    [simulation]
  );

  const view = useMemo(
    () =>
      buildGraphView(nodes, edges, {
        mode,
        filters: normalizedFilters,
        selectedNodeId,
        hop,
        timeStep: viewTimeStep,
        simulationIds: simIds,
      }),
    [nodes, edges, mode, normalizedFilters, selectedNodeId, hop, viewTimeStep, simIds]
  );

  const elements = useMemo(() => {
    const sim = simulation
      ? {
          node: simulation.node,
          edges: simulation.edges,
          connectedIds: new Set(simulation.result.connectedNodeIds),
          affectedIds: new Set(simulation.result.affectedNodeIds),
        }
      : undefined;
    return buildCytoscapeElements(view.nodes, view.edges, sim);
  }, [view, simulation]);

  const neighborhood = useMemo(
    () => (selectedNodeId && !isSimSelected ? getNeighborhoodSummary(selectedNodeId, nodes, edges) : null),
    [selectedNodeId, isSimSelected, nodes, edges]
  );
  const visibleHighRiskIds = useMemo(() => view.nodes.filter((n) => n.riskLevel === "high").map((n) => n.id), [view]);
  const suspiciousIds = useMemo(() => suspiciousQuery.data?.map((s) => s.nodeId) ?? [], [suspiciousQuery.data]);

  const riskDist = useMemo(() => {
    const c = { low: 0, medium: 0, high: 0 };
    nodes.forEach((n) => c[n.riskLevel]++);
    return [
      { riskLevel: "low", count: c.low },
      { riskLevel: "medium", count: c.medium },
      { riskLevel: "high", count: c.high },
    ];
  }, [nodes]);

  const summary = useMemo(() => {
    const s = { illicit: 0, licit: 0, unknown: 0, high: 0 };
    nodes.forEach((n) => {
      s[n.trueLabel]++;
      if (n.riskLevel === "high") s.high++;
    });
    return s;
  }, [nodes]);

  const onSimulationChange = (sim: ClientSimulation | null) => {
    setSimulation(sim);
    if (!sim && selectedNodeId?.startsWith("sim_")) setSelectedNodeId(null);
    if (!sim && mode === "simulated-region") setMode("all");
    setFilters((current) => normalizeDashboardFilters(current));
  };

  const onReset = () => {
    setMode("all");
    setHop(1);
    setViewTimeStep(null);
    setFilters((current) => normalizeDashboardFilters(current));
  };

  if (graphQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex flex-col items-center justify-center py-40 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mb-3" /><p className="text-sm">Loading transaction graph…</p>
        </div>
      </div>
    );
  }
  if (graphQuery.error) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex flex-col items-center justify-center py-40 text-muted-foreground">
          <AlertTriangle className="h-6 w-6 text-amber-500 mb-3" />
          <p className="text-sm font-medium text-foreground">Could not load dashboard data</p>
          <p className="text-xs mt-1">{(graphQuery.error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-screen-2xl mx-auto px-4 py-6 space-y-6">

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard title="Total Transactions" value={nodes.length} subtitle="Graph sample" icon={Network} />
          <MetricCard title="High-Risk Nodes" value={summary.high} subtitle="GraphSAGE prob ≥ 0.75" icon={ShieldAlert} />
          <MetricCard title="GNN ROC-AUC" value={metrics && metrics.gnn.rocAuc > 0 ? metrics.gnn.rocAuc.toFixed(3) : "—"} subtitle={metrics?.gnn.name ?? "loading…"} icon={Activity} />
          <MetricCard title="Time Steps" value={timeSteps.length} subtitle="In this sample" icon={Clock} />
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-3 space-y-4">
            <GraphFilters filters={normalizedFilters} onChange={setFilters} timeSteps={timeSteps} />
            <ClusterSummaryCard
              totalNodes={nodes.length}
              illicitCount={summary.illicit}
              licitCount={summary.licit}
              unknownCount={summary.unknown}
              highRiskCount={summary.high}
            />
          </div>

          <div className="col-span-12 md:col-span-6 space-y-2">
            <GraphToolbar
              mode={mode}
              onModeChange={setMode}
              hop={hop}
              onHopChange={setHop}
              timeStep={viewTimeStep}
              onTimeStepChange={(t) => { setViewTimeStep(t); setMode("selected-time-step"); }}
              timeSteps={timeSteps}
              selectedNodeId={selectedNodeId}
              visibleNodes={view.nodes.length}
              visibleEdges={view.edges.length}
              truncated={view.truncated}
              onReset={onReset}
            />
            <div className="h-[420px]">
              <GraphErrorBoundary>
                <FraudGraph elements={elements} selectedNodeId={selectedNodeId} onNodeSelect={setSelectedNodeId} emptyNote={view.note} />
              </GraphErrorBoundary>
            </div>
            {view.note && <p className="text-xs text-amber-500">{view.note}</p>}
            <GraphLegend />
          </div>

          <div className="col-span-12 md:col-span-3">
            <NodeDetailPanel
              detail={nodeDetailQuery.data ?? null}
              loading={Boolean(selectedNodeId) && !isSimSelected && nodeDetailQuery.isLoading}
              neighborhood={neighborhood}
              simulated={isSimSelected ? simulation : null}
            />
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-5">
            {metrics ? (
              <ModelComparisonCard baseline={metrics.baseline} gnn={metrics.gnn} note={metrics.note} />
            ) : (
              <div className="h-40 flex items-center justify-center text-xs text-muted-foreground border border-border rounded-md">
                {metricsQuery.error ? "Metrics unavailable" : "Loading metrics…"}
              </div>
            )}
          </div>
          <div className="col-span-12 md:col-span-3">
            <RiskDistributionChart data={riskDist} />
          </div>
          <div className="col-span-12 md:col-span-4">
            <SimulationPanel
              nodes={nodes}
              timeSteps={timeSteps}
              selectedNodeId={selectedNodeId}
              visibleHighRiskIds={visibleHighRiskIds}
              suspiciousIds={suspiciousIds}
              onSimulationChange={onSimulationChange}
              onFocus={() => setMode("simulated-region")}
            />
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold mb-3">Top Suspicious Transactions (ranked by GraphSAGE)</h2>
          <div className="rounded-md border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Transaction ID</TableHead>
                  <TableHead className="text-xs">GraphSAGE</TableHead>
                  <TableHead className="text-xs">Baseline</TableHead>
                  <TableHead className="text-xs">Risk</TableHead>
                  <TableHead className="text-xs">True Label</TableHead>
                  <TableHead className="text-xs">Step</TableHead>
                  <TableHead className="text-xs">Signal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suspiciousQuery.isLoading && (
                  <TableRow><TableCell colSpan={7} className="text-xs text-center text-muted-foreground py-6">Loading…</TableCell></TableRow>
                )}
                {suspiciousQuery.data?.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-xs text-center text-muted-foreground py-6">No suspicious transactions.</TableCell></TableRow>
                )}
                {suspiciousQuery.data?.map((row) => {
                  const dis = getDisagreement(row.baselineProbability, row.gnnProbability);
                  return (
                    <TableRow
                      key={row.nodeId}
                      className={`text-xs cursor-pointer ${selectedNodeId === row.nodeId ? "bg-muted/50" : ""}`}
                      onClick={() => setSelectedNodeId(row.nodeId)}
                    >
                      <TableCell className="font-mono">{row.nodeId}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 rounded-full bg-red-500" style={{ width: `${(row.gnnProbability ?? row.fraudProbability) * 50}px` }} />
                          {pct(row.gnnProbability ?? row.fraudProbability)}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{pct(row.baselineProbability)}</TableCell>
                      <TableCell>
                        <Badge variant={row.riskLevel === "high" ? "destructive" : row.riskLevel === "medium" ? "outline" : "secondary"} className="text-xs">
                          {row.riskLevel}
                        </Badge>
                      </TableCell>
                      <TableCell><Badge variant={LABEL_VARIANT[row.trueLabel]} className="text-xs">{row.trueLabel}</Badge></TableCell>
                      <TableCell>{row.timeStep}</TableCell>
                      <TableCell>{dis.disagree && <Badge variant="outline" className="text-xs border-purple-400 text-purple-500">review</Badge>}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

      </main>
    </div>
  );
}
